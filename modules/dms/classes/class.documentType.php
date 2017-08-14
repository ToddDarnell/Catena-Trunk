<?
	require_once('../../../classes/include.php');
	require_once('class.document.php');
	require_once('class.db.php');
	
/**
	\class documentType
		\brief
			Provides universal functionality for objects which 
			perform document type	(add/remove/modify) functionality for single 
			tables.
*/

class documentType extends baseAdmin
{
//-------------------------------------------------------------------
	/**
		\brief Default constructor
	*/
//-------------------------------------------------------------------
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblDocumentType";
		$this->field_Id = "docType_ID";
		$this->field_Name = "docType_Name";
		$this->field_Description = "docType_Description";
		
		/*
			Set up the rights for Document Type
		*/
		$rights = rights::GetInstance();
		
		$this->rights_Remove = $rights->DMS_Support;
		$this->rights_Add = $rights->DMS_Support;
		$this->rights_Modify = $rights->DMS_Support;
		
		$this->db = dmsData::GetInstance();
	}

//--------------------------------------------------------------------------
	/**
		\brief 
			Add a document type to the database
		\param[in] strName
			The document type name
		\param[in] strDescription
			The document type description
		\return
			Message to be outputted to the client side
	*/
//--------------------------------------------------------------------------
	function Add($strName, $strDescription)
	{
		global $g_oUserSession;
				
		if(!$g_oUserSession->HasRight($this->rights_Add))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		/*
			Make sure the fields are valid
		*/
		if(!$this->ValidateName($strName))
		{
			return $this->results->Set('false', "Invalid document type name. Name length must be between 3-32 characters.");
		}
	
		if(!$this->ValidateDescription($strDescription))
		{
			return $this->results->Set('false', "Invalid document type description. Description length must be between 3-60 characters.");
		}
	
		if($this->GetID($strName) > -1)
		{
			/*
				Document type is already in use
			*/
			return $this->results->Set('false', "'$strName' is already in use.");
		}
	
		/*
			Build the record and insert the document type in the database
		*/
		$arInsert = array();
		$arInsert[$this->field_Name] = $strName;
		$arInsert[$this->field_Description] = $strDescription;
				
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', "Unable to add $strName due to database error.");
		}
		
		return $this->results->Set('true', "Document type $strName added.");
	}
	
//--------------------------------------------------------------------------
	/**
		\brief 
			Modifies an existing document type within the database
		\param[in] strName
			The document type name
		\param[in] strDescription
			The document type description
		\param[in] id
			The document type ID
		\return
			Message to be outputted to the client side
	*/
//--------------------------------------------------------------------------		
	function Modify($strName, $strDescription, $id)
	{
		global $g_oUserSession;
		
		if(!$g_oUserSession->HasRight($this->rights_Modify))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
	
		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid document type id.");
		}
	
		if($id == "")
		{
			return $this->results->Set('false', "Invalid document type id.");
		}
		
		if($id < 1)
		{
			return $this->results->Set('false', "Invalid organization id.");
		}
	
		/*
			Make sure the names are valid
		*/	
		if(!$this->ValidateName($strName))
		{
			return $this->results->Set('false', "Invalid document type name. Name length must be between 3-32 characters.");
		}
	
		if(!$this->ValidateDescription($strDescription))
		{
			return $this->results->Set('false', "Invalid document type description. Description length must be between 3-60 characters.");
		}
	
		/*
			Build the record
		*/
		$arUpdate = array();
		$arUpdate[$this->field_Name] = $strName;
		$arUpdate[$this->field_Description] = $strDescription;
		
		/*
			Before we send this to the database for updating,
			check to see if there are any duplicates.
			If there are we'll return a true value so
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
		if($this->db->update($this->table_Name, $arUpdate, $arWhere))
		{
			return $this->results->Set('true', "Document Type: $strName updated.");
		}
		
		return $this->results->Set('false', "Unable to update '$strName' due to database error.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function GetList()
	{
		$listNames = array();
		$arTables = array();
		$elements = array();
	
		$where['id'] = -1;
		$where['name'] = "";
		
		$orderBy = "";
		$limit = 0;
		
		if(isset($_GET['id']))
		{
			if(is_numeric($_GET['id']))
			{
				$where['id'] = $_GET['id'];
			}
		}	
		
		if(isset($_GET['name']))
		{
			$where['name'] = $_GET['name'];
		}	
		
		if(isset($_GET['limit']))
		{
			$limit = $_GET['limit'];
		}	
		
		/*
			Try to find a record which has the 
			build the record
		*/
		$strSQL = "SELECT * FROM $this->table_Name WHERE 1 = 1 ";
	
	
		if($where['id'] > -1)
		{
			$strSQL .= " AND $this->field_Id = ". $where['id'];
		}
	
		if(strlen($where['name']) > 0)
		{
			$idValue = $where['name'];
			$strSQL .= " AND $this->field_Name LIKE '%$idValue%' ";
		}
		
		if($limit > 0)
		{
			$strSQL .= " LIMIT $limit ";
		}
			
		$strSQL.= " ORDER BY $this->field_Name";
		
		$arResults = $this->db->select($strSQL);
		
		$oXML = new XML;
		$oXML->serializeElement($arResults, "element");
		$oXML->outputXHTML();
			
	}
//--------------------------------------------------------------------------
	/**
		\brief
			Validates the document type name. 
			Type name length must be between 3-32 characters.
			Valid name characters include letters, numbers, and space.
		\param[in] strName
			The passed in document type name
		\return
			- true if the type name is a valid name
			- false if the type name contains an invalid character or character 
					length
	*/
//--------------------------------------------------------------------------	
	function ValidateName($strName)
	{
		return eregi("[a-z0-9 ]{3,32}$",  trim($strName));
	}
	
//--------------------------------------------------------------------------
	/**
		\brief
			Validates the document type description. Description length must 
			be between 3-60 characters. Valid description characters include 
			letters, numbers, . and space.
		\param[in] strName
			The passed in document type description 		
		\return
			- true if the string description is a valid description
			- false if the description contains an invalid character or character 
					length	
	*/
//-------------------------------------------------------------------------- 
	function ValidateDescription($strName)
	{	
		return eregi("^[a-z0-9. ]{3,60}$",  trim($strName));
	}
	
//-------------------------------------------------------------------
	/**
		\brief 
			Returns the singleton for this class
		\return
			class object 
	*/
//-------------------------------------------------------------------
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new documentType();
		}
		
		return $obj;
	}
}
?>