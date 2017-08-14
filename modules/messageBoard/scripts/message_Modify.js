/*--------------------------------------------------------------------------
	The purpose of this file is to manage all of the functionality related to
	modifying an existing message on the message board.
----------------------------------------------------------------------------*/
function messageClass()
{
}
var oModifyMessage = new system_AppScreen();

oModifyMessage.element_msgSubject = "";
oModifyMessage.element_msgBody = "";
oModifyMessage.element_msgPriority = "";
oModifyMessage.element_msgOrganization = "";
oModifyMessage.modMsgID = 0;
oModifyMessage.screen_Name = "message_Modify";
oModifyMessage.screen_Menu = "Modify Message";
oModifyMessage.module_Name = "messageBoard";

/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oModifyMessage.custom_Show = function()
{
	this.LoadLists();
	oModifyMessage.ClearFields();
	return true;
}

oModifyMessage.custom_Load = function ()
{
	/*--------------------------------------------------------------------------
		Adds the calendar to the modify Message Page. When the user selects a month,
		days and years appear. Number of days are determined by the month. 
	----------------------------------------------------------------------------*/	
	this.oAddCalendar = new system_Calendar();
	this.oAddCalendar.load("MsgModify_Calendar");
	
	this.element_msgSubject = oScreenBuffer.Get("MsgModifySubject");
	this.element_msgBody = oScreenBuffer.Get("MsgModifyBody");
    this.element_msgOrganization = oScreenBuffer.Get("msgModifyOrgList");
	this.element_msgPriority = oScreenBuffer.Get("msgModifyPriList");
	
	oScreenBuffer.Get("backMsgModifyButton").backScreen = "";
	oScreenBuffer.Get("backMsgModifyButton").onclick = function ()
	{
		oModifyMessage.ClearFields();
		oCatenaApp.navigate(this.backScreen);
	};
	
	oScreenBuffer.Get("addMsgModifyButton").onclick = function ()
		{
			oModifyMessage.Submit();		
	  };	  
		return true;
}

/*--------------------------------------------------------------------------
	Loads the lists used by modify message
----------------------------------------------------------------------------*/
oModifyMessage.LoadLists = function()
{	
	if(oUser.HasRight(oRights.MSG_BOARD_Admin, strOrg))
	{
		oRights.fillOrgControl(oRights.MSG_BOARD_Admin, "msgModifyOrgList", false);
	}
	else
	{
		oRights.fillOrgControl(oRights.MSG_BOARD_Standard, "msgModifyOrgList", false);
	} 	

  	oPriorityList.load();
  	oPriorityList.fillControl("msgModifyPriList", false);
}

/*--------------------------------------------------------------------------
	ClearFields clears all the fields for Subject, Message, 
	Expiration Date, Organization, and Priority
----------------------------------------------------------------------------*/
oModifyMessage.ClearFields = function()
{
  	this.element_msgSubject.value = "";
  	this.element_msgBody.value = "";
    this.element_msgOrganization.value = "";
  	this.element_msgPriority.value = "";
  	this.oAddCalendar.reset();  
}
			
/*--------------------------------------------------------------------------
	The values we're submitting to the server through the form.
	In this case data to modify a message.
----------------------------------------------------------------------------*/
oModifyMessage.Submit = function()
{
	var serverValues = Object();
	
	/*--------------------------------------------------------------------------
	We pass to the server the message subject,
	body, organization, etc. to add to the system.
	----------------------------------------------------------------------------*/
	serverValues.MsgSubject = this.element_msgSubject.value;
	serverValues.MsgBody = this.element_msgBody.value;
    serverValues.MsgOrg = this.element_msgOrganization.value;
	serverValues.MsgPri = this.element_msgPriority.value;
	serverValues.messageId = this.messageId;
	serverValues.MsgExpDate = this.oAddCalendar.getDate();
	
	serverValues.location = strMessageURL;
	serverValues.action = "modify";
	
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
		oCatenaApp.navigate(oScreenBuffer.Get("backMsgModifyButton").backScreen);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	return true;
}

/*--------------------------------------------------------------------------
	Modifies a message based upon what's passed in as messageId.
	By either cancelling or submitting a successful request, sets
	focus to the screen passed in.
		-	Tell the back button where it should send the user
			if they click it
		-	clear all of the fields in this form
		-	draw the screen for modifying a mesasage
		-	send a request to the server for the data for this message
----------------------------------------------------------------------------*/
oModifyMessage.Modify = function(messageId, backScreen)
{
	oCatenaApp.navigate(this.screen_Menu);
	oScreenBuffer.Get("backMsgModifyButton").backScreen = backScreen;
	this.ClearFields();
	this.messageId = messageId;
	
	var serverValues = Object();

	serverValues.messageId = messageId;
	serverValues.location = strMessageURL;
	serverValues.action = "getmessagelist";

	/*--------------------------------------------------------------------------
		Contact the server with our request. Wait for the response and then 
		display it to the user. The document list should only have one element.
	----------------------------------------------------------------------------*/
	var xmlObject = server.CreateXMLSync(serverValues);
	

	var verList = ParseXML(xmlObject, "element", messageClass);

	if(verList.length == 1)
	{	
		/*--------------------------------------------------------------------------
			Load the stored message from the database based on the Message ID.
			Format the data from the database to be readable by stripping off 
			the escape characters before quotes and apostrophes. 
		----------------------------------------------------------------------------*/
		var strSubject = verList[0]["msg_subject"].replace(/\\+'/g, "'");
		strSubject = strSubject.replace(/\\+"/g, '"');
		this.element_msgSubject.value = strSubject;
  		var strBody = verList[0]["msg_body"].replace(/\\+'/g, "'");
		strBody = strBody.replace(/\\+"/g, '"');  		
  		this.element_msgBody.value = strBody;
        this.element_msgOrganization.value = verList[0]['org_Short_Name'];
  		this.element_msgPriority.value = verList[0]['msgPri_name'];
  		this.oAddCalendar.setDate( verList[0]["msg_exp_date"]); 
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, "Unable to load message for modifying.");
	}
	return true;
}

oModifyMessage.register();