
var strAddDocumentURL = "/modules/dms/server/document_add";
var strAddDocumentVersionURL = "/modules/dms/server/document_addVersion";
var strModifyDocumentURL = "/modules/dms/server/document_modifyFile";
var strModifyDocDetailsURL = "/modules/dms/server/document_modify";
var strAddDCRURL = "/modules/dms/server/document_addDCR";
var strDocCreateRequestURL = "/modules/dms/server/document_createRequest";

function ParseDMSXML(oXML)
{
	item_list = null;
	item_list = Array();
		
	var oRoot = oXML.documentElement;				
	var arItems = oRoot.getElementsByTagName("element");
	
	for(iAccount = 0; iAccount < arItems.length; iAccount++)
	{
		var oTransactionData = arItems[iAccount].firstChild;
		var oTransactionItems = arItems[iAccount].getElementsByTagName("item");
		
		item_list[iAccount] = GetTransaction(oTransactionData);
		
		item_list[iAccount].requestItems = GetTransactionItems(oTransactionItems);
    }

    return item_list;
}

/*--------------------------------------------------------------------------
	Retrieves the document title associated with the doc ID 
	from the server side
---------------------------------------------------------------------------*/
function GetDocumentTitle(docId)
{
	var serverValues = Object();

	serverValues.id = docId;
	serverValues.location = strDocumentURL;
	serverValues.action = "getdocumenttitle";

	var responseText = server.callSync(serverValues);
	
	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		return responseInfo[1];
	}
	
	return "";
}

/*--------------------------------------------------------------------------
	Parse out the transaction information, place it into an object
	and return it back to the calling function
---------------------------------------------------------------------------*/
function GetTransaction(oTransaction)
{
	listElement = Object();
	
	do
	{
		if(oTransaction.tagName != "")
		{
			listElement[oTransaction.tagName] = oTransaction.text;
		}
	} while (oTransaction = oTransaction.nextSibling);
	return listElement;
}
/*--------------------------------------------------------------------------
	Retrieve the transaction items
	returns an array of transaction item elements
---------------------------------------------------------------------------*/
function GetTransactionItems(oTransactionItems)
{
	transactionItemList = Array();
	iItem = 0;
	
	for(iItem = 0; iItem < oTransactionItems.length; iItem++)
	{
		
		oItem = oTransactionItems[iItem].firstChild;
		transactionItemList[iItem] = Object();
		
		do
		{
			if(oItem.tagName != "")
			{
				transactionItemList[iItem][oItem.tagName] = oItem.text;
			}
		} while (oItem = oItem.nextSibling);
	}
	
	return transactionItemList;
}
/*--------------------------------------------------------------------------
	Retrieve the request items
	-	requestId
		The id number of the request
	-	return
		null if no record retrieved
		otherwise an array representing
		the record retrieved from the server
---------------------------------------------------------------------------*/
GetDCRItem = function(requestId)
{
	if(!requestId)
	{
		return null;
	}
	
	if(requestId < 0)
	{
		return null;
	}
	
	var serverValues = Object();

	serverValues.requestId = requestId;
	serverValues.location = strDocumentURL;
	serverValues.action = "getitemlist";

	/*
		Contact the server with our request. Wait for the response.
	*/
	var xmlObject = server.CreateXMLSync(serverValues);
	transactionElement = ParseDMSXML(xmlObject);
	
	return transactionElement;
}

/*--------------------------------------------------------------------------
	Retrieve the item details of the selected item
	-	itemId
		The id number of the selected item
	-	return
		null if no record retrieved
		otherwise an array representing
		the record retrieved from the server
---------------------------------------------------------------------------*/
GetItemDetails = function(itemId)
{
	if(!itemId)
	{
		return null;
	}
	
	if(itemId < 0)
	{
		return null;
	}
	
	var serverValues = Object();

	serverValues.itemId = itemId;
	serverValues.location = strDocumentURL;
	serverValues.action = "getitemdetails";

	/*
		Contact the server with our request. Wait for the response.
	*/
	var xmlObject = server.CreateXMLSync(serverValues);
	transactionElement = ParseXML(xmlObject, "element");

	return transactionElement;
}

function dcr_ItemList(i)
{
		strCurrentStep = this.list[i].dcrItem_CurrentStep;
		strRequestUpdate = this.list[i].dcrItem_RequestUpdate;

		/*
			Row 1 is all details except for the request details text
		*/
		var element_Row = document.createElement("TR");
		element_Row.vAlign = "top";
		element_Row.align="center";

		var element_Row2 = document.createElement("TR");
		element_Row2.vAlign = "top";

		oSystem_Colors.SetPrimary(element_Row);
		oSystem_Colors.SetPrimary(element_Row2);
		
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

		element_Span1 = document.createElement("DIV");
		element_Span1.style.overflow = "hidden";
		element_Span1.style.height = "20px";
		element_Span1.style.paddingLeft = "2px";
		element_Span1.title = strCurrentStep;
		element_Span1.appendChild(document.createTextNode(strCurrentStep));
	
		element_Col1.appendChild(element_Span1);
	
		var element_Col2 = document.createElement("TD");
		element_Row.appendChild(element_Col2);
		
		element_Span2 = document.createElement("DIV");
		element_Span2.style.overflow = "hidden";
		element_Span2.style.height = "20px";
		element_Span2.style.paddingLeft = "2px";
		element_Span2.title = strRequestUpdate;
		element_Span2.appendChild(document.createTextNode(strRequestUpdate));
		
		element_Col2.appendChild(element_Span2);

		var element_Col3 = document.createElement("TD");
		element_Row.appendChild(element_Col3);
		screen_SetTextElement(element_Col3, this.list[i].dcrItem_PageNumber);
	
		var element_Col4 = document.createElement("TD");
		element_Row.appendChild(element_Col4);
		screen_SetTextElement(element_Col4, this.list[i].dcrItem_StepNumber);

		/*
			Set up the details link
		*/
		var element_Col5 = document.createElement("TD");
		element_Row.appendChild(element_Col5);
	
		element_Details = screen_CreateGraphicLink("icon_info.gif", "View request details");
		element_Details.itemId = this.list[i].dcrItem_ID;
		
		element_Details.onclick = function()
		{
			oDCR_Details.display(this.itemId, oDCR_Process.screen_Menu);
		}
	
		element_Col5.appendChild(element_Details);
}

function dcrAssigned_ItemList(i)
{
		strCurrentStep = this.list[i].dcrItem_CurrentStep;
		strRequestUpdate = this.list[i].dcrItem_RequestUpdate;

		/*
			Row 1 is all details except for the request details text
		*/
		var element_Row = document.createElement("TR");
		element_Row.vAlign = "top";
		element_Row.align="center";

		var element_Row2 = document.createElement("TR");
		element_Row2.vAlign = "top";

		oSystem_Colors.SetPrimary(element_Row);
		oSystem_Colors.SetPrimary(element_Row2);
		
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

		element_Span1 = document.createElement("DIV");
		element_Span1.style.overflow = "hidden";
		element_Span1.style.height = "20px";
		element_Span1.style.paddingLeft = "2px";
		element_Span1.title = strCurrentStep;
		element_Span1.appendChild(document.createTextNode(strCurrentStep));
	
		element_Col1.appendChild(element_Span1);
	
		var element_Col2 = document.createElement("TD");
		element_Row.appendChild(element_Col2);
		
		element_Span2 = document.createElement("DIV");
		element_Span2.style.overflow = "hidden";
		element_Span2.style.height = "20px";
		element_Span2.style.paddingLeft = "2px";
		element_Span2.title = strRequestUpdate;
		element_Span2.appendChild(document.createTextNode(strRequestUpdate));
		
		element_Col2.appendChild(element_Span2);

		var element_Col3 = document.createElement("TD");
		element_Row.appendChild(element_Col3);
		screen_SetTextElement(element_Col3, this.list[i].dcrItem_PageNumber);
	
		var element_Col4 = document.createElement("TD");
		element_Row.appendChild(element_Col4);
		screen_SetTextElement(element_Col4, this.list[i].dcrItem_StepNumber);

		/*
			Set up the details link
		*/
		var element_Col5 = document.createElement("TD");
		element_Row.appendChild(element_Col5);
	
		element_Details = screen_CreateGraphicLink("icon_info.gif", "View request details");
		element_Details.itemId = this.list[i].dcrItem_ID;
		
		element_Details.onclick = function()
		{
			oDCR_Details.display(this.itemId, oDCR_ProcessAssigned.screen_Menu);
		}
	
		element_Col5.appendChild(element_Details);
}

function dcrRequester_ItemList(i)
{
		strCurrentStep = this.list[i].dcrItem_CurrentStep;
		strRequestUpdate = this.list[i].dcrItem_RequestUpdate;

		/*
			Row 1 is all details except for the request details text
		*/
		var element_Row = document.createElement("TR");
		element_Row.vAlign = "top";
		element_Row.align="center";

		var element_Row2 = document.createElement("TR");
		element_Row2.vAlign = "top";

		oSystem_Colors.SetPrimary(element_Row);
		oSystem_Colors.SetPrimary(element_Row2);
		
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

		element_Span1 = document.createElement("DIV");
		element_Span1.style.overflow = "hidden";
		element_Span1.style.height = "20px";
		element_Span1.style.paddingLeft = "2px";
		element_Span1.title = strCurrentStep;
		element_Span1.appendChild(document.createTextNode(strCurrentStep));
	
		element_Col1.appendChild(element_Span1);
	
		var element_Col2 = document.createElement("TD");
		element_Row.appendChild(element_Col2);
		
		element_Span2 = document.createElement("DIV");
		element_Span2.style.overflow = "hidden";
		element_Span2.style.height = "20px";
		element_Span2.style.paddingLeft = "2px";
		element_Span2.title = strRequestUpdate;
		element_Span2.appendChild(document.createTextNode(strRequestUpdate));
		
		element_Col2.appendChild(element_Span2);

		var element_Col3 = document.createElement("TD");
		element_Row.appendChild(element_Col3);
		screen_SetTextElement(element_Col3, this.list[i].dcrItem_PageNumber);
	
		var element_Col4 = document.createElement("TD");
		element_Row.appendChild(element_Col4);
		screen_SetTextElement(element_Col4, this.list[i].dcrItem_StepNumber);

		/*
			Set up the details link
		*/
		var element_Col5 = document.createElement("TD");
		element_Row.appendChild(element_Col5);
	
		element_Details = screen_CreateGraphicLink("icon_info.gif", "View request details");
		element_Details.itemId = this.list[i].dcrItem_ID;
		
		element_Details.onclick = function()
		{
			oDCR_Details.display(this.itemId, oDCR_ProcessRequester.screen_Menu);
		}
	
		element_Col5.appendChild(element_Details);
}

function dcrSearch_ItemList(i)
{
		strCurrentStep = this.list[i].dcrItem_CurrentStep;
		strRequestUpdate = this.list[i].dcrItem_RequestUpdate;

		/*
			Row 1 is all details except for the request details text
		*/
		var element_Row = document.createElement("TR");
		element_Row.vAlign = "top";
		element_Row.align="center";

		var element_Row2 = document.createElement("TR");
		element_Row2.vAlign = "top";

		oSystem_Colors.SetPrimary(element_Row);
		oSystem_Colors.SetPrimary(element_Row2);
		
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

		element_Span1 = document.createElement("DIV");
		element_Span1.style.overflow = "hidden";
		element_Span1.style.height = "20px";
		element_Span1.style.paddingLeft = "2px";
		element_Span1.title = strCurrentStep;
		element_Span1.appendChild(document.createTextNode(strCurrentStep));
	
		element_Col1.appendChild(element_Span1);
	
		var element_Col2 = document.createElement("TD");
		element_Row.appendChild(element_Col2);
		
		element_Span2 = document.createElement("DIV");
		element_Span2.style.overflow = "hidden";
		element_Span2.style.height = "20px";
		element_Span2.style.paddingLeft = "2px";
		element_Span2.title = strRequestUpdate;
		element_Span2.appendChild(document.createTextNode(strRequestUpdate));
		
		element_Col2.appendChild(element_Span2);

		var element_Col3 = document.createElement("TD");
		element_Row.appendChild(element_Col3);
		screen_SetTextElement(element_Col3, this.list[i].dcrItem_PageNumber);
	
		var element_Col4 = document.createElement("TD");
		element_Row.appendChild(element_Col4);
		screen_SetTextElement(element_Col4, this.list[i].dcrItem_StepNumber);

		/*
			Set up the details link
		*/
		var element_Col5 = document.createElement("TD");
		element_Row.appendChild(element_Col5);
	
		element_Details = screen_CreateGraphicLink("icon_info.gif", "View request details");
		element_Details.itemId = this.list[i].dcrItem_ID;
		
		element_Details.onclick = function()
		{
			oDCR_Details.display(this.itemId, oDCR_SearchDetails.screen_Menu);
		}
	
		element_Col5.appendChild(element_Details);
}

/*--------------------------------------------------------------------------
	-	For the request actions which require little or no input
	from the user we can call ChangeDCRStatus
	-	requestId
		The request id we want to modify the status for
	-	strStatus
		The text name of the new status
	-	strComment
		A user supplied comment for this status
---------------------------------------------------------------------------*/
function ChangeDCRStatus(requestId, strStatus, role, strComment, strClarifyUser, strWriter)
{
	/*
		The values we're submitting to the server.
	*/
	
	if(!strComment)
	{
		strComment = "";
	}
	
	if(!strWriter)
	{
		strWriter = "";
	}
	
	if(!strClarifyUser)
	{
		strClarifyUser = "";
	}

	var serverValues = Object();
	
	serverValues.requestId = requestId;
	serverValues.status = strStatus;
	serverValues.role = role;
	serverValues.comment = strComment;
	serverValues.writer = strWriter;
	serverValues.clarifyUser = strClarifyUser;
	serverValues.location = strDocumentURL;
	serverValues.action = "statuschange";

	/*
		Contact the server with our request. wait for the response and
		then display it to the user
	*/
	var responseText = server.callSync(serverValues);
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

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function dcr_StatusHistoryList(i)
{
	var element_Row = document.createElement("TR");
	element_Row.vAlign = "top";
	element_Row.align="center";

	oSystem_Colors.SetPrimary(element_Row);
	
	if(i % 2 == 1)
	{
		oSystem_Colors.SetSecondaryBackground(element_Row);
	}
	else
	{
		oSystem_Colors.SetTertiaryBackground(element_Row);
	}
	
	this.element_body.appendChild(element_Row);
	
	var element_Col1 = document.createElement("TD");
	element_Row.appendChild(element_Col1);
	
	element_Div = document.createElement("DIV");
	element_Col1.appendChild(element_Div);

	statusName = this.list[i].status_Name;
	assignedUser = this.list[i].assigned_User;
	
	if(statusName == "Assigned" || statusName == "Peer Review")
	{
		if(assignedUser == "")
		{
			assignedUser = "user not set";
		}
	
		screen_SetTextElement(element_Div, statusName + ": " + assignedUser);
	}

	else if(statusName == "Clarify" || statusName == "Review (Pending)")
	{
		if(assignedUser == "")
		{
			assignedUser = "user not set";
		}
	
		screen_SetTextElement(element_Div, statusName + ": " + assignedUser);
	}

	else
	{
		screen_SetTextElement(element_Col1, statusName);
	}

	arDate = this.list[i].dcrstatus_Date.split(" ");
	strDate = formatDate(arDate[0]);
	strTime = formatTime(arDate[1]);

	var element_Col2 = document.createElement("TD");
	element_Row.appendChild(element_Col2);
	screen_SetTextElement(element_Col2, strDate + " (" + strTime + ")");
	
	userName = this.list[i].user_Name;

	if(userName == "")
	{
		userName = "<System Update>";
	}
	
	var element_Col3 = document.createElement("TD");
	element_Row.appendChild(element_Col3);
	screen_SetTextElement(element_Col3, userName);

	var element_Row2 = document.createElement("TR");
	element_Row2.vAlign = "top";
	this.element_body.appendChild(element_Row2);
	
	element_ColDesc = document.createElement("TD");
	element_Row2.appendChild(element_ColDesc);
	element_ColDesc.colSpan = "3";
	element_ColDesc.title = "The status comment submitted by the user";

	strDescription = this.list[i].dcrstatus_Comments;
	
	if(strDescription == "")
	{
		strDescription = "<no comment>";	
	}

	element_Div2 = document.createElement("DIV");
	element_ColDesc.appendChild(element_Div2);
	screen_SetTextElement(element_Div2, strDescription);
	
	element_Div2.style.paddingLeft = "6px";
	element_Div2.style.height = "50px";
	element_Div2.style.overflow = "auto";

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
}
/*-----------------------------------------------------------------------------
	The purpose of this file is to display a list of all the versions 
	of a document.
-----------------------------------------------------------------------------*/
var oDocumentVersionList = new system_list("docVersion_ID", "docVersion_Ver",  "getdocumentversions");

oDocumentVersionList.serverURL = strDocumentURL;
oDocumentVersionList.bSort = false;