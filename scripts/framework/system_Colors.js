/*
	The purpose of this file is to set the color theme of the site elements
*/

/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
function system_colors()
{
	/*
		Set to the default color scheme values
	*/
	this.primary = "";
	this.secondary = "";
	this.tertiary = "";
}
/*--------------------------------------------------------------------------
	-	description
			Loads the color values and sets the default colors,
			creates the link which is displayed in the upper right corner
			of the main page
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.load = function()
{
	this.set(oUser.GetTheme());
}
/*--------------------------------------------------------------------------
	-	description
		Set the color scheme.
		setId is the color scheme we're to set all elements to
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.set = function(iTheme)
{
	var set = parseInt(iTheme);
	
	switch(set)
	{
		case 0:
			this.primary = "#3974BF";
			this.secondary = "#F2F8FF";
			this.tertiary = "#A6CDFF";
			break;
		case 1:
			this.primary = "#42A642";
			this.secondary = "#F2FFF2";
			this.tertiary = "#DAF2DA";
			break;
		case 2:
			this.primary = "#6636B3";
			this.secondary = "#F7F2FF";
			this.tertiary = "#DCCEF2";
			break;
		case 3:
			this.primary = "#997D0F";
			this.secondary = "#FFFAE6";
			this.tertiary = "#FFF2BF";
			break;
		case 4:
			this.primary = "#566773";
			this.secondary = "#F2FAFF";
			this.tertiary = "#C2C8CC";
			break;
		case 5:
			this.primary = "#B31B5E";
			this.secondary = "#FFF2F8";
			this.tertiary = "#FFCCE3";
			break;
		case 6:
			this.primary = "#8C0707";
			this.secondary = "#FFF2F2";
			this.tertiary = "#FFCCCC";
			break;
		case 7:
			this.primary = "#006666";
			this.secondary = "#F2FFFF";
			this.tertiary = "#B8E6E6";
			break;
		case 8:
			this.primary = "#593704";
			this.secondary = "#FFF5E6";
			this.tertiary = "#E6CAA1";
			break;
		case 9:
			this.primary = "#000000";
			this.secondary = "#F2F2F2";
			this.tertiary = "#CCCCCC";
			break;
		case 10:
			this.primary = "#00214D";
			this.secondary = "#E6F1FF";
			this.tertiary = "#B6D0F2";
			break;
		case 11:
			this.primary = "#004000";
			this.secondary = "#F2FFF2";
			this.tertiary = "#B8D9B8";
			break;			
		default:
			alert("oSystem_Color::Set(). No color set found.");
			return false;
	}
	
	if(oScreenBuffer.IsBuffer())
	{
		this.UpdateColors(oScreenBuffer.GetRoot());
	}
	
	this.UpdateColors(document);
	
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Update colors searches the active document and
			the offscreen buffer for all elements and then
			changes them if they have a primary, secondary,
			or tertiary tag set
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.UpdateColors = function(rootElement)
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
			
		switch(oCurrentChild.colorSchemeF)
		{
			case "primary":
				this.SetPrimary(oCurrentChild);
				break;
			case "secondary":
				this.SetSecondary(oCurrentChild);
				break;
			case "tertiary":
				this.SetTertiary(oCurrentChild);
				break;
		}
		switch(oCurrentChild.colorSchemeB)
		{
			case "primary":
				this.SetPrimaryBackground(oCurrentChild);
				break;
			case "secondary":
				this.SetSecondaryBackground(oCurrentChild);
				break;
			case "tertiary":
				this.SetTertiaryBackground(oCurrentChild);
				break;
		}

		if(oCurrentChild.childNodes.length)
		{
			this.UpdateColors(oCurrentChild);
		}
	} while (oCurrentChild = oCurrentChild.nextSibling);
}
/*--------------------------------------------------------------------------
	-	description
		Sets the foreground color to the primary value
		Sets the value of colorSchemeF to the primary color
		When changing the color scheme, the two properties
		colorSchemeF and colorSchemeB are checked to
		see if they're set. If they are then those elements
		are changed to the value of the specified color
	-	params
	-	return
			true
				the element was valid and was set
			false
				the element was not valid and was not set
--------------------------------------------------------------------------*/
system_colors.prototype.SetPrimary = function (element)
{
	if(isString(element))
	{
		element = oScreenBuffer.Get(element);
	}

	if(!element)
	{
		return false;
	}

	element.style.color = this.primary;
	element.colorSchemeF = "primary";
	
	return true;
}
//--------------------------------------------------------------------------
/**
	\brief Sets the background color
	\param element
		The HTML element to be colored
	\param type
		The type of color to apply.
		0 primary
		1 secondary
		2 tertiary
	\return
*/
//--------------------------------------------------------------------------
system_colors.prototype.SetBackground = function(element, color_type)
{
	if(!color_type)
	{
		color_type = 0;
	}
	
	switch(color_type)
	{
		case 0:
			this.SetPrimaryBackground(element);
			break;
		case 1:
			this.SetSecondaryBackground(element);
			break;
		case 2:
			this.SetTertiaryBackground(element);
			break;
	}
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.SetPrimaryBackground = function(element)
{
	if(isString(element))
	{
		element = oScreenBuffer.Get(element);
	}

	element.style.backgroundColor = this.primary;
	element.colorSchemeB= "primary";
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.SetSecondary = function (element)
{
	if(isString(element))
	{
		element = oScreenBuffer.Get(element);
	}

	element.style.color = this.secondary;
	element.colorSchemeF= "secondary";
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.SetSecondaryBackground = function(element)
{
	if(!element)
	{
		return false;
	}
	if(isString(element))
	{
		element = oScreenBuffer.Get(element);
	}

	element.style.backgroundColor = this.secondary;
	element.colorSchemeB= "secondary";
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.SetTertiary = function (element)
{
	if(isString(element))
	{
		element = oScreenBuffer.Get(element);
	}

	element.style.color = this.tertiary;
	element.colorSchemeF= "tertiary";
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.SetTertiaryBackground = function(element)
{
	if(isString(element))
	{
		element = oScreenBuffer.Get(element);
	}

	element.style.backgroundColor = this.tertiary;
	element.colorSchemeB= "tertiary";
}
/*--------------------------------------------------------------------------
	-	description
			Set takes two parameters to set an elements color.
	-	params
		element
			the element to change. Can be text or a screen element
		color
			the color which should be set
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.SetElement = function (element, color)
{
	if(isString(element))
	{
		element = oScreenBuffer.Get(element);
	}

	element.style.color = color;
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.GetPrimary = function()
{
	return this.primary;
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.GetSecondary = function()
{
	return this.secondary;
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.GetTertiary = function()
{
	return this.tertiary;
}
/*--------------------------------------------------------------------------
	-	description
	-	params
			element_modify
				the element to which we'll add a border for
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.SetPrimaryBorder = function(element_modify)
{
	element_modify.style.border = "1px solid " + this.GetPrimary();		
	element_modify.style.padding = "3px";
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_colors.prototype.ClearElement = function(element)
{
	if(isString(element))
	{
		oScreenBuffer.Get(element).style.color = "";
		oScreenBuffer.Get(element).style.backgroundColor = "";
		oScreenBuffer.Get(element).colorSchemeB = "";
		oScreenBuffer.Get(element).colorSchemeF = "";
	}
	else
	{
		if(element)
		{
			element.style.color = "";
			element.style.backgroundColor = "";
			element.colorSchemeB = "";
			element.colorSchemeF = "";
		}
	}
}

var oSystem_Colors = new system_colors();