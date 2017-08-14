/*
	This file maintains the system debug notifications.
*/

var debug_disabled = 0;			//	don't use debug
var debug_notices = 10;			//	display notices
var debug_warnings = 20;		//	display warnings
var debug_errors = 30;			//	display errors
var debug_stop = 40;			//	display stops--and stop system from continue

function system_debug()
{
	this.debugLevel = debug_disabled;
	this.loaded = false;
	this.visible = false;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_debug.prototype.load = function(debugLevel)
{
	if(!debugLevel)
	{
		debugLevel = debug_disabled;
	}
	
	if(global_siteType > 4)
	{
		/*
			We're into the production server. Don't load the
			debug functionality
		*/
		debugLevel = debug_disabled;
		return true;
	}

	this.debugLevel = debugLevel;
	this.debugWindow = new popup();
	
	this.debugWindow.id = "debugWindow";
	this.debugWindow.title_text = "Debug";
	this.debugWindow.ShowOnStart = false;
	
	this.debugWindow.create();

	strDebug = "Debug (" + this.getDebugLevel() + ")";
	
	this.notice(strDebug);

	oFeedbackLink = new Object();
	
	oFeedbackLink.text = strDebug;
	oFeedbackLink.color = "red";
	oFeedbackLink.title = "Open debug details window. Value in () is debug level.";
	
	oFeedbackLink.fnCallback = function()
	{
		if(oSystem_Debug.visible == false)
		{
			oSystem_Debug.show();
		}
		else
		{
			oSystem_Debug.hide();
		}
	}

	oSystemLinks.add(oFeedbackLink);

	this.loaded = true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_debug.prototype.getDebugLevel = function()
{

	switch(this.debugLevel)
	{
		case debug_disabled:
			return "disabled";
		case debug_notices:
			return "notices";
		case debug_warnings:
			return "warnings";
		case debug_errors:
			return "errors";
		case debug_stop:
			return "stop";
		default:
			return this.debugLevel;
	}
	
	return 0;
}
/*--------------------------------------------------------------------------
	-	description
			This function displays an about box on the screen
	-	params
	-	return
--------------------------------------------------------------------------*/
system_debug.prototype.show = function()
{
	if(this.debugLevel > debug_disabled)
	{
		fadeboxin(this.debugWindow.id);
		element_fileLoaderWindow = oScreenBuffer.Get("iFileLoader");
		element_fileLoaderWindow.style.display = "block";
		this.visible = true;
	}
}
/*--------------------------------------------------------------------------
	-	description
			This function displays an about box on the screen
	-	params
	-	return
--------------------------------------------------------------------------*/
system_debug.prototype.hide = function()
{
	fadeboxout(this.debugWindow.id);
	element_fileLoaderWindow = oScreenBuffer.Get("iFileLoader");
	element_fileLoaderWindow.style.display = "none";
	this.visible = false;

}
/*
	This function outputs debug messages and code
	to the debug window
*/
system_debug.prototype.output = function(type, strValue)
{
	strOutput = "";
	element_debugWindow = getpopupbody(this.debugWindow.id);
	element_notice = document.createElement("DIV");
	
	switch(type)
	{
		case 0:
			strOutput = "Notice: " + strValue;
			element_notice.className = "debugNotice";
			break;
		case 1:
			strOutput = "Warning: " + strValue;
			element_notice.className = "debugWarning";
			break;
		default:
			strOutput = "Error: " + strValue;
			element_notice.className = "debugError";
			break;
	}

	element_notice.appendChild(document.createTextNode(strOutput));

	element_debugWindow.appendChild(element_notice);
}
/*
	This function outputs debug messages and code
	to the debug window
*/
system_debug.prototype.warning = function(strValue)
{
	if(this.debugLevel >= debug_warnings)
	{
		this.output(1, strValue);
		
		if(typeof(console) !="undefined")
		{
			console.warn("Catena Warning: " + strValue);
		}
	}
}
/*
	This function outputs debug messages and code
	to the debug window
*/
system_debug.prototype.notice = function(strValue)
{
	if(this.debugLevel >= debug_notices)
	{
		this.output(0, strValue);
		
		if(typeof(console) !="undefined")
		{ 
			console.info("Catena Notice: " + strValue);
		}
	}
}
/*
	This function outputs debug messages and code
	to the debug window
*/
system_debug.prototype.error = function(strValue)
{
	if(this.debugLevel >= debug_errors)
	{
		this.output(2, strValue);
		
		if(typeof(console) !="undefined")
		{
			console.error("Catena Error: " + strValue);
		}
	}
}
/*
	This function outputs debug messages and code
	to the debug window
*/
system_debug.prototype.stop = function(strValue)
{
	if(this.debugLevel >= debug_stop)
	{
		this.output(2, strValue);
		
		if(typeof(console) !="undefined")
		{
			console.trace();
		}
	}
	
	alert("A stop error has been encountered");
	
}

oSystem_Debug = new system_debug();