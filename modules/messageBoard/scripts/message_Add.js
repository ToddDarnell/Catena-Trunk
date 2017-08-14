
oSystem_Debug.notice("Loading message_add");

var strMessageURL = "/modules/messageBoard/server/message";
var strMessageAddURL = "/modules/messageBoard/server/message_add";

/*-----------------------------------------------------------------------------
	The purpose of this file is to manage all of the functionality related to 
	adding a message on the message board.
-------------------------------------------------------------------------------*/

var oAddMessage = new system_AppScreen();

oAddMessage.element_MessageSubject = "";
oAddMessage.element_MessageBody = ""; 			
oAddMessage.element_Organization = "";
oAddMessage.element_Priority = "";
oAddMessage.screen_Name = "message_Add";
oAddMessage.screen_Menu = "Create Message";
oAddMessage.module_Name = "messageBoard";

/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oAddMessage.custom_Show = function()
{
	this.LoadLists();
	oAddMessage.ClearFields();
	return true;
}

oAddMessage.custom_Load = function ()
{
	/*-----------------------------------------------------------------------------
		Adds the calendar to the Add Message Page. When the user selects a month, days and
		years appear. Number of days are determined by the month. 
	-------------------------------------------------------------------------------*/
	
	this.oAddCalendar = new system_Calendar();
	this.oAddCalendar.load("MsgAdd_Calendar");
	
	/*-----------------------------------------------------------------------------
	We pass to the server the message subject,
	body, organization, etc. to add to the system.
	-------------------------------------------------------------------------------*/
	this.element_MessageSubject = oScreenBuffer.Get("MsgSubject");
	this.element_MessageBody = oScreenBuffer.Get("MsgBody");
	this.element_Organization = oScreenBuffer.Get("msgOrgList");
	this.element_Priority = oScreenBuffer.Get("msgPriList");
	
	oScreenBuffer.Get("clearMsgButton").onclick = function ()
	{
		oAddMessage.ClearFields();
	};
	
	oScreenBuffer.Get("addMsgButton").onclick = function ()
	{
		oAddMessage.Submit();
	};

	return true;
}
/*-----------------------------------------------------------------------------
	Loads the lists used by add message
-------------------------------------------------------------------------------*/
oAddMessage.LoadLists = function()
{
	oRights.fillOrgControl(oRights.MSG_BOARD_Standard, "msgOrgList", false);
	oPriorityList.load();
	oPriorityList.fillControl("msgPriList", false);
}

/*-----------------------------------------------------------------------------
	ClearFields clears all the fields for Subject, Message, 
	Expiration Date, Organization, and Priority
-------------------------------------------------------------------------------*/
oAddMessage.ClearFields = function()
{
	this.element_MessageSubject.value = "";		
	this.element_MessageBody.value = "";	
	this.element_Organization.value = oUser.organization;	
	this.element_Priority.value = "Normal";
	
	/*-----------------------------------------------------------------------------
		In Add message the default Expiration Date is 1 month from the current Date.
	-------------------------------------------------------------------------------*/
	var expiredDate= new Date();

	/*
		This has to be set to + 2 because javascript
		works off a 0 based january while the PHP
		is working off a 1 based january.
	*/
	expiredDate.setMonth(expiredDate.getMonth() + 2);
	
	this.oAddCalendar.setDate(expiredDate);

}
			
/*-----------------------------------------------------------------------------
	The values we're submitting to the server through the form.
	In this case data to add a message.
-------------------------------------------------------------------------------*/
oAddMessage.Submit = function()
{
	/*-----------------------------------------------------------------------------
		Inform the user that they need to select an employee to make an entry about
		if they leave the user filter empty and try to submit.
	-------------------------------------------------------------------------------*/
	element_submitForm =oScreenBuffer.Get("messageBoard_submitform");
	element_submitForm.action = strMessageAddURL + ".php";
	
	element_submitForm.appendChild(screen_CreateHiddenElement("subject", this.element_MessageSubject.value));
	element_submitForm.appendChild(screen_CreateHiddenElement("body",  this.element_MessageBody.value));
	element_submitForm.appendChild(screen_CreateHiddenElement("org", this.element_Organization.value));
	element_submitForm.appendChild(screen_CreateHiddenElement("expiredate", this.oAddCalendar.getDate()));
	element_submitForm.appendChild(screen_CreateHiddenElement("priority", this.element_Priority.value));

	element_submitForm.submit();

	RemoveChildren(element_submitForm);
	return true;
}
/*
	DisplayResults
		-	Clears the form and results if the passed in values are valid
		-	prompts the user with an error message if there is one
*/
oAddMessage.DisplayResults = function(strMsg)
{
	var responseInfo = strMsg.split("||");
	if(eval(responseInfo[0]))
	{
		this.ClearFields();					
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
	}
}

oAddMessage.register();
