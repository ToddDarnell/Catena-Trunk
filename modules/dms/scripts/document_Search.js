/*--------------------------------------------------------------------------
	The purpose of this file is to search for documents and display 
	action links for the documents.
--------------------------------------------------------------------------*/
var strDocumentURL =  "/modules/dms/server/document";

var strSearchDoc_Menu = "Search Documents";
var strDocumentURL =  "/modules/dms/server/document";

oSearchDocument = new system_SearchScreen();

oSearchDocument.screen_Menu = strSearchDoc_Menu;
oSearchDocument.screen_Name = "document_Search";
oSearchDocument.module_Name = "dms";

oSearchDocument.search_List	= "getdocumentlist";
oSearchDocument.search_URL = strDocumentURL;

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oSearchDocument.LoadLists = function()
{
	oRights.fillOrgControl(oRights.DMS_Standard, "SearchDocOrgList", true);
	oDocumentTypeList.load();
	oDocumentTypeList.fillControl("SearchDocTypeList", true);

}
/*--------------------------------------------------------------------------
    Perform any special cases that need to be performed
    before the screen is displayed.
--------------------------------------------------------------------------*/
oSearchDocument.custom_Show = function()
{
	this.LoadLists();
}

/*--------------------------------------------------------------------------
	Load the document search functionality now
--------------------------------------------------------------------------*/
oSearchDocument.custom_Load = function()
{
	/*
		Display the titles of the fields in the header.
		Create and display the table with searched results found.
	*/
	arHeader = Array();
	
	arHeader[0] = Object();
		arHeader[0].text = "Title";
	arHeader[1] = Object();
		arHeader[1].text = "Type";
	arHeader[2] = Object();
		arHeader[2].text = "Organization";
	arHeader[3] = Object();
		arHeader[3].text = "Action";
	
	this.oResults.SetHeader(arHeader);
    this.oResults.SetCaption("Results");
    
    this.oResults.custom_element = DMS_DisplayResults;
    this.oResults.pageLength = 10;

 	this.oResults.custom_onchange = DMS_HidePopup;
	
	return true;
}

/*--------------------------------------------------------------------------
	-	description
			Calls the object funtion OnPageChange() to hide the 
			version popup
--------------------------------------------------------------------------*/
DMS_HidePopup = function()
{
	oSearchDocument.custom_OnChange();	
}
/*--------------------------------------------------------------------------
	-	description
			Hides the version popup if the results page has been changed to
			the next page.
--------------------------------------------------------------------------*/
oSearchDocument.custom_OnChange = function()
{
	HideElement("versionPopup");
}
/*--------------------------------------------------------------------------
	fnProcess is called once the data has been received
	from the server. Since we have to use a stand alone
	function due to the way JavaScript treats functions
	we're creating a wrapper call back function.
--------------------------------------------------------------------------*/
oSearchDocument.fnProcess = function(strResults)
{
	oSearchDocument.ProcessResults(strResults);
}

/*--------------------------------------------------------------------------
	Custom clear allows a developer to add custom functionality
	to clear elements which are not part of the base class but
	must be cleared.
--------------------------------------------------------------------------*/
oSearchDocument.custom_Clear = function()
{
	oScreenBuffer.Get("SearchDocTitle").value = "";
	oScreenBuffer.Get("SearchDocDescription").value = "";
	oScreenBuffer.Get("SearchDocTypeList").value = "";
	oScreenBuffer.Get("SearchDocOrgList").value = "";
}

/*--------------------------------------------------------------------------
	Custom clear_results allows a developer to clear the searched
	results displayed.
--------------------------------------------------------------------------*/
oSearchDocument.custom_ClearResults = function()
{
	HideElement("versionPopup"); 

	var popupBox = oScreenBuffer.Get("versionPopup");

	popupBox.style.top = 0;
}

/*--------------------------------------------------------------------------
	Display the results returned from the server.
	If no results are displayed this function is not called
--------------------------------------------------------------------------*/
DMS_DisplayResults = function(listPosition)
{
	i = listPosition;
	/*
		Must extract the \ escape character inserted before every ' on 
		the SQL side for both the Title and Description.
	*/
	var strTitle = (this.list[i].doc_Title).replace(/\\+'/g, "'");
	var strDescription = (this.list[i]["doc_Description"]).replace(/\\+'/g, "'");

	var resultRow = document.createElement("TR");
	oSystem_Colors.SetSecondaryBackground(resultRow);
	resultRow.vAlign  = "top";
	this.element_body.appendChild(resultRow);

	if(i % 2 == 1)
	{
		oSystem_Colors.SetSecondaryBackground(resultRow);
	}
	else
	{
		oSystem_Colors.SetTertiaryBackground(resultRow);
	}

	var resultCol1 = document.createElement("TD");
	resultRow.appendChild(resultCol1);
	resultCol1.width = "50%";
	
	resultDiv = document.createElement("DIV");
	resultCol1.appendChild(resultDiv);
	screen_SetTextElement(resultDiv, strTitle);
	
	resultDiv.style.paddingLeft = "6px";
	resultDiv.style.height = "25px";
	resultDiv.style.fontWeight = "bold";
	
	var resultCol2 = document.createElement("TD");
	resultRow.appendChild(resultCol2);
	resultCol2.innerHTML = this.list[i].docType_Name;
	resultCol2.align = "center";
	resultCol2.width = "15%";
	
	var resultCol3 = document.createElement("TD");
	resultRow.appendChild(resultCol3);
	resultCol3.appendChild(screen_CreateOrganizationLink(this.list[i].org_Short_Name));
	resultCol3.align = "center";
	resultCol3.width = "15%";

	var element_Col4 = document.createElement("TD");
	resultRow.appendChild(element_Col4);
	element_Col4.appendChild(DMS_DisplayVersionLinks(this.list[i].doc_ID, this.list[i].org_Short_Name));
	element_Col4.width = "25%";
	element_Col4.rowSpan = "2";

	var resultRow2 = document.createElement("TR");
	resultRow2.vAlign  = "top";
	this.element_body.appendChild(resultRow2);
	
	var resultCol = document.createElement("TD");
	resultRow2.appendChild(resultCol);
	resultCol.colSpan = "3";
	resultCol.title = "The document description.";

	resultDiv2 = document.createElement("DIV");
	resultCol.appendChild(resultDiv2);
	screen_SetTextElement(resultDiv2, strDescription);
	
	resultDiv2.style.paddingLeft = "6px";
	resultDiv2.style.height = "70px";
	resultDiv2.style.overflow = "auto";
	
	if(i % 2 == 1)
	{
		oSystem_Colors.SetSecondaryBackground(resultRow);
		oSystem_Colors.SetSecondaryBackground(resultRow2);
	}
	else
	{
		oSystem_Colors.SetTertiaryBackground(resultRow);
		oSystem_Colors.SetTertiaryBackground(resultRow2);
	}

}
/*--------------------------------------------------------------------------
	Display the version links for the specified record.
	This function fills in the field which displays
	Current Version, Document History, Modify, and Add Version.
--------------------------------------------------------------------------*/
DMS_DisplayVersionLinks = function(strDocID, strOrg)
{
	/*
		Declare all of the variables for the version links
	*/
	var result = document.createElement("TD");
	result.width = "25%";

	var element_currentVer = document.createElement("SPAN");
	var element_docHistory = document.createElement("SPAN");
	var element_modify = document.createElement("SPAN");
	var element_addVer = document.createElement("SPAN");
	var element_delete = document.createElement("SPAN");
	var element_changeReq = document.createElement("SPAN");

	var break1 = document.createElement("BR");
	var break2 = document.createElement("BR");
	var break3 = document.createElement("BR");
	var break4 = document.createElement("BR");
	var break5 = document.createElement("BR");

	/*
		Assign their value, set their attributes
	*/
	element_currentVer.className = "link";
	element_docHistory.className = "link";
	element_modify.className = "link";
	element_addVer.className = "link";
	element_delete.className = "link";
	element_changeReq.className = "link";

	element_currentVer.appendChild(document.createTextNode("Current Version"));
	element_currentVer.docID = strDocID;
	
	element_docHistory.appendChild(document.createTextNode("Document History"));
	element_docHistory.docID = strDocID;

	element_modify.appendChild(document.createTextNode("Modify"));
	element_modify.docID = strDocID;

	element_addVer.appendChild(document.createTextNode("Add Version"));
	element_addVer.docID = strDocID;

	element_delete.appendChild(document.createTextNode("Delete"));
	element_delete.docID = strDocID;

	element_changeReq.appendChild(document.createTextNode("DCR"));
	element_changeReq.title = "Document Change Request";
	element_changeReq.docID = strDocID;
	
	/* 
		Click Current Version to display the most current document 
	*/
	element_currentVer.onclick = function ()
	{
		oSearchDocument.OpenFile(this.docID);
	}
	
	/* 
		Click Document History to display a popup list of the existing 
		document version documents
	*/
	element_docHistory.onclick = function (oEvent)
	{
		oSearchDocument.DisplayVersionPopup(oEvent, this.docID, 0);
		element_docHistory.onmouseup = function () 
		{ 
			HideElement("versionPopup"); 
		}
	}

	/* 
		Click Modify to display a popup list of the existing 
		document versions to modify
	*/
	element_modify.onclick = function (oEvent)
	{
		oSearchDocument.DisplayVersionPopup(oEvent, this.docID, 1);
		element_modify.onmouseup = function () 
		{ 
			HideElement("versionPopup"); 
		}
	}

	/* 
		Click Add Version to add an additional version to an existing document 
	*/
	element_addVer.onclick = function ()
	{
		oAddDocumentVersion.AddVersion(this.docID, strSearchDoc_Menu);
		HideElement("versionPopup"); 
	}
	
	/* 
		Click Delete to display a popup list of the existing 
		document versions to remove
	*/
	element_delete.onclick = function (oEvent)
	{
		oSearchDocument.DisplayVersionPopup(oEvent, this.docID, 2);
		element_delete.onmouseup = function () 
		{ 
			HideElement("versionPopup"); 
		}
	}

	/* 
		Click Change Request to enter a document change request to send to the
		Administrator of the document.
	*/
	element_changeReq.onclick = function ()
	{
		oDocumentChangeRequest.Display(this.docID, strSearchDoc_Menu);
		HideElement("versionPopup"); 
	}
	
	/*
		Append everything to the div tag in order
	*/
	result.appendChild(element_currentVer);
	result.appendChild(break1);
	result.appendChild(element_docHistory);	
	result.appendChild(break2);
	result.appendChild(element_changeReq);	
	result.appendChild(break3);
	
	if(oUser.HasRight(oRights.DMS_Admin, strOrg))
	{
		result.appendChild(element_addVer);
		result.appendChild(break4);
		result.appendChild(element_modify);
		result.appendChild(break5);
		result.appendChild(element_delete);
	}

	return result;	
}

/*
	Displays the version list for the specified
	document for the Document History and Modify links.
*/
oSearchDocument.DisplayVersionPopup = function(oEvent, strDocID, popupType)
{
	/* 
		Create the popup box 
	*/
	var popupBox = oScreenBuffer.Get("versionPopup");

	RemoveChildren("versionPopup");
	
	popupBox.className = "versionPopupBox";
	
	popupBox.style.top = (getMouseY(oEvent) - 140) + "px";
	popupBox.style.left = "600px";
	
	oSystem_Colors.SetSecondaryBackground(popupBox);
	oSystem_Colors.SetPrimary(popupBox);
	
	/* 
		- If Document History clicked, display Versions for the popup title
		- If Moodify clicked, display Document for the popup title 
	*/
	if(popupType == 0)
	{
		popupTitle = "Versions";
	}
	else if(popupType == 1)
	{
		popupTitle = "Document";
	}
	
	else if(popupType == 2)
	{
		popupTitle = "Delete";
	}
	
	var element_title = document.createElement("DIV");
	
	element_title.appendChild(document.createTextNode(popupTitle));
	oSystem_Colors.SetPrimaryBackground(element_title);
	oSystem_Colors.SetSecondary(element_title);
	element_title.style.width = "100%";
	element_title.style.top = "0px";
	element_title.style.left = "0px";
	
	popupBox.appendChild(element_title);

	var element_titleBR= document.createElement("BR");
	element_titleBR.style.fontSize = "5px";	
	popupBox.appendChild(element_titleBR);
	
	/* 
		Retrieve the version list of the selected document from the server.
		Fill the popup box with the versions of the selected document.
	*/
	var serverValues = Object();
	serverValues.id = strDocID;
		
	serverValues.location = strDocumentURL;
	serverValues.action = "getdocumentversions";
	
	var xmlObject = server.CreateXMLSync(serverValues);
	var docVersionList = ParseXML(xmlObject, "element", Object);
	
	if(docVersionList.length > 0)
	{
		/* 
			If Modify clicked, display a Details link above all the versions
		*/
		if(popupType == 1)
		{
			var element_modDetail = document.createElement("SPAN");
			element_modDetail.appendChild(document.createTextNode("Details"));
			element_modDetail.docId = strDocID;
			popupBox.appendChild(element_modDetail);
			var element_modDetailBR = document.createElement("BR");
			popupBox.appendChild(element_modDetailBR);
			
			element_modDetail.onclick = function()
			{							
				oModifyDocDetails.Display(this.docId, strSearchDoc_Menu);
				oSearchDocument.HideMessage();
				RemoveChildren("ViewDocTable");
			}
		}

		/* 
			If the Delete option selected and "Document" selected, 
			display the confirmation popup for deleting the document and all the call 
			document versions by calling the DocumentRemove() function to hide 
			the document and document versions from displaying.
		*/
		else if(popupType == 2)
		{
			var element_deleteDoc = document.createElement("SPAN");
			element_deleteDoc.appendChild(document.createTextNode("Document"));
			element_deleteDoc.docId = strDocID;
			popupBox.appendChild(element_deleteDoc);
			var element_deleteDocBR = document.createElement("BR");
			popupBox.appendChild(element_deleteDocBR);
			
			element_deleteDoc.onclick = function()
			{				
				if(!window.confirm("Are you sure you want to permanently remove the document and the document version(s)?"))
				{
					return true;
				}
			
				oSearchDocument.DocumentRemove(this.docId);		
				oSearchDocument.clear();
			}
		}
		
		for(var i = 0; i < docVersionList.length; i++)
		{
			var element_version = document.createElement("SPAN");
			element_version.appendChild(document.createTextNode(docVersionList[i]['docVersion_Ver']));
			element_version.docId = strDocID;
			element_version.versionId = docVersionList[i]['docVersion_ID'];
			element_version.versionValue = docVersionList[i]['docVersion_Ver'];

			/* 
				If Document History clicked and version clicked, 
				display the document for that version
			*/
			if(popupType == 0)
			{	
				element_version.onclick = function()
				{
					oSearchDocument.OpenFile(this.docId, this.versionValue);
				}
			}
		
			/* 
				If Modify clicked and version clicked, display the screen 
				to modify version and document file.
			*/
			if(popupType == 1)
			{
				element_version.onclick = function()
				{
					oModifyDocument.ModifyDocument(this.docId, this.versionId, this.versionValue, strSearchDoc_Menu);
					HideElement("versionPopup"); 
				}
			}
			
			/* 
				If the Delete option selected and a specific version selected, 
				display the confirmation popup for deleting the version and call 
				DocVersionRemove() function to hide the version from displaying
			*/
			if(popupType == 2)
			{
				element_version.onclick = function()
				{
					if(!window.confirm("Are you sure you want to permanently remove document version " + this.versionValue + "?"))
						{
							return true;
						}
						oSearchDocument.DocVersionRemove(this.docId, this.versionId);		
						oSearchDocument.clear();
				}
			}
			popupBox.appendChild(element_version);
			popupBox.appendChild(document.createElement("BR"));
		}
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, "No versions found.");
		return;
	}
	var element_versionBR = document.createElement("BR");
	element_versionBR.style.fontSize = "8px";		
	popupBox.appendChild(element_versionBR);
	
	ShowInheritElement("versionPopup");
}
//--------------------------------------------------------------------------
/**
	\brief
		Opens a document file.
	\param docId
			The document id the caller wants to load
	\param versionId
			The version id of the document. If the user doesn't want
			to use a particular version, then the current version is called.
	\return
*/
//--------------------------------------------------------------------------
oSearchDocument.OpenFile = function(docId, versionId)
{
	element_form = document.createElement("FORM");
	document.body.appendChild(element_form);
	element_form.method = "POST";
	element_form.encoding = "multipart/form-data";

	/*
		Undefined is just that, an undefined variable. If the two of them
		match, we've bene passed in a doc id and no verison. Therefore we
		assume the caller wants the current version
	*/
	if(versionId == undefined)
	{
		versionURL = strDocumentURL + ".php?action=getCurrentVersionFile&id=" + docId;
	}
	else
	{
		versionURL = strDocumentURL + ".php?action=getDocumentFile&id=" + docId + "&version=" + versionId;
	}

	element_form.action = versionURL;
	element_form.target = "fileLoader";
	element_form.submit();
	document.body.removeChild(element_form);
}
/*--------------------------------------------------------------------------
	The values we're submitting to the server to remove the document from 
	displaying to the client.  
----------------------------------------------------------------------------*/
oSearchDocument.DocumentRemove = function(strDocID)
{
	var serverValues = Object();
	
	/*
		We pass to the server the document information.
	*/
	serverValues.id = strDocID;
	serverValues.location = strDocumentURL;
	serverValues.action = "disableDoc";
	
	/*
		Contact the server with our request. wait for the response and
		then display it to the user
	*/	
	var responseText = server.callSync(serverValues);
	
	if(!responseText)
	{
		responseText = "false||Error communicating with the server.";
	}
	
	var responseInfo = responseText.split("||");

	if(eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		oCatenaApp.navigate(oSearchDocument.screen_Menu, page_param_refresh);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	return true;
}
/*--------------------------------------------------------------------------
	The values we're submitting to the server to remove the version from 
	displaying to the client.  
----------------------------------------------------------------------------*/
oSearchDocument.DocVersionRemove = function(docId, versionId)
{
	var serverValues = Object();
	
	/*
		We pass to the server the document version information.
	*/
	serverValues.id = docId;
	serverValues.versionId = versionId;
	serverValues.location = strDocumentURL;
	serverValues.action = "disableDoc";
	
	/*
		Contact the server with our request. wait for the response and
		then display it to the user
	*/	
	var responseText = server.callSync(serverValues);

	if(!responseText)
	{
		responseText = "false||Error communicating with the server.";
	}
	
	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		oCatenaApp.navigate(oSearchDocument.screen_Menu, page_param_refresh);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}
	return true;
}

oSearchDocument.register();	
