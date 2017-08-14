/*--------------------------------------------------------------------------
	The purpose of this file is to display the selected DCR item details
----------------------------------------------------------------------------*/
var strDocCreateRequestURL = "/modules/dms/server/document_createRequest";
var strDocumentURL = "/modules/dms/server/document";

oDCRNewOrganizations = new system_list("org_ID", "org_Short_Name",  "dcrorgs");
oDCRNewOrganizations.serverURL = strDocumentURL;

oDCRNew = new system_AppScreen();

oDCRNew.screen_Name = "document_DCRNew";
oDCRNew.screen_Menu = "DCR";
oDCRNew.module_Name = "dms";

/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oDCRNew.custom_Show = function()
{
	this.LoadLists();
	return true;
}
/*--------------------------------------------------------------------------
	Load the document creation request functionality
--------------------------------------------------------------------------*/
oDCRNew.custom_Load = function ()
{
	this.oNewCalendar = new system_Calendar();
	this.oNewCalendar.load("docCreateRequestCalendar");

	this.element_dcrNewTitle = oScreenBuffer.Get("docCreateRequestTitle");
	this.element_dcrNewDescription = oScreenBuffer.Get("docCreateRequestDescription");
	this.element_dcrNewType = oScreenBuffer.Get("docCreateRequestTypeList");
	this.element_dcrNewOrg = oScreenBuffer.Get("docCreateRequestOrgList");
	this.element_Priority = oScreenBuffer.Get("docCreateRequestPriorityList");
	this.element_RQNumber = oScreenBuffer.Get("docCreateRequestRQNumber");

	this.element_clearButton = oScreenBuffer.Get("docCreateRequestClear");
	this.element_submitButton = oScreenBuffer.Get("docCreateRequestSubmit");
	
	this.element_clearButton.onclick = function()
	{
		oDCRNew.ClearFields();
	}

	this.element_submitButton.onclick = function ()
	{
		oDCRNew.Submit();
	};

	return true;
}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCRNew.LoadLists = function()
{
	oDCRNewOrganizations.load();
	oDCRNewOrganizations.fillControl("docCreateRequestOrgList", true );

	oDocumentTypeList.load();
	oDocumentTypeList.fillControl("docCreateRequestTypeList", true);
	
	oDocPriorityList.load();
	oDocPriorityList.fillControl("docCreateRequestPriorityList", false);

}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCRNew.ClearFields = function()
{
	this.element_dcrNewTitle.value = "";
	this.element_dcrNewDescription.value = "";
	this.element_dcrNewType.value = "";
	this.element_dcrNewOrg.value = "";
	this.element_Priority.value = "None";
	this.oNewCalendar.reset();
	this.element_RQNumber.value = "";
}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oDCRNew.Submit = function()
{
	/*
		The values we're submitting to the server.
		In this case data to Modify a document
	*/
	element_submitForm = oScreenBuffer.Get("docCreateRequestForm");
	element_submitForm.action = strDocCreateRequestURL + ".php";
	
	element_submitForm.appendChild(screen_CreateInputElement("title", this.element_dcrNewTitle.value));
	element_submitForm.appendChild(screen_CreateInputElement("description", this.element_dcrNewDescription.value));
	element_submitForm.appendChild(screen_CreateInputElement("type", this.element_dcrNewType.value));
	element_submitForm.appendChild(screen_CreateInputElement("organization", this.element_dcrNewOrg.value));
	element_submitForm.appendChild(screen_CreateInputElement("priority", this.element_Priority.value));
	element_submitForm.appendChild(screen_CreateInputElement("deadline", this.oNewCalendar.getDate()));
	element_submitForm.appendChild(screen_CreateInputElement("rq", this.element_RQNumber.value));

	element_submitForm.submit();

	RemoveChildren(element_submitForm);
}

//--------------------------------------------------------------------------
/**
	DisplayResults
		-	Clears the form and results if the passed in values are valid
		-	prompts the user with an error message if there is one
*/
//--------------------------------------------------------------------------
oDCRNew.DisplayMessage = function(strMsg)
{
	var responseInfo = strMsg.split("||");
	if(eval(responseInfo[0]))
	{
		this.ClearFields();					
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
	}
}

oDCRNew.register();