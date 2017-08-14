/*
	This file maintains the system links system, which appears in the upper
	right hand corner of the screen. These links are available and usuable
	throughout the entire system.
*/
function system_Feedback()
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
system_Feedback.prototype.load = function()
{
	oFeedbackLink = new Object();
	
	oFeedbackLink.text = "Contact Us";
	oFeedbackLink.color = "black";
	oFeedbackLink.title = "Submit feedback to the website developers";
	
	oFeedbackLink.fnCallback = function()
	{
		oSystem_Feedback.show();
	}

	oSystemLinks.add(oFeedbackLink);
};
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_Feedback.prototype.create = function()
{
	this.oDialog = new system_Dialog();
	
	this.oDialog.config.width = 400;
	this.oDialog.config.height = 300;
	this.oDialog.strScreenTitle = "Catena Feedback";
	
	this.oDialog.create("SystemFeedbackDialog");

	this.oDialog.appendChild(screen_CreateTextElement("From:", 20, 20));
	this.oDialog.appendChild(screen_CreateTextElement(oUser.user_Name, 80, 20));

	this.oDialog.appendChild(screen_CreateTextElement("Subject:", 20, 40));

	
	this.element_subject = screen_CreateInputElement("systemfeedback_subject", "");
	this.element_subject.style.position = "absolute";
	this.element_subject.style.left = "80px";
	this.element_subject.style.top = "40px";
	this.element_subject.style.width = "305px";
	
	this.oDialog.appendChild(this.element_subject);

	this.element_body = document.createElement("TEXTAREA");
	
	this.element_body.style.type = "text";
	this.element_body.style.position = "absolute";
	this.element_body.style.left = "15px";
	this.element_body.style.top = "70px";
	this.element_body.style.height = "180px";
	this.element_body.style.width = "370px";
	
	this.oDialog.appendChild(this.element_body);
	
	element_ok = document.createElement("BUTTON");
	element_ok.style.position = "absolute";
	element_ok.style.left = "215px";
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
	element_cancel.style.left = "320px";
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
system_Feedback.prototype.Submit = function()
{
	var serverValues = Object();
	serverValues.subject = this.element_subject.value;
	serverValues.body = this.element_body.value;
	serverValues.location = strFeedbackURL;
	
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
system_Feedback.prototype.show = function()
{
	if(this.loaded == false)
	{
		this.create();
	}
	
	this.element_subject.value = "Catena feedback";
	this.element_body.value = "";

	this.oDialog.show();

}

oSystem_Feedback = new system_Feedback();