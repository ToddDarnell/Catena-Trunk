<?
	require_once('../../../classes/include.php');
	require_once('../classes/class.receiverModel.php');
	require_once('../classes/class.receiverHardware.php');

	/*
		performs the server side functionality for organization requests
		Must load the header command like this or the data will
		not be re downloaded the next time it's called
	*/

	$oReceiverModel = receiverModel::GetInstance();
	$oReceiverHardware = receiverHardware::GetInstance();
	
	$action = "";					//	the action we'll perform with this script
	$name = "";						//	the receiver numbers (12 digit)
	$description = "";				//	the restricted receiver reason
	$modelId = -1;
	$hardware = "";					//	The two digit hardware characters
	$model = "";					//	may be the receiver model or model id
	$hardwareId = -1;				//	hardware id record in tblHardware
	

	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch(strtolower($fieldName))
			{
				case "model":
					/*
						May be the model id, or the model name
					*/
					$model = $val;
					break;
				case "name":
					$name = $val;
					break;
				case "hardware":
					$hardware = $val;
					break;
				case "description":
					$description = $val;
					break;
				case "hardwareid":
					$hardwareId = $val;
					break;
				case "id":
					$modelId = $val;
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
		case "gethardwaremodels":
			GetModelHardwareList();
			exit;
		case "addhardware":
			$oReceiverHardware->Add($model, $hardware);
			$oReceiverHardware->results->Send();
			break;
		case "removehardware":
			$oReceiverHardware->Remove($hardwareId);
			$oReceiverHardware->results->Send();
			break;
		case "modellist":
			$oReceiverModel->GetList();
			exit;
		case "add":
			$oReceiverModel->Add($name, $description);
			$oReceiverModel->results->Send();
			break;
		case "modify":
			$oReceiverModel->Modify($modelId, $name, $description);
			$oReceiverModel->results->Send();
			break;
		case "remove":
			$oReceiverModel->Remove($modelId);
			$oReceiverModel->results->Send();
			break;
		default:
			$oReceiverModel->results->Set('false', 'Server side functionality not implemented');
			$oReceiverModel->results->Send();
			break;
	}


/*
	GetReceiverList returns to the client the list
	of receivers based upon what requirements they have
*/
function GetModelHardwareList()
{
	$oReceiverModel = receiverModel::GetInstance();
	
	$oXML = new XML;
	$db = rmsData::GetInstance();

    $modelId = -1;
		
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			$val = $db->EscapeString($val);
			switch($fieldName)
			{
				case "model":
					/*
						The model string name
					*/
					$modelId = $oReceiverModel->GetID($val);
					break;
	        }
	  	}
	}
	
	/*
		The following sql string
		builds a list of receivers. All of the numbered fields, org_ID, user_ID (owner),
		etc are aliased with their name.
		The next part of the process is including the filters based upon what the user requested
	*/

	$strSQL = "	SELECT
					*
				FROM
					tblHardware ";

	if($modelId > -1)
	{
		$strSQL .= "WHERE recModel_ID = $modelId";
	}
	
	$strSQL .= " ORDER BY hw_Code";
	
	$arResults = $db->select($strSQL);
	
	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
}
?>