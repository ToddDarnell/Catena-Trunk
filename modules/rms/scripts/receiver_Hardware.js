/*
	purpose:
		Assign rights to users via a GUI.
	Performs admin functionality for document types
*/
var oReceiver_Hardware = new system_AppScreen();

oReceiver_Hardware.screen_Name = "receiver_Hardware";	//	The name of the screen or page. Also the name of the XML data file
oReceiver_Hardware.screen_Menu = "Hardware";			//	The name of the menu item which corapsponds to this item
oReceiver_Hardware.module_Name = "rms";

/*--------------------------------------------------------------------------
	-	description  
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_Hardware.custom_Show = function()
{
	oReceiverModelList.load();
	
	oReceiverModelList.fillControl(this.element_ModelList, true);
	this.SelectModel("");
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Loads the rights table, sets the submit functionality.
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_Hardware.custom_Load = function()
{
	
	///	Create the results table
	this.oHardwareTable = new system_SortTable();
	this.oHardwareTable.setName("receiverHardware_HardwareTable");

	this.element_ModelList = oScreenBuffer.Get("receiverHardware_ModelList");
	this.element_HardwareBox = oScreenBuffer.Get("receiverHardware_Box");
	this.element_AddHardware = oScreenBuffer.Get("receiverHardware_Submit");
	this.element_AddHardwareEdit = oScreenBuffer.Get("receiverHardware_AddHardware");

	this.element_ModelList.onchange = function ()
	{
		oReceiver_Hardware.SelectModel(this.value);
	}

	this.element_AddHardware.onclick = function ()
	{
		oReceiver_Hardware.AssignModel(this.value);
	}

	/*
		Now set up the defaults
	*/
	
	HideElement(this.element_HardwareBox);

	/*
		Fill the header table for the hardware details.
	*/
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Hardware";
		arHeader[0].width = "70%";
	arHeader[1] = Object();
		arHeader[1].text = "Action";
		arHeader[1].width = "8%";
		
	this.oHardwareTable.SetHeader(arHeader);
	this.oHardwareTable.SetCaption("Assigned Hardware");
	
	/*
		Fill out the custom display function for
		the assigned rights
	*/
		
	this.oHardwareTable.custom_display = function()
	{
		for(var i = 0; i < this.list.length; i++)
		{
			var element_Row = document.createElement("TR");
			this.element_body.appendChild(element_Row);
	
			oSystem_Colors.SetPrimary(element_Row);
			
			if(i % 2 == 1)
			{
				oSystem_Colors.SetSecondaryBackground(element_Row);
			}
			else
			{
				oSystem_Colors.SetTertiaryBackground(element_Row);
			}
				
			var element_Col1 = document.createElement("TD");
			element_Row.appendChild(element_Col1);
			
			element_Col1.title = this.list[i]["hw_Code"];
			
			/*
				The first column. Set the text for the element
			*/
			screen_SetTextElement(element_Col1, this.list[i]["hw_Code"]);
				
			/*
				Create the delete element if it's needed
			*/
			
			var element_Col2 = document.createElement("TD");
			element_Col2.align="center";

			element_Row.appendChild(element_Col2);
			element_DeleteLink = document.createElement("SPAN");
			element_DeleteLink.hw_id = this.list[i]["hw_ID"];
			element_DeleteLink.className = "link";
			element_DeleteLink.title = "Remove this right";
			element_DeleteLink.style.vAlign="top";
			element_Col2.appendChild(element_DeleteLink);

			element_ColDelete = document.createElement("IMG");
			element_ColDelete.className = "link";
			element_ColDelete.src = "../image/b_drop.gif";
			element_DeleteLink.appendChild(element_ColDelete);
			
			element_DeleteLink.onclick = function()
			{
				oReceiver_Hardware.RemoveHardware(this.hw_id);
			}
		}
	}

	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Retrieve the rights from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_Hardware.RetrieveHardware = function(selected_Name)
{
	this.serverValues = null;
	this.serverValues = new Object();
	
	this.serverValues.model = selected_Name;
	this.serverValues.location = strReceiverModelURL;
	this.serverValues.action = "getHardwareModels";

	responseText = server.callASync(this.serverValues, ReceiverHardwareParse);

	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Needed for the function call wrapper called in RetreiveRights
	-	params
	-	return
--------------------------------------------------------------------------*/
function ReceiverHardwareParse(strResults)
{
	oReceiver_Hardware.ParseHardware(strResults);
}
/*--------------------------------------------------------------------------
	-	description
		Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_Hardware.ParseHardware = function(strResults)
{
	this.oHardwareTable.SetList(strResults);
	this.oHardwareTable.Display();
}

/*
	Assigns a hardware type to a receiver model.
*/
oReceiver_Hardware.AssignModel = function ()
{
	var serverValues = Object();
	
	serverValues.model = this.element_ModelList.value;
	serverValues.hardware = this.element_AddHardwareEdit.value;
	serverValues.location = strReceiverModelURL;
	serverValues.action = "addhardware";

	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	
	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		responseText = "false||Error communicating with the server.";
	}

	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	
	this.SelectModel(this.element_ModelList.value);

	return true;
}
/*
	RemoveRight
	-	pass to the server the assigned right id
*/
oReceiver_Hardware.RemoveHardware = function (assigned_Id)
{
	var serverValues = Object();
	serverValues.hardwareId = assigned_Id;
	serverValues.location = strReceiverModelURL;
	serverValues.action = "removehardware";
	
	if(!confirm("Are you sure you wish to remove this hardware id?"))
	{
		return;
	}

	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	
	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		responseText = "false||Error communicating with the server.";
	}

	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	
	this.SelectModel(this.element_ModelList.value);

	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Filter Organizaton takes the value from the	organization
			field and filters the user names by that organization
	-	params
			userName
				the name of the user account being selected to have
				its rights assigned
	-	return
			none
--------------------------------------------------------------------------*/
oReceiver_Hardware.SelectModel = function(modelName)
{
	
	/*
		-	tell the user which user account they selected
			via the text box to the right of the user name drop down list
		-	Populate the individual rights fields with the accounts
			assigned and available rights.
	*/
	
	if(modelName)
	{
		selected_record = oReceiverModelList.get(modelName);
		ShowInheritElement(this.element_HardwareBox);
		
		this.RetrieveHardware(modelName);
		this.oHardwareTable.show();
		this.selectedModel = modelName;
	}
	else
	{
		HideElement(this.element_HardwareBox);
		this.oHardwareTable.clear();
		this.selectedModel = "";
	}
	
	this.element_AddHardwareEdit.value = "";

}

oReceiver_Hardware.register();