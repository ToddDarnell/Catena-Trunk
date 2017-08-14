/*
	The purpose of this file is modify an existing document 
*/
var strModifyDocument = "Modify Document";

var oModifyDocument = new system_AppScreen();

oModifyDocument.modVersion = "";
oModifyDocument.modDocID = 0;
oModifyDocument.screen_Name = "document_ModifyVersion";
oModifyDocument.screen_Menu = "Modify Document";
oModifyDocument.module_Name = "dms";

oModifyDocument.custom_Load = function()
{
	/*
		Validating the fields if they are changed to verify valid data entered
	*/
	this.modVersion = oScreenBuffer.Get("DocModifyVersion");

	oScreenBuffer.Get("modDocButton").onclick = function ()
	{
		oModifyDocument.Submit();
	};

	oScreenBuffer.Get("modBackButton").onclick = function ()
	{				
		oModifyDocument.Clear();
		oCatenaApp.navigate(oModifyDocument.backScreen, page_param_display);
	};

	return true;
}
/*
	Clear clears the all the fields for the Modify Document form
*/
oModifyDocument.Clear = function()
{
	oScreenBuffer.Get("modUploadForm").reset();
}
/*
	The values we're submitting to the server.
	In this case data to Modify a document
*/
oModifyDocument.Submit = function()
{
	var strFile = oScreenBuffer.Get("docModifyUpload").value;

	if(strFile.length > 0)
	{
		if(!ValidFile(strFile))
		{
			return false;
		}
	}
	
	oScreenBuffer.Get("modDocID").value = this.docId;
	oScreenBuffer.Get("modVersionID").value = this.versionId;
	oScreenBuffer.Get("modUploadForm").submit();
	HideElement("modDocButton");
	ShowInheritElement("docModLoadingLabel");
	
	return true;
}
/*
	Modifies a document based upon what's passed in as versionId.
	By either cancelling or submitting a successful request, sets
	focus to the screen passed in.
		-	Tell the back button where it should send the user
			if they click it
		-	clear all of the fields in this form
		-	draw the screen for modifying a document
		-	send a request to the server for the data for this document
*/
oModifyDocument.ModifyDocument = function(docId, versionId, versionValue, backScreen)
{	
	oCatenaApp.navigate(strModifyDocument);

	var title = GetDocumentTitle(docId);
	title = title.replace(/\\+'/g, "'");

	RemoveChildren("CurrentModDocTitle");
	oScreenBuffer.Get("CurrentModDocTitle").appendChild(document.createTextNode(title));
	
	this.backScreen = backScreen;
	this.Clear();
	this.docId = docId;
	this.versionId = versionId;
	this.versionValue = versionValue;

	if(versionValue != "")
	{		
		this.modVersion.value = versionValue;
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, "Unable to load document version for modifying.");
	}
	return true;
}
/*
	Displays "Uploading..." message and resets the form for another file upload
*/
oModifyDocument.DisplayMessage = function(strMsg)
{
	var responseInfo = strMsg.split("||");

	HideElement("docModLoadingLabel");
	ShowInheritElement("modDocButton");

	if(eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		oScreenBuffer.Get("modUploadForm").reset();
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		oCatenaApp.navigate(this.backScreen, page_param_display);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
	}

}

oModifyDocument.register();
