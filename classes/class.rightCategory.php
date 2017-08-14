<?php

/*
	A right Category is used to group rights logically within the system.
	This is seperate from groups which users can be assigned to.
*/

//require_once('include.php');

class rightCategory extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		$this->table_Name = "tblRightCategory";
		$this->field_Id = "rightCat_ID";
		$this->field_Name = "rightCat_Name";
		$this->field_Description = "rightCat_Description";
		
		/*
			Now set up the rights
		*/
		$rights = rights::GetInstance();
		
		$this->rights_Remove = $rights->SYSTEM_Support;
		$this->rights_Add = $rights->SYSTEM_Support;
		$this->rights_Modify = $rights->SYSTEM_Support;
		
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
	function ValidateName($strTitle, $recordId = -1)
	{
		$strTitle = trim($strTitle);
	
		$strNewTitle = $this->db->EscapeString($strTitle);
	
		/*
			Check for any invalid characters in Document Title
		*/
		if(!eregi("^[a-z0-9 \',;:/()-]{3,20}$",  $strNewTitle))
		{
			return $this->results->Set('false', "Invalid characters in name.");
		}
	
		/*
			Try to find a record which has the same Document Title in database
		*/
		if($recordId != -1)
		{
			$strSQL = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strNewTitle' AND $this->field_Id <> $recordId;";
		}
		else
		{
			$strSQL = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strNewTitle';";
		}
	
		$records = $this->db->Select($strSQL);
		
		if(sizeof($records) > 0)
		{
			return $this->results->Set('false', "Duplicate name found.");
		}
	
		return true;
	}
	
	/*
		This function validates the text passed in as a proper description of a rights category
	*/
	function ValidateDescription($strDescription)
	{
		$strDescription = trim($strDescription);

		if(strlen($strDescription) == 0)
		{
			return $this->results->Set('false', "No description submitted.");
		}
		
		if(!eregi("^[a-z0-9 \.\',;:/()-]{5,255}$",  $strDescription))
		{
			return $this->results->Set('false', "Invalid characters in description.");
		}
		return true;
	
	}
	/*
		Adds a rights group to the database
	*/
	function Add($strName, $strDescription)
	{
		global $g_oUserSession;
				
		if(!$g_oUserSession->HasRight($this->rights_Add))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		/*
			Make sure the names are not invalid
		*/
		$strName = trim($strName);
		$strDescription = trim($strDescription);
		
		if(!$this->ValidateName($strName))
		{
			return false;
		}
	
		if(!$this->ValidateDescription($strDescription))
		{
			return false;
		}
	
		/*
			See if the right category name is already in use
		*/
		if($this->GetID($strName) != -1)
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
	
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
				return $this->results->Set('false', "Unable to add '$strName' due to database error.");
		}

		return $this->results->Set('true', "'$strName' added.");
	}
	/*
		Modifies an existing record
	*/
	function Modify($strName, $strDescription, $id)
	{
		global $g_oUserSession;

		if(!$g_oUserSession->HasRight($this->rights_Modify))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid id.");
		}
		
		$strName = trim($strName);
		$strDescription = trim($strDescription);
	
		/*
			Make sure the names are not invalid
		*/	
		if(!$this->ValidateName($strName, $id))
		{
			return $this->results->Set('false', "Invalid name.");
		}
	
		if(!$this->ValidateDescription($strDescription))
		{
			return $this->results->Set('false', "Invalid description.");
		}
	
		/*
			build the record
			Update any record which has an id of $id
		*/
		$arUpdate = array();
		$arUpdate[$this->field_Name] = $strName;
		$arUpdate[$this->field_Description] = $strDescription;
		
		/*
			Now before we send this to the database for updating
			Let's check to see if they're duplicates
			If they are we'll return a true value so
			there's no error on the update
		*/
		$oldRecord = $this->db->select("SELECT * FROM $this->table_Name WHERE $this->field_Id = $id;");
	
		if($arUpdate[$this->field_Name] == $oldRecord[0][$this->field_Name])
		{
			if($arUpdate[$this->field_Description] == $oldRecord[0][$this->field_Description])
			{
				return $this->results->Set('true', "No update necessary. Description not changed.");
			}
		}
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $id;	
		if(!$this->db->update($this->table_Name, $arUpdate, $arWhere))
		{
			return $this->results->Set('false', "Unable to update '$strName' due to database error.");
		}
	
		return $this->results->Set('true', "'$strName' updated.");
		
	}
	
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new rightCategory();
		}
		
		return $obj;
	}
}
?>