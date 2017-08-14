/*--------------------------------------------------------------------------
	The purpose of this file is to display unread and high priority messages.
    It acts as a front page for the message board system.
----------------------------------------------------------------------------*/
oCSG_History = new system_AppScreen();

oCSG_History.screen_Menu = "CSG History";
oCSG_History.screen_Name = "csg_History";
oCSG_History.module_Name = "csg";

oCSG_History.oHistoryTable = new system_SortTable();

/*
	Adding a timer for the history page.
	If the page is currently active then the timer executes the
	update. If the page is not active then we do not perform the update
*/
/*
	Dispaly the list of csg accounts assigned to a user
*/
oCSG_History.oHistoryTable.ParseXML = function (oXML)
{
	return ParseCSGXML(oXML);
}

/*--------------------------------------------------------------------------
	This function is called when the page is hidden.
--------------------------------------------------------------------------*/
oCSG_History.custom_Hide = function()
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
	Show the list of CSG transactions
--------------------------------------------------------------------------*/
oCSG_History.custom_Show = function()
{
	/*
		Start the timer. As long as the user is on this page, we'll have
		the timer run
	*/
	this.timerId = window.setInterval(csgHistoryLoad, 60000);
	this.oHistoryTable.load();
    return true;
}
/*--------------------------------------------------------------------------
    Retrieve CSG transactions from the server
----------------------------------------------------------------------------*/
function csgHistoryLoad()
{
	strFilter = oCSG_History.element_HistoryFilter.value;
	var filterDate = new Date();
	strDate = "";
	switch(strFilter)
	{
		case "0":	//two weeks
			filterDate.setDate(filterDate.getDate() - 14);
			var theyear=filterDate.getFullYear()
			var themonth=filterDate.getMonth()+1
			var thetoday=filterDate.getDate()
			strDate = themonth+"/"+thetoday + "/" +theyear;
			break;
		case "1":	// 90 days
			filterDate.setDate(filterDate.getDate() - 90);
			var theyear=filterDate.getFullYear()
			var themonth=filterDate.getMonth()+1
			var thetoday=filterDate.getDate()
			
			strDate = themonth+"/"+thetoday + "/" + theyear;
			break;
		case "2": //all
			break;
	}

    serverValues = null;
    serverValues = Object();

    serverValues.location = strCSG_URL;
    serverValues.action = "gettransactionlist";
    serverValues.user_info = oUser.user_ID;
    serverValues.start_date = strDate;
	server.callASync(serverValues, csgMessages_Parse);
    return true;
}
/*--------------------------------------------------------------------------
    Needed for the function call wrapper called in RetreiveRights
----------------------------------------------------------------------------*/
function csgMessages_Parse(strResults)
{
    oCSG_History.oHistoryTable.SetList(strResults);
    oCSG_History.oHistoryTable.Display();
}
/*--------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
----------------------------------------------------------------------------*/
oCSG_History.custom_Load = function()
{
	///	Create the results table
	this.oHistoryTable.setName("csg_history_table");

    /*--------------------------------------------------------------------------
		Fill the header table for CSG transactions
		Also determines	which fields are sortable and which database fields they
		are sorted by.
	----------------------------------------------------------------------------*/
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
	arHeader[4] = Object();
		arHeader[4].text = "Actions";
		arHeader[4].width = "15%";
		
	this.oHistoryTable.SetHeader(arHeader);
	this.oHistoryTable.SetCaption("");
    this.oHistoryTable.SetNoResultsMessage("");
    this.oHistoryTable.custom_element = csgHistory_DisplayElement;
    this.oHistoryTable.pageLength = 10;
    
    this.oHistoryTable.custom_load = csgHistoryLoad;            
        
    this.element_HistoryFilter = oScreenBuffer.Get("csgHistory_Filter");
    
  	oCSGHistory_Filter.load();
	oCSGHistory_Filter.fillControl(this.element_HistoryFilter, false );
	
	addListener(this.element_HistoryFilter, "change", csgHistoryLoad);

    return true;
}
/*--------------------------------------------------------------------------
    Fill out the custom display function for unread messages.
----------------------------------------------------------------------------*/
function csgHistory_DisplayElement(listPosition)
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

		strToolTip = formatSmartcard(this.list[i].requestItems[iRec].transtype_SmartCard);
		
		text_link = ["", strToolTip];
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
		oCSG_RequestDetails.display(this.requestId, oCSG_History.screen_Menu);
	}

	element_Col4.appendChild(element_Details);
	
	/*
		Depending upon the status we display certain actions
		
		pending
			-	edit
			-	cancel
		clarify
			-	edit
			-	cancel
	*/
	var element_Col5 = document.createElement("TD");
	element_Row.appendChild(element_Col5);
	element_Col5.align = "left";
	element_Col5.style.paddingLeft = "20px";

	bEdit = false;
	bCancel = false;
	bCopy = false;
	bResend = false;

	switch(strStatus)
	{
		case "Pending":
			bEdit = true;
			bCancel = true;
			break;
		case "Clarify":
			bEdit = true;
			bCancel = true;
			break;
		case "UserLocked":
			bEdit = true;
			break;
		case "Denied":
			bCopy = true;
			break;
		case "Completed":
			bCopy = true;
			bResend = true;
			break;
		case "Cancelled":
			bCopy = true;
			bResend = true;
			break;
		case "Resend":
			bCancel = true;
			break;
	}

	if(bEdit == true)
	{
		element_Edit = screen_CreateGraphicLink("b_edit.gif", "Edit this request");
		element_Edit.style.paddingRight="10px";
		element_Edit.transId = transId;
		
		element_Edit.onclick = function()
		{
			if(!oCSG_OldAuth.EditRequest(this.transId))
			{
				csgHistoryLoad();
			}
		}

		element_Col5.appendChild(element_Edit);
	}

	if(bCancel == true)
	{
		element_Cancel = screen_CreateGraphicLink("b_drop.gif", "Cancel this request");
		element_Cancel.style.paddingRight="10px";
		element_Cancel.requestId = transId;
		element_Cancel.onclick = function()
		{
			if(ChangeRequestStatus(this.requestId, "Cancelled", "Owner Cancelled"))
			{
				csgHistoryLoad();
			}
		}
		
		element_Col5.appendChild(element_Cancel);

	}
	
	if(bCopy == true)
	{
		element_Copy = screen_CreateGraphicLink("b_replace.gif", "Copy this request");
		element_Copy.style.paddingRight="10px";
		element_Copy.transId = transId;

		element_Col5.appendChild(element_Copy);

		element_Copy.onclick = function()
		{
			if(!oCSG_OldAuth.CopyRequest(this.transId))
			{
				csgHistoryLoad();
			}
		}
	}

	if(bResend == true)
	{
		element_Resend = screen_CreateGraphicLink("b_send.gif", "Resend this request");
		element_Resend.style.paddingRight="10px";
		element_Resend.requestId = transId;

		element_Col5.appendChild(element_Resend);

		element_Resend.onclick = function()
		{
			if(ChangeRequestStatus(this.requestId, "Resend", "Owner requested resend"))
			{
				csgHistoryLoad();
			}
		}
	}
}

oCSG_History.register();