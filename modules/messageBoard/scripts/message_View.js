/*--------------------------------------------------------------------------
	The purpose of this file is to manage all of the functionality related to
	viewing an existing message on the message board.
----------------------------------------------------------------------------*/
function messageClass()
{
}
var oViewMessage = new system_AppScreen();

oViewMessage.element_MsgViewSubject = "";
oViewMessage.element_MsgViewBody = "";
oViewMessage.element_MsgViewPriority = "";
oViewMessage.element_MsgViewPoster = "";
oViewMessage.element_MsgViewOrganization = "";
oViewMessage.element_MsgViewPostDate = "";
oViewMessage.modMsgID = 0;
oViewMessage.screen_Name = "message_View";
oViewMessage.screen_Menu = "View Message";
oViewMessage.module_Name = "messageBoard";


/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oViewMessage.custom_Show = function()
{
	oViewMessage.ClearFields();
	return true;
}

oViewMessage.custom_Load = function ()
{		
	this.element_MsgViewSubject = oScreenBuffer.Get("MsgViewSubject");
	this.element_MsgViewBody = oScreenBuffer.Get("MsgViewBody");
	this.element_MsgViewPoster = oScreenBuffer.Get("MsgViewPoster");
	this.element_MsgViewPriority = oScreenBuffer.Get("MsgViewPriority");
	this.element_MsgViewOrganization = oScreenBuffer.Get("MsgViewOrganization");
	this.element_MsgViewPostDate = oScreenBuffer.Get("MsgViewPostDate");
	
	oScreenBuffer.Get("backMsgViewButton").backScreen = "";
	oScreenBuffer.Get("backMsgViewButton").onclick = function ()
	{
		oViewMessage.ClearFields();
		oCatenaApp.navigate(this.backScreen, page_param_display);
	};
	
	/*--------------------------------------------------------------------------
	    Sets up the color scheme for the viewable div elements on screen. 
	-------------------------------------------------------------------------------*/
	oSystem_Colors.SetPrimary(this.element_MsgViewSubject);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgViewSubject);
	
	oSystem_Colors.SetPrimary(this.element_MsgViewBody);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgViewBody);
	
	oSystem_Colors.SetPrimary(this.element_MsgViewPriority);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgViewPriority);

	oSystem_Colors.SetPrimary(this.element_MsgViewOrganization);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgViewOrganization);
	
	oSystem_Colors.SetPrimary(this.element_MsgViewPostDate);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgViewPostDate);
	
	oSystem_Colors.SetPrimary(this.element_MsgViewPoster);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgViewPoster);
	
	return true;
}

/*--------------------------------------------------------------------------
	ClearFields clears all the fields for Subject, Message, Body,
	Post Date, Organization, and Priority
----------------------------------------------------------------------------*/
oViewMessage.ClearFields = function()
{
	screen_SetTextElement(this.element_MsgViewSubject, "");
	screen_SetTextElement(this.element_MsgViewBody, "");
	screen_SetTextElement(this.element_MsgViewPoster, "");
	screen_SetTextElement(this.element_MsgViewPriority, "");
	screen_SetTextElement(this.element_MsgViewOrganization, "");
	screen_SetTextElement(this.element_MsgViewPostDate, "");	
}
/*--------------------------------------------------------------------------
	Displays a message based upon what's passed in as messageId.
	By either cancelling or submitting a successful request, sets
	focus to the screen passed in.
		-	Tell the back button where it should send the user
			if they click it
		-	clear all of the fields in this form
		-	draw the screen for viewing the mesasage
		-	send a request to the server for the data for this message
		-	marks the message as read in jMessageViewed table
----------------------------------------------------------------------------*/
oViewMessage.View = function(messageId, backScreen)
{
	oCatenaApp.navigate(this.screen_Menu);
	oScreenBuffer.Get("backMsgViewButton").backScreen = backScreen;
	
	var serverValues = Object();

	serverValues.messageId = messageId;
	serverValues.location = strMessageURL;
	serverValues.action = "view";

	/*--------------------------------------------------------------------------
		Contact the server with our request. Wait for the response and then 
		display it to the user. The document list should only have one element.
	----------------------------------------------------------------------------*/
	var xmlObject = server.CreateXMLSync(serverValues);

	var verList = ParseXML(xmlObject, "element", messageClass);

	if(verList.length == 1)
	{
		/*--------------------------------------------------------------------------
			Format the date from YYYY-MM-DD (the format in in the Database)to a
			more customary MM/DD/YYYY.
		----------------------------------------------------------------------------*/
		strDisplayDate = formatDate(verList[0]["msg_create_date"]);
		
		/*--------------------------------------------------------------------------
			Insert line breaks into the displayed message body using the common
			function insertBreaks.
		----------------------------------------------------------------------------*/
		strDisplayBody = insertBreaks(verList[0]["msg_body"]);
	
		/*--------------------------------------------------------------------------
			Load the stored message from the database and display it in the proper
			fields based on the Message ID. Apply the proper formatting from common
			functions. 
		----------------------------------------------------------------------------*/		
		strSubject = verList[0]["msg_subject"]
		strUser = verList[0]["user_Name"];
		strMsgPri = verList[0]["msgPri_name"];
		strOrg = verList[0]["org_Short_Name"];
		
		screen_SetTextElement(this.element_MsgViewSubject, strSubject);
		this.element_MsgViewBody.innerHTML = strDisplayBody;
		screen_SetTextElement(this.element_MsgViewPoster, strUser); 
		screen_SetTextElement(this.element_MsgViewPriority, strMsgPri);
		screen_SetTextElement(this.element_MsgViewPostDate, strDisplayDate);
		screen_SetTextElement(this.element_MsgViewOrganization, strOrg);
		
		/*--------------------------------------------------------------------------
			Make the Divs look more presentable so that the message is easy to read.
			First add a border and then put some cell padding down so that the text 
			is not right on top of the edge of the div.
		----------------------------------------------------------------------------*/

		this.element_MsgViewSubject.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgViewSubject.style.padding = "3px";
		
		this.element_MsgViewBody.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgViewBody.style.padding = "3px";
		
		this.element_MsgViewPoster.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgViewPoster.style.padding = "3px";
		
		this.element_MsgViewPriority.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgViewPriority.style.padding = "3px";
		
		this.element_MsgViewPostDate.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgViewPostDate.style.padding = "3px";
		
		this.element_MsgViewOrganization.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgViewOrganization.style.padding = "3px";
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, "Unable to load message for viewing");
	}
	return true;
}

oViewMessage.register();
