<?
	require_once('../../../classes/include.php');
	require_once('class.db.php');

/*
	performs the server side functionality for priority requests
	Must load the header command like this or the data will
	not be re downloaded the next time it's called
*/

class documentPriority extends baseAdmin
{
		function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblDCRPriority";
		$this->field_Id = "dcrPriority_ID";
		$this->field_Name = "dcrPriority_Name";
		$this->db = dmsData::GetInstance();
	}
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new documentPriority();
		}
		
		return $obj;
	}
}
?>