<?
	require_once('../../../classes/include.php');
	require_once('class.db.php');
	require_once('class.csgTransStatus.php');
	require_once('../../rms/classes/class.receiver.php');
	require_once('../../rms/classes/class.receiverModel.php');

/*
	Provides functionality to add/modify and manage csg transactions
*/
class csgTransaction extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();

		$this->table_Name = "tblCSGTransaction";
		$this->field_Id = "trans_ID";
		$this->field_Name = "trans_ID";

		$this->db = csgData::GetInstance();

		/*
			Set up the rights for DMS
		*/
		$rights = rights::GetInstance();

		$this->rights_Remove = $rights->CSG_Standard;
		$this->rights_Add = $rights->CSG_Standard;
		$this->rights_Modify = $rights->CSG_Standard;

		$this->systemId = 3;

	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Validate a csg request item
		\param receiver
			12 digit Receiver number
		\param smartcard
			12 digit smart card number
		\param details
			At least one field, app auth, details, or basic must
			have something in it.
		
		\param auth_app
			A check stating the transaction should have the applications option
		
		\param auth_basic
			A check stating the transaction should have the basic channels
			package
		
		\return
	*/
	//--------------------------------------------------------------------------
	function ValidateRequestItem($receiver, $smartCard, $details, $auth_app, $auth_basic)
	{
		global $g_oUserSession;
        $oReceiver = receiver::GetInstance();
   		$oReceiverModel = receiverModel::GetInstance();

		/*
			CSG transactions may take a full 12 digit number.
			The number must be in the inventory or the transaction
			will not be accepted.
			or they may take 10 digit numbers, if those numbers
			are valid receiver numbers. We can't CRC them, but
			we can validate that it's actually 10 digits
		*/
		if(!$oReceiver->ValidateReceiver($receiver))
		{
			return $this->results->Set('false', $oReceiver->results->GetMessage());
		}
		
		/*
		if($oReceiver->GetID($receiver) < 0)
		{
			return $this->results->Set('false', "Receiver must be added to database before it may be assigned. Submit this receiver via the 'Add Inventory' button.");
		}
		*/

		if(!$oReceiver->ValidateSmartCard($smartCard))
		{
			return $this->results->Set('false', $oReceiver->results->GetMessage());
		}

		if($auth_app != "true")
		{
			if($auth_app != "false")
			{
				if($auth_app != 0)
				{
					if($auth_app != 1)
					{
						return $this->results->Set('false', "Invalid application authorization type.");
					}
				}
			}
		}

		$details = trim($details);

		$bValidDetails = $this->IsValidDetails($details);
		
		if(!$bValidDetails)
		{
			if(strlen($details))
			{
				return $this->results->Set('false', "Details field contains invalid characters.");
			}
		}

		if($auth_basic != "true")
		{
			if($auth_basic != "false")
			{
				if($auth_basic != 1)
				{
					if($auth_basic != 0)
					{
						return $this->results->Set('false', "Invalid basic authorization type.");
					}
				}
			}
		}

		/*
			make sure at least one field is set
		*/
		if($auth_basic != "true")
		{
			if($auth_basic != 1)
			{
				if($auth_app != 1)
				{
					if($auth_app != "true")
					{
						if(!$bValidDetails)
						{
							return $this->results->Set('false', "At least one check box (basic, apps) must contain data, or details must contain valid comment about request.");
						}
					}
				}
			}
		}
		return $this->results->Set('true', "Receiver request authorization item valid");
	}
	/*--------------------------------------------------------------------------
		This function validates that the submitted details text is valid
	----------------------------------------------------------------------------*/
	function IsValidDetails($strMessageSubject)
	{
		/*--------------------------------------------------------------------------
			May contain only a-z 0-9 A-Z spaces and special characters	
			\',;:\$@%#_/()–.?!"
			Can be up to 255 characters			
		----------------------------------------------------------------------------*/		
		if(eregi("^[a-z0-9 \n\r.!?',\";:\$@%#_/()\\-]{1,}$",  $strMessageSubject))
		{
			return $this->results->Set('true', "Valid message subject.");
		}
		
		return $this->results->Set('false', "Detail field is smaller than 3 characters or contains one of the following invalid characters: ` ~	^ *	= +	| ] [ }	{ <	> &");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Add a csg request to the database.
		\return
			-	true if the add was successful
			-	false if the add was not successful.
				Check the results text data for details.
	*/
	//--------------------------------------------------------------------------
	function Add()
	{
		global $g_oUserSession;

		/*
			Initializing all variables
		*/
		$strTitle = "";
		$strDescription = "";
		$strVersion = "";
		$strType = "";
		$docTypeId = -1;
		$orgId = -1;
		$docVersionId = -1;
		$arRequestItems = array();

		/*
			Make sure we have at least one element
		*/
		$iRequestCount = 0;
		$iCounter = 0;				//	the number of results we have found
		$haveResults = true;		//	 set to false when we have no more valid options

		if(isset($_POST['count']))
		{
			$iRequestCount = $_POST['count'];
		}
		
		if(!$g_oUserSession->HasRight($this->rights_Add))
		{
			return $this->OutputFormResults('false', $g_oUserSession->results->GetMessage(). "You may not submit CSG requests.");
		}

		if($iRequestCount < 1)
		{
			return $this->OutputFormResults('false', "Authorization request must have receivers to authorize.");
		}

		while($iCounter < $iRequestCount)
		{
			$receiver = "";
			$smartCard = "";
			$hardware = "";
			$details = "";
			$auth_app = "";
			$auth_basic = "";

			/*
				<variable>Pos is the name of the element
				position in the list. These are the names of the elements
				we're looking for results
			*/
			$receiverPos = "receiver$iCounter";
			$smartCardPos = "smartcard$iCounter";
			$hardwarePos = "hardware$iCounter";
			$detailsPos = "details$iCounter";
			$basicAuthPos = "auth_basic$iCounter";
			$appsAuthPos = "auth_apps$iCounter";

			if(isset($_POST[$receiverPos]))
			{
				$receiver = $_POST[$receiverPos];
			}

			if(isset($_POST[$smartCardPos]))
			{
				$smartCard = $_POST[$smartCardPos];
			}

			if(isset($_POST[$hardwarePos]))
			{
				$hardware = $_POST[$hardwarePos];
			}

			if(isset($_POST[$detailsPos]))
			{
				$details = trim($_POST[$detailsPos]);
			}

			if(isset($_POST[$basicAuthPos]))
			{
				$auth_basic = $_POST[$basicAuthPos];
			}

			if(isset($_POST[$appsAuthPos]))
			{
				$auth_app = $_POST[$appsAuthPos];
			}
			
			if($this->ValidateRequestItem($receiver, $smartCard, $details, $auth_app, $auth_basic))
			{
				/*
					Add the request to the list
				*/
				$arRequestItems[$iCounter] = Array();
				$arRequestItems[$iCounter]['receiver'] = $receiver;
				$arRequestItems[$iCounter]['smartCard'] = $smartCard;
				$arRequestItems[$iCounter]['details'] = $details;
				$arRequestItems[$iCounter]['auth_app'] = $auth_app;
				$arRequestItems[$iCounter]['auth_basic'] = $auth_basic;
			}
			else
			{
				$displayNumber = $iCounter + 1;
				return $this->OutputFormResults('false', "Authorization request item ($displayNumber) is invalid. " . $this->results->GetMessage());
			}

			$iCounter++;
		}

		/*
			-	Now cycle through the entire array and stuff the items into a transaction
			-	add the request items
			-	set the status to pending
		*/
		$transID = $this->CreateTransaction($g_oUserSession->GetUserID());

		if($transID < 0)
		{
			return $this->OutputFormResults('false', $this->results->GetMessage());
		}

		for($iCounter = 0; $iCounter < sizeof($arRequestItems); $iCounter++)
		{
			$receiver = $arRequestItems[$iCounter]['receiver'];
			$smartCard = $arRequestItems[$iCounter]['smartCard'];
			$details = $arRequestItems[$iCounter]['details'];
			$auth_app = $arRequestItems[$iCounter]['auth_app'];
			$auth_basic = $arRequestItems[$iCounter]['auth_basic'];

			if(!$this->AddRequestItem($transID, $receiver, $smartCard, $details, $auth_app, $auth_basic))
			{
				return $this->OutputFormResults('false', "Authorization request must have receivers to authorize.");
			}
		}

		return $this->OutputFormResults('true', "Added authorization request [$transID].");
	}
	/*--------------------------------------------------------------------------
		-	description
				Modify an existing transaction.
		-	params
				Because this function pulls the values right from post via
				a form, there are no parameters.
		-	return
				returns the code necessary to send a message
				to the parent frame on the client computer.
	--------------------------------------------------------------------------*/
	function Modify()
	{
		global $g_oUserSession;
   		$transStatus = csgTransactionStatus::GetInstance();			//	the transaction status object


		/*
			Initializing all variables
		*/
		$transId = -1;
		$strTitle = "";
		$strDescription = "";
		$strVersion = "";
		$strType = "";
		$docTypeId = -1;
		$orgId = -1;
		$docVersionId = -1;
		$arRequestItems = array();

		/*
			Make sure we have at least one element
		*/
		$iRequestCount = 0;
		$iCounter = 0;				//	the number of results we have found
		$haveResults = true;		//	 set to false when we have no more valid options

		if(isset($_POST['count']))
		{
			$iRequestCount = $receiver = $_POST['count'];
		}

		if($iRequestCount < 1)
		{
			return $this->OutputFormResults('false', "Authorization request must have receivers to authorize.");
		}

		if(isset($_POST['transId']))
		{
			$transId = $_POST['transId'];
		}

		if(!$this->Exists($transId))
		{
			return $this->OutputFormResults('false', "Invalid request submitted for processing.");
		}

		/*
			We need to make sure the transaction is locked by the user
		*/
		$arCurrentStatus = $transStatus->GetCurrentStatus($transId);

		if(!isset($arCurrentStatus))
		{
			return $this->OutputFormResults('false', "Unable to determine lock status. Lock the transaction via the history page.");
		}

		if(strcasecmp($arCurrentStatus['status_Name'], "UserLocked") != 0)
		{
			/*
				We have some other status, which is not locked.
				Kick it back to the user
			*/
			return $this->OutputFormResults('false', "Transaction is not locked and therefore may not be modified. Relock the transaction via the history page.");
		}

		/*
			Make sure this is the owner of the transaction
		*/
		$arTransaction = $this->Get($transId);

		if($g_oUserSession->GetUserID() != $arTransaction['user_ID'])
		{
			return $this->OutputFormResults('false', "You may not modify a transaction you do not own.");
		}
		
		if(!$g_oUserSession->HasRight($this->rights_Modify))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		while($iCounter < $iRequestCount)
		{
			$receiver = "";
			$smartCard = "";
			$hardware = "";
			$details = "";
			$auth_app = "";
			$auth_basic = "";

			/*
				<variable>Pos is the name of the element
				position in the list. These are the names of the elements
				we're looking for results
			*/
			$receiverPos = "receiver$iCounter";
			$smartCardPos = "smartcard$iCounter";
			$hardwarePos = "hardware$iCounter";
			$detailsPos = "details$iCounter";
			$basicAuthPos = "auth_basic$iCounter";
			$appsAuthPos = "auth_apps$iCounter";

			if(isset($_POST[$receiverPos]))
			{
				$receiver = $_POST[$receiverPos];
			}

			if(isset($_POST[$smartCardPos]))
			{
				$smartCard = $_POST[$smartCardPos];
			}

			if(isset($_POST[$hardwarePos]))
			{
				$hardware = $_POST[$hardwarePos];
			}

			if(isset($_POST[$detailsPos]))
			{
				$details = $_POST[$detailsPos];
			}

			if(isset($_POST[$basicAuthPos]))
			{
				$auth_basic = $_POST[$basicAuthPos];
			}

			if(isset($_POST[$appsAuthPos]))
			{
				$auth_app = $_POST[$appsAuthPos];
			}

			if($this->ValidateRequestItem($receiver, $smartCard, $details, $auth_app, $auth_basic))
			{
				/*
					Add the request to the list
				*/
				$arRequestItems[$iCounter] = Array();
				$arRequestItems[$iCounter]['receiver'] = $receiver;
				$arRequestItems[$iCounter]['smartCard'] = $smartCard;
				$arRequestItems[$iCounter]['details'] = $details;
				$arRequestItems[$iCounter]['auth_app'] = $auth_app;
				$arRequestItems[$iCounter]['auth_basic'] = $auth_basic;
			}
			else
			{
				$displayNumber = $iCounter + 1;
				return $this->OutputFormResults('false', "Authorization request item ($displayNumber) is invalid. " . $this->results->GetMessage());
			}

			$iCounter++;
		}

		/*
			-	Remove all existing transaction items
			-	read them
		*/

		$strSQL = "DELETE FROM tblCSGTransactionTypeOld WHERE trans_ID = $transId";

		$this->db->sql_delete($strSQL);

		for($iCounter=0; $iCounter < sizeof($arRequestItems); $iCounter++)
		{
			$receiver = $arRequestItems[$iCounter]['receiver'];
			$smartCard = $arRequestItems[$iCounter]['smartCard'];
			$details = $arRequestItems[$iCounter]['details'];
			$auth_app = $arRequestItems[$iCounter]['auth_app'];
			$auth_basic = $arRequestItems[$iCounter]['auth_basic'];

			if(!$this->AddRequestItem($transId, $receiver, $smartCard, $details, $auth_app, $auth_basic))
			{
				return $this->OutputFormResults('false', "Authorization request item ($iCounter) is invalid. " . $this->results->GetMessage());
			}
		}

		if(!$transStatus->Add($transId, $g_oUserSession->GetUserID(), "Pending", "Edited Transaction"))
		{
			return $this->OutputFormResults('false', $transStatus->results->GetMessage());
		}
		
		return $this->OutputFormResults('true', $transStatus->results->GetMessage());
	
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Creates the initial transaction id, sets the owner, and sets
			the status of the transaction to open and then pending.
		\param userId
			The user account which owns this transaction.
		\return
			returns the id of the transaction created.
			-1 if no transaction was created
	*/
	//--------------------------------------------------------------------------
	function CreateTransaction($userId)
	{
		$transStatus = csgTransactionStatus::GetInstance();			//	the transaction status object
		$oUserContainer = cUserContainer::GetInstance();
		$oLog = cLog::GetInstance();
		$oUser = $oUserContainer->GetUser($userId);
	
		if(!isset($oUser))
		{
			$oLog->log($this->system_id, "Invalid user submitted for creating a CSG transaction.", LOGGER_WARNING);
			$this->results->Set('true', "Invalid user submitted for creating a CSG transaction.");
			return -1;
		}

		/*
			The record does not exist, add it
		*/
		$arInsert = array();
		$arInsert['user_ID'] = $userId;
		$this->db->insert($this->table_Name, $arInsert);
		/*
			To find a unique record we need to make sure there's no status
			for the transaction in the status table and we need to make
			sure there's no request items added to the table yet and it's connected
			to this user id
		*/
		$strSQL = "	SELECT LAST_INSERT_ID() AS $this->field_Id";
		$arRecord = $this->db->Select($strSQL);
		$transId = $arRecord[0][$this->field_Id];

		if(!$transStatus->Add($transId, $userId, "Open", "Initial state"))
		{
			$oLog->log($this->system_id, "Failure setting open status for transaction [$transId].", LOGGER_WARNING);
			$this->Remove($transId);
			$this->results->Set('false', $transStatus->results->GetMessage());
			return -1;
		}

		if(!$transStatus->Add($transId, $userId, "Pending", ""))
		{
			$oLog->log($this->system_id, "Failure setting initial pending status for transaction [$transId].", LOGGER_WARNING);
			$this->Remove($transId);
			$this->results->Set('false', $transStatus->results->GetMessage());
			return -1;
		}

		$this->results->Set('true', "Transaction created properly: " . $transStatus->results->GetMessage());
		return $transId;
	}
	/*
		Add request item adds an individial request item type into the system.
		$trans_ID
			The id of the transaction we're adding this to
		returns:
			true on success
			false on failure
	*/
	function AddRequestItem($transID, $receiver, $smartCard, $details, $auth_app, $auth_basic)
	{

		if(!$this->ValidateRequestItem($receiver, $smartCard, $details, $auth_app, $auth_basic))
		{
			return false;
		}

		if($auth_basic == "true" || $auth_basic == 1)
		{
			$auth_basic = 1;
		}
		else
		{
			$auth_basic = 0;
		}

		if($auth_app == "true" || $auth_app == 1)
		{
			$auth_app = 1;
		}
		else
		{
			$auth_app = 0;
		}

		/*
			The record does not exist, add it
		*/
		$arInsert = array();

		$arInsert['transtype_Receiver'] = array();
		$arInsert['transtype_Receiver']['value'] = $receiver;
		$arInsert['transtype_Receiver']['type'] = "string";

		$arInsert['transtype_SmartCard'] = array();
		$arInsert['transtype_SmartCard']['value'] = $smartCard;
		$arInsert['transtype_SmartCard']['type'] = "string";

		$arInsert['transtype_BasicAuth'] = $auth_basic;
		$arInsert['transtype_AppsAuth'] = $auth_app;
		$arInsert['transtype_Details'] = $details;
		$arInsert['trans_ID'] = $transID;


		if(!$this->db->insert("tblCSGTransactionTypeOld", $arInsert))
		{
			return $this->OutputFormResults('false', "Database Error: " . $this->db->results-GetMessage());
		}

		return true;
	}
	/*-------------------------------------------------------------------
		On a successful/failure of a valid file upload
		this function will be called to display the set message to the user
		indicating the upload has pass/failed.
	-------------------------------------------------------------------*/
	function OutputFormResults($strValue, $strMsg)
	{
		echo "<html><head><script>window.onload = function ()
			{
				if(parent.oCSG_OldAuth)
				{
					parent.oCSG_OldAuth.DisplayResults(\"$strValue||$strMsg\");
				}
			};
			</script></Head>
			<body>$strMsg</body>
			</html>
			";

		return $strValue == 'true';
	}
	/*-------------------------------------------------------------------
		Returns the singleton for this class
	-------------------------------------------------------------------*/
	function GetInstance()
	{
		static $obj;

		if(!isset($obj))
		{
			$obj = new csgTransaction();
		}

		return $obj;
	}
}
?>