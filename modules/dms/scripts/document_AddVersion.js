/*--------------------------------------------------------------------------
	The purpose of this file is to add a new version to an 
	existing document and upload the document.
--------------------------------------------------------------------------*/
var strDocumentURL =  "/modules/dms/server/document";
var strAddDocumentVersionURL = "/modules/dms/server/document_addVersion";

var strAddDocumentVersion = "Add New Version";

var oAddDocumentVersion = new system_AppScreen();

oAddDocumentVersion.strDocId = "";
oAddDocumentVersion.screen_Name = "document_AddVersion";
oAddDocumentVersion.screen_Menu = strAddDocumentVersion;
oAddDocumentVersion.module_Name = "dms";

oAddDocumentVersion.custom_Load = function()
{
	oScreenBuffer.Get("addVerButton").onclick = function ()
	{
		oAddDocumentVersion.Submit();
	};
	
	oScreenBuffer.Get("backVerButton").onclick = function ()
	{
		oAddDocumentVersion.ClearFields();
		oCatenaApp.navigate(oAddDocumentVersion.backScreen, page_param_display);
	};

	return true;
}
/*--------------------------------------------------------------------------
	ClearFields clears all the fields for new Version
--------------------------------------------------------------------------*/
oAddDocumentVersion.ClearFields = function()
{
	oScreenBuffer.Get("verUploadForm").reset();
},
/*
	The values we're submitting to the server through the form.
	In this case data to add a document.
*/
oAddDocumentVersion.Submit = function()
{
	var strFile = oScreenBuffer.Get("docVerUpload").value;

	oScreenBuffer.Get("verUploadForm").action = strAddDocumentVersionURL + ".php";

	if(!ValidFile(strFile))
	{
		return false;
	}

	oScreenBuffer.Get("NewVersionDocID").value = this.strDocId;
	oScreenBuffer.Get("verUploadForm").submit();
	HideElement("addVerButton");
	ShowInheritElement("verLoadingLabel");

	return true;
}
/*
	-	Tell the back button where it should send the user
		if they click it
	-	clear all of the fields in this form
	-	draw the screen for adding a document version
	-	send a request to the server for the data for this document
	-   go back to searched results when valid version added
*/
oAddDocumentVersion.AddVersion = function(docId, backScreen)
{
	/*
		Have to navigate to the screen right away, because it may be loading
		the add version screen for the first time. The rest of the code depends
		on the screen existing.
	*/
	oCatenaApp.navigate(strAddDocumentVersion);

	var title = GetDocumentTitle(docId);
	title = title.replace(/\\+'/g, "'");
	
	RemoveChildren("CurrentDocTitle");
	oScreenBuffer.Get("CurrentDocTitle").appendChild(document.createTextNode(title));
	
	this.backScreen = backScreen;
	this.ClearFields();
	this.strDocId = docId;

	return true;
}
/*
	Displays "Uploading..." message and resets the form for another file upload
*/
oAddDocumentVersion.DisplayMessage = function(strMsg)
{
	var responseInfo = strMsg.split("||");
	if(eval(responseInfo[0]))
	{
		oScreenBuffer.Get("verUploadForm").reset();
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		oCatenaApp.navigate(this.backScreen, page_param_display);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
	}
	HideElement("verLoadingLabel");
	ShowInheritElement("addVerButton");
}

oAddDocumentVersion.register();