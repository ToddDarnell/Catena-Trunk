/*
	Creates a table which may be sortable. Filters the rows.
	Provides a consistent interface.


	The header for a table looks like the following:
	
	arHeader = Array();
	
	//	This is the first element
	arHeader[0] = Object();
		arHeader[0].text = "Right";				//	required - The title of the header column
		arHeader[0].sort = true;				//	optional - whether the column may be sorted.
		arHeader[0].dataType = "string";		//	The data type to use for the sort.
												//		may be one of the following:
												//			string
												//			date
												//			number
												
		arHeader[0].fieldName = "right_Name";	//	The field name in the array of data elements.
		arHeader[0].tip = "The assigned right";	//	A tool tip which hovers over the title text
		arHeader[0].width = "70%";				//	The width of the column in the table
												//	The second element, etc...
	arHeader[1] = Object();
		arHeader[1].text = "Organization";
		arHeader[1].dataType = "string";
		arHeader[1].tip = "Example";
*/
function system_SortTable()
{
	this.element_table = null;
	this.element_body = null;
	this.strCaption = "";
	this.pageLength = 0;		//	page length defines how many elements are
								//	diplayed on a page. Set to 0, no limit
								//	is set and all elements are displayed
								
	this.page = 0;
	
	this.arHeader = null;
	this.list = null;
	this.clear();
  	this.strNoResultsMessage = "No results found.";
  	this.showTableSize = true;		//	States that the size of the results be appended to the caption
  	this.loadingList = false;		//	keeps track of whether this list is in the middle of being
  									//	loaded
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_SortTable.prototype.load = function()
{
	this.clear();
	
	this.loadingList = true;

    this.Display();
	
	if(this.custom_load)
	{
		this.custom_load();
	}
}
/*
	This function adds an element to the list individually.
*/
system_SortTable.prototype.addElement = function(newElement)
{

	if(!this.list)
	{
		this.list = Array();
	}
	
	listSize = this.size();
	
	this.list[listSize] = newElement;
}
/*
	Removes an element from the list of items
	-	position
			The position of the element in the list
*/
system_SortTable.prototype.removeElement = function(position)
{
	if(this.list)
	{
		this.list.splice(position, 1);
	}
}
/*
	-	returns the size of the sort table list
*/
system_SortTable.prototype.size = function()
{
	if(this.list)
	{
		return this.list.length;
	}
	
	return 0;	
}
/*
	-	Set the table for this sort table
	-	table is the onscreen element. This is
		the text name of the element
*/
system_SortTable.prototype.setName = function(strTable)
{
	this.element_table = oScreenBuffer.Get(strTable);
    oSystem_Colors.SetPrimary(this.element_table);
    
}
/*
	Set No results found message
*/
system_SortTable.prototype.SetNoResultsMessage = function(strMessage)
{
	this.strNoResultsMessage = strMessage;
}
/*
	Set the Caption
*/
system_SortTable.prototype.SetCaption = function(strCaption)
{
	this.strCaption = strCaption;
}
/*
	Set the header
*/
system_SortTable.prototype.SetHeader = function(arHeader)
{
	this.arHeader = arHeader;
}
/*
	Hide the table
*/
system_SortTable.prototype.hide = function()
{
	HideElement(this.element_table);
}
/*
	Show the table
*/
system_SortTable.prototype.show = function()
{
	ShowInheritElement(this.element_table);
}
/*
	Clears the header.
	Clears the table body.
*/
system_SortTable.prototype.clear = function()
{
	RemoveChildren(this.element_table);
	this.list = null;
}
/*
	Sets the list object
*/
system_SortTable.prototype.SetList = function(strResults)
{
	this.loadingList = false;
	var xmlObject;
	xmlObject = server.CreateXML(strResults);
	this.list = null;
	this.list = this.ParseXML(xmlObject,  "element");

	this.page = 0;
	this.pageMax = 0;
	
	if(this.list)
	{
		this.pageMax = Math.round(this.list.length / this.pageLength);
		
		pageSize = this.list.length / this.pageLength;
		
		if(pageSize > this.pageMax)
		{
			this.pageMax = this.pageMax + 1;
		}
	}
	
}
/*
	Parse the XML data. To change the way the list
	parses the XML, override this function.
	
	-	return
		The xml data formated in a javascript
		array
*/
system_SortTable.prototype.ParseXML = function( xmlObject)
{
	return ParseXML(xmlObject,  "element");
}
/*
	Empty Display results
*/
system_SortTable.prototype.Display = function ()
{
	this.element_body = document.createElement("TBODY");
	
	if(this.list)
	{
	    if(this.list.length)
	    {
	    	if(this.custom_element)
	    	{
	    		if(this.pageLength > 0)
	    		{
		    		/*
			    		Start element is the page times the page size
			    	*/
			    	iCounter = this.page * this.pageLength;
			    	iTotal = iCounter + this.pageLength;
		    	
			    	while((iCounter < iTotal) && (iCounter < this.list.length))
			    	{
		    			this.custom_element(iCounter);
			    		iCounter++;
			    	}
			    }
			    else
			    {
			    	for(iCounter = 0; iCounter < this.list.length; iCounter++)
			    	{
		    			this.custom_element(iCounter);
			    	}
				}
		    }
		    else if(this.custom_display)
		    {
		    	this.custom_display();
		    }
		    else
		    {
		    	oSystem_Debug.error("No element display listed in sort table");
		    }
	    }
	    else
	    {
	        this.DisplayNoResults();
	    }
	}
	else
	{
		this.DisplayNoResults();
	}

	RemoveChildren(this.element_table);

	this.element_table.appendChild(this.element_body);
	
	this.ShowHeader();
	this.ShowFooter();
	this.ShowCaption();
	
	
}
/*--------------------------------------------------------------------------
    Fill out the custom display when no results are found
----------------------------------------------------------------------------*/
system_SortTable.prototype.DisplayNoResults = function ()  
{

	if(this.loadingList == true)
	{
		strMessage = "Loading...";
	}
	else
	{
		strMessage = this.strNoResultsMessage;
	}
	
    var element_Row = document.createElement("TR");
    this.element_body.appendChild(element_Row);

    element_Column = document.createElement("TD");
    element_Column.colSpan=6;
    element_Column.innerHTML = strMessage;
    element_Column.style.paddingTop = "10px";
    element_Row.appendChild(element_Column);
}
/*
	Display the table caption
*/
system_SortTable.prototype.ShowCaption = function ()	
{
	if(this.custom_caption)
	{
		this.custom_caption();
	}
	/*
		Display table Caption above the table being displayed
		if the user defined call back function is set,
		then call it so the derived class can display its
		results
	*/
	if(this.strCaption.length)
	{
		strDisplay = this.strCaption;
		
		if(this.showTableSize == true)
		{
			if(this.list)
			{
				strDisplay = strDisplay + " (" + this.list.length + ")";
			}
			else
			{
				strDisplay = strDisplay + " (0)";
			}
		}
		AppendCaption(this.element_table, strDisplay);
	}
}
/*
	Display the table caption
*/
system_SortTable.prototype.ShowFooter = function ()	
{
	if(this.pageLength < 1)
	{
		return true;
	}
	
	if(this.pageMax < 2)
	{
		return true;
	}
	
	if(this.custom_footer)
	{
		this.custom_footer();
	}
	/*
		Display table Caption above the table being displayed
		if the user defined call back function is set,
		then call it so the derived class can display its
		results
	*/
	
	//strPage = "Page " + (this.page + 1) + " of " + this.pageMax;
	
	var element_footer = document.createElement("TFOOT");
	oSystem_Colors.SetPrimary(element_footer);
	
	var element_row =  document.createElement("TR");
	var element_col =  document.createElement("TD");
	
	element_row.appendChild(element_col);
	element_footer.appendChild(element_row);

	element_col.style.textAlign = "center";
	element_col.style.border = "1px solid";
	element_col.width = "100%";
	element_col.colSpan = 10;
	element_col.style.margin = "10px";
		
	if(this.page > 0)
	{
		element_FirstLink = document.createElement("SPAN");
		element_FirstLink.title = "Select first page";
		element_FirstLink.appendChild(document.createTextNode("First"));
		element_FirstLink.className = "link";
		element_FirstLink.sortList = this;
		element_FirstLink.style.paddingRight = "10px";
		element_FirstLink.pageNum = 0;
		
		element_FirstLink.onclick = function()
		{
			this.sortList.ChangePage(this.pageNum);
			this.sortList.Display();
		}
		element_col.appendChild(element_FirstLink);

		
		element_PrevLink = document.createElement("SPAN");
		element_PrevLink.appendChild(document.createTextNode("Prev"));
		element_PrevLink.title = "Select previous page";
		element_PrevLink.className = "link";
		element_col.appendChild(element_PrevLink);
		element_PrevLink.sortList = this;
		element_PrevLink.style.paddingRight = "10px";

		element_PrevLink.onclick = function()
		{
			this.sortList.DecreasePage();
		}
	}
	
	/*
		Do the five pages previous to the current one
	*/
	
	iCounterPage = this.page - 5;
	
	while(iCounterPage < this.page + 5)
	{
		if(iCounterPage > -1)
		{
			if(iCounterPage < this.pageMax)
			{
				element_PageLink = document.createElement("SPAN");
				element_PageLink.appendChild(document.createTextNode(iCounterPage + 1));
				element_PageLink.className = "link";
				
				if(iCounterPage == this.page)
				{
					element_PageLink.style.fontWeight = "bold";
				}
				element_PageLink.sortList = this;
				element_PageLink.pageNum = iCounterPage;
				element_PageLink.style.paddingRight = "10px";
		
				element_PageLink.onclick = function()
				{
					this.sortList.ChangePage(this.pageNum);
					this.sortList.Display();
				}
	
				element_col.appendChild(element_PageLink);
			}
		}
		iCounterPage++;
	}


	/*
		Make sure there's another page
	*/
	if(this.page < (this.pageMax - 1))
	{
		element_NextLink = document.createElement("SPAN");
		element_NextLink.title = "Select next page";
		element_NextLink.appendChild(document.createTextNode("Next"));
		element_NextLink.className = "link";
		element_NextLink.style.paddingRight = "10px";
		element_col.appendChild(element_NextLink);
		element_NextLink.sortList = this;
		
		element_NextLink.onclick = function()
		{
			this.sortList.IncreasePage();
		}

		element_LastLink = document.createElement("SPAN");
		element_LastLink.title = "Select last page";
		element_LastLink.appendChild(document.createTextNode("Last"));
		element_LastLink.className = "link";
		element_LastLink.sortList = this;
		element_LastLink.pageNum = this.pageMax - 1;
		
		element_LastLink.onclick = function()
		{
			this.sortList.ChangePage(this.pageNum);
			this.sortList.Display();
		}
		element_col.appendChild(element_LastLink);
	}

	this.element_table.appendChild(element_footer);
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_SortTable.prototype.IncreasePage = function ()
{
	newPage = this.page + 1;

	if(newPage < this.pageMax)
	{
		this.ChangePage(newPage);
		this.Display();
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_SortTable.prototype.DecreasePage = function ()
{
	newPage = this.page - 1;

	if(newPage > -1)
	{
		this.ChangePage(newPage);
		this.Display();
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_SortTable.prototype.ChangePage = function (newPage)
{
	if(newPage > -1)
	{
		if(newPage < this.pageMax)
		{
			this.page = newPage;
			
			if(this.custom_onchange)
			{
				this.custom_onchange();
			}
		}
	}
}
/*
	Display the table header
*/
system_SortTable.prototype.ShowHeader = function ()	
{
	if(!this.arHeader)
	{
		return true;
	}
	
	if(!this.element_table)
	{
		return false;
	}
	
	element_Header = document.createElement("THEAD");
	var undefined;
	this.element_table.appendChild(element_Header);

	oRow = document.createElement("TR");
	element_Header.appendChild(oRow);
	
	oSystem_Colors.SetSecondary(element_Header);
	oSystem_Colors.SetPrimaryBackground(element_Header);

	for(var i = 0; i < this.arHeader.length; i++)
	{
 		oCell = document.createElement("TH");
		screen_SetTextElement(oCell, this.arHeader[i].text);
		
		if(this.arHeader[i].tip)
		{
			oCell.title = this.arHeader[i].tip;
		}

		if(this.arHeader[i].width)
		{
			oCell.style.width = this.arHeader[i]['width'];
		}
		
		if(this.arHeader[i].sort)
		{
			if(this.arHeader[i].sort == true)
			{
				oCell.className = "link";
				oCell.oParent = this;
				oCell.cellDescripter = this.arHeader[i];
		
				oCell.onclick = function()
				{
					this.cellDescripter.sortType = this.oParent.headerClick(this.cellDescripter);
				}
			}
		}
		oRow.appendChild(oCell);
	}
}
/*
	headerClick
	Click header is called when a user clicks a link name in the header.
	-	cellDescripter
		Contains the details about the cell.
			-	title
				The string title of the field
			-	sort
				true/false
				whether the field is sortable
			-	dataType
				What kind of data this should be sorted for
				-	string
				-	number
				-	date
*/
system_SortTable.prototype.headerClick = function (cell)
{
	/*
		-	retrieve the sort function based upon
			the datatype of the callDescripter
	*/
	
	var fnSort = getSortFunction(cell.dataType);
	
	sortType = 0;

	if(cell.sortType || cell.sortType == 0)
	{
		sortType = cell.sortType == 1 ? 0 : 1;
	}

	sort(this.list, fnSort, cell.fieldName, sortType);
	/*
		Redisplay everything
	*/
	this.Display();
	
	return sortType;
}
/*
	a hacked bubble sort
*/
function sort(list, fnSort, fieldName, sortOrder)
{
	if(fnSort == null)
	{
		return false;
	}
	if(!list)
	{
		return false;
	}
		
	len = list.length;

	if(sortOrder == 0)
	{
			
		for (i = 0; i < len - 1; i++)
		{
			for(j = 0; j < len - 1 - i; j++)
			{
				iCompare = fnSort(list[j + 1][fieldName], list[j][fieldName]);
				
				//	-1	left is of higher value
				//	0	same
				//	1	right is of higher value
				
				if (iCompare > 0)
	    		{
	    			tmp = list[j];
	      			list[j] = list[j+1];
	      			list[j+1] = tmp;
	      		}
	      	}
		}
	}

	if(sortOrder == 1)
  	{
  		list.reverse();
  	}
}
function getSortFunction (dataType)
{
	switch(dataType)
	{
		case "string":
			return sortString;
		case "number":
			return sortNumber;
		case "date":
			return sortDate;
	}
	
	return null;
}
/*
	Compares two string values
*/
function sortString(value1, value2)
{
	val1 = "";
	val2 = "";
	
	if(value1)
	{
		val1 = value1.toLowerCase();
	}
	
	if(value2)
	{
		val2 = value2.toLowerCase();
	}
	
	if(val1 > val2)
	{
		return -1;
	}
	if(val1 < val2)
	{
		return 1;
	}

	return 0;
	
}
function sortNumber(value1, value2)
{
	val1 = parseInt(value1);
	val2 = parseInt(value2);
	
	if(val1 > val2)
	{
		return -1;
	}
	if(val1 < val2)
	{
		return 1;
	}

	return 0;
}
/*
	sortDate needs to be fixed to properly sort dates.
	The assumption at this point is that the dates
	look like this:
	YYYY-MM-DD which makes doing a string compare easy
*/
function sortDate(value1, value2)
{
	return sortString(value1, value2);
}
