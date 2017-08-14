/*
	The organizaiton list
*/
function system_OrgList()
{
	this.serverURL = strListURL;
	
}

system_OrgList.prototype = new system_list("org_ID", "org_Short_Name",  "organizations");
//system_OrgList.serverURL = strListURL;

system_OrgList.prototype.constructor = system_OrgList;

/*--------------------------------------------------------------------------
	-	description
			Fills the organization tree with the organizations
			in order of their hierarchy
	-	params
	-	return
--------------------------------------------------------------------------*/
system_OrgList.prototype.fillTree = function(oTree)
{
	oTree.clear();

	for(var iElement=0; iElement < this.list.length; iElement++)
	{
		name = this.list[iElement][this.field_Name];
		title = this.list[iElement].org_Long_Name;
		id = this.list[iElement].org_ID;
		parentId = this.list[iElement].org_Parent;

		oTree.add(id, parentId, name, title);
	}
}

var oOrganizationsList = new system_OrgList();