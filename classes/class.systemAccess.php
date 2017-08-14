<?php

require_once('include.php');
require_once('class.rightGroup.php');

/**
	\brief This class keeps track of the access users and organizations have to the system.
*/
class systemAccess extends baseAdmin
{
	function __construct()
	{
		parent::__construct();
		$this->table_Name = "tblAssignedRights";	//	the name of the table used for rights
		$this->field_Id = "aRight_ID";				//	the unique id for this right
		$this->field_Account = "account_ID";		//	The ID of the user account or the organization which has the
													//	right or right group assigned to it.
		$this->field_AccountType = "account_type";	//	The type of account. May be a user (0) or an organization (1)														
		$this->field_AccessType = "access_type";	// 0 right  1 right group
		$this->field_Access = "access_ID";			// The ID of the right or the right group
		$this->field_AccessOrg = "org_ID";			// The organization associated with the access id
		$this->accountTypeUser = 0;
		$this->accountTypeOrg = 1;
		$this->accessTypeRight = 0;
		$this->accessTypeGroup = 1;

		$this->db = systemData::GetInstance();
		$oRights = rights::GetInstance();
		
		$this->rights_Remove = $oRights->SYSTEM_RightsAdmin;
		$this->rights_Add = $oRights->SYSTEM_RightsAdmin;
		$this->rights_Modify = $oRights->SYSTEM_RightsAdmin;
		
		$this->arOrgRights = array();
				
		$this->system_id = 2;							//	Used to keep track of which category the log messages
														//	are posted under.

	}
	//--------------------------------------------------------------------------
	/**
		\brief Assign a right to a user
	
		\param user_info
				The user name/id of the account which the right should be added
				to
		\param right_info
				The name/id of the right which is to be assigned
		\param org_info
				The name/id of the organization this right is specifically
				assigned to.	
	*/
	//--------------------------------------------------------------------------
	function AssignUserRight($user_info, $right_info, $org_info)
	{
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$oUser = cUserContainer::GetInstance();
		
		$adminId = $g_oUserSession->GetUserID();
		
		$userId = GetUserID($user_info);
		
		$rightId = GetRightID($right_info);
		$orgId = GetOrgID($org_info);
		$strUserOrg = $oUser->GetOrganization($user_info);

		if($adminId == $userId)
		{
			return $this->results->Set('false', "You may not assign rights or groups to yourself.");
		}		
		
		if(!$g_oUserSession->HasRight($this->rights_Add, $strUserOrg))
		{
			$strResult = "You may not assign rights to users in this organization because
			you do not have the appropriate rights.";
			
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
				
		if(!$this->HasRight($adminId, $rightId, $orgId))
		{
			return $this->results->Set('false', "You may not assign this right to others because you do not have this right.");
		}

		$userId = $this->ValidateUser($user_info);
		
		if($userId < 0)
		{
			return false;
		}
				
		if($rightId < 0)
		{
			return $this->results->Set('false', "Invalid right. Select a valid right.");
		}
		
		/*
			Check that the right does or doesn't need an organization assigned to it
		*/
		if($oRights->RequiresOrg($rightId))
		{
			if($orgId < 0)
			{
				return $this->results->Set('false', "Organization required. Select a valid organization.");
			}
		}
		
		if($this->HasRight($userId, $rightId, $orgId))
		{
			/*
				We return true because this technically isn't a failure. Just notify the user
				they already had the right.
			*/
			return $this->results->Set('true', "No new assignment made. User has access via existing rights or groups.");
		}
				
		$arInsert = array();
		$arInsert[$this->field_Account] = $userId;
		$arInsert[$this->field_Access] = $rightId;
		$arInsert[$this->field_AccessOrg] = $orgId;
		$arInsert[$this->field_AccessType] = 0;
			
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', "Unable to assign right due to database error.");
		}
		
		return $this->results->Set('true', "$right_info for $org_info assigned to $user_info.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Determines if a group is assigned to one or more users or organizations
		\param group_info
			The group name or id
		\return
	*/
	//--------------------------------------------------------------------------
	function IsGroupAssigned($group_info)
	{
		$groupId = GetRightGroupID($group_info);

		if($groupId < 1)
		{
			return $this->results->Set('false', "Invalid group selected.");
		}
		
		$strSQL = "SELECT
						$this->field_Id
					FROM
						$this->table_Name
					WHERE
						$this->field_Access = $groupId
						AND
							$this->field_AccessType = $this->accessTypeGroup";

		$records = $this->db->Select($strSQL);
		
		if(sizeof($records) < 1)
		{
			return $this->results->Set('false', "Group is not assigned to users or organizations.");
		}
		
		return $this->results->Set('true', "Group is assigned to users or organizations.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Assigns a right to an organization
		\param organization_info
				The organization to assign this right/org to
		\param right_info
				The right to assign
		\param right_org_info
				The organization of the right/organization combination
		\return
	*/
	//--------------------------------------------------------------------------
	function AssignOrgRight($organization_info, $right_info, $right_org_info)
	{
		
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$oUser = cUserContainer::GetInstance();
		
		$adminId = $g_oUserSession->GetUserID();

		$orgId = GetOrgID($organization_info);
		
		$rightId = GetRightID($right_info);
		$rightOrgId = GetOrgID($right_org_info);
				
		if(!$g_oUserSession->HasRight($this->rights_Add, $orgId))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
				
		if(!$g_oUserSession->HasRight($rightId, $rightOrgId))
		{
			return $this->results->Set('false', "You may not assign this right to others because you do not have this right.");
		}

		if($orgId < 0)
		{
			return $this->results->Set('false', "Invalid organization selected for assignment.");
		}
				
		if($rightId < 0)
		{
			return $this->results->Set('false', "Invalid right. Select a valid right.");
		}
		
		/*
			Check that the right does or doesn't need an organization assigned to it
		*/
		if($oRights->RequiresOrg($rightId))
		{
			if($rightOrgId < 0)
			{
				return $this->results->Set('false', "Organization required. Select a valid organization.");
			}
		}
		
		if($this->OrgHasRight($orgId, $rightId, $rightOrgId))
		{
			/*
				We return true because this technically isn't a failure. Just notify the user
				they already had the right.
			*/
			return $this->results->Set('true', "No new assignment made. Organization has access via existing rights or groups.");
		}
				
		$arInsert = array();
		$arInsert[$this->field_Account] = $orgId;
		$arInsert[$this->field_AccountType] = $this->accountTypeOrg;
		$arInsert[$this->field_AccessType] = $this->accessTypeRight;
		$arInsert[$this->field_Access] = $rightId;
		$arInsert[$this->field_AccessOrg] = $rightOrgId;
			
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', "Unable to assign right due to database error.");
		}
		
		return $this->results->Set('true', "$right_info - $right_org_info assigned to $organization_info.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Assign a group to an organization.
		\param org_info
			The organizatin which the group will be assigned to.
		\param group_info
			The group id which the organization should be assigned.
		\return
			- true
				if the organization was assigned the group
			- false
				If the organization was not assigned the group
	*/
	//--------------------------------------------------------------------------
	function AssignOrgGroup($org_info, $group_info)
	{
		global $g_oUserSession;
		
		$oRights = rights::GetInstance();
		$oUser = cUserContainer::GetInstance();
		$oRightGroups = rightGroup::GetInstance();
		
		$adminId = $g_oUserSession->GetUserID();
		$orgId = GetOrgID($org_info);
		$groupId = GetRightGroupID($group_info);

		if($orgId < 0)
		{
			return $this->results->Set('false', "Invalid organization submitted.");
		}

		if(!$g_oUserSession->HasRight($oRights->SYSTEM_RightsAdmin, $orgId))
		{
			return $this->results->Set('false', "You may not assign rights to this organization because you do not have the required right.");
		}
		
		if($groupId < 0)
		{
			return $this->results->Set('false', "Invalid group. Select a valid group.");
		}
		
		if($this->OrgHasGroup($orgId, $groupId))
		{
			return $this->results->Set('true', $this->results->GetMessage()." Duplicate assignment not allowed.");
		}
		
		/*
			Check to see if the admin has the right. If they do not, check to see if
			they have all the rights in the group. If they do, then they may assign
			the group.
		*/
		
		if(!$this->HasGroupAdmin($adminId, $groupId))
		{
			return $this->results->Set('false', "You are not assigned this group or have all of its rights and may not assign it to others.");
		}

		$arInsert = array();
		$arInsert[$this->field_Account] = $orgId;
		$arInsert[$this->field_AccountType] = $this->accountTypeOrg;
		
		$arInsert[$this->field_Access] = $groupId;
		$arInsert[$this->field_AccessOrg] = -1;
		$arInsert[$this->field_AccessType] = $this->accessTypeGroup;
			
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', "Unable to assign right due to database error.");
		}
		
		$strGroupName = $oRightGroups->GetName($groupId);
		
		return $this->results->Set('true', "'$strGroupName' assigned to organization.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief Determines if the organization has the requested
				right/organization combination. This does a recursive check
				with all parent organizations up to All.
		\param org_info
				The organization id/name we're checking
		\param right_info
				The right id number/name
        \param right_org_info
        	-	the organizaiton we're using in the comparison
        	-	if strOrg equals -1 then we do not use the
        		organization in the comparison and use only
        		the user/right combination.
        	-   By setting this value we want to know if the
        			user has the right assigned to a specific organization
        			or its suborganizations.
        	-   the string name or the id of the organization is acceptable
		\return
	*/
	//--------------------------------------------------------------------------
	function OrgHasRight($org_info, $right_info, $right_org_info = -1)
	{
		$orgId = GetOrgID($org_info);
		$rightId = GetRightID($right_info);
		$rightOrgId = -1;

		if($orgId < 0)
		{
			return $this->results->Set('false', "Invalid organization.");
		}

		if($rightId < 0)
		{
			return $this->results->Set('false', "No access. Right does not exist.");
		}

		if($right_org_info != -1)
        {
        	if(strlen($right_org_info) > 0)
        	{
				$rightOrgId = GetOrgID($right_org_info);
	        	
	        	if($rightOrgId == -1)
	        	{
	       			return $this->results->Set('false', "No access. Organization does not exist.");
				}
			}
		}
		
		if(isset($this->arOrgs[$orgId][$rightId][$rightOrgId]))
		{
			return $this->arOrgs[$orgId][$rightId][$rightOrgId];
		}		

		$oRights = rights::GetInstance();
	    $oOrganization = organization::GetInstance();
	    $oRightGroups = rightGroup::GetInstance();

		/*
			Check against the user's individual rights first.
			$this->field_AccessType = 0	is individual rights
			$this->field_AccessType = 1	means a group
		*/
		
		$sql = "SELECT
					$this->field_AccessOrg
				FROM
					$this->table_Name
				WHERE
					$this->field_Account = $orgId
					AND
						$this->field_AccountType = $this->accountTypeOrg
					AND
						$this->field_Access = $rightId
					AND
						$this->field_AccessType = $this->accessTypeRight";
		
		$records = $this->db->Select($sql);
		
		if($rightOrgId == -1)
		{
			/*
				The organization is supposed to be ignored, which means we need to check that
				the user has the right, which means there is an explicit, user/right combination
				and we don't care what organization if any is assigned
			*/
			
			if(sizeof($records)  > 0)
			{
				$this->arOrgs[$orgId][$rightId][$rightOrgId] = true;
				return $this->results->Set('true', "Organization access granted. (Not checking against organizations).");
			}
		}
		else
		{
			/*
				-	Now gather the list of rights which match this request.
				-	We're looking for username/right combinations.
				-	From there we look through all of the organziations which may match this combination.
				-	One reason we're doing it this way is because someone could be assigned
					the right from the parent and could be assigned from the child.
					If the child is checked first and then the parent is not checked
					we could erroniously say the user doesn't have the right.
				-	If there's one record then the user has the right.
					If no record is found, then the user does not have the right.
			*/
			for($iOrgs = 0; $iOrgs < sizeof($records); $iOrgs++)
			{
				if($oOrganization->InChain($records[$iOrgs][$this->field_AccessOrg], $rightOrgId))
				{
					$this->arOrgs[$orgId][$rightId][$rightOrgId] = true;
					return $this->results->Set('true', "Organization access granted via right organization.");
				}
			}
		}
		/*
			Now check the user's groups.
			We don't care about what the right id is for this, because
			the right_id as it's used in the table now represents
			a group. Therefore, we look for all groups this
			user has assigned to them, and then look in each group
			for the rights assigned to that group.
			If the right/org combo is found in the group, we return true.
		*/
		unset($records);
		
		$sql = "SELECT
					$this->field_Access
				FROM
					$this->table_Name
				WHERE
					$this->field_AccessOrg = $orgId
					AND
						$this->field_AccessType = $this->accessTypeGroup";
		
		$records = $this->db->Select($sql);

		for($iGroup = 0; $iGroup < sizeof($records); $iGroup++)
		{
			if($oRightGroups->HasRight($records[$iGroup][$this->field_Access], $rightId, $rightOrgId))
			{
				$this->arOrgs[$orgId][$rightId][$rightOrgId] = true;
				return $this->results->Set('true', "Organization access granted via right group.");
			}
		}
		
		$orgParent = $oOrganization->GetParent($orgId);
		
		if(strlen($orgParent))
		{
			$this->arOrgs[$orgId][$rightId][$rightOrgId] = $this->OrgHasRight($orgParent, $rightId, $rightOrgId);
			return $this->arOrgs[$orgId][$rightId][$rightOrgId];
		}

		$this->arOrgs[$orgId][$rightId][$rightOrgId] = false;
		
		return $this->$this->results->Set('false', "Organization is not assigned this right.");
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
	function ValidateUser($user_info)
	{
		$oUser = cUserContainer::GetInstance();

		$userId = GetUserID($user_info);

		if($userId < 0)
		{
			$this->results->Set('false', "No user or invalid user selected for right management.");
			return -1;
		}
		
		if(!$oUser->IsActive($userId))
		{
			$this->results->Set('false', "Rights may not be assigned to inactive accounts.");
			return -1;
		}

		if($oUser->IsGuest($userId))
		{
			$this->results->Set('false', "Rights may not be assigned to accounts in the 'Guest' organization.");
			return -1;
		}
		
		$this->results->Set('true', "Valid user for rights management.");
		
		return $userId;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Assign a group to a user account.
	
		\param user_info
				The user name/id of the account which the right should be added to
		\param groupId
				The id of the group which is to be assigned
		\return
			-	true
					the group was assigned properly.
			-	false
					the group was not assigned properly.
	*/
	//--------------------------------------------------------------------------
	function AssignUserGroup($user_info, $groupId)
	{
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$oUser = cUserContainer::GetInstance();
		$oRightGroups = rightGroup::GetInstance();
		
		$adminId = $g_oUserSession->GetUserID();

		$userId = $this->ValidateUser($user_info);

		$groupId = GetRightGroupID($groupId);

		if($userId < 0)
		{
			return false;
		}

		if($adminId == $userId)
		{
			return $this->results->Set('false', "You may not assign rights or groups to yourself.");
		}		


		if(!$g_oUserSession->HasRight($oRights->SYSTEM_RightsAdmin, $oUser->GetOrganization($userId)))
		{
			return $this->results->Set('false', "You may not assign rights to others because you do not have the required right.");
		}
		
		if($groupId < 0)
		{
			return $this->results->Set('false', "Invalid group. Select a valid group.");
		}
		
		if($this->HasGroup($userId, $groupId))
		{
			return $this->results->Set('false', $this->results->GetMessage()." Duplicate assignment not allowed.");
		}
		
		/*
			Check to see if the admin has the right. If they do not, check to see if
			they have all the rights in the group. If they do, then they may assign
			the group.
		*/
		
		if(!$this->HasGroupAdmin($adminId, $groupId))
		{
			return $this->results->Set('false', "You are not assigned this group or have all of its rights and may not assign it to others.");
		}

		$arInsert = array();
		$arInsert[$this->field_Account] = $userId;
		$arInsert[$this->field_AccountType] = $this->accountTypeUser;
		
		$arInsert[$this->field_Access] = $groupId;
		$arInsert[$this->field_AccessOrg] = -1;
		$arInsert[$this->field_AccessType] = $this->accessTypeGroup;
			
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', "Unable to assign right due to database error.");
		}
		
		$strGroupName = $oRightGroups->GetName($groupId);
		
		return $this->results->Set('true', "'$strGroupName' assigned to '$user_info'.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief	This function determines if user account has the
				requested right/organization combination.
		\param user_info
				The user account id/name we're checking
		\param group_info
				The right id number/name
		\note
			The following rules apply:
    		-	if the account is disabled, return false
    		-	if the account is in the guest organization, return false
    		-	if the account is assigned the global admin right, return true
    		-	Otherwise, check that the requested right exists
	*/
	//--------------------------------------------------------------------------
	function HasGroup($user_info, $group_info)
	{

		$oRights = rights::GetInstance();
	    $oUser = cUserContainer::GetInstance();
	    $oOrganization = organization::GetInstance();
	    $oRightGroups = rightGroup::GetInstance();

		$groupId = GetRightGroupID($group_info);
		$userId = $this->ValidateUser($user_info);
		
		if($userId < 0)
		{
			return false;
		}

		if($groupId < 0)
		{
			return $this->results->Set('false', "Group does not exist.");
		}
		
		/*
			if the user has the global admin right then we assume they have the group
		*/
		$globalRightId = $oRights->SYSTEM_GlobalAdmin;
		
		$sql = "SELECT
					$this->field_AccessOrg
				FROM
					$this->table_Name
				WHERE
					$this->field_Account = $userId
					AND
						$this->field_Access = $globalRightId
					AND
						$this->field_AccessType = $this->accessTypeRight";
						
		$records = $this->db->Select($sql);
		
		if(sizeof($records) == 1)
		{
			return $this->results->Set('true', "User has group via global admin right.");
		}
		
		$sql = "SELECT
					$this->field_AccessOrg
				FROM
					$this->table_Name
				WHERE
					$this->field_Account = $userId
					AND
						$this->field_AccountType = $this->accountTypeUser
					AND
						$this->field_Access = $groupId
					AND
						$this->field_AccessType = $this->accessTypeGroup";
		
		$records = $this->db->Select($sql);
	
		if(sizeof($records)  > 0)
		{
			return $this->results->Set('true', "User is assigned to the group.");
		}
		
		return $this->results->Set('false', "User is not assigned this group.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief	This function determines if an organization account has the
				requested right/organization combination.
		\param org_info
				The user account id/name we're checking
		\param group_info
				The right id number/name
		\return
			-	true
				If the organization has the group
			-	false
				If the organization does not have the group
	*/
	//--------------------------------------------------------------------------
	function OrgHasGroup($org_info, $group_info)
	{
		$orgId = GetOrgID($org_info);
		$groupId = GetRightGroupID($group_info);
		
		if($orgId < 0)
		{
			return false;
		}

		if($groupId < 0)
		{
			return $this->results->Set('false', "Group does not exist.");
		}
		
		$sql = "SELECT
					$this->field_AccessOrg
				FROM
					$this->table_Name
				WHERE
					$this->field_Account = $orgId
					AND
						$this->field_AccountType = $this->accountTypeOrg
					AND
						$this->field_Access = $groupId
					AND
						$this->field_AccessType = $this->accessTypeGroup";
		
		$records = $this->db->Select($sql);
	
		if(sizeof($records)  > 0)
		{
			return $this->results->Set('true', "Group is assigned to the organization.");
		}
		
		return $this->results->Set('false', "Org is not assigned this group.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief Determines if the user account has the requested
				right/organization combination.
		\param user_info
				The account id/name we're checking
		\param right_info
				The right id number/name
        \param org_info
        	-	the organization we're using in the comparison
        	-	if strOrg equals -1 then we do not use the
        		organization in the comparison and use only
        		the user/right combination.
        	-   By setting this value we want to know if the
        			user has the right assigned to a specific organization
        			or its suborganizations.
        	-   the string name or the id of the organization is acceptable
		\return
		\note The following rules apply:
    		-	if the account is disabled, return false
    		-	if the account is in the guest organization, return false
    		-	if the account is in the AFU organization, return false
    		-	if the account is assigned the global admin right, return true
	*/
	//--------------------------------------------------------------------------
	function HasRight($user_info, $right_info, $org_info = -1)
	{
		$oRights = rights::GetInstance();
		
		$rightId = GetRightID($right_info);
		$orgId = -1;
		$oUserContainer = cUserContainer::GetInstance();
		
		$oUser = $oUserContainer->GetUser($user_info);

		if(!isset($oUser))
		{
			return $this->results->Set('false', "Unable to load user account.");
		}
		
		if(!$oUser->IsValid())
		{
			return $this->results->Set('false', "Account is disabled or guest and may not use rights system.");
		}
		 
		$userId = $oUser->GetID();

		if($rightId < 0)
		{
			return $this->results->Set('false', "No access. Right does not exist.");
		}

		if($oRights->RequiresOrg($rightId))
		{
			if(($org_info <> -1) && (strlen($org_info) > 0))
			{
				
				$orgId = GetOrgID($org_info);
				if($orgId == -1)
    	    	{
       				return $this->results->Set('false', "No access. Organization does not exist.");
				}
			}
		}

	    $oRightGroups = rightGroup::GetInstance();
	    $oOrganization = organization::GetInstance();

		/*
			If the user has the global admin right then don't check for the next right.
		*/
		
		$sql = "SELECT
					$this->field_AccessOrg
				FROM
					 $this->table_Name
				WHERE
					$this->field_Account = $userId
					AND
						$this->field_AccountType = $this->accountTypeUser
					AND
						$this->field_Access = $oRights->SYSTEM_GlobalAdmin
					AND
						$this->field_AccessType = $this->accessTypeRight";
		
		$records = $this->db->Select($sql);
		
		if(sizeof($records) == 1)
		{
			return $this->results->Set('true', "Access granted via global admin right.");
		}
		
		unset($records);
		
		/*
			Check against the user's individual rights first.
			$this->field_AccessType = 0	is individual rights
			$this->field_AccessType = 1	means a group
		*/
		
		$sql = "SELECT
					$this->field_AccessOrg
				FROM
					$this->table_Name
				WHERE
					$this->field_Account = $userId
					AND
						$this->field_AccountType = $this->accountTypeUser
					AND
						$this->field_Access = $rightId
					AND
						$this->field_AccessType = $this->accessTypeRight";
		
		$records = $this->db->Select($sql);
		
		if($orgId == -1)
		{
			/*
				The organization is supposed to be ignored, which means we need to check that
				the user has the right, which means there is an explicit, user/right combination
				and we don't care what organization if any is assigned
			*/
			
			if(sizeof($records)  > 0)
			{
				return $this->results->Set('true', "Access granted. (Not checking against organizations).");
			}
		}
		else
		{
			/*
				-	Now gather the list of rights which match this request.
				-	We're looking for username/right combinations.
				-	From there we look through all of the organziations which may match this combination.
				-	One reason we're doing it this way is because someone could be assigned
					the right from the parent and could be assigned from the child.
					If the child is checked first and then the parent is not checked
					we could erroniously say the user doesn't have the right.
				-	If there's one record then the user has the right.
					If no record is found, then the user does not have the right.
			*/
			for($iOrgs = 0; $iOrgs < sizeof($records); $iOrgs++)
			{
				if($oOrganization->InChain($records[$iOrgs][$this->field_AccessOrg], $orgId))
				{
					return $this->results->Set('true', "Access granted. Checking against organizations.");
				}
			}
		}
		/*
			Now check the user's groups.
			We don't care about what the right id is for this, because
			the right_id as it's used in the table now represents
			a group. Therefore, we look for all groups this
			user has assigned to them, and then look in each group
			for the rights assigned to that group.
			If the right/org combo is found in the group, we return true.
		*/
		unset($records);
		
		$sql = "SELECT
					$this->field_Access
				FROM
					$this->table_Name
				WHERE
					$this->field_Account = $userId
					AND
						$this->field_AccessType = $this->accessTypeGroup";
		
		$records = $this->db->Select($sql);

		for($iGroup = 0; $iGroup < sizeof($records); $iGroup++)
		{
			if($oRightGroups->HasRight($records[$iGroup][$this->field_Access], $rightId, $orgId))
			{
				return $this->results->Set('true', "Access granted via right group.");
			}
		}
		
		/*
			Now go through the user's organizations
		*/
	
		if($this->OrgHasRight($oUser->GetOrganization(), $rightId, $orgId))
		{
			return true;
		}
		
		$org = $oUser->GetOrganization();
		
		if(!is_numeric($right_info))
		{
			$rightName = $oRights->GetName($rightId);
		}
		else
		{
			$rightName = $right_info;
		}
		
		$userName = $oUser->GetName();
		
		$strReturnMessage = "'$userName' is not assigned '$rightName'";
		
		if($orgId > -1)
		{
			$strOrgName = $oOrganization->GetName($orgId);
			$strReturnMessage.=" for '$strOrgName'";
		}

		$strReturnMessage .= ".";
		
		return $this->results->Set('false', $strReturnMessage);
	}
	//--------------------------------------------------------------------------
	/**
		\brief Removes all rights assigned to a user
		\param user_info
				May be the user name or user id
		\return
			-	true
					All rights removed properly.
			-	false
					Some kind of problem removing rights. See results object.
	*/
	//--------------------------------------------------------------------------
	function RemoveAllRights($user_info)
	{
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$oUserContainer = cUserContainer::GetInstance();
		$oLog = cLog::GetInstance();
		
		$oUser = $oUserContainer->GetUser($user_info);
		
		if(!isset($oUser))
		{
			$oLog->log( $this->system_id, "Attempting to remove all rights of an invalid user account.", LOGGER_WARNING);
			return $this->results->Set('false', "Remove all rights: Invalid user info.");
		}
		
		$userId = $oUser->GetID();
		$orgId = $oUser->GetOrganization();
		$strUser = $oUser->GetName();

		/*
			First, check to see if the user has the RightsAdmin.
			If not, this is for naught.
			If the user has the right, see if they have it
			for the organization.
			If they don't
		*/
		if(!$g_oUserSession->HasRight($oRights->SYSTEM_RightsAdmin))
		{
			$oLog->log( $this->system_id, "Attempted to remove all of $strUser's rights without required right.", LOGGER_SECURITY);
			return $this->results->Set('false', "Admin does not have correct right to remove other rights.");
		}
		
		if(($orgId != GetOrgID("Guest")) && ($orgId != GetOrgID("AFU")))
		{
			if(!$g_oUserSession->HasRight($oRights->SYSTEM_RightsAdmin, $orgId))
			{
				$oLog->log( $this->system_id, "Attempted to remove all of $strUser's rights without required right.", LOGGER_SECURITY);
				return $this->results->Set('false', "Admin does not have correct right to remove other rights.");
			}
		}
		
		$arWhere = array();
		$arWhere[$this->field_Account] = $userId;
	
		if($this->db->delete($this->table_Name, $arWhere) < 0)
		{
			return $this->results->Set('false', "Unable to remove right due to database error. ". $this->db->results->GetMessage());
		}

		$oLog->log( $this->system_id, "Removed all of '$strUser's rights.");
		
		return $this->results->Set('true', "Rights removed.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief Removes a right from a user
		\param right_info
				The id of the record in the assigned right table which corresponds
				the record the user wants to delete. This id/name is different
				than a right id.
		\return
			-	true
					All rights removed properly.
			-	false
					Some kind of problem removing rights. See results object.
		\note This is different than removing a right from the system
	*/
	//--------------------------------------------------------------------------
	function RemoveRight($right_info)
	{
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$oUser = cUserContainer::GetInstance();
		
		if(!is_numeric($right_info))
		{
			return $this->results->Set('false', "Invalid right selected for removal.");
		}
				
		$arRight = $this->db->Select("SELECT
									*
								FROM
									$this->table_Name
								WHERE
									$this->field_Id = $right_info");
		
		if(sizeof($arRight) != 1)
		{
			return $this->results->Set('false', "Invalid assigned right submitted.");
		}
		
		$accountId = $arRight[0][$this->field_Account];
		$accountType = $arRight[0][$this->field_AccountType];
				
		$rightId = $arRight[0][$this->field_Access];
		$orgId = $arRight[0][$this->field_AccessOrg];

		$adminId = $g_oUserSession->GetUserID();

		if($accountType == $this->accountTypeUser)
		{
			if($adminId == $accountId)
			{
				return $this->results->Set('false', "You may not remove rights or groups from yourself.");
			}

			if(!$g_oUserSession->HasRight($oRights->SYSTEM_RightsAdmin,$oUser->GetOrganization($accountId)))
			{
				return $this->results->Set('false', "Admin does not have correct right to remove other rights.");
			}
		}

		if(!$g_oUserSession->HasRight($rightId, $orgId))
		{
			return $this->results->Set('true', "You may not remove this right. Acquire the right and try again.");
		}
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $right_info;
	
		if(!$this->db->delete($this->table_Name, $arWhere))
		{
			return $this->results->Set('false', "Unable to remove right due to database error.");
		}
		
		return $this->results->Set('true', "Right properly removed.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Checks to see if the user has the administrative ability for this
			group.
			-	They must have the SYSTEM_RightsAdmin right for the
				organization the group is in
			-	They must have the group or all of the rights in the group
				to be able to assign this right.
		\param user_info
		\param group_info
		\return
			- true The user has the right group or all rights in the group
					assigned
			- false The user does not have the group or all of the rights
					assigned
	*/
	//--------------------------------------------------------------------------
	function HasGroupAdmin($user_info, $group_info)
	{
		global $g_oUserSession;

		$oRightGroups = rightGroup::GetInstance();
		$oRights = rights::GetInstance();

		$userId = GetUserID($user_info);
		$groupId = GetRightGroupID($group_info);

		$arGroup = $oRightGroups->Get($groupId);

		if(!$g_oUserSession->HasRight($oRights->SYSTEM_RightsAdmin, GetOrgID($arGroup[$this->field_AccessOrg])))
		{
			return false;
		}

		if(!$this->HasGroup($userId, $groupId))
		{
			/*
				The user doesn't have the group. See if the user
				has all of the rights in the group. If they do, they may assign
				the group.
			*/
			$arAssignedRights = $oRightGroups->GetRights($groupId);
			
			if(!isset($arAssignedRights))
			{
				/*
					The right is is one of the admin's organizations, but the
					group has no rights. Give the user the access as the admin
				*/
				return true;
			}
		
			foreach($arAssignedRights as $right)
			{
				if(!$this->HasRight($userId, $right['right_Name'], $right['org_Short_Name']))
				{
					return false;
				}
			}
		}

		return true;

	}
	//--------------------------------------------------------------------------
	/**
		\brief Removes a group assigned to a user.
		\note this is different than removing a right from the system which
			is located in the rights object
		
		\param assignedGroup_info
				The id of the record in the assigned right table which
				corresponds the record the user wants to delete
		\return
			-	true if the group was removed properly.
			-	false if the group was not removed properly.
	*/
	//--------------------------------------------------------------------------
	function RemoveGroup($assignedGroup_info)
	{
		global $g_oUserSession;
		
		$oRightGroups = rightgroup::GetInstance();
		$oRights = rights::GetInstance();
		$oUser = cUserContainer::GetInstance();

		$adminId = $g_oUserSession->GetUserID();
		
		if(!is_numeric($assignedGroup_info))
		{
			return $this->results->Set('false', "Invalid group selected for removal.");
		}
				
		$arRight = $this->db->Select("SELECT *
								FROM
									$this->table_Name
								WHERE
									$this->field_Id = $assignedGroup_info
									AND
										$this->field_AccessType = $this->accessTypeGroup");
		
		if(sizeof($arRight) != 1)
		{
			return $this->results->Set('false', "Invalid assigned group submitted[$assignedGroup_info].");
		}
		
		$accountId = $arRight[0][$this->field_Account];
		$accountType = $arRight[0][$this->field_AccountType];
		$groupId = $arRight[0][$this->field_Access];

		if($accountType == $this->accountTypeUser)
		{
			if($adminId == $accountId)
			{
				return $this->results->Set('false', "You may not remove groups from yourself.");
			}
		}
		
		if(!$this->HasGroupAdmin($adminId, $groupId))
		{
			return $this->results->Set('false', "Admin does not have correct right group access to manage this right group.");
		}
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $assignedGroup_info;
	
		if(!$this->db->delete($this->table_Name, $arWhere))
		{
			return $this->results->Set('false', "Unable to remove group due to database error.");
		}
		
		return $this->results->Set('true', "Group properly removed.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves the name of rights assigned to the calling user.
			These are the rights the user may assign to others.
		\param user_info
			May be the user name or the user id.
		\return
			An array of rights assigned to the user.
			If the user id is invalid an empty list will be submitted.
	*/
	//--------------------------------------------------------------------------
	function GetUserAssignedRights($user_info)
	{
		/*
			-	This sql string finds all rights assigned to the admin user (the user
				whom this PHP session is created for) and then from that list
				finds which rights are assigned to the user.
		*/
		global $g_oUserSession;

		$userId = GetUserID($user_info);
		
		if($userId < 0)
		{
			$this->results->Set('false', "Invalid user name.");
			return null;
		}
	
		/*
			This here because we do not want a user who connects
			to the system without an id to be able to grab this
			list.
		*/
		$adminId = $g_oUserSession->GetUserID();
		
		if($adminId < 0)
		{
			$this->results->Set('false', "Invalid admin id.");
			return null;
		}
		
		/*
			-	Things get complicated here.
				We have to cycle through every right the user
				has to make sure the admin has the right assigned to them.
				Things are complicated because the admin may have the right,
				but they may only have a portion of the organization list.
				For example. Admin has DMS_Admin for ETS, the user has
				DMS_Admin for STO. The admin can not modify this right,
				and the right will not be displayed.
		*/
		
		$strSQL = "SELECT
						tblRight.right_Name
						, tblOrganization.org_Short_Name
						, tblAssignedRights.aRight_ID
						, tblRight.right_Description
					FROM
						tblAssignedRights
						LEFT JOIN
							tblRight ON tblAssignedRights.$this->field_Access = tblRight.right_ID
							LEFT JOIN
								tblOrganization ON tblAssignedRights.$this->field_AccessOrg = tblOrganization.$this->field_AccessOrg
					WHERE
						tblAssignedRights.$this->field_Account = $userId
						AND
							tblAssignedRights.$this->field_AccountType = $this->accountTypeUser
						AND
							$this->field_AccessType = $this->accessTypeRight
							ORDER BY tblRight.right_Name";

		$records = $this->db->Select($strSQL);

		$arRights = array();
		
		foreach($records as $right)
		{
			/*
				-	If the user has the right, then add it to the array
			*/
			$addRight = array();
			$addRight[$this->field_Id] = $right[$this->field_Id];
			$addRight['right_Name'] = $right['right_Name'];
			$addRight['org_Short_Name'] = $right['org_Short_Name'];
			$addRight['right_Description'] = $right['right_Description'];
			$addRight['may_assign'] = 0;
			
			if($g_oUserSession->HasRight($right['right_Name'], $right['org_Short_Name']))
			{
				$addRight['may_assign'] = 1;
			}
			$arRights[] = $addRight;
		}
		return $arRights;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves the name of the rights assigned to the passed in
			organization.
		\param org_info
			May be the organization name or id.
		\return
			An array of rights assigned to the user.
			If the organization is invalid an empty list will be returned.
	*/
	//--------------------------------------------------------------------------
	function GetOrgAssignedRights($org_info)
	{
		/*
			-	This sql string finds all rights assigned to the admin user (the user
				whom this PHP session is created for) and then from that list
				finds which rights are assigned to the user.
		*/
		global $g_oUserSession;

		$orgId = GetOrgID($org_info);
		
		if($orgId < 0)
		{
			$this->results->Set('false', "Invalid organization.");
			return null;
		}
	
		/*
			This here because we do not want a user who connects
			to the system without an id to be able to grab this
			list.
		*/
		$adminId = $g_oUserSession->GetUserID();
		
		if($adminId < 0)
		{
			$this->results->Set('false', "Invalid admin id.");
			return null;
		}
		
		/*
			-	Things get complicated here.
				We have to cycle through every right the user
				has to make sure the admin has the right assigned to them.
				Things are complicated because the admin may have the right,
				but they may only have a portion of the organization list.
				For example. Admin has DMS_Admin for ETS, the user has
				DMS_Admin for STO. The admin can not modify this right,
				and the right will not be displayed.
		*/
		
		$strSQL = "SELECT
						tblRight.right_Name
						, tblOrganization.org_Short_Name
						, tblAssignedRights.aRight_ID
						, tblRight.right_Description
					FROM
						tblAssignedRights
						LEFT JOIN
							tblRight ON tblAssignedRights.$this->field_Access = tblRight.right_ID
							LEFT JOIN
								tblOrganization ON
								tblAssignedRights.$this->field_AccessOrg = tblOrganization.org_ID
					WHERE
						tblAssignedRights.$this->field_Account = $orgId
						AND
							tblAssignedRights.$this->field_AccountType = $this->accountTypeOrg
						AND
							$this->field_AccessType = $this->accessTypeRight
							ORDER BY tblRight.right_Name";

		$records = $this->db->Select($strSQL);

		$arRights = array();
		
		foreach($records as $right)
		{
			/*
				-	If the user has the right, then add it to the array
			*/
			$addRight = array();
			$addRight[$this->field_Id] = $right[$this->field_Id];
			$addRight['right_Name'] = $right['right_Name'];
			$addRight['org_Short_Name'] = $right['org_Short_Name'];
			$addRight['right_Description'] = $right['right_Description'];
			$addRight['may_assign'] = 0;
			
			if($g_oUserSession->HasRight($right['right_Name'], $right['org_Short_Name']))
			{
				$addRight['may_assign'] = 1;
			}
			$arRights[] = $addRight;
		}
		return $arRights;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves an XML list of right groups assigned to an account.
		\param user_info
				May be the account user name or the account id.
		\return
			an XML list which contains the list of rights assigned to the user.
		
		\note The returned list will be empty if user_info is invalid
				or there is some kind of problem.
	*/
	//--------------------------------------------------------------------------
	function GetUserAssignedGroups($user_info)
	{
		/*
			-	This sql string finds all rights assigned to the admin user (the user
				whom this PHP session is created for) and then from that list
				finds which rights are assigned to the user.
		*/
		global $g_oUserSession;

		$userId = GetUserID($user_info);
		
		if($userId < 0)
		{
			$this->results->Set('false', "Invalid user name.");
			return null;
		}
	
		$adminId = $g_oUserSession->GetUserID();
		
		if($adminId < 0)
		{
			$this->results->Set('false', "Invalid admin id.");
			return null;
		}
		
		/*
			-	Things get complicated here.
				We have to cycle through every right the user
				has to make sure the admin has the right assigned to them.
				Things are complicated because the admin may have the right,
				but they may only have a portion of the organization list.
				For example. Admin has DMS_Admin for ETS, the user has
				DMS_Admin for STO. The admin can not modify this right,
				and the right will not be displayed.
		*/
		$strSQL = 	"SELECT
						tblRightGroup.rightGroup_Name
						, tblRightGroup.rightGroup_Description
						, tblRightGroup.rightGroup_ID
						, tblAssignedRights.aRight_ID
						, tblOrganization.org_Short_Name
					FROM
						tblAssignedRights
						LEFT JOIN
							tblRightGroup
							ON
								tblAssignedRights.$this->field_Access = tblRightGroup.rightGroup_ID
						LEFT JOIN
							tblOrganization
							ON
								tblRightGroup.org_ID = tblOrganization.org_ID
					WHERE
						tblAssignedRights.$this->field_Account = $userId
						AND
							tblAssignedRights.$this->field_AccountType = $this->accountTypeUser
						AND
							tblAssignedRights.$this->field_AccessType = $this->accessTypeGroup";

		$records = $this->db->Select($strSQL);
		
		if(!isset($records))
		{
			return null;
		}

		$arRights = array();
				
		foreach($records as $right)
		{
			/*
				-	If the user has the right, then add it to the array
			*/
			$addRight = array();
			$addRight['rightGroup_Name'] = $right['rightGroup_Name'];
			$addRight[$this->field_Id] = $right[$this->field_Id];
			$addRight['rightGroup_ID'] = $right['rightGroup_ID'];
			$addRight['rightGroup_Description'] = $right['rightGroup_Description'];
			$addRight['org_Short_Name'] = $right['org_Short_Name'];
			$addRight['may_assign'] = 0;
			
			if($this->HasGroupAdmin($adminId, $right['rightGroup_ID']))
			{
				$addRight['may_assign'] = 1;
			}
	
			$arRights[] = $addRight;
		}
		
		return $arRights;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves all explicitly defined organizations assigned for
			this right explicitly (excludes global admin) to
			users and organizations.
			
		\note
			This works with explictly defined rights. Currently it does not
			work with rights which are assigned to groups.
		\param right_info
			The right to check
		\return
			An array of elements
	*/
	//--------------------------------------------------------------------------
	function GetRightOrgs($right_info)
	{
		
		$rightId = GetRightID($right_info);
		
		if($rightId < 0)
		{
			$this->results->Set('false', "Invalid right submitted.");
			return null;
		}

		$strSQL = "
					SELECT DISTINCT
						$this->table_Name.org_ID,
						tblOrganization.org_Short_Name
					FROM
						$this->table_Name
						LEFT JOIN
							tblOrganization ON tblOrganization.org_ID = $this->table_Name.org_ID
					WHERE
						$this->field_Access = $rightId
						AND 
						$this->field_AccessType = $this->accessTypeRight
						AND
						$this->field_AccountType = $this->accountTypeUser
						AND
						$this->table_Name.org_ID <> -1
					";

		$arResults = $this->db->Select($strSQL);

		return $arResults;
		
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves an array of right groups assigned to an organization.
		\param org_info
				May be the organization name or id.
		\return
			an array containing the list of right groups
			assigned to the organization.
		
		\note The returned list will be empty if org_info is invalid
				or there is some kind of problem.
	*/
	//--------------------------------------------------------------------------
	function GetOrgAssignedGroups($org_info)
	{
		/*
			-	This sql string finds all rights assigned to the admin user (the user
				whom this PHP session is created for) and then from that list
				finds which rights are assigned to the user.
		*/
		global $g_oUserSession;

		$orgId = GetOrgID($org_info);
		
		if($orgId < 0)
		{
			$this->results->Set('false', "Invalid organization name.");
			return null;
		}
	
		$adminId = $g_oUserSession->GetUserID();
		
		if($adminId < 0)
		{
			$this->results->Set('false', "Invalid admin id.");
			return null;
		}
		
		/*
			-	Things get complicated here.
				We have to cycle through every right the user
				has to make sure the admin has the right assigned to them.
				Things are complicated because the admin may have the right,
				but they may only have a portion of the organization list.
				For example. Admin has DMS_Admin for ETS, the user has
				DMS_Admin for STO. The admin can not modify this right,
				and the right will not be displayed.
		*/
		
		$strSQL = 	"SELECT
						tblRightGroup.rightGroup_Name
						, tblRightGroup.rightGroup_Description
						, tblRightGroup.rightGroup_ID
						, tblAssignedRights.aRight_ID
						, tblOrganization.org_Short_Name
					FROM
						tblAssignedRights
						LEFT JOIN
							tblRightGroup
							ON
								tblAssignedRights.$this->field_Access = tblRightGroup.rightGroup_ID
						LEFT JOIN
							tblOrganization
							ON
								tblRightGroup.org_ID = tblOrganization.org_ID
					WHERE
						tblAssignedRights.$this->field_Account = $orgId
						AND
							tblAssignedRights.$this->field_AccountType = $this->accountTypeOrg
						AND
							$this->field_AccessType = $this->accessTypeGroup";
		
		$records = $this->db->Select($strSQL);

		$arRights = array();
		
		foreach($records as $right)
		{
			/*
				-	If the org has the right, then add it to the array
				-	At the end we'll do a raw XML dump
			*/
			$addRight = array();
			$addRight['rightGroup_Name'] = $right['rightGroup_Name'];
			$addRight[$this->field_Id] = $right[$this->field_Id];
			$addRight['rightGroup_ID'] = $right['rightGroup_ID'];
			$addRight['rightGroup_Description'] = $right['rightGroup_Description'];
			$addRight['org_Short_Name'] = $right['org_Short_Name'];
			$addRight['may_assign'] = 0;
			
			if($this->HasGroupAdmin($adminId, $right['rightGroup_ID']))
			{
				$addRight['may_assign'] = 1;
			}
	
			$arRights[] = $addRight;
		}
		
		return $arRights;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves the name of rights assigned to the calling user.
			These are the rights the user may assign to others.
		\param user_info
			May be the user name or the user id.
		\return
			An array of rights assigned to the user.
			If the user id is invalid an empty list will be submitted.
	*/
	//--------------------------------------------------------------------------
	function GetAllUserAssigned($user_info)
	{
		/*
			-	This sql string finds all rights assigned to the admin user (the user
				whom this PHP session is created for) and then from that list
				finds which rights are assigned to the user.
		*/
		global $g_oUserSession;
		$oRightGroups = rightGroup::GetInstance();
		$oUser = cUserContainer::GetInstance();
		$oOrg = organization::GetInstance();
		$arUserRights = Array();

		$userId = GetUserID($user_info);
		
		if($userId < 0)
		{
			$this->results->Set('false', "Invalid user name.");
			return null;
		}
	
		/*
			This is here because we do not want a user who connects
			to the system without an id to be able to grab this
			list.
		*/
		$adminId = $g_oUserSession->GetUserID();
		
		if($adminId < 0)
		{
			$this->results->Set('false', "Invalid admin id.");
			return null;
		}

		/*
			user Rights
		*/
		$arRights = $this->GetUserAssignedRights($userId);
		
		foreach($arRights as $right)
		{
			$right['source'] = "User assigned right";
			
			$arUserRights[] = $right;
		}

		/*
			user Groups
		*/
		$arGroups = $this->GetUserAssignedGroups($userId);
		
		foreach($arGroups as $group)
		{
			$arRights = $oRightGroups->GetRights($group['rightGroup_ID']);
	
			foreach($arRights as $right)
			{
				$right['source'] = "User assigned group '" . $group['rightGroup_Name']."'";
				$arUserRights[] = $right;
			}
		}
		
		/*
			Organizations
		*/
		
		$arOrgRights = $this->GetAllOrgAssigned($oUser->GetOrganization($userId));

		$arRights = array_merge($arOrgRights, $arUserRights);

		return $arRights;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves the name of all rights assigned to the passed in organization.
		\param org_info
			May be the organization name or the organization id.
		\return
			An array of rights assigned to the organization.
	*/
	//--------------------------------------------------------------------------
	function GetAllOrgAssigned($org_info)
	{
		global $g_oUserSession;
		
		$oRightGroups = rightGroup::GetInstance();
		$oOrg = organization::GetInstance();
		$arRights = Array();
		$orgId = GetOrgID($org_info);

		$arOrgRights = Array();
		
		while($orgId > -1)
		{
			$arOrg = $oOrg->Get($orgId);
			
			/*
				Org Rights
			*/
			$arRights = $this->GetOrgAssignedRights($orgId);
			
			foreach($arRights as $right)
			{
				$right['source'] = "Org '".$arOrg['org_Short_Name']."' assigned right";
				$arOrgRights[] = $right;
			}
			
			/*
				Org Groups
			*/			
			$arGroups = $this->GetOrgAssignedGroups($orgId);
		
			foreach($arGroups as $group)
			{
				$arRights = $oRightGroups->GetRights($group['rightGroup_ID']);
		
				foreach($arRights as $right)
				{
					$right['source'] = "Org '".$arOrg['org_Short_Name']."' assigned group [". $group['rightGroup_Name']."]";
					$arOrgRights[] = $right;
				}
			}
			$orgId = $oOrg->GetParent($orgId);
		}
		
		return $arOrgRights;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves the name of rights assigned to the calling user.
			These are the rights the user may assign to others.
		\param user_info
			The user account to check against assigned rights
		\return
				An XML list of assigned rights
	*/
	//--------------------------------------------------------------------------
	function GetOwnerAssigned($user_info)
	{
		/*
			-	This sql string finds all rights assigned to the admin user (the user
				whom this PHP session is created for) and then from that list
				finds which rights are assigned to the user.
		*/
		$oUser = cUserContainer::GetInstance();
		$oRight = rights::GetInstance();
		$userId = GetUserID($user_info);

		if($userId < 0)
		{
			return $this->results->Set('false', "Invalid user name.");
		}
		
		if($this->HasRight($userId, $oRight->SYSTEM_GlobalAdmin))
		{
			$strSQL = "SELECT
							tblRight.right_Name,
							tblRight.right_ID,
							tblRight.right_UseOrg
						FROM
							tblRight";
		}
		else
		{
			$strSQL = "
				SELECT
					tblRight.right_ID,
					tblRight.right_Name,
					tblRight.right_UseOrg
				FROM
					tblRight
				WHERE
					tblRight.right_ID
					IN
					(
						SELECT
							$this->field_Access
						FROM
							tblAssignedRights
						WHERE
							$this->field_Account = $userId
							AND
								$this->field_AccountType = $this->accountTypeUser
							AND
								$this->field_AccessType = $this->accessTypeRight
					)
					ORDER BY tblRight.right_Name";
		}
		
		OutputXMLList($strSQL, "list", "element");
		return true;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieve an array of users and organizations which have
			this group assigned.
		\param group_info
			The id of the group which should be checked.
		\return
			an array containing the users and organizations assigned
			this group.
	*/
	//--------------------------------------------------------------------------
	function GetRightGroupAssigned($group_info)
	{
		/*
			-	This sql string finds all rights assigned to the admin user (the user
				whom this PHP session is created for) and then from that list
				finds which rights are assigned to the user.
		*/
		$oUser = cUserContainer::GetInstance();
		$oRight = rights::GetInstance();
		
		$groupId = GetRightGroupID($group_info);

		if($groupId < 0)
		{
			$this->results->Set('false', "Invalid right group.");
			return null;
		}
		
		/*
			First, grab users
		*/
		
		$strSQL = "
				SELECT
					user_Name AS account_Name
					, tblOrganization.org_Short_Name
					, tblAssignedRights.account_type
				FROM
					tblAssignedRights
					LEFT JOIN tblUser ON tblUser.user_ID = tblAssignedRights.account_ID
					LEFT JOIN
						tblOrganization ON tblUser.org_ID = tblOrganization.org_ID
				WHERE
					account_type = $this->accountTypeUser
					AND
					access_type = $this->accessTypeGroup
					AND
					access_ID = $groupId";
					
		$arUsersResults = $this->db->Select($strSQL);
	
		/*
			Now grab organizations
		*/
		
		$strSQL = "
				SELECT
					org_Short_Name AS account_Name
					, org_Long_Name
					, tblAssignedRights.account_type
				FROM
					tblAssignedRights
					LEFT JOIN tblOrganization ON tblOrganization.org_ID = tblAssignedRights.account_ID
				WHERE
					account_type = $this->accountTypeOrg
					AND
					access_type = $this->accessTypeGroup
					AND
					access_ID = $groupId";
					
		$arOrgResults = $this->db->Select($strSQL);

		$arResults = array_merge($arUsersResults, $arOrgResults);

		return $arResults;	
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieve available and assigned rights filtered through the
			logged in user's assigned rights.
			-	The purpose of this is to prevent users from assigning rights
			they do not have assigned to them.
		\param userName
			The name of the user whose rights we're retrieving.
			
		\return XML data
	*/
	//--------------------------------------------------------------------------
	function GetAdminAvailable($userName)
	{
		/*
			-	This sql string finds all rights assigned to the admin user (the user
				whom this PHP session is created for) and then from that list
				finds which rights are assigned to the user.
		*/
		$user = cUserContainer::GetInstance();
		global $g_oUserSession;
	
		$adminId = $g_oUserSession->GetUserID();
		$userId = $user->GetID($userName);

		if($userId < 0)
		{
			return $this->results->Set('false', "Invalid user name.");
		}
		
		if($adminId < 0)
		{
			return $this->results->Set('false', "Invalid admin id.");
		}
		
		$strSQL = "
			SELECT
				tblRight.right_Name
				, tblRightCategory.rightCat_Name
			FROM
				tblRight
					LEFT JOIN tblRightCategory ON tblRight.rightCat_ID = tblRightCategory.rightCat_ID
			WHERE
				tblRight.right_ID
				IN
				(
					SELECT
						$this->field_Access
					FROM
						tblAssignedRights
					WHERE
						$this->field_Account = $adminId
					AND
						$this->field_AccessType = $this->accessTypeRight
				)
				AND tblRight.right_ID NOT IN
				(
					SELECT
						$this->field_Access
					FROM
						tblAssignedRights
					WHERE
						$this->field_Account = $userId
					AND
						$this->field_AccessType = $this->accessTypeRight
				)";
		
		OutputXMLList($strSQL, "rightsList", "availableRight");
		return true;	
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves the groups this user may admistrate, ie. modify/delete.
		\param user_info
			The name or id of the user who's groups we're retrieving.
		\return an array containing the groups which the user
				may modify
	*/
	//--------------------------------------------------------------------------
	function GetAdminGroups($user_info)
	{
		/*
			The process of this functions works as the following:
			
			-	Retrieve the user's SYSTEM_RightsAdmin organizations.
			-	Retrieve all groups which are owned by those organizations.
			-	Validate that the user may assign those groups
		*/

		$oRights = rights::GetInstance();
		$oRightGroups = rightGroup::GetInstance();
		global $g_oUserSession;
		
		$arGroups = array();
		$arChecked = array();
		
		$arOrgs = $this->GetRightAssignedOrgs($user_info, $oRights->SYSTEM_RightsAdmin);
		
		if($arOrgs == null)
		{
			return null;
		}
			
		foreach($arOrgs as $org)
		{
			$arResults = $oRightGroups->GetRightGroupList($org[$this->field_AccessOrg]);

			for($j = 0; $j < sizeof($arResults); $j++)
			{
				if(!isset($arChecked[$arResults[$j]['rightGroup_ID']]))
				{
					if($this->HasGroupAdmin($user_info, $arResults[$j]["rightGroup_ID"]))
					{
						$arGroups[] = $arResults[$j];
					}
					$arChecked[ $arResults[$j]['rightGroup_ID'] ] = true;
				}
			}
		}
		
		return $arGroups;	
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieve all organizations the user has assigned to this right
		\param user_info
			May be the user id or the user name
		\param right_info
			The right we're grabbing from the system to retrieve all
			organizations assigned to that right.
		\param bExplicit
			Set to true if only the explicitly defined organization should
			be returned.
			For example. If a user has 2 
		\return
			An array of organizations and child organizations assigned to the 
			user. May return null if no organizations are assigned
			to this right. May return null if invalid variables are passed in.
	*/
	//--------------------------------------------------------------------------
	function GetRightAssignedOrgs($user_info, $right_info, $bExplicit = false)
	{
		$oUser = cUserContainer::GetInstance();
		$oOrg = organization::GetInstance();

		/*
			Gather all organizations assigned to the user via rights or groups
		*/
		
		$arOrganizations = $this->GetAssignedOrgs($user_info, $this->accountTypeUser, $right_info);

		if($arOrganizations ==null)
		{
			$arOrganizations = Array();
		}
		/*
			Now get all organizations of the right which may
			be assigned to the user's organization and its parents
		*/
		$strOrganization = $oUser->GetOrganization($user_info);
		
		$orgId = GetOrgID($strOrganization);

		while($orgId > -1)
		{
			$arOrgs = $this->GetAssignedOrgs($orgId, $this->accountTypeOrg, $right_info);

			if(isset($arOrgs))
			{
				$arOrganizations = array_merge($arOrganizations, $arOrgs);
			}
			
			$orgId = $oOrg->GetParent($orgId);
		}
		
		$arOrganizations = array_unique($arOrganizations);
		$firstTime = true;
		
		$strSQL = "SELECT org_ID, org_Short_Name FROM tblOrganization WHERE ";

		foreach($arOrganizations as $org)
		{
			if($firstTime == false)
			{
				$strSQL.=" OR";
			}
			
			$firstTime = false;
			$strSQL .= " org_ID = " . $org;
		}
		
		$strSQL .= " ORDER BY org_Short_Name";
			
		if(sizeof($arOrganizations))
		{
			return $this->db->select($strSQL);
		}
		
		return null;	
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieve organizations the user has assigned to this right
		\param account_info
			Depending upon the account_type this may be one of the following:
				a username/user id
				an organization/ organization id
		\param account_type
			The account type. May be a user or an organization
			Use the following defines:
				accountTypeUser
				accountTypeOrg
		\param right_info
			The right we're grabbing from the system to retrieve all
			organizations assigned to that right.
		\return
			An array of organizations assigned to the user with
			this right may return null if no organizations are assigned
			to this right may return null if invalid variables are passed in.
	*/
	//--------------------------------------------------------------------------
	function GetAssignedOrgs($account_info, $account_type, $right_info)
	{		
		$oOrganization = organization::GetInstance();
		$oUser = cUserContainer::GetInstance();
		$oRights = rights::GetInstance();
		$accountId = 0;
		
		$arOrganizations = array();
		
		if($account_type == $this->accountTypeUser)
		{
			$accountId = GetUserID($account_info);
			
			if($this->HasRight($accountId, $oRights->SYSTEM_GlobalAdmin))
			{
				$retChildren = $oOrganization->GetChildren(-1);

				foreach($retChildren as $arOrg)
				{
					if (!in_array($arOrg[$this->field_AccessOrg], $arOrganizations))
					{
						$arOrganizations[] = $arOrg[$this->field_AccessOrg];
					}
				}
			}
		}
		else if($account_type == $this->accountTypeOrg)
		{
			$accountId = GetOrgID($account_info);
		}
		else
		{
			return null;
		}

		if($accountId < 0)
		{
			return null;
		}

		$rightId = GetRightID($right_info);

		if($rightId < 0)
		{
			return null;
		}
	
		/*
			Now gather all of the references for this right which are assigned to the user
		*/
		
		$strSQL = "SELECT
						$this->field_AccessOrg
					FROM
						tblAssignedRights
					WHERE
						$this->field_Account = $accountId
						AND
							$this->field_AccountType = $account_type
						AND
							$this->field_Access = $rightId
						AND
							$this->field_AccessType = $this->accessTypeRight";
		
		$records = $this->db->Select($strSQL);

		/*
			Add the list of organizations to the org array
		*/
		for($i = 0; $i < sizeof($records); $i++)
		{
			if (!in_array($records[$i][$this->field_AccessOrg], $arOrganizations))
			{
				$arOrganizations[] = $records[$i][$this->field_AccessOrg];
			
				$retChildren = $oOrganization->GetChildren($records[$i][$this->field_AccessOrg]);
			
				for($j = 0; $j < sizeof($retChildren); $j++)
				{
					if (!in_array($retChildren[$j][$this->field_AccessOrg], $arOrganizations))
					{
						$arOrganizations[] = $retChildren[$j][$this->field_AccessOrg];
					}
				}
			}
		}
		
		
		//die();
		
		/*
			Now go through all of the groups assigned to this user
		*/
		$strSQL = "
					SELECT
						$this->field_Access
					FROM
						tblAssignedRights
					WHERE
						$this->field_Account = $accountId
						AND
							$this->field_AccountType = $account_type
						AND
							$this->field_AccessType = $this->accessTypeGroup";

		$arGroups = $this->db->Select($strSQL);

		/*
			Cycle through all of the groups.
			Each group may have multiple instances of the right we're
			searching for so we have to inspect each one.
			From there, we add any organizations whih have not all ready
			been added to the list.
		*/
		for($i = 0; $i < sizeof($arGroups); $i++)
		{
			$rightGroup_ID = $arGroups[$i][$this->field_Access];
			
			$strSQL = "
					SELECT
						right_ID,
						org_ID
					FROM
						tblRightGroupDetails
					WHERE
						rightGroup_ID = $rightGroup_ID
						AND
							right_ID = $rightId";
			
			$arGroupRights = $this->db->Select($strSQL);
			
			for($iGroupRight = 0; $iGroupRight < sizeof($arGroupRights); $iGroupRight++)
			{
				if (!in_array($arGroupRights[$iGroupRight][$this->field_AccessOrg], $arOrganizations))
				{
					/*
						This org subtree is not in the list of organizations. We need
						to add it.
					*/
					$arOrganizations[] = $arGroupRights[$iGroupRight][$this->field_AccessOrg];
					
					$retChildren = $oOrganization->GetChildren($arGroupRights[$iGroupRight][$this->field_AccessOrg]);
					
					for($j = 0; $j < sizeof($retChildren); $j++)
					{
						if (!in_array($retChildren[$j][$this->field_AccessOrg], $arOrganizations))
						{
							$arOrganizations[] = $retChildren[$j][$this->field_AccessOrg];
						}
					}
				}
			}
		}

		/*
			Now build the list of organizations
		*/
		return $arOrganizations;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
				Returns an array of all users with the passed in right.
		\param right_info
			The right to check
		\param org_info
				The organization assigned to this right
		\return
			XML list
		
		\note
			- Only returns active users.
			- Results are ordered by username.
	*/
	//--------------------------------------------------------------------------
	function UsersHaveRight($right_info, $org_info = -1)
	{
		$iCount = 0;
		$arUsersHaveRight = array();
		$strSQL = "	SELECT
						user_ID
						, user_Name
					FROM
						tblUser 
					WHERE 
						user_Active = 1 
					ORDER BY
						tblUser.user_Name";
		
		$arUsers = $this->db->Select($strSQL);
		
		if(sizeof($arUsers))
		{
			foreach($arUsers as $account)
			{
				$userID = $account['user_ID'];
				$userName = $account['user_Name'];

				if($this->HasRight($userID, $right_info, $org_info))
				{
					$arUsersHaveRight[$iCount] = array();
					$arUsersHaveRight[$iCount]['user_ID'] = $userID;		//	This isn't part of this object so we 
																		//	can use user_ID
					$arUsersHaveRight[$iCount]['user_Name'] = $userName;
					$iCount++;
				}
			}
		}
			
		return $arUsersHaveRight;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function UsersHaveAdminRightOrg($user_info, $admin_right_info, $user_right_info)
	{
		global $oUserSession;
		$arUsersHaveRight = array();
		
		
		if(GetRightID($admin_right_info) < 1)
		{
			return null;
		}
		
		if(GetRightID($user_right_info) < 1)
		{
			return null;
		}

		$arOrgs = $this->GetRightAssignedOrgs($user_info, $admin_right_info);
		
		$arAdminOrgs = array();
		
		foreach($arOrgs as $org)
		{
			$arAdminOrgs[] = $org['org_ID'];
		}
		
		/*
			The right is either invalid or does not have any organizations assigned
			to it, therefore we return a failure.
		*/
		if(sizeof($arOrgs) < 1)
		{
			return null;
		}
		
		$strSQL = "	SELECT
				user_ID
				, user_Name
			FROM
				tblUser 
			WHERE 
				user_Active = 1 
			ORDER BY
				tblUser.user_Name";
		
		$arUsers = $this->db->Select($strSQL);
		
		if(sizeof($arUsers) < 1)
		{
			return null;
		}
		
		$iCount = 0;
	
		foreach($arUsers as $account)
		{
			$userID = $account['user_ID'];
			$userName = $account['user_Name'];
			
			$arOrgs = $this->GetRightAssignedOrgs($userID, $user_right_info);

			if(sizeof($arOrgs) > 0)
			{
				foreach($arOrgs as $org)
				{
					$orgId = $org['org_ID'];
					if(in_array($orgId, $arAdminOrgs))
					{
						$arUsersHaveRight[$iCount]['user_ID'] = $userID;		//	This isn't part of this object so we can use user_ID
						$arUsersHaveRight[$iCount]['user_Name'] = $userName;
						$iCount++;
						break;
					}
				}
			}
		}

		return $arUsersHaveRight;
	}
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new systemAccess();
		}
	
		return $obj;
	}
}
?>