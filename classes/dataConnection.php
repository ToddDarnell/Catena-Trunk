<?

require_once("class.database-mysql.php");
require_once("class.database-odbc.php");


function CreateDataConnection($strType)
{
	$strType = strtolower($strType);

	switch($strType)
	{
		case "odbc":
			return new ODBC_DB();
			break;
		case "mysql":
			return new mysqlDB();
			break;
	}
	
	return null;
}
?>