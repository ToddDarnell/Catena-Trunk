<?
	require_once('../../../classes/include.php');
	require_once('class.document.php');
	require_once('class.documentType.php');

/**

	\class documentVersion
		\brief
			Provides universal functionality for 
			objects which perform document version (add/remove/modify) 
			functionality for single tables.
*/

class documentVersion extends baseAdmin
{
//-------------------------------------------------------------------
	/**
		\brief Default constructor
	*/
//-------------------------------------------------------------------
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblDocumentVersion";
		$this->field_Id = "docVersion_ID";
		$this->field_Name = "docVersion_Ver";
		$this->field_File = "docVersion_File";
		$this->field_DocId = "doc_ID";
		$this->field_Visible = "docVersion_Visible";
		
		/*
			Now set up the rights
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
			Add a document version to the database
		\param[in] docId
			The document ID passed in
		\param[in] strVersion
			The version number passed in
		\param[in] strTempFileName
			The temporary file name passed in
		\param[in] strSourceFileName
			The source file name passed in
		\return
			- -1 if unable to add the version
			- docVersionID
	*/
//--------------------------------------------------------------------------
	function Add($docId, $strVersion, $strTempFileName, $strSourceFileName)
	{
		global $g_oUserSession;
		$db = dmsData::GetInstance();	
		$doc = document::GetInstance();
		
		/*
			If the user submits a file which is too large we'll get an undefined
			array.  Need to check for file size initially.
			Also need to validate fields.
		*/
		if(!strlen($strTempFileName))
		{
			$this->results->Set('false', "Invalid server temporary file name. Please verify file size is less than 50 MB.");
			return -1;
		}
		
		if(!strlen($strSourceFileName))
		{
			$this->results->Set('false', "Invalid user selected file. Please verify file size is less than 50 MB.");
			return -1;
		}
		
		if(!is_numeric($docId))
		{
			$this->results->Set('false', "Invalid document ID. Verify document ID is numeric.");
			return -1;
		}
	
		if($docId < 0)
		{
			$this->results->Set('false', "Invalid document ID.");
			return -1;
		}
		
		$orgId = $doc->GetOrgId($docId);

		if($orgId < 0)
		{
			$this->results->Set('false', "Invalid organization ID.");
			return -1;
		}
		
		if(!$g_oUserSession->HasRight($this->rights_Add, $orgId))
		{
			$this->results->Set('false', $g_oUserSession->results->GetMessage());
			return -1;
			
		}
		
		/*
			The trim() function trims off any extra spaces at the beginning and end of 
			the version strings.
		*/	
		
		$strVersion = trim($strVersion);
		
		/*
			Validate version and verify not a duplicate version
		*/

		if(!$this->ValidateVersion($strVersion))
		{ 
			$this->results->Set('false', "Invalid new document version. Verify format follows: [##.##].");
			return -1;
		}
	
		if($this->VersionExists($strVersion, $docId))
		{ 
			$this->results->Set('false', "Document version already exists.");
			return -1;
		}
		
		/*
			Checking that only .html, .htm, .doc, .ppt, .xls, .vsd files can be uploaded.
			If bad files are uploaded tell the user the file was rejected.
			File format must be in the form: XXXXXXX.xxxx 
			Verify size of document is between 1b to 50Mb.
		*/
		if(!$this->ValidExtension($strSourceFileName))
		{
			$this->results->Set('false', "Invalid file type.");
			return -1;
		}

		/*
			TRY/CATCH block: Add a new version into database; if the version 
			has been entered successfully and the file has been validated, save the 
			file and insert the file name into the database.
		*/
		try
		{
			/*
				Build the record and insert version data into document version table
			*/
			$verInsert = array();
			$verInsert[$this->field_Name] = array();
			$verInsert[$this->field_Name]['value'] = $strVersion;
			$verInsert[$this->field_Name]['type'] = "string";
			$verInsert[$this->field_DocId] = $docId;
			
			if(!$db->insert($this->table_Name, $verInsert))
			{
				throw new Exception("Unable to insert document version record into the database.");
			}
		
			/* 
				Sets the docVersionId and validates
			*/
			$docVersionId = $this->GetVersionId($docId, $strVersion);
			
			if($docVersionId < 0)
			{
				throw new Exception("Invalid document version record.");
			}
	
			/* 
				Retrieves the path where the file will be stored
			*/
			$strVerDestinationFile = $this->GetPath($strSourceFileName, $docVersionId);
			
			if(strlen($strVerDestinationFile) == 0)
			{
				throw new Exception("Invalid destination file.");
			}
			
			if(!$this->AddFile($strVerDestinationFile, $strTempFileName))
			{ 
				throw new Exception("Failed copying new file.");
			}
	
			/*
				Insert the created name of the file into the database: tblDocumentVersion.  
				The file name will be created with the docVersion_ID.
				docVersion_File will be 8 digits long in addition to the file type extension 
				(i.e. 00000135.doc).
			*/
			$updateValues = array();
			$updateValues[$this->field_File] = $this->BuildFileName($strSourceFileName, $docVersionId);
		
			$updateFilter = array();
			$updateFilter[$this->field_Id] = $docVersionId;
			
			if(!$db->update($this->table_Name, $updateValues, $updateFilter))
			{
				throw new Exception("Unable to update document version file information.");
			}
		
			$this->results->Set('true', "Successfully uploaded file.");
			return $docVersionId;
		}
		catch(Exception $e)
		{
			/*
				Delete document version record if docVersionId is set
			*/
			if($docVersionId > -1)
			{
				$arWhereDocVerId = array();
				$arWhereDocVerId[$this->field_Id] = $docVersionId;
				$db->delete($this->table_Name, $arWhereDocVerId);
			}
			
			/*
				Delete file copied if file is set
			*/
			if(strlen($strVerDestinationFile))
			{
				fclose($strVerDestinationFile);
				if(!unlink($strVerDestinationFile))
				{
					$this->results->Set('false', "Unable to delete file.");
					return -1;
				}
			}
			$this->results->Set('false', $e->getMessage());
			return -1;
		}
	}

//--------------------------------------------------------------------------
	/**
		\brief
			Modifies the version or the file of a document
		\return
			Message to be outputted to the client side
	*/
//--------------------------------------------------------------------------		
	function Modify()
	{
		global $g_oUserSession;
		global $documentUploadPath;

		$db = dmsData::GetInstance();
		$doc = document::GetInstance();

		$docModify = false; // If the document is modified, it will be set to true
	
		$updateValues = array();
		$updateFilter = array();
	
		/*
			Initializing all variables
		*/
		$strOldFile = "";	//	This is the old version file
		$strNewFile = "";	//	This is the new version file
		$strVersion = "";
		$versionId = -1;
		$docId = -1;
		$oldVersion = -1;
		$orgId = -1;
		
		if(isset($_POST['DocModifyVersion']))
		{
			$strVersion = $_POST['DocModifyVersion'];
		}
		
		if(isset($_POST['modVersionID']))
		{
			$versionId = $_POST['modVersionID'];
		}
	
		$oldVersion = $this->GetDocumentVersion($versionId);
	
		if($oldVersion < 0)
		{
			return $this->results->Set('false', "Invalid version ID.");
		}
	
		/*
			The trim() function trims off any extra spaces at the beginning and end of 
			the version strings.
		*/	
		$strVersion = trim($strVersion);

		if(!$this->ValidateVersion($strVersion))
		{ 
			return $this->results->Set('false', "Invalid new document version. Verify format follows: [##.##].");
		}
		
		$docId = $this->GetDocId($versionId);

		if($docId < 0)
		{
			return $this->results->Set('false', "Invalid document ID.");
		}
		
		$orgId = $doc->GetOrgId($docId);
		
		if(!$g_oUserSession->HasRight($this->rights_Modify, $orgId))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		if($this->VersionExists($strVersion, $docId, $versionId))
		{ 
			return $this->results->Set('false', "Document version already exists.");
		}

		/*
			Check if a file was received from the client; validate file
		*/
		if(isset($_FILES['docModifyUpload']['tmp_name']))
		{
			$strVersionSourceFile = $_FILES['docModifyUpload']['tmp_name'];
			
			/*
				Make sure we have a file length. If we don't, the file value was
				set but no file was uploaded. This could happen if the form
				was accessed properly but the user did not submit a file.
			*/
			if(strlen($strVersionSourceFile))
			{
				if(!$this->ValidExtension($_FILES['docModifyUpload']['name']))
				{
					return $this->results->Set('false', "Invalid file type.");
				}
			
				/*
					Verify size of document is between 1b to 50Mb.
				*/
				if($_FILES['docModifyUpload']['size'] > 50000000)
				{
					return $this->results->Set('false', "Invalid file size. Please verify file size is less than 50 MB.");
				}
				
				if($_FILES['docModifyUpload']['size'] < 1)
				{
					return $this->results->Set('false', "Invalid file size. Please verify file size is greater than 1 byte.");
				}
				
				/*
					Validate that we can build the destination path and that the extension is valid
					Checking that only .html, .htm, .doc, .ppt, .xls, .vsd files can be uploaded.
					If bad files are uploaded tell the user the file was rejected.
					File format must be in the form: XXXXXXX.xxxx 
				*/
				$strNewFile = $this->BuildFileName($_FILES['docModifyUpload']['name'], $versionId);

				if(strlen($strNewFile) == 0)
				{
					return $this->results->Set('false', "Unable to build the file name.");
				}
	
				$strOldFile = $this->GetFile($docId, $strVersion);

				if($strOldFile != $strNewFile)
				{
					$updateValues[$this->field_File] = $strNewFile;
	
					$strOldFile = $documentUploadPath .$strOldFile;
					
					fclose($strOldFile);
					unlink($strOldFile);
				}
	
				$strNewFile = $documentUploadPath .$strNewFile;
			}
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
				Build the record
			*/
			$updateFilter[$this->field_Id] = $versionId;
		
			if($strVersion != $oldVersion)
			{
				$updateValues[$this->field_Name] = array();
				$updateValues[$this->field_Name]['value'] = $strVersion;
				$updateValues[$this->field_Name]['type'] = "string";
			}
		
			if(strlen($strNewFile))
			{ 
				if(!$this->AddFile($strNewFile, $strVersionSourceFile))
				{ 
					throw new Exception("Failed loading file. Check document upload path.");
				}
				$docModify = true;
			}
		
			if(sizeof($updateValues))
			{
				if(!$db->update($this->table_Name, $updateValues, $updateFilter))
				{
					throw new Exception("Unable to update document version.");
				}
				$docModify = true;
			}
			
			if($docModify == true)
			{
				return $this->results->Set('true', "Successfully modified document file.");
			}
			else
			{
				return $this->results->Set('true', "Document not modified.");
			}
		}
		
		catch(Exception $e)
		{
			return $this->results->Set('false', $e->getMessage());
		}
	}

//--------------------------------------------------------------------------
	/**
		\brief 
			This function hides the version(s) in the database based on the 
			client side request or the number of current visible versions of a 
			document ID. 
		\param[in] docID
				The document ID passed in to be disabled
		\param[in] versionID
				The document version ID of the document ID passed in to be disabled
		\return
			-  0 if no visible version records found
			- -1 if false 
			- +1 size of visible records if greater then 0
	*/
//--------------------------------------------------------------------------			
	function DisableVersion($docID, $versionID)
	{	
		global $g_oUserSession;
		$db = dmsData::GetInstance();
		$doc = document::GetInstance();

		$strVisible = 0;

		/*
			Verify the user has the rights and is assigned to the organization to 
			have the ability to disable a document.
		*/
		$docOrgId = $doc->GetOrgId($docID);
		
		if(!$g_oUserSession->HasRight($this->rights_Remove, $docOrgId))
		{
			return $this->results->Set($g_oUserSession->results->GetMessage());
			return -1;
		}			
		
		/*
			The passed in version ID must exist in the database and must be numeric
			to disable a document version (if not set to -1).
		*/
		if($versionID != -1)
		{
			if(!$this->Exists($versionID))
			{ 
				$this->results->Set("Invalid document version ID.");
				return -1;
			}	
		}
		
		/*
			Verify the user has the rights and is assigned to the organization to 
			have the ability to disable a document.
		*/
		$docOrgId = $doc->GetOrgId($docID);
		
		if(!$g_oUserSession->HasRight($this->rights_Modify, $docOrgId))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		/*
			Disable document visibility to hide the document when displaying the search results
			on the client side.
		*/
		$updateFields = array();
		$updateFields[$this->field_Visible] = $strVisible;
			
		$updateFilter = array();
		
		if($versionID != -1)
		{
			$updateFilter[$this->field_Id] = $versionID;
		}
		
		$updateFilter[$this->field_DocId] = $docID;
		
		if(!$db->update($this->table_Name, $updateFields, $updateFilter))
		{	
			$this->results->Set("Unable to remove the document version.");
			return -1;
		}

		/*
			Retrieves all the versions of one docID and if only one version is left, 
			the document will also be disabled in the tblDocuments.
		*/
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_DocId = $docID AND $this->field_Visible = 1;";
	
		/*
			Retrieves a list of records
		*/
	  $records = $db->Select($sql);

		if(sizeof($records) == 0)
		{
			$this->results->Set('true', "Document and document version(s) removed successfully.");
			return 0;
		}
		
		$this->results->Set('true', "Document version removed successfully.");
		
		return sizeof($records);
	}

//--------------------------------------------------------------------------
	/**
		\brief
			This function returns the version ID associated with the 
			document ID and version number
		\param[in] docId
			The document ID passed in
		\param[in] strVersion
			The version string passed in
		\return
			- 0 if no records found
			- versionID
	*/
//--------------------------------------------------------------------------	
	function GetVersionId($docId, $strVersion)
	{
		$db = dmsData::GetInstance();
		
		/*
			Returns the numeric doc_ID value of the title
		*/
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strVersion' AND $this->field_DocId = $docId;";
	
		/*
			Retrieves a list of records
		*/
		$records = $db->Select($sql);
		if(sizeof($records) > 0)
		{
			return $records[0][$this->field_Id];
		}
		
		return -1;
	}
	
//--------------------------------------------------------------------------
	/**
		\brief
			Returns the document version string associated
			with the version ID
		\param[in] versionId
			The version ID passed in
		\return
			- "" if no records found
			- version number
	*/
//--------------------------------------------------------------------------	
	function GetDocumentVersion($versionId)
	{
		if(!is_numeric($versionId))
		{
			return "";
		}
		
		$db = dmsData::GetInstance();
		/*
			Returns the numeric doc_ID value of the title
		*/
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Id = $versionId";
	
		/*
			Retrieves a list of records
		*/
		$records = $db->Select($sql);
		if(sizeof($records) > 0)
		{
			return $records[0][$this->field_Name];
		}
		return "";
	}

//--------------------------------------------------------------------------
	/**
		\brief
			Get the current document version file of the requested document
		\param[in] docId
			The document ID passed in
		\return
			The file of the current version 
	*/
//--------------------------------------------------------------------------	
	function GetCurrentVersionFile($docId)
	{
		$highestVersion = -1;
		$value = 0;
	
		$db = dmsData::GetInstance();
		
		/*
			Validate doc id
		*/
	
		$dbTitle = "SELECT $this->field_Name FROM $this->table_Name WHERE $this->field_DocId = $docId;";
	
		$records = $db->Select($dbTitle);
		
		for($counter = 0; $counter < sizeof($records); $counter++)
		{
			$value = $records[$counter][$this->field_Name];
			
			if($value > $highestVersion)
			{
				$highestVersion = $value;
			}
		}
	
		return $this->SendFile($docId, $highestVersion);
	}

//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves and sends the requested version file for the document
		\param[in] docId
			The document ID passed in
		\param[in] strVersion
			The string version number passed in
		\return
			- true if the file was sent successfully
			- false with set message to output to the client
	*/
//--------------------------------------------------------------------------		
	function SendFile($docId, $strVersion)
	{
		global $documentUploadPath;
		$file = $this->GetFile($docId, $strVersion);
		
		if(sizeof($file) == 0)
		{
			return $this->results->Set('false', "No file record found.");
		}
	
		$file= $documentUploadPath.$file;
	
		/*
			Send it out to the client
		*/
		header("Content-type: application/force-download");
		header("Content-Transfer-Encoding: Binary");
		header("Content-length: ".filesize($file));
		header("Content-disposition: attachment; filename=\"".basename($file)."\"");
		readfile("$file");
	
		return true;
	}

//--------------------------------------------------------------------------
	/**
		\brief
			Updates the file name field in the database with the 
			new file name
		\param[in] versionId
			The version ID passed in
		\param[in] strFilename
			The string file name passed in
		\return
			Message to be outputted to the client, either pass/fail
	*/
//--------------------------------------------------------------------------		
	function SetFileName($versionId, $strFilename)
	{
		$db = dmsData::GetInstance();
		$strFullFileName = $this->BuildFileName($strFilename, $versionId);
		if(strlen($strFullFileName) < 1)
		{
			return $this->results->Set('false', "Invalid full file name.");
		}
		
		$updateValues = array();
		$updateValues[$this->field_File] = $strFullFileName;
		
		$updateFilter = array();
		$updateFilter[$this->field_Id] = $versionId;
		
		if(!$db->update($this->table_Name, $updateValues, $updateFilter))
		{
			return $this->results->Set('false', "Unable to update document version file information.");
		}
	
		return $this->results->Set('true', "Document version file name updated.");
	}
	
//-------------------------------------------------------------------
	/**
		\brief 	
			Adds a version to an existing document by calling the
			Add() function
	*/
//-------------------------------------------------------------------
	function AddNewVersion()
	{
		$docId = -1;
		$strVersion = "";
		$strTempFileName = "";
		$strVersionRealName= "";
		/*
			If the user submits a file which is too large we'll get an undefined
			array.  Need to check for file size initially.
			Also need to validate fields.
		*/
		if(isset($_FILES['docVerUpload']['tmp_name']))
		{
			$strTempFileName = $_FILES['docVerUpload']['tmp_name'];
		}

		if(isset($_FILES['docVerUpload']['name']))
		{
			$strVersionRealName = $_FILES['docVerUpload']['name'];
		}

		if(isset($_POST['NewVersion']))
		{
			$strVersion = $_POST['NewVersion'];
		}

		if(isset($_POST['NewVersionDocID']))
		{
			$docId = $_POST['NewVersionDocID'];
		}

		if($_FILES['docVerUpload']['size'] < 1)
		{
			return $this->results->Set('false', "Invalid file size. Please check file size is greater than 1 byte.");
		}
		if($_FILES['docVerUpload']['size'] > 50000000)
		{
			return $this->results->Set('false', "Invalid file size. Please check file size is less than 50 MB.");
		}

		$this->Add($docId, $strVersion, $strTempFileName,$strVersionRealName);
	}
		
//--------------------------------------------------------------------------
	/**
		\brief
			Returns the file associated with the document ID and version
		\param[in] docId
			The document ID passed in
		\param[in] strVersion
			The string version number passed in
		\return
			- "" if file not found
			- file name
	*/
//--------------------------------------------------------------------------	
	function GetFile($docId, $strVersion)
	{
		$db = dmsData::GetInstance();
	
		$dbTitle = "SELECT $this->field_File FROM $this->table_Name WHERE $this->field_DocId = $docId AND $this->field_Name = $strVersion;";
	
		$records = $db->Select($dbTitle);
		
		if(sizeof($records) == 1)
		{
			return $records[0][$this->field_File];
		}
		
		return "";
	}
	
//--------------------------------------------------------------------------
	/**
		\brief
			Converts the name of the file from the SourceFile name 
			to an 8 digit numerical file name based on the docVersionId 
			passed in with 0s added as place holders.
		\param[in] strSourceFile
			The source file passed in
		\param[in] versionId
			The version ID passed in 
		\return
			- "" if file not found
			- strDestFile with the correct format
	*/
//--------------------------------------------------------------------------	
	function BuildFileName($strSourceFile, $versionId)
	{
		if(!strlen($strSourceFile))
		{
			return "";
		}
			
		/*
			Build a valid file name from the source file name,	the record passed in, 
			and then prepend the destination folder information	to store the file at
		*/
		$extension = ereg_replace("^.+\\.([^.]+)$", "\\1", strtolower($strSourceFile));
		
		$extension = "." . $extension;
				
		$strDestFile = str_pad($versionId, 8, "0", STR_PAD_LEFT);

		$strDestFile = $strDestFile . $extension;

		return $strDestFile;
	}
	
//--------------------------------------------------------------------------
	/**
		\brief
			Validates the document version. 
			The version must be in the format ##.##.
		\param[in] $strVersion
			The string version number passed in			
		\return
			- true if the string version is a valid version and correct format
			- false if the title contains an invalid character or format
	*/
//--------------------------------------------------------------------------	
	function ValidateVersion($strVersion)
	{
		return eregi("^[0-9]{0,2}\.[0-9]{1,2}$", $strVersion);
	}

//--------------------------------------------------------------------------
	/**
		\brief
			Validates the document version added is not a duplicate
		\param[in] strVersion
			The string version number passed in			
		\param[in] docId
			The document ID passed in			
		\param[in] excludeID
			The version ID if passed in, otherwise set to -1
		\return
			- true if the version exists
			- false if the version does not exist or validation fails
	*/
//--------------------------------------------------------------------------	
	function VersionExists($strVersion, $docId, $excludeID = -1)
	{
		$db = dmsData::GetInstance();
		
		if(!strlen($strVersion))
		{
			return false;
		}

		if(!is_numeric($docId))
		{
			return false;
		}
	
		/*
			Try to find a record which has the same Document Version in the database
		*/
		if($excludeID != -1)
		{
			$dbVersion = "SELECT * FROM $this->table_Name
						  WHERE ($this->field_Name = '$strVersion' AND $this->field_DocId = $docId) 
						  AND $this->field_Id <> $excludeID;";
		}
		else
		{
			$dbVersion = "SELECT * FROM $this->table_Name 
						  WHERE $this->field_Name = '$strVersion' AND $this->field_DocId = $docId;";
		}
		
		$records = $db->Select($dbVersion);
		if(sizeof($records) > 0)
		{
			return true;
		}
	
		return false;
	}

//-------------------------------------------------------------------
	/**
		\brief 
			Builds the file name from the source file extension
			and passed in version id, and adds the path.
		\param[in] strSourceFile
			The source file passed in
		\param[in] versionId
			the version ID of the document passed in
		\return
			- "" if source file is not set
			- strDestFile (destination file) with the attached path
 */
//-------------------------------------------------------------------	
	function GetPath($strSourceFile, $versionId)
	{
		global $documentUploadPath;
	
		/*
			Verify a file has been passed in
		*/
		if(!strlen($strSourceFile))
		{
			return "";
		}
	
		$strDestFile = $this->BuildFileName($strSourceFile, $versionId);
	
		$strDestFile = $documentUploadPath . $strDestFile;
	
		return $strDestFile;
	}
	
//--------------------------------------------------------------------------
	/**
		\brief
			Removes the file when the file has been copied and uploaded, but 
			an invalid entry was made and the record was not added to the 
			database.
		\param[in] versionID
			The version ID passed in
	*/
//--------------------------------------------------------------------------
	function Remove($versionID)
	{
		$strFileName = $this->GetFileName($versionID);
		
		if(baseAdmin::Remove($versionID))
		{
			/*
				Delete file copied if file is set
			*/
			if(strlen($strFileName))
			{
				fclose($strFileName);
				unlink($strFileName);
			}
		}
	}
	
//--------------------------------------------------------------------------
	/**
		\brief
			This function returns the file name associated with the version ID.
		\param[in] versionID
			The version ID passed in
		\return
			- "" if not found or not valid
			- file name 
	*/
//--------------------------------------------------------------------------
	function GetFileName($versionID)
	{
		$db = dmsData::GetInstance();
		
		if(!is_numeric($versionID))
		{
			return "";
		}
	
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Id = $versionID;";
	
		/*
			Get a list of records
		*/
		$records = $db->Select($sql);
		if(sizeof($records) > 0)
		{
			return $records[0][$this->field_File];
		}
		
		return "";
	}
	
//--------------------------------------------------------------------------
	/**
		\brief 
			This function copies the source file to the destination of the 
			file.
		\param[in] strSourceFile
			The source file that is passed in to be copied to the strDestFile
		\param[in] strDestFile
			The destination file that the file will be copied to
		\return
			- true if the source file is copied to the destination file successfully
			- false if the source file failed to get copied to the destination file
	*/
//--------------------------------------------------------------------------
	function AddFile($strDestFile, $strSourceFile)
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
			Returns the docID of the versionID passed in. 
		\param[in] versionID
			The version ID passed in			
		\return
			- -1 if no records found
			- docID 
	*/
//--------------------------------------------------------------------------
	function GetDocID($versionID)
	{
		$db = dmsData::GetInstance();
		
		if(!is_numeric($versionID))
		{
			return -1;
		}
	
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Id = $versionID;";
	
		/*
			Get a list of records
		*/
		$records = $db->Select($sql);
		if(sizeof($records) > 0)
		{
			return $records[0][$this->field_DocId];
		}
		
		return -1;
	}

//--------------------------------------------------------------------------
	/**
		\brief
			Validates the document extension. Valid file extensions include:
			html, htm, doc, ppt, xls, vsd, pdf
		\param[in] strFileName
			The file name passed in 			
		\return
			- true if file has a valid extension 
			- false if file has an invalid extension
	*/
//--------------------------------------------------------------------------	
	function ValidExtension($strFileName)
	{
		$extension = ereg_replace("^.+\\.([^.]+)$", "\\1", $strFileName);
		
		$extension = $extension;
		
		return eregi("html|htm|doc|ppt|xls|vsd|pdf$", $extension);
	}

//--------------------------------------------------------------------------
	/**
		\brief
			On a successful/failure of a valid file upload this function 
			will be called to display the set message to the client side 
			(modifyDocument.js) indicating the upload has pass/failed.
		\return
			- strValue set to true
	*/
//--------------------------------------------------------------------------	
	function OutputUploadModifyResults()
	{
		$strValue = $this->results->GetResult();
		$strMsg = $this->results->GetMessage();
		
		echo "<html><head><script>window.onload = function ()
			{
				if(parent.oModifyDocument)
				{
					parent.oModifyDocument.DisplayMessage(\"$strValue||$strMsg\");
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
	
//--------------------------------------------------------------------------
	/**
		\brief
			On a successful/failure of a valid file upload this function 
			will be called to display the set message to the client side 
			(addDocumentVersion.js) indicating the upload has pass/failed.
		\return
			- strValue set to true
	*/
//--------------------------------------------------------------------------	
	function OutputUploadVersionResults()
	{
		$strValue = $this->results->GetResult();
		$strMsg = $this->results->GetMessage();
		
		echo "<html><head><script>window.onload = function ()
			{
				if(parent.oAddDocumentVersion)
				{
					parent.oAddDocumentVersion.DisplayMessage(\"$strValue||$strMsg\");
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
			$obj = new documentVersion();
		}
		
		return $obj;
	}
}
?>
