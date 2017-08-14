<?
	//require_once('../../../classes/include.php');
	require_once('class.messagePriority.php');
	require_once('class.db.php');
	

//--------------------------------------------------------------------------
/**
	\class messageBoard
	\brief Contains functionality to perform message board operations.
	This class allows adding, deleting, and modifying messages including
	validations. Also contains functionality to verify that the user is 
	permitted to edit or delete messages and functionality to flag viewed 
	messages for read tracking. 
*/
//--------------------------------------------------------------------------
class messageBoard extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblMessage";
		$this->field_Id = "msg_ID";
		$this->field_Name = "msg_subject";
		$this->field_Body = "msg_body";
		$this->field_Create_Date = "msg_create_date";
		$this->field_Poster = "user_ID";
		$this->field_Exp_Date = "msg_exp_date"; 
		$this->field_Org_ID = "org_ID";
		$this->field_Priority_ID = "msgPri_ID";
		
		/*--------------------------------------------------------------------------
			Now set up the rights to administrate messages. 
		----------------------------------------------------------------------------*/
		$oRights = rights::GetInstance();
		
		$this->rights_Add = $oRights->MSG_BOARD_Standard;
		$this->rights_Remove = $oRights->MSG_BOARD_Standard; 
		$this->rights_Modify = $oRights->MSG_BOARD_Standard;  
		
		$this->db = messageBoardData::GetInstance();
	}
	
	//--------------------------------------------------------------------------
	/**
		\brief Adds a message to the database
		\param strMessageSubject
				The user entered message subject. 
		\param strMessageBody 
				The user entered message body.
		\param Exp_Date
				The user selected expiration date for the message. 
				Can be empty for a message that does not expire.
				The expected format starts from a 1 based index for the
				month.
				January is 1
				February is 2
		\param Organization
				The user selected organization the message is directed to. The 
				message will be required reading for all users in the selected
				organization and all organizations below it.
		\param Priority
			The user selected priority of the message. 
		\return
			-	True
					The message will be uploaded to the database.
			-	False
					The message will not be uploaded to the database.					
	*/
	//--------------------------------------------------------------------------
	function Add()
	{
		global $g_oUserSession;
		$oOrganization = organization::GetInstance();
		$oPriority=priority::GetInstance();
		$mailer = new email();
		
		$strMessageSubject = "";
		$strMessageBody = "";
		$strExpDate = "";
		$strOrganization = "";
		$strPriority = "";
		$orgId = -1;
		$priorityId = -1;
		$strPriority = "";

		if(isset($_POST['subject']))
		{
			$strMessageSubject = $_POST['subject'];
			$strMessageSubject = CleanupSmartQuotes($strMessageSubject);
			$strMessageSubject = trim($strMessageSubject);
		}

		if(isset($_POST['body']))
		{
			$strMessageBody = $_POST['body'];
			$strMessageBody = CleanupSmartQuotes($strMessageBody);
			$strMessageBody = trim($strMessageBody);
		}

		if(isset($_POST['org']))
		{
	        $orgId = GetOrgID($_POST['org']);
		}

		if(isset($_POST['expiredate']))
		{
			$strExpDate = $_POST['expiredate'];
		}

		if(isset($_POST['priority']))
		{
			$strPriority = $_POST['priority'];
			$priorityId = $oPriority->GetID($_POST['priority']);
		}
		
        if($orgId < 0)
        {
        	return $this->OutputFormResults('false', "Invalid organization. Submit a valid organization for this message.");
		}
	
		if($priorityId < 0)
		{
        	return $this->OutputFormResults('false', "Invalid priority[$strPriority].");
		}
       
        /*--------------------------------------------------------------------------
        	Make sure the user has the right/org combination for adding this message
        ----------------------------------------------------------------------------*/	
		if(!$g_oUserSession->HasRight($this->rights_Add, $orgId))
		{
        	return $this->OutputFormResults('false', $g_oUserSession->results->GetMessage());
		}

		if(!$this->IsValidSubject($strMessageSubject))
		{
        	return $this->OutputFormResults('false', $this->results->GetMessage());
		}

		if(!$this->IsValidBody($strMessageBody))
		{
        	return $this->OutputFormResults('false', $this->results->GetMessage());
		}
		
		/*--------------------------------------------------------------------------
			Checks to make sure the Expiration Date is after the date of submission. 
		----------------------------------------------------------------------------*/		  
		if(strlen($strExpDate) != 0)
		{
			$todays_date = date("Y-m-d");
			
			/*--------------------------------------------------------------------------
				Make sure we have a valid year
			----------------------------------------------------------------------------*/			
			$dateFields = explode('-', $strExpDate);
 			
 			if(sizeof($dateFields) != 3)
 			{
 				return $this->OutputFormResults('false', "Expiration Date is invalid. $Exp_Date");
 			}
 			
 			$year = intval($dateFields[0]);
  			$month = intval($dateFields[1]);
  			$day = intval($dateFields[2]);
  			
  			if(($year == 0) || ($month == 0) || ($day == 0))
  			{
 				return $this->OutputFormResults('false', "Expiration Date is invalid.");
			}
			
			$today = strtotime($todays_date);
			$expiration_date = strtotime($strExpDate);

			if ($expiration_date <= $today) 
			{     
 				return $this->OutputFormResults('false', "Expiration Date must be after the submission date.");
			}
		}
		
		/*--------------------------------------------------------------------------
			build the record
		----------------------------------------------------------------------------*/
		$arInsert = array();
		$arInsert[$this->field_Name] = $strMessageSubject;
		$arInsert[$this->field_Body] = $strMessageBody;
		$arInsert[$this->field_Create_Date] = Date("c");
		$arInsert[$this->field_Poster] = $g_oUserSession->GetUserID();
		$arInsert[$this->field_Exp_Date] = $strExpDate;
		$arInsert[$this->field_Org_ID] = $orgId;
		$arInsert[$this->field_Priority_ID] = $priorityId;

		$strMessageSubject = stripslashes($strMessageSubject);
		
		if(strlen($strMessageSubject) > 15)
		{
			$strDisplaySubject = substr($strMessageSubject, 0, 15) . "....";
		}
		else
		{
			$strDisplaySubject = $strMessageSubject;
		}
				
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->OutputFormResults('false', "Unable to add \"$strDisplaySubject\" due to database error.");
		}
		
		/*--------------------------------------------------------------------------
			Output message to users and return results.
		----------------------------------------------------------------------------*/
		$strEmailSubject = "A New Message Was Posted";
		$strEmailBody = "A new message was posted with the subject: `$strMessageSubject`.";
				
		if($mailer->SendToOrganization($orgId, $strEmailSubject, "$strEmailBody") == 0)
		{
			$strResult = "Message '$strDisplaySubject' added.";
		}
		else
		{
			$strResult = "Message '$strDisplaySubject' added, but email not sent [" . $mailer->results->GetMessage()."].";
		}

		return $this->OutputFormResults('true', $strResult);
	}
	/*-------------------------------------------------------------------
		On a successful/failure of a valid file upload
		this function will be called to display the set message to the user
		indicating the upload has pass/failed.
	-------------------------------------------------------------------*/
	function OutputFormResults($strValue, $strMsg)
	{
		echo "<html><head><script>window.onload = function ()
			{
				if(parent.oAddMessage)
				{
					parent.oAddMessage.DisplayResults(\"$strValue||$strMsg\");
				}
			};
			</script></Head>
			<body>$strMsg</body>
			</html>
			";

		return $strValue == 'true';
	}
	//--------------------------------------------------------------------------
	/**
		\brief Updates an existing message within the database
		\param strMessageSubject
				The existing message subject. 
		\param strMessageBody 
				The existing message body.
		\param Exp_Date
				The existing expiration date for the message. 
				Can be empty for a message that does not expire.
		\param Organization
				The existing organization the message is directed to. The 
				message will be required reading for all users in the selected
				organization and all organizations below it.
		\param Priority
			The existing priority of the message. 
		\param id
			The message id as assigned in the database.
		\return
			-	True
					The changes are accepted and the message 
					will be uploaded to the database.
			-	False
					The changes are not accepted and the 
					message will not be uploaded to the database.					
	*/
	//--------------------------------------------------------------------------
	function Modify($strMessageSubject, $strMessageBody, $Exp_Date, $Organization, $Priority, $id)
	{
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$oOrganization=organization::GetInstance();
		$oPriority=priority::GetInstance();
        
        /*--------------------------------------------------------------------------
			The passed in Message ID must exist in the database to modify a message.
		----------------------------------------------------------------------------*/
		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid message id.");
		}
		
		if(!$this->CanModify($id))
		{
			return false;
		}
		
		$strMessageSubject = trim($strMessageSubject); 
		$strMessageBody = trim($strMessageBody); 
        $orgID = $oOrganization->GetID($Organization);

        /*--------------------------------------------------------------------------
			Make sure a user can modify the organization to an organization outside
			of their right assigned org hierarchy.
		----------------------------------------------------------------------------*/
        if(!$g_oUserSession->HasRight($oRights->MSG_BOARD_Admin, $orgID))
        {
	        if(!$g_oUserSession->HasRight($this->rights_Modify, $orgID))
	        {
	        	return $this->results->Set('false', $g_oUserSession->results->GetMessage());
			}
		}
		
		/*--------------------------------------------------------------------------
			Make sure the names are valid
		----------------------------------------------------------------------------*/	
		if(!$this->IsValidSubject($strMessageSubject))
		{
			return $this->results->Set('false', "Subject is smaller than 3 characters or contains one of the following invalid characters: ` ~	^ *	= +	| ] [ }	{ <	> &");
		}
	
		if(!$this->IsValidBody($strMessageBody))
		{
			return $this->results->Set('false', "Message body is smaller than 3 characters or contains one of the following invalid characters: ` ~	^ *	= +	| ] [ }	{ <	> &");
		}
		
		/*-------------------------------------------------------------------------- 
			The priority can be Normal or High and must exist
		----------------------------------------------------------------------------*/
		$priID = $oPriority->GetID($Priority);
		
		if($priID < 0)
		{
			return $this->results->Set('false', "Invalid priority.");
		}
		/*--------------------------------------------------------------------------
			Checks to make sure the Expiration Date is after the date of submission. 
		----------------------------------------------------------------------------*/		  
		if(strlen($Exp_Date) != 0)
		{
			$todays_date = date("Y-m-d");

			$today = strtotime($todays_date);
			$expiration_date = strtotime($Exp_Date);

			if ($expiration_date <= $today) 
			{     
     			return $this->results->Set('false', "Expiration Date must be after the submission date.");
			}
		}
	
		/*--------------------------------------------------------------------------
			Build the record
		----------------------------------------------------------------------------*/
		$arUpdate = array();
		$arUpdate[$this->field_Name] = $strMessageSubject;
		$arUpdate[$this->field_Body] = $strMessageBody;
        $arUpdate[$this->field_Org_ID] = $orgID;
		$arUpdate[$this->field_Priority_ID] = $priID;
		$arUpdate[$this->field_Exp_Date] = $Exp_Date;
		
		$strDisplay = substr($strMessageSubject, 0, 15);
		$strDisplay = stripslashes($strDisplay);
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $id;
		
		$retCode = $this->db->update($this->table_Name, $arUpdate, $arWhere);
		
		switch($retCode)
		{
			case 0:
				return $this->results->Set('true', "No changes made to message: \"$strDisplay\".");
				break;
			case 1:
				$this->RemoveViewed($id);
				$this->SetOwnerViewed();

				return $this->results->Set('true', "Your changes have been applied to message: \"$strDisplay\".");
				break;
			case -1:
				return $this->results->Set('false', $this->db->results->GetMessage());
				break;
		}
		
		return $this->results->Set('false', "Unable to update \"$strDisplay\" due to database error.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Checks to see if the user may modify this message
		\param id
			The id of the message to check
		\return
			-	true
				The may modify this message
			-	false
				The user may not modify this message
	*/
	//--------------------------------------------------------------------------
	function CanModify($id)
	{
		global $g_oUserSession;
		$arMsgRecord = $this->Get($id);
		$oRights = rights::GetInstance();

		if($arMsgRecord == null)
		{
			return $this->results->Set('false', "Nonexistent message may not be modified.");
		}

		if($g_oUserSession->HasRight($this->rights_Modify, $arMsgRecord[$this->field_Org_ID]))
		{
			if($g_oUserSession->GetUserID() != $arMsgRecord[$this->field_Poster])
			{
				if(!$g_oUserSession->HasRight($oRights->MSG_BOARD_Admin, $arMsgRecord[$this->field_Org_ID]))
				{
					return $this->results->Set('false', $g_oUserSession->results->GetMessage());
				}
			}
		}
		else
		{
			if(!$g_oUserSession->HasRight($oRights->MSG_BOARD_Admin, $arMsgRecord[$this->field_Org_ID]))
			{
				return $this->results->Set('false', $g_oUserSession->results->GetMessage());
			}
		}
		
		return $this->results->Set('true', "Message may be modified by this user");
	}
	//--------------------------------------------------------------------------
	/**
		\brief Returns true if the requested message may be removed. 
		\param id
			The message id as assigned in the database.
		\return
			-	True
					The message may be removed.
			-	False
					The user cannot remove the message.					
	*/
	//--------------------------------------------------------------------------
	function CanRemove($id)
	{
		$arMsgRecord = $this->Get($id);
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$bRemove = false;
		$msg = messageBoard::GetInstance();
		
		/*--------------------------------------------------------------------------
			Makes sure the user has the Message Board Standard or Admin Right or 
			that the message is expired before allowing the user to remove messages. 
		----------------------------------------------------------------------------*/
		if($g_oUserSession->GetUserID() == $arMsgRecord[$this->field_Poster])
		{
			if($g_oUserSession->HasRight($this->rights_Remove, $arMsgRecord[$this->field_Org_ID]))
			{
				$bRemove = true;
			}
		}

		if($g_oUserSession->HasRight($oRights->MSG_BOARD_Admin, $arMsgRecord[$this->field_Org_ID]))
		{
			$bRemove = true;
		}

		if($arMsgRecord[$this->field_Exp_Date] < date("c"))
		{
			$bRemove = true;
		}

		if($bRemove == false)
		{
			return $this->results->Set('false', "User does not have rights to remove this message.");
		}

		return $this->results->Set('true', "User does have rights to remove this message.");
	}
	
	//--------------------------------------------------------------------------
	/**
		\brief Calls the Base Class remove object to remove a message, but 
				additionally overrides the base class to remove all references 
				to the messsage being viewed. 
		\param id
				The message id as assigned in the database. 
		\return
			-	True
					The message and all references to it were  
					removed from the database.
			-	False
					The message and all references to it were not 
					removed from the database.
	*/
	//--------------------------------------------------------------------------
	function Remove($id)
	{	
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$strName = $this->GetName($id);	
		
		$strDisplay = substr($strName, 0, 15);
		$strDisplay = stripslashes($strDisplay);
		
		/*--------------------------------------------------------------------------
			The passed in Message ID must exist in the database to remove a message.
		----------------------------------------------------------------------------*/
		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid message id.");
		}
		
		if(!$this->CanRemove($id))
		{
			return false;
		}
		
		$this->RemoveViewed($id);

		if(!baseAdmin::Remove($id))
		{
			return false;
		}

		return $this->results->Set('true', "'$strDisplay' removed successfully.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Removes all viewed flags for this message
		\param id
			The id of the message to clear the flags for
	*/
	//--------------------------------------------------------------------------
	function RemoveViewed($id)
	{
		if(!$this->CanModify($id))
		{
			return false;
		}

		$tableName = "jMessageViewed";

		$strSQL  = "DELETE FROM $tableName WHERE msg_ID = $id";
		
		$records = $this->db->sql_delete($strSQL);
	}
	//--------------------------------------------------------------------------
	/**
		\brief Sets all messages created by the user to viewed since anything 
				you have created you have also viewed.					
	*/
	//--------------------------------------------------------------------------
	function SetOwnerViewed()
	{
		global $g_oUserSession;
		$userId = $g_oUserSession->GetUserID();
		
		$strSQL  = "SELECT msg_ID FROM $this->table_Name WHERE user_ID = $userId";
		
		$records = $this->db->Select($strSQL);
		
		foreach($records as $msg)
		{
			$this->View($msg['msg_ID']);
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief Sets a flag saying that a user has viewed the message 
		\param messageID
				The message id as assigned in the database. 
		\return
			-	True
					The message has been flagged as viewed and the jMessageViewed 
					table has been updated in the database.
			-	False
					The message has not been flagged as viewed. No changes have 
					been made to the jMessageViewed table in the database.					
	*/
	//--------------------------------------------------------------------------
	function View($messageID)
	{
		global $g_oUserSession;
		$tableName = "jMessageViewed";
		
		/*--------------------------------------------------------------------------
			Validate message is valid.
			
			Also validate user has not already looked at message
			return true if user is viewing the message for the first time.
		----------------------------------------------------------------------------*/
		if ($messageID > 0)
		{
			$userID = $g_oUserSession->GetUserID();
			
			if ($userID > 0)
			{
				$strSQL  = "SELECT * FROM $tableName WHERE msg_ID = $messageID AND user_ID = $userID";
				
				$records = $this->db->Select($strSQL);
				
				if(sizeof($records) < 1)
				{
					$arInsert = array();
					$arInsert['msg_ID'] = $messageID;
					$arInsert['user_ID'] = $userID;
					$arInsert['jMsgRead_Time'] = date("c");
					$this->db->insert($tableName, $arInsert);
				}				
				return true;
			}
		}	
		return false;
	}
   	
	//--------------------------------------------------------------------------
	/**
		\brief This function validates that the message body submitted is valid.
		\param strMessageBody 
				The user entered or modified message body. 
		\return
			-	True
					The message body is valid.
			-	False
					The message body is invalid.					
	*/
	//--------------------------------------------------------------------------
	function IsValidBody($strMessageBody)
	{
		/*--------------------------------------------------------------------------
			May contain only a-z 0-9 A-Z spaces and special characters	
			\$@%#_\',;:/()–.?!"
			Allows tabs and new lines (Carriage returns)
			Can be up to 64536 characters
			Can not start with a space
			Must be at least 3 characters
		----------------------------------------------------------------------------*/	
		if (strlen ($strMessageBody)>5783)
		{
			return $this->results->Set('false', "Invalid message body - Message is too long");
		}
			
		if(eregi("^[a-z0-9 \n\r.!?',\";:\$@%#_/()\\-]{3,}$",  $strMessageBody))
		{
			return $this->results->Set('true', "Valid message body.");
		}
		
		return $this->results->Set('false', "Message body is smaller than 3 characters or contains one of the following invalid characters: ` ~	^ *	= +	| ] [ }	{ <	> &");	
	}
		
	//--------------------------------------------------------------------------
	/**
		\brief This function validates that the subject submitted is valid.
		\param strMessageSubject 
				The user entered or modified message subject. 
		\return
			-	True
					The message subject is valid.
			-	False
					The message subject is invalid.					
	*/
	//--------------------------------------------------------------------------
	function IsValidSubject($strMessageSubject)
	{
		/*--------------------------------------------------------------------------
			May contain only a-z 0-9 A-Z spaces and special characters	
			\',;:\$@%#_/()–.?!"
			Can be up to 75 characters			
		----------------------------------------------------------------------------*/		
		if(eregi("^[a-z0-9 \\.!?',\";:\$@%#_/()-]{3,76}$",  $strMessageSubject))
		{
			return $this->results->Set('true', "Valid message subject.");
		}
		
		return $this->results->Set('false', "Subject is smaller than 3 characters or contains one of the following invalid characters: ` ~	^ *	= +	| ] [ }	{ <	> &");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			This function purges messages from the system if the current date is 
			greater than the expiration date. This runs automatically when the user 
			searches for messages and should be transparent to the user. 	
	*/
	//--------------------------------------------------------------------------
	function DeleteOldMessages()
	{
		$strSQL  = "SELECT msg_ID FROM $this->table_Name WHERE msg_exp_date < NOW() AND YEAR (msg_exp_date) > 0";
		$records = $this->db->Select($strSQL);
			
		for($iMsgDelete = 0; $iMsgDelete < sizeof($records); $iMsgDelete ++)
		{
			$this->Remove($records[$iMsgDelete]['msg_ID'], 1);
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief Returns the singleton for this class				
	*/
	//--------------------------------------------------------------------------
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new messageBoard();
		}
	
		return $obj;
	}
}
?>
