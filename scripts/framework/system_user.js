/*
	The purpose of this file is to be a container for all user information.
*/

function system_User()
{
	
	/*
		The following variables are loaded when the LoadSettings function
		is called:
		
		user_ID
				The user's unique id in the database
		org_ID
				The user's organization
		user_EMail
				The user's email address
		user_Badge_ID
				The user's badge id if they have one
	*/
	
	this.site_theme = 0;
	this.organization = "";
	this.organizationFull = "";
	
	//	Timeout Settings
	this.message_delay = 10;
	
	this.savedRight = "";
	this.savedOrg = "";
	this.savedAccess = false;
}

/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_User.prototype.init = function()
{
	/*
		-	Make sure the user configuration information is loaded for the user
	*/
	this.LoadSettings();
}
/*--------------------------------------------------------------------------
	-	description
			HasRight calls the server to determine if the user has the
			requested right. If they do then the function returns true,
			otherwise it returns false.
	-	params
	-	return
--------------------------------------------------------------------------*/
system_User.prototype.HasRight = function (strRight, strOrg)
{
	var serverValues = Object();
	serverValues.right = strRight;
	
	if(strOrg)
	{
		serverValues.right_org = strOrg;
	}
	serverValues.location = strSystemAccessURL;
	serverValues.action = "user_has_right";

	var responseText = server.callSync(serverValues);

	if(!responseText)
	{
		responseText = "false||Error communicating with the server.";
	}

	var responseInfo = responseText.split("||");

	return eval(responseInfo[0]);
}
/*--------------------------------------------------------------------------
	-	description
			LoadSettings loads the user specific settings.
	-	params
	-	return
--------------------------------------------------------------------------*/
system_User.prototype.LoadSettings = function ()
{
	var serverValues = Object();
	var xmlObject;
	
	serverValues.location = strUserURL;
	serverValues.action = "settings";
	xmlObject = server.CreateXMLSync(serverValues);
	
	this.settings = null;
	this.settings = ParseXML(xmlObject, "settings", Object);	
	
	oOrganizationsList.load();
	arOrgRecord = oOrganizationsList.getFromId(this.settings[0].org_ID);
	
	if(arOrgRecord)
	{
		this.organization = arOrgRecord.org_Short_Name;
		this.organizationFull = arOrgRecord.org_Long_Name;
	}
	
	/*
		assign all rights to the user object itself
		i = an individial element within the settings array		
	*/
	for (var i in this.settings[0])
	{
		this[i] = this.settings[0][i];
	}

	this.site_theme = parseInt(this.user_theme);

	/*
		Notify any listeners that the user settings have changed.
	*/
	
	oSystemListener.call("Preferences");
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_User.prototype.GetTheme = function()
{
	return this.site_theme;
}
/*--------------------------------------------------------------------------
	-	description
			SetTheme sets the color theme the user prefers
	-	params
		-	the id of the theme
	-	return
		-	returns true if the theme was set properly.
--------------------------------------------------------------------------*/
system_User.prototype.SetTheme = function(id)
{
	if(!oSystem_Colors.set(id))
	{
		return false;
	}
	
	this.site_theme = id;
	return true;
}

var oUser = new system_User();