/*
	purpose:
		Assign rights to right groups via a GUI.
*/
var oRightsAdmin = new system_AppScreen();

oRightsAdmin.screen_Name = "rights_Admin";		//	The name of the screen or page. Also the name of the XML data file
oRightsAdmin.screen_Menu = "System Rights";		//	The name of the menu item which corapsponds to this item
oRightsAdmin.module_Name = "framework";
oRightsAdmin.selectedRight = "";

/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
oRightsAdmin.custom_Show = function()
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
oRightsAdmin.LoadLists = function()
{
	oRights.load();
	oRights.fillControl(this.element_Rights, true);	
	this.SelectRight("");
	return true;	
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
			true if load was successful.
			false otherwise.
--------------------------------------------------------------------------*/
oRightsAdmin.custom_Load = function()
{
	this.element_AddNew = oScreenBuffer.Get("rightsAdmin_AddNew");
	this.element_Rights = oScreenBuffer.Get("rightsAdmin_List");
	
	this.element_Rights.onchange = function()
	{
		oRightsAdmin.SelectRight(this.value);
	}

	HideElement(this.element_AddNew);
	
	/*
		Create the popup for adding a new right
	*/
	//this.oCreateRight = new right_Create();
	/*
		The reason we call this function is because it
		is called when a new right group is submitted and the
		right group list needs to be refreshed.
	*/
	/*
	this.oCreateRight.custom_submit = function()
	{
		oRightsAdmin.LoadLists();
	}
	*/

	this.element_tabs = oScreenBuffer.Get("rightsAdmin_tab");

	this.tabs = new system_tabManager(this.element_tabs);
	
	this.tabs.addTab(0, "Details", false, SetupRightsDetailsPage, ShowRightsDetailsPage);
	this.tabs.addTab(3, "Assigned", false, SetupRightsAssignedPage, ShowRightsAssignedPage);
	
	return true;
}
function SetupRightsDetailsPage(element_root)
{
	oRightsAdmin.SetupDetailsPage(element_root);
}
function ShowRightsDetailsPage()
{
	oRightsAdmin.ShowDetailsPage();
}

function SetupRightsAssignedPage(element_root)
{
	oRightsAdmin.SetupRightsAssignedPage(element_root);
}
function ShowRightsAssignedPage()
{
	oRightsAdmin.ShowRightsAssignedPage();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRightsAdmin.SetupRightsAssignedPage = function(element_root)
{
	element_screen = oScreenBuffer.Get("rightsAdmin_AssignedTable");
	element_screen.style.position = "relative";

	element_root.appendChild(element_screen);


	//	Create the results table
	this.oAssignedTable = new system_SortTable();
	this.oAssignedTable.setName("rightsAdmin_AssignedTable");

	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "User";
		
	this.oAssignedTable.SetHeader(arHeader);
	this.oAssignedTable.SetCaption("");
	this.oAssignedTable.show();
	this.oAssignedTable.Display();

	this.oAssignedTable.custom_element = display_AssignedUser;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function display_AssignedUser(i)
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

	var element_Col1 = appendChild(element_Row, "TD");
	
	element_text = document.createElement("SPAN");
	element_text.style.fontWeight = "bold";
	
	element_Col1.appendChild(screen_CreateUserLink(this.list[i].user_Name));
	
	element_Col1.appendChild(element_text);
	
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRightsAdmin.ShowRightsAssignedPage = function()
{

	oAllAssignedRightsList = new system_list("user_ID", "user_Name", "get_users_assigned_right");
	oAllAssignedRightsList.serverURL = strSystemAccessURL;
	oAllAssignedRightsList.addParam("right", this.selectedRight);
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
oRightsAdmin.ShowRightsPage = function()
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
oRightsAdmin.SetupRightsPage = function(element_root)
{
	this.element_RightsBox = oScreenBuffer.Get("rightsAdmin_RightsBox");
	element_root.appendChild(this.element_RightsBox);

	this.oRightsTable = new system_SortTable();
	this.oRightsTable.setName("rightsAdmin_RightsTable");

	this.oRightsTable.custom_display = oRightsAdmin_Table_display;

	this.element_OrgList = oScreenBuffer.Get("rightsAdmin_OrgList");

	this.element_OrgList.onclick = function ()
	{
		if(this.value != oRightsAdmin.selectedOrg)
		{
			oRightsAdmin.SelectOrg(this.value);
		}
	}
		
	this.element_RightsList = oScreenBuffer.Get("rightsAdmin_RightList");

	this.element_RightsList.onclick = function ()
	{
		oRightsAdmin.SelectRight(this.value);
	}
	
	this.element_RightOrgList = oScreenBuffer.Get("rightsAdmin_RightOrgList");

	this.element_RightOrgList.onchange = function ()
	{
		oRightsAdmin.SelectRightOrg(this.value);
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
oRightsAdmin.ShowDetailsPage = function(element_root)
{
	this.FillModify();
	this.EnableModify(false);

}	
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRightsAdmin.SetupDetailsPage = function(element_root)
{

	this.element_DetailsBox = oScreenBuffer.Get("rightsAdmin_DetailsBox");
	element_root.appendChild(this.element_DetailsBox);

	this.element_modifyName = oScreenBuffer.Get("rightsAdmin_ModifyName");
	this.element_modifyDescription = oScreenBuffer.Get("rightsAdmin_ModifyDescription");
	this.element_modifyCategory = oScreenBuffer.Get("rightsAdmin_ModifyCategory");

	this.element_enableModify = oScreenBuffer.Get("rightsAdmin_ModifyButton");
	this.element_submitModify = oScreenBuffer.Get("rightsAdmin_SubmitModifyButton");
	this.element_cancelModify = oScreenBuffer.Get("rightsAdmin_CancelModifyButton");


	this.element_modifyName.disabled = true;

	this.element_cancelModify.onclick = function ()
	{
		oRightsAdmin.CancelModify();
	}

	this.element_enableModify.onclick = function ()
	{
		oRightsAdmin.EnableModify(true);
	}

	this.element_submitModify.onclick = function ()
	{
		oRightsAdmin.ModifySubmit();
	}
	
	this.element_AddNew.onclick = function()
	{
		oRightsAdmin.AddNew();
	}
}
/*--------------------------------------------------------------------------
	-	description
		Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oRightsAdmin.LoadAssignedGroups = function(strOrg)
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
oRightsAdmin_Table_display = function()
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
				oRightsAdmin.RemoveRight(this.right_id);
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
oRightsAdmin.CancelModify = function()
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
oRightsAdmin.ModifySubmit = function()
{
	var serverValues = Object();

	serverValues.name = this.element_modifyName.value;
	serverValues.description = this.element_modifyDescription.value;
	serverValues.category = this.element_modifyCategory.value;
	serverValues.location = strRightsURL;
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
	
	this.element_Rights.value = serverValues.name;
	this.element_Rights.onchange();
	
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRightsAdmin.AddNew = function()
{
	//this.oCreateRight.show();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRightsAdmin.Modify = function()
{
	oSystem_Debug.notice(this.element_OrgList.value);
}
/*--------------------------------------------------------------------------
	-	description
			Retrieve the rights assigned to this group
	-	params
			The name of the group
	-	return
			none
--------------------------------------------------------------------------*/
oRightsAdmin.LoadAssignedRights = function(orgName)
{
	this.serverValues = null;
	this.serverValues = Object();
	
	this.serverValues.organization = orgName;
	this.serverValues.location = strSystemAccessURL;
	this.serverValues.action = "get_org_rights_list";

	responseText = server.callASync(this.serverValues, RightsAdminParse);
}
/*--------------------------------------------------------------------------
	-	description
			Needed for the function call wrapper called in RetreiveRights
	-	params
	-	return
--------------------------------------------------------------------------*/
function RightsAdminParse(strResults)
{
	oRightsAdmin.ParseRights(strResults);
}
/*--------------------------------------------------------------------------
	-	description
		Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oRightsAdmin.ParseRights = function(strResults)
{
	this.oRightsTable.SetList(strResults);
	this.oRightsTable.Display();
}
/*--------------------------------------------------------------------------
	-	description
			Filter the org
			The user has chosen an organization
			in the drop down list for adding a right
	-	params
	-	return
--------------------------------------------------------------------------*/
oRightsAdmin.SelectRightOrg = function (strOrgName)
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
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRightsAdmin.FillModify = function()
{
	strRight = this.selectedRight;
	
	oRightCategoryList.load();
	oRightCategoryList.fillControl(this.element_modifyCategory);
	
	oSystem_Debug.notice("Selected for fill modify: " + this.selectedRight);
	
	arRight = oRights.get(this.selectedRight);
	this.element_modifyName.value = arRight.right_Name;
	this.element_modifyDescription.value = arRight.right_Description;
	this.element_modifyCategory.value = oRightCategoryList.getName(arRight.rightCat_ID);
	this.modifyId = arRight.right_ID;

	oSystem_Debug.notice("Category name: " + arRight.rightCat_ID);
	oSystem_Debug.notice("Category name: " + oRightCategoryList.getName(arRight.rightCat_ID));

	
	oSystem_Debug.notice("Record name: " + arRight.right_Name);

}
//--------------------------------------------------------------------------
/**
	\brief
		Enable or disable the modify fields.
	\param
	\return
*/
//--------------------------------------------------------------------------
oRightsAdmin.EnableModify = function(toggle)
{
	this.element_modifyDescription.disabled = !toggle;
	this.element_modifyCategory.disabled = !toggle;
	
	if(toggle == true)
	{
		HideElement(this.element_enableModify);
		ShowInheritElement(this.element_submitModify);
		ShowInheritElement(this.element_cancelModify);
	}
	else
	{
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
oRightsAdmin.SelectRight = function(strRight)
{
	/*
		-	tell the user which user account they selected
			via the text box to the right of the user name drop down list
		-	Populate the individual rights fields with the accounts
			assigned and available rights.
	*/
	if(strRight)
	{
		this.selectedRight = strRight;
		ShowInheritElement(this.element_tabs);
		this.tabs.show();
	}
	else
	{
		this.strRight = "";
		HideElement(this.element_tabs);
	}
}

oRightsAdmin.register();