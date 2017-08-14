/*
	The purpose of this file is to manage searching for receivers.
*/

strReceiverSearchScreen = "Search Receivers";

oReceiver_Search = new system_SearchScreen();

oReceiver_Search.screen_Menu = strReceiverSearchScreen;
oReceiver_Search.screen_Name = "receiver_Search";
oReceiver_Search.module_Name = "rms";

oReceiver_Search.search_List	= "getreceiverlist";

oReceiver_Search.search_URL = strReceiverURL;

/*
	Custom clear allows a developer to add custom functionality
	to clear elements which are not part of the base class but
	must be cleared.
*/
oReceiver_Search.custom_Clear = function()
{
	oScreenBuffer.Get("recSearch_Receiver").value = "";
	oScreenBuffer.Get("recSearch_SmartCard").value = "";
	oScreenBuffer.Get("recSearch_Hardware").value = "";
	oScreenBuffer.Get("recSearch_Control").value = "";
	oScreenBuffer.Get("recSearch_ModelList").value = "";
	oScreenBuffer.Get("recSearch_StatusList").value = "";
	this.oUserFilter.clear();
	this.oOrgFilter.clear();
	this.SelectOrg("");
	this.SelectUser("");
}
/*
	fnProcess is called once the data has been received
	from the server. Since we have to use a stand alone
	function due to the way JavaScript treats functions
	we're creating a wrapper call back function.
*/
oReceiver_Search.fnProcess = function(strResults)
{
	oReceiver_Search.ProcessResults(strResults);
}
/*
    perform any special cases which need to be performed
    before the screen is displayed
*/
oReceiver_Search.custom_Show = function()
{
    oReceiverModelList.load();
    oReceiverModelList.fillControl("recSearch_ModelList", true);
    
    oReceiverStatusList.load();
    oReceiverStatusList.fillControl("recSearch_StatusList", true);
}
/*
	custom load sets the values for the header list
*/
oReceiver_Search.custom_Load = function()
{
	this.element_UserSelected = oScreenBuffer.Get("recSearch_SelectedUser");

	this.oUserFilter = new system_UserOrgSelection();
	this.oUserFilter.load("RecSearchBox", "recSearch_UserPopup", eDisplayUserList);

	this.oUserFilter.setLocation(20, 180);

	this.oUserFilter.custom_submit = function (selectedUser)
	{
		oReceiver_Search.SelectUser(selectedUser);
		return true;
	}

	this.element_OrgSelected = oScreenBuffer.Get("recSearch_SelectedOrg");

	this.oOrgFilter = new system_UserOrgSelection();
	this.oOrgFilter.load("RecSearchBox", "recSearch_OrgPopup", eDisplayOrgList);
	
	this.oOrgFilter.setLocation(260, 180);
	this.oOrgFilter.custom_submit = function (selectedOrg)
	{
		oReceiver_Search.SelectOrg(selectedOrg);
		return true;
	}

	this.element_UserInput = oScreenBuffer.Get("recSearch_Owner");
	this.element_OrgInput = oScreenBuffer.Get("recSearch_Org");

	arHeader = Array();
	
	arHeader[0] = Object();
		arHeader[0].text = "Control";
		arHeader[0].sort = true;
		arHeader[0].dataType = "number";
		arHeader[0].fieldName = "rec_Control_Num";
	arHeader[1] = Object();
		arHeader[1].text = "Receiver";
		arHeader[1].sort = true;
		arHeader[1].dataType = "string";
		arHeader[1].fieldName = "rec_Number";
	arHeader[2] = Object();
		arHeader[2].text = "Smart Card";
		arHeader[2].sort = true;
		arHeader[2].dataType = "string";
		arHeader[2].fieldName = "rec_SmartCard";
	arHeader[3] = Object();
		arHeader[3].sort = true;
		arHeader[3].text = "Hardware";
		arHeader[3].dataType = "string";
		arHeader[3].fieldName = "rec_Hardware";
	arHeader[4] = Object();
		arHeader[4].text = "Actions";
	
    this.oResults.SetHeader(arHeader);
    
    this.oResults.SetCaption("Results");
    this.oResults.pageLength = 10;
    this.oResults.custom_element = DisplayReceiverResultItem;
        	
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Filter Organizaton takes the value from the
			organization field and filters the user names
			by that organization
	-	params
	-	return
--------------------------------------------------------------------------*/
oReceiver_Search.SelectOrg = function(userOrg)
{ 
	if(userOrg)
	{
		this.element_OrgInput.value = userOrg;
		screen_SetTextElement(this.element_OrgSelected, userOrg);
	}
	else
	{
		this.element_OrgInput.value = "";
		screen_SetTextElement(this.element_OrgSelected, "");
	}
}

//--------------------------------------------------------------------------
/**
	\brief
		Select User is called when the oUserFilter has a name selected or 
		unselected in the user field
	\param userName
		userName is the selected user
	\return
		none
*/
//--------------------------------------------------------------------------
oReceiver_Search.SelectUser = function(userName)
{
	if(userName)
	{
		var oUsers = new system_UserList();
		oUsers.addParam("name", userName);
		oUsers.load();

		user_record = oUsers.get(userName);
		userOrg = user_record.org_Short_Name;

		this.element_UserInput.value = userName;
		screen_SetTextElement(this.element_UserSelected, userName + " (" + userOrg + ")");
	}
	else
	{
		this.element_UserInput.value = "";
		screen_SetTextElement(this.element_UserSelected, "");
	}
}
/*--------------------------------------------------------------------------
	-	description
			Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
function DisplayReceiverResultItem(listPosition)
{
	i = listPosition;
	
	var element_row1 = document.createElement("TR");
	oSystem_Colors.SetPrimary(element_row1);
	this.element_body.appendChild(element_row1);

	var element_col = document.createElement("TD");
	element_col.innerHTML = this.list[i]["rec_Control_Num"];
	element_row1.appendChild(element_col);

	var element_col2 = document.createElement("TD");
	element_col2.innerHTML = formatReceiver(this.list[i]["rec_Number"]);
	element_row1.appendChild(element_col2);

	var element_col3 = document.createElement("TD");
	element_col3.innerHTML = formatSmartcard(this.list[i]["rec_SmartCard"]);
	element_row1.appendChild(element_col3);
	
	var element_col4 = document.createElement("TD");
	element_col4.innerHTML = this.list[i]["rec_Hardware"];
	element_row1.appendChild(element_col4);

	element_row1.appendChild(GetReceiverActions(this.list[i]));
	
	var element_row2 = document.createElement("TR");
	oSystem_Colors.SetPrimary(element_row2);
	this.element_body.appendChild(element_row2);

	if(i % 2 == 1)
	{
		oSystem_Colors.SetSecondaryBackground(element_row1);
		oSystem_Colors.SetSecondaryBackground(element_row2);
	}
	else
	{
		oSystem_Colors.SetTertiaryBackground(element_row1);
		oSystem_Colors.SetTertiaryBackground(element_row2);
	}
	
	var element_col4 = document.createElement("TD");
	element_col4.appendChild(document.createTextNode(this.list[i]["user_Name"]));
	element_col4.colSpan = "2";
	element_row2.appendChild(element_col4);

	var element_col5 = document.createElement("TD");
	element_col5.appendChild(screen_CreateOrganizationLink(this.list[i]["org_Short_Name"]));
	element_row2.appendChild(element_col5);
	
	var element_col6 = document.createElement("TD");
	element_col6.innerHTML = this.list[i]["recStatus_Name"];
	element_row2.appendChild(element_col6);
}
/*
	GetReceiverActions sets up the list of different actions which
	can be performed in the receiver listed in the search results
	
*/
function GetReceiverActions(oReceiver)
{
	/*
		Declare all of the variables
	*/
	var resultTag = document.createElement("TD");

	resultTag.rowSpan = "2";
	resultTag.vAlign = "top";

	if(oUser.HasRight(oRights.RMS_Admin, oReceiver.org_Short_Name))
	{
		var modifyTag = document.createElement("SPAN");

		modifyTag.className = "link";
		modifyTag.appendChild(document.createTextNode("Modify"));
		modifyTag.receiverId = oReceiver.rec_ID;
		modifyTag.title = "Modify receiver details";
	
		modifyTag.onclick = function ()
		{
			oReceiver_Modify.Modify(this.receiverId, strReceiverSearchScreen);
		}
	
		resultTag.appendChild(modifyTag);
		var brTag = document.createElement("BR");
		resultTag.appendChild(brTag);
	}
	
	if(oReceiver.mayOwn)
	{
		/*
		var ownTag = document.createElement("SPAN");

		ownTag.className = "link";
		ownTag.appendChild(document.createTextNode("Assign"));
		ownTag.receiverId = oReceiver.rec_ID;
		ownTag.title = "Take ownership of this receiver";
	
		ownTag.onclick = function ()
		{
			if(window.confirm("Do you wish to take ownership of this receiver?"))
			{
				oReceiver_UserInventory.AssignReceiver(this.receiverId);
			}
		}
	
		resultTag.appendChild(ownTag);
		*/
	}
	
	return resultTag;	
};

oReceiver_Search.register();
