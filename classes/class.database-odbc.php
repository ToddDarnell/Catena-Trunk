<?php

require_once("class.database.php");

/**
	\class database
	\brief Database interface.
*/
class ODBC_DB extends databaseRoot
{
	//--------------------------------------------------------------------------
	/**
		\brief Loads the database when the class is first instantiated.
		\return bool
			-	true if the database loaded properly.
	*/
	//--------------------------------------------------------------------------
	function load($database, $user, $password)
	{
		$strRelease = "DRIVER={Microsoft Access Driver (*.mdb)}; DBQ=$database";

		$this->hConnection = odbc_connect($strRelease, "", "");

		$this->loaded = true;
		$this->dbName = $database;

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
		$this->IsLoaded();
		$this->activate();
		
		//
		//	Make sure we have a connection
		//
		if(! is_resource($this->hConnection))
		{
			$this->results->Set('false', "Invalid database connection.");
			return null;
		}
		
		$hResource = odbc_exec($this->hConnection, $sql);
		
		if(!is_resource($hResource))
		{
			/*
				If we're in developer debug mode then output detailed
				information.
				If we're on the production server we want to only display
				a generic user message and log the details
			*/
			$err = odbc_error($this->hConnection);
			$err = "Invalid SQL: $sql<BR>mysql error: [$err].";
			$this->results->Set('false', $err);
			return null;
		}
    	
		$arReturn = array();
    	
		while( ($row = $this->odbc_fetch_assoc($hResource)))
		{
			$arReturn[] = $row;
		}

		return $arReturn; 
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	private function odbc_fetch_assoc($rs)
	{
		if (odbc_fetch_row($rs))
		{
			$line = array();

			for($f=1;$f<=odbc_num_fields($rs);$f++)
			{
				$fn=odbc_field_name($rs,$f);
				$fct=odbc_result($rs,$fn);
				$newline=array($fn => $fct);
				$line=array_merge($line,$newline);
				//echo $f.": ".$fn."=".$fct."<br>";
			}
			return $line;
		}
		else
		{
			return false;
		}
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
		$this->IsLoaded();
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
					$fieldValue = "'$fieldValue'";
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
					$val = "'$val'";
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
				$val = "'$val'";
			}      
   			$arWhere[] = "$field = $val";
		}
		
		$sql  = "UPDATE $table SET ";    
		$sql .= join(', ', $arUpdates);
		$sql .= ' WHERE ' . join(' AND ', $arWhere);

		$result = odbc_exec($this->hConnection, $sql);
		
		if($result == false)
		{
			return 0;
		}
		
		return odbc_num_rows($result);
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
		$this->IsLoaded();
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
					$fieldValue = "'$fieldValue'";
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
					$val = "'$val'";
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

		$result = odbc_exec($this->hConnection, $sql);
		
		if($result == false)
		{
			return 0;
		}
		
		return odbc_num_rows($result);

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
			odb_close($this->hConnection);
    	}
    	
    	$this->loaded = false;
	}
}
?>