
oSystem_Debug.notice("Loading csg_common");

var strAddCSGRequestURL = "/modules/csg/server/addOldCSGRequest";
var strModifyCSGRequestURL = "/modules/csg/server/modifyOldCSGRequest";

var oCSGHistory_Filter = new system_list("csgHistoryFilter_Type", "csgHistoryFilter_Name", "csgHistoryFilter");

oCSGHistory_Filter.load = function()
{
	this.clear();

	this.field_Value = "value";
	this.addElement(0, "Last Two Weeks", 0);
	this.addElement(1, "90 Days", 1);
	this.addElement(2, "All Transactions", 2);
}

function ParseCSGXML(oXML)
{
	transaction_list = null;
	transaction_list = Array();
		
	var oRoot = oXML.documentElement;				//	used as a shortcut instead of typing the entire name
	var arTransactions = oRoot.getElementsByTagName("element");
	
	for(iAccount = 0; iAccount < arTransactions.length; iAccount++)
	{
		var oTransactionData = arTransactions[iAccount].firstChild;
		var oTransactionItems = arTransactions[iAccount].getElementsByTagName("requestItem");
		
		transaction_list[iAccount] = GetTransaction(oTransactionData);
		
		transaction_list[iAccount].requestItems = GetTransactionItems(oTransactionItems);
    }

    return transaction_list;
}
/*
	Parse out the transaction information, place it into an object
	and return it back to the calling function
*/
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
/*
	Retrieve the transaction items
	returns an array of transaction item elements
*/
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
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function csg_CommonStatusList(i)
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
	screen_SetTextElement(element_Col1, this.list[i].status_Name);
	
	appendChild(element_Col1, "BR");

	element_Col1Desc = document.createElement("SPAN");
	element_Col1.appendChild(element_Col1Desc);
	screen_SetTextElement(element_Col1Desc, this.list[i].status_Details);
	element_Col1Desc.style.fontSize="80%";
	element_Col1Desc.style.paddingLeft = "6px";

	var element_Col2 = document.createElement("TD");
	element_Row.appendChild(element_Col2);
	screen_SetTextElement(element_Col2, this.list[i].status_Date);
	
	var element_Col4 = document.createElement("TD");
	screen_SetTextElement(element_Col4, this.list[i].user_Name);
	element_Row.appendChild(element_Col4);

}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function csg_CommonReceiverStatusList(i)
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
	screen_SetTextElement(element_Col1, formatReceiver(this.list[i].transtype_Receiver));

	var element_Col2 = document.createElement("TD");
	element_Row.appendChild(element_Col2);
	screen_SetTextElement(element_Col2, formatSmartcard(this.list[i].transtype_SmartCard));
	
	strDisplay = "no";

	if(this.list[i].transtype_BasicAuth == true)
	{
		strDisplay = "yes";
	}

	if(this.list[i].transtype_BasicAuth == 1)
	{
		strDisplay = "yes";
	}

	element_Col3 = document.createElement("TD");
	screen_SetTextElement(element_Col3, strDisplay);
	element_Row.appendChild(element_Col3);
	
	var element_Col4 = document.createElement("TD");
	
	strDisplay = (this.list[i].transtype_AppsAuth == true) ? "yes" : "no";
	screen_SetTextElement(element_Col4, strDisplay);
	element_Row.appendChild(element_Col4);

	element_DetailsCol = document.createElement("TD");
	element_DetailsCol.colSpan = "4";
	element_Row2.appendChild(element_DetailsCol);
	
	if(this.list[i].transtype_Details.length)
	{
		screen_SetTextElement(element_DetailsCol, this.list[i].transtype_Details);
	}
	else
	{
		//	We have to fill the space so it's even
		screen_SetTextElement(element_DetailsCol, "<no details>");
	}
}

/*
	-	For the request actions which require little or no input
	from the user we can call ChangeRequestStatus
	-	requestId
		The request id we want to modify the status for
	-	strStatus
		The text name of the new status
	-	strComment
		A user supplied comment for this status
		
*/
function ChangeRequestStatus(requestId, strStatus, strComment)
{
	/*
		The values we're submitting to the server.
	*/
	
	if(!strComment)
	{
		strComment = "";
	}
	
	var serverValues = Object();
	
	serverValues.transid = requestId;
	serverValues.status = strStatus;
	serverValues.location = strCSG_URL;
	serverValues.comment = strComment;
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
/*

	Retrieve an individual transaction
	-	requestId
		The id number of the request
	-	return
		null if no record retrieved
		otherwise an array representing
		the record retrieved from the server

*/
function GetCSGTransaction(requestId)
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

	serverValues.transid = requestId;
	serverValues.location = strCSG_URL;
	serverValues.action = "gettransactionlist";

	/*--------------------------------------------------------------------------
		Contact the server with our request. Wait for the response.
	----------------------------------------------------------------------------*/
	var xmlObject = server.CreateXMLSync(serverValues);
	transactionElement = ParseCSGXML(xmlObject);
	
	return transactionElement;
}