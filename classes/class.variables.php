<?php
/**
	This class provides access to the unique variables within the database
*/

require_once('class.database.php');

class systemVariables extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblVariables";
		$this->field_Id = "var_ID";
		$this->field_Name = "var_Name";
		$this->field_Value = "var_Value";
		
		$this->db = systemData::GetInstance();
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Returns the value assigned to this variable
		\param strVariable
			The name of the variable to retrieve.
			
		\return
			A string value representing the data of this variable. If an
			invalid variable is passed in an empty string is returned.
	*/
	//--------------------------------------------------------------------------
	function GetValue($strVariable)
	{
		$arVariable = $this->Get($strVariable);
		
		if(isset($arVariable))
		{
			return $arVariable[$this->field_Value];
		}
		
		return "";
	}
	/*
		Set the new value
	*/
	function Set($strVariable, $strValue)
	{
		
		$db = systemData::GetInstance();
		
		if($this->GetID($strVariable) > -1)
		{
			$arUpdate = array();
			$arFilter = array();
			
			$arUpdate[$this->field_Value] = $strValue;
			$arFilter[$this->field_Name] = $strVariable;
			
			$db->update($this->table_Name, $arUpdate, $arFilter);
		}
		else
		{
			/*
				The record does not exist, add it
			*/
			$arInsert = array();
			
			$arInsert[$this->field_Name] = $strVariable;
			$arInsert[$this->field_Value] = $strValue;
			$db->insert($this->table_Name, $arInsert);
		}
	}
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new systemVariables();
		}
		
		return $obj;
	}
}

?>
