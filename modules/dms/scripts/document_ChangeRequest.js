/*-------------------------------------------------------------------
	The purpose of this file is to submit a document change request 
	(DCR) entered by the client to the server, which will email the 
	change request to the DMS_Admin
-------------------------------------------------------------------*/
function documentClass()
{
}
var strDocumentURL =  "/modules/dms/server/document";
var strAddDCRURL = "/modules/dms/server/document_addDCR";

var oDocumentChangeRequest = new system_AppScreen();
oDocumentChangeRequest.oRequestTable = new system_SortTable();

oDocumentChangeRequest.docId = 0;
oDocumentChangeRequest.screen_Name = "document_ChangeRequest";
oDocumentChangeRequest.screen_Menu = "Document Change Request";
oDocumentChangeRequest.module_Name = "dms";

oDocumentChangeRequest.bChangesMade = false;			//	keeps track of whether a request was modified or not
oDocumentChangeRequest.bEditing = false;				//	keeps track of whether user is editing an already added
														//	DCR transaction.

oDocumentChangeRequest.oRequestTable.custom_element = function(i)
{
	/*
		Row 1 is all details except for the request details text
	*/
	
	strCurrentStep = this.list[i].currentStep;
	strRequestUpdate = this.list[i].requestUpdate;

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

	element_Span1 = document.createElement("DIV");
	element_Span1.style.overflow = "hidden";
	element_Span1.style.height = "20px";
	element_Span1.style.paddingLeft = "2px";
	element_Span1.appendChild(document.createTextNode(strCurrentStep));

	text_link = ["", strCurrentStep];
	SetToolTip(element_Span1, text_link);
	
	element_Col1.appendChild(element_Span1);
	
	var element_Col2 = appendChild(element_Row, "TD");
	
	element_Span2 = appendChild(element_Col2, "DIV");

	element_Span2.style.overflow = "hidden";
	element_Span2.style.height = "20px";
	element_Span2.style.paddingLeft = "2px";
	element_Span2.title = strRequestUpdate;
	element_Span2.appendChild(document.createTextNode(strRequestUpdate));
	
	var element_Col3 = document.createElement("TD");
	element_Row.appendChild(element_Col3);
	screen_SetTextElement(element_Col3, this.list[i].pageNumber);
	
	var element_Col4 = document.createElement("TD");
	element_Row.appendChild(element_Col4);
	screen_SetTextElement(element_Col4, this.list[i].stepNumber);

	var element_Col5 = document.createElement("TD");
	element_Row.appendChild(element_Col5);
	
	element_EditItem = screen_CreateGraphicLink("b_edit.gif", "Edit this item");
	element_EditItem.style.paddingRight = "10px";
	element_EditItem.itemid = i;
	element_Col5.appendChild(element_EditItem);

	element_RemoveItem = screen_CreateGraphicLink("b_drop.gif", "Remove this item from the request");
	element_RemoveItem.style.paddingRight = "10px";
	element_RemoveItem.itemid = i;
	element_Col5.appendChild(element_RemoveItem);

	/*
		Put in the code for the elements which may be clicked
	*/
	element_EditItem.onclick = function()
	{
		oDocumentChangeRequest.EditItem(this.itemid);
	}

	element_RemoveItem.onclick = function()
	{
		oDocumentChangeRequest.oRequestTable.removeElement(this.itemid);
		oDocumentChangeRequest.oRequestTable.Display();
	}
}

/*-------------------------------------------------------------------
	Perform any special cases that need to be performed before
	displaying the screen
-------------------------------------------------------------------*/
oDocumentChangeRequest.custom_Show = function()
{
	this.ClearResults();
	return true;
}
/*-------------------------------------------------------------------
	Perform some checking before we allow the user
	to leave the page
-------------------------------------------------------------------*/
oDocumentChangeRequest.custom_Hide = function()
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

	return true;
}
/*-------------------------------------------------------------------
	Loading the fields and buttons.
-------------------------------------------------------------------*/
oDocumentChangeRequest.custom_Load = function()
{
	this.oRequestTable.setName("document_ChangeRequestTable");
	this.oRequestTable.SetCaption("Items");
	this.oRequestTable.SetNoResultsMessage("");
	this.oRequestTable.pageLength = 10;
	
	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Current Step";
		arHeader[0].tip = "The description of the current step within the document.";
		arHeader[0].width = "30%";
	arHeader[1] = Object();
		arHeader[1].text = "Requested Update";
		arHeader[1].tip = "The description of the requested update of the current step.";
		arHeader[1].width = "30%";
	arHeader[2] = Object();
		arHeader[2].text = "Page #";
		arHeader[2].tip = "The page number of the document change request.";
		arHeader[2].width = "12%";
	arHeader[3] = Object();
		arHeader[3].text = "Step #";
		arHeader[3].tip = "The step number of the document change request.";
		arHeader[3].width = "12%";
	arHeader[4] = Object();
		arHeader[4].width = "16%";
		arHeader[4].text = "Actions";
		
	this.oRequestTable.SetHeader(arHeader);

	/*-----------------------------------------------------------------------------
		Adds the calendar to the Document Change Request Page. When the user selects a month, days and
		years appear. Number of days are determined by the month. 
	-------------------------------------------------------------------------------*/
	//this.oAddCalendar = new system_Calendar();
	//this.oAddCalendar.load("docChangeRequestCalendar");

	this.element_submitRequest = oScreenBuffer.Get("docChangeReqSubmitButton");
	this.element_addRequest = oScreenBuffer.Get("docChangeReqAddButton");
	this.element_clearRequest = oScreenBuffer.Get("docChangeReqClearButton");
	this.element_backButton = oScreenBuffer.Get("docChangeReqBackButton");
	
	this.element_docChangeReqTitle = oScreenBuffer.Get("docChangeReqTitle");
	this.element_docChangeReqType = oScreenBuffer.Get("docChangeReqType");
	this.element_docChangeReqVerList = oScreenBuffer.Get("docChangeReqVerList");
	this.element_docChangeReqPageNum = oScreenBuffer.Get("docChangeReqPageNum");
	this.element_docChangeReqStepNum = oScreenBuffer.Get("docChangeReqStepNum");
	this.element_docChangeReqCurrent = oScreenBuffer.Get("docChangeReqCurrent");
	this.element_docChangeReqUpdate = oScreenBuffer.Get("docChangeReqUpdate");
	this.element_Form = oScreenBuffer.Get("docChangeRequestForm");

	this.element_submitRequest.onclick = function ()
	{
		oDocumentChangeRequest.Submit();
	};

	this.element_addRequest.onclick = function()
	{
		oDocumentChangeRequest.AddRequestItem();
	};
	
	this.element_clearRequest.onclick = function ()
	{
		oDocumentChangeRequest.ClearFields();
	};

	this.element_backButton.backScreen = "";
	this.element_backButton.onclick = function ()
	{
		oCatenaApp.navigate(oDocumentChangeRequest.backScreen, page_param_display);
	};

	/*
		Sets up the color scheme for the viewable div elements  on the screen:
		Title, Type, and Version.
	*/
	oSystem_Colors.SetPrimary(this.element_docChangeReqTitle);
	oSystem_Colors.SetTertiaryBackground(this.element_docChangeReqTitle);
	
	oSystem_Colors.SetPrimary(this.element_docChangeReqType);
	oSystem_Colors.SetTertiaryBackground(this.element_docChangeReqType);
	
	/*
		Set the form path
	*/
	this.element_Form.action = strAddDCRURL + ".php";

	return true;
}

/*-----------------------------------------------------------------------------
	Loads the list of all the versions of a document
-------------------------------------------------------------------------------*/
oDocumentChangeRequest.LoadLists = function()
{
	oDocumentVersionList.addParam("id", this.docId);
	oDocumentVersionList.load();
	oDocumentVersionList.fillControl("docChangeReqVerList", false);
}

/*-------------------------------------------------------------------
	ClearFields clears all the fields for the Document Change Request
-------------------------------------------------------------------*/
oDocumentChangeRequest.ClearFields = function()
{
	this.LoadLists();
	this.element_docChangeReqPageNum.value = "";
	this.element_docChangeReqStepNum.value = "";
	this.element_docChangeReqCurrent.value = "";
	this.element_docChangeReqUpdate.value = "";
}
/*-------------------------------------------------------------------
	ClearResults clears the Document Change Request and Items
-------------------------------------------------------------------*/
oDocumentChangeRequest.ClearResults = function()
{
	this.bChangesMade = false;
	this.LoadLists();
	this.ClearFields();
	this.oRequestTable.clear();
}

/*-------------------------------------------------------------------
	The values we're submitting to the server. In this case data 
	to email a change request to the DMS_Admin of the selected 
	document.
-------------------------------------------------------------------*/
oDocumentChangeRequest.Submit = function()
{
	/*
		Check the fields as they may have added an item but not added it to the list
	*/
	
	if(this.element_docChangeReqPageNum.value)
	{
		if(confirm("There is content in the page # field. Do you want to add this item to the request?") == false)
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
		oCatenaApp.showNotice(notice_Error, "At least one item must be added to the item list to submit the request.");
		return false;
	}

	/*
		If we have a transaction id then we are editing an existing
		transaction and therefore go to a different page then
		the add.
		
		Scrub the form.
	*/

	RemoveChildren(this.element_Form);

	this.element_Form.action = strAddDCRURL + ".php";

	this.element_Form.appendChild(screen_CreateInputElement("id", this.docId));
	this.element_Form.appendChild(screen_CreateInputElement("version", this.element_docChangeReqVerList.value));
	this.element_Form.appendChild(screen_CreateInputElement("count", itemCount));

	/*
		Loop through each item and add it to the form
	*/

	for(iItem = 0; iItem < itemCount; iItem++)
	{
		record = this.oRequestTable.list[iItem];
		
		this.element_Form.appendChild(screen_CreateInputElement("pageNumber" + iItem, record.pageNumber));
		this.element_Form.appendChild(screen_CreateInputElement("stepNumber" + iItem, record.stepNumber));
		this.element_Form.appendChild(screen_CreateInputElement("currentStep" + iItem, record.currentStep));
		this.element_Form.appendChild(screen_CreateInputElement("requestUpdate" + iItem, record.requestUpdate));
	}
		
	this.element_Form.submit();

	RemoveChildren(this.element_Form);

	return true;
}

/*---------------------------------------------------------------------------
	This function loads the fields with an element
	which has already been added.
	It also removes the item from the list so when
	the user re adds it, then it's updated with the
	new information.
----------------------------------------------------------------------------*/
oDocumentChangeRequest.EditItem = function(itemid)
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

	//this.element_docChangeReqVerList.value = requestItem.version;
	this.element_docChangeReqPageNum.value = requestItem.pageNumber;
	this.element_docChangeReqStepNum.value = requestItem.stepNumber;
	this.element_docChangeReqCurrent.value = requestItem.currentStep;
	this.element_docChangeReqUpdate.value = requestItem.requestUpdate;
	
	this.oRequestTable.removeElement(itemid);
	this.oRequestTable.Display();
	
}

/*---------------------------------------------------------------------------
	Displays the fields of a document that a DCR is creatd for based upon 
	what's passed in as docId.
	By either cancelling or submitting a successful request, sets
	focus to the screen passed in.
		-	Tell the back button where it should send the user
			if they click it
		-	clear all of the fields in this form
		-	draw the screen submitting a DCR
		-	send a request to the server to retrieve the data for this document
----------------------------------------------------------------------------*/
oDocumentChangeRequest.Display = function(docId, backScreen)
{
	oCatenaApp.navigate(this.screen_Menu);
	this.backScreen = backScreen;
	this.ClearFields();
	this.docId = docId;
	this.LoadLists();

	/*
		Setting server values and contacting the server with our request for 
		the document list. Wait for the response and then display it to 
		the user. The document list should only have one element.
	*/
	var serverValues = Object();

	serverValues.id = docId;
	serverValues.location = strDocumentURL;
	serverValues.action = "getdocumentlist";

	var xmlObject = server.CreateXMLSync(serverValues);

	var docList = ParseXML(xmlObject, "element", documentClass);
	
	if(docList.length == 1)
	{
		/*
			Load the stored document entry from the database and display it in the 
			proper fields based on the doc ID.  
		*/
		strTitle = docList[0]['doc_Title'];
		strType = docList[0]['docType_Name'];
				
	 	screen_SetTextElement(this.element_docChangeReqTitle, strTitle);
		screen_SetTextElement(this.element_docChangeReqType, strType); 

		/*
			Make the Divs look more presentable so that the document data is displayed 
			and does not allow the client to modify the field.
			First add a border and then put some cell padding down so that the text 
			is not right on top of the edge of the div.
		*/
		this.element_docChangeReqTitle.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_docChangeReqTitle.style.padding = "3px";
		this.element_docChangeReqTitle.title = strTitle;
		
		this.element_docChangeReqType.style.border = "1px solid " + oSystem_Colors.GetPrimary();		
		this.element_docChangeReqType.style.padding = "3px";
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, "Unable to load the document data for submitting a document change request.");
	}
	
	return true;
}

/*---------------------------------------------------------------------------
	Displays "Uploading..." message and resets the form for another 
	file upload.
----------------------------------------------------------------------------*/
oDocumentChangeRequest.DisplayMessage = function(strMsg)
{
	var responseInfo = strMsg.split("||");
	if(eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		this.ClearResults();
		oCatenaApp.navigate(this.backScreen, page_param_display);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
	}
	ShowInheritElement("docChangeReqSubmitButton");
}

/*
	AddRequest sends a request to the server to validate,
	and then adds it to a list of elements which will be
	eventually sent to the server for adding a DCR.
*/
oDocumentChangeRequest.AddRequestItem = function()
{
	/*
		- Send the request to the server and validate it
	*/

	var serverValues = Object();
	serverValues.pageNumber = this.element_docChangeReqPageNum.value;
	serverValues.stepNumber = this.element_docChangeReqStepNum.value;
	serverValues.currentStep = this.element_docChangeReqCurrent.value;
	serverValues.requestUpdate = this.element_docChangeReqUpdate.value;
	serverValues.version = this.element_docChangeReqVerList.value;
	serverValues.id = this.docId;

	serverValues.location = strDocumentURL;
	serverValues.action = "validateitem";

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
		shows the items available to the user
	*/
	pageNumber = this.element_docChangeReqPageNum.value;
	stepNumber = this.element_docChangeReqStepNum.value;
	currentStep = this.element_docChangeReqCurrent.value;
	requestUpdate = this.element_docChangeReqUpdate.value;

	this.AddElement(pageNumber, stepNumber, currentStep, requestUpdate);

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
oDocumentChangeRequest.AddElement = function(pageNumber, stepNumber, currentStep, requestUpdate)
{
	newElement = new Object();
	
	newElement.currentStep = currentStep;
	newElement.requestUpdate = requestUpdate;
	newElement.pageNumber = pageNumber;
	newElement.stepNumber = stepNumber;
		
	this.oRequestTable.addElement(newElement);

	return true;
}

oDocumentChangeRequest.register();