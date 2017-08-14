/*
	purpose:
		Displays the assigned rights for the logged in user.
*/

var strLogsURL = "/functions/logs";

var oSystem_Logs = new system_AppScreen();

oSystem_Logs.screen_Name = "system_Logs";			//	The name of the screen or page. Also the name of the XML data file
oSystem_Logs.screen_Menu ="View Logs";			//	The name of the menu item which corapsponds to this item
oSystem_Logs.module_Name = "framework";

var arLogLevel = new Array();

arLogLevel[5] = "Critical";
arLogLevel[10] = "Error";
arLogLevel[20] = "Security";
arLogLevel[25] = "Warning";
arLogLevel[50] = "Notice";
arLogLevel[75] = "Info";
arLogLevel[100] = "Debug";

/*--------------------------------------------------------------------------
	-	description  
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_Logs.custom_Show = function()
{
	this.RetrieveLogs();
	return true;
}
/*--------------------------------------------------------------------------
	-	description
			Loads the rights table, sets the submit functionality.
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_Logs.custom_Load = function()
{

	//	Create the results table
	this.oLogsTable = new system_SortTable();
	this.oLogsTable.setName("systemLogs_Table");

	arHeader = Array();
	arHeader[0] = Object();
		arHeader[0].text = "Log";
	arHeader[1] = Object();
		arHeader[1].text = "User";
	arHeader[2] = Object();
		arHeader[2].text = "Date";
		arHeader[2].dataType = "string";
	arHeader[3] = Object();
		arHeader[3].text = "Message";
		arHeader[3].dataType = "string";
	arHeader[4] = Object();
		arHeader[4].text = "Level";
		arHeader[4].dataType = "string";
	arHeader[5] = Object();
		arHeader[5].text = "System";
		arHeader[5].dataType = "string";
		
	this.oLogsTable.SetHeader(arHeader);
	this.oLogsTable.SetCaption("Logs");
	
	this.oLogsTable.pageLength = 10;
	
	this.oLogsTable.custom_element = display_logElement;

	return true;
}

function display_logElement(i)
{
	strLogMessage = "";
	
	var element_Row = appendChild(this.element_body, "TR");
	
	element_Row.align = "center";
	
	if(i % 2 == 1)
	{
		oSystem_Colors.SetSecondaryBackground(element_Row);
	}
	else
	{
		oSystem_Colors.SetTertiaryBackground(element_Row);
	}

	oSystem_Colors.SetPrimary(element_Row);

	var element_Col1 = appendChild(element_Row, "TD");
	
	element_Col1.appendChild(document.createTextNode(this.list[i].log_ID));

	var element_Col2 = appendChild(element_Row, "TD");
	
	element_Col2.appendChild(screen_CreateOrganizationLink(this.list[i].user_Name));

	var element_Col3 = appendChild(element_Row, "TD");
	element_Col3.appendChild(document.createTextNode(this.list[i].log_Date));

	var element_Col4 = appendChild(element_Row, "TD");
	element_Col4.align = "left";
	element_Col4.appendChild(document.createTextNode(this.list[i].log_Message));

	var element_Col5 = appendChild(element_Row, "TD");
	
	logLevel = this.list[i].log_Level;
	
	if(arLogLevel[logLevel])
	{
		strLogMessage = arLogLevel[logLevel];
	}
	else
	{
		strLogMessage = logLevel;
	}

	element_Col5.appendChild(document.createTextNode(strLogMessage));

	var element_Col6 = appendChild(element_Row, "TD");
	element_Col6.appendChild(document.createTextNode(this.list[i].system_Name));

}
/*--------------------------------------------------------------------------
	-	description
			Needed for the function call wrapper called in RetreiveRights
	-	params
	-	return
--------------------------------------------------------------------------*/
function ParseSystemLogs(strResults)
{
	oSystem_Logs.ParseLogs(strResults);
}
/*--------------------------------------------------------------------------
	-	description
		Process the results we receive back from the server
	-	params
	-	return
--------------------------------------------------------------------------*/
oSystem_Logs.ParseLogs = function(strResults)
{
	this.oLogsTable.SetList(strResults);
	this.oLogsTable.Display();
}
/*--------------------------------------------------------------------------
	-	description
			Filter Organizaton takes the value from the	organization
			field and filters the user names by that organization
	-	params
			userName
				the name of the user account being selected to have
				its rights assigned
	-	return
			none
--------------------------------------------------------------------------*/
oSystem_Logs.RetrieveLogs = function()
{
	this.serverValues = null;
	this.serverValues = new Object();
	
	this.serverValues.location = strLogsURL;
	this.serverValues.action = "logs";

	server.callASync(this.serverValues, ParseSystemLogs);
	this.oLogsTable.show();
}

oSystem_Logs.register();