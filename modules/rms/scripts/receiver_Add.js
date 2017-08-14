/*
	The purpose of this file is to manage all of the receiver related functionality.
*/
oReceiver_Add = new system_AppScreen();

oReceiver_Add.screen_Name = "receiver_add";
oReceiver_Add.screen_Menu = "Add Receiver";
oReceiver_Add.module_Name = "rms";

oReceiver_Add.custom_Load = function ()
{
	
	/*
		When the hardware numbers are changed we check the first two to find the
		model
	*/
	
	this.element_addReceiver = oScreenBuffer.Get("RecAddReceiver");
	this.element_addReceiverCRC = oScreenBuffer.Get("RecAddReceiverCRC");
	this.element_addSmartcard = oScreenBuffer.Get("RecAddSmartcard");
	this.element_addSmartcardCRC = oScreenBuffer.Get("RecAddSmartcardCRC");
	this.element_addHardware = oScreenBuffer.Get("RecAddHardware");
	this.element_addModel = oScreenBuffer.Get("RecAddModel");
	this.element_addMsg = oScreenBuffer.Get("RecAddMsg");
	this.element_OrgList = oScreenBuffer.Get("RecAddHardwareOrgList");

	this.element_addHardware.onchange = ValidateField;
	this.element_addReceiver.onchange = ValidateField;
	this.element_addReceiverCRC.onchange = ValidateField;
	this.element_addSmartcard.onchange = ValidateField;
	this.element_addSmartcardCRC.onchange = ValidateField;
	
	this.element_addHardware.modifyField = 'hardware';
	this.element_addReceiver.modifyField = 'receiver';
	this.element_addReceiverCRC.modifyField = 'receiver';
	this.element_addSmartcard.modifyField = 'smartcard';
	this.element_addSmartcardCRC.modifyField = 'smartcard';

	oScreenBuffer.Get("recAddButton").onclick = function ()
	{
		oReceiver_Add.Submit();
	};

	oScreenBuffer.Get("recAddClear").onclick = function ()
	{
		oReceiver_Add.ClearFields();
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
oReceiver_Add.LoadLists = function()
{
	oRights.fillOrgControl(oRights.RMS_Admin, this.element_OrgList, true);

}
/*
	Clear the fields before showing the page
*/
oReceiver_Add.custom_Show = function()
{
	this.ClearFields();
	this.LoadLists();
}
/*
	ClearFields clears the receiver/ smart card/ etc fields
	of the add receiver form
*/
oReceiver_Add.ClearFields = function()
{
	this.element_addHardware.value = "";
	ShowInheritElement("RecAddHardwareImg");

	this.element_addReceiver.value = "";
	this.element_addReceiverCRC.value = "";
	ShowInheritElement("RecAddReceiverImg");

	this.element_addSmartcard.value = "";
	this.element_addSmartcardCRC.value = "";
	ShowInheritElement("RecAddSmartcardImg");
	
	screen_SetTextElement(this.element_addModel, "");
	screen_SetTextElement(this.element_addMsg, "");
	
	this.element_OrgList.value = "";
}
/*
	Submite the data for adding a receiver to the system
*/
oReceiver_Add.Submit = function()
{
	/*
		The values we're submitting to the server.
		In this case data to add a receiver
	*/

	var serverValues = Object();
	/*
		We have to validate that the short name, long name, and parent
		fields are valid.
		Then we'll send it off to the server
	*/
	
	serverValues.hardware = this.element_addHardware.value;
	serverValues.receiver = this.element_addReceiver.value + this.element_addReceiverCRC.value;
	serverValues.smartCard = this.element_addSmartcard.value + this.element_addSmartcardCRC.value;
	serverValues.organization = this.element_OrgList.value;
	serverValues.location = strReceiverURL;
	serverValues.action = "add";

	/*
		Contact the server with our request. wait for the response and
		then display it to the user
	*/
	
	var responseText = server.callSync(serverValues);
	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		this.ClearFields();
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		screen_SetTextElement(this.element_addMsg, responseInfo[1]);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}

	return true;
}
/*
	ShowHardware should receive a message in the following form:
	true/false || result message if false or receiver model if true
*/
function ValidateField(oEvent)
{
	oEvent = oEvent || window.event;
	var txtField = oEvent.target || oEvent.srcElement;
	if(txtField.modifyField)
	{
		ValidateReceiverField(txtField.modifyField, 0);
	}
}
/*
	Display results returned from the server for the particular field
*/
function DisplayAddReceiverResult(strField, strResult)
{
	var responseInfo = strResult.split("||");
	switch(strField)
	{
		case 'hardware':
			if(eval(responseInfo[0]))
			{
				screen_SetTextElement("RecAddModel", responseInfo[1]);
				HideElement("RecAddHardwareImg");
			}
			else
			{
				screen_SetTextElement("RecAddModel", "No model");
				ShowElement("RecAddHardwareImg");
			}
			return;
			break;
		case 'receiver':
			imageElement = "RecAddReceiverImg";
			break;
		case 'smartcard':
			imageElement = "RecAddSmartcardImg"
			break;
	}
	
	if(eval(responseInfo[0]))
	{
		HideElement(imageElement);
	}
	else
	{
		ShowElement(imageElement);
	}

	oScreenBuffer.Get(imageElement).title = responseInfo[1];
}

oReceiver_Add.register();