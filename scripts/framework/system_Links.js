/*
	This file maintains the system links system, which appears in the upper
	right hand corner of the screen. These links are available and usuable
	throughout the entire system.
*/
function systemLinks()
{
	/*
		We can use document to get acces to the short cut bar because
		it's available when the page is created
	*/
	this.element_ShortCutBar = document.getElementById("divShortCuts");
	
	this.linkList = Array();
	
	/*
		listCounter is NOT the total of all records
		but think of it has an auto counter when adding new 
		links to the system. It's the unique id returned
	*/
	this.listCounter = 14;
}

systemLinks.prototype.load = function()
{
	this.element_ShortCutBar = document.getElementById("divShortCuts");
}

systemLinks.prototype.add = function(linkArray)
{
	
	retId = this.listCounter;
	
	this.linkList[this.listCounter] = new Object();
	this.linkList[this.listCounter].fnCallback = linkArray.fnCallback;
	this.linkList[this.listCounter].text = linkArray.text;
	this.linkList[this.listCounter].color = linkArray.color;
	
	if(linkArray.title)
	{
		this.linkList[this.listCounter].title = linkArray.title;
	}
	else
	{
		this.linkList[this.listCounter].title = "";
	}
	
	this.listCounter++;
	
	return retId;
	
}
systemLinks.prototype.modify = function(linkArray)
{
	linkId = linkArray.id;
	
	this.linkList[linkId].fnCallback = linkArray.fnCallback;
	this.linkList[linkId].text = linkArray.text;
	this.linkList[linkId].color = linkArray.color;
}
/*
	This function shows the list of links available along the
	upper right hand corner
*/
systemLinks.prototype.show = function()
{
	/*
		-	clear the list
		-	display each element in the list
	*/
	this.element_ShortCutBar.innerHTML = "";
	
	for(counter in this.linkList)
	{
		linkText = this.linkList[counter].text;
		linkColor = this.linkList[counter].color;
		fnClick = this.linkList[counter].fnCallback;
		tooltip = this.linkList[counter].title;
		
		element_Link = document.createElement("SPAN");
		element_Link.className = "link";
		element_Link.onclick = fnClick;
		oSystem_Colors.SetElement(element_Link, linkColor);
		
		text =["", tooltip];
		
		SetToolTip(element_Link, text);
		
				
		element_Link.appendChild(document.createTextNode(linkText));
		this.element_ShortCutBar.appendChild(element_Link);
		
		/*
			Now add a spacer between the next link
		*/
		this.element_ShortCutBar.appendChild(document.createTextNode(" "));
	}
}

oSystemLinks = new systemLinks();