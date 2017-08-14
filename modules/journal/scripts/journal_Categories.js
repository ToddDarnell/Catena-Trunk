/*
	This functionality manages Journal categories.
*/
var strJournalURL = "../modules/journal/server/journal";

var oCategoryList = new system_list("jrnCat_ID", "jrnCat_Name", "journalcategory");
oCategoryList.serverURL = strJournalURL

