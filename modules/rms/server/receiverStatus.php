<?
	require_once('../../../classes/include.php');
	require_once('../classes/class.receiverStatus.php');

	/*
		performs the server side functionality for organization requests
		Must load the header command like this or the data will
		not be re downloaded the next time it's called
	*/

	$oReceiverStatus = receiverStatus::GetInstance();
	
	$action = "";					//	the action we'll perform with this script
	$name = "";
	$description = "";
	$statusId = -1;
	

	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch(strtolower($fieldName))
			{
				case "name":
					$name = $val;
					break;
				case "description":
					$description = $val;
					break;
				case "id":
					$statusId = $val;
					break;
				case "action":
					$action = strtolower($val);
					break;
			}
		}
	}
	/*
		-	make sure we have an action
		-	we don't return a value or anything
			simply because if someone is
			calling this page by itself
			we want nothing to happen.
	*/
	if(strlen($action) < 1)
	{
		exit;
	}

	switch($action)
	{
		case "statuslist":
			$oReceiverStatus->GetList();
			exit;
		case "add":
			$oReceiverStatus->Add($name, $description);
			break;
		case "remove":
			$oReceiverStatus->Remove($statusId);
			break;
		case "modify":
			$oReceiverStatus->Modify($statusId, $name, $description);
			break;
		default:
			$oReceiverStatus->results->Set('false', 'Server side functionality not implemented');
			break;
	}

	$oReceiverStatus->results->Send();

?>