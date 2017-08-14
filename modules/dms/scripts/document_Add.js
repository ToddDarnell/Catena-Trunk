/*--------------------------------------------------------------------------
	The purpose of this file is to add all the document 
	information and upload the document.
--------------------------------------------------------------------------*/
var strAddDocumentURL = "/modules/dms/server/document_add";

var oAddDocument = new system_AppScreen();

oAddDocument.screen_Name = "document_Add";
oAddDocument.screen_Menu = "Upload Document";
oAddDocument.module_Name = "dms";
oAddDocument.strForm_Name = "docAddForm";

/*--------------------------------------------------------------------------
	Show the page and lists
--------------------------------------------------------------------------*/
oAddDocument.custom_Show = function()
{
	this.LoadLists();
	return true;
}

/*--------------------------------------------------------------------------
    Perform any special cases which need to be performed
    before the screen is displayed
----------------------------------------------------------------------------*/
oAddDocument.custom_Load = function()
{
	oScreenBuffer.Get("clearDocButton").onclick = function ()
	{
		oAddDocument.ClearFields();
	};

	oScreenBuffer.Get("addDocButton").onclick = function ()
	{
		oAddDocument.Submit();
	};

	return true;
}

/*--------------------------------------------------------------------------
	Loads the lists used by add doucment
----------------------------------------------------------------------------*/
oAddDocument.LoadLists = function()
{
	oRights.fillOrgControl(oRights.DMS_Admin, "DocOrgList", true);
	
	oDocumentTypeList.load();
  	oDocumentTypeList.fillControl("DocTypeList", true);
}

/*--------------------------------------------------------------------------
	ClearFields clears all the fields
----------------------------------------------------------------------------*/
oAddDocument.ClearFields = function()
{
	oScreenBuffer.Get(this.strForm_Name).reset();
}

/*--------------------------------------------------------------------------
	The values we're submitting to the server through the form.
	In this case data to add a document.
----------------------------------------------------------------------------*/
oAddDocument.Submit = function()
{
	var strFile = oScreenBuffer.Get("docAddUpload").value;
	
	oScreenBuffer.Get(this.strForm_Name).action = strAddDocumentURL + ".php";

	if(!ValidFile(strFile))
	{
		return false;
	}
	
	oScreenBuffer.Get(this.strForm_Name).submit();
	HideElement("addDocButton");
	ShowInheritElement("docLoadingLabel");
	
	return true;
}
/*--------------------------------------------------------------------------
	Displays "Uploading..." message and resets the form for
	another file upload
----------------------------------------------------------------------------*/
oAddDocument.DisplayMessage = function(strMsg)
{
	var responseInfo = strMsg.split("||");
	if(eval(responseInfo[0]))
	{
		oScreenBuffer.Get(this.strForm_Name).reset();
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
	}
	HideElement("docLoadingLabel");
	ShowInheritElement("addDocButton");
}

oAddDocument.register();