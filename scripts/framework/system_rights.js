var oRights = new system_list("right_ID", "right_Name",  "rights");

oRights.oOrgList = new system_list("org_ID", "org_Short_Name", "get_assigned_orgs_list");
oRights.accessURL = strSystemAccessURL;
oRights.serverURL = strListURL;
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights.build = function()
{
	for(var iElement=0; iElement < this.list.length; iElement++)
	{
		/*
			-	elementName is the name of the right. for example,
				dms_admin
			-	elementValue is the database id number of the right
				for example, 14 for dms_admin (example. may be true or not).
		*/
		
		elementName = this.list[iElement][this.field_Name];
		elementValue = this.list[iElement][this.field_Id];
		this[elementName] = elementValue;
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights.loadOrgs = function (rightId)
{
	this.oOrgList.serverURL = this.accessURL;
	this.oOrgList.addParam('right', rightId);
	this.oOrgList.load();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights.fillOrgControl = function (rightId, element_list, bBlank)
{
	this.oOrgList.serverURL = this.accessURL;
	this.oOrgList.addParam('right', rightId);
	this.oOrgList.load();
	this.oOrgList.fillControl(element_list, bBlank);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights.AssignUserRight = function(userName, rightName, rightOrg)
{
	var serverValues = Object();
	serverValues.user = userName;
	serverValues.right = rightName;
	serverValues.right_org = rightOrg;
	serverValues.location = this.accessURL;
	serverValues.action = "assign_user_right";

	return server.callSync(serverValues);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param rightId
		The id of the right record being removed from the assigned
		right table
	\return
*/
//--------------------------------------------------------------------------
oRights.RemoveAssignedRight = function(rightId)
{
	var serverValues = Object();
	serverValues.right = rightId;
	serverValues.location = this.accessURL;
	serverValues.action = "remove_assigned_right";	
	
	return server.callSync(serverValues);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights.AssignUserGroup = function(user, group)
{
	var serverValues = Object();
	serverValues.user = user;
	serverValues.group = group;
	serverValues.location = this.accessURL;
	serverValues.action = "assign_user_group";

	return server.callSync(serverValues);	
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights.RemoveUserGroup = function(assignedGroupId)
{
	var serverValues = Object();
	serverValues.group = assignedGroupId;
	serverValues.location = this.accessURL;
	serverValues.action = "remove_assigned_group";
	
	return server.callSync(serverValues);	
}

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights.AssignOrgRight = function(organization, rightName, rightOrg)
{
	var serverValues = Object();
	serverValues.organization = organization;
	serverValues.right = rightName;
	serverValues.right_org = rightOrg;
	serverValues.location = this.accessURL;
	serverValues.action = "assign_org_right";

	return server.callSync(serverValues);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights.AssignOrgGroup = function(organization, group)
{
	var serverValues = Object();
	serverValues.organization = organization;
	serverValues.group = group;
	serverValues.location = this.accessURL;
	serverValues.action = "assign_org_group";

	return server.callSync(serverValues);	
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
oRights.RemoveOrgGroup = function(assignedGroupId)
{
	var serverValues = Object();
	serverValues.group = assignedGroupId;
	serverValues.location = this.accessURL;
	serverValues.action = "remove_org_group";
	
	return server.callSync(serverValues);	
}