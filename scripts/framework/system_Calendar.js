/*
	\page System Calendar
		The system calendar object is used for adding a calendar to a screen.
		Several steps are involved in creating a screen calendar.
		The first involves adding the xml data to the screen page.
		The second part is the javascript object and how to implement it.
				
		XML
		
		The following is an example of adding a screen element to a page.
		
		<calendar>
			<left>10</left>
			<top>10</top>
			<id>MyCalendar</id>
			<required>true</required>
		</calendar>

		The tags explained:
			left - required
				value	- must be greater than -1
				The left position of the calendar relative to the calendar's parent object
			top - required
				value	- must be greater than -1
				The top position of the calendar relative to the calendar's parent.
			id - required
				value - must be a string variable
				The name of the calendar. This element is essential.
			required - optional
				The required tag enables/disables the blank month option
				which will set an empty date if requested.
				If used, the required tag must be one of the following values:
					true
					false
			
	class for creating and manipulating an onscreen calendar element.
*/
var oSystemMonthsList = new system_list("month_ID", "month_Name",  "systemMonth");

oSystemMonthsList.load = function()
{
	oSystem_Debug.error("Loading System Month List");

	this.clear();
	this.addElement(1, "January");
	this.addElement(2, "February");
	this.addElement(3, "March");
	this.addElement(4, "April");
	this.addElement(5, "May");
	this.addElement(6, "June");
	this.addElement(7, "July");
	this.addElement(8, "August");
	this.addElement(9, "September");
	this.addElement(10, "October");
	this.addElement(11, "November");
	this.addElement(12, "December");
}

oSystemMonthsList.load();

/*
	Fills the control with the requested months number of days
*/
oSystemMonthsList.fillControlDays = function(element_date, iMonth, iSelectDay, iYear)
{
	var MonthDays = new Array(0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31);

	if(IsLeapYear(iYear))
	{
		MonthDays[2] = 29;
	}

	/*
		Get rid of all of the children of this element
		Then create a blank option and add it to the list first
	*/
	if (isString(element_date))
	{
		element_date = oScreenBuffer.Get(element_date);
	}
	
	if(!element_date)
	{
		alert("Control " + element_date + " not found in fill control.");
		return;
	}
	
	RemoveChildren(element_date);

	var listOption;

	//
	//	Now build the list with the existing organizations
	//

	for(var iDay = 1; iDay < MonthDays[parseInt(iMonth)] + 1; iDay++)
	{
		listOption = document.createElement("OPTION");
        listOption.value = iDay;
		listOption.innerHTML = iDay;
		/*
			Set to true if the element matches the position passed in
			The default is false so we don't change it if the positions don't match
		*/
		if(iDay == iSelectDay)
		{
			listOption.selected = true;
		}
				
		element_date.appendChild(listOption);
	}
}

/*
	The system calendar class
*/
function system_Calendar()
{
	this.dateFormat = 'MM/DD/YYYY'; // If no date format is supplied, this will be used instead
	this.strCalendarImageURL = "../image/calendar.jpg";
	this.startYear = 0;				//	Default to zero to use current year
	this.yearCount = 5;				//	The number of elements to display in the year list from start year
	
	
}
/*
	Builds a user selection screen.
	-	oDataElement is the raw xml which describes the characteristics
	of this user selection
	-	element_Parent
		The parent element we're going to attach to.
	-	return
		true if the element was loaded properly
		false if the element did not load properly.
*/
system_Calendar.prototype.build = function(element_Parent, oDataElement)
{
	var tagName = "";
	var text = "";
	var startYear = 0;

	/*
		The three field values are what we need to load and display the user
		Selection on the parent element
	*/

	field_Top = -1;
	field_Left = -1;
	field_Id = -1;
	required = false;

	/*
		We care about the following bits of information:
		-	The top field
		-	the left field
		-	the id of the element
	*/

	for(var iChildren = 0; iChildren < oDataElement.childNodes.length; iChildren++)
	{
		tagName = oDataElement.childNodes[iChildren].tagName;

		if(tagName)
		{
			text = oDataElement.childNodes[iChildren].text;

			switch(tagName)
			{
				case "top":
					field_Top = text;
					break;
				case "left":
					field_Left = text;
					break;
				case "id":
					field_Id = text;
					break;
				case "required":
					required = (text == 'true') ? true : false;
					break;
			}
		}
	}
	
	/*
		Now build the screen elements
		1.	the text which says "User Filter"
		2.	the drop down list for organizations
		3.	the drop down list for user names
		4.	the text field for the name selected

		-	Build the ids of the elemements so they're unique to the system

		-	The user filter text box is the upper left hand corner element.
		Everything else is built off of that.
		-	We don't give the text element an id, but we do for the others
			because we will be modifying them.

	*/
	
	if(!isString(field_Id))
	{
		alert("Invalid-missing id tag in calendar object" + field_Id);
		return false;
	}

	strMonthSelect = "system_Calendar_Month_" + field_Id;
	strDaySelect = "system_Calendar_Day_" + field_Id;
	strYearInput = "system_Calendar_Year_" + field_Id;
	strCalendarLinkId = "system_Calendar_Link_" + field_Id;
	strCalendarBoxId = "system_Calendar_Box_" + field_Id;

	pos_Top = parseInt(field_Top);
	pos_Left = parseInt(field_Left);

	/*
		The calendar element has several components to it.
		The first element is the div element which everything else is anchored to.
	*/

	element_anchor = document.createElement("DIV");
	element_anchor.style.left = pos_Left + "px";
	element_anchor.style.top = pos_Top + "px";
	element_anchor.style.position = "absolute";


	element_Table = document.createElement("TABLE");
	element_anchor.appendChild(element_Table);
	element_Body = AppendBody(element_Table);

	element_Row = document.createElement("TR");
	element_Body.appendChild(element_Row);

	element_MonthCol = document.createElement("TD");
	element_Row.appendChild(element_MonthCol);

	element_DayCol = document.createElement("TD");
	element_Row.appendChild(element_DayCol);

	element_YearCol = document.createElement("TD");
	element_Row.appendChild(element_YearCol);

	element_ImageCol = document.createElement("TD");
	element_Row.appendChild(element_ImageCol);

	element_Month = document.createElement("SELECT");
	element_Month.id = strMonthSelect;
	element_Month.calendar_Required = required;
	element_MonthCol.appendChild(element_Month);

	element_Day = document.createElement("SELECT");
	element_Day.id = strDaySelect;
	
	if(!required)
	{
        HideElement(element_Day);
	}
	else
	{
		ShowInheritElement(element_Day);
	}
	
	element_DayCol.appendChild(element_Day);

	element_Year = document.createElement("SELECT");
	element_Year.id = strYearInput;

	if(!required)
	{
        HideElement(element_Year);
	}
	else
	{
		ShowInheritElement(element_Year);
	}
	
	element_YearCol.appendChild(element_Year);

	/*
		Build the link which anchors the image
	*/

	element_CalendarLink = document.createElement("SPAN");
	element_CalendarLink.id = strCalendarLinkId;
	element_CalendarLink.className = "link";
	element_CalendarLink.title = "Calendar";
	element_CalendarLink.style.vAlign="top";
	element_ImageCol.appendChild(element_CalendarLink);

	if(!required)
	{
        HideElement(element_CalendarLink);
	}
	else
	{
		ShowInheritElement(element_CalendarLink);
	}
	
	element_ImageCol.appendChild(element_CalendarLink);
	element_CalendarImage = document.createElement("IMG");
	element_CalendarImage.src = this.strCalendarImageURL;
	
	/*
		We can fill this element now because the months won't change.
	*/
	oSystemMonthsList.fillControl(element_Month, !required);

	/*
		Fill the year element with the current year and the following year
	*/
	if(this.startYear == 0)
	{
		yearDate = new Date();
		startYear = yearDate.getFullYear();
		yearDate = null;
	}
	else
	{
		startYear = this.startYear;
	}

	for(i = startYear; i < (startYear + this.yearCount); i++)
	{
        AddListOption(element_Year, i, i);
	}
    
	element_Parent.appendChild(element_anchor);
	
	return true;
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_Calendar.prototype.setYearList = function(startYear, yearCount)
{
	this.startYear = startYear;
	
	if(yearCount > 0)
	{
		this.yearCount = yearCount;
	}
	else
	{
		this.yearCount = 5;
	}

	if(startYear == 0)
	{
		yearDate = new Date();
		startYear = yearDate.getFullYear();
		yearDate = null;
	}

	RemoveChildren(this.element_YearSelect);

	for(i = startYear; i < (startYear + this.yearCount); i++)
	{
        AddListOption(this.element_YearSelect, i, i);
	}
}
/*
	setMonth sets the month once the month select object has changed
*/
system_Calendar.prototype.onMonthChange = function(element)
{
	if(element.value == "")
	{
		/*
			Hide everything
		*/
		HideElement(this.element_DaySelect);
		HideElement(this.element_YearSelect);
		HideElement(this.element_CalendarLink);
	}
	else
	{
		ShowInheritElement(this.element_DaySelect);
		ShowInheritElement(this.element_YearSelect);
		ShowInheritElement(this.element_CalendarLink);
		
		iYear = this.element_YearSelect.value;
		
		oSystemMonthsList.fillControlDays(this.element_DaySelect, oSystemMonthsList.getId(element.value), -1, iYear);
	
	}
}
/*
	clear resets the calendar fields back to today's date or clear if the
	field is not required.
*/
system_Calendar.prototype.reset = function()
{
	resetDate = new Date();

	if(this.element_MonthSelect.calendar_Required)
	{
		this.element_MonthSelect.value = oSystemMonthsList.getName(resetDate.getMonth());
		this.element_DaySelect.value = resetDate.getDate();
		this.element_YearSelect.value = resetDate.getFullYear();
		ShowInheritElement(this.element_DaySelect);
		ShowInheritElement(this.element_YearSelect);
		ShowInheritElement(this.element_CalendarLink);
	}
	else
	{
		this.element_MonthSelect.value = "";
		this.element_DaySelect.value = 1;
		this.element_YearSelect.value = resetDate.getFullYear();
	
		HideElement(this.element_DaySelect);
		HideElement(this.element_YearSelect);
		HideElement(this.element_CalendarLink);
	}
}
//--------------------------------------------------------------------------
/**
	\brief	Set the calendar date fields.
	\param oDate May be a string date or a date object
			strings must be in the following format: YYYY-MM-DD
	\param
	\return
*/
//--------------------------------------------------------------------------
system_Calendar.prototype.setDate = function(oDate)
{
	strDate = "1-1-1008";

	if(!this.isValid())
	{
		alert("Trying to set calendar date before calendar is loaded.");
		return false;
	}
	/*
		-	validate the string.
		-	Make sure we have a valid set of screen elements
		-	split the string into three fields based off
			the seperation character
		- 	convert the month number to a text month
		-	change the days of the month
		-	put the values into the fields
		-	Make sure the fields are filled properly.
		-	return false if any conditions fail
	*/
	
	if(isString(oDate))
	{
		strDate = oDate;
	}
	else if(typeof(oDate) == "object")
	{
		strMonth = oDate.getMonth();
		strDay = oDate.getDate();
		strYear = oDate.getFullYear();
		strDate = strYear + "-" + strMonth + "-" + strDay;
	}
	else
	{
		alert("Invalid source for setting date");
	}

	if(!this.element_MonthSelect)
	{
		/*
			Make sure the user has created the calendar
			before we try to stuff data into invalid
			fields
		*/
		return false;
	}

	var dateFields = strDate.split("-");
	
	iDay = dateFields[2];
	iMonth = dateFields[1];
	iYear = dateFields[0];
		
	this.element_MonthSelect.value = oSystemMonthsList.getName(iMonth);
		
	if(iMonth > 0)
	{
		ShowInheritElement(this.element_DaySelect);
		ShowInheritElement(this.element_YearSelect);

		this.element_YearSelect.value = iYear;
		
		oSystemMonthsList.fillControlDays(this.element_DaySelect, iMonth, iDay, iYear);
	}
	else
	{
		/*
			we have to clear out the date fields
		*/
		HideElement(this.element_DaySelect);
		HideElement(this.element_YearSelect);
	}
	
	return true;
}
/*
	The isValid function returns true if the calendar object is
	loaded properly and the elements are usuable.
*/
system_Calendar.prototype.isValid = function()
{
	/*
		Make sure the user has created the calendar
		before we try to stuff data into invalid
		fields
	*/
	if(this.element_MonthSelect)
	{
		if(this.element_DaySelect)
		{
			if(this.element_YearSelect)
			{
				return true;
			}
		}
	}
	
	return false;
}
/*
	Retrieves the date stored within the system
*/
system_Calendar.prototype.getDate = function()
{
	strReturn = "";
	
	if(!this.isValid())
	{
		return strReturn;
	}
	
	/*
		If the month field is empty of value then we return an empty
		string, otherwise we return the date selected.
	*/
	if(this.element_MonthSelect.value != "")
	{
		month = oSystemMonthsList.getId(this.element_MonthSelect.value);
		day = this.element_DaySelect.value;
		year = this.element_YearSelect.value;
		strReturn = year + "-" + month + "-" + day;
	}

	return strReturn;
}
/*
	setMonth sets the month once the month select object has changed
*/
system_Calendar.prototype.onDayChange = function(element)
{
}
/*
	onYearChange grabs the stored year
*/
system_Calendar.prototype.onYearChange = function(element)
{
	if(element.value != "")
	{
		iYear = element.value;
		iMonth = this.element_MonthSelect.value;
		iDay = this.element_DaySelect.value;
		
		oSystemMonthsList.fillControlDays(this.element_DaySelect, oSystemMonthsList.getId(iMonth), iDay, iYear);
	}
}
/*
*/
system_Calendar.prototype.onCalendarLinkClick = function(element)
{
	ShowElement(this.element_CalendarBox);
}
/*
	Main function that creates the form elements
	params:
		strElementName:
			The name of the element we'll attach this 
        Required	Default is false
			Set to true if a date has to be present
		DateFormat
			Set up the date format types
        DefaultDate
			Input a default date
*/
system_Calendar.prototype.load = function(strElementName, DefaultDate)
{
	/*
		Set up the elements so they're attached to this object
	*/
	this.strMonthSelect = "system_Calendar_Month_" + strElementName;
	this.strDaySelect = "system_Calendar_Day_" + strElementName;
	this.strYearInput = "system_Calendar_Year_" + strElementName;
	this.strCalendarLink = "system_Calendar_Link_" + strElementName;
	this.strCalendarBox = "system_Calendar_Box_" + strElementName;

	this.element_MonthSelect = oScreenBuffer.Get(this.strMonthSelect);
	this.element_DaySelect = oScreenBuffer.Get(this.strDaySelect);
	this.element_YearSelect = oScreenBuffer.Get(this.strYearInput);
	this.element_CalendarLink = oScreenBuffer.Get(this.strCalendarLink);
	
	/*
		Make sure the elements are valid
	*/
	
	if(!this.element_MonthSelect)
	{
		alert("Invalid calendar: [" + strElementName + "].");
		return;
	}
	
	this.element_MonthSelect.oCalendar = this;
	this.element_MonthSelect.onchange = function ()
	{
		this.oCalendar.onMonthChange(this);
	}

	this.element_DaySelect.oCalendar = this;
	this.element_DaySelect.onchange = function ()
	{
		this.oCalendar.onDayChange(this);
	}

	this.element_YearSelect.oCalendar = this;
	this.element_YearSelect.onchange = function ()
	{
		this.oCalendar.onYearChange(this);
	}

	this.element_CalendarLink.oCalendar = this;
    
	this.element_CalendarLink.onclick = function()
	{
		this.oCalendar.onCalendarLinkClick(this);
	}
	
	/*
		Set the date to today
	*/
	this.storedDate = null;
	this.storedDate = new Date();        

	/*
		We check if the required date is set to true. If it
		is we set the date to the passed in date or the default.
		We're setting the calendar month select object with the required
		field because this object (this--the calendar object) is not maintained
		over the life of the build and the load.
	*/
	if(this.element_MonthSelect.calendar_Required)
	{
		this.element_MonthSelect.value = oSystemMonthsList.getName(this.storedDate.getMonth());
		this.element_DaySelect.value = this.storedDate.getDate();
		this.element_YearSelect.value = this.storedDate.getFullYear();
	}
}
