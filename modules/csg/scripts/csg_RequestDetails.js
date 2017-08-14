/*--------------------------------------------------------------------------
	The purpose of this file is to manage all of the functionality related to
	processing a CSG Request
----------------------------------------------------------------------------*/
oCSG_RequestDetails = new system_AppScreen();

oCSG_RequestDetails.screen_Name = "csg_Details";
oCSG_RequestDetails.screen_Menu = "CSG Details";
oCSG_RequestDetails.module_Name = "csg";

oCSG_RequestDetails.requestId = -1;

oCSG_RequestDetails.oRequestTable = new system_SortTable();
oCSG_RequestDetails.oHistoryTable = new system_SortTable();


/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oCSG_RequestDetails.custom_Show = function()
{
	return true;
}
oCSG_RequestDetails.custom_Load = function ()
{

	this.element_Request = oScreenBuffer.Get("csgDetails_Request");
	this.element_Owner = oScreenBuffer.Get("csgDetails_Owner");

	this.element_backButton = oScreenBuffer.Get("csgDetails_back");

	this.element_backButton.onclick = function()
	{
		oCatenaApp.navigate(oCSG_RequestDetails.backScreen);
	}
	
	this.tabs = new system_tabManager(oScreenBuffer.Get("csgDetails_tab"));

	this.tabs.addTab(0, "Receivers", false, SetupCSGHistoryReceiversPage);
	this.tabs.addTab(1, "History", false, SetupCSGStatusPage, ShowCSGStatusPage);

	return true;
}

function SetupCSGHistoryReceiversPage(element_root)
{
	oCSG_RequestDetails.SetupReceiversPage(element_root);
}
function SetupCSGStatusPage(element_root)
{
	oCSG_RequestDetails.SetupStatusPage(element_root);
}
function ShowCSGStatusPage()
{
	oCSG_RequestDetails.ShowStatusPage();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oCSG_RequestDetails.ShowStatusPage = function()
{	
	serverValues = null;
    serverValues = Object();
    
    serverValues.location = strCSG_URL;
    serverValues.action = "getstatus";
    serverValues.transId = this.requestId;
	server.callASync(serverValues, csgDetailsStatus_Parse);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oCSG_RequestDetails.SetupStatusPage = function(element_root)
{

	element_table = oScreenBuffer.Get("csgDetails_HistoryTable");

	element_root.appendChild(oScreenBuffer.Get("csgDetails_HistoryTable"));
	
	element_table.style.position = "relative";
		
	this.oHistoryTable.setName("csgDetails_HistoryTable");
	
	this.oHistoryTable.SetNoResultsMessage("");
	
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Status";
		arHeader[0].tip = "Transaction status type";
	arHeader[1] = Object();
		arHeader[1].text = "Date";
		arHeader[1].tip = "Date and time of this status update";
	arHeader[2] = Object();
		arHeader[2].text = "Submitter";
		arHeader[2].tip = "Who updated this transaction with this status";
		
	this.oHistoryTable.SetHeader(arHeader);
	this.oHistoryTable.custom_element = csg_CommonStatusList;
	
    return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function csgDetailsStatus_Parse(strResults)
{
    oCSG_RequestDetails.oHistoryTable.SetList(strResults);
    oCSG_RequestDetails.oHistoryTable.Display();
	
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oCSG_RequestDetails.SetupReceiversPage = function(element_root)
{
	element_table = oScreenBuffer.Get("csgDetails_Table");
	element_table.style.position = "relative";

	element_root.appendChild(element_table);

	this.oRequestTable.setName("csgDetails_Table");
	
	this.oRequestTable.SetNoResultsMessage("");
	
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Receiver";
		arHeader[0].tip = "Receiver number";
	arHeader[1] = Object();
		arHeader[1].text = "Smart Card";
		arHeader[1].tip = "Smart Card number";
	arHeader[2] = Object();
		arHeader[2].text = "Basic";
		arHeader[2].tip = "Include basic authorization in this request";
	arHeader[3] = Object();
		arHeader[3].text = "Apps";
		arHeader[3].tip = "Include applications in this request";
		
	this.oRequestTable.SetHeader(arHeader);
	this.oRequestTable.custom_element = csg_CommonReceiverStatusList;
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
oCSG_RequestDetails.display = function(requestId, backScreen)
{
	this.requestId = -1;
	this.backScreen = backScreen;
	/*
		make sure we can change the status
	*/
	
	this.transactionList = GetCSGTransaction(requestId);

	if(!this.transactionList)
	{
		oCatenaApp.showNotice(notice_Error, "Invalid transaction requested");
		return false;
	}

	if(this.transactionList.length != 1)
	{
		oCatenaApp.showNotice(notice_Error, "No record found with the requested id");
		return false;
	}

	this.requestId = requestId;

	oCatenaApp.navigate(this.screen_Menu);

	screen_SetTextElement(this.element_Request, this.transactionList[0].id);

	screen_SetTextElement(this.element_Owner, this.transactionList[0].owner_Name);
	
	oSystem_Colors.SetPrimaryBorder(this.element_Request);

	oSystem_Colors.SetPrimaryBorder(this.element_Owner);
	
	
	this.oRequestTable.clear();
	this.oRequestTable.list = this.transactionList[0].requestItems;

	this.oRequestTable.show();
	this.oRequestTable.Display();
	this.tabs.show();
	
	return true;
}

oCSG_RequestDetails.register();