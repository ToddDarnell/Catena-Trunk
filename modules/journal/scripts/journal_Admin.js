/*--------------------------------------------------------------------------
	The purpose of this file is to allow supervisors to access journal entries.
	Supervisors will be able to search for journal entries about a specific 
	employee in their org. hierarchy, and search for journal entries written by 
	employees in their org. hierarchy. They can filter the searches further by
	searching for a combination of these two options (subject and posting employee),
	and can further limit the results by a using date range to get only entries
	posted during a certain time period.
----------------------------------------------------------------------------*/
var strJournalURL = "../modules/journal/server/journal";
var stJournalAdmin_Menu = "Journal Admin";

oJournalAdmin = new system_SearchScreen();

oJournalAdmin.screen_Menu = stJournalAdmin_Menu;
oJournalAdmin.screen_Name = "journal_Admin";
oJournalAdmin.search_List = "getjournalentries";
oJournalAdmin.module_Name = "journal";
oJournalAdmin.search_URL = strJournalURL;

/*--------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
----------------------------------------------------------------------------*/
oJournalAdmin.custom_Show = function()
{  
	this.clear();
	return true;
}

oJournalAdmin.custom_Load = function () 
{
	
	/*--------------------------------------------------------------------------
		Adds the calendar to the Journal Admin page. When the user selects a 
		month, days and years appear. Number of days are determined by the month.
	----------------------------------------------------------------------------*/
	yearDate = new Date();
	startYear = yearDate.getFullYear() - 4;
	yearDate = null;

	this.oJournalAdminCalendarFrom = new system_Calendar();
	this.oJournalAdminCalendarFrom.load("Journal_CalendarFrom");
	this.oJournalAdminCalendarFrom.setYearList(startYear, 5);

	
	this.oJournalAdminCalendarTo = new system_Calendar();
	this.oJournalAdminCalendarTo.load("Journal_CalendarTo");
	this.oJournalAdminCalendarTo.setYearList(startYear, 5);
	
	this.element_SubjectSelected = oScreenBuffer.Get("journalAdminSubject_SelectedUser");
	this.element_PosterSelected = oScreenBuffer.Get("journalAdminPoster_SelectedUser");

	/*--------------------------------------------------------------------------
		Subject user filter for acquiring the subject's user name
	--------------------------------------------------------------------------*/
	
	this.oUserFilterSubject = new system_UserOrgSelection();
	this.oUserFilterSubject.load("JournalAdminBox", "userManagement_SubjectPopup", eDisplayUserList);

	this.oUserFilterSubject.setLocation(25, 30);

	this.oUserFilterSubject.custom_submit = function (selectedUser)
	{
		oJournalAdmin.SelectUser(selectedUser);
		return true;
	}
	
	this.element_UserEdit = oScreenBuffer.Get("journalAdminSubject_UserEdit");
	this.element_UserEditPoster = oScreenBuffer.Get("journalAdminPoster_UserEdit");
		
	/*--------------------------------------------------------------------------
		Build the results table header. Also determines which fields are sortable
		and which database fields they are sorted by. 
	----------------------------------------------------------------------------*/	
	arHeader = Array();
	
	arHeader[0] = Object();
		arHeader[0].text = "Poster";
		arHeader[0].sort = true;
		arHeader[0].dataType = "string";
		arHeader[0].fieldName = "Poster";
	arHeader[1] = Object();
		arHeader[1].text = "Event Date";
		arHeader[1].sort = true;
		arHeader[1].dataType = "date";
		arHeader[1].fieldName = "journal_Date";
	arHeader[2] = Object();
		arHeader[2].text = "Subject";
		arHeader[2].sort = true;
		arHeader[2].dataType = "string";
		arHeader[2].fieldName = "Subject"; 
	arHeader[3] = Object();
		arHeader[3].sort = true; 
		arHeader[3].text = "Category";
		arHeader[3].dataType = "string";
		arHeader[3].fieldName = "journal_Category";
	arHeader[4] = Object();
		arHeader[4].sort = true; 
		arHeader[4].text = "Event Description";
		arHeader[4].dataType = "string";
		arHeader[4].fieldName = "journal_Body";
	arHeader[5] = Object();
		arHeader[5].text = "Actions";

    this.oResults.SetHeader(arHeader);
    this.oResults.SetCaption("Results");
    this.oResults.pageLength = 10;
    
    this.oResults.custom_element = JournalAdmin_DisplayElement;		
	
	this.element_AdminType = oScreenBuffer.Get("journalAdmin_Type");

	this.element_AdminOrg = oScreenBuffer.Get("journalAdmin_Org");

	oRights.fillOrgControl(oRights.JOURNAL_Admin, "journalAdmin_Org", true);

	//oJournalAdminType.load();
	//oJournalAdminType.fillControl(this.element_AdminType, false, 2);
	
	return true;
}

//--------------------------------------------------------------------------
/**
	\brief
		Select User is called when the oUserFilter has a name selected or 
		unselected in the user field
	\param userName
		userName is the selected user
	\return
		none
*/
//--------------------------------------------------------------------------
oJournalAdmin.SelectUser = function(userName)
{
	if(userName)
	{
		var oUsers = new system_UserList();
		
		oUsers.addParam("name", userName);
		oUsers.load();

		user_record = oUsers.get(userName);
		userOrg = user_record.org_Short_Name;

		this.element_UserEdit.value = userName;
		strDisplay = userName;
		
		if(userName.length > 0)
		{
			strDisplay = strDisplay + " (" + userOrg + ")";
		}

		screen_SetTextElement(this.element_SubjectSelected, strDisplay);
	}
	else
	{
		screen_SetTextElement(this.element_SubjectSelected, "");
		this.element_UserEdit.value = "";
	}
}

/*--------------------------------------------------------------------------
	Custom Submit performs any special cases which need to be performed
    before the data is submitted.
----------------------------------------------------------------------------*/
oJournalAdmin.custom_Submit = function ()
{
	oScreenBuffer.Get("Journal_HiddenFromDate").value = this.oJournalAdminCalendarFrom.getDate();
	oScreenBuffer.Get("Journal_HiddenToDate").value = this.oJournalAdminCalendarTo.getDate();

	if((this.element_UserEdit.value.length == 0) && (this.element_AdminOrg.value.length == 0))
	{
		oCatenaApp.showNotice(notice_Error, "Please select an employee or an organization to view.");		
		return false;
	}
	return true;
}
	
/*--------------------------------------------------------------------------
	Custom clear allows a developer to add custom functionality
	to clear elements which are not part of the base class but
	must be cleared.
----------------------------------------------------------------------------*/
oJournalAdmin.custom_Clear = function()
{
	this.oUserFilterSubject.clear();
	this.oJournalAdminCalendarFrom.reset();
	this.oJournalAdminCalendarTo.reset();
	//this.HideMessage();
	this.SelectUser("");
	this.element_AdminOrg.value = "";
	oJournalAdminType.load();
	oJournalAdminType.fillControl(this.element_AdminType, false, 2);

}
/*--------------------------------------------------------------------------
	fnProcess is called once the data has been received
	from the server. Since we have to use a stand alone
	function due to the way JavaScript treats functions
	we're creating a wrapper call back function.
----------------------------------------------------------------------------*/
oJournalAdmin.fnProcess = function(strResults)
{
	oJournalAdmin.ProcessResults(strResults);
}

/*--------------------------------------------------------------------------
	Display the results returned from the server. 
	Builds a table and outputs values to the screen in the results table.
	If no results are displayed this function is not called
----------------------------------------------------------------------------*/
function JournalAdmin_DisplayElement(listPosition)
{
	i = listPosition;
	
	/*--------------------------------------------------------------------------
		Display the titles of the fields in the header.
		Create and display the table with searched results found.
	----------------------------------------------------------------------------*/
	var strSubject = this.list[i].Subject;		
	var strPoster = this.list[i].Poster;			
	
	/*--------------------------------------------------------------------------
		Format the date from YYYY-MM-DD (the format in in the Database)to a
		more customary MM/DD/YYYY.  
	----------------------------------------------------------------------------*/
	strPostDate = formatDate(this.list[i]["journal_Date"]);
	
	/*--------------------------------------------------------------------------
		Format the description to display 100 characters and then an ellipsis in 
		the	search results.
	----------------------------------------------------------------------------*/
	strDisplayBody = Truncate(this.list[i]["journal_Body"], 100);
			
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
	resultCol.appendChild(screen_CreateUserLink(strPoster));
	resultCol.align = "center";
	resultCol.style.paddingLeft = "6px";
	resultCol.style.paddingRight = "6px";
	
	var resultCol2 = document.createElement("TD");
	resultRow.appendChild(resultCol2);
	resultCol2.innerHTML = strPostDate;
	resultCol2.align = "center"; 
	resultCol2.style.paddingLeft = "6px";
	resultCol2.style.paddingRight = "6px";
	
	var resultCol3 = document.createElement("TD");
	resultRow.appendChild(resultCol3);
	resultCol3.appendChild(screen_CreateUserLink(strSubject));
	resultCol3.align = "center";
	resultCol3.style.paddingLeft = "6px";
	resultCol3.style.paddingRight = "6px";

	var resultCol4 = document.createElement("TD");
	resultRow.appendChild(resultCol4);
	resultCol4.innerHTML = this.list[i].jrnCat_Name;
	resultCol4.align = "center";
	resultCol4.style.paddingLeft = "6px";
	resultCol4.style.paddingRight = "6px";		
	
	var resultCol5 = document.createElement("TD");
	resultRow.appendChild(resultCol5);
	resultDiv = document.createElement("DIV");
	resultCol5.appendChild(resultDiv);
	resultDiv.style.width="200px";
	resultDiv.style.paddingLeft = "6px";
	resultDiv.style.paddingRight = "6px";
	resultDiv.style.paddingBottom = "6px";
	screen_SetTextElement(resultDiv, strDisplayBody);
	
	resultRow.appendChild(Journal_GetActions(this.list[i]));
	
}

/*--------------------------------------------------------------------------
	Journal_GetActions sets up the list of different actions which
	can be performed on the journal entry listed in the search results	
----------------------------------------------------------------------------*/
function Journal_GetActions(listItem)
{
	strOrg = listItem["org_Short_Name"];
	strUserName = listItem["user_Name"];
	journalId = listItem["journal_ID"];

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
	viewTag.journalId = journalId;
	modifyTag.appendChild(document.createTextNode("Modify"));
	modifyTag.journalId = journalId;
	deleteTag.appendChild(document.createTextNode("Delete"));
	deleteTag.journalId = journalId;

	viewTag.onclick = function ()
	{
		oJournalView.View(this.journalId, stJournalAdmin_Menu); 
	}
	
	modifyTag.onclick = function ()
	{
		oJournalModify.Modify(this.journalId, stJournalAdmin_Menu);
	}

	deleteTag.onclick = function ()
	{
		oJournalRemove.Display(this.journalId, stJournalAdmin_Menu);
	}
	
	/*--------------------------------------------------------------------------
		Now append everything to the div tag in order
	----------------------------------------------------------------------------*/
	
	if(oUser.HasRight(oRights.JOURNAL_Admin, strOrg));
	{
		resultTag.appendChild(viewTag);
		resultTag.appendChild(break1);
		resultTag.appendChild(modifyTag);	
		resultTag.appendChild(break2);
		resultTag.appendChild(deleteTag);
	}
	resultTag.align = "center";	
	resultTag.style.paddingLeft = "6px";
	resultTag.style.paddingRight = "6px";
	
	return resultTag;	
};

oJournalAdmin.register();