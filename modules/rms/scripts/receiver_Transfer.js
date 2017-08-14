/*
	The purpose of this functionality is to transfer a receiver from one organization to another
*/

var strTransferReceiverScreen = "Transfer Receiver";

var oTransferReceiver = 
{
	backButton:"transferReceiverBackButton",	//	The name of the back(clear) button
	submitButton:"transferReceiverButton",		//	The name of the submit button
	receiverId:0,								//	This is the receiver id that is being transfered
	oScreen: null,							//	The screen object for this class
	strScreenName: "receiverTransfer",
 	HideScreen: function()
	{
		this.oScreen.Hide();
	},
	ShowScreen: function()
	{
		this.oScreen.Show();
		return true;
	},
	loadScreen: function()
	{
		this.oScreen = new system_AppScreen();
		
		if(!this.oScreen.Create(this.strScreenName))
		{
			oSystem_Debug.warning("Unable to create " + this.strScreenName + "screen");
			return false;
		}
		
		/*
			When the hardware numbers are changed we check the first two to find the
			model
		*/
		
		this.receiver = oScreenBuffer.Get("RecTransferReceiver");

		this.hardware = oScreenBuffer.Get("RecTransferHardware");
		this.smartcard = oScreenBuffer.Get("RecTransferSmartcard");
		this.statusList = oScreenBuffer.Get("RecTransferStatusList");
		this.transferList = oScreenBuffer.Get("transferRecToList");
				
		oScreenBuffer.Get(this.submitButton).onclick = function ()
		{
			oTransferReceiver.Submit();
        };

		oScreenBuffer.Get(this.backButton).backScreen = "";
		oScreenBuffer.Get(this.backButton).onclick = function ()
		{
			oCatenaApp.navigate(this.backScreen);
			oTransferReceiver.ClearFields();
        };

		oCatenaApp.RegisterScreen(strTransferReceiverScreen, this);
	},
	/*
		ClearFields clears the receiver/ smart card/ etc fields
		of the Modify receiver form
	*/
	ClearFields: function()
	{
		this.hardware.value = "";
		this.receiver.value = "";
		this.smartcard.value = "";
		this.statusList.value = "";
		oScreenBuffer.Get("ReceiverTransferModel").value = "";
	},
	Submit: function()
	{
		/*
			The values we're submitting to the server.
			In this case data to Modify a receiver
		*/

		var serverValues = Object();

		serverValues.id = this.receiverId;
		serverValues.organization = this.transferList.value;
		serverValues.location = strReceiverURL;
		serverValues.action = "transferReceiver";

		/*
			Contact the server with our request. wait for the response and
			then display it to the user
		*/
		
		var responseText = server.callSync(serverValues);
		var responseInfo = responseText.split("||");
		
		if(eval(responseInfo[0]))
		{
			oCatenaApp.navigate(oScreenBuffer.Get(this.backButton).backScreen);
			oCatenaApp.showNotice(notice_Info, responseInfo[1]);
		}
		else
		{
			oCatenaApp.showNotice(notice_Error, responseInfo[1]);
			return false;
		}

		return true;
	},
	/*
		Modifies a receiver based upon what's passed in as receiverId.
		By either cancelling or submitting a successful request, sets
		focus to the screen passed in.
	*/
	Transfer: function(receiverId, backScreen)
	{
		/*
			-	Tell the back button where it should send the user
			if they click it
			-	clear all of the fields in this form
			-	send a request to the server for the data for this receiver organization
			-	draw the screen for modifying a receiver
		*/
		
		this.receiverId = receiverId;
		
		oScreenBuffer.Get(this.backButton).backScreen = backScreen;
		this.ClearFields();

		var serverValues = Object();
		serverValues.receiverId = this.receiverId;
		serverValues.location = strReceiverURL;
		serverValues.action = "getreceiverlist";

		/*
			Contact the server with our request. wait for the resonse and
			then display it to the user
		*/
		var recList = server.CreateListSync(serverValues, "receiver");

		/*
			This receiver list should have only one element in it. if there are
			more we have a problem
		*/
		if(recList.length == 1)
		{
			this.hardware.value = recList[0]['rec_Hardware'];
			this.receiver.value = recList[0]['rec_Number'];
			this.smartcard.value = recList[0]['rec_SmartCard'];
			this.statusList.value = recList[0]['recStatus_Name'];
		}
		else
		{
			oCatenaApp.showNotice(notice_Error, "Unable to load receiver for transferring.");
		}
		
		oOrganizationsList.fillControl("transferRecToList", true);
		
		oCatenaApp.navigate(strTransferReceiverScreen);

		return true;
	}
}