/*
	This file maintains the system listener object. With this object, 
	various system components may be monitored in case of changes
*/

function systemListener()
{
	this.listeners = new Object();
}
/*--------------------------------------------------------------------------
	-	description
			This function calls a listener object
	-	params
		listenerName
			The name of the listener to perform the callback on
	-	return
--------------------------------------------------------------------------*/
systemListener.prototype.call = function(listenerName)
{
	if(this.listeners.listenerName)
	{
		/*
			Location is the base of the URL string.
			It should be our only hardcoded value
		*/
		for(iListeners = 0; iListeners < this.listeners.listenerName.length; iListeners++)
		{
			this.listeners.listenerName[iListeners]();			
		}
	}
}
/*--------------------------------------------------------------------------
	-	description
			This function adds a listener object
	-	params
		listenerName
			The name of the listener to perform the callback on
		fnCallBack
			The function to call when this listener is triggered.
	-	return
--------------------------------------------------------------------------*/
systemListener.prototype.add = function(listenerName, fnCallBack)
{
	if(!this.listeners.listenerName)
	{
		/*
			Listener does not exist so we'll create a new list and
			add this element
		*/
		this.listeners.listenerName = new Array();
	}
	
	
	/*
		Attach the function to the listener
	*/
	
	count = this.listeners.listenerName.length;
	
	this.listeners.listenerName[count] = fnCallBack;
	
}

oSystemListener = new systemListener();