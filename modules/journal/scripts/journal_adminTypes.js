/*
	This functionality manages Journal categories.
*/
var oJournalAdminType = new system_list("journalAdmin_Type", "jrnCat_Name", "journalcategory");

oJournalAdminType.load = function()
{
	this.clear();

	this.field_Value = "value";
	this.addElement(0, "Subject");
	this.addElement(1, "Poster");
	this.addElement(2, "Both");
	this.sort();
}