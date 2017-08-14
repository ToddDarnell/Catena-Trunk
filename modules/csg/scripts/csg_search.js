/*
	The purpose of this file is to manage searching for receivers.
*/

oCSG_StatusList = new system_list("status_ID", "status_Name",  "getstatus_list");
oCSG_StatusList.serverURL = strCSG_URL;

strCSGSearchScreen = "CSG Search";

oCSG_Search = new system_SearchScreen();

oCSG_Search.screen_Menu = strCSGSearchScreen;
oCSG_Search.screen_Name = "csg_Search";
oCSG_Search.search_List	= "gettransactionlist";
oCSG_Search.search_URL = strCSG_URL;
oCSG_Search.module_Name = "csg";


/*--------------------------------------------------------------------------
	Override the parsing functionality of the search screen
	table.
--------------------------------------------------------------------------*/
oCSG_Search.oResults.ParseXML = function (oXML)
{
	return ParseCSGXML(oXML);
}

/*--------------------------------------------------------------------------
	Custom clear allows a developer to add custom functionality
	to clear elements which are not part of the base class but
	must be cleared.
--------------------------------------------------------------------------*/
oCSG_Search.custom_Clear = function()
{
	oScreenBuffer.Get("csgSearch_Transaction").value = "";
	oScreenBuffer.Get("csgSearch_Receiver").value = "";
	oScreenBuffer.Get("csgSearch_SmartCard").value = "";
	oScreenBuffer.Get("csgSearch_StatusList").value = "";
	this.oUserFilter.clear();
	this.oOrgFilter.clear();
	this.SelectOrg("");
	this.SelectUser("");
}
/*--------------------------------------------------------------------------
	fnProcess is called once the data has been received
	from the server. Since we have to use a stand alone
	function due to the way JavaScript treats functions
	we're creating a wrapper call back function.
--------------------------------------------------------------------------*/
oCSG_Search.fnProcess = function(strResults)
{
	oCSG_Search.ProcessResults(strResults);
}
/*--------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
--------------------------------------------------------------------------*/
oCSG_Search.custom_Show = function()
{
}
/*--------------------------------------------------------------------------
	custom load sets the values for the header list
--------------------------------------------------------------------------*/
oCSG_Search.custom_Load = function()
{
	this.element_UserSelected = oScreenBuffer.Get("csgSearch_SelectedUser");
	this.element_StatusList = oScreenBuffer.Get("csgSearch_StatusList");

	this.oUserFilter = new system_UserOrgSelection();
	this.oUserFilter.load("CSGSearchBox", "csgSearch_UserPopup", eDisplayUserList);

	this.oUserFilter.setLocation(20, 130);
	this.oUserFilter.custom_submit = function (selectedUser)
	{
		oCSG_Search.SelectUser(selectedUser);
		return true;
	}
	
	this.element_OrgSelected = oScreenBuffer.Get("csgSearch_SelectedOrg");

	this.oOrgFilter = new system_UserOrgSelection();
	this.oOrgFilter.load("CSGSearchBox", "csgSearch_OrgPopup", eDisplayOrgList);
	
	this.oOrgFilter.setLocation(260, 130);
	this.oOrgFilter.custom_submit = function (selectedOrg)
	{
		oCSG_Search.SelectOrg(selectedOrg);
		return true;
	}

	this.element_UserInput = oScreenBuffer.Get("csgSearch_User");
	this.element_OrgInput = oScreenBuffer.Get("csgSearch_Org");

	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Request";
		arHeader[0].width = "12%";
		arHeader[0].sort = true;
		arHeader[0].fieldName = "id";
		arHeader[0].dataType = "number";
	arHeader[1] = Object();
		arHeader[1].text = "Receiver";
		arHeader[1].fieldName = "msg_subject";
		arHeader[1].width = "22%";
		arHeader[1].tip = "Request receiver number. Highlight receiver number to see smart card number";
	arHeader[2] = Object();
		arHeader[2].text = "Auth";
		arHeader[2].tip = "(B)asic, (A)pps and authorization detail note";
		arHeader[2].fieldName = "msg_create_date";
	arHeader[3] = Object();
		arHeader[3].text = "Details";
		arHeader[3].width = "15%";

    this.oResults.SetHeader(arHeader);
    
    this.oResults.SetCaption("Results");
    this.oResults.custom_element = CSGTransactions_DisplayResults;
    this.oResults.pageLength = 10;
    
    oCSG_StatusList.load();
    oCSG_StatusList.field_ToolTip = "status_Description";
    
    oCSG_StatusList.fillControl(this.element_StatusList, true);
    
    
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Filter Organizaton takes the value from the
			organization field and filters the user names
			by that organization
	-	params
	-	return
--------------------------------------------------------------------------*/
oCSG_Search.SelectOrg = function(userOrg)
{ 
	if(userOrg)
	{
		this.element_OrgInput.value = userOrg;
		screen_SetTextElement(this.element_OrgSelected, userOrg);
	}
	else
	{
		this.element_OrgInput.value = "";
		screen_SetTextElement(this.element_OrgSelected, "");
	}
}

//--------------------------------------------------------------------------
/**
	\brief
		Select User is called when the oUserFilter has a name selected or 
		unselected in the user field
	\param userName
		userName is the selected user
	\return
		none
*/
//--------------------------------------------------------------------------
oCSG_Search.SelectUser = function(userName)
{
	if(userName)
	{
		var oUsers = new system_UserList();
		oUsers.addParam("name", userName);
		oUsers.load();
		user_record = oUsers.get(userName);
		userOrg = user_record.org_Short_Name;

		this.element_UserInput.value = userName;
		screen_SetTextElement(this.element_UserSelected, userName + " (" + userOrg + ")");
	}
	else
	{
		this.element_UserInput.value = "";
		screen_SetTextElement(this.element_UserSelected, "");
	}
}
/*--------------------------------------------------------------------------
	Process the results we receive back from the server
--------------------------------------------------------------------------*/
function CSGTransactions_DisplayResults(listPosition)
{
	i = listPosition;
	/*
		Some details we'll use several times throughout
		this loop. Shortened names for clarity
	*/
	strStatus =  this.list[i].status_Name;
	transId = this.list[i].id;
	
	var element_Row = document.createElement("TR");
	element_Row.align = "center";
	element_Row.vAlign = "top";
	this.element_body.appendChild(element_Row);

	oSystem_Colors.SetPrimary(element_Row);
	
	if(i % 2 == 1)
	{
		oSystem_Colors.SetSecondaryBackground(element_Row);
	}
	else
	{
		oSystem_Colors.SetTertiaryBackground(element_Row);
	}

	var element_Col1 = document.createElement("TD");
	element_Row.appendChild(element_Col1);
	screen_SetTextElement(element_Col1, transId);

	/*
		Set up the receiver and smart card columns
	*/
	var element_Col2 = document.createElement("TD");
	element_Row.appendChild(element_Col2);
	
	var element_Col3 = document.createElement("TD");
	element_Row.appendChild(element_Col3);
	
	/*
		Cycle through the receiver details and display them for the user
	*/
	for(iRec = 0; iRec < this.list[i].requestItems.length; iRec++)
	{
		strReceiver = formatReceiver(this.list[i].requestItems[iRec].transtype_Receiver);
		element_Col2.appendChild(document.createTextNode(strReceiver));
		element_Col2.appendChild(document.createElement("BR"));
		strText = formatSmartcard(this.list[i].requestItems[iRec].transtype_SmartCard);

		text_link = ["", strText];
		SetToolTip(element_Col2, text_link);

		strBasic = this.list[i].requestItems[iRec].transtype_BasicAuth;
		strDisplay = "";
		
		if(strBasic == "1")
		{
			strDisplay = strDisplay + "(B)";
		}
		strApp = this.list[i].requestItems[iRec].transtype_AppsAuth;

		if(strApp == "1")
		{
			strDisplay = strDisplay + "(A)";
		}
		
		strDetails = this.list[i].requestItems[iRec].transtype_Details;
		
		strDisplay = strDisplay + strDetails;
		
		element_Span = document.createElement("DIV");
		element_Span.style.overflow = "hidden";
		element_Span.style.width = "200px";
		element_Span.style.height = "20px";
		element_Span.appendChild(document.createTextNode(strDisplay));
		element_Span.style.paddingLeft="5px";
				
		text_link = ["", strDetails];
		SetToolTip(element_Span, text_link);
	
		

		element_Col3.appendChild(element_Span);
		element_Col3.align = "left";
	}
	
	/*
		Set up the details link
	*/
	var element_Col4 = document.createElement("TD");
	element_Row.appendChild(element_Col4);

	element_Details = screen_CreateGraphicLink("icon_info.gif", "View request details");
	element_Details.style.paddingRight="10px";
	element_Details.requestId = transId;
	element_Details.onclick = function()
	{
		oCSG_RequestDetails.display(this.requestId, oCSG_Search.screen_Menu);
	}

	element_Col4.appendChild(element_Details);
	
}


oCSG_Search.register();