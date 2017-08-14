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
	}
	
	$rightsCategory = new rightCategory();
	
	$categoryName = "";
	$categoryDescription = "";
	$categoryId = "";
	
	if(isset($_GET['name']))
	{
		$categoryName = $_GET['name'];
	}

	if(isset($_GET['description']))
	{
		$categoryDescription = $_GET['description'];
	}

	if(isset($_GET['id']))
	{
		$categoryId = $_GET['id'];
	}
	
	
	/*
		We made the list lower case. All values
		in the switch($action) must be lower case
	*/
	
	$action = strtolower($_GET['action']);
	
	switch($action)
	{
		case "add":
			$rightsCategory->Add($categoryName, $categoryDescription);
			break;
		case "modify":
			$rightsCategory->Modify($categoryName, $categoryDescription, $categoryId);
			break;
		case "remove":
			$rightsCategory->Remove($categoryId);
			break;
		default:
			$rightsCategory->results->Set('false', "Server side functionality not implemented.");
			break;
	}

	$rightsCategory->results->Send();
?>