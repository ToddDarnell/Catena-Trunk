/*--------------------------------------------------------------------------
	The purpose of this file is to search for messages.
----------------------------------------------------------------------------*/
var strSearchMsg_Menu = "Search Messages";

oSearchMessage = new system_SearchScreen();

oSearchMessage.screen_Menu = strSearchMsg_Menu;
oSearchMessage.screen_Name = "message_Search";
oSearchMessage.search_List = "getmessagelist";
oSearchMessage.module_Name = "messageBoard";

oSearchMessage.search_URL = strMessageURL;

oSearchMessage.strField_Subject = "SearchMsgSubject";
oSearchMessage.strField_Message = "SearchMsgBody";
oSearchMessage.strField_Poster = "SearchMsgPoster";
oSearchMessage.strField_PriList = "SearchMsgPriority";

/*--------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
----------------------------------------------------------------------------*/
oSearchMessage.custom_Show = function()
{  
	//oSystem_Debug.notice("In show");
 	this.LoadLists();
	//this.clear();
	return true;
};

oSearchMessage.custom_Load = function () 
{
	this.element_PosterSelected = oScreenBuffer.Get("SearchMsg_SelectedUser");
	this.element_OrgSelected = oScreenBuffer.Get("SearchMsg_SelectedOrg");

	this.oUserFilter = new system_UserOrgSelection();
	this.oUserFilter.load("messageBoardSearch", "msgSearch_UserPopup", eDisplayUserList);

	this.oUserFilter.setLocation(20, 240);

	this.oUserFilter.custom_submit = function (selectedUser)
	{
		oSearchMessage.SelectUser(selectedUser);
		return true;
	}

	this.oOrgFilter = new system_UserOrgSelection();
	this.oOrgFilter.load("messageBoardSearch", "msgSearch_OrgPopup", eDisplayOrgList);
	
	this.oOrgFilter.setLocation(320, 240);

	this.oOrgFilter.custom_submit = function (selectedOrg)
	{
		oSearchMessage.SelectOrg(selectedOrg);
		return true;
	}
		
	this.element_UserInput = oScreenBuffer.Get("SearchMsgPoster");
	this.element_OrgInput = oScreenBuffer.Get("SearchMsgOrganization");

	/*--------------------------------------------------------------------------
		Adds the calendar to the Search Message Page. When the user selects a 
		month, days and years appear. Number of days are determined by the month.
	----------------------------------------------------------------------------*/
	
	yearDate = new Date();
	startYear = yearDate.getFullYear() - 4;
	yearDate = null;
	
	this.oSearchCalendarFrom = new system_Calendar();
	this.oSearchCalendarFrom.load("MsgSearch_CalendarFrom");
	this.oSearchCalendarFrom.setYearList(startYear, 5);

	this.oSearchCalendarTo = new system_Calendar();
	this.oSearchCalendarTo.load("MsgSearch_CalendarTo");
	this.oSearchCalendarTo.setYearList(startYear, 5);
	
	yearDate = new Date();
	this.oSearchCalendarTo.yearCount = 5;

	oSystem_Debug.notice("Start Year: " + yearDate.getFullYear());
	
	this.oSearchCalendarTo.startYear = yearDate.getFullYear() - this.oSearchCalendarTo.yearCount;

	this.oSearchCalendarFrom.yearCount = 5;

	this.oSearchCalendarFrom.startYear = yearDate.getFullYear() - this.oSearchCalendarFrom.yearCount;
	
	/*--------------------------------------------------------------------------
		Build the results table header. Also determines which fields are sortable
		and which database fields they are sorted by. 
	----------------------------------------------------------------------------*/	
	arHeader = new Array();
	
	arHeader[0] = new Object();
		arHeader[0].text = "Author";
		arHeader[0].sort = true;
		arHeader[0].dataType = "string";
		arHeader[0].fieldName = "user_Name";
	arHeader[1] = new Object();
		arHeader[1].text = "Subject";
		arHeader[1].sort = true;
		arHeader[1].dataType = "string";
		arHeader[1].fieldName = "msg_subject";
	arHeader[2] = new Object();
		arHeader[2].text = "Posted/Expires";
		arHeader[2].sort = true;
		arHeader[2].dataType = "date";
		arHeader[2].fieldName = "msg_create_date";
	arHeader[3] = new Object();
		arHeader[3].sort = true;
		arHeader[3].text = "Organization";
		arHeader[3].dataType = "string";
		arHeader[3].fieldName = "org_Short_Name";
	arHeader[4] = new Object();
		arHeader[4].sort = true;
		arHeader[4].text = "Priority";
		arHeader[4].dataType = "string";
		arHeader[4].fieldName = "msgPri_name";
	arHeader[5] = new Object();
		arHeader[5].text = "Actions";

    this.oResults.SetHeader(arHeader);
    this.oResults.SetCaption("Results");
    this.oResults.pageLength = 10;

    this.oResults.custom_element = SearchMessage_DisplayElement;

	return true;
};

/*--------------------------------------------------------------------------
	SelectOrg populates the organization field with the organization 
	selected in the organization popup
--------------------------------------------------------------------------*/
oSearchMessage.SelectOrg = function(userOrg)
{
	if(userOrg)
	{
		this.element_OrgInput.value = userOrg;
		screen_SetTextElement(this.element_OrgSelected, userOrg);
	}
	else
	{
		this.element_OrgInput.value = "";
		screen_SetTextElement(this.element_OrgSelected, "");
	}
}

/*--------------------------------------------------------------------------
	Select user is called when the oUserFilter has a name selected
	or unselected.
--------------------------------------------------------------------------*/
oSearchMessage.SelectUser = function(userName)
{
	if(userName)
	{
		var oUsers = new system_UserList();
		oUsers.addParam("name", userName);
		oUsers.load();

		user_record = oUsers.get(userName);
		userOrg = user_record.org_Short_Name;

		this.element_UserInput.value = userName;
		screen_SetTextElement(this.element_PosterSelected, userName + " (" + userOrg + ")");
	}
	else
	{
		this.element_UserInput.value = "";
		screen_SetTextElement(this.element_PosterSelected, "");
	}
}

/*--------------------------------------------------------------------------
	Custom Submit performs any special cases which need to be performed
    before the data is submitted.
----------------------------------------------------------------------------*/
oSearchMessage.custom_Submit = function ()
{
	oScreenBuffer.Get("msg_hiddenFrom").value = this.oSearchCalendarFrom.getDate();
	oScreenBuffer.Get("msg_hiddenTo").value = this.oSearchCalendarTo.getDate();
	return true;
};

/*--------------------------------------------------------------------------
	Loads the lists used by search message
----------------------------------------------------------------------------*/
oSearchMessage.LoadLists = function()
{
    oPriorityList.load();
	oPriorityList.fillControl(this.strField_PriList, true);
};

/*--------------------------------------------------------------------------
	Custom clear allows a developer to add custom functionality
	to clear elements which are not part of the base class but
	must be cleared.
----------------------------------------------------------------------------*/
oSearchMessage.custom_Clear = function()
{
	oScreenBuffer.Get(this.strField_Subject).value = "";
	oScreenBuffer.Get(this.strField_Message).value = "";
	oScreenBuffer.Get(this.strField_PriList).value = "";
	this.oSearchCalendarFrom.reset();
	this.oSearchCalendarTo.reset();
	this.HideMessage();
	this.oUserFilter.clear();
	this.oOrgFilter.clear();
	this.SelectOrg("");
	this.SelectUser("");
};

/*--------------------------------------------------------------------------
	fnProcess is called once the data has been received
	from the server. Since we have to use a stand alone
	function due to the way JavaScript treats functions
	we're creating a wrapper call back function.
----------------------------------------------------------------------------*/
oSearchMessage.fnProcess = function(strResults)
{
	oSearchMessage.ProcessResults(strResults);
};
/*--------------------------------------------------------------------------
	Display the results returned from the server. 
	Builds a table and outputs values to the screen in the results table.
	If no results are displayed this function is not called
----------------------------------------------------------------------------*/
function SearchMessage_DisplayElement(listPosition)
{
	i = listPosition;

	/*--------------------------------------------------------------------------
		Display the titles of the fields in the header.
		Create and display the table with searched results found.
	----------------------------------------------------------------------------*/
	var strSubject = (this.list[i].msg_subject);					
	var strBody = (this.list[i].msg_body);
	
	/*--------------------------------------------------------------------------
		Format the date from YYYY-MM-DD (the format in in the Database)to a
		more customary MM/DD/YYYY.
	----------------------------------------------------------------------------*/
	displayDate = formatDate(this.list[i].msg_create_date);
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
		strExpDate = formatDate(this.list[i].msg_exp_date);
	}

	strOrg = this.list[i].org_Short_Name;
	strUserName = this.list[i].user_Name;
			
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
	resultCol.appendChild(screen_CreateUserLink(strUserName));
	resultCol.align = "center";
	
	var resultCol2 = document.createElement("TD");
	resultRow.appendChild(resultCol2);
	resultCol2.title = strBody.substring(0,100).replace(/\n/g, " ");
	resultDiv = document.createElement("DIV");
	resultCol2.appendChild(resultDiv);
	resultDiv.style.width="200px";
	resultDiv.style.paddingLeft = "6px";
	resultDiv.style.overflow = "hidden";
	screen_SetTextElement(resultDiv, strSubject);
	

	var resultCol3 = document.createElement("TD");
	resultRow.appendChild(resultCol3);
	resultCol3.innerHTML = displayDate;
	resultCol3.align = "center";
    resultCol3Break = document.createElement("BR");
    resultCol3.appendChild(resultCol3Break);
    resultCol3ExpDate = document.createElement("SPAN");
    resultCol3.appendChild(resultCol3ExpDate);
    screen_SetTextElement(resultCol3ExpDate, strExpDate);
    resultCol3ExpDate.style.fontSize="80%";

	var resultCol4 = document.createElement("TD");
	resultRow.appendChild(resultCol4);
	resultCol4.align = "center";
	resultCol4.appendChild(screen_CreateOrganizationLink(strOrg));
	
	var resultCol5 = document.createElement("TD");
	resultRow.appendChild(resultCol5);
	resultCol5.innerHTML = this.list[i].msgPri_name;
	resultCol5.align = "center";
	
	resultRow.appendChild(SearchMessage_GetActions(this.list[i]));
};
		
/*--------------------------------------------------------------------------
	GetMessageActions sets up the list of different actions which
	can be performed on the message listed in the search results	
----------------------------------------------------------------------------*/
function SearchMessage_GetActions(listItem)
{
	strOrg = listItem.org_Short_Name;
	strUserName = listItem.user_Name;
	messageId = listItem.msg_ID;

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
		oViewMessage.View(this.messageId, strSearchMsg_Menu); 
	};
	
	modifyTag.onclick = function ()
	{
		oModifyMessage.Modify(this.messageId, strSearchMsg_Menu);
	};

	deleteTag.onclick = function ()
	{
		oMessageRemove.Remove(this.messageId, strSearchMsg_Menu);
	};
	
	/*--------------------------------------------------------------------------
		Now append everything to the div tag in order
	----------------------------------------------------------------------------*/
	resultTag.appendChild(viewTag);
	resultTag.appendChild(break1);
	
	if(oUser.HasRight(oRights.MSG_BOARD_Admin, strOrg) || (oUser.HasRight(oRights.MSG_BOARD_Standard, strOrg) && (oUser.user_Name == strUserName)))
	{
		resultTag.appendChild(modifyTag);	
		resultTag.appendChild(break2);
		resultTag.appendChild(deleteTag);
	}
	resultTag.align = "center";	
	
	return resultTag;	
};

oSearchMessage.register();