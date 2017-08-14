/*--------------------------------------------------------------------------
	The purpose of this file is to manage all of the functionality related to
	processing a CSG Request
----------------------------------------------------------------------------*/

oCSGTransactionStates = new system_list("status_ID", "status_Name",  "CSGStatus");

oCSGTransactionStates.load = function()
{
	this.clear();
	this.addElement(0, "Cancelled");
	this.addElement(1, "Clarify");
	this.addElement(3, "Completed");
	this.addElement(2, "Denied");
}

oCSG_Process = new system_AppScreen();

oCSG_Process.screen_Name = "csg_Process";
oCSG_Process.screen_Menu = "CSG Process";
oCSG_Process.module_Name = "csg";


oCSG_Process.oRequestTable = new system_SortTable();

/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oCSG_Process.custom_Show = function()
{
	oCSG_Process.ClearFields();
	return true;
}

oCSG_Process.custom_Load = function ()
{

	this.oRequestTable.setName("csgProcess_Table");
	
	this.oRequestTable.SetCaption("Receivers");
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

	this.element_Request = oScreenBuffer.Get("csgProcess_Request");
	this.element_Owner = oScreenBuffer.Get("csgProcess_Owner");
	this.element_Status = oScreenBuffer.Get("csgProcess_Status");
	this.element_StatusDate = oScreenBuffer.Get("csgProcess_StatusDate");
	this.element_StatusDetails = oScreenBuffer.Get("csgProcess_StatusDetails");

	this.element_NewStatusDetails = oScreenBuffer.Get("csgProcess_NewStatusDetail");
	this.element_NewStatusList = oScreenBuffer.Get("csgProcess_NewStatusList");
	this.element_Submit = oScreenBuffer.Get("csgProcess_Submit");
	this.element_Cancel = oScreenBuffer.Get("csgProcess_Cancel");
	this.element_UserDetails = oScreenBuffer.Get("csgProcess_userDetails");
	this.element_UserDetails.userName = "";

	this.element_UserDetails.onclick = function()
	{
		GetUserDetails(this.userName);
	}

	oCSGTransactionStates.load();
	oCSGTransactionStates.fillControl(this.element_NewStatusList, true );

	this.element_Submit.onclick = function()
	{
		oCSG_Process.Submit();
	}

	this.element_Cancel.onclick = function()
	{
		oCSG_Process.Cancel();
	}
	
	this.requestId = -1;

	return true;
}
/*--------------------------------------------------------------------------
	ClearFields clears all the fields for Subject, Message, Body,
	Post Date, Organization, and Priority
----------------------------------------------------------------------------*/
oCSG_Process.ClearFields = function()
{
	this.element_NewStatusDetails.value = "";
	this.element_NewStatusList.value = "";
}
/*--------------------------------------------------------------------------
	Submit the new status for this transaction
----------------------------------------------------------------------------*/
oCSG_Process.Cancel = function()
{
	strStatus = this.element_NewStatusList.value;

	if(ChangeRequestStatus(this.requestId, "Pending", "Unlocked"))
	{
		oCatenaApp.navigate("CSG Queue");
	}
}
/*--------------------------------------------------------------------------
	Submit the new status for this transaction
----------------------------------------------------------------------------*/
oCSG_Process.Submit = function()
{
	strStatus = this.element_NewStatusList.value;
	strComment = this.element_NewStatusDetails.value;
		
	if(ChangeRequestStatus(this.requestId, strStatus, strComment))
	{
		oCatenaApp.navigate("CSG Queue");
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
oCSG_Process.Process = function(requestId, backScreen)
{

	/*
		Reset this because we're working with a new request
		We'll set it later after we've validated it.
	*/
	this.requestId = -1;
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

	/*
		Perform some formatting for fields used whether we continue or not
	*/
	arDate = this.transactionList[0].status_Date.split(" ");
	
	strDate = formatDate(arDate[0]);
	strTime = formatTime(arDate[1]);

	/*
		Make sure we can lock this transaction. The server isn't
		aware of what kind of processing we're trying to do, however
		the server knows we can't set the transaction status to
		processing if it's already locked via another type of status.
	*/
		
	if(!ChangeRequestStatus(requestId, "Processing"))
	{
		/*
			We need to retrieve the status of this element and inform
			the user who has the element locked and why.
		*/
		
		strUser = this.transactionList[0].status_User_Name;
		strStatus = this.transactionList[0].status_Name;
		
		strResult = strUser + " has set the transaction with the following status [" + strStatus + "] at " + strDate + " " + strTime;
		
		strResult = strResult + ". You may no longer process this transaction.";
		
		oCatenaApp.showNotice(notice_Info, strResult);
		return false;
	}
	
	oCatenaApp.navigate(this.screen_Menu);
	
	/*
		make sure we have something to show before we nagivate to the page.
		becaus if we fail we'll just exit this function
	*/
	this.requestId = requestId;
	this.oRequestTable.list = this.transactionList[0].requestItems;
	

	screen_SetTextElement(this.element_Request, this.transactionList[0].id);
	oSystem_Colors.SetPrimaryBorder(this.element_Request);

	screen_SetTextElement(this.element_Owner, this.transactionList[0].owner_Name);
	oSystem_Colors.SetPrimaryBorder(this.element_Owner);
	
	this.element_UserDetails.userName = this.transactionList[0].owner_Name;
	
	screen_SetTextElement(this.element_Status, this.transactionList[0].status_Name);
	oSystem_Colors.SetPrimaryBorder(this.element_Status);
			
	screen_SetTextElement(this.element_StatusDate, strDate);
	oSystem_Colors.SetPrimaryBorder(this.element_StatusDate);
	text_link = ["", strTime];
	SetToolTip(this.element_StatusDate, text_link);

	screen_SetTextElement(this.element_StatusDetails, this.transactionList[0].status_Details);
	oSystem_Colors.SetPrimaryBorder(this.element_StatusDetails);
	
	text_link = ["", "Details about the last status change"];
	SetToolTip(this.element_StatusDetails, text_link);
	
	this.oRequestTable.show();
	this.oRequestTable.Display();
	
	return true;
}

oCSG_Process.register();