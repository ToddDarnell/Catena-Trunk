/*
	The purpose of this file is to manage all of the receiver related functionality.
*/
var strReceiverURL = "/modules/rms/server/receiver";
var strRestrictedReceiverURL = "/modules/rms/server/restrictedReceiver";
var strReceiverModelURL = "/modules/rms/server/receiverModel";
var strReceiverStatusURL = "/modules/rms/server/receiverStatus";

/*
	functionality to keep track of a single organization
*/
function receiverStatus()
{
	/*
		status
	*/
	this.id = "";
	this.name = "";
	this.description = "";
}

function receiverClass()
{
	this.id = 0;
	this.number = "";
	this.smartCard = "";
	this.hardware = "";
	this.controlNumber = "";
	this.AuditDate = "";
	this.owner = 0;
	this.ownerOrg = 0;
	this.status = 0;
}

/*
	validate a particular field.
	fnReturn is the function which should be called after the result is returned
	
*/
receiverClass.prototype.ValidateHardware = function (strHardware, fnReturn)
{
	this.Validate('hardware', strHardware, fnReturn);
}

/*
	Generic function call for validating various receiver attributes
*/
receiverClass.prototype.Validate = function (strType, strValue, fnReturn)
{
	var serverValues = Object();
	
	serverValues.action = "validate";
	serverValues.location = strReceiverURL;
	serverValues.data = strValue;
	serverValues.field = strType;
	
	var strURL = server.buildURL(serverValues);
	
	var oXmlHttp = zXmlHttp.createRequest();
	oXmlHttp.open("get", strURL, true);

	oXmlHttp.onreadystatechange = function()
	{
		if(oXmlHttp.readyState == 4)
		{
			if(oXmlHttp.status == 200)
			{
				return fnReturn(strType, oXmlHttp.responseText);
			}
		}
	}
	oXmlHttp.send(null);
}

/*
	ValidateModifyField calls the server to validate the form field
	passed into the function
	-	field is the element type we're going to check
	-	type is the type of check we're doing. Add or modify
		0	= add
		1	= modify
*/
function ValidateReceiverField(field, type)
{
	var data = Array();
	data[0] = new Array();
	data[1] = new Array();
	data[0]['hardware'] = "RecAddHardware";
	data[0]['status'] = "RecAddStatusList";
	data[0]['statusImg'] = "RecAddStatusListImg";
	data[0]['function'] = DisplayAddReceiverResult;
	data[0]['receiver'] = "RecAddReceiver";
	data[0]['receiverCRC'] = "RecAddReceiverCRC";

	data[0]['smartcard'] = "RecAddSmartcard";
	data[0]['smartcardCRC'] = "RecAddSmartcardCRC";

	data[1]['hardware'] = "RecModifyHardware";
	data[1]['status'] = "RecModifyStatusList";
	data[1]['statusImg'] = "RecModifyStatusListImg";
	data[1]['function'] = DisplayModifyReceiverResult;
	data[1]["receiver"] = "RecModifyReceiver";
	data[1]['receiverCRC'] = "RecModifyReceiverCRC";

	data[1]['smartcard'] = "RecModifySmartcard";
	data[1]['smartcardCRC'] = "RecModifySmartcardCRC";

	switch(field)
	{
		/*
			The status field is simple because the user can not put any data into
			it except a proper field name. In this case if there is something
			then we remove the image
		*/
		case "status":
			if(oScreenBuffer.Get(data[type]['status']).value == "")
			{
				/*	Nothing in the field. Show the image */
				ShowElement(data[type]['statusImg']);
			}
			else
			{
				HideElement(data[type]['statusImg']);
			}
			return;
		case "hardware":
			fieldValue = oScreenBuffer.Get(data[type]['hardware']).value;
			break;
		case "receiver":
			var recNum = oScreenBuffer.Get(data[type]['receiver']);
			var recCRC = oScreenBuffer.Get(data[type]['receiverCRC']);
			fieldValue = recNum.value + recCRC.value;
			break;
		case "smartcard":
			var smartCardNum = oScreenBuffer.Get(data[type]['smartcard']);
			var smartCardCRC = oScreenBuffer.Get(data[type]['smartcardCRC']);
			fieldValue = smartCardNum.value + smartCardCRC.value;
			break;
		default:
			/*
				Don't support any other kinds so return so we don't receive an error
			*/
			return;
	}
	
	var receiver = new receiverClass;
	
	receiver.Validate(field, fieldValue, data[type]['function']);
}
