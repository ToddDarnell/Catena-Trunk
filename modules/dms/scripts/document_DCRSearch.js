/*
	The purpose of this file is to manage searching for receivers.
*/
oDCRStatusList = new system_list("status_ID", "status_Name",  "searchstatuslist");
oDCRStatusList.serverURL = strDocumentURL;

oDCR_Search = new system_SearchScreen();

oDCR_Search.screen_Menu = "DCR Search";
oDCR_Search.screen_Name = "document_DCRSearch";
oDCR_Search.search_List	= "getdcrsearch";
oDCR_Search.search_URL = strDocumentURL;
oDCR_Search.module_Name = "dms";

/*--------------------------------------------------------------------------
	Override the parsing functionality of the search screen
	table.
--------------------------------------------------------------------------*/
oDCR_Search.oResults.ParseXML = function (oXML)
{
	return ParseDMSXML(oXML);
}
/*
	Custom clear allows a developer to add custom functionality
	to clear elements which are not part of the base class but
	must be cleared.
*/
oDCR_Search.custom_Clear = function()
{
	oScreenBuffer.Get("dcrSearch_Request").value = "";
	oScreenBuffer.Get("dcrSearch_StatusList").value = "";
	oScreenBuffer.Get("dcrSearch_RequestType").value = "";
	oScreenBuffer.Get("dcrSearch_Project").value = "";
	oScreenBuffer.Get("dcrSearch_DocTitle").value = "";
	oScreenBuffer.Get("dcrSearch_DocTypeList").value = "";
	this.oUserFilter.clear();
	this.oOrgFilter.clear();
	this.SelectOrg("");
	this.SelectUser("");
}
/*
	fnProcess is called once the data has been received
	from the server. Since we have to use a stand alone
	function due to the way JavaScript treats functions
	we're creating a wrapper call back function.
*/
oDCR_Search.fnProcess = function(strResults)
{
	oDCR_Search.ProcessResults(strResults);
}
/*
    perform any special cases which need to be performed
    before the screen is displayed
*/
oDCR_Search.custom_Show = function()
{
}
/*
	custom load sets the values for the header list
*/
oDCR_Search.custom_Load = function()
{
	this.element_UserSelected = oScreenBuffer.Get("dcrSearch_SelectedRequester");
	this.element_StatusList = oScreenBuffer.Get("dcrSearch_StatusList");
	this.element_DocTypeList = oScreenBuffer.Get("dcrSearch_DocTypeList");

	this.oUserFilter = new system_UserOrgSelection();
	this.oUserFilter.load("DCRSearchBox", "dcrSearch_UserPopup", eDisplayUserList);

	this.oUserFilter.setLocation(20, 180);

	this.oUserFilter.custom_submit = function (selectedUser)
	{
		oDCR_Search.SelectUser(selectedUser);
		return true;
	}

	this.element_OrgSelected = oScreenBuffer.Get("dcrSearch_SelectedOrg");

	this.oOrgFilter = new system_UserOrgSelection();
	this.oOrgFilter.load("DCRSearchBox", "dcrSearch_OrgPopup", eDisplayOrgList);
	
	this.oOrgFilter.setLocation(260, 180);
	this.oOrgFilter.custom_submit = function (selectedOrg)
	{
		oDCR_Search.SelectOrg(selectedOrg);
		return true;
	}

	this.element_UserInput = oScreenBuffer.Get("dcrSearch_Requester");
	this.element_OrgInput = oScreenBuffer.Get("dcrSearch_Org");

	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Request";
		arHeader[0].width = "15%";
		arHeader[0].sort = true;
		arHeader[0].fieldName = "id";
		arHeader[0].dataType = "number";
		arHeader[0].tip = "The request number.";
	arHeader[1] = Object();
		arHeader[1].text = "Title";
		arHeader[1].width = "40%";
		arHeader[1].sort = true;
		arHeader[1].fieldName = "document_Title";
		arHeader[1].dataType = "string";
		arHeader[1].tip = "The document title the DCR was submitted for.";
	arHeader[2] = Object();
		arHeader[2].text = "Type";
		arHeader[2].width = "15%";
		arHeader[2].sort = true;
		arHeader[2].fieldName = "request_Type";
		arHeader[2].dataType = "string";
		arHeader[2].tip = "The request type: DCR or TPU";
	arHeader[3] = Object();
		arHeader[3].text = "Status";
		arHeader[3].width = "15%";
		arHeader[3].sort = true;
		arHeader[3].fieldName = "status_Name";
		arHeader[3].dataType = "string";
		arHeader[3].tip = "The current status of the request";
	arHeader[4] = Object();
		arHeader[4].text = "Details";
		arHeader[4].width = "15%";
		arHeader[4].tip = "The details of the request";
	
    this.oResults.SetHeader(arHeader);
    
    this.oResults.SetCaption("Results");
    this.oResults.pageLength = 10;
    this.oResults.custom_element = DisplayRequestResultItem;

    oDCRStatusList.load();
    oDCRStatusList.fillControl(this.element_StatusList, true);

	oDocumentTypeList.load();
	oDocumentTypeList.fillControl(this.element_DocTypeList, true);

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
oDCR_Search.SelectOrg = function(userOrg)
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
oDCR_Search.SelectUser = function(userName)
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
	-	description
			Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
function DisplayRequestResultItem(listPosition)
{
	i = listPosition;
	
	requestId = this.list[i].id;
	reqType = this.list[i].request_Type;
	strStatus = this.list[i].status_Name;
	
	var element_row1 = document.createElement("TR");
	this.element_body.appendChild(element_row1);

	oSystem_Colors.SetPrimary(element_row1);

	if(i % 2 == 1)
	{
		oSystem_Colors.SetSecondaryBackground(element_row1);
	}
	else
	{
		oSystem_Colors.SetTertiaryBackground(element_row1);
	}
	
	var element_col = document.createElement("TD");
	element_col.innerHTML = requestId;
	element_row1.appendChild(element_col);
	element_col.align = "center";

	var element_col2 = document.createElement("TD");
	element_row1.appendChild(element_col2);

	var element_col3 = document.createElement("TD");
	element_row1.appendChild(element_col3);

	if(reqType == 0)
	{
		strRequestType = "DCR";	
		element_col3.title = "Document Change Request";
		strTitle = this.list[i].document_Title;
	}
	
	if(reqType == 1)
	{
		strRequestType = "TPU";	
		element_col3.title = "Test Procedure Update";
		strTitle = this.list[i].procedure_Name;
	}
	
	if(reqType == 2)
	{
		strRequestType = "DCR";	
		element_col3.title = "Document Create Request";
		strTitle = this.list[i].documentNew_Title;
	}
	
	element_col3.innerHTML = strRequestType;
	
	element_Span = document.createElement("DIV");
	element_Span.style.overflow = "hidden";
	element_Span.style.height = "20px";
	element_Span.title = strTitle;
	element_Span.appendChild(document.createTextNode(strTitle));
	element_col2.appendChild(element_Span);
	
	var element_col4 = document.createElement("TD");
	element_row1.appendChild(element_col4);

	element_Span2 = document.createElement("DIV");
	element_Span2.style.overflow = "hidden";
	element_Span2.style.height = "20px";
	element_Span2.title = strStatus;
	element_Span2.appendChild(document.createTextNode(strStatus));
	element_col4.appendChild(element_Span2);

	/*
		Set up the details link
	*/
	var element_col5 = document.createElement("TD");
	element_row1.appendChild(element_col5);
	element_col5.align = "center";

	element_Details = screen_CreateGraphicLink("icon_info.gif", "View request details");
	element_Details.style.paddingRight="10px";
	
	element_Details.requestId = requestId;
	element_Details.reqType = reqType;
	element_Details.onclick = function()
	{
		oDCR_SearchDetails.Display(this.requestId, this.reqType);
	}

	element_col5.appendChild(element_Details);
}

oDCR_Search.register();
