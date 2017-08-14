/*
	The purpose of this file is to manage modifying an existing receiver 
*/
var oReceiver_Modify = new system_AppScreen();

oReceiver_Modify.screen_Name = "receiver_Modify";
oReceiver_Modify.screen_Menu = "Receiver Modify";
oReceiver_Modify.module_Name = "rms";


oReceiver_Modify.custom_Load = function()
{
	/*
		When the hardware numbers are changed we check the first two to find the
		model
	*/
	
	this.element_hardware = oScreenBuffer.Get("RecModifyHardware");
	this.element_receiver = oScreenBuffer.Get("RecModifyReceiver");
	this.element_receiverCRC = oScreenBuffer.Get("RecModifyReceiverCRC");
	this.element_smartcard = oScreenBuffer.Get("RecModifySmartcard");
	this.element_smartcardCRC = oScreenBuffer.Get("RecModifySmartcardCRC");
	this.element_statusList = oScreenBuffer.Get("RecModifyStatusList");
	this.element_backButton = oScreenBuffer.Get("recModifyBack");

	this.element_OrgList = oScreenBuffer.Get("RecModifyHardwareOrgList");
			
	this.element_hardware.onchange = ValidateModifyFieldEvent;
	this.element_receiver.onchange = ValidateModifyFieldEvent;
	this.element_receiverCRC.onchange = ValidateModifyFieldEvent;
	this.element_smartcard.onchange = ValidateModifyFieldEvent;
	this.element_smartcardCRC.onchange = ValidateModifyFieldEvent;
	this.element_statusList.onchange = ValidateModifyFieldEvent;

	this.element_hardware.modifyField = 'hardware';
	this.element_receiver.modifyField = 'receiver';
	this.element_receiverCRC.modifyField = 'receiver';
	this.element_smartcard.modifyField = 'smartcard';
	this.element_smartcardCRC.modifyField = 'smartcard';
	this.element_statusList.modifyField = 'status';

	oScreenBuffer.Get("recModifyButton").onclick = function ()
	{
		oReceiver_Modify.Submit();
    };

	this.element_backButton.backScreen = "";
	this.element_backButton.onclick = function ()
	{
		oReceiver_Modify.ClearFields();
		oCatenaApp.navigate(this.backScreen);
    };
    
    oRights.fillOrgControl(oRights.RMS_Admin, this.element_OrgList, true);
	
	return true;
}
/*
	ClearFields clears the receiver/ smart card/ etc fields
	of the Modify receiver form
*/
oReceiver_Modify.ClearFields = function()
{
	this.element_hardware.value = "";
	ShowElement("RecModifyHardwareImg");

	this.element_receiver.value = "";
	this.element_receiverCRC.value = "";
	ShowElement("RecModifyReceiverImg");

	this.element_smartcard.value = "";
	this.element_smartcardCRC.value = "";
	ShowElement("RecModifySmartcardImg");
	
	this.element_statusList.value = "Active";
	ShowElement("RecModifyStatusListImg");

	this.element_OrgList.value = "";

	oScreenBuffer.Get("ReceiverModifyModel").value = "";
}
/*--------------------------------------------------------------------------
	-	description
			Submit the request to modify the receiver details.
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_Modify.Submit = function()
{

	var serverValues = Object();
	serverValues.id = this.receiverId;
	serverValues.hardware = this.element_hardware.value;
	serverValues.receiver = this.element_receiver.value + this.element_receiverCRC.value;
	serverValues.smartCard = this.element_smartcard.value + this.element_smartcardCRC.value;
	serverValues.organization = this.element_OrgList.value;
		
	serverValues.status = this.element_statusList.value;
	serverValues.location = strReceiverURL;
	serverValues.action = "Modify";

	/*
		Contact the server with our request. wait for the response and
		then display it to the user
	*/
	
	var responseText = server.callSync(serverValues);
	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		oCatenaApp.navigate(this.element_backButton.backScreen);
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
	Modifies a receiver based upon what's passed in as receiverId.
	By either cancelling or submitting a successful request, sets
	focus to the screen passed in.
*/
oReceiver_Modify.Modify = function(receiverId, backScreen)
{
	this.receiverId = receiverId;
	/*
		-	Tell the back button where it should send the user
		if they click it
		-	clear all of the fields in this form
		-	draw the screen for modifying a receiver
		-	send a request to the server for the data for this receiver
	*/
	oCatenaApp.navigate(this.screen_Menu);
	
	this.element_backButton.backScreen = backScreen;
	this.ClearFields();
	
	var serverValues = Object();

	serverValues.id = receiverId;
	serverValues.location = strReceiverURL;
	serverValues.action = "getreceiverlist";

	/*
		Contact the server with our request. wait for the resonse and
		then display it to the user
	*/
	var xmlObject = server.CreateXMLSync(serverValues);
	
	var recList = ParseXML(xmlObject,  "element", Object);


	/*
		Make sure to fill the receiver status field.
		It may have been updated since the last we were in this screen
	*/
	oReceiverStatusList.load();
	oReceiverStatusList.fillControl(this.element_statusList, false);

	/*
		This receiver list should have only one element in it. if there are
		more we have a problem
	*/
	
	if(recList.length == 1)
	{
		HideElement("RecModifyHardwareImg");
		HideElement("RecModifyReceiverImg");
		HideElement("RecModifySmartcardImg");
		HideElement("RecModifyStatusListImg");

		this.element_hardware.value = recList[0]['rec_Hardware'];
	
		this.element_receiver.value = recList[0]['rec_Number'].substring(0,10);
		this.element_receiverCRC.value = recList[0]['rec_Number'].substring(10,12);
		
		this.element_smartcard.value = recList[0]['rec_SmartCard'].substring(0,10);
		this.element_smartcardCRC.value = recList[0]['rec_SmartCard'].substring(10,12);
		this.element_OrgList.value = recList[0].org_Short_Name;
		this.element_statusList.value = recList[0]['recStatus_Name'];
		ValidateReceiverField('hardware', 1);
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, "Unable to load receiver for modifying.");
	}
	return true;
}

/*
	ValidateModifyFieldEvent is called when an event is called
*/
function ValidateModifyFieldEvent(oEvent)
{
	oEvent = oEvent || window.event;
	var txtField = oEvent.target || oEvent.srcElement;

	ValidateReceiverField(txtField.modifyField, 1);
}

/*
	Display results returned from the server for the particular field
*/
function DisplayModifyReceiverResult(strField, strResult)
{
	var responseInfo = strResult.split("||");
	var imageDisplay = "";					// Keeps track of whether we're displaying the info icon or not.
											//	The image is only displayed if there is some kind of error
	switch(strField)
	{
		case 'hardware':
			if(eval(responseInfo[0]))
			{
				oScreenBuffer.Get("ReceiverModifyModel").value = responseInfo[1];
				HideElement("RecModifyHardwareImg");
			}
			else
			{
				oScreenBuffer.Get("ReceiverModifyModel").value = "No model";
				ShowElement("RecModifyHardwareImg");
			}
			return;
			break;
		case 'receiver':
			imageElement = "RecModifyReceiverImg";
			break;
		case 'smartcard':
			imageElement = "RecModifySmartcardImg"
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

oReceiver_Modify.register();