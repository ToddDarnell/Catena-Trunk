<?php

	require_once('../../../classes/include.php');
	require_once('class.db.php');

class receiverModel extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblReceiverModel";
		$this->field_Id = "recModel_ID";
		$this->field_Name = "recModel_Name";
		$this->field_Description = "recModel_Description";
		$this->field_ModelCode = "recModel_Code";
		
		$oRights = rights::GetInstance();

		$this->rights_Remove = $oRights->RMS_Support;
		$this->rights_Add = $oRights->RMS_Support;
		$this->rights_Modify = $oRights->RMS_Support;
		
		$this->db = rmsData::GetInstance(); 
	}
	/*-------------------------------------------------------------------
		Returns the three digit code associated with the passed in id
		If no valid code is found, returns -1
	-------------------------------------------------------------------*/
	function GetCode($strModel)
	{
	
		$strFormatted = $this->db->EscapeString($strModel);
	
		$sql = "SELECT * FROM $this->table_Name WHERE $this->field_Name = '$strFormatted';";
	
		/*
			Get a list of records
		*/
		$records = $this->db->Select($sql);
		if(sizeof($records) > 0)
		{
			return $records[0]['recModel_Code'];
		}
		
		return -1;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Validate the receiver model name
		\param strName
			The reciever model name to validate.
		\return
	*/
	//--------------------------------------------------------------------------
	function ValidateName($strName)
	{
		/*--------------------------------------------------------------------------
			May contain only a-z 0-9 A-Z spaces and special characters	
			\',;:\$@%#_/()–.?!"
			Can be up to 75 characters			
		----------------------------------------------------------------------------*/		
		if(eregi("^[a-z0-9 \\.!?',\";:\$@%#_/()-]{3,16}$",  $strName))
		{
			return $this->results->Set('true', "Valid model name.");
		}
		
		return $this->results->Set('false', "Name is less than 3 characters or contains one of the following invalid characters: ` ~	^ *	= +	| ] [ }	{ <	> &");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Validates the description of the model
		\param strDescription
			The description to validate.
		\return
	*/
	//--------------------------------------------------------------------------
	function ValidateDescription($strDescription)
	{
		if(strlen($strDescription) < 3)
		{
			return $this->results->Set('false', "Receiver model description is too short. Needs to be at least 3 characters.");
		}

		if(strlen($strDescription) > 60)
		{
			return $this->results->Set('false', "Receiver model description is too long. Needs to be less than 60 characters.");
		}
					
		if(eregi("^[a-z0-9 \n\r.!?',\";:\$@%#_/()\\-]{3,60}$",  $strDescription))
		{
			return $this->results->Set('true', "Valid model description.");
		}
		
		return $this->results->Set('false', "Receiver model description contains one or more of the following invalid characters: ` ~	^ *	= +	| ] [ }	{ <	> &. Remove the invalid character(s) to continue.");	
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Adds a receiver model to the database
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
	function Add($strName, $strDescription)
	{
		global $g_oUserSession;
		
		$sysVars = systemVariables::GetInstance();

		if(!$g_oUserSession->HasRight($this->rights_Add))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		if(!$this->ValidateName($strName))
		{
			return false;
		}

		if($this->Exists($this->GetID($strName)))
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
		$codeVal = $sysVars->GetValue("ReceiverModelCode");

		/*
			Build the record
		*/
		$arInsert = array();

		$arInsert[$this->field_Name] = $strName;
		$arInsert[$this->field_Description] = $strDescription;
		$arInsert[$this->field_ModelCode] = $codeVal;
			
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', 'Database error prevents adding receiver model.');
		}
		
		$codeVal = $codeVal + 1;

		$sysVars->Set("ReceiverModelCode", $codeVal);
		
		return $this->results->Set('true', "Added model $strName.");
	
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Adds a receiver model to the database
		\param modelId
			The database record id of the model to modify.
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
		
		if(!$this->ValidateName($strName))
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
		$arUpdate[$this->field_Description] = $strDescription;
		
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
	//--------------------------------------------------------------------------
	/**
		\brief
		\param
		\return
	*/
	//--------------------------------------------------------------------------
	function GetList()
	{
		$listNames = array();
		$arTables = array();
		$elements = array();
	
		$where['id'] = -1;
		$where['name'] = "";
		
		$orderBy = "";
		$limit = 0;
		
		if(isset($_GET['id']))
		{
			if(is_numeric($_GET['id']))
			{
				$where['id'] = $_GET['id'];
			}
		}	
		
		if(isset($_GET['name']))
		{
			$where['name'] = $_GET['name'];
		}	
		
		if(isset($_GET['limit']))
		{
			$limit = $_GET['limit'];
		}	
		
		/*
			Try to find a record which has the 
			build the record
		*/
		$strSQL = "SELECT * FROM $this->table_Name WHERE 1 = 1 ";
	
	
		if($where['id'] > -1)
		{
			$strSQL .= " AND $this->field_Id = ". $where['id'];
		}
	
		if(strlen($where['name']) > 0)
		{
			$idValue = $where['name'];
			$strSQL .= " AND $this->field_Name LIKE '%$idValue%' ";
		}
		
		if($limit > 0)
		{
			$strSQL .= " LIMIT $limit ";
		}
			
		$strSQL.= " ORDER BY $this->field_Name";
		
		$arResults = $this->db->select($strSQL);
		
		$oXML = new XML;
		$oXML->serializeElement($arResults, "element");
		$oXML->outputXHTML();
			
	}
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new receiverModel();
		}
		
		return $obj;
	}
}


/*
	-	$info may be the name or the id
		of the record we're looking for
	-	return an id
		-1 if not valid
*/
function GetReceiverModelID($info)
{
	$oType = receiverModel::GetInstance();
	
	$id = -1;
	
	if(is_numeric($info))
	{
		if($oType->Exists($info))
		{
			$id = $info;	
		}
	}
	else
	{
		$id = $oType->GetID($info);
	}
	
	return $id;
}



?>