/*
	The purpose of this file is to manage all calls to the server and their responses
	This is the server call object
*/

function system_server()
{
}

system_server.statusText = "";			//	text version of status/error conditions/etc
system_server.statusData = new Array();	//	This list keeps track of website values
										//	version,
										//	database status, etc
//--------------------------------------------------------------------------
/**
	\brief
		GetStatus
		Queries the website for useful information such
		as the site verison,
		database status, etc
	\param
	\return
*/
//--------------------------------------------------------------------------
system_server.prototype.getStatus = function()
{
	var serverValues = Object();
	var xmlObject;

	serverValues.location = "../functions/ping";

	xmlObject = this.CreateXMLSync(serverValues);
	this.statusData = ParseXML(xmlObject, "serverStatus", Object);
	
	if(this.statusData.length != 1)
	{
		/*
			We should have one element which represents the
			server data. If we don't have that, then we
			have a site connection error
		*/
		return false;
	};
	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
		This function verifies we can make a connection to the server.
	\param
	\return
*/
//--------------------------------------------------------------------------
system_server.prototype.load = function()
{
	if(!this.getStatus())
	{
		this.statusText = "Unable to retrieve site status.";
		return false;
	}
			
	if(this.statusData[0].siteVersion != global_siteVersion)
	{
		this.statusText = "Client site does not match server. Please refresh the site.";
		return false;
	}
	
	if(this.statusData[0].database != "online")
	{
		this.statusText = this.statusData[0].database;
		return false;
	}
	
	this.statusText = "Server connection valid.";
		
	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
		This function calls the server with the passed in values
		synchronously.
	\param aParams
		an associative array holding all our values
		which will be sent to the server
	\return
*/
//--------------------------------------------------------------------------
system_server.prototype.callASync = function(aParams, fnReturn)
{
	//	The params which are being passed onto the server
	//	strURL is the location file we're calling
	
	var strURL = this.buildURL(aParams);

	var oXmlHttp = zXmlHttp.createRequest();
	oXmlHttp.open("get", strURL, true);
	oXmlHttp.onreadystatechange = function()
	{
		if(oXmlHttp.readyState == 4)
		{
			if(oXmlHttp.status == 200)
			{
				/*
					Call the function the user passed in
				*/
				if(fnReturn)
				{
					return fnReturn(oXmlHttp.responseText);
				}
				alert("server.callASync : Invalid function reference. Data: " + oXmlHttp.responseText);
				return false;
			}
		}
	}

	oXmlHttp.send(null);
	return null;
}
//--------------------------------------------------------------------------
/**
	\brief
		This function calls the server with the passed in values
		synchronously.
	\param aParams
		an associative array holding all our values
		which will be sent to the server
	\return
*/
//--------------------------------------------------------------------------
system_server.prototype.callASyncObject = function(aParams, oCallBack)
{
	//	The params which are being passed onto the server
	//	strURL is the location file we're calling
	
	var strURL = this.buildURL(aParams);

	var oXmlHttp = zXmlHttp.createRequest();
	oXmlHttp.open("get", strURL, true);
	oXmlHttp.onreadystatechange = function()
	{
		if(oXmlHttp.readyState == 4)
		{
			if(oXmlHttp.status == 200)
			{
				/*
					Call the function the user passed in
				*/
				if(oCallBack)
				{
					return oCallBack.Parse(oXmlHttp.responseText);
				}
				alert("server.callASync : Invalid function reference. Data: " + oXmlHttp.responseText);
				return false;
			}
		}
	}

	oXmlHttp.send(null);
	return null;
}
//--------------------------------------------------------------------------
/**
	\brief
		This function calls the server with the passed in values
		synchronously.
	\param aParams
		An associative array holding all our values
		which will be sent to the server
	\return
*/
//--------------------------------------------------------------------------
system_server.prototype.callSync = function(aParams)
{
	var strURL = this.buildURL(aParams);
	
	var oXmlHttp = zXmlHttp.createRequest();
	oXmlHttp.open("POST", strURL, false);
	oXmlHttp.send(null);
	
	switch(oXmlHttp.status)
	{
		case 404:
			alert("URL does not exist: " + strURL);
			break;
		case 414:
			alert("URL text is too long. Size is: " + strURL.length);
			break;
		case 200:
			/*
				Call the function the user passed in
			*/
			return oXmlHttp.responseText;
		default:
			alert("Bad status returned: " + oXmlHttp.status);
			break;
	}
	
	return null;
}
//--------------------------------------------------------------------------
/**
	\brief
		This function takes a text block of XML and turns it into
		a formatted XML object
		-	aParams
				an associative array holding all our values
				which will be sent to the server
		return:
			returns the XML object which is created from the data gathered from the server
			or returns null if there was an error
	\return
*/
//--------------------------------------------------------------------------
system_server.prototype.CreateXMLSync = function(aParams)
{
	var strXML = this.callSync(aParams);
	
	if(!strXML)
	{
		return null;
	}

	var oXmlDom = zXmlDom.createDocument();
	oXmlDom.loadXML(strXML);

	if (oXmlDom.parseError.errorCode == 0)
	{
		return oXmlDom;
	}
	else
	{
		var str = "An error occurred!\n" +
			"Description: " + oXmlDom.parseError.reason + "\n" +
			"File: " + oXmlDom.parseError.url + "\n" +
			"Line: " + oXmlDom.parseError.line + "\n" +
			"Line Position: " + oXmlDom.parseError.linepos + "\n" +
			"Source Code: " + oXmlDom.parseError.srcText;
		alert(str);
	}
	return null;
}
//--------------------------------------------------------------------------
/**
	\brief
		This function takes a text block of XML and turns it into
		a formatted XML object
		-	aParams
				an associative array holding all our values
				which will be sent to the server
		-	elementFilter
				The XML element we're building the list from
		return:
			returns the XML object which is created from the data gathered from the server
			or returns null if there was an error
	\param
	\return
*/
//--------------------------------------------------------------------------
system_server.prototype.CreateListSync = function(aParams, elementFilter)
{
		oXML = this.CreateXMLSync(aParams);
		
		if(oXML)
		{
			return ParseXML(oXML,  elementFilter, Object);
		}
		return null;
}
//--------------------------------------------------------------------------
/**
	\brief
		Loads an XML file synchronously.
		Returns an XML object for the user to manipulate
	\return
*/
//--------------------------------------------------------------------------
system_server.prototype.loadXMLSync = function(strURL)
{
	var oXmlDom = zXmlDom.createDocument();
	
	oXmlDom.async = false;
	oXmlDom.load(strURL);
	
	if (oXmlDom.parseError.errorCode != 0)
	{
		var str = "An error occurred!\n" +
			"Description: " + oXmlDom.parseError.reason + "\n" +
			"File: " + oXmlDom.parseError.url + "\n" +
			"Line: " + oXmlDom.parseError.line + "\n" +
			"Line Position: " + oXmlDom.parseError.linepos + "\n" +
			"Source Code: " + oXmlDom.parseError.srcText;
		
		alert(str);
		return null;
	}
	return oXmlDom;
}
/*
		This function takes a text block of XML and turns it into
		a formatted XML object
		-	strXML
				The xml text to be loaded into the xml document
		return:
			returns the XML object which is created from the data gathered from the server
			or returns null if there was an error
*/
system_server.prototype.CreateXML = function(strXML)
{
	if(!strXML)
	{
		return null;
	}

	var oXmlDom = zXmlDom.createDocument();
	oXmlDom.loadXML(strXML);

	if (oXmlDom.parseError.errorCode == 0)
	{
		return oXmlDom;
	}
	else
	{
		var str = "An error occurred!\n" +
			"Description: " + oXmlDom.parseError.reason + "\n" +
			"File: " + oXmlDom.parseError.url + "\n" +
			"Line: " + oXmlDom.parseError.line + "\n" +
			"Line Position: " + oXmlDom.parseError.linepos + "\n" +
			"Source Code: " + oXmlDom.parseError.srcText;
		alert(str);
	}
	return null;
}
//--------------------------------------------------------------------------
/**
	\brief
		Builds the URL which we'll request from the server.
	\param
	\return
*/
//--------------------------------------------------------------------------
system_server.prototype.buildURL = function(aParams)
{
	//	The params which are being passed onto the server
	//	strURL is the location file we're calling
	var strParams;
	var strURL;
	
	strURL = "";
	strParams = "";
	/*
		Cycle through our list of values and send them to the server
	*/
	for (var i in aParams)
	{
		/*
			Location is the base of the URL string.
			It should be our only hardcoded value
		*/
		if (i == 'location')
		{
			/*
				Make the url match was is held in the location parameter
			*/
			strURL = aParams[i] + ".php?";
		}
		else
		{
			strParams += i + "=" + encodeURIComponent(aParams[i]) + "&";
		}
	}

	strURL += strParams;
	
	return strURL;
}


var server = new system_server();