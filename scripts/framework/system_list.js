/*
	functionality to keep track of a rights Group

	The following items need to be performed to properly add a new list type to the system.
		-	rename the list to identify the type of data being listed
		-	change nameField to the name of the field which holds the items name
		-	change the xmlRecord value to the name of the individual records returned by the server.
		-	change the name of the record class passed in as the third value in ParseXML
		-	add the list name to the load function in catenaApp.js
		-	add this js file to the forms.home.php file

	-	field_Name
			The name of the field as indicated in the database.
			For example:
					doc_ID is the field_Id while doc_Name is the 'name' field.
					The name field is usually the human readable name for this table
	-	field_Id
			The database assigned id of the record
	-	listName
			The list name we're retrieving from the server.
			This is the 'action' value of the command, however
			it's normally the name of the list.
*/
function system_list(field_Id, field_Name, listName)
{
	this.list = new Array();				//	the list containing the actual data
	this.element_Name = "";					//	No default select element
	this.field_Name = field_Name;			//	The name of the field we'll use to keep track of the on screen display of this list
	this.field_Value = field_Name;			//	The default value is to have the "value" of the field contain the
											//	same data as is displayed.
	this.field_Id = field_Id;				//	The name of the field we'll use to keep track of the on screen display of this list
	this.field_ToolTip = "";				//	Default no tool tip field selected
	this.xmlRecord = "element";				//	in the xml file the individual records are broken up by this tag. 
	this.serverURL = "";			//	The url called to retrieve the data from the server
	this.listName = listName;				//	The list name we're gathering from the server
	this.bAddBlank = false;					//	Whether to add a blank to the list when displaying it

	this.bSort = true;						//	Sort the list by default
	this.bClearParams = true;				//	Should the params list be cleared after the list was loaded?
	this.defaultValue = null;				//	Whatever element has this value is set the focus
	this.defaultPosition = -1;				//	The default position has focus. Can't use in conjuction with 
											//	defaultValue
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_list.prototype.getSize = function ()
{

	if(this.list)
	{
		return this.list.length;
	}
	
	return 0;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_list.prototype.sort = function ()
{
	if(this.field_Name)
	{
		sort(this.list, sortString, this.field_Name);
	}
}
/*--------------------------------------------------------------------------
	-	description
		Clear the param list
		The param list is sent to the server when the object is loaded
	-	params
			none
	-	return
			none
--------------------------------------------------------------------------*/
system_list.prototype.clearParams = function ()
{
	this.params = null;
}
/*--------------------------------------------------------------------------
	-	description
			This function adds a param to the list of params
			for the object when it sends the server list to the server
	-	params
	-	return
--------------------------------------------------------------------------*/
system_list.prototype.addParam = function (param_name, param_value)
{
	if(!this.params)
	{
		this.params = new Object();
	}

	this.params[param_name] = param_value;
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_list.prototype.clear = function()
{

	if(this.list)
	{
		this.list = null;
	}

	this.list = new Array();
}
/*--------------------------------------------------------------------------
	-	description
			Requests all of the elements from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
system_list.prototype.load = function()
{
	if(this.serverURL.length < 1)
	{
		oSystem_Debug.warning("No list name defined for : " + this.field_Name);
		return;
	}
	
	var serverValues = null;
	var xmlObject;
	
	if(this.params)
	{
		serverValues = this.params;
	}
	else
	{
		serverValues = Object();
	}
	
	serverValues.location = this.serverURL;
	
	if(this.listName)
	{
		serverValues.action = this.listName;
	}
	
	xmlObject = server.CreateXMLSync(serverValues);
	this.list = null;
	this.list = ParseXML(xmlObject, this.xmlRecord, Object);

	if(this.bSort == true)
	{
		this.sort();
	}
	
	if(this.bParams == true)
	{
		this.clearParams();
	}
}
/*--------------------------------------------------------------------------
	-	description
			Requests all of the elements from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
system_list.prototype.loadAsync = function(fnCallBack)
{
	var serverValues = null;
	var xmlObject;
	
	if(this.params)
	{
		serverValues = this.params;
	}
	else
	{
		serverValues = Object();
	}
	
	serverValues.location = this.serverURL;
	
	if(this.listName)
	{
		serverValues.action = this.listName;
	}
	
	xmlObject = server.callASyncObject(serverValues, this);
		
	if(this.bParams == true)
	{
		this.clearParams();
	}
	
	this.fnCallBack = fnCallBack;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_list.prototype.Parse = function( strResults)
{
	this.list = null;
	oxmlData = server.CreateXML(strResults);
	
	this.list = ParseXML(oxmlData, this.xmlRecord, Object);

	if(this.bSort == true)
	{
		this.sort();
	}

	if(this.fnCallBack)
	{
		this.fnCallBack();
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_list.prototype.fillControl = function( element_name, bAddBlank, defaultPostion)
{
	this.element_name = element_name;
	this.defaultPosition = defaultPostion;
	this.bAddBlank = bAddBlank;
	
	this.fillSelect();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_list.prototype.fillSelect = function()
{
	if(!this.list)
	{
		return false;
	}
	
	if(!this.element_name)
	{
		oSystem_Debug.warning("Control not found in fill select.");
		return;
	}

	element_select = this.element_name;

	if (isString(element_select))
	{
		element_select = oScreenBuffer.Get(element_select);
	}
	
	RemoveChildren(element_select);

	if(this.bAddBlank == true)
	{
		element_select.appendChild(document.createElement("OPTION"));
	}
	
	for(var iElement=0; iElement < this.list.length; iElement++)
	{
		element_option = document.createElement("OPTION");
		
		if(this.field_Name)
		{
			element_option.innerHTML = this.list[iElement][this.field_Name];
			element_option.value = this.list[iElement][this.field_Value];
		}
		else
		{
			element_option.value = this.list[iElement];
			element_option.innerHTML = this.list[iElement];
		}
		
		if(iElement == this.defaultPosition)
		{
			element_option.selected = true;
		}

		oSystem_Debug.notice(" <load list> element value: " + element_option.value);
		
		if(element_option.value == this.defaultValue)
		{
			element_option.selected = true;
		}

		element_select.appendChild(element_option);
		
		if(this.field_ToolTip.length > 0)
		{
			element_option.title = this.list[iElement][this.field_ToolTip];
		}
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
		The record associated with that position.
*/
//--------------------------------------------------------------------------
system_list.prototype.getFromPosition = function(position)
{
	if(!this.list)
	{
		return null;
	}
	
	if(this.list[position])
	{
		return this.list[position];
	}

	return null;
}

/*--------------------------------------------------------------------------
	-	description
		Return the id's position in the list
	-	params
	-	return
--------------------------------------------------------------------------*/
system_list.prototype.GetPosition = function(id)
{
	if(!this.list)
	{
		return -1;
	}
	for(iElement=0; iElement < this.list.length; iElement++)
	{
		if(this.list[iElement][this.field_Id] == id)
		{
			return iElement;
		}
	}

	return -1;
}
/*--------------------------------------------------------------------------
	-	description
			Returns the record with this text in the name field
	-	params
			strName
				The name of the element.
	-	return
			The record associated with this name.
--------------------------------------------------------------------------*/
system_list.prototype.get = function(strName)
{
	if(!this.list)
	{
		return null;
	}
	for(iElement=0; iElement < this.list.length; iElement++)
	{
		if(this.list[iElement][this.field_Name] == strName)
		{
			return this.list[iElement];
		}
	}
	
	return null;
}
/*--------------------------------------------------------------------------
	-	description
			Retrieve an entire record
	-	params
		id
			The id of the record we're searching for
	-	return
			The entire record connected with this id
--------------------------------------------------------------------------*/
system_list.prototype.getFromId = function(id)
{
	if(!this.list)
	{
		return null;
	}
	for(var iElement=0; iElement < this.list.length; iElement++)
	{
		if(this.list[iElement][this.field_Id] == id)
		{
			return this.list[iElement];
		}
	}
	return null;
}
//--------------------------------------------------------------------------
/**
	\brief
		Returns the record with this text in the name field
	\param
	\return
*/
//--------------------------------------------------------------------------
system_list.prototype.getName = function(id)
{
	if(!this.list)
	{
		return "";
	}
	for(var iElement=0; iElement < this.list.length; iElement++)
	{
		if(this.list[iElement][this.field_Id] == id)
		{
			return this.list[iElement][this.field_Name];
		}
	}
	return "";
}
//--------------------------------------------------------------------------
/**
	\brief
		Returns the record id which matches this text
	\param
	\return
*/
//--------------------------------------------------------------------------
system_list.prototype.getId = function(strName)
{
	if(!this.list)
	{
		return -1;
    }
	for(var iElement=0; iElement < this.list.length; iElement++)
	{
		if(this.list[iElement][this.field_Name] == strName)
		{
			return this.list[iElement][this.field_Id];
		}
	}
	return -1;
}
/*
	Adds an element to the list by hand
	id is the id of the record
	name is the name associated with this id
	value is the value of the list element when used
		in an HTML control
		
*/
system_list.prototype.addElement = function(id, name, value)
{
	if(this.list)
	{
        iElement = this.list.length;
	}
	else
	{
		iElement = 0;
	}
	
	this.list[iElement] = new Object();
	this.list[iElement][this.field_Name] = name;
	this.list[iElement][this.field_Id] = id;
	
	if(this.field_Value)
	{
		if(value != undefined)
		{
			this.list[iElement][this.field_Value] = value;
		}
		else
		{
			this.list[iElement][this.field_Value] = name;
		}
	}
}