<?
require_once('include.php');

/**
	\brief Create log messages.
*/
class cLog
{
	protected $field_Id = "log_ID";
	private $field_User = "user_ID";
	private $field_Date = "log_Date";
	private $field_Message = "log_Message";
	private $field_Level = "log_Level";
	private $field_System = "system_ID";
	
	private $logThreshold = LOGGER_INFO;
	
	public function __construct()
	{
		global $cfg;
		
		$this->logThreshold = $cfg['site']['log_level'];

		$this->table_Name = "tblLogs";
		$this->db = systemData::GetInstance();
 	}
 	//--------------------------------------------------------------------------
 	/**
 		\brief
 			Logs a message to the database server for reviewing later.
 		\param strMessage
 			The message to be posted to the log.
 		\param systemId
 			The Catena system this message is associated with. This may be
 			a module or a component of a module.
 		\param logLevel
 			The level of the log message. a numerical value between 0 and 100.
 			100 being the least significant.
 			0 being the most significant.
 		\return
 	*/
 	//--------------------------------------------------------------------------
 	function log($systemId, $strMessage, $logLevel = LOGGER_INFO)
 	{
 		global $g_oUserSession;
 		
		$userId = $g_oUserSession->GetUserID();
		
		if($logLevel > $this->logThreshold)
		{
			return;
		}
				
		if(strlen($strMessage) < 1)
		{
			return;
		}
		
		if(($logLevel < 0) || ($logLevel > 100))
		{
			$logLevel = 50;
		}
		
		if($systemId < 0)
		{
			$systemId = 0;
		}
		
		/*
			build the record
		*/
		$arInsert = array();
		$arInsert[$this->field_User] = $userId;
		$arInsert[$this->field_Message] = $strMessage;
		$arInsert[$this->field_Date] = Date("c");
		$arInsert[$this->field_Level] = $logLevel;
		$arInsert[$this->field_System] = $systemId;
			
		if(!$this->db->insert($this->table_Name, $arInsert))
		{
			return false;
		}
		
		return true;
 	}
 	//--------------------------------------------------------------------------
 	/**
 		\brief
 		\param
 		\return
 	*/
 	//--------------------------------------------------------------------------
 	function RemoveOldLogs()
	{
		$sql = "DELETE FROM tblLogs WHERE log_Date < (NOW() - INTERVAL 7 DAY);"; 
		
		$this->db->sql_delete($sql);
	}
 	//--------------------------------------------------------------------------
 	/**
 		\brief
 			Retrieves an instance of this object. There should be only
 			one log object at a time
 		\return
 			A log object
 	*/
 	//--------------------------------------------------------------------------
	function GetInstance()
	{
		static $obj;
		
		if(!isset($obj))
		{
			$obj = new cLog();
		}
		
		return $obj;
	}
}
?>