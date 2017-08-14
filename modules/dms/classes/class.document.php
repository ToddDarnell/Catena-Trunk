<?
	require_once('../../../classes/include.php');
	require_once('class.documentType.php');
	require_once('class.documentVersion.php');
	require_once('class.db.php');
	

/**
	\class document
		\brief
			Provides universal functionality for objects which 
			perform document (add/remove/modify) functionality for single tables.
*/

class document extends baseAdmin
{
//-------------------------------------------------------------------
	/**
		\brief Default constructor
	*/
//-------------------------------------------------------------------
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblDocuments";
		$this->field_Id = "doc_ID";
		$this->field_Name = "doc_Title";
		$this->field_Description = "doc_Description";
		$this->field_DocTypeId = "docType_ID";
		$this->field_OrgId = "org_ID";
		$this->field_Visible = "doc_Visible";

		/*
			Set up the rights for DMS
		*/
		$rights = rights::GetInstance();
		
		$this->rights_Remove = $rights->DMS_Admin;
		$this->rights_Add = $rights->DMS_Admin;
		$this->rights_Modify = $rights->DMS_Admin;
		
		$this->db = dmsData::GetInstance();
	}	
	
//--------------------------------------------------------------------------
	/**
		\brief 
			Add a document to the database
		\return
			Output message to the client side
	*/
//--------------------------------------------------------------------------
	function Add()
	{
		global $g_oUserSession;
		$oDocType = documentType::GetInstance();
		$oOrg = organization::GetInstance();
		$oVer = documentVersion::GetInstance();
		
		/*
			Initializing all variables
		*/
		$strTitle = "";
		$strDescription = ""; 
		$strVersion = "";
		$strType = "";
		$strOrg = "";

		$docTypeId = -1;
		$orgId = -1;
		$docVersionId = -1;		

		/*
			If the user submits a file which is too large we'll get an undefined
			array.  Need to check for file size initially.
		*/
		if(!isset($_FILES['docAddUpload']['tmp_name']))
		{
			return $this->OutputUploadResults('false', "Invalid server temp file name. Please check file size is less than 50 MB.");
		}
		$strTempFileName = $_FILES['docAddUpload']['tmp_name'];
		
		if(!isset($_FILES['docAddUpload']['name']))
		{
			return $this->OutputUploadResults('false', "Invalid user selected file. Please check file size is less than 50 MB.");
		}
		$strSourceFileName = $_FILES['docAddUpload']['name'];

		/*
			Retrieve the values inserted from the addDocumentVersion.xml file.  Set 
			the value to a variable if it has been set by the user.
		*/
		if(isset($_POST['DocTitle']))
		{
			$strTitle = $_POST['DocTitle'];
		}
		
		if(isset($_POST['DocDescription']))
		{
			$strDescription = $_POST['DocDescription'];
		}

		/*	
			The preg_replace() function looks for any extra spaces within the title and
			description strings and replaces them with one space.
			The trim() function trims off any extra spaces at the beginning and end of 
			the title and description strings.
		*/
		$strTitle = preg_replace('/\s+/', ' ', trim($strTitle));
		$strTitle = CleanupSmartQuotes($strTitle);
		$strTitle = trim($strTitle);

		$strDescription = preg_replace('/\s+/', ' ', trim($strDescription));
		$strDescription = CleanupSmartQuotes($strDescription);
		$strDescription = trim($strDescription);

		/*
			Validate each field retrieved from the user. 
		*/
		if(!$this->ValidateTitle($strTitle))
		{
			return $this->OutputUploadResults('false', "Document title is smaller than 5 characters or contains an invalid character.");
		}

		if(!$this->ValidateDescription($strDescription))
		{ 
			return $this->OutputUploadResults('false', "Document description is invalid. Check characters used or length of description is between 5-350 characters.");
		}

		if(isset($_POST['DocOrgList']))
		{
			$strOrg = $_POST['DocOrgList'];
			$orgId = $oOrg->GetID($strOrg);
		}

		if($orgId < 0)
		{ 
			return $this->OutputUploadResults('false', "Invalid organization.");
		}

		if(!$g_oUserSession->HasRight($this->rights_Add, $orgId))
		{
			return $this->OutputUploadResults('false', $g_oUserSession->results->GetMessage());
		}
				
		if(isset($_POST['DocTypeList']))
		{
			$strType = $_POST['DocTypeList'];
		}
		
		if(isset($_POST['DocVersion']))
		{
			$strVersion = $_POST['DocVersion'];
		}
		
		/*
			Set docTypeId from the document type selected by the user and validate
		*/
		$docTypeId = $oDocType->GetID($strType);
		
		if($docTypeId < 0)
		{ 
			return $this->OutputUploadResults('false', "Please select a document type.");
		}

		if($this->DocumentExists($strTitle, $strType))
		{
			return $this->OutputUploadResults('false', "Document already exists.");
		}

		/*
			Check file size is between 1b - 50Mb
		*/
		if($_FILES['docAddUpload']['size'] > 50000000)
		{
			return $this->OutputUploadResults('false', "File size is too large. Please check file size is less than 50 MB.");
		}
		
		$fileSize = $_FILES['docAddUpload']['size'];
		
		if($_FILES['docAddUpload']['size'] < 1)
		{
			return $this->OutputUploadResults('false', "File size is too small. Please check file size is greater than 1 byte.");
		}

		/*
			TRY/CATCH block: Add a new document record to the database: tblDocuments; if the record has 
			been entered successfully, insert version into database: tblDocumentVersion;
			if the version has been entered successfully and the file has been validated, save the 
			file and insert the file name into the database: tblDocumentVersion.
		*/
		try
		{
			/*
				Build the document record with the title, description, docTypeId, and orgId
			*/
			$arInsert = array();
		
			$arInsert[$this->field_Name] = array();
			$arInsert[$this->field_Name]['value'] = $strTitle;
			$arInsert[$this->field_Name]['type'] = "string";
			
			$arInsert[$this->field_Description] = array();
			$arInsert[$this->field_Description]['value'] = $strDescription;
			$arInsert[$this->field_Description]['type'] = "string";
		
			$arInsert[$this->field_DocTypeId] = $docTypeId;
			$arInsert[$this->field_OrgId] = $orgId;
		
			if(!$this->db->insert($this->table_Name, $arInsert))
			{
				throw new Exception("Unable to insert document record into the database.");
			}
				
			$docId = $this->GetDocID($strTitle, $strType);

			if($docId < 0)
			{
				/* 
					Unable to delete record at this point due to title not present in database. 
					***Need to create log***
				*/
				throw new Exception("Invalid document record.");
			}

			/*
				Set docVersionId based on the set values (docId, version, tmpFileName, sourceFileName
				and Add the version record in the tblDocumentVersions using the class.documentVersion
				functionality.
			*/
			$docVersionId = $oVer->Add($docId, $strVersion, $strTempFileName, $strSourceFileName);

			if($docVersionId < 0)
			{
				throw new Exception($oVer->results->GetMessage());
			}

			return $this->OutputUploadResults('true', "Successfully uploaded file.");
		}
		catch(Exception $e)
		{
			/*
				Delete document record if docId has been set
			*/
			if($docId > -1)
			{
				$arWhereDocID = array();
				$arWhereDocID[$this->field_Id] = $docId;
				$this->db->delete($this->table_Name, $arWhereDocID);
			}
			
			/*
				Delete document version record if docVersionId has been set
			*/
			$oVer->Remove($docVersionId);
			
			return  $this->OutputUploadResults('false', $e->getMessage());
		}
	}

//--------------------------------------------------------------------------
	/**
		\brief 
			Verifies all fields have valid information. Updates the 
			document record in tblDocuments if the data has been modified.
		\return
			Message to be outputted to the client side
	*/
//--------------------------------------------------------------------------	
	function ModifyDetails()
	{
		global $g_oUserSession;
		$oDocType = documentType::GetInstance();
		$oOrg = organization::GetInstance();
		
		/*
			Initializing all variables
		*/
		$strTitle = "";
		$strDescription = ""; 
		$strType = "";
		$strOrg = "";
		$docID = -1;
		$docTypeId = -1;
		$orgId = -1;
		$docOrgId = -1;
		
		/*
			Retrieve the values the user inserted from the modifyDocDetails.xml file
		*/
		if(isset($_GET['title']))
		{
			$strTitle = $_GET['title'];
		}
		
		if(isset($_GET['description']))
		{
			$strDescription = $_GET['description'];
		}

		/*	
			The preg_replace() function looks for any extra spaces within the title and
			description strings and replaces them with one space.
			The trim() function trims off any extra spaces at the beginning and end of 
			the title and description strings.
		*/	
		$strTitle = preg_replace('/\s+/', ' ', trim($strTitle));
		$strTitle = CleanupSmartQuotes($strTitle);
		$strTitle = trim($strTitle);

		$strDescription = preg_replace('/\s+/', ' ', trim($strDescription));
		$strDescription = CleanupSmartQuotes($strDescription);
		$strDescription = trim($strDescription);
		
		if(!$this->ValidateTitle($strTitle))
		{
			return $this->results->Set('false', "Document title is smaller than 5 characters or contains an invalid character.");
		}
	
		if(!$this->ValidateDescription($strDescription))
		{ 
			return $this->results->Set('false', "Document description is invalid. Check characters used or length of description is between 5-350 characters.");
		}

		if($this->DocumentExists($strTitle, $strType, $docID))
		{
			return $this->results->Set('false', "Document already exists.");
		}
				
		if(isset($_GET['type']))
		{
			$strType = $_GET['type'];
		}

		if(isset($_GET['org']))
		{
			$strOrg = $_GET['org'];
		}

		if(isset($_GET['docId']))
		{
			$docID = $_GET['docId'];
		}
		
		if(!$this->Exists($docID))
		{
			return $this->results->Set('false', "Please select a document to modify.");
		}
	
		$docTypeId = $oDocType->GetID($strType);
		$orgId = $oOrg->GetID($strOrg);

		if($docTypeId < 0)
		{ 
			return $this->results->Set('false', "Please select a document type.");
		}

		/*
			Set orgId from the user's set organization and validate
		*/
		if($orgId < 0)
		{ 
			return $this->results->Set('false', "Invalid organization.");
		}
		
		$docOrgId = $this->GetOrgId($docID);
		
		if(!$g_oUserSession->HasRight($this->rights_Modify, $docOrgId))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
			
		/*
			Modify document details in the database: tblDocuments if the user modified
			any of the fields
		*/
		$updateFields = array();
		$updateFields[$this->field_Name] = $strTitle;
		$updateFields[$this->field_Description] = $strDescription;
		$updateFields[$this->field_DocTypeId] = $docTypeId;
		$updateFields[$this->field_OrgId] = $orgId;
			
		$updateFilter = array();
		$updateFilter[$this->field_Id] = $docID;

		if(!$this->db->update($this->table_Name, $updateFields, $updateFilter))
		{	
			return $this->results->Set('true', "Document details not modified.");
		}

		return $this->results->Set('true', "Successfully modified document details.");
	}

//--------------------------------------------------------------------------
	/**
		\brief 
			This function hides the document in the database. Calls the 
			DisableVersion in the document version class and hides the 
			appropriate version(s) based on the client selection and the 
			params passed in.
		\param[in] id
				The document ID passed in to be disabled
		\param[in] versionId
				The document version ID of the document ID passed in to be disabled
		\return
			Output message to the client side
	*/
//--------------------------------------------------------------------------		
	function Disable($id, $versionId)
	{	
		global $g_oUserSession;
		$docVer = documentVersion::GetInstance();
	
		$strVisible = 0;
		$docOrgId = -1;
		
		/*
			The passed in document ID must exist in the databse and must be numeric
			to disable a document.
		*/
		if(!$this->Exists($id))
		{ 
			return $this->results->Set('false', "Invalid document ID.");
		}

		/*
			Verify the user has the rights and is assigned to the organization to 
			have the ability to disable a document.
		*/
		$docOrgId = $this->GetOrgId($id);
		
		if(!$g_oUserSession->HasRight($this->rights_Remove, $docOrgId))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}			
				
		/*
			Disable document version visibility to hide the document when displaying the search results
			on the client side. 
		*/
		$versionRecord = $docVer->DisableVersion($id, $versionId);
		
		if(!is_numeric($versionRecord))
		{
			return $this->results->Set('false', "Version record list not defined.");
		}
		
		if($versionId == -1 || $versionRecord == 0)
		{
			$updateFields = array();
			$updateFields[$this->field_Visible] = $strVisible;
				
			$updateFilter = array();
			$updateFilter[$this->field_Id] = $id;
	
			if(!$this->db->update($this->table_Name, $updateFields, $updateFilter))
			{	
				return $this->results->Set('false', "Unable to remove the document.");
			}

			return $this->results->Set('true', $docVer->results->GetMessage());
		}
		
		if($versionRecord < 0)
		{
			return $this->results->Set('false', $docVer->results->GetMessage());
		}
		
		return $this->results->Set('true', $docVer->results->GetMessage());
	}

//--------------------------------------------------------------------------
	/**
		\brief 
			This function copies the source file to the destination of the 
			file.
		\param[in] strSourceFile
			The source file that is passed in to be copied to the $strDestFile
		\param[in] strDestFile
			The destination file that the file will be copied to
		\return
			- true if the source file is copied to the destination file successfully
			- false	if the source file failed to get copied to the destination file
	*/
//--------------------------------------------------------------------------
	function AddFile($strSourceFile, $strDestFile)
	{
		if (copy($strSourceFile, $strDestFile))
		{
			return true;
		}
		else
		{
			/*
				Roll back the entire action at this point
			*/
			return false;
		}
	}

//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves the org_Id of a document based on the document Id	
		\param[in] id
			The document ID passed in
		\return
			- -1 if no records found
			- orgID
	*/
//--------------------------------------------------------------------------	
	function GetOrgId($id)
	{
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Id = $id;";

		/*
			Get a list of records
		*/
		$record = $this->db->Select($sql);
		if(sizeof($record) == 1)
		{
			return $record[0][$this->field_OrgId];
		}
		
		return -1;
	}
//--------------------------------------------------------------------------
	/**
		\brief
			This function retrieves the docType_ID associated with the passed 
			in document ID.
		\param[in] id
			The document ID passed in
		\return
			- -1 if 0 records found
			- docTypeID
	*/
//--------------------------------------------------------------------------
	function GetDocTypeID($id)
	{
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Id = $id;";
	
		/*
			Get a list of records
		*/
		$records = $this->db->Select($sql);
		if(sizeof($records) > 0)
		{
			return $records[0][$this->field_DocTypeId];
		}
		
		return -1;
	}	

//--------------------------------------------------------------------------
	/**
		\brief
			Validates the document title. 
			Title length must be between 5-75 characters.
			Valid title characters include letters, numbers, and ' , ; : / ( ) -
		\param[in] title
			The passed in title 
		\return
			- true if the string title is a valid title
			- false if the title contains an invalid character or character 
					length
	*/
//--------------------------------------------------------------------------	
	function ValidateTitle($title)
	{		
		return eregi("^[a-z0-9 \',;:/()-]{5,75}$",  $title);
	}

//--------------------------------------------------------------------------
	/**
		\brief
			Try to find a record which has the same Document
		\param[in] title
			The passed in title
		\param[in] type
			The passed in type
		\param[in] docId
			The document ID if passed in, otherwise set to -1
		\return
			- true if the document exists
			- false if the document does not exist or validation fails
	*/
//--------------------------------------------------------------------------	
	function DocumentExists($title, $type, $docId = -1)
	{
		$oDocType = documentType::GetInstance();
		
		$strNewTitle = $this->db->EscapeString($title);
		$typeId = $oDocType->GetID($type);
		
		if($typeId < 0)
		{
			return false;
		}
			
		if(!$this->ValidateTitle($strNewTitle))
		{
			return false;
		}
		
		if($docId != -1)
		{
			$dbTitle = "SELECT * FROM $this->table_Name WHERE ($this->field_Name = '$strNewTitle' AND $this->field_Id <> $docId) AND $this->field_DocTypeId = $typeId;";
		}
		else
		{
			$dbTitle = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strNewTitle' AND $this->field_DocTypeId = $typeId;";
		}
	
		$records = $this->db->Select($dbTitle);
		
		if(sizeof($records) > 0)
		{
			return true;
		}
	
		return false;
	}
	
//--------------------------------------------------------------------------
	/**
		\brief
			Validates the document description. Description length must 
			be between 5-350 characters. Valid description characters include 
			letters, numbers, . ' , ; : / ( ) - and space.
		\param[in] description
			The passed in description 
		\return
			- true if the string description is a valid description
			- false if the description contains an invalid character or character 
					length	
	*/
//-------------------------------------------------------------------------- 
	function ValidateDescription($description)
	{
		/*
			Check for any invalid characters in Document Description
		*/
		if(strlen($description) > 350)
		{
			return false;
		}

		return eregi("^[a-z0-9 \.\',;:/()-]{5,}$", $description);
	}
			
//--------------------------------------------------------------------------
	/**
		\brief
			This function returns the document ID associated with the 
			document based on the document title and type.
		\param[in] strTitle
			The passed in title
		\param[in] strType
			The passed in type
		\return
			- -1 if no records found
			- docID
	*/
//--------------------------------------------------------------------------
	function GetDocID($strTitle, $strType)
	{
		$oDocType = documentType::GetInstance();
		/*
			Returns the numeric doc_ID value of the title
		*/
		$strNewTitle = $this->db->EscapeString($strTitle);
	
		$typeID = $oDocType->GetID($strType);
	
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strNewTitle' AND $this->field_DocTypeId = $typeID;";
	
		/*
			Retrieves a list of records
		*/
		$records = $this->db->Select($sql);

		if(sizeof($records) > 0)
		{
			return $records[0][$this->field_Id];
		}
		
		return -1;
	}

//--------------------------------------------------------------------------
	/**
		\brief
			On a successful/failure of a valid file upload
			this function will be called to display the set message to the 
			client side indicating the upload has pass/failed.
		\param[in] strValue
			The passed in value either set to true or false
		\param[in] strMsg
			The passed in set message based on the pass/fail
		\return
			- strValue set to true
	*/
//--------------------------------------------------------------------------	
	function OutputUploadResults($strValue, $strMsg)
	{
		echo "<html><head><script>window.onload = function ()
			{
				if(parent.oAddDocument)
				{
					parent.oAddDocument.DisplayMessage(\"$strValue||$strMsg\");
				}
				else
				{
					document.write(\"$strMsg\");
				}
			};
			</script></Head>
			<body>$strMsg</body>
			</html>
			";
			
		return $strValue == 'true';
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
			$obj = new document();
		}
		
		return $obj;
	}
}
?>