<?php

/**
	
	This file keeps track of the user session, which in turns is tracked by PHP as a 32 Byte
	string which is stored on the user's computer as a cookie.
	
	UserSession extends baseAdmin. The base class is used for managing the session table.
	The session table mearly syncs up the user name (gathered by calling NT) and the
	session variable.
	
	This class essentially works with the user object class and passes the user_id to the
	user object functions.
	
*/
require_once('class.userContainer.php');
require_once('class.systemAccess.php');

class userSession extends baseAdmin
{
	private $php_session_id = 0;				//	This is the big long 32 character string PHP creates
    private $session_id = 0;					//	This is the database session id
    private $logged_in = false;					//	Flag for whether the user is connected with a name.
   												//	Could use the user_id < -1 
   	private $session_timeout = 600; 			// 10 minute inactivity timeout
    private $session_lifespan = 1000000;		// 1 hour session duration
    private $user_name = "";					//	The user's logged in name
	private $user_id = 0;						//	The user's logged in name
	
	//--------------------------------------------------------------------------
	/**
		\brief
			This function builds the connection to the database
			and then sets up the session information.
			Without it, we don't get the user name set
	*/
	//--------------------------------------------------------------------------
	function __construct()
	{
		baseAdmin::__construct();
		$user = cUserContainer::GetInstance();
		
		/*
			Set up the basic administrative stuff
		*/
		$this->table_Name = "tblUser_Session";				//	the name of the table used for rights
		$this->field_Id = "session_ID";						//	the unique id for this right
		$this->field_Name = "session_php_id";				//	the not so user friendly name of this session
		$this->field_LastConnect = "session_last_connect";	//	The last connection time
		$this->field_Created = "session_created";			//	The date this connection was created
		$this->field_User = "user_ID";						//	The user id associated with this session
		
		$this->db = systemData::GetInstance();
		$this->session_id = -1;
		
		if(isset($_COOKIE["PHPSESSID"]))
		{
			/*
				Session info is already set, grab info from the server
				and fill the fields
			*/
			$this->php_session_id = $_COOKIE["PHPSESSID"];
			
			$session_id = $this->getID($this->php_session_id);
			
			$record = $this->Get($session_id);
			
			if($record)
			{
				$this->session_id = $record[$this->field_Id];
				$this->logged_in = true;
				$this->user_id = $record[$this->field_User];
				$this->user_name = $user->GetName($this->user_id);
			}
		}		
		/*
			If we found a session id we don't have to build a new record
		*/
		if($this->session_id < 0)
		{
			/*
				This a first time connection (no cookie) to the server
				so we build the session information and connect them
			*/
			
			session_set_cookie_params($this->session_lifespan);
			session_start();
			
			$this->php_session_id = session_id();
			
			if($this->GetID($this->php_session_id) < 0)
			{
				$this->CreateSession();
			}
			else
			{
				/*
					Identify that the user just connected to the system again
				*/
				$this->impress();
			}
		}
		else
		{
			$this->impress();
		}
			
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Echo all variables to the output stream
	*/
	//--------------------------------------------------------------------------
	function Dump()
	{
		echo "PHP Session : [$this->php_session_id]<br>";
		echo "Session Id  : [$this->session_id]<br>";
		echo "Logged in   : [$this->logged_in]<br>";
		echo "Session Time: [$this->session_timeout]<br>";
		echo "Session Life: [$this->session_lifespan]<br>";
    	echo "User Name   : [$this->user_name]<br>";
    	echo "User ID     : [$this->user_id]<br>";
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Touches the user's account, flagging them as having accessed the database
	*/
	//--------------------------------------------------------------------------
	function impress()
	{
		if ($this->logged_in)
		{
			$updateValues = array();
			$updateValues[$this->field_LastConnect] = Date("c");
			
			$filterValues = array();
			$filterValues[$this->field_Id] = $this->session_id;
			
			$this->db->update($this->table_Name, $updateValues, $filterValues);
			
			$oUserContainer = cUserContainer::GetInstance();
			$oUser = $oUserContainer->GetUser($this->user_id);
			
			if(isset($oUser))
			{
				$oUser->Touch();
			}
		}
	}
	/*
		GetUserId returns the logged in user's name
	*/
	function GetUserID()
	{
		return $this->user_id;	
	}
	/*
		IsLogged in returns true if the user's logged in
	*/
	function isLoggedIn()
	{
		return $this->logged_in;
	}
    /*
    	The purpose of the login function is to connect the user to the catena
    	system.
    	We have several things to make sure of:
    	
    	-	First, that the user is connecting as a valid account.
    	-	second, make sure the user name account matches what's
    		stored in the session information
    	-	make sure the user has a valid account
    		if not, build them a new account within the system
    */
    function Login($strUsername, $strPlainPassword)
	{
		$user = cUserContainer::GetInstance();
		
		/*
			all names must be lowercase
		*/

		$strUsername = strtolower($strUsername);
		
		$user_id = $user->GetID($strUsername);
		
		if($user_id == -1)
		{
			if(!$user->Add($strUsername))
			{
				return $this->results->Set('false', "Unable to add user: ". $user->results->GetMessage());
			}

			$user_id = $user->GetID($strUsername);
			
			if($user_id == -1)
			{
				return $this->results->Set('false', "Problem adding user. Invalid user id.");
			}
		}

		$this->ClearConnections($user_id, $this->php_session_id);
		$this->logged_in = true;
		$this->user_id = $user_id;
		$this->user_name = $strUsername;

		$updateValues = array();
		$updateValues['user_id'] = $this->user_id;
		
		$filterValues = array();
		$filterValues[$this->field_Id] = $this->session_id;
		$this->db->update($this->table_Name, $updateValues, $filterValues);
		
		$this->RemoveOldSessions();
		
		return $this->logged_in;
	}
	/*
		Clears all connections with this user id
		-	user_id			The user account id which we're clearing for
		-	php_session_id	If set to something other than "" we clear everything
							except that id	
	*/
	function ClearConnections($user_id, $php_session_id = "")
	{
		/*
			Before we connect the user to the database
			we need to clean up all connections to the server
			with this user.
		*/
		
		$sql = "DELETE FROM $this->table_Name WHERE
				user_id = $user_id AND php_session_id <> '$php_session_id'";
	
		$this->db->sql_delete($sql);
	}
	
	/*
		Create a new session record
	*/
	function CreateSession()
	{
		/*
			Build the record
		*/
		$arInsert = array();
		$arInsert[$this->field_Name] = $this->php_session_id;
		$arInsert[$this->field_LastConnect] = Date("c");
		$arInsert[$this->field_Created] = Date("c");
		$arInsert[$this->field_User] = 0;
	
		$this->db->insert($this->table_Name, $arInsert);
		
		$this->session_id = $this->GetID($this->php_session_id);
	}
	/*
		Retrieves the user's signed on name
	*/
	function GetLoginName()
	{
		if($this->isLoggedIn())
		{
			return $this->user_name;
		}
		
		return "";
	}
	/*
		-	This function determines if the user has a specified right.
			It's a wrapper for the user object has right function, but since
			it's used so much made the call to wrap the functionality.
		-	additionally, if the user is in the guest group then they
			have no rights by default, even if the user account
			has rights
	*/
	function HasRight($right_info, $org_info = -1)
	{
		$oSystemAccess = systemAccess::GetInstance();
		
		if($oSystemAccess->HasRight($this->user_id, $right_info, $org_info))
		{
			return $this->results->Set('true', $oSystemAccess->results->GetMessage());
		}
		else
		{
			return $this->results->Set('false', $oSystemAccess->results->GetMessage());
		}
	}
	/*
		Retrieves the users organization
	*/
	function GetOrganization()
	{
		$user = cUserContainer::GetInstance();
		
		return $user->GetOrganization($this->user_id);
	}
	function RemoveOldSessions()
	{
		$sql = "DELETE FROM tblUser_Session WHERE session_last_connect < (NOW() - INTERVAL 3 DAY);"; 
		
		$this->db->sql_delete($sql);
	}
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new userSession();
		}
		
		return $obj;
	}
}
/*
	Always create the session information here
*/
	$g_oUserSession = userSession::GetInstance();
?>