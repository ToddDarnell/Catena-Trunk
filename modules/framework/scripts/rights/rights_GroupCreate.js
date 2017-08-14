/*
	This file maintains the create group popup.
*/
function rights_GroupCreate()
{
	this.loaded = false;
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
rights_GroupCreate.prototype.create = function()
{
	this.oDialog = new system_Dialog();
	
	this.oDialog.config.width = 325;
	this.oDialog.config.height = 300;
	this.oDialog.strScreenTitle = "New Right Group";
	this.oDialog.load("RightGroupCreateDialog", "rights_CreateGroup", "framework");

	this.element_name = this.oDialog.getElementById("rightGroup_Name");
	this.element_description = this.oDialog.getElementById("rightGroup_Description");
	this.element_organization = this.oDialog.getElementById("rightGroup_AddOrgList");
	
	element_ok = this.oDialog.getElementById("rightGroup_Submit");
	element_cancel = this.oDialog.getElementById("rightGroup_Cancel");
	
	element_ok.oDialog = this;
	element_ok.onclick = function()
	{
		this.oDialog.Submit();
	}

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
rights_GroupCreate.prototype.Submit = function()
{
	var serverValues = Object();

	serverValues.group = this.element_name.value;
	serverValues.description = this.element_description.value;
	serverValues.organization = this.element_organization.value;
	serverValues.location = strRightGroupURL;
	
	if(this.bModify == true)
	{
		serverValues.action = "modify";
		serverValues.id = this.modifyId;
	}
	else
	{
		serverValues.action = "add";
	}
	
	var responseText = server.callSync(serverValues);
	
	if(oCatenaApp.showResults(responseText))
	{
		this.oDialog.hide();
		
		if(this.custom_submit)
		{
			this.custom_submit();
		}
	}
	else
	{
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
rights_GroupCreate.prototype.show = function(rightGroupId)
{
	if(this.loaded == false)
	{
		this.create();
	}
	
	this.element_name.value = "";
	this.element_description.value = "";
	
	oRights.fillOrgControl(oRights.SYSTEM_RightsAdmin, this.element_organization, true);
	this.modifyId = null;
		
	if(rightGroupId)
	{
		this.bModify = true;
		oRightGroupList = new system_RightGroupList();
		
		oRightGroupList.addParam("name", rightGroupId);
		oRightGroupList.load();
		
		arGroup = oRightGroupList.getFromId(rightGroupId);

		this.element_name.value = arGroup.rightGroup_Name;
		this.element_description.value = arGroup.rightGroup_Description;
		this.element_organization.value = arGroup.org_Short_Name;
		this.modifyId = arGroup.rightGroup_ID;
		this.oDialog.setTitle("Modify Right Group");
	}
	else
	{
		this.oDialog.setTitle("New Right Group");
	}
	this.oDialog.show();
	
	this.element_name.focus();
	this.element_name.select();

}