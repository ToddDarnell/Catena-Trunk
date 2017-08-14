<?php

/*
	This class keeps track of the transaction status types used by CSG transactions.
*/
require_once('../../../classes/include.php');
require_once('class.db.php');
require_once('class.dcrStatusType.php');


class dcrStatus extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		$this->table_Name = "tblDCRStatus";
		$this->field_Id = "dcrstatus_ID";
		$this->field_Comment = "dcrstatus_Comments";
		$this->field_Date = "dcrstatus_Date";

		$this->db = dmsData::GetInstance();
		
		//$this->systemId = 3;
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
		if(!eregi("^[a-z0-9 \.\',;:/\\\"!?@#$%_()-]{1,}$",  $strComment))
		{
			return $this->results->Set('false', "Insufficient or invalid characters in status comment.");
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
	function Add($reqId, $user_info, $strNewStatus, $strComment, $strWriter = -1, $role = -1, $strClarifyUser = -1)
	{
		$bOwner = false;			//	user owns the dcr
		$bAdmin = false;			//	the admin of the DCR's organization
		$bWriter = false;			//	the writer that processes the request
		$bSystem = false;			//	keeps track of system transitions

		$strAdminSent = "";			//	Set to a string messageif an email was sent to DMS Admin
		$strRequesterSent = "";			//	Set to a string message of an email was sent to the requester
		$strWriterSent = "";			//	Set to a string message of an email was sent to the writer or clarify user

		$oUserContainer = cUserContainer::GetInstance();
		$oSystemAccess = systemAccess::GetInstance();
		$oRights = rights::GetInstance();
		$oDCR = documentChangeRequest::GetInstance();
		$oDCRStatusType = dcrStatusType::GetInstance();
		$oMail = new email();

		global $g_oUserSession;
		
		$userName = "";
		
		$currentStatus = 1;
		$oldStatus = 0;
		
		$recipientId = -1;
		$rightId = -1;
		$ownerId = -1;				//	the owner of the request's id
		$userId = -1;				//	the user who is posting the new status
		$oldStatusID = -1;
		$writerId = -1;
		$dcrStatusId = -1;
		$clarifyUserId = -1;
		$reqType = -1;

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
			//$oLog->log($this->systemId, "Unknown user attempted to modify a DCR status", LOGGER_WARNING);
			return $this->results->Set('false', "Unknown user requested status change.");
		}

		$userName = $oUserContainer->GetName($userId);
		
		if(!strlen($userName))
		{
			return $this->results->Set('false', "User name is not set.");
		}
		
		$arRequest = $oDCR->Get($reqId);

		if(!isset($arRequest))
		{
			return $this->results->Set('false', "Invalid request id requested.");
		}

		$ownerId = $arRequest['user_ID'];				//	the user who owns the transaction

		/*
			Make sure the person requesting the status change is the person who owns
			the request or is a dms admin for the requests organization
			We have to do the checks seperately because a CSG administrator
			may send a transaction change to CSG for a transaction he owns.
		*/
		if($userId == 0)
		{
			$bSystem = true;
		}

		// SV -- if adding from Doug's TF page, assume userid is system
		if (isset($_POST['pmName'])) {
			$bSystem = true;
		}

		else if($userId == $ownerId)
		{
			/*
				If this is the user id, make sure they have the right assigned. If they do
				then they may modify the transaction in this capacity.
			*/
			$bOwner = $g_oUserSession->HasRight($oRights->DMS_Standard);
		}
		
		$statusId = $oDCRStatusType->GetID($strNewStatus);

		if($statusId < 0)
		{
			return $this->results->Set('false', "Invalid status type submitted.");
		}

		/*
			retrieve the dcr organization
		*/
		$dcrOrg = $oDCR->GetOrgID($reqId);

		$bAdmin = $oSystemAccess->HasRight($userId, $oRights->DMS_Admin, $dcrOrg);
		$bWriter = $oSystemAccess->HasRight($userId, $oRights->DMS_Writer, $dcrOrg);
				
		if($bOwner == false)
		{
			if($bAdmin == false)
			{
				if($bWriter == false)
				{
					if($bSystem == false)
					{
						return $this->results->Set('false', "You do not have access to modify to this request status.");
					}
				}
			}
		}
		
		if($role > 0)
		{
			$rightId = GetRightID($role);
	
			if($rightId < 0)
			{
				return $this->results->Set('false', "Invalid right ID submitted.");
			}
		}				

		$adminRightId = GetRightID("DMS_Admin");
		$writerRightId = GetRightID("DMS_Writer");
		$requesterRightId = GetRightID("DMS_Standard");

		/* 
			Check if status is Assigned or Peer Review and DMS_Admin is changing the status,
			then the strWriter must be set. Otherwise, if the DMS_Writer is changing the status back
			Assigned, then the strWriter is set to the DMS_Writer
		*/
		if($statusId == 3 || $statusId == 4)
		{
			if($rightId == $adminRightId)
			{
				if(!strlen($strWriter))
				{
					return $this->results->Set('false', "This status requires a writer to be assigned.");
				}	
						
				$writerId = GetUserID($strWriter);
				
				if(!$oSystemAccess->HasRight($writerId, $oRights->DMS_Writer, $dcrOrg))
				{
					return $this->results->Set('false', "This user does not have the DMS Writer right.");
				}
				
				if($writerId < 0)
				{
					return $this->results->Set('false', "Unknown writer assigned to the DCR.");
				}
			}
			
			else if($rightId == $writerRightId)
			{
				$writerId = $userId;
			}
		}
		
		if($statusId == 15 || $statusId == 16)
		{
			if(!strlen($strClarifyUser))
			{
				return $this->results->Set('false', "This status requires a selected user.");
			}	

			if(strlen($strClarifyUser))
			{
				$clarifyUserId = GetUserID($strClarifyUser);
	
				if($clarifyUserId < 0)
				{
					return $this->results->Set('false', "Invalid user ID submitted.");
				}
			}	
		}
		
		$arStatus = $oDCRStatusType->Get($statusId);

		if($arStatus['status_Comments'] == 1)
		{
			if(!strlen($strComment))
			{
				return $this->results->Set('false', "This status requires a comment.");
			}
		}
		
		if(strlen($strComment))
		{
			$strComment = CleanupSmartQuotes($strComment);
			$strComment = trim($strComment);

			if(!$this->ValidateComment($strComment))
			{
				return false;
			}
		}
		
		/*
			Get the current status and make sure we can move to this new state
		*/
		$arCurrStatus = $this->GetCurrentStatus($reqId);

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
		}

		$oldStatusID = $this->GetCurrentStatusID($reqId);
		
		if($oldStatusID > 0)
		{
			$arUpdate = array();
			$arUpdate['dcrstatus_Current'] = $oldStatus;
	
			$arWhere = array();
			$arWhere[$this->field_Id] = $oldStatusID;
		
			if(!$this->db->update($this->table_Name, $arUpdate, $arWhere))
			{
				return $this->results->Set('false', "Unable to update last status ID due to database error.");
			}
		}

		/*
			build the record
		*/
		$dcrStatusId = $this->InsertStatus($statusId, $reqId, $userId, $strComment, $currentStatus);

		if($dcrStatusId < 0)
		{
			return $this->results->Set('false', $this->results->GetMessage());
		}

		/*
			If the status has been changed Review (Rejected), then the system will change
			the status to Pending.
		*/
		if($statusId == 18)
		{
			$arUpdate = array();
			$arUpdate['dcrstatus_Current'] = $oldStatus;
	
			$arWhere = array();
			$arWhere[$this->field_Id] = $dcrStatusId;
		
			if(!$this->db->update($this->table_Name, $arUpdate, $arWhere))
			{
				return $this->results->Set('false', "Unable to update last status ID due to database error.");
			}
			
			/*
				Changing userId to 0 since it's a system insert and inserting 'Pending'
				for the status (status_Id = 1)
			*/
			$userId = 0;
			$statusId = 1;
			
			$dcrStatusId = $this->InsertStatus($statusId, $reqId, $userId, $strComment, $currentStatus);
	
			if($dcrStatusId < 0)
			{
				return $this->results->Set('false', $this->results->GetMessage());
			}
		}
		
		if($writerId > 0)
		{
			$currentWriter = $this->GetCurrentWriter($oldStatusID);

			if($currentWriter > 0)
			{
				$arUpdate = array();
				$arUpdate['assign_Current'] = $oldStatus;
		
				$arWhere = array();
				$arWhere[$this->field_Id] = $oldStatusID;
			
				if(!$this->db->update('tblDCRAssign', $arUpdate, $arWhere))
				{
					return $this->results->Set('false', "Unable to update the last assigned ID due to database error.[$currentWriter]");
				}
			}
			
			if(!$this->InsertAssigned($dcrStatusId, $writerId, $userId))
			{
				return $this->results->Set('false', $this->results->GetMessage());
			}
		}
		
		if($clarifyUserId > 0)
		{
			$currentWriter = $this->GetCurrentWriter($oldStatusID);

			if($currentWriter > 0)
			{
				$arUpdate = array();
				$arUpdate['assign_Current'] = $oldStatus;
		
				$arWhere = array();
				$arWhere[$this->field_Id] = $oldStatusID;
			
				if(!$this->db->update('tblDCRAssign', $arUpdate, $arWhere))
				{
					return $this->results->Set('false', "Unable to update the last assigned ID due to database error.");
				}
			}
			
			if(!$this->InsertAssigned($dcrStatusId, $clarifyUserId, $userId))
			{
				return $this->results->Set('false', $this->results->GetMessage());
			}
		}

		$reqType = $arRequest['request_Type'];
		
		if($reqType == 0)
		{
			$arDocTitle = $oDCR->GetDCRDocInfo($reqId);
			$docTitle = $arDocTitle[0]["doc_Title"];
		}
	
		if($reqType == 1)
		{
			$arDocTitle = $oDCR->GetTPUDocInfo($reqId);
			$docTitle = $arDocTitle[0]["dcrTaskFlag_ProcName"];
		}

		if($reqType == 2)
		{
			$arDocTitle = $oDCR->GetDCRNewTitle($reqId);
			$docTitle = $arDocTitle[0]["dcrNew_Title"];
		}

		if($strComment != "Initial State")
		{
			if($reqType > -1)
			{
				$strEmailBody = "<b>Document Title:</b> $docTitle<br><br>";
			}
			
			$strEmailSubject = "DCR Status Change";
			$strEmailBody.= "Status of request [$reqId] was updated to [$strNewStatus] by '$userName'.";
	
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
					if($statusId != 1)
					{
						if($this->EmailRequesterStatusChange($strNewStatus))
						{
							$strOwner = $oUserContainer->GetName($ownerId);
							
							if($oMail->SendToUser($strOwner, $strEmailSubject, $strEmailBody) == 0)
							{
								$strRequesterSent = "Email sent to $strOwner (requester).";
							}
							else
							{
								$strRequesterSent = "Error sending to $strUser (requester) : " . $oMail->results->GetMessage();
							}
						}
					}
				}
				
				if($this->EmailAdminStatusChange($strNewStatus))
				{
					$retCode = $oMail->SendToRight($strEmailSubject, $strEmailBody, $oRights->DMS_Admin, $dcrOrg);
					
					if($retCode == 0)
					{
						$strAdminSent = "Email sent to DMS Admin.";
					}
					else
					{
						$strAdminSent = "Error sending to DMS Admin : " . $oMail->results->GetMessage();
					}	
				}
			
				if($this->EmailWriterStatusChange($strNewStatus))
				{
					if($statusId == 3 || $statusId == 4)
					{
						$strEmailBody.= "<br><br>Request assigned to '$strWriter'.";
						$recipientId = $writerId;
					}
					
					if($statusId == 15)
					{
						$strEmailBody.= "<br><br>Request sent to '$strClarifyUser' for clarification.";
						$recipientId = $clarifyUserId;
					}
					
					if($statusId == 16)
					{
						$strEmailBody.= "<br><br>Request sent to '$strClarifyUser' for review and approval.";
						$recipientId = $clarifyUserId;
					}

					if($recipientId > 0)
					{
						$retCode = $oMail->SendToUser($recipientId, $strEmailSubject, $strEmailBody);
					}
					
					if($retCode == 0)
					{
						if($statusId == 3 || $statusId == 4)
						{
							$strWriterSent = "Email sent to DMS Writer.";
						}
						
						if($statusId == 15 || $statusId == 16)
						{
							$strWriterSent = "Email sent to '$strClarifyUser'.";
						}
					}
					else
					{
						$strWriterSent = "Error sending email: " . $oMail->results->GetMessage();
					}	
				}
			}
		}

		return $this->results->Set('true', "Request [$reqId] updated with new status '$strNewStatus'. $strRequesterSent $strAdminSent $strWriterSent");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function InsertStatus($statusId, $reqId, $userId, $strComment, $currentStatus)
	{
		$arInsert = array();
		$arInsert['status_ID'] = $statusId;
		$arInsert['request_ID'] = $reqId;
		$arInsert['user_ID'] = $userId;
		$arInsert['dcrstatus_Comments'] = $strComment;
		$arInsert['dcrstatus_Current'] = $currentStatus;

		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			$this->results->Set('false', "Unable to add new status for request '$reqId' due to database error.");
			return -1;	
		}
		
		$strSQL = "	SELECT 
						LAST_INSERT_ID() AS $this->field_Id";

		$arRecord = $this->db->Select($strSQL);
		
		$dcrStatusId = $arRecord[0][$this->field_Id];

		return $dcrStatusId;
	}
	
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function InsertAssigned($dcrStatusId, $assignId, $userId)
	{
		$currentStatus = 1;

		$arInsert = array();
		$arInsert['dcrstatus_ID'] = $dcrStatusId;
		$arInsert['assign_WriterID'] = $assignId;
		$arInsert['assign_AdminID'] = $userId;
		$arInsert['assign_Current'] = $currentStatus;

		if(!$this->db->insert('tblDCRAssign', $arInsert))
		{
			$this->results->Set('false', "Unable to add assigned writer due to database error.");
			return false;	
		}
		
		$this->results->Set('true', "Assigned writer inserted properly.");
		return true;
	}
	
	/*--------------------------------------------------------------------------
		Sends an email to users informing them when	they have DCRs that 
		are still either in Review (Pending) or Clarify after 7 days from the
		status update date. Also auto updates the Peer Review status to Peer 
		Review (Comments) with an auto comment after 48 hours.
	----------------------------------------------------------------------------*/
	function DCRStatusUpdate()
	{
		$oOrganization = organization::GetInstance();
		$oRights = rights::GetInstance();
		$oUser = cUserContainer::GetInstance();
		$oSystemAccess = systemAccess::GetInstance();
		$oSystemVars = systemVariables::GetInstance();
		$oUser = cUserContainer::getInstance();
		
	    $oMailUser = new email();
		$oMailAdmin = new email();
	
	    $arUserSent = array();			//	Keeps track of when we've sent an email to user the first time
	    $arUserCount = array();			//	The list of users who have unread messages
		$arAdminOrgs = array();
		
		$statusId = -1;
		
		$strUserEmailSubject = "You have DCRs to view";
		
		$strUserEmailBody = "You have DCRs that are more than seven days old.
								Please go to the DCR Queue to view your DCRs.";
	
		/*--------------------------------------------------------------------------
			The first thing we want to do is determine if we've already performed
			this check today.
		----------------------------------------------------------------------------*/
		$checkDate = $oSystemVars->GetValue("DCRStatusUpdate");
		$today = date("Y-m-d");
	
		if(!($checkDate <  $today ))
		{
			return;
		}
		
		/*--------------------------------------------------------------------------
			The day is before today, update the record
		----------------------------------------------------------------------------*/
		/*$oSystemVars->Set("DCRStatusUpdate", $today);
		$timer = new cTimer();
		
		$timer->start();*/
		
		$strSQL = "	SELECT
						*
					FROM
						 tblDCRStatus
					WHERE
						dcrstatus_Current = 1 AND(status_ID = 4 OR status_ID = 16)";
		
		$arStatuses = $this->db->Select($strSQL);

		if(sizeof($arStatuses) < 1)
		{
			return;
		}
		
		foreach($arStatuses as $status)
		{
			$statusId = $status['status_ID'];
			
			if($statusId == 4)
			{
				$statusDate = $status['dcrstatus_Date'];
				$expDate = date($statusDate, strtotime('+2 day'));
				echo($statusDate);
				echo(" ");
				die($expDate);
						
				/* 	if date is over 48 hours, change status to Peer Review (Comments) and 
					add system comment: 'No comment submitted. System update after 48 hours.' 
				*/
			}
			
			if($statusId == 16)
			{
				/* 	if date is over 7 days, send an email to the requester.
				*/
			}
		}

        /*$strWhere.= ") 
        AND CURDATE() >= ADDDATE(tblMessage.msg_create_date, INTERVAL 7 DAY)";
		

			
		$oMailAdmin->SystemToUser($strAdminName, $strSubject, $strBody);	
		*/
	
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
	function EmailRequesterStatusChange($status)
	{
		$statType = dcrStatusType::GetInstance();

		$record = $statType->Get($status);

		if($record == null)
		{
			return false;
		}

		return $record['status_EmailRequester'];
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
		$statType = dcrStatusType::GetInstance();

		$record = $statType->Get($status);

		if($record == null)
		{
			return false;
		}

		return $record['status_EmailAdmin'];
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
	function EmailWriterStatusChange($status)
	{
		$statType = dcrStatusType::GetInstance();

		$record = $statType->Get($status);

		if($record == null)
		{
			return false;
		}

		return $record['status_EmailWriter'];
	}
	/*--------------------------------------------------------------------------
		-	description
				Retrive the current status of a request returns an array
				containing all of the information about a request status.
		-	params
				reqId
					The request id we're getting the status on.
		-	return
	--------------------------------------------------------------------------*/
	function GetCurrentStatus($reqId)
	{
		$strSQL = "	SELECT
							tblDCRStatus.dcrstatus_ID
						,	tblDCRStatusType.status_Name
						,	tblDCRStatus.dcrstatus_Date
						,	tblDCRStatus.dcrstatus_Comments
						,	tblDCRStatus.user_ID
					FROM
						 tblDCRStatus
						 LEFT JOIN
							tblDCRStatusType
							ON
								tblDCRStatus.status_ID = tblDCRStatusType.status_ID
					WHERE
						request_ID = $reqId ORDER BY dcrstatus_ID DESC LIMIT 1";
		
		$arStatus = $this->db->Select($strSQL);

		if($arStatus)
		{
			return $arStatus[0];
		}

		return null;
	}
	/*--------------------------------------------------------------------------
		-	description
				Retrive the current status of a request returns an array
				containing all of the information about a request status.
		-	params
				reqId
					The request id we're getting the status on.
		-	return
	--------------------------------------------------------------------------*/
	function GetCurrentStatusID($reqId)
	{
		$strSQL = "	SELECT
						dcrstatus_ID
					FROM
						 tblDCRStatus
					WHERE
						request_ID = $reqId ORDER BY dcrstatus_ID DESC LIMIT 1";
		
		$record = $this->db->Select($strSQL);

		if(sizeof($record) == 1)
		{
			return $record[0]['dcrstatus_ID'];
		}

		return -1;
	}
	/*--------------------------------------------------------------------------
		-	description
				Retrive the current writer of a request returns an array
				containing the current writer of the request.
		-	params
				dcrStatusId
					The dcr Status id we're checking the writer.
		-	return
	--------------------------------------------------------------------------*/
	function GetCurrentWriter($dcrStatusId)
	{
		$strSQL = "	SELECT
						assign_WriterID

					FROM
						 tblDCRAssign

					WHERE
						dcrstatus_ID = $dcrStatusId AND assign_Current = 1";
		
		$record = $this->db->Select($strSQL);

		if(sizeof($record) == 1)
		{
			return $record[0]['assign_WriterID'];
		}

		return -1;
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
	function GetStatus($reqId)
	{
	    $oUserContainer = cUserContainer::GetInstance();

		if($reqId < 1)
		{
			return null;
		}
		$strSQL = "	SELECT
							tblDCRStatus.dcrstatus_ID
						,	tblDCRStatusType.status_Name
						,	tblDCRStatus.dcrstatus_Date
						,	tblDCRStatus.dcrstatus_Comments
						,	tblDCRStatus.user_ID
						,   tblDCRAssign.assign_WriterID
					FROM
						 tblDCRStatus
						 LEFT JOIN
							tblDCRStatusType ON tblDCRStatus.status_ID = tblDCRStatusType.status_ID
							 LEFT JOIN
								tblDCRAssign ON tblDCRStatus.dcrstatus_ID = tblDCRAssign.dcrstatus_ID
					WHERE
						request_ID = $reqId ORDER BY dcrstatus_ID DESC";
	
		$arResults = $this->db->Select($strSQL);
		
		for($i = 0; $i < sizeof($arResults); $i++)
		{
			$arUser = $oUserContainer->Get($arResults[$i]['user_ID']);
			$arResults[$i]['user_Name'] = $arUser['user_Name'];

			$arAssignedUser = $oUserContainer->Get($arResults[$i]['assign_WriterID']);
			$arResults[$i]['assigned_User'] = $arAssignedUser['user_Name'];
		}

		return $arResults;
	}
	/*--------------------------------------------------------------------------
		-	description
				Modifies an existing record
		-	params
		-	return
	--------------------------------------------------------------------------*/
	function Modify($strModName, $strComment, $id)
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
		$strModName = CleanupSmartQuotes($strModName);
		$strModName = trim($strModName);

		$strComment = CleanupSmartQuotes($strComment);
		$strComment = trim($strComment);
		
		if(!$this->ValidateName($strModName, $id))
		{
			return $this->results->Set('false', "Invalid name.");
		}

		if(!$this->ValidateComment($strComment))
		{
			return $this->results->Set('false', "Invalid description.");
		}

		/*
			build the record
			Update any record which has an id of $id
		*/
		$arUpdate = array();
		$arUpdate[$this->field_Name] = $strModName;
		$arUpdate[$this->field_Comment] = $strComment;

		/*
			Now before we send this to the database for updating
			Let's check to see if they're duplicates
			If they are we'll return a true value so
			there's no error on the update
		*/
		$oldRecord = $this->db->select("SELECT * FROM $this->table_Name WHERE $this->field_Id = $id;");

		if($arUpdate[$this->field_Name] == $oldRecord[0][$this->field_Name])
		{
			if($arUpdate[$this->field_Comment] == $oldRecord[0][$this->field_Comment])
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
			$obj = new dcrStatus();
		}

		return $obj;
	}
}
?>