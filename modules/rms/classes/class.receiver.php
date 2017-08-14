<?php
/**
	\class receiver
	
	\brief
		Provides interface to receiver database functionality.
		Manages receiver access/ transfers/assignments, etc.
*/
	require_once('../../../classes/include.php');
	require_once("class.receiverStatus.php");

class receiver extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblReceiver";
		$this->field_Id = "rec_ID";
		
		$this->field_Name = "rec_Number";
		$this->field_SmartCard = "rec_SmartCard";
		$this->field_Organization = "org_ID";
		$this->field_Owner = "user_ID";
				
		/*
			This portion loads all of the rights and their variable names
		*/
		$rights = rights::GetInstance();
		
		$this->rights_Remove = $rights->RMS_Admin;
		$this->rights_Add = $rights->RMS_Admin;
		$this->rights_Modify = $rights->RMS_Admin;
				
		$this->db = rmsData::GetInstance();
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Transfer transfers a receiver from one organization to another.
		\param receiverId
				a number representing the receiver id to transfer to
				a new organization
		\param strOrganization
				a string name representing the new organization to transfer
				this receiver to
		\return
			-	true
					transfer was successful
			-	false
					transfer was not successful
	*/
	//--------------------------------------------------------------------------
	function Transfer($receiverId, $strOrganization)
	{
		if(!is_numeric($id))
		{
			return $this->results->Set('false', "Invalid receiver.");
		}
	
		if($id < 0)
		{
			return $this->results->Set('false', "Invalid receiver.");
		}
	
		$orgId = Org_GetID($strOrg);
	
		if($orgId < 1)
		{
			return $this->results->Set('false', "Invalid receiver.");
		}
		
		return $this->results->Set('true', "Transferred receiver (NOT SET UP YET).");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			This function adds a receiver to the database
		\param receiver
				The 12 digit receiver number
		\param smartCard
				The 12 digit smart card number
		\param hardware
				The 4 digit hardware characters
		\param org_info
				The organization to assign this receiver to.
		\return
			-	true
				succesfully added receiver
			-	false
				failure
	*/
	//--------------------------------------------------------------------------
	function Add($receiver, $smartCard, $hardware, $org_info)
	{
		global $g_oUserSession;

		$oReceiverHardware = receiverHardware::GetInstance();
		$oOrganization = organization::GetInstance();
		$oReceiverStatus = receiverStatus::GetInstance();
		$statusId = $oReceiverStatus->GetId("Active");
		
		$hardware = strtoupper($hardware);

		if(!$g_oUserSession->HasRight($this->rights_Add, $org_info))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		if(!$this->ValidateReceiver($receiver))
		{
			return false;
		}
		
		$existId = $this->GetID($receiver);
		
		if($existId > -1)
		{
			return $this->results->Set('false', "[$receiver] exists in database and may not be added again. Use modify to change receiver details.");
		}
	
		/*
			Make sure the smart card is valid and it is not already
			in the database
		*/
		
		if(!$this->ValidateSmartCard($smartCard))
		{
			return false;
		}
		
		$existId = $this->GetSmartCardID($smartCard);
		
		if($existId > -1)
		{
			return $this->results->Set('false', "Smart card exists in database and may not be added again. Use modify to change receiver details.");
		}
				
		if($oReceiverHardware->GetID($hardware, 4) < 0)
		{
			return $this->results->Set('false', $oReceiverHardware->results->GetMessage());
		}

		/*
			Assign the receiver to the adders' organization.
			Assign the user as the adder of the receiver.
		*/
		$model = $oReceiverHardware->GetFromHardware($hardware);
		
		if(strlen($model) < 1)
		{
			return $this->results->Set('false', $oReceiverHardware->results->GetMessage());
		}
		
		$orgId = GetOrgId($org_info);
		
		if($orgId < 0)
		{
			return $this->results->Set('false', "Invalid organization.");
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

		$arInsert['rec_Hardware'] = $hardware;
		
		$arInsert['org_ID'] = $orgId;
		$arInsert['recStatus_ID'] = $statusId;
		$arInsert['rec_AuditDate'] = date('Y-m-d');
		$arInsert['rec_Auditor'] = $g_oUserSession->GetUserID();
			
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', 'Database error prevents adding receiver.');
		}
			
		/*
			Now we have to add the control number, which is based off of the
			database record id and the model.
		*/
			
		$receiverID = $this->GetId($receiver);
		
		$controlId = $this->MakeControlId($model, $receiverID);
		
		$updateArray = array();
		
		$updateArray['rec_Control_Num'] = $controlId;
	
		$updateFilter = array();
		$updateFilter['rec_ID'] = $receiverID;
	
		if(!$this->db->update($this->table_Name, $updateArray, $updateFilter))
		{	
			return $this->results->Set('false', "Unable to update receiver control number.");
		}
		
		$strOrg = $oOrganization->GetName($orgId);
				
		return $this->results->Set('true', "Receiver control id [$controlId] added to $strOrg inventory.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Retrieves the organization id of the passed in receiver info
		\param receiver_info
				The receiver id or 12 digit number
		\return
			-	-1	receiver organization not found.
					Should only happen if an invalid receiver is submitted
			-	1+	The id of the owning organization
	*/
	//--------------------------------------------------------------------------
	function GetOrganization($receiver_info)
	{
		/*
			Since a receiver has only digits in it
			we can't check if its numeric or text
			so we look for the length of the info passed
			in. If it's twelve digits we have a receiver
			number. If it's less, we assume an id
		*/
		$receiverRecord = $this->Get($receiver_info);
		
		if($receiverRecord != null)
		{
			return $receiverRecord[$this->field_Organization];
		}
		return -1;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Update receiver values.
		\param id
		\param receiver
		\param smartCard
		\param hardware
		\param status
		\param org_info
			The new organization name
		\return
			-	true
				succesfully added receiver
			-	false
				failure
	*/
	//--------------------------------------------------------------------------
	function Modify($id, $receiver, $smartCard, $hardware, $status, $org_info)
	{
		
		global $g_oUserSession;

		$oReceiverModel = receiverModel::GetInstance();
		$oReceiverHardware = receiverHardware::GetInstance();
		$oOrganization = organization::GetInstance();
		$oReceiverStatus = receiverStatus::GetInstance();
		$hardware = strtoupper($hardware);
		
		/*
			-	make sure the user has the appropriate right
				to modify values for this receiver in this
				organization
			-	make sure the receiver exists
			-	make sure the receiver numbers are valid
			-	make sure the smart card numbers are valid	
		*/

		if(!$g_oUserSession->HasRight($this->rights_Modify, $this->GetOrganization($id)))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		if(!$g_oUserSession->HasRight($this->rights_Modify, GetOrgID($org_info)))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		if(!is_numeric($id))
		{
			return $this->results->Set('false', "Invalid receiver selected. Provide a valid receiver id.");
		}
		
		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "May not modify a receiver which does not exist.");
		}

		/*
			Make sure the receiver number passed in is valid. We're about to use the number in a check
			so we want it to be correct.
		*/	
		
		if(!$this->ValidateReceiver($receiver))
		{
			return false;
		}


		/*
			Make sure we do not have a receiver id which
			is using the new receiver numbers which is
			not the receiver we're about to modify
		*/
		
		$existId = $this->GetID($receiver, $id);
		
		if($existId > -1)
		{
			/*
				receiver already exists in the database
			*/
			return $this->results->Set('false', "Receiver[$existId] already exists in database. Receiver number may not be changed to a receiver which already exists in the system.");
		}
	
	
		/*
			Make sure the smart card is valid and it is not already
			in the database
		*/
		if(!$this->ValidateSmartCard($smartCard))
		{
			return false;
		}
		$existId = $this->GetSmartCardID($smartCard, $id);
		
		if($existId > -1)
		{
			return $this->results->Set('false', "Smart card already exists in database.");
		}
				
		if($oReceiverHardware->GetID($hardware, 4) < 0)
		{
			return $this->results->Set('false', $oReceiverHardware->results->GetMessage());
		}
		
		$statusId = $oReceiverStatus->GetId($status);
		
		if($statusId < 0)
		{
			return $this->results->Set('false', "Invalid status submited. Submit a valid receiver status to modify this receiver.");
		}
		
		$orgId = GetOrgID($org_info);
		
		if($orgId < 0)
		{
			return $this->results->Set('false', "Invalid organization submited. Submit a valid organization to modify this receiver.");
		}

		/*
			Build the record
		*/
		$arUpdate = array();

		$arUpdate[$this->field_Name] = array();
		$arUpdate[$this->field_Name]['value'] = $receiver;
		$arUpdate[$this->field_Name]['type'] = "string";
	
		$arUpdate[$this->field_SmartCard] = array();
		$arUpdate[$this->field_SmartCard]['value'] = $smartCard;
		$arUpdate[$this->field_SmartCard]['type'] = "string";

		$arUpdate['rec_Hardware'] = $hardware;
		$arUpdate['recStatus_ID'] = $statusId;
		$arUpdate['org_ID'] = $orgId;
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $id;	
		$retCode = $this->db->update($this->table_Name, $arUpdate, $arWhere);
		
		switch($retCode)
		{
			case 0:
				return $this->results->Set('true', "No changes made to receiver \"$receiver\".");
				break;
			case 1:
				return $this->results->Set('true', "Your changes have been applied to receiver \"$receiver\".");
				break;
			case -1:
				return $this->results->Set('false', $this->db->results->GetMessage());
				break;
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Sets the owner of a receiver
		\param receiverId
				The id of the receiver. Different than the 10-12 digit number.
		\param newOwnerId
				Who should take ownership of the receiver
		\return
			-	true
				The receiver was removed from the owner
			-	false
				The receiver was not removed from the owner for some reason.
		\note
			Currently may only be removed by the receiver owner. Next
			step will be to allow admins to remove the receiver from
			user's within their assigned organizations.
	*/
	//--------------------------------------------------------------------------
	function SetOwner($receiverId, $newOwnerId = -1)
	{
		global $g_oUserSession;

		$oUser = cUserContainer::GetInstance();
		$oOrganization = organization::GetInstance();
		$oSystemAccess = systemAccess::GetInstance();
		$oRights = rights::GetInstance();

		$userId = $g_oUserSession->GetUserID();
		
		$arReceiver = $this->Get($receiverId);
		
		if(!isset($arReceiver))
		{
			return $this->results->Set('false', "Invalid receiver selected. Provide a valid receiver id.");
		}

		$receiverId = $arReceiver[$this->field_Id];
		$receiverOrg = $arReceiver[$this->field_Organization];
		$ownerId = $arReceiver[$this->field_Owner];
		
		/*
			There are a lot of chases which may allow or deny a user chaning ownership
			of a receiver.
			
			If the user is trying to remove the owner they must be one of the following:
				The owner of the receiver.
				An admin for the owning organization.

			If the user is trying to set a new owner for the organization
				they must meet the following criteria:
				
				They must exist.
				They must not be the same as the current owner
				They must have the standard right for this organization OR
				
				
		*/
		
		if($newOwnerId == -1)
		{
			/*
				-	User's in the organization may remove ownership of
				receivers they have assigned.
				-	Admin user's may remove ownership of receivers in thier
				organization.
			*/
			
			if($userId != $ownerId)
			{
				if(!$oSystemAccess->HasRight($userId, $oRights->RMS_Admin, $receiverOrg))
				{
					return $this->results->Set('false', "You may not remove ownership of a receiver in this organization.");
				}
			}
		}
		else
		{
			if(!$oUser->Exists($newOwnerId))
			{
				return $this->results->Set('false', "Invalid new user selected.");
			}
						
			if($ownerId == $newOwnerId)
			{
				return $this->results->Set('true', "No changes made.");
			}
			
			if($userId == $newOwnerId)
			{
				/*
					This user wants to take ownership of a receiver
				*/
				if(!$oSystemAccess->HasRight($userId, $oRights->RMS_Standard, $receiverOrg))
				{
					if(!$oSystemAccess->HasRight($userId, $oRights->RMS_Admin, $receiverOrg))
					{
						return $this->results->Set('false', $oUser->results->GetMessage());
					}
				}
			}
			else
			{
				/*
					Since the destination user is not the same as the user
					initiating the assignment, the user must be an admin.
					We don't care about the destination owner at this point.
				*/
				if(!$oSystemAccess->HasRight($userId, $oRights->RMS_Admin, $receiverOrg))
				{
					return $this->results->Set('false', $oUser->results->GetMessage());
				}
			}
		}

		$arUpdate = array();

		$arUpdate[$this->field_Owner] = $newOwnerId;
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $receiverId;	
		
		$retCode = $this->db->update($this->table_Name, $arUpdate, $arWhere);
		
		switch($retCode)
		{
			case 0:
				return $this->results->Set('true', "No changes made to receiver owner.[$receiverId]");
			case 1:
				return $this->results->Set('true', "Your changes have been applied to the receiver.");
			case -1:
				return $this->results->Set('false', $this->db->results->GetMessage());
			default:
				return $this->results->Set('false', $this->db->results->GetMessage());
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Make the 10 digit control id
		\param strModel
			The receiver model. A three digit code at the beginning of the
			control number
		\param receiverId
				The receiver database id.
		\return
			A ten digit number representing a control number
	*/
	//--------------------------------------------------------------------------
	function MakeControlId($strModel, $receiverId)
	{
		$oReceiverModel = receiverModel::GetInstance();
		
		$modelCode = $oReceiverModel->GetCode($strModel);
		$controlId = 1000000 + $receiverId;

		/*
			put the model identifier first in the string then the id	
			This should make a 10 digit number in the form
			XXX equals the model code
			OOOOOOO the unique receiver number
			XXXOOOOOOO
		*/
		$strControl = "$modelCode$controlId";
		
		return $strControl;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Validate a smart card
			-	Makes sure the smartcard text is the correct length
			-	matches the crc check
			-	is not on the restricted list
		\param smartCard
				12 digit smart card number
		\return
			-	true	The number is valid
			-	false	The number is not valid
	*/
	//--------------------------------------------------------------------------
	function ValidateSmartCard($smartCard)
	{
		if(!$this->ValidateCRC($smartCard))
		{
			return $this->results->Set('false', "Smart card field " . $this->results->GetMessage());
		}
		
		if($this->IsRestricted($smartCard, 0))
		{
			return $this->results->Set('false', "Smart card is on the restricted list and may not be used in the inventory.");
		}
		
		return $this->results->Set('true', "Smart card is valid.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Validates the following items:
				-	The receiver text is the correct length
				-	receiver numbers match the crc check
				-	receiver is not on the restricted list
		\param receiver
				The 12 digit receiver number to validate
		\return
			-	true	The number is valid
			-	false	The number is not valid
	*/
	//--------------------------------------------------------------------------
	function ValidateReceiver($receiver)
	{
		if(!$this->ValidateCRC($receiver))
		{
			return $this->results->Set('false', "Receiver field " . $this->results->GetMessage());
		}
		
		if($this->IsRestricted($receiver, 1))
		{
			return $this->results->Set('false', "Receiver number is on the restricted list and may not be used in the inventory.");
		}
		
		return $this->results->Set('true', "Receiver number is valid.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			ValidateCRC makes sure the smart card or receiver number is valid
			function that validate the smart card and the Receiver number
			If the receiver values are correct will return the last two
			digits of the receiver/smart card number
			This function expects to receive the 12 digit receiver/smart card
			number and parses it internally.
		\param controlNumber
				The 12 digit smart card or 12 digit receiver number to validate
		\return
			-	true	The number is valid
			-	false	The number is not valid

		\note CharAt values start at zero.
				Also, have to multiply all string characters by one
				to tell Javascript to treat them as numbers

	*/
	//--------------------------------------------------------------------------
	function ValidateCRC( $controlNumber)
	{
		// String version of the passed in control number
		//	add a zero so we start from a 1 based index
		
		if(strlen($controlNumber) != 12)
		{
			return $this->results->Set('false', "contains invalid characters or less than 12 digits.");
		}
		
		$crcText = $controlNumber{10} . $controlNumber{11};
		$strNumber = "0" . $controlNumber;
		$tempTotal = 0;		// The value of the numbers added to the crcValue
		$crcValue = 0;		//	The final crc value of the 9 digits passed in
		
		if(!ctype_digit($strNumber))
		{
			return $this->results->Set('false', "contains invalid characters. Should be numbers only.");
		}
	
		$tempTotal = $strNumber{1} . $strNumber{2};
		$crcValue = (int)$tempTotal * 6;
	
		$tempTotal = (int)$strNumber{3} * 19;
		$crcValue = $crcValue + (int)$tempTotal;
		
		$tempTotal = $strNumber{4} . $strNumber{5} . $strNumber{6};
		$crcValue = $crcValue + ($tempTotal * 8);
		
		$tempTotal = $strNumber{7} . $strNumber{8};
		$crcValue = $crcValue + ($tempTotal * 1);
	
		$crcValue = $crcValue % 23;
		$tempTotal = $strNumber{9} . $strNumber{10};
	
		$crcValue = $crcValue + ($tempTotal*1);
	
		$crcValue = $crcValue % 100;
	
		if ($crcText != $crcValue)
		{
			return $this->results->Set('false', "failed CRC check.");
		};
	
		return $this->results->Set('true', "passed CRC check.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Checks to see if a receiver or smart card number is on the
			restricted list
		\param strNumber
				The number to check
		\param numType
				The list to check this against.
					-	0	smart card
					-	1	receiver
		\param id
			(optional)
			an id to remove from inclusion in searching for
			a restricted number
		\return
			-	true
					The receiver or smart card number is on the restricted
					list
			-	false
					The receiver or smart card is not on the invalid list.
	*/
	//--------------------------------------------------------------------------
	function IsRestricted($strNumber, $numType, $id = -1)
	{
		/*
			Try to find the hardware record of this code
		*/

		if($id != -1)
		{
			$sql = "SELECT * FROM tblRestrictedNumbers WHERE resNum_Digits = '$strNumber' AND resNum_Type = $numType AND resNum_ID <> $id";
		}
		else
		{
			$sql = "SELECT * FROM tblRestrictedNumbers WHERE resNum_Digits = '$strNumber' AND resNum_Type = $numType";
		}
		
		/*
			We'll get a list of records
		*/
		$records = $this->db->Select($sql);
		
		if(sizeof($records) == 1)
		{
			return true;
		}
		return false;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			This function returns the record id associated with the smart
			card text.
		\param strText
			The 12 digit smart card number to check.
		\param id
			An optional smart card id to ignore when searching for an existing
			Id. Used for modify, which  may not want the orgional, but may
			want to find duplicates
		\return
			-	-1	 if not found
			-	0+	the id of the smart card
	*/
	//--------------------------------------------------------------------------
	function GetSmartCardID($strText, $id = -1)
	{
		$strFormatted = $this->db->EscapeString($strText);
		
		if($id == -1)
		{
			$sql = "SELECT $this->field_Id FROM $this->table_Name WHERE rec_SmartCard = '$strFormatted';";
		}
		else
		{
			$sql = "SELECT $this->field_Id FROM $this->table_Name WHERE rec_SmartCard = '$strFormatted' AND $this->field_Id <> $id;";
		}
	
		/*
			Get a list of records
		*/
		$records = $this->db->Select($sql);
		if(sizeof($records) > 0)
		{
			return $records[0][$this->field_Id];
		}
		
		return -1;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Validates the requested field
		\param field
			The field name
		\param data
			The value of the field
	*/
	//--------------------------------------------------------------------------
	function ValidateField($field, $data)
	{
		switch($field)
		{
			case 'smartcard':
				$this->ValidateSmartCard($data);
				break;
			case 'receiver':
				$this->ValidateReceiver($data);
				break;
			case 'hardware':
				$this->ValidateHardware($data);
				break;
			default:
				$this->results->Set('false', "Invalid field type.");
				break;
		}
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Check to make sure the hardware address submitted is valid.
		\param data
			The hardware data to check. Must be 4 digits
		
		\return
			-	true
					The hardware id is valid
			-	false
					The hardware id is not valid
		
	*/
	//--------------------------------------------------------------------------
	function ValidateHardware($data)
	{
		$oReceiverHardware = receiverHardware::GetInstance();
		
		/*
			we only need the first two digits of the hardware address to perform the validation
			The second two digits are for generation information only, something we're not
			currently keeping track of.
		*/
	
		if(strlen($data) < 4)
		{
			return $this->results->Set('false', "Four (4) digit receiver hardware id needed.");
		}
		
		$strHardwareModel = $oReceiverHardware->GetFromHardware($data);
		
		if($strHardwareModel == "")
		{
			return $this->results->Set('false', "Invalid hardware model.");
		}
		
		return $this->results->Set('true', $strHardwareModel);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Returns the singleton for this class
		\return
			An object representing the receiver class
	*/
	//--------------------------------------------------------------------------
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new receiver();
		}
		
		return $obj;
	}
}
?>