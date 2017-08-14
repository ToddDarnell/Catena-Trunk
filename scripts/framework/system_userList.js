/*
	The purpose of this file is to manage the user list within
	Catena.
*/

/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
function system_UserList()
{
	this.showOrg = true;				//	Append the organization name at the
										//	end of the user names when filling
										//	in a list
	this.serverURL = strUserURL;		//	The server side file to query for the list

}

system_UserList.prototype = new system_list("user_ID", "user_Name",  "getlist");
system_UserList.prototype.constructor = system_UserList;

/*--------------------------------------------------------------------------
	-	description
			Fills a select control.
			Doesn't use the default function because we are overriding some
			of the functionality. Specifically to show the user's organization
			next to their name
	-	params
	-	return
--------------------------------------------------------------------------*/
system_UserList.prototype.fillControl = function (element_Name, addBlank, defaultId)
{
	if(!this.list)
	{
		alert("Invalid control");
		return false;
	}
	position = this.GetPosition(defaultId);
	fieldName = this.field_Name;
	
	/*
		Get rid of all of the children of this element
		Then create a blank option and add it to the list first
	*/
	if (isString(element_Name))
	{
		control = oScreenBuffer.Get(element_Name);
	}
	else
	{
		control = element_Name;
	}
	
	if(!control)
	{
		oSystem_Debug.warning("Control " + element_Name + " not found in fill control.");
		return;
	}
	
	RemoveChildren(element_Name);

	var listOption;
	var blankOption = document.createElement("OPTION");

	/*
		Because addBlank was added after the fillField
		control was added to many lists
		the default behavior is set to be add a blank
		if the addBlank field is not defined or is set
		to true.
		This way we don't have to go back and change all the
		fields
	*/
	
	if(addBlank == undefined || addBlank == true)
	{
		control.appendChild(blankOption);
	}
	
	//
	//	Now build the list with the existing organizations
	//

	for(var iElement=0; iElement < this.list.length; iElement++)
	{
		listOption = document.createElement("OPTION");
		
		if(fieldName)
		{
			itemValue = this.list[iElement][fieldName];
			orgValue = this.list[iElement]["org_Short_Name"];
		}
		else
		{
			itemValue = this.list[iElement];
			orgValue = "";
		}
		
		listOption.value = itemValue;

		if(this.showOrg)
		{
			listOption.innerHTML = itemValue + " (" + orgValue + ")";
		}
		else
		{
			listOption.innerHTML = itemValue;
		}

		/*
			Set to true if the element matches the position passed in
			The default is false so we don't change it if the positions don't match
		*/
		if(iElement == position)
		{
			listOption.selected = true;
		}
				
		control.appendChild(listOption);
	}
}