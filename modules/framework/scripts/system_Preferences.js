/*
	This functionality manages user modifiable preferences.
*/

var oSystemThemesList = new system_list("systemTheme_ID", "systemTheme_Name",  "systemTheme");

oSystemThemesList.load = function()
{
	this.clear();

	this.field_Value = "value";
	this.addElement(0, "Sky");
	this.addElement(1, "Ivy");
	this.addElement(2, "Lilac");
	this.addElement(3, "Desert");
	this.addElement(4, "Fog");
	this.addElement(5, "Rose");
	this.addElement(6, "Strawberry");
	this.addElement(7, "Mint");
	this.addElement(8, "Coffee");
	this.addElement(9, "Shadow");
	this.addElement(10, "Ocean");
	this.addElement(11, "Forest");
	this.sort();
}

var oSystemFlakeList = new system_list("systemFlake_ID", "systemFlake_Name",  "systemFlake");

oSystemFlakeList.load = function()
{
	this.clear();
	this.addElement(0, "None");
	this.addElement(1, "Rarely");
	this.addElement(2, "Frequently");
	this.addElement(3, "Continuously");
}

var oSystemDisplaySpeedList = new system_list("systemDisplay_ID", "systemDisplay_Name",  "systemDisplay");

oSystemDisplaySpeedList.load = function()
{
	this.clear();
	this.addElement(10, "10 Seconds");
	this.addElement(15, "15 Seconds");
	this.addElement(20, "20 Seconds");
	this.addElement(30, "30 Seconds");
}

var oSystemSiteNoticeList = new system_list("systemCloseNotice_ID", "systemCloseNotice_Name",  "systemCloseNotice");

oSystemSiteNoticeList.load = function()
{
	this.clear();
	this.addElement(0, "Disable");
	this.addElement(1, "Enable");
}

var oSystem_Preferences = new system_AppScreen();

oSystem_Preferences.strField_EMail = "preferences_EMail";		//	The user's email field
oSystem_Preferences.screen_Name = "system_Preferences";				//	The name of the screen or page. Also the name of the XML data file
oSystem_Preferences.screen_Menu = "Site Preferences";					//	The name of the menu item which corapsponds to this item
oSystem_Preferences.module_Name = "framework";

oSystem_Preferences.custom_Show = function()
{
	this.LoadLists();
	
	/*
		Fill in the user's email field
	*/
	
	this.element_EMail.value = oUser.user_EMail;
	this.element_ModifyEMail.checked = false;
	this.element_EMail.disabled = true;
	return true;
}
/*
	Load the user modifiable screen elements
*/
oSystem_Preferences.custom_Load = function()
{
	
	this.element_EMail = oScreenBuffer.Get("preferences_EMail");
	this.element_ModifyEMail = oScreenBuffer.Get("preferences_EnableEmail");
	this.element_UseFlakes = oScreenBuffer.Get("preferences_EnableFlakes");
	this.element_Submit = oScreenBuffer.Get("preferences_Submit");
	this.element_Themes = oScreenBuffer.Get("preferences_ThemeList");
	this.element_DisplayTime = oScreenBuffer.Get("preferences_NotificationSpeed");
	this.element_CloseNotice = oScreenBuffer.Get("preferences_CloseNotice");

	/*
		Enable the submit button to call the organization with the screen
	*/
	this.element_Submit.onclick = function ()
	{
		oSystem_Preferences.submit();
	};

	oSystemThemesList.load();
	oSystemFlakeList.load();
	oSystemDisplaySpeedList.load();
	oSystemSiteNoticeList.load();
	
	this.element_ModifyEMail.onclick = function ()
	{
		oSystem_Preferences.EnableEMail(this.checked);
	}
	
	HideElement(this.element_ModifyEMail);

	return true;
}
/*
	Disable the email modification screen
*/
oSystem_Preferences.EnableEMail = function(toggle)
{
	if(toggle)
	{
		/*
			Enable the email
		*/
		alert("Only allowed Echostar email domains are accepted.");
		this.element_EMail.disabled = false;
		this.element_ModifyEMail.checked = true;
	}
	else
	{
		this.element_EMail.disabled = true;
		this.element_ModifyEMail.checked = false;
	}
};

/*
	Loads the lists displaying the organizations
*/
oSystem_Preferences.LoadLists = function()
{
	oSystemThemesList.fillControl(this.element_Themes, false, oSystemThemesList.GetPosition(oUser.GetTheme()));

	oSystemFlakeList.fillControl(this.element_UseFlakes, false, oUser.user_UseFlakes);
	
	iPos = oSystemDisplaySpeedList.GetPosition(oUser.message_delay);
	
	oSystemDisplaySpeedList.fillControl(this.element_DisplayTime, false, iPos);

	oSystemSiteNoticeList.fillControl(this.element_CloseNotice, false, oUser.close_notice);
	
}
/*
	Sumbits a request for an add, modify, or removal
	activePage is the page which currently has focus when
	the user clicks submit
*/
oSystem_Preferences.submit = function(activePage)
{
	/*
		-	Set the theme functionality, which is set
			differently then just sending a variable to the
			server.
		-	Then send in the e-mail to make sure it's valid also
	*/
	themeId = oSystemThemesList.getId(this.element_Themes.value);
		
	/*
		Grab the email if it's checked for modifying
	*/
	
	if(this.element_ModifyEMail.checked == true)
	{
		strEmail = this.element_EMail.value;
	}
	else
	{
		strEmail = oUser.user_EMail;
	}
	
	if(strEmail.length == 0)
	{
		/*
			Make sure the user didn't start with an empty email
		*/
		if(oUser.user_EMail.length != 0)
		{
			if(!confirm("By disabling your email you will not be able to send or receive messages within Catena. Continue?"))
			{
				return;
			}
		}
	}
	
	if(!oUser.SetTheme(themeId))
	{
		alert("Theme settings not changed: " + themeId);
		return false;
	}
	
	closeNotice = oSystemSiteNoticeList.getId(this.element_CloseNotice.value);
	
	/*
		Now send the server validating elements
	*/
	var serverValues = Object();
	
	arDisplayValue = this.element_DisplayTime.value.split(" ");
		
	serverValues.theme = themeId;
	serverValues.email = strEmail;
	serverValues.useFlakes = oSystemFlakeList.getId(this.element_UseFlakes.value);
	serverValues.messageDelay = arDisplayValue[0];
	serverValues.closeNotice = closeNotice;
	
	serverValues.location = strUserURL;
	serverValues.action = "modifypreferences";

	/*
		Contact the server with our request. wait for the response and
		then display it to the user
	*/
	
	var responseText = server.callSync(serverValues);
	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		/*
			Notify the system that the preferences have
			changed
		*/
		oUser.LoadSettings();

		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		this.EnableEMail(false);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	return true;
}

oSystem_Preferences.register();