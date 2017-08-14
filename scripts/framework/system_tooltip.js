/*
 	Please leave this notice.
	Modified from the following:
	DHTML tip message version 1.2 copyright Essam Gamal 2003 (http://migoicons.tripod.com, migoicons@hotmail.com)
*/ 

var ua = navigator.userAgent
var ps = navigator.productSub 
var dom = (document.getElementById)? 1:0
var ie4 = (document.all&&!dom)? 1:0
var ie5 = (document.all&&dom)? 1:0
var nn4 =(navigator.appName.toLowerCase() == "netscape" && parseInt(navigator.appVersion) == 4)
var nn6 = (dom&&!ie5)? 1:0

var tooltip_style = [];
var toolTip_visible = 0;
var toolTip_move=0;


var hs="";
var scl;
var sct;
var ww;
var wh;
var obj;
var st;
var ih;
var iw;

var tbody;

var doc_root = ((ie5&&ua.indexOf("Opera")<0||ie4)&&document.compatMode=="CSS1Compat")? "document.documentElement":"document.body"

function ToolTipSetup()
{
	addListener(window, 'resize', HideToolTip);
	addListener(document, 'mousemove', MoveToolTip);
	addListener(window, 'scroll', ToolTipScroll);
}

if(nn4||nn6)
{
	scl = "window.pageXOffset"
	sct = "window.pageYOffset"	

	if(nn4)
	{
		obj = "document.TipLayer."
		st = "top"
		ih = "clip.height"
		iw = "clip.width"
	}
	else
	{
		obj = "document.getElementById('TipLayer').";
	}
} 

if(ie4||ie5)
{
	obj = "TipLayer."
	scl = "eval(doc_root).scrollLeft"
	sct = "eval(doc_root).scrollTop"
}

if(ie4||dom)
{
	st = "style.top"
	ih = "offsetHeight"
	iw = "offsetWidth"
}

if(ie4||ie5||ps >=20020823)
{
	ww = "eval(doc_root).clientWidth"
	wh = "eval(doc_root).clientHeight"
}	 
else
{ 
	ww = "window.innerWidth"
	wh = "window.innerHeight"
}	

function ShowToolTip(e)
{
	var theTarget = e.target ? e.target : e.srcElement;
	
	tipLayer = document.getElementById('TipLayer');
	
	if(!theTarget)
	{
		return;
	}

	t = theTarget.tooltip_text;
	s = theTarget.tooltip_style;

	if(!t)
	{
		return;
	}
	
	if(!s)
	{
		return;
	}
	
	if(t.length < 2 || s.length < 20)
	{
		var ErrorNotice = "DHTML TIP MESSAGE VERSION 1.2 ERROR NOTICE.\n"
		
		if(t.length < 2 && s.length < 20)
		{
			alert(ErrorNotice+"It looks like you removed an entry or more from the Style Array and Text Array of this tip.\nTheir should be 25 entries in every Style Array even though empty and 2 in every Text Array. You defined only "+s.length+" entries in the Style Array and "+t.length+" entry in the Text Array. This tip won't be viewed to avoid errors");
		}
		else if(t.length < 2)
		{
			alert(ErrorNotice+"It looks like you removed an entry or more from the Text Array of this tip.\nTheir should be 2 entries in every Text Array. You defined only "+t.length+" entry. This tip won't be viewed to avoid errors.");
		}
		else if(s.length < 20)
		{
			alert(ErrorNotice+"It looks like you removed an entry or more from the Style Array of this tip.\nTheir should be 25 entries in every Style Array even though empty. You defined only "+s.length+" entries. This tip won't be viewed to avoid errors.")
		}
		return;
	}

	RemoveChildren(tipLayer);

	var titleColor = s[0];
	var textColor = s[1];
	var titleBgColor = s[2];
	var textBgColor = s[3];
	var titleBgImg = s[4];
	var textBgImg = s[5];
	var titleTextAlign = s[6];
	var textTextAlign = s[7];
	var titleFontFace = s[8];
	var textFontFace = s[9];
	var tipPosition = s[10].toLowerCase();
	var stickyStyle = s[11];
	var TitleFontSize = s[12];
	var TextFontSize = s[13];
	var tooltipWidth = s[14];
	var tooltipHeight = s[15];
	var borderSize = s[16];
	var PadTextArea = s[17];
	var xPos = s[18];
	var yPos = s[19];
	
	var tipTitle = t[0];
	var tipText = t[1];
	
	stickyStyle = stickyStyle.toLowerCase();
	
	hs = stickyStyle;
	
	if(titleFontFace.length < 1)
	{
		titleFontFace = "Verdana,Arial,Helvetica";
	}
	if(textFontFace.length < 1)
	{
		textFontFace = "Verdana,Arial,Helvetica";
	}
	
	if(TitleFontSize.length < 1)
	{
		TitleFontSize = "small";
	}
	
	if(TextFontSize.length < 1)
	{
		TextFontSize = "small";
	}
	
	if(tooltipWidth < 10)
	{
		tooltipWidth = 200;
	}
	
	if(borderSize.length < 1)
	{
		borderSize = 0;
	}
	
	if(PadTextArea < 1)
	{
		PadTextArea = 1;
	}

	if(xPos.length < 1)
	{
		xPos = 10;
	}
	
	if(yPos.lenght < 1)
	{
		xPos = 10;
	}
		
	/*
		Work on the close link
	*/
	
	var element_table = document.createElement("TABLE");
	tipLayer.appendChild(element_table);
	
	element_table.width = tooltipWidth;
	element_table.height = tooltipHeight;
	element_table.style.border = borderSize + "px solid " + titleBgColor;

	element_table.border = 0;
	element_table.cellPadding = 0;
	element_table.cellSpacing = 0;
	
	element_body = document.createElement("TBODY");

	element_table.appendChild(element_body);
	
	if(stickyStyle =="sticky" || tipTitle.length > 0)
	{
		element_TableRow = document.createElement("TR");
		element_body.appendChild(element_TableRow);
		
		element_TableCol = document.createElement("TD");
		element_TableRow.appendChild(element_TableCol);
	
		element_titleTable = document.createElement("TABLE");
		element_TableCol.appendChild(element_titleTable);
		
		element_titleTable.width = "100%";
		element_titleTable.border = 0;
		element_titleTable.cellPadding = 0;
		element_titleTable.cellSpacing = 0;
		element_titleTable.style.backgroundColor = titleBgColor;
		element_titleTable.style.color = titleColor;
		
		element_titleTableBody = document.createElement("TBODY");
		element_titleTable.appendChild(element_titleTableBody);

		element_titleRow = document.createElement("TR");
		element_titleTableBody.appendChild(element_titleRow);

		//	append the title if there is one
		element_titleCol = document.createElement("TD");
		element_titleRow.appendChild(element_titleCol);

		element_titleTable.cellPadding = 0;
		element_titleTable.cellSpacing = 0;
	
		element_titleRow.style.fontSize = TitleFontSize;
		element_titleRow.style.face = titleFontFace;
		
		if(tipTitle)
		{
			element_titleCol.style.padding = PadTextArea;
			element_titleCol.style.textAlign = titleTextAlign;
			element_titleCol.appendChild(document.createTextNode(tipTitle));
		}
		
		if(stickyStyle == "sticky")
		{
			element_closeCol = document.createElement("TD");
			element_titleRow.appendChild(element_closeCol);

			element_closeCol.align = "right";

			element_closeLink = document.createElement("SPAN");
			element_closeLink.className = "link";
			element_closeLink.appendChild(document.createTextNode("Close"));
			addListener(element_closeLink, 'click', ForceHideToolTip);

			element_closeCol.appendChild(element_closeLink);
		}
	}

	element_TableRow2 = document.createElement("TR");
	element_TableRow2.style.face = textFontFace;
	element_TableRow2.style.fontSize = TextFontSize;	
	element_TableRow2.style.color = textColor;
	element_TableRow2.style.backgroundColor = textBgColor;
	
	element_body.appendChild(element_TableRow2);
		
	element_TableCol2 = document.createElement("TD");
	element_TableRow2.appendChild(element_TableCol2);
	
	element_TableCol2.style.padding = PadTextArea;
	element_TableCol2.innerHTML = tipText;
	element_TableCol2.style.textAlign = textTextAlign;
	
	tbody = {

		Pos: tipPosition, 
		Xpos:xPos,
		Ypos:yPos, 
		Width:parseInt(eval(obj+iw)+3)
	}
	
	toolTip_move = 1;
	toolTip_visible = 1;
	MoveToolTip(e);
}

function ToolTipScroll(e)
{
	if(toolTip_visible == 1)
	{
		if(tbody.Pos=="float")
		{
			toolTip_move = 1;
			MoveToolTip(e);
		}
	}
}

function MoveToolTip(e)
{
	if(toolTip_visible == 0)
	{
		return;
	}
	
	if(toolTip_move == 0)
	{
		return;
	}

	var X;
	var Y;
	var MouseX = getMouseX(e);
	var MouseY = getMouseY(e);
	
	tbody.Height = parseInt(eval(obj+ih)+3);
	tbody.wiw = parseInt(eval(ww+"+"+scl));
	tbody.wih = parseInt(eval(wh+"+"+sct))
	tipLayer = document.getElementById('TipLayer');


	switch(tbody.Pos)
	{
		case "left" :
			X = MouseX - tbody.Width - tbody.Xpos;
			Y = MouseY + tbody.Ypos;
			break;
		case "center":
			X = MouseX - (tbody.Width / 2);
			Y = MouseY + tbody.Ypos;
			break;
		case "float":
			X = tbody.Xpos + eval(scl);
			Y = tbody.Ypos + eval(sct);
			break;	
		case "fixed":
			X = tbody.Xpos;
			Y = tbody.Ypos;
			break;
		default:
			X = MouseX + tbody.Xpos;
			Y = MouseY + tbody.Ypos;
			break;
	}
	
	if(tbody.wiw < tbody.Width + X)
	{
		X = tbody.wiw - tbody.Width;
	}
	
	if(tbody.wih < tbody.Height + Y)
	{
		if(tbody.Pos=="float"||tbody.Pos=="fixed")
		{
			Y = tbody.wih - tbody.Height;
		}
		else
		{
			Y = MouseY - tbody.Height;
		}
	}
	
	if(X < 0)
	{
		X = 0;
	}
	
	tipLayer.style.left = X + "px";
	tipLayer.style.top = Y + "px";

	ShowElement(tipLayer);

	if(hs == "sticky")
	{
		toolTip_move = 0;
	}
}

function ForceHideToolTip()
{
	HideElement(document.getElementById('TipLayer'));
	toolTip_visible = 0;
	toolTip_move = 0; 

}
function HideToolTip()
{
	if(hs!="keep")
	{
		if(hs!="sticky")
		{
			ForceHideToolTip();
		}
	} 
}

function SetToolTip(element_name, text, style)
{
	if(!style)
	{
		style = tooltip_style["default"];
	}
	
	element_name.tooltip_text = text;
	element_name.tooltip_style = style;
	
	addListener(element_name, 'mouseover', ShowToolTip);
	addListener(element_name, 'mouseout', HideToolTip);
}
/*
Text[...]=[title,text]
Style[...]=[TitleColor,0
			TextColor,1
			TitleBgColor,2
			TextBgColor,3
			TitleBgImag,4
			TextBgImag,5
			TitleTextAlign,6
			TextTextAlign,7
			TitleFontFace,8
			TextFontFace,9
			TipPosition,10
			StickyStyle,11
			TitleFontSize,12
			TextFontSize,13
			Width,14
			Height,15
			BorderSize,16
			PadTextArea,17
			CoordinateX,18
			CoordinateY,19
			]
*/

tooltip_style[0]=["white","black","#000099","#E8E8FF","","","","","","","","","","",200,"",2,2,10,10,51,1,0,"",""];
tooltip_style[1]=["white","black","#000099","#E8E8FF","","","","","","","center","","","",200,"",2,2,10,10,"","","","",""];
tooltip_style[2]=["white","black","#000099","#E8E8FF","","","","","","","left","","","",200,"",2,2,10,10,"","","","",""];
tooltip_style[3]=["white","black","#000099","#E8E8FF","","","","","","","float","","","",200,"",2,2,10,10,"","","","",""];
tooltip_style[4]=["white","black","#000099","#E8E8FF","","","","","","","fixed","","","",200,"",2,2,1,1,"","","","",""];
tooltip_style[5]=["white","black","#000099","#E8E8FF","","","","","","","","sticky","","",200,"",2,2,10,10,"","","","",""];
tooltip_style[6]=["white","black","#000099","#E8E8FF","","","","","","","","keep","","",200,"",2,2,10,10,"","","","",""];
tooltip_style[7]=["white","black","#000099","#E8E8FF","","","","","","","","","","",200,"",2,2,40,10,"","","","",""];
tooltip_style[8]=["white","black","#000099","#E8E8FF","","","","","","","","","","",200,"",2,2,10,50,"","","","",""];
tooltip_style[9]=["white","black","#000099","#E8E8FF","","","","","","","","","","",200,"",2,2,10,10,51,0.5,75,"simple","gray"];
tooltip_style[10]=["white","black","black","white","","","right","","Impact","cursive","center","",3,5,200,150,5,20,10,0,50,1,80,"complex","gray"];
tooltip_style[11]=["white","black","#000099","#E8E8FF","","","","","","","","","","",200,"",2,2,10,10,51,0.5,45,"simple","gray"];
tooltip_style[12]=["white","black","#000099","#E8E8FF","","","","","","","","","","",200,"",2,2,10,10,"","","","",""];
tooltip_style["menu"]=["white","black","black","white","","","","","","","","","","",180,"",1,2,20,10];
tooltip_style["default"]=["white","black","black","white","","","","","","","","","","",180,"",1,2,10,10];
tooltip_style["link"]   =["white","black","black","white","","","","","","","","sticky","","",200,"",1,2,20, 20];