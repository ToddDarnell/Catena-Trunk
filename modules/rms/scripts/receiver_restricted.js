/*
	The purpose of this file is to administrate all restricted receiver
	smart card and numbers.
*/

var oRestrictedReceivers = new system_list("resNum_ID", "resNum_Digits", "getrestrictedreceivers");
var oRestrictedSmartcards = new system_list("resNum_ID", "resNum_Digits", "getrestrictedsmartcards");

oRestrictedReceivers.serverURL = strRestrictedReceiverURL;
oRestrictedSmartcards.serverURL = strRestrictedReceiverURL;

/*
	Brings up 
	Retrieves the raw menu data from the server (an xml string) and then passes it to
	ProcessMenu
*/
var oReceiver_RestrictedAdmin = new system_AppScreen();

oReceiver_RestrictedAdmin.strField_Submit = "rec_resSubmit";	//	The submit element name
oReceiver_RestrictedAdmin.screen_Name = "receiver_restricted";		//	The name of the screen or page. Also the name of the XML data file
oReceiver_RestrictedAdmin.screen_Menu = "Restricted Numbers";					//	The name of the menu item which corapsponds to this item
oReceiver_RestrictedAdmin.module_Name = "rms";


/*
	Add screen elements
*/
oReceiver_RestrictedAdmin.strField_AddReceiver = "rec_resAddReceiver";
oReceiver_RestrictedAdmin.strField_AddReceiverReason = "rec_resAddReceiverReason";

oReceiver_RestrictedAdmin.strField_AddSmartcard = "rec_resAddSmartcard";
oReceiver_RestrictedAdmin.strField_AddSmartcardReason = "rec_resAddSmartcardReason";

/*
	Modify screen elements
*/

oReceiver_RestrictedAdmin.strField_ModifyReceiverList = "rec_resModifyReceiverList";		//	The modify list element which picks an item to edit
oReceiver_RestrictedAdmin.strField_ModifyReceiver = "rec_resModifyReceiver";
oReceiver_RestrictedAdmin.strField_ModifyReceiverReason = "rec_resModifyReceiverReason";

oReceiver_RestrictedAdmin.strField_ModifySmartcardList = "rec_resModifySmartcardList";		//	The modify list element which picks an item to edit
oReceiver_RestrictedAdmin.strField_ModifySmartcard = "rec_resModifySmartcard";
oReceiver_RestrictedAdmin.strField_ModifySmartcardReason = "rec_resModifySmartcardReason";

/*
	Remove Data Type field names
*/
oReceiver_RestrictedAdmin.strField_RemoveReceiverList = "rec_resRemoveReceiverList";

oReceiver_RestrictedAdmin.strField_RemoveSmartcardList = "rec_resRemoveSmartcardList";

/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_RestrictedAdmin.custom_Show = function()
{
	this.LoadLists();
	return true;
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_RestrictedAdmin.custom_Load = function()
{
	oScreenBuffer.Get(this.strField_Submit).onclick = function ()
	{
		oReceiver_RestrictedAdmin.Submit(this.oScreen.focusedPage);
	};
	
	/*
		This controls the modify list drop down box used to select
		an organization to modify
	*/

	oScreenBuffer.Get(this.strField_ModifyReceiverList).onchange = function ()
	{
		oReceiver_RestrictedAdmin.UpdateModifyScreen(1);
	};

	oScreenBuffer.Get(this.strField_ModifySmartcardList).onchange = function ()
	{
		oReceiver_RestrictedAdmin.UpdateModifyScreen(0);
	};
	return true;

}
/*--------------------------------------------------------------------------
	-	description
			Loads the lists displaying the organizations
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_RestrictedAdmin.LoadLists = function()
{
	oRestrictedReceivers.load();
	
	oRestrictedReceivers.fillControl(this.strField_ModifyReceiverList, true);
	oRestrictedReceivers.fillControl(this.strField_RemoveReceiverList, true);
	
	oRestrictedSmartcards.load();
	
	oRestrictedSmartcards.fillControl(this.strField_ModifySmartcardList, true);
	oRestrictedSmartcards.fillControl(this.strField_RemoveSmartcardList, true);
		
	this.UpdateModifyScreen(1);
	this.UpdateModifyScreen(0);
	
}
/*--------------------------------------------------------------------------
	-	description
		Sumbits a request for an add, modify, or removal
		activePage is the page which currently has focus when
		the user clicks submit
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_RestrictedAdmin.Submit = function(activePage)
{
	switch(activePage)
	{
		case 0:
			this.AddSubmit(1);
			break;
		case 1:
			this.ModifySubmit(1);
			break;
		case 2:
			this.RemoveSubmit(1);
			break;
		case 3:
			this.AddSubmit(0);
			break;
		case 4:
			this.ModifySubmit(0);
			break;
		case 5:
			this.RemoveSubmit(0);
			break;
	}
}
/*--------------------------------------------------------------------------
	-	description
			Adds a smart card or receiver number to the restricted list
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_RestrictedAdmin.AddSubmit = function(numType)
{
	if(numType == 0)
	{
		strName = this.strField_AddSmartcard;
		strReason = this.strField_AddSmartcardReason;
	}
	else
	{
		strName = this.strField_AddReceiver;
		strReason = this.strField_AddReceiverReason;
	}

	element_name = oScreenBuffer.Get(strName);
	element_reason = oScreenBuffer.Get(strReason);

	/*
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	var serverValues = Object();
	
	serverValues.number = element_name.value;
	serverValues.reason = element_reason.value;
	serverValues.type = numType;
	serverValues.location = strRestrictedReceiverURL;
	serverValues.action = "add";
	
	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	var responseText = server.callSync(serverValues);
	var responseInfo = responseText.split("||");

	if(eval(responseInfo[0]))
	{
		element_name.value = "";
		element_reason.value = "";
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		this.LoadLists();
		return true;
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Modifies a restricted receiver/ smart card number
	-	params
			numType
				0	smart card
				1	receiver
	-	return
			-	false
					if the element was for some reason not added
			-	true
					if the element was added
--------------------------------------------------------------------------*/
oReceiver_RestrictedAdmin.ModifySubmit = function(numType)
{
	if(numType == 0)
	{
		strList = this.strField_ModifySmartcardList;
		strName = this.strField_ModifySmartcard;
		strReason = this.strField_ModifySmartcardReason;
	}
	else
	{
		strList = this.strField_ModifyReceiverList;
		strName = this.strField_ModifyReceiver;
		strReason = this.strField_ModifyReceiverReason;
	}

	element_list = oScreenBuffer.Get(strList);
	element_name = oScreenBuffer.Get(strName);
	element_reason = oScreenBuffer.Get(strReason);

	if(element_list.value == "")
	{
		oCatenaApp.showNotice(notice_Error, "Select an option to modify before submitting.");
		return false;
	}
	
	if(numType == 0)
	{
		oNumber = oRestrictedSmartcards.get(element_list.value);
	}
	else
	{
		oNumber = oRestrictedReceivers.get(element_list.value);
	}

	/*
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	var serverValues = Object();
	
	serverValues.number = element_name.value;
	serverValues.reason = element_reason.value;
	serverValues.id = oNumber.resNum_ID;
	serverValues.type = numType;
	serverValues.location = strRestrictedReceiverURL;
	serverValues.action = "modify";
	
	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	var responseText = server.callSync(serverValues);
	var responseInfo = responseText.split("||");

	if(eval(responseInfo[0]))
	{
		element_name.value = "";
		element_reason.value = "";
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		this.LoadLists();
		return true;
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Updates the modify screen after the user selections an option to
			modify
	-	params
			numType
				The type of number we're submitting
				0	smart card
				1	receiver
	-	return
			none
--------------------------------------------------------------------------*/
oReceiver_RestrictedAdmin.UpdateModifyScreen = function(numType)
{
	/*
		Get the requested department details and set the fields
	*/
	if(numType == 0)
	{
		strList = this.strField_ModifySmartcardList;
		strName = this.strField_ModifySmartcard;
		strReason = this.strField_ModifySmartcardReason;
	}
	else
	{
		strList = this.strField_ModifyReceiverList;
		strName = this.strField_ModifyReceiver;
		strReason = this.strField_ModifyReceiverReason;
	}

	element_list = oScreenBuffer.Get(strList);			//	Our fields which will be updated with the record detail
	element_name = oScreenBuffer.Get(strName);			//	Our fields which will be updated with the record detail
	element_reason = oScreenBuffer.Get(strReason);		//	Our fields which will be updated with the record detail

	if(numType == 0)
	{
		oNumber = oRestrictedSmartcards.get(element_list.value);
	}
	else
	{
		oNumber = oRestrictedReceivers.get(element_list.value);
	}

	if(oNumber == null)
	{
		this.enableModify(false, numType);
	}
	else
	{
		element_name.value = oNumber.resNum_Digits;
		element_reason.value = oNumber.resNum_Reason;
		this.enableModify(true, numType);
	}
}
/*
	-	enableModify will disable or enable the modify screen elements.
	-	If no element is selected, then these elements should be disabled
	
	-	params
		-	toggle
			Set to true to enable the elements
			Set to false to disable the elements
		-	numType
			0	smart cards
			1	receivers
			
	-	Additionally setting toggle to false will clear the element values
*/
oReceiver_RestrictedAdmin.enableModify = function(toggle, numType)
{
	if(numType == 0)
	{
		strName = this.strField_ModifySmartcard;
		strReason = this.strField_ModifySmartcardReason;
	}
	else
	{
		strName = this.strField_ModifyReceiver;
		strReason = this.strField_ModifyReceiverReason;
	}

	element_name = oScreenBuffer.Get(strName);			//	Our fields which will be updated with the record detail
	element_reason = oScreenBuffer.Get(strReason);		//	Our fields which will be updated with the record detail

	element_name.disabled = !toggle;
	element_reason.disabled = !toggle;
	
	if(!toggle)
	{
		element_name.value = "";
		element_reason.value = "";
	}
}
/*--------------------------------------------------------------------------
	-	description
			Remove a restricted receiver or smart card number
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_RestrictedAdmin.RemoveSubmit = function(numType)
{
	
	if(numType == 0)
	{
		strList = this.strField_RemoveSmartcardList;
	}
	else
	{
		strList = this.strField_RemoveReceiverList;
	}

	element_list = oScreenBuffer.Get(strList);

	if(element_list.value == "")
	{
		oCatenaApp.showNotice(notice_Error, "Select an option to remove before submitting.");
		return false;
	}
	
	if(numType == 0)
	{
		oNumber = oRestrictedSmartcards.get(element_list.value);
	}
	else
	{
		oNumber = oRestrictedReceivers.get(element_list.value);
	}

	/*
		Query the user to make sure they really want to do this
	*/
	if(!window.confirm("Are you sure you want to remove " + oNumber.resNum_Digits + "?"))
	{
		return true;
	}

	/*
		We have to encode it to work properly across the web.
		Spaces and such can trip it up....
	*/
	var serverValues = Object();
	
	serverValues.id = oNumber.resNum_ID;
	serverValues.location = strRestrictedReceiverURL;
	serverValues.action = "remove";
	
	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	var responseText = server.callSync(serverValues);
	var responseInfo = responseText.split("||");

	if(eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		this.LoadLists();
		return true;
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	
	return true;
}

oReceiver_RestrictedAdmin.register();