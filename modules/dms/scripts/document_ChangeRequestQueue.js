/*--------------------------------------------------------------------------
	The purpose of this file is to display pending document change requests
----------------------------------------------------------------------------*/
var strDocumentURL =  "/modules/dms/server/document";

oDCR_Queue = new system_AppScreen();

oDCR_Queue.screen_Menu = "Admin Queue";
oDCR_Queue.screen_Name = "document_ChangeRequestQueue";
oDCR_Queue.module_Name = "dms";

oDCR_Queue.oRequestTable = new system_SortTable();

/*
	Display the list of DCR accounts assigned to a user
*/
oDCR_Queue.oRequestTable.ParseXML = function (oXML)
{
	return ParseDMSXML(oXML);
}
/*--------------------------------------------------------------------------
	Hide the list of DCR transactions as leaving the page
--------------------------------------------------------------------------*/
oDCR_Queue.custom_Hide = function()
{
	/*
		Disable the timer as we're no longer on this page.
	*/
	if(this.timerId > -1)
	{
		clearInterval(this.timerId);
	}
	
	this.timerId = -1;
}
/*--------------------------------------------------------------------------
	Show the list of DCR transactions
--------------------------------------------------------------------------*/
oDCR_Queue.custom_Show = function()
{
	this.oRequestTable.load();
	this.timerId = window.setInterval(dcrQueueReLoad, 300000);
    return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function dcrQueueReLoad()
{
	oDCR_Queue.oRequestTable.load();
}

/*--------------------------------------------------------------------------
	Is called when the timer fires for this page to retrieve 
	DCR transactions from the server	
----------------------------------------------------------------------------*/
function dcrQueueLoad()
{
    serverValues = Object();
    serverValues.location = strDocumentURL;
    serverValues.action = "gettransactionqueue";

	server.callASync(serverValues, dcrQueue_Parse);

    return true;
}

/*--------------------------------------------------------------------------
    Needed for the function call wrapper called in RetreiveRights
----------------------------------------------------------------------------*/
function dcrQueue_Parse(strResults)
{
    oDCR_Queue.oRequestTable.SetList(strResults);
    oDCR_Queue.oRequestTable.Display();
}

/*--------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
----------------------------------------------------------------------------*/
oDCR_Queue.custom_Load = function()
{
	///	Create the results table
	this.oRequestTable.setName("dcr_queue_table");

    /*--------------------------------------------------------------------------
		Fill the header table for CSG transactions
		Also determines	which fields are sortable and which database fields they
		are sorted by.
	----------------------------------------------------------------------------*/
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Request";
		arHeader[0].width = "10%";
		arHeader[0].sort = true;
		arHeader[0].fieldName = "id";
		arHeader[0].dataType = "number";
		arHeader[0].tip = "The request number.";
	arHeader[1] = Object();
		arHeader[1].text = "Title";
		arHeader[1].sort = true;
		arHeader[1].fieldName = "document_Title";
		arHeader[1].dataType = "string";
		arHeader[1].tip = "The document title the DCR was submitted for.";
	arHeader[2] = Object();
		arHeader[2].text = "Type";
		arHeader[2].width = "10%";
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
		arHeader[4].text = "Assigned";
		arHeader[4].width = "25%";
		arHeader[4].sort = true;
		arHeader[4].fieldName = "assigned_User";
		arHeader[4].dataType = "string";
		arHeader[4].tip = "The current assigned writer";
	arHeader[5] = Object();
		arHeader[5].text = "Action";
		arHeader[5].width = "10%";
		arHeader[5].tip = "The actions available for this request";
		
	this.oRequestTable.SetHeader(arHeader);
	this.oRequestTable.SetCaption("Open Requests");
    this.oRequestTable.SetNoResultsMessage("");
    this.oRequestTable.custom_element = dcrQueue_Display;
    this.oRequestTable.pageLength = 10;
    this.oRequestTable.pageLength = 10;

    this.oRequestTable.custom_load = dcrQueueLoad;
    
    return true;
}
/*
	Process this transaction
*/

/*--------------------------------------------------------------------------
    Display the transactions in the queue
----------------------------------------------------------------------------*/
function dcrQueue_Display(i)
{
	/*
		Some details we'll use several times throughout
		this loop. Shortened names for clarity
	*/
	reqId = this.list[i].id;
	strTitle = this.list[i].document_Title;
	reqType = this.list[i].request_Type;
	strStatus = this.list[i].status_Name;
	strAssignedUser = this.list[i].assigned_User;
	
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
	screen_SetTextElement(element_Col1, reqId);

	/*
		Set up the Queue detail columns for Request#, Title, Request Type, 
		and Current Status
	*/
	var element_Col2 = document.createElement("TD");
	element_Row.appendChild(element_Col2);

	element_Span = document.createElement("DIV");
	element_Span.style.overflow = "hidden";
	element_Span.style.height = "20px";
	element_Span.title = strTitle;
	element_Span.appendChild(document.createTextNode(strTitle));
	element_Col2.appendChild(element_Span);

	var element_Col3 = document.createElement("TD");
	
	if(reqType == 0)
	{
		strRequestType = "DCR";	
		element_Col3.title = "Document Change Request";
	}
	
	if(reqType == 1)
	{
		strRequestType = "TPU";	
		element_Col3.title = "Test Procedure Update";
	}
	
	if(reqType == 2)
	{
		strRequestType = "DCR";	
		element_Col3.title = "Document Create Request";
	}
	
	element_Row.appendChild(element_Col3);
	screen_SetTextElement(element_Col3, strRequestType);

	var element_Col4 = document.createElement("TD");
	element_Row.appendChild(element_Col4);

	element_Span = document.createElement("DIV");
	element_Span.style.overflow = "hidden";
	element_Span.style.height = "20px";
	element_Span.appendChild(document.createTextNode(strStatus));
	element_Span.title = strStatus;
	
	element_Col4.appendChild(element_Span);

	var element_Col5 = document.createElement("TD");
	element_Row.appendChild(element_Col5);

	element_Span = document.createElement("DIV");
	element_Span.style.overflow = "hidden";
	element_Span.style.height = "20px";

	if(strAssignedUser != "")
	{
		element_Span.appendChild(document.createTextNode(strAssignedUser));
		element_Span.title = strAssignedUser;
	}
	else
	{
		element_Span.appendChild(document.createTextNode("<not assigned>"));
		element_Span.title = "Writer not assigned";
	}
	
	element_Col5.appendChild(element_Span);




	element_Process = screen_CreateGraphicLink("b_send.gif", "Process this request");
	element_Process.requestId = reqId;
	element_Process.reqType = reqType;
		
	element_Process.onclick = function()
	{
		oDCR_Process.Process(this.requestId, this.reqType);
	}

	var element_Col6 = document.createElement("TD");
	element_Col6.appendChild(element_Process);
	element_Row.appendChild(element_Col6);
}

oDCR_Queue.register();