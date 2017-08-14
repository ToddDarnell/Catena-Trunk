<?php

/*
	This class keeps track of the transaction status types used by CSG transactions.
*/
require_once('../../../classes/include.php');
require_once('class.db.php');

class dcrStatusType extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		$this->table_Name = "tblDCRStatusType";
		$this->field_Id = "status_ID";
		$this->field_Name = "status_Name";
		$this->field_Description = "status_Description";
		
		$this->db = dmsData::GetInstance();

		/*
			Now set up the rights
		*/
		$rights = rights::GetInstance();
		
		$this->rights_Remove = $rights->DMS_Admin;
		$this->rights_Add = $rights->DMS_Admin;
		$this->rights_Modify = $rights->DMS_Admin;
	}	
	/*-------------------------------------------------------------------
		Validates the DCR Status Name
		if recordId does not equal -1 then we exclude that id from
		the search. This helps if we're trying to see if the variable
		already exists in the system for a modify or for a new add.
	
		Validates that $strTitle is formatted properly,
		does not contain invalid characters, and is not in the database
	-------------------------------------------------------------------*/
	function ValidateName($strTitle, $recordId = -1)
	{
	
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
		This function validates the text passed in as a proper description of a status type
	*/
	function ValidateDescription($strDescription)
	{
		if(strlen($strDescription) == 0)
		{
			return $this->results->Set('false', "No description submitted.");
		}
		
		if(!eregi("^[a-z0-9 \.\',;:/()-]{5,250}$",  $strDescription))
		{
			return $this->results->Set('false', "Invalid characters in description.");
		}
		return true;
	}
	/*
		Adds a status type to the database
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
	
		$strName = CleanupSmartQuotes($strName);
		$strName = trim($strName);

		$strDescription = CleanupSmartQuotes($strDescription);
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
			See if the document type name is already in use
		*/
		if($this->GetID($strName) != -1)
		{
			//
			//	Organization is already in the database
			//
			return $this->results->Set('false', "'$strName' is already in use.");
		}
		
		//
		//	At this point we'll add what we have
		//
		//$db = dmsData::GetInstance();
	
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
	function Modify($strModName, $strModDescription, $id)
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
	
		/*
			Make sure the names are not invalid
		*/	
		$strModName = CleanupSmartQuotes($strModName);
		$strModName = trim($strModName);

		$strModDescription = CleanupSmartQuotes($strModDescription);
		$strModDescription = trim($strModDescription);

		if(!$this->ValidateName($strModName, $id))
		{
			return $this->results->Set('false', "Invalid name.");
		}
	
		if(!$this->ValidateDescription($strModDescription))
		{
			return $this->results->Set('false', "Invalid description.");
		}
	
		/*
			build the record
			Update any record which has an id of $id
		*/
		$arUpdate = array();
		$arUpdate[$this->field_Name] = $strModName;
		$arUpdate[$this->field_Description] = $strModDescription;
		
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
			return $this->results->Set('false', "Unable to update '$strModName' due to database error.");
		}
	
		return $this->results->Set('true', "'$strModName' updated.");
	}
	
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new dcrStatusType();
		}
		
		return $obj;
	}
}
?>