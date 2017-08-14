/*
	Retrieves the raw menu data from the server (an xml string) and then passes it to
	ProcessMenu
*/
function LoadMenu()
{
	var serverValues = Object;
	var xmlObject;
	
	//
	//	Contact the server at this page,
	//	tell it what menu we want
	//	load the raw data into menuData
	//	pass it to the the loadXMLSync function
	//	which creates an XML object
	//	which then passes that XML object onto
	//	our parseMenu function which makes a menu
	//
	serverValues.location = strModulesURL;
	serverValues.action="menu";
	xmlObject = server.CreateXMLSync(serverValues);

	parseMenu(xmlObject);
}
/*
	This function builds the menu and places it onto the page
	
	The HTML code produced should look _similar_ to the following:

	<div id = "MainMenuSection">
	<DL>
		<dt onclick="menuMove('menu2');">Menu 2</dt>
			<dd id="menu2">
				<ul>
					<li><span class="link" id="Home">Home</span></li>
					<li><span class="link" id="menuItem2">Inventory</span></li>
				</ul>
			</dd>
	</DL>
*/
function parseMenu(oXmlDom)
{
    var oRoot = oXmlDom.documentElement;		//	used as a short cut instead of typing the entire name
	element_menu = document.createElement("div");	//	create the division on the page where we're plug the menu into
	element_menu.className = "menu";
	element_menu.id = "mainMenu";

	element_menuBlock = document.createElement("div");	//	create the division on the page where we're plug the menu into
	
	element_menuBlock.className = "menuBlock";

	element_menuBlock.appendChild(element_menu);
	
	document.body.appendChild(element_menuBlock);
	
	settings =
	{
  		tl: { radius: 5},
  		tr: { radius: 5 },
  		bl: { radius: 5 },
  		br: { radius: 5 },
  		antiAlias: true,
  		autoPad: false,
  		colorType:2
	}

	var cornersObj = new curvyCorners(settings, element_menuBlock);
	cornersObj.applyCornersToAll();	
	

	var menuTitle = "";									//	keeps track of the current menu item title
	
	var aSubMenu = oRoot.getElementsByTagName("SubMenu");

	for(var iMenu=0; iMenu < aSubMenu.length; iMenu++)
	{
		//
		//	First, we grab the title of the submenu
		//	and create that item
		//	then next we add all of the items to it
		//	if there are any
		var oCurrentChild = aSubMenu[iMenu].firstChild;
		
		strToolTip = "";
		strLink = "";				// keeps track of the current link external to the Catena site

		do
		{
			switch (oCurrentChild.tagName)
			{
    	  		case "title":
					menuTitle = oCurrentChild.text;
					break;
				case "tip":
					strToolTip = oCurrentChild.text;
					break;
				case "link":
					strLink = oCurrentChild.text;
				default:
					break;
			}
		} while (oCurrentChild = oCurrentChild.nextSibling);
		
		var element_section = document.createElement("DIV");
		element_section.appendChild(document.createTextNode(menuTitle));
		element_section.className = "menuTitle";
		element_section.style.border = "1px solid " +  oSystem_Colors.GetSecondary();
		
		text_link = ["", strToolTip];
		SetToolTip(element_section, text_link, tooltip_style["menu"]);

		element_section.link = strLink;
		
		if(element_section.link.length > 0)
		{
			element_section.style.textDecoration = "underline";
		}
		
		oSystem_Colors.SetPrimary(element_section);
		oSystem_Colors.SetTertiaryBackground(element_section);
					
		//	create a list to the menu item elements
	    var aMenuItems = aSubMenu[iMenu].getElementsByTagName("menuItem");

		//
		//	Now before we can append to the menudiv we need to know
		//	if this item has any children. If it doesn't, then it
		//	becomes a link with the id of the title.
		//	otherwise it becomes a link for expanding/contracting the menu
		//
		
		if(aMenuItems.length < 1)
		{
			//
			//	We have no children. Make this a link
			//
			element_section.id = menuTitle;

			addListener(element_section, 'click', menuNavigate);
			addListener(element_section, 'mouseover', menu_OnMouseOver);
			addListener(element_section, 'mouseout', menu_OnMouseOut);

			element_menu.appendChild(element_section);
		}
		else
		{
			//
			//	this menu has children so we need to make it an expander
			//	And we need to have a section for it
			element_section.menuMove = menuMove;

			element_section.id = iMenu;
			element_section.isOpen = false;
			
			addListener(element_section, 'click', menuMove);
			addListener(element_section, 'mouseover', menu_OnMouseOver);
			addListener(element_section, 'mouseout', menu_OnMouseOut);

			element_menu.appendChild(element_section);

			//
			//	We create the variable for the new section
			//
			sectionSubmenu = document.createElement("DIV");
			sectionSubmenu.id = "menu"+iMenu;
			sectionSubmenu.className = "menuTitleList";
			sectionSubmenu.menuCount = 0;
			
			for (var i = 0; i < aMenuItems.length; i++)
			{	
				strToolTip = "";
				strLink = "";
				//
				//	Go through and build each menu item based upon its attributes
				//
		        var oCurrentChild = aMenuItems[i].firstChild;
    		    do
				{
					switch (oCurrentChild.tagName)
					{
    		            case "title":
        		            menuTitle = oCurrentChild.text;
            		    	break;
            		    case "tip":
							strToolTip = oCurrentChild.text;
							break;
            		    case "link":
							strLink = oCurrentChild.text;
							break;
                		default:
	                	break;
	    	        }
    	    	} while (oCurrentChild = oCurrentChild.nextSibling);
				
				//
				//	Create the list element portion
				//	this just puts the item in the list
				//
				var menuListItem = document.createElement("DIV");

				oSystem_Colors.SetSecondaryBackground(menuListItem);
				oSystem_Colors.SetPrimary(menuListItem);

				addListener(menuListItem, 'click', menuNavigate);
				
				menuListItem.id = menuTitle;
				
				text_link = ["", strToolTip];
				SetToolTip(menuListItem, text_link, tooltip_style["menu"]);

				
				menuListItem.link = strLink;
				menuListItem.className = "menuListItem";

				menuListItem.appendChild(document.createTextNode(menuTitle));

				menuListItem.onmouseover = function()
				{
					oSystem_Colors.SetPrimaryBackground(this);
					oSystem_Colors.SetSecondary(this);
				}
				menuListItem.onmouseout = function()
				{
					oSystem_Colors.SetPrimary(this);
					oSystem_Colors.SetSecondaryBackground(this);
				}
			
				sectionSubmenu.appendChild(menuListItem);
				sectionSubmenu.menuCount++;
				
			}
			element_menu.appendChild(sectionSubmenu);
		}
    }

	menuCloseAll();
}
function menu_OnMouseOut(e)
{
	var theTarget = e.target ? e.target : e.srcElement;
	oSystem_Colors.SetPrimary(theTarget);
	oSystem_Colors.SetTertiaryBackground(theTarget);
}

function menu_OnMouseOver(e)
{
	var theTarget = e.target ? e.target : e.srcElement;
	oSystem_Colors.SetPrimaryBackground(theTarget);
	oSystem_Colors.SetSecondary(theTarget);
}

/*
	This function hides or displays various sections of the menu
	depending upon what the user clicked
*/

function menuCloseAll()
{
	//
	//	Go through and close all of the items
	//
	for (var i = 1; i <= 10; i++)
	{
		if (oScreenBuffer.Get('menu'+i))
		{
			oScreenBuffer.Get('menu'+i).style.display='none';
			oScreenBuffer.Get('menu'+i).style.height = "0";
		}
	}
}
function menuMove(e)
{
	var theTarget = e.target ? e.target : e.srcElement;

	var d = theTarget.id;
	var openMenu = false;
	
	/*
		If this menu item is already open then close it
	*/
	if(d)
	{
		/*
			Open the menu if the element type does not = block.
			This is for the user who opens a menu and then clicks it again
			to close it.
		*/
		if(oScreenBuffer.Get('menu'+d).style.display =='block')
		{
			openMenu = false;
		}
		else
		{
			openMenu = true;
		}
	}
	
	//
	//	Now open the one which is visible
	//
	if (openMenu)
	{
		menuOpen("menu" + d);
	}
	else
	{
		menuClose("menu" + d);
	}

	this.isOpen = openMenu;

}

var iMenuOpenTimer = 0;
var iMenuCloseTimer = 0;

//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function menuOpen(strMenuName)
{
	var element_menu = null;
	if(isString(strMenuName))
	{
		element_menu = oScreenBuffer.Get(strMenuName);
	}
	else
	{
		element_menu = strMenuName;
	}
	
	element_menu.isOpen = true;

	if(element_menu.style.display == 'none')
	{
		element_menu.style.display='block';
		element_menu.style.height = 0;
	}
	
	height = parseInt(element_menu.style.height);

	height = height + 25;
	menuId = element_menu.id;
	

	if(height < element_menu.menuCount * 22)
	{
		element_menu.style.height = height + "px";
   		clearTimeout(element_menu.timerId);
   		clearTimeout(element_menu.timerId);
		element_menu.timerId = setTimeout("menuOpen('" + menuId+ "')", 30);
		
	}
	else
	{
		element_menu.style.height = "";
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
function menuClose(strMenuName)
{
	if(isString(strMenuName))
	{
		var element_menu = oScreenBuffer.Get(strMenuName);
	}
	else
	{
		var element_menu = strMenuName;
	}
	
	if(!element_menu)
	{
		return;
	}
		
	height = parseInt(element_menu.offsetHeight);

	height = height - 25;
	menuId = element_menu.id;

	if(height > 0)
	{
		element_menu.style.height = height + "px";
   		
   		clearTimeout(element_menu.timerId);
   		clearTimeout(element_menu.timerId);
   		
   		if(menuId)
   		{
   			setTimeout("menuClose('" + menuId + "');", 30);
   		}
	}
	else
	{
		element_menu.style.display='none';
		element_menu.style.height = 0;
	}
}
/*
	This function takes the name of the item which has been clicked
	and sends it a request to navigate to it via the menu or navigate
	to the external link if a link has been set in menu.php
*/
function menuNavigate(e)
{
	var theTarget = e.target ? e.target : e.srcElement;

	if(theTarget.link.length > 0)
	{
		top.location.replace(theTarget.link);
	}
	else
	{
		oCatenaApp.navigate(theTarget.id);
	}
}