/*--------------------------------------------------------------------------
	This file manages the receiver add requests.
----------------------------------------------------------------------------*/
oReceiver_AddRequestManage = new system_AppScreen();

oReceiver_AddRequestManage.screen_Menu = "Approve Receiver";
oReceiver_AddRequestManage.screen_Name = "receiver_AddRequest";
oReceiver_AddRequestManage.module_Name = "rms";

oReceiver_AddRequestManage.oReceivers = new system_SortTable();

/*
	Dispaly the list of csg accounts assigned to a user
*/
oReceiver_AddRequestManage.oReceivers.ParseXML = function (oXML)
{
	return ParseCSGXML(oXML);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oReceiver_AddRequestManage.custom_Show = function()
{
    this.GetReceivers();
    this.oReceivers.Display();
    return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oReceiver_AddRequestManage.GetReceivers = function()
{
    /*--------------------------------------------------------------------------
        Retrieve all receivers users have requested be added
        to the inventory.
    ----------------------------------------------------------------------------*/
    serverValues = null;
    serverValues = Object();
    
    serverValues.location = strReceiverURL;
    serverValues.action = "pendingreceivers";
    
	server.callASync(serverValues, pendingReceiver_Parse);

    return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function pendingReceiver_Parse(strResults)
{
    oReceiver_AddRequestManage.oReceivers.SetList(strResults);
    oReceiver_AddRequestManage.oReceivers.Display();
}
/*--------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
----------------------------------------------------------------------------*/
oReceiver_AddRequestManage.custom_Load = function()
{
	this.oReceivers.setName("receiver_AddRequestTable");

    /*--------------------------------------------------------------------------
		Fill the header table for CSG transactions
		Also determines	which fields are sortable and which database fields they
		are sorted by.
	----------------------------------------------------------------------------*/
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Request";
		arHeader[0].width = "12%";
	arHeader[1] = Object();
		arHeader[1].text = "Receiver";
		arHeader[1].width = "22%";
	arHeader[2] = Object();
		arHeader[2].text = "SmartCard";
	arHeader[3] = Object();
		arHeader[3].text = "Hardware";
		arHeader[3].width = "15%";
	arHeader[4] = Object();
		arHeader[4].text = "Requester";
		arHeader[4].width = "15%";
	arHeader[5] = Object();
		arHeader[5].text = "Action";
		arHeader[5].width = "15%";
		
	this.oReceivers.SetHeader(arHeader);
	this.oReceivers.SetCaption("");
    this.oReceivers.SetNoResultsMessage("");
    this.oReceivers.custom_element= pendingReceiver_DisplayElement;
    this.oReceivers.pageLength = 10;
    
    return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oReceiver_AddRequestManage.ChangeStatus = function(requestId, statusId)
{
    serverValues = null;
    serverValues = Object();

	serverValues.request = requestId;    
	serverValues.status = statusId;
    serverValues.location = strReceiverURL;
    serverValues.action = "actionrequest";

	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		responseText = "false||No connection to the server.";
	}
	
	var responseInfo = responseText.split("||");
	
	element_Note = oScreenBuffer.Get("requestRow" + requestId);

	RemoveChildren(element_Note);
	
	screen_SetTextElement(element_Note, responseInfo[1]);

}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function pendingReceiver_DisplayElement(listPosition)
{
	i = listPosition;
		
	var element_row1 = document.createElement("TR");
	oSystem_Colors.SetPrimary(element_row1);

	var element_col = document.createElement("TD");
	element_col.innerHTML = this.list[i].recReq_ID;
	element_row1.appendChild(element_col);

	var element_col2 = document.createElement("TD");
	element_col2.innerHTML = formatReceiver(this.list[i].recReq_Number);
	element_row1.appendChild(element_col2);

	var element_col3 = document.createElement("TD");
	element_col3.innerHTML = formatSmartcard(this.list[i].recReq_Smartcard);
	element_row1.appendChild(element_col3);
	
	var element_col4 = document.createElement("TD");
	element_col4.innerHTML = this.list[i].recReq_Hardware;
	element_row1.appendChild(element_col4);

	var element_col5 = document.createElement("TD");
	
	element_col5.appendChild(screen_CreateUserLink(this.list[i].user_Name));
	
	element_row1.appendChild(element_col5);

	var element_col6 = document.createElement("TD");
	
	element_col6.id = "requestRow" + this.list[i].recReq_ID;
		
	/*
		Add the action items
	*/
	var element_accept = document.createElement("BUTTON");
	screen_SetTextElement(element_accept, "Accept");
	element_accept.requestIdItem = this.list[i].recReq_ID;
	
	element_accept.onclick = function()
	{
		oReceiver_AddRequestManage.ChangeStatus(this.requestIdItem, 1);
	}

	element_col6.appendChild(element_accept);
	
	var element_decline = document.createElement("BUTTON");
	element_decline.requestIdItem = this.list[i].recReq_ID;
	screen_SetTextElement(element_decline, "Decline");

	element_decline.onclick = function()
	{
		oReceiver_AddRequestManage.ChangeStatus(this.requestIdItem, 0);
	}

	element_col6.appendChild(element_decline);
	
	element_row1.appendChild(element_col6);

	oSystem_Colors.SetSecondaryBackground(element_row1);
	this.element_body.appendChild(element_row1);
	
}

oReceiver_AddRequestManage.register();