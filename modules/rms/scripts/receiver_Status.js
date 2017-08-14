/*
	The purpose of this file is to manage receiver statuses
*/
var oReceiverStatusList = new system_list("recStatus_ID", "recStatus_Name",  "statuslist");
oReceiverStatusList.serverURL = strReceiverStatusURL;


var oReceiver_Status = new system_AppScreen();

oReceiver_Status.screen_Name = "receiver_Status";				//	The name of the screen or page. Also the name of the XML data file
oReceiver_Status.screen_Menu = "Status";					//	The name of the menu item which corapsponds to this item
oReceiver_Status.module_Name = "rms";

oReceiver_Status.custom_Show = function()
{
	this.LoadLists();
	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oReceiver_Status.custom_Load = function()
{
	this.element_Submit = oScreenBuffer.Get("recStatus_Submit");
		
	/*
		Add screen elements
	*/
	this.element_AddName = oScreenBuffer.Get("recStatus_AddName");
	this.element_AddDescription = oScreenBuffer.Get("recStatus_AddDescription");
	
	/*
		Modify screen elements
	*/
	this.element_ModifyList = oScreenBuffer.Get("recStatus_ModifyList");
	this.element_ModifyName = oScreenBuffer.Get("recStatus_ModifyName");
	this.element_ModifyDescription = oScreenBuffer.Get("recStatus_ModifyDescription");
	
	/*
		Remove Data Type field names
	*/
	this.element_RemoveList = oScreenBuffer.Get("recStatus_RemoveList");

	/*
		Enable the submit button to call the organization with the screen
	*/
	
	this.element_Submit.onclick = function ()
	{
		oReceiver_Status.Submit(this.oScreen.focusedPage);
	};
	
	this.element_ModifyList.onchange = function ()
	{
		oReceiver_Status.UpdateModifyScreen();
	};
	
	this.UpdateModifyScreen();

	return true;

}
/*--------------------------------------------------------------------------
	-	description
			Loads the lists displaying the organizations
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_Status.LoadLists = function()
{
	oReceiverStatusList.load();
	oReceiverStatusList.fillControl(this.element_ModifyList, true);
	oReceiverStatusList.fillControl(this.element_RemoveList, true);
	this.enableModify(false);
}
/*
	Sumbits a request for an add, modify, or removal
	activePage is the page which currently has focus when
	the user clicks submit
*/
oReceiver_Status.Submit = function(activePage)
{
	switch(activePage)
	{
		case 0:
			this.AddSubmit();
			break;
		case 1:
			this.ModifySubmit();
			break;
		case 2:
			this.RemoveSubmit();
			break;
	}
}
/*
	Adds an organization to the database
*/
oReceiver_Status.AddSubmit = function()
{
	var serverValues = Object();
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	
	serverValues.name = this.element_AddName.value;
	serverValues.description = this.element_AddDescription.value;
	serverValues.location = strReceiverStatusURL;
	serverValues.action = "add";

	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	
	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		responseText = "false||No connection to the server.";
	}
	
	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		this.element_AddName.value = "";
		this.element_AddDescription.value = "";
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		this.LoadLists();
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}

	return true;
}
/*
	Modifies a reciever status and adds it to the database
*/
oReceiver_Status.ModifySubmit = function()
{
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
	*/
	if(this.element_ModifyList.value == "")
	{
		oCatenaApp.showNotice(notice_Error, "No receiver status selected.");
		return false;
	}
	
	/*
		Now we need to get the ID for the organization the user is changing
		so we can send that to the server since otherwise it will not
		know which org we're trying to change
	*/
	
	var arMod = oReceiverStatusList.get(this.element_ModifyList.value);
	
	/*
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	var serverValues = Object();
	
	serverValues.name = this.element_ModifyName.value;
	serverValues.description = this.element_ModifyDescription.value;
	serverValues.id = arMod.recStatus_ID;
	serverValues.location = strReceiverStatusURL;
	serverValues.action = "modify";
	
	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	var responseText = server.callSync(serverValues);
	var responseInfo = responseText.split("||");

	if(eval(responseInfo[0]))
	{
		this.element_ModifyName.value = "";
		this.element_ModifyDescription.value = "";
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		this.LoadLists();
		return true;
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	
	return true;
}
/*
	Updates the modify screen after the user selections an option to
	modify
*/
oReceiver_Status.UpdateModifyScreen = function()
{
	/*
		Get the requested department details and set the fields
	*/
	var arMod = oReceiverStatusList.get(this.element_ModifyList.value);

	if(arMod == null)
	{
		this.enableModify(false);
	}
	else
	{
		this.element_ModifyName.value =  arMod.recStatus_Name;
		this.element_ModifyDescription.value = arMod.recStatus_Description;
		this.enableModify(true);
	}
}
/*
	-	enableModify will disable or enable the modify screen elements.
	-	If no element is selected, then these elements should be disabled
	
	-	toggle
		Set to true to enable the elements
		Set to false to disable the elements
	-	Additionally setting toggle to false will clear the element values
*/
oReceiver_Status.enableModify = function(toggle)
{
	this.element_ModifyName.disabled = !toggle;
	this.element_ModifyDescription.disabled = !toggle;
	
	if(!toggle)
	{
		this.element_ModifyName.value = "";
		this.element_ModifyDescription.value = "";
	}
}
/*
	Removes an organization from the system
*/
oReceiver_Status.RemoveSubmit = function()
{
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
		ModifyShortName is the drop down list of the organizations we can modify
	*/
	strName = this.element_RemoveList.value;
	
	if(strName.length == 0)
	{
		oCatenaApp.showNotice(notice_Error, "Please select a receiver status to delete.");
		return false;
	}
	
	/*
		Query the user to make sure they really want to do this
	*/
	if(!window.confirm("Are you sure you want to remove " + strName + "?"))
	{
		return true;
	}
	
	var arMod = oReceiverStatusList.get(strName);
	/*
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	var serverValues = Object();
	
	serverValues.id = arMod.recStatus_ID;
	serverValues.location = strReceiverStatusURL;
	serverValues.action = "remove";

	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	var responseText = server.callSync(serverValues);
	var responseInfo = responseText.split("||");

	if(eval(responseInfo[0]))
	{
		this.LoadLists();
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		return true;
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	return true;
}

oReceiver_Status.register();
