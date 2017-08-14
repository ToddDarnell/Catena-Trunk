<?

	require_once('../../../classes/include.php');
	require_once('../classes/class.document.php');
	ClearCache();

//--------------------------------------------------------------------------
	/**
		\brief
			Performs the server side functionality for modify document detail requests
			Must load the header command like this or the data will
			not be re-downloaded the next time it's called
	*/
//--------------------------------------------------------------------------

	if(!isset($_GET['action']))
	{ 
		/*
			action MUST be set.
		*/
		exit;
	};
	
	/*
		We made the list lower case. All values
		in the switch($action) must be lower case
	*/
	$action = strtolower($_GET['action']);

	switch($action)
	{
		case "getdocumentversionlist":
			GetDocumentVersionList();
			exit;
		case "modifydocdetails":
			$doc = document::GetInstance();
			$doc->ModifyDetails();
			$doc->results->Send();
			exit;
		default:
			$userResult->Set('false', "Server side functionality not implemented.");
			break;
	}
	$userResult->Send();

	exit;

//--------------------------------------------------------------------------
	/**
		\brief 
			Outputs the XML list of the document versions associated to the 
			docID and versionID passed in from the client side.
	*/
//--------------------------------------------------------------------------
function GetDocumentVersionList()
{
	global $userResult;

	$strdocID = $_GET['docId'];
	$strVersion = $_GET['versionId'];

	/*
		The following sql string
		builds a list of versions of one document.
		The next part of the process includes the filters based upon what the user requested
	*/
	if(!is_numeric($strdocID))
	{
		$whereClause = "";
	}
	else
	{
		$whereClause = "WHERE doc_ID = $strdocID";
	}

	$strSQL = "SELECT
					docVersion_Ver
				FROM
					tblDocumentVersion $whereClause ORDER BY docVersion_Ver DESC";

	OutputXMLList($strSQL, "versionList", "version");
}
?>