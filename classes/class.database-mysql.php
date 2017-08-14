<?php

require_once("class.database.php");

/**
	\class database
	\brief Database interface.
*/
class mysqlDB extends databaseRoot
{
	private $hRes = 0;
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function activate()
	{
		//
		//	Select the database
		//	If the databse equals none then we don't try to select.
		//	The user is explicitly disabling the selection 
		//
		if(!mysql_select_db($this->dbName, $this->hConnection))
		{
			return $this->results->Set('false', "Could not select database: [$this->dbName].");
		}
		
		return true;
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
		if($this->IsLoaded())
		{
			$this->close();
		}
		/*
			Allow our method to access the $cfg associative array
			by making it global
		*/
		global $cfg;
		
		$localHost = $host . ":" . $port;
    	$this->dbName = $dbName;
    	
    	/*
    		Validate all of the fields
    	*/
    	if(strlen($dbName) < 1)
    	{
    		return $this->results->Set('false', "No database name defined.");
    	}
    	
    	if(strlen($host) < 1)
    	{
    		return $this->results->Set('false', "No database host defined.");
    	}
    	
    	if(strlen($port) < 1)
    	{
    		return $this->results->Set('false', "No database port defined.");
    	}
    	
    	if(strlen($user) < 1)
    	{
    		return $this->results->Set('false', "No database user name defined.");
    	}
		
    	if(strlen($password) < 1)
    	{
    		return $this->results->Set('false', "No database password defined.");
    	}
    	
    	/*
    		The @ before mysql_connect is on purpose. It suppresses the
    		warning if the login name information is invalid. This prevents
    		the username/password info from displaying on the script
    	*/
		$this->hConnection = @mysql_connect($localHost, $user, $password);
    	
		if(!is_resource($this->hConnection))
		{
			return $this->results->Set('false', "Unable to connect to the database.");
		}
		
		$this->loaded = true;
		
		return $this->results->Set('true', "Database [$this->dbName] loaded properly.");
		
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
		global $DEBUG_ON;
		
		if(!$this->IsLoaded())
		{
			return null;
		}
		
		if(!$this->activate())
		{
			return null;
		}
		
		$this->hRes = mysql_query($sql, $this->hConnection);
		
		if(! is_resource($this->hRes))
		{
			/*
				If we're in developer debug mode then output detailed
				information.
				If we're on the production server we want to only display
				a generic user message and log the details
			*/
			if($DEBUG_ON)
			{
				$err = mysql_error($this->hConnection);
				die("Invalid SQL: $sql<BR>mysql error: [$err].");
			}
			else
			{
				$this->results->Set('false', "Invalid database connection.");
				return null;
			}
		}
    	
		$arReturn = array();
    	
		while( ($row = mysql_fetch_assoc($this->hRes)))
		{
			$arReturn[] = $row;
		}

		return $arReturn; 
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
		if(!$this->IsLoaded())
		{
			return 0;
		}
		
		$this->activate();

		//
		//	create a useful array for the SET clause
		//
		$arUpdates = array();
		
		foreach($arFieldValues as $field => $val)
		{
			/*
				if the element is an array that means
				it's in the following formation
				array['field name']['type'] = "string" or "number"
				array['field name']['value'] = "value of field"
			*/
			if(is_array($val))
			{
				$dataType = "";
				foreach($val as $detail => $val2)
				{
					/*
						We should have 2 fields.
						One should be the value
							value is the text we're going to use
							type is what kind of data we should treat this as.
							Can be one of the following:
								string
								number
					*/
					$dataType = "string";
					switch($detail)
					{
						case 'value':
							$fieldValue = $val2;
							break;
						case 'type':
							$dataType = $val2;
							break;
					}
				}
				
				/*
					Explicitly check for the data type. if it is not
					one of the following then we do not want to allow
					this element to be added to the array
				*/
				if($dataType == "string")
				{
					$fieldValue = "'" . mysql_escape_string($fieldValue) . "'";
					$arUpdates[] = "$field = $fieldValue";
				}
				else if($dataType == "number")
				{
					$arUpdates[] = "$field = $fieldValue";
				}
			}
			else
			{
				if(! is_numeric($val))
				{
					//
					//	make sure the values are properly escaped
					//
					$val = "'" . mysql_escape_string($val) . "'";
				}
				
				$arUpdates[] = "$field = $val";
			}
		}
   	
		// create a useful array for the WHERE clause 
		$arWhere = array();
		foreach($arConditions as $field => $val)
		{
			if(! is_numeric($val))
			{
				//
				//	make sure the values are properly escaped
				//
				$val = "'" . mysql_escape_string($val) . "'";
			}      
   			$arWhere[] = "$field = $val";
		}
		
		$sql  = "UPDATE $table SET ";    
		$sql .= join(', ', $arUpdates);
		$sql .= ' WHERE ' . join(' AND ', $arWhere);

		if(!mysql_query($sql, $this->hConnection))
		{
			return 0;
		}

		$iRows = mysql_affected_rows($this->hConnection);
		
		$this->results->Set('true', "Update affected $iRows rows");
		return $iRows;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Echo the passed in SQL code and error message
		\param sql
		\param err
		\return none
	*/
	//--------------------------------------------------------------------------
	function DisplayError($sql, $err)
	{
		echo "Invalid SQL: $sql<BR>mysql error: [$err].";
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
		if(!$this->IsLoaded())
		{
			return 0;
		}
				
		$this->activate();

		if($this->hRes == "")
		{
			return 0;
		}
		$fieldNames = array();
		
		$numFields = mysql_num_fields($this->hRes);

		for ($field=0; $field < $numFields; $field++)
		{
			$fieldNames[$field] = mysql_field_name($this->hRes, $field);
		}

		return $fieldNames;
	}
	//--------------------------------------------------------------------------
	/**
		\brief Deletes data from the database
		\param table
		\param arConditions
		\return
			returns the record count. If there was an error returns -1.
	*/
	//--------------------------------------------------------------------------
	function delete($table, $arConditions)
	{
		if(!$this->IsLoaded())
		{
			return -1;
		}
		
		$this->activate();
		
		//
		//	create a useful array for generating the WHERE clause
		//
		
		$arWhere = array();
		foreach($arConditions as $field => $val)
		{
			if(! is_numeric($val))
			{
				//
				//	make sure the values are properly escaped
				//
				$val = "'" . mysql_escape_string($val) . "'";
			}      
   			
			$arWhere[] = "$field = $val";
		}
    	
		$sql = "DELETE FROM $table WHERE " . join(' AND ', $arWhere);
    	
    	if(!mysql_query($sql, $this->hConnection))
		{
			$err = mysql_error($this->hConnection);
			$this->results->Set('false', "DB error: $err.");
			return -1;
		}   
  		
		return mysql_affected_rows($this->hConnection);    
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
		global $DEBUG_ON;
		
		if(!$this->IsLoaded())
		{
			return 0;
		}
		
		$this->activate();

		//
		//	Make sure we have a connection
		//
		if(! is_resource($this->hConnection))
		{
			if($DEBUG_ON)
			{
				die("Invalid database connection.");
			}
			else
			{
				$this->results->Set('false', "Invalid database connection.");
			}
			return 0;
		}
		
		if(mysql_query($sql, $this->hConnection))
		{
			//
			//	return the number of affected rows.
			//
			return mysql_affected_rows();
		}
		
		if($DEBUG_ON)
		{
			$err = mysql_error($this->hConnection);
			die("Invalid SQL: $sql<BR>mysql error: [$err].");
		}
		else
		{
			$this->results->Set('false', "Invalid database connection.");
			return 0;
		}

		return 0;
	}
	/*
		Deletes data from the database using a straight SQL command. This is good if
		there are complex statements which must be used.
	*/
	function sql_delete($sql)
	{
		if(!$this->IsLoaded())
		{
			return 0;
		}
				
		$this->activate();


    	if(!mysql_query($sql, $this->hConnection))
		{
			$err = mysql_error($this->hConnection);
			return 0;
		}   
  		
		return mysql_affected_rows($this->hConnection);    
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
		if(!$this->IsLoaded())
		{
			return 0;
		}
				
		$this->activate();

		$fields = array_keys($arFieldValues);
		$values = array_values($arFieldValues);
		
		// Create a useful array of values
		// that will be imploded to be the 
		// VALUES clause of the insert statement.
		// Run the pg_escape_string function on those
		// values that are something other than numeric.
		$escVals = array();
		
		foreach($values as $val)
		{
			/*
				if the element is an array that means
				it's in the following formation
				array['field name']['type'] = "string" or "number"
				array['field name']['value'] = "value of field"
			*/
			if(is_array($val))
			{
				$dataType = "";
				foreach($val as $detail => $val2)
				{
					/*
						We should have 2 fields.
						One should be the value
							value is the text we're going to use
							type is what kind of data we should treat this as.
							Can be one of the following:
								string
								number
					*/
					switch($detail)
					{
						case 'value':
							$fieldValue = $val2;
							break;
						case 'type':
							$dataType = $val2;
							break;
					}
				}
				
				/*
					Explicitly check for the data type. if it is not
					one of the following then we do not want to allow
					this element to be added to the array
				*/
				if($dataType == "string")
				{
					$fieldValue = "'" . mysql_escape_string($fieldValue) . "'";
					$escVals[] = $fieldValue;
				}
				else if($dataType == "number")
				{
					$escVals[] = $fieldValue;
				}
			}
			else
			{
				if(! is_numeric($val))
				{
					//
					//	make sure the values are properly escaped
					//
					$val = "'" . mysql_escape_string($val) . "'";
				}
				
				$escVals[] = $val;
			}
		}
		
		//
		//	generate the SQL statement 
		//
		$sql = " INSERT INTO $table (";
		$sql .= join(', ', $fields);
		$sql .= ') VALUES(';    
		$sql .= join(', ', $escVals);
		$sql .= ')';
		
		if(mysql_query($sql, $this->hConnection))
		{
			$iRows = mysql_affected_rows();
			
			$this->results->Set('true', "Inserted rows: $iRows");
			return $iRows;
		}
		
		/*
			We should be logging this
		*/
		$err = mysql_error($this->hConnection);
		die("MySQL error: $err.");
		return 0;
	}
	/*--------------------------------------------------------------------------
		-	description
				Closes the database connection.
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function close()
	{
		$this->activate();

		if(is_resource($this->hConnection))
		{
			mysql_close($this->hConnection);
    	}
    	
    	$this->loaded = false;
	}
	/*--------------------------------------------------------------------------
		-	description
				Returns the database status.
				Attempts to load the database if it's offline.
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function GetStatus()
	{
		$status = "";
		//$this->activate();
		
		if(!$this->IsLoaded(false))
		{
			$message = $this->results->GetMessage();
			
			$status = "offline: $message";
		}
		else
		{
			$status = "online";
		}
		
		return $status;
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
		if(!$this->IsLoaded())
		{
			return null;
		}
		
		$this->activate();
		
		if($this->hConnection == 0)
		{
			$this->results->Set('false', "Unable to escape string because database connection is invalid.");
			$this->results->Send();
			die();
		}

		return mysql_real_escape_string($strProcess, $this->hConnection);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Count returns the number of records found
		\param table
			The name of the table for which we're count records
		\param strWhere
			The sql code defining the where clause. Do not add the WHERE.
		\param return
			A count of records found
		\return
			a number of records found
	*/
	//--------------------------------------------------------------------------
	function Count($table, $strWhere)
	{
		if(!$this->IsLoaded())
		{
			return 0;
		}
		
		$this->activate();
		
		$sql = "	SELECT
						COUNT(*)
					FROM
						$table
					WHERE $strWhere";
		
		$this->hRes = mysql_query($sql, $this->hConnection);
		
		if($this->hRes)
		{
			$row = mysql_fetch_assoc($this->hRes);
		
			foreach($row as $fieldName => $val)
			{
				return $val;
			}
		}
		
		return 0;
	}
	
}
?>