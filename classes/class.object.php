<?

require_once('class.result.php');

class cGenericObject
{
	# Member Variables
	private $id;
	private $table_Name;
	
	private $database_fields;
	private $loaded;      
	private $modified_fields;
	protected $db = null;
	protected $field_Id = "";
	
	/// Should the object be saved to the database when it's destroyed, it has been modified
	protected $bSaveOnDestroy = false;
	
	///	Has one of the fields been modified since it was loaded
	protected $modified = false;
	protected $results = null;

	//--------------------------------------------------------------------------
	/**
		\brief
			The default constructor
	*/
	//--------------------------------------------------------------------------
	function __construct()
	{
		$this->results = new results();
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			The default destructor
	*/
	//--------------------------------------------------------------------------
	function __destruct()
	{
		if($this->bSaveOnDestroy == true)
		{
			if($this->modified == true)
			{
				$this->Save();
			}
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Reloads the object from the data store.
		\return
			-	true
				The object was reloaded
			-	false
				The object was not reloaded
	*/
	//--------------------------------------------------------------------------
	function reload()
	{
		if(!isset($this->db))
		{
			return false;
		}
		
		$id = $this->id;
		$table_Name = $this->table_Name;
		
		$this->database_fields = $this->db->select("SELECT * FROM $table_Name WHERE $this->field_Id = $id");
		$this->loaded = 1;
		
		if (sizeof($this->modified_fields) > 0)
		{
			foreach ($this->modified_fields as $key => $value)
			{
				$this->modified_fields[$key] = false;
			};
		};

		return true;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Loads the object if it's not allready loaded.
		\return
			-	true
				The object was loaded
			-	false
				The object was not loaded properly.
		
	*/
	//--------------------------------------------------------------------------
	function makeLoaded()
	{
		if(!$this->loaded)
		{
			return $this->load();
		}
		
		return true;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			A wrapper for the reload object.
		\return
			-	true
				The object was loaded
			-	false
				The object was not loaded properly.
	*/
	//--------------------------------------------------------------------------
	function load()
	{
		return $this->reload();
	}
	//--------------------------------------------------------------------------
	/**
		\brief
	*/
	//--------------------------------------------------------------------------
	function ForceLoaded()
	{
		$this->loaded = 1;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function GetField($field)
	{          
		if ($this->loaded == 0)
		{
			$this->load();            
		}
		
		if(isset($this->database_fields[0]))
		{
			if(isset($this->database_fields[0][$field]))
			{
				return $this->database_fields[0][$field];
			}
		}
		
		return null;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function GetAllFields()
	{
		if ($this->loaded == 0)
		{
			$this->load();            
		}
		return($this->database_fields[0]);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	 function GetID()
	{
		return $this->id;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	 function Initialize($table_Name, $tuple_id = -1)
	{
		$this->table_Name = $table_Name;
		$this->id = $tuple_id;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Sets the value of the specified field.
		\param field
			The name of the field to modify
		\param value
			The value of the field
		\return
			1	The field was modified
			0	No change
			-1	Some kind of error changing this field
	*/
	//--------------------------------------------------------------------------
	 function SetField($field, $value)
	{    
		if ($this->loaded == 0)
		{
			if ($this->id)
			{
				$this->load();            
			};
		};
		
		if(isset($this->database_fields[0][$field]))
		{
			$oldValue = $this->database_fields[0][$field];
			
			if($oldValue == $value)
			{
				return 0;
			}

			$this->database_fields[0][$field] = $value;
			$this->modified = true;
			
			$this->modified_fields[0][$field] = true;
			
			return 1;
		}
		
		return -1;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	 function Destroy()
	{
		$id = $this->id;
		$table_Name = $this->table_Name;
		if ($id)
		{
			$sql = new sql(0);
			$stmt = "DELETE FROM \"" . $table_Name . "\" WHERE id='" . $id . "'";
			$sql->query($stmt);
		};
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	 function Save()
	{
		$id = $this->id;
		$table_Name = $this->table_Name;

		if (!$id)
		{
			$this->loaded = 0;
		};
		
		if ($this->loaded == 0)
		{
			//	assume this is a new entity
			$stmt = "INSERT INTO \"" . $table_Name ."\"(";
			
			foreach ($this->database_fields[0] as $key => $value)
			{
				if (!is_numeric($key))
				{
					$key = str_replace("'", "\'", $key);
					if ($value != "")
					{
						$stmt .= "\"$key\",";
					};
				};
			};
			# Chop last comma
			$stmt = substr($stmt,0,strlen($stmt)-1);
			$stmt .= ") VALUES (";
			foreach ($this->database_fields[0] as $key => $value)
			{
				if (!is_numeric($key))
				{
					if ($value != "")
					{
						$value = str_replace("'", "\'", $value);
						$stmt .= "'$value',";
					}
				}
			}
			# Chop last comma
			$stmt = substr($stmt,0,strlen($stmt)-1);
			$stmt .= ")";
			
			$return_code = $this->db->sql_insert($stmt, 1);          
		}
		else
		{
			$arWhere = array();
			$arWhere[$this->field_Id] = $this->id;
			
			$return_code = $this->db->Update($this->table_Name, $this->database_fields[0], $arWhere);
		};
	
		if ($this->loaded == 0)
		{




		};
		
		$this->modified = false;
		return($return_code);
	}
};
