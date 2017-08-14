<?

	require_once('../classes/class.csgTransaction.php');
	require_once('../classes/class.csgGroup.php');
	require_once('../../rms/classes/class.receiverModel.php');

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

	$oCSG_Groups = new csgGroup();
	$oCSG_Request = csgTransaction::GetInstance();
	$oCSG_RequestStatus = csgTransactionStatus::GetInstance();

	$organization = "";
	$name = "";								//	Name of the CGS group
	$strDescription = "";						///	strDescription of the CSG group
	$owner =  "";							///	The owning organization of a CSG group
	$transId = "";								//	The transaction id
	$strComment = "";						//	Comment about a CSG transaction status
	$strStatus = "";						//	CSG transaction status
	$user_info = "";						//	may be the user's id or name, depending upon the context

	$receiver="";
	$smartcard="";
	$hardware="";
	$details="";
	$authapps="";
	$authbasic="";

	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch(strtolower($fieldName))
			{
				case "user_info":
					$user_info = $val;
					break;
				case "receiver":
					$receiver = $val;
					break;
				case "smartcard":
					$smartcard = $val;
					break;
				case "hardware":
					$hardware = $val;
					break;
				case "details":
					$details = $val;
					break;
				case "authapps":
					$app = $val;
					break;
				case "authbasic":
					$basic = $val;
					break;
				case "organization":
					$organization = $val;
					break;
				case "name":
					/*
						May be CSG group name
					*/
					$name = $val;
					break;
				case "description":
					/*
						May be CSG group description
					*/
					$strDescription = $val;
					break;
				case "owner":
					/*
						Owner Organization of a CSG Group
					*/
					$owner = $val;
					break;
				case "transid":
					$transId = $val;
					break;
				case "comment":
					$strComment = $val;
					break;
				case "status":
					$strStatus = $val;
					break;
			}
		}
	}

	/*
		We made the list lower case. All values
		in the switch($action) must be lower case
	*/
	$action = strtolower($_GET['action']);

	switch($action)
	{
        case "addgroup":
			$oCSG_Groups->Add($name, $strDescription, $owner);
			$oCSG_Groups->results->Send();
			exit;
		case "modifygroup":
			$oCSG_Groups->Modify($name, $strDescription, $owner, $id);
			$oCSG_Groups->results->Send();
			exit;
		case "removegroup":
			$oCSG_Groups->Remove($id);
			$oCSG_Groups->results->Send();
			exit;
		case "getassignedgroups":
			global $g_oUserSession;
			$userId = $g_oUserSession->GetUserID();

			$oCSG_Groups->GetUserAssigned($userId);
			exit;
		case "getchildren":
			$oOrganization->GetChildren($organization);
			exit;
			break;
		case "validaterequest":
			$oCSG_Request->ValidateRequestItem($receiver, $smartcard, $details, $app, $basic);
			$oCSG_Request->results->Send();
			break;
		case "gettransactionlist":
			$oCSGStatus = csgTransactionStatus::GetInstance();
			$oCSGStatus->PurgeOldStatuses();
			GetCSGTransactionList();
			break;
		case "gettransactionqueue":
			GetCSGTransactionQueue();
			break;
		case "statuschange":
			global $g_oUserSession;
			$userId = $g_oUserSession->GetUserID();
			$oCSG_RequestStatus->Add($transId, $userId, $strStatus, $strComment );
			$oCSG_RequestStatus->results->Send();
			break;
		case "clearold":
			$oCSGStatus = csgTransactionStatus::GetInstance();
			$oCSGStatus->PurgeOldStatuses();
			break;
		case "getstatus":
			$oCSG_RequestStatus = csgTransactionStatus::GetInstance();
			$arResults = $oCSG_RequestStatus->GetStatus($transId);
			$oXML = new XML;
			$oXML->serializeElement($arResults, "element");
			$oXML->outputXHTML();
			break;
		case "getstatus_list":
			/*
				returns a list of csg transaction statuses
			*/
			GetCSGStatusList();
			break;		
		default:
			break;
	}

	exit;
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function GetCSGStatusList()
{
	$db = csgData::GetInstance();
	$oXML = new XML;

	$strSQL = "SELECT
					*
				FROM
					tblCSGTransactionStatusType";

	$arResults = $db->select($strSQL);

	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
}
/*
	-	GetReceiverList returns to the client the list
	of receivers based upon what requirements they have
	-	In addition to retrieving the transactions
		in a user's queue, this function checks the
		locked status of transactions and unlocks them
		if the timeout period has passed.
*/
function GetCSGTransactionQueue()
{
	global $g_oUserSession;

	$oReceiverModel = receiverModel::GetInstance();
	$oOrganization = organization::GetInstance();
	$db = csgData::GetInstance();
	$oRights = rights::GetInstance();
	$oSystemAccess = systemAccess::GetInstance();
	$oUser = cUserContainer::GetInstance();
	
	$oCSG_RequestStatus = csgTransactionStatus::GetInstance();

	$oXML = new XML();

	$adminId = $g_oUserSession->GetUserID();

	if(!$g_oUserSession->HasRight($oRights->CSG_Admin))
	{
		$oXML->outputXHTML();
		return false;
	}

	/*
		We want all transactions from users who are in the user's
		CSG queue.
		So filter the user's by the organizations they're in
		and then by the transactions those users have
	*/
	$arAdminOrgs = $oSystemAccess->GetRightAssignedOrgs($adminId, $oRights->CSG_Admin);
	
	$arUserOrgs = $oUser->GetOrganizationUsers($arAdminOrgs);

	$firstTime = true;
	
	$strSQL = "SELECT DISTINCT trans_ID FROM tblCSGTransactionStatus WHERE status_ID = 1 OR status_ID = 8 OR status_ID = 7";
	$arTransactions = $db->Select($strSQL);
	
	if(sizeof($arTransactions) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	$strSQL = "	SELECT
					*
				FROM
					tblCSGTransaction WHERE (";

	foreach($arTransactions as $arTransaction)
	{
		if($firstTime == true)
		{
			$firstTime = false;
		}
		else
		{
			$strSQL .= " OR ";
		}

		$strSQL .= " trans_ID = " . $arTransaction['trans_ID'];
	}
	
	$strSQL.= ") AND (";

	$firstTime = true;
	
	if(sizeof($arUserOrgs) > 0)
	{
		foreach($arUserOrgs as $org)
		{
			if($firstTime == true)
			{
				$firstTime = false;
			}
			else
			{
				$strSQL .= " OR ";
			}

			$strSQL .= " user_ID = " . $org['user_ID'];
		}

		$strSQL.= ")";
	}
	
	/*
		Now filter by status
	*/
	
	$arTransactions = $db->select($strSQL);

	if(sizeof($arTransactions) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	$iCount = 0;

	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<list>\n";

	foreach($arTransactions as $transaction)
	{
		$transId = $transaction['trans_ID'];
		$userId = $transaction['user_ID'];
		$arRecentStatus = $oCSG_RequestStatus->GetCurrentStatus($transId);

		if($arRecentStatus == null)
		{
			continue;
		}
		/*
			Release processing transactions
		*/
		if($arRecentStatus['status_Name'] != "Pending" && $arRecentStatus['status_Name'] != "Resend")
		{
			/*
				Check to see if the transaction can be released
			*/
			if($arRecentStatus['status_Name'] != "Processing")
			{
				continue;
			}

			/*
				The transaction type is processing. check that the time is older than 10 minutes
			*/
			$pastTime  = date("Y-m-d H:i:s", mktime(date("H"), date("i") - 30, date("s"), date("m"), date("d"), date("Y")));
			$statusDate = $arRecentStatus['status_Date'];

			if($statusDate < $pastTime)
			{
				$oCSG_RequestStatus->Add($transId, 0, "Pending", "Process time expired");
				$arRecentStatus = $oCSG_RequestStatus->GetCurrentStatus($transId);
			}
			else
			{
				/*
					Check to see if the user is the owner of this transaction.
					If they are, they may still modify the transaction
					otherwise we skip this transaction
				*/
				if($adminId != $arRecentStatus['user_ID'])
				{
					continue;
				}
				
			}
		}
		
		$arUser = $oUser->Get($userId);
		
		$userName = $arUser['user_Name'];
		
		$arOrg = $oOrganization->Get($arUser['org_ID']);
		
		$owner_Org = $arOrg['org_Short_Name'];
		$owner_Long_Org = $arOrg['org_Long_Name'];

		$strResults.= "<element>\n";
		$strResults.= "<id>$transId</id>\n";
		$strResults.= "<owner_Name>$userName</owner_Name>\n";
		$strResults.= "<owner_Org>$owner_Org</owner_Org>\n";
		$strResults.= "<owner_Long_Org>$owner_Long_Org</owner_Long_Org>\n";

		foreach($arRecentStatus as $field => $val)
		{
			$strResults.= "<$field>$val</$field>\n";
		}
		$strResults.= "</element>\n";
	}

	$strResults.="</list>\n";

	ClearCache();
	header("Content-Type: text/xml");
	echo $strResults;

}
/*--------------------------------------------------------------------------
	-	description
			GetReceiverList returns to the client the list
			of receivers based upon what requirements they have
	-	params
	-	return
--------------------------------------------------------------------------*/
function GetCSGTransactionList()
{
	$oUser = cUserContainer::GetInstance();
	$oReceiverModel = receiverModel::GetInstance();
	$oOrganization = organization::GetInstance();
	$db = csgData::GetInstance();
	$oCSG_RequestStatus = csgTransactionStatus::GetInstance();

	$oXML = new XML();

	$receiver = "";
	$smartCard = "";
	$statusId = -1;
    $strOrg = "";
	$recId = -1;
	$iTransaction = -1;
	$userId = -1;
	$iCount = 0;
	$arWhere = array();
	$startDate = "";
	$arRecentStatus = null;

	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			$val = $db->EscapeString($val);
			switch($fieldName)
			{
				case "transid":
					if(is_numeric($val))
					{
						$iTransaction = $val;
					}
					break;
				case "receiver":
					$receiver = $val;
					break;
				case "smartCard":
					$smartCard = $val;
					break;
				case "status":
					$statusId = GetCSGStatusID($val);
					break;
				case "user_info":
					$userId = GetUserID($val);
	        		break;
	        	case "organization":
	        		$strOrg = $val;
	        		break;
	        	case "start_date":
					$startDate = strtotime($val);
	        		break;
	        }
	  	}
	}

	$strSQL = "	SELECT
					*
				FROM
					tblCSGTransaction";

	if($iTransaction > -1)
	{
		$arWhere[] = "tblCSGTransaction.trans_ID = $iTransaction";
	}

	if($userId > -1)
	{
		$arWhere[] = "tblCSGTransaction.user_ID = $userId";
	}

	/*
		Add the organization(s)
	*/
	if(strlen($strOrg))
	{
		$arUsers = $oUser->GetOrganizationUsers($strOrg);

		if($arUsers)
		{
			$strUsers = "(";
			$orgFirstTime = true;
			foreach($arUsers as $aUser)
			{
				if($orgFirstTime == true)
				{
					$orgFirstTime = false;
				}
				else
				{
					$strUsers .= " OR ";
				}
				
				$strUsers .= " user_ID = " . $aUser['user_ID'];
			}
	
			$strUsers.= ")";
			$arWhere[] = $strUsers;
		}
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
				$strSQL.= " OR ";
			}
			
			$strSQL = $strSQL ." " . $where. " ";
		}
	}

	$strSQL .= " ORDER BY trans_ID DESC";

	$arTransactions = $db->Select($strSQL);

	if(sizeof($arTransactions) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	if($statusId > -1)
	{
		$arTransactions = FilterByCSGStatus($arTransactions, $statusId);
	}
	
	if(sizeof($arTransactions) < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	$strResults = "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n<list>\n";

	foreach($arTransactions as $transaction)
	{
		$arRecentStatus = null;
		
		$transId = $transaction['trans_ID'];
		
		$userName = $oUser->GetName($transaction['user_ID']);

		if(strlen($startDate))
		{
			$arRecentStatus = $oCSG_RequestStatus->GetCurrentStatus($transId);
			if(sizeof($arRecentStatus) > 0)
			{
				$transDate = strtotime($arRecentStatus['status_Date']);

				if($transDate < $startDate)
				{
					continue;
				}
			}
		}
		
		if($statusId > -1)
		{
			if($arRecentStatus == null)
			{
				$arRecentStatus = $oCSG_RequestStatus->GetCurrentStatus($transId);
			}
			
			if($statusId != $arRecentStatus['status_ID'])
			{
				continue;
			}
		}
		/*
			Now filter by other fields
		*/
		$strSQL = "	SELECT
						transtype_ID
					,	transtype_Receiver
					,	transtype_SmartCard
					,	transtype_BasicAuth
					,	transtype_AppsAuth
					,	transtype_Details
					FROM
						tblCSGTransactionTypeOld
					WHERE trans_ID = $transId ";

		if(strlen($receiver))
		{
			$strSQL .= "AND transtype_Receiver like '%$receiver%' ";
		}

		if(strlen($smartCard))
		{
			$strSQL .= "AND transtype_SmartCard like '%$smartCard%' ";
		}

		$arTransactionItems = $db->Select($strSQL);

		if(sizeof($arTransactionItems) > 0)
		{
			$strResults.= "<element>\n";
			$strResults.= "<id>$transId</id>\n";
			$strResults.= "<owner_Name>$userName</owner_Name>\n";

			/*
				Retrieve the status of this transaction so we can add it to the results
			*/
			$arRecentStatus = $oCSG_RequestStatus->GetCurrentStatus($transId);

			foreach($arRecentStatus as $field => $val)
			{
				$strResults.= "<$field>$val</$field>\n";
			}

			$arUser = $oUser->Get($arRecentStatus['user_ID']);
			
			$strResults.= "<status_User_Name>".$arUser["user_Name"]."</status_User_Name>\n";

			/*
				Now add all of the elements the user has added
			*/

			foreach($arTransactionItems as $requestItem)
			{
				$strResults.= "<requestItem>\n";
				foreach($requestItem as $field => $val)
				{
					$strResults.= "<$field>$val</$field>\n";
				}
				$strResults.= "</requestItem>\n";
			}

			$strResults.= "</element>\n";
			$iCount++;
			
			if($iCount == 100)
			{
				break;
			}
		}
	}
	
	$strResults.="</list>\n";
	if($iCount < 1)
	{
		$oXML->outputXHTML();
		return true;
	}

	ClearCache();
	header("Content-Type: text/xml");
	echo stripslashes($strResults);
}
//--------------------------------------------------------------------------
/**
	\brief
		This function returns an array containing the transactions
		which have the passed in status type.
	\param
	\return
*/
//--------------------------------------------------------------------------
function FilterByCSGStatus($arTransactions, $statusId)
{
	if(!is_array($arTransactions))
	{
		return null;
	}

	if(sizeof($arTransactions) < 1)
	{
		return null;
	}
	
	if($statusId < 1)
	{
		return null;
	}
	
	$db = csgData::GetInstance();

	$strSQL = "
		SELECT DISTINCT
			tblCSGTransaction.trans_ID,
			tblCSGTransaction.user_ID
		
		FROM
			tblCSGTransactionStatus
			LEFT JOIN
				tblCSGTransaction
				ON
				tblCSGTransaction.trans_ID = tblCSGTransactionStatus.trans_ID
		WHERE
			status_ID = $statusId AND (";
			
	$firstTime = true;
			
	foreach($arTransactions as $transaction)
	{
		if($firstTime == true)
		{
			$firstTime = false;
		}
		else
		{
			$strSQL .= " OR ";
		}
		
		$strSQL .= " tblCSGTransactionStatus.trans_ID = " . $transaction['trans_ID'];
	}
	
	$strSQL .= ")";

	$arResults = $db->Select($strSQL);
	
	return $arResults;
}
?>