<?

	/*
		This is the main Catena page. This will bring up the portal which the user has access to.
		The user name should be available at this point so grab it
		and put it into the session information.
		Note, all accounts at this point have no passwords
	*/

	require_once("../classes/common.php");
	
	if(!isset($_POST['accountname']))
	{
		redirect("..");
	}
	
	/*
		Normally, requirement files are located at the head of the file,
		however since these files manipulate the header we can only
		use them after the account name values have been verified.
		If the account name is not set, we redirect the user back
		to the main page, hence the elipses--and no header information
		can be sent before that point.
	*/

	require_once('../classes/include.php');

	if(!$g_oUserSession->Login($_POST['accountname'], ""))
	{
		$strAccount = $_POST['accountname'];
		echo "Error logging in this account [$strAccount]:" . $g_oUserSession->results->GetMessage();
		die();
	}

	/*
		Set the site version info here so we can 
		check it later against the server.
	*/

	$siteVersion = $cfg['site']['version'];
	$siteName = $cfg['site']['name'];
	$siteType = $cfg['site']['type'];
	ClearCache();
?>
<html>
	<head>
		<script>
		<?php
		echo "var global_siteVersion = '$siteVersion';";
		echo "var global_siteType = '$siteType';";
		?>
		</script>
		
		<link rel="stylesheet" type="text/css" href="../styles/page.css" />
		<link rel="stylesheet" type="text/css" href="../styles/spellchecker.css" />
		
		<!--[if IE 6]>
		<link rel="stylesheet" type="text/css" href="../styles/ie.css" />
		<![endif]-->

	
		<!--	Framework level javascript code -->
	
		<script type="text/javascript" src="../scripts/catenaApp.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_zxml.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_server.js"></script>
		
		<script type="text/javascript" src="../scripts/framework/system_popup.js"></script>

		<script type="text/javascript" src="../scripts/framework/system_debug.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_Listener.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_flakes.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_common.js"></script>
		
		<!-- Application functionality -->
		<script type="text/javascript" src="../scripts/framework/system_ElementManager.js"></script>
		<script type="text/javascript" srC="../scripts/framework/system_Window.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_TabManager.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_AppScreen.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_SortTable.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_SearchScreen.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_tree.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_Dialog.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_Feedback.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_spellcheck.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_spellcheckbase.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_tooltip.js"></script>
		
		<!-- Menuing System -->
		<script type="text/javascript" src="../scripts/framework/system_menu.js"></script>
		
        <script type="text/javascript" src="../scripts/framework/system_list.js"></script>
        <script type="text/javascript" src="../scripts/framework/system_Links.js"></script>
        <script type="text/javascript" src="../scripts/framework/system_About.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_Colors.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_corners.js"></script>

		<script type="text/javascript" src="../scripts/framework/system_rights.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_RightGroupList.js"></script>
		
		<script type="text/javascript" src="../scripts/framework/system_orgList.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_userList.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_user.js"></script>
		
		<!--    The following are complex screen element classes -->
		<script type="text/javascript" src="../scripts/framework/system_Calendar.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_UserOrgSelection.js"></script>
		<script type="text/javascript" src="../scripts/framework/system_home.js"></script>

    </head>
	<body>
		<div id="divSiteTitle" title="The integrated website for Software Engineering and Testing"><? echo $siteName;?></div>
		<div id="divPageTitle"></div>
		<div id="divShortCuts"></div>
		<div id="divPageTitleBackground"></div>
        <div id="divNotice"></div>
		<div id="divContent">Loading Catena now....</div>

		<div id="TipLayer" style="visibility:hidden;position:absolute;z-index:1000;top:-100"></div>
		
		<iFrame id="iFileLoader" name="fileLoader" src="about:blank"></iFrame>
		<iFrame id="OffScreenPage" name="OffScreenPage" src="about:blank"></iFrame>
	</body>
</html>
