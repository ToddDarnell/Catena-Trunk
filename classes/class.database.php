<?php

require_once("class.result.php");
/**
	\class databaseRoot
	\brief Database root interface. The core used by derived
	classes which implement a database type interface.
*/
class databaseRoot
{
	public $results = 0;
	protected $dbName = "";
	protected $loaded = false; //a boolean value which states if the database is loaded
	protected $hConnection = 0;
	function __construct()
	{
		$this->results = new results();
		$strDefaultMessage = "Not Implemented";
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Activates the database connection if it needs to be set active.
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function activate()
	{
		return true;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Returns the name of the database.
		\return
			A string representing the name of the database.
	*/
	//--------------------------------------------------------------------------
	function GetName()
	{
		return $this->dbName;
	}			
	//--------------------------------------------------------------------------
	/**
		\brief Loads the database when the class is first instantiated.
		\return bool
			-	true if the database loaded properly.
	*/
	//--------------------------------------------------------------------------
	function load($dbName, $host, $port, $user, $password)
	{
		return $this->results->Set('false', $strDefaultMessage);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param sql
			The raw SQL command to be executed.
		\return bool
			-	on success
					returns an associated row of selected values.
			-	on failure
					returns null. Check the results object for details.
	*/
	//--------------------------------------------------------------------------
	function select($sql)
	{
		$this->results->Set('false', $strDefaultMessage);
		
		return null;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Updates a table in the database
		\param table
			The name of the table the record is being updated for
		\param arFieldValues
			are the fields which are being updated with the data contained in fields
			Additionally this can contain array elements to describe data as a different
			type than it is. For example, to declare a number field as a string, then
			use an array to describe it.
			
		\param arConditions
			are the records which should be updated.
		\return
			-	-1	if some kind of database error
			-	0	if no records updated
			-	1+	the number of records modified

	To update the following fields using the specifed values for a record containing id 47:

	\code
		$arFieldValues = array();
		$arFieldValues['title'] = "My title";
		$arFieldValues['desciption'] = "my description";
		$arConditions['id'] = 47;
		
		$this->update("tableName", $arFieldValues, $arConditions);
	\endcode
	
		To update a field which is of a different data type then
		used (for example, a number treated as a character) then use the following:
		
	\code
		$arFieldValues = array();
		$arFieldValues['version'] = array();
		$arFieldValues['version']['type'] = "string";
		$arFieldValues['version']['value'] = 1.0;
		$arConditions['id'] = 47;
	\endcode
	*/
	//--------------------------------------------------------------------------
	function update($table, $arFieldValues, $arConditions)
	{
		$this->results->Set('false', $strDefaultMessage);
		
		return -1;
	}
	//--------------------------------------------------------------------------
	/**
		\brief This function returns the field names for the most recent
				table access.
		\return array
			An array containing the names of the table.
	*/
	//--------------------------------------------------------------------------
	function GetFieldNames()
	{
		$this->results->Set('false', $strDefaultMessage);
		
		return null;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Deletes data from the database
		\param table
		\param arConditions
		\return
			returns the number of records deleted. If there was an error returns -1.
	*/
	//--------------------------------------------------------------------------
	function delete($table, $arConditions)
	{
		$this->results->Set('false', $strDefaultMessage);
		
		return -1;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Allows for using sql directly to insert records into the
				database.
		\param sql
		\return number
			The number of records updated
	*/
	//--------------------------------------------------------------------------
	function sql_Insert($sql)
	{
		$this->results->Set('false', $strDefaultMessage);
		
		return -1;
	}
	/*
		Deletes data from the database using a straight SQL command. This is good if
		there are complex statements which must be used.
	*/
	function sql_delete($sql)
	{
		$this->results->Set('false', $strDefaultMessage);
		return -1;
	}
	/*--------------------------------------------------------------------------
		-	description
				Inserts a record into the table.
				See update for the details on how the $arFieldValues array works
		-	params
				table
					The name of the table the insert should be performed on
				arFieldValues
					The array of values which should be iniserted for
					the record.
		-	return
			1+
				The number of records inserted
			0
				Some kind of database error
	--------------------------------------------------------------------------*/
  	function insert($table, $arFieldValues)
	{
		$this->results->Set('false', $strDefaultMessage);
		return -1;
	}
	/*--------------------------------------------------------------------------
		-	description
				Closes the database connection.
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function close()
	{
		return $this->results->Set('false', $strDefaultMessage);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Returns the database status.
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function GetStatus()
	{
		return $this->results->Set('false', $strDefaultMessage);
	}
	/*--------------------------------------------------------------------------
		-	description
				Takes an unformated string and adds formatting for special
				characters.
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function EscapeString($strProcess)
	{
		$this->results->Set('false', $strDefaultMessage);
		return -1;
	}
	/*
		Count returns the number of records found
		-	table
				The name of the table for which we're count records
		-	strWhere
				The sql code defining the where clause. Do not
				add the WHERE.
		-	return
			a count of records found
			
	*/
	function Count($table, $strWhere)
	{
		$this->results->Set('false', $strDefaultMessage);
		return 0;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			IsLoaded checks to see if the database is loaded.
			By default if the databse is not loaded it attempts to load the
			database.
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function IsLoaded($load = true)
	{
		if($this->loaded == true)
		{
			return $this->results->Set('true', "Database: $this->dbName loaded.");
		}
		else
		{
			return $this->results->Set('false', "Database not loaded.");
		}
		
		return false;
	}
}
?>