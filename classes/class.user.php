<?
require_once('include.php');

class cUser extends cGenericObject
{
	
	protected $field_Id = "user_ID";				//	the unique id for this right
	public $field_Name = "user_Name";				//	the user friendly name of this right
	public $field_EMail = "user_EMail";			//	the user's email address
	public $field_Organization = "org_ID";			//	the user's organization
	public $field_Badge = "user_Badge_ID";			//	the user's organization
	public $field_Theme = "user_theme";			//	The user's site theme id
	public $field_Create_Date = "user_Create_Date";//	The day the account was created
	public $field_Flakes = "user_UseFlakes";		//	Determines whether flakes should appear on the screen
	public $field_Active = "user_Active";			//	Determines whether the account is active or not
													//	Inactive accounts do not have any rights within the system
	public $field_Connect = "user_last_connect";	//	The last time the user has connected to the system

	public $field_MessageDelay = "message_delay";	//	Determines how long user message stay displayed on the
													//	client screen.
	public $field_CloseNotice = "close_notice";	//	Determines whether the user
													//	will see a close notification when leaving the site
													//	client screen.
	public function __construct($user_info = -1)
	{
		$id = 0;
		cGenericObject::__construct();

		$this->table_Name = "tblUser";
		$this->db = systemData::GetInstance();

		if($user_info <> -1)
		{
			$id = GetUserID($user_info);
		}
    	$this->initialize($this->table_Name, $id);
    	
    	$this->bSaveOnDestroy = true;
 	}
 	//--------------------------------------------------------------------------
 	/**
 		\brief
 			Sets the last connect variable for this account.
 	*/
 	//--------------------------------------------------------------------------
 	function Touch()
 	{
 		$this->SetField($this->field_Connect, Date("c"));
 	}
 	//--------------------------------------------------------------------------
	/**
		\brief
			GetOrganization returns the string name of the organization of the passed
			in user name/id
		\param bId
			-	true
				Returns the id of the organization
			-	false
				Returns the string name of the organization
		\return
			Returns the organization id of the loaded account
	*/
	//--------------------------------------------------------------------------
	function GetOrganization($bId = true)
	{
		if(!$this->makeLoaded())
		{
			return "Guest";
		}
		
		if($bId)
		{
			return $this->GetField($this->field_Organization);
		}
		else
		{
			$oOrganization = organization::GetInstance();
			return $oOrganization->GetName($this->GetField($this->field_Organization));
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			GetOrganization returns the string name of the organization of the passed
			in user name/id
		\param bId
			-	true
				Returns the id of the organization
			-	false
				Returns the string name of the organization
		\return
				Returns the organization or id of the loaded account
	*/
	//--------------------------------------------------------------------------
	function GetName()
	{
		if(!$this->makeLoaded())
		{
			return "No Name";
		}

		return $this->GetField($this->field_Name);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			GetOrganization returns the string name of the organization of the passed
			in user name/id
		\param bId
			-	true
				Returns the id of the organization
			-	false
				Returns the string name of the organization
		\return
				Returns the organization or id of the loaded account
	*/
	//--------------------------------------------------------------------------
	function GetEmail()
	{
		if(!$this->makeLoaded())
		{
			return "";
		}

		return $this->GetField($this->field_EMail);
	}
 	//--------------------------------------------------------------------------
	/**
		\brief
			Determines if the passed in id/name connects to a valid account
		\param user_info
			The user name/id to be checked
		\return
			-	true
					The account is valid
			-	false
					The account is not valid
	*/
	//--------------------------------------------------------------------------
	function IsValid()
	{
		if(!$this->IsActive())
		{
			return false;
		}

		if($this->IsGuest())
		{
			return false;
		}
		return true;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function IsActive()
	{
		if(!$this->makeLoaded())
		{
			return false;
		}
		
		return $this->GetField($this->field_Active) == 1;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Checks to see if the user account is in the guest organization
		
		\param userId
				The user id to check
		\return
			-	true
					The account is in the guest organization.
			-	false
					The account is not in the guest organization.
	*/
	//--------------------------------------------------------------------------
	function IsGuest()
	{
		$userOrgId = GetOrgID($this->GetField($this->field_Organization));
		$guestOrgId = GetOrgID("Guest");

		return $userOrgId == $guestOrgId;
	}
 	
}
?>