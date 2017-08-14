/*
	The purpose of this file is to manage all of the receiver related functionality.
*/
oCSG_OldAuth = new system_AppScreen();
oCSG_OldAuth.oRequestTable = new system_SortTable();
oCSG_OldAuth.transId = -1;

oCSG_OldAuth.screen_Name = "csg_oldAuth";
oCSG_OldAuth.screen_Menu = "CSG Request";
oCSG_OldAuth.module_Name = "csg";

oCSG_OldAuth.bChangesMade = false;			//	keeps track of whether a request was modified or not
oCSG_OldAuth.bEditing = false;				//	keeps track of whether user is editing an already added
											//	CSG transaction.

oCSG_OldAuth.oRequestTable.custom_display = function()
{
	for(var i = 0; i < this.list.length; i++)
	{
		/*
			Row 1 is all details except for the request details text
		*/
		var element_Row = document.createElement("TR");
		element_Row.vAlign = "top";
		element_Row.align="center";

		var element_Row2 = document.createElement("TR");
		element_Row2.vAlign = "top";
	
		oSystem_Colors.SetPrimary(element_Row);
		
		if(i % 2 == 1)
		{
			oSystem_Colors.SetSecondaryBackground(element_Row);
			oSystem_Colors.SetSecondaryBackground(element_Row2);
		}
		else
		{
			oSystem_Colors.SetTertiaryBackground(element_Row);
			oSystem_Colors.SetTertiaryBackground(element_Row2);
		}
		
		this.element_body.appendChild(element_Row);
		this.element_body.appendChild(element_Row2);
		
		var element_Col1 = document.createElement("TD");
		element_Row.appendChild(element_Col1);
		screen_SetTextElement(element_Col1, formatReceiver(this.list[i]["receiver"]));
	
		var element_Col2 = document.createElement("TD");
		element_Row.appendChild(element_Col2);
		screen_SetTextElement(element_Col2, formatSmartcard(this.list[i]["smartcard"]));
		
		var element_Col4 = document.createElement("TD");
		
		text = ["", this.arHeader[2].tip];
		
		SetToolTip(element_Col4, text);

		strDisplay = "no";
		
		if(this.list[i]["basicAuth"] == true)
		{
			strDisplay = "yes";
		}

		if(this.list[i]["basicAuth"] == 1)
		{
			strDisplay = "yes";
		}

		screen_SetTextElement(element_Col4, strDisplay);
		element_Row.appendChild(element_Col4);
		
		var element_Col5 = document.createElement("TD");
		
		text = ["", this.arHeader[3].tip];
		SetToolTip(element_Col5, text);
		
		strDisplay = (this.list[i]["appsAuth"] == true) ? "yes" : "no";
		screen_SetTextElement(element_Col5, strDisplay);
		element_Row.appendChild(element_Col5);
				
		var element_Col6 = document.createElement("TD");
		element_Col6.rowSpan="2";
		element_Row.appendChild(element_Col6);
		
		element_EditItem = screen_CreateGraphicLink("b_edit.gif", "Edit this item");
		element_EditItem.style.paddingRight = "10px";
		element_EditItem.itemid = i;
		element_Col6.appendChild(element_EditItem);

		element_RemoveItem = screen_CreateGraphicLink("b_drop.gif", "Remove this item from the request");
		element_RemoveItem.style.paddingRight = "10px";
		element_RemoveItem.itemid = i;
		element_Col6.appendChild(element_RemoveItem);

		element_DetailsCol = document.createElement("TD");
		element_DetailsCol.colSpan = "4";
		element_Row2.appendChild(element_DetailsCol);
		
		if(this.list[i].details.length)
		{
			screen_SetTextElement(element_DetailsCol, this.list[i]["details"]);
		}
		else
		{
			//	We have to fill the space so it's even
			screen_SetTextElement(element_DetailsCol, "<no details>");
		}
			
		/*
			Put in the code for the elements which may be clicked
		*/
		element_EditItem.onclick = function()
		{
			oCSG_OldAuth.EditItem(this.itemid);
		}

		element_RemoveItem.onclick = function()
		{
			oCSG_OldAuth.oRequestTable.removeElement(this.itemid);
			oCSG_OldAuth.oRequestTable.Display();
		}
	}
}

/*
	Load the custom variables for this object
*/
oCSG_OldAuth.custom_Load = function ()
{
	
	this.oRequestTable.setName("csgrequest_RequestTable");
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
	arHeader[4] = Object();
		arHeader[4].width = "15%";
		arHeader[4].text = "Actions";
		
	this.oRequestTable.SetHeader(arHeader);
	
	this.element_table = oScreenBuffer.Get("csg_oldRequestTable");
	this.element_addRequest = oScreenBuffer.Get("csgrequest_addRequestItem");
	this.element_addReceiverItem = oScreenBuffer.Get("csgrequest_addInventoryItem");

	this.element_Receiver = oScreenBuffer.Get("csgrequest_Receiver");
	this.element_Smartcard = oScreenBuffer.Get("csgrequest_Smartcard");
	this.element_Details = oScreenBuffer.Get("csgrequest_Details");
	this.element_AuthBasic = oScreenBuffer.Get("csgrequest_AuthBasic");
	this.element_AuthApps = oScreenBuffer.Get("csgrequest_AuthApps");
	this.element_ClearRequest = oScreenBuffer.Get("csgrequest_clearRequest");
	this.element_Form = oScreenBuffer.Get("csgrequest_submitform");
	this.element_Submit = oScreenBuffer.Get("csgrequest_SubmitRequest");

	this.element_Submit.onclick = function()
	{
		oCSG_OldAuth.Submit();
	};

	this.element_addRequest.onclick = function()
	{
		oCSG_OldAuth.AddRequestItem();
	};

	this.element_ClearRequest.onclick = function()
	{
		oCSG_OldAuth.ClearRequest();
		oCSG_OldAuth.oRequestTable.Display();
	};
	
	this.element_addReceiverItem.onclick = function()
	{
		oCSG_OldAuth.InventoryRequest();
	};
	
	this.oReceiverRequest = new receiver_AddRequest();
	
	
	//oSpell = new WebFXLiteSpellChecker(this.element_Details);


	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oCSG_OldAuth.InventoryRequest = function(itemid)
{
	this.oReceiverRequest.show();
	this.oReceiverRequest.element_receiver.value = this.element_Receiver.value;
	this.oReceiverRequest.element_smartcard.value = this.element_Smartcard.value;
}
/*
	This function loads the fields with an element
	which has already been added.
	It also removes the item from the list so when
	the user re adds it, then it's updated with the
	new information.
*/
oCSG_OldAuth.EditItem = function(itemid)
{
	if(this.bEditing == true)
	{
		/*
			If we're editing an existing item, we want
			to move that item back to the list
		*/
		if(this.AddRequestItem() == false)
		{
			return false;
		}
	}
	
	this.bEditing = true;	
	requestItem = this.oRequestTable.list[itemid];

	this.element_Receiver.value = requestItem.receiver;
	this.element_Smartcard.value = requestItem.smartcard;
	this.element_Details.value = requestItem.details;
	
	basicChecked = (requestItem.basicAuth == "1") ? true : false;
	appsChecked = (requestItem.appsAuth == "1") ? true : false;
	
	this.element_AuthBasic.checked = basicChecked;
	this.element_AuthApps.checked = appsChecked;
	
	this.oRequestTable.removeElement(itemid);
	this.oRequestTable.Display();
	
}
/*
	Custom_Close if the user has a modified request
	prompt them to continue if they don't want to lose the
	request
*/
oCSG_OldAuth.custom_Close = function()
{
	strResult = "";

	if(this.bChangesMade == true)
	{
		strResult = "You have unsaved request information. Exiting will lose this information";		
	}
	return strResult;
}
/*
	Perform some checking before we allow the user
	to leave the page
*/
oCSG_OldAuth.custom_Hide = function()
{
	if(this.bChangesMade == true)
	{
		if(confirm("Are you sure you want to discard this request?") == false)
		{
			/*
				the user does not want to leave the page. let them continue
				to make modifications to their request
			*/
			return false;
		}
		
	}

	if(this.transId > -1)
	{
		ChangeRequestStatus(this.transId, "Pending");
	}
	
	/*
		This is set to -1 because we're leaving the page.
		Whether we were editing an existing transaction or
		adding a new one we'll reset the value
	*/
	this.transId = -1;
	
	return true;
}
/*
	Clear the fields before showing the page
*/
oCSG_OldAuth.custom_Show = function()
{
	this.bChangesMade = false;
	this.ClearRequest();
	this.oRequestTable.Display();
	
	HideElement(this.element_addReceiverItem);
	return true;
	
}
/*
	ClearFields clears the receiver/ smart card/ etc fields
	of the add receiver form
*/
oCSG_OldAuth.ClearFields = function()
{
	this.element_Receiver.value = "";
	this.element_Smartcard.value = "";
	this.element_Details.value = "";
	this.element_AuthBasic.checked = false;
	this.element_AuthApps.checked = false;
	
	if(this.transId > -1)
	{
		this.bChangesMade = true;
	}
}
/*
	Submit this request to the server
*/
oCSG_OldAuth.Submit = function()
{
	/*
		add fields to the submit form and
		and populate them in the following format:
			form.receiver1 = value
			form.receiver2 = value2
			form.smartcard1 = value
			form.auth_basic1 = value

		Check the fields as they may have added an item but not added it to the list
	*/
	
	if(this.element_Receiver.value)
	{
		if(confirm("There is content in the receiver field. Do you want to add this item to the request?") == false)
		{
			return false;
		}
		if(this.AddRequestItem() == false)
		{
			return false;
		}
	}
	
	itemCount = this.oRequestTable.size();
	
	if(itemCount < 1)
	{
		oCatenaApp.showNotice(notice_Error, "At least one item must be added to the receiver list to submit the request");
		return false;
	}

	/*
		If we have a transaction id then we are editing an existing
		transaction and therefore go to a different page then
		the add.
		
		Scrub the form.
	*/

	RemoveChildren(this.element_Form);

	if(this.transId == -1)
	{
		this.element_Form.action = strAddCSGRequestURL + ".php";
	}
	else
	{
		this.element_Form.action = strModifyCSGRequestURL + ".php";

		this.element_Form.appendChild(screen_CreateInputElement("transId", this.transId));
	}
	
	this.element_Form.appendChild(screen_CreateInputElement("count", itemCount));

	/*
		Loop through each item and add it to the form
	*/

	for(iItem = 0; iItem < itemCount; iItem++)
	{
		record = this.oRequestTable.list[iItem];
		
		this.element_Form.appendChild(screen_CreateInputElement("receiver" + iItem, record.receiver));
		this.element_Form.appendChild(screen_CreateInputElement("smartcard" + iItem, record.smartcard));
		this.element_Form.appendChild(screen_CreateInputElement("details" + iItem, record.details));
		this.element_Form.appendChild(screen_CreateInputElement("auth_basic" + iItem, record.basicAuth));
		this.element_Form.appendChild(screen_CreateInputElement("auth_apps" + iItem, record.appsAuth));
	}
		
	this.element_Form.submit();

	RemoveChildren(this.element_Form);

	return true;
}
/*
	DisplayResults
		-	Clears the form and results if the passed in values are valid
		-	prompts the user with an error message if there is one
*/
oCSG_OldAuth.DisplayResults = function(strMsg)
{
	var responseInfo = strMsg.split("||");
	if(eval(responseInfo[0]))
	{
		this.ClearRequest();
		this.oRequestTable.Display();
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		/*
			We reset transId to -1 because if we were editing
			an existing transaction we're done with it.
			Now if we add a new one, we do not have a transaction
			id to use as a reference
		*/
		this.bChangesMade = false;			//	changes were cleared and set properly.
		
		if(this.transId > -1)
		{
			this.transId = -1;
			oCatenaApp.navigate("CSG History");
		}
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
	}

	this.element_Form.reset();

}
/*
	populate the fields with an existing request.
*/
oCSG_OldAuth.EditRequest = function(transId)
{
	/*
		Change the request since the user has
		locked the system
	*/
	if(!ChangeRequestStatus(transId, "UserLocked"))
	{
		return false;
	}
	
	serverValues = Object();
    
    serverValues.location = strCSG_URL;
    serverValues.action = "gettransactionlist";
    serverValues.transid = transId;

	strResults = server.callSync(serverValues);
	oXML = server.CreateXML(strResults);
	transactionList = ParseCSGXML(oXML);

	if(!transactionList)
	{
		return false;
	}
	
	if(transactionList.length < 1)
	{
		return false;
	}
	
	oCatenaApp.navigate(this.screen_Menu);
	
	
	for(i = 0; i < transactionList[0].requestItems.length; i++)
	{
		receiver = transactionList[0].requestItems[i].transtype_Receiver;
		smartcard = transactionList[0].requestItems[i].transtype_SmartCard;
		details = transactionList[0].requestItems[i].transtype_Details;
		basicAuth = transactionList[0].requestItems[i].transtype_BasicAuth;
		appsAuth = transactionList[0].requestItems[i].transtype_AppsAuth;
		
		this.AddElement(receiver, smartcard, details, basicAuth, appsAuth);
	}

	this.oRequestTable.Display();
	this.transId = transId;
	this.bChangesMade = false;			//	changes were cleared and set properly.

	return true;

}
/*
	Copy the request and then set it up as a new request
*/
oCSG_OldAuth.CopyRequest = function(transId)
{
	/*
		Retrieve the request and then
		set it up as a new request the user
		needs to submit
	*/
	
	serverValues = Object();
    
    serverValues.location = strCSG_URL;
    serverValues.action = "gettransactionlist";
    serverValues.transid = transId;

	strResults = server.callSync(serverValues);
	oXML = server.CreateXML(strResults);
	transactionList = ParseCSGXML(oXML);

	if(!transactionList)
	{
		return false;
	}
	
	if(transactionList.length < 1)
	{
		return false;
	}
	
	oCatenaApp.navigate(this.screen_Menu);
		
	for(i = 0; i < transactionList[0].requestItems.length; i++)
	{
		receiver = transactionList[0].requestItems[i].transtype_Receiver;
		smartcard = transactionList[0].requestItems[i].transtype_SmartCard;
		details = transactionList[0].requestItems[i].transtype_Details;
		basicAuth = transactionList[0].requestItems[i].transtype_BasicAuth;
		appsAuth = transactionList[0].requestItems[i].transtype_AppsAuth;
		
		this.AddElement(receiver, smartcard, details, basicAuth, appsAuth);
	}

	this.oRequestTable.Display();
	this.transId = -1;				//	This is considered a new transaction
	this.bChangesMade = true;		//	changes were made as we're setting a new transaction

	return true;
}
/*
	Clear this request
*/
oCSG_OldAuth.ClearRequest = function()
{
	this.ClearFields();
	this.oRequestTable.clear();
}
/*
	AddRequest sends a request to the server to validate,
	and then adds it to a list of elements which will be
	eventually sent to the server for adding a new CSG transaction.
*/
oCSG_OldAuth.AddRequestItem = function()
{
	/*
		-	send the request to the server and validate it
	*/
	var serverValues = Object();
	serverValues.receiver = this.element_Receiver.value;
	serverValues.smartcard = this.element_Smartcard.value;
	serverValues.details = this.element_Details.value;
	serverValues.authbasic = this.element_AuthBasic.checked;
	serverValues.authapps = this.element_AuthApps.checked;

	serverValues.location = strCSG_URL;
	serverValues.action = "validaterequest";

	var responseText = server.callSync(serverValues);
	var responseInfo = responseText.split("||");
	
	/*
		All we're looking for from the server is that we can
		proceed. If the server says the request item is valid
		we add it to the list and allow the user to start
		adding another one
	*/
	if(!eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	
	/*
		We have a valid element. so now add it to the table which
		shows the requests available to the user
	*/
	receiver = this.element_Receiver.value;
	smartcard = this.element_Smartcard.value;
	details = this.element_Details.value;
	basicAuth = this.element_AuthBasic.checked;
	appsAuth = this.element_AuthApps.checked;

	this.AddElement(receiver, smartcard, details, basicAuth, appsAuth);

	this.oRequestTable.Display();
	this.ClearFields();

	this.bChangesMade = true;
	this.bEditing = false;

	return true;
	
}
/*
	Add element adds a new element to the list without checking the
	server for valid information
*/
oCSG_OldAuth.AddElement = function(receiver, smartcard, details, basicAuth, appsAuth)
{
	newElement = new Object();
	
	newElement.receiver = receiver;
	newElement.smartcard = smartcard;
	newElement.details = details;
	newElement.basicAuth = basicAuth;
	newElement.appsAuth = appsAuth;
		
	this.oRequestTable.addElement(newElement);

	return true;
}


oCSG_OldAuth.register();
