/*
	Keeps track of a system window
*/

function system_Window()
{
	this.config = 
	{
		left					:   0,
		top						:	0,
		width 					:	400,
		height					:	400,
		showTitle				:	true,
		borderWidth				:	0
	}

	this.strScreenTitle = "";
	this.screenLoaded = false;
	this.screen_Name = "";
	this.screen_Menu = "";
	this.focusedPage = 0;
	this.pageCount = 0;
	this.pageTitles = new Array();
	this.oScreen = null;
}
/*
	Build element
	The page element is the element we're currently trying to functionality
	for
	The data element is our position in the data store (XML) where we're adding our
	element data.
*/
system_Window.prototype.BuildElement = function (window_Element, oDataStore)
{
	var tagName = "";
	var text = "";

	for(var iChild = 0; iChild < oDataStore.childNodes.length; iChild++)
	{
		tagName = oDataStore.childNodes[iChild].tagName;
		text = oDataStore.childNodes[iChild].text;
		
		if(tagName)
		{
			if(this[tagName])
			{
				this[tagName].call(this, window_Element, oDataStore.childNodes[iChild]);
			}
			else
			{
				if(IsHTMLElement(tagName))
				{
					element_New = document.createElement(tagName);
					element_New.style.position = "absolute";
					element_New.oScreen = this;
					window_Element.appendChild(element_New);
					this.BuildElement(element_New, oDataStore.childNodes[iChild]);
				}
				else
				{
					/*
						This is not an html element so we assume it's an attribute
					*/
					window_Element[tagName] = text;
				}
			}
		}
	}
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.screenTitle = function(element_Parent, dataStore)
{
	this.strScreenTitle = dataStore.text;
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.calendar = function(element_Parent, dataStore)
{
	newCalender = new system_Calendar();
	newCalender.build(element_Parent, dataStore);
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.userFilter = function(element_Parent, dataStore)
{
	newFilter = new system_UserOrgSelection();
	newFilter.build(dataStore, element_Parent);
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.box = function(element_Parent, dataStore)
{
	var newBox = document.createElement("DIV");
	element_Parent.appendChild(newBox);

	settings =
	{
  		tl: { radius: 12 },
  		tr: { radius: 12 },
  		bl: { radius: 12 },
  		br: { radius: 12 },
  		antiAlias: true,
  		autoPad: false,
  		colorType:1
  		
	}

	var cornersObj = new curvyCorners(settings, newBox);
	cornersObj.applyCornersToAll();

	oSystem_Colors.SetSecondaryBackground(newBox);
	oSystem_Colors.SetPrimary(newBox);
	
	this.BuildElement(newBox, dataStore);

}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.page = function(element_Parent, dataStore)
{
	/*
		Increase the page count
		Create the page.
		Set default values
	*/
	
	var newPage = document.createElement("DIV");
	/*
		pageNumber is always 1 less than the actual
		number because we're going off a zero based index
	*/
	newPage.pageNumber = this.pageCount;
	newPage.className = "page";
	newPage.id = this.screen_Name + this.pageCount;
	newPage.style.visibility = "hidden";
	newPage.style.fontWeight="bold";
	
	oSystem_Colors.SetSecondaryBackground(newPage);
	oSystem_Colors.SetPrimary(newPage);

	element_Parent.appendChild(newPage);
	
	/*
		this.pageCount++ must go after all manipulations of the 
		pageCount value
	*/
	this.pageCount++;
	/*
		Now build it's sub elements.
		Note that it must be appended to the screen
		before adding its child elements because
		some child elements must interact with this page's parents
	*/	
	this.BuildElement(newPage, dataStore);
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.pageTitle = function(element_Parent, dataStore)
{
	/*
		adds a page title to the current page
	*/
	
	this.pageTitles[element_Parent.pageNumber] = dataStore.text;

	var element_Title = document.createElement("div");
	element_Parent.parentNode.appendChild(element_Title);
	element_Title.appendChild(document.createTextNode(dataStore.text));
	/*
		Set the default class and then change the location
		based upon where the page is on the screen
	*/
	element_Title.className = "pageTitle";
	element_Title.style.backgroundColor = "white";
	element_Title.style.fontWeight = "normal";
	element_Title.style.paddingLeft="5px";
	
	var titleTop = parseInt(element_Parent.pageNumber) * 20;
	titleTop += "px";
	
	element_Title.style.left = "0px";
	element_Title.style.top = titleTop;
	element_Title.style.width = "141px";
	element_Title.style.height = "20px";
	element_Title.pageNumber = element_Parent.pageNumber;
	/*
		This is critical.
		We're effectively making a pointer to this object
		inside the title element so it can call the screen
		and tell it to load this screen when it's clicked
	*/
	element_Title.oScreen = this;
	
	element_Title.id = this.screen_Name + "Title" + element_Parent.pageNumber;
	element_Title.onclick = function ()
	{
		this.oScreen.SelectPage(this.pageNumber);
	}
}
/*--------------------------------------------------------------------------
	-	description
			Creates a tab element and loads the tab pages
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.tabWindow = function(element_Parent, dataStore)
{
	newTab = new system_TabElement(element_Parent, dataStore);
	
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.text = function(element_Parent, dataStore)
{
	element_Parent.appendChild(document.createTextNode(dataStore.text));
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.className = function(element_Parent, dataStore)
{
	element_Parent.className = dataStore.text;
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.title = function(element_Parent, dataStore)
{
	//this.BuildStyle(element_Parent, dataStore);
	
	text = ["", dataStore.text];
	SetToolTip(element_Parent, text);

}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.style = function(element_Parent, dataStore)
{
	this.BuildStyle(element_Parent, dataStore);
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.id = function(element_Parent, dataStore)
{
	/*
		We're checking for duplicates.
	*/
	if(oScreenBuffer.Get(dataStore.text))
	{
		alert("Duplicate id used in screen [" + this.screen_Name + "]");
	}
	else
	{
		element_Parent[dataStore.tagName] = dataStore.text;
	}
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.input = function(element_Parent, dataStore)
{
	var element_New = document.createElement(dataStore.tagName);
	/*
		This if block has to be like this due to an incompatability between IE and firefox
		Firefox reports there ar childNodes when IE doesn't. However, if IE tries to 
		use firstChild.tagName when there are no child nodes an error happens
	*/
	
	element_New.style.position = "absolute";
	element_New.oScreen = this;

	/*
		WARNING:
		This has to be here in place for IE. An input box can only be modified
		before it is attached to the parent document
	*/
	this.BuildElement(element_New, dataStore);
	element_Parent.appendChild(element_New);
}
/*
	Build element
	The page element is the element we're currently trying to functionality
	for
	The data element is our position in the data store (XML) where we're adding our
	element data.
*/
system_Window.prototype.BuildStyle = function (element_Window, oDataElement)
{
	var tagName = "";
	var text = "";
	
	for(var iChildren = 0; iChildren < oDataElement.childNodes.length; iChildren++)
	{
		tagName = oDataElement.childNodes[iChildren].tagName;
		text = oDataElement.childNodes[iChildren].text;
		
		if(tagName)
		{
			if(this[tagName])
			{
				this[tagName].call(this, element_Window, text);
			}
			else
			{
				element_Window.style[tagName] = text;
			}
		}
	}
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.backgroundColor = function(window_element, text)
{
	/*
		The color can be primary/secondary/tertiary or a color value
		We check if it's one of the first three. If not, we just set it
		to whatever the user requested.
	*/
	switch(text)
	{
		case "Primary":
			color = oSystem_Colors.GetPrimary();
			colorScheme = text.toLowerCase();
			break;
		case "Secondary":
			color = oSystem_Colors.GetSecondary();
			colorScheme = text.toLowerCase();
			break;
		case "Tertiary":
			color = oSystem_Colors.GetTertiary();
			colorScheme = text.toLowerCase();
			break;
		default:
			color = text;
			colorScheme = "";
			break;
	}
	
	window_element.style.backgroundColor = color;
	if(colorScheme.length)
	{
		window_element.colorSchemeB = colorScheme;
	}
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Window.prototype.color = function(window_element, text)
{
	/*
		The color can be primary/secondary/tertiary or a color value
		We check if it's one of the first three. If not, we just set it
		to whatever the user requested.
	*/
	switch(text)
	{
		case "Primary":
			color = oSystem_Colors.GetPrimary();
			colorScheme = text.toLowerCase();
			break;
		case "Secondary":
			color = oSystem_Colors.GetSecondary();
			colorScheme = text.toLowerCase();
			break;
		case "Tertiary":
			color = oSystem_Colors.GetTertiary();
			colorScheme = text.toLowerCase();
			break;
		default:
			color = text;
			colorScheme = "";
			break;
	}

	window_element.style.color = color;
	if(colorScheme.length)
	{
		window_element.colorSchemeF = colorScheme;
	}
}
/*--------------------------------------------------------------------------
	-	description
			Determines if the text is an html element
	-	params
	-	return
--------------------------------------------------------------------------*/
function IsHTMLElement(strText)
{
	if(!strText)
	{
		return false;
	}
	
	switch(strText.toLowerCase())
	{
		case "button":
		case "input":
		case "label":
		case "div":
		case "select":
		case "img":
		case "table":
		case "tr":
		case "td":
		case "th":
		case "thead":
		case "caption":
		case "tbody":
		case "iframe":
		case "form":
		case "textarea":
		return true;
	}
	return false;
}