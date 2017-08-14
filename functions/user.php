<?
/**

	\page user_actions_page User Actions
	performs the server side functionality for user information requests.
	
	To execute the user functionality, call the php page like the following:
	\code
		http://catena.echostar.com/functions/user.php?action=settings		
	\endcode
	
	The above example calls the server side script to retrieve an XML listening of the
	user variables 
	
	
		\section user_actions Actions
			The following actions may be queried via the client interface.
			-	\ref getlist
				\par
					Retrieves an XML list of users
			-	\ref settings
				\par
					Retrieve the settings of the currently logged in user.
			-	\ref modifypreferences
				\par
					Sets user preferences
			-	\ref modifysettings
				\par
					Modify a user's account settings.
			-	\ref setorganization
				\par
					Set a user's organization
			-	\ref setemail
				\par
					Set a user's email address
			-	\ref setactive
				\par
					Set a user's active status. This will change the user's
					current organization if disabled.
					
	\code
	//	The following code retrieves the account
	// details for user "NT.login"
	
	$arServerValues = Array();
	
	$arServerValues['location'] = "functions/user";
	$arServerValues['action'] = "getlist";
	$arServerValues['name'] = "NT.login";
		
	$sFile = catena_ServerGet($arServerValues);
		
	//	$sFile now contains the results from the server call.
	//	This may be a simple text block or an XML block.
	\endcode
*/

/**
	\page user_action_details User Action Details
		\section getlist
			\par
				Retrieves an XML list containing one or more user account details.
				One or more of the following variables may be used to filter the
				list of returned user accounts.
			\param id
				-	The id of the user account to return. If the exact record is not found
					then no records are returned (in C17). Currenty (C15), if the specific
					id is not found, then all records are returned.
			
			\param name
				-	The 20 digit 'account' string name of the user.
					If the exact name is not found in the database, the passed in name is
					used as a partial string.
				-	For example, if the user 'NT.Login' is passed
					in and there's a user with this name only the one record will be returned.
					However, if there is no user with the exact name, then all users who have 
					the string 'NT.Login' in their name will be returned.
			
			\param organization
				-	The organization id or organization string name. All users in the organization
					and child organizations will be returned unless additional filters are submitted.
			
			\param limit
				-	Limit the number of results to the specified number.
			
			\param inactive
				-	set to 'true' if inactive account users should be included in the list.
				-	The default is to not include inactive accounts.
			
			\return
			
				an XML list formated in the following manner:
				
			\code
				<list>
					<element>
						<user_ID>1</user_ID>
						<org_ID>49</org_ID>
						<user_EMail>some@email.com</user_EMail>
						<user_Name>NT.login</user_Name>
						<user_Badge_ID/>
						<user_theme>0</user_theme>
						<user_Create_Date>2006-08-02</user_Create_Date>
						<user_Active>1</user_Active>
						<user_UseFlakes>0</user_UseFlakes>
						<message_delay>10</message_delay>
						<close_notice>0</close_notice>
						<user_last_connect>2007-05-30</user_last_connect>
						<org_Short_Name>ESC</org_Short_Name>
					</element>
				</list>
			
			\endcode
		\section settings
				-	Retrieve the settings of the currently logged in user.
		\section modifypreferences
				-	Sets user preferences
		\section modifysettings
				-	This functionality modifies an account settings, which are
				different than a user's preferences.
		\section setorganization
				-	Set a user's organization
		\section setemail
				-	Set a user's email address
		\section setactive
				-	Set a user's active status. This will change the user's
					current organization if disabled.
*/
	require_once('../classes/include.php');
	ClearCache();

	$action = "";
	$theme = -1;
	$user = "";
	$right = "";
	$strOrganization = "";
	$email = "";
	$id = -1;
	$active = "";
	$rightGroupId = -1;
	$messageDelay = -1;
	$closeNotice = true;
	$iFlakes = -1;
	
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch($fieldName)
			{
				case "assignedgroup":
					$assignedGroupId = $val;
					break;
				case "group":
					$rightGroupId = $val;
					break;
				case "id":
					$id = $val;
					break;
				case "email":
					$email = $val;
					break;
				case "user":
					$user = $val;
					break;
				case "theme":
					$theme = $val;
					break;
				case "name":
					$user = $val;
					break;
				case "right":
					$right = $val;
					break;
				case "organization":
					$strOrganization = $val;
					break;
				case "active":
					$active = $val;
					break;
				case "action":
					$action = strtolower($val);
					break;
				case "useFlakes":
					$iFlakes = $val;
					break;
				case "messageDelay";
					$messageDelay = $val;
					break;
				case "closeNotice";
					$closeNotice = $val;
					break;
			}
		}
	}

	if(strlen($action) == 0)
	{ 
		/*
			action MUST be set.
		*/
		exit;
	};
	
	/*
		We made the list lower case. All values
		in the switch($action) must be lower case
	*/
	switch($action)
	{
		case "getlist":
			/*
				Retrieves an XML list of users
			*/
			GetUserList();
			break;
		case "settings":
			/*
				Retrieve settings for the logged in user.
			*/

			$oUser = cUserContainer::GetInstance();
			if($id < 0)
			{
				$id = $g_oUserSession->GetUserID();
			}
			$oUser->GetSettings($id);
			break;
		case "modifypreferences":
			/*
				Allows a user to modify their own preferences.
			*/
			$oUser = cUserContainer::GetInstance();
			$oUser->SetPreferences($g_oUserSession->GetUserID(), $email, $theme, $iFlakes, $messageDelay, $closeNotice);
			$oUser->results->Send();
			break;
		case "setorganization":
			$oUser = cUserContainer::GetInstance();
			$oUser->SetOrganization($user, $strOrganization);
			$oUser->results->Send();
			break;
		case "setemail":
			$oUser = cUserContainer::GetInstance();
			$oUser->SetEMail($user, $email);
			$oUser->results->Send();
			break;
		case "setactive":
			/*
				Sets the active status of a user's account
			*/
			$oUser = cUserContainer::GetInstance();
			
			$enable = $active == "true" ? true : false;
			$oUser->EnableAccount($user, $enable);
			$oUser->results->Send();
			break;
		case "get_user_organization":
			/*
				Return the organization the 
				user is assigned to. 
			*/				
			$oUser = cUserContainer::GetInstance();
			
			$oXML = new XML;
			
			$arOrg = $oUser->GetOrganization($user);
			
			$oXML->serializeElement($arOrg, "element");
			$oXML->outputXHTML();
			break;
		default:
			$g_oUserSession->results->Set('false', "Server side functionality not implemented.");
			$g_oUserSession->results->Send();
			break;
	}

//--------------------------------------------------------------------------
/**
	\brief
		retrieves a list of users based upon the filters passed in
	\return XML 
		An XML formatted list
*/
//--------------------------------------------------------------------------
function GetUserList()
{
	$oUser = cUserContainer::GetInstance();
	$oOrganization = organization::GetInstance();
	
	$id = -1;
	$name = "";
	$strOrg = "";
	$useInactive = false;
	$iLimit = 0;

	/*
		Retrieve the user variables
	*/	
	if(isset($_GET['id']))
	{
		$id = $_GET['id'];
	}
	
	if(isset($_GET['name']))
	{
		$name = $_GET['name'];
	}

	if(isset($_GET['organization']))
	{
		$strOrg = $_GET['organization'];
	}

	if(isset($_GET['limit']))
	{
		$iLimit = $_GET['limit'];
	}
	
	if(isset($_GET['inactive']))
	{
		$useInactive = ($_GET['inactive'] == 'true');
	}

	/*
		Set up the user active/inactive query as it's always
		part of the query.
	*/
	
	if($useInactive == true)
	{
		$strActive = "(tblUser.user_Active = 1 OR tblUser.user_Active = 0)";
	}
	else
	{
		$strActive = " tblUser.user_Active = 1";
	}

	/*
		The following sql string
		builds a list of documents. All of the numbered fields, docType_ID, org_ID,
		etc are aliased with their name.
		The next part of the process is including the filters based upon what the user requested
	*/

	$strSQL = "
		SELECT tblUser.*, tblOrganization.org_Short_Name
		FROM
			tblUser
			LEFT JOIN tblOrganization
				ON tblUser.org_ID = tblOrganization.org_ID
		WHERE $strActive";
	
	/*
		Try to find a record which has the matching requirements from the user
	*/
	
	if($id != -1)
	{
		$strSQL .= " AND tblUser.user_ID = $id";
	}
	
	if(strlen($name) > 0)
	{
		if($oUser->Exists($name))
		{
			$strSQL .= " AND tblUser.user_Name = '$name'";
		}
		else
		{
			$strSQL .= " AND tblUser.user_Name LIKE '%$name%'";
		}
	}
	
	if($strOrg != "")
	{
		$orgStartId = $oOrganization->GetID($strOrg);
		
		$strSQL .= " AND (tblUser.org_ID = $orgStartId";
			
		$arChildOrgs = $oOrganization->GetChildren($orgStartId);
		
		if(sizeof($arChildOrgs))
		{
			for($iOrg = 0; $iOrg < sizeof($arChildOrgs); $iOrg++)
			{
				$orgId = $arChildOrgs[$iOrg]['org_ID'];
				
				$strSQL .= " OR tblUser.org_ID = $orgId";
			}
		}
		$strSQL .= ")";
	}
	
	
	$strSQL .= " ORDER BY tblUser.user_Name";
	
	if($iLimit > 0)
	{
	
		$strSQL .= " LIMIT $iLimit";
	}
	
	//die($strSQL);
	
	OutputXMLList($strSQL, "list", "element");
}
?>