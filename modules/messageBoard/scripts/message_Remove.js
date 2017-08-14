/*--------------------------------------------------------------------------
	The purpose of this file is to manage all of the functionality related to
	deleting an existing message on the message board.
----------------------------------------------------------------------------*/
function messageClass()
{
}
var oMessageRemove = new system_AppScreen();

oMessageRemove.element_MsgSubject = "";
oMessageRemove.element_MsgBody = "";
oMessageRemove.element_MsgPriority = "";
oMessageRemove.element_MsgPoster = "";
oMessageRemove.element_MsgOrganization = "";
oMessageRemove.element_MsgPostDate = "";
oMessageRemove.delMsgID = 0;
oMessageRemove.screen_Name = "message_Remove";
oMessageRemove.screen_Menu = "Delete Message";
oMessageRemove.module_Name = "messageBoard";


/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oMessageRemove.custom_Show = function()
{
	oMessageRemove.ClearFields();
	return true;
}

oMessageRemove.custom_Load = function ()
{	
	this.element_MsgSubject = oScreenBuffer.Get("MsgDelSubject");
	this.element_MsgBody = oScreenBuffer.Get("MsgDelBody");
	this.element_MsgPriority = oScreenBuffer.Get("MsgDelPriority");
	this.element_MsgPoster = oScreenBuffer.Get("MsgDelPoster");
	this.element_MsgOrganization = oScreenBuffer.Get("MsgDelOrganization");
	this.element_MsgPostDate = oScreenBuffer.Get("MsgDelPostDate");
	
	oScreenBuffer.Get("backMsgDelButton").backScreen = "";
	oScreenBuffer.Get("backMsgDelButton").onclick = function ()
	{
		oMessageRemove.ClearFields();
		oCatenaApp.navigate(this.backScreen);
	};
	
	oScreenBuffer.Get("addMsgDelButton").onclick = function ()
	{
		if(!window.confirm("Are you sure you want to permanently remove this message?"))
			{
				return true;
			}
		oMessageRemove.Submit();		
	};
	
	/*--------------------------------------------------------------------------
	    Sets up the color scheme for the viewable div elements on screen. 
	-------------------------------------------------------------------------------*/
	oSystem_Colors.SetPrimary(this.element_MsgSubject);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgSubject);
	
	oSystem_Colors.SetPrimary(this.element_MsgBody);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgBody);
	
	oSystem_Colors.SetPrimary(this.element_MsgPriority);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgPriority);

	oSystem_Colors.SetPrimary(this.element_MsgOrganization);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgOrganization);
	
	oSystem_Colors.SetPrimary(this.element_MsgPostDate);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgPostDate);
	
	oSystem_Colors.SetPrimary(this.element_MsgPoster);
	oSystem_Colors.SetTertiaryBackground(this.element_MsgPoster);

	return true;
}

/*--------------------------------------------------------------------------
	ClearFields clears all the fields for Subject, Message, 
	Expiration Date, Organization, and Priority
----------------------------------------------------------------------------*/
oMessageRemove.ClearFields = function()
{  	
  	screen_SetTextElement(this.element_MsgSubject, "");
	screen_SetTextElement(this.element_MsgBody, "");
	screen_SetTextElement(this.element_MsgPoster, "");
	screen_SetTextElement(this.element_MsgPriority, "");
	screen_SetTextElement(this.element_MsgOrganization, "");
	screen_SetTextElement(this.element_MsgPostDate, "");
}
			
/*--------------------------------------------------------------------------
	The values we're submitting to the server through the form.
	In this case data to delete a message.
----------------------------------------------------------------------------*/
oMessageRemove.Submit = function()
{
	var serverValues = Object();
	
	/*--------------------------------------------------------------------------
	We pass to the server the message subject,
	body, organization, etc. to add to the system.
	----------------------------------------------------------------------------*/
	serverValues.messageId = this.messageId;

	serverValues.location = strMessageURL;
	serverValues.action = "remove";
	
	/*--------------------------------------------------------------------------
	Contact the server with our request. wait for the resonse and
	then display it to the user
	----------------------------------------------------------------------------*/	
	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		responseText = "false||Error communicating with the server.";
	}
	
	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		oCatenaApp.navigate(oScreenBuffer.Get("backMsgDelButton").backScreen);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	return true;
}

/*--------------------------------------------------------------------------
	Displays a message based upon what's passed in as messageId.
	By either cancelling or submitting a successful request, sets
	focus to the screen passed in.
		-	Tell the back button where it should send the user
			if they click it
		-	clear all of the fields in this form
		-	draw the screen for deleting a message
		-	send a request to the server to delete this message
----------------------------------------------------------------------------*/
oMessageRemove.Remove = function(messageId, backScreen)
{	
	oCatenaApp.navigate(this.screen_Menu);
	oScreenBuffer.Get("backMsgDelButton").backScreen = backScreen;
	this.ClearFields();
	this.messageId = messageId;
	
	var serverValues = Object();

	serverValues.messageId = messageId;
	serverValues.location = strMessageURL;
	serverValues.action = "getmessagelist";

	/*--------------------------------------------------------------------------
		Contact the server with our request. Wait for the response and then 
		display it to the user.
	----------------------------------------------------------------------------*/
	var xmlObject = server.CreateXMLSync(serverValues);
	

	var verList = ParseXML(xmlObject, "element", messageClass);

	if(verList.length == 1)
	{
		/*--------------------------------------------------------------------------
			Format the date from YYYY-MM-DD (the format in in the Database)to a
			more customary MM/DD/YYYY using the common function formatDate.
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
		
		screen_SetTextElement(this.element_MsgSubject, strSubject);
		this.element_MsgBody.innerHTML = strDisplayBody;
		screen_SetTextElement(this.element_MsgPoster, strUser); 
		screen_SetTextElement(this.element_MsgPriority, strMsgPri);
		screen_SetTextElement(this.element_MsgPostDate, strDisplayDate);
		screen_SetTextElement(this.element_MsgOrganization, strOrg);
		
		/*--------------------------------------------------------------------------
			Make the Divs look more presentable so that the message is easy to read.
			First add a border and then put some cell padding down so that the text 
			is not right on top of the edge of the div.
		----------------------------------------------------------------------------*/
		this.element_MsgSubject.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgSubject.style.padding = "3px";
		
		this.element_MsgBody.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgBody.style.padding = "3px";
		
		this.element_MsgPoster.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgPoster.style.padding = "3px";
		
		this.element_MsgPriority.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgPriority.style.padding = "3px";
		
		this.element_MsgPostDate.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgPostDate.style.padding = "3px";
		
		this.element_MsgOrganization.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_MsgOrganization.style.padding = "3px";
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, "Unable to load message for deleting.");
	}
	return true;	
}

oMessageRemove.register();