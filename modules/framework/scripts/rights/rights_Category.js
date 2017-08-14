/*
	The purpose of this file is to manage right categories within Catena.
	
	Every right has a category assigned to it. This category makes
	displaying and filtering rights easier when a large number of rights
	are availabel within the system, and removes the need to name the rights
	based upon what group they're in.
*/
var oRightCategoryList = new system_list("rightCat_ID", "rightCat_Name", "rightCategory");
oRightCategoryList.serverURL =  strListURL;

/*
	Performs admin functionality for right categories
*/
var oRightCategoryAdmin = new system_AppScreen();

oRightCategoryAdmin.strSubmitButton = "rightCategorySubmit";		//	The submit element name
oRightCategoryAdmin.screen_Name = "rightCategory";				//	The name of the screen or page. Also the name of the XML data file
oRightCategoryAdmin.screen_Menu = "Rights Categories";				//	The name of the screen or page. Also the name of the XML data file
oRightCategoryAdmin.module_Name = "framework";

/*
	Add screen elements
*/
oRightCategoryAdmin.strField_AddName = "rightCategoryAddName";
oRightCategoryAdmin.strField_AddDescription = "rightCategoryAddDescription";

/*
	Modify screen elements
*/

oRightCategoryAdmin.strField_ModifyList="rightCategoryModifyList";		//	The modify list element which picks an item to edit
oRightCategoryAdmin.strField_ModifyName="rightCategoryModifyName";
oRightCategoryAdmin.strField_ModifyDescription="rightCategoryModifyDescription";

/*
	Remove Data Type field names
*/
oRightCategoryAdmin.strField_RemoveList="rightCategoryRemoveList";

oRightCategoryAdmin.custom_Show = function()
{
	this.LoadLists();
	this.clearFields();
	return true;
}
oRightCategoryAdmin.LoadLists = function()
{
	oRightCategoryList.load();
	oRightCategoryList.fillControl(this.strField_ModifyList, true);			
	oRightCategoryList.fillControl(this.strField_RemoveList, true);
	this.enableModify(false);
}
oRightCategoryAdmin.clearFields = function()
{
	oScreenBuffer.Get(this.strField_AddName).value = "";
	oScreenBuffer.Get(this.strField_AddDescription).value = "";
	oScreenBuffer.Get(this.strField_ModifyList).value = "";
	oScreenBuffer.Get(this.strField_ModifyName).value = "";
	oScreenBuffer.Get(this.strField_ModifyDescription).value = "";
	oScreenBuffer.Get(this.strField_RemoveList).value = "";
	
}
oRightCategoryAdmin.GetListItem = function(listItem)
{
	return oRightCategoryList.get(listItem);
}
oRightCategoryAdmin.custom_Load = function()
{
	/*
		Enable the submit button to call the organization with the screen
	*/
	
	oScreenBuffer.Get(this.strSubmitButton).onclick = function ()
	{
		oRightCategoryAdmin.Submit(this.oScreen.focusedPage);
	};
	
	/*
		This controls the modify list drop down box used to select
		an organization to modify
	*/
	
	oScreenBuffer.Get(this.strField_ModifyList).onchange = function ()
	{
		oRightCategoryAdmin.UpdateModifyScreen();
	};
	
	this.enableModify(false);

	return true;
}
/*
	Sumbits a request for an add, modify, or removal
	activePage is the page which currently has focus when
	the user clicks submit
*/
oRightCategoryAdmin.Submit = function(activePage)
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
oRightCategoryAdmin.AddSubmit = function()
{
	var serverValues = Object();
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
	*/
	var name = oScreenBuffer.Get(this.strField_AddName);
	var description = oScreenBuffer.Get(this.strField_AddDescription);

	serverValues.name = name.value;
	serverValues.description = description.value;
	serverValues.location = strRightCategoryURL;
	serverValues.action = "add";
	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/

	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		alert("Invalid response text");
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
	Modifies an organization and adds it to the database
*/
oRightCategoryAdmin.ModifySubmit = function()
{
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
	*/
	var modifyList = oScreenBuffer.Get(this.strField_ModifyList);
	var name = oScreenBuffer.Get(this.strField_ModifyName);
	var description = oScreenBuffer.Get(this.strField_ModifyDescription);

	/*
		Now we need to get the ID for the organization the user is changing
		so we can send that to the server since otherwise it will not
		know which org we're trying to change
	*/
	if(!modifyList.value.length)
	{
		oCatenaApp.showNotice(notice_Error, "Select an item to modify before submitting changes.");
		return false;
	}

	var modifyRecordId = this.GetListItem(modifyList.value);
	var serverValues = Object();
	
	serverValues.name = name.value;
	serverValues.description = description.value;
	serverValues.id = modifyRecordId.rightCat_ID;
	serverValues.location = strRightCategoryURL;
	serverValues.action = "modify";
	
	
	/*
		Contact the server with our request. wait for the response and
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
		this.clearFields();
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
oRightCategoryAdmin.UpdateModifyScreen = function()
{
	/*
		Get the requested department details and set the fields
	*/
	var modifyValue = oScreenBuffer.Get(this.strField_ModifyList).value;			//	The list element which contains the ids of the elements we can modify
	
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
			If we did not find a matching record
		*/
		this.enableModify(false);
	}
	else
	{
		/*
			We found a record so fill in the fields
		*/
		name.value = modifyRecord.rightCat_Name;
		description.value = modifyRecord.rightCat_Description;
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
oRightCategoryAdmin.enableModify = function(toggle)
{
	var name = oScreenBuffer.Get(this.strField_ModifyName);			//	Our fields which will be updated with the record detail
	var description = oScreenBuffer.Get(this.strField_ModifyDescription);			//	Our fields which will be updated with the record detail
	
	name.disabled = !toggle;
	description.disabled = !toggle;
	
	if(!toggle)
	{
		name.value = "";
		description.value = "";
	}
		
}
/*
	Removes an organization from the system
*/
oRightCategoryAdmin.RemoveSubmit = function()
{
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
		ModifyShortName is the drop down list of the organizations we can modify
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
	
	serverValues.id = removeRecord.rightCat_ID;
	serverValues.action = "remove";
	serverValues.location=strRightCategoryURL;

	/*
		Contact the server with our request. wait for the response and
		then display it to the user.
		If we don't receive a message back from the server
		populate it with a default message
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
		this.UpdateModifyScreen();
		return true;
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);

		return false;
	}
	return true;
}

oRightCategoryAdmin.register();