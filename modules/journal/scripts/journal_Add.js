/*-----------------------------------------------------------------------------
	The purpose of this file is to create and manage a screen for all 
	user journal entries.
-------------------------------------------------------------------------------*/


var strJournalAddURL = "../modules/journal/server/journal_add";
var strJournalURL = "../modules/journal/server/journal";

var oAddJournal = new system_AppScreen();

oAddJournal.element_JournalCategory = ""; 			
oAddJournal.element_JournalBody = "";
oAddJournal.screen_Name = "journal_Add";
oAddJournal.screen_Menu = "Journal Entry";
oAddJournal.module_Name = "journal";
oAddJournal.strSelectedUser = "";

oAddJournal.custom_Show = function()
{
	this.LoadLists();
	oAddJournal.ClearFields();
	/*-----------------------------------------------------------------------------
		Only show the Category drop down box and label to users 
		with the Admin right.
	-------------------------------------------------------------------------------*/
	if(oUser.HasRight(oRights.JOURNAL_Admin))	
	{
		ShowInheritElement(this.element_JournalCategory);
		ShowInheritElement("jrnCat_ListTitle");
	}
	else
	{
		HideElement(this.element_JournalCategory);
		HideElement("jrnCat_ListTitle");
	}
	return true;
}

oAddJournal.custom_Load = function ()
{		
	this.element_JournalCategory = oScreenBuffer.Get("jrnCat_List");
	this.element_JournalBody = oScreenBuffer.Get("jrnBody");
	this.element_UserSelected = oScreenBuffer.Get("journalAdd_SelectedUser");
	
	/*--------------------------------------------------------------------------
		user filter for acquiring user name
	--------------------------------------------------------------------------*/
	
	this.oUserFilter = new system_UserOrgSelection();
	this.oUserFilter.load("jrnAddBox", "userManagement_UserPopup");

	this.oUserFilter.setLocation(25, 30);

	this.oUserFilter.custom_submit = function (selectedUser)
	{
		oAddJournal.SelectUser(selectedUser);
		return true;
	}
	
	oScreenBuffer.Get("jrnClear_Button").onclick = function ()
	{
		oAddJournal.ClearFields();
	};
	
	oScreenBuffer.Get("jrnSubmit_Button").onclick = function ()
	{
		oAddJournal.Submit();		
	};
	return true;
}
/*-----------------------------------------------------------------------------
	Loads the lists used by add journal
-------------------------------------------------------------------------------*/
oAddJournal.LoadLists = function()
{
	oCategoryList.load();
	oCategoryList.fillControl("jrnCat_List", false);
}

/*-----------------------------------------------------------------------------
	ClearFields clears all the fields for Employee, Category, Date, and Event
	Description.
-------------------------------------------------------------------------------*/
oAddJournal.ClearFields = function()
{
	this.element_JournalCategory.value = "Comment";	
	this.element_JournalBody.value = "";
	this.oUserFilter.clear();
	this.SelectUser("");
}
/*--------------------------------------------------------------------------
	Select user is called when the oUserFilter has a name selected
	or unselected.
--------------------------------------------------------------------------*/
oAddJournal.SelectUser = function(userName)
{
	if(userName)
	{
		var oUsers = new system_UserList();

		oUsers.addParam("name", userName);
		oUsers.load();

		user_record = oUsers.get(userName);
		userOrg = user_record.org_Short_Name;

		screen_SetTextElement(this.element_UserSelected, userName + " (" + userOrg + ")");
		this.strSelectedUser = userName;
	}
	else
	{
		this.SelectUser(oUser.user_Name);
	}
}
	
/*-----------------------------------------------------------------------------
	The values we're submitting to the server through the form.
	In this case data to add a journal entry.
-------------------------------------------------------------------------------*/
oAddJournal.Submit = function()
{
	/*-----------------------------------------------------------------------------
		Inform the user that they need to select an employee to make an entry about
		if they leave the user filter empty and try to submit.
	-------------------------------------------------------------------------------*/
	if(this.strSelectedUser.length == 0)
	{
		oCatenaApp.showNotice(notice_Error, "Please enter an employee's name for the subject of your journal entry.");
		return false;
	}
	
	element_submitForm =oScreenBuffer.Get("journalAdd_submitform");
	element_submitForm.action = strJournalAddURL + ".php";
	
	element_submitForm.appendChild(screen_CreateHiddenElement("Subject", this.strSelectedUser));
	element_submitForm.appendChild(screen_CreateHiddenElement("Category", this.element_JournalCategory.value));
	element_submitForm.appendChild(screen_CreateHiddenElement("Body", this.element_JournalBody.value));

	element_submitForm.submit();

	RemoveChildren(element_submitForm);
}
/*
	DisplayResults
		-	Clears the form and results if the passed in values are valid
		-	prompts the user with an error message if there is one
*/
oAddJournal.DisplayResults = function(strMsg)
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
oAddJournal.register();