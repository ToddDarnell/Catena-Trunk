<?php

/*
	This static object keeps track of the rights system within catena.
	To access this object use the following code:
	
		$rights = rights::GetInstance();
*/

require_once('include.php');
require_once('class.systemData.php');
require_once('class.rightCategory.php');

class rights extends baseAdmin
{
	function __construct()
	{
		parent::__construct();
		$this->table_Name = "tblRight";					//	the name of the table used for rights
		$this->field_Id = "right_ID";					//	the unique id for this right
		$this->field_Name = "right_Name";				//	the user friendly name of this right
		$this->field_Description = "right_Description";	//	a short description of this right
		$this->field_Group = "rightCat_ID";				//	The right category which this right belongs to
		
		/*
			This portion loads all of the rights and their variable names.
			We'll query the database, grab the right id, assign it to a variable with the same
			name.
		*/
		$this->db = systemData::GetInstance();
		
		$this->build();
		
		/*
			Make sure the system admin right
			is available. This right is critical for managing
			the entire system
		*/
		if(!isset($this->SYSTEM_Support))
		{
			die("System right is not available. Please check database rights are set up properly.");
		}
		
		$this->rights_Remove = $this->SYSTEM_Support;
		$this->rights_Add = $this->SYSTEM_Support;
		$this->rights_Modify = $this->SYSTEM_Support;
		
	}
	/*--------------------------------------------------------------------------
		-	description
				Builds the rights list by loading it from the database
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function build()
	{
		$sql = "SELECT * FROM $this->table_Name";
		
		$records = $this->db->select($sql);

		/*
			Because someone can put a right directly into the datbase we
			need to check and make sure their are no spaces or invalid characters
			in the right name
		*/
		
		foreach ($records as $aRight)
		{
			if(isset($aRight))
			{
				$rightName = $aRight[$this->field_Name];
				$rightValue = $aRight[$this->field_Id];
				if($this->IsNameValid($rightName))
				{
					if(is_numeric($rightValue))
					{
						$this->$rightName = $rightValue;
					}
				}
			}
		}
	}
	/*-------------------------------------------------------------------
		-	Validates the right's name
			-	Validates that the right is formated properly, does not
				contain invalid characters, etc.
	-------------------------------------------------------------------*/
	function IsNameValid($strTitle)
	{
		
		if(strlen($strTitle) < 1)
		{
			return $this->results->Set('false', "Invalid or no characters in title.");
		}
		
		/*
			Check for any invalid characters in the rights name
		*/
		if(!eregi("^[a-z0-9_]{3,20}$",  $strTitle))
		{
			return $this->results->Set('false', "Invalid characters in name. Only characters allowed: [A-Z][0-9][_].");
		}
	
		return true;
	}
	/*--------------------------------------------------------------------------
		-	description
				This function validates the text passed in as a proper
				description of a document type.
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function ValidateDescription($strDescription)
	{
		if(!eregi("^[a-z0-9_ \.\',;:/()-]{5,255}$",  $strDescription))
		{
			return $this->results->Set('false', "Invalid or no characters in description.");
		}
		return true;
	}
	/*--------------------------------------------------------------------------
		-	description
				Adds a right to the database.
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function Add($strName, $strDescription, $strCategory)
	{
		$rightsCategory = rightCategory::GetInstance();
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
		
		if(!$this->IsNameValid($strName))
		{
			return false;
		}
	
		if(!$this->ValidateDescription($strDescription))
		{
			return false;
		}
		
		$categoryId = $rightsCategory->GetID($strCategory);
		
		if($categoryId < 0)
		{
			return $this->results->Set('false', "Invalid right category.");
		}
	
		/*
			See if the name is already in use
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
		$arInsert[$this->field_Group] = $categoryId;
	
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
				return $this->results->Set('false', "Unable to add '$strName' due to database error.");
		}

		return $this->results->Set('true', "'$strName' added.");
	}
	/*--------------------------------------------------------------------------
		-	description
				Modifies an existing record
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function Modify($strName, $strDescription, $strCategory, $id)
	{

		$rightsCategory = rightCategory::GetInstance();
		global $g_oUserSession;
				
		if(!$g_oUserSession->HasRight($this->rights_Add))
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
		if(!$this->IsNameValid($strName))
		{
			return false;
		}
		if(!$this->ValidateDescription($strDescription))
		{
			return $this->results->Set('false', "Invalid description.");
		}
		
		$categoryId = $rightsCategory->GetID($strCategory);
		
		if($categoryId < 0)
		{
			return $this->results->Set('false', "Invalid right category.");
		}
	
		/*
			build the record
			Update any record which has an id of $id
		*/
		$arUpdate = array();
		$arUpdate[$this->field_Description] = $strDescription;
		$arUpdate[$this->field_Group] = $categoryId;
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $id;	
		
		$result = $this->db->update($this->table_Name, $arUpdate, $arWhere);
		
		switch($result)
		{
			case 0:
				return $this->results->Set('true', "No changes made to system right.");
			case 1:
				return $this->results->Set('true', "'$strName' updated.");
			default:
				return $this->results->Set('false', "Unable to update '$strName' due to database error.");
		}

	}
	/*--------------------------------------------------------------------------
		-	description
				Check that the right does or doesn't need an organization
				assigned to it.
		-	params
				right_info
					The right name or right id
		-	return
	--------------------------------------------------------------------------*/
	function RequiresOrg($right_info)
	{
		$rightId = GetRightID($right_info);
		
		$rightRecord = $this->Get($rightId);
		
		return $rightRecord['right_UseOrg'] == 1;
	}
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new rights();
		}
		else
		{
			/*
				Rebuild the rights list ever time we use it
			*/
			$obj->build();
		}
		
		return $obj;
	}
}
/*
	-	$info may be the name or the id
		of the record we're looking for
	-	return an id
		-1 if not valid
*/
function GetRightID($info)
{
	$oType = rights::GetInstance();
	
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