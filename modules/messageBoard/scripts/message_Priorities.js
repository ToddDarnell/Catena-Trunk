/*--------------------------------------------------------------------------
	This functionality manages user modifiable preferences.
----------------------------------------------------------------------------*/

var oPriorityList = new system_list("msgPri_ID", "msgPri_Name");

oPriorityList.load = function()
{
	this.clear();
	this.addElement(1, "Normal");
	this.addElement(2, "High");	
}
