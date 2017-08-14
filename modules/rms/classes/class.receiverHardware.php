<?php

	require_once('../../../classes/include.php');

class receiverHardware extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblHardware";
		$this->field_Id = "hw_ID";
		$this->field_Name = "hw_Code";
		$this->field_Model = "recModel_ID";
		
		$oRights = rights::GetInstance();

		$this->rights_Remove = $oRights->RMS_Support;
		$this->rights_Add = $oRights->RMS_Support;
		$this->rights_Modify = $oRights->RMS_Support;
		
		$this->db = rmsData::GetInstance();
	}
	
	/*-------------------------------------------------------------------
		Returns the string name of a model from the passed in hardware ID.
		We'll get the model id assigned to the particular hardware
		Then we'll look up the model id
		return "" if no model was found
	-------------------------------------------------------------------*/
	function GetFromHardware($strHardware)
	{
		$oReceiverModel = receiverModel::GetInstance();
		
		$strShortHardware;			//	the two digit hardware code
		$modelID ;					//	the model id (DB id)
		
		if(strlen($strHardware) < 2)
		{
			$this->results->Set('false', "Hardware length too short.");
			return "";
		}
	
		if(strlen($strHardware) > 2)
		{
			$strHardware = substr($strHardware, 0,  2);
		}
		
		$strShortHardware = strtoupper($strHardware);
		
				
		if(!eregi("[a-z]{2}$",  $strShortHardware))
		{
			$this->results->Set('false', "Invalid characters in hardware id.");
			return "";
		}
	
		/*
			Try to find the hardware record of this code
		*/
		$sql = "SELECT * FROM tblHardware WHERE hw_Code = '$strShortHardware';";
	
		//
		//	We'll get a list of records
		//
		$records= $this->db->Select($sql);
		
		if(sizeof($records) < 1)
		{
			$this->results->Set('false', "No hardware record found for '$strShortHardware'.");
			return "";
		}
	
		return $oReceiverModel->GetName($records[0]['recModel_ID']);
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			ValidateHardware checks to make sure the hardware address
			submitted is valid.
		\param strHardware
			The hardware id to check
		\param size
			The size of the field. Some may be 4, some may be 2 since
			the last 2 digits don't really matter.
		\return

		\note
			we only need the first two digits of the hardware address to
			perform the validation. The second two digits are for generation
			information only, something we're not currently keeping track of.
	*/
	//--------------------------------------------------------------------------
	function GetID($strHardware, $size = 2)
	{
		if(($size != 2) && ($size != 4))
		{
			$this->results->Set('false', "Invalid size requested for hardware Id");
			return -1;
			
		}
		
		if(strlen($strHardware) != $size)
		{
			$this->results->Set('false', "$size digit receiver hardware id required.");
			return -1;
		}
		
		if(strlen($strHardware) != 2)
		{
			$strHardware = substr($strHardware, 0, 2);
		}
		
		$result = baseAdmin::GetID($strHardware);
		
		if($result < 1)
		{
			$this->results->Set('false', "Invalid Hardware ID [$strHardware].");
			return -1;
		}
		
		$this->results->Set('true', "Valid hardware");
		return $result;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			This function returns a list of hardware id's associated with
			the model
		\param strModel
			The model for which to receive the hardware list.
		\return
			-	null if no items found
			-	array containing valid hardware ids.
	*/
	//--------------------------------------------------------------------------
	function GetHardwareList($strModel)
	{
		$oReceiverModel = receiverModel::GetInstance();
			
		/*
			Try to find the hardware record of this code
		*/
		
		$modelID = $oReceiverModel->GetID($strModel);
		
		if($modelID < 0)
		{
			return null;
		}
		
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Model = $modelID;";
	
		$records = $this->db->Select($sql);
	
		return $records;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Determines if the receiver hardware model is valid
		\param strName
			The name of the hardware model.
		\return
	*/
	//--------------------------------------------------------------------------
	function IsValid($strName)
	{
		if(eregi("^[a-z]{2}$", $strName))
		{
			return $this->results->Set('true', "Valid hardware type.");
		}
		
		return $this->results->Set('false', "Hardware type is invalid. May only be 2 alphabetical characters.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Attach a hardware id to a receiver model.
		\param modelName
			The name of the model that the hardware is to be attached to
		\param strHardware
			The two digit hardware id to attach to the model.
		\return
			-	true
				The hardware was attached
			-	false
				The hardware was not attached
	*/
	//--------------------------------------------------------------------------
	function Add($modelName, $strHardware)
	{
		global $g_oUserSession;

		$oReceiverModel = receiverModel::GetInstance();
		
		if(!$g_oUserSession->HasRight($this->rights_Add))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		$strHardware = strtoupper($strHardware);
		
		if($this->IsValid($strHardware) == false)
		{
			return false;
		}

		$existId = $this->GetID($strHardware);
		
		if($existId > -1)
		{
			/*
				hardware already exists in the database
			*/
			return $this->results->Set('false', "Hardware exists in database and may not be added again. Use modify to change receiver details.");
		}
		
		$modelId = $oReceiverModel->GetID($modelName);

		if($modelId < 0)
		{
			return $this->results->Set('false', "Model does not exist and may not have hardware attached to it.");
		}

		$arInsert = array();

		$arInsert[$this->field_Name] = $strHardware;
		$arInsert[$this->field_Model] = $modelId;
			
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', 'Database error prevents adding receiver hardware.');
		}
		
		
		return $this->results->Set('true', "Added hardware type $strHardware.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Adds a receiver model to the database
		\param modelId
			The database record id if the model to modify
		\param strName
			The name of the model
		\param strDescription
			The description of this model.
		\return
			-	true
				The model was added properly.
			-	false
				The mdel was not added properly.
	*/
	//--------------------------------------------------------------------------
	function Modify($modelId, $strName, $strDescription)
	{
		global $g_oUserSession;
		
		$sysVars = systemVariables::GetInstance();
		
		if(!$g_oUserSession->HasRight($this->rights_Add))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		if(!$this->IsValid($strName))
		{
			return false;
		}

		/*
			Make sure the id already exists
		*/
		if(!$this->Exists($modelId))
		{
			return $this->results->Set('false', "Receiver model does not exist.");
		}
				
		$existId = $this->GetID($strName, $modelId);
		
		if($existId > -1)
		{
			/*
				model already exists in the database
			*/
			return $this->results->Set('false', "Model exists in database and may not be added again. Use modify to change receiver details.");
		}
	
		/*
			Make sure the smart card is valid and it is not already
			in the database
		*/
		if(!$this->ValidateDescription($strDescription))
		{
			return false;
		}
					
		/*
			Now we have to add the model code number.
			Pull the value, turn it into a number, increment
			by one and then give that code to the model.
		*/

		$arUpdate = array();

		$arUpdate[$this->field_Name] = $strName;
		$arUpdate[$this->field_Description] = $strName;
		
		$arWhere = array();
		$arWhere[$this->field_Id] = $modelId;	
		$retCode = $this->db->update($this->table_Name, $arUpdate, $arWhere);
		
		switch($retCode)
		{
			case 0:
				return $this->results->Set('true', "No changes made to receiver model.");
				break;
			case 1:
				return $this->results->Set('true', "Your changes have been applied to receiver model.");
				break;
			case -1:
				return $this->results->Set('false', $this->db->results->GetMessage());
				break;
		}

		return $this->results->Set('true', "Modify model $strName.");
	
	}
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new receiverHardware();
		}
		
		return $obj;
	}
}
?>