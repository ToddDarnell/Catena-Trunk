/*
	This file maintains the receiver add request popup.
*/
function receiver_AddRequest()
{
	this.loaded = false;
}
/*--------------------------------------------------------------------------
	-	description
			Loads the system about dialog box so the user can see who's
			logged in, thier organization and a few other details.
	-	params
	-	return
--------------------------------------------------------------------------*/
receiver_AddRequest.prototype.load = function()
{

};
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
receiver_AddRequest.prototype.create = function()
{
	this.oDialog = new system_Dialog();
	
	this.oDialog.config.width = 400;
	this.oDialog.config.height = 300;
	this.oDialog.strScreenTitle = "Receiver Inventory Request";
	
	this.oDialog.create("ReceiverAddRequestDialog");

	this.element_notice = document.createElement("DIV");
	this.element_notice.style.position = "absolute";
	this.element_notice.style.left = "20px";
	this.element_notice.style.top = "20px";
	this.element_notice.style.width = "350px";
	this.element_notice.style.border = "1px solid";
	this.element_notice.style.padding = "4px";

	this.element_notice.innerHTML = "To request a receiver be added to the inventory, please include the following: 12 digit receiver and smart card numbers containing no spaces, dashes, 'R' or 'S'. A four digit hardware id is also required.";

	this.oDialog.appendChild(this.element_notice);

	this.oDialog.appendChild(screen_CreateTextElement("Receiver", 20, 130));
	
	this.element_receiver = screen_CreateInputElement("receiverAddRequest_rec", "");
	this.element_receiver.style.position = "absolute";
	this.element_receiver.style.left = "100px";
	this.element_receiver.style.top = "130px";
	this.element_receiver.maxLength = "12";
	
	this.oDialog.appendChild(this.element_receiver);
	
	

	this.oDialog.appendChild(screen_CreateTextElement("Smartcard", 20, 160));

	this.element_smartcard = screen_CreateInputElement("receiverAddRequest_smartcard", "");
	this.element_smartcard.style.position = "absolute";
	this.element_smartcard.style.left = "100px";
	this.element_smartcard.style.top = "160px";
	this.element_smartcard.maxLength = "12";
	
	this.oDialog.appendChild(this.element_smartcard);



	this.oDialog.appendChild(screen_CreateTextElement("Hardware", 20, 190));

	this.element_hardware = screen_CreateInputElement("receiverAddRequest_hardware", "");
	this.element_hardware.style.position = "absolute";
	this.element_hardware.style.left = "100px";
	this.element_hardware.style.top = "190px";
	this.element_hardware.maxLength = "4";
	
	this.oDialog.appendChild(this.element_hardware);

	
	element_ok = document.createElement("BUTTON");
	element_ok.style.position = "absolute";
	element_ok.style.left = "195px";
	element_ok.style.top = "270px";
	element_ok.style.width = "75px";
	element_ok.appendChild(document.createTextNode("Submit"));
	
	this.oDialog.appendChild(element_ok);
	
	element_ok.oFeedback = this;
	element_ok.onclick = function()
	{
		this.oFeedback.Submit();
	}
	
	element_cancel = document.createElement("BUTTON");
	element_cancel.style.position = "absolute";
	element_cancel.style.left = "300px";
	element_cancel.style.top = "270px";
	element_cancel.style.width = "75px";
	element_cancel.appendChild(document.createTextNode("Cancel"));
	this.oDialog.appendChild(element_cancel);

	element_cancel.oDialog = this.oDialog;
	element_cancel.onclick = function()
	{
		this.oDialog.hide();
	}
	
	this.loaded = true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
receiver_AddRequest.prototype.Submit = function()
{
	var serverValues = Object();
	
	serverValues.receiver = this.element_receiver.value;
	serverValues.smartcard = this.element_smartcard.value;
	serverValues.hardware = this.element_hardware.value;
	
	serverValues.action = "addrequest";
	serverValues.location = strReceiverURL;
	
	var responseText = server.callSync(serverValues);
	var responseInfo = responseText.split("||");
	
	if(eval(responseInfo[0]))
	{
		oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		this.oDialog.hide();
	}
	else
	{
		oCatenaApp.showNotice(notice_Error, responseInfo[1]);
		return false;
	}

	return true;

}	
/*--------------------------------------------------------------------------
	-	description
			This function displays an about box on the screen
	-	params
	-	return
--------------------------------------------------------------------------*/
receiver_AddRequest.prototype.show = function()
{
	if(this.loaded == false)
	{
		this.create();
	}
	
	this.element_receiver.value = "";
	this.element_smartcard.value = "";
	this.element_hardware.value = "";
	
	this.oDialog.show();
}