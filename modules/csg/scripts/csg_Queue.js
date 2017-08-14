/*--------------------------------------------------------------------------
	The purpose of this file is to display unread and high priority messages.
    It acts as a front page for the message board system.
----------------------------------------------------------------------------*/
oCSG_Queue = new system_AppScreen();

oCSG_Queue.screen_Menu = "CSG Queue";
oCSG_Queue.screen_Name = "csg_Queue";
oCSG_Queue.module_Name = "csg";


oCSG_Queue.oHistoryTable = new system_SortTable();

/*
	Dispaly the list of csg accounts assigned to a user
*/
oCSG_Queue.oHistoryTable.ParseXML = function (oXML)
{
	return ParseCSGXML(oXML);
}
/*--------------------------------------------------------------------------
	Show the list of CSG transactions
--------------------------------------------------------------------------*/
oCSG_Queue.custom_Hide = function()
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
oCSG_Queue.custom_Show = function()
{
	this.oHistoryTable.load();
	this.timerId = window.setInterval(csgQueueReLoad, 300000);
    return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function csgQueueReLoad()
{
	oCSG_Queue.oHistoryTable.load();
}
/*--------------------------------------------------------------------------
	Is called when the timer fires for this page.
	
----------------------------------------------------------------------------*/
function csgQueueLoad()
{
    serverValues = Object();
    
    serverValues.location = strCSG_URL;
    serverValues.action = "gettransactionqueue";

	server.callASync(serverValues, csgQueue_Parse);

    return true;
}
/*--------------------------------------------------------------------------
    Needed for the function call wrapper called in RetreiveRights
----------------------------------------------------------------------------*/
function csgQueue_Parse(strResults)
{
    oCSG_Queue.oHistoryTable.SetList(strResults);
    oCSG_Queue.oHistoryTable.Display();
}
/*--------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
----------------------------------------------------------------------------*/
oCSG_Queue.custom_Load = function()
{
	///	Create the results table
	this.oHistoryTable.setName("csg_queue_table");

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
		arHeader[1].text = "Requester";
		arHeader[1].width = "25%";
		arHeader[1].tip = "The name of the person requesting the CSG authorization";
	arHeader[2] = Object();
		arHeader[2].text = "Organization";
		arHeader[2].tip = "The requestor's organization";
	arHeader[3] = Object();
		arHeader[3].text = "Action";
		arHeader[3].width = "20%";
		arHeader[3].tip = "The actions available for this request";
		
	this.oHistoryTable.SetHeader(arHeader);
	this.oHistoryTable.SetCaption("Pending Transactions");
    this.oHistoryTable.SetNoResultsMessage("");
    this.oHistoryTable.custom_display = csgQueue_Display;
    
    this.oHistoryTable.custom_load = csgQueueLoad;
    
    this.oHistoryTable.show();
    this.oHistoryTable.Display();
    return true;
}
/*
	Process this transaction
*/

/*--------------------------------------------------------------------------
    Fill out the custom display function for unread messages.
----------------------------------------------------------------------------*/
function csgQueue_Display()
{
	for(var i = 0; i < this.list.length; i++)
	{
		/*
			Some details we'll use several times throughout
			this loop. Shortened names for clarity
		*/
		strStatus =  this.list[i].status;
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

		element_Col2.appendChild(screen_CreateUserLink(this.list[i].owner_Name));
		
		var element_Col3 = document.createElement("TD");
		element_Row.appendChild(element_Col3);
		
		 strOrg = this.list[i].owner_Long_Org + " (" + this.list[i].owner_Org + ")";
		
		screen_SetTextElement(element_Col3, strOrg);
		
		element_Process = screen_CreateGraphicLink("b_send.gif", "Process this request");
		element_Process.style.paddingRight="5px";
		element_Process.requestId = transId;
		
		element_Process.onclick = function()
		{
			if(!oCSG_Process.Process(this.requestId))
			{
				csgQueueReLoad();
			}
    	}

		var element_Col4 = document.createElement("TD");
		element_Col4.appendChild(element_Process);

		element_Row.appendChild(element_Col4);
	}
}

oCSG_Queue.register();