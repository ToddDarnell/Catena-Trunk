/*
	This the global manager for the off screen elements.
	When navigating to a screen element, use this instead of the document
	object.
*/

var oScreenBuffer = new system_ElementManager();

function system_ElementManager()
{
	this.buffer = null;
}

system_ElementManager.prototype.load = function()
{
	this.buffer = document.createDocumentFragment();
}
/*
	Element is an on screen element's name, not a node or an object
*/
system_ElementManager.prototype.AddScreen = function(element)
{
	if(this.buffer.getElementById)
	{
		this.buffer.appendChild(document.getElementById(element));
	}
	else
	{
		document.getElementById("OffScreenPage").appendChild(document.getElementById(element));
	}
}
/*
	Element is an on screen element's name, not a node or an object
*/
system_ElementManager.prototype.Get = function(element)
{
	if(this.buffer)
	{
		if(this.buffer.getElementById)
		{
			if(this.buffer.getElementById(element))
			{
				return this.buffer.getElementById(element);
			}
		}
	}
	return document.getElementById(element);
}
/*
	Returns the root element for the off screen buffer
*/
system_ElementManager.prototype.GetRoot = function()
{
	if(this.buffer)
	{
		if(this.buffer.getElementById)
		{
			return this.buffer;
		}
	}
	
	return document.getElementById("OffScreenPage");
}
/*
	IsBuffer returns true if the off screen buffer is
	a stand alone element instead of part of the document
	object.
*/
system_ElementManager.prototype.IsBuffer = function()
{
	if(this.buffer)
	{
		if(this.buffer.getElementById)
		{
			return true;
		}
	}
	
	return false;
}