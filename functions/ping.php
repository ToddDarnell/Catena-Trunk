<?
/*
	The purpose of this file is to send website status information to
	the caller.
*/

	require_once('../classes/include.php');
	
	ClearCache();

	header("Content-Type: text/xml");	
	
	$databaseStatus = GetDatabaseStatus();
	$loginName = $g_oUserSession->GetLoginName();
	$userOrganization = $g_oUserSession->GetOrganization();
	$siteVersion = $cfg['site']['version'];

	echo "<status>
			<serverStatus>
					<siteVersion>$siteVersion</siteVersion>
					<database>$databaseStatus</database>
			</serverStatus>
			<username>$loginName</username>
			<organization>$userOrganization</organization>
		</status>";
		
		exit;

/*
	Query the database object for its status
*/

function GetDatabaseStatus()
{
	$returnStatus = "";
	
	$db = systemData::GetInstance();

	if($db)
	{
		$returnStatus = $db->GetStatus();
	}
	else
	{
		/*
			Send a raw message. Something is seriously amiss.
		*/
		$returnStatus = "invalid object";
	}
	
	return $returnStatus;
}

?>