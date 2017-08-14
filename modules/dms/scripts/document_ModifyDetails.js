/*
	The purpose of this file is modify the details of an existing document 
	such as title, description, type, and org
*/
function documentClass()
{
}
var oModifyDocDetails = new system_AppScreen();

oModifyDocDetails.modTitle = "";
oModifyDocDetails.modDescription = "";
oModifyDocDetails.modType = "";
oModifyDocDetails.modOrg = "";
oModifyDocDetails.modDocID = 0;
oModifyDocDetails.screen_Name = "document_ModifyDetails";
oModifyDocDetails.screen_Menu = "Modify Document Details";

oModifyDocDetails.module_Name = "dms";


oModifyDocDetails.custom_Show = function()
{
	this.LoadLists();
	return true;
}
oModifyDocDetails.custom_Load = function()
{
	/*
		Validating the fields if they are changed to verify valid data entered
	*/
	this.modTitle = oScreenBuffer.Get("DocDetailModTitle");
	this.modDescription = oScreenBuffer.Get("DocDetailModDescription");
	this.modType = oScreenBuffer.Get("DocDetailModTypeList");
	this.modOrg = oScreenBuffer.Get("DocDetailModOrgList");
			
	oScreenBuffer.Get("modDocDetailButton").onclick = function ()
	{
		oModifyDocDetails.Submit();
	};

	oScreenBuffer.Get("modDetailBackButton").onclick = function ()
	{
		oModifyDocDetails.ClearFields();
		oCatenaApp.navigate(oModifyDocDetails.backScreen, page_param_display);
	};

	return true;
}
/*
	Loads the lists used by modify doucment
*/
oModifyDocDetails.LoadLists = function()
{
	oRights.fillOrgControl(oRights.DMS_Admin, "DocDetailModOrgList", true);

	oDocumentTypeList.load();
	oDocumentTypeList.fillControl("DocDetailModTypeList", true);
}
/*
	ClearFields clears all the fields for the Modify Document form
*/
oModifyDocDetails.ClearFields = function()
{
	this.modTitle.value = "";
	this.modDescription.value = "";
	this.modType.value = "";
	this.modOrg.value = "";
}
oModifyDocDetails.Submit = function()
{
	/*
		The values we're submitting to the server.
		In this case data to Modify a document
	*/
	var serverValues = Object();
	/*
		We have to validate that the organization and type values are valid.
		Then we'll send it off to the server
	*/
	serverValues.title = this.modTitle.value;
	serverValues.description = this.modDescription.value;
	serverValues.type = this.modType.value;
	serverValues.org = this.modOrg.value;
	serverValues.docId = this.modDocID;

	serverValues.location = strModifyDocDetailsURL;
	serverValues.action = "modifydocdetails";

	/*
		Contact the server with our request. Wait for the response and
		then display it to the user.
	*/
	var responseText = server.callSync(serverValues);
	
	if(!oCatenaApp.showResults(responseText))
	{
		return false;
	}

	oCatenaApp.navigate(this.backScreen, page_param_refresh);

	return true;
}
/*
	Displays the fields of a document that can be modified based upon 
	what's passed in as docId.
	By either cancelling or submitting a successful request, sets
	focus to the screen passed in.
		-	Tell the back button where it should send the user
			if they click it
		-	clear all of the fields in this form
		-	draw the screen for modifying a document
		-	send a request to the server for the data for this document
*/
oModifyDocDetails.Display = function(docId, backScreen)
{
	oCatenaApp.navigate(this.screen_Menu);
	this.backScreen = backScreen;
	this.ClearFields();
	this.modDocID = docId;
	
	var serverValues = Object();

	serverValues.id = docId;
	serverValues.location = strDocumentURL;
	serverValues.action = "getdocumentlist";

	/*
		Contact the server with our request. Wait for the response and then 
		display it to the user. The document list should only have one element.
	*/
	var xmlObject = server.CreateXMLSync(serverValues);
	

	var verList = ParseXML(xmlObject, "element", documentClass);

	if(verList.length == 1)
	{
		this.modTitle.value = verList[0]['doc_Title'].replace(/\\+'/g, "'");
		this.modDescription.value = verList[0]['doc_Description'].replace(/\\+'/g, "'");
		this.modType.value = verList[0].docType_Name;
		this.modOrg.value = verList[0].org_Short_Name;
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, "Unable to load document for modifying.");
	}
	return true;
}

oModifyDocDetails.register();
