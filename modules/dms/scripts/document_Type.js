/*
	The purpose of this file is to manage document types
*/
var strDocumentTypeURL = "/modules/dms/server/document_type";

var oDocumentTypeList = new system_list("docType_ID", "docType_Name", "getlist");

oDocumentTypeList.serverURL = strDocumentTypeURL;
oDocumentTypeList.field_ToolTip = "docType_Description";

/*
	Performs admin functionality for document types
*/
var oDocumentTypeAdmin = new system_AppScreen();

oDocumentTypeAdmin.strSubmitButton = "documentTypeSubmit";		//	The submit element name
oDocumentTypeAdmin.screen_Name = "document_Type";				//	The name of the screen or page. Also the name of the XML data file
oDocumentTypeAdmin.screen_Menu = "Document Types";				//	The name of the screen or page. Also the name of the XML data file
oDocumentTypeAdmin.module_Name = "dms";

/*
	Add screen elements
*/
oDocumentTypeAdmin.strField_AddName = "DocumentTypeAddName";
oDocumentTypeAdmin.strField_AddDescription = "DocumentTypeAddDescription";
/*
	Modify screen elements
*/
oDocumentTypeAdmin.strField_ModifyList = "documentTypeModifyList";		//	The modify list element which picks an item to edit
oDocumentTypeAdmin.strField_ModifyName = "DocumentTypeModifyName";
oDocumentTypeAdmin.strField_ModifyDescription = "DocumentTypeModifyDescription";
oDocumentTypeAdmin.strMenuItemName = "Document Types";			//	The name of the menu item which corapsponds to this item
/*
	Remove Data Type field names
*/
oDocumentTypeAdmin.strField_RemoveList = "DocumentTypeRemoveList";

oDocumentTypeAdmin.custom_Show = function()
{
	this.UpdateModifyScreen();
	this.LoadLists();
	return true;
}
oDocumentTypeAdmin.LoadLists = function()
{
	oDocumentTypeList.load();
	oDocumentTypeList.fillControl(this.strField_ModifyList, true);			
	oDocumentTypeList.fillControl(this.strField_RemoveList, true);
}
oDocumentTypeAdmin.GetListItem = function(listItem)
{
	return oDocumentTypeList.get(listItem);
}
oDocumentTypeAdmin.custom_Load = function()
{
	/*
		Enable the submit button to call the organization with the screen
	*/
	oScreenBuffer.Get(this.strSubmitButton).onclick = function ()
	{
		oDocumentTypeAdmin.Submit(this.oScreen.focusedPage);
	};
	
	/*
		This controls the modify list drop down box used to select
		an organization to modify
	*/
	oScreenBuffer.Get(this.strField_ModifyList).onchange = function ()
	{
		oDocumentTypeAdmin.UpdateModifyScreen();
	};

	return true;
}
/*
	Sumbits a request for an add, modify, or removal
	activePage is the page which currently has focus when
	the user clicks submit
*/
oDocumentTypeAdmin.Submit = function(activePage)
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
	Adds a document type to the database
*/
oDocumentTypeAdmin.AddSubmit = function()
{
	var serverValues = Object();
	/*
		We have to verify that the fields are valid.
		Then we'll send it off to the server
	*/
	var name = oScreenBuffer.Get(this.strField_AddName);
	var description = oScreenBuffer.Get(this.strField_AddDescription);
	
	/*
		We have to encode it to work properly across the web.
		Spaces and such can create problems.
	*/
	serverValues.name = name.value;
	serverValues.description = description.value;
	serverValues.location = strDocumentTypeURL;
	serverValues.action = "add";

	/*
		Contact the server with our request. wait for the response and
		then display it to the user.
	*/
	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		responseText = "false||Error communicating with the server.";
	}

	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		name.value = "";
		description.value = "";
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
	Modifies a document type and adds it to the database
*/
oDocumentTypeAdmin.ModifySubmit = function()
{
	/*
		We have to verify that the fields are valid.
		Then we'll send it off to the server.
	*/
	var modifyList = oScreenBuffer.Get(this.strField_ModifyList);
	var name = oScreenBuffer.Get(this.strField_ModifyName);
	var description = oScreenBuffer.Get(this.strField_ModifyDescription);

	if(!modifyList.value.length)
	{
		oCatenaApp.showNotice(notice_Error, "Select an item to modify before submitting changes.");
		return false;
	}


	/*
		Now we need to get the ID for the document type ID the user is changing
		so we can send that to the server since otherwise it will not
		know which document type is being changed.
	*/
	var modifyRecordId = this.GetListItem(modifyList.value);
	var serverValues = Object();
	
	serverValues.name = name.value;
	serverValues.description = description.value;
	serverValues.id = modifyRecordId.docType_ID;
	serverValues.location = strDocumentTypeURL;
	serverValues.action = "modify";
	
	/*
		Contact the server with our request. Wait for the response and
		then display it to the user.
	*/
	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		responseText = "false||Error communicating with the server.";
	}
	
	var responseInfo = responseText.split("||");

	if(eval(responseInfo[0]))
	{
		name.value = "";
		description.value = "";
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
oDocumentTypeAdmin.UpdateModifyScreen = function()
{
	/*
		Get the requested department details and set the fields
	*/
	var modifyValue = oScreenBuffer.Get(this.strField_ModifyList).value;			//	The list element which contains the IDs of the elements we can modify
	
	/*
		This area should contain the fields specific to the data processing type
	*/
	var name = oScreenBuffer.Get(this.strField_ModifyName);			//	Our fields which will be updated with the record detail
	var description = oScreenBuffer.Get(this.strField_ModifyDescription);			//	Our fields which will be updated with the record detail

	/*
		Should not have to change this function call
	*/
	var modifyRecord = this.GetListItem(modifyValue);		//	a record containing all the details of the element which was
															//	selected in the modifyList drop down
	if(modifyRecord == null)
	{
		/*
			If a matching record was not found.
		*/
		name.value = "";
		description.value = "";
		name.disabled = true;
		description.disabled = true;
	}
	else
	{
		/*
			Record found, so fill in the fields.
		*/
		name.value = modifyRecord.docType_Name;
		description.value = modifyRecord.docType_Description;
		name.disabled = false;
		description.disabled = false;
	}
}
/*
	Removes a document type from the system
*/
oDocumentTypeAdmin.RemoveSubmit = function()
{
	/*
		We have to verify that the fields are valid.
		Then we'll send it off to the server.
	*/
	var removeName = oScreenBuffer.Get(this.strField_RemoveList).value;

	if(removeName == "")
	{
		oCatenaApp.showNotice(notice_Error, "Please select an element to remove.");
		return false;
	}
	
	/*
		Query the user to make sure they really want to do this
	*/
	if(!window.confirm("Are you sure you want to remove " + removeName + "?"))
	{
		return true;
	}

	var removeRecord = this.GetListItem(removeName);

	/*
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	var serverValues = Object();
	
	serverValues.id = removeRecord.docType_ID;
	serverValues.action = "remove";
	serverValues.location=strDocumentTypeURL;

	/*
		Contact the server with our request. Wait for the response and
		then display it to the user.
		If we don't receive a message back from the server
		populate it with a default message.
	*/
	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		responseText = "false||Error communicating with the server.";
	}
	
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

oDocumentTypeAdmin.register();