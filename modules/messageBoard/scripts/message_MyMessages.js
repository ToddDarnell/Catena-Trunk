/*--------------------------------------------------------------------------
	The purpose of this file is to display all of the messages a user created.
    It acts as a place for users to modify and delete all of their messages 
    without having to first execute a search. 
----------------------------------------------------------------------------*/
var strmyMsg_Menu = "My Messages";

oMyMessages = new system_AppScreen();

oMyMessages.screen_Menu = strmyMsg_Menu;
oMyMessages.screen_Name = "message_MyMessages";
oMyMessages.module_Name = "messageBoard";


oMyMessages.custom_Show = function()
{
    this.GetUsersMessages();
}

/*--------------------------------------------------------------------------
    Retrieve unread messages from the server
----------------------------------------------------------------------------*/
oMyMessages.GetUsersMessages = function()
{
    /*--------------------------------------------------------------------------
        Retrieve all of the user's messages: 
        This calls the server synchronously, retrieves the list of the user's 
        messages and writes them to the results list. We must call the server
        synchronously because an asynchronous call causes the "No Results Found"
        message to be displayed briefly before the list loads even if there are 
        messages . 
    ----------------------------------------------------------------------------*/
    this.serverValues = null;
    this.serverValues = Object();
    
    this.serverValues.location = strMessageURL;
    this.serverValues.action = "getusersmessages";

    usersMessages_Parse(server.callSync(this.serverValues));

    return true;
}

/*--------------------------------------------------------------------------
    Needed for the function call wrapper called in RetreiveRights
----------------------------------------------------------------------------*/
function usersMessages_Parse(strResults)
{
    oMyMessages.ParseUsersMessages(strResults);
}

/*--------------------------------------------------------------------------
    Process the results we receive back from the server
----------------------------------------------------------------------------*/
oMyMessages.ParseUsersMessages = function(strResults)
{
    this.oMessageTable.SetList(strResults);
    this.oMessageTable.Display();
}

/*--------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
----------------------------------------------------------------------------*/

oMyMessages.custom_Load = function()
{
	// Create the results table
	this.oMessageTable = new system_SortTable();
	this.oMessageTable.setName("My_Messages");
    

    /*--------------------------------------------------------------------------
		Fill the header table for messages not read by the user
	----------------------------------------------------------------------------*/
	arHeader = Array();
	
	arHeader[0] = Object();
		arHeader[0].text = "Author";
		arHeader[0].sort = true;
		arHeader[0].dataType = "string";
		arHeader[0].fieldName = "user_Name";
	arHeader[1] = Object();
		arHeader[1].text = "Subject";
		arHeader[1].sort = true;
		arHeader[1].dataType = "string";
		arHeader[1].fieldName = "msg_subject";
	arHeader[2] = Object();
		arHeader[2].text = "Posted/Expires";
		arHeader[2].sort = true;
		arHeader[2].dataType = "date";
		arHeader[2].fieldName = "msg_create_date";
	arHeader[3] = Object();
		arHeader[3].sort = true;
		arHeader[3].text = "Organization";
		arHeader[3].dataType = "string";
		arHeader[3].fieldName = "org_Short_Name";
	arHeader[4] = Object();
		arHeader[4].sort = true;
		arHeader[4].text = "Priority";
		arHeader[4].dataType = "string";
		arHeader[4].fieldName = "msgPri_name";
	arHeader[5] = Object();
		arHeader[5].text = "Actions";

    this.oMessageTable.SetHeader(arHeader);
    this.oMessageTable.SetNoResultsMessage("You have not submitted any messages.");
    this.oMessageTable.custom_element = MyMessage_DisplayElement;
    this.oMessageTable.pageLength = 10;
    
    this.oMessageTable.Display();
		
	return true;
}

/*--------------------------------------------------------------------------
    Fill out the custom display function for user submitted messages.
----------------------------------------------------------------------------*/
function MyMessage_DisplayElement(listPosition)
{ 
		i = listPosition;
		
		/*--------------------------------------------------------------------------
			Display the titles of the fields in the header.
			Create and display the table with searched results found.
		----------------------------------------------------------------------------*/
        var strSubject = (this.list[i]["msg_subject"]);					
		var strBody = (this.list[i]["msg_body"]);
		
		/*--------------------------------------------------------------------------
		    Format the date from YYYY-MM-DD (the format in in the Database)to a
		    more customary MM/DD/YYYY.
	    ----------------------------------------------------------------------------*/
		displayDate = formatDate(this.list[i]["msg_create_date"]);
		strExpDate = this.list[i].msg_exp_date;
        /*--------------------------------------------------------------------------
			Display "No Expiration Date" if no expiration date exists for a message  
		----------------------------------------------------------------------------*/
        if(strExpDate == "0000-00-00")
		{
			strExpDate = "No Expiration";
		}
        else
		{
			strExpDate = formatDate(this.list[i]["msg_exp_date"]);
		}

		strOrg = this.list[i]["org_Short_Name"];
		strUserName = this.list[i]["user_Name"];
				
		/*--------------------------------------------------------------------------
			Populate the results table and set up table formatting.
		----------------------------------------------------------------------------*/
		var resultRow = document.createElement("TR");
		resultRow.vAlign  = "top";
		
		this.element_body.appendChild(resultRow);
		
		oSystem_Colors.SetPrimary(resultRow);
		
		if(i % 2 == 1)
		{
			oSystem_Colors.SetSecondaryBackground(resultRow);
		}
		else
		{
			oSystem_Colors.SetTertiaryBackground(resultRow);
		}

		var resultCol = document.createElement("TD");
		resultRow.appendChild(resultCol);
		resultCol.appendChild(document.createTextNode(strUserName));
		resultCol.align = "center";
		
		var resultCol2 = document.createElement("TD");
		resultRow.appendChild(resultCol2);
		
		resultCol2.title = strBody.substring(0,100);
		
		resultDiv = document.createElement("DIV");
		resultCol2.appendChild(resultDiv);
		
		resultDiv.style.width="200px";
		resultDiv.style.overflow = "hidden";
		screen_SetTextElement(resultDiv, strSubject);

		var resultCol3 = document.createElement("TD");
		resultRow.appendChild(resultCol3);
		screen_SetTextElement(resultCol3, displayDate);
		resultCol3.align = "center";

        resultCol3Break = document.createElement("BR");
        resultCol3.appendChild(resultCol3Break);
        resultCol3ExpDate = document.createElement("SPAN");
        resultCol3.appendChild(resultCol3ExpDate);
        screen_SetTextElement(resultCol3ExpDate, strExpDate);
        resultCol3ExpDate.style.fontSize="80%";

		var resultCol4 = document.createElement("TD");
		resultRow.appendChild(resultCol4);
		screen_SetTextElement(resultCol4, strOrg);
		resultCol4.align = "center";
		
		var resultCol5 = document.createElement("TD");
		resultRow.appendChild(resultCol5);
		screen_SetTextElement(resultCol5, this.list[i]["msgPri_name"]);
		resultCol5.align = "center";
		
		resultRow.appendChild(MyMessage_GetActions(this.list[i]));
}
		
/*--------------------------------------------------------------------------
	GetMessageActions sets up the list of different actions which
	can be performed on the message listed in the search results	
----------------------------------------------------------------------------*/
function MyMessage_GetActions(listItem)
{
	strOrg = listItem["org_Short_Name"];
	strUserName = listItem["user_Name"];
	messageId = listItem["msg_ID"];

	/*--------------------------------------------------------------------------
		Declare all of the variables
	----------------------------------------------------------------------------*/
	var resultTag = document.createElement("TD");
	var viewTag = document.createElement("SPAN");
	var modifyTag = document.createElement("SPAN");
	var deleteTag = document.createElement("SPAN");

	var break1 = document.createElement("BR");
	var break2 = document.createElement("BR");
		
	/*--------------------------------------------------------------------------
		Assign their value, set their attributes
	----------------------------------------------------------------------------*/	
	resultTag.rowSpan = "1";
	
	viewTag.className = "link";
	modifyTag.className = "link";
	deleteTag.className = "link";
	viewTag.appendChild(document.createTextNode("View"));
	viewTag.messageId = messageId;
	modifyTag.appendChild(document.createTextNode("Modify"));
	modifyTag.messageId = messageId;
	deleteTag.appendChild(document.createTextNode("Delete"));
	deleteTag.messageId = messageId;

	viewTag.onclick = function ()
	{
		oViewMessage.View(this.messageId, strmyMsg_Menu); 
	}
	
	modifyTag.onclick = function ()
	{
		oModifyMessage.Modify(this.messageId, strmyMsg_Menu);
	}

	deleteTag.onclick = function ()
	{
		oMessageRemove.Remove(this.messageId, strmyMsg_Menu);
	}
	
	/*--------------------------------------------------------------------------
		Now append everything to the div tag in order
	----------------------------------------------------------------------------*/
	resultTag.appendChild(viewTag);
	resultTag.appendChild(break1);
	
	if(oUser.HasRight(oRights.MSG_BOARD_Admin, strOrg) || (oUser.user_Name == strUserName))
	{
		resultTag.appendChild(modifyTag);	
		resultTag.appendChild(break2);
		resultTag.appendChild(deleteTag);
	}
	resultTag.align = "center";	
	
	return resultTag;	
}

oMyMessages.register();