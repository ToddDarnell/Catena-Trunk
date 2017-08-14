<?php

require_once('../../../classes/include.php');

class messageBoardData
{
	function GetInstance()
	{
		static $objDB;
		
		if(isset($objDB))
		{
			return $objDB;
		}

		global $cfg;
		$host = "";
		$user = "";
		$password = "";
		$port = "";
		$dbName = 'catena-messageboard';

		switch($cfg['site']['type'])
		{
			case SITE_PRODUCTION:
				$host = "localhost";
				$port = '/var/lib/mysql/mysql.sock';
				$user = "webuser";
				$password = "3km~v3Ja@dfk";
				break;
			case SITE_DEV:
				$host = 'localhost';
				$port = '/var/lib/mysql/mysql.sock';
				$user = 'webUser';
				$password = 'x98kq4bf';
				break;
			case SITE_TEST:
				$host = 'localhost';
				$port = '/var/lib/mysql1/mysql.sock';
				$user = 'webUser';
				$password = 'x98kq4bf';
				break;
			case SITE_WORKSTATION:
				$host = "inv-lx-stgweb1";
				$user = $cfg['db']['user'];
				$password = $cfg['db']['password'];
				$port = "3306";
				break;
		}

		$objDB = CreateDataConnection("MySQL");
		$objDB->load($dbName, $host, $port, $user, $password);

		return $objDB;
	}
}
?>