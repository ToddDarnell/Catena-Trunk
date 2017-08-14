/*
	The purpose of this file is to manage all of the receiver related functionality.
	
*/
oReceiver_UserInventory = new system_AppScreen();

oReceiver_UserInventory.screen_Name = "receiver_UserInventory";
oReceiver_UserInventory.screen_Menu = "Assigned";
oReceiver_UserInventory.module_Name = "rms";

oReceiver_UserInventory.custom_Load = function ()
{
	/*
		For this iteration we'll be adding only the ability
		to assign receivers to a user. There will be no
		connection to the CSG functionality.
	*/

	this.oReceiverTable = new system_SortTable();
	this.oReceiverTable.setName("receiverInventory_Table");
	
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Control ID";
		arHeader[0].sort = true;
		arHeader[0].dataType = "string";
		arHeader[0].fieldName = "rec_Control_Num";
		arHeader[0].width = "20%";
	arHeader[1] = Object();
		arHeader[1].text = "Receiver";
		arHeader[1].sort = true;
		arHeader[1].dataType = "string";
		arHeader[1].fieldName = "rec_Number";
		arHeader[1].width = "20%";
	arHeader[2] = Object();
		arHeader[2].text = "Smart Card";
		arHeader[2].dataType = "string";
		arHeader[2].width = "20%";
	arHeader[3] = Object();
		arHeader[3].text = "Hardware";
		arHeader[3].dataType = "string";
	arHeader[4] = Object();
		arHeader[4].text = "Action";
		arHeader[4].dataType = "string";
		
	this.oReceiverTable.SetHeader(arHeader);
	this.oReceiverTable.SetCaption("");
	this.oReceiverTable.SetNoResultsMessage("");
	this.oReceiverTable.custom_display = receiverInventory_Display;
    return true;
}
//--------------------------------------------------------------------------
/**
	\brief
		Fill out the custom display function for a user's receiver inventory    
*/
//--------------------------------------------------------------------------
function receiverInventory_Display()
{
	for(var i = 0; i < this.list.length; i++)
	{
		/*
			Some details we'll use several times throughout
			this loop. Shortened names for clarity
		*/
		itemId = this.list[i].rec_ID;
			
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
		screen_SetTextElement(element_Col1, this.list[i].rec_Control_Num);

		/*
			Set up the receiver and smart card columns
		*/
		var element_Col2 = document.createElement("TD");
		element_Row.appendChild(element_Col2);
		screen_SetTextElement(element_Col2, this.list[i].rec_Number);
	
		var element_Col3 = document.createElement("TD");
		element_Row.appendChild(element_Col3);

		screen_SetTextElement(element_Col3, this.list[i].rec_SmartCard);

		var element_Col4 = document.createElement("TD");
		element_Row.appendChild(element_Col4);

		screen_SetTextElement(element_Col4, this.list[i].rec_Hardware);
		
		element_Process = screen_CreateGraphicLink("b_drop.gif", "Remove this receiver");
		//element_Process.style.paddingRight = "5px";
		element_Process.receiverId = itemId;
		
		element_Process.onclick = function()
		{
			oReceiver_UserInventory.RemoveReceiver(this.receiverId);
    	}

		var element_Col5 = document.createElement("TD");
		element_Row.appendChild(element_Col5);
		
		element_Col5.appendChild(element_Process);
	}
}
//--------------------------------------------------------------------------
/**
	\brief
		Remove a reciever from the user's inventory.
	\param
	\return
*/
//--------------------------------------------------------------------------
oReceiver_UserInventory.RemoveReceiver = function (receiverId)
{

	serverValues = Object();
	
	serverValues.location = strReceiverURL;
	serverValues.action = "removeowner";
	serverValues.id = receiverId;
	
	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		responseText = "false||Error communicating with the server.";
	}

	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		this.GetInventory();
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}

	return true;

}
//--------------------------------------------------------------------------
/**
	\brief
		Remove a reciever from the user's inventory.
	\param
	\return
*/
//--------------------------------------------------------------------------
oReceiver_UserInventory.AssignReceiver = function (receiverId)
{

	serverValues = Object();
	
	serverValues.location = strReceiverURL;
	serverValues.action = "assignowner";
	serverValues.id = receiverId;
	serverValues.userName= oUser.user_Name;
	
	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		responseText = "false||Error communicating with the server.";
	}

	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}

	return true;
}
/*
	Refresh the list of accounts by calling the server
*/
oReceiver_UserInventory.refresh_Accounts = function ()
{
	var serverValues = Object;
	
	//
	//	Contact the server at this page,
	//	tell it what menu we want
	//	load the raw data into menuData
	//	pass it to the the loadXMLSync function
	//	which creates an XML object
	//	which then passes that XML object onto
	//	our parseMenu function which makes a menu
	//
	serverValues.location = strReceiverURL;
	serverValues.action = "inventory";
	server.callASync(serverValues, parseAccounts);
}
/*
	Clear the fields before showing the page
*/
oReceiver_UserInventory.custom_Show = function()
{
	this.GetInventory();
	this.oReceiverTable.show();
}
//--------------------------------------------------------------------------
/**
	\brief
		Retrieve the receivers assigned to the user
	\param
	\return
*/
//--------------------------------------------------------------------------
oReceiver_UserInventory.GetInventory = function()
{
    /*--------------------------------------------------------------------------
        Retrieve all important messages
    ----------------------------------------------------------------------------*/
    serverValues = null;
    serverValues = Object();
    
    serverValues.location = strReceiverURL;
    serverValues.action = "getReceiverList";
    serverValues.owner = oUser.user_Name;
    serverValues.limit = 0;		//	Set the limit to zero so we get all of them.
    

	server.callASync(serverValues, receiverInventory_Parse);

    return true;
}
/*--------------------------------------------------------------------------
    Needed for the function call wrapper called in RetreiveRights
----------------------------------------------------------------------------*/
function receiverInventory_Parse(strResults)
{
    oReceiver_UserInventory.oReceiverTable.SetList(strResults);
    oReceiver_UserInventory.oReceiverTable.Display();
}

oReceiver_UserInventory.register();
