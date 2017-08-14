/*--------------------------------------------------------------------------
	The purpose of this file is to manage all of the functionality related to
	viewing an existing journal entry in the journal system.
----------------------------------------------------------------------------*/
var strJournalURL = "../modules/journal/server/journal";

var oJournalModify = new system_AppScreen();

oJournalModify.element_JournalModifySubject = "";
oJournalModify.element_JournalModifyBody = "";
oJournalModify.element_JournalModifyCategory = "";
oJournalModify.element_JournalModifyPoster = "";
oJournalModify.element_JournalModifyPostDate = "";
oJournalModify.modJrnID = 0;
oJournalModify.screen_Name = "journal_Modify";
oJournalModify.screen_Menu = "Modify Journal Entry";
oJournalModify.module_Name = "journal";


/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oJournalModify.custom_Show = function()
{
	this.LoadLists();
	oJournalModify.ClearFields();
	return true;
}

oJournalModify.custom_Load = function ()
{		
	this.element_JournalModifySubject = oScreenBuffer.Get("JournalModifySubject");
	this.element_JournalModifyBody = oScreenBuffer.Get("JournalModifyBody");
	this.element_JournalModifyPoster = oScreenBuffer.Get("JournalModifyPoster");
	this.element_JournalModifyCategory = oScreenBuffer.Get("JournalModifyCategory");
	this.element_JournalModifyPostDate = oScreenBuffer.Get("JournalModifyPostDate");
	
	oScreenBuffer.Get("JournalModifyBackButton").backScreen = "";
	oScreenBuffer.Get("JournalModifyBackButton").onclick = function ()
	{
		oJournalModify.ClearFields();
		oCatenaApp.navigate(this.backScreen);
	};
	
	oScreenBuffer.Get("JournalModifySubmitButton").onclick = function ()
		{
			oJournalModify.Submit();		
	 	};	  
	
	/*--------------------------------------------------------------------------
	    Sets up the color scheme for the viewable div elements on screen. 
	-------------------------------------------------------------------------------*/
	oSystem_Colors.SetPrimary(this.element_JournalModifySubject);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalModifySubject);
	
	oSystem_Colors.SetPrimary(this.element_JournalModifyBody);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalModifyBody);
	
	oSystem_Colors.SetPrimary(this.element_JournalModifyPostDate);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalModifyPostDate);
	
	oSystem_Colors.SetPrimary(this.element_JournalModifyPoster);
	oSystem_Colors.SetTertiaryBackground(this.element_JournalModifyPoster);
	
	return true;
}

/*--------------------------------------------------------------------------
	Loads the lists used by modify journal
----------------------------------------------------------------------------*/
oJournalModify.LoadLists = function()
{		
  	oCategoryList.load();
	oCategoryList.fillControl("JournalModifyCategory", false);
}

/*--------------------------------------------------------------------------
	ClearFields clears all the fields for Event Creator, Event Date, Category,
	Journal Subject, and Journal Body
----------------------------------------------------------------------------*/
oJournalModify.ClearFields = function()
{
	screen_SetTextElement(this.element_JournalModifySubject, "");
	screen_SetTextElement(this.element_JournalModifyBody, "");
	this.element_JournalModifyCategory.value = ""; 
	screen_SetTextElement(this.element_JournalModifyPostDate, "");
	screen_SetTextElement(this.element_JournalModifyPoster, "");	
}
/*--------------------------------------------------------------------------
	The values we're submitting to the server through the form.
	In this case data to modify a journal entry.
----------------------------------------------------------------------------*/
oJournalModify.Submit = function()
{	
	var serverValues = Object();
	
	/*--------------------------------------------------------------------------
	We pass to the server the journal category
	to add to the system.
	----------------------------------------------------------------------------*/
	serverValues.Category = this.element_JournalModifyCategory.value;
	serverValues.journalId = this.journalId;
	
	serverValues.location = strJournalURL;
	serverValues.action = "modify";

	/*--------------------------------------------------------------------------
		Contact the server with our request. Wait for the response and then 
		display it to the user. 
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
		oCatenaApp.navigate(oScreenBuffer.Get("JournalModifyBackButton").backScreen);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	return true;
}

/*--------------------------------------------------------------------------
	Modifies a journal entry based upon what's passed in as journalId.
	By either cancelling or submitting a successful request, sets
	focus to the screen passed in.
		-	Tell the back button where it should send the user
			if they click it
		-	clear all of the fields in this form
		-	draw the screen for modifying a journal entry
		-	send a request to the server for the data for this journal entry
----------------------------------------------------------------------------*/
oJournalModify.Modify = function(journalId, backScreen)
{
	oCatenaApp.navigate(this.screen_Menu);
	oScreenBuffer.Get("JournalModifyBackButton").backScreen = backScreen;
	this.ClearFields();
	this.journalId = journalId;
	
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
		strCategory = verList[0]['jrnCat_Name'];
		
		screen_SetTextElement(this.element_JournalModifySubject, strSubject);
		this.element_JournalModifyBody.innerHTML = strDisplayBody;
		screen_SetTextElement(this.element_JournalModifyPoster, strPoster); 
		this.element_JournalModifyCategory.value = strCategory;
		screen_SetTextElement(this.element_JournalModifyPostDate, strDisplayDate);
		
		/*--------------------------------------------------------------------------
			Make the Divs look more presentable so that the journal entry is easy to 
			read.
			First add a border and then put some cell padding down so that the text 
			is not right on top of the edge of the div.
		----------------------------------------------------------------------------*/
		this.element_JournalModifySubject.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalModifySubject.style.padding = "3px";
		
		this.element_JournalModifyBody.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalModifyBody.style.padding = "3px";
		
		this.element_JournalModifyPoster.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalModifyPoster.style.padding = "3px";
		
		this.element_JournalModifyPostDate.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_JournalModifyPostDate.style.padding = "3px";
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, "Unable to load journal entry for modifying.");
	}
	return true;
}

oJournalModify.register();