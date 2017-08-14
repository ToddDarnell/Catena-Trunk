/*
	This file is a class which manages selecting an organization or
	organization/user combination.
*/
system_Dialog.prototype = new system_Window();
system_Dialog.prototype.constructor = system_Dialog;

function system_Dialog()
{
	this.visible = false;
	this.element_root = null;		//	where the dialog box itself starts
	this.element_body = null;		//	where the user may put their elements
	this.zIndex = 40;
	this.attached = false;			//	whether the elements were attached to the document body

	this.titleOffset = 0;			//	the distance the title moves the dialog body down on the page
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Dialog.prototype.getBody = function()
{
	return this.element_body;	
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Dialog.prototype.appendChild = function(element_child)
{
	this.element_body.appendChild(element_child);	
}
/*--------------------------------------------------------------------------
	-	description
		Sets the root element this dialog box uses when creating the divs
		and connections to the document body.
	-	params
	-	return
		none
--------------------------------------------------------------------------*/
system_Dialog.prototype.setName = function(elementName)
{
	this.strElementName = elementName;
}
/*--------------------------------------------------------------------------
	-	description
			Create the dialog box
			param is the root id
	-	params
	-	return
		the body element id
--------------------------------------------------------------------------*/
system_Dialog.prototype.create = function(rootId)
{
	this.frameName = rootId + "_frame";	//	the iframe which blocks access to everything behind it
	this.fadeName = rootId + "_fade";	//	the faded (transparent) div background
	this.borderName = rootId + "_border";	//	the div element which makes up the border
	this.bodyName = rootId + "_body";	//	the div element which makes up the border
	
	/*
		Create the underlying frame
		(Thank you IE 6.0 for all this extra work)
		
		-	create the underlying iFrame
		-	create the faded div
		-	create the border around the dialog
		-	create the title
		-	create the dialog body
	*/
	
	var element_frame = document.createElement('iframe');

	element_frame.id = this.frameName;
	element_frame.style.display = 'block';
	element_frame.scrolling = 'no';
	element_frame.frameBorder = '0';
	element_frame.style.position = "absolute";
	element_frame.src = "about:blank";
	element_frame.style.filter='progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)';
	element_frame.style.width = 0;
	element_frame.style.Height = 0;
	
	var element_fade = document.createElement('div');

	element_fade.id = this.fadeName;
	element_fade.style.display = 'block';
	element_fade.style.position = "absolute";
	element_fade.className = "popupFade";
	element_fade.style.zIndex = this.zIndex - 2;
	element_fade.style.width = 0;
	element_fade.style.Height = 0;

	/*
		Build the dialog box border
	*/
	
	element_border = document.createElement('DIV');
	oSystem_Colors.SetPrimaryBackground(element_border);
	element_border.style.id = this.borderName;
	element_border.style.display = 'none';
	element_border.style.position = 'absolute';

	/*
		Add the rounded corners
	*/

	settings =
	{
  		tl: { radius: 10},
  		tr: { radius: 10 },
  		bl: { radius: 8 },
  		br: { radius: 8 },
  		antiAlias: true,
  		autoPad: false,
  		colorType:0
	}

	if(this.config.showTitle)
	{
		this.attachTitle(element_border);
	}
	
	width = this.config.width + (this.config.borderWidth * 2);
	height = this.config.height + (this.config.borderWidth * 2) + this.titleOffset;
	
	element_border.style.width = width + "px";
	element_border.style.height = height + "px";
	element_border.style.zIndex = this.zIndex;
	
	var cornersObj = new curvyCorners(settings, element_border);
	cornersObj.applyCornersToAll();
		
	/*
		Create the dialog box body element
	*/
	element_body = document.createElement('DIV');
	oSystem_Colors.SetSecondaryBackground(element_body);

	element_body.id = this.bodyName;
	element_body.style.position = 'absolute';
	element_body.style.overflow = "auto";
	element_body.style.left = this.config.borderWidth + "px";
	element_body.style.top = (this.config.borderWidth + this.titleOffset) + "px";
	element_body.style.width = this.config.width + "px";
	element_body.style.height = this.config.height + "px";
	element_border.appendChild(element_body);
	
	this.element_root = element_border;
	this.element_body = element_body;
	this.element_fade = element_fade;
	this.element_frame = element_frame;
	
	this.screenLoaded = true;
	return this.element_body;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_Dialog.prototype.getElementById = function(elementName)
{
	if(this.element_body)
	{
		return getChildById(this.element_body, elementName);
	}
	
	return null;
}
/*--------------------------------------------------------------------------
	-	description
		attach the title bar to the dialog box
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Dialog.prototype.attachTitle = function(element_root)
{
	this.element_title = document.createElement("DIV");
	
	this.element_title.style.position = "absolute";
	this.element_title.style.width = this.config.width + "px";
	this.element_title.style.height = "20px";
	this.element_title.style.left = this.config.borderWidth + "px";
	this.element_title.style.top = this.config.borderWidth + "px";
	this.element_title.style.overFlow = "hidden";
	this.element_title.align = "center";
	this.element_title.style.fontWeight = "bold";
	
	oSystem_Colors.SetSecondary(this.element_title);
	oSystem_Colors.SetPrimaryBackground(this.element_title);

	screen_SetTextElement(this.element_title, this.strScreenTitle);

	this.titleOffset = 24;

	element_root.appendChild(this.element_title);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_Dialog.prototype.setTitle = function(strNewTitle)
{
	RemoveChildren(this.element_title);

	this.strScreenTitle = strNewTitle;
		
	screen_SetTextElement(this.element_title, this.strScreenTitle);
}
//--------------------------------------------------------------------------
/**
	\brief
		Loads a dialog box from an xml file
	\param dialogName
		The unique name used to identify this dialog box
	\param screen_name
		The xml file name which describes the data
	\param module_Name
		The name of the module to load the data from
	\return
		-	false
				If there was some kind of failure.
			true
				If the dialog loaded properly.
*/
//--------------------------------------------------------------------------
system_Dialog.prototype.load = function(dialogName, screen_name, module_Name)
{
	if(!screen_name)
	{
		return false;
	}

	if(screen_name.length == 0)
	{
		return false;
	}
	
	this.screen_name = screen_name;
	
	
	var oXmlDom;

	oXmlDom = server.loadXMLSync("../modules/" + module_Name + "/screens/" + this.screen_name + ".xml");
	var oRoot = oXmlDom.documentElement;

	if(!this.create(dialogName))
	{
		return false;
	}

	if(!oRoot)
	{
		alert("Data not found for " + this.screen_name);
		return false;
	}
	
	var screenData = oRoot.getElementsByTagName("screen");	//	screen data describes the on screen element we're going to build


	//this.element_root = document.createElement("div");		//	The screenElement is the on screen element we're going to develop with screenData

	//this.element_root.id = this.screen_name + "_dialog";
	
	if(!screenData)
	{
		/*
			We don't have any screen data
		*/
		alert("No screen data found for screen: " + screen_name);
		return false;
	}
	
	/*
		Build the screen data. It may or may not contain pages
	*/

	this.BuildElement(this.element_body, oRoot);

	if(this.custom_Load)
	{
		if(!this.custom_Load())
		{
			return false;
		}
	}

	this.screenLoaded = true;
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Builds a user selection screen.
	-	params
		-	oDataElement is the raw xml which describes the characteristics
			of this user selection
		-	element_Parent
			The parent element we're going to attach to.
	-	return
--------------------------------------------------------------------------*/
system_Dialog.prototype.build = function(oDataElement, element_Parent)
{
	var tagName = "";
	var text = "";

	/*
		The three field values are what we need to load and display the user
		Selection on the parent element
	*/

	field_Top = -1;
	field_Left = -1;
	field_Id = -1;

	/*
		We care about the following bits of information:
		-	The top field
		-	the left field
		-	the id of the element
	*/

	for(var iChildren = 0; iChildren < oDataElement.childNodes.length; iChildren++)
	{
		tagName = oDataElement.childNodes[iChildren].tagName;

		if(tagName)
		{
			text = oDataElement.childNodes[iChildren].text;

			switch(tagName)
			{
				case "top":
					field_Top = text;
					break;
				case "left":
					field_Left = text;
					break;
				case "id":
					field_Id = text;
					break;
			}
		}
	}
	
	/*
		Validate the fields
	*/
	if(field_Id < 0)
	{
		return false;
	}

	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Toggles showing the element or hiding it
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Dialog.prototype.toggleShow = function()
{
	
	if(this.visible == true)
	{
		this.hide();
	}
	else
	{
		this.show();
	}
}
/*--------------------------------------------------------------------------
	-	description
			Show the popup which displays the organization and user fields,
			if applicable.
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Dialog.prototype.show = function()
{
	if(this.screenLoaded == false)
	{
		if(!this.create(this.strElementName))
		{
			return false;
		}
	}		
	
	if(this.visible == true)
	{
		return true;
	}

	if(this.attached == false)
	{
		document.body.appendChild(this.element_fade);
		document.body.appendChild(this.element_frame);
		document.body.appendChild(this.element_root);
		this.attached = true;
	}
	
	window.onscrollObject = this;
	
	this.visible = true;

	return this.draw();
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Dialog.prototype.draw = function()
{
	var docSize = xDocSize();
	
	//alert("Drawing");
	screenWidth = document.body.clientWidth + document.body.scrollLeft;
	screenHeight = document.body.clientHeight;
	
	docWidth = document.body.clientWidth + document.body.scrollLeft;
	docHeight = document.body.clientHeight + document.body.scrollTop;

	rootWidth = parseInt(this.element_root.style.width);
	rootHeight = parseInt(this.element_root.style.height);

	rootLeft = (screenWidth /2 ) - (rootWidth /2 );
	rootTop = ((screenHeight /2 ) - (rootHeight /2 )) + document.body.scrollTop;

	if(rootLeft < 0)
	{
		rootLeft = 0;
	}
	
	if(rootTop < 0)
	{
		rootTop = 0;
	}	

	this.element_root.style.left =  rootLeft + "px";
	this.element_root.style.top = rootTop + "px";
	this.element_root.style.display = 'block';
	
	this.element_frame.style.left = "0px";
	this.element_frame.style.top = "0px";
	this.element_frame.style.width = docWidth + "px";
	this.element_frame.style.height = docHeight + "px";

	this.element_fade.style.left = "0px";
	this.element_fade.style.top = "0px";
	this.element_fade.style.width = docSize.w + "px";//docWidth + "px";
	this.element_fade.style.height = docSize.h + "px";//docHeight + "px";

	this.element_frame.style.display = 'block';
	this.element_fade.style.display = 'block';
	return true;
}

/*--------------------------------------------------------------------------
	-	description
			Show the popup which displays the organization and user
			fields, if applicable
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Dialog.prototype.hide = function()
{
	if(this.visible == false)
	{
		alert('not visible');
		return true;
	}

	/*
		The box is already build.
		We just need to show it
	*/
	this.element_root.style.display = 'none';
	this.element_frame.style.display = 'none';
	this.element_fade.style.display = 'none';
	this.visible = false;

	window.onscrollObject = null;
	
	return true;
}