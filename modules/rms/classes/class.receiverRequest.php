<?php
/**
	\class receiverRequest
	
	\brief
		Provides interface to receiver database functionality.
		Manages receiver access/ transfers/assignments, etc.
		Adds, modifies, 
*/
	require_once('../../../classes/include.php');

class receiverRequest extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblReceiverRequest";
		$this->field_Id = "recReq_ID";
		$this->field_Name = "recReq_Number";
		$this->field_SmartCard = "recReq_Smartcard";
		$this->field_Hardware = "recReq_Hardware";
		$this->field_Owner = "user_ID";
				
		/*
			This portion loads all of the rights and their variable names
		*/
		$rights = rights::GetInstance();
		
		$this->rights_Remove = $rights->RMS_Admin;
		$this->rights_Add = $rights->RMS_Admin;
		$this->rights_Modify = $rights->RMS_Admin;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Creates a request to add a receiver to the inventory.
		\param receiver
				The receiver number to add. 12 digits
		\param smartCard
				The smart card to add. 12 digits
		\param hardware
				The hardware id to add. Should be 4 digits
		\return
			-	true
				succesfull
			-	false
				failure
	*/
	//--------------------------------------------------------------------------
	function Add($receiver, $smartCard, $hardware)
	{
		global $g_oUserSession;

		$oReceiverHardware = receiverHardware::GetInstance();
		$oReceiver = receiver::GetInstance();
		$db = rmsData::GetInstance();
		
		$hardware = strtoupper($hardware);
		
		if(!$oReceiver->ValidateReceiver($receiver))
		{
			return $this->results->Set('false', $oReceiver->results->GetMessage());
		}
		
		$existId = $this->GetID($receiver);
		
		if($existId > -1)
		{
			/*
				receiver already exists in the database
			*/
			return $this->results->Set('false', "Receiver exists in database and may not be added again. Use modify to change receiver details.");
		}
	
		/*
			Make sure the smart card is valid and it is not already
			in the database
		*/
		if(!$oReceiver->ValidateSmartCard($smartCard))
		{
			return $this->results->Set('false', $oReceiver->results->GetMessage());
		}
		
		$existId = $oReceiver->GetSmartCardID($smartCard);
		
		if($existId > -1)
		{
			return $this->results->Set('false', "Smart card exists in database and may not be added again. Use modify to change receiver details.");
		}
				
		if($oReceiverHardware->GetID($hardware, 4) < 0)
		{
			return $this->results->Set('false', $oReceiverHardware->results->GetMessage());
		}
		
		/*
			Build the record
		*/
		$arInsert = array();

		$arInsert[$this->field_Name] = array();
		$arInsert[$this->field_Name]['value'] = $receiver;
		$arInsert[$this->field_Name]['type'] = "string";
	
		$arInsert[$this->field_SmartCard] = array();
		$arInsert[$this->field_SmartCard]['value'] = $smartCard;
		$arInsert[$this->field_SmartCard]['type'] = "string";

		$arInsert[$this->field_Hardware] = $hardware;

		$arInsert['user_ID'] = $g_oUserSession->GetUserID();
			
		if(!$db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', 'Database error prevents adding receiver.');
		}

		/*
			Send an email to the admins telling them new receivers need to be added
			to the inventory
		*/
		$strSubject = "New Receivers";
		
		$strBody = "New receivers are pending addition to the inventory.";

		$oMailer = $mailer = new email();
		$oRights = rights::GetInstance();
		$oMailer->SendToRight($strSubject, $strBody, $oRights->RMS_Admin);

		return $this->results->Set('true', "Submitted receiver for inventory approval.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Actions a receiver pending addition to the inventory.
		\param requestId
				The pending receiver record
		\param status
				The new status.
					-	1	add the receiver to the inventory.
							Does so using the administrators organization
					-	0	Do not add the receiver to the inventory
		\return
			-	true
				succesfull
			-	false
				failure
		\note
			An email is sent via the admin's account stating the receiver
			was either added or rejected.
	*/
	//--------------------------------------------------------------------------
	function Action($requestId, $status)
	{
		global $g_oUserSession;
		
		$oReceiver = receiver::GetInstance();
		$db = rmsData::GetInstance();
		$oMailer = $mailer = new email();
		
		$strSubject = "New Receiver Request";
		$strStatusNotice = " Denied";
		$strMessage = "";

		if(!$g_oUserSession->HasRight($this->rights_Add))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		if(!$this->Exists($requestId))
		{
			/*
				receiver already exists in the database
			*/
			return $this->results->Set('false', "Request does not exist.");
		}
		
		/*
			Retrieve the record
		*/
		$arRecord = $this->Get($requestId);

		if($arRecord == null)
		{
			return $this->results->Set('false', "Request does not exist.");
		}
		
		if($status == "1")
		{
			/*
				User wants to add the receiver to the inventory
			*/
			$receiver = $arRecord[$this->field_Name];
			$smartCard = $arRecord[$this->field_SmartCard];
			$hardware = $arRecord[$this->field_Hardware];
						
			if($oReceiver->Add($receiver, $smartCard, $hardware))
			{
				$strStatusNotice = " Approved";
			}

			$strMessage = $oReceiver->results->GetMessage();
		}
		else if($status == "0")
		{
			/*
				User doesn't want to add the receiver to the inventory.
			*/
			$strMessage = "Receiver [". $arRecord[$this->field_Name] . "] was NOT added to the inventory.";
		}
		else
		{
			return $this->results->Set('false', "Invalid request status[$status]");
		}
		
		$strSubject = $strSubject. " " . $strStatusNotice. " - " . $arRecord[$this->field_Name];

		$oMailer->SendToUser($arRecord[$this->field_Owner], $strSubject, $strMessage);
		$this->Remove($requestId);
		
		return $this->results->Set('true', $strMessage);
	}
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new receiverRequest();
		}
		
		return $obj;
	}
}
?>