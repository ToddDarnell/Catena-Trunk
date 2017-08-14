/*
	URLs
*/
var strFeedbackURL =  "../functions/feedback";

var strListURL = "/functions/lists";
var strUserURL = "/functions/user";
var strOrganizationURL = "/functions/organization";
var strRightCategoryURL = "/functions/rightsCategory";
var strRightGroupURL = "/functions/rightGroup";
var strRightsURL = "/functions/rights";
var strSystemAccessURL = "/functions/systemAccess";

//var strPingDBURL = "/functions/ping";

var strModulesURL = "/functions/modules";

//
//	Page Values
//	It is absolutely critical that you use these and do NOT change them when
//	navigating pages.
//	
var page_Home = "Home";

/*
	Screen show params
*/
var page_param_refresh = 2;		//	Refresh the page, but leave the contents the way they are.
var page_param_display = 1;		//	display the page as it is. Make no modifications.
var page_param_reset = 0;			//	Reset the page as if it's the first time showing it. This is the default

/*
	Notification types
*/
var notice_Info = "info";
var notice_Error = "error";


//URLs
var sImagesDir = "images/";
var sRestoreIcon = sImagesDir + "icon_restore.gif";
var sDeleteIcon = sImagesDir + "icon_delete.gif";
var sInfoIcon = sImagesDir + "icon_info.gif";
var sErrorIcon = sImagesDir + "icon_alert.gif";

/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
function system_Application()
 {
    message = new Object();		//	information about the current message    
    currentPage = "";			//	The current page or section we should display
	this.screenList = new Array();	
	messageTimerId = -1;

}
/*--------------------------------------------------------------------------
	-	description
		Returns the current page name in text format
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Application.prototype.getCurrentPage = function()
{
	return this.currentPage;
}
/*
	Registers a screen with the application.
	Hides it, and then it's ready to be used
	strTitleText is the menu text which gets clicked and then displays this menu
	oObject is a pointer to the created object, such as oAddReceiver, etc which
	is then called when the screen needs to be displayed or hidden
*/
system_Application.prototype.RegisterScreen = function (strTitleText, oObject)
{
	this.screenList[strTitleText] = oObject;
}
/*--------------------------------------------------------------------------
	-	description
			Close the application-perform any needed shutdown.
			make sure the user has no unsaved content.
			The currently active screen may return a message to the
			user indicating unsaved data if applicable.
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Application.prototype.close = function ()
{
	if(this.currentPage != "")
	{
		if(this.screenList)
		{
			if(this.screenList[this.currentPage])
			{
				return this.screenList[this.currentPage].Close();
			}
		}
	}

	return "";
}
//--------------------------------------------------------------------------
/**
	\brief
		The navigate function first clears the existing page and then draws
		the new page.
		If the new page is the same as the existing page then nothing is
			performed
	\param newPage
		The new page we're navigating to
	\param param
		The param variable is specific to the particular screen.
		For example, pass in a value of 1 to search screens
		and they should not refresh their value. For another screen
		1 might mean something else.
	\return
*/
//--------------------------------------------------------------------------

/*--------------------------------------------------------------------------
	-	params
		newPage
			The action to perform.
 	-	return
--------------------------------------------------------------------------*/
system_Application.prototype.navigate = function (newPage, param)
{
	/*
		-	If the pages are the same then  we don't do anything
		
		At this point we want to clear the existing page.
		The page can save information, it's state, etc, but we're
		removing it so we can draw another page
	*/
	
	oSystem_Debug.notice("Selecting new page: " + newPage);
		
	if(this.currentPage != "")
	{
		if(this.screenList[this.currentPage])
		{
			if(!this.screenList[this.currentPage].Hide())
			{
				return false;
			}
			this.currentPage = "";
		}
	}

	if(this.screenList[newPage])
	{
		oSystem_Debug.notice("Callling show page: " + newPage);
		if(!this.screenList[newPage].Show(param))
		{
			oSystem_Debug.notice("Failure showing page : " + newPage);
			return false;
		}
	}
	else
	{
		this.showNotice(notice_Error, newPage + " is currently not implemented.");
		//this.navigate(page_Home);
		return false;
	}

	/*
		Now set our current page to the new page
	*/
	this.currentPage = newPage;
	ForceHideToolTip();
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Initializes DOM pointers and other property values.
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Application.prototype.init = function ()
{
	if(!IsBrowserValid())
	{
		this.shutdownNotice("Your browser is not supported. Please use Internet Explorer 6.0 or newer or Firefox 1.5 or newer to view this site.");
		return false;
	}
	
	if(!CookiesEnabled())
	{
		this.shutdownNotice("Cookies are not enabled. Please enable cookies to experience Catena properly.");
		return false;
	}

	if(!server.load())
	{
		this.shutdownNotice("Site failure: " + server.statusText);
		return false;
	}
	
	/*
		We don't have a current page displayed so clear it
	*/
	
	this.currentPage = "";

	/*
		Set up the spell checker
	*/
	//webFXSpellCheckHandler.serverURI     = 'http://localhost/functions/spellcheck.php';
	webFXSpellCheckHandler.serverURI     = '../functions/spellcheck.php';
	webFXSpellCheckHandler.invalidWordBg = 'url(../image/redline.png) repeat-x bottom';
	webFXSpellCheckHandler.httpMethod    = 'GET';
	webFXSpellCheckHandler.httpParamSep  = '&';
	webFXSpellCheckHandler.wordsPerReq   = 100;
		
	/*
		Clear the javascript message.
		At this point we know the user is using Javascript
	*/
	
	oScreenBuffer.Get("divContent").innerHTML = "";
	
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Initializes and loads catena
   	-	params
	-	return
--------------------------------------------------------------------------*/
system_Application.prototype.load = function ()
{
	if(!this.init())
	{
		return false;
	}

	oSystem_Debug.load(debug_stop);

	oRights.load();
	oRights.build();

	oUser.init();

	oSystemLinks.load();
	oSystem_Feedback.load();
	oSystemAbout.load();
	oScreenBuffer.load();
	oSystem_Colors.load();
	ToolTipSetup();
			
	/*
		Set up the colors for the site header
		and screens
	*/
	
	oSystem_Colors.SetTertiaryBackground("divPageTitle");
	oSystem_Colors.SetPrimary("divPageTitle");
	oSystem_Colors.SetSecondaryBackground("divPageTitleBackground");
	oSystem_Colors.SetPrimary("divSiteTitle");
	
	this.SetPageTitle("Loading menu...");
	
	LoadMenu();

	oSystemLinks.show();
	
	resizeContent();

	this.SetPageTitle("Loading Home Page...");
	oCatenaApp.navigate(page_Home);
	
	if((oUser.organization == "Guest") || (oUser.user_Active == 0) || (oUser.organization == "AFU"))
	{
		oSystemAbout.show();
	}
	else
	{
		setTimeout(LoadModules, 200);
	}
	
	addListener(window, "scroll", initScroll);
	addListener(document, "keydown", catena_OnKeyDown);

}
function LoadModules()
{
	arModuleScripts = new system_list("", "");
	arModuleScripts.serverURL = strModulesURL;
	arModuleScripts.listName = "clientfiles";
	arModuleScripts.load();

	if(arModuleScripts.list)
	{
		for(i = 0; i < arModuleScripts.list.length; i++)
		{
			include_once("../modules" + arModuleScripts.list[i].path);
		}
	}
	else
	{
		oSystem_Debug.warning("No modules found");
	}		

}
//--------------------------------------------------------------------------
/**
	\brief
	\param sMessage
		Message is a string formatted in the following manner:
			true | false||message
		
			the first part will be either true or false.
			the second part, after the pipes, will be a message
			which should be displayed to the user.
	\return
		-	true if the message contained the true value
		-	false if the message contained the false value
			or was invalid
*/
//--------------------------------------------------------------------------
system_Application.prototype.showResults = function (sMessage)
{
	if(!sMessage)
	{
		sMessage = "false||no connection to the server.";
	}
	
	responseInfo = sMessage.split("||");
	
	if(eval(responseInfo[0]))
	{
		this.showNotice(notice_Info, responseInfo[1]);
		return true;
	}
	else
	{
		this.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
}
/*--------------------------------------------------------------------------
	-	description
			Shows a message on the screen.
	-	params
		sType
			The type of message to display.
 		sMessage
 			The message to display.
	-	return
--------------------------------------------------------------------------*/
system_Application.prototype.showNotice = function (sType, sMessage)
{
	var divNotice = oScreenBuffer.Get("divNotice");
    divNotice.className = sType;
    divNotice.innerHTML = sMessage;
    divNotice.style.visibility = "visible";
            
    if(this.messageTimerId != -1)
    {
    	clearTimeout(this.messageTimerId);
    }
    
    if(sType == notice_Info)
    {
    	oSystem_Debug.notice(sMessage);
    }
    else
    {
    	oSystem_Debug.error(sMessage);
    }
	
    this.messageTimerId = setTimeout(ClearCatenaMsgTimer, (oUser.message_delay * 1000));
   
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Application.prototype.shutdownNotice = function(sMessage)
{
	oScreenBuffer.Get("divContent").innerHTML = sMessage;
}
/*--------------------------------------------------------------------------
	-	description
			Sets the page title
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Application.prototype.SetPageTitle = function(sText)
{
	var divPageTitle = document.getElementById("divPageTitle");
	divPageTitle.innerHTML = sText;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_Application.prototype.onkeydown = function(evt)
{
	if(this.currentPage != "")
	{
		if(this.screenList[this.currentPage])
		{
			if(this.screenList[this.currentPage].onkeydown)
			{
				return this.screenList[this.currentPage].onkeydown(evt);
			}
		}
	}
	
	return true;
}
/*
	Say hello to the Catena Application
*/
var oCatenaApp = new system_Application();


/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
function ClearCatenaMsgTimer()
{
	element_notice = document.getElementById("divNotice");
	element_notice.style.visibility = "hidden";
	oCatenaApp.messageTimerId = -1;
}
/*--------------------------------------------------------------------------
	-	description
			Once the page has loaded we'll begin running the application
	-	params
	-	return
--------------------------------------------------------------------------*/
window.onload = function ()
{
	flakeSetup();
	oCatenaApp.load();
};
/*--------------------------------------------------------------------------
	-	description
			Make sure the user wishes to leave the Catena application.
	-	params
	-	return
--------------------------------------------------------------------------*/
window.onbeforeunload = function()
{
	strResult = "";
	strCloseNotice = "";
	
	if(oCatenaApp)
	{
		strResult = oCatenaApp.close();
	}
	
	/*
		At this point if there's no closing message
		we check to see if the user does not want the close
		message to appear.
		If they don't we close now.
	*/
	if(oUser.close_notice == 1)
	{
		strResult = "You are attempting to leave the Catena application. " + strResult;
	}

	if(strResult.length > 0)
	{
		return strResult;
	}
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
window.onresize = function()
{
	resizeContent();
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
function resizeContent()
{
	content = document.getElementById("divContent");

	left = ((document.body.clientWidth /2) - 300);

	if(left < 175)
	{
		left = 175;
	}
	
	content.style.left = left;
	
	element_notice = document.getElementById("divNotice");
	element_notice.style.left = left;

}

function initScroll()
{
	if(window.onscrollObject)
	{
		window.onscrollObject.draw();
	}
}
//--------------------------------------------------------------------------
/**
	\brief
		Performs a page on enter command.
	\param
	\return
*/
//--------------------------------------------------------------------------
function catena_OnKeyDown(evt)
{
	return oCatenaApp.onkeydown(evt);
}
