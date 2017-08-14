/*
	purpose:
		Assign rights to right groups via a GUI.
*/
var oRights_GroupAssign = new system_AppScreen();

oRights_GroupAssign.screen_Name = "rights_GroupAssign";		//	The name of the screen or page. Also the name of the XML data file
oRights_GroupAssign.screen_Menu = "Right Groups";		//	The name of the menu item which corapsponds to this item
oRights_GroupAssign.module_Name = "framework";

oRights_GroupAssign.oRightGroupsList = new system_RightGroupList();
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
oRights_GroupAssign.custom_Show = function()
{
	this.LoadLists();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.LoadLists = function()
{
	this.oRightGroupsList.load();
	this.oRightGroupsList.fillControl(this.element_GroupList, true);
	this.SelectGroup("");

	return true;	
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
			true if load was successful.
			false otherwise.
--------------------------------------------------------------------------*/
oRights_GroupAssign.custom_Load = function()
{
	this.element_GroupList = oScreenBuffer.Get("groupAssign_GroupList");

	this.element_GroupList.onchange = function ()
	{
		oRights_GroupAssign.SelectGroup(this.value);
	}

	this.element_AddNewGroup = oScreenBuffer.Get("groupAssign_AddNewGroup");
	this.element_DeleteGroup = oScreenBuffer.Get("groupAssign_RemoveGroup");
		
	this.element_DeleteGroup.onclick = function()
	{
		oRights_GroupAssign.DeleteGroup();
	}
	
	this.element_AddNewGroup.onclick = function()
	{
		oRights_GroupAssign.AddNewGroup();
	}

	/*
		Create the popup for adding a new group
	*/
	
	this.oCreateGroup = new rights_GroupCreate();
	/*
		The reason we call this function is because it
		is called when a new right group is submitted and the
		right group list needs to be refreshed.
	*/
	this.oCreateGroup.custom_submit = function()
	{
		oRights_GroupAssign.LoadLists();
	}

	this.element_tabs = oScreenBuffer.Get("groupAssign_tab");

	this.tabs = new system_tabManager(this.element_tabs);

	this.tabs.addTab(0, "Details", false, SetupGroupDetailsPage, ShowGroupDetailsPage);
	this.tabs.addTab(1, "Rights", false, SetupGroupRightsPage, ShowGroupRightsPage);
	this.tabs.addTab(2, "Assigned", false, SetupRightGroupAssignedPage, ShowRightGroupAssignedPage);
	//this.tabs.addTab(2, "Users", SetupGroupUsersPage, ShowGroupUsersPage);
	
	return true;
}

function SetupRightGroupAssignedPage(element_root)
{
	oRights_GroupAssign.SetupAssignedPage(element_root);
}
function ShowRightGroupAssignedPage()
{
	oRights_GroupAssign.ShowAssignedPage();
}

function SetupGroupDetailsPage(element_root)
{
	oRights_GroupAssign.SetupDetailsPage(element_root);
}
function ShowGroupDetailsPage()
{
	oRights_GroupAssign.ShowDetailsPage();
}
function SetupGroupRightsPage(element_root)
{
	oRights_GroupAssign.SetupRightsPage(element_root);
}
function ShowGroupRightsPage()
{
	oRights_GroupAssign.ShowRightsPage();
}
function ShowGroupUsersPage()
{
	//oRights_GroupAssign.ShowAccountPage();
}
function SetupGroupUsersPage(element_root)
{
	//oRights_GroupAssign.SetupAccountPage(element_root);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.ShowAssignedPage = function()
{
	this.serverValues = null;
	this.serverValues = new Object();
	
	this.serverValues.group = this.selectedGroup;
	this.serverValues.location = strSystemAccessURL;
	this.serverValues.action = "get_group_assigned_list";

	server.callASync(this.serverValues, RightGroupAssignedParse);
}
function RightGroupAssignedParse(strResults)
{
	oRights_GroupAssign.oAssignedTable.SetList(strResults);
	oRights_GroupAssign.oAssignedTable.Display();
	
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.SetupAssignedPage = function(element_root)
{
	element_screen = oScreenBuffer.Get("groupAssign_AssignedTable");
	element_screen.style.position = "relative";

	element_root.appendChild(element_screen);


	//	Create the results table
	this.oAssignedTable = new system_SortTable();
	this.oAssignedTable.setName("groupAssign_AssignedTable");

	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Type";
		arHeader[0].tip = "User accounts or organizations which may have this group assigned to them";
	arHeader[1] = Object();
		arHeader[1].text = "Account";
		arHeader[1].width = "50%";
		arHeader[1].tip = "Account details which may be an organization or a user name";
	arHeader[2] = Object();
		arHeader[2].text = "Organization";
		arHeader[2].tip = "A user accounts organization";
		
	this.oAssignedTable.SetHeader(arHeader);
	this.oAssignedTable.SetCaption("");
	this.oAssignedTable.show();
	this.oAssignedTable.Display();

	this.oAssignedTable.custom_element = display_GroupAccounts;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function display_GroupAccounts(i)
{
	var element_Row = appendChild(this.element_body, "TR");
	
	if(i % 2 == 1)
	{
		oSystem_Colors.SetSecondaryBackground(element_Row);
	}
	else
	{
		oSystem_Colors.SetTertiaryBackground(element_Row);
	}

	oSystem_Colors.SetPrimary(element_Row);

	
	if(this.list[i].account_type == 0)
	{
		// user account
		var element_Col1 = appendChild(element_Row, "TD");
		element_Col1.appendChild(document.createTextNode("User"));
		element_Col1.title = "A user account";
		

		var element_Col2 = appendChild(element_Row, "TD");
		element_Col2.appendChild(screen_CreateUserLink(this.list[i].account_Name));

		var element_Col3 = appendChild(element_Row, "TD");
		element_Col3.appendChild(screen_CreateOrganizationLink(this.list[i].org_Short_Name));
	}
	else
	{
		// organization account
		var element_Col1 = appendChild(element_Row, "TD");
		element_Col1.appendChild(document.createTextNode("Org"));
		element_Col1.title = "An organization";

		var element_Col2 = appendChild(element_Row, "TD");
		element_Col2.appendChild(screen_CreateOrganizationLink(this.list[i].account_Name));
		
		var element_Col3 = appendChild(element_Row, "TD");
		element_Col3.appendChild(document.createTextNode(""));
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.ShowRightsPage = function()
{
	oUserRightsList.load();
	oUserRightsList.fillControl(this.element_RightsList, true);
		
	this.RetrieveRights(this.selectedGroup);
	this.oRightsTable.show();
		
	arGroup = this.oRightGroupsList.getFromId(this.selectedGroup);

	HideElement(this.element_OrgList);
	HideElement(this.element_OrgText);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.SetupRightsPage = function(element_root)
{
	element_root.appendChild(oScreenBuffer.Get("groupAssign_RightsBox"));

	this.oRightsTable = new system_SortTable();
	this.oRightsTable.setName("groupAssign_RightsTable");

	this.oRightsTable.custom_display = oRights_GroupAssign_Table_display;
		
	this.element_RightsList = oScreenBuffer.Get("groupAssign_RightList");

	this.element_RightsList.onclick = function ()
	{
		oRights_GroupAssign.SelectRight(this.value);
	}
	
	this.element_OrgList = oScreenBuffer.Get("groupAssign_OrgList");

	this.element_OrgList.onchange = function ()
	{
		oRights_GroupAssign.SelectOrg(this.value);
	}

	/*
		Now set up the defaults
	*/
	HideElement(this.element_OrgList);
	
	/*
		Fill the header table for the rights
		assigned to this user
	*/
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Right";
		arHeader[0].sort = true;
		arHeader[0].dataType = "string";
		arHeader[0].fieldName = "right_Name";
		arHeader[0].width = "70%";
	arHeader[1] = Object();
		arHeader[1].text = "Organization";
		arHeader[1].dataType = "string";
	arHeader[2] = Object();
		arHeader[2].text = "";
		arHeader[2].dataType = "string";
		arHeader[2].width = "8%";
		
	this.oRightsTable.SetHeader(arHeader);
	this.oRightsTable.SetCaption("Assigned Rights");

}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.FillModify = function()
{
	this.element_modifyName.value = "";
	this.element_modifyDescription.value = "";
	
	oRights.fillOrgControl(oRights.SYSTEM_RightsAdmin, this.element_modifyOrganization, true);
	this.modifyId = null;
		
	oRightGroupList = new system_RightGroupList();
		
	oRightGroupList.addParam("name", this.selectedGroup);
	oRightGroupList.load();
		
	arGroup = oRightGroupList.getFromId(this.selectedGroup);

	this.element_modifyName.value = arGroup.rightGroup_Name;
	this.element_modifyDescription.value = arGroup.rightGroup_Description;
	this.element_modifyOrganization.value = arGroup.org_Short_Name;
	this.modifyId = arGroup.rightGroup_ID;
	
	this.EnableModify(false);
}
//--------------------------------------------------------------------------
/**
	\brief
		Enable or disable the modify fields.
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.EnableModify = function(toggle)
{
	this.element_modifyName.disabled = !toggle;
	this.element_modifyDescription.disabled = !toggle;
	
	if(toggle == true)
	{
		if(oUser.HasRight(oRights.SYSTEM_RightsAdmin, this.element_modifyOrganization.value)  == true)
		{
			oSystem_Debug.notice("User has organization " + this.element_modifyOrganization.value + " assigned.");
			this.element_modifyOrganization.disabled = false;
			
			parentValue = this.element_modifyOrganization.value;
			oRights.fillOrgControl(oRights.SYSTEM_RightsAdmin, this.element_modifyOrganization, true);
			this.element_modifyOrganization.value = parentValue;
		}
		else
		{
			this.element_modifyOrganization.disabled = true;
		}
	
		HideElement(this.element_enableModify);
		ShowInheritElement(this.element_submitModify);
		ShowInheritElement(this.element_cancelModify);
	}
	else
	{
		this.element_modifyOrganization.disabled = true;
		ShowInheritElement(this.element_enableModify);
		HideElement(this.element_submitModify);
		HideElement(this.element_cancelModify);
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.ShowDetailsPage = function()
{

	this.FillModify();
	
	
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.SetupDetailsPage = function(element_root)
{
	this.element_RenameGroup = oScreenBuffer.Get("groupAssign_DetailsBox");
	element_root.appendChild(this.element_RenameGroup);

	this.element_modifyName = oScreenBuffer.Get("rightGroup_ModifyName");
	this.element_modifyDescription = oScreenBuffer.Get("rightGroup_ModifyDescription");
	this.element_modifyOrganization = oScreenBuffer.Get("rightGroup_ModifyOrganization");

	this.element_enableModify = oScreenBuffer.Get("rightGroup_ModifyButton");
	this.element_submitModify = oScreenBuffer.Get("rightGroup_SubmitModifyButton");
	this.element_cancelModify = oScreenBuffer.Get("rightGroup_CancelModifyButton");

	this.element_cancelModify.onclick = function ()
	{
		oRights_GroupAssign.CancelModify();
	}

	this.element_enableModify.onclick = function ()
	{
		oRights_GroupAssign.EnableModify(true);
	}

	this.element_submitModify.onclick = function ()
	{
		oRights_GroupAssign.ModifySubmit();
	}

}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.CancelModify = function()
{
	this.EnableModify(false);
	this.FillModify();

}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.ModifySubmit = function()
{
	var serverValues = Object();

	serverValues.group = this.element_modifyName.value;
	serverValues.description = this.element_modifyDescription.value;
	serverValues.organization= this.element_modifyOrganization.value;
	serverValues.location = strRightGroupURL;
	serverValues.action = "modify";
	serverValues.id = this.modifyId;
	
	var responseText = server.callSync(serverValues);
	
	if(!oCatenaApp.showResults(responseText))
	{
		return false;
	}

	this.EnableModify(false);
	
	this.LoadLists();
	
	this.element_GroupList.value = this.modifyId;
	this.element_GroupList.onchange();
	
}
/*--------------------------------------------------------------------------
	-	description
			Fill out the custom display function for the assigned rights.
	-	params
	-	return
--------------------------------------------------------------------------*/
oRights_GroupAssign_Table_display = function()
{
	for(var i = 0; i < this.list.length; i++)
	{
		var element_Row = document.createElement("TR");
		this.element_body.appendChild(element_Row);

		oSystem_Colors.SetPrimary(element_Row);

		var element_Col1 = document.createElement("TD");
		element_Row.appendChild(element_Col1);
		
		element_Col1.title = this.list[i]["right_Description"];
		/*
			The first column. Set the text for the element
		*/
		element_Col1Text = document.createElement("SPAN");
		element_Col1.appendChild(element_Col1Text);
		screen_SetTextElement(element_Col1Text, this.list[i]["right_Name"]);
		element_Col1Text.style.paddingLeft = "6px";
		element_Col1Text.style.fontWeight = "bold";

		element_Col1Break = document.createElement("BR");
		element_Col1.appendChild(element_Col1Break);
		element_Col1Desc = document.createElement("SPAN");
		element_Col1.appendChild(element_Col1Desc);
		screen_SetTextElement(element_Col1Desc, this.list[i]["right_Description"]);
		element_Col1Desc.style.fontSize="80%";
		element_Col1Desc.style.paddingLeft = "6px";

		var element_Col2 = document.createElement("TD");
		element_Row.appendChild(element_Col2);

		element_Col2.appendChild(screen_CreateOrganizationLink(this.list[i].org_Short_Name));

		if(i % 2 == 1)
		{
			oSystem_Colors.SetSecondaryBackground(element_Row);
		}
		else
		{
			oSystem_Colors.SetTertiaryBackground(element_Row);
		}
	
		/*
			Create the delete element if it's needed
		*/
		
		var element_Col2 = document.createElement("TD");
		element_Row.appendChild(element_Col2);

		if(this.list[i]["may_assign"] == "1")
		{
			element_DeleteLink = document.createElement("SPAN");
			element_DeleteLink.right_id = this.list[i]["detail_ID"];
			element_DeleteLink.className = "link";
			element_DeleteLink.title = "Remove this right";
			element_DeleteLink.style.vAlign="top";
			element_DeleteLink.style.paddingLeft="10px";
			element_Col2.appendChild(element_DeleteLink);

			element_ColDelete = document.createElement("IMG");
			element_ColDelete.className = "link";
			element_ColDelete.src = "../image/b_drop.gif";
			element_DeleteLink.appendChild(element_ColDelete);
			
			element_DeleteLink.onclick = function()
			{
				oRights_GroupAssign.RemoveRight(this.right_id);
			}
		}
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights_GroupAssign.AddNewGroup = function()
{
	this.oCreateGroup.show();
}
/*--------------------------------------------------------------------------
	-	description
			Removes an organization from the system
	-	params
	-	return
--------------------------------------------------------------------------*/
oRights_GroupAssign.DeleteGroup = function()
{
	arGroup = this.oRightGroupsList.getFromId(this.selectedGroup);
	
	if(!arGroup)
	{
		return false;
	}
	
	/*
		Query the user to make sure they really want to do this
	*/
	if(!window.confirm("Are you sure you want to remove " + arGroup.rightGroup_Name + "?"))
	{
		return true;
	}

	var serverValues = Object();
	serverValues.id = arGroup.rightGroup_ID;
	serverValues.action = "remove";
	serverValues.location = strRightGroupURL;

	var responseText = server.callSync(serverValues);

	if(oCatenaApp.showResults(responseText))
	{
		this.LoadLists();
		return true;
	}
	else
	{
		return false;
	}
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Retrieve the rights assigned to this group
	-	params
			The name of the group
	-	return
			none
--------------------------------------------------------------------------*/
oRights_GroupAssign.RetrieveRights = function(groupName)
{
	this.serverValues = null;
	this.serverValues = Object();
	
	this.serverValues.group = groupName;
	this.serverValues.location = strRightGroupURL;
	this.serverValues.action = "getassignedrights";

	responseText = server.callASync(this.serverValues, RightGroupAdminParse);
}
/*--------------------------------------------------------------------------
	-	description
			Needed for the function call wrapper called in RetreiveRights
	-	params
	-	return
--------------------------------------------------------------------------*/
function RightGroupAdminParse(strResults)
{
	oRights_GroupAssign.ParseRights(strResults);
}
/*--------------------------------------------------------------------------
	-	description
		Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oRights_GroupAssign.ParseRights = function(strResults)
{
	this.oRightsTable.SetList(strResults);
	this.oRightsTable.Display();
}
/*--------------------------------------------------------------------------
	-	description
			Filter the right
			The user has chosen a right.
			See if the right requires an organization
			and display the org list if so.
	-	params
	-	return
--------------------------------------------------------------------------*/
oRights_GroupAssign.SelectRight = function (strRight)
{
	if(strRight.length)
	{
		/*
			See if this right requires an
			organization. If it does, then
			display the organization list,
			otherwise simply display the add button
		*/
		
		if(oUserRightsList.RequiresOrg(strRight))
		{
			/*
				The list must be filtered based upon the list
				of organizations the 'admin' has access to
				Show all organizations and their children
			*/
			oRights.fillOrgControl(strRight, this.element_OrgList, true);
			//oUserRightsList.fillOrgControl(this.element_OrgList, strRight, true);
			ShowInheritElement(this.element_OrgList);
		}
		else
		{
			HideElement(this.element_OrgList);
			HideElement(this.element_OrgText);
			this.element_OrgList.value = "";
			this.AssignRight();
		}
	}
	else
	{
		/*
			User no longer choosing a right
			Clear the org list if it's displayed
		*/
		HideElement(this.element_OrgList);
	}
}
/*--------------------------------------------------------------------------
	-	description
			Filter the org
			The user has chosen an organization
			in the drop down list for adding a right
	-	params
	-	return
--------------------------------------------------------------------------*/
oRights_GroupAssign.SelectOrg = function (strOrgName)
{
	if(strOrgName.length)
	{
		/*
			See if this right requires an
			organization. If it does, then
			display the organization list,
			otherwise simply display the add button
		*/
		this.AssignRight();
	}
}
/*--------------------------------------------------------------------------
	-	description
			Assign a right to a right group
			Note, the server side checks that the logged in user
			has the correct right so we don't worry about that client side
	-	params
	-	return
--------------------------------------------------------------------------*/
oRights_GroupAssign.AssignRight = function ()
{
	groupName = this.element_GroupList.value;
	rightName = this.element_RightsList.value;
	orgName = this.element_OrgList.value;
		
	var serverValues = Object();
	serverValues.group = groupName;
	serverValues.right = rightName;
	serverValues.organization = orgName;
	serverValues.location = strRightGroupURL;
	serverValues.action = "assignright";

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
	
	this.SelectGroup(this.selectedGroup);

	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Remove a right assigned to a group
	-	params
			assigned_ID
				The id of the right to be removed
	-	return
--------------------------------------------------------------------------*/
oRights_GroupAssign.RemoveRight = function (assigned_ID)
{
	var serverValues = Object();
	serverValues.id = assigned_ID;
	serverValues.location = strRightGroupURL;
	serverValues.action = "removeRight";
	
	if(!confirm("Are you sure you wish to remove this right?"))
	{
		return;
	}

	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	var responseText = server.callSync(serverValues);
	
	if(!oCatenaApp.showResults(responseText))
	{
		return false;
	}
	
	this.SelectGroup(this.selectedGroup);

	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Filter Organizaton takes the value from the
			organization field and filters the user names
			by that organization.
	-	params
	-	return
--------------------------------------------------------------------------*/
oRights_GroupAssign.SelectGroup = function(groupId)
{
	/*
		-	tell the user which user account they selected
			via the text box to the right of the user name drop down list
		-	Populate the individual rights fields with the accounts
			assigned and available rights.
	*/
	
	if(groupId)
	{
		this.selectedGroup = groupId;

		ShowInheritElement(this.element_tabs);
		ShowInheritElement(this.element_DeleteGroup);
		this.tabs.show();
	}
	else
	{
		this.selectedGroup = "";
		HideElement(this.element_tabs);
		HideElement(this.element_DeleteGroup);
	}
}

oRights_GroupAssign.register();