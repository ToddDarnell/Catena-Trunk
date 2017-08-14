/*	
	-	This list keeps track of the rights the currently logged in user has and
		therefore may give to a user or group.
*/
var oUserRightsList = new system_list("right_ID", "right_Name", "get_owner_assigned_rights_list");

oUserRightsList.serverURL = strSystemAccessURL;

/*--------------------------------------------------------------------------
	-	description
			Fill the control with the organizations	this user may assign
			with this right.
	-	params
			strElement
				The element which displays the organizations.
			strRight
				The right which we'll retrieve the organizations
				for.
	-	return
--------------------------------------------------------------------------*/
oUserRightsList.fillOrgControl = function(strElement, strRight)
{
	oRights.fillOrgControl(strRight, strElement, true);
}
/*--------------------------------------------------------------------------
	-	description
			This function returns true of the passed in right requires an
			organization be assigned to it.
	-	params
			strRight
				The right to be checked against
	-	return
			true
				if the right requires an organization
			false
				if the right does not require an organization when being
				assigned
--------------------------------------------------------------------------*/
oUserRightsList.RequiresOrg = function(strRight)
{
	record = this.get(strRight);
	
	if(record)
	{
		return record.right_UseOrg == 1;
	}
	return false;
}