/*--------------------------------------------------------------------------
	The purpose of this file is to manage all of the functionality related to
	processing a DCR Request
----------------------------------------------------------------------------*/
var strDocumentURL = "/modules/dms/server/document";

oDCR_ProcessRequester = new system_AppScreen();

oDCR_ProcessRequester.screen_Name = "document_ProcessRequester";
oDCR_ProcessRequester.screen_Menu = "Process Requested DCR";
oDCR_ProcessRequester.module_Name = "dms";

oDCR_ProcessRequester.bChangesMade = false;			//	keeps track of whether a request status was modified or not

oDCR_ProcessRequester.oRequestTable = new system_SortTable();
oDCR_ProcessRequester.oHistoryTable = new system_SortTable();

/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oDCR_ProcessRequester.custom_Show = function()
{
	oDCR_ProcessRequester.ClearFields();
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
oDCR_ProcessRequester.LoadLists = function()
{
	oDCRStatus = new system_list("status_ID", "status_Name",  "dcrstatuslist");
	oDCRStatus.serverURL = strDocumentURL;
	oDCRStatus.addParam("role", oRights.DMS_Standard);
	oDCRStatus.addParam("status", this.currentStatus);
	oDCRStatus.load();
	oDCRStatus.fillControl(this.element_StatusList, true);

	return true;	
}

oDCR_ProcessRequester.custom_Load = function ()
{
	this.element_backButton = oScreenBuffer.Get("dcrProcessRequester_BackButton");

	this.element_backButton.backScreen = "";
	this.element_backButton.onclick = function ()
	{
		oCatenaApp.navigate(oDCR_RequesterQueue.screen_Menu);
	};

	this.requestId = -1;

	this.element_tabs = oScreenBuffer.Get("dcrProcessRequester_tab");

	this.tabs = new system_tabManager(this.element_tabs);
	
	this.tabs.addTab(0, "Details", false, SetupRequesterDetailsPage);
	this.tabs.addTab(1, "Process", false, SetupRequesterProcessPage, ShowRequesterProcessPage);
	this.tabs.addTab(2, "History", false, SetupRequesterHistoryPage, ShowRequesterHistoryPage);
	
	this.tabs.activate(0);
	
	return true;
}

function SetupRequesterDetailsPage(element_root)
{
	oDCR_ProcessRequester.SetupDetailsPage(element_root);
}
function SetupRequesterProcessPage(element_root)
{
	oDCR_ProcessRequester.SetupProcessPage(element_root);
}
function ShowRequesterProcessPage()
{
	oDCR_ProcessRequester.ShowProcessPage();
}
function SetupRequesterHistoryPage(element_root)
{
	oDCR_ProcessRequester.SetupHistoryPage(element_root);
}
function ShowRequesterHistoryPage()
{
	oDCR_ProcessRequester.ShowHistoryPage();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCR_ProcessRequester.SetupDetailsPage = function(element_root)
{	
	element_table = oScreenBuffer.Get("dcrProcessRequesterDetails_Table");

	element_root.appendChild(element_table);

	this.oRequestTable.setName("dcrProcessRequesterDetails_Table");
	
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
	
	/*if(this.currentStatus = "Clarify)
	{
		alert(this.currentStatus);
	}
	
	else
	{*/
		this.oRequestTable.custom_element = dcrRequester_ItemList;
	//}
	
	this.element_DescriptionBox = oScreenBuffer.Get("dcrProcessRequester_NewDocDetails");
	element_root.appendChild(this.element_DescriptionBox);
	
	this.element_DocTitle = oScreenBuffer.Get("dcrProcessRequester_DocTitle");
	this.element_DocType = oScreenBuffer.Get("dcrProcessRequester_DocType");
	this.element_DocVersion = oScreenBuffer.Get("dcrProcessRequester_DocVersion");
	this.element_Request = oScreenBuffer.Get("dcrProcessRequester_Request");
	this.element_RequestType = oScreenBuffer.Get("dcrProcessRequester_ReqType");
	this.element_Status = oScreenBuffer.Get("dcrProcessRequester_Status");
	this.element_Requester = oScreenBuffer.Get("dcrProcessRequester_Requester");
	this.element_Model = oScreenBuffer.Get("dcrProcessRequester_ReqModel");
	this.element_ModelLabel = oScreenBuffer.Get("dcrProcessRequester_ReqModelLabel");
	this.element_Priority = oScreenBuffer.Get("dcrProcessRequester_Priority");
	this.element_Deadline = oScreenBuffer.Get("dcrProcessRequester_Deadline");
	this.element_RQNumber = oScreenBuffer.Get("dcrProcessRequester_RQNumber");
	this.element_Description = oScreenBuffer.Get("dcrProcessRequester_Description");
	this.element_RequestDate = oScreenBuffer.Get("dcrProcessRequester_RequestDate");
}	

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCR_ProcessRequester.SetupProcessPage = function(element_root)
{		
	this.element_ActionBox = oScreenBuffer.Get("dcrProcessRequester_ActionBox");
	element_root.appendChild(this.element_ActionBox);

	this.element_StatusComment = oScreenBuffer.Get("dcrProcessRequester_StatusDetail");
	this.element_StatusList = oScreenBuffer.Get("dcrProcessRequester_StatusList");
	this.element_ActionSubmit = oScreenBuffer.Get("dcrProcessRequester_ActionSubmit");

	this.element_ActionSubmit.onclick = function ()
	{
		oDCR_ProcessRequester.ActionSubmit();
	}

	/*this.element_StatusList.onchange = function ()
	{
		if(this.element_StatusList.value == "Assigned")
		{
			oDCR_ProcessRequester.ShowAuthorList();
		}
	}
	
	this.element_AssignBox = oScreenBuffer.Get("dcrProcessRequester_AssignBox");
	
	element_root.appendChild(this.element_AssignBox);
	
	this.element_AuthorList = oScreenBuffer.Get("dcrProcessRequester_AuthorList");

	HideElement(this.element_AssignBox);
	*/
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
/*oDCR_ProcessRequester.ShowAuthorList  = function()
{
	ShowInheritElement(this.element_AssignBox);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCR_ProcessRequester.ShowProcessPage = function()
{	
	this.ClearFields();
	this.LoadLists();
}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCR_ProcessRequester.SetupHistoryPage = function(element_root)
{
	element_table = oScreenBuffer.Get("dcrProcessRequesterHistory_Table");

	element_root.appendChild(element_table);
	
	element_table.style.position = "relative";
		
	this.oHistoryTable.setName("dcrProcessRequesterHistory_Table");
	
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
oDCR_ProcessRequester.ShowHistoryPage = function()
{	
	serverValues = null;
    serverValues = Object();
    
    serverValues.location = strDocumentURL;
    serverValues.action = "getstatushistory";
    serverValues.requestId = this.requestId;
	server.callASync(serverValues, dcrRequesterHistory_Parse);
}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function dcrRequesterHistory_Parse(strResults)
{
    oDCR_ProcessRequester.oHistoryTable.SetList(strResults);
    oDCR_ProcessRequester.oHistoryTable.Display();
}

/*--------------------------------------------------------------------------
	ClearFields clears all the fields for Subject, Message, Body,
	Post Date, Organization, and Priority
----------------------------------------------------------------------------*/
oDCR_ProcessRequester.ClearFields = function()
{
	this.element_StatusComment.value = "";
	this.element_StatusList.value = "";
}
/*--------------------------------------------------------------------------
	Submit the new status for this transaction
----------------------------------------------------------------------------*/
oDCR_ProcessRequester.ActionSubmit = function()
{
	strStatus = this.element_StatusList.value;
	strComment = this.element_StatusComment.value;
	role = oRights.DMS_Standard;
		
	if(ChangeDCRStatus(this.requestId, strStatus, role, strComment))
	{
		oCatenaApp.navigate(oDCR_RequesterQueue.screen_Menu);
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
oDCR_ProcessRequester.Process = function(requestId, reqType)
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
			this.currentStatus = dcrElement[0]['status_Name'];
			
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
			
			screen_SetTextElement(this.element_Requester, dcrElement[0]['requester']); 
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
		
		screen_SetTextElement(this.element_Requester, this.itemList[0].requester);
		oSystem_Colors.SetPrimaryBorder(this.element_Requester);
		
		this.oRequestTable.clear();
		this.oRequestTable.list = this.itemList[0].requestItems;
		this.oRequestTable.Display();
	}
	
	return true;
}

/*--------------------------------------------------------------------------
	Add element adds a new element to the list without checking the
	server for valid information
----------------------------------------------------------------------------*/
oDCR_ProcessRequester.AddElement = function(currentStep, requestUpdate, pageNumber, stepNumber)
{
	newElement = new Object();
	
	newElement.currentStep = currentStep;
	newElement.requestUpdate = requestUpdate;
	newElement.pageNumber = pageNumber;
	newElement.stepNumber = stepNumber;
		
	this.oRequestTable.addElement(newElement);

	return true;
}

oDCR_ProcessRequester.register();