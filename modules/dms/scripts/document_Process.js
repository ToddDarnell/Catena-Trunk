/*--------------------------------------------------------------------------
	The purpose of this file is to manage all of the functionality related to
	processing a DCR Request
----------------------------------------------------------------------------*/
var strDocumentURL = "/modules/dms/server/document";

oDCR_Process = new system_AppScreen();

oDCR_Process.screen_Name = "document_DCRProcess";
oDCR_Process.screen_Menu = "Process Request";
oDCR_Process.module_Name = "dms";

oDCR_Process.bChangesMade = false;			//	keeps track of whether a request status was modified or not

oDCR_Process.oRequestTable = new system_SortTable();
oDCR_Process.oHistoryTable = new system_SortTable();

/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oDCR_Process.custom_Show = function()
{
	oDCR_Process.ClearFields();
	this.tabs.activate(0);
	return true;
}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCR_Process.LoadLists = function()
{
	oDCRStatusList = new system_list("status_ID", "status_Name",  "dcrstatuslist");
	oDCRStatusList.serverURL = strDocumentURL;
	oDCRStatusList.addParam("role", oRights.DMS_Admin);
	oDCRStatusList.addParam("status", this.currentStatus);
	oDCRStatusList.load();
	oDCRStatusList.fillControl(this.element_StatusList, true);

	return true;	
}

oDCR_Process.custom_Load = function ()
{
	this.oUserFilter = new system_UserOrgSelection();
	this.oUserFilter.load("dcrProcess_ActionBox", "dcrProcess_UserPopup");

	this.element_backButton = oScreenBuffer.Get("dcrProcess_BackButton");

	this.element_backButton.backScreen = "";
	this.element_backButton.onclick = function ()
	{
		oCatenaApp.navigate(oDCR_Queue.screen_Menu);
	};

	this.requestId = -1;

	this.element_tabs = oScreenBuffer.Get("dcrProcess_tab");

	this.tabs = new system_tabManager(this.element_tabs);
	
	this.tabs.addTab(0, "Details", false, SetupDCRDetailsPage);
	this.tabs.addTab(1, "Process", false, SetupDCRProcessPage, ShowDCRProcessPage);
	this.tabs.addTab(2, "History", false, SetupDCRHistoryPage, ShowDCRHistoryPage);
	
	this.tabs.activate(0);
	
	return true;
}

function SetupDCRDetailsPage(element_root)
{
	oDCR_Process.SetupDetailsPage(element_root);
}
function SetupDCRProcessPage(element_root)
{
	oDCR_Process.SetupProcessPage(element_root);
}
function ShowDCRProcessPage()
{
	oDCR_Process.ShowProcessPage();
}
function SetupDCRHistoryPage(element_root)
{
	oDCR_Process.SetupHistoryPage(element_root);
}
function ShowDCRHistoryPage()
{
	oDCR_Process.ShowHistoryPage();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCR_Process.SetupDetailsPage = function(element_root)
{	
	element_table = oScreenBuffer.Get("dcrProcessDetails_Table");

	element_root.appendChild(element_table);

	this.oRequestTable.setName("dcrProcessDetails_Table");
	
	this.oRequestTable.SetCaption("Items");
	this.oRequestTable.SetNoResultsMessage("");
	
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Current Step";
		arHeader[0].tip = "The description of the current step within the document.";
		arHeader[0].width = "30%";
	arHeader[1] = Object();
		arHeader[1].text = "Requested Update";
		arHeader[1].tip = "The description of the requested update of the current step.";
		arHeader[1].width = "30%";
	arHeader[2] = Object();
		arHeader[2].text = "Page #";
		arHeader[2].tip = "The page number of the document change request.";
		arHeader[2].width = "12%";
	arHeader[3] = Object();
		arHeader[3].text = "Step #";
		arHeader[3].tip = "The step number of the document change request.";
		arHeader[3].width = "12%";
	arHeader[4] = Object();
		arHeader[4].width = "16%";
		arHeader[4].text = "Details";
				
	this.oRequestTable.SetHeader(arHeader);
	this.oRequestTable.custom_element = dcr_ItemList;

	this.element_DescriptionBox = oScreenBuffer.Get("dcrProcess_NewDocDetails");
	element_root.appendChild(this.element_DescriptionBox);
	
	this.element_DocTitle = oScreenBuffer.Get("dcrProcess_DocTitle");
	this.element_DocType = oScreenBuffer.Get("dcrProcess_DocType");
	this.element_DocVersion = oScreenBuffer.Get("dcrProcess_DocVersion");
	this.element_Request = oScreenBuffer.Get("dcrProcess_Request");
	this.element_RequestType = oScreenBuffer.Get("dcrProcess_ReqType");
	this.element_Status = oScreenBuffer.Get("dcrProcess_Status");
	this.element_Requester = oScreenBuffer.Get("dcrProcess_Requester");
	this.element_Model = oScreenBuffer.Get("dcrProcess_ReqModel");
	this.element_ModelLabel = oScreenBuffer.Get("dcrProcess_ReqModelLabel");
	this.element_Priority = oScreenBuffer.Get("dcrProcess_Priority");
	this.element_Deadline = oScreenBuffer.Get("dcrProcess_Deadline");
	this.element_RQNumber = oScreenBuffer.Get("dcrProcess_RQNumber");
	this.element_Description = oScreenBuffer.Get("dcrProcess_Description");
	this.element_RequestDate = oScreenBuffer.Get("dcrProcess_RequestDate");
	this.element_AssignedWriter = oScreenBuffer.Get("dcrProcess_AssignedWriter");
}	

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCR_Process.SetupProcessPage = function(element_root)
{		
	this.arUser = null;

	this.element_ActionBox = oScreenBuffer.Get("dcrProcess_ActionBox");
	element_root.appendChild(this.element_ActionBox);

	this.element_StatusComment = oScreenBuffer.Get("dcrProcess_StatusDetail");
	this.element_StatusList = oScreenBuffer.Get("dcrProcess_StatusList");
	this.element_ActionSubmit = oScreenBuffer.Get("dcrProcess_ActionSubmit");
	
	this.element_WriterList = oScreenBuffer.Get("dcrProcess_WriterList");
	this.element_WriterListLabel = oScreenBuffer.Get("dcrProcess_WriterListLabel");

	this.element_ClarifyUserSelected = oScreenBuffer.Get("dcrProcess_UserSelected");
	this.element_ClarifyUserLabel = oScreenBuffer.Get("dcrProcess_UserSelectedLabel");
	
	this.element_StatusList.onchange = function ()
	{
		oDCR_Process.ShowUserSelection();
	}

	this.element_ActionSubmit.onclick = function ()
	{
		oDCR_Process.ActionSubmit();
	}

	this.element_WriterList.style.visibility = "hidden"; 
	this.element_WriterListLabel.style.visibility = "hidden"; 
	this.element_ClarifyUserSelected.style.visibility = "hidden"; 
	this.element_ClarifyUserLabel.style.visibility = "hidden"; 
}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCR_Process.ShowProcessPage = function()
{	
	this.LoadLists();
	this.ClearFields();
	this.element_WriterList.style.visibility = "hidden";
	this.element_WriterListLabel.style.visibility = "hidden"; 
	this.element_ClarifyUserSelected.style.visibility = "hidden"; 
	this.element_ClarifyUserLabel.style.visibility = "hidden"; 
	this.SelectUser("");
	this.oUserFilter.clear();
	this.oUserFilter.hide();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCR_Process.SetupHistoryPage = function(element_root)
{
	element_table = oScreenBuffer.Get("dcrProcessHistory_Table");

	element_root.appendChild(element_table);
	
	element_table.style.position = "relative";
		
	this.oHistoryTable.setName("dcrProcessHistory_Table");
	
	this.oHistoryTable.SetNoResultsMessage("");
	
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Status";
		arHeader[0].tip = "Request status.";
	arHeader[1] = Object();
		arHeader[1].text = "Date";
		arHeader[1].tip = "Date and time of this status update";
	arHeader[2] = Object();
		arHeader[2].text = "User";
		arHeader[2].tip = "The user that updated the request with this status";
		
	this.oHistoryTable.SetHeader(arHeader);
	this.oHistoryTable.custom_element = dcr_StatusHistoryList;
	
    return true;
}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCR_Process.ShowHistoryPage = function()
{	
	serverValues = null;
    serverValues = Object();
    
    serverValues.location = strDocumentURL;
    serverValues.action = "getstatushistory";
    serverValues.requestId = this.requestId;
	server.callASync(serverValues, dcrStatusHistory_Parse);
}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function dcrStatusHistory_Parse(strResults)
{
    oDCR_Process.oHistoryTable.SetList(strResults);
    oDCR_Process.oHistoryTable.Display();
	
}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCR_Process.ShowUserSelection  = function()
{
	this.element_WriterList.style.visibility = "hidden"; 
	this.element_WriterListLabel.style.visibility = "hidden"; 
	this.element_ClarifyUserSelected.style.visibility = "hidden"; 
	this.element_ClarifyUserLabel.style.visibility = "hidden"; 
	this.oUserFilter.hide();

	if(this.element_StatusList.value == "Assigned" || this.element_StatusList.value == "Peer Review")
	{
		this.element_WriterList.style.visibility = "visible"; 
		this.element_WriterListLabel.style.visibility = "visible"; 

		/*
			Load with all the users that have the DMS_Writer right where the org
			they are assigned to matches the DCR org.		
		*/
		oDCRWriterList = new system_list("user_ID", "user_Name",  "dcrwriterlist");
		oDCRWriterList.serverURL = strDocumentURL;
		oDCRWriterList.addParam("role", oRights.DMS_Writer);
		oDCRWriterList.addParam("requestId", this.requestId);
		oDCRWriterList.load();
		oDCRWriterList.fillControl(this.element_WriterList, true);
	}
	
	if(this.element_StatusList.value == "Clarify" || this.element_StatusList.value == "Review (Pending)")
	{
		this.element_ClarifyUserSelected.style.visibility = "visible"; 
		this.element_ClarifyUserLabel.style.visibility = "visible"; 

		this.oUserFilter.show();
		this.oUserFilter.useInactiveAccounts = true;
	
		this.oUserFilter.setLocation(300, 80);
	
		this.oUserFilter.custom_submit = function (selectedUser)
		{
			oDCR_Process.SelectUser(selectedUser);
			return true;
		}
	}
}
/*--------------------------------------------------------------------------
	ClearFields clears all the fields for Subject, Message, Body,
	Post Date, Organization, and Priority
----------------------------------------------------------------------------*/
oDCR_Process.ClearFields = function()
{
	this.element_StatusComment.value = "";
	this.element_StatusList.value = "";
}
/*--------------------------------------------------------------------------
	Submit the new status for this transaction
----------------------------------------------------------------------------*/
oDCR_Process.ActionSubmit = function()
{		
	strStatus = this.element_StatusList.value;
	strComment = this.element_StatusComment.value;
	strWriter = this.element_WriterList.value;	
	role = oRights.DMS_Admin;
	
	strClarifyUser = "";
	
	if(this.arUser != null)
	{
		strClarifyUser = this.arUser.user_Name;
	}
	
	if(ChangeDCRStatus(this.requestId, strStatus, role, strComment, strClarifyUser, strWriter))
	{
		oCatenaApp.navigate(oDCR_Queue.screen_Menu);
	}
}

/*--------------------------------------------------------------------------
	Select user is called when the oUserFilter has a name selected
	or unselected.
----------------------------------------------------------------------------*/
oDCR_Process.SelectUser = function(userName)
{
	/*
		-	tell the user which user account they selected
			via the text box to the right of the user name drop down list
		-	Populate the individual rights fields with the accounts
			assigned and available rights.
	*/
	var oUsers = null;

	if(userName)
	{
		if(userName.length)
		{
			oUsers = new system_UserList();
			
			oUsers.addParam("name", userName);
			oUsers.load();
			
			this.arUser = oUsers.get(userName);
			
			if(this.arUser)
			{
				userOrg = this.arUser.org_Short_Name;
				screen_SetTextElement(this.element_ClarifyUserSelected, userName + " (" + userOrg + ")");
			}
		}
	}
	else
	{
		this.SelectUser(this.requester);
	}
}
/*--------------------------------------------------------------------------
	Displays a message based upon what's passed in as messageId.
	By either cancelling or submitting a successful request, sets
	focus to the screen passed in.
		-	Tell the back button where it should send the user
			if they click it
		-	clear all of the fields in this form
		-	draw the screen for viewing the mesasage
		-	send a request to the server for the data for this message
		-	marks the message as read in jMessageViewed table
----------------------------------------------------------------------------*/
oDCR_Process.Process = function(requestId, reqType)
{
	/*
		Reset this because we're working with a new request
		We'll set it later after we've validated it.
	*/
	this.requestId = -1;

	/*
		make sure we can change the status
	*/
	if(reqType < 0)
	{
		oCatenaApp.showNotice(notice_Error, "Invalid request type.");
		return false;
	}
	
	this.reqType = reqType;
	
	if(reqType == 2)
	{
		var serverValues = Object();
	
		serverValues.requestId = requestId;
		serverValues.location = strDocumentURL;
		serverValues.action = "getnewdcrdetails";
	
		var xmlObject = server.CreateXMLSync(serverValues);
	
		dcrElement = ParseXML(xmlObject, "element");
		
		if(dcrElement.length == 1)
		{
			oCatenaApp.navigate(this.screen_Menu);
			this.requestId = requestId;
			this.oRequestTable.hide();
			this.oRequestTable.clear();
			this.element_DescriptionBox.style.visibility = "visible";

			strTitle = dcrElement[0]['document_Title'];
			strAssignedUser = dcrElement[0]['assigned_User'];
			this.currentStatus = dcrElement[0]['status_Name'];
			this.requester = dcrElement[0]['requester'];
			
			arDate = dcrElement[0]['request_Date'].split(" ");
			strDate = formatDate(arDate[0]);
			strTime = formatTime(arDate[1]);
						
			/*
				Load the stored document entry from the database and display it in the 
				proper fields based on the doc ID.  
			*/			
			this.element_DocTitle.title = strTitle;
	 		screen_SetTextElement(this.element_DocTitle, strTitle);
			oSystem_Colors.SetPrimaryBorder(this.element_DocTitle);
			
			screen_SetTextElement(this.element_DocType, dcrElement[0]['document_Type']); 
			oSystem_Colors.SetPrimaryBorder(this.element_DocType);

			strVersion = "New";
			screen_SetTextElement(this.element_DocVersion, strVersion); 
			oSystem_Colors.SetPrimaryBorder(this.element_DocVersion);
			
			screen_SetTextElement(this.element_Request, dcrElement[0]['id']); 
			oSystem_Colors.SetPrimaryBorder(this.element_Request);
			
			screen_SetTextElement(this.element_Requester, this.requester); 
			oSystem_Colors.SetPrimaryBorder(this.element_Requester);

			strRequestType = "DCR";	
			screen_SetTextElement(this.element_RequestType, strRequestType); 
			this.element_RequestType.title = "Document Creation Request";
			oSystem_Colors.SetPrimaryBorder(this.element_RequestType);

			screen_SetTextElement(this.element_RequestDate, strDate); 
			this.element_RequestDate.title = "Date the request was submitted";
			oSystem_Colors.SetPrimaryBorder(this.element_RequestDate);

			screen_SetTextElement(this.element_Status, this.currentStatus);
			oSystem_Colors.SetPrimaryBorder(this.element_Status);
			this.element_Status.title = "Current request status";

			screen_SetTextElement(this.element_Priority, dcrElement[0]['document_Priority']); 
			oSystem_Colors.SetPrimaryBorder(this.element_Priority);
			this.element_Priority.title = "The new document priority";

			strDeadline = dcrElement[0]['document_Deadline'];
			
			if(strDeadline == "0000-00-00")
			{
				strDeadline = "No Deadline";	
			}
			
			else
			{
				strDeadline = formatDate(dcrElement[0]['document_Deadline']);
			}
			
			screen_SetTextElement(this.element_Deadline, strDeadline); 
			oSystem_Colors.SetPrimaryBorder(this.element_Deadline);
			this.element_Deadline.title = "The new document deadline";

			strRQNumber = dcrElement[0]['document_RQNumber'];
			
			if(strRQNumber == "")
			{
				strRQNumber = "N/A";	
			}
			
			this.element_RQNumber.title = strRQNumber;
			this.element_RQNumber.style.overflow = "hidden";
			this.element_RQNumber.style.height = "20px";
			screen_SetTextElement(this.element_RQNumber, strRQNumber); 
			oSystem_Colors.SetPrimaryBorder(this.element_RQNumber);
			
			screen_SetTextElement(this.element_Description, dcrElement[0]['document_Description']); 
			oSystem_Colors.SetPrimaryBorder(this.element_Description);
			this.element_Description.title = "The new document description";
		
			this.element_Model.style.visibility = "hidden";
			this.element_ModelLabel.style.visibility = "hidden";			
		}
		
		else
		{
			oCatenaApp.showNotice(notice_Error, "Unable to load the document data for submitting a document change request.");
		}	
	}

	else
	{
		this.itemList = GetDCRItem(requestId);

		if(!this.itemList)
		{
			oCatenaApp.showNotice(notice_Error, "Invalid item requested.");
			return false;
		}
	
		if(this.itemList.length != 1)
		{
			oCatenaApp.showNotice(notice_Error, "No record found with the requested id.");
			return false;
		}
		
		oCatenaApp.navigate(this.screen_Menu);
		this.requestId = requestId;
		this.oRequestTable.show();
		this.oRequestTable.SetCaption("Items");

		procVersion = this.itemList[0].procedure_Version;
		reqType = this.itemList[0].request_Type;
		this.currentStatus = this.itemList[0].status_Name;
		this.requester = this.itemList[0].requester;
		strAssignedUser = this.itemList[0].assigned_User;

		arDate = this.itemList[0].request_Date.split(" ");
		
	    oSystem_Debug.notice("Date array: " + arDate);

		strDate = formatDate(arDate[0]);
		strTime = formatTime(arDate[1]);
		
		if(strDate == "00/00/0000")
		{
			strDate = "Before 6/12/07";	
		}
		
		if(procVersion == 0)
		{
			procVersion = "N/A";	
		}
	
		if(reqType == 1)
		{
			strTitle = this.itemList[0].procedure_Name;
			strModel = this.itemList[0].model;
			
			this.element_DescriptionBox.style.visibility = "hidden";			
			
			this.element_DocTitle.title = strTitle;
			screen_SetTextElement(this.element_DocTitle, strTitle);
			oSystem_Colors.SetPrimaryBorder(this.element_DocTitle);
		
			screen_SetTextElement(this.element_DocType, this.itemList[0].procedure_Type);
			oSystem_Colors.SetPrimaryBorder(this.element_DocType);
		
			screen_SetTextElement(this.element_DocVersion, procVersion);
			oSystem_Colors.SetPrimaryBorder(this.element_DocVersion);
		
			screen_SetTextElement(this.element_Request, this.itemList[0].id);
			oSystem_Colors.SetPrimaryBorder(this.element_Request);
	
			this.element_Model.style.visibility = "visible";
			this.element_ModelLabel.style.visibility = "visible";
			this.element_Model.title = strModel;
			screen_SetTextElement(this.element_Model, this.itemList[0].model);
			oSystem_Colors.SetPrimaryBorder(this.element_Model);
	
			strRequestType = "TPU";	
			this.element_RequestType.title = "Test Procedure Update";
		}
		
		else
		{
			strTitle = this.itemList[0].document_Title;

			this.element_DescriptionBox.style.visibility = "hidden";			

			this.element_DocTitle.title = strTitle;
			screen_SetTextElement(this.element_DocTitle, strTitle);
			oSystem_Colors.SetPrimaryBorder(this.element_DocTitle);
		
			screen_SetTextElement(this.element_DocType, this.itemList[0].document_Type);
			oSystem_Colors.SetPrimaryBorder(this.element_DocType);
		
			screen_SetTextElement(this.element_DocVersion, this.itemList[0].document_Version);
			oSystem_Colors.SetPrimaryBorder(this.element_DocVersion);
		
			screen_SetTextElement(this.element_Request, this.itemList[0].id);
			oSystem_Colors.SetPrimaryBorder(this.element_Request);
	
			this.element_Model.style.visibility = "hidden";
			this.element_ModelLabel.style.visibility = "hidden";
	
			strRequestType = "DCR";	
			this.element_RequestType.title = "Document Change Request";
		}
			
		screen_SetTextElement(this.element_RequestType, strRequestType);
		oSystem_Colors.SetPrimaryBorder(this.element_RequestType);
	
		screen_SetTextElement(this.element_Status, this.currentStatus);
		oSystem_Colors.SetPrimaryBorder(this.element_Status);
		this.element_Status.title = "Current request status";

		screen_SetTextElement(this.element_RequestDate, strDate); 
		this.element_RequestDate.title = "Date the request was submitted";
		oSystem_Colors.SetPrimaryBorder(this.element_RequestDate);
		
		screen_SetTextElement(this.element_Requester, this.requester);
		oSystem_Colors.SetPrimaryBorder(this.element_Requester);
		
		this.oRequestTable.clear();
		this.oRequestTable.list = this.itemList[0].requestItems;
		this.oRequestTable.Display();
	}
	
	if(this.currentStatus == "Assigned" || this.currentStatus == "In Progress" || this.currentStatus == "Peer Review") 
	{
		if(strAssignedUser != "")
		{
			var oUsers = new system_UserList();
			oUsers.addParam("name", strAssignedUser);
			oUsers.load();

			user_record = oUsers.get(strAssignedUser);
			userOrg = user_record.org_Short_Name;

			screen_SetTextElement(this.element_AssignedWriter, strAssignedUser + " (" + userOrg + ")");
		}
	}
	
	else
	{
		screen_SetTextElement(this.element_AssignedWriter, "");
	}
	
	return true;
}

/*
	Add element adds a new element to the list without checking the
	server for valid information
*/
oDCR_Process.AddElement = function(currentStep, requestUpdate, pageNumber, stepNumber)
{
	newElement = new Object();
	
	newElement.currentStep = currentStep;
	newElement.requestUpdate = requestUpdate;
	newElement.pageNumber = pageNumber;
	newElement.stepNumber = stepNumber;
		
	this.oRequestTable.addElement(newElement);

	return true;
}

oDCR_Process.register();