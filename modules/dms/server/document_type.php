<?
	require_once('../../../classes/include.php');
	require_once('../classes/class.documentType.php');

	/**
		\brief Performs the server side functionality for document type requests.
	*/

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
	$docType = new documentType();
	
	$docTypeName = "";
	$docTypeDescription = "";
	$docTypeId = "";
	
	if(isset($_GET['name']))
	{
		$docTypeName = $_GET['name'];
	}

	if(isset($_GET['description']))
	{
		$docTypeDescription = $_GET['description'];
	}

	if(isset($_GET['id']))
	{
		$docTypeId = $_GET['id'];
	}
	
	switch($action)
	{
		case "add":
			$docType->Add($docTypeName, $docTypeDescription);
			break;
		case "modify":
			$docType->Modify($docTypeName, $docTypeDescription, $docTypeId);
			break;
		case "remove":
			$docType->Remove($docTypeId);
			break;
		case "getlist":
			$docType->GetList();
			exit;
		default:
			$docType->results->Set('false', "Server side functionality not implemented.");
			break;
	}

	$docType->results->Send();

?>