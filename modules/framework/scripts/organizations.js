/*
	purpose:
		Assign rights to right groups via a GUI.
*/
var oOrganizations = new system_AppScreen();

oOrganizations.screen_Name = "organization";		//	The name of the screen or page. Also the name of the XML data file
oOrganizations.screen_Menu = "Organizations";		//	The name of the menu item which corapsponds to this item
oOrganizations.module_Name = "framework";
oOrganizations.selectedOrg = "";

oOrganizations.oRightGroupsList = new system_RightGroupList();

/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
oOrganizations.custom_Show = function()
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
oOrganizations.LoadLists = function()
{
	oRights.fillOrgControl(oRights.SYSTEM_RightsAdmin, this.element_OrgList, true);
	
	this.SelectOrg("");
	return true;	
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
			true if load was successful.
			false otherwise.
--------------------------------------------------------------------------*/
oOrganizations.custom_Load = function()
{
	this.element_AddNewOrg = oScreenBuffer.Get("organizations_AddNewOrg");
	this.element_DeleteOrg = oScreenBuffer.Get("organizations_DeleteOrg");
	
	this.element_DeleteOrg.onclick = function()
	{
		oOrganizations.DeleteOrg();
	}
	
	/*
		Create the popup for adding a new group
	*/
	
	this.oCreateOrg = new organization_Create();
	/*
		The reason we call this function is because it
		is called when a new right group is submitted and the
		right group list needs to be refreshed.
	*/
	this.oCreateOrg.custom_submit = function()
	{
		oOrganizations.LoadLists();
	}

	this.element_tabs = oScreenBuffer.Get("orgManagement_tab");

	this.tabs = new system_tabManager(this.element_tabs);
	
	this.tabs.addTab(0, "Details", false, SetupOrgAccountPage, ShowOrgAccountPage);
	this.tabs.addTab(1, "Rights", false, SetupOrgRightsPage, ShowOrgRightsPage);
	this.tabs.addTab(2, "Groups", false, SetupOrgRightGroupPage, ShowOrgRightGroupPage);
	this.tabs.addTab(3, "Assigned", false, SetupOrgAssignedRightsPage, ShowOrgAssignedRightsPage);
	
	return true;
}

function SetupOrgAssignedRightsPage(element_root)
{
	oOrganizations.SetupAssignedRightsPage(element_root);
}
function ShowOrgAssignedRightsPage()
{
	oOrganizations.ShowAssignedRightsPage();
}
function SetupOrgRightGroupPage(element_root)
{
	oOrganizations.SetupRightGroupPage(element_root);
}
function ShowOrgRightGroupPage()
{
	oOrganizations.ShowRightGroupPage();
}
function SetupOrgRightsPage(element_root)
{
	oOrganizations.SetupRightsPage(element_root);
}
function ShowOrgRightsPage()
{
	oOrganizations.ShowRightsPage();
}
function ShowOrgAccountPage()
{
	oOrganizations.ShowAccountPage();
}
function SetupOrgAccountPage(element_root)
{
	oOrganizations.SetupAccountPage(element_root);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.SetupAssignedRightsPage = function(element_root)
{
	element_screen = oScreenBuffer.Get("orgManagement_AssignedTable");
	element_screen.style.position = "relative";

	element_root.appendChild(element_screen);


	//	Create the results table
	this.oAssignedTable = new system_SortTable();
	this.oAssignedTable.setName("orgManagement_AssignedTable");

	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Right";
		arHeader[0].sort = true;
		arHeader[0].dataType = "string";
		arHeader[0].fieldName = "right_Name";
		arHeader[0].width = "50%";
	arHeader[1] = Object();
		arHeader[1].text = "Organization";
		arHeader[1].dataType = "string";
		arHeader[1].width = "25%";
	arHeader[2] = Object();
		arHeader[2].text = "Source";
		arHeader[2].dataType = "string";
		
	this.oAssignedTable.SetHeader(arHeader);
	this.oAssignedTable.SetCaption("");
	this.oAssignedTable.show();
	this.oAssignedTable.Display();

	this.oAssignedTable.custom_element = display_rightElement;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.ShowAssignedRightsPage = function()
{

	oAllAssignedRightsList = new system_list("aRight_ID", "right_Name", "get_all_org_access_rights_list");
	oAllAssignedRightsList.serverURL = strSystemAccessURL;
	oAllAssignedRightsList.addParam("organization", this.selectedOrg);
	oAllAssignedRightsList.load();

	this.oAssignedTable.list = oAllAssignedRightsList.list;
	this.oAssignedTable.Display();
	
	oAllAssignedRightsList = null;

}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.SetupAssignedPage = function()
{


	//	Create the results table
	this.oAssignedTable = new system_SortTable();
	this.oAssignedTable.setName("userRightsAssigned_RightsTable");

	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Right";
		arHeader[0].sort = true;
		arHeader[0].dataType = "string";
		arHeader[0].fieldName = "right_Name";
		arHeader[0].width = "45%";
	arHeader[1] = Object();
		arHeader[1].text = "Organization";
		arHeader[1].dataType = "string";
	arHeader[2] = Object();
		arHeader[2].text = "Source";
		arHeader[2].dataType = "string";
		
	this.oAssignedTable.SetHeader(arHeader);
	this.oAssignedTable.SetCaption("Assigned Rights");
	this.oAssignedTable.show();
	this.oAssignedTable.Display();
	
	this.oAssignedTable.custom_element = display_rightElement;

	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.ShowRightsPage = function()
{

	oUserRightsList.load();
	oUserRightsList.fillControl(this.element_RightsList, true);
	
	this.LoadAssignedRights(this.selectedOrg);

	this.oRightsTable.show();
	
	HideElement(this.element_RightOrgList);
	HideElement(this.element_OrgText);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.ShowRightGroupPage = function()
{
	this.oRightGroupsList.loadAsync(fillOrganizationList);
	
	//this.oRightGroupsList.fillControl(this.element_GroupList, true);
	this.LoadAssignedGroups(this.selectedOrg);
	this.oGroupsTable.show();
}
function fillOrganizationList()
{
	oOrganizations.oRightGroupsList.fillControl(oOrganizations.element_GroupList, true);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.SetupRightGroupPage = function(element_root)
{
	
	this.element_GroupBox = oScreenBuffer.Get("orgManagement_GroupBox");
	element_root.appendChild(this.element_GroupBox);
	
	//	Create the results table
	this.oGroupsTable = new system_SortTable();
	this.oGroupsTable.setName("orgManagement_GroupTable");

	this.element_GroupList = oScreenBuffer.Get("orgManagement_GroupList");

	/*
		Now assign actions to changing the right list
		and the org list
	*/
	this.element_GroupList.onchange = function ()
	{
		oOrganizations.AssignGroup();
	}

	/*
		Fill the header table for the rights
		assigned to this user
	*/
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Group";
		arHeader[0].sort = false;
		arHeader[0].dataType = "string";
		arHeader[0].fieldName = "right_Name";
		arHeader[0].width = "70%";
	arHeader[1] = Object();
		arHeader[1].text = "";
		arHeader[1].dataType = "string";
		arHeader[1].width = "8%";
		
	this.oGroupsTable.SetHeader(arHeader);
	this.oGroupsTable.SetCaption("Assigned Groups");
	
	/*
		Fill out the custom display function for
		the assigned rights
	*/
		
	this.oGroupsTable.custom_element = function(i)
	{
		var element_Row = appendChild(this.element_body, "TR");

		oSystem_Colors.SetPrimary(element_Row);

		var element_Col1 = appendChild(element_Row, "TD");
		
		/*
			The first column. Set the text for the element
		*/
		element_title = screen_CreateRightGroupDetailLink(this.list[i].rightGroup_ID, this.list[i].rightGroup_Name);
		
		if(element_title)
		{
			element_title.style.paddingLeft = "6px";
			element_title.style.fontWeight = "bold";
			element_Col1.appendChild(element_title);
		}
		
		element_org = document.createTextNode(" (" + this.list[i].org_Short_Name + ")");
		
		element_Col1.appendChild(element_org);

		appendChild(element_Col1, "BR");

		element_Col1Desc = appendChild(element_Col1, "SPAN");

		screen_SetTextElement(element_Col1Desc, this.list[i].rightGroup_Description);

		element_Col1Desc.style.fontSize = "80%";
		element_Col1Desc.style.paddingLeft = "6px";

		if(i % 2 == 1)
		{
			oSystem_Colors.SetSecondaryBackground(element_Row);
		}
		else
		{
			oSystem_Colors.SetTertiaryBackground(element_Row);
		}
		
		var element_Col2 = appendChild(element_Row, "TD");

		if(this.list[i].may_assign == "1")
		{
			element_DeleteLink = appendChild(element_Col2, "SPAN");
			element_DeleteLink.right_id = this.list[i].aRight_ID;
			element_DeleteLink.className = "link";
			element_DeleteLink.title = "Remove this right";
			element_DeleteLink.style.vAlign = "top";
			element_DeleteLink.style.paddingLeft = "10px";

			element_ColDelete = appendChild(element_DeleteLink, "IMG");
			element_ColDelete.className = "link";
			element_ColDelete.src = "../image/b_drop.gif";
			
			element_DeleteLink.onclick = function()
			{
				oOrganizations.RemoveGroup(this.right_id);
			}
		}
	}
	
}
/*--------------------------------------------------------------------------
	-	description
			RemoveRight
				pass to the server the assigned group id which is to be
				removed from the user account
	-	params
	-	return
--------------------------------------------------------------------------*/
oOrganizations.RemoveGroup = function (assigned_ID)
{
	if(!confirm("Are you sure you wish to remove this group?"))
	{
		return;
	}
	
	responseText = oRights.RemoveUserGroup(assigned_ID);
	
	if(!oCatenaApp.showResults(responseText))
	{
		return false;
	}
	
	this.ShowRightGroupPage();	

	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.SetupRightsPage = function(element_root)
{
	oSystem_Debug.notice("In SetupRightsPage");
	
	this.element_RightsBox = oScreenBuffer.Get("organizations_RightsBox");
	element_root.appendChild(this.element_RightsBox);

	this.oRightsTable = new system_SortTable();
	this.oRightsTable.setName("organizations_RightsTable");

	this.oRightsTable.custom_display = oOrganizations_Table_display;

	this.element_OrgList = oScreenBuffer.Get("organizations_OrgList");

	this.element_OrgList.onclick = function ()
	{
		if(this.value != oOrganizations.selectedOrg)
		{
			oOrganizations.SelectOrg(this.value);
		}
	}
		
	this.element_RightsList = oScreenBuffer.Get("organizations_RightList");

	this.element_RightsList.onclick = function ()
	{
		oOrganizations.SelectRight(this.value);
	}
	
	this.element_RightOrgList = oScreenBuffer.Get("organizations_RightOrgList");

	this.element_RightOrgList.onchange = function ()
	{
		oOrganizations.SelectRightOrg(this.value);
	}

	/*
		Now set up the defaults
	*/
	HideElement(this.element_RightOrgList);
	
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
oOrganizations.ShowAccountPage = function(element_root)
{
	oSystem_Debug.notice("Selected for fill modify: " + this.selectedOrg);
	
	oOrgList = new system_OrgList();
	oOrgList.addParam("name", this.selectedOrg);
	oOrgList.load();
	
	arOrg = oOrgList.get(this.selectedOrg);
	
	this.element_modifyName.value = arOrg.org_Short_Name;
	this.element_modifyFullName.value = arOrg.org_Long_Name;
	this.modifyId = arOrg.org_ID;

	oSystem_Debug.notice("Record name: " + arOrg.org_Short_Name);
	
	oOrgList = new system_OrgList();
	oOrgList.addParam("id", arOrg.org_Parent);
	oOrgList.load();

	oOrgList.fillControl(this.element_modifyParent, false);

	this.EnableModify(false);

}	
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.SetupAccountPage = function(element_root)
{

	this.element_DetailsBox = oScreenBuffer.Get("organizations_DetailsBox");
	element_root.appendChild(this.element_DetailsBox);

	this.element_modifyName = oScreenBuffer.Get("organizations_ModifyName");
	this.element_modifyFullName = oScreenBuffer.Get("organizations_ModifyFullName");
	this.element_modifyParent = oScreenBuffer.Get("organizations_ModifyParent");

	this.element_enableModify = oScreenBuffer.Get("organizations_ModifyButton");
	this.element_submitModify = oScreenBuffer.Get("organizations_SubmitModifyButton");
	this.element_cancelModify = oScreenBuffer.Get("organizations_CancelModifyButton");

	this.element_cancelModify.onclick = function ()
	{
		oOrganizations.CancelModify();
	}

	this.element_enableModify.onclick = function ()
	{
		oOrganizations.EnableModify(true);
	}

	this.element_submitModify.onclick = function ()
	{
		oOrganizations.ModifySubmit();
	}
		
	this.element_DeleteOrg.onclick = function()
	{
		oOrganizations.DeleteOrg();
	}
	
	this.element_AddNewOrg.onclick = function()
	{
		oOrganizations.AddNewOrg();
	}
}
/*--------------------------------------------------------------------------
	-	description
		Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oOrganizations.LoadAssignedGroups = function(strOrg)
{
	oAssignedGroupsList = new system_list("aRight_ID", "rightGroup_Name", "get_org_groups_list");
	oAssignedGroupsList.serverURL = strSystemAccessURL;
	oAssignedGroupsList.addParam("organization", this.selectedOrg);
	oAssignedGroupsList.load();

	this.oGroupsTable.list = oAssignedGroupsList.list;
	this.oGroupsTable.Display();
	
	oAssignedGroupsList = null;
	
}
/*--------------------------------------------------------------------------
	-	description
			Fill out the custom display function for the assigned rights.
	-	params
	-	return
--------------------------------------------------------------------------*/
oOrganizations_Table_display = function()
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
			element_DeleteLink.right_id = this.list[i].aRight_ID;
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
				oOrganizations.RemoveRight(this.right_id);
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
oOrganizations.CancelModify = function()
{
	this.EnableModify(false);
	this.FillModify(this.selectedOrg);

}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.ModifySubmit = function()
{

	this.element_modifyName = oScreenBuffer.Get("organizations_ModifyName");
	this.element_modifyFullName = oScreenBuffer.Get("organizations_ModifyFullName");
	this.element_modifyParent = oScreenBuffer.Get("organizations_ModifyParent");
	
	var serverValues = Object();

	serverValues.shortName = this.element_modifyName.value;
	serverValues.longName = this.element_modifyFullName.value;
	serverValues.parent = this.element_modifyParent.value;
	serverValues.location = strOrganizationURL;
	serverValues.action = "modify";
	serverValues.id = this.modifyId;
	
	oSystem_Debug.notice(server.buildURL(serverValues));
	
	var responseText = server.callSync(serverValues);
	
	if(!oCatenaApp.showResults(responseText))
	{
		return false;
	}

	this.EnableModify(false);
	
	this.LoadLists();
	
	this.element_OrgList.value = serverValues.shortName;
	this.element_OrgList.onclick();
	
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.AddNewOrg = function()
{
	this.oCreateOrg.show();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.ModifyOrg = function()
{
	oSystem_Debug.notice(this.element_OrgList.value);

	this.oCreateOrg.show(this.element_OrgList.value);
}
/*--------------------------------------------------------------------------
	-	description
			Removes an organization from the system
	-	params
	-	return
--------------------------------------------------------------------------*/
oOrganizations.DeleteOrg = function()
{
	oSystem_Debug.notice("Removing : " + this.selectedOrg);
	arOrg = oRights.oOrgList.get(this.selectedOrg);
	
	if(!arOrg)
	{
		return false;
	}
	
	/*
		Query the user to make sure they really want to do this
	*/
	if(!window.confirm("Are you sure you want to remove " + arOrg.org_Short_Name + "?"))
	{
		return true;
	}

	var serverValues = Object();
	serverValues.id = arOrg.org_ID;
	serverValues.action = "remove";
	serverValues.location = strOrganizationURL;

	var responseText = server.callSync(serverValues);

	if(oCatenaApp.showResults(responseText))
	{
		this.LoadLists();
		return true;
	}
	else
	{
		//oSystem_Debug.warning("Failed removing : " + this.selectedOrg + " " + responseText);
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
oOrganizations.LoadAssignedRights = function(orgName)
{
	this.serverValues = null;
	this.serverValues = Object();
	
	this.serverValues.organization = orgName;
	this.serverValues.location = strSystemAccessURL;
	this.serverValues.action = "get_org_rights_list";

	responseText = server.callASync(this.serverValues, OrganizationAdminParse);
}
/*--------------------------------------------------------------------------
	-	description
			Needed for the function call wrapper called in RetreiveRights
	-	params
	-	return
--------------------------------------------------------------------------*/
function OrganizationAdminParse(strResults)
{
	oOrganizations.ParseRights(strResults);
}
/*--------------------------------------------------------------------------
	-	description
		Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oOrganizations.ParseRights = function(strResults)
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
oOrganizations.SelectRight = function (strRight)
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
			oRights.fillOrgControl(strRight, this.element_RightOrgList, true);
			//oUserRightsList.fillOrgControl(this.element_RightOrgList, strRight, true);
			ShowInheritElement(this.element_RightOrgList);
		}
		else
		{
			HideElement(this.element_RightOrgList);
			HideElement(this.element_OrgText);
			this.element_RightOrgList.value = "";
			this.AssignRight();
		}
	}
	else
	{
		/*
			User no longer choosing a right
			Clear the org list if it's displayed
		*/
		HideElement(this.element_RightOrgList);
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
oOrganizations.SelectRightOrg = function (strOrgName)
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
oOrganizations.AssignRight = function ()
{
	orgName = this.element_OrgList.value;
	rightName = this.element_RightsList.value;
	rightOrg = this.element_RightOrgList.value;
		
	responseText = oRights.AssignOrgRight(orgName, rightName, rightOrg);
	
	if(!oCatenaApp.showResults(responseText))
	{
		return false;
	}
	
	this.SelectOrg(this.selectedOrg);

	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Assigns a group to a user
			-	Pass to the server the name of the user
			-	Pass to the server the name of the group
			-	The server side checks that the logged in user
				has the correct right so we don't worry about that client
				side
	-	params
	-	return
--------------------------------------------------------------------------*/
oOrganizations.AssignGroup = function ()
{
	if(this.element_GroupList.value)
	{
		var responseText = oRights.AssignOrgGroup(this.selectedOrg, this.element_GroupList.value);
	
		if(!oCatenaApp.showResults(responseText))
		{
			return false;
		}
		this.ShowRightGroupPage();	
	}

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
oOrganizations.RemoveRight = function (assigned_ID)
{

	if(!confirm("Are you sure you wish to remove this right?"))
	{
		return;
	}
	
	responseText = oRights.RemoveAssignedRight(assigned_ID);

	if(!oCatenaApp.showResults(responseText))
	{
		return false;
	}
	
	this.SelectOrg(this.selectedOrg);

	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.FillModify = function(strOrganization)
{
	oSystem_Debug.notice("Selected for fill modify: " + strOrganization);
	
	oOrgList = new system_OrgList();
	oOrgList.addParam("name", strOrganization);
	oOrgList.load();
	arOrg = oOrgList.get(strOrganization);
	
	this.element_modifyName.value = arOrg.org_Short_Name;
	this.element_modifyFullName.value = arOrg.org_Long_Name;

	oSystem_Debug.notice("Record name: " + arOrg.org_Short_Name);
	
	oOrgList = new system_OrgList();
	oOrgList.addParam("id", arOrg.org_Parent);
	oOrgList.load();
	
	oOrgList.fillControl(this.element_modifyParent, false);
}
//--------------------------------------------------------------------------
/**
	\brief
		Enable or disable the modify fields.
	\param
	\return
*/
//--------------------------------------------------------------------------
oOrganizations.EnableModify = function(toggle)
{
	this.element_modifyName.disabled = !toggle;
	this.element_modifyFullName.disabled = !toggle;
	
	if(toggle == true)
	{
		if(oUser.HasRight(oRights.SYSTEM_RightsAdmin, this.element_modifyParent.value)  == true)
		{
			oSystem_Debug.notice("User has organization " + this.element_modifyParent.value + " assigned.");
			this.element_modifyParent.disabled = false;
			
			parentValue = this.element_modifyParent.value;
			oRights.fillOrgControl(oRights.SYSTEM_RightsAdmin, this.element_modifyParent, false);
			
			this.element_modifyParent.focus();
			this.element_modifyParent.value = parentValue;
		}
		else
		{
			this.element_modifyParent.disabled = true;
		}
	
		HideElement(this.element_enableModify);
		ShowInheritElement(this.element_submitModify);
		ShowInheritElement(this.element_cancelModify);
	}
	else
	{
		this.element_modifyParent.disabled = true;
		ShowInheritElement(this.element_enableModify);
		HideElement(this.element_submitModify);
		HideElement(this.element_cancelModify);
	}
}
/*--------------------------------------------------------------------------
	-	description
			Filter Organizaton takes the value from the
			organization field and filters the user names
			by that organization.
	-	params
	-	return
--------------------------------------------------------------------------*/
oOrganizations.SelectOrg = function(strOrganization)
{
	/*
		-	tell the user which user account they selected
			via the text box to the right of the user name drop down list
		-	Populate the individual rights fields with the accounts
			assigned and available rights.
	*/
	if(strOrganization)
	{
		this.selectedOrg = strOrganization;
		ShowInheritElement(this.element_tabs);
		//ShowInheritElement(this.element_DeleteOrg);
		this.tabs.show();
	}
	else
	{
		this.selectedOrg = "";
		HideElement(this.element_tabs);
		HideElement(this.element_DeleteOrg);
	}
}

oOrganizations.register();