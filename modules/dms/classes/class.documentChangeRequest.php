<?
	require_once('../../../classes/include.php');
	require_once('class.document.php');
	require_once('class.documentVersion.php');
	require_once('class.documentType.php');
	require_once('class.db.php');
	require_once('class.dcrStatus.php');
	require_once('class.documentPriority.php');

/**

	\class documentChangeRequest
		\brief
			Provides universal functionality for 
			objects which perform document change request (validate/add/remove/modify) 
			functionality for single tables.
*/

class documentChangeRequest extends baseAdmin
{
//-------------------------------------------------------------------
	/**
		\brief Default constructor
	*/
//-------------------------------------------------------------------
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblDCR";
		$this->field_Id = "request_ID";
		$this->field_UserId = "user_ID";	
		$this->field_DMSId = "dms_ID";
		$this->field_Type = "request_Type";
		
		/*
			Now set up the rights
		*/
		$rights = rights::GetInstance();
		
		$this->rights_Add = $rights->DMS_Standard;
		$this->rights_Modify = $rights->DMS_Admin;
		
		$this->db = dmsData::GetInstance();
		
		//$this->system_id = 3;
	}
	
//-------------------------------------------------------------------
	/**
		\brief
			Add a document change request to the database
		\return
			- true if the add was successful
			- false if the add was not successful. Check the 
			results text data for details.
	*/
//-------------------------------------------------------------------
	function Add()
	{
		global $g_oUserSession;
		$doc = document::GetInstance();
		$docVer = documentVersion::GetInstance();
		$rights = rights::GetInstance();
		$oLog = cLog::GetInstance();					

		/*
			Initializing all variables
		*/
		$pageNumber = "";
		$stepNumber = "";
		$currentStep = "";
		$requestUpdate = "";
		$strVersion = "";
		
		$docId = -1;
		$versionId = -1;
		$docOrgId = -1;
		$reqType = 0;

		$arRequestItems = array();

		/*
			Make sure we have at least one element
		*/
		$iRequestCount = 0;
		$iCounter = 0;				//	the number of results we have found
		//$haveResults = true;		//	 set to false when we have no more valid options

		if(isset($_POST['id']))
		{
			$docId = $_POST['id'];
		}
		
		if($docId < 0)
		{
			return $this->OutputChangeRequestResults('false', "Unable to retrieve the document ID.");
		}
	
		$docOrgId = $doc->GetOrgId($docId);
		
		if($docOrgId < 0)
		{
			return $this->OutputChangeRequestResults('false', "Invalid document organization ID.");
		}
		
		if(!$g_oUserSession->HasRight($this->rights_Add, $docOrgId))
		{
			return $this->OutputChangeRequestResults('false', $g_oUserSession->results->GetMessage(). "You may not submit a document change request.");
		}

		if(isset($_POST['version']))
		{
			$strVersion = $_POST['version'];
		}
		
		/*
			Set the versionId based on the passed in $docId and selected document version
		*/
		$versionId = $docVer->GetVersionID($docId, $strVersion);
		
		if($versionId < 0)
		{
			return $this->OutputChangeRequestResults('false', "Invalid document version ID.");
		}
		
		if(isset($_POST['count']))
		{
			$iRequestCount = $_POST['count'];
		}

		if($iRequestCount < 1)
		{
			return $this->OutputChangeRequestResults('false', "Document change requests must have items to be submitted.");
		}

		while($iCounter < $iRequestCount)
		{
			$pageNumber = "";
			$stepNumber = "";
			$currentStep = "";
			$requestUpdate = "";

			/*
				<variable>Pos is the name of the current element
				position in the list. These are the names of the elements
				we're looking for results
			*/
			$pageNumberPos = "pageNumber$iCounter";
			$stepNumberPos = "stepNumber$iCounter";
			$currentStepPos = "currentStep$iCounter";
			$requestUpdatePos = "requestUpdate$iCounter";

			if(isset($_POST[$pageNumberPos]))
			{
				$pageNumber = $_POST[$pageNumberPos];
				$pageNumber = CleanupSmartQuotes($pageNumber);
				$pageNumber = trim($pageNumber);
			}

			if(isset($_POST[$stepNumberPos]))
			{
				$stepNumber = $_POST[$stepNumberPos];
				$stepNumber = CleanupSmartQuotes($stepNumber);
				$stepNumber = trim($stepNumber);
			}

			if(isset($_POST[$currentStepPos]))
			{
				$currentStep = $_POST[$currentStepPos];
				$currentStep = CleanupSmartQuotes($currentStep);
				$currentStep = trim($currentStep);
			}

			if(isset($_POST[$requestUpdatePos]))
			{
				$requestUpdate = trim($_POST[$requestUpdatePos]);
				$requestUpdate = CleanupSmartQuotes($requestUpdate);
				$requestUpdate = trim($requestUpdate);
			}

			if($this->ValidateItem($pageNumber, $stepNumber, $currentStep, $requestUpdate))
			{
				/*
					Add the item to the list after validation of each item
				*/
				$arRequestItems[$iCounter] = Array();
				$arRequestItems[$iCounter]['pageNumber'] = $pageNumber;
				$arRequestItems[$iCounter]['stepNumber'] = $stepNumber;
				$arRequestItems[$iCounter]['currentStep'] = $currentStep;
				$arRequestItems[$iCounter]['requestUpdate'] = $requestUpdate;
			}
			else
			{
				$displayNumber = $iCounter + 1;
				return $this->OutputChangeRequestResults('false', "Document change request item ($displayNumber) is invalid. " . $this->results->GetMessage());
			}

			$iCounter++;
		}

		/*
			Now cycle through the entire array and create a transaction, adding the request
			and retrieving the request_ID
		*/
		$reqId = $this->CreateTransaction($g_oUserSession->GetUserID(), $reqType, $versionId);

		if($reqId < 0)
		{
			return $this->OutputChangeRequestResults('false', $this->results->GetMessage());
		}

		/*
			Add each request item
		*/
		for($iCounter = 0; $iCounter < sizeof($arRequestItems); $iCounter++)
		{
			$pageNumber = $arRequestItems[$iCounter]['pageNumber'];
			$stepNumber = $arRequestItems[$iCounter]['stepNumber'];
			$currentStep = $arRequestItems[$iCounter]['currentStep'];
			$requestUpdate = $arRequestItems[$iCounter]['requestUpdate'];

			if(!$this->AddRequestItem($reqId, $pageNumber, $stepNumber, $currentStep, $requestUpdate))
			{
				//$oLog->log($this->system_id, "Failure adding document change request item for [$reqId].", LOGGER_WARNING);
				$this->Remove($reqId);
				return $this->OutputChangeRequestResults('false', "Failed adding document change request item.");
			}
		}

		/*
			Email the DCR to the DMS_Admin
		*/
		if(!$this->EmailDCRAdmin($docId, $reqId, $strVersion, $docOrgId))
		{
			return $this->OutputChangeRequestResults('false', $this->results->GetMessage());
		}

		return $this->OutputChangeRequestResults('true', "Added document change request: [$reqId].");	
	}
		
//-------------------------------------------------------------------
	/**
		\brief
			Add a document change request to the database
		\return
			- true if the add was successful
			- false if the add was not successful. Check the 
			results text data for details.
	*/
//-------------------------------------------------------------------
	function AddTPU()
	{
		global $g_oUserSession;
		$rights = rights::GetInstance();		
		$oLog = cLog::GetInstance();		

		$arRequestItems = array();

		$docName = "";
		$docType = "";
		$docOrg = "";
		$requesterName = "";
		$strModel = "";

		$iRequestCount = 0;		//	the number of results we have found
		$iCounter = 0;			//	counter
		$requesterId = -1;
		$orgId = -1;
		$docVersion = 0;
		$reqType = 1;
		
		if(isset($_POST['count']))
		{
			$iRequestCount = $_POST['count'];
		}

		if($iRequestCount < 1)
		{
			return $this->results->Set('false', "Document change request(s) must have a count of items to be submitted.");
		}
		
		if(isset($_POST['pmName']))
		{
			$requesterName = $_POST['pmName'];
	
			if(strlen($requesterName))
			{
				$requesterId = GetUserID($requesterName);
			}
		}

		if($requesterId < 0)
		{
			return $this->results->Set('false', "Requester name is mispelled or not in the system.");
		}

		if(!strlen($requesterName))
		{
			return $this->results->Set('false', "Requester name is not set.");
		}

		if(isset($_POST['model']))
		{
			$strModel = trim($_POST['model']);
		}

		if(!strlen($strModel))
		{
			return $this->results->Set('false', "Model or project is not set.");
		}

		if(isset($_POST['procName']))
		{
			$docName = $_POST['procName'];
		}

		if(!strlen($docName))
		{
			return $this->results->Set('false', "Document title is not set.");
		}
		
		//$oLog->log($this->system_id, "Document name is set to: [$docName].", LOGGER_DEBUG);

		if(isset($_POST['procType']))
		{
			$docType = $_POST['procType'];
		}

		if(!strlen($docType))
		{
			return $this->results->Set('false', "Document type is not set.");
		}

		if(isset($_POST['procVersion']))
		{
			$docVersion = trim($_POST['procVersion']);
		}

		if(isset($_POST['procDept']))
		{
			$docOrg = $_POST['procDept'];
			
			if(strlen($docOrg))
			{
				$orgId = GetOrgID($docOrg);
			}
		}

		if($orgId < 0)
		{
			return $this->results->Set('false', "Organization name is mispelled or not in the system.");
		}

		while($iCounter < $iRequestCount)
		{
			$refId = -1;

			$bugId = "";
			$referenceName = "";
			$pageNumber = "";
			$stepNumber = "";
			$currentStep = "";
			$requestUpdate = "";
			$requesterComments = "";

			/*
				<variable>Pos is the name of the current element
				position in the list. These are the names of the elements
				we're looking for results
			*/

			$bugIdPos = "bugID$iCounter";
			$referenceNamePos = "refName$iCounter";
			$pageNumberPos = "pageNumber$iCounter";
			$stepNumberPos = "stepNumber$iCounter";
			$currentStepPos = "curStep$iCounter";
			$requestUpdatePos = "requestUpdate$iCounter";
			$requesterCommentsPos = "pmComments$iCounter";

			if(isset($_POST[$bugIdPos]))
			{
				$bugId = $_POST[$bugIdPos];
			}

			if(!strlen($bugId))
			{
				return $this->results->Set('false', "Bug ID is not set.");
			}

			if(isset($_POST[$referenceNamePos]))
			{
				$refId = GetUserID($_POST[$referenceNamePos]);
			}

			if($refId < 0)
			{
				return $this->results->Set('false', "Reference (tester name) is mispelled or not in the system.");
			}
			
			if(isset($_POST[$pageNumberPos]))
			{
				$pageNumber = trim($_POST[$pageNumberPos]);
			}

			if(!strlen($pageNumber))
			{
				return $this->results->Set('false', "Page number is not set.");
			}

			if(isset($_POST[$stepNumberPos]))
			{
				$stepNumber = trim($_POST[$stepNumberPos]);
			}

			if(!strlen($stepNumber))
			{
				return $this->results->Set('false', "Step number is not set.");
			}

			if(isset($_POST[$currentStepPos]))
			{
				$currentStep = trim($_POST[$currentStepPos]);
			}

			if(!strlen($currentStep))
			{
				return $this->results->Set('false', "Current step description is not set.");
			}

			if(!$this->ValidateLoose($currentStep))
			{
				return $this->results->Set('false', "Current step contains invalid characters.[$currentStep]");	
			}

			if(isset($_POST[$requestUpdatePos]))
			{
				$requestUpdate = trim($_POST[$requestUpdatePos]);
			}

			if(!strlen($requestUpdate))
			{
				return $this->results->Set('false', "Requested update description is not set.");
			}

			if(!$this->ValidateLoose($requestUpdate))
			{
				return $this->results->Set('false', "Requested update contains invalid characters.");	
			}

			if(isset($_POST[$requesterCommentsPos]))
			{
				$requesterComments = trim($_POST[$requesterCommentsPos]);
			}

			if(!strlen($requesterComments))
			{
				return $this->results->Set('false', "PM Comments is not set.");
			}

			if(!$this->ValidateText($requesterComments))
			{
				return $this->results->Set('false', "PM Comments contains invalid characters.");	
			}

			/*
				Add the item to the list
			*/
			$arRequestItems[$iCounter] = Array();
			$arRequestItems[$iCounter]['bugId'] = $bugId;
			$arRequestItems[$iCounter]['refId'] = $refId;
			$arRequestItems[$iCounter]['pageNumber'] = $pageNumber;
			$arRequestItems[$iCounter]['stepNumber'] = $stepNumber;
			$arRequestItems[$iCounter]['curStep'] = $currentStep;
			$arRequestItems[$iCounter]['requestUpdate'] = $requestUpdate;
			$arRequestItems[$iCounter]['requesterComments'] = $requesterComments;

			$iCounter++;
		}

		/*
			Now cycle through the entire array and create a transaction, adding the request
			and retrieving the request_ID
		*/
		$reqId = $this->CreateTransaction($requesterId, $reqType);		
		
		if($reqId < 0)
		{
			return $this->results->Set('false', $this->results->GetMessage());
		}

		/*
			Create a record for the TaskFlag data into tblTaskFlag 
		*/
		if(!$this->AddTPURequest($reqId, $docName, $docType, $docVersion, $strModel, $orgId))
		{
			return $this->results->Set('false', $this->results->GetMessage());
		}
		
		/*
			Add each request item
		*/
		for($iCounter = 0; $iCounter < sizeof($arRequestItems); $iCounter++)
		{
			$bugId = $arRequestItems[$iCounter]['bugId'];
			$refId = $arRequestItems[$iCounter]['refId'];
			$pageNumber = $arRequestItems[$iCounter]['pageNumber'];
			$stepNumber = $arRequestItems[$iCounter]['stepNumber'];
			$currentStep = $arRequestItems[$iCounter]['curStep'];
			$requestUpdate = $arRequestItems[$iCounter]['requestUpdate'];
			$requesterComments = $arRequestItems[$iCounter]['requesterComments'];

			if(!$this->AddRequestItem($reqId, $pageNumber, $stepNumber, $currentStep, $requestUpdate, $bugId, $refId, $requesterComments))
			{
				//$oLog->log($this->system_id, "Failure adding TPU item for [$reqId].", LOGGER_WARNING);
				$this->Remove($reqId);
				return $this->results->Set('false', "Failed adding TPU item.");
			}
		}

		/*
			Email the DCR to the DMS_Admin
		*/
		if(!$this->EmailTPUAdmin($reqId, $docName, $docType, $docVersion, $orgId))
		{
			return $this->results->Set('false', $this->results->GetMessage());
		}

		return $this->results->Set('true', "Added (TPU) document change request: [$reqId].");
	}
	//--------------------------------------------------------------------------
	/**
		\brief Adds a journal entry to the database
		\param strJournalSubject
				The user entered subject of the journal entry 
				(The person the journal entry is about). 
		\param strJournalBody 
				The user entered journal body.
		\param strJournalCategory
				The user selected journal category. 
		\return
			-	True
					The journal entry will be uploaded to the database.
			-	False
					The journal entry will not be uploaded to the database.					
	*/
	//--------------------------------------------------------------------------
	function NewRequest()
	{
		$doc = document::GetInstance();
		$oDocType = documentType::GetInstance();
		$oOrg = organization::GetInstance();
		$oPriority = documentPriority::GetInstance();
		
		global $g_oUserSession;
		
		$docTitle = "";
		$docType = "";
		$docOrg = "";
		$docDescription = "";		
		$docPriority = "";
		$docDeadline = "";
		$rqNumber = "";
		
		$docTypeId = -1;
		$docOrgId = -1;
		$reqType = 2;
		$priorityId = 1;

		if(isset($_POST['title']))
		{
			$docTitle = $_POST['title'];
		}

		$docTitle = preg_replace('/\s+/', ' ', trim($docTitle));

		if(!$doc->ValidateTitle($docTitle))
		{
			return $this->OutputCreateRequestResults('false', "The new document title is smaller than 5 characters or contains an invalid character.");
		}

		if(isset($_POST['type']))
		{
			$docType = $_POST['type'];
			$docTypeId = $oDocType->GetID($docType);
		}

		if($docTypeId < 0)
		{ 
			return $this->OutputCreateRequestResults('false', "Please select a document type for the new document.");
		}
		
		if(isset($_POST['organization']))
		{
			$docOrg = $_POST['organization'];
			$docOrgId = $oOrg->GetID($docOrg);
		}

		if($docOrgId < 0)
		{ 
			return $this->OutputCreateRequestResults('false', "Please select an organization that the new document will belong to.");
		}
				
		if(isset($_POST['description']))
		{
			$docDescription = $_POST['description'];
		}		
		
		$docDescription = preg_replace('/\s+/', ' ', trim($docDescription));

		if(!$this->ValidateText($docDescription))
		{ 
			return $this->OutputCreateRequestResults('false', "The new document description is smaller than 1 character or contains an invalid character.");
		}

		if(!$g_oUserSession->HasRight($this->rights_Add, $docOrgId))
		{
			return $this->OutputCreateRequestResults('false', $g_oUserSession->results->GetMessage());
		}
		
		if(isset($_POST['priority']))
		{
			$docPriority = $_POST['priority'];
			$priorityId = $oPriority->GetID($docPriority);
		}		
		
		if(isset($_POST['deadline']))
		{
			$docDeadline = $_POST['deadline'];
		}	
			
		/*--------------------------------------------------------------------------
			Checks to make sure the Expiration Date is after the date of submission. 
		----------------------------------------------------------------------------*/		  
		if(strlen($docDeadline) != 0)
		{
			$todays_date = date("Y-m-d");
			
			/*--------------------------------------------------------------------------
				Make sure we have a valid year
			----------------------------------------------------------------------------*/			
			$dateFields = explode('-', $docDeadline);
 			
 			if(sizeof($dateFields) != 3)
 			{
 				return $this->OutputCreateRequestResults('false', "Deadline date is invalid: $docDeadline");
 			}
 			
 			$year = intval($dateFields[0]);
  			$month = intval($dateFields[1]);
  			$day = intval($dateFields[2]);
  			
  			if(($year == 0) || ($month == 0) || ($day == 0))
  			{
 				return $this->OutputFormResults('false', "Deadline date is invalid.");
			}
			
			$today = strtotime($todays_date);
			$expiration_date = strtotime($docDeadline);

			if ($expiration_date <= $today) 
			{     
 				return $this->OutputCreateRequestResults('false', "Deadline date must be after the submission date.");
			}
		}
				
		if(isset($_POST['rq']))
		{
			$rqNumber = $_POST['rq'];

			if(strlen($rqNumber) > 0)
			{
				if(!$this->ValidateText($rqNumber))
				{ 
					$rqNumber = preg_replace('/\s+/', ' ', trim($rqNumber));
					return $this->OutputCreateRequestResults('false', "The RQ# entered contains invalid characters.");
				}
			}
		}		
		
		$reqId = $this->CreateTransaction($g_oUserSession->GetUserID(), $reqType);

		if($reqId < 0)
		{ 
			return $this->OutputCreateRequestResults('false', $this->results->GetMessage());
		}

		if(!$this->AddNewRequest($reqId, $docTitle, $docDescription, $docTypeId, $docOrgId, $priorityId, $docDeadline, $rqNumber))
		{
			return $this->OutputCreateRequestResults('false', $this->results->GetMessage());
		}

		/*
			Email the new DCR to the DMS_Admin
		*/
		if(!$this->EmailNewDCRAdmin($reqId, $docTitle, $docType, $docDescription, $docOrgId))
		{
			return $this->results->Set('false', $this->results->GetMessage());
		}

		return $this->OutputCreateRequestResults('true', "Added document creation request: [$reqId].");
	}
//--------------------------------------------------------------------------
	/**
		\brief
			Sends an email to the admin of the document based on the organization the 
			document belongs to informing the admin a DCR has been submitted.  
		\param[in] docId
			The document Id			
		\param[in] reqId
			The created request Id
		\param[in] strVersion
			The document version		
		\param[in] docOrgId
			The document organization Id			
		\return
			- true if the email was sent successfully
			- false if an error occurred sending the email
	*/
//--------------------------------------------------------------------------
	function EmailDCRAdmin($docId, $reqId, $strVersion, $docOrgId)
	{
		$doc = document::GetInstance();
		$docType = documentType::GetInstance();
		$rights = rights::GetInstance();

		$mailer = new email();

		$strTitle = "";
		$strType = "";

		$docTypeId = -1;
		
		$strTitle = $doc->GetName($docId);
		
		if(!strlen($strTitle))
		{
			return $this->results->Set('false', "Unable to retrieve the document title.");
		}
		
		$docTypeId = $doc->GetDocTypeID($docId);
		
		if($docTypeId < 0)
		{
			return $this->results->Set('false', "Unable to retrieve the document type ID.");
		}
		
		$strType = $docType->GetName($docTypeId);
		
		if(!strlen($strType))
		{
			return $this->results->Set('false', "Unable to retrieve the document type.");
		}

		$strEmailSubject = "DCR";
		$strEmailMessage = "Document Change Request [$reqId] has been submitted:<br><br>
		<b>Document Title:</b> $strTitle<br>
		<b>Document Type:</b> $strType<br>
		<b>Document Version:</b> $strVersion";
				
		if($mailer->SendToRight($strEmailSubject, $strEmailMessage, $rights->DMS_Admin, $docOrgId) == 0)
		{
			$strResult = "Email sent to document Admin.";
		}
		else
		{
			$strResult = "Error sending email to document Admin: [" . $mailer->results->GetMessage()."].";
		}
		
		return $this->results->Set('true', $strResult);
	}
//--------------------------------------------------------------------------
	/**
		\brief
			Sends an email to the admin of the document based on the organization the 
			document belongs to informing the admin a TPU has been submitted.  
		\param[in] reqId
			The created request Id
		\param[in] docName
			The document name			
		\param[in] docType
			The document type
		\param[in] docVersion
			The document version		
		\param[in] docOrgId
			The document organization Id			
		\return
			- true if the email was sent successfully
			- false if an error occurred sending the email
	*/
//--------------------------------------------------------------------------
	function EmailTPUAdmin($reqId, $docName, $docType, $docVersion, $docOrgId)
	{
		$rights = rights::GetInstance();

		$mailer = new email();

		if($docVersion == 0)
		{
			$docVersion = "N/A";	
		}
		
		$strEmailSubject = "TPU";
		$strEmailMessage = "Document Change Request [$reqId] has been submitted:<br><br>
		<b>Document Title:</b> $docName<br>
		<b>Document Type:</b> $docType<br>
		<b>Document Version:</b> $docVersion";
				
		if($mailer->SendToRight($strEmailSubject, $strEmailMessage, $rights->DMS_Admin, $docOrgId) == 0)
		{
			$strResult = "Email sent to document Admin.";
		}
		else
		{
			$strResult = "Error sending email to document Admin: [" . $mailer->results->GetMessage()."].";
		}
		
		return $this->results->Set('true', $strResult);
	}
//--------------------------------------------------------------------------
	/**
		\brief
			Sends an email to the admin of the document based on the organization the 
			document belongs to informing the admin a TPU has been submitted.  
		\param[in] reqId
			The created request Id
		\param[in] docName
			The document name			
		\param[in] docType
			The document type
		\param[in] docVersion
			The document version		
		\param[in] docOrgId
			The document organization Id			
		\return
			- true if the email was sent successfully
			- false if an error occurred sending the email
	*/
//--------------------------------------------------------------------------
	function EmailNewDCRAdmin($reqId, $docTitle, $docType, $docDescription, $docOrgId)
	{
		$rights = rights::GetInstance();

		$mailer = new email();

		$strEmailSubject = "DCR";
		$strEmailMessage = "Document Creation Request [$reqId] has been submitted:<br><br>
		<b>New Document Title:</b> $docTitle<br>
		<b>New Document Type:</b> $docType<br><br>
		<b>Description:</b> $docDescription";
				
		if($mailer->SendToRight($strEmailSubject, $strEmailMessage, $rights->DMS_Admin, $docOrgId) == 0)
		{
			$strResult = "Email sent to document Admin.";
		}
		else
		{
			$strResult = "Error sending email to document Admin: [" . $mailer->results->GetMessage()."].";
		}
		
		return $this->results->Set('true', $strResult);
	}
//--------------------------------------------------------------------------
	/**
		\brief
			Performs the initial steps to add a document change request 
			to the system 
		\param[in] userId
			The ID of the user submitting the request
		\param[in] reqType
			The type of request
			- 0: Document Change Request from Catena
			- 1: TPU from Task Flag
			- 2: Document Create Request from Catena
		\param[in] versionId
			The document version ID
		\return
			- reqId if the request was created and the reqId was selected
					successfully
			- -1 if the request was not created successfully
	*/
//--------------------------------------------------------------------------
	function CreateTransaction($userId, $reqType, $versionId = -1)
	{
		$dcrStatus = dcrStatus::GetInstance();			//	the request status object
		$oLog = cLog::GetInstance();					//	the log object

		/*
			Add the record
		*/
		$arInsert = array();
		$arInsert[$this->field_UserId] = $userId;
		$arInsert[$this->field_Type] = $reqType;
		
		if($reqType == 0)
		{
			$arInsert[$this->field_DMSId] = $versionId;
		}
		
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			$this->results->Set('false', "Failed creating transaction.");
			return -1;	
		}

		/*
			To find the last inserted request_ID we user the LAST_INSERT_ID()
			function in order to obtain the correct request_ID and not another
			ID that was entered based off the same passed in userId and versionId 
		*/

		$strSQL = "	SELECT 
						LAST_INSERT_ID() AS $this->field_Id";

		$arRecord = $this->db->Select($strSQL);
		
		$reqId = $arRecord[0][$this->field_Id];	
		//$userId = 0;

		if(!$dcrStatus->Add($reqId, $userId, "Pending", "Initial State"))
		{
			//$oLog->log($this->system_id, "Failure setting initial pending status for request [$reqId].", LOGGER_WARNING);
			$this->Remove($reqId);
			$this->results->Set('false', $dcrStatus->results->GetMessage());
			return -1;
		}

		$this->results->Set('true', "Transaction created properly.");
		return $reqId;
	}

//--------------------------------------------------------------------------
	/**
		\brief
			Adds an individual request item to the system. 
		\param[in] reqId
			The id of the request we're adding the item to
		\param[in] pageNumber
			The page number field of the item
		\param[in] stepNumber
			The step number field of the item
		\param[in] currentStep
			The current step field of the item
		\param[in] requestUpdate
			The request update field of the item
		\return
			- true if the item was added successfully
			- false if an error occurred adding the item
	*/
//--------------------------------------------------------------------------	
	function AddRequestItem($reqId, $pageNumber, $stepNumber, $currentStep, $requestUpdate, $bugId = -1, $refId = -1, $comments = "")
	{
		if($bugId < 0)
		{
			if(!$this->ValidateItem($pageNumber, $stepNumber, $currentStep, $requestUpdate))
			{
				return false;
			}
		}
		/*
			The record does not exist, add it
		*/
		$arInsert = array();

		$arInsert['dcrItem_PageNumber'] = $pageNumber;

		$arInsert['dcrItem_StepNumber'] = array();
		$arInsert['dcrItem_StepNumber']['value'] = $stepNumber;
		$arInsert['dcrItem_StepNumber']['type'] = "string";

		$arInsert['dcrItem_CurrentStep'] = $currentStep;
		$arInsert['dcrItem_RequestUpdate'] = $requestUpdate;
		$arInsert['request_ID'] = $reqId;
				
		if($bugId > 0)
		{	
			$arInsert['dcrItem_BugID'] = $bugId;
			$arInsert['dcrItem_Comments'] = $comments;
			$arInsert['user_ID'] = $refId;
		}
		
		if(!$this->db->insert("tblDCRItem", $arInsert))
		{
			return $this->OutputChangeRequestResults('false', "Database Error: " . $this->db->results-GetMessage());
		}

		return true;
	}

//--------------------------------------------------------------------------
	/**
		\brief
			Adds the TPU data into the database
		\param[in] reqId
			The ID of the user submitting the request
		\param[in] docName
			The passed in document title
		\param[in] docType
			The passed in document type
		\param[in] docVersion
			The passed in document version
		\param[in] strModel
			The passed in model or project
		\param[in] orgId
			The passed in orgId that manages the document
		\return
			- true if the data was entered successfully
			- false if the data was not entered successfully
	*/
//--------------------------------------------------------------------------
	function AddTPURequest($reqId, $docName, $docType, $docVersion, $strModel, $orgId)
	{
		$arInsert = array();
		$arInsert[$this->field_Id] = $reqId;
		$arInsert['dcrTaskFlag_ProcName'] = $docName;
		$arInsert['dcrTaskFlag_ProcType'] = $docType;
		$arInsert['dcrTaskFlag_ProcVer'] = $docVersion;
		$arInsert['dcrTaskFlag_Model'] = $strModel;
		$arInsert['org_ID'] = $orgId;
										
		if(!$this->db->insert("tblDCRTaskFlag", $arInsert))
		{
			$this->results->Set('false', "Failed entering TPU data.");
			return false;	
		}

		$this->results->Set('true', "Transaction created properly.");
		return true;
	}
//--------------------------------------------------------------------------
	/**
		\brief
			Adds the TPU data into the database
		\param[in] reqId
			The ID of the user submitting the request
		\param[in] docName
			The passed in document title
		\param[in] docType
			The passed in document type
		\param[in] orgId
			The passed in orgId that manages the document
		\param[in] priorityId
			The passed in priority ID based on the priority of the document
		\param[in] docDeadline
			The passed in deadline of the document (if set)
		\return
			- true if the data was entered successfully
			- false if the data was not entered successfully
	*/
//--------------------------------------------------------------------------
	function AddNewRequest($reqId, $docTitle, $docDesc, $typeId, $orgId, $priorityId, $docDeadline, $rqNumber)
	{
		$arInsert = array();
		$arInsert[$this->field_Id] = $reqId;
		$arInsert['dcrNew_Title'] = $docTitle;
		$arInsert['dcrNew_Description'] = $docDesc;
		$arInsert['docType_ID'] = $typeId;
		$arInsert['org_ID'] = $orgId;
		$arInsert['dcrPriority_ID'] = $priorityId;
						
		if(strlen($docDeadline))
		{
			$arInsert['dcrNew_Deadline'] = $docDeadline;
		}

		if(strlen($rqNumber))
		{
			$arInsert['dcrNew_RQNumber'] = $rqNumber;
		}

		if(!$this->db->insert("tblDCRNew", $arInsert))
		{
			$this->results->Set('false', "Failed entering new DCR data.");
			return false;	
		}

		$this->results->Set('true', "Transaction created properly.");
		return true;
	}
//--------------------------------------------------------------------------
	/**
		\brief
			Validates an individual item.
		\param[in] pageNumber
			The passed in page number
		\param[in] stepNumber
			The passed in step number
		\param[in] currentStep
			The passed in current step
		\param[in] requestUpdate
			The passed in request update field
		\return
			- true if all the item fields are valid
			- false if any of the item fields are invalid
	*/
//--------------------------------------------------------------------------	
	function ValidateItem($pageNumber, $stepNumber, $currentStep, $requestUpdate)
	{
		global $g_oUserSession;
       			
		/*	
			trim() 
				function trims off any extra spaces at the beginning and end of 
				the strings. 
			preg_replace() 
				looks for any extra spaces within the current step and
				requested update strings and replaces them with one space.
		*/		
		$pageNumber = trim($pageNumber);
		$stepNumber = preg_replace('/\s+/', ' ', trim($stepNumber));
		$currentStep = preg_replace('/\s+/', ' ', trim($currentStep));
		$requestUpdate = preg_replace('/\s+/', ' ', trim($requestUpdate));
		
   		/*
			Validate the passed in DCR item inputs before adding the item to the request
		*/
		if(!$this->ValidatePageNumber($pageNumber))
		{ 
			return $this->results->Set('false', "Page number is smaller than 1 digit or contains invalid characters.");
		}
		
		if(!$this->ValidateStepNumber($stepNumber))
		{ 
			return $this->results->Set('false', "Step number is smaller than 1 character or contains invalid characters.");
		}	

		if(!$this->ValidateText($currentStep))
		{
			return $this->results->Set('false', "Current Step is smaller than 1 character or contains an invalid character.");			
		}
		
		if(!$this->ValidateText($requestUpdate))
		{
			return $this->results->Set('false', "Requested Update is smaller than 1 character or contains an invalid character.");			
		}		

		return $this->results->Set('true', "Document change request item valid.");
	}
//--------------------------------------------------------------------------
	/**
		\brief
			Validates the document page number.	Length must be 1-3 digits.
			Valid characters include: numbers only (0-9) 
		\param[in] pageNum
			The page number passed in			
		\return
			- true if the pageNum is a valid page number
			- false if the pageNum contains an invalid character or length
	*/
//--------------------------------------------------------------------------	
	function ValidatePageNumber($pageNum)
	{
		return eregi("^[0-9]{1,3}$", $pageNum);
	}

//--------------------------------------------------------------------------
	/**
		\brief
			Validates the document step number.	Length must be 1-10 characters.
			Valid characters include: letters, numbers, . : ) and space 
		@param[in] stepNum
			The step number passed in			
		\return
			- true: if the stepNum is a valid step number
			- false: if the stepNum contains an invalid character or length
	*/
//--------------------------------------------------------------------------	
	function ValidateStepNumber($stepNum)
	{
		return eregi("^[a-z0-9 \.:)]{1,10}$", $stepNum);
	}
	
//--------------------------------------------------------------------------
	/**
		\brief
			Validates the Current Step and Requested Update fields.
			Length must be a minimum of 3 characters. Valid description 
			characters include: letters, numbers, . ' , ; : / ( ) - and space		
		\param[in] detail
			The passed in detail; either current step or requested update
		\return
			- true if the detail is valid
			- false if the detail contains an invalid character or length
	*/
//--------------------------------------------------------------------------	
	function ValidateText($detail)
	{
		return eregi("^[a-z0-9 \n\r.!?',\";:\$@%#_/()\\\*\+\=~-]{1,}$",  $detail);
	}
//-------------------------------------------------------------------


// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
	function ValidateLoose($detail) {
		$len = strlen($detail);
		for ($a = 0; $a < $len; $a++) {
			$o = ord($detail[$a]);
			if ($o < 32 or $o > 126) {
				if ( ! ($o == 9 or $o == 10 or $o == 12 or $o == 13)) {
					return false;
				}
			}
		}
		return mysql_real_escape_string($detail);
	}
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=


	/**
		\brief 
			Returns the organization of a DCR based on the 
			requestId
		\return
			class object 
	*/
//-------------------------------------------------------------------
	function GetOrgID($id)
	{
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Id = $id;";

		/*
			Get a list of records
		*/
		$record = $this->db->Select($sql);

		/*
			Document Change Request
		*/
		if($record[0][$this->field_Type] == 0)
		{
			$sql = "SELECT 
						tblDocuments.org_ID 
				
					FROM
						tblDCR
						LEFT JOIN
							tblDocumentVersion ON tblDCR.dms_ID = tblDocumentVersion.docVersion_ID
								LEFT JOIN
									tblDocuments ON tblDocumentVersion.doc_ID = tblDocuments.doc_ID	
				
					WHERE $this->field_Id = $id";					
	
			$arOrg = $this->db->Select($sql);
		
			if(sizeof($arOrg) == 1)
			{
				return $arOrg[0]['org_ID'];
			}
		}
		
		/*
			TPU Request through Task Flag
		*/
		if($record[0][$this->field_Type] == 1)
		{
			$sql = "SELECT 
						tblDCRTaskFlag.org_ID 
				
					FROM
						tblDCR
						LEFT JOIN
							tblDCRTaskFlag ON tblDCR.request_ID = tblDCRTaskFlag.request_ID
				
					WHERE tblDCR.request_ID = $id";					
	
			$arOrg = $this->db->Select($sql);
		
			if(sizeof($arOrg) == 1)
			{
				return $arOrg[0]['org_ID'];
			}
		}
		
		/*
			Document Creation Request
		*/
		if($record[0][$this->field_Type] == 2)
		{
			$sql = "SELECT 
						tblDCRNew.org_ID 
				
					FROM
						tblDCR
						LEFT JOIN
							tblDCRNew ON tblDCR.request_ID = tblDCRNew.request_ID
				
					WHERE tblDCR.request_ID = $id";					
	
			$arOrg = $this->db->Select($sql);

			if(sizeof($arOrg) == 1)
			{
				return $arOrg[0]['org_ID'];
			}
		}	
		
		return -1;
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
			$obj = new documentChangeRequest();
		}
		
		return $obj;
	}
	
//--------------------------------------------------------------------------
	/**
		\brief
			On a successful/failure of a valid file upload this function 
			will be called to display the set message to the client side 
			(documentChangeRequest.js) indicating the upload has pass/failed.
		\param[in] strValue
			The passed in string value (true or false)
		\param[in] strMsg
			The passed in message set
		\return
			- strValue set to true
	*/
//--------------------------------------------------------------------------	
	function OutputChangeRequestResults($strValue, $strMsg)
	{		
		echo "<html><head><script>window.onload = function ()
			{
				if(parent.oDocumentChangeRequest)
				{
					parent.oDocumentChangeRequest.DisplayMessage(\"$strValue||$strMsg\");
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
			(documentChangeRequest.js) indicating the upload has pass/failed.
		\param[in] strValue
			The passed in string value (true or false)
		\param[in] strMsg
			The passed in message set
		\return
			- strValue set to true
	*/
//--------------------------------------------------------------------------	
	function OutputCreateRequestResults($strValue, $strMsg)
	{		
		echo "<html><head><script>window.onload = function ()
			{
				if(parent.oDCRNew)
				{
					parent.oDCRNew.DisplayMessage(\"$strValue||$strMsg\");
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
		Returns an array of the passed in request id DCR document details 
*/
//--------------------------------------------------------------------------
	function GetDCRDocInfo($reqId)
	{
		global $g_oUserSession;
	
		$oOrganization = organization::GetInstance();
		$db = dmsData::GetInstance();
		$oRights = rights::GetInstance();
		$oSystemAccess = systemAccess::GetInstance();
		$oUser = cUserContainer::GetInstance();
	
		if($reqId < 0)
		{
			return null;
		}
	
		$userId = $g_oUserSession->GetUserID();
	
		if(!$g_oUserSession->HasRight($oRights->DMS_Admin))
		{
			if(!$g_oUserSession->HasRight($oRights->DMS_Writer))
			{
				if(!$g_oUserSession->HasRight($oRights->DMS_Standard))
				{
					return null;
				}
			}
		}
	
		$strSQL = "
			SELECT
				tblDocuments.doc_Title
				, tblDocumentVersion.docVersion_Ver
				, tblDocumentType.docType_Name
					
			FROM
				tblDCR
				LEFT JOIN
					tblDocumentVersion ON tblDCR.dms_ID = tblDocumentVersion.docVersion_ID
						LEFT JOIN
							tblDocuments ON tblDocumentVersion.doc_ID = tblDocuments.doc_ID
							LEFT JOIN
								tblDocumentType ON tblDocuments.docType_ID = tblDocumentType.docType_ID
	
			WHERE tblDCR.request_ID = $reqId";
	
		$arDCRDetails = $db->select($strSQL);

		if(sizeof($arDCRDetails) < 1)
		{
			return null;
		}

		return $arDCRDetails;
	}

//--------------------------------------------------------------------------
/**
	\brief 
		Returns an array of the passed in request id DCR document details 
*/
//--------------------------------------------------------------------------
	function GetDCRDocTitle($reqId)
	{
		global $g_oUserSession;
	
		$oOrganization = organization::GetInstance();
		$db = dmsData::GetInstance();
		$oRights = rights::GetInstance();
		$oSystemAccess = systemAccess::GetInstance();
		$oUser = cUserContainer::GetInstance();
	
		if($reqId < 0)
		{
			return null;
		}
	
		$userId = $g_oUserSession->GetUserID();
	
		if(!$g_oUserSession->HasRight($oRights->DMS_Admin))
		{
			if(!$g_oUserSession->HasRight($oRights->DMS_Writer))
			{
				if(!$g_oUserSession->HasRight($oRights->DMS_Standard))
				{
					return null;
				}
			}
		}
	
		$strSQL = "		SELECT
							*	
						FROM
							tblDCR
						WHERE 
							request_ID = $reqId";
	
		$arDCRs = $db->select($strSQL);

		if(sizeof($arDCRs) < 1)
		{
			return null;
		}

		$reqType = $arDCRs[0]["request_Type"];
		
		if($reqType == 0)
		{
			$strSQL = "	SELECT
							tblDocuments.doc_Title	
						FROM
							tblDCR
								LEFT JOIN 
								tblDocumentVersion ON tblDCR.dms_ID = tblDocumentVersion.docVersion_ID
									LEFT JOIN
									tblDocuments ON tblDocumentVersion.doc_ID = tblDocuments.doc_ID
						WHERE 
							tblDCR.request_ID = $reqId";

			$arTitle = $db->select($strSQL);		
			$strTitle = $arTitle[0]['doc_Title'];
		}
		
		else if($reqType == 1)
		{
			$strSQL = "	SELECT
							dcrTaskFlag_ProcName
						FROM
							tblDCRTaskFlag
						WHERE 
							request_ID = $reqId";
	
			$arTitle = $db->select($strSQL);		
			$strTitle = $arTitle[0]['dcrTaskFlag_ProcName'];
		}

		else if($reqType == 2)
		{
			$strSQL = "	SELECT
							dcrNew_Title
						FROM
							tblDCRNew
						WHERE 
							request_ID = $reqId";
	
			$arTitle = $db->select($strSQL);		
			$strTitle = $arTitle[0]['dcrNew_Title'];
		}
		
		else
		{
			return null;
		}

		return $strTitle;
	}

	//--------------------------------------------------------------------------
/**
	\brief 
		Returns an array of the passed in request id TPU document details 
*/
//--------------------------------------------------------------------------
	function GetTPUDocInfo($reqId)
	{
		global $g_oUserSession;
	
		$oOrganization = organization::GetInstance();
		$db = dmsData::GetInstance();
		$oRights = rights::GetInstance();
		$oSystemAccess = systemAccess::GetInstance();
		$oUser = cUserContainer::GetInstance();
	
		if($reqId < 0)
		{
			return null;
		}
	
		$userId = $g_oUserSession->GetUserID();
	
		if(!$g_oUserSession->HasRight($oRights->DMS_Admin))
		{
			if(!$g_oUserSession->HasRight($oRights->DMS_Writer))
			{
				if(!$g_oUserSession->HasRight($oRights->DMS_Standard))
				{
					return null;
				}
			}
		}
	
		$strSQL = "
			SELECT
				tblDCRTaskFlag.dcrTaskFlag_ProcName
				, tblDCRTaskFlag.dcrTaskFlag_ProcType
				, tblDCRTaskFlag.dcrTaskFlag_ProcVer
				, tblDCRTaskFlag.dcrTaskFlag_Model
									
			FROM
				tblDCR
				LEFT JOIN
					tblDCRTaskFlag ON tblDCR.request_ID = tblDCRTaskFlag.request_ID
	
			WHERE tblDCR.request_ID = $reqId";
	
		$arTPUDetails = $db->select($strSQL);

		if(sizeof($arTPUDetails) < 1)
		{
			return null;
		}

		return $arTPUDetails;
	}

/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
	function GetDCRNewTitle($reqId)
	{
		global $g_oUserSession;
	
		$oOrganization = organization::GetInstance();
		$db = dmsData::GetInstance();
		$oRights = rights::GetInstance();
		$oSystemAccess = systemAccess::GetInstance();
		$oUser = cUserContainer::GetInstance();
	
		if($reqId < 0)
		{
			return null;
		}
	
		$userId = $g_oUserSession->GetUserID();
	
		if(!$g_oUserSession->HasRight($oRights->DMS_Admin))
		{
			if(!$g_oUserSession->HasRight($oRights->DMS_Writer))
			{
				if(!$g_oUserSession->HasRight($oRights->DMS_Standard))
				{
					return null;
				}
			}
		}
		
		$strSQL = "	SELECT
						dcrNew_Title
					FROM
						tblDCRNew
					WHERE 
						request_ID = $reqId";

		$arDCRTitle = $db->select($strSQL);
	
		if(sizeof($arDCRTitle) < 1)
		{
				return null;
		}

		return $arDCRTitle;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Adds a Initial State to the existing DCRs in the system and a 
			status of Pending.
	*/
	//--------------------------------------------------------------------------
	function StatusFix()
	{
		global $g_oUserSession;

		$oDCRStatus = dcrStatus::GetInstance();			//	the transaction status object
		$oDCRStatusType = dcrStatusType::GetInstance();			//	the transaction status object
				
		$db = dmsData::GetInstance();

		/*
			Get an array of request IDs from tblDCR that are not in the 
			tblDCRStatus
		*/
		$strSQL = "SELECT
						*
					FROM
						tblDCR WHERE request_ID NOT IN (SELECT request_ID FROM tblDCRStatus)";

		$arRequests = $db->select($strSQL);

		foreach($arRequests as $request)
		{
			/*
				add Initial State: Pending
			*/
			$reqId = $request['request_ID'];
			$userId = $request['user_ID'];
			$status = "Pending";
			$strComment = "Initial State";
			$currentStatus = 1;
			
			$statusId = $oDCRStatusType->GetID($status);
			
			$arInsert = array();
			$arInsert['status_ID'] = $statusId;
			$arInsert['request_ID'] = $reqId;
			$arInsert['user_ID'] = $userId;
			$arInsert['dcrstatus_Comments'] = $strComment;
			$arInsert['dcrstatus_Current'] = $currentStatus;

			if(!$this->db->insert("tblDCRStatus", $arInsert))
			{
				return $this->results->Set('false', "Unable to add '$reqId' due to database error.");
			}
	
		}
		
		echo "Request count: " . sizeof($arRequests)."<BR>";
	
		foreach($arRequests as $request)
		{
			$reqId = $request['request_ID'];

			echo "Added 'Pending' status for request: $reqId<BR>";
		}			
	}
}
?>
