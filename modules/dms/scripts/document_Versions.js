/*-----------------------------------------------------------------------------
	The purpose of this file is to display a list of all the versions 
	of a document.
-----------------------------------------------------------------------------*/
var strDocumentURL =  "/modules/dms/server/document";

var oDocumentVersionList = new system_list("docVersion_ID", "docVersion_Ver",  "getdocumentversions");

oDocumentVersionList.serverURL = strDocumentURL;
oDocumentVersionList.bSort = false;