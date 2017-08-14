<?php

require_once('include.php');


/**
	\brief
		Manages right groups which are collections of rights logically connected
		via a name and an organization.
	
*/
class rightGroup extends baseAdmin
{
	function __construct()
	{
		parent::__construct();
		$this->table_Name = "tblRightGroup";
		$this->table_Details = "tblRightGroupDetails";

		/*
			These fields are used by the tblRightGroup.
			Some of the names are also used by tblRightGroupDetails.
			'Details' is the table which keeps track of the rights
			assigned to the table.
		*/
		
		$this->field_Id = "rightGroup_ID";
		$this->field_Name = "rightGroup_Name";
		$this->field_Description = "rightGroup_Description";
		$this->field_Organization = "org_ID";

		$this->field_DetailId = "detail_ID";
		$this->field_Right = "right_ID";
		
		/*
			Now set up the rights
		*/
		$rights = rights::GetInstance();
		
		$this->rights_Remove = $rights->SYSTEM_RightsAdmin;
		$this->rights_Add = $rights->SYSTEM_RightsAdmin;
		$this->rights_Modify = $rights->SYSTEM_RightsAdmin;
		
		$this->db = systemData::GetInstance();

		
		
	}
	/*-------------------------------------------------------------------
		Validates the Rights Group Name
		if recordId does not equal -1 then we exclude that id from
		the search. This helps if we're trying to see if the variable
		already exists in the system for a modify or for a new add.
		Validates that $strTitle is formatted properly,
		does not contain invalid characters, and is not in the database
	-------------------------------------------------------------------*/
	function ValidateName($strTitle)
	{
		if(strlen($strTitle) == 0)
		{
			return $this->results->Set('false', "No group name submitted.");
		}

		if(strlen($strTitle) > 20)
		{
			return $this->results->Set('false', "Group name must be 20 characters or less and
						contain only the following characters: a - z, 0 - 9, spaces, ( ) -");
		}
						
		$strNewTitle = trim($strTitle);
	
		$strNewTitle = $this->db->EscapeString($strNewTitle);
	
		/*
			Check for any invalid characters in Document Title
		*/
		if(!eregi("^[a-z0-9_ ()-]{3,20}$",  $strNewTitle))
		{
			return $this->results->Set('false', "Invalid characters in name.");
		}
		
		return $this->results->Set('true', "Valid right group name.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief This function validates the text passed in as a proper
				description of a document type
		\param strDescription
				The string description we're checking to see is valid
		\return
			- true The description is valid
			- false The description is not valid
	*/
	//--------------------------------------------------------------------------
	function IsValidDescription($strDescription)
	{
		if(strlen($strDescription) == 0)
		{
			return $this->results->Set('false', "No description submitted.");
		}
		
		if(!eregi("^[a-z0-9 \.\',;:/()-]{5,255}$",  $strDescription))
		{
			return $this->results->Set('false', "Invalid characters in description.");
		}
	
		return $this->results->Set('true', "Valid right group description.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Adds a right group to the database
		\param strName
			The name of the new right group
		\param strDescription
			The description of the group
		\param strOrganization
			The owning organization of the group
		\return
	*/
	//--------------------------------------------------------------------------
	function Add($strName, $strDescription, $strOrganization)
	{
		global $g_oUserSession;
				
		if(!$g_oUserSession->HasRight($this->rights_Add, $strOrganization))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		$strName = trim($strName);
		$strDescription = trim($strDescription);

		if(!$this->ValidateName($strName))
		{
			return false;
		}
	
		if(!$this->IsValidDescription($strDescription))
		{
			return false;
		}

		$orgId = GetOrgID($strOrganization);
		
		if($orgId < 1)
		{
			return $this->results->Set('false', "Invalid or no organization submitted.");
		}
	
		if($this->GetID($strName, $orgId, -1) > 0)
		{
			return $this->results->Set('false', "'$strName' is already in use for $strOrganization.");
		}
			
		/*
			build the record
		*/
		$arInsert = array();
		$arInsert[$this->field_Name] = $strName;
		$arInsert[$this->field_Description] = $strDescription;
		$arInsert[$this->field_Organization] = $orgId;
	
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', "Unable to add '$strName' due to database error.");
		}

		return $this->results->Set('true', "'$strName' added.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			GetOrganization returns the string name of the organization of the passed
			in right group id
		\param group_info
			The group id
		\return
				Returns the organization name of the passed in group id
	*/
	//--------------------------------------------------------------------------
	function GetOrganization($group_info)
	{
		$oOrganization = organization::GetInstance();
		
		$groupId = GetRightGroupID($group_info);
		
		if($groupId < 0)
		{
			$this->results->Set('false', "Invalid group");
			return "";
		}

		/*
			Grab the user record and get the organization id
		*/
		$strSQL = "SELECT * FROM $this->table_Name WHERE $this->field_Id = $groupId;";
		$records = $this->db->Select($strSQL);
		
		if(sizeof($records) != 1)
		{
			$this->results->Set('false', "Duplicate name found.");
			return "";
		}
	
		return $oOrganization->GetName($records[0][$this->field_Organization]);
	}
	//-------------------------------------------------------------------
	/**
		\brief This function searches $field_name for the record id
						
		@param[in] strText the 'name' of the record to look for.
							Searches $field_name.
		@param[in] orgId
			The organization which owns the named right group
		
		@param[in] id
			an optional parameter to exclude a specified id.
			This is good, for example, to search for duplicate text
			in the records when modifying an existing record
		
		\return number
			-	-1	if not found
			-	0+	The id of the record found
	*/
	//-------------------------------------------------------------------
	function GetID($strText, $orgId, $id = -1)
	{
		if(!is_numeric($id))
		{
			return -1;
		}

		$orgId = GetOrgId($orgId);
		
		if(strlen($strText) < 1)
		{
			return -1;
		}
		
		$strFormatted = $this->db->EscapeString($strText);

		if($id == -1)
		{
			$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strFormatted' AND $this->field_Organization = $orgId;";
		}
		else
		{
			$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strFormatted' AND $this->field_Organization = $orgId AND $this->field_Id <> $id;";
		}
	
		/*
			Get a list of records
		*/
		$records = $this->db->Select($sql);
		if(sizeof($records) > 0)
		{			
			return $records[0][$this->field_Id];
		}
		
		return -1;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Modify the details of the right group
		\param strModName
			The new name of the right group
		\param strModDescription
			The new description for this group
		\param strOrganization
			The new owning organization of this right group
		\param id
			The id of the right group so which is being modified.
		\return
			-	true
				The right group was modified
			-	false
				The right group was not modified
	*/
	//--------------------------------------------------------------------------
	function Modify($strModName, $strModDescription, $strOrganization, $id)
	{
		global $g_oUserSession;

		$arRecord = $this->Get($id);
		
		if($arRecord == null)
		{
			return $this->results->Set('false', "Invalid id.");
		}			
			
		if(!$g_oUserSession->HasRight($this->rights_Modify, $arRecord[$this->field_Organization]))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		if(!$g_oUserSession->HasRight($this->rights_Modify, $strOrganization))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid id.");
		}
		
		if($this->GetID($strModName, $strOrganization, $id) > 0)
		{
			return $this->results->Set('false', "'$strModName' is already in use for $strOrganization and may not be used again.");
		}
		
	
		/*
			Make sure the names are not invalid
		*/	
		if(!$this->ValidateName($strModName, $id))
		{
			return false;
		}
	
		if(!$this->IsValidDescription($strModDescription))
		{
			return false;
		}
		
		$orgId = GetOrgID($strOrganization);
		
		if($orgId < 1)
		{
			return $this->results->Set('false', "Invalid organization submitted.");
		}
	
		/*
			build the record
			Update any record which has an id of $id
		*/
		$arUpdate = array();
		$arUpdate[$this->field_Name] = $strModName;
		$arUpdate[$this->field_Description] = $strModDescription;
		$arUpdate[$this->field_Organization] = $orgId;
		
		/*
			Now before we send this to the database for updating
			Let's check to see if they're duplicates
			If they are we'll return a true value so
			there's no error on the update
		*/
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $id;	
		
		switch($this->db->update($this->table_Name, $arUpdate, $arWhere))
		{
			case 0:
				return $this->results->Set('true', "No changes made.");
			case 1:
				return $this->results->Set('true', "'$strModName' updated.");
			default:
				return $this->results->Set('false', "Unable to update '$strModName' due to database error.");
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Adds a right to a right group
		\param group_info
			The id of the group the right should be added to
		\param right
			The name of the right which will be added to the group
		\param organization
			The name of the organization the right has access for
		\return
			-	true
				The right was successfully added to the group
			-	false
				The right was not added to the group
	*/
	//--------------------------------------------------------------------------
	function AssignRight($groupId, $right, $organization)
	{
		$rightId = -1;
		$orgId = -1;
		
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$oOrganization = organization::GetInstance();

		/*
			Make sure the caller has the right to add rights to organizations,
			and that they also have the right which is being added to the list
		*/
		if(!$this->Exists($groupId))
		{
			return $this->results->Set('false', "Invalid right group selected.$groupId");
		}
		
		$arGroup = $this->Get($groupId);

		if(!$g_oUserSession->HasRight($this->rights_Add, $arGroup[$this->field_Organization]))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		if(!$g_oUserSession->HasRight($right, $organization))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		$rightId = $oRights->GetID($right);
		$orgId = $oOrganization->GetID($organization);

		if($groupId < 0)
		{
			return $this->results->Set('false', "Invalid group submitted.");
		}
		
		if($rightId < 0)
		{
			return $this->results->Set('false', "Invalid right submitted.");
		}

		if(strlen($organization))
		{
			if($orgId < 0)
			{
				return $this->results->Set('false', "Invalid organization submitted.");
			}
		}
	
		if($oRights->RequiresOrg($rightId))
		{
			if($orgId < 0)
			{
				return $this->results->Set('false', "Right requires an organization and one was not provided.");
			}
		}
		
		if($this->HasRight($groupId, $rightId, $orgId))
		{
			return true;
		}
			
		/*
			Insert the record
		*/
		$arInsert = array();
		$arInsert[$this->field_Id] = $groupId;
		$arInsert[$this->field_Right] = $rightId;
		$arInsert[$this->field_Organization] = $orgId;
	
		if(!$this->db->insert($this->table_Details, $arInsert))
		{
				return $this->results->Set('false', "Unable to add '$name' due to database error.");
		}
		
		$strGroupName = $this->GetName($groupId);
		
		
		return $this->results->Set('true', "'$right' added to '$strGroupName'.");
	
	}
	//-------------------------------------------------------------------
	/**
		\brief
			Returns true if the requested record may be removed.
		
		\note
			- This should be overridden by the derived class to check
			for record dependancies, children dependancies, foreign
			keys and so forth.
			- The derived function must set the return text value
			so the user receives a description of why the id
			may not be removed.
	*/
	//-------------------------------------------------------------------
	function CanRemove($id)
	{
		$arGroup = $this->Get($id);
		
		if(!isset($arGroup))
		{
			return $this->results->Set('false', "Invalid group selected.");
		}
		
		global $g_oUserSession;
		
		if(!$g_oUserSession->HasRight($this->rights_Remove, $arGroup[$this->field_Organization]))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		/*
			Make sure the group is not assigned to users.
		*/
		$oSystemAccess = systemAccess::GetInstance();
		
		if($oSystemAccess->IsGroupAssigned($id))
		{
			return $this->results->Set('false', "Group is assigned to users or organizations and may not be removed.");
		}

		return true;	
	}
	//--------------------------------------------------------------------------
	/**
		\brief Removes a right from a list
		\param assignedRightId
				The id of the record connecting the right to the group.
		\return
				- true
					if the right/group record was successfully removed from
					the database
				- false
					if the right/group record was not successfully removed
					from the database.
	*/
	//--------------------------------------------------------------------------
	function RemoveRight($assignedRightId)
	{
		$groupId = -1;
		$rightId = -1;
		$orgId = -1;
		
		global $g_oUserSession;
		$oRights = rights::GetInstance();
		$oOrganization = organization::GetInstance();

		/*
			Make sure the caller has the right to remove rights from organizations,
			and that they also have the right which is being removed from the list.
		*/
		
		if(!$g_oUserSession->HasRight($this->rights_Remove))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		$arGroupItem = $this->GetGroupItem($assignedRightId);
		
		if(sizeof($arGroupItem) < 1)
		{
			return false;
		}
				
		if(!$g_oUserSession->HasRight($arGroupItem[0]['right_ID'], $arGroupItem[0]['org_ID']))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		$arWhere = array();
		
		$arWhere[$this->field_DetailId] = $assignedRightId;
	
		if(!$this->db->delete($this->table_Details, $arWhere))
		{
			return $this->results->Set('false', "Unable to remove '$assignedRightId' due to database error.");
		}
		
		return $this->results->Set('true', "Removed item from right group.");
	}
	/*--------------------------------------------------------------------------
		-	description
				Returns an array containing the right group list item.
		-	params
				itemId
					the id of the right group item to return
		-	return
				an array containing the variables of the right group record item
	--------------------------------------------------------------------------*/
	function GetGroupItem($itemId)
	{
		if(!is_numeric($itemId))
		{
			$this->results->Set('false', "Invalid id used for acquiring right group item.");
			return null;
		}

		$sql = "SELECT * FROM $this->table_Details WHERE detail_ID = $itemId";
		
		$arGroupItem = $this->db->Select($sql);

		if(sizeof($arGroupItem) < 1)
		{
			$this->results->Set('false', "Invalid id used for acquiring right group item.");
		}
		
		return $arGroupItem;
	}
	/*--------------------------------------------------------------------------
		-	description
				Checks to see if a right group has a right/organization
				combination in it.
		-	params
				group_info
					The group which is to be checked
				right_info
					The right to be compared against
				org_info
					The organization information to he compared against
		-	return
				true
					if the right is in the group
				false
					if the right is not in the group
	--------------------------------------------------------------------------*/
	function HasRight($group_info, $right_info, $org_info = -1)
	{
		
		$oRights = rights::GetInstance();
	    $oOrganization = organization::GetInstance();

		$groupId = GetRightGroupID($group_info);
		$rightId = GetRightID($right_info);
		$orgId = GetOrgID($org_info);

		/*
			Perform user id validation
		*/		
		if($groupId < 0)
		{
			return $this->results->Set('false', "Invalid group.");
		}
		
		/*
			Perform right id validation
		*/

		if($rightId < 0)
		{
			return $this->results->Set('false', "Invalid right--does not exist in list.");
		}

	    /*
			Now get the organization.
			If an organization was passed in properly, then orgId
			should be set to something valid. However, if orgId
			is not valid, we check that the user sent something
			in. If they did, then we have a problem because
			a valid organization was not submitted.
		*/
        if($orgId == -1)
        {
        	if($org_info != -1)
        	{
        		if(strlen($org_info))
        		{
        			return $this->results->Set('false', "No access. Organization does not exist.");
        		}
			}
		}
		
		/*
			If the group has the global admin right then return true, that the group
			has the requested right.
		*/
		$globalRightId = $oRights->SYSTEM_GlobalAdmin;
		
		$sql = "SELECT org_ID FROM $this->table_Details WHERE right_ID = $globalRightId AND $this->field_Id = $groupId";
		$records = $this->db->Select($sql);
		
		if(sizeof($records) == 1)
		{
			return $this->results->Set('true', "Group has right. (Global Admin).");
		}

		$sql = "SELECT
					detail_ID,
					org_ID
				FROM
					$this->table_Details
				WHERE
					rightGroup_ID = $groupId AND right_ID = $rightId";
		
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
				return $this->results->Set('true', "Group has right. (Not checking against organizations).");
			}

			return $this->results->Set('false', "Group doesn't have right. (Not checking against organizations).");
		}

		/*
			-	Now gather the list of rights which match this request.
			-	We're looking for group/right combinations.
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
			/*
				Now check the join table for a match of user/right
				If they don't have it, then check all of the user's
				groups and see if any of them have the right.
			*/
			if($oOrganization->InChain($records[$iOrgs]['org_ID'], $orgId))
			{
				return $this->results->Set('true', "Group has right.");
			}
		}
		return $this->results->Set('false', "Group does not have right.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Returns a list of rights assigned to the passed in right group.
		\param group_info
			May be the right group id or it's name.
		\return
				An array consisting of the rights in this group.
				If the group info is invalid or the list is empty
				a null list will be returned.
		\note
			Only the rights the caller may assign to others is returned
			in this list.
	*/
	//--------------------------------------------------------------------------
	function GetRights($group_info)
	{
		/*
			-	This sql string finds all rights assigned to the admin user (the user
				whom this PHP session is created for) and then from that list
				finds which rights are assigned to the user.
		*/
		global $g_oUserSession;

		$groupId = GetRightGroupID($group_info);
		
		if($groupId < 0)
		{
			$this->results->Set('false', "Invalid group name.");
			return null;
		}
	
		$adminId = $g_oUserSession->GetUserID();
		
		if($adminId < 0)
		{
			$this->results->Set('false', "Invalid admin id.");
			return null;
		}
		
		/*
			Retrieve all rights in the group, and then see if
			the user has the right. If they do then add it to
			the list.
		*/
		$sql = "SELECT
					detail_ID,
					right_Name,
					right_Description,
					org_Short_Name
				FROM
					$this->table_Details
					LEFT JOIN
						tblOrganization
						ON tblRightGroupDetails.org_ID = tblOrganization.org_ID
					LEFT JOIN
						tblRight
						ON tblRightGroupDetails.right_ID = tblRight.right_ID
				WHERE
					rightGroup_ID = $groupId";
		
		$records = $this->db->Select($sql);

		$arRights = array();
		
		foreach($records as $right)
		{
			/*
				-	If the user has the right, then add it to the array
				-	At the end we'll do a raw XML dump
			*/
			$right['may_assign'] = 0;
			
			if($g_oUserSession->HasRight($right['right_Name'], $right['org_Short_Name']))
			{
				$right['may_assign'] = 1;
			}
	
			$arRights[] = $right;
		}
		
		//print_r($arRights);
		
		//die();
		
		return $arRights;
	}
	/*--------------------------------------------------------------------------
		-	description
				Called to remove any rights assigned to this group, and any
				users who have this group assigned to them.
		-	params
				The id of the right group to be removed.
		-	return
				true
					We were successful
				false
					if we need to stop the removal.
	--------------------------------------------------------------------------*/
	function custom_Remove($id)
	{
		/*
			First, remove all records from the details table. This will remove
			all rights assigned to this group.
			Second, delete all references to this group in the assigned table
		*/
		$strSQL = "DELETE FROM $this->table_Details WHERE rightGroup_ID = $id";
		$this->db->sql_delete($strSQL);

		$strSQL = "DELETE FROM tblAssignedRights WHERE access_type = 1 AND access_ID = $id";
		$this->db->sql_delete($strSQL);
	
		return true;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Returns the right groups owned by the optionally passed in 
			organization
		\param organization
			The owning organization the list should be filtered for.
		\return
			an array containing all right groups or owned by the
			passed in organization
	*/
	//--------------------------------------------------------------------------
	function GetRightGroupList($organization)
	{
		$oOrganization = organization::GetInstance();
		
		$strSQL = "
			SELECT
				tblRightGroup.rightGroup_ID
				, tblRightGroup.rightGroup_Name
				, tblRightGroup.rightGroup_Description
				, tblOrganization.org_Short_Name
			FROM
			(
				$this->table_Name
				LEFT JOIN tblOrganization ON tblRightGroup.org_ID = tblOrganization.org_ID
			)";
			
		if(strlen($organization))
		{
			$orgId = GetOrgID($organization);
			
			$strSQL.= " WHERE (tblOrganization.org_ID = $orgId";
	
			$arChildren = $oOrganization->GetChildren($organization);
	
			foreach($arChildren as $org)
			{
				$strSQL.= " OR tblOrganization.org_ID = " . $org['org_ID']."";
			}
			
			$strSQL.= ")";
		}
		
		return $this->db->Select($strSQL);
	}
	/*--------------------------------------------------------------------------
		-	description
				Returns the singleton for this class
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new rightGroup();
		}
		
		return $obj;
	}
}
//--------------------------------------------------------------------------
/**
	\brief
		Returns the id assocaited with the passed in information.
	\param info
			The right group name or id
	\param organization
			The organization of the group. If the id is not used, the
			organization must be set because duplicate names are allowed.
	\return
		The id of the right group
*/
//--------------------------------------------------------------------------

/*--------------------------------------------------------------------------
	-	description
	-	params
		info
			may be the name or the id of the record we're looking for
	-	return
		-1 if not valid
		1+ for a valid id
--------------------------------------------------------------------------*/
function GetRightGroupID($info, $organization = -1)
{
	$oType = rightGroup::GetInstance();
	
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
		$orgId = GetOrgID($organization);
		if($orgId > 0)
		{
			$id = $oType->GetID($info, $orgId);
		}
	}
	
	return $id;
}
?>