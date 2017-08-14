<!-- //Start hiding


// Cross-browser implementation of element.addEventListener()
function addListener(element, type, expression, bubbling)
{
	bubbling = bubbling || false;
	if(window.addEventListener)
	{
		// Standard
		element.addEventListener(type, expression, bubbling);
		return true;
	}
	else if(window.attachEvent)
	{
		// IE
		element.attachEvent('on' + type, expression);
		return true;
	}
	return false;
}
/*--------------------------------------------------------------------------
	-	description
			Gets the hex bits of a number
	-	params
	-	return
--------------------------------------------------------------------------*/
function MakeHex(x)
{
	if((x >= 0) && (x <= 9))
	{
		return x;
	}
	else
	{
		switch(x)
		{
			case 10: return "A";
			case 11: return "B";
			case 12: return "C";
			case 13: return "D";
			case 14: return "E";
			case 15: return "F";
		}
	}
}
//--------------------------------------------------------------------------
/**
	\brief
		Appends a new element type to the element_name
	\param
	\return
*/
//--------------------------------------------------------------------------
function appendChild(element_name, strType)
{
	element_new = document.createElement(strType);
	
	if(element_name)
	{
		element_name.appendChild(element_new);
	}
	else
	{
		oSystem_Debug.warning("Invalid element submitted to appendChild");
	}
	return element_new;
}
/*--------------------------------------------------------------------------
	-	description
			Converts a number to hexadecimal format
	-	params
	-	return
--------------------------------------------------------------------------*/
function IntToHex(strNum)
{
  base = strNum / 16;
  rem = strNum % 16;
  base = base - (rem / 16);
  baseS = MakeHex(base);
  remS = MakeHex(rem);

  return baseS + '' + remS;
}
//-------------------------------------------------------------------
// isBlank(value)
//   Returns true if value only contains spaces
//-------------------------------------------------------------------
function isBlank(val)
{
	if(val==null)
	{
		return true;
	}
		
	for(var i=0;i<val.length;i++)
	{
		if ((val.charAt(i)!=' ')&&(val.charAt(i)!="\t")&&(val.charAt(i)!="\n")&&(val.charAt(i)!="\r"))
		{
			return false;
		}
	}
	return true;
}
//-------------------------------------------------------------------
// isInteger(value)
//   Returns true if value contains all digits
//-------------------------------------------------------------------
function isInteger(val)
{
	if (isBlank(val))
	{
		return false;
	}
	for(var i=0; i < val.length; i++)
	{
		if(!isDigit(val.charAt(i)))
		{
			return false;
		}
	}
	return true;
}
//-------------------------------------------------------------------
// isDigit(value)
//   Returns true if value is a 1-character digit
//-------------------------------------------------------------------
function isDigit(num)
{
	if (num.length > 1)
	{
		return false;
	}
	
	var string="1234567890";
	
	if (string.indexOf(num) != -1)
	{
		return true;
	}
	
	return false;
}
//-------------------------------------------------------------------
//	Tries to determine if the specified string is alphanumeric
//	Returns true if it is. False if it is not.
//-------------------------------------------------------------------
function isAlphanumeric(alphane)
{
	var numaric = alphane;
	for(var j=0; j<numaric.length; j++)
	{
		var alphaa = numaric.charAt(j);
		var hh = alphaa.charCodeAt(0);
		if((hh > 47 && hh<59) || (hh > 64 && hh<91) || (hh > 96 && hh<123))
		{
		}
		else
		{
			return false;
		}
	}
	return true;
}
//-------------------------------------------------------------------
//	Tries to get the requested object depending upon which browswer
//	is used. Necessary to support Firefox and IE.
//-------------------------------------------------------------------
function getObj(name)
{
	if (document.getElementById)
	{
		this.obj = oScreenBuffer.Get(name);
		this.style = oScreenBuffer.Get(name).style;
	}
	else if (document.all)
	{
		this.obj = document.all[name];
		this.style = document.all[name].style;
	}
	else if (document.layers)
	{
		this.obj = getObjNN4(document,name);
		this.style = this.obj;
	}
}
/*--------------------------------------------------------------------------
	-	description
			Returns true if the variable passed in is a string.
	-	params
	-	return
--------------------------------------------------------------------------*/
function isString(variable)
{
	return typeof(variable) == "string";
}
/*
	Hides an element/ Shows an element
*/
function HideElement(elementName)
{
	if (isString(elementName))
	{
		element = oScreenBuffer.Get(elementName);
	}
	else
	{
		element = elementName;
	}
	
	if(element)
	{
		element.style.visibility = "hidden";
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function ShowElement(elementName)
{
	if (isString(elementName))
	{
		element = oScreenBuffer.Get(elementName);
	}
	
	if(element)
	{
		element.style.visibility = "visible";
	}
	
}
/*
	Shows an element of using CSS.
	Note this function uses inheritance for the object
	which is important for those elements which
	must be hidden when it's parent is hidden.
	If the element can stay or should stay visible when its
	parent is hidden then use ShowElement()
*/
function ShowInheritElement(elementName)
{
	if (isString(elementName))
	{
		element = oScreenBuffer.Get(elementName);
	}
	else
	{
		element = elementName
	}
	
	if(!element)
	{
		alert("ShowInheritElement(): Invalid element called with: [" + elementName + "].");
		return;
	}

	element.style.visibility = "inherit";
}
function ClearElement(elementName)
{
	oScreenBuffer.Get(elementName).value = "";
}
/*
	Clear all the children of an element.
	elementName is the name of the element
*/
function RemoveChildren(elementName)
{
	if (isString(elementName))
	{
		element = oScreenBuffer.Get(elementName);
	}
	else
	{
		element = elementName
	}
	
	if(!element)
	{
		return;
	}

	while (element.hasChildNodes())
	{
    	element.removeChild(element.firstChild);
	}                
}
/*
	This function fills an on screen HTML drop down control
	with a list of the organization short names
	-	element_Name
			The html element we're adding the options to.
			This is the text name of the element, not a javascript
			object.
	-	aElements
			an array of element records.
	-	fieldName
			the field in aElements we'll plug into the option field
	-	addBlank
			Whether we should add an empty option
	-	position
			The position which should have the default focus
*/
function fillControl(source_Name, aElements, fieldName, addBlank, position)
{
	/*
		Get rid of all of the children of this element
		Then create a blank option and add it to the list first
	*/
	if (isString(source_Name))
	{
		element_control = oScreenBuffer.Get(source_Name);
	}
	else
	{
		element_control = source_Name;
	}
	
	if(!element_control)
	{
		oSystem_Debug.warning("Control " + source_Name + " not found in fill control.");
		return;
	}
	
	RemoveChildren(element_control);

	/*
		Because addBlank was added after the fillField
		control was added to many lists
		the default behavior is set to be add a blank
		if the addBlank field is not defined or is set
		to true.
		This way we don't have to go back and change all the
		fields
	*/
	
	if(addBlank == undefined || addBlank == true)
	{
		var element_blankOption = document.createElement("OPTION");
		element_control.appendChild(element_blankOption);
	}
	
	//
	//	Now build the list with the existing organizations
	//

	for(var iElement=0; iElement < aElements.length; iElement++)
	{
		element_option = document.createElement("OPTION");
		
		if(fieldName)
		{
			element_option.value = aElements[iElement][fieldName];
			element_option.innerHTML = aElements[iElement][fieldName];
		}
		else
		{
			element_option.value = aElements[iElement];
			element_option.innerHTML = aElements[iElement];
		}
		
		/*
			Set to true if the element matches the position passed in
			The default is false so we don't change it if the positions don't match
		*/
		if(iElement == position)
		{
			element_option.selected = true;
		}
				
		element_control.appendChild(element_option);
	}
}
/*
	InList checks to see if element value is already in the list
	-	list
			The list we're searching
	-	elementValue
			The text or object we're comparing against the values
			in the list
*/
function InList(list, elementValue)
{
	if(!list)
	{
		return false;
	}

	for(var iElement=0; iElement < list.length; iElement++)
	{
			
		if(list[iElement] == elementValue)
		{
			return true;
		}
	}
	
	return false;
}
/*
	Parses an XML object and returns an array of elements
	-	oXmlDom
			The XML data store
	-	element
			The element we're to make the list from.
			Doesn't have to be the root element
*/
function ParseXML(oXmlDom, elementValue)
{
	try
	{
			
		var aList = oXmlDom.documentElement.getElementsByTagName(elementValue);	//	 a list of the organization elements
		var thisArray = new Array();
	
		for(var iElement=0; iElement < aList.length; iElement++)
		{
			//
			//	First, we grab the title of the submenu
			//	and create that item
			//	then next we add all of the items to it
			//	if there are any
			var oCurrentChild = aList[iElement].firstChild;
			thisArray[iElement] = new Object;
	
			do
			{
				if(oCurrentChild.nodeType == 1)
				{
					thisArray[iElement][oCurrentChild.tagName] = oCurrentChild.text;
				}
			} while (oCurrentChild = oCurrentChild.nextSibling);
		}
		return thisArray;
	}
	catch(err)
	{
		oSystem_Debug.error("XML object value failure");
		return null;
	}
}
/*
	Appends a body to a table
	pass in the DOM table object
	returns the identifier of the body element
*/
function AppendBody(table)
{
	if(!table)
	{
		alert("Invalid table passed into Append Body.");
		return false;
	}
	var element_body = document.createElement("TBODY");
	table.appendChild(element_body);

	return element_body;
	
}
/*
	Appends a caption to a table
*/
function AppendCaption(table, strCaption)
{
	var element_caption = document.createElement("CAPTION");
	
	element_caption.appendChild(document.createTextNode(strCaption));
	element_caption.style.fontSize = "24px";
	element_caption.style.fontWeight = "bold";
	oSystem_Colors.SetPrimary(element_caption);
	
	table.appendChild(element_caption);
	
	element_caption.style.textAlign = "center";
	

}
/*
	Builds a table header and attaches it to the passed in table object
	-	table
		is the DOM table object
	-	headerList
		is the list of header elements
*/
function AppendHeader(table, headerList)
{
	/*
		-	Clear the current table if there is one
		-	build a new table, add the header
			and then add the children results if we found any
	*/
	
	if(!table)
	{
		alert("Invalid table passed into Append Header.");
		return false;
	}
	
	element_Header = document.createElement("THEAD");
	var undefined;

	element_row = document.createElement("TR");
	element_Header.appendChild(element_row);
	
	oSystem_Colors.SetSecondary(element_Header);
	oSystem_Colors.SetPrimaryBackground(element_Header);

	for(var i = 0; i < headerList.length; i++)
	{
 		oCell = document.createElement("TH");
		screen_SetTextElement(oCell, headerList[i].text);

		if(headerList[i].width)
		{
			oCell.style.width = headerList[i]['width'];
		}
		
		if(headerList[i].sort)
		{
			if(headerList[i].sort == true)
			{
				oCell.className = "link";
				oCell.oParent = this;
				oCell.cellDescripter = headerList[i];
		
				oCell.onclick = function()
				{
					this.oParent.headerClick(this.cellDescripter);
				}
			}
		}
		element_row.appendChild(oCell);
	}

	table.appendChild(element_Header);
}
/*
	This function selections the option whose value is set to value
	in the select list named element
*/
function SelectOption(element, value)
{
	var list = oScreenBuffer.Get(element);
	for (var i = 0; i < list.length; i++)
	{
		if (list.options[i].value == value)
		{
			list.options[i].selected=true;
		}
	}
}
/*
	MoveListOptions moves items in one list to another list if they're selected
	This function can take either an object or a string name
*/
function MoveListOptions(fromList, toList)
{
	if(isString(fromList))
	{
		element_from = oScreenBuffer.Get(fromList);
	}
	else
	{
		element_from = fromList;
	}

	if(isString(toList))
	{
		theSelTo = oScreenBuffer.Get(toList);
	}
	else
	{
		theSelTo = toList;
	}

	var selLength = theSelFrom.length;
	var selectedText = new Array();
	var selectedValues = new Array();
	var selectedCount = 0;
	
	var i;
	
	/*
		Find the selected Options in reverse order
		and delete them from the 'from' Select.
	*/
	
	for(i = selLength-1; i>=0; i--)
	{
		if(element_from.options[i].selected)
		{
			selectedText[selectedCount] = element_from.options[i].text;
			selectedValues[selectedCount] = element_from.options[i].value;
			RemoveListOption(element_from, i);
			selectedCount++;
		}
	}
	
	// Add the selected text/values in reverse order.
	// This will add the Options to the 'to' Select
	// in the same order as they were in the 'from' Select.
	for(i=selectedCount-1; i>=0; i--)
	{
		AddListOption(theSelTo, selectedText[i], selectedValues[i]);
	}
}
/*
	This function adds an item to a list
*/
function AddListOption(source_name, theText, theValue)
{
	if(isString(source_name))
	{
		element_cell = oScreenBuffer.Get(source_name);
	}
	else
	{
		element_cell = source_name;
	}

	var newOpt = new Option(theText, theValue);
	var selLength = element_cell.length;
	element_cell.options[selLength] = newOpt;
}
/*
	This function removes an item from a list
*/
function RemoveListOption(theSel, theIndex)
{ 
	var selLength = theSel.length;
	if(selLength > 0)
	{
		theSel.options[theIndex] = null;
	}
}
/*
	GetListSelectedItems
		-	strElement is the string name of the list elemente
			which is to have it's fields 
		- returns an array of elements selected within a list
*/
function GetListSelectedItems(strElement)
{
	var selected = new Array();
	var index = 0;
	for (var intLoop = 0; intLoop < opt.length; intLoop++)
	{
		if ((opt[intLoop].selected) ||	(opt[intLoop].checked))
		{
			index = selected.length;
			selected[index] = new Object;
			selected[index].value = opt[intLoop].value;
			selected[index].index = intLoop;
		}
	}
	return selected;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function getChildById(element_root, strElementName)
{
	if(element_root)
	{
		if(element_root.id)
		{
			if(element_root.id == strElementName)
			{
				return element_root;
			}
		}	
		
		var element_current = element_root.firstChild;
		
		while(element_current != null)
		{
			element_result = getChildById(element_current, strElementName);

			if(element_result != null)
			{
				return element_result;
			}
			
			element_current = element_current.nextSibling;
		}
	}
	
	return null;
}
/*
	GetListItems
		-	strElement is the string name of the list element
			whose options we'll return
		- returns an array of values within a list
*/
function GetListItems(strElement)
{
	optionElement = oScreenBuffer.Get(strElement);
	var list = new Array();
	var index = 0;
	
	
	for (var intLoop = 0; intLoop < optionElement.length; intLoop++)
	{
		index = list.length;
		list[index] = optionElement[intLoop].value;
	}
	return list;
}

/*
	The following function gathers information about the user
	client and returns true if it's a valid browser.
*/

function IsBrowserValid()
{
	/*
		Opera is not supported
	*/
/*
	if ((navigator.userAgent).indexOf("Opera")!=-1)
	{
		return false;
	}
*/
	IEVersion = GetIEMajorVersion();
	
	if(IEVersion > 0)
	{
		/*
			We have a copy of Internet Explorer
		*/
		
		if(IEVersion < 6)
		{
			return false;
		}
		return true;
	}
	
	var clientVersion = navigator.appVersion;
	
	clientVersion = clientVersion.substring(0,4);
	
	appCodeName = navigator.appCodeName;
	
	appPlatform = navigator.platform;

	if(appCodeName == "Mozilla")
	{
		if(clientVersion < 5)
		{
			return false;
		}
	}

	return true;
}
/*
	This function returns the microsoft browser version
*/
function GetIEMajorVersion()
{
	var ua = window.navigator.userAgent;
	var msie = ua.indexOf ( "MSIE " );
	if ( msie > 0 )      // If Internet Explorer, return version number
	{
		return parseInt (ua.substring (msie+5, ua.indexOf (".", msie )));
	}
    else
    {
    	// If another browser, return 0
      	return 0;
   	}
}
/*
	This function determines whether the user has selected a valid file path 
*/
function ValidFile(filePath)
{
	var regExpText =/(^[A-Z]:\\|^\\\\|^\/)/;

	if (!regExpText.test(filePath))
	{
		oCatenaApp.showNotice(notice_Error, "Please select a valid file.");
		return false;
	}
	
	return true;
}

/*
	Tries to determine if cookies are enabled.
	Returns true if they are.
	False if they are not
*/
function CookiesEnabled()
{
	var cookieEnabled=(navigator.cookieEnabled)? true : false;
	
	//if not IE4+ nor NS6+
	if (typeof navigator.cookieEnabled=="undefined" && !cookieEnabled)
	{ 
		document.cookie="testcookie"
		cookieEnabled=(document.cookie.indexOf("testcookie")!=-1)? true : false;
	}

	return cookieEnabled;
}
/* 	
	Function to get the mouse Y position 
*/
function getMouseY(e)
{
	/*
		posY contains the mouse position relative to the document
	*/
	var posY = 0;
	if(!e)
	{
		var e = window.event;
	}
	
	if (e.pageY)
	{
		posY = e.pageY;
	}
	else if (e.clientY)
	{
		posY = e.clientY + document.body.scrollTop - document.body.clientTop;
	}
	return posY;
}
/* 	
	Function to get the mouse X position 
*/
function getMouseX(e)
{
	/*
		posX contains the mouse position relative to the document
	*/
	var posX = 0;
	
	if(!e)
	{
		var e = window.event;
	}
	
	if (e.pageX)
	{
		posX = e.pageX;
	}
	else if (e.clientX)
	{
		posX = e.clientX + document.body.scrollLeft - document.body.clientLeft;
	}
	
	return posX;
}
/*
	creats an input field, sets the id, and the value
	strName
		The name of the element
	strValue
		The value of the element
*/
function screen_CreateHiddenElement(strName, strValue)
{
	element_Temp = document.createElement("INPUT");
	element_Temp.type = "hidden";
	element_Temp.name = strName;
	element_Temp.value = strValue;
	return element_Temp;
}
/*
	creats an input field, sets the id, and the value
	strName
		The name of the element
	strValue
		The value of the element
*/
function screen_CreateInputElement(strName, strValue)
{
	element_Temp = document.createElement("INPUT");
	element_Temp.name = strName;
	element_Temp.value = strValue;
	return element_Temp;
}
/*
	screen_SetTextElement sets the text
	associated with an element. Note, this
	function removes all children elements
	so use it carefully.
*/
function screen_SetTextElement(element, strText)
{
	if(!element)
	{
		return false;
	}
	
	if(isString(element))
	{
		element = oScreenBuffer.Get(element);
	}
	
	RemoveChildren(element);
	element.appendChild(document.createTextNode(strText));

}
/*
	Creates a new element which can be displayed on the screen
	-	strText
		The text to display
	-	pos_Left, pos_Top
		The left and top positions of the text element (numerical)
*/
function screen_CreateTextElement(strText, pos_Left, pos_Top)
{

	element_text = document.createElement("LABEL");
	element_text.appendChild(document.createTextNode(strText));
	
	element_text.style.position = "absolute";
	element_text.style.top = pos_Top + "px";
	element_text.style.left = pos_Left + "px";
	
	return element_text;
}

/*
	Creates a new graphic element link
	-	strImage
			The name of the image file to use. It's assumed
			all images are in the image folder
	-	strTitle
			The tool tip text used for this link
	-	return
			The span element created to wrap the image "link".
			Additionally, the span element has a field
			named image_id which has the id of the image
	- imageLinkNameCounter keeps track of the custom image
		names used by the link 
*/
var imageLinkNameCounter = 0;
function screen_CreateGraphicLink(strImage, strTitle)
{
	/*
		Make the link wrapper
	*/
	element_GraphicLink = document.createElement("SPAN");
	element_GraphicLink.className = "link";
	element_GraphicLink.title = strTitle;
	element_GraphicLink.image_id = "ImageLink_" + imageLinkNameCounter;
	
	
	element_ImageBlob = document.createElement("IMG");
	element_ImageBlob.src = "../image/" + strImage;
	element_ImageBlob.align = "absmiddle";
	element_ImageBlob.id = "ImageLink_" + imageLinkNameCounter;
	element_ImageBlob.width= "20";
	element_ImageBlob.height= "20";
	
	
	element_GraphicLink.appendChild(element_ImageBlob);
	
	imageLinkNameCounter++;
	
	return element_GraphicLink;
}
/*
	Creates a new element which can be displayed on the screen
	-	strID
		The text name of the element
	-	pos_Left, pos_Top
		The left and top positions of the text element (numerical)
*/
function screen_CreateSelectElement(strID, pos_Left, pos_Top)
{

	element = document.createElement("SELECT");
	element.id = strID;
	
	element.style.position = "absolute";
	element.style.top = pos_Top + "px";
	element.style.left = pos_Left + "px";
	
	return element;
}
/*
	Creates a new element which can be displayed on the screen
	-	user_info
		The name of the user we'll display. This data is
		passed to the server when we need to retrieve information
		about the account.
*/

arUsers = new Object();

function screen_CreateUserLink(user_info)
{
	element_UserLink = document.createElement("SPAN");
	element_UserLink.appendChild(document.createTextNode(user_info));

	if(arUsers[user_info])
	{
		text = [arUsers[user_info].user_Name, arUsers[user_info].text];
		SetToolTip(element_UserLink, text, tooltip_style["link"]);
	}
	else
	{
		addListener(element_UserLink, 'mouseover', userLinkMouseOver);
		element_UserLink.user_info = user_info;
	}
	
	return element_UserLink;
}

/*
	userLinkMouseOver is called by a user name link is highlighted.
	The details for the user name account are displayed for the user
	to view.
	The following information is dispalyed by default:
	
		organization
		email
*/
function userLinkMouseOver(e)
{
	var element_target = e.target ? e.target : e.srcElement;

	element_target.onmouseover = null;

	if(arUsers[element_target.user_info])
	{
		text = [arUsers[element_target.user_info].user_Name, arUsers[element_target.user_info].text];
		SetToolTip(element_target, text, tooltip_style["link"]);
		ShowToolTip(e);
		return;
	}
	
	var serverValues = Object();
	var xmlObject;
	
	serverValues.location = strUserURL;
	serverValues.action = "settings";
	serverValues.id = element_target.user_info;
	settings = server.CreateListSync(serverValues, "settings");
	
	if(settings)
	{
		if(settings[0])
		{
			strEmail = "";
			
			if(settings[0].user_EMail.length > 0)
			{
				strEmail = "<a href='mailto:" + settings[0].user_EMail + "'>email</a>";
			}
			

			strButton = "<BUTTON onclick=\"GetUserDetails('" + settings[0].user_Name + "')\">Details</BUTTON>";
			strTitle = "(" + settings[0].org_Short_Name + " - " + settings[0].org_Long_Name + ")<BR>" + strEmail + "<BR>" + strButton;
			
			arUsers[element_target.user_info] = Object();
			arUsers[element_target.user_info].text = strTitle;
			arUsers[element_target.user_info].user_Name = settings[0].user_Name;
			
			text = [settings[0].user_Name, strTitle];
			SetToolTip(element_target, text, tooltip_style["link"]);
			ShowToolTip(e);
		}
	}
}
/*
	Creates a new element which can be displayed on the screen
	-	user_info
		The name of the user we'll display. This data is
		passed to the server when we need to retrieve information
		about the account.
*/

arOrgs = new Object();

function screen_CreateOrganizationLink(org_info)
{
	element_OrgLink = document.createElement("SPAN");
	element_OrgLink.appendChild(document.createTextNode(org_info));

	if(arOrgs[org_info])
	{
		element_OrgLink.title = arOrgs[org_info];	
	}
	else
	{
		element_OrgLink.onmouseover = orgLinkMouseOver;
		element_OrgLink.org_info = org_info;
	}
	
	return element_OrgLink;
}
/*
	userLinkMouseOver is called by a user name link is highlighted.
	The details for the user name account are displayed for the user
	to view.
	The following information is dispalyed by default:
	
		organization
		email
*/
function orgLinkMouseOver()
{
	this.onmouseover = null;

	if(arOrgs[this.org_info])
	{
		this.title = arOrgs[this.org_info];
		return;
	}
	
	var serverValues = Object();
	var xmlObject;
	
	serverValues.location = strListURL;
	serverValues.action = "organizations";
	serverValues.name = this.org_info;
	settings = server.CreateListSync(serverValues, "element");
	
	if(settings)
	{
		if(settings[0])
		{
			strTitle = settings[0].org_Long_Name;
			this.title = strTitle;
			arOrgs[this.org_info] = strTitle;
		}
	}
}
/*
	Creates a new element which can be displayed on the screen
	-	rightGroupId
		The id of the right group
	-	strName
		The name for the right group
*/
function screen_CreateRightGroupDetailLink(rightGroupId, strName)
{
	element_UserLink = null;
	
	if(rightGroupId)
	{
		if(strName)
		{
			element_UserLink = document.createElement("SPAN");
			element_UserLink.appendChild(document.createTextNode(strName));
		
			element_UserLink.onmouseover = rightGroupDetailMouseOver;
			element_UserLink.group_info = rightGroupId;
		}
	}
		
	return element_UserLink;
}
/*
	userLinkMouseOver is called by a user name link is highlighted.
	The details for the user name account are displayed for the user
	to view.
	The following information is dispalyed by default:
	
		organization
		email
*/
function rightGroupDetailMouseOver()
{
	var serverValues = Object();
	
	serverValues.location = strRightGroupURL;
	serverValues.action = "getassignedrights";
	serverValues.group = this.group_info;
	
	settings = server.CreateListSync(serverValues, "element");
	
	strTitle = "";
	
	for(i = 0; i < settings.length; i++)
	{
		strTitle = strTitle + settings[i].right_Name;
		
		if(settings[i].org_Short_Name.length > 0)
		{
			strTitle = strTitle + " (" + settings[i].org_Short_Name + ")";
		}
		
		strTitle = strTitle + "\n";
	}
	
	if(strTitle.length < 1)
	{
		strTitle = "No rights assigned to this group";	
	}
	
	this.title = strTitle;
}
/*
	formatReceiver takes a raw receiver number
	and formats it in the following manner:
	R00000000-00
	Formats a receiver string and output
*/
function formatReceiver(strNumber)
{
	if(!strNumber)
	{
		return "";
	}
	
	if(strNumber.length == 12)
	{
		return "R" + strNumber.substr(0, 10) + "-" + strNumber.substr(10,12);
	}

	if(strNumber.length == 10)
	{
		return "R" + strNumber;
	}
	
	return strNumber;
}
function formatSmartcard(strNumber)
{
	if(!strNumber)
	{
		return "";
	}
	if(strNumber.length == 12)
	{
		return "S" + strNumber.substr(0, 10) + "-" + strNumber.substr(10,12);
	}
	
	if(strNumber.length == 10)
	{
		return "S" + strNumber;
	}
	
	return strNumber;
}

/*--------------------------------------------------------------------------
	Format the date from YYYY-MM-DD (the format in in the Database)to a
	more customary MM/DD/YYYY.
----------------------------------------------------------------------------*/
function formatDate(strDate)
{
	var arDate = strDate.split("-");
	var month = arDate[1];
	var day = arDate[2];
	var year = arDate[0];
	
	strDate = (month + "/" + day + "/" + year);
	return strDate;
}

/*--------------------------------------------------------------------------
Format times fields from HH:MM:SS (the format in in the Database)to a
	format of your choice based on the number you pass in:
	Pass in 1 - Time will be displayed as HH      
	Pass in 2 - Time will be displayed as HH:MM    
	Pass in 3 - Time will be displayed as HH:MM:SS
	The default value is 3 if the parameter isn't sets
----------------------------------------------------------------------------*/
function formatTime(strInputTime, iFormat)
{
	/*
		Set a default format if the value isn't passed in
	*/
	if(!iFormat)
	{
		iFormat = 3;
	}
	
	if(!strInputTime)
	{
		return "";
	}
	
	if(strInputTime.length < 1)
	{
		alert("Time not set: " + strInputTime);
	}
	
	var arTime = strInputTime.split(":");
	var Hour = arTime[0];
	var Minute = arTime[1];
	var Second = arTime[2];
	var strTime = "";
    var a_p = "";

    /*-----------------------------------------------------------
        Get AM and PM and eliminate military time
    ------------------------------------------------------------*/   
   if (Hour < 12)
   {
        a_p = "am";
   }
   else
   {
        a_p = "pm";
   }
   if (Hour == 0)
   {
       Hour = 12;
   }
   if (Hour > 12)
   {
       Hour = Hour - 12;
   }

   /*-----------------------------------------------------------
        Write out time fields as determined by passed in 
        specifiactions.
    ------------------------------------------------------------*/
	if(iFormat > 0)
	{
		strTime = Hour;
	}
	
	if(iFormat > 1)
	{
		strTime = strTime + ":" + Minute;
	}
	
	if(iFormat > 2)
	{
		strTime = strTime + ":" + Second;
	}

	return strTime + " " + a_p;
}

/*--------------------------------------------------------------------------
	Format datetime fields from YYYY-MM-DD HH:MM:SS (the format in in the Database)
	to a more customary MM/DD/YYYY with time displayed according to your passed in 
	preferences.
----------------------------------------------------------------------------*/
function formatDateTime(strDateTime)
{
	if(!isString(strDateTime))
	{
		return "";
	}
	
	if(strDateTime.length < 1)
	{
		return "";
	}
	
	var arDateTime = strDateTime.split(" ");
	
	if(arDateTime[0])
	{
		var strDate = formatDate(arDateTime[0]);
	}
	var strTime = formatTime(arDateTime[1], 2);
	
	strDateTime = strDate + " " + strTime;
	return strDateTime;
}

/*--------------------------------------------------------------------------
	Add new lines and carriage returns to outputted text for clean 
	formatting. This function simply replaces the \n and \n\r escape 
	characters with line breaks.
----------------------------------------------------------------------------*/
function insertBreaks(strText)
{	
	return strText.replace(/\n/g, "<br />");
}	
 
/*--------------------------------------------------------------------------
	Takes a passed in string and truncates it to a desired length, appending
	an ellipsis to the end. 
	Variables: 	$str - The passed in string.
	
				$len - The amount of characters allowed before truncation.
----------------------------------------------------------------------------*/
function Truncate(str, len)
{
  if (str.length > len) 
  {
	/*--------------------------------------------------------------------------
       Truncate the content of the string, then go back to the end of the
       previous word to ensure that we don't truncate in the middle of
       a word 
    ----------------------------------------------------------------------------*/
    str = str.substring(0, len);
    str = str.replace(/\w+$/, '');

    /*-------------------------------------------------------------------------- 
    	Add an ellipsis to the end 
    ----------------------------------------------------------------------------*/
    str = str + '...';
  }
  return str;
}

/*-------------------------------------------------------------------------- 
    Check leap year looks at the passed in year and determines whether it 
    is a leap year or not. If it is a leap year, the function returns true.
    If it is not a leap year the function returns false.
    
    The logic to determining leap years is: 
    	1. A year that is divisible by 4 is a leap year. (Y % 4) == 0 
    	
		2. Exception to rule 1: a year that is divisible by 100 is not a 
		   leap year. (Y % 100) != 0 

		3. Exception to rule 2: a year that is divisible by 400 is a leap 
		   year. (Y % 400) == 0 
    	
    	 - Script by hscripts.com
----------------------------------------------------------------------------*/
function IsLeapYear(strYear)
{
	strYear = parseInt(strYear);
	
	if(strYear %4 == 0)
	{
		if(strYear %100 != 0)
		{
			return true;
		}
		else
		{
			if(strYear %400 == 0)
			{        
				return true;
			}
			else
			{
				return false;
			}
		}
	}
	return false;
}
function include_dom(script_filename)
{
    var html_doc = document.getElementsByTagName('head').item(0);
    var js = document.createElement('script');
    js.setAttribute('language', 'javascript');
    js.setAttribute('type', 'text/javascript');
    js.setAttribute('src', script_filename);
    html_doc.appendChild(js);


}

var included_files = new Array();

function include_once(script_filename)
{
	if (!included_files[script_filename])
	{
		oSystem_Debug.notice("Adding script: " + script_filename);
		included_files[script_filename] = true; // really non-"false" value
		include_dom(script_filename);
    }
}

function xDocSize()
{
	var b=document.body, e=document.documentElement;
	var esw=0, eow=0, bsw=0, bow=0, esh=0, eoh=0, bsh=0, boh=0;

	if (e)
	{
		esw = e.scrollWidth;
		eow = e.offsetWidth;
		esh = e.scrollHeight;
		eoh = e.offsetHeight;
	}
	if (b)
	{
		bsw = b.scrollWidth;
		bow = b.offsetWidth;
		bsh = b.scrollHeight;
		boh = b.offsetHeight;
	}
	return {w:Math.max(esw,eow,bsw,bow),h:Math.max(esh,eoh,bsh,boh)};
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function GetUserDetails(strUserName)
{
	strLastName = "";
	strFirstName = "";
	
	arUser = strUserName.split(".");

	if(arUser[0])
	{
		strFirstName = arUser[0];
	}
	
	if(arUser[1])
	{
		strLastName = arUser[1];
	}
	
	 strFeatures = "width=800,height=400,resizable,scrollbars=yes,status=1";
	
	window.open("../phone.php?last=" + strLastName + "&first=" + strFirstName, "_blank", strFeatures);
}

-->