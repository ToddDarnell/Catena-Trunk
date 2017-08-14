/*--------------------------------------------------------------------------
	The purpose of this file is to display unread and high priority messages.
    It acts as a front page for the message board system.
----------------------------------------------------------------------------*/
var strmainMsg_Menu = "Message Main";

oMessageMain = new system_AppScreen();

oMessageMain.screen_Menu = strmainMsg_Menu;
oMessageMain.screen_Name = "message_Main";
oMessageMain.module_Name = "messageBoard";

oMessageMain.custom_Show = function()
{
	this.oUnreadMessages.load();
	this.oImportantMessages.load();
}
//--------------------------------------------------------------------------
/**
	\brief
        Retrieve all unread messages. 
        This calls the server synchronously, retrieves the list of unread messages
        and writes them to the results list. 
	\param
	\return
*/
//--------------------------------------------------------------------------
function importantMessageLoad()
{
    serverValues = null;
    serverValues = Object();
    
    serverValues.location = strMessageURL;
    serverValues.action = "getimportantmessages";

	server.callASync(serverValues, importantMessage_Parse);
}
function importantMessage_Parse(strResults)
{
	oMessageMain.oImportantMessages.SetList(strResults);
    oMessageMain.oImportantMessages.Display();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function unreadMessageLoad()
{
    serverValues = null;
    serverValues = Object();
    
    serverValues.location = strMessageURL;
    serverValues.action = "getunreadmessages";

	server.callASync(serverValues, unreadMessage_Parse);
}
function unreadMessage_Parse(strResults)
{
	oMessageMain.oUnreadMessages.SetList(strResults);
    oMessageMain.oUnreadMessages.Display();
}
/*--------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
----------------------------------------------------------------------------*/
oMessageMain.custom_Load = function()
{
	///	Create the results table
	this.oImportantMessages = new system_SortTable();
	this.oImportantMessages.setName("Important_Messages");

    this.oUnreadMessages = new system_SortTable();
    this.oUnreadMessages.setName("Unread_Messages");
    this.oUnreadMessages.showTableSize = false;

    /*--------------------------------------------------------------------------
		Fill the header table for messages not read by the user. Also determines
		which fields are sortable and which database fields they are sorted by.
	----------------------------------------------------------------------------*/
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Author";
		arHeader[0].sort = true;
		arHeader[0].dataType = "string";
		arHeader[0].fieldName = "user_Name";
        arHeader[0].width = "25%";
	arHeader[1] = Object();
		arHeader[1].text = "Subject";
		arHeader[1].sort = true;
		arHeader[1].dataType = "string";
		arHeader[1].fieldName = "msg_subject";
        arHeader[1].width = "60%";
	arHeader[2] = Object();
		arHeader[2].text = "Post Date";
		arHeader[2].sort = true;
		arHeader[2].dataType = "date";
		arHeader[2].fieldName = "msg_create_date";
		arHeader[2].width = "15%";
		
	this.oImportantMessages.SetHeader(arHeader);
	this.oImportantMessages.SetCaption("Random Reminders");
    this.oImportantMessages.SetNoResultsMessage("No reminders found.");
    this.oImportantMessages.custom_display = messageMain_Display;
	this.oImportantMessages.pageLength = 10;
    this.oImportantMessages.custom_element = messageMain_Display;
    this.oImportantMessages.custom_load = importantMessageLoad;

    this.oUnreadMessages.SetHeader(arHeader);
    this.oUnreadMessages.SetCaption("Unread Messages");
    this.oUnreadMessages.SetNoResultsMessage("No messages found.");
    this.oUnreadMessages.pageLength = 10;
    this.oUnreadMessages.custom_element = messageMain_Display;
    this.oUnreadMessages.custom_load = unreadMessageLoad;

	this.oUnreadMessages.Display();
	this.oImportantMessages.Display();
	
    return true;
}

/*--------------------------------------------------------------------------
    Fill out the custom display function for unread messages.
----------------------------------------------------------------------------*/
function messageMain_Display(listPosition)
{ 
	i = listPosition;
    /*--------------------------------------------------------------------------
    Format the date from YYYY-MM-DD (the format in in the Database)to a
    more customary MM/DD/YYYY.
    ----------------------------------------------------------------------------*/
    createDate = formatDate(this.list[i].msg_create_date);
    expireDate = formatDate(this.list[i].msg_exp_date);
    
    expireTime = expireDate.split("/");
    
    if(expireTime[0] == 0)
    {
    	expireDate = "never";
    }
    
    messageId = (this.list[i].msg_ID);

    var element_Row = document.createElement("TR");
    this.element_body.appendChild(element_Row);

    oSystem_Colors.SetPrimary(element_Row);

    /*
        The first column. Set the text for the element
    */
    var element_Col1 = document.createElement("TD");
    element_Col1.align = "center";
    element_Col1.appendChild(screen_CreateUserLink(this.list[i].user_Name));
    element_Row.appendChild(element_Col1);
    		
	var element_Col2 = document.createElement("TD");

    element_Col2Text = document.createElement("SPAN");
    screen_SetTextElement(element_Col2Text, this.list[i].msg_subject);
    
    element_Col2Text.className = "link"; 
    element_Col2Text.messageId = messageId;
    element_Col2Text.onclick = function ()
    {
        oViewMessage.View(this.messageId, strmainMsg_Menu); 
    }
    element_Col2.appendChild(element_Col2Text);
    element_Row.appendChild(element_Col2);

    if(i % 2 == 1)
    {
        oSystem_Colors.SetSecondaryBackground(element_Row);
    }
    else
    {
        oSystem_Colors.SetTertiaryBackground(element_Row);
    }

    var element_Col3 = document.createElement("TD");
    element_Row.appendChild(element_Col3);
    element_Col3.align = "center";
    element_Col3.title = "expires: " + expireDate;
    
    screen_SetTextElement(element_Col3, createDate);
    return true;
}

oMessageMain.register();