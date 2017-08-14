<?

	require_once('../../../classes/include.php');
	require_once('../classes/class.receiver.php');
	require_once('../classes/class.receiverRequest.php');
	require_once('../classes/class.receiverHardware.php');
	require_once('../classes/class.receiverModel.php');
	require_once('../classes/class.db.php');

	/*
		performs the server side functionality for organization requests
		Must load the header command like this or the data will
		not be re downloaded the next time it's called
	*/

	$oReceiver = receiver::GetInstance();
	$oReceiverRequest = receiverRequest::GetInstance();
	
	$action = "";						//	the action we'll perform with this script
	$receiver = "";						//	the receiver numbers (12 digit)
	$description = "";					//	the restricted receiver reason
	$smartCard = "";
	$hardware = "";
	$status = "";
	$field = "";
	$data = "";
	$control = "";
	$userName = "";
	$organization = "";
	$model = "";
	$receiverId = -1;
	$number = "";				//	needs to be a string. we will accept up to 12 digits
	$restrictedType = -1;
	$numberId = -1;
	$request = -1;

	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch(strtolower($fieldName))
			{
				case "receiver":
					$receiver = $val;
					break;
				case "smartcard":
					$smartCard = $val;
					break;
				case "description":
					$description = $val;
					break;
				case "organization":
					$organization = $val;
					break;
				case "hardware":
					$hardware = $val;
					break;
				case "status":
					$status = $val;
					break;
				case "field":
					$field = $val;
					break;
				case "data":
					$data = $val;
					break;
				case "control":
					$control = $val;
					break;
				case "username":
					$userName = $val;
					break;
				case "model":
					$model = $val;
					break;
				case "id":
					$receiverId = $val;
					break;
				case "request":
					$request = $val;
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
		case "addrequest":
			/*
				Submit a receiver add request to the administrator
				of the user's receiver administrators
			*/
			$oReceiverRequest->Add($receiver, $smartCard, $hardware);
			$oReceiverRequest->results->Send();
			exit;
		case "pendingreceivers":
			GetPendingReceiverList();
			exit;
		case "actionrequest":
			/*
				Action an inventory receiver request.
			*/
			$oReceiverRequest->Action($request, $status);
			$oReceiverRequest->results->Send();
			exit;
		case "getreceiverlist":
			GetReceiverList();
			exit;
			break;
		case "validate":
			$oReceiver->ValidateField($field, $data);
			break;
		case "add":
			$oReceiver->Add($receiver, $smartCard, $hardware, $organization);
			break;
		case "modify":
			$oReceiver->Modify($receiverId, $receiver, $smartCard, $hardware, $status, $organization);
			break;
		case "assignowner":
			$oReceiver->SetOwner($receiverId, GetUserID($userName));
			break;
		case "removeowner":
			/*
				Remove the receiver from the the assigned user's
				account
			*/
			$oReceiver->SetOwner($receiverId);
			break;
		case "inventory":
			GetInventoryList();
			exit;
		default:
			$oReceiver->results->Set('false', 'Server side functionality not implemented');
			break;
	}

	$oReceiver->results->Send();

/*-------------------------------------------------------------------
	Retrieves the receiver inventory list for this user.
-------------------------------------------------------------------*/
function GetInventoryList()
{
	ClearCache();

	header("Content-Type: text/xml");
	/*
		as long as there's a first item in a menu then we'll keep going through the list
	*/
	
	$arAccounts = array();
	$arReceivers = array();
	
	$arAccounts[0]['name'] = "1234567890123456";
	$arAccounts[0]['id'] = 1;
	$arAccounts[0]['remove'] = 0;
	$arAccounts[0]['group'] = "Wall 1";

	$arAccounts[1]['name'] = "1234567890123457";
	$arAccounts[1]['id'] = 2;
	$arAccounts[1]['remove'] = 1;
	$arAccounts[1]['group'] = "";

	$arAccounts[2]['name'] = "1234567890123456";
	$arAccounts[2]['id'] = 3;
	$arAccounts[2]['remove'] = 0;
	$arAccounts[2]['group'] = "This is 16 digit";

	$arReceivers[0]['name'] = "000123456789";
	$arReceivers[0]['id'] = 1;

	$arReceivers[1]['name'] = "123456789012";
	$arReceivers[1]['id'] = 2;

	$arReceivers[2]['name'] = "678967867892";
	$arReceivers[2]['id'] = 2;

	$arReceivers[3]['name'] = "134253247562";
	$arReceivers[3]['id'] = 2;
	
	$arReceivers[4]['name'] = "645365345656";
	$arReceivers[4]['id'] = 2;
	
	/*
	$arReceivers[5]['name'] = "897678346546";
	$arReceivers[5]['id'] = 2;
	*/
	
	$iCount = 0;
	
	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<list>\n";
	
	foreach($arAccounts as $account)
	{
		$name = $account['name'];
		$id = $account['id'];
		$group = $account['group'];

		$strResults.= "\t\t<account>\n";
		$strResults.= "\t\t\t<name>$name</name>\n";
		$strResults.= "\t\t\t<id>$id</id>\n";
		$strResults.= "\t\t\t<group>$group</group>\n";

		/*
			Insert receiver information here
		*/
		if($iCount == 0)
		{
			$iCount = 1;
			foreach($arReceivers as $receiver)
			{
				$name = $receiver['name'];
				$id = $receiver['id'];
		
				$strResults.= "\t\t<receiver>\n";
				$strResults.= "\t\t\t<name>$name</name>\n";
				$strResults.= "\t\t\t<id>$id</id>\n";
				$strResults.= "\t\t</receiver>\n";
			}
		}

		$strResults.= "\t\t</account>\n";
	}
	
	$strResults.="</list>";
	echo $strResults;
};
/*
	GetReceiverList returns to the client the list
	of receivers based upon what requirements they have
*/
function GetReceiverList()
{
	$oReceiverModel = receiverModel::GetInstance();
	$oReceiverHardware = receiverHardware::GetInstance();
	$oOrganization = organization::GetInstance();
	$db = rmsData::GetInstance();
	$oRights = rights::GetInstance();
	$oUser = cUserContainer::GetInstance();
	$arWhere = array();
	
	global $g_oUserSession;
	
	$oXML = new XML;
		

    $strModel = "";
    $strOrg = "";
	$whereClause = array();
	$recId = -1;
	$userId = -1;
	$limit = 0;			//	Default number of receivers to return (0 means all)
	
	$arOrganizations = array();
		
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			$val = $db->EscapeString($val);
			switch($fieldName)
			{
				case "id":
					if(is_numeric($val))
					{
						$recId = $val;
					}
					break;
				case "receiver":
					$whereClause['tblReceiver.rec_Number'] = $val;
					break;
				case "smartCard":
					$whereClause['tblReceiver.rec_SmartCard'] = $val;
					break;
				case "hardware":
					$whereClause['tblReceiver.rec_Hardware'] = $val;
					break;
				case "status":
					$whereClause['tblReceiverStatus.recStatus_Name'] = $val;
					break;
				case "control":
					$whereClause['tblReceiver.rec_Control_Num'] = $val;
					break;
				case "owner":
	        		$userId = GetUserID($val);
	        		break;
	        	case "model":
	        		$strModel = $val;
	        		break;
	        	case "organization":
	        		$strOrg = $val;
	        		break;
	        	case "limit":
	        		$limit = $val;
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

	$strSQL = "
		SELECT
				tblReceiver.*
			,	tblReceiverStatus.recStatus_Name
		FROM
			tblReceiver
			LEFT JOIN tblReceiverStatus
				ON tblReceiver.recStatus_ID = tblReceiverStatus.recStatus_ID";
		
	$firstTime = false;
		
	foreach($whereClause as $field => $val)
	{
		if($val != "")
		{
			$arWhere[] = "$field like '%$val%'";
		}
	}
	
	/*
		strModels is an array of hardware ids which correspond to the particular
		model
		Since we only have the hardware id to search for a receiver for, we'll
		use these hardware ids to find the model
	*/
	if($strModel != "")
	{
		$arModels = $oReceiverHardware->GetHardwareList($strModel);
		
		if(sizeof($arModels))
		{
			$strModelSQL = "(";
			for($i = 0; $i < sizeof($arModels); $i++)
			{
				$val = $arModels[$i]['hw_Code'];
				$strModelSQL .= "tblReceiver.rec_Hardware like '$val%'";
				
				if( $i + 1 < sizeof($arModels))
				{
					//	add an 'OR' because there's at least 1 more
					$strModelSQL .= " OR ";
				}
			}
			$strModelSQL .= ")";
		}
		else
		{
			$strModelSQL = "tblReceiver.rec_Hardware like -1";
		}
		
		$arWhere[] = $strModelSQL;
	}

	if(strlen($strOrg))
	{
		$orgId = $oOrganization->GetID($strOrg);
		
		$strOrgSQL = "(tblReceiver.org_ID = $orgId";

		$arChildren = $oOrganization->GetChildren($strOrg);

		foreach($arChildren as $org)
		{
			$strOrgSQL.= " OR tblReceiver.org_ID = " . $org['org_ID'];
		}
		
		$strOrgSQL.= ")";
		$arWhere[] = $strOrgSQL;
	}
	
	/*
		Add the receiver if the user is searching by one
	*/
	if($recId > -1)
	{
		$arWhere[] = "tblReceiver.rec_ID = $recId";
	}

	if($userId > -1)
	{
		$arWhere[] = "tblReceiver.user_ID = $userId";
	}

	if(sizeof($arWhere) > 0)
	{
		$firstTime = true;
		foreach($arWhere as $where)
		{
			if($firstTime == true)
			{
				$strSQL .= " WHERE";
				$firstTime = false;
			}
			else
			{
				$strSQL.= " AND ";
			}
			
			$strSQL = $strSQL ." " . $where. " ";
		}
	}

	if($limit > 0)
	{
		$strSQL .= " LIMIT $limit";
	}

	$arResults = $db->Select($strSQL);

	/*
		This section determines if the user may take ownership of the reciever.
	*/
	if(sizeof($arResults))
	{
		for($i = 0; $i < sizeof($arResults); $i++)
		{
			$org = $arResults[$i]["org_ID"];
			
			if(isset($arOrgs[$org]) == false)
			{
				$arOrgs[$org] = $g_oUserSession->HasRight($oRights->RMS_Standard, $org);
			}

			$arResults[$i]['mayOwn'] = $arOrgs[$org];
		}
	}
	
	for($i = 0; $i < sizeof($arResults); $i++)
	{
		$arUser = $oUser->Get($arResults[$i]['user_ID']);
		$arResults[$i]['user_Name'] = $arUser['user_Name'];

		$arOrg = $oOrganization->Get($arResults[$i]['org_ID']);
		$arResults[$i]['org_Short_Name'] = $arOrg['org_Short_Name'];
	}
		
	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
}
/*
	GetReceiverList returns the list of receivers
	pending to be added to the inventory.
*/
function GetPendingReceiverList()
{
	$db = rmsData::GetInstance();
	$oUser = cUserContainer::GetInstance();

	$oXML = new XML;

	/*
		The following sql string
		builds a list of receivers. All of the numbered fields, org_ID, user_ID (owner),
		etc are aliased with their name.
		The next part of the process is including the filters based upon what the user requested
	*/

	$strSQL = "
		SELECT
			tblReceiverRequest.recReq_ID
			, tblReceiverRequest.recReq_Number
			, tblReceiverRequest.recReq_Smartcard
			, tblReceiverRequest.recReq_Hardware
		FROM
			tblReceiverRequest";

	$arResults = $db->Select($strSQL);

	for($i = 0; $i < sizeof($arResults); $i++)
	{
		$arUser = $oUser->Get($arResults[$i]['user_ID']);
		$arResults[$i]['user_Name'] = $arUser['user_Name'];
	}

	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
	
	//OutputXMLList($strSQL, "list", "element");
	
}
?>