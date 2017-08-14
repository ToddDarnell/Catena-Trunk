<?php
require_once('class.baseAdmin.php');
require_once('class.systemData.php');
require_once('class.organization.php');

/**
	\class cUserContainer
	\brief Contains functionality to manipulate user details.
	This class allows adding, deleting, modifying user accounts and 
	user account details; assigning rights, groups, and organizations.
*/
class cUserContainer extends baseAdmin
{
	function __construct()
	{
		parent::__construct();
		
		/// the name of the table used for rights
		$this->table_Name = "tblUser";
		
		$this->field_Id = "user_ID";					//	the unique id for this right
		$this->field_Name = "user_Name";				//	the user friendly name of this right
		$this->field_EMail = "user_EMail";				//	the user's email address
		$this->field_Organization = "org_ID";			//	the user's organization
		$this->field_Badge = "user_Badge_ID";			//	the user's organization
		$this->field_Theme = "user_theme";				//	The user's site theme id
		$this->field_Create_Date = "user_Create_Date";	//	The day the account was created
		$this->field_Flakes = "user_UseFlakes";			//	Determines whether flakes should appear on the screen
		$this->field_Active = "user_Active";			//	Determines whether the account is active or not
														//	Inactive accounts do not have any rights within the system
		$this->field_MessageDelay = "message_delay";	//	Determines how long user message stay displayed on the
														//	client screen.
		$this->field_CloseNotice = "close_notice";		//	Determines whether the user
														//	will see a close notification when leaving the site
														//	client screen.
		
		$this->db = systemData::GetInstance();
		
		$this->arUsers = array();
		
		$this->system_id = 2;							//	Used to keep track of which category the log messages
														//	are posted under.
				
	}
	//--------------------------------------------------------------------------
	/**
		\brief	This function determines if the string passed into the function
				is a valid user name.
		\param strTitle
				The user name to validate
		\return
			-	true if the text is a valid user name
			-	false if the user name is not valid
	*/
	//--------------------------------------------------------------------------
	function IsValidName($strTitle)
	{
		$strNewTitle = $this->db->EscapeString($strTitle);

		if(!eregi("^[a-z0-9.]{3,20}$",  $strNewTitle))
		{
			return $this->results->Set('false', "Invalid or no characters in name.");
		}
		
		return true;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Add a new user to the database
		\param strName
			The user name to assign to this guest account
		\note If the email is already in use, for whatever reason,
			the account's email address will be disabled (i.e. left blank).
	*/
	//--------------------------------------------------------------------------
	function Add($strName)
	{
		$oOrganization = organization::GetInstance();
		$oLog = cLog::GetInstance();
		
		/*
			Make sure the user's name is valid
		*/
		if(!$this->IsValidName($strName))
		{
			$oLog->log($this->system_id, "Unable to add new user because the account name is invalid : ($strName)", LOGGER_CRITICAL);
			return $this->results->Set('false', "Unable to add user because the account is invalid. Please contact Catena support.");
		}
	
		if($this->GetID($strName) > -1)
		{
			$oLog->log($this->system_id, "Unable to add new user because the account already exists : ($strName)", LOGGER_WARNING);
			return $this->results->Set('false', "User name '$strName' is already in use. A new account may not be made with this name.");
		}
		
		$strEmail = $strName . "@echostar.com";

		if($this->EmailExists($strEmail))
		{
			$oLog->log($this->system_id, "Unable to use $strEmail for new account because address is in use", LOGGER_WARNING);
			$strEmail = "";
		}
		
		/*
			build the record
		*/
		$arInsert = array();
		$arInsert[$this->field_Name] = $strName;
		$arInsert[$this->field_Organization] = $oOrganization->GetID("Guest");
		$arInsert[$this->field_Create_Date] = Date("c");
		$arInsert[$this->field_Active] = true;
		$arInsert[$this->field_EMail] = $strEmail;
		
		$result = $this->db->insert($this->table_Name, $arInsert);
			
		if($result <> 1)
		{
			$strError = "Unable to add '$strName' due to database error: " . $this->db->results->GetMessage();
			return $this->results->Set('false', $strError);
		}

		$oLog->log( $this->system_id, "Added new user '$strName'", LOGGER_NOTICE);
		
		$strSubject = "New User";
		
		$strBody = "$strName has connected to Catena. If
					this user is part of your organization, please
					go to Administration->User Accounts to change this
					user's organization and access.";
		
		$oMailer = $mailer = new email();
		
		$oRights = rights::GetInstance();
		$oMailer->SystemToRight($strSubject, $strBody, $oRights->SYSTEM_GlobalAdmin);
		
		return $this->results->Set('true', "User '$strName' added.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Determines if the passed in email address is already in use.
		\param strEmail
				The email address we'll check against the database.
		\param userId
				An optional userId to exclude from the comparision. The purpose
				for this is to check against an existing account. For example,
				when modifying an account. Don't care if the address exists for
				this account because we'll be updating it with the new address.
		\return
			-	true
					the email is already in use in the system
			-	false
					the email is not in use in the system
	*/
	//--------------------------------------------------------------------------
	function EmailExists($strEmail, $userId = -1)
	{
		if(strlen($strEmail) < 1)
		{
			return false;
		}
		
		$strFormatted = $this->db->EscapeString($strEmail);

		if($userId == -1)
		{
			$sql = "SELECT user_ID FROM $this->table_Name WHERE $this->field_EMail = '$strFormatted';";
		}
		else
		{
			$sql = "SELECT
						user_ID
					FROM
						$this->table_Name
					WHERE
						$this->field_EMail = '$strFormatted'
						AND $this->field_Id <> $userId;";
		}
		return sizeof($this->db->Select($sql)) > 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Modifies the user account
		
		\param user_info
				the user account to modify
		\param strEmail
				the new email address of the account
		\param iTheme
				the new color theme of the user account
		\param iFlakes
				Enables or disables flakes.
				0 - Off
				1 - 3 from slow to constant.
		\param messageDelay
				How long to delay messages before removing them.
		\param closeNotice
				Whether the user should see hte close
				Enables or disables flakes
		\return
				- true
					the account was modified properly.
				- false
					the account was not modified
	*/
	//--------------------------------------------------------------------------
	function SetPreferences($user_info, $strEmail, $iTheme, $iFlakes, $messageDelay, $closeNotice)
	{
		$userId = -1;
		$adminId = -1;
		global $g_oUserSession;
		$oOrganization = organization::GetInstance();
		$bUpdate = false;

		/*
			Validate we have a real account number.
			Since we could receive a user name we have to make
			sure we convert it to a number
		*/
		$userId = GetUserID($user_info);

		if($userId < 0)
		{
			$oLog->log( $this->system_id, "Preference change attempt on invalid account.", LOGGER_WARNING);
			return $this->results->Set('false', "User does not exist.");
		}
		
		/*
			Now make sure the account submitting the email address change
			is either the owner of the account or an administrator of
			the user's organization.
		*/		
	
		$adminId = $g_oUserSession->GetUserID();
		
		if($adminId != $userId)
		{
			$userOrgId = $oOrganization->GetId($this->GetOrganization($userId));
			
			if(!$g_oUserSession->HasRight($oRights->SYSTEM_RightsAdmin, $userOrgId))
			{
				$oLog->log( $this->system_id, "Preference change attempt on invalid account.", LOGGER_SECURITY);
				return $this->results->Set('false', "You do not the have correct right to assign other rights.");
			}
		}

		/*
			Now validate the email
			-	make sure it's valid
			-	make sure it has one of the valid extensions
			-	make sure it doesn't already exist in the system.
		*/
		
		if(strlen($strEmail))
		{
			$strEmail = strtolower($strEmail);
			
			if(!IsEmailValid($strEmail))
			{
				return $this->results->Set('false', "Email is not valid.");
			}
			
			if(!IsValidEmailDomain($strEmail))
			{
				return $this->results->Set('false', "Invalid email domain.");
			}
			
			if($this->EmailExists($strEmail, $userId))
			{
				return $this->results->Set('false', "Email address is in use. A unique address must be selected.");
			}
		}
		
		/*
			Validate the theme functionality
		*/

		if(!is_numeric($iTheme))
		{
			return $this->results->Set('false', "Invalid theme id.");
		}
		
		if($iTheme < 0)
		{
			return $this->results->Set('false', "Invalid theme id.");
		}
		
		if(!is_numeric($messageDelay))
		{
			return $this->results->Set('false', "Invalid message delay.");
		}

		if($messageDelay < 0)
		{
			return $this->results->Set('false', "Invalid message delay.");
		}
		
		if(!is_numeric($iFlakes))
		{
			return $this->results->Set('false', "Invalid flair speed.");
		}

		if($iFlakes < 0)
		{
			return $this->results->Set('false', "Invalid flair speed.");
		}
		
		$closeNotice = ($closeNotice == "true") || ($closeNotice == "1");
		
		$oUser = $this->GetUser($userId);
		
		/*
			Update the user's account
		*/
		$result = $oUser->SetField($oUser->field_EMail, $strEmail);
	
		if($result == 1)
		{
			$bUpdate = true;
		}
		else if($result == -1)
		{
			return $this->results->Set('false', "Error updating user email");
		}

		$result = $oUser->SetField($oUser->field_Theme, $iTheme);
	
		if($result == 1)
		{
			$bUpdate = true;
		}
		else if($result == -1)
		{
			return $this->results->Set('false', "Error updating user theme");
		}
	
		$result = $oUser->SetField($oUser->field_Flakes, $iFlakes);

		if($result == 1)
		{
			$bUpdate = true;
		}
		else if($result == -1)
		{
			return $this->results->Set('false', "Error updating user theme");
		}
	
		$result = $oUser->SetField($oUser->field_MessageDelay, $messageDelay);

		if($result == 1)
		{
			$bUpdate = true;
		}
		else if($result == -1)
		{
			return $this->results->Set('false', "Error updating user theme");
		}
		
		$result = $oUser->SetField($oUser->field_CloseNotice, $closeNotice);

		if($result == 1)
		{
			$bUpdate = true;
		}
		else if($result == -1)
		{
			return $this->results->Set('false', "Error updating user theme");
		}

		if($bUpdate == true)
		{
			return $this->results->Set('true', "Updated user preferences.");
		}

		return $this->results->Set('true', "No changes made to user preferences.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves the account email
		\param user_info
				May be the user name or user id
		\return
				A string reprsenting the account email address.
				If the account has no email, the string will be empty.
	*/
	//--------------------------------------------------------------------------
	function GetEmail($user_info)
	{
		$oUser = $this->GetUser($user_info);
		
		if(!isset($oUser))
		{
			return "";
		}
		
		return $oUser->GetEmail();
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function GetUser($user_info)
	{
		$lowerId = strtolower($user_info);
		
		if(!isset($this->arUsers[$lowerId]))
		{
			if(!$this->load($user_info))
			{
				return null;
			}
		}
		
		return $this->arUsers[$lowerId];
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function load($user_info)
	{
		$oUser = new cUser($user_info);

		if(!$oUser->load())
		{
			return false;
		}
		
		$userId = $oUser->GetID();
		$userName = strtolower($oUser->GetName());

		if($userId < 1)
		{
			return false;
		}
		
		$this->arUsers[$userId] = $oUser;
		$this->arUsers[$userName] = $oUser;

		return true;
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
	function IsGuest($userId)
	{
		$oOrganization = organization::GetInstance();
	
		$userOrgId = $oOrganization->GetId($this->GetOrganization($userId));
		$guestOrgId = $oOrganization->GetId("Guest");

		return $userOrgId == $guestOrgId;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Checks to see if the requested account's active flag is set to
				true
		\param user_info
				The account id/name we're checking
		\return
			- true The account is active
			- false The account is not active
	*/
	//--------------------------------------------------------------------------
	function IsActive($user_info)
	{
		$oUser = $this->GetUser($user_info);
		
		if(!isset($oUser))
		{
			return "";
		}
		
		return $oUser->IsActive();
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Set's the user's organization
		\param user_info
				The user account or user account name
		\param orgId
				The user account's new organization. Should be an organization
				id.
		\return
			0	Account organization changed
			-1	No changes made because organizations are the same
			-2	Some kind of error occurred trying to change the account
		
		\note
			May only move a user account to an organization assigned as a right
			or to the AFU or guest organization if the SYSTEM_AssignRight right
			is assigned for the user's organization.
	*/
	//--------------------------------------------------------------------------
	function SetOrganization($user_info, $org_info)
	{
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$oSystemAccess = systemAccess::GetInstance();
	    $oOrganization = organization::GetInstance();
	    $oLog = cLog::GetInstance();
	    
	    $oUser = null;
	    $strRights = "";
	    $userId = -1;
	    $adminId = -1;
	    $strOldOrg = "";
	    $strNewOrg = "";

	    $oUser = $this->GetUser($user_info);
		
		if(!isset($oUser))
		{
			$oLog->log( $this->system_id, "Attempted to change the organization of an invalid user.", LOGGER_WARNING);
			$this->results->Set('false', "You may not change the organization of an invalid user.");
			return -1;
		}
		$userId = $oUser->GetID();
		
		$adminId = $g_oUserSession->GetUserID($user_info);
				
		if($userId == $adminId)
		{
			$oLog->log( $this->system_id, "Attempted to change own organization.", LOGGER_WARNING);
			$this->results->Set('false', "You may not change your own organization.");
			return -1;
		}

		$orgNewId = GetOrgID($org_info);
		$orgOldId = $oUser->GetOrganization();
	    $strOldOrg = $oOrganization->GetName($orgOldId);
	    $strNewOrg = $oOrganization->GetName($orgNewId);
		
		if($orgNewId < 0)
		{
			$oLog->log( $this->system_id, "Attempted to change " . $oUser->GetName(). " to an invalid organization.", LOGGER_WARNING);
			$this->results->Set('false', "You may not change " . $oUser->GetName() . " to an invalid organization.");
			return -1;
		}

		if($orgNewId == $orgOldId)
		{
			$oLog->log( $this->system_id, "Attempted to change " . $oUser->GetName(). " to same organization ($strNewOrg).", LOGGER_WARNING);
			$this->results->Set('true', "No changes made because organizations are the same.");
			return -1;
		}
		
		/*
			The person trying to do this must have the admin right for either
			the new organization or the old organization, depending upon
			if the old or the new is either guest or AFU.
			If neither the new or the old is guest or AFU, then the
			admin must have rights for both.
		*/
		$guestOrgId = GetOrgID("Guest");
		$afuOrgId = GetOrgID("AFU");

		$arChecks['old'] = true;
		$arChecks['new'] = true;

		if($orgOldId == $guestOrgId)
		{
			$arChecks['old'] = false;
		}
		
		if($orgOldId == $afuOrgId)
		{
			$arChecks['old'] = false;
		}

		if($orgNewId == $guestOrgId)
		{
			$arChecks['new'] = false;
		}
		
		if($orgNewId == $afuOrgId)
		{
			$arChecks['new'] = false;
		}
		
		if($arChecks['old'] == true)
		{
			if(!$oSystemAccess->HasRight($g_oUserSession->GetUserID(), $oRights->SYSTEM_RightsAdmin, $orgOldId))
			{
				$oLog->log( $this->system_id, "Attempting to change " . $oUser->GetName(). " from organization ($strOldOrg) without rights.", LOGGER_SECURITY);
				$this->results->Set('false', $oSystemAccess->results->GetMessage());
				return -2;
			}
		}
		
		if($arChecks['new'] == true)
		{
			if(!$oSystemAccess->HasRight($g_oUserSession->GetUserID(), $oRights->SYSTEM_RightsAdmin, $orgNewId))
			{
				$oLog->log( $this->system_id, "Attempting to change " . $oUser->GetName(). " to organization ($strNewOrg) without rights.", LOGGER_SECURITY);
				$this->results->Set('false', $oSystemAccess->results->GetMessage());
				return -2;
			}
		}
		
		if(($arChecks['new'] == false) && ($arChecks['old'] == false))
		{
			/*
				With this combination the admin is changing from Guest to AFU
				or the opposite (we've already checked for the same organization)
				so we just check the user has the assign rights right--and
				don't bother with the organization.
			*/
			if(!$oSystemAccess->HasRight($g_oUserSession->GetUserID(), $oRights->SYSTEM_RightsAdmin))
			{
				$oLog->log( $this->system_id, "Attempted to change " . $oUser->GetName(). " to organization ($strNewOrg) without right.", LOGGER_SECURITY);
				$this->results->Set('false', $oSystemAccess->results->GetMessage());
				return -2;
			}
		}

		/*
			Whenever someone is moved from one organization to another, their rights
			are removed. Remove the rights first, because if the user is
			being moved to the guest organization, they will not be able to
			remove rights afterwards.
		*/
		if(($orgNewId == $guestOrgId) || ($orgNewId == $afuOrgId))
		{
			if(!$oSystemAccess->RemoveAllRights($userId))
			{
				$this->results->Set('false', $oSystemAccess->results->GetMessage());
				return -2;
			}
			$strRights = " All rights removed.";
		}
		
		$result = $oUser->SetField($oUser->field_Organization, $orgNewId);

		switch($result)
		{
			case 0:
				$strNotice = "No change for ". $oUser->GetName(). "'s org from ($strOldOrg) to ($strNewOrg).$strRights";
				$oLog->log( $this->system_id, $strNotice, LOGGER_SECURITY);
				return $this->results->Set('true', "No changes made to user organization.$strRights");
			case 1:
				$strNotice = "Changed ". $oUser->GetName(). "'s org from ($strOldOrg) to ($strNewOrg).$strRights";
				$oLog->log( $this->system_id, $strNotice, LOGGER_SECURITY);
				return $this->results->Set('true', "User organization updated.$strRights");
			default:
				return $this->results->Set('false', "Unable to update user organization. $strRights".$this->db->results->GetMessage());
		}

		return 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Set's the user's organization
		\param user_info
				The user account or user account name
		\param orgId
				The user account's new organization. Should be an organization
				id.
		\return
			0	Account organization changed
			-1	No changes made because organizations are the same
			-2	Some kind of error occurred trying to change the account
		
		\note
			May only move a user account to an organization assigned as a right
			or to the AFU or guest organization if the SYSTEM_AssignRight right
			is assigned for the user's organization.
	*/
	//--------------------------------------------------------------------------
	function SetEMail($user_info, $strNewEmail)
	{
		global $g_oUserSession;
		$oRights = rights::GetInstance();
	    $oLog = cLog::GetInstance();
	    
	    $oUser = $this->GetUser($user_info);
	    
	    if(!isset($oUser))
	    {
	    	$this->results->Set('false', "Invalid account used in email change.");
	    	return -1;
		}
		
		$userId = $oUser->GetID();
		$strOldEmail = $oUser->GetEmail();
		$adminId = $g_oUserSession->GetUserID();

		if($adminId != $userId)
		{
			if(!$g_oUserSession->HasRight($oRights->SYSTEM_RightsAdmin, $oUser->GetOrganization()))
			{
				$strError = "Attempted to change " . $oUser->GetName(). "'s email without right.";
				$oLog->log( $this->system_id, $strError, LOGGER_WARNING);
				return $this->results->Set('false', $strError);
			}
		}

		if($strOldEmail == $strNewEmail)
		{
			$this->results->Set('true', "No changes made because emails are the same.");
			return -1;
		}
		
		if(!IsEmailValid($strNewEmail))
		{
			return $this->results->Set('false', "Invalid email submitted. Please use proper name@domain.com format.");
		}

		$result = $oUser->SetField($oUser->field_EMail, $strNewEmail);
		
		switch($result)
		{
			case 0:
				return $this->results->Set('true', "No changes made to user email.");
			case 1:
				return $this->results->Set('true', "User email updated.");
			default:
				return $this->results->Set('false', "Unable to update user email. ".$this->db->results->GetMessage());
		}

		$this->results->Set('true', "EMail updated.");
		return 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			GetOrganization returns the string name of the organization of the passed
			in user name/id
		\param user_info
				Can be either a valid user id number or a string variable
		\return
				Returns the organization name of the passed in user name/id
	*/
	//--------------------------------------------------------------------------
	function GetOrganization($user_info)
	{
		$oUser = $this->GetUser($user_info);
		
		if(!isset($oUser))
		{
			$this->results->Set('false', "Invalid User");
			return "";
		}
		
		return $oUser->GetOrganization(false);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Returns the singleton for this class
		\return
	*/
	//--------------------------------------------------------------------------
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new cUserContainer();
		}
		
		return $obj;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves all users who are within the organization and its
			children
		\param org_data
			may be an array of organization id's or an individual id or 
			organization name.
		\param bChildren
			Set to true to include all users from child organizations.
			Defaults to true. Use only if a single organization is submitted
			via the org_data param.
		\return
			An array containing the user ids.
	*/
	//--------------------------------------------------------------------------
	function GetOrganizationUsers($org_data, $bChildren = true)
	{
		$oOrganization = organization::GetInstance();

		if(sizeof($org_data) < 1)
		{
			return null;
		}

		$strSQL = "	SELECT
						*
					FROM
						$this->table_Name WHERE ";
		
		$firstTime = true;
		
		if(is_array($org_data))
		{
			foreach($org_data as $org)
			{
				if($firstTime == true)
				{
					$firstTime = false;
				}
				else
				{
					$strSQL .= " OR ";
				}
				$strSQL .= " tblUser.org_ID = " . $org['org_ID'];
			}
		}
		else
		{
			$orgId = GetOrgID($org_data);
			$strSQL .= " tblUser.org_ID = $orgId";
			
			if($bChildren == true)
			{
				$arOrgs = $oOrganization->GetChildren($orgId);

				foreach($arOrgs as $org)
				{
					$strSQL .= " OR tblUser.org_ID = " . $org['org_ID'];
				}
			}
		}

		return $this->db->select($strSQL);
	}
	//--------------------------------------------------------------------------
	/**
		\brief Will disable or enable an account depending upon the status
				passed in
		\param user_info
				The user id to enable or disable
		\param status
			-	true
					enable the account
			-	false
					disable the account
		\return
			-	true
					if the change was successful.
			-	false
					if the change was not successful.
		\note
			Only users who have the SYSTEM_RightsAdmin right may enable accounts.
	*/
	//--------------------------------------------------------------------------
	function EnableAccount($user_info, $status)
	{
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$oLog = cLog::GetInstance();

		$oUser = $this->GetUser($user_info);

		if(!isset($oUser))
		{
			return $this->results->Set('false', "Invalid user selected for management.");
		}
		
		$userId = $oUser->GetID();
		$strUser = $oUser->GetName();
		$adminId = $g_oUserSession->GetUserID();
		
		$activate = 0;				//	set to 1 to active account. 0 to disable account.
		
		if($userId == $adminId)
		{
			return $this->results->Set('false', "You may not change the status of your own account.");
		}

		/*
			See if the user has the system_AssignRight for the user's
			organization
		*/
		if(!$g_oUserSession->HasRight($oRights->SYSTEM_RightsAdmin))
		{
			$oLog->log($this->system_id, "Attempted to enable/disable account '". $oUser->GetName() . "' without right.", LOGGER_SECURITY);
			return $this->results->Set('false', "You do not the have correct right to enable accounts.");
		}
		
		if($status == true)
		{
			/*
				we want to enable the account but currently the only thing
				we need to do is set the active flag to true.
			*/
			$strResult = "Enabled user account";
			$activate = 1;
		}
		else
		{
			/*
				we want to disable the account
				-	move the account to the AFU organization.
			*/
			if($oUser->GetOrganization() != GetOrgID("AFU"))
			{
				$this->SetOrganization($userId, "AFU");
			}
			$strResult = "Disabled user account";
			$activate = 0;
		}
		
		$result = $oUser->SetField($oUser->field_Active, $activate);
				
		switch($result)
		{
			case 0:
				return $this->results->Set('true', "No changes made to user account.");
			case 1:
				$strResult = "$strResult '$strUser'.";
				$oLog->log($this->system_id, $strResult);
				return $this->results->Set('true', $strResult);
			default:
				return $this->results->Set('false', "Unable to update user active status.");
		}

		return $this->results->Set('false', "Unable to update user active status.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			GetSettings returns the details for the account logged in or a
			specific user
		\param user_info
				May be the user name or user id
		\return
			An XML list of settings assigned to this account.
	*/
	//--------------------------------------------------------------------------
	function GetSettings($user_info)
	{
		$userId = GetUserID($user_info);
		
		$strSQL = "
			SELECT
				*
			FROM
				tblUser
				LEFT JOIN tblOrganization ON tblUser.org_ID = tblOrganization.org_ID
			WHERE
				user_ID = $userId";
				
		OutputXMLList($strSQL, "userSettings", "settings");
	}
}

//--------------------------------------------------------------------------
/**
	\brief Returns the id of a user account based upon the user name or id
			passed in
	\param info
			may be the user account id or user name
	\return
			the user account id
			-1 if not valid
*/
//--------------------------------------------------------------------------
function GetUserID($info)
{
	$oType = cUserContainer::GetInstance();
	
	$id = -1;
	
	if(is_numeric($info))
	{
		if($oType->Exists($info))
		{
			$id = $info;	
		}
	}
	else
	{
		$id = $oType->GetID($info);
	}
	
	return $id;
}

?>