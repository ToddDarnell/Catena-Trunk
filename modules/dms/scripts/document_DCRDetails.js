/*--------------------------------------------------------------------------
	The purpose of this file is to display the selected DCR item details
----------------------------------------------------------------------------*/
oDCR_Details = new system_AppScreen();

oDCR_Details.screen_Name = "document_DCRDetails";
oDCR_Details.screen_Menu = "DCR Item Details";
oDCR_Details.module_Name = "dms";

//oDCR_Details.itemId = -1;

/*-----------------------------------------------------------------------------
    perform any special cases which need to be performed
    before the screen is displayed
-------------------------------------------------------------------------------*/
oDCR_Details.custom_Show = function()
{
	return true;
}
oDCR_Details.custom_Load = function ()
{
	this.element_dcrRequest = oScreenBuffer.Get("dcrDetailsRequest");
	this.element_dcrDocTitle = oScreenBuffer.Get("dcrDetailsDocTitle");

	this.element_dcrPageNumber = oScreenBuffer.Get("dcrDetailsPageNum");
	this.element_dcrStepNumber = oScreenBuffer.Get("dcrDetailsStepNum");
	this.element_dcrCurrentStep = oScreenBuffer.Get("dcrDetailsCurrent");
	this.element_dcrRequestUpdate = oScreenBuffer.Get("dcrDetailsUpdate");

	this.element_dcrTPUDetailsBox = oScreenBuffer.Get("dcrDetailsTPUInfoBox");
	this.element_dcrTPUComment = oScreenBuffer.Get("dcrDetailsComment");
	this.element_dcrTPUCommentLabel = oScreenBuffer.Get("dcrDetailsCommentLabel");
	this.element_dcrTPUReference = oScreenBuffer.Get("dcrDetailsReference");
	this.element_dcrTPUReferenceLabel = oScreenBuffer.Get("dcrDetailsReferenceLabel");
	
	this.element_backButton = oScreenBuffer.Get("dcrDetailsBackButton");

	this.element_backButton.onclick = function()
	{
		oCatenaApp.navigate(oDCR_Details.backScreen);
	}

	return true;
}

/*--------------------------------------------------------------------------
	Displays a message based upon what's passed in as messageId.
	By either cancelling or submitting a successful request, sets
	focus to the screen passed in.
		-	Tell the back button where it should send the user
			if they click it
		-	clear all of the fields in this form
		-	draw the screen for viewing the mesasage
		-	send a request to the server for the data for this message
		-	marks the message as read in jMessageViewed table
----------------------------------------------------------------------------*/
oDCR_Details.display = function(itemId, backScreen)
{
	this.itemId = -1;
	this.backScreen = backScreen;
	refName = "";
	comments = "";
		
	this.itemDetails = GetItemDetails(itemId);

	if(!this.itemDetails)
	{
		oCatenaApp.showNotice(notice_Error, "Invalid item ID requested.");
		return false;
	}

	if(this.itemDetails.length != 1)
	{
		oCatenaApp.showNotice(notice_Error, "No record found with the requested item ID.");
		return false;
	}

	oCatenaApp.navigate(this.screen_Menu);
	this.itemId = itemId;
	refName = this.itemDetails[0].reference_Name;
	comments = this.itemDetails[0].tpu_Comment;
	requestId = this.itemDetails[0].requestId;
	strTitle = this.itemDetails[0].document_Title;


	screen_SetTextElement(this.element_dcrRequest, requestId);
	oSystem_Colors.SetPrimaryBorder(this.element_dcrRequest);

	screen_SetTextElement(this.element_dcrDocTitle, strTitle);
	oSystem_Colors.SetPrimaryBorder(this.element_dcrDocTitle);

	screen_SetTextElement(this.element_dcrPageNumber, this.itemDetails[0].page_Number);
	oSystem_Colors.SetPrimaryBorder(this.element_dcrPageNumber);

	screen_SetTextElement(this.element_dcrStepNumber, this.itemDetails[0].step_Number);
	oSystem_Colors.SetPrimaryBorder(this.element_dcrStepNumber);
	
	screen_SetTextElement(this.element_dcrCurrentStep, this.itemDetails[0].current_Step);
	oSystem_Colors.SetPrimaryBorder(this.element_dcrCurrentStep);

	screen_SetTextElement(this.element_dcrRequestUpdate, this.itemDetails[0].request_Update);
	oSystem_Colors.SetPrimaryBorder(this.element_dcrRequestUpdate);

	this.element_dcrTPUDetailsBox.style.visibility = "hidden"; 
	this.element_dcrTPUComment.style.visibility = "hidden"; 
	this.element_dcrTPUCommentLabel.style.visibility = "hidden"; 
	this.element_dcrTPUReference.style.visibility = "hidden"; 
	this.element_dcrTPUReferenceLabel.style.visibility = "hidden"; 
	
	if(refName.length)
	{
		this.element_dcrTPUDetailsBox.style.visibility = "visible"; 		
		
		screen_SetTextElement(this.element_dcrTPUReference, refName);
		oSystem_Colors.SetPrimaryBorder(this.element_dcrTPUReference);
		this.element_dcrTPUReference.style.visibility = "visible"; 
		this.element_dcrTPUReferenceLabel.style.visibility = "visible"; 
		
		if(comments.length)
		{
			screen_SetTextElement(this.element_dcrTPUComment, comments);
			oSystem_Colors.SetPrimaryBorder(this.element_dcrTPUComment);
			this.element_dcrTPUComment.style.visibility = "visible"; 
			this.element_dcrTPUCommentLabel.style.visibility = "visible"; 
		}
	}
	
	return true;
}

oDCR_Details.register();