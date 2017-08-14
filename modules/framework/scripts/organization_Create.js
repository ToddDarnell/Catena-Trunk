/*
	This file maintains the create group popup.
*/
function organization_Create()
{
	this.loaded = false;
	this.strNewName = "New Organization";
	this.strModifyName = "Modify Organization";
}
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
organization_Create.prototype.create = function()
{
	this.oDialog = new system_Dialog();
	
	this.oDialog.config.width = 325;
	this.oDialog.config.height = 250;
	this.oDialog.strScreenTitle = this.strNewName;
	this.oDialog.load("RightGroupCreateDialog", "organization_Create", "framework");

	this.element_name = this.oDialog.getElementById("organization_Name");
	this.element_description = this.oDialog.getElementById("organization_FullName");
	this.element_organization = this.oDialog.getElementById("organization_ParentList");
	
	element_ok = this.oDialog.getElementById("organization_Submit");
	element_cancel = this.oDialog.getElementById("organization_Cancel");
	
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
organization_Create.prototype.Submit = function()
{
	var serverValues = Object();

	serverValues.shortName = this.element_name.value;
	serverValues.longName = this.element_description.value;
	serverValues.parent = this.element_organization.value;
	serverValues.location = strOrganizationURL;
	
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
organization_Create.prototype.show = function(strOrgName)
{
	if(this.loaded == false)
	{
		this.create();
	}
	
	this.element_name.value = "";
	this.element_description.value = "";
	
	oRights.fillOrgControl(oRights.SYSTEM_RightsAdmin, this.element_organization, true);
	
	this.modifyId = null;
		
	if(strOrgName)
	{
		this.bModify = true;
		oOrganizationList = new system_OrgList();
		
		oOrganizationList.addParam("name", strOrgName);
		oOrganizationList.load();
		arOrg = oOrganizationList.get(strOrgName);

		this.element_name.value = arOrg.org_Short_Name;
		this.element_description.value = arOrg.org_Long_Name;
		this.element_organization.value = arOrg.org_Parent;
		this.modifyId = arOrg.org_ID;
		this.oDialog.setTitle(this.strModifyName);
	}
	else
	{
		this.oDialog.setTitle(this.strNewName);
	}
	this.oDialog.show();
	
	this.element_name.focus();
	this.element_name.select();

}