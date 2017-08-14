<?
	/*
		performs the server side functionality for right groups.
	*/

	require_once('../classes/include.php');
	ClearCache();

	if(!isset($_GET['action']))
	{ 
		/*
			action MUST be set.
		*/
		exit;
	}
	
	$group_info = "";
	$description = "";
	$category = "";
	$id = -1;
	$right = "";
	$organization = "";
	$action = "";
	
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch($fieldName)
			{
				case "group":
					$group_info = $val;
					break;
				case "description":
					$description = $val;
					break;
				case "organization":
					$organization = $val;
					break;
				case "id":
					$id = $val;
					break;
				case "right":
					$right = $val;
					break;
				case "organization":
					$organization = $val;
					break;
				case "action":
					$action = strtolower($val);
					break;
			}
		}
	}
	
	$rightGroup = rightGroup::GetInstance();
	
	switch($action)
	{
		case "add":
			$rightGroup->Add($group_info, $description, $organization);
			break;
		case "modify":
			$rightGroup->Modify($group_info, $description, $organization, $id);
			break;
		case "remove":
			$rightGroup->Remove($id);
			break;
		case "assignright":
			$rightGroup->AssignRight($group_info, $right, $organization);
			break;
		case "removeright":
			$rightGroup->RemoveRight($id);
			break;
		case "getassignedrights":
			GetAssignedRights($group_info);
			exit;
		case "getrightgroups":
			GetRightGroupList();
			exit;
		default:
			$rightGroup->results->Set('false', "Server side functionality not implemented.");
			break;
	}

	$rightGroup->results->Send();

//--------------------------------------------------------------------------
/**
	\brief
		Retrieves the rights assigned to the passed in rights group.
	\param group_info
		May be the right group id or it's name.
	\return
		An XML list which contains the list of rights assigned to the group.
		If the group info is invalid an empty list will be submitted.
*/
//--------------------------------------------------------------------------
function GetAssignedRights($group_info)
{
	/*
		-	This sql string finds all rights assigned to the admin user (the user
			whom this PHP session is created for) and then from that list
			finds which rights are assigned to the user.
	*/
	$db = systemData::GetInstance();
	$oRightGroups = rightGroup::GetInstance();
	$oXML = new XML;
	global $g_oUserSession;
	
	$arGroupRights = $oRightGroups->GetRights($group_info);
		
	$oXML->serializeArray($arGroupRights);
	$oXML->outputXHTML();
	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
		Returns a list of right groups depending upon the specified
		criteria.
*/
//--------------------------------------------------------------------------
function GetRightGroupList()
{
	$strOrg = "";
	$oRightGroups = rightGroup::GetInstance();
		
	foreach($_GET as $fieldName => $val)
	{
		if(strlen($val))
		{
			switch($fieldName)
			{
	        	case "organization":
	        		$strOrg = $val;
	        		break;
	        }
	  	}
	}

	$oXML = new XML;
	$arResults = $oRightGroups->GetRightGroupList($strOrg);
	$oXML->serializeArray($arResults);
	$oXML->outputXHTML();
}
?>