<?php

/*
	CSG group 
*/
	require_once('../../../classes/include.php');
	require_once('class.db.php');

class csgGroup extends baseAdmin
{
	function __construct()
	{
		parent::__construct();
		$this->table_Name = "tblCSGGroup";
		$this->field_Id = "group_ID";
		$this->field_Name = "group_Name";
		$this->field_Description = "group_Description";
		$this->field_Owner = "org_ID";

		$this->db = csgData::GetInstance();
		
		/*
			Now set up the rights
		*/

		$rights = rights::GetInstance();
		
		$this->rights_Remove = $rights->RMS_Admin;
		$this->rights_Add = $rights->RMS_Admin;
		$this->rights_Modify = $rights->RMS_Admin;
	}
	
	/*-------------------------------------------------------------------
		Validates the Rights Group Name
		if recordId does not equal -1 then we exclude that id from
		the search. This helps if we're trying to see if the variable
		already exists in the system for a modify or for a new add.
	
		Validates that $strTitle is formatted properly,
		does not contain invalid characters, and is not in the database
	-------------------------------------------------------------------*/
	function ValidateName($strTitle, $recordId = -1)
	{
		$strNewTitle = $db->EscapeString($strTitle);
	
		/*
			Check for any invalid characters in Document Title
		*/
		if(!eregi("^[a-z0-9_ \',;:/()-]{3,20}$",  $strNewTitle))
		{
			return $this->results->Set('false', "Invalid characters in name.");
		}
		
		return true;
	}
	
	/*
		This function validates the text passed in as a proper description of a document type
	*/
	function ValidateDescription($strDescription)
	{
		if(strlen($strDescription) == 0)
		{
			return $this->results->Set('false', "No description submitted.");
		}
		
		if(!eregi("^[a-z0-9 \.\',;:/()-]{5,60}$",  $strDescription))
		{
			return $this->results->Set('false', "Invalid characters in description.");
		}
		return true;
	}
	/*
		Add a csg group to the database.
		$strName
			the name of the group
		$strDescription
			A description of the group
		$owner
			The owning organization of the group
	*/
	function Add($strName, $strDescription, $org_info)
	{
		global $g_oUserSession;
		
		
		/*
			Make sure the organization exists and is valid
			We're using it first to test against the right.
		*/
		
		$orgId = GetOrgID($org_info);
		
		if($orgId < 0)
		{
			return $this->results->Set('false', "Invalid organization selected for owner");
		}
				
		if(!$g_oUserSession->HasRight($this->rights_Add, $orgId))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		/*
			Make sure the names are valid
		*/
		if(!$this->ValidateName($strName))
		{
			return false;
		}
	
		if(!$this->ValidateDescription($strDescription))
		{
			return false;
		}
	
		/*
			See if the group name is already in use
		*/
		if($this->GetID($strName) > 0)
		{
			//
			//	Organization is already in the database
			//
			return $this->results->Set('false', "'$strName' is already in use.");
		}

		/*
			build the record
		*/
		$arInsert = array();
		$arInsert[$this->field_Name] = $strName;
		$arInsert[$this->field_Description] = $strDescription;
		$arInsert[$this->field_Owner] = $orgId;
	
		if(!$db->insert($this->table_Name, $arInsert))
		{
				return $this->results->Set('false', "Unable to add '$strName' due to database error.");
		}

		return $this->results->Set('true', "'$strName' added.");
	}
	/*
		Modifies an existing record
		$strName
			The new name of the group
		$strDescription
			The new description for the group
		$org_info
			The new organization this group is assigned to
		$id
			The id of the organization we're modifying
	*/
	function Modify($strName, $strDescription, $org_info, $id)
	{
		global $g_oUserSession;

		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid group[$id]. Unable to modify.");
		}
			
		$arGroup = $this->Get($id);
						
		if(!$g_oUserSession->HasRight($this->rights_Modify, $arGroup[$this->field_Owner]))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		$ownerId = GetOrgID($org_info);
		
		if($ownerId < 0)
		{
			return $this->results->Set('false', "Invalid new organization for group.");
		}
				
		/*
			Make sure the names are not invalid
		*/	
		if(!$this->ValidateName($strName, $id))
		{
			return false;
		}
	
		if(!$this->ValidateDescription($strDescription))
		{
			return false;
		}
	
		/*
			build the record
			Update any record which has an id of $id
		*/
		$arUpdate = array();
		$arUpdate[$this->field_Name] = $strName;
		$arUpdate[$this->field_Description] = $strDescription;
		$arUpdate[$this->field_Owner] = $ownerId;
		
		/*
			Now before we send this to the database for updating
			Let's check to see if they're duplicates
			If they are we'll return a true value so
			there's no error on the update
		*/
		$oldRecord = $db->select("SELECT * FROM $this->table_Name WHERE $this->field_Id = $id;");
	
		if($arUpdate[$this->field_Name] == $oldRecord[0][$this->field_Name])
		{
			if($arUpdate[$this->field_Description] == $oldRecord[0][$this->field_Description])
			{
				if($arUpdate[$this->field_Owner] == $oldRecord[0][$this->field_Owner])
				{
					return $this->results->Set('true', "No update necessary.");
				}
			}
		}
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $id;	
		if(!$db->update($this->table_Name, $arUpdate, $arWhere))
		{
			return $this->results->Set('false', "Unable to update '$strName' due to database error.");
		}
	
		return $this->results->Set('true', "'$strName' updated.");
		
	}
	/*
		Check that the user has the right to remove this group
	*/
	function CanRemove($id)
	{
		global $g_oUserSession;

		$arRecord = $this->Get($id);
				
		if(!isset($arRecord))
		{
			return $this->results->Set('false', "Invalid id.");
		}
	
		if(!$g_oUserSession->HasRight($this->rights_Remove, $arRecord[$this->field_Owner]))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		return true;	
	}
	/*
		-	GetUserAssigned retrieves a list CSG groups the owner has
			admin rights over
	*/
	/*
		-	GetAdminAssigned retrieves the name of rights assigned
			to the calling user.
		-	These are the rights the user may assign to others.
	*/
	function GetUserAssigned($user_info)
	{
		/*
			-	This sql string finds all rights assigned to the admin user (the user
				whom this PHP session is created for) and then from that list
				finds which rights are assigned to the user.
		*/
		$oUser = cUserContainer::GetInstance();
		$oRights = rights::GetInstance();
		$userId = GetUserID($user_info);
		$oXML = new XML;

		if($userId < 0)
		{
			$oXML->outputXHTML();
			return false;
		}
			
		$strSQL = "SELECT
							tblCSGGroup.group_ID
						,	tblCSGGroup.group_Name
						,	tblCSGGroup.group_Description
						,	tblCSGGroup.org_ID
					FROM
						tblCSGGroup ORDER BY tblCSGGroup.group_Name";
		/*
			We don't need to filter by organization if the user
			has the global admin right. we just send the results
			back to the user
		*/
		
		if($oSystemAccess->HasRight($userId, $oRights->SYSTEM_GlobalAdmin))
		{
			OutputXMLList($strSQL, "list", "element");
			return true;
		}
		
		$arOrganizations = $oRights->GetAssignedOrgs($userId, $this->rights_Add);
		
		$strSQL .= " WHERE ";
		$firstTime = true;

		foreach($arOrganizations as $org)
		{
			if($firstTime == false)
			{
				$strSQL.= " OR";
			}
			
			$firstTime = false;
			$strSQL .= " tblCSGGroup.org_ID = " . $org;
		}
		
		$strSQL .= " ORDER BY tblCSGGroup.group_Name";
		
		if(sizeof($arOrganizations))
		{
			OutputXMLList($strSQL, "list", "element");
		}
		else
		{
			$oXML->outputXHTML();
			return false;
		}
			
		return true;
	}
	
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new csgGroup();
		}
		
		return $obj;
	}
}
?>