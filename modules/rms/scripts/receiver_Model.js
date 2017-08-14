/*
	The purpose of this file is to manage all of the receiver model related functionality.
*/
var oReceiverModelList = new system_list("recModel_ID", "recModel_Name",  "modellist");
oReceiverModelList.serverURL = strReceiverModelURL;

var oReceiver_Model = new system_AppScreen();

oReceiver_Model.screen_Name = "receiver_Model";	//	The name of the screen or page. Also the name of the XML data file
oReceiver_Model.screen_Menu = "Models";			//	The name of the menu item which corapsponds to this item
oReceiver_Model.module_Name = "rms";


oReceiver_Model.custom_Show = function()
{
	this.LoadLists();
	return true;
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_Model.custom_Load = function()
{
	
	/*
		Add screen elements
	*/
	this.element_AddName = oScreenBuffer.Get("receiverModel_AddName");
	this.element_AddDescription = oScreenBuffer.Get("receiverModel_AddDescription");

	/*
		Modify screen elements
	*/
	
	this.element_ModifyList = oScreenBuffer.Get("receiverModel_ModifyList");
	this.element_ModifyName = oScreenBuffer.Get("receiverModel_ModifyName");
	this.element_ModifyDescription = oScreenBuffer.Get("receiverModel_ModifyDescription");

	/*
		Remove Data Type field names
	*/
	this.element_RemoveList = oScreenBuffer.Get("receiverModel_RemoveList");

	this.element_Submit = oScreenBuffer.Get("receiverModel_Submit");	//	The submit element name

	/*
		Enable the submit button to call the organization with the screen
	*/
	
	this.element_Submit.onclick = function ()
	{
		oReceiver_Model.Submit(this.oScreen.focusedPage);
	};
	
	/*
		This controls the modify list drop down box used to select
		an organization to modify
	*/

	this.element_ModifyList.onchange = function ()
	{
		oReceiver_Model.UpdateModifyScreen();
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
oReceiver_Model.LoadLists = function()
{
	oReceiverModelList.load();
	
	oReceiverModelList.fillControl(this.element_ModifyList, true);
	oReceiverModelList.fillControl(this.element_RemoveList, true);
	this.enableModify(false);
}
/*
	Sumbits a request for an add, modify, or removal
	activePage is the page which currently has focus when
	the user clicks submit
*/
oReceiver_Model.Submit = function(activePage)
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
oReceiver_Model.AddSubmit = function()
{
	var serverValues = new Object();
	/*
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	
	serverValues.name = this.element_AddName.value;
	serverValues.description = this.element_AddDescription.value;
	serverValues.location = strReceiverModelURL;
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
	Modifies an organization and adds it to the database
*/
oReceiver_Model.ModifySubmit = function()
{
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
	*/
	if(this.element_ModifyList.value == "")
	{
		oCatenaApp.showNotice(notice_Error, "No model selected.");
		return false;
	}
	
	/*
		Now we need to get the ID for the organization the user is changing
		so we can send that to the server since otherwise it will not
		know which org we're trying to change
	*/
	
	var thisModel = oReceiverModelList.get(this.element_ModifyList.value);
	
	var serverValues = Object();
	
	serverValues.name = this.element_ModifyName.value;
	serverValues.description = this.element_ModifyDescription.value;
	serverValues.id = thisModel.recModel_ID;
	serverValues.location = strReceiverModelURL;
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
oReceiver_Model.UpdateModifyScreen = function()
{
	/*
		Get the requested department details and set the fields
	*/

	var thisModel = oReceiverModelList.get(this.element_ModifyList.value);

	if(thisModel == null)
	{
		this.enableModify(false);
	}
	else
	{
		this.element_ModifyName.value = thisModel.recModel_Name;
		this.element_ModifyDescription.value = thisModel.recModel_Description;
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
oReceiver_Model.enableModify = function(toggle)
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
oReceiver_Model.RemoveSubmit = function()
{
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
		ModifyShortName is the drop down list of the organizations we can modify
	*/

	if(this.element_RemoveList.value == "")
	{
		oCatenaApp.showNotice(notice_Error, "Please select a model to delete.");
		return false;
	}
	
	/*
		Query the user to make sure they really want to do this
	*/
	if(!window.confirm("Are you sure you want to remove " + this.element_RemoveList.value + "?"))
	{
		return true;
	}

	var thisModel = oReceiverModelList.get(this.element_RemoveList.value);

	/*
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	var serverValues = Object();
	
	serverValues.id = thisModel.recModel_ID;
	serverValues.action = "remove";
	serverValues.location = strReceiverModelURL;

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

oReceiver_Model.register();
