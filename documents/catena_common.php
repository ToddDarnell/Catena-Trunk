<?
//--------------------------------------------------------------------------
/**
	\brief
		Calls the Catena website requesting to know if the passed in user name
		has the specified right/organization combination.
	\param sUserName
		The name or id of the account to validate.
	\param sRight
		The name or the id of the right to validate.
	\param sOrganization
		The optional name or id of the organization which this
		right is associated with.
	\return
		-	true
			The account holder has the right.
		-	false
			The account holder does not have the right.
*/
//--------------------------------------------------------------------------
function catena_HasRight($sUserName, $sRight, $sRightOrg = "")
{
	$arServerCall = Array();
	
	$arServerCall['location'] = "functions/systemAccess";
	$arServerCall['action'] = "user_has_right";
	$arServerCall['user'] = $sUserName;
	$arServerCall['right'] = $sRight;
	$arServerCall['right_org'] = $sRightOrg;

	$sFile = Catena_ServerGet($arServerCall);

    $arResults = explode("||", $sFile);
    return $arResults[0] == "true";
}
//--------------------------------------------------------------------------
/**
	\brief
		Calls the Catena website via the GET protocol.
	\param arServerValues
		An array containing the values to call the server with.
		Note, this array must contain an element called 'location' which
		specifies the page to call. The location variable is in the format
		"folder/filename". Do not include .php or any kind of extension.
	\return
		The content of the returned HTML page.
*/
//--------------------------------------------------------------------------
function catena_ServerGet($arServerValues)
{
	$strURL = catena_BuildURL($arServerValues);
	
	if(strlen($strURL))
	{
		return file_get_contents($strURL, false);
	}
	
	return "";
}
//--------------------------------------------------------------------------
/**
	\brief
		Builds a URL to pass onto to the Catena website.
	\param arServerValues
		An array containing the values to call the server with.
		Note, this array must contain an element called 'location' which
		specifies the page to call.
	\return
		a string containing the completed URL.
*/
//--------------------------------------------------------------------------
function catena_BuildURL($arServerValues)
{
	$strURL = "";
	$strParams = "";
	
	if(sizeof($arServerValues) < 1)
	{
		return "";
	}
	
	foreach($arServerValues as $field => $value)
	{
		if ($field == 'location')
		{
			$strURL = "http://catena.echostar.com/$value.php?";
		}
		else
		{
			$strParams .= "$field=$value&";
		}
	}
	
	if(strlen($strURL) < 1)
	{
		return "";
	}
	
	$strURL .= $strParams;
	
	return $strURL;
}

?>