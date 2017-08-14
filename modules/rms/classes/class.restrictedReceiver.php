<?php

	require_once('../../../classes/include.php');
	require_once('class.receiver.php');

class restrictedReceiver extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblRestrictedNumbers";
		$this->field_Id = "resNum_ID";
		$this->field_Name = "resNum_Digits";
		$this->field_Type = "resNum_Type";
				
		/*
			This portion loads all of the rights and their variable names
		*/
		$rights = rights::GetInstance();
		
		$this->rights_Remove = $rights->RMS_Support;
		$this->rights_Add = $rights->RMS_Support;
		$this->rights_Modify = $rights->RMS_Support;
		
		$this->db = rmsData::GetInstance();

	}
	/*--------------------------------------------------------------------------
		-	description
			Checks to see if a receiver or smart card number is on the
			restricted list
		-	params
				$strNumber
					The number to check
				$numType
					The list to check this against.
					0	smart card
					1	receiver
				$id (optional)
					an id to remove from inclusion in searching for
					a restricted number
		-	return
				true
					The receiver or smart card number is on the restricted
					list
				false
					The receiver or smart card is not on the invalid list.
	--------------------------------------------------------------------------*/
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
	/*--------------------------------------------------------------------------
		-	description
				Adds a number to the restricted list (either smart card or
				receiver)
		-	params
				$number
					The number which should be added to the restricted list
				$description
					The reason for adding this restricted number
				$numTyp
					The type of number.
					0	smart card
					1	receiver
		-	return
	--------------------------------------------------------------------------*/
	function Add($number, $description, $numType)
	{
		$oReceiver = receiver::GetInstance();
		
		global $g_oUserSession;
		
		if(!$g_oUserSession->HasRight($this->rights_Add))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
				
		/*
			-	Make sure the receiver number is not already used in the system
			-	Make sure the receiver number is not already restricted
			-	Make sure the number is 12 digits, and it's a number
		*/
		
		if(!is_numeric($number))
		{
			return $this->results->Set('false', "Number may contain only digts 0-9.");
		}
		
		if(strlen($number) != 12)
		{
			return $this->results->Set('false', "Restricted numbers must be at least 12 digits.");
		}
				
		if($numType != 1)
		{
			if($numType != 0)
			{
				return $this->results->Set('false', "Invalid type when attempting to add a restricted number.");
			}
		}
		
		if($this->IsRestricted($number, $numType))
		{
			return $this->results->Set('false', "Number is already on restricted list and may not be added again.");
		}
		
		if($numType == 1)
		{
			if($oReceiver->GetID($number) > -1)
			{
				return $this->results->Set('false', "Receiver is already in the system. Remove the receiver number from the system and then add to restricted list.");
			}
		}
		
		$description = trim($description);
		
		if(!$this->IsValidRestrictedReason($description))
		{
			return $this->results->Set('false', "Must contain a valid reason for restriction.");
		}
				
		/*
			Add the number to the restricted list
		*/
		$arInsert = array();

		$arInsert['resNum_Digits'] = array();
		$arInsert['resNum_Digits']['value'] = $number;
		$arInsert['resNum_Digits']['type'] = "string";
	
		$arInsert['resNum_Reason'] = $description;
		$arInsert['resNum_Type'] = $numType;
			
		if(!$this->db->insert("tblRestrictedNumbers", $arInsert))
		{
			return $this->results->Set('false', 'Unable to add number due to database error'. $this->db->results->GetMessage());
		}

		return $this->results->Set('true', "'$number' added to the restricted list.");
	}
	/*--------------------------------------------------------------------------
		-	description
				Modifies a number already added to a restricted list (either
				receiver or smart card)
		-	params
				$id
					Id of the record being modified
				$number
					The number which should be added to the restricted list
				$description
					The reason for adding this restricted number
				$numTyp
					The type of number.
					0	smart card
					1	receiver
		-	return
	--------------------------------------------------------------------------*/
	function Modify($id, $number, $description, $numType)
	{
		$oReceiver = receiver::GetInstance();

		global $g_oUserSession;
		
		if(!$g_oUserSession->HasRight($this->rights_Modify))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}

		/*
			-	Make sure the receiver number is not already used in the system
			-	Make sure the receiver number is not already restricted
			-	Make sure the number is 12 digits, and it's a number
		*/

		if(!$this->Exists($id))
		{
			return $this->results->Set('false', "Invalid restricted number to modify.");
		}
		
		if(!is_numeric($number))
		{
			return $this->results->Set('false', "Number may contain only 0-9 and must be at least 1 digit long.");
		}
		
		if(strlen($number) != 12)
		{
			return $this->results->Set('false', "Restricted numbers must be at least 12 digits.");
		}
		
		if($numType != 1)
		{
			if($numType != 0)
			{
				return $this->results->Set('false', "Invalid type when attempting to add a restricted number.");
			}
		}
		
		if($this->IsRestricted($number, $numType, $id))
		{
			return $this->results->Set('false', "Number is already on restricted list and may not be added again.");
		}

		$description = trim($description);

		if(!$this->IsValidRestrictedReason($description))
		{
			return $this->results->Set('false', "Must contain a valid reason for restriction.");
		}

		if($numType == 1)
		{
			if($oReceiver->GetID($number) > -1)
			{
				return $this->results->Set('false', "Receiver is already in the system. Remove the receiver number from the system and then add to restricted list.");
			}
		}
				
		/*
			Add the number to the restricted list
		*/
		$arUpdate = array();
		$arFilter = array();

		$arUpdate['resNum_Digits'] = array();
		$arUpdate['resNum_Digits']['value'] = $number;
		$arUpdate['resNum_Digits']['type'] = "string";
	
		$arUpdate['resNum_Reason'] = $description;
		$arUpdate['resNum_Type'] = $numType;

		$arFilter['resNum_ID'] = $id;
		
		switch($this->db->update("tblRestrictedNumbers", $arUpdate, $arFilter))
		{
			case 0:
				return $this->results->Set('true', "No changes made for '$number'.");
			case 1:
				return $this->results->Set('true', "'$number' updated in the restricted list.");
				break;
			case -1:
				return $this->results->Set('false', 'Unable to update number due to database error'. $this->db->results->GetMessage());
		}
	}
	/*--------------------------------------------------------------------------
		-	description
			This function validates that the restricted receiver or smart card
			reason is valid.
		-	params
				$strText
					The text to verify as being a valid reason
		-	return
				-	true
					The text is valid
				-	false
					The text is not valid
	--------------------------------------------------------------------------*/
	function IsValidRestrictedReason($strText)
	{
		if (strlen ($strText)>5783)
		{
			return $this->results->Set('false', "Invalid reason - too many characters");
		}
			
		if(eregi("^[a-z0-9 \n\r.!?',\";:\$@%#_/()\\-]{3,}$",  $strText))
		{
			return $this->results->Set('true', "Invalid reason.");
		}
		
		return $this->results->Set('false', "Reason is smaller than 3 characters or contains one of the following invalid characters: ` ~	^ *	= +	| ] [ }	{ <	> &");
	}
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new restrictedReceiver();
		}
		
		return $obj;
	}
}
?>