/*
	purpose:
		Displays the assigned rights for the logged in user.
*/
var oRights_Assigned = new system_AppScreen();

oRights_Assigned.screen_Name = "rights_Assigned";			//	The name of the screen or page. Also the name of the XML data file
oRights_Assigned.screen_Menu ="View Rights";			//	The name of the menu item which corapsponds to this item
oRights_Assigned.module_Name = "framework";

/*--------------------------------------------------------------------------
	-	description  
	-	params
	-	return
--------------------------------------------------------------------------*/
oRights_Assigned.custom_Show = function()
{
	this.SelectUser();
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Loads the rights table, sets the submit functionality.
	-	params
	-	return
--------------------------------------------------------------------------*/
oRights_Assigned.custom_Load = function()
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
	
	this.oAssignedTable.custom_element = display_rightElement;
	

    this.oModules = new system_SortTable();
    this.oModules.setName("userRightsAssigned_ModulesTable");

	arHeader = null;
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Module";
		arHeader[0].width = "45%";

	this.oModules.SetHeader(arHeader);
	this.oModules.SetCaption("Available Modules");

	this.oModules.custom_element = display_userModules;
	
	return true;
}

function display_rightElement(i)
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
	
	element_text.appendChild(document.createTextNode(this.list[i].right_Name));
	
	element_Col1.appendChild(element_text);
	appendChild(element_Col1, "BR");

	element_Col1Desc = document.createElement("SPAN");
	element_Col1.appendChild(element_Col1Desc);
	screen_SetTextElement(element_Col1Desc, this.list[i].right_Description);
	element_Col1Desc.style.fontSize="80%";
	element_Col1Desc.style.paddingLeft = "6px";


	var element_Col2 = appendChild(element_Row, "TD");
	
	element_Col2.appendChild(screen_CreateOrganizationLink(this.list[i].org_Short_Name));

	var element_Col3 = appendChild(element_Row, "TD");
	element_Col3.appendChild(document.createTextNode(this.list[i].source));
}
function display_userModules(i)
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
	
	element_text.appendChild(document.createTextNode(this.list[i].module_Name));
	
	element_Col1.appendChild(element_text);
	appendChild(element_Col1, "BR");

	element_Col1Desc = document.createElement("SPAN");
	element_Col1.appendChild(element_Col1Desc);
	screen_SetTextElement(element_Col1Desc, this.list[i].module_Description);
	element_Col1Desc.style.fontSize="80%";
	element_Col1Desc.style.paddingLeft = "6px";

}
/*--------------------------------------------------------------------------
	-	description
			Needed for the function call wrapper called in RetreiveRights
	-	params
	-	return
--------------------------------------------------------------------------*/
function RightsAssignedParse(strResults)
{
	oRights_Assigned.ParseRights(strResults);
}
function ModulesAvailable(strResults)
{
	oRights_Assigned.ParseModules(strResults);
}
/*--------------------------------------------------------------------------
	-	description
		Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oRights_Assigned.ParseRights = function(strResults)
{
	this.oAssignedTable.SetList(strResults);

	sortList = new system_list("", "right_Name", "");
	
	sortList.list = this.oAssignedTable.list;
	
	sortList.sort();
	
	this.oAssignedTable.Display();
}
oRights_Assigned.ParseModules = function(strResults)
{
	this.oModules.SetList(strResults);
	this.oModules.Display();
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
oRights_Assigned.SelectUser = function()
{
	this.serverValues = null;
	this.serverValues = new Object();
	
	this.serverValues.id = oUser.user_ID;
	this.serverValues.location = strSystemAccessURL;
	this.serverValues.action = "get_all_access_rights_list";

	server.callASync(this.serverValues, RightsAssignedParse);


	serverValues = null;
	serverValues = new Object();
	
	serverValues.action = "modulelist";
	serverValues.location = strModulesURL;

	server.callASync(serverValues, ModulesAvailable);


	this.oAssignedTable.show();
	this.oModules.show();
}

oRights_Assigned.register();