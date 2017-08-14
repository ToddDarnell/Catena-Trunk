<?

	require_once('../classes/include.php');
	ClearCache();
	/*
		performs the server side functionality for organization requests
		Must load the header command like this or the data will
		not be re downloaded the next time it's called
	*/

	if(!isset($_GET['action']))
	{ 
		/*
			action MUST be set.
		*/
		exit;
	};
	
	$oOrganization = new organization();
	
	$strOrganization = "";
	$shortName = "";
	$longName = "";
	$parent =  "";
	$id = "";

	if(isset($_GET['organization']))
	{
		$strOrganization = $_GET['organization'];
	}
	
	if(isset($_GET['shortName']))
	{
		$shortName = $_GET['shortName'];
	}

	if(isset($_GET['longName']))
	{
		$longName = $_GET['longName'];
	}

	if(isset($_GET['parent']))
	{
		$parent = $_GET['parent'];
	}

	if(isset($_GET['id']))
	{
		$id = $_GET['id'];
	}
	
	/*
		We made the list lower case. All values
		in the switch($action) must be lower case
	*/
	$action = strtolower($_GET['action']);
	
	switch($action)
	{
        case "add":
			$oOrganization->Add($shortName, $longName, $parent);
			break;
		case "modify":
			$oOrganization->Modify($shortName, $longName, $parent, $id);
			break;
		/*
		case "remove":
			$oOrganization->Remove($id);
			break;
		*/
		case "getchildren":
			$oOrganization->GetChildren($strOrganization);
			exit;
			break;
		default:
			$oOrganization->results->Set('false', "Server side functionality not implemented.");
			break;
	}

	$oOrganization->results->Send();

?>