/*
	This allows the creation of tab elements
*/
function system_tabManager(element_root)
{
	if (isString(element_root))
	{
		this.element_root = oScreenBuffer.Get(element_root);
	}
	else
	{
		if(!element_root)
		{
			return;
		}
		this.element_root = element_root;
	}
	
	this.iActive = 0;
	this.element_root.style.position = "absolute";
	//this.element_root.style.border = "1px solid Black";
	//this.element_root.style.backgroundColor = "#00FF00";
	
	this.element_titleRoot = appendChild(this.element_root, "DIV");
	this.element_titleRoot.style.paddingLeft = "15px";
	
	this.element_bodyRoot = appendChild(this.element_root, "DIV");
	//this.element_bodyRoot.style.border = "1px solid Black";
	//this.element_bodyRoot.style.padding = "10px";
	//this.element_bodyRoot.style.position = "relative";
	//this.element_bodyRoot.style.display = "inline";
	//this.element_bodyRoot.style.float = "left";
	//this.element_bodyRoot.style.backgroundColor = "#FF00FF";
	
	
	this.pageTabs = new Array();
}
//--------------------------------------------------------------------------
/**
	\brief
	\param position
		The position on the screen
	\param strTitle
		The title of the tab
	\param border
		Whether the border should be used or not
	\param fnSetup
		The function called to perform setup.
	\param fnActivate
		The function called when this tab page is activated
	\return
*/
//--------------------------------------------------------------------------
system_tabManager.prototype.addTab = function(position, strTitle, border, fnSetup, fnShow )
{
	this.pageTabs[position] = null;
	this.pageTabs[position] = new Object();

	/*
		Create the title element
	*/
	
	element_tab = appendChild(this.element_titleRoot, "BUTTON");

	element_tab.appendChild(document.createTextNode(strTitle));
	
	element_tab.pageId = position;
	element_tab.parent = this;

	element_tab.onclick = function()
	{
		this.parent.activate(this.pageId);
	}

	this.pageTabs[position].element_title = element_tab;

	/*
		Create the body element. The canvas which the page is put on
	*/
	element_body = appendChild(this.element_bodyRoot, "DIV");
	element_body.style.display = "inline";

	element_body.style.position = "relative";
	
	if(border)
	{
		//element_body.style.border = "1px solid Black";
		//element_body.style.padding = "10px";
	}
	else
	{
		element_body.style.top = "12px";
	}
	
	//element_body.style.backgroundColor = "#0000FF";
	//element_body.style.padding = "2px";

	this.pageTabs[position].id = position;
	this.pageTabs[position].element_body = element_body;
	
	if(fnSetup)
	{
		fnSetup(this.pageTabs[position].element_body);
	}
	
	this.pageTabs[position].fnShow = fnShow;

	if(this.pageTabs.length == 1)
	{
		oSystem_Colors.SetSecondary(element_tab);
		oSystem_Colors.SetPrimaryBackground(element_tab);
		element_body.style.display = "block";
	}
	else
	{
		oSystem_Colors.SetSecondaryBackground(element_tab);
		oSystem_Colors.SetPrimary(element_tab);
		element_body.style.display = "none";
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_tabManager.prototype.show = function()
{
	this.activate(this.iActive);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_tabManager.prototype.activate = function(iActive)
{
	if((iActive >= 0 ) && (iActive < this.pageTabs.length))
	{
		/*
			Disable the currently active page.
		*/
		
		oSystem_Colors.SetSecondaryBackground(this.pageTabs[this.iActive].element_title);
		oSystem_Colors.SetPrimary(this.pageTabs[this.iActive].element_title);
		this.pageTabs[this.iActive].element_body.style.display = "none";

		/*
			Enable the new active page.
		*/
		this.iActive = iActive;
	
		oSystem_Colors.SetSecondary(this.pageTabs[this.iActive].element_title);
		oSystem_Colors.SetPrimaryBackground(this.pageTabs[this.iActive].element_title);

		this.pageTabs[this.iActive].element_body.style.display = "block";
		
		if(this.pageTabs[this.iActive].fnShow)
		{
			this.pageTabs[this.iActive].fnShow();
		}
	}
}