<?
	require_once('../classes/include.php');
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
	
	/*
		We made the list lower case. All values
		in the switch($action) must be lower case
	*/
	
	$action = strtolower($_GET['action']);

	switch($action)
	{
		case "organizations":
			GetList("organizations");
			break;
		case "rightcategory":
			GetList("rightCategory");
			break;
		case "rights":
			GetList("rights");
			break;
		default:
			$oXML = new XML;
			$oXML->outputXHTML();
			break;
	}

	exit;

/*-------------------------------------------------------------------
	Returns a list of receiver statuses
-------------------------------------------------------------------*/
function GetList($strList)
{
	$listNames = array();
	$arTables = array();
	$elements = array();

	/*
		$tables is the name of the tables
		$elements is the name of the individual records within the XML format
		$listName is the name of the list which is created
		
		XML would look like this:
		
		<$listName>	<--- root element -->
			<$element>	<-- an individual record within the xml document
			</$element>
		</$listName>
		
		So this XML document would have one element in it.
		If using receiverStatus the empty document would look like this:
		
		<recStatus>
			<status>
			</status>
		</recStatus>
		
		The $tables variable tells the db what table to build our list from
	*/

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
		$lmit = $_GET['limit'];
	}	

		
	$table = "receiverStatus";
	$arTables[$table] = array();
	$arTables[$table]['table'] = "tblReceiverStatus";
	$arTables[$table]['orderBy'] = "tblReceiverStatus.recStatus_Name";

	
	$table = "organizations";
	$arTables[$table] = array();
	$arTables[$table]['table'] = "tblOrganization";
	$arTables[$table]['orderBy'] = "tblOrganization.org_Short_Name";
	$arTables[$table]['id'] = "org_ID";
	$arTables[$table]['name'] = "org_Short_Name";


	$table = "receiverModel";
	$arTables[$table] = array();
	$arTables[$table]['table'] = "tblReceiverModel";
	$arTables[$table]['orderBy'] = "tblReceiverModel.recModel_Name";


	$table = "documentTypes";
	$arTables[$table] = array();
	$arTables[$table]['table'] = "tblDocumentType";

	$table = "rightCategory";
	$arTables[$table] = array();
	$arTables[$table]['table'] = "tblRightCategory";


	$table = "rights";
	$arTables[$table] = array();
	$arTables[$table]['table'] = "tblRight";
	$arTables[$table]['orderBy'] = "right_Name";
		
	
	$table = "restrictedNumbers";
	$arTables[$table] = array();
	$arTables[$table]['table'] = "tblRestrictedNumbers";

	$table = "journalcategory";
	$arTables[$table] = array();
	$arTables[$table]['table'] = "tblJournalCategory";
	
	if(!isset($arTables[$strList]['table']))
	{
		return false;
	}
		
	$tableName = $arTables[$strList]['table'];
 	
 	if(isset($arTables[$strList]['orderBy']))
	{
		$orderBy = $arTables[$strList]['orderBy'];
	}
 	
	if($tableName == "")
	{
		return;
	}
	
	/*
		Try to find a record which has the 
		build the record
	*/
	$sql = "SELECT * FROM $tableName WHERE 1 = 1 ";


	if($where['id'] > -1)
	{
		if(isset($arTables[$strList]['id']))
		{
			$idField = $arTables[$strList]['id'];
			$idValue = $where['id'];
			$sql .= " AND $idField = $idValue ";
		}
	}

	if(strlen($where['name']) > 0)
	{
		if(isset($arTables[$strList]['name']))
		{
			$idField = $arTables[$strList]['name'];
			$idValue = $where['name'];
			$sql .= " AND $idField LIKE '%$idValue%' ";
		}
	}
	
	if($limit > 0)
	{
		$sql .= " LIMIT $limit ";
	}
		
	if(strlen($orderBy))
	{
		$sql.= " ORDER BY $orderBy";
	}
		
	OutputXMLList($sql, "list", "element");
}