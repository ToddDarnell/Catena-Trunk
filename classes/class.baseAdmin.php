<?php
require_once('class.result.php');
//require_once('class.database.php');
//require_once('class.usersession.php');
/**
	\class baseAdmin
	
	\brief
		Provides universal functionality for objects which perform administrative (add/remove/mdify)
	functionality for single tables.
*/
class baseAdmin
{
	/// the database table name.
	protected $table_Name = "";
	/// the database id field. This is the unique record field.
	protected $field_Id = "";
	/// the database name field. Normally a human readable text field.
	protected $field_Name = "";
	/**
		\brief
			the value of the right which allows a record to be removed from this table.
			The value of the right is checked against the right table to determine if
			the user attempting to remove the record has the right
	*/
	protected $rights_Remove = -1;
	///	a results object which stores human readable return values
	public $results;
	protected $db = null;
	
	//-------------------------------------------------------------------
	/**
		\brief Default constructor
	*/
	//-------------------------------------------------------------------
	function __construct()
	{
		$this->results = new results();
		$this->table_Name = "";
		$this->field_Id = 0;
		$this->field_Name = "";
		$this->db = null;
		$this->rights_Remove = "";
		
		
	}
	//-------------------------------------------------------------------
	/**
		\brief This function returns all of the fields for the specified
				record based upon the id passed in.
		@param[in] id
				the unique id of the requested record
		
		\return
			null if no record is found
			a record of the type the object has instantiated.
	*/
	//-------------------------------------------------------------------
	function Get($id)
	{
		if($this->db == null)
		{
			return null;
		}
		if(!is_numeric($id))
		{
			$id = $this->GetID($id);
		}
		
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Id = $id;";

		/*
			Get a list of records
		*/
		$record = $this->db->Select($sql);
		if(sizeof($record) == 1)
		{
			return $record[0];
		}
		
		return null;
	}
	//-------------------------------------------------------------------
	/**
		\brief This function searches $field_name for the record id
						
		@param[in] strText the 'name' of the record to look for.
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
	function GetID($strText, $id = -1)
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
			$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strFormatted';";
		}
		else
		{
			$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strFormatted' AND $this->field_Id <> $id;";
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
	//-------------------------------------------------------------------
	/**
		\brief
			This function returns the ID associated with the text passed in
			which is part of the table_name field.
			name passed in.
		
		@param[in] id
		
		\return
			if not found : return ""
			if found: return the text presenting the name/title of the
			record
	*/
	//-------------------------------------------------------------------
	function GetName($id)
	{
		if($this->db == null)
		{
			return "";
		}
	
		if(!is_numeric($id))
		{
			return "";
		}
	
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Id = $id;";
	
		/*
			Get a list of records
		*/
		$records = $this->db->Select($sql);
		if(sizeof($records) > 0)
		{
			return $records[0][$this->field_Name];
		}
		
		return "";
	}
	//-------------------------------------------------------------------
	/**
		\brief This function determines if a record exists.
		\param id
				id must be a record id
		\return
			- true if the id was found
			- false if the id was not found
	*/
	//-------------------------------------------------------------------
	function Exists($id)
	{
		if($this->db == null)
		{
			return false;
		}
		
		if(!is_numeric($id))
		{
            return false;
        }

        $sql = "SELECT * FROM $this->table_Name WHERE $this->field_Id = $id;";
	
		/*
			Get a list of records
		*/
		$records = $this->db->Select($sql);
	
		return sizeof($records) == 1;
	}
	//-------------------------------------------------------------------
	/**
		\brief
			Returns true if the requested record may be modifed.
		\note
			-	This should be overridden by the derived class to check
			for record dependancies, children dependancies, foreign
			keys and so forth.
			-	The derived function must set the return text value
			so the user receives a description of why the id
			may not be modified.
	*/
	//-------------------------------------------------------------------	
	function CanModify($id)
	{
		return true;	
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
		global $g_oUserSession;
		
		if(strlen($this->rights_Remove))
		{
			if(!$g_oUserSession->HasRight($this->rights_Remove))
			{
				return $this->results->Set('false', $g_oUserSession->results->GetMessage());
			}
		}
		
		return true;	
	}
	//-------------------------------------------------------------------
	/**
		\brief
				Removes a record from the table
	*/
	//-------------------------------------------------------------------
	function Remove($id)
	{
		global $g_oUserSession;
		$rights = rights::GetInstance();

		if($this->db == null)
		{
			return false;
		}
				
		if(!is_numeric($id))
		{
			return $this->results->Set('false', "Identifier must be a numeric value.");
		}

		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid id: [$id].");
		}

		if(!$this->CanRemove($id))
		{
			return false;
		}		

		$strName = $this->GetName($id);	

		$arWhere = array();
		$arWhere[$this->field_Id] = $id;
		
		$strDisplay = substr($strName, 0, 15);
		$strDisplay = stripslashes($strDisplay);
	
		if(!$this->db->delete($this->table_Name, $arWhere))
		{
			return $this->results->Set('false', "Unable to remove '$strDisplay' due to database error.");
		}
		
		if($this->custom_Remove($id))
		{
			return $this->results->Set('true', "'$strDisplay' removed successfully.");
		}
		
		return false;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			This function is called after CanRemove but before the record is
				removed from the table and gives the developer a chance to
				remove any additional tables or data before the record is
				completely removed.
		\note
			- Override this function in derived classes to take full
				advantage of it.
		\param id
				The id of the record being removed.
		\return
			- true
				Continue to remove the record.
			- false
				Stop removing the record.
	*/
	//--------------------------------------------------------------------------
	function custom_Remove($id)
	{
		return true;
	}
}

?>
