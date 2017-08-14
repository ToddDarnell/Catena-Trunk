<?php

	require_once('../../../classes/include.php');
	require_once('class.db.php');

class receiverStatus extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblReceiverStatus";
		$this->field_Id = "recStatus_ID";
		$this->field_Name = "recStatus_Name";
		$this->field_Description = "recStatus_Description";
		
		$oRights = rights::GetInstance();

		$this->rights_Remove = $oRights->RMS_Support;
		$this->rights_Add = $oRights->RMS_Support;
		$this->rights_Modify = $oRights->RMS_Support;
	
		$this->db = rmsData::GetInstance(); 
	}
	/*
		Returns the singleton for this class
	*/
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new receiverStatus();
		}
		
		return $obj;
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Add a receiver status
		\param strName
			The name of the status
		\param strDescription
			The description of the status
		\return
			-	true if the status was added
			-	false if the status was not added
	*/
	//--------------------------------------------------------------------------
	function Add($strName, $strDescription)
	{
		global $g_oUserSession;
	

		if(!$g_oUserSession->HasRight($this->rights_Add))
		{
			return $this->results->Set('false', $g_oUserSession->results->GetMessage());
		}
		
		if(!$this->ValidateName($strName))
		{
			return false;
		}

		if($this->GetID($strName) > -1)
		{
			/*
				model already exists in the database
			*/
			return $this->results->Set('false', "Status exists in database and may not be added again. Use modify to change receiver details.");
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
			Build the record
		*/
		$arInsert = array();

		$arInsert[$this->field_Name] = $strName;
		$arInsert[$this->field_Description] = $strDescription;
			
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return $this->results->Set('false', 'Database error prevents adding receiver status.');
		}
		
		return $this->results->Set('true', "Added status '$strName'.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Modifies a receiver status
		\param statusId
			The database id of the status to modify
		\param strName
			The new name of the status
		\param strDescription
			The new description of the status
		\return
			-	true	if the status was modified.
			-	false	if the status was not modified.
	*/
	//--------------------------------------------------------------------------
	function Modify($statusId, $strName, $strDescription)
	{
		global $g_oUserSession;

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
		if(!$this->Exists($statusId))
		{
			return $this->results->Set('false', "Receiver status does not exist.");
		}
				
		$existId = $this->GetID($strName, $statusId);
		
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
		$arWhere[$this->field_Id] = $statusId;	
		$retCode = $this->db->update($this->table_Name, $arUpdate, $arWhere);
		
		switch($retCode)
		{
			case 0:
				return $this->results->Set('true', "No changes made to receiver status.");
				break;
			case 1:
				return $this->results->Set('true', "Your changes have been applied to receiver status.");
				break;
			case -1:
				return $this->results->Set('false', $this->db->results->GetMessage());
				break;
		}

		return $this->results->Set('true', "Modified status $strName.");
	}
	//--------------------------------------------------------------------------
	/**
		\brief
			Validates a receiver status name.
		\param strName
			May contain only a-z 0-9 A-Z spaces and special characters
			\code	
			\',;:\$@%#_/()–.?!"
			\endcode
			May be be up to 16 characters			
		\return
			-	true	if the name is valid.
			-	false	if the name is not valid.
	*/
	//--------------------------------------------------------------------------
	function ValidateName($strName)
	{
		if(eregi("^[a-z0-9 \\.!?',\";:\$@%#_/()-]{3,16}$",  $strName))
		{
			return $this->results->Set('true', "Valid model name.");
		}
		
		return $this->results->Set('false', "Name is less than 3 characters or contains one of the following invalid characters: ` ~	^ *	= +	| ] [ }	{ <	> &");
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
	//--------------------------------------------------------------------------
	/**
		\brief
			Validates a receiver status description
		\param strName
			The description text
		\return
			-	true if the description is valid
			-	false if the status is not valid
	*/
	//--------------------------------------------------------------------------
	function ValidateDescription($strName)
	{
		if(eregi("^[a-z0-9 \n\r.!?',\";:\$@%#_/()\\-]{3,255}$",  $strName))
		{
			return $this->results->Set('true', "Valid model description.");
		}
		
		return $this->results->Set('false', "Description is less than 3 characters or contains one of the following invalid characters: ` ~	^ *	= +	| ] [ }	{ <	> &");	
	}
}
?>