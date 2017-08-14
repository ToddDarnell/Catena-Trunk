<html>
	<head>
		<title>Catena Test Setup Page</title>
	</head>	
	<body background="backgroundGrayTexture.gif">
<?php
require_once("../classes/class.organization.php");
require_once("../classes/class.systemData.php");
require_once("../classes/class.user.php");

/*--------------------------------------------------------------------------
	This file sets up conditions for testers to execute specific test cases.
----------------------------------------------------------------------------*/
    $userId = $g_oUserSession->GetUserID();
	$action = "";
	$strOrganization = "";
	$strRight = "";

	foreach($_GET as $fieldName => $val)
	{
		$fieldName = strtolower($fieldName);
		if(strlen($val))
		{
			switch($fieldName)
			{
				case "action":
					$action = strtolower($val);
					break;
				case "organization":
					$strOrganization = $val;
					break;
				case "right":
					$strRight = $val;
					break;
			}
		}
	}

	switch($action)
	{
		case 'setorg':
			SetOrg($userId, $strOrganization);
			break;
		case 'setright':
			SetRight($userId, $strRight, $strOrganization);
			break;
		case 'removeright':
			RemoveRight($userId, $strRight, $strOrganization);
			break;
		case 'removeallrights':
			RemoveAllRights($userId);
			break;
		case 'createmessages':
			CreateMessages();
			break;
		case 'showmyinfo':
			ShowMyInfo($userId);
			break;
		case 'toggleactive':
			ToggleActive($userId);
			break;
		case 'testsetup':
			TestSetup();
			break;
		default:
			showCommandLine();
			break;
	}
	echo ("<br><br><A HREF='setup.php#Actions'>Back to Actions List</a><BR>");
	echo ("<A HREF='http://".$_SERVER['SERVER_NAME']."'>Return to ".$_SERVER['SERVER_NAME']."</a><br><br>");

//--------------------------------------------------------------------------
/**
	\brief
		Show Command Line displays help text for users. 
*/
//--------------------------------------------------------------------------
function ShowCommandLine()
{	
	DefaultMessage_displayOptions();

	ToggleActive_displayOptions();
	
	CreateMessages_displayOptions();
	
	TestSetup_displayOptions();
}

/*--------------------------------------------------------------------------
	Print Line formats text for user messages. 
----------------------------------------------------------------------------*/
function printLine($strMessage)
{
	echo $strMessage."<BR>";
}

/*--------------------------------------------------------------------------
	Default message options
----------------------------------------------------------------------------*/
function DefaultMessage_displayOptions($strMessage = "")
{
	if(!strlen($strMessage))
	{
		/*--------------------------------------------------------------------------
			Show the abreviated command used by the "command line"
				- Also set up the Anchor points to leap to each 
				  action.
		----------------------------------------------------------------------------*/
		
		echo "<H1>Catena Test Setup</H1>";			

		$strDisplay =  "This script sets up conditions for testers to execute specific test cases.
						<br>
						<br>
						<a name='Actions'></a><b>Actions: (Click to jump to a specific action)</b>
						<br>
						<a href = 'setup.php?action=setOrg'>Set Organization</a>
						<br>
						<a href = 'setup.php?action=setright'>Set Right</a>
						<br>
						<a href = 'setup.php?action=removeright'>Remove a Right</a>
						<br>
						<a href = 'setup.php?action=removeallrights'>Remove All Rights</a>
						<br>
						<A HREF = '#ToggleActive'>Toggle Active</a>
						<br>
						<A HREF = '#CreateMessages'>Create Messages</a>
						<br>
						<a href = 'setup.php?action=showmyinfo'>Show My Info</a>
						<br>
						<a href = '#TestSetup'>Setup Test Site</a>
						<br>
						<a href = 'newmodule.php'>Add a new Module</a>
						<br>
						<br>
						<hr>
						<br>";
		
		echo $strDisplay;
		return true;
	}
};

/*--------------------------------------------------------------------------
	Set org options
----------------------------------------------------------------------------*/
function SetOrg_displayOptions($strMessage = "")
{
	$server = $_SERVER['SERVER_NAME'];
	if(strlen($strMessage))
	{
		echo "<H3>Notice: $strMessage</H3>";
	}
	
	/*--------------------------------------------------------------------------
		Show the extended message when an error is detected
	----------------------------------------------------------------------------*/	
	$strDisplay = "<H1>SetOrg</H1>
					Allows you to assign yourself to an organization by name.
					<BR>
					<H4>parameters</H4>
					<b>organization</b> the name of the organization you want to be put in.
					<br><br>";

	echo $strDisplay;
	
	/*--------------------------------------------------------------------------
		Now display all valid organizations
	----------------------------------------------------------------------------*/
	$db = systemData::GetInstance();
	
	printLine("<b>Organizations</b><br>");

	$arOrgs = $db->Select("SELECT * FROM tblOrganization ORDER BY org_Short_Name");
	
	foreach($arOrgs as $org)
	{
		printLine("<a href = '".$_SERVER['REQUEST_URI']."&organization=".$org['org_Short_Name']."'>".$org['org_Short_Name']."</a>&nbsp ".$org['org_Long_Name']);
	}
};
//--------------------------------------------------------------------------
/**
	\brief
		Display the notifications for the rights options
	\param strMessage
		The message to display
	\param iDisplayType
		The type of sub items to display.
		-	0	none
		-	1	rights
		-	2	organizations
		
	\return
*/
//--------------------------------------------------------------------------
function SetRight_displayOptions($strMessage = "", $iDisplayType = 0)
{
	$server = $_SERVER['SERVER_NAME'];
	if(strlen($strMessage))
	{
		echo "<H3>Notice: $strMessage</H3>";
	}
	
	/*--------------------------------------------------------------------------
		Show the extended message when an error is detected
	----------------------------------------------------------------------------*/
	$strDisplay = "<H1>SetRight</H1>
					Allows you to assign yourself a specific right. 
					<H4>parameters</H4>
					<b>right</b> The name of the right you want to be assigned.
					<BR>
					<b>organization</b> The name of the organization you want assigned to the right.";
	
	echo $strDisplay;
	
	/*--------------------------------------------------------------------------
		Now display all valid rights
	----------------------------------------------------------------------------*/
	$db = systemData::GetInstance();
	
	if($iDisplayType == 1)
	{
		echo "<H3>Rights</H3>";
		$arRights = $db->Select("SELECT * FROM tblRight ORDER BY right_Name");
		
		foreach($arRights as $right)
		{
			printLine("<a href = '".$_SERVER['REQUEST_URI']."&right=".$right['right_Name']."'>".$right['right_Name']."</a>&nbsp ".$right['right_Description']);
		}
	}
	
	if($iDisplayType == 2)
	{
		echo "<H4>Organization</H4>";
		$arOrgs = $db->Select("SELECT * FROM tblOrganization ORDER BY org_Short_Name");
		
		foreach($arOrgs as $org)
		{
			printLine("<a href = '".$_SERVER['REQUEST_URI']."&organization=".$org['org_Short_Name']."'>".$org['org_Short_Name']."</a>&nbsp ".$org['org_Long_Name']);
		}
	}
};

/*--------------------------------------------------------------------------
	Remove right options
----------------------------------------------------------------------------*/
function RemoveRight_displayOptions($strMessage = "")
{
	$server = $_SERVER['SERVER_NAME'];

	if(strlen($strMessage))
	{
		echo "<H3>Notice: $strMessage</H3>";
	}
	
	/*--------------------------------------------------------------------------
		Show the extended message when an error is detected
	----------------------------------------------------------------------------*/
	$strDisplay = "<H1>RemoveRight</H1>
					Allows you to remove a specific assigned right.
					<BR>
					<H4>Rights</H4>";

	echo $strDisplay;
};
/*--------------------------------------------------------------------------
	Toggle Active options
----------------------------------------------------------------------------*/
function ToggleActive_displayOptions($strMessage = "")
{
	$server = $_SERVER['SERVER_NAME'];
	if(!strlen($strMessage))
	{
		/*--------------------------------------------------------------------------
			Show the abreviated command used by the "command line"
		----------------------------------------------------------------------------*/

		$strDisplay = "	<a name='ToggleActive'></a><b>Toggle Active</b> <br><br> 
						Allows you to toggle your status from active to inactive or vice versa.
						<br><br>
						- When you toggle to Inactive you are placed in the AFU (All Former Users)
						  Organization, your account is set to inactive, and all of your rights 
						  are removed.
						<br><br>
						- Toggling to active simply sets your account back to active. You will 
						still need to assign yourself to an organization and give yourself rights.
						<br>
						<br>
						<a href = 'setup.php?action=toggleactive'>Toggle active status</a>
						<BR>
						<BR>
						<A HREF='#Actions'>Back to Actions List</a><br><br><hr><br>";
		
		echo $strDisplay;
		return true;
	}
};

/*--------------------------------------------------------------------------
	Create messages options
----------------------------------------------------------------------------*/
function CreateMessages_displayOptions($strMessage = "")
{
	$server = $_SERVER['SERVER_NAME'];
	if(!strlen($strMessage))
	{
		/*--------------------------------------------------------------------------
			Show the abreviated command used by the "command line"
		----------------------------------------------------------------------------*/

		$strDisplay = "	<a name='CreateMessages'><b>Create Messages</b></a>
						<br>
						<br> 
						Makes specific messages to test Message Board functionality:
						<br><br>
						- A message with a post date of January 2006 is entered 
						for STO. This will trigger the Unread Inform Email when 
						the tester views a message for the first time provided 
						that there is someone with Message Board Admin rights 
						assigned for STO or one of its child organizations or 
						if a user possesses Global Admin Rights.
						<br><br>
						- Twenty messages with a creation date of 'Yesterday', no 
						expiration date, and priority set to high will be created. 
						The tester can then verify that on the Message Board Main 
						screen the random reminders are displayed in random order 
						and in groups of five. (Ten if there are no new messages, 
						five if there are new messages.)
						<br><br>
						- A message with an expiration date of 'Yesterday' will be 
						created. The tester can then go to message main where they 
						will see the expired message. When they go to the Message 
						Search screen and trigger a search, the message will not 
						show up, and going back to the message main screen will 
						show that the message is gone, as search triggers the 
						'Purge expired messages' function.
						<br><br>
						<a href = 'setup.php?action=createmessages'>Create Messages</a>
						<br>
						<br>
						<A HREF='#Actions'>Back to Actions List</a><br><br><hr><br>";
		
		echo $strDisplay;
		return true;
	}
};
/*--------------------------------------------------------------------------
	Set Org allows the tester to assign themselves to an organization by name.
	When they set an org, they will not lose their rights, but their org assignment
	will switch (So a user cannot be assigned to two orgs at once.) 
----------------------------------------------------------------------------*/
function SetOrg($userId, $strOrganization)
{
	$db = systemData::GetInstance();
	$orgId = GetOrgID($strOrganization);
	$oUserContainer = cUserContainer::GetInstance();
	
	$oUser = $oUserContainer->GetUser($userId);
	
	if(!isset($oUser))
	{
		SetOrg_displayOptions("Invalid user.");
		return false;
	}
	
	$strName = $oUser->GetName();
	
	if(!$oUser->IsActive())
	{
		SetOrg_displayOptions("Your account is inactive. You cannot be assigned 
		to an organization.<br>Please activate your account in order to proceed.");
		return false;
	}
	
	if($orgId < 0)
	{
		SetOrg_displayOptions("Select an organization.");
		return false;
	}
	
	$result = $oUser->SetField($oUser->field_Organization, $orgId);
	
	if($result == 1)
	{
		echo ("$strName's ($userId) organization was set to $strOrganization<br><br>");
	}
	else
	{
		echo ("$strName's organization WAS NOT set to $strOrganization because same organization is already assigned.<br><br>");
	}

	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
		Set Right adds a single right by name for the logged in user (only).
		By running this function, the tester can assign themselves a
		specific right.
	\param userId
			The database level user id to assign the right to.
	\param strRight
			The right to assign to the user.
	\param strOrganization
			The organization the right is scoped for.
	\return
		-	true
				The user was assigned the requested right.
		-	false
				The user was not assigned the requested right.
	\note
		The user is not permitted to assign themselves the
		"System Global Admin" right. 
*/
//--------------------------------------------------------------------------
function SetRight($userId, $strRight, $strOrganization)
{
	$db = systemData::GetInstance();
	$oRights = rights::GetInstance();
	$oUser = cUserContainer::GetInstance();
	$rightId = GetRightID($strRight);
	$orgId = GetOrgID($strOrganization);
	$userName = $oUser->GetName($userId);

	/*--------------------------------------------------------------------------
		-	Make sure the user name is valid.
		-	Make sure the user is active.
		-	Make sure the right is valid.
		-   Don't allow Global Admin right.
		- 	Make sure the user assigned an organization 
			to the right if one is required. If they 
			tried to assign an organization and the right
			does not require one, also inform them of this.
		-	Assign the right.	
	----------------------------------------------------------------------------*/
	if(!$oUser->IsActive($userId))
	{
		SetRight_displayOptions("Your account is inactive. You cannot be assigned rights. 
		<br>Please activate your account in order to proceed.");
		return false;
	}
	
	if($userId < 0)
	{
		SetRight_displayOptions("Invalid user.");
		return false;
	}

	if($rightId < 0)
	{
		SetRight_displayOptions("Select a right.", 1);
		return false;
	}
	
	/*--------------------------------------------------------------------------
		Check if the right does or doesn't need an organization assigned to it
	----------------------------------------------------------------------------*/
	$rightRecord = $oRights->Get($rightId);
	
	if($rightRecord['right_UseOrg'] == 1)
	{
		if($orgId < 0)
		{
			SetRight_displayOptions("Select an organization.", 2);
			return false;
		}
	}
	
	if($rightRecord['right_UseOrg'] == 0)
	{
		if($orgId > 0)
		{
			SetRight_displayOptions("This right does not require an organization.");
			return false;
		}
	}
	
	$arInsert = array();
	$arInsert['account_ID'] = $userId;
	$arInsert['account_type'] = 0;

	$arInsert['access_ID'] = $rightId;
	$arInsert['org_ID'] = $orgId;

	$result = $db->insert('tblAssignedRights', $arInsert);
	
	if($result == 0)
	{
		SetRight_displayOptions("$userName has not been assigned the $strRight right for $strOrganization.");
		return false;
	}

	if(strlen($strOrganization ))
	{
		echo("$userName has been assigned the $strRight right for $strOrganization.");
	}
	else
	{
		echo("$userName has been assigned the $strRight right.");
	}
	
	return true;
}

/*--------------------------------------------------------------------------
	Remove Right removes a single right by name for the logged in user (only). 
	By running this function, the tester can remove a specific assigned right. 
----------------------------------------------------------------------------*/
function RemoveRight($userId, $strRight, $strOrganization)
{
	$db = systemData::GetInstance();
	$rightId = GetRightID($strRight);
	$orgId = GetOrgID($strOrganization);
	$oUser = cUserContainer::GetInstance();
	$userName = $oUser->GetName($userId);

	$sql = "DELETE FROM tblAssignedRights WHERE account_ID = $userId AND account_type = 0 AND access_ID = $rightId AND org_ID = $orgId;";
	
	if($userId < 0)
	{
		RemoveRight_displayOptions("Invalid user.");
		return false;
	}

	if($rightId < 0)
	{
		RemoveRight_displayOptions("Select a right.");
		ShowAssignedRights($userId);
		return false;
	}
	
	if($db->sql_delete($sql))
	{
		echo ("$userName's $strRight right was removed.");
	}
	else
	{
		echo ("The $strRight right WAS NOT removed because the right was not assigned to $userName.");
	}
}

/*--------------------------------------------------------------------------
	Remove All Rights removes all of the rights of the logged in user (only). 
	By running this function, the tester can remove all of their assigned rights. 
----------------------------------------------------------------------------*/
function RemoveAllRights($userId)
{
	$db = systemData::GetInstance();
	$oUser = cUserContainer::GetInstance();
	$userName = $oUser->GetName($userId);

	$sql = "DELETE FROM tblAssignedRights WHERE account_ID = $userId AND account_type = 0;";
	if($db->sql_delete($sql))
	{
		echo ("All rights have been removed for $userName.<br><br>");
	}
	else
	{
		echo ("No rights have been removed because no rights were assigned.<br><br>");
	}
}

/*--------------------------------------------------------------------------
	ToggleActive toggles the user's Active status from Active to Inactive
	and vice versa. 
		-	Switching to inactive places the user in the AFU organization
			and removes all of their rights.
----------------------------------------------------------------------------*/
function ToggleActive($userId)
{
	$oUserContainer = cUserContainer::GetInstance();
	$oUser = $oUserContainer->GetUser($userId);
	
	$userName = $oUser->GetName();

	if($oUser->IsActive($userId))
	{
		SetOrg($userId, "AFU");
		RemoveAllRights($userId, 1);
		$oUser->SetField("user_Active", 0);
		echo ("$userName's account has been disabled.");
	}
	else
	{
		$oUser->SetField("user_Active", 1);
		echo ("$userName's account has been enabled.");
	}
}

/*--------------------------------------------------------------------------
	Create Messages makes specific messages to test Message Board functionality:
	
	- 	A message with a post date of January 2006 is entered for STO. This 
		will trigger the Unread Inform Email when the tester views a message
		for the first time provided that someone with Message Board Admin rights
		asssigned for STO or one of it's child organizations or if a user 
		possesses Global Admin Rights. 
		
	-   Twenty messages with a creation date of "Yesterday", no expiration date, and
		priority set to high will be created. The tester can then verify that on the 
		Message Board Main screen the random reminders are displayed in random order 
		and in groups of five. (Ten if there are no new messages, five if there are 
		new messages.)
		
	-	A message with an expiration date of "Yesterday" will be created. The 
		tester can then go to message main where they will see the expired message.
		When they go to the Message Search screen and trigger a search, the message
		will not show up, and going back to the message main screen will show that 
		the message is gone, as search triggers the "Purge expired messages" function.
----------------------------------------------------------------------------*/
function CreateMessages()
{
	$db = systemData::GetInstance();
	$yesterday = date('Y-m-d', mktime(0, 0, 0, date("m") , date("d") - 1, date("Y")));

	/*--------------------------------------------------------------------------
		Create the 20 random reminders.
	----------------------------------------------------------------------------*/
	for ($i = 1; $i <= 20; $i++)
	{
		$sql = "INSERT INTO 
					`tblMessage` 
					( `msg_ID` , `msg_subject` , `msg_body` , `msg_create_date` , `user_ID` , `msg_exp_date` , `org_ID` , `msgPri_ID` ) 
				VALUES 
					(NULL , 'Random Reminder $i', 'Random Reminder $i', '$yesterday', '18', '', '44', '2')";
		$db->sql_Insert($sql);
	};
	
	/*--------------------------------------------------------------------------
		Create the expired message and the unread message.
	----------------------------------------------------------------------------*/
	$sql = "INSERT INTO 
				`tblMessage` 
				( `msg_ID` , `msg_subject` , `msg_body` , `msg_create_date` , `user_ID` , `msg_exp_date` , `org_ID` , `msgPri_ID` ) 
			VALUES 
				(NULL , 'Old Unread Message Testing (To STO)', 'This unread message should cover everyone...', '2006-01-01', '18', '', '44', '1'),
				(NULL , 'Expired Message', 'Should be autopurged on search...', '2006-01-01', '18', '$yesterday', '44', '1');";
	
	$db->sql_Insert($sql);
	
	echo ("<b>Messages created:</b> Now test Unread Inform email, Random reminders, and Expired Message deletion.");
};

/*--------------------------------------------------------------------------
	This function displays onscreen all of the user's assigned rights and what 
	organization they are assigned to.  
----------------------------------------------------------------------------*/
function ShowMyInfo($userId)
{
	/*--------------------------------------------------------------------------
		First get the organization the user is assigned to.
	----------------------------------------------------------------------------*/
	$db = systemData::GetInstance();
	$oUser = cUserContainer::GetInstance();
	$userName = $oUser->GetName($userId);

	$sql = "SELECT tblOrganization.org_Short_Name 
			FROM tblOrganization
			LEFT JOIN tblUser
			ON
		    tblOrganization.org_ID = tblUser.org_ID  
			WHERE tblUser.user_ID = $userId";
	
	$arOrg = $db->select($sql);
	
	if($oUser->IsActive($userId))
	{
		printLine("$userName's account is: <b>Active</b><br>");
	}
	else
	{
		printLine("$userName's account is: <b>Inactive</b><br>");
	}
	
	foreach($arOrg as $org)
	{
		printLine("$userName is assigned to: <b>".$org['org_Short_Name']."</b>");
	}
	
	/*--------------------------------------------------------------------------
		Now get the user's assigned rights and the organizations those rights
		are assigned for. If a specific organization is not assigned to a right, 
		output "all organizations".
	----------------------------------------------------------------------------*/
	$serverName = $_SERVER['SERVER_NAME'];
	printLine('<br><b>To view rights assigned by organizations, click the "Return to ' . $serverName . '" link, select "Administration" from the navigation Menu, and select "View Rights".</b><br>');
	ShowAssignedRights($userId);
};
//--------------------------------------------------------------------------
/**
	\brief
		Show all rights assigned to the passed in user
	\param userId
		The id of the user for the rights are being displayed.
*/
//--------------------------------------------------------------------------
function ShowAssignedRights($userId)
{
	$oUser = cUserContainer::GetInstance();
	$userName = $oUser->GetName($userId);
	$db = systemData::GetInstance();
	
	$sql = "SELECT
				tblRight.right_Name
				, tblAssignedRights.org_ID
				, COALESCE( tblOrganization.org_Short_Name, 'all organizations') 
			FROM tblRight
			LEFT JOIN tblAssignedRights 
			ON 
			tblRight.right_ID = tblAssignedRights.access_ID
			LEFT JOIN tblOrganization 
			ON 
			tblAssignedRights.org_ID = tblOrganization.org_ID
			WHERE
				tblAssignedRights.account_ID = $userId
				AND tblAssignedRights.account_type = 0";
	
	$arRights = $db->select($sql);
	
	if($db->select($sql))
	{
		echo "$userName is assigned the following rights (click to remove):<br>";

		foreach($arRights as $right)
		{
			printLine("<a href = 'setup.php?action=removeright&right=".$right['right_Name']."&organization=".$right['org_ID']."'>".$right['right_Name']."</a> for ".$right["COALESCE( tblOrganization.org_Short_Name, 'all organizations')"]);
		}
	}
	else
	{
		echo ("<br>$userName is not assigned any rights.");
	}
}
//--------------------------------------------------------------------------
/**
	\brief
		Toggle Active options
	\param strMessage
		The message to display if there's an error.
	\return
*/
//--------------------------------------------------------------------------
function TestSetup_displayOptions($strMessage = "")
{
	$server = $_SERVER['SERVER_NAME'];
	if(!strlen($strMessage))
	{
		$strDisplay = "	<a name='TestSetup'><B>Test Setup</B></a>
						<BR>
						<BR>
						Set up the default test server state.
						Perform this only ONCE when the server is created. Do not
						do it afterwards as this may affect tester status.
						<br>
						<br>
						<a href = 'setup.php?action=testsetup'>Setup Test Site</a></b><br><br>
						<A HREF='#Actions'>Back to Actions List</a><br><br><hr><br>";
		
		echo $strDisplay;
		return true;
	}
};
//--------------------------------------------------------------------------
/**
	\brief
		Sets the initial groups of testers and default rights
*/
//--------------------------------------------------------------------------
function TestSetup()
{
	SetOrg(12, "STO");			//Anuschka
	SetOrg(11, "STG");			//Bob
	SetOrg(18, "ETS");			//Todd
	SetOrg(17, "STE");			//Tony
	SetOrg(25, "Guest");		//Dave
	SetOrg(100, "Guest");		//Artie
	SetOrg(13, "Guest");		//Denise
	SetOrg(32, "IPT");			//George
	SetOrg(22, "RDT");			//Simon
	SetOrg(52, "IVT");			//Troy
	
	RemoveAllRights(25);		//Dave
	RemoveAllRights(100);		//Artie
	RemoveAllRights(13);		//Denise
}

		?>
	</body>
</html>