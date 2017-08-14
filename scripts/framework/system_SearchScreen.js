/*
	To create a search screen use the following code:
	
		oMySearchScreen = new system_SearchScreen("screenName", "menu text");
	
	- XML screen
		The following fields must be included in the screen data.
		-	Submit button
			The submit button MUST be named submit_[ScreenName]
		-	Clear button
			The clear button MUST be named clear_[ScreenName]
		-	Results table
			The results table MUST be named results_[ScreenName]
		-	Message field
			The message field MUST be named message_[ScreenName]
	
	- To flag a field as being a search field which should have it's value
		sent to the server, set the <search> to the name of the attribute which should
		be sent to the server. For example:
			I want an input box which should have it's value sent to the server. The following
			code creates this.
			 
			<input>
				<type>text</type>
				<id>SearchDocTitle</id>
				<search>title</search>
				<maxLength>75</maxLength>
				<title>Search by each option or a combination of any three options: Title, Description, or Type.</title>
				<style>
					<top>30px</top>
					<left>25px</left>
					<width>200px</width>
					<height>22px</height>
					<zIndex>2</zIndex>
				</style>
			</input>
		-	The server command line would look like : title=<value of element>

	system_SearchScreen
	-	screenName
		The screen name is the name of the object we'll be building.
		The screenName is also the name of the xml data file we'll try
		to load to get the data for this screen
	-	menuName
		menuName is the name of the menu on the screen. When that
		menu option is clicked this screen will be loaded
	
	-	user defined variables
		The following variables must be defined for results to be processed
		and for functionality to work properly.
		
		-	fnProcess
				The callback function for when the server has returned with the
				raw data to be processed
		-	DisplayResults
				The user defined function called when the search results object
				has finished parsing the data. used to display the results
    -   Custom functions
        All functions which start with custom_ are user overridable.
	-	We're going to set up the search Screen as a derived class from an system_AppScreen
	class
*/
system_SearchScreen.prototype = new system_AppScreen();
system_SearchScreen.prototype.constructor = system_SearchScreen;

function system_SearchScreen()
{
	this.oResults = new system_SortTable;
	this.search_List	= "getdocumentversions";
	this.search_URL = "";
	this.element_Results = null;
	this.fnProcess = null;				//	the call back function called
										//	when the server has returned
										//	with the raw results.
    this.custom_LoadList = null;        //  Gives the derived class a chance to load custom lists
}
/*
	load will load the default settings for the search results screen
*/
system_SearchScreen.prototype.load = function()
{
	if(this.screenLoaded == true)
	{
		oSystem_Debug.warning("Duplicate attempt to load screen:" + this.screen_Name);
		return true;
	}

	if(!system_AppScreen.prototype.load.call(this))
	{
		return false;
	}
	/*
		- Set up the submit, clear, message, and results
			fields
		
		-	Build the submit string and then grab the element.
			If no element is found, it's probably because
			the developer forgot this step. Flag an error and exit.
			Repeat for the other fields also.
	*/
    
    this.strSubmit = "submit_" + this.screen_Name;
    element_Submit = oScreenBuffer.Get(this.strSubmit);
    
    if(!element_Submit)
    {
    	alert("Unable to find element [" + this.strSubmit + "] for screen " + this.screen_Name + ".");
    	return false;
    }
	
	element_Submit.oSearchScreen = this;
	element_Submit.title = "Submit a search request";
	
	element_Submit.onclick = function ()
	{
		/*
			We've set screen to the calling search screen object.
			Call it's submit functionality
		*/
		this.oSearchScreen.Submit();
    };
    
    this.strClear = "clear_" + this.screen_Name;
    element_Clear = oScreenBuffer.Get(this.strClear);
	
	/*
		Assign the clear screen.
		Additionally, set the text to say clear
	*/
	element_Clear.oSearchScreen = this;
	element_Clear.title = "Clear search options";
	
	element_Clear.onclick = function ()
	{
		/*
			We've set screen to the calling search screen object.
			Call it's clear functionality
		*/
		this.oSearchScreen.clear();
    };

   	screen_SetTextElement(element_Clear, "Clear");
   
    /*
    	Get a link to the results table. We'll be clearing and resetting
    	it ALOT
    */
    strResults = "results_" + this.screen_Name;
   
    this.oResults.setName( strResults);
    
 	this.strMessage = "message_" + this.screen_Name;
    this.element_Message = oScreenBuffer.Get(this.strMessage);
    
    oSystem_Colors.SetPrimary(this.element_Message);

	return true;
}
/*
	ShowScreen shows the screen
*/
system_SearchScreen.prototype.Show = function(param)
{
	if(!system_AppScreen.prototype.Show.call(this))
	{
		return false;
	}

	switch(param)
	{
		case page_param_refresh:
			this.Submit();
			break;
		case page_param_display:
			break;
		default:
			this.clear();
	}    
	return true;
}
/*
	Clears the results from the results list, and then calls
	the user custom clear function. 
*/
system_SearchScreen.prototype.ClearResults = function()
{
	this.HideMessage();
	this.oResults.clear();
	
	if(this.custom_ClearResults)
	{
		this.custom_ClearResults();
	}
}
/*
	Clear clears all the searchable fields and the results fields
*/
system_SearchScreen.prototype.clear = function()
{
	/*
		Find all child elements of this screen with a certain tag type
		and clear them
	*/
    if(this.custom_Clear)
    {
        this.custom_Clear();
    }

	this.ClearResults();
}
/*
	Show and hide various result messages
*/
system_SearchScreen.prototype.ShowMessage = function (strMessage)
{
	this.ClearResults();
	ShowInheritElement(this.element_Message);
	this.element_Message.innerHTML = strMessage;
}
system_SearchScreen.prototype.HideMessage = function ()
{
	HideElement(this.element_Message);
}
/*
	ProcessResults takes the results from the server and formats
	them into a javascript object
	-	strResults
		The raw XML data
 */
system_SearchScreen.prototype.ProcessResults = function (strResults)
{
	this.HideMessage();

	this.oResults.SetList(strResults);

	if(this.oResults.size() > 0)
	{
		this.oResults.Display();
	}
	else
	{
		this.ShowMessage("No results found.");
	}
}
/*
	Empty Display results
*/
system_SearchScreen.prototype.DisplayResults = function ()
{
}	
/*
	AddSearchFields cycles through all child elements of a screen
	looking for the search element. If the element is
	set then it takes the text from that element and uses it as
	a field in the server results object. The value of the element
	is then assigned to that field.
*/
system_SearchScreen.prototype.AddSearchFields = function (rootElement)
{
	//
	//	cycle through all screen buffer elements and change their color
	//	if they have the tag
	//
	if(!rootElement)
	{
		return
	}

	var oCurrentChild = rootElement.firstChild;
	
	do
	{
		if(!oCurrentChild)
		{
			return;
		}
		
		if(oCurrentChild.search)
		{
			this.serverValues[oCurrentChild.search] = oCurrentChild.value;
		}

		if(oCurrentChild.childNodes.length)
		{
			this.AddSearchFields(oCurrentChild);
		}
		
	} while (oCurrentChild = oCurrentChild.nextSibling);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
		-	true if the event can continue it's handler.
		-	false if this handler dealt with the event.
*/
//--------------------------------------------------------------------------
system_SearchScreen.prototype.onkeydown = function(evt)
{
	var code;
	
	e = evt || window.event;
	
	if (e.keyCode)
	{
		code = e.keyCode;
	}
	else if (e.which)
	{
		code = e.which;
	}
	
	if (code == 13)
	{
		e.cancelBubble = true;
		e.returnValue = false;
		
		if (e.stopPropagation)
		{
			e.stopPropagation();
			e.preventDefault();
		}
		
		this.Submit();
		return false;
	}
	
	return true;
}
/*
	Submit submits the results to the server for the user's requested search
*/
system_SearchScreen.prototype.Submit = function()
{
	
	if(this.custom_Submit)
	{
		if(!this.custom_Submit())
		{
			return false;
		}
	}
    /*
        The values we're submitting to the server.
        Note that the values array is part of the object.
        This is because it's used by AddSearchFields.
    */
    	
	this.serverValues = null;
	this.serverValues = Object();
	
	this.AddSearchFields(oScreenBuffer.Get(this.screen_Name));
	
	this.serverValues.location = this.search_URL;
	this.serverValues.action = this.search_List;

	/*
		Contact the server with our request. Wait for the response and
		then display it to the user.
	*/
	
	if(this.fnProcess)
	{
		responseText = server.callASync(this.serverValues, this.fnProcess);
		this.ShowMessage("Loading....");
	}
	else
	{
		alert("No processing function declared in " + this.search_Screen + ".");
	}

	return true;
}