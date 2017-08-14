/*--------------------------------------------------------------------------
	The purpose of this file is to manage all of the functionality related to
	viewing an existing journal entry in the journal system.
----------------------------------------------------------------------------*/
var strJournalURL = "../modules/journal/server/journal";

var oJournalView = new system_AppScreen();

oJournalView.element_JournalViewSubject = "";
oJournalView.element_JournalViewBody = "";
oJournalView.element_JournalViewCategory = "";
oJournalView.element_JournalViewPoster = "";
oJournalView.element_JournalViewPostDate = "";
oJournalView.modJrnID = 0;
oJournalView.screen_Name = "journal_View";
oJournalView.screen_Menu = "View Journal Entry";
oJournalView.module_Name = "journal";


/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oJournalView.custom_Show = function()
{
	oJournalView.ClearFields();
	return true;
}

oJournalView.custom_Load = function ()
{		
	this.element_JournalViewSubject = oScreenBuffer.Get("JournalViewSubject");
	this.element_JournalViewBody = oScreenBuffer.Get("JournalViewBody");
	this.element_JournalViewPoster = oScreenBuffer.Get("JournalViewPoster");
	this.element_JournalViewCategory = oScreenBuffer.Get("JournalViewCategory");
	this.element_JournalViewPostDate = oScreenBuffer.Get("JournalViewPostDate");
	
	oScreenBuffer.Get("JournalViewBackButton").backScreen = "";
	oScreenBuffer.Get("JournalViewBackButton").onclick = function ()
	{
		oJournalView.ClearFields();
		oCatenaApp.navigate(this.backScreen);
	};
	
	/*--------------------------------------------------------------------------
	    Sets up the color scheme for the viewable div elements on screen. 
	-------------------------------------------------------------------------------*/
	oSystem_Colors.SetPrimary(this.element_JournalViewSubject);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalViewSubject);
	
	oSystem_Colors.SetPrimary(this.element_JournalViewBody);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalViewBody);
	
	oSystem_Colors.SetPrimary(this.element_JournalViewCategory);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalViewCategory);
	
	oSystem_Colors.SetPrimary(this.element_JournalViewPostDate);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalViewPostDate);
	
	oSystem_Colors.SetPrimary(this.element_JournalViewPoster);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalViewPoster);
	
	return true;
}

/*--------------------------------------------------------------------------
	ClearFields clears all the fields for Event Creator, Event Date, Category,
	Journal Subject, and Journal Body
----------------------------------------------------------------------------*/
oJournalView.ClearFields = function()
{
	screen_SetTextElement(this.element_JournalViewSubject, "");
	screen_SetTextElement(this.element_JournalViewBody, "");
	screen_SetTextElement(this.element_JournalViewCategory, "");
	screen_SetTextElement(this.element_JournalViewPostDate, "");
	screen_SetTextElement(this.element_JournalViewPoster, "");	
}
/*--------------------------------------------------------------------------
	Displays a journal entry based upon what's passed in as journalId.
	By either cancelling or submitting a successful request, sets focus
	to the screen passed in.
		-	Tell the back button where it should send the user
			if they click it
		-	clear all of the fields in this form
		-	draw the screen for viewing the journal entry
		-	send a request to the server for the data for this journal entry
----------------------------------------------------------------------------*/
oJournalView.View = function(journalId, backScreen)
{
	oCatenaApp.navigate(this.screen_Menu);
	oScreenBuffer.Get("JournalViewBackButton").backScreen = backScreen;
	
	var serverValues = Object();

	serverValues.journalId = journalId;
	serverValues.location = strJournalURL;
	serverValues.action = "getjournalentries";

	/*--------------------------------------------------------------------------
		Contact the server with our request. Wait for the response and then 
		display it to the user. The document list should only have one element.
	----------------------------------------------------------------------------*/
	var xmlObject = server.CreateXMLSync(serverValues);

	var verList = ParseXML(xmlObject, "element", Object);
	
	if(verList.length == 1)
	{
		/*--------------------------------------------------------------------------
			Format the date from YYYY-MM-DD (the format in in the Database)to a
			more customary MM/DD/YYYY.
		----------------------------------------------------------------------------*/
		strDisplayDate = formatDate(verList[0]["journal_Date"]);
		
		/*--------------------------------------------------------------------------
			Insert line breaks into the displayed journal body using the common
			function insertBreaks.
		----------------------------------------------------------------------------*/
		strDisplayBody = insertBreaks(verList[0]["journal_Body"]);
	
		/*--------------------------------------------------------------------------
			Load the stored journal entry from the database and display it in the proper
			fields based on the Journal ID. Apply the proper formatting from common
			functions. 
		----------------------------------------------------------------------------*/		
		strSubject = verList[0]["Subject"];
		strPoster = verList[0]["Poster"];
		strCategory = verList[0]["jrnCat_Name"];
		
		screen_SetTextElement(this.element_JournalViewSubject, strSubject);
		this.element_JournalViewBody.innerHTML = strDisplayBody;
		screen_SetTextElement(this.element_JournalViewPoster, strPoster); 
		screen_SetTextElement(this.element_JournalViewCategory, strCategory);
		screen_SetTextElement(this.element_JournalViewPostDate, strDisplayDate);
		
		/*--------------------------------------------------------------------------
			Make the Divs look more presentable so that the journal entry is easy to 
			read.
			First add a border and then put some cell padding down so that the text 
			is not right on top of the edge of the div.
		----------------------------------------------------------------------------*/

		this.element_JournalViewSubject.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalViewSubject.style.padding = "3px";
		
		this.element_JournalViewBody.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalViewBody.style.padding = "3px";
		
		this.element_JournalViewPoster.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalViewPoster.style.padding = "3px";
		
		this.element_JournalViewCategory.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalViewCategory.style.padding = "3px";
		
		this.element_JournalViewPostDate.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalViewPostDate.style.padding = "3px";
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, "Unable to load journal entry for viewing");
	}
	return true;
}

oJournalView.register();