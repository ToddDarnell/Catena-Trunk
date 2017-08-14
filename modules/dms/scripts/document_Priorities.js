/*--------------------------------------------------------------------------
	This functionality manages user modifiable preferences.
----------------------------------------------------------------------------*/

var oDocPriorityList = new system_list("dcrPriority_ID", "dcrPriority_Name");

oDocPriorityList.load = function()
{
	this.clear();
	this.addElement(1, "None");
	this.addElement(2, "Immediate");	
	this.addElement(3, "High");
	this.addElement(4, "Normal");
	this.addElement(5, "Low");
}
