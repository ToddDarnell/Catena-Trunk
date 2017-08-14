<?php

require_once("dataConnection.php");
require_once("config.php");

class systemData
{
	function GetInstance()
	{
		global $cfg;
		static $objDB;
		
		if(!isset($objDB))
		{
			$host = $cfg['db']['host'];
			$dbName = $cfg['db']['name'];
			$user = $cfg['db']['user'];
			$password = $cfg['db']['password'];
			$port = $cfg['db']['port'];

			$objDB = CreateDataConnection("MySQL");

			if(!$objDB->load($dbName, $host, $port, $user, $password))
			{
				die($objDB->results->Send());
			}
		}
		return $objDB;
	}
}
?>