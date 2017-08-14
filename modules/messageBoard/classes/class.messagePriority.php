<?
	require_once('../../../classes/include.php');
	require_once('class.db.php');

/*
	performs the server side functionality for priority requests
	Must load the header command like this or the data will
	not be re downloaded the next time it's called
*/

class priority extends baseAdmin
{
		function __construct()
	{
		baseAdmin::__construct();
		
		$this->table_Name = "tblMessagePriority";
		$this->field_Id = "msgPri_ID";
		$this->field_Name = "msgPri_Name";
		$this->db = messageBoardData::GetInstance();
	}
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new priority();
		}
		
		return $obj;
	}
}
?>