/*--------------------------------------------------------------------------
	The purpose of this file is to allow supervisors to search messages by 
	user and see whether they have unread messages. This file also allows 
	admin users to see when a user has read a specific message. 
----------------------------------------------------------------------------*/
var stMsgAudit_Menu = "Audit Messages";

oMessageAudit = new system_SearchScreen();

oMessageAudit.screen_Menu = stMsgAudit_Menu;
oMessageAudit.screen_Name = "message_Audit";
oMessageAudit.module_Name = "messageBoard";

oMessageAudit.search_List = "getmessageauditlist";

oMessageAudit.search_URL = strMessageURL;

oMessageAudit.oUserFilter = null;
oMessageAudit.strField_Subject = "msgAuditSubject";

/*--------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
----------------------------------------------------------------------------*/
oMessageAudit.custom_Show = function()
{  
	this.clear();
	return true;
}

oMessageAudit.custom_Load = function () 
{	
	this.element_UserSelected = oScreenBuffer.Get("messageAudit_SelectedUser");

	/*--------------------------------------------------------------------------
		Subject user filter for acquiring the subject's user name
	--------------------------------------------------------------------------*/
	
	this.oUserFilter = new system_UserOrgSelection();
	this.oUserFilter.load("MessageAuditBox", "messageaud_UserPopup", eDisplayUserList);

	this.oUserFilter.setLocation(25, 30);

	this.oUserFilter.custom_submit = function (selectedUser)
	{
		oMessageAudit.SelectUser(selectedUser);
		return true;
	}
	
	this.element_UserInput = oScreenBuffer.Get("msgAudit_User");

	/*--------------------------------------------------------------------------
		Adds the calendar to the Message Audit page. When the user selects a 
		month, days and years appear. Number of days are determined by the month.
	----------------------------------------------------------------------------*/

	yearDate = new Date();
	startYear = yearDate.getFullYear() - 4;
	yearDate = null;
	
	this.oAuditCalendarFrom = new system_Calendar();
	this.oAuditCalendarFrom.load("msgAudit_CalendarFrom");
	this.oAuditCalendarFrom.setYearList(startYear, 5);
	
	this.oAuditCalendarTo = new system_Calendar();
	this.oAuditCalendarTo.load("msgAudit_CalendarTo");
	this.oAuditCalendarTo.setYearList(startYear, 5);
	
	/*--------------------------------------------------------------------------
		Build the results table header. Also determines which fields are sortable
		and which database fields they are sorted by. 
	----------------------------------------------------------------------------*/	
	arHeader = Array();
	
	arHeader[0] = Object();
		arHeader[0].text = "Subject";
		arHeader[0].sort = true;
		arHeader[0].dataType = "string";
		arHeader[0].fieldName = "msg_subject";
	arHeader[1] = Object();
		arHeader[1].text = "Post Date";
		arHeader[1].sort = true;
		arHeader[1].dataType = "date";
		arHeader[1].fieldName = "msg_create_date";
	arHeader[2] = Object();
		arHeader[2].text = "Read Status";
		arHeader[2].sort = true;
		arHeader[2].dataType = "string";
		arHeader[2].fieldName = "msg_read_date"; 
	arHeader[3] = Object();
		arHeader[3].sort = true; 
		arHeader[3].text = "Read Time";
		arHeader[3].dataType = "date";
		arHeader[3].fieldName = "msg_read_date";

    this.oResults.SetHeader(arHeader);
    this.oResults.SetCaption("Results");
    this.oResults.pageLength = 10;
    
    this.oResults.custom_element = MessageAudit_DisplayElement;		
		
	return true;
}
/*
	Select user is called when the oUserFilter has a name selected
	or unselected.
*/
oMessageAudit.SelectUser = function(userName)
{
	/*
		-	tell the user which user account they selected
			via the text box to the right of the user name drop down list
		-	Populate the individual rights fields with the accounts
			assigned and available rights.
	*/
		if(userName)
	{
		var oUsers = new system_UserList();

		oUsers.addParam("name", userName);
		oUsers.load();

		user_record = oUsers.get(userName);
		userOrg = user_record.org_Short_Name;

		this.element_UserInput.value = userName;
		screen_SetTextElement(this.element_UserSelected, userName + " (" + userOrg + ")");
	}
	else
	{
		this.element_UserInput.value = "";
		screen_SetTextElement(this.element_UserSelected, "");
	}
	
	/*if(userName)
	{
		oScreenBuffer.Get("msgAudit_User").value = userName;
	}
	else
	{
		oScreenBuffer.Get("msgAudit_User").value = "";
	}*/
}

/*--------------------------------------------------------------------------
	Custom Submit performs any special cases which need to be performed
    before the data is submitted.
----------------------------------------------------------------------------*/
oMessageAudit.custom_Submit = function ()
{
	oScreenBuffer.Get("msgAudit_HiddenFrom").value = this.oAuditCalendarFrom.getDate();
	oScreenBuffer.Get("msgAudit_HiddenTo").value = this.oAuditCalendarTo.getDate();
	
	if(oScreenBuffer.Get("msgAudit_User").value.length == 0)
	{
		this.clear();
		oCatenaApp.showNotice(notice_Error, "Please select a user to audit.");
		return false;
	}
	return true;
}
	
/*--------------------------------------------------------------------------
	Custom clear allows a developer to add custom functionality
	to clear elements which are not part of the base class but
	must be cleared.
----------------------------------------------------------------------------*/
oMessageAudit.custom_Clear = function()
{
	oScreenBuffer.Get(this.strField_Subject).value = "";
	this.oUserFilter.clear();
	this.oAuditCalendarFrom.reset();
	this.oAuditCalendarTo.reset();
	this.HideMessage();
	this.SelectUser("");
}

/*--------------------------------------------------------------------------
	fnProcess is called once the data has been received
	from the server. Since we have to use a stand alone
	function due to the way JavaScript treats functions
	we're creating a wrapper call back function.
----------------------------------------------------------------------------*/
oMessageAudit.fnProcess = function(strResults)
{
	oMessageAudit.ProcessResults(strResults);
}

/*--------------------------------------------------------------------------
	Display the results returned from the server. 
	Builds a table and outputs values to the screen in the results table.
	If no results are displayed this function is not called
----------------------------------------------------------------------------*/
function MessageAudit_DisplayElement(listPosition)
{
	/*--------------------------------------------------------------------------
		Display the titles of the fields in the header.
		Create and display the table with searched results found.
	----------------------------------------------------------------------------*/
	i = listPosition;
	
	var strSubject = this.list[i].msg_subject;	
	var strUserName = this.list[i].user_Name;				
	
	/*--------------------------------------------------------------------------
		Format the date from YYYY-MM-DD (the format in in the Database)to a
		more customary MM/DD/YYYY.  
	----------------------------------------------------------------------------*/
	strPostDate = formatDate(this.list[i]["msg_create_date"]);
	/*--------------------------------------------------------------------------
		Format the datetime stamp from YYYY-MM-DD HH:MM:SS
		(the format in in the Database)to a more customary MM/DD/YYYY
		and the time to HH:MM.  
	----------------------------------------------------------------------------*/
	if(this.list[i]["msg_read_date"].length)
	{
		strReadStatus = "Read";
		strReadDate = formatDateTime(this.list[i]["msg_read_date"]);
	}
	else
	{
		strReadStatus = "Unread";
		strReadDate = " ";
	}
			
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
	
	resultDiv = document.createElement("DIV");
	resultCol.appendChild(resultDiv);
	
	resultDiv.style.width="300px";
	resultDiv.style.overflow = "hidden";
	screen_SetTextElement(resultDiv, strSubject);
	
	var resultCol2 = document.createElement("TD");
	resultRow.appendChild(resultCol2);
	resultCol2.innerHTML = strPostDate;
	resultCol2.align = "center";

	var resultCol3 = document.createElement("TD");
	resultRow.appendChild(resultCol3);
	resultCol3.innerHTML = strReadStatus; 
	resultCol3.align = "center"; 

	var resultCol4 = document.createElement("TD");
	resultRow.appendChild(resultCol4);
	resultCol4.innerHTML = strReadDate.replace(" ", "<br />");// This puts a nice line break between the date and the time for clean formatting. It only replaces the first space with a line break so we don't have issues with other spaces.
	resultCol4.align = "center"; 
				
}

oMessageAudit.register();
