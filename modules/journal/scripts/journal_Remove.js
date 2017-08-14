/*--------------------------------------------------------------------------
	The purpose of this file is to manage all of the functionality related to
	deleting an existing journal entry.
----------------------------------------------------------------------------*/
var strJournalURL = "../modules/journal/server/journal";

var oJournalRemove = new system_AppScreen();

oJournalRemove.element_JournalRemoveSubject = "";
oJournalRemove.element_JournalRemoveBody = "";
oJournalRemove.element_JournalRemoveCategory = "";
oJournalRemove.element_JournalRemovePoster = "";
oJournalRemove.element_JournalRemovePostDate = "";
oJournalRemove.delJournalID = 0;
oJournalRemove.screen_Name = "journal_Remove";
oJournalRemove.screen_Menu = "Delete Journal Entry";
oJournalRemove.module_Name = "journal";


/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oJournalRemove.custom_Show = function()
{
	oJournalRemove.ClearFields();
	return true;
}

oJournalRemove.custom_Load = function ()
{	
	this.element_JournalRemoveSubject = oScreenBuffer.Get("JournalDeleteSubject");
	this.element_JournalRemoveBody = oScreenBuffer.Get("JournalDeleteBody");
	this.element_JournalRemoveCategory = oScreenBuffer.Get("JournalDeleteCategory");
	this.element_JournalRemovePoster = oScreenBuffer.Get("JournalDeletePoster");
	this.element_JournalRemovePostDate = oScreenBuffer.Get("JournalDeletePostDate");
	
	oScreenBuffer.Get("JournalDeleteBackButton").backScreen = "";
	oScreenBuffer.Get("JournalDeleteBackButton").onclick = function ()
	{
		oJournalRemove.ClearFields();
		oCatenaApp.navigate(this.backScreen);
	};
	
	oScreenBuffer.Get("JournalDeleteButton").onclick = function ()
	{
		if(!window.confirm("Are you sure you want to permanently remove this journal entry?"))
			{
				return true;
			}
		oJournalRemove.Submit();
	};
	
	/*--------------------------------------------------------------------------
	    Sets up the color scheme for the viewable div elements on screen. 
	-------------------------------------------------------------------------------*/
	oSystem_Colors.SetPrimary(this.element_JournalRemoveSubject);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalRemoveSubject);
	
	oSystem_Colors.SetPrimary(this.element_JournalRemoveBody);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalRemoveBody);
	
	oSystem_Colors.SetPrimary(this.element_JournalRemoveCategory);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalRemoveCategory);
	
	oSystem_Colors.SetPrimary(this.element_JournalRemovePostDate);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalRemovePostDate);
	
	oSystem_Colors.SetPrimary(this.element_JournalRemovePoster);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalRemovePoster);

	return true;
}

/*--------------------------------------------------------------------------
	ClearFields clears all the fields for Event Creator, Event Date, Category,
	Journal Subject, and Journal Body
----------------------------------------------------------------------------*/
oJournalRemove.ClearFields = function()
{  	
  	screen_SetTextElement(this.element_JournalRemoveSubject, "");
	screen_SetTextElement(this.element_JournalRemoveBody, "");
	screen_SetTextElement(this.element_JournalRemovePoster, "");
	screen_SetTextElement(this.element_JournalRemoveCategory, "");
	screen_SetTextElement(this.element_JournalRemovePostDate, "");
}
			
/*--------------------------------------------------------------------------
	The values we're submitting to the server through the form.
	In this case data to delete a journal entry.
----------------------------------------------------------------------------*/
oJournalRemove.Submit = function()
{
	var serverValues = Object();
	
	/*--------------------------------------------------------------------------
		We pass to the server the journal ID to remove from the system.
	----------------------------------------------------------------------------*/
	serverValues.journalId = this.journalId;

	serverValues.location = strJournalURL;
	serverValues.action = "disable";
	
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
		oCatenaApp.navigate(oScreenBuffer.Get("JournalDeleteBackButton").backScreen);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	return true;
}

/*--------------------------------------------------------------------------
	Displays a journal entry based upon what's passed in as journalId.
	By either cancelling or submitting a successful request, sets
	focus to the screen passed in.
		-	Tell the back button where it should send the user
			if they click it
		-	clear all of the fields in this form
		-	draw the screen for deleting a journal entry
		-	send a request to the server to hide the journal entry
----------------------------------------------------------------------------*/
oJournalRemove.Display = function(journalId, backScreen)
{	
	oCatenaApp.navigate(this.screen_Menu);
	oScreenBuffer.Get("JournalDeleteBackButton").backScreen = backScreen;
	this.ClearFields();
	this.journalId = journalId;
	
	var serverValues = Object();

	serverValues.journalId = journalId;
	serverValues.location = strJournalURL;
	serverValues.action = "getjournalentries";

	/*--------------------------------------------------------------------------
		Contact the server with our request. Wait for the response and then 
		display it to the user.
	----------------------------------------------------------------------------*/
	var xmlObject = server.CreateXMLSync(serverValues);
	

	var verList = ParseXML(xmlObject, "element", Object);

	if(verList.length == 1)
	{
		/*--------------------------------------------------------------------------
			Format the date from YYYY-MM-DD (the format in in the Database)to a
			more customary MM/DD/YYYY using the common function formatDate.
		----------------------------------------------------------------------------*/
		strDisplayDate = formatDate(verList[0]["journal_Date"]);
		
		/*--------------------------------------------------------------------------
			Insert line breaks into the displayed journal body using the common
			function insertBreaks.
		----------------------------------------------------------------------------*/
		strDisplayBody = insertBreaks(verList[0]["journal_Body"]);
		
		/*--------------------------------------------------------------------------
			Load the stored journal entry from the database and display it in the 
			proper fields based on the journal ID. Apply the proper formatting from 
			common functions. 
		----------------------------------------------------------------------------*/
		strSubject = verList[0]["Subject"];
		strPoster = verList[0]["Poster"];
		strCategory = verList[0]["jrnCat_Name"];
		
		screen_SetTextElement(this.element_JournalRemoveSubject, strSubject);
		this.element_JournalRemoveBody.innerHTML = strDisplayBody;
		screen_SetTextElement(this.element_JournalRemovePoster, strPoster); 
		screen_SetTextElement(this.element_JournalRemoveCategory, strCategory);
		screen_SetTextElement(this.element_JournalRemovePostDate, strDisplayDate);
		
		/*--------------------------------------------------------------------------
			Make the Divs look more presentable so that the journal entry is easy to 
			read.
			First add a border and then put some cell padding down so that the text 
			is not right on top of the edge of the div.
		----------------------------------------------------------------------------*/
		this.element_JournalRemoveSubject.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalRemoveSubject.style.padding = "3px";
		
		this.element_JournalRemoveBody.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalRemoveBody.style.padding = "3px";
		
		this.element_JournalRemovePoster.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalRemovePoster.style.padding = "3px";
		
		this.element_JournalRemoveCategory.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalRemoveCategory.style.padding = "3px";
		
		this.element_JournalRemovePostDate.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalRemovePostDate.style.padding = "3px";
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, "Unable to load journal entry for deleting.");
	}
	return true;	
}

oJournalRemove.register();