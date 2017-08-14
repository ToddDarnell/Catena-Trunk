<?
	require_once('../classes/include.php');

	ClearCache();

	if(!isset($_GET['action']))
	{ 
		exit;
	};
	
	$action = strtolower($_GET['action']);
	switch($action)
	{
		case "make":
			$oLog = cLog::GetInstance();
			for($i = 0; $i < 1000; $i++)
			{
				$oLog->Log(2, "$i =====Blah blah blahalsdjflkasjd fla;ksjdf ;lasdjf lasdf");
			}
			break;
		case "logs":
			GetLogs();
			break;
	}


//--------------------------------------------------------------------------
/**
	\brief 
		Outputs the XML list of the documents based upon what requirements
		have been set by the client. 
*/
//--------------------------------------------------------------------------
function GetLogs()
{
	global $g_oUserSession;
	
	$db = systemData::GetInstance();
	$oRights = rights::GetInstance();
	$oOrganization = organization::GetInstance();
	$oSystemAccess = systemAccess::GetInstance();

	$whereClause = array();
	$arOrgs = array();

	$oXML = new XML;

	$strOrg = "";
	$orgId = 0;	
	$userId = $g_oUserSession->GetUserID();
	
	$oLog = cLog::GetInstance();
	$oLog->RemoveOldLogs();
	
/*
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

	/*
		The following sql string builds a list of documents. 
		All of the numbered fields, docType_ID, org_ID,	etc are aliased with their name.
		The next part of the process is including the filters based upon what the user requested.
	*/

	$strSQL = "
		SELECT
				tblLogs.log_ID
			,	tblUser.user_Name
			,	tblLogs.log_Date
			,	tblLogs.log_Message
			,	tblLogs.log_Level
			,	tblUser.user_Name
			,	tblLogSystem.system_Name
		FROM
			tblLogs
			LEFT JOIN
				tblUser ON tblUser.user_ID = tblLogs.user_ID
			LEFT JOIN
				tblLogSystem
					ON tblLogSystem.system_ID = tblLogs.system_ID
			 ORDER BY log_ID DESC LIMIT 1000";

	$arResults = $db->select($strSQL);

	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
}
?>