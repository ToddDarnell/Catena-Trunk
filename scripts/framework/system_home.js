/*
	This functionality retrieves the system messages from the server ever ten minutes
*/
var strNoticesURL = "../functions/notices";

/*
	Updates getting notifications every ten minutes
*/
var iGetNotificationsTimeout = 600000;
/*
	Create a default notice
*/
function notice()
{
	this.title = "";
	this.details = "";
	this.date = "";
}
/*
	Displays, loads, and manages notifications
*/

var oNotifications = new system_AppScreen();

oNotifications.notices = new Array();
oNotifications.screen_Name = "home";
oNotifications.module_Name = "framework";

oNotifications.screen_Menu = "Home";
oNotifications.element_Notices= null;

oNotifications.custom_Load = function ()
{
	this.element_Notices = oScreenBuffer.Get("home_Notices");
	this.RetrieveMessages();
	return true;
}
/*
	Render displays all of the notifications
	it currently has loaded
*/
oNotifications.custom_Show = function () 
{
	/*
		Now begin rebuilding the children of this form
	*/
	RemoveChildren(this.element_Notices);

	var table = document.createElement("TABLE");
	var tBody = document.createElement("TBODY");
	
	table.appendChild(tBody);
	this.element_Notices.appendChild(table);

	table.border = "0";
	table.width = "600px";
	
	boxSettings =
	{
  		tl: { radius: 8 },
  		tr: { radius: 8 },
  		bl: { radius: 8 },
  		br: { radius: 8 },
  		antiAlias: true,
  		autoPad: false,
  		colorType:0
	}

	for(var iNotices=0; iNotices < this.notices.length; iNotices++)
	{
		//
		//	For the date and title
		//
		element_titleRow = document.createElement("TR");
		element_titleCol = document.createElement("TD");
		element_title = document.createElement("DIV");
		element_titleText = document.createElement("DIV");
		//
		//	For the details
		//
		var tr_details = document.createElement("TR");
		var td_details = document.createElement("TD");

		tBody.appendChild(element_titleRow);
		element_titleRow.appendChild(element_titleCol);
		element_titleCol.appendChild(element_title);
		element_title.appendChild(element_titleText);
		tr_details.appendChild(td_details);
		tBody.appendChild(tr_details);

		element_titleText.style.fontSize = "100%";
		element_titleText.style.fontWeight = "bold";
		element_titleText.style.paddingLeft = "10px";
		element_titleText.style.textAlign = "center";
		element_title.style.width = "600px";
		element_title.style.letterSpacing = "6pt";
					
		var cornersObj = new curvyCorners(boxSettings, element_title);
		cornersObj.applyCornersToAll();

		element_title.style.textTransform = "capitalize";
		
		oSystem_Colors.SetSecondary(element_title);
		oSystem_Colors.SetPrimaryBackground(element_title);
		
		element_titleText.appendChild(document.createTextNode(this.notices[iNotices].title));
		
		paragraphs = this.notices[iNotices].details.split(/\n/);
		
		if(paragraphs.length)
		{
			for(i = 0; i < paragraphs.length; i++)
			{
				element_detailsDiv = document.createElement("DIV");
				element_detailsDiv.style.paddingBottom = "8px";
				element_detailsDiv.appendChild(document.createTextNode(paragraphs[i]));
				td_details.appendChild(element_detailsDiv);
			}
		}

		oSystem_Colors.SetPrimary(tr_details);
		tr_details.style.fontFamily = "Arial";
		td_details.style.padding = "20px";
	}

	return true;
}
oNotifications.parseNotices = function (oXmlDom)
{
	var oRoot = oXmlDom.documentElement;		//	used as a short cut instead of typing the entire name
	var aNotice = oRoot.getElementsByTagName("notice");

	/*
		This appears to be the only way to clear an array. There's
		no explicit delete or clear functionalty for javascript
	*/
	this.notices = null;
	this.notices = new Array();

	for(var iNotice=0; iNotice < aNotice.length; iNotice++)
	{
		//
		//	First, we grab the title of the submenu
		//	and create that item
		//	then next we add all of the items to it
		//	if there are any
		var oCurrentChild = aNotice[iNotice].firstChild;
		
		this.notices[iNotice] = new notice();

		do
		{
			if(oCurrentChild.tagName != "")
			{
				this.notices[iNotice][oCurrentChild.tagName] = oCurrentChild.text;
			}
		} while (oCurrentChild = oCurrentChild.nextSibling);
	}
}
/*
	Retrieves the raw notification data from the server
	and passes it to parseNotices
*/
oNotifications.RetrieveMessages = function ()
{
	var serverValues = Object;
	var xmlObject;
	
	//
	//	Contact the server at location page,
	//	tell it what menu we want
	//	load the raw data into menuData
	//	pass it to the the loadXMLSync function
	//	which creates an XML object
	//	which then passes that XML object onto
	//	our parseMenu function which makes a menu
	//
	serverValues.location = strNoticesURL;
	serverValues.action = "getlist";
	
	xmlObject = server.CreateXMLSync(serverValues);
	this.parseNotices(xmlObject);

	if( oCatenaApp.getCurrentPage() == page_Home)
	{
		this.RenderPage();
	}
}

oNotifications.register();