<?
require_once('include.php');
/**
	\brief Manage organizations. Add/modifying/removing/validating, etc.
*/
class cOrganization extends cGenericObject
{
	protected $field_Id = "org_ID";				//	the unique id for this organization
	private $field_Name = "org_Short_Name";		//	The organizations abbrievated name

	public $account_Guest = "Guest";
	public $account_All = "All";
	public $account_AFU = "AFU";
	
	public function __construct($org_info = -1)
	{
		$this->table_Name = "tblOrganization";
		$this->db = systemData::GetInstance();

		if($user_info <> -1)
		{
			$id = GetOrgID($user_info);
		}
    	$this->initialize($this->table_Name, $id);
    	
 		//$this->results->SetLog(true);
		//$this->results->SetSystem(1);
    	
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
	//-------------------------------------------------------------------
	/**
		\brief This function searches $field_name for the record id
						
		\param[in] strText the 'name' of the record to look for.
							Searches $field_name.
		@param[in] id
			an optional parameter to exclude a specified id.
			This is good, for example, to search for duplicate text
			in the records when modifying an existing record
		
		\return number
			-	-1	if not found
			-	0+	The id of the record found
	*/
	//-------------------------------------------------------------------
	function GetLongNameID($strText, $id = -1)
	{
		if($this->db == null)
		{
			return -1;
		}
		
		if(!is_numeric($id))
		{
			return -1;
		}
		
		if(strlen($strText) < 1)
		{
			return -1;
		}
		
		$strFormatted = $this->db->EscapeString($strText);

		if($id == -1)
		{
			$sql = "SELECT * FROM $this->table_Name WHERE UPPER($this->field_Long_Name) = UPPER('$strFormatted');";
		}
		else
		{
			$sql = "SELECT * FROM $this->table_Name WHERE UPPER($this->field_Long_Name) = UPPER('$strFormatted') AND $this->field_Id <> $id;";
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
	/*
		CanModify returns false if the record may not be modified.
		Records which may not be modified are the guest and all
		records
	*/
	function CanModify($id)
	{
		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid id: [$id].");
		}
		
		$afu_Id = $this->GetId($this->account_AFU);
		$guest_Id = $this->GetId($this->account_Guest);
		$all_Id = $this->GetId($this->account_All);
		
		if($afu_Id == $id)
		{
			return $this->results->Set('false', "The 'AFU' organization may not be modified.");
		}

		if($guest_Id == $id)
		{
			return $this->results->Set('false', "The 'Guest' organization may not be modified.");
		}

		if($all_Id == $id)
		{
			return $this->results->Set('false', "The 'All' organization may not be modified.");
		}
		
		return $this->results->Set('true', "Organization may not be modified.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Updates an existing organization within the database
		\param strShortName
			The new or existing short name of the organization
		\param strLongName
		\param strParent
		\param id
		\return
	*/
	//--------------------------------------------------------------------------
	function Modify($strShortName, $strLongName, $strParent, $id)
	{
		global $g_oUserSession;

		$arOrg = $this->Get($id);
		
		if($arOrg == null)
		{
			return $this->results->Set('false', "Invalid organization id.");
		}

		if(!$g_oUserSession->HasRight($this->rights_Modify, $arOrg[$this->field_Id]))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage(), LOGGER_SECURITY);
		}

		if(!$g_oUserSession->HasRight($this->rights_Modify, $arOrg[$this->field_Parent]))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage(), LOGGER_SECURITY);
		}

		if(!$g_oUserSession->HasRight($this->rights_Modify, $strParent))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage(), LOGGER_SECURITY);
		}
		
		/*
			Make sure the names are valid
		*/	
		if(!$this->IsValidShortName($strShortName))
		{
			return $this->results->Set('false', "Invalid short name.");
		}
	
		if(!$this->IsValidLongName($strLongName))
		{
			return $this->results->Set('false', "Invalid long name.");
		}
		
		if(!$this->CanModify($id))
		{
			return false;
		}
	
		/*
			See if the short name or the long name is in use
			in another record besides this one
		*/
		
		$foundID = $this->GetID($strShortName, $id);
		
		if($foundID > -1)
		{
			return $this->results->Set('false', "'$strShortName' is already in use.");
		}
	
		$foundID = $this->GetID($strLongName, $id);
		if($foundID > -1)
		{
			return $this->results->Set('false', "'$strLongName' is already in use.");
		}
		
		if($this->GetLongNameID($strLongName, $id) > -1)
		{
			//
			//	Organization is already in the database
			//
			return $this->results->Set('false', "'$strLongName' is already in use.");
		}
				
		/*
			Get the id of the parent if there is one.
			Make sure the parent id is not the same as this id.

		*/
		
		$parentId = GetOrgID($strParent);
		
		if($id == $parentId)
		{
			return $this->results->Set('false', "'$strShortName' may not have itself as a parent.");
		}
		
		if($parentId < 0)
		{
			return $this->results->Set('false', "No parent organization selected. All organizations require a parent organization.");
		}
		
		if($this->IsCircularCheck($id, $strParent))
		{
			return $this->results->Set('false', "Circular parent structures are not allowed. Choose a different parent and try again.");
		}	
	
		/*
			build the record
			Update any record which has an id of $id
		*/
		$arUpdate = array();
		$arUpdate[$this->field_Name] = "$strShortName";
		$arUpdate[$this->field_Long_Name] = "$strLongName";
		$arUpdate[$this->field_Parent] = $parentId;
		
		/*
			Now before we send this to the database for updating
			Let's check to see if they're duplicates
			If they are we'll return a true value so
			there's no error on the update
		*/
		$oldRecord = $this->db->select("SELECT * FROM $this->table_Name WHERE org_ID = $id;");
	
		if(strcasecmp($arUpdate[$this->field_Name], $oldRecord[0][$this->field_Name]) == 0)
		{
			if(strcasecmp($arUpdate[$this->field_Long_Name], $oldRecord[0][$this->field_Long_Name]) == 0)
			{
				if($arUpdate[$this->field_Parent] == $oldRecord[0][$this->field_Parent])
				{
					return $this->results->Set('true', "No update necessary. Parent not changed d.");
				}
			}
		}
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $id;	
		if($this->db->update($this->table_Name, $arUpdate, $arWhere))
		{
			return $this->results->Set('true', "Organization '$strShortName' updated.");
		}
		
		return $this->results->Set('false', "Unable to update '$strShortName' due to database error.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			This function checks that we do not have a circular parent/child
			refence with the passed in values.
		\param org_info
			The id to validate against
		\param path_info
			This id is verified it has a valid path to All.
		\return
			- true
				This is a circular path and will cause problems.
			-	false
				This is not a cirucular path and should not cause problems.

		\note
			The depth of this check goes to 100. Beyond that, it's considered
			too deep and a failure.
	*/
	//--------------------------------------------------------------------------
	function IsCircularCheck($org_info, $path_info)
	{
		$iCount = 0;
		$orgId = GetOrgID($org_info);
		$pathId = GetOrgID($path_info);
					
		$arOrgs = array();
		
		$strParent = $this->GetName($pathId);

		while($strParent)
		{
			$parentId = GetOrgID($strParent);

			if($parentId == $orgId)
			{
				return true;
			}
		
			$strParent = $this->GetParent($strParent);
			
			if($iCount++ > 100)
			{
				$strParent = "";
			}
		}
		
		return false;
	}
	/*
		\brief
			Checks that the organization may actually be removed.
			
		Overrides the base class function of the same name.
		
		\note The guest and All organizations may not be removed
		from the system.
		
	*/
	function CanRemove($id)
	{
		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid id: [$id].");
		}
		
		$guest_Id = $this->GetId($this->account_Guest);
		$all_Id = $this->GetId($this->account_All);
		$afu_Id = $this->GetId($this->account_AFU);
		
		if($afu_Id == $id)
		{
			return $this->results->Set('false', "The 'AFU' organization is required by the system and may not be removed.");
		}

		if($guest_Id == $id)
		{
			return $this->results->Set('false', "The 'Guest' organization is required by the system and may not be removed.");
		}

		if($all_Id == $id)
		{
			return $this->results->Set('false', "The 'All' organization is required by the system and may not be removed.");
		}
		
		/*
			Make sure the organization is not being used as a parent for another organization
		*/
		$sql = "SELECT $this->field_Parent FROM $this->table_Name WHERE $this->field_Parent = $id;";
	
		//
		//	We'll get a list of records
		//
		$records= $this->db->Select($sql);
		
		if(sizeof($records) > 0)
		{
			return $this->results->Set('false', "Organization is a parent and may not be removed until all child organizations are removed.");
		}
		
		
		/*
			Make sure no user's are assigned to this organization
		*/
		$sql = "SELECT user_ID FROM tblUser WHERE org_ID = $id;";

		$records= $this->db->Select($sql);
		
		if(sizeof($records) > 0)
		{
			return $this->results->Set('false', "Organization may not be removed until all users are moved to a new organization.");
		}

		return $this->results->Set('true', "Organization may be removed.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Validate the long name submitted is valid
		\param strName
			The full name of the organization which should be checked.
		\return
			-	true
				The name is valid
			-	false
				The name is not valid
	*/
	//--------------------------------------------------------------------------
	function IsValidLongName($strName)
	{
		/*
			May contain only a-z 0-9 and A-Z
			Can be up to 32 characters
			Can not start with a space
			Must be at least 3 characters
			Added the trim so the regExpression doesn't have to be so 
			complicated
		*/
		
		if(eregi("^[a-z0-9 ]{3,32}$",  trim($strName)))
		{
			return $this->results->Set('true', "Valid long name.");
		}
		
		return $this->results->Set('false', "Invalid long name. An organization requires a detailed name.");
		
	}
	/*
		This functions validates that the short name submitted is valid
	*/
	function IsValidShortName($strName)
	{
		/*
			May contain only a-z 0-9 and A-Z
			No spaces
			Can be up to 10 characters
			
		*/
		
		if(eregi("^[a-z0-9]{3,11}$",  trim($strName)))
		{
			return $this->results->Set('true', "Valid short name.");
		}
		
		return $this->results->Set('false', "Invalid short name.");

	}
	/*
		Returns the parent organizations name if there is a name
		returns "" if no name is found
		$id should be the organization id
	*/
	function GetParent($org_info)
	{
		$id = GetOrgID($org_info);
	
		/*
			Try to find a record which has the 
			build the record
		*/
		$sql = "SELECT $this->field_Parent FROM $this->table_Name WHERE $this->field_Id = $id;";
	
		//
		//	We'll get a list of records
		//
		$records= $this->db->Select($sql);
		
		if(sizeof($records) != 1)
		{
			return "";
		}
		
		return $records[0][$this->field_Parent];
	}
	/*
		This function returns the long name for an organization based upon
		the passed in orgid
		If the department is not found then returns ""
	*/
	function GetLongName($id)
	{
		/*
			Try to find a record which has the long name
		*/
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Id = $id;";
	
		//
		//	We'll get a list of records
		//
		$records= $this->db->Select($sql);
		
		if(sizeof($records) < 1)
		{
			return "";
		}
		
		return $records[0][$this->field_Long_Name];
	
	}
	/*-------------------------------------------------------------------
		Creates an array of all children ids of this organization
		and returns them to the caller
		
	-------------------------------------------------------------------*/
	function GetChildren($org_info)
	{
		$orgId = GetOrgID($org_info);
		$retRecords = array();
		$sql = "SELECT $this->field_Id, $this->field_Name FROM $this->table_Name WHERE $this->field_Parent = $orgId ORDER BY org_Short_Name";
		
		$records = $this->db->Select($sql);
		$retRecords = $records;
		
		for($i = 0; $i < sizeof($records); $i++)
		{
			$retChildren = $this->GetChildren($records[$i][$this->field_Id]);
			
			for($j = 0; $j < sizeof($retChildren); $j++)
			{
				$retRecords[] = $retChildren[$j];
			}
		}
		return $retRecords;		
	}
	/*-------------------------------------------------------------------
		Checks recursively to determine if the requested orgId is within the 
		chain of the org_Parent		
	-------------------------------------------------------------------*/
	function InChain($orgParent, $orgId)
	{
		if($orgParent == $orgId)
		{
			return true;	
		}

		$sql = "SELECT $this->field_Id FROM $this->table_Name WHERE $this->field_Parent = $orgParent";
		
		$records = $this->db->Select($sql);
		
		for($i=0; $i < sizeof($records); $i++)
		{
			if($this->InChain($records[$i][$this->field_Id], $orgId))
			{
				return true;	
			}
		}
		return false;		
	}
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new organization();
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
function GetOrgID($info)
{
	$oType = organization::GetInstance();
	
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