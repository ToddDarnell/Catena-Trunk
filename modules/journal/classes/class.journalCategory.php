<?
	require_once('../../../classes/include.php');
	require_once('class.db.php');


//--------------------------------------------------------------------------
/**
	\class journalCategory
	\brief Builds the Journal Category list dynamically by pulling information 
	from the database.
*/
//--------------------------------------------------------------------------

/*
	performs the server side functionality for journal category requests. Must 
	load the header command like this or the data will not be re downloaded the
	next time it's called.
*/

class journalCategory extends baseAdmin
{
	function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblJournalCategory";
		$this->field_Id = "jrnCat_ID";
		$this->field_Name = "jrnCat_name";
		
		$this->db = journalData::GetInstance(); 
	}
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new journalCategory();
		}
		
		return $obj;
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
}
?>