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
	
	/*
		We made the list lower case. All values
		in the switch($action) must be lower case
	*/
	
	$name = "";
	$description = "";
	$category = "";
	$id = "";
	$right_info = "";
	
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
				
			switch($fieldName)
			{
				case "right":
					$right_info = $val;
					break;
				case "name":
					$name = $val;
					break;
				case "description":
					$description = $val;
					break;
				case "category":
					$category = $val;
					break;
				case "id":
					$id = $val;
					break;
				case "action":
					$action = strtolower($val);
					break;
			}
		}
	}
		
	$rights = rights::GetInstance();
	
	switch($action)
	{
		case "add":
			$rights->Add($name, $description, $category);
			break;
		case "modify":
			$rights->Modify($name, $description, $category, $id);
			break;
		default:
			$userResult->Set('false', "Server side functionality not implemented.");
			break;
	}

	$rights->results->Send();
?>