/*
	purpose:
	An application screen is a window which is tied to the screen management system.
	It provides a link to the menu system so it can be called via the menu system,
	can modify the application title screen, and is managed via the screen navigation
	system.
*/

system_AppScreen.prototype = new system_Window();
system_AppScreen.prototype.constructor = system_AppScreen;

function system_AppScreen()
{
	this.module_Name = "";
}

/*--------------------------------------------------------------------------
	-	description
			This function creates a "screen" and appends it to the HTML
			page.
	-	params
	-	return
			true if the screen loaded properly.
			false if there was some kind of problem.
--------------------------------------------------------------------------*/
system_AppScreen.prototype.load = function ()
{
	if(this.screenLoaded == true)
	{
		oSystem_Debug.warning("Duplicate attempt to load screen:" + this.screen_Name);
		return true;
	}

	if(this.screen_Name.length == 0)
	{
		oSystem_Debug.error("Failure loading screen.");
		return false;
	}

	oSystem_Debug.notice("Loading page: " + this.screen_Name);

	if(this.module_Name.length == 0)
	{
		alert("Invalid module selected for : " + this.screen_Name);
		return false;
	}
	
	var oXmlDom;
	
	oCatenaApp.SetPageTitle("Loading '" + this.screen_Name + "' screen...");

	oXmlDom = server.loadXMLSync("../modules/" + this.module_Name + "/screens/" + this.screen_Name + ".xml");
	/*
		- pageData is the data describing all of the pages within the screen.
		- screenData is the data for the entire screen
		-	The idea is to use 'element' to describe an on screen element
			and data to describe the data which is used to describe how an element is formated.
			For example. screenElement is the onscreen object which the user would see. screenData
			is the data loaded from the server which describes how screenElement looks, it's location,
			it's behavior, etc.
		- note. oRoot and screenData are pointing to the same location. The point of this though is
			to force the requirement that all root tags be called screen for the purposes of developing a screen
	*/
	var oRoot = oXmlDom.documentElement;			//	used as a short cut instead of typing the entire name
	
	if(!oRoot)
	{
		alert("Data not found for " + this.screen_Name);
		return false;
	}
	
	var screenData = oRoot.getElementsByTagName("screen");	//	screen data describes the on screen element we're going to build
	var screenElement = document.createElement("div");		//	The screenElement is the on screen element we're going to develop with screenData

	screenElement.className = "appScreen";				//	Set the default data for the screen element. Developers can change any attribute
	screenElement.id = this.screen_Name;
	
	if(!screenData)
	{
		/*
			We don't have any screen data
		*/
		alert("No screen data found for screen: " + strScreen);
		return false;
	}
	
	/*
		Build the screen data. It may or may not contain pages
	*/

	oSystem_Debug.notice("Building elements for screen : " + this.screen_Name);

	this.BuildElement(screenElement, oRoot);
	document.getElementById("divContent").appendChild(screenElement);
	screenElement.style.visibility = "hidden";
	this.ShowPage(0);


	if(this.custom_Load)
	{
		oSystem_Debug.notice("Calling custom_Load for screen : " + this.screen_Name);
		if(!this.custom_Load())
		{
			oSystem_Debug.error("Failure in custom_Load for screen : " + this.screen_Name);
			return false;
		}
	}

	oSystem_Debug.notice("Loaded screen: " + this.screen_Name);

	this.screenLoaded = true;

	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Registers this screen with the application.
	-	params
	-	return
--------------------------------------------------------------------------*/
system_AppScreen.prototype.register = function()
{
	if(this.screen_Menu.length)
	{
        oCatenaApp.RegisterScreen(this.screen_Menu, this);
	}
	else
	{
		alert("Screen menu not defined for screen [" + this.screen_Name + "].");
	}
}
/*
	This pageElement is the tab which was clicked to
	change it to another tabbed page
*/
system_AppScreen.prototype.SelectPage = function(id)
{
	this.ShowPage(id);
}
/*
	This function is called when the application is closing.
	To prompt the user with a message so they can choose
	not to exit the application, return a string message
	containing the message, otherwise return an empty string
*/
system_AppScreen.prototype.Close = function()
{
	strResult = "";
	if(this.custom_Close)
	{
		strResult = this.custom_Close();
	}

	return strResult;
}
/*
	This function hides the screen so it is no longer
	visible to the user.
	In fact it disconnects the elements from the page
	and places them on another page so they no longer
	affect what's on the page
*/
system_AppScreen.prototype.Hide = function()
{
	if(this.custom_Hide)
	{
		if(this.custom_Hide() == false )
		{
			return false;
		}
	}
		
	oScreenBuffer.AddScreen(this.screen_Name);
	
	return true;
}
/*
	Shows the screen
	This functions shows the screen
*/
system_AppScreen.prototype.Show = function()
{
	oSystem_Debug.notice("Showing page: " + this.screen_Name);

	if(this.screenLoaded == false)
	{
		if(!this.load())
		{
			alert("Unable to load " + this.screen_Name + ".");
			return false;
        }
		oSystem_Debug.notice("Loaded screen: " + this.screen_Name);
	}

	oCatenaApp.SetPageTitle(this.strScreenTitle);

	if(this.custom_Show)
	{
		if(this.custom_Show() == false)
		{
			alert("Unable to display custom_Show " + this.screen_Name + ".");
			return false;
		}
	}

	document.getElementById("divContent").appendChild(oScreenBuffer.Get(this.screen_Name));
	ShowElement(this.screen_Name);

	if(this.custom_AfterShow)
	{
		this.custom_AfterShow();
	}


	return true;
}
/*
		Selects one of the options for the organization page
		Some screens may not have pages so we ignore them
*/
system_AppScreen.prototype.ShowPage = function(pageId)
{
	if(this.pageCount > 0)
	{
	
		HideElement(this.screen_Name + this.focusedPage);
		titleElement = this.screen_Name + "Title" + this.focusedPage;
		oSystem_Colors.ClearElement(titleElement);
		
		oScreenBuffer.Get(titleElement).style.backgroundColor = "White";
	
		/*
			Now show the focused page
		*/
		
		ShowInheritElement(this.screen_Name + pageId);
		oSystem_Colors.SetSecondaryBackground(this.screen_Name+ "Title" + pageId);
		
		this.focusedPage = pageId;
	}
}
