/*
	The purpose of this file is to manage user accounts.
	Intially management can change the user's organization.
*/

oSystem_UserManagement = new system_AppScreen();

oSystem_UserManagement.screen_Name = "system_UserManagement";				//	The name of the screen or page. Also the name of the XML data file
oSystem_UserManagement.screen_Menu = "User Accounts";								//	The name of the menu item which corresponds to this screen
oSystem_UserManagement.module_Name = "framework";

oSystem_UserManagement.oUserFilter = null;

oSystem_UserManagement.oRightGroupsList = new system_RightGroupList();

/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_UserManagement.custom_Show = function ()
{
	this.SelectUser("");
	this.oUserFilter.clear();

}
/*--------------------------------------------------------------------------
	-	description
			Load object custom functionality
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_UserManagement.custom_Load = function()
{
	this.oUserFilter = new system_UserOrgSelection();
	this.oUserFilter.load("userManagement_box", "userManagement_UserPopup");
	this.oUserFilter.useInactiveAccounts = true;

	this.oUserFilter.setLocation(60, 0);

	this.oUserFilter.custom_submit = function (selectedUser)
	{
		oSystem_UserManagement.SelectUser(selectedUser);
		return true;
	}
	
	this.oUserFilter.show();
	
	
	this.element_UserSelected = oScreenBuffer.Get("userManagement_UserSelected");

	this.element_tabs = oScreenBuffer.Get("userManagement_tab");

	this.tabs = new system_tabManager(this.element_tabs);
	
	this.tabs.addTab(0, "Details", false, SetupUserAccountPage, ShowUserAccountPage);
	this.tabs.addTab(1, "Rights", false, SetupRightsPage, ShowRightsPage);
	this.tabs.addTab(2, "Groups", false, SetupRightGroupPage, ShowRightGroupPage);
	this.tabs.addTab(3, "Assigned", true, SetupAssignedRightsPage, ShowAssignedRightsPage);
	
	return true;
}

function SetupAssignedRightsPage(element_root)
{
	oSystem_UserManagement.SetupAssignedRightsPage(element_root);
}
function ShowAssignedRightsPage()
{
	oSystem_UserManagement.ShowAssignedRightsPage();
}

function SetupRightGroupPage(element_root)
{
	oSystem_UserManagement.SetupRightGroupPage(element_root);
}
function ShowRightGroupPage()
{
	oSystem_UserManagement.ShowRightGroupPage();
}
function SetupRightsPage(element_root)
{
	oSystem_UserManagement.SetupRightsPage(element_root);
}
function ShowRightsPage()
{
	oSystem_UserManagement.ShowRightsPage();
}
function ShowUserAccountPage()
{
	oSystem_UserManagement.ShowAccountPage();
}
function SetupUserAccountPage(element_root)
{
	oSystem_UserManagement.SetupAccountPage(element_root);
}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oSystem_UserManagement.SetupAssignedRightsPage = function(element_root)
{
	element_screen = oScreenBuffer.Get("userManagement_AssignedTable");
	element_screen.style.position = "relative";

	element_root.appendChild(element_screen);


	//	Create the results table
	this.oAssignedTable = new system_SortTable();
	this.oAssignedTable.setName("userManagement_AssignedTable");

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
oSystem_UserManagement.ShowAssignedRightsPage = function()
{

	oAllAssignedRightsList = new system_list("aRight_ID", "right_Name", "get_all_access_rights_list");
	oAllAssignedRightsList.serverURL = strSystemAccessURL;
	oAllAssignedRightsList.addParam("id", this.arUser.user_ID);
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
oSystem_UserManagement.SetupAccountPage = function(element_root)
{

	this.element_DetailsScreen = oScreenBuffer.Get("userManagement_DetailScreen");

	element_root.appendChild(this.element_DetailsScreen);
	
	this.element_ActiveCheck = oScreenBuffer.Get("userManagement_Active");
	this.element_Submit = oScreenBuffer.Get("userManagement_Submit");
	this.element_Organization = oScreenBuffer.Get("userManagement_Organization");
	this.element_EMail = oScreenBuffer.Get("userManagement_Email");
	
	this.element_Starbase = oScreenBuffer.Get("userManagement_starbase");
	
	this.element_Starbase.userName = "";

	this.element_Starbase.onclick = function()
	{
		GetUserDetails(this.userName);
	}
	
	this.element_ActiveCheck.onclick = function()
	{
		oSystem_UserManagement.EnableFields(this.checked);

		if(this.checked == false)
		{
			alert("Disabling an account will move it to the AFU organization and remove all rights.");
		}
	}
	
	this.element_Submit.onclick = function()
	{
		oSystem_UserManagement.submitAccount();
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oSystem_UserManagement.SetupRightsPage = function(element_root)
{
	this.element_AddRightBox = oScreenBuffer.Get("userManagement_AddRightBox");
	element_root.appendChild(this.element_AddRightBox);

	this.element_AddRightList = oScreenBuffer.Get("userManagement_AddRightList");
	this.element_OrgList = oScreenBuffer.Get("userManagement_OrgList");
	this.element_OrgText = oScreenBuffer.Get("userManagement_OrgText");
		
	//	Create the results table
	this.oRightsTable = new system_SortTable();
	this.oRightsTable.setName("userManagement_RightsTable");

	/*
		Now assign actions to changing the right list
		and the org list
	*/
	this.element_AddRightList.onchange = function ()
	{
		oSystem_UserManagement.FilterRight(this.value);
	}
	
	this.element_OrgList.onchange = function ()
	{
		oSystem_UserManagement.FilterOrg(this.value);
	}

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
	
	/*
		Fill out the custom display function for
		the assigned rights
	*/
		
	this.oRightsTable.custom_element = function(i)
	{
		var element_Row = appendChild(this.element_body, "TR");

		oSystem_Colors.SetPrimary(element_Row);

		var element_Col1 = appendChild(element_Row, "TD");
		
		element_Col1.title = this.list[i].right_Description;
		/*
			The first column. Set the text for the element
		*/
		element_Col1Text = appendChild(element_Col1, "SPAN");
		
		screen_SetTextElement(element_Col1Text, this.list[i].right_Name);
		element_Col1Text.style.paddingLeft = "6px";
		element_Col1Text.style.fontWeight = "bold";

		appendChild(element_Col1, "BR");

		element_Col1Desc = appendChild(element_Col1, "SPAN");
		
		screen_SetTextElement(element_Col1Desc, this.list[i].right_Description);
		element_Col1Desc.style.fontSize="80%";
		element_Col1Desc.style.paddingLeft = "6px";
		
		var element_Col2 = appendChild(element_Row, "TD");
		
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
		
		var element_Col2 = appendChild(element_Row, "TD");

		if(this.list[i].may_assign == "1")
		{
			element_DeleteLink = appendChild(element_Col2, "SPAN");
			element_DeleteLink.right_id = this.list[i].aRight_ID;
			element_DeleteLink.className = "link";
			element_DeleteLink.title = "Remove this right";
			element_DeleteLink.style.vAlign="top";
			element_DeleteLink.style.paddingLeft="10px";

			element_ColDelete = appendChild(element_DeleteLink, "IMG");
			element_ColDelete.className = "link";
			element_ColDelete.src = "../image/b_drop.gif";
			
			element_DeleteLink.onclick = function()
			{
				oSystem_UserManagement.RemoveRight(this.right_id);
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
oSystem_UserManagement.SetupRightGroupPage = function (element_root)
{

	this.element_GroupBox = oScreenBuffer.Get("userManagement_GroupBox");
	element_root.appendChild(this.element_GroupBox);
	
	//	Create the results table
	this.oGroupsTable = new system_SortTable();
	this.oGroupsTable.setName("userManagement_GroupTable");

	this.element_GroupList = oScreenBuffer.Get("userManagement_GroupList");

	/*
		Now assign actions to changing the right list
		and the org list
	*/
	this.element_GroupList.onchange = function ()
	{
		oSystem_UserManagement.SelectGroup(this.value);
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
				oSystem_UserManagement.RemoveGroup(this.right_id);
			}
		}
	}
}
/*
	RemoveRight
	-	remove a right from a user
	-	pass to the server the assigned right id
*/
oSystem_UserManagement.RemoveRight = function (assigned_ID)
{
	if(!confirm("Are you sure you wish to remove this right?"))
	{
		return;
	}

	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	var responseText = oRights.RemoveAssignedRight(assigned_ID);

	if(!oCatenaApp.showResults(responseText))
	{
		return false;
	}
	
	this.ShowRightsPage();
	return true;
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
oSystem_UserManagement.SelectGroup = function (strGroup)
{
	if(strGroup.length)
	{
		this.AssignGroup();
	}
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
oSystem_UserManagement.AssignGroup = function ()
{
	var responseText = oRights.AssignUserGroup(this.arUser.user_Name, this.element_GroupList.value);

	if(!oCatenaApp.showResults(responseText))
	{
		return false;
	}

	this.ShowRightGroupPage();	

	return true;
}
/*--------------------------------------------------------------------------
	-	description
			RemoveRight
				pass to the server the assigned group id which is to be
				removed from the user account
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_UserManagement.RemoveGroup = function (assigned_ID)
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
/*--------------------------------------------------------------------------
	-	description
			Filter the right
			The user has chosen a right.
			See if the right requires an organization
			and display the org list if so.
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_UserManagement.FilterRight = function (strRight)
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
			oUserRightsList.fillOrgControl(this.element_OrgList, strRight, true);
			ShowInheritElement(this.element_OrgList);
			ShowInheritElement(this.element_OrgText);
		}
		else
		{
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
		HideElement(this.element_OrgText);
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
oSystem_UserManagement.FilterOrg = function (strOrgName)
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
/*
	Assigns a right to a user
	-	Pass to the server the name of the user
	-	Pass to the server the name of the right
	-	The server side checks that the logged in user
		has the correct right so we don't worry about that client side
*/
oSystem_UserManagement.AssignRight = function ()
{
	userName = this.arUser.user_Name;
	rightName = this.element_AddRightList.value;
	rightOrg = this.element_OrgList.value;

	responseText = oRights.AssignUserRight(userName, rightName, rightOrg)

	if(!oCatenaApp.showResults(responseText))
	{
		return false;
	}
	
	this.ShowRightsPage();

	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oSystem_UserManagement.ShowRightsPage = function()
{
	if(this.arUser == null)
	{
		return false;
	}

	oRights.load();
	oUserRightsList.load();
	
	oUserRightsList.element_name = this.element_AddRightList;
	oUserRightsList.bAddBlank = true;
	oUserRightsList.fillSelect();
	
	HideElement(this.element_OrgList);
	HideElement(this.element_OrgText);
	
	this.LoadAssignedRights(this.arUser.user_Name);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oSystem_UserManagement.ShowRightGroupPage = function()
{
	this.oRightGroupsList.load();
	this.oRightGroupsList.fillControl(this.element_GroupList, true);
	this.LoadAssignedGroups(this.arUser.user_Name);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oSystem_UserManagement.ShowAccountPage = function()
{
	if(this.arUser)
	{
		oRights.loadOrgs(oRights.SYSTEM_RightsAdmin);
		arOrg = oRights.oOrgList.get("Guest");
		oGuestOrgList = new system_OrgList();

		if(arOrg == null)
		{
			oGuestOrgList.addParam("name", "Guest");
			oGuestOrgList.load();
			arOrg = oGuestOrgList.get("Guest");
			oRights.oOrgList.addElement(arOrg.org_ID, arOrg.org_Short_Name, arOrg.org_Short_Name);
		}
	
		arOrg = oRights.oOrgList.get("AFU");
		
		if(arOrg == null)
		{
			oGuestOrgList.addParam("name", "AFU");
			oGuestOrgList.load();
			arOrg = oGuestOrgList.get("AFU");
			oRights.oOrgList.addElement(arOrg.org_ID, arOrg.org_Short_Name, arOrg.org_Short_Name);
		}
	
		oRights.oOrgList.fillControl(this.element_Organization, false);
		
		orgId = oRights.oOrgList.getId(this.arUser.org_Short_Name);
		this.EnableFields(this.arUser.user_Active);
		
		if(orgId > 0)
		{
			this.enableForm(true);
			this.element_Organization.value = userOrg;
		}
		else
		{
			this.enableForm(false);
			this.element_Organization.value = "";
		}
		
		this.element_EMail.value = this.arUser.user_EMail;
		
		this.element_Starbase.userName = this.arUser.user_Name;
		
	}
}
/*--------------------------------------------------------------------------
	-	description
		Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_UserManagement.LoadAssignedGroups = function(strUser)
{
	oAssignedGroupsList = new system_list("aRight_ID", "rightGroup_Name", "get_user_groups_list");
	oAssignedGroupsList.serverURL = strSystemAccessURL;
	oAssignedGroupsList.addParam("user", strUser);
	oAssignedGroupsList.load();

	this.oGroupsTable.list = oAssignedGroupsList.list;
	this.oGroupsTable.Display();
	
	oAssignedGroupsList = null;
	
}
/*--------------------------------------------------------------------------
	-	description
			Retrieve the rights from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_UserManagement.LoadAssignedRights = function(userName)
{
	this.serverValues = null;
	this.serverValues = new Object();
	
	this.serverValues.user = userName;
	this.serverValues.location = strSystemAccessURL;
	this.serverValues.action = "get_user_rights_list";

	server.callASync(this.serverValues, RightsAdminParse);

	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Needed for the function call wrapper called in RetreiveRights
	-	params
	-	return
--------------------------------------------------------------------------*/
function RightsAdminParse(strResults)
{
	oSystem_UserManagement.ParseRights(strResults);
}
/*--------------------------------------------------------------------------
	-	description
		Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_UserManagement.ParseRights = function(strResults)
{
	this.oRightsTable.SetList(strResults);
	this.oRightsTable.Display();
}
/*--------------------------------------------------------------------------
	-	description
			Sumbits a request for an add, modify, or removal
			activePage is the page which currently has focus when
			the user clicks submit
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_UserManagement.submitAccount = function()
{
	bDirty = false;	//	Flag to determine if a change was made to the account
	
	bResult = "";	//	set default to a string.
					//	if one of the sections changes it,
					//	then it'll be converted to true/faluse
					//	then we don't display an error message
	
	if(!this.arUser)
	{
		return false;
	}	
	
	var serverValues = Object();
	serverValues.user = this.arUser.user_Name;
	serverValues.location = strUserURL;

	/*
		First, enable the account if it needs it.
		Then change the organization if it needs it
	*/

	bChangeOrg = (this.arUser.org_Short_Name != this.element_Organization.value);
	bChangeEmail = (this.arUser.user_EMail != this.element_EMail.value);
	bChangeActive = (this.arUser.user_Active != this.element_ActiveCheck.checked);

	if(bChangeActive == true)
	{
		serverValues.active = this.element_ActiveCheck.checked;
		serverValues.action = "setactive";
		responseText = server.callSync(serverValues);
		
		if(!oCatenaApp.showResults(responseText))
		{
			this.SelectUser(this.arUser.user_Name);
			return true;
		}
		
		/*
			If we disabled the active state, then don't change the organization
			or anything else.
		*/
		if(this.element_ActiveCheck.checked == false)
		{
			this.SelectUser(this.arUser.user_Name);
			return true;
		}			
		
		bDirty = true;
	}
	
	if(bChangeEmail == true)
	{
		this.SetEMail();
		bDirty = true;
	}

	if(bChangeOrg == true)
	{
		this.SetOrganization();
		bDirty = true;
	}

	if(bDirty == false)
	{
		oCatenaApp.showNotice(notice_Error, "No changes made.");
	}

	this.SelectUser(this.arUser.user_Name);
	
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oSystem_UserManagement.SetOrganization = function()
{
	var serverValues = Object();
	serverValues.user = this.arUser.user_Name;
	serverValues.location = strUserURL;

	serverValues.organization = this.element_Organization.value;
	serverValues.action = "setorganization";
	responseText = server.callSync(serverValues);

	return oCatenaApp.showResults(responseText);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oSystem_UserManagement.SetEMail = function()
{
	var serverValues = Object();

	serverValues.user = this.arUser.user_Name;
	serverValues.location = strUserURL;
	serverValues.email = this.element_EMail.value;
	serverValues.action = "setemail";

	responseText = server.callSync(serverValues);

	return oCatenaApp.showResults(responseText);
}
/*
	Select user is called when the oUserFilter has a name selected
	or unselected.
*/
oSystem_UserManagement.SelectUser = function(userName)
{
	/*
		-	tell the user which user account they selected
			via the text box to the right of the user name drop down list
		-	Populate the individual rights fields with the accounts
			assigned and available rights.
	*/
	if(userName)
	{
		oSystem_Debug.notice("Selected user: " + userName);
		if(userName.length)
		{
			oSystem_Debug.notice(userName);
			
			var oUsers = new system_UserList();
			
			oUsers.addParam("inactive", true);
			oUsers.addParam("name", userName);
			oUsers.load();
			
			this.arUser = oUsers.get(userName);
			
			if(this.arUser)
			{
				oSystem_Debug.notice("Setting up user");
				userOrg = this.arUser.org_Short_Name;
				screen_SetTextElement(this.element_UserSelected, userName + " (" + userOrg + ")");
				ShowInheritElement(this.element_tabs);
				this.tabs.show();
			}
			
			oUsers = null;
			ShowInheritElement(this.element_Organization);

		}
	}
	else
	{
		oSystem_Debug.notice("Clearing user account");
		this.arUser = null;
		screen_SetTextElement(this.element_UserSelected, "");
		HideElement(this.element_tabs);
		HideElement(this.element_Organization);
	}

}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oSystem_UserManagement.enableForm = function(toggle)
{
	this.element_ActiveCheck.disabled = !toggle;
	this.element_Submit.disabled = !toggle;
	this.element_Organization.disabled = true;

	if(toggle == 1)
	{
		if(this.element_ActiveCheck.checked == true)
		{
			this.element_Organization.disabled = false;
		}
	}
}
/*--------------------------------------------------------------------------
	-	description
			Disable or enable user account fields
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_UserManagement.EnableFields = function(toggle)
{
	if(toggle == 1)
	{
		this.element_ActiveCheck.checked = true;
		this.element_Organization.disabled = false;
		this.element_EMail.disabled = false;

	}
	else
	{
		this.element_ActiveCheck.checked = false;
		this.element_Organization.disabled = true;
		this.element_EMail.disabled = true;
	}
}

oSystem_UserManagement.register();