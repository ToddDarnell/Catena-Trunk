<?php

/*
	This class keeps track of the transaction status types used by CSG transactions.
*/
require_once('../../../classes/include.php');
require_once('class.db.php');
require_once('class.csgTransStatusType.php');


class csgTransactionStatus extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		$this->table_Name = "tblCSGTransactionStatus";
		$this->field_Id = "transstatus_ID";
		$this->field_Name = "status_Name";
		$this->field_Comment = "status_comment";

		$this->db = csgData::GetInstance();

		/*
			Now set up the rights
		*/
		$rights = rights::GetInstance();

		$this->rights_Remove = $rights->CSG_Admin;
		$this->rights_Add = $rights->CSG_Admin;
		$this->rights_Modify = $rights->CSG_Admin;
		
		$this->systemId = 3;
	}
	/*-------------------------------------------------------------------
		Validates the Rights Group Name
		if recordId does not equal -1 then we exclude that id from
		the search. This helps if we're trying to see if the variable
		already exists in the system for a modify or for a new add.
		Validates that $strTitle is formatted properly,
		does not contain invalid characters, and is not in the database
	-------------------------------------------------------------------*/
	function ValidateName($strTitle, $recordId = -1)
	{
		$strNewTitle = $this->db->EscapeString($strTitle);

		/*
			Check for any invalid characters in Document Title
		*/
		if(!eregi("^[a-z0-9 \',;:/()-]{3,20}$",  $strNewTitle))
		{
			return $this->results->Set('false', "Invalid characters in name.");
		}

		/*
			Try to find a record which has the same Document Title in database
		*/
		if($recordId != -1)
		{
			$strSQL = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strNewTitle' AND $this->field_Id <> $recordId;";
		}
		else
		{
			$strSQL = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strNewTitle';";
		}

		$records = $this->db->Select($strSQL);

		if(sizeof($records) > 0)
		{
			return $this->results->Set('false', "Duplicate name found.");
		}

		return true;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Validate the comment the user would like to have added to a new
			CSG transaction status.
		\param strComment The comment to validate
		\return
			-	true The comment is valid
			-	false The comment is not valid
	*/
	//--------------------------------------------------------------------------
	function ValidateComment($strComment)
	{
		if(!eregi("^[a-z0-9 \.\',;:/\\\"!?@#$%_()-]{1,250}$",  $strComment))
		{
			return $this->results->Set('false', "Insufficient or invalid characters in status comment.");
		}
		
		return true;

	}
	/*--------------------------------------------------------------------------
		-	description
				This function validates the text passed in as a proper
				description of a rights category.
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function ValidateDescription($strDescription)
	{
		if(strlen($strDescription) == 0)
		{
			return $this->results->Set('false', "No description submitted.");
		}

		if(!eregi("^[a-z0-9 \.\',;:/\\\"!?@#$%_()-]{1,250}$",  $strDescription))
		{
			return $this->results->Set('false', "Invalid characters in description.");
		}
		return true;
	}
	/*--------------------------------------------------------------------------
		-	description
				Adds a new status to a transaction.
				Performs a time stamp and who performed the transaction.
				Additionally, makes sure transactions are not changed
				to a status which contradicts the current status.
		-	params
			transID
				The transaction which is having it's status modified
			user_info
				Who's changing the status.
				This may be 0 to represent the system
			strNewStatus
				The transaction status
			strComment
				Detailed explanation for this status
		-	return
				true
					Adding the new status was successful.
				false
					Adding the new status was not successful.
	--------------------------------------------------------------------------*/
	function Add($transID, $user_info, $strNewStatus, $strComment )
	{
		$oLog = cLog::GetInstance();

		$bOwner = false;			//	user owns the csg transaction
		$bAdmin = false;			//	the admin of the CSG transaction owner's
									//		organization
		$bSystem = false;			//	keeps track of whether a system
									//		"user" was submitted
		$strAdminSent = "";			//	Set to a string messageif an email was
									//		sent to CSG Admin
		$strOwnerSent = "";			//	Set to a string message of an email was
									//		sent to the owner

		$oUserContainer = cUserContainer::GetInstance();
		$oSystemAccess = systemAccess::GetInstance();
		$oRights = rights::GetInstance();
		$oCSG_Request = csgTransaction::GetInstance();
		$oCSG_RequestStatus = csgTransactionStatusType::GetInstance();
		$oMail = new email();
		$oRights = rights::GetInstance();
		global $g_oUserSession;

		$ownerOrg = -1;				//	the organization of the transaction
		$ownerId = -1;				//	the owner of the transaction's id
		$userId = -1;				//	the user who is posting the new status

		/*
			The following table keeps track of the states one transaction may move to another
			The first column is the source status, the second column is the destination status
		*/
		$arStatusChange['user']['Pending']['UserLocked'] = true;
		$arStatusChange['user']['Pending']['Cancelled'] = true;
		$arStatusChange['user']['Clarify']['UserLocked'] = true;
		$arStatusChange['user']['Clarify']['Cancelled'] = true;
		$arStatusChange['user']['UserLocked']['UserLocked'] = true;
		$arStatusChange['user']['UserLocked']['Pending'] = true;
		$arStatusChange['user']['Completed']['Resend'] = true;
		$arStatusChange['user']['Cancelled']['Resend'] = true;
		$arStatusChange['user']['Resend']['Cancelled'] = true;
		$arStatusChange['user']['Open']['Pending'] = true;

		$arStatusChange['admin']['Open']['Pending'] = true;
		$arStatusChange['admin']['Pending']['Processing'] = true;
		$arStatusChange['admin']['Processing']['Pending'] = true;
		$arStatusChange['admin']['Processing']['Processing'] = true;
		$arStatusChange['admin']['Processing']['Cancelled'] = true;
		$arStatusChange['admin']['Processing']['Denied'] = true;
		$arStatusChange['admin']['Processing']['Completed'] = true;
		$arStatusChange['admin']['Processing']['Clarify'] = true;
		$arStatusChange['admin']['Resend']['Processing'] = true;

		if($user_info == 0)
		{
			$userId = 0;
		}
		else
		{
			$userId = GetUserID($user_info);
		}

		if($userId < 0)
		{
			$oLog->log($this->system_id, "Attempted to modify a CSG transaction", LOGGER_WARNING);
			return $this->results->Set('false', "Unknown user requested status change.");
		}

		$statusID = $oCSG_RequestStatus->GetID($strNewStatus);

		if($statusID < 0)
		{
			return $this->results->Set('false', "Invalid status type submitted.");
		}

		$arTransaction = $oCSG_Request->Get($transID);

		if(!isset($arTransaction))
		{
			return $this->results->Set('false', "Invalid transaction id requested.");
		}

		$ownerId = $arTransaction['user_ID'];			//	the user who owns the transaction

		$arStatus = $oCSG_RequestStatus->Get($statusID);

		if($arStatus[$this->field_Comment] == 1)
		{
			if(!strlen($strComment))
			{
				return $this->results->Set('false', "This status requires a comment. Please resubmit with one.");
			}
		}
		
		if(strlen($strComment))
		{
			if(!$this->ValidateComment($strComment))
			{
				return false;
			}
		}
		
		/*
			Make sure the person requesting the status change is the person who owns
			the transaction or is a csg admin for the transactions owners organization
			We have to do the checks seperately because a CSG administrator
			may send a transaction change to CSG for a transaction he owns.
		*/
		if($userId == 0)
		{
			$bSystem = true;
		}
		else if($userId == $ownerId)
		{
			/*
				If this is the user id, make sure they have the right assigned. If they do
				then they may modify the transaction in this capacity.
			*/
			$bOwner = $g_oUserSession->HasRight($oRights->CSG_Standard);
		}

		/*
			retrieve the organization of the person who posted the transaction
		*/
		$ownerOrg = $oUserContainer->GetOrganization($arTransaction['user_ID']);

		$bAdmin = $oSystemAccess->HasRight($userId, $oRights->CSG_Admin, $ownerOrg);

		if($bOwner == false)
		{
			if($bAdmin == false)
			{
				if($bSystem == false)
				{
					return $this->results->Set('false', "You do not have access to modify this transaction.");
				}
			}
		}

		/*
			Get the current status and make sure we can move to this new state
		*/

		$arCurrStatus = $this->GetCurrentStatus($transID);

		/*
			If there is a status we have to validate it.
			If there is no existing status we can move it to any valid status
		*/
		if(isset($arCurrStatus))
		{
			/*
				We'll use the human readable string because it's
				easier and less dependant upon the database unique identifer
			*/
			$strOldStatus = $arCurrStatus['status_Name'];

			/*
				Check to see if the owner may change his own transaction. If not,
				then see if the csg admin may change the status.
				bPass means the transaction change may pass.
				bPass set to false means the transaction may not pass through and
				be changed.
			*/
			$bPass = false;

			if($bSystem == true)
			{
				/*
					System message. Can modify the status
				*/
				$bPass = true;
			}

			if($bOwner == true)
			{
				if(isset($arStatusChange['user'][$strOldStatus][$strNewStatus]))
				{
					//	The user may change this transaction
					$bPass = true;
				}
			}

			if($bAdmin == true)
			{
				if(isset($arStatusChange['admin'][$strOldStatus][$strNewStatus]))
				{
					/*
						The admin may change this transaction.
						However, we need to do one more check.
						If the old and new status is processing, we
						need to make sure the status owner is the same
						both times. The reason for this is the admin's computer
						could crash or some other nasty situation. They will
						need to be able to come back and process the transaction
						without having to wait 30 minutes.
					*/
					if(strcasecmp($strOldStatus, $strNewStatus) == 0)
					{
						/*
							Both are processing. Make sure user is the same
						*/
						if($arCurrStatus['user_ID'] == $userId)
						{
							$bPass = true;
						}
					}
					else
					{
						$bPass = true;
					}
				}
			}

			if($bPass == false)
			{
				$strUser = $oUserContainer->GetName($arCurrStatus['user_ID']);
				$strTime = $arCurrStatus['status_Date'];
				$strComment = $arCurrStatus['status_Details'];

				$strMessage = "You may not change status to '$strNewStatus' from '$strOldStatus'.";
				$strMessage.= " '$strUser' submitted '$strOldStatus' at '$strTime'";

				if(strlen($strComment))
				{
					$strMessage.= " with the following comment '$strComment'.";
				}
				else
				{
					$strMessage.=".";
				}

				return $this->results->Set('false', $strMessage);
			}
		}

		/*
			build the record
		*/
		$arInsert = array();
		$arInsert['trans_ID'] = $transID;
		$arInsert['user_ID'] = $userId;
		$arInsert['status_ID'] = $statusID;
		$arInsert['status_Details'] = $strComment;

		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', "Unable to add '$strName' due to database error.");
		}

		$strEmailSubject = "Catena Authorization Request";
		$strEmailBody = "Status of request [$transID] was updated to [$strNewStatus]. Check out CSG History to view this request or CSG Queue to action it.";

		if($bSystem == false)
		{
			/*
				If the status type is set to true for emailing to the user then do so
				However, if the user id is the same as the owner we do not need
				to "resend" the message to the owner since we'll be sending
				the email via the email admin status change.
			*/
			if(!$bOwner)
			{
				if($this->EmailOwnerStatusChange($strNewStatus))
				{
					$strUser = $oUserContainer->GetName($ownerId);

					if($oMail->SendToUser($ownerId, $strEmailSubject, $strEmailBody) == 0)
					{
						$strOwnerSent = "Email sent to $strUser (request owner).";
					}
					else
					{
						$strOwnerSent = "Error sending to $strUser (request owner) : " . $oMail->results->GetMessage();
					}
				}
			}
			
			if($this->EmailAdminStatusChange($strNewStatus))
			{
				$retCode = $oMail->SendToRight($strEmailSubject, $strEmailBody, $oRights->CSG_Admin, $ownerOrg);
				
				if($retCode == 0)
				{
					$strAdminSent = "Email sent to CSG Admin.";
				}
				else
				{
					$strAdminSent = "Error sending to CSG Admin : " . $oMail->results->GetMessage();
				}	
			}
		}

		return $this->results->Set('true', "Request $transID updated with new status '$strNewStatus'. $strOwnerSent $strAdminSent");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function PurgeOldStatuses()
	{
		/*
			Only do this once a day
		*/
		$oSystemVars = systemVariables::GetInstance();
		
		$checkDate = $oSystemVars->GetValue("PurgeCSG");
		
		$today = date("Y-m-d");
		
		if(!($checkDate <  $today ))
		{
			//return;
		}

		$oSystemVars->Set("PurgeCSG", $today);
	
		$strSQL = "SELECT DISTINCT trans_ID FROM $this->table_Name WHERE (status_ID = 3 OR status_ID =7 OR status_ID = 1)";
		$arTransactions = $this->db->Select($strSQL);
		
		foreach($arTransactions as $arTransaction)
		{
			$arStatus = $this->GetCurrentStatus($arTransaction["trans_ID"]);
			
			$strSQL = "	DELETE FROM
							$this->table_Name
						WHERE
							trans_ID = ". $arTransaction["trans_ID"].
						"	AND
								(status_ID = 3 OR status_ID =7 OR status_ID=1 OR status_Details = 'Process time expired')
							AND
									(status_Date <= '". $arStatus["status_Date"]."')
							AND
								transstatus_ID <> ".$arStatus["transstatus_ID"];
			$count = $this->db->sql_delete($strSQL);
		}
	}
	/*
		This function returns true if the status is set to email the user when it's set
		param:
			$status
				The text name of the status
		return
			true
				the status requires emailing the user
			false
				the status does not require emailing the user
	*/
	function EmailOwnerStatusChange($status)
	{
		$statType = csgTransactionStatusType::GetInstance();

		$record = $statType->Get($status);

		if($record == null)
		{
			return false;
		}

		return $record['status_EmailOwner'];
	}
	/*
		This function returns true if the status is set to email the admin organization when it's set
		param:
			$status
				The text name of the status
		return
			true
				the status requires emailing the admin
			false
				the status does not require emailing the admin
	*/
	function EmailAdminStatusChange($status)
	{
		$statType = csgTransactionStatusType::GetInstance();

		$record = $statType->Get($status);

		if($record == null)
		{
			return false;
		}

		return $record['status_EmailAdmin'];
	}
	/*--------------------------------------------------------------------------
		-	description
				Retrive the current status of a transaction returns an array
				containing all of the information about a transactions status.
		-	params
				transId
					The transaction id we're getting the status on.
		-	return
	--------------------------------------------------------------------------*/
	function GetCurrentStatus($transId)
	{
		$strSQL = "	SELECT
							tblCSGTransactionStatus.transstatus_ID
						,	tblCSGTransactionStatusType.status_Name
						,	tblCSGTransactionStatus.status_Date
						,	tblCSGTransactionStatus.status_Details
						,	tblCSGTransactionStatus.user_ID
						,	tblCSGTransactionStatus.transstatus_ID
						,	tblCSGTransactionStatus.status_ID
						
					FROM
						 tblCSGTransactionStatus
						 LEFT JOIN
							tblCSGTransactionStatusType
							ON
								tblCSGTransactionStatus.status_ID = tblCSGTransactionStatusType.status_ID
					WHERE
						trans_ID = $transId ORDER BY transstatus_ID DESC LIMIT 1";
		
		$arStatus = $this->db->Select($strSQL);
		
		if($arStatus)
		{
			return $arStatus[0];
		}

		return null;
	}
	/*--------------------------------------------------------------------------
		-	description
				Retrive the current status of a transaction returns an array
				containing all of the information about a transactions status.
		-	params
				transId
					The transaction id we're getting the status on.
		-	return
	--------------------------------------------------------------------------*/
	function GetStatus($transId)
	{
	    $oUserContainer = cUserContainer::GetInstance();

		if($transId < 1)
		{
			return null;
		}
		$strSQL = "	SELECT
							tblCSGTransactionStatus.transstatus_ID
						,	tblCSGTransactionStatusType.status_Name
						,	tblCSGTransactionStatus.status_Date
						,	tblCSGTransactionStatus.status_Details
						,	tblCSGTransactionStatus.user_ID
					FROM
						 tblCSGTransactionStatus
						 LEFT JOIN
							tblCSGTransactionStatusType
							ON
								tblCSGTransactionStatus.status_ID = tblCSGTransactionStatusType.status_ID
					WHERE
						trans_ID = $transId ORDER BY transstatus_ID DESC";
	
		$arResults = $this->db->Select($strSQL);
		
		for($i = 0; $i < sizeof($arResults); $i++)
		{
			$arUser = $oUserContainer->Get($arResults[$i]['user_ID']);
			$arResults[$i]['user_Name'] = $arUser['user_Name'];
		}

		return $arResults;
	}
	/*--------------------------------------------------------------------------
		-	description
				Modifies an existing record
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function Modify($strModName, $strModDescription, $id)
	{
		global $g_oUserSession;

		if(!$g_oUserSession->HasRight($this->rights_Modify))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid id.");
		}

		/*
			Make sure the names are not invalid
		*/
		if(!$this->ValidateName($strModName, $id))
		{
			return $this->results->Set('false', "Invalid name.");
		}

		if(!$this->ValidateDescription($strModDescription))
		{
			return $this->results->Set('false', "Invalid description.");
		}

		/*
			build the record
			Update any record which has an id of $id
		*/
		$arUpdate = array();
		$arUpdate[$this->field_Name] = $strModName;
		$arUpdate[$this->field_Description] = $strModDescription;

		/*
			Now before we send this to the database for updating
			Let's check to see if they're duplicates
			If they are we'll return a true value so
			there's no error on the update
		*/
		$oldRecord = $this->db->select("SELECT * FROM $this->table_Name WHERE $this->field_Id = $id;");

		if($arUpdate[$this->field_Name] == $oldRecord[0][$this->field_Name])
		{
			if($arUpdate[$this->field_Description] == $oldRecord[0][$this->field_Description])
			{
				return $this->results->Set('true', "No update necessary. Description not changed.");
			}
		}

		$arWhere = array();
		$arWhere[$this->field_Id] = $id;
		if(!$this->db->update($this->table_Name, $arUpdate, $arWhere))
		{
			return $this->results->Set('false', "Unable to update '$strModName' due to database error.");
		}

		return $this->results->Set('true', "'$strModName' updated.");
	}
	/*--------------------------------------------------------------------------
		-	description
			Returns the singleton for this class
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function GetInstance()
	{
		static $obj;

		if(!isset($obj))
		{
			$obj = new csgTransactionStatus();
		}

		return $obj;
	}
}
?>