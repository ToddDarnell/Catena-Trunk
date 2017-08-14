<?

/**
	The config.php file is used to maintain all website specific variables
	or variables considered global throughout the application.
		
	strModulePath			The location of the modules to load into catena.
	site-redirect			The location Catena uses to search for the user's NT login name.
	
	
	
*/

$iRuleVal = 0;
define ('SITE_NONE', ++$iRuleVal);
define('SITE_OFFLINE', ++$iRuleVal);
define('SITE_WORKSTATION',++$iRuleVal);
define('SITE_TEST', ++$iRuleVal);
define('SITE_PRODUCTION', ++$iRuleVal);

///	Log debug level
define('LOGGER_DEBUG', 100);

///	Log info level. Not output to the live system
define('LOGGER_INFO', 75);

///	Log notice level. The lowest level notice output to the live system.
define('LOGGER_NOTICE', 50);

///	Log notice level. The lowest level notice output to the live system.
define('LOGGER_WARNING', 25);

///	Log security level. Used for all failed security notices
define('LOGGER_SECURITY', 20);

///	Log error level. A system or component error notice.
define('LOGGER_ERROR', 10);

///	Log critical level. This will send an email to global admins and is
///	considered the highest level of error within the system.
define('LOGGER_CRITICAL', 5);

/// Log none level. NO logging enabled or not a message.
define('LOGGER_NONE', 0);

$cfg['site']['type'] = RetrieveServerType();
$serverName = $_SERVER['SERVER_NAME'];
/*
	Change the site version whenever it's posted to live
*/
$cfg['site']['version'] = "Trunk";

$cfg['site']['nameServers'] = Array();
$cfg['site']['nameServers'][0] = "http://inv-apps2.echostar.com/catena/username2.asp";
$cfg['site']['nameServers'][1] = "http://in4d04514.echostar.com/catena/username2.asp";

/*
	db host must be changed on developer workstations
	since their database is pointed to on the catena-dev web server.
	All of the others are being ran from local host for database access
	-	connection host is only localhost on the webservers themselves.
	For developer connections, it is set to the development/test server
*/
	
	switch($cfg['site']['type'])
	{
		case SITE_WORKSTATION:
			$cfg['db']['host'] = 'inv-lx-stgweb1';
			$cfg['db']['name'] = 'catena-tony';
			$cfg['db']['user'] = 'blacton';
			$cfg['db']['password'] = 'chain99';
			$cfg['db']['port'] = "3306";

			$cfg['site']['name'] = "CATENA (local)";
			$cfg['site']['docPath'] = "c:/websites/catenaDocs/files/";
			$cfg['site']['modulePath'] = "C:/websites/Catena-dev/modules";
			$cfg['site']['debug'] = 1;
			$cfg['site']['log_level'] = LOGGER_DEBUG;
			$DEBUG_ON = 1;
			
			break;
		case SITE_DEV:
			/**
				\hideinitializer
			*/
			$cfg['db']['host'] = 'localhost';
			/**
				\hideinitializer
			*/
			$cfg['db']['name'] = 'catena';
			/**
				\hideinitializer
			*/
			$cfg['db']['port'] = '/var/lib/mysql/mysql.sock';
			/**
				\hideinitializer
			*/
			$cfg['db']['user'] = 'webUser';
			/**
				\hideinitializer
			*/
			$cfg['db']['password'] = 'x98kq4bf';

			$cfg['site']['name'] = "CATENA (dev)";
			$cfg['site']['debug'] = 1;
			$cfg['site']['docPath'] = "/var/www/html/http/catenaDocs/dev/";
			$cfg['site']['modulePath'] = "/var/www/html/http/dev/modules";
			$cfg['site']['log_level'] = LOGGER_DEBUG;
			$DEBUG_ON = 1;
			break;
		case SITE_TEST:
			/**
				\hideinitializer
			*/
			$cfg['db']['host'] = 'localhost';
			/**
				\hideinitializer
			*/
			$cfg['db']['name'] = 'catena';
			/**
				\hideinitializer
			*/
			$cfg['db']['port'] = '/var/lib/mysql1/mysql.sock';
			/**
				\hideinitializer
			*/
			$cfg['db']['user'] = 'webUser';
			/**
				\hideinitializer
			*/
			$cfg['db']['password'] = 'x98kq4bf';

			$cfg['site']['name'] = "CATENA (test)";
			$cfg['site']['docPath'] = "/var/www/html/http/catenaDocs/test/";
			$cfg['site']['modulePath'] = "/var/www/html/http/test/modules";
			$cfg['site']['log_level'] = LOGGER_DEBUG;
			$DEBUG_ON = 1;
			break;
		case SITE_PRODUCTION:
			$cfg['db']['host'] = 'localhost';
			$cfg['db']['name'] = 'catena';
			$cfg['db']['port'] = '/var/lib/mysql/mysql.sock';
			$cfg['db']['user'] = 'webuser';
			$cfg['db']['password'] = '3km~v3Ja@dfk';
			$cfg['site']['name'] = "CATENA";
			$cfg['site']['docPath'] = "/var/www/html/http/catenaDocs/";
			$cfg['site']['modulePath'] = "/var/www/html/http/catena/modules";
			$cfg['site']['log_level'] = LOGGER_NOTICE;
			$DEBUG_ON = 0;
			break;
		default:
			die("Invalid server type found.");
	}

	$documentUploadPath = $cfg['site']['docPath'];

/*
	RetrieveServerType
		This function attempts to detect which server type is currently running
		and return the appropriate type.


	The following global variables are used to identify the currently running
	type of server--if any.

	SITE_OFFLINE		-	a localhost server which is not connected to
								to the echo star system. This is useful for
								localhost testing which is offsite
								and not using the username gathered
								from the echostar site.
	SITE_WORKSTATION	- 	user workstation. stand alone website
								which connects to the test/dev database for
								all site data.
	SITE_DEV			-	development website.
	SITE_TEST			-	test server
	SITE_PRODUCTION		-	production server

	-	We are trying to auto detect where these files are
	being hosted from. First we look at the server name.
	Localhost is a developer workstation.
	inv-lx-stgweb1 is the test/dev server
	inv-lx-stgweb is the prod server.

	-	An additional check must be performed to determine if the server
	is test or dev

	-	The following variables describe the kind of site in use.
	Additionaly they can be compared against the site value to determine
	if certain functionality should be implemented in case the code is moved
	to a new site

*/
function RetrieveServerType()
{
	$serverName = $_SERVER['SERVER_NAME'];

	switch($serverName)
	{
		case "localhost":
			/*
				Localhost may be one of two types of servers.
				It may be a developer workstation connected to the
				Echostar system or it may be a stand alone system.
				The mechanism for determining this is a variable
				declared in the php.ini file called
				'catena_offline'.
				If this variable is set to 1, then we'll use the
				local connection data instead of the developer data.
			*/
			$catena_offline = ini_get ( "catena_offline");

			if($catena_offline == "1")
			{
				$retType = SITE_OFFLINE;
			}
			else
			{
				$retType = SITE_WORKSTATION;
			}
			break;
		case "catena.echostar.com":
			/*
				This server name appears to the server when
				the client connects via the linux boxes. For some
				reason the DNS lists a different name.
			*/
			$retType = SITE_PRODUCTION;
			break;
		case "catena":
			$retType = SITE_PRODUCTION;
			break;
		case "catena-test":
			$retType = SITE_TEST;
			break;
		case "catena-test.echostar.com":
			$retType = SITE_TEST;
			break;
		case "catena-dev":
			$retType = SITE_DEV;
			break;
		case "catena-dev.echostar.com":
			$retType = SITE_DEV;
			break;
		default:
			/* someone is running this on an unspecified
			website and therefore will not run properly.
			Shutdown();
			*/
			die("Attempting to run on unconfigured web server [$serverName]. Please go to http://catena-test.echostar.com for the Test Site.");
			break;
	}

	return $retType;
}

?>