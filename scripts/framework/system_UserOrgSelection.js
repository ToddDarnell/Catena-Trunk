/*
	This file is a class which manages selecting an organization or
	organization/user combination.
*/
//
//	Use these to describe if you're using just the organization
//	or the organization and user fields
//
var eDisplayOrgList = 0;
var eDisplayUserList = 1;

//--------------------------------------------------------------------------
/**
	\brief
	\param [in] element_name An optional parameter which sets the name
				of the element to use for this popup. Note, if
				not set here, the element must be set with load
	\param [in] userStyle
				Determines which type of popup should use. Organization
				or Organization/user
	\return
*/
//--------------------------------------------------------------------------
function system_UserOrgSelection()
{
	this.clear();

	this.userStyle = eDisplayOrgList;
	this.dialogLoaded = false;
	this.editBoxWidth = 160;
	/*
		Set some default values.
		These may be overridden by the declard class
	*/
												
	this.strDefaultUserText = "Select User";
	this.strDefaultOrgText = "Organization";
	this.strDefaultUserToolTip = "Select a user";
	this.strDefaultOrgToolTip = "Select a user";
	this.useInactiveAccounts = false;
	this.bPerformedHack = false;		//	An IE Select field hack. Performed in the show function.
	
	if(arguments[0])
	{
		this.strElementName = arguments[0];
	}

	if(arguments[1])
	{
		this.userStyle = arguments[1];
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param strParentElement
		The parent HTML element which we use to attach this object to
		the document "page".
	\param rootId
		The root html element we'll create the popup using. This
		element is not attached to anything, and shouldn't exist.
	\param userStyle
		-	eDisplayOrgList
			Display only the organization list
		-	eDisplayUserList
			Display the user name and the organization list
	\return
*/
//--------------------------------------------------------------------------
system_UserOrgSelection.prototype.load = function(strParentElement, rootId, userStyle)
{
	this.strElementName = rootId;
	this.userStyle = userStyle;	

	if(this.userStyle != eDisplayOrgList)
	{
		this.userStyle = eDisplayUserList;
	}
	
	/*
		Set up if this is an organization dialog box or if it's
		a user organization.
	*/
	if(this.userStyle == eDisplayOrgList)
	{
		this.editBoxWidth = 100;
		editBoxTip = "Begin typing an organization name here"
		popupToolTip = "Click here to select an organization";
	}
	else
	{
		this.editBoxWidth = 160;
		editBoxTip = "Begin typing a a user name"
		popupToolTip = "Click here to select a user";
	}

	element_Parent = oScreenBuffer.Get(strParentElement);
	
	if(element_Parent == null)
	{
		alert("Invalid parent element: " + strParentElement);
		return false;
	}

	this.element_EditBox = document.createElement("INPUT");
	this.element_PopupLink = document.createElement("BUTTON");
	
	element_Parent.appendChild(this.element_EditBox);
	element_Parent.appendChild(this.element_PopupLink);

	/*
		Set up the box the user may type partial names into
	*/
	
	this.element_EditBox.type = "text";
	this.element_EditBox.style.left = "0px";
	this.element_EditBox.style.top = "0px";
	this.element_EditBox.style.width = this.editBoxWidth + "px";
	this.element_EditBox.style.zIndex = "2";
	this.element_EditBox.style.position = "absolute";
	
	text = ["", editBoxTip];
	SetToolTip(this.element_EditBox, text);

	/*
		Set up the dialog box link
	*/	
	this.element_PopupLink.style.left = "160px";
	this.element_PopupLink.style.top = "0px";
	this.element_PopupLink.style.zIndex = "2";
	this.element_PopupLink.style.position = "absolute";
	
	text = ["", popupToolTip];
	SetToolTip(this.element_PopupLink, text);

	screen_SetTextElement(this.element_PopupLink, "...");

	this.element_EditBox.oUserSelection = this;
	this.element_PopupLink.oUserSelection = this;
	
	this.element_PopupLink.onclick = function ()
	{
		this.oUserSelection.showDialog();
	}
	
	this.element_EditBox.onkeyup = function ()
	{
		this.oUserSelection.CheckSelected(this.value);
	};
}
//--------------------------------------------------------------------------
/**
	\brief
		Sets the location of the on screen elements
	\param xPos
		The left to right position on the screen
	\param yPos
		The top to bottom position on the screen
*/
//--------------------------------------------------------------------------
system_UserOrgSelection.prototype.setLocation = function(xPos, yPos)
{
	this.element_EditBox.style.left = xPos + "px";
	this.element_EditBox.style.top = yPos + "px";
	
	this.element_PopupLink.style.left = (xPos + this.editBoxWidth + 10) + "px";
	this.element_PopupLink.style.top = yPos + "px";
	
}
//--------------------------------------------------------------------------
/**
	\brief
		Takes the text the user typed into the box to see if there's
		a name which matches the text. If so, it fills the selected
		user box with the account.
	\param strValue
		May be the user name or the organization text depending upon
		what kind of popup we're using.
	\return
		none
*/
//--------------------------------------------------------------------------
system_UserOrgSelection.prototype.CheckSelected = function(strValue)
{
	/*
		Send to the server the partial user name
		and see if the server returns a unique id.
		If it does, then load that user name.
	*/
	strReturnValue = "";

	if(strValue)
	{
		if(strValue.length > 2)
		{
			if(this.userStyle == eDisplayOrgList)
			{
				oAccount = new system_OrgList();
			}
			else
			{
				oAccount = new system_UserList();
				oAccount.addParam("inactive", this.useInactiveAccounts);
			}

			oAccount.addParam("limit", 1);
			oAccount.addParam("name", strValue);
			oAccount.load();
			
			oSystem_Debug.notice(oAccount.getSize());
			oSystem_Debug.notice(strValue);
			
						
			if(oAccount.getSize() > 0)
			{
				arFoundRecord = oAccount.getFromPosition(0);
				
				if(arFoundRecord)
				{
					oSystem_Debug.notice(arFoundRecord.org_Short_Name);
					
					if(this.userStyle == eDisplayOrgList)
					{
						strReturnValue = arFoundRecord.org_Short_Name;
					}
					else
					{
						strReturnValue = arFoundRecord.user_Name;
					}
				}
			}
		}
	}
	
	if(strReturnValue != this.selectedValue)
	{
		this.selectedValue = strReturnValue;
		
		if(this.custom_submit)
		{
			this.custom_submit(this.selectedValue);
		}
	}
	
	oAccount = null;
}
/*
	When first created in the build screen functionality
	we don't know what the name of the element is,
	however, in the user screen we do so we use this function
	to set the name of the element we're using
	params:
		userStyle
			1		display organization only
			2		display user fields also
*/
system_UserOrgSelection.prototype.loadDialog = function()
{
	if(this.userStyle == eDisplayOrgList)
	{
		/*
			Organization only
		*/
		dialogWidth = 300;
		dialogHeight = 400;
		dialogTitle = "Select Organization";
		dialogButtons = 225;
	}
	else
	{
		/*
			Organization and user
		*/
		dialogWidth = 500;
		dialogHeight = 391;
		dialogTitle = "Select User";
		dialogButtons = 425;
	}

	this.oDialog = new system_Dialog();
	
	this.oDialog.config.width = dialogWidth;
	this.oDialog.config.height = dialogHeight;
	this.oDialog.strScreenTitle = dialogTitle;
	
	this.oDialog.create(this.strElementName);
	
	/*
		Now build the tree and attach it
	*/
	
	this.oOrgTree = null;
	this.oOrgTree = new system_tree();
	
	this.oOrgTree.config.width = 200;
	this.oOrgTree.config.height = 390;
	
	this.oOrgTree.createElement(this.oDialog.getBody(), 0, 0);

	/*
		We're setting the function we'll call when the organization
		is set
	*/
	
	this.oOrgTree.oNotify = this;
	/*
		attack the buttons for submit and cancel
	*/
	
	element_submit = document.createElement("BUTTON");
	element_submit.style.position = "absolute";
	element_submit.style.left = dialogButtons + "px";
	element_submit.style.top = "10px";
	element_submit.appendChild(document.createTextNode("Submit"));
	
	element_cancel = document.createElement("BUTTON");
	element_cancel.style.position = "absolute";
	element_cancel.style.left = dialogButtons + "px";
	element_cancel.style.top = "40px";
	element_cancel.appendChild(document.createTextNode("Cancel"));
	
	this.oDialog.appendChild(element_submit);
	this.oDialog.appendChild(element_cancel);

	this.element_users = null;
	
	if(this.userStyle == eDisplayUserList)
	{
		element_users_id = this.strElementName + "_user";
		element_users = document.createElement("SELECT");
		element_users.id = element_users_id;
		element_users.style.position = "absolute";
		element_users.style.left = "205px";
		element_users.style.top = "0px";
		element_users.style.width = "200px";
		element_users.oNotify = this;
		element_users.size = 24;
	
		this.oDialog.appendChild(element_users);
		this.element_users = element_users;
		
		this.element_users.ondblclick = element_users_ondblclick;
		
	}
		
	/*
		Now perfrom the action logic on these elements
	*/
	element_cancel.oDialog = this;
	element_cancel.onclick = function()
	{
		this.oDialog.cancel();
	}

	element_submit.oDialog = this;
	element_submit.onclick = function()
	{
		this.oDialog.submit();
	}
	
	this.dialogLoaded = true;

	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function element_users_ondblclick()
{
	if(this.value == "")
	{
		return;
	}

	oSystem_Debug.notice("On dbl click with value");
	if(this.oNotify)
	{
		this.oNotify.submit();
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_UserOrgSelection.prototype.show = function()
{
	ShowInheritElement(this.element_EditBox);
	ShowInheritElement(this.element_PopupLink);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_UserOrgSelection.prototype.hide = function()
{
	HideElement(this.element_EditBox);
	HideElement(this.element_PopupLink);
}
/*--------------------------------------------------------------------------
	-	description
			This function is called when the submit button is clicked
	-	params
	-	return
--------------------------------------------------------------------------*/
system_UserOrgSelection.prototype.submit = function ()
{
	if(this.userStyle == eDisplayUserList)
	{
		this.selectedValue = this.element_users.value;
	}
	else 
	{
		this.selectedValue = this.selectedOrg;
	}

	if(this.userStyle == eDisplayUserList)
	{
		if(this.selectedValue.length == 0)
		{
			alert("Select a user before selecting submit");
			return false;
		}
	}
	else
	{
		if(this.selectedOrg.length == 0)
		{
			alert("Select an organization before selecting submit");
			return false;
		}
	}

	if(this.custom_submit)
	{
		if(this.custom_submit(this.selectedValue) == false)
		{
			return false;
		}
	}
		
	this.hideDialog();
	
	this.element_EditBox.value = this.selectedValue;
	
	return true;
}
/*
	This function is called when the submit button is clicked
*/
system_UserOrgSelection.prototype.cancel = function ()
{
	if(this.custom_cancel)
	{
		if(this.custom_cancel() == false)
		{
			return false;
		}
	}

	this.clear();
	this.hideDialog();
	return true;
}
/*
	this is called when the tree changes
*/
system_UserOrgSelection.prototype.ontreechange = function(item_id, item_name)
{
	this.selectedOrg = item_name;
	
	if(this.userStyle == eDisplayUserList)
	{
		this.loadUsers(this.selectedOrg);
	}
}
/*
	Loads the user list with the users in the organization
	passed in as strOrg
*/
system_UserOrgSelection.prototype.loadUsers = function(strOrg)
{
	var oUsers = new system_UserList();
	
	oUsers.useInactiveAccounts = this.useInactiveAccounts;
	oUsers.showOrg = true;
	oUsers.addParam("organization", strOrg);
	oUsers.load();
	
	oUsers.fillControl(this.element_users, false);
}
var oSelectFieldFix = null;
/*
	This shows the dialog box
*/
system_UserOrgSelection.prototype.showDialog = function()
{
	if(this.dialogLoaded == false)
	{
		if(this.loadDialog() == false)
		{
			return false;
		}
	}
	else
	{
		/*
			Reset the fields
		*/
		this.loadOrgs();
		this.selectUser();
	}

	//this.clear();
	
	this.oDialog.show();
	this.loadOrgs();
	
	this.oOrgTree.oAll(false);
	this.oOrgTree.show();
	
	if(this.element_users)
	{
		/*
			Stupid IE hack... Add an elemenet
			to the select field to set it up properly
			with multiple size.
			The browser must leave the javascript load
			functionality. We then call a timer which
			fires and empties the fields. This causes
			the browser to realize it should be showing
			more than just a drop down and it draws it
			properly.
		*/
		RemoveChildren(this.element_users);
		
		if(this.bPerformedHack == false)
		{
			this.bPerformedHack = true;
			oSelectFieldFix = this;
			
			element_option = document.createElement("OPTION");
			element_option.value = " ";
			element_option.appendChild(document.createTextNode(" "));
			this.element_users.appendChild(element_option);
			setTimeout(ResetSelectField, 1);
		}
	}
}
function ResetSelectField()
{
	if(oSelectFieldFix)
	{
		RemoveChildren(oSelectFieldFix.element_users);
		oSelectFieldFix = null;
	}
}
//--------------------------------------------------------------------------
/**
	\brief
		Toggle showing the user/org dialoag box
*/
//--------------------------------------------------------------------------
system_UserOrgSelection.prototype.toggleShow = function()
{
	if(this.visible == true)
	{
		this.hideDialog();
	}
	else
	{
		this.showDialog();
	}
}
/*
	Load organization list. This is the organization the
	user may be put into.
*/
system_UserOrgSelection.prototype.loadOrgs = function()
{
	oOrganizationsList.load();
	oOrganizationsList.fillTree(this.oOrgTree);
}
/*
	Show the popup which displays the organization and user fields, if applicable
*/
system_UserOrgSelection.prototype.hideDialog = function()
{
	this.oDialog.hide();
	
	oSelectFieldFix = null;
	return true;
}
/*
	Clear the the fields.
	Reset the organization list.
	Clear the user list
	Clear the user name
*/
system_UserOrgSelection.prototype.clear = function()
{
	this.selectedValue = "";
	this.selectedOrg = "";
	
	if(this.element_EditBox)
	{
		this.element_EditBox.value = "";
	}
}
/*
	Filter Organizaton takes the value from the
	organization field and filters the user names
	by that organization
*/
system_UserOrgSelection.prototype.selectUser = function(userName)
{
	/*
		-	tell the user which user account they selected
			via the text box to the right of the user name drop down list
		-	Populate the individual rights fields with the accounts
			assigned and available rights.
	*/
	this.selectedValue = userName;
		
	if(userName)
	{
		/*
			call the call back function for selecting a user account
		*/
		if(this.fnUserUpdate)
		{
			this.fnUserUpdate();
		}
	}
	else
	{
		/*
			call the callback function for unselecting a user account
		*/
		if(this.fnUserUpdate)
		{
			this.fnUserUpdate();
		}
	}
}