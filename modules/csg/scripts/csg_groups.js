/*
	The purpose of this file is to manage all of the CSG group admin screen functionality

	-	oCSG_GroupList
  		-	the list of csg groups this user may modify or remove
*/

oSystem_Debug.notice("Loading csg_groups");

include_once("../modules/csg/scripts/csg_common.js");

var oCSG_Groups = new system_AppScreen();

oCSG_Groups.oCSG_GroupList = new system_list("group_ID", "group_Name", "getassignedgroups");
oCSG_Groups.oCSG_GroupList.serverURL = strCSG_URL;


oCSG_Groups.screen_Name = "csg_groups";				//	The name of the screen or page. Also the name of the XML data file
oCSG_Groups.screen_Menu = "CSG Groups";					//	The name of the menu item which corapsponds to this item
oCSG_Groups.module_Name = "csg";

oCSG_Groups.strSubmitButton = "csggroup_Submit";		//	The submit element name

/*
	Add screen elements
*/
oCSG_Groups.strField_AddName = "csggroup_AddName";
oCSG_Groups.strField_AddDescription = "csggroup_AddDescription";
oCSG_Groups.strField_AddOwningOrg = "csggroup_AddOwner";

/*
	Modify screen elements
*/

oCSG_Groups.strField_ModifyList = "csggroup_ModifyList";		//	The modify list element which picks an item to edit
oCSG_Groups.strField_ModifyName="csggroup_ModifyName";
oCSG_Groups.strField_ModifyDescription="csggroup_ModifyDescription";
oCSG_Groups.strField_ModifyOwner="csggroup_ModifyOwner";
/*
	Remove Data Type field names
*/
oCSG_Groups.strField_RemoveList="csggroup_RemoveList";

/*
	-	Set up some custom functions for the list objects
*/
oCSG_Groups.custom_Show = function()
{
	this.LoadLists();
	return true;
}
oCSG_Groups.custom_Load = function()
{
	/*
		Enable the submit button to call the organization with the screen
	*/
	
	oScreenBuffer.Get(this.strSubmitButton).onclick = function ()
	{
		oCSG_Groups.Submit(this.oScreen.focusedPage);
	};
	
	/*
		This controls the modify list drop down box used to select
		an organization to modify
	*/

	oScreenBuffer.Get(this.strField_ModifyList).onchange = function ()
	{
		oCSG_Groups.UpdateModifyScreen();
	};
	
	this.UpdateModifyScreen();

	return true;

}
/*
	Loads the lists displaying the organizations
*/
oCSG_Groups.LoadLists = function()
{
	oRights.fillOrgControl(oRights.CSG_Admin, this.strField_AddOwningOrg);
	oRights.fillOrgControl(oRights.CSG_Admin, this.strField_ModifyOwner);

	this.oCSG_GroupList.addParam('right', oRights.CSG_Admin);
	this.oCSG_GroupList.load();
	this.oCSG_GroupList.fillControl(this.strField_ModifyList, true);
	this.oCSG_GroupList.fillControl(this.strField_RemoveList, true);

	this.enableModify(false);	
}
/*
	Sumbits a request for an add, modify, or removal
	activePage is the page which currently has focus when
	the user clicks submit
*/
oCSG_Groups.Submit = function(activePage)
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
oCSG_Groups.AddSubmit = function()
{
	var serverValues = Object();
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
	*/
	var element_Name = oScreenBuffer.Get(this.strField_AddName);
	var element_Description = oScreenBuffer.Get(this.strField_AddDescription);
	var parent = oScreenBuffer.Get(this.strField_AddOwningOrg);
	
	/*
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	
	serverValues.name = element_Name.value;
	serverValues.description = element_Description.value;
	serverValues.owner = parent.value;
	serverValues.location = strCSG_URL;
	serverValues.action = "addgroup";

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
		element_Name.value = "";
		element_Description.value = "";
		parent.value = "";

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
oCSG_Groups.ModifySubmit = function()
{
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
	*/
	var element_modList = oScreenBuffer.Get(this.strField_ModifyList);
	var element_name = oScreenBuffer.Get(this.strField_ModifyName);
	var element_description = oScreenBuffer.Get(this.strField_ModifyDescription);
	var element_owner = oScreenBuffer.Get(this.strField_ModifyOwner);
	
	if(element_modList.value == "")
	{
		oCatenaApp.showNotice(notice_Error, "No organization selected.");
		return false;
	}
	
	/*
		Now we need to get the ID for the organization the user is changing
		so we can send that to the server since otherwise it will not
		know which org we're trying to change
	*/
	
	var modOrg = this.oCSG_GroupList.get(element_modList.value);
	/*
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	var serverValues = Object();
	
	serverValues.name = element_name.value;
	serverValues.description = element_description.value;
	serverValues.owner = element_owner.value;
	serverValues.id = modOrg.group_ID;
	serverValues.location = strCSG_URL;
	serverValues.action = "modifygroup";
	
	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	var responseText = server.callSync(serverValues);
	var responseInfo = responseText.split("||");

	if(eval(responseInfo[0]))
	{
		element_name.value = "";
		element_description.value = "";
		element_owner.value = "";
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
oCSG_Groups.UpdateModifyScreen = function()
{
	/*
		Get the requested department details and set the fields
	*/
	var modifyList = oScreenBuffer.Get(this.strField_ModifyList);
	var element_name = oScreenBuffer.Get(this.strField_ModifyName);
	var element_description = oScreenBuffer.Get(this.strField_ModifyDescription);
	var element_owner = oScreenBuffer.Get(this.strField_ModifyOwner);

	var thisOrg = this.oCSG_GroupList.get(modifyList.value);

	if(thisOrg == null)
	{
		this.enableModify(false);
	}
	else
	{
		element_name.value = thisOrg.group_Name;
		element_description.value = thisOrg.group_Description;
		element_owner.value =  oRights.oOrgList.getName(thisOrg.org_ID);
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
oCSG_Groups.enableModify = function(toggle)
{
	var element_name = oScreenBuffer.Get(this.strField_ModifyName);			//	Our fields which will be updated with the record detail
	var element_description = oScreenBuffer.Get(this.strField_ModifyDescription);			//	Our fields which will be updated with the record detail
	var element_owner = oScreenBuffer.Get(this.strField_ModifyOwner);			//	Our fields which will be updated with the record detail
	
	element_name.disabled = !toggle;
	element_description.disabled = !toggle;
	element_owner.disabled = !toggle;
	
	if(!toggle)
	{
		element_name.value = "";
		element_description.value = "";
		element_owner.value = "";
	}
		
}
/*
	Removes an organization from the system
*/
oCSG_Groups.RemoveSubmit = function()
{
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
		ModifyShortName is the drop down list of the organizations we can modify
	*/
	var strName = oScreenBuffer.Get(this.strField_RemoveList).value;

	if(strName == "")
	{
		oCatenaApp.showNotice(notice_Error, "Please select an organization to delete");
		return false;
	}
	
	/*
		Query the user to make sure they really want to do this
	*/
	if(!window.confirm("Are you sure you want to remove " + strName + "?"))
	{
		return true;
	}

	var thisOrg = this.oCSG_GroupList.get(strName);

	/*
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	var serverValues = Object();
	
	serverValues.id = thisOrg.group_ID;
	serverValues.action = "removegroup";
	serverValues.location=strCSG_URL;
	
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

oCSG_Groups.register();