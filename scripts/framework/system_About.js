/*
	This file maintains the system links system, which appears in the upper
	right hand corner of the screen. These links are available and usuable
	throughout the entire system.
*/
function systemAbout()
{
	this.loaded = false;
}
/*--------------------------------------------------------------------------
	-	description
			Loads the system about dialog box so the user can see who's
			logged in, thier organization and a few other details.
	-	params
	-	return
--------------------------------------------------------------------------*/
systemAbout.prototype.load = function()
{
	oAboutLink = new Object();
	
	oAboutLink.text = "About";
	oAboutLink.color = "black";
	oAboutLink.title = "Details about the website";
	
	oAboutLink.fnCallback = function()
	{
		oSystemAbout.show();
	}

	oSystemLinks.add(oAboutLink);
};
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
systemAbout.prototype.create = function()
{
	this.oDialog = new system_Dialog();
	
	this.oDialog.config.width = 300;
	this.oDialog.config.height = 200;
	this.oDialog.strScreenTitle = "About Catena";
	
	this.oDialog.create("SystemAboutDialog");
	
	this.element_userName = document.createElement("DIV");
	this.element_userName.style.position = "absolute";
	this.element_userName.style.left = "20px";
	this.element_userName.style.top = "60px";
	this.element_userName.style.fontStyle = "italic";
	
	this.oDialog.appendChild(this.element_userName);

	this.element_orgName = document.createElement("DIV");
	this.element_orgName.style.position = "absolute";
	this.element_orgName.style.left = "20px";
	this.element_orgName.style.top = "80px";
	this.element_orgName.style.height = "20px";
	this.element_orgName.style.width = "280px";
	this.element_orgName.style.overflow = "hidden";
	this.element_orgName.style.fontStyle = "italic";
	
	this.oDialog.appendChild(this.element_orgName);

	this.element_siteVersion = document.createElement("DIV");
	this.element_siteVersion.style.position = "absolute";
	this.element_siteVersion.style.left = "20px";
	this.element_siteVersion.style.top = "20px";
	this.element_siteVersion.style.fontWeight = "bold";
	
	this.oDialog.appendChild(this.element_siteVersion);


	this.element_orgDetails = document.createElement("DIV");
	this.element_orgDetails.style.position = "absolute";
	this.element_orgDetails.style.left = "20px";
	this.element_orgDetails.style.top = "110px";
	this.element_orgDetails.style.width = "250px";
	
	this.element_orgDetails.style.fontWeight = "bold";
	
	this.oDialog.appendChild(this.element_orgDetails);
	
	this.element_ok = document.createElement("BUTTON");
	this.element_ok.style.position = "absolute";
	this.element_ok.style.left = "215px";
	this.element_ok.style.top = "165px";
	this.element_ok.style.width = "75px";
	this.element_ok.appendChild(document.createTextNode("OK"));
	
	this.oDialog.appendChild(this.element_ok);

	this.element_ok.oDialog = this.oDialog;
	this.element_ok.onclick = function()
	{
		this.oDialog.hide();
	}
	this.loaded = true;
}
/*--------------------------------------------------------------------------
	-	description
			This function displays an about box on the screen
	-	params
	-	return
--------------------------------------------------------------------------*/
systemAbout.prototype.show = function()
{
	if(this.loaded == false)
	{
		this.create();
	}
	
	userName = oUser.user_Name;
	strOrg = oUser.organizationFull;
	strActive = "";

	oSystem_Debug.notice(oUser.user_Active);
	
	if((oUser.user_Active == 0) || (oUser.organization == "AFU"))
	{
		oSystem_Debug.notice("inactive");
		
		strActive = "(Disabled)";
		HideElement(this.element_ok);
		strNotice = "Your account is disabled. Please contact your administrator for access.";
	}
	else if(oUser.organization == "Guest")
	{
		strNotice = "You are assigned to the guest account and do not have full access to the site. Please contact your administrator.";
	}
	else
	{
		strNotice = "";
	}


	strUser = userName;
	strOrg = strOrg + " " + strActive;
	strVersion = "version " + global_siteVersion;

	screen_SetTextElement(this.element_userName, strUser);
	screen_SetTextElement(this.element_orgName, strOrg);
	screen_SetTextElement(this.element_siteVersion, strVersion);
	screen_SetTextElement(this.element_orgDetails, strNotice);
		

	this.oDialog.show();

}

oSystemAbout = new systemAbout();