<?
/**
	
	\page user_access User Access
		Performs the server side functionality for user rights management.
		This is the method for calling the code directly. To access
		the functions internally, such as through modules, please
		see systemAccess.
	
	To access system rights functionality, call the php page like the following:
	
	\code
		http://catena.echostar.com/functions/systemAccess.php?action=user_has_right&user=first.last&right=SYSTEM_RightsAdmin&right_org=STG
	\endcode
	
	The above example calls the server side script to determine if the user "first.last" has the right "SYSTEM_RightsAdmin"
	for the "STG" organization.
	
	\include catena_common.php
	
	The following code performs this action in PHP when calling the catena server from a remote server.

	\code

	if(catena_HasRight("first.last", "Right Name", "Organization"))
	{
		echo "Has Right";
	}
	else
	{
		echo "does not have right";
	}
	\endcode
	
	The following code performs a right check when querying for user access when called within the Catena site.
	
	\code
	require_once('include.php');

	$oUserSession = userSession::GetInstance();

	if($oUserSession->HasRight("Right Name", "Right Org"))
	{
		echo "User has right";
	}
	\endcode
		
	\note
		Actions are case insensitive. The values of the data are dependant upon the field passed in. For example,
		passing in a group name for a new group will make that data case sensitive.
	
	\section user_access Actions
		The following actions may be queried via the user access interface.

	\section user_has_right
		\par
				Determines if a user has the requested right.
				
				-	First, check if the user has the right assigned directly.
					If the usr has the right, then check that the right has the
					required organization (this step is skipped if no organization
					is selected).
				
				-	If the right is not assigned directly, check each group assigned
					to the user. If a group has	the right, see if the right has
					the required organization. Continue until all groups assigned
					to the user are exhausted.

				-	Now look at the user's organization. Repeat the same steps used
					for validating the user. Does the organization have the right
					assigned directly. If not, check all groups assigned to the
					organization. If not found, then check each parent until
					the root organization "All" has been scanned.
		
				-	If the access is not found after this process, deny the user access.

		\param right
				The right name or id
		\param right_org
				The right organization. May be the organization name or id
		\return
			true/false||message

	\section assign_user_right
		\par
			Assign a right to a user.
		\param user
				The user name or id
		\param right
				The right name or id
		\param right_org
				The right organization. May be the organization name or id
		\return
			true/false||message
	
	\section remove_assigned_right
		\par
			Remove a right from a user. This only removes the explicitly
			defined rights. If the same right is assigned via a group
			or through an organization, the user will still have the access.
		\param right
			The id of the record in the assigned rights table.
		\return
				true/false||message

	\section assign_user_group
		\par
			Assign a group to a user.
		\param user
				The user name or id
		\param group
				The id of the group to assign to the user
		\return
			true/false||message

	\section remove_assigned_group
		\par
			Removes an assigned group from a user.
		\param group
				The record of the assigned group
	
	\section assign_org_right
		\par
			Assign a right to an organization.
		\param organization
				The organization name or id
		\param right
				The right name or id
		\param right_org
				The right organization. May be the organization name or id
		\return
			true/false||message

	\section assign_org_group
		\par
			Assigns a group to an organization
	
	\section get_user_rights_list
		\par
			Returns a list of rights assigned to a user. This includes only the explicitly defined
			rights, not the entire list of assigned rights.
		\param user
			The name or id of the user account to query.
		\return
			XML list

	\section get_user_groups_list
		\par
			Returns a list of groups assigned to a user.
			
		\return XML list

	\section get_assigned_orgs_list
		\par
			Returns a list of organizations assigned to a right explicitly assigned to a user.
			
		\param user [optional] By default the currently logged in user account is used, however
					any other user name may be used.
		
		\param right The right to retrive the organizations for.

	\section get_all_access_rights_list
		\par
			Retrieve a list of rights assigned to a user. This list of rights includes
			all rights assigned individually, through groups, and through organizations.

	\section get_owner_assigned_rights_list
		\param
			Retrieve a list of rights assigned to the currently logged in user.
			This list of rights includes all rights assigned individually,
			through groups, and through organizations.

	\section get_admin_available_list
		\par
			Retrieve available and assigned rights filtered through what the calling user has assigned to them.
	
	\section get_admin_groups_list
		\par
			These are groups a user may administrate, ie. modify/delete

	\section get_org_rights_list
		\par
			Retrieves a list of right assigned to a an organization.
	
	\section get_org_groups_list
		\par
			Retrieves a list of right assigned to a an organization.

	\section get_all_org_access_rights_list
		\par
			Retrieves the assigned rights and rights groups for the
			passed in organization.

	\section get_users_assigned_right
		\par
			Retrieves an XML list containing all of the users who have
			the the requested right/org combination.
		
		\param right
				The right name or id
		\param right_org
				The right organization. May be the organization name or id

		\return
			XML list containing the names of all users who have the right

	\section get_users_assigned_admin_org
	
		\par
			This list will create a list of all users who have
			the right assigned with the admin rights organization.
		
		\param user_info (optional)
			The user name/id to check against. If no user_info is
			submitted, the currently logged in user is checked.
		\param admin_right
			The right name or id which should be validated against.
		
		\param user_right
			The right the users should have validated against the admin right
		
		\note
			How this works is say user nt.login has the admin right of tf_admin
			for several organizations, and we want to get all users who have tf_tester
			for those organizations. We call this function and it returns
			all users who have tf_tester with one or more of the admin right's organization.

		\return
			XML list containing the names of all users who have user_right
			in one or more of the admin right's organization(s).
*/

	require_once('../classes/include.php');
	ClearCache();

	/*
		performs the server side functionality to determine if a user
		has a right/a group/ or the requested access.
	*/

	if(!isset($_GET['action']))
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
	
	$name = "";
	$description = "";
	$category = "";
	$id = "";
	$right_info = "";
	$right_org_info = "";
	
	$organization_info = "";
	$user_info = "";
	$group_info = "";
	$action = "";
	$admin_right_info = "";
	$user_right_info = "";
	
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
				
			switch($fieldName)
			{
				case "right":
					$right_info = $val;
					break;
				case "admin_right":
					$admin_right_info = $val;
					break;
				case "user_right":
					$user_right_info = $val;
					break;
				case "right_org":
					$right_org_info = $val;
					break;
				
				case "organization":
					$organization_info = $val;
					break;
				
				case "group":
					$group_info = $val;
					break;
				
				case "user":
					$user_info = $val;
					break;
				
				case "description":
					$description = $val;
					break;
				
				case "category":
					$category = $val;
					break;
				
				case "id":
					$id = $val;
					break;
				
				case "action":
					$action = strtolower($val);
					break;
			}
		}
	}
		
	$oSystemAccess = systemAccess::GetInstance();
	
	switch($action)
	{
		case "user_has_right":
			/*
				Checks to see if the user has the passed in right/org combination
			*/
			global $g_oUserSession;
			if($user_info != "")
			{
				$userId = $user_info;
			}
			else
			{
				$userId = $g_oUserSession->GetUserID();
			}
			
			$oSystemAccess->HasRight($userId, $right_info, $right_org_info);
			$oSystemAccess->results->Send();
			break;
		case "assign_user_right":
			/*
				Assign a right to a user
			*/
			$oSystemAccess->AssignUserRight($user_info, $right_info, $right_org_info);
			$oSystemAccess->results->Send();
			break;

		case "remove_assigned_right":
			/*
				Remove a right from a user.
				This is the assigned right id, not the right itself.
				This is the id of the record located in the assigned rights
				table.
			*/
			$oSystemAccess->RemoveRight($right_info);
			$oSystemAccess->results->Send();
			break;

		case "assign_user_group":
			/*
				Assign a right group to a user.
			*/
			$oSystemAccess->AssignUserGroup($user_info, $group_info);
			$oSystemAccess->results->Send();
			break;

		case "remove_assigned_group":
			/*
				Remove a right group from a user.
			*/
			$oSystemAccess->RemoveGroup($group_info);
			$oSystemAccess->results->Send();
			break;

		case "assign_org_right":
			/*
				Assigns a right/org to an organization
			*/
			$oSystemAccess->AssignOrgRight($organization_info, $right_info, $right_org_info);
			$oSystemAccess->results->Send();
			break;

		case "assign_org_group":
			/*
				Assigns a group to an organization
			*/
			$oSystemAccess->AssignOrgGroup($organization_info, $group_info);
			$oSystemAccess->results->Send();
			break;
			
		case "get_user_rights_list":
			/*
				Retrieves the assigned rights for the passed in user id.
				This includes only the rights. Not right groups
			*/
			$oXML = new XML;
			
			$arRights = $oSystemAccess->GetUserAssignedRights($user_info);
			
			$oXML->serializeElement($arRights, "element");
			$oXML->outputXHTML();
			break;

		case "get_user_groups_list":
			/*
				Returns the right groups assigned to the logged on user
			*/
			$oXML = new XML;
			
			$arRightGroups = $oSystemAccess->GetUserAssignedGroups($user_info);
			$oXML->serializeElement($arRightGroups, "element");
			$oXML->outputXHTML();
			break;

		case "get_assigned_orgs_list":
			/*
				return a list of organizations
				which are assigned to this right
			*/
			global $g_oUserSession;

			if($user_info != "")
			{
				$userId = $user_info;
			}
			else
			{
				$userId = $g_oUserSession->GetUserID();
			}

			$oXML = new XML;
			$arOrgs = $oSystemAccess->GetRightAssignedOrgs($userId, $right_info);

			$oXML->serializeElement($arOrgs, "element");
			$oXML->outputXHTML();
			break;
		case "get_all_access_rights_list":
			/*
				Retrieves the assigned rights and rights groups for the passed in user id.
			*/
			$oXML = new XML;
			
			$arRights = $oSystemAccess->GetAllUserAssigned($id);
			
			$oXML->serializeElement($arRights, "element");
			$oXML->outputXHTML();
			exit;

		case "get_owner_assigned_rights_list":
			/*
				Retrieves the assigned rights for the logged in user
			*/
			global $g_oUserSession;
			$userId = $g_oUserSession->GetUserID();
			
			$oSystemAccess->GetOwnerAssigned($userId);
			break;
		case "get_admin_available_list":
			/*
				GetAdminAssigned retrieves available and assigned rights
				filtered through what the calling user has assigned to them.
			*/
			if($oSystemAccess->GetAdminAvailable($name))
			{
				exit;
			}
			break;	
		case "get_admin_groups_list":
			/*
				These are groups a user may administrate, ie. modify/delete
				and assign to other users.
			*/
			global $g_oUserSession;
			$userId = $g_oUserSession->GetUserID();

			$oXML = new XML;
			$arGroups = $oSystemAccess->GetAdminGroups($userId);
			$oXML->serializeElement($arGroups, "element");
			$oXML->outputXHTML();
			exit;

		case "get_org_rights_list":
			/*
				Retrieves a list of right assigned to a an organization.
			*/
			$oXML = new XML;
			
			$arRights = $oSystemAccess->GetOrgAssignedRights($organization_info);
			
			$oXML->serializeElement($arRights, "element");
			$oXML->outputXHTML();
			break;

		case "get_org_groups_list":
			/*
				Retrieves a list of right assigned to a an organization.
			*/
			$oXML = new XML;
			
			$arRights = $oSystemAccess->GetOrgAssignedGroups($organization_info);
			
			$oXML->serializeElement($arRights, "element");
			$oXML->outputXHTML();
			break;

		case "get_all_org_access_rights_list":
			/*
				Retrieves the assigned rights and rights groups for the passed in organization
			*/
			$oXML = new XML;
			
			$arRights = $oSystemAccess->GetAllOrgAssigned($organization_info);
			
			$oXML->serializeElement($arRights, "element");
			$oXML->outputXHTML();
			exit;
		
		case "get_group_assigned_list":
			/*
				Retreive all of the users and organizations which
				have this right group assigned.
			*/
			global $g_oUserSession;
			$userId = $g_oUserSession->GetUserID();
			$oXML = new XML;
			$arGroups = $oSystemAccess->GetRightGroupAssigned($group_info);
			$oXML->serializeElement($arGroups, "element");
			$oXML->outputXHTML();
			break;
		case "get_users_assigned_admin_org":
			/*
				This list will create a list of all users who have
				the right assigned with the admin rights organization.
			*/
			global $g_oUserSession;
			if($user_info != "")
			{
				$userId = $user_info;
			}
			else
			{
				$userId = $g_oUserSession->GetUserID();
			}

			$oXML = new XML;
			
			$arRights = $oSystemAccess->UsersHaveAdminRightOrg($userId, $admin_right_info, $user_right_info);
			
			$oXML->serializeElement($arRights, "element");
			$oXML->outputXHTML();
			break;
		case "get_users_assigned_right":
			/*
				Retrievees a list of users who are assigned the right
			*/
			$oXML = new XML;
			
			$arRights = $oSystemAccess->UsersHaveRight( $right_info, $right_org_info);
			
			$oXML->serializeElement($arRights, "element");
			$oXML->outputXHTML();
			break;
		case "rightorg":
			$oXML = new XML;
			
			$arRights = $oSystemAccess->GetRightOrgs( $right_info, $right_org_info);
			
			$oXML->serializeElement($arRights, "element");
			$oXML->outputXHTML();
			break;
			
			

	}
?>