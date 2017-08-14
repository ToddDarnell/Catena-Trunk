<?

	/*
		performs the server side functionality for organization requests
		Must load the header command like this or the data will
		not be re downloaded the next time it's called
	*/
	require_once('../../../classes/include.php');
	require_once('../classes/class.restrictedReceiver.php');

	$oRestrictedReceiver = restrictedReceiver::GetInstance();
	
	$action = "";						//	the action we'll perform with this script
	$id = -1;
	$type = -1;
	$number = "";
	$reason = "";						//	the restricted receiver reason

	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch($fieldName)
			{
				case "type":
					$type= $val;
					break;
				case "number":
					$number = $val;
					break;
				case "reason":
					$reason = $val;
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
		case "getrestrictedreceivers":
			GetRestrictedList(1);
			exit;
			break;
		case "getrestrictedsmartcards":
			GetRestrictedList(0);
			exit;
			break;
		case "add":
			$oRestrictedReceiver->Add($number, $reason, $type);
			break;
		case "modify":
			$oRestrictedReceiver->Modify($id, $number, $reason, $type);
			break;
		case "remove":
			$oRestrictedReceiver->Remove($id);
			break;
		default:
			$oRestrictedReceiver->results->Set('false', 'Server side functionality not implemented');
			break;
	}

	$oRestrictedReceiver->results->Send();

/*--------------------------------------------------------------------------
	-	description
			Returns an XML list of restricted receivers or smart cards.
	-	params
			$iFilterType
				1	receiver
				0	smart card
	-	return
--------------------------------------------------------------------------*/
function GetRestrictedList($iFilterType)
{
	$oXML = new XML;
	$db = rmsData::GetInstance();

	if($iFilterType != 0)
	{
		$iFilterType = 1;
	}
		
	$sql = "SELECT * FROM tblRestrictedNumbers WHERE resNum_Type = $iFilterType";

	$arResults = $db->select($sql);
	
	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
}
?>