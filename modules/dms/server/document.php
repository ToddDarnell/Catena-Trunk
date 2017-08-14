<?
	require_once('../../../classes/include.php');
	require_once('../classes/class.document.php');
	require_once('../classes/class.documentVersion.php');
	require_once('../classes/class.documentChangeRequest.php');
	require_once('../classes/class.db.php');

//--------------------------------------------------------------------------
/**
		\brief Performs the server side functionality for document requests
*/
//--------------------------------------------------------------------------
	
	if(!isset($_GET['action']))
	{ 
		/*
			action MUST be set.
		*/
		exit;
	};

	$strVersion = "";
	$strPageNum = "";
	$strStepNum = "";
	$strCurrentStep = "";
	$strRequestUpdate = "";
	$strStatus = "";
	$strComment = "";
	$strWriter = "";
	$strClarifyUser = "";
	$role = "";
	$action = "";
	
	$docId = -1;
	$versionId = -1;
	$reqId = -1;
	
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch($fieldName)
			{
				case "id":
					$docId = $val;
					break;
				
				case "version":
					$strVersion = $val;
					break;
				
				case "versionId":
					$versionId = $val;
					break;

				case "pageNumber":
					$strPageNum = $val;
					break;
				
				case "stepNumber":
					$strStepNum = $val;
					break;
				
				case "currentStep":
					$strCurrentStep = $val;
					break;
				
				case "requestUpdate":
					$strRequestUpdate = $val;
					break;
				
				case "requestId":
					$reqId = $val;
					break;

				case "role":
					$role = $val;
					break;

				case "status":
					$strStatus = $val;
					break;

				case "comment":
					$strComment = $val;
					break;

				case "writer":
					$strWriter = $val;
					break;

				case "clarifyUser":
					$strClarifyUser = $val;
					break;

				case "action":
					$action = strtolower($val);
					break;
			}
		}
	}

	/*
		This if block is here to make sure all files are reuploaded when they're
		called. the cached version is not used, except in the case of the 
		file. Note, this header call causes problems for Internet Explorer
		and therefore cannot be used a the head of file downloads
	*/
	
	if($action != "getdocumentfile"	&& $action != "getcurrentversionfile")
	{
		ClearCache();
	}
		
	$doc = document::GetInstance();
	$docVer = documentVersion::GetInstance();
	$oDCR = documentChangeRequest::GetInstance();
	$oDCRStatus = dcrStatus::GetInstance();
	
	switch($action)
	{
		case "validateitem":	
			$oDCR->ValidateItem($strPageNum, $strStepNum, $strCurrentStep, $strRequestUpdate);
			$oDCR->results->Send();
			break;

		case "disabledoc":
			$doc->Disable($docId, $versionId);
			$doc->results->Send();
			break;

		case "getdocumentlist":
			GetDocumentList();
			break;

		case "getdocumentversions":
			GetDocumentVersions();
			break;

		case "getdocumenttitle":
			$strTitle = $doc->GetName($docId);
			
			if(strlen($strTitle))
			{
				$doc->results->Set('true', $strTitle);
			}

			$doc->results->Send();
			break;

		case "getdocumentfile":
			
			if(!$docVer->SendFile($docId, $strVersion))
			{
				$docVer->results->Send();
			}
			break;

		case "getcurrentversionfile":
			/*
				If this function fails that means no document was returned
				so we send a message. Otherwise we just exit
			*/
			if(!$docVer->GetCurrentVersionFile($docId))
			{
				$docVer->results->Send();
			}
			break;

		case "gettransactionqueue":
			GetDCRTransactionQueue();
			break;

		case "getitemlist":
			GetItemList();
			break;

		case "getitemdetails":
			GetItemDetails();
			break;

		case "getnewdcrdetails":
			GetNewDCRDetails();
			break;

		case "statuschange":
			global $g_oUserSession;
			$userId = $g_oUserSession->GetUserID();
			$oDCRStatus->Add($reqId, $userId, $strStatus, $strComment, $strWriter, $role, $strClarifyUser);
			$oDCRStatus->results->Send();
			break;

		case "dcrstatuslist":
			GetDCRStatusList($role, $strStatus);
			break;

		case "dcrwriterlist":
			GetDCRWriterList($reqId, $role);
			break;

		case "searchstatuslist":
			GetSearchStatusList();
			break;

		case "getdcrsearch":
			GetDCRSearch();
			break;

		case "dcrorgs":
			GetDCROrgs();
			break;

		case "getassignedqueue":
			GetDCRAssignedQueue();
			break;

		case "getrequesterqueue":
			GetDCRRequesterQueue();
			break;

		case "getstatushistory":
			$arResults = $oDCRStatus->GetStatus($reqId);
			$oXML = new XML;
			$oXML->serializeElement($arResults, "element");
			$oXML->outputXHTML();
			break;

		case "statusfix":
			$oDCRStatus->DCRStatusUpdate();
			//$oDCR->StatusFix();
			break;
	}

	exit;

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function GetDCROrgs()
{
	$arResults = array();

	$oSystemAccess = systemAccess::GetInstance();
	global $g_oUserSession;
	$oRights = rights::GetInstance();
	
	$oXML = new XML;
	$arRights = $oSystemAccess->GetRightOrgs($oRights->DMS_Admin);
	
	foreach($arRights as $right)
	{
		if($g_oUserSession->HasRight($oRights->DMS_Standard, $right['org_ID']))
		{
			$arResults[] = $right;
		}
	}

	$oXML->serializeElement($arResults, "element");
	$oXML->outputXHTML();
}
//--------------------------------------------------------------------------
/**
	\brief 
		Outputs the XML list of the documents based upon what requirements
		have been set by the client. 
*/
//--------------------------------------------------------------------------
function GetDocumentList()
{
	global $g_oUserSession;
	$db = dmsData::GetInstance();
	$oRights = rights::GetInstance();
	$oOrganization = organization::GetInstance();
	$oSystemAccess = systemAccess::GetInstance();

	$whereClause = array();
	$arOrgs = array();

	$oXML = new XML;

	$strOrg = "";
	$orgId = 0;	
	$userId= 0;	
	
    $userId = $g_oUserSession->GetUserID();

	if(isset($_GET['title']))
	{
		if(strlen($_GET['title']))
		{
			$whereClause['tblDocuments.doc_Title'] = $_GET['title'];
		}
	}

	if(isset($_GET['description']))
	{
		if(strlen($_GET['description']))
		{
			$whereClause['tblDocuments.doc_Description'] = $_GET['description'];
		}
	}
	
	if(isset($_GET['type']))
	{
		if(strlen($_GET['type']))
		{
			$whereClause['tblDocumentType.docType_Name'] = $_GET['type'];
		}
	}

	if(isset($_GET['organization']))
	{
		if(strlen($_GET['organization']))
		{
			$strOrg = $_GET['organization'];
		}
	}
	
	if(strlen($strOrg))
	{
		/*
			Get the passed in organization Id and create an array with all the 
			children of the passed in organization
		*/
		$orgId = $oOrganization->GetID($strOrg);

		if(!$g_oUserSession->HasRight($oRights->DMS_Standard, $strOrg))
		{	
			$oXML->outputXHTML();
			return false;
		}
		
		$arOrgs = $oOrganization->GetChildren($strOrg);
	}

	if(!strlen($strOrg))
	{
		/*
			Gets all of the organizations and child organizations assigned to the user if
			organization not selected for searching. 
		*/
		$arOrgs = $oSystemAccess->GetRightAssignedOrgs($userId, $oRights->DMS_Standard);
	}
	/*
		The following sql string builds a list of documents. 
		All of the numbered fields, docType_ID, org_ID,	etc are aliased with their name.
		The next part of the process is including the filters based upon what the user requested.
	*/

	$strSQL = "
		SELECT
			tblDocuments.doc_Title
			, tblDocuments.doc_Description
			, tblDocumentType.docType_Name
			, tblDocuments.org_ID
			, tblDocuments.doc_ID
			, tblDocuments.doc_Visible
				
		FROM
			tblDocuments
				LEFT JOIN
					tblDocumentType ON tblDocuments.docType_ID = tblDocumentType.docType_ID
				WHERE tblDocuments.doc_Visible = 1";

	$firstTime = true;

	foreach($whereClause as $field => $val)
	{
		if($val != "")
		{
			$strSQL .= " AND $field like '%$val%'";
		}
	}
	
	if(isset($_GET['id']))
	{
		if(strlen($_GET['id']))
		{
			$docID = $_GET['id'];
			$strSQL .= " AND tblDocuments.doc_ID = $docID ";
		}
	}
	
	if(strlen($strOrg))
	{
			$strSQL.= " AND (tblDocuments.org_ID = $orgId";

		foreach($arOrgs as $org)
		{
			$strSQL.= " OR";
			
			$strSQL .= " tblDocuments.org_ID = " . $org['org_ID']."";
		}
		
		$strSQL.= ")";
	}
	
	if(!strlen($strOrg))
	{
		$strSQL.= " AND (";

		foreach($arOrgs as $org)
		{
			if($firstTime != true)
			{			
				$strSQL.= " OR";
			}
			
			if($firstTime == true)
			{			
				$firstTime = false;
			}

			$strSQL .= " tblDocuments.org_ID = " . $org['org_ID']."";
		}
		
		$strSQL.= ")";
	}
	$strSQL .= " ORDER BY tblDocuments.doc_Title";

	$arResults = $db->select($strSQL);
	
	for($i = 0; $i < sizeof($arResults); $i++)
	{
		$arOrg = $oOrganization->Get($arResults[$i]['org_ID']);
		$arResults[$i]['org_Short_Name'] = $arOrg['org_Short_Name'];
	}
	
	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
}
//--------------------------------------------------------------------------
/**
	\brief 
		Outputs the XML list of the document versions associated to the 
		docID passed in from the client side.
*/
//--------------------------------------------------------------------------
function GetDocumentVersions()
{
	$db = dmsData::GetInstance();

	$oXML = new XML;
	
	$docId = -1;
	
	if(isset($_GET["id"]))
	{
		if(is_numeric($_GET["id"]))
		{
			$docId = $_GET["id"];
		}
	}	
	
	/*
		The following sql string builds a list of versions of one document.
	*/
	$strSQL = "SELECT
					docVersion_Ver,
					docVersion_ID,
					docVersion_Visible
				FROM
					tblDocumentVersion
				WHERE doc_ID = $docId AND docVersion_Visible = 1 ORDER BY docVersion_Ver DESC";

	$arResults = $db->select($strSQL);

	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
}
//--------------------------------------------------------------------------
/**
	\brief 
		Outputs the XML list of the dcr transactions to the 
		client side for DMS_Admins to view the DCR Queue.
*/
//--------------------------------------------------------------------------
function GetDCRTransactionQueue()
{
	global $g_oUserSession;

	$oOrganization = organization::GetInstance();
	$db = dmsData::GetInstance();
	$oRights = rights::GetInstance();
	$oSystemAccess = systemAccess::GetInstance();
	$oUser = cUserContainer::GetInstance();
	$oDCRStatus = dcrStatus::GetInstance();
	
	$oXML = new XML();

	$userId = $g_oUserSession->GetUserID();
	
	if(!$g_oUserSession->HasRight($oRights->DMS_Admin))
	{
		$oXML->outputXHTML();
		return false;
	}
	
	/*
		We want all transactions from users who are in the user's
		DCR queue.
		So filter the user's by the organizations they're in
		and then by the transactions those users have
	*/
	$arAdminOrgs = $oSystemAccess->GetRightAssignedOrgs($userId, $oRights->DMS_Admin);

	$strSQL = "SELECT
				  status_ID 
			FROM 
				tblDCRStatusType 
			WHERE
				status_AdminQueue = 1";
				
	$arStatuses = $db->Select($strSQL);

	if(sizeof($arStatuses) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	$firstTime = true;

	$strSQL = "SELECT 
					DISTINCT request_ID
				FROM 
					tblDCRStatus 
				WHERE (";
	
	foreach($arStatuses as $status)
	{
		if($firstTime == true)
		{
			$firstTime = false;
		}
		else
		{
			$strSQL .= " OR ";
		}

		$strSQL .= " status_ID = " . $status['status_ID'];
	}
	
	$strSQL.= ") AND dcrstatus_Current = 1"; 

	$arCurrentRequests = $db->Select($strSQL);

	if(sizeof($arCurrentRequests) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}
		
	$strSQL = "
		SELECT
			tblDCR.request_ID
			, tblDCR.request_Type
			, tblDocuments.doc_Title
			, tblDocuments.org_ID
			, tblDCRTaskFlag.dcrTaskFlag_ProcName
			, tblDCRTaskFlag.org_ID
			, tblDCRNew.dcrNew_Title
			, tblDCRNew.dcrNew_Description
			, tblDCRNew.docType_ID
			, tblDCRNew.org_ID
					
		FROM
			tblDCR
			LEFT JOIN
				tblDocumentVersion ON tblDCR.dms_ID = tblDocumentVersion.docVersion_ID
					LEFT JOIN
						tblDocuments ON tblDocumentVersion.doc_ID = tblDocuments.doc_ID
						LEFT JOIN
							tblDCRTaskFlag ON tblDCR.request_ID = tblDCRTaskFlag.request_ID
							LEFT JOIN
								tblDCRNew ON tblDCR.request_ID = tblDCRNew.request_ID

				WHERE ((tblDocuments.doc_Visible = 1 AND (";

	$firstTime = true;

	foreach($arAdminOrgs as $org)
	{
		if($firstTime != true)
		{			
			$strSQL.= " OR";
		}
		
		if($firstTime == true)
		{			
			$firstTime = false;
		}

		$strSQL .= " tblDocuments.org_ID = " . $org['org_ID']."";
	}
		
	$strSQL.= ")) OR (";

	$firstTime = true;

	foreach($arAdminOrgs as $org)
	{
		if($firstTime != true)
		{			
			$strSQL.= " OR";
		}
		
		if($firstTime == true)
		{			
			$firstTime = false;
		}

		$strSQL .= " tblDCRTaskFlag.org_ID = " . $org['org_ID']."";
	}
		
	$strSQL.= ") OR (";

	$firstTime = true;

	foreach($arAdminOrgs as $org)
	{
		if($firstTime != true)
		{			
			$strSQL.= " OR";
		}
		
		if($firstTime == true)
		{			
			$firstTime = false;
		}

		$strSQL .= " tblDCRNew.org_ID = " . $org['org_ID']."";
	}	
		
	$strSQL.= ")) AND (";

	$firstTime = true;

	foreach($arCurrentRequests as $arCurrentRequests)
	{
		if($firstTime == true)
		{
			$firstTime = false;
		}
		else
		{
			$strSQL .= " OR ";
		}

		$strSQL .= " tblDCR.request_ID = " . $arCurrentRequests['request_ID'];
	}
		
	$strSQL.= ") ORDER BY request_ID DESC";
	$arDCR = $db->select($strSQL);

	if(sizeof($arDCR) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<list>\n";

	foreach($arDCR as $request)
	{
		$reqId = $request['request_ID'];
		$docTitle = $request['doc_Title'];
		$reqType = $request['request_Type'];
		$procName = $request['dcrTaskFlag_ProcName'];
		$newDocTitle = $request['dcrNew_Title'];

		$strResults.= "<element>\n";
		$strResults.= "<id>$reqId</id>\n";
		$strResults.= "<request_Type>$reqType</request_Type>\n";

		if(strlen($docTitle) < 1)
		{
			if(strlen($procName) < 1)
			{
				if(strlen($newDocTitle) > 0)
				{
					$docTitle = $newDocTitle;
				}
			}
			else
			{
				$docTitle = $procName;
			}
		}

		$strResults.= "<document_Title>$docTitle</document_Title>\n";
	
		$arCurrentStatus = $oDCRStatus->GetCurrentStatus($reqId);

		if(sizeof($arCurrentStatus) > 0)
		{
			$status_Name = $arCurrentStatus['status_Name'];
			$dcrStatusId = $arCurrentStatus['dcrstatus_ID'];
			
			if($status_Name == "Assigned" || $status_Name == "Peer Review")
			{
				$assignedUserID = $oDCRStatus->GetCurrentWriter($dcrStatusId);
				$assignedUser = $oUser->GetName($assignedUserID);
				$strResults.= "<assigned_User>$assignedUser</assigned_User>\n";		
			}
			
			else if($status_Name == "In Progress")
			{
				$assignedUserID = $arCurrentStatus['user_ID'];
				$assignedUser = $oUser->GetName($assignedUserID);
				$strResults.= "<assigned_User>$assignedUser</assigned_User>\n";			
			}
			
			else
			{
				$assignedUser = "";
				$strResults.= "<assigned_User>$assignedUser</assigned_User>\n";			
			}
		}

		$strResults.= "<status_Name>$status_Name</status_Name>\n";
		$strResults.= "</element>\n";			
	}

	$strResults.="</list>\n";

	ClearCache();
	header("Content-Type: text/xml");
	echo $strResults;
}

/*--------------------------------------------------------------------------
	-	description
			GetReceiverList returns to the client the list
			of receivers based upon what requirements they have
	-	params
	-	return
--------------------------------------------------------------------------*/
function GetItemList()
{
	$oUser = cUserContainer::GetInstance();
	$oDCR = documentChangeRequest::GetInstance();
	$oOrganization = organization::GetInstance();
	$db = dmsData::GetInstance();
	$oDCRStatus = dcrStatus::GetInstance();

	$oXML = new XML();

	$strCurrentStep = "";
	$strRequestUpate = "";
	$strPageNum = "";
    $strStepNum = "";
    $strOrg = "";
    
	$iRequest = -1;	
	$reqId = -1;
	$reqType = -1;
	$dcrStatusId = -1;
	$assignedUserID = -1;
		
	if(isset($_GET["requestId"]))
	{
		if(is_numeric($_GET["requestId"]))
		{
			$iRequest = $_GET["requestId"];
		}
	}	

	if($iRequest < 0)
	{
		$oXML->outputXHTML();
		return true;
	}

	$strSQL = "	SELECT
					*
				FROM
					tblDCR
				WHERE 1 = 1 ";

	if($iRequest > -1)
	{
		$strSQL .= "AND tblDCR.request_ID = $iRequest ";
	}

	$arRequest = $db->Select($strSQL);

	if(sizeof($arRequest) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<list>\n";

	$reqId = $arRequest[0]['request_ID'];
	$reqType = $arRequest[0]['request_Type'];
	$reqDate = $arRequest[0]['request_Date'];

	$userName= $oUser->GetName($arRequest[0]['user_ID']);

	/*
		Now filter by other fields
	*/
	$strSQL = "	SELECT
					dcrItem_ID
				,	dcrItem_PageNumber
				,	dcrItem_StepNumber
				,	dcrItem_CurrentStep
				,	dcrItem_RequestUpdate
				,	dcrItem_Comments
				,	user_ID
				FROM
					tblDCRItem
				WHERE request_ID = $reqId ORDER BY dcrItem_PageNumber ASC";

	$arDCRItems = $db->Select($strSQL);

	if(sizeof($arDCRItems) > 0)
	{
		/*
			Retrieve the status of this transaction so we can add it to the results
		*/
		$arCurrentStatus = $oDCRStatus->GetCurrentStatus($reqId);

		$strResults.= "<element>\n";
		$strResults.= "<id>$reqId</id>\n";
		$strResults.= "<request_Type>$reqType</request_Type>\n";
		$strResults.= "<requester>$userName</requester>\n";
		$strResults.= "<request_Date>$reqDate</request_Date>\n";

		if($reqType == 0)
		{
			$arDCRDetails = $oDCR->GetDCRDocInfo($reqId);

			$strResults.= "<document_Title>".$arDCRDetails[0]["doc_Title"]."</document_Title>\n";
			$strResults.= "<document_Type>".$arDCRDetails[0]["docType_Name"]."</document_Type>\n";
			$strResults.= "<document_Version>".$arDCRDetails[0]["docVersion_Ver"]."</document_Version>\n";
		}
		
		if($reqType == 1)
		{
			$arTPUDetails = $oDCR->GetTPUDocInfo($reqId);

			$strResults.= "<procedure_Name>".$arTPUDetails[0]["dcrTaskFlag_ProcName"]."</procedure_Name>\n";
			$strResults.= "<procedure_Type>".$arTPUDetails[0]["dcrTaskFlag_ProcType"]."</procedure_Type>\n";
			$strResults.= "<procedure_Version>".$arTPUDetails[0]["dcrTaskFlag_ProcVer"]."</procedure_Version>\n";
			$strResults.= "<model>".$arTPUDetails[0]["dcrTaskFlag_Model"]."</model>\n";
		}
		
		foreach($arCurrentStatus as $field => $val)
		{
			$strResults.= "<$field>$val</$field>\n";
		}

		if(sizeof($arCurrentStatus) > 0)
		{
			$status_Name = $arCurrentStatus['status_Name'];
			$dcrStatusId = $arCurrentStatus['dcrstatus_ID'];
			
			if($status_Name == "Assigned" || $status_Name == "Peer Review")
			{
				$assignedUserID = $oDCRStatus->GetCurrentWriter($dcrStatusId);
				$assignedUser = $oUser->GetName($assignedUserID);
				$strResults.= "<assigned_User>$assignedUser</assigned_User>\n";			
			}
			
			if($status_Name == "In Progress")
			{
				$assignedUserID = $arCurrentStatus['user_ID'];
				$assignedUser = $oUser->GetName($assignedUserID);
				$strResults.= "<assigned_User>$assignedUser</assigned_User>\n";			
			}
		}

		/*
			Now add all of the elements the user has added
		*/

		foreach($arDCRItems as $item)
		{
			$strResults.= "<item>\n";
			
			foreach($item as $field => $val)
			{
				$strResults.= "<$field>$val</$field>\n";
			}
			
			$strResults.= "</item>\n";
		}
		
		$strResults.= "</element>\n";
	}

	$strResults.="</list>\n";
	
	ClearCache();
	header("Content-Type: text/xml");
	echo stripslashes($strResults);
}

/*--------------------------------------------------------------------------
	-	description
			GetReceiverList returns to the client the list
			of receivers based upon what requirements they have
	-	params
	-	return
--------------------------------------------------------------------------*/
function GetItemDetails()
{
	$oUser = cUserContainer::GetInstance();
	$oDCR = documentChangeRequest::GetInstance();
	$db = dmsData::GetInstance();

	$oXML = new XML;
	
	$itemId = -1;
	$userName = "";
	$pmComments = "";
	
	if(isset($_GET["itemId"]))
	{
		$itemId = $_GET["itemId"];
	}	
	
	/*
		The following sql string builds a list of versions of one document.
	*/
	$strSQL = "	SELECT
					dcrItem_PageNumber
				,	dcrItem_StepNumber
				,	dcrItem_CurrentStep
				,	dcrItem_RequestUpdate
				,	dcrItem_Comments
				,	user_ID
				,   request_ID
				FROM
					tblDCRItem
				WHERE dcrItem_ID = $itemId ";
				

	$arDetails = $db->select($strSQL);

	if(sizeof($arDetails) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}
		
	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<list>\n";
	
	if(sizeof($arDetails) > 0)
	{
		$requestId = $arDetails[0]["request_ID"];
		$docTitle = $oDCR->GetDCRDocTitle($requestId);
		
		$userName = $oUser->GetName($arDetails[0]["user_ID"]);
		$pmComments = $arDetails[0]["dcrItem_Comments"];
		
		$strResults.= "<element>\n";
		$strResults.= "<id>$itemId</id>\n";
		$strResults.= "<requestId>$requestId</requestId>\n";
		$strResults.= "<document_Title>$docTitle</document_Title>\n";
		$strResults.= "<page_Number>".$arDetails[0]["dcrItem_PageNumber"]."</page_Number>\n";
		$strResults.= "<step_Number>".$arDetails[0]["dcrItem_StepNumber"]."</step_Number>\n";
		$strResults.= "<current_Step>".$arDetails[0]["dcrItem_CurrentStep"]."</current_Step>\n";
		$strResults.= "<request_Update>".$arDetails[0]["dcrItem_RequestUpdate"]."</request_Update>\n";		
		$strResults.= "<reference_Name>$userName</reference_Name>\n";
		$strResults.= "<tpu_Comment>$pmComments</tpu_Comment>\n";
	}

	$strResults.= "</element>\n</list>\n";

	ClearCache();
	header("Content-Type: text/xml");
	echo stripslashes($strResults);
}

/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
function GetNewDCRDetails()
{
	$oUser = cUserContainer::GetInstance();
	$db = dmsData::GetInstance();
	$oDCRStatus = dcrStatus::GetInstance();
	
	$oXML = new XML;
	
	$requestId = -1;
	$dcrStatusId = -1;
	$userName = "";
	
	if(isset($_GET["requestId"]))
	{
		$requestId = $_GET["requestId"];
	}	
	
	/*
		The following sql string builds a list of versions of one document.
	*/
	$strSQL = "	SELECT
				tblDCRNew.dcrNew_Title
				, tblDCRNew.dcrNew_Description
				, tblDocumentType.docType_Name
				, tblDCRPriority.dcrPriority_Name
				, tblDCRNew.dcrNew_Deadline
				, tblDCR.user_ID
				, tblDCR.request_Type
				, tblDCRNew.dcrNew_RQNumber
				, tblDCR.request_Date
				
				FROM
					tblDCRNew
					LEFT JOIN
						tblDocumentType ON tblDCRNew.docType_ID = tblDocumentType.docType_ID
						LEFT JOIN
						tblDCRPriority ON tblDCRNew.dcrPriority_ID = tblDCRPriority.dcrPriority_ID
							LEFT JOIN
							tblDCR ON tblDCRNew.request_ID = tblDCR.request_ID

				WHERE tblDCRNew.request_ID = $requestId";
				

	$arDetails = $db->select($strSQL);

	if(sizeof($arDetails) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}
		
	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<list>\n";
	
	if(sizeof($arDetails) > 0)
	{
		$userName = $oUser->GetName($arDetails[0]["user_ID"]);

		$strResults.= "<element>\n";
		$strResults.= "<id>$requestId</id>\n";
		$strResults.= "<requester>$userName</requester>\n";
		$strResults.= "<request_Type>".$arDetails[0]["request_Type"]."</request_Type>\n";
		$strResults.= "<request_Date>".$arDetails[0]["request_Date"]."</request_Date>\n";
		$strResults.= "<document_Title>".$arDetails[0]["dcrNew_Title"]."</document_Title>\n";
		$strResults.= "<document_Type>".$arDetails[0]["docType_Name"]."</document_Type>\n";
		$strResults.= "<document_Description>".$arDetails[0]["dcrNew_Description"]."</document_Description>\n";
		$strResults.= "<document_Priority>".$arDetails[0]["dcrPriority_Name"]."</document_Priority>\n";
		$strResults.= "<document_Deadline>".$arDetails[0]["dcrNew_Deadline"]."</document_Deadline>\n";
		$strResults.= "<document_RQNumber>".$arDetails[0]["dcrNew_RQNumber"]."</document_RQNumber>\n";
	}
	
	$arCurrentStatus = $oDCRStatus->GetCurrentStatus($requestId);

	if(sizeof($arCurrentStatus) > 0)
	{
		$status_Name = $arCurrentStatus['status_Name'];
		$dcrStatusId = $arCurrentStatus['dcrstatus_ID'];
		
		if($status_Name == "Assigned" || $status_Name == "Peer Review")
		{
			$assignedUserID = $oDCRStatus->GetCurrentWriter($dcrStatusId);
			$assignedUser = $oUser->GetName($assignedUserID);
			$strResults.= "<assigned_User>$assignedUser</assigned_User>\n";			
		}

		if($status_Name == "In Progress")
		{
			$assignedUserID = $arCurrentStatus['user_ID'];
			$assignedUser = $oUser->GetName($assignedUserID);
			$strResults.= "<assigned_User>$assignedUser</assigned_User>\n";			
		}

		$strResults.= "<status_Name>$status_Name</status_Name>\n";
	}
	
	$strResults.= "</element>\n</list>\n";

	ClearCache();
	header("Content-Type: text/xml");
	echo stripslashes($strResults);
}

//--------------------------------------------------------------------------
/**
	\brief 
		Outputs the XML list of the dcr assigned transactions to the 
		client side for DMS_Writer to view their assigned DCRs.
*/
//--------------------------------------------------------------------------
function GetDCRAssignedQueue()
{
	global $g_oUserSession;

	$oOrganization = organization::GetInstance();
	$db = dmsData::GetInstance();
	$oRights = rights::GetInstance();
	$oSystemAccess = systemAccess::GetInstance();
	$oUser = cUserContainer::GetInstance();
	$oDCRStatus = dcrStatus::GetInstance();
	
	$oXML = new XML();

	if(!$g_oUserSession->HasRight($oRights->DMS_Writer))
	{
		$oXML->outputXHTML();
		return false;
	}

	$userId = $g_oUserSession->GetUserID();
	
	/*
		We want all transactions from users who are in the user's
		DCR queue.
		So filter the user's by the organizations they're in
		and then by the transactions those users have
	*/

	$strSQL = "SELECT
				  status_ID 
			FROM 
				tblDCRStatusType 
			WHERE
				status_WriterQueue = 1";
				
	$arStatuses = $db->Select($strSQL);

	if(sizeof($arStatuses) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	$strSQL = "SELECT
				    tblDCRStatus.request_ID
				FROM 
					tblDCRAssign
						LEFT JOIN tblDCRStatus ON tblDCRAssign.dcrstatus_ID = tblDCRStatus.dcrstatus_ID
				WHERE 
					(tblDCRAssign.assign_WriterID = $userId) AND tblDCRAssign.dcrstatus_ID IN (
					
					SELECT 
						dcrstatus_ID 
					FROM
						tblDCRStatus
					WHERE
						 (";
				
					$firstTime = true;
				
					foreach($arStatuses as $status)
					{
						if($firstTime == true)
						{
							$firstTime = false;
						}
						else
						{
							$strSQL .= " OR ";
						}
				
						$strSQL .= " status_ID = " . $status['status_ID'];
					}
					
	$strSQL.= ")) AND (dcrstatus_Current = 1) UNION"; 

	$strSQL.= "	SELECT
					request_ID
				FROM
					tblDCRStatus
				WHERE
					(user_ID = $userId AND status_ID = 5 AND dcrstatus_Current = 1) "; 
	
	$arCurrentRequests = $db->Select($strSQL);

	if(sizeof($arCurrentRequests) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}
		
	$strSQL = "
		SELECT
			tblDCR.request_ID
			, tblDCR.request_Type
			, tblDocuments.doc_Title
			, tblDocuments.org_ID
			, tblDCRTaskFlag.dcrTaskFlag_ProcName
			, tblDCRTaskFlag.org_ID
			, tblDCRNew.dcrNew_Title
			, tblDCRNew.dcrNew_Description
			, tblDCRNew.docType_ID
			, tblDCRNew.org_ID
					
		FROM
			tblDCR
			LEFT JOIN
				tblDocumentVersion ON tblDCR.dms_ID = tblDocumentVersion.docVersion_ID
					LEFT JOIN
						tblDocuments ON tblDocumentVersion.doc_ID = tblDocuments.doc_ID
						LEFT JOIN
							tblDCRTaskFlag ON tblDCR.request_ID = tblDCRTaskFlag.request_ID
							LEFT JOIN
								tblDCRNew ON tblDCR.request_ID = tblDCRNew.request_ID

		WHERE (";
		
	$firstTime = true;

	foreach($arCurrentRequests as $arCurrentRequests)
	{
		if($firstTime == true)
		{
			$firstTime = false;
		}
		else
		{
			$strSQL .= " OR ";
		}

		$strSQL .= " tblDCR.request_ID = " . $arCurrentRequests['request_ID'];
	}
		
	$strSQL.= ") ORDER BY request_ID DESC";
	$arDCR = $db->select($strSQL);

	if(sizeof($arDCR) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<list>\n";

	foreach($arDCR as $request)
	{
		$reqId = $request['request_ID'];
		$docTitle = $request['doc_Title'];
		$reqType = $request['request_Type'];
		$procName = $request['dcrTaskFlag_ProcName'];
		$newDocTitle = $request['dcrNew_Title'];
		
		$strResults.= "<element>\n";
		$strResults.= "<id>$reqId</id>\n";
		$strResults.= "<request_Type>$reqType</request_Type>\n";

		if(strlen($docTitle) < 1)
		{
			if(strlen($procName) < 1)
			{
				if(strlen($newDocTitle) > 0)
				{
					$docTitle = $newDocTitle;
				}
			}
			else
			{
				$docTitle = $procName;
			}
		}

		$strResults.= "<document_Title>$docTitle</document_Title>\n";
	
		$arCurrentStatus = $oDCRStatus->GetCurrentStatus($reqId);

		$status_Name = $arCurrentStatus['status_Name'];

		$strResults.= "<status_Name>$status_Name</status_Name>\n";
		$strResults.= "</element>\n";			
	}

	$strResults.="</list>\n";

	ClearCache();
	header("Content-Type: text/xml");
	echo $strResults;
}


//--------------------------------------------------------------------------
/**
	\brief 
		Outputs the XML list of the dcr assigned transactions to the 
		client side for DMS_Writer to view their assigned DCRs.
*/
//--------------------------------------------------------------------------
function GetDCRRequesterQueue()
{
	global $g_oUserSession;

	$oOrganization = organization::GetInstance();
	$db = dmsData::GetInstance();
	$oRights = rights::GetInstance();
	$oSystemAccess = systemAccess::GetInstance();
	$oUser = cUserContainer::GetInstance();
	$oDCRStatus = dcrStatus::GetInstance();
	
	$oXML = new XML();

	if(!$g_oUserSession->HasRight($oRights->DMS_Standard))
	{
		$oXML->outputXHTML();
		return false;
	}

	$userId = $g_oUserSession->GetUserID();
	
	/*
		We want all transactions from users who are in the user's
		DCR queue.
		So filter the user's by the organizations they're in
		and then by the transactions those users have
	*/

	$strSQL = "SELECT
				  status_ID 
			FROM 
				tblDCRStatusType 
			WHERE
				status_RequesterQueue = 1";
				
	$arStatuses = $db->Select($strSQL);

	if(sizeof($arStatuses) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	$strSQL = "SELECT
				    tblDCRStatus.request_ID
				FROM 
					tblDCR
						LEFT JOIN tblDCRStatus ON tblDCR.request_ID = tblDCRStatus.request_ID
				WHERE 
					tblDCR.user_ID = $userId AND (";
				
					$firstTime = true;
				
					foreach($arStatuses as $status)
					{
						if($firstTime == true)
						{
							$firstTime = false;
						}
						else
						{
							$strSQL .= " OR ";
						}
				
						$strSQL .= " status_ID = " . $status['status_ID'];
					}
					
	$strSQL.= ") AND (dcrstatus_Current = 1) UNION "; 
	
	$strSQL.= "SELECT
				    tblDCRStatus.request_ID
				FROM 
					tblDCRAssign
						LEFT JOIN tblDCRStatus ON tblDCRAssign.dcrstatus_ID = tblDCRStatus.dcrstatus_ID
				WHERE 
					(tblDCRAssign.assign_WriterID = $userId) AND tblDCRAssign.dcrstatus_ID IN (
					
					SELECT 
						dcrstatus_ID 
					FROM
						tblDCRStatus
					WHERE 
						(status_ID = 15 OR status_ID = 16) AND dcrstatus_Current = 1)"; 

	$arCurrentRequests = $db->Select($strSQL);

	if(sizeof($arCurrentRequests) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}
		
	$strSQL = "
		SELECT
			tblDCR.request_ID
			, tblDCR.request_Type
			, tblDocuments.doc_Title
			, tblDocuments.org_ID
			, tblDCRTaskFlag.dcrTaskFlag_ProcName
			, tblDCRTaskFlag.org_ID
			, tblDCRNew.dcrNew_Title
			, tblDCRNew.dcrNew_Description
			, tblDCRNew.docType_ID
			, tblDCRNew.org_ID
					
		FROM
			tblDCR
			LEFT JOIN
				tblDocumentVersion ON tblDCR.dms_ID = tblDocumentVersion.docVersion_ID
					LEFT JOIN
						tblDocuments ON tblDocumentVersion.doc_ID = tblDocuments.doc_ID
						LEFT JOIN
							tblDCRTaskFlag ON tblDCR.request_ID = tblDCRTaskFlag.request_ID
							LEFT JOIN
								tblDCRNew ON tblDCR.request_ID = tblDCRNew.request_ID

		WHERE (";
		
	$firstTime = true;

	foreach($arCurrentRequests as $arCurrentRequests)
	{
		if($firstTime == true)
		{
			$firstTime = false;
		}
		else
		{
			$strSQL .= " OR ";
		}

		$strSQL .= " tblDCR.request_ID = " . $arCurrentRequests['request_ID'];
	}
		
	$strSQL.= ") ORDER BY request_ID DESC";
	$arDCR = $db->select($strSQL);

	if(sizeof($arDCR) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<list>\n";

	foreach($arDCR as $request)
	{
		$reqId = $request['request_ID'];
		$docTitle = $request['doc_Title'];
		$reqType = $request['request_Type'];
		$procName = $request['dcrTaskFlag_ProcName'];
		$newDocTitle = $request['dcrNew_Title'];
		
		$strResults.= "<element>\n";
		$strResults.= "<id>$reqId</id>\n";
		$strResults.= "<request_Type>$reqType</request_Type>\n";

		if(strlen($docTitle) < 1)
		{
			if(strlen($procName) < 1)
			{
				if(strlen($newDocTitle) > 0)
				{
					$docTitle = $newDocTitle;
				}
			}
			else
			{
				$docTitle = $procName;
			}
		}

		$strResults.= "<document_Title>$docTitle</document_Title>\n";
	
		$arCurrentStatus = $oDCRStatus->GetCurrentStatus($reqId);

		$status_Name = $arCurrentStatus['status_Name'];

		$strResults.= "<status_Name>$status_Name</status_Name>\n";
		$strResults.= "</element>\n";			
	}

	$strResults.="</list>\n";

	ClearCache();
	header("Content-Type: text/xml");
	echo $strResults;
}

function GetDCRStatusList($role, $status)
{
	$db = dmsData::GetInstance();
	$oRights = rights::GetInstance();
	$oDCRStatusType = dcrStatusType::GetInstance();
	$oXML = new XML;
		
	$rightId = GetRightID($role);

	if($rightId < 0)
	{
		$oXML->outputXHTML();
		return false;
	}
	
	$currentStatusId = $oDCRStatusType->GetID($status);
	
	if($currentStatusId < 0)
	{
		$oXML->outputXHTML();
		return false;
	}

	/*
		The following sql string builds a list of statuses based on the current status
		of a DCR.
	*/
	$strSQL = "SELECT
					   tblDCRStatusType.status_ID
					 , tblDCRStatusType.status_Name
				FROM
					tblDCRStatusList
					LEFT JOIN
						tblDCRStatusType ON tblDCRStatusList.dcrStatusList_EndStatusID = tblDCRStatusType.status_ID
				WHERE dcrStatusList_StartStatusID = $currentStatusId AND right_ID = $rightId
				ORDER BY tblDCRStatusType.status_Name";

	$arResults = $db->select($strSQL);

	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
}

function GetDCRWriterList($reqId, $role)
{
	$db = dmsData::GetInstance();
	$oDCR = documentChangeRequest::GetInstance();
	$oOrganization = organization::GetInstance();
	$oOrganization = organization::GetInstance();
	$oSystemAccess = systemAccess::GetInstance();
	$oXML = new XML;
		
	$orgId = -1;
	
	if($reqId < 0)
	{
		$oXML->outputXHTML();
		return false;
	}
	
	$rightId = GetRightID($role);

	if($rightId < 0)
	{
		$oXML->outputXHTML();
		return false;
	}
	
	$orgId = $oDCR->GetOrgID($reqId);
	
	if($orgId < 0)
	{
		$oXML->outputXHTML();
		return false;
	}	
	
	$arResults = $oSystemAccess->UsersHaveRight($rightId, $orgId);
	
	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
}

function GetSearchStatusList()
{
	$db = dmsData::GetInstance();
	$oRights = rights::GetInstance();
	$oDCRStatusType = dcrStatusType::GetInstance();
	$oXML = new XML;
		
	/*
		The following sql string builds a list of statuses based on the current status
		of a DCR.
	*/
	$strSQL = "SELECT
				 	status_Name
				FROM
					tblDCRStatusType
				WHERE 1 = 1";

	$arResults = $db->select($strSQL);

	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
}

/*--------------------------------------------------------------------------
	-	description
			GetDCRSearch returns to the client the list
			of DCRs based upon what searched by the user
	-	params
	-	return
--------------------------------------------------------------------------*/
function GetDCRSearch()
{
	$oUser = cUserContainer::GetInstance();
	$oDCR = documentChangeRequest::GetInstance();
	$oOrganization = organization::GetInstance();
	$db = dmsData::GetInstance();
	$oDCRStatus = dcrStatus::GetInstance();
	$oDCRStatusType = dcrStatusType::GetInstance();
	$oDocType = documentType::GetInstance();
	
	$oXML = new XML();

	$arTFTypes = array();

	$strRequestType = "";
	$strProject = "";
    $strDocTitle = "";
    
	$iRequest = -1;	
	$reqId = -1;
	$requesterId = -1;
	$iCount = 0;
	$reqType = -1;
	$dcrStatusId = -1;
	$assignedUserID = -1;
	$statusId = -1;
	$docTypeId = -1;
	$orgId = -1;
	
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			$val = $db->EscapeString($val);
			switch($fieldName)
			{
				case "requestId":
					if(is_numeric($val))
					{
						$iRequest = $val;
					}
					break;
				case "status":
					$statusId = $oDCRStatusType->GetID($val);
					break;
				case "reqtype":
					$strRequestType = strtolower($val);
					break;
				case "project":
					$strProject = $val;
					break;
				case "title":
					$strDocTitle = $val;
	        		break;
				case "doctype":
					$docTypeId = $oDocType->GetID($val);
	        		break;
				case "requester":
					$requesterId = GetUserID($val);
	        		break;
	        	case "organization":
					$orgId = $oOrganization->GetID($val);
					$arChildOrgs = $oOrganization->GetChildren($val);
	        		break;
	        }
	  	}
	}

	$strSQL = "	SELECT
					*
				FROM
					tblDCR
				WHERE 1 = 1 ";

	if($iRequest > -1)
	{
		$strSQL .= "AND request_ID = $iRequest ";
	}

	if($requesterId > -1)
	{
		$strSQL .= "AND user_ID = $requesterId ";
	}

	if($statusId > -1)
	{
		$strStatusSQL = "	SELECT
								request_ID
							FROM
								tblDCRStatus
							WHERE 
								status_ID = $statusId AND dcrstatus_Current = 1";

		$arStatuses = $db->Select($strStatusSQL);
		
		if(sizeof($arStatuses) < 1)
		{
			$oXML->outputXHTML();
			return true;
		}

		$firstTime = true;

		foreach($arStatuses as $status)
		{
			if($firstTime != true)
			{			
				$strSQL.= " OR";
			}
			
			if($firstTime == true)
			{			
				$strSQL.= " AND (";
				$firstTime = false;
			}

			$strSQL .= " request_ID = " . $status['request_ID'];
		}
		
		$strSQL .= ")";
	}
	
	if(strlen($strRequestType))
	{
		if($strRequestType == "dcr")
		{
			$requestTypeDCR = 0;
			$requestTypeDCRNew = 2;

			$strSQL .= "AND (request_Type = $requestTypeDCR OR request_Type = $requestTypeDCRNew) ";
		}
		
		else if($strRequestType == "tpu")
		{
			$requestTypeTPU = 1;
			$strSQL .= "AND request_Type = $requestTypeTPU ";
		}	
		
		else
		{
			$oXML->outputXHTML();
			return true;
		}
	}
	
	if(strlen($strProject))
	{
		$strProjectSQL = "	SELECT
								request_ID
							FROM
								tblDCRTaskFlag
							WHERE 
								dcrTaskFlag_Model like '%$strProject%' ";

		$arProjects = $db->Select($strProjectSQL);
		
		if(sizeof($arProjects) < 1)
		{
			$oXML->outputXHTML();
			return true;
		}
		
		$firstTime = true;

		foreach($arProjects as $project)
		{
			if($firstTime != true)
			{			
				$strSQL.= " OR";
			}
			
			if($firstTime == true)
			{			
				$strSQL.= " AND (";
				$firstTime = false;
			}

			$strSQL .= " request_ID = " . $project['request_ID'];
		}
		
		$strSQL .= ")";
	}
	
	if(strlen($strDocTitle))
	{
		$firstTime1 = true;
		$firstTime2 = true;
		$firstTime3 = true;

		$strTitleSQL = "    SELECT
								tblDCR.request_ID
							FROM
								tblDocuments
									LEFT JOIN
										tblDocumentVersion ON tblDocuments.doc_ID = tblDocumentVersion.doc_ID
										LEFT JOIN
											tblDCR ON tblDocumentVersion.docVersion_ID = tblDCR.dms_ID
							WHERE 
								tblDocuments.doc_Title like '%$strDocTitle%' AND
								tblDocumentVersion.docVersion_ID = tblDCR.dms_ID";

		$arTitles = $db->Select($strTitleSQL);

		$strSQL.= " AND (";

		if(sizeof($arTitles) > 0)
		{
			foreach($arTitles as $title)
			{
				if($firstTime1 == false)
				{			
					$strSQL.= " OR";
				}
				
				if($firstTime1 == true)
				{			
					$strSQL.= " (";
					$firstTime1 = false;
				}
	
				$strSQL .= " request_ID = " . $title['request_ID'];
			}
			
			$strSQL .= ")";
		}
		
		$strTFTitleSQL = "	SELECT
								request_ID
							FROM
								tblDCRTaskFlag
							WHERE 
								dcrTaskFlag_ProcName like '%$strDocTitle%' ";

		$arTFTitles = $db->Select($strTFTitleSQL);
		
		if(sizeof($arTFTitles) > 0)
		{
			if($firstTime1 == false)
			{			
				$strSQL.= " OR (";
			}

			if($firstTime1 == true)
			{			
				$strSQL.= "(";
				$firstTime1 = false;
			}

			foreach($arTFTitles as $title)
			{
				if($firstTime2 == false)
				{			
					$strSQL.= " OR";
				}
				
				if($firstTime2 == true)
				{			
					$firstTime2 = false;
				}
	
				$strSQL .= " request_ID = " . $title['request_ID'];
			}
			
			$strSQL .= ")";
		}
		
		$strNewTitleSQL = "	SELECT
								request_ID
							FROM
								tblDCRNew
							WHERE 
								dcrNew_Title like '%$strDocTitle%' ";

		$arNewTitles = $db->Select($strNewTitleSQL);
		
		if(sizeof($arNewTitles) > 0)
		{
			if($firstTime1 == false || $firstTime2 == false)
			{			
				$strSQL.= " OR (";
			}
			
			if($firstTime1 == true && $firstTime2 == true)
			{			
				$strSQL.= "(";
				$firstTime1 = false;
				$firstTime2 = false;
			}

			foreach($arNewTitles as $title)
			{
				if($firstTime3 == false)
				{			
					$strSQL.= " OR";
				}
				
				if($firstTime3 == true)
				{			
					$firstTime3 = false;
				}

				$strSQL .= " request_ID = " . $title['request_ID'];
			}
			
			$strSQL .= ")";
		}
		
		$strSQL .= ")";

		if(sizeof($arTitles) < 1)
		{
			if(sizeof($arTFTitles) < 1)
			{
				if(sizeof($arNewTitles) < 1)
				{
					$oXML->outputXHTML();
					return true;
				}
			}
		}
	}
	
	if($docTypeId > -1)
	{
		$firstTime1 = true;
		$firstTime2 = true;
		$firstTime3 = true;

		$strTypeSQL = "    SELECT
								tblDCR.request_ID
							FROM
								tblDocuments
									LEFT JOIN
										tblDocumentVersion ON tblDocuments.doc_ID = tblDocumentVersion.doc_ID
										LEFT JOIN
											tblDCR ON tblDocumentVersion.docVersion_ID = tblDCR.dms_ID
							WHERE 
								tblDocuments.docType_ID = $docTypeId AND
								tblDocumentVersion.docVersion_ID = tblDCR.dms_ID";

		$arTypes = $db->Select($strTypeSQL);

		$strSQL.= " AND (";

		if(sizeof($arTypes) > 0)
		{
			foreach($arTypes as $type)
			{
				if($firstTime1 == false)
				{			
					$strSQL.= " OR";
				}
				
				if($firstTime1 == true)
				{			
					$strSQL.= "(";
					$firstTime1 = false;
				}
	
				$strSQL .= " request_ID = " . $type['request_ID'];
			}
			
			$strSQL .= ")";
		}
		
		if($docTypeId == 2)
		{
			$strTFTypeSQL = "	SELECT
									request_ID
								FROM
									tblDCRTaskFlag
								WHERE 
									dcrTaskFlag_ProcType = 'Procedure'";

			$arTFTypes = $db->Select($strTFTypeSQL);
			
			if(sizeof($arTFTypes) > 0)
			{
				if($firstTime1 == false)
				{			
					$strSQL.= " OR (";
				}
	
				if($firstTime1 == true)
				{			
					$strSQL.= "(";
					$firstTime1 == false;
				}

				foreach($arTFTypes as $type)
				{
					if($firstTime2 == false)
					{			
						$strSQL.= " OR";
					}
					
					if($firstTime2 == true)
					{			
						$firstTime2 = false;
					}
		
					$strSQL .= " request_ID = " . $type['request_ID'];
				}
				
				$strSQL .= ")";
			}
		}
		
		$strNewTypeSQL = "	SELECT
								request_ID
							FROM
								tblDCRNew
							WHERE 
								docType_ID = $docTypeId";

		$arNewTypes = $db->Select($strNewTypeSQL);
		
		if(sizeof($arNewTypes) > 0)
		{
			if($firstTime1 == false || $firstTime2 == false)
			{			
				$strSQL.= " OR (";
			}
			
			if($firstTime1 == true && $firstTime2 == true)
			{			
				$strSQL.= "(";
				$firstTime1 == false; 
				$firstTime2 == false;
			}

			foreach($arNewTypes as $type)
			{
				if($firstTime3 == false)
				{			
					$strSQL.= " OR";
				}
				
				if($firstTime3 == true)
				{			
					$firstTime3 = false;
				}

				$strSQL .= " request_ID = " . $type['request_ID'];
			}
			
			$strSQL .= ")";
		}
		
		$strSQL .= ")";

		if(sizeof($arTypes) < 1)
		{
			if(sizeof($arNewTypes) < 1)
			{
				if(sizeof($arTFTypes) < 1)
				{
					$oXML->outputXHTML();
					return true;
				}
			}
		}	
	}

	if($orgId > -1)
	{
		$firstTime1 = true;
		$firstTime2 = true;
		$firstTime3 = true;

		$strOrgSQL = "    SELECT
								tblDCR.request_ID
							FROM
								tblDocuments
									LEFT JOIN
										tblDocumentVersion ON tblDocuments.doc_ID = tblDocumentVersion.doc_ID
										LEFT JOIN
											tblDCR ON tblDocumentVersion.docVersion_ID = tblDCR.dms_ID
							WHERE 
								(tblDocumentVersion.docVersion_ID = tblDCR.dms_ID) AND
								(tblDocuments.org_ID = $orgId ";

		foreach($arChildOrgs as $org)
		{
			$strOrgSQL.= " OR";

			$strOrgSQL .= " tblDocuments.org_ID = " . $org['org_ID']."";
		}
		
		$strOrgSQL.= ")";

		$arOrgs = $db->Select($strOrgSQL);

		$strSQL.= " AND (";

		if(sizeof($arOrgs) > 0)
		{
			foreach($arOrgs as $org)
			{
				if($firstTime1 == false)
				{			
					$strSQL.= " OR";
				}
				
				if($firstTime1 == true)
				{			
					$strSQL.= "(";
					$firstTime1 = false;
				}
	
				$strSQL .= " request_ID = " . $org['request_ID'];
			}
			
			$strSQL .= ")";
		}
		
		$strTFOrgSQL = "	SELECT
								request_ID
							FROM
								tblDCRTaskFlag
							WHERE 
								org_ID = $orgId ";

		foreach($arChildOrgs as $org)
		{
			$strTFOrgSQL.= " OR";
			$strTFOrgSQL .= " org_ID = " . $org['org_ID']."";
		}
		
		$arTFOrgs = $db->Select($strTFOrgSQL);
		
		if(sizeof($arTFOrgs) > 0)
		{
			if($firstTime1 == false)
			{			
				$strSQL.= " OR (";
			}

			if($firstTime1 == true)
			{			
				$strSQL.= "(";
				$firstTime1 = false;
			}

			foreach($arTFOrgs as $org)
			{
				if($firstTime2 == false)
				{			
					$strSQL.= " OR";
				}
				
				if($firstTime2 == true)
				{			
					$firstTime2 = false;
				}
	
				$strSQL .= " request_ID = " . $org['request_ID'];
			}
			
			$strSQL .= ")";
		}
		
		$strNewOrgSQL = "	SELECT
								request_ID
							FROM
								tblDCRNew
							WHERE 
								org_ID = $orgId ";

		foreach($arChildOrgs as $org)
		{
			$strNewOrgSQL.= " OR";
			$strNewOrgSQL .= " org_ID = " . $org['org_ID']."";
		}

		$arNewOrgs = $db->Select($strNewOrgSQL);
		
		if(sizeof($arNewOrgs) > 0)
		{
			if($firstTime1 == false || $firstTime2 == false)
			{			
				$strSQL.= " OR (";
			}
			
			if($firstTime1 == true && $firstTime2 == true)
			{			
				$strSQL.= "(";
				$firstTime1 == false;
				$firstTime2 == false;
			}

			foreach($arNewOrgs as $org)
			{
				if($firstTime3 == false)
				{			
					$strSQL.= " OR";
				}
				
				if($firstTime3 == true)
				{			
					$firstTime3 = false;
				}

				$strSQL .= " request_ID = " . $org['request_ID'];
			}
			
			$strSQL .= ")";
		}
		
		$strSQL .= ")";

		if(sizeof($arOrgs) < 1)
		{
			if(sizeof($arTFOrgs) < 1)
			{
				if(sizeof($arNewOrgs) < 1)
				{
					$oXML->outputXHTML();
					return true;
				}
			}
		}
	}

	$strSQL .= " ORDER BY request_ID DESC LIMIT 100";

	$arRequests = $db->Select($strSQL);

	if(sizeof($arRequests) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<list>\n";

	foreach($arRequests as $request)
	{
		$reqId = $request['request_ID'];
		$reqType = $request['request_Type'];
		$reqDate = $request['request_Date'];


		/*
			Retrieve the status of this transaction so we can add it to the results
		*/
		$arCurrentStatus = $oDCRStatus->GetCurrentStatus($reqId);

		$strResults.= "<element>\n";
		$strResults.= "<id>$reqId</id>\n";
		$strResults.= "<request_Type>$reqType</request_Type>\n";

		if($reqType == 0)
		{
			$arDCRDetails = $oDCR->GetDCRDocInfo($reqId);
			$strResults.= "<document_Title>".$arDCRDetails[0]["doc_Title"]."</document_Title>\n";
		}
			
		if($reqType == 1)
		{
			$arTPUDetails = $oDCR->GetTPUDocInfo($reqId);
			$strResults.= "<procedure_Name>".$arTPUDetails[0]["dcrTaskFlag_ProcName"]."</procedure_Name>\n";
		}
			
		if($reqType == 2)
		{
			$arDCRNew = $oDCR->GetDCRNewTitle($reqId);
			$strResults.= "<documentNew_Title>".$arDCRNew[0]["dcrNew_Title"]."</documentNew_Title>\n";
		}
			
		foreach($arCurrentStatus as $field => $val)
		{
			$strResults.= "<$field>$val</$field>\n";
		}

		if(sizeof($arCurrentStatus) > 0)
		{
			$status_Name = $arCurrentStatus['status_Name'];
			$dcrStatusId = $arCurrentStatus['dcrstatus_ID'];
			
			if($status_Name == "Assigned" || $status_Name == "Peer Review")
			{
				$assignedUserID = $oDCRStatus->GetCurrentWriter($dcrStatusId);
				$assignedUser = $oUser->GetName($assignedUserID);
				$strResults.= "<assigned_User>$assignedUser</assigned_User>\n";			
			}
			
			if($status_Name == "In Progress")
			{
				$assignedUserID = $arCurrentStatus['user_ID'];
				$assignedUser = $oUser->GetName($assignedUserID);
				$strResults.= "<assigned_User>$assignedUser</assigned_User>\n";			
			}
		}
		
		$strResults.= "</element>\n";
		$iCount++;
	}

	$strResults.="</list>\n";
	
	if($iCount < 1)
	{
		$oXML->outputXHTML();
		return true;
	}
	
	ClearCache();
	header("Content-Type: text/xml");
	echo stripslashes($strResults);
}

?>
