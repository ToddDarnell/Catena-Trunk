/*--------------------------------------------------------------------------
	Node object
	Name Type Description 
	node_id (Number)
		Unique identity number. 
	pid (Number)
		Number refering to the parent node. The value for the root node has to be -1. 
	node_name (String)
		Text label for the node. 
	node_tip (String)
		Text tool tip for the node. 
	url	(String)
		Url for the node. 
	title	(String)
		Title for the node. 
	target	(String)
		Target for the node. 
	icon (String)
		Image file to use as the icon. Uses default if not specified. 
	iconOpen	(String)
		Image file to use as the open icon. Uses default if not specified. 
	open	(Boolean)
		Is the node open. 

--------------------------------------------------------------------------*/
function tree_node(node_id, pid, node_name, node_title, url, node_target, icon, iconOpen, node_open)
{
	this.id = node_id;
	this.parentId = pid;
	this.name = node_name;
	this.url = url;
	this.title = node_title;
	this.target = node_target;
	this.icon = icon;
	this.iconOpen = iconOpen;
	this.isOpen = node_open || false;
	this._is = false;
	this.lastSibling = false;
	this.hasChildren = false;
	this._ai = 0;
	this._p;
};
/*--------------------------------------------------------------------------
	Tree object
--------------------------------------------------------------------------*/
function system_tree()
{
	this.config = {
		target				: null,
		folderLinks			: true,
		useSelection		: true,
		useLines			: true,
		useIcons			: false,
		useStatusText		: false,
		closeSameLevel		: false,
		useCookies			: false,
		inOrder				: false,
		width				: 180,
		height				: 400,
		backgroundColor		: "#FFFFFF",
		color				: "#666"		
	};
	
	this.icon = {
		root				: '../image/tree_root.gif',
		line				: '../image/tree_line.gif',
		join				: '../image/tree_join.gif',
		joinBottom			: '../image/tree_joinbottom.gif',
		plus				: '../image/tree_plus.gif',
		plusBottom			: '../image/tree_plusbottom.gif',
		minus				: '../image/tree_minus.gif',
		minusBottom			: '../image/tree_minusbottom.gif',
		nlPlus				: '../image/tree_nolines_plus.gif',
		nlMinus				: '../image/tree_nolines_minus.gif',
		branchClosed 		: '../image/tree_branchclosed.gif',
		branchOpen			: '../image/tree_branchopen.gif',
		node				: '../image/tree_node.gif',
		empty				: '../image/tree_empty.gif'
	};
	
	/*
		Create the root div element
		and place it on the parent element
	*/
	this.element_root = null;
	this.clear();
};

/*--------------------------------------------------------------------------
	setElement will take the passed in element (not it's name)
	and attach the tree this element, using the passed in
	element as the root.
	Additionally, the passed in element must be a div
--------------------------------------------------------------------------*/
system_tree.prototype.setElement = function (element_root)
{
	
	
	
}
/*--------------------------------------------------------------------------
	createElement will build the div element, using
	the passed in element as the parent element
	params:
		element_parent
			The element we'll attach the tree to
		iLeft
			Where the element should be placed
		iTop
			Where the element should be placed
--------------------------------------------------------------------------*/
system_tree.prototype.createElement = function(element_parent, iLeft, iTop)
{

	this.strField_root = element_parent.id + "tree";

	this.element_root = document.createElement("DIV");
	this.element_root.style.position = 'absolute';
	this.element_root.style.left = iLeft + "px";
	this.element_root.style.top = iTop + "px";
	this.element_root.id = this.strField_root;
	this.element_root.style.overflow = "auto";
	this.element_root.style.height = this.config.height + "px";
	this.element_root.style.width = this.config.width + "px";
	this.element_root.style.backgroundColor = this.config.backgroundColor;
	this.element_root.style.color = this.config.color;
	
	
	element_parent.appendChild(this.element_root);
			
	return true;
}
/*--------------------------------------------------------------------------
	Adds a new node to the node array
--------------------------------------------------------------------------*/
system_tree.prototype.add = function(id, pid, name, title, url, target, icon, iconOpen, open)
{
	this.aNodes[this.aNodes.length] = new tree_node(id, pid, name, title, url, target, icon, iconOpen, open);
};
/*--------------------------------------------------------------------------
	-	description
		Open/close all nodes
	-	params
	-	return
--------------------------------------------------------------------------*/
system_tree.prototype.openAll = function()
{
	this.oAll(true);
};
/*--------------------------------------------------------------------------
	-	description
	-	params
	-	return
--------------------------------------------------------------------------*/
system_tree.prototype.closeAll = function()
{
	this.oAll(false);
};
/*--------------------------------------------------------------------------
	-	description
		Open or close all nodes
	-	params
		-	status
				true
					open all nodes
				false
					close all nodes
	-	return
--------------------------------------------------------------------------*/
system_tree.prototype.oAll = function(status)
{
	for (var n=0; n < this.aNodes.length; n++)
	{
		if (this.aNodes[n].hasChildren && this.aNodes[n].parentId != this.rootNode.id)
		{
			this.nodeStatus(status, n, this.aNodes[n].lastSibling)
			this.aNodes[n].isOpen = status;
		}
	}
};
/*--------------------------------------------------------------------------
	Outputs the tree to the page
--------------------------------------------------------------------------*/
system_tree.prototype.show = function()
{
	RemoveChildren(this.element_root);
	
	this.selectedNode = null;
	if (this.config.useCookies)
	{
		//this.selectedNode = this.getSelected();
	}
	
	this.showNode(this.rootNode, this.element_root);
	
	if (!this.selectedFound)
	{
		this.selectedNode = null;
	}
	
	//this.completed = true;
};
/*--------------------------------------------------------------------------
	Creates the tree structure
--------------------------------------------------------------------------*/
system_tree.prototype.showNode = function(pNode, element_parent)
{
	var iNode = 0;
	var currentNode;
	
	for (iNode=0; iNode < this.aNodes.length; iNode++)
	{
		currentNode = this.aNodes[iNode];

		if (currentNode.parentId != pNode.id)
		{
			continue;
		}
		
		currentNode._p = pNode;
		currentNode._ai = iNode;
		this.setCS(currentNode);
		
		if(currentNode.parentId == -1)
		{
			currentNode.isOpen = true;
		}
		
		if (!currentNode.target && this.config.target)
		{
			currentNode.target = this.config.target;
		}
			
		if (currentNode.hasChildren && !currentNode.isOpen && this.config.useCookies)
		{
			currentNode.isOpen = this.isOpen(currentNode.id);
		}
		
		if (!this.config.folderLinks && currentNode.hasChildren)
		{
			currentNode.url = null;
		}
		
		if (this.config.useSelection && currentNode.id == this.selectedNode && !this.selectedFound)
		{
			currentNode._is = true;
			this.selectedNode = iNode;
			this.selectedFound = true;
		}
		
		this.node(currentNode, element_parent);
		
		if (currentNode.lastSibling)
		{
			break;
		}
	}
};
/*--------------------------------------------------------------------------
	Builds a node which is then appended to the screen node
--------------------------------------------------------------------------*/
system_tree.prototype.node = function(node, element_parent)
{
	element_node = document.createElement("DIV");
	element_parent.appendChild(element_node);
	
	element_node.className = "system_tree";
	
	this.indentNode(element_node, node);
	
	if (this.config.useIcons)
	{
		if (!node.icon)
		{
			node.icon = (this.rootNode.id == node.parentId) ? this.icon.root : ((node.hasChildren) ? this.icon.branchClosed : this.icon.node);
		}
		
		if (!node.iconOpen)
		{
			node.iconOpen = (node.hasChildren) ? this.icon.branchOpen : this.icon.node;
		}
		
		if (this.rootNode.id == node.parentId)
		{
			node.icon = this.icon.root;
			node.iconOpen = this.icon.root;
		}
		
		element_image = document.createElement("IMG");
		element_image.id = "i" + this.strField_root + node.id;
		element_image.src = ((node.isOpen) ? node.iconOpen : node.icon);
		element_image.style.width = "20px";
		element_image.style.height = "20px";

		element_node.appendChild(element_image);
	}

	element_nameWrapper = document.createElement("SPAN");
	element_nameWrapper.id = "sel_" + this.strField_root + node.id;
	
	element_nameWrapper.nodeId = node.id;
	element_nameWrapper.oTree = this;

	element_nameWrapper.ondblclick = function ()
	{
		this.oTree.ondblclick(this.nodeId);
	}

	element_nameWrapper.onclick = function ()
	{
		this.oTree.onclick(this.nodeId);
	}

	element_nameWrapper.onmouseover = function ()
	{
		this.className = "link";	
	}

	element_nameWrapper.onmouseout = function ()
	{
		this.className = "";	
	}
	
	element_nameWrapper.appendChild(document.createTextNode(node.name));
	
	element_nameWrapper.title = node.title;
		
	element_node.appendChild(element_nameWrapper);
	
	if (node.hasChildren)
	{
		element_childBlock = document.createElement("DIV");
	
		element_childBlock.id = "div-" + this.strField_root + "-" + node.id;

		if(node.isOpen)
		{
			element_childBlock.style.display = "block";
		}
		else
		{
			element_childBlock.style.display = "none";
		}

		element_node.appendChild(element_childBlock);
		this.showNode(node, element_childBlock);
	}
	this.aIndent.pop();
	
};
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_tree.prototype.ondblclick = function(nodeId)
{
	return false;
	
	oSystem_Debug.notice("On dbl click");

	this.open(nodeId, true);
	
	/*
		Now inform the caller than a new selection was made
	*/
	if(this.oNotify)
	{
		if(this.oNotify.ontreechange)
		{
			var cn = this.GetNode(nodeId);
			this.oNotify.ontreechange(cn.id, cn.name, 1);
		}
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_tree.prototype.onclick = function(nodeId)
{
	oSystem_Debug.notice("On click");
	this.open(nodeId, true);
	
	/*
		Now inform the caller than a new selection was made
	*/
	if(this.oNotify)
	{
		if(this.oNotify.ontreechange)
		{
			var cn = this.GetNode(nodeId);
			this.oNotify.ontreechange(cn.id, cn.name, 0);
		}
	}
}
/*--------------------------------------------------------------------------
	-	Adds the empty and line icons
	-	Also adds the expand, collapse button depending upon if
		the item has children and the children are visible.
	
--------------------------------------------------------------------------*/
system_tree.prototype.indentNode = function(element_node, node)
{
	/*
		If this is the root node, we don't indent it
	*/
	for (var n = 0; n < this.aIndent.length; n++)
	{
		element_image = document.createElement("IMG");
		element_image.src = ( (this.aIndent[n] == 1 && this.config.useLines) ? this.icon.line : this.icon.empty );
		element_node.appendChild(element_image);
	}

	(node.lastSibling) ? this.aIndent.push(0) : this.aIndent.push(1);

	
	if (node.hasChildren)
	{
		element_imageLink = document.createElement("SPAN");
		element_imageLink.className = "link";

		element_image = document.createElement("IMG");
		
		element_image.id = "expand_" + this.strField_root + node.id;
		
		element_imageLink.appendChild(element_image);

		if (!this.config.useLines)
		{
			strSource = (node.isOpen) ? this.icon.nlMinus : this.icon.nlPlus;
		}
		else
		{
			strSource = ( (node.isOpen) ? ((node.lastSibling && this.config.useLines) ? this.icon.minusBottom : this.icon.minus) : ((node.lastSibling && this.config.useLines) ? this.icon.plusBottom : this.icon.plus ) );
		}
		
		element_image.src = strSource;
		element_node.appendChild(element_imageLink);
		
		element_imageLink.oTree = this;
		element_imageLink.nodeId = node.id;
				
		element_imageLink.onclick = function()
		{
			this.oTree.toggle(this.nodeId);
		}
	}
	else
	{
		element_image = document.createElement("IMG");

		strSource = ( (this.config.useLines) ? ((node.lastSibling) ? this.icon.joinBottom : this.icon.join ) : this.icon.empty);
		element_image.src = strSource;
		element_node.appendChild(element_image);

	}
	
};
/*--------------------------------------------------------------------------
	Checks if a node has any children and if it is the last sibling
--------------------------------------------------------------------------*/
system_tree.prototype.setCS = function(node)
{
	var lastId;
	
	node.hasChildren = false;
	node.lastSibling = false;
	
	for (var n=0; n < this.aNodes.length; n++)
	{
		if (this.aNodes[n].parentId == node.id)
		{
			node.hasChildren = true;
		}
		if (this.aNodes[n].parentId == node.parentId)
		{
			lastId = this.aNodes[n].id;
		}
	}
	
	if (lastId == node.id)
	{
		node.lastSibling = true;
	}
};
/*--------------------------------------------------------------------------
	Returns the selected node
--------------------------------------------------------------------------*/
system_tree.prototype.getSelected = function()
{
	var sn = this.getCookie('cs' + this.strField_root);
	return (sn) ? sn : null;
};
/*--------------------------------------------------------------------------
	Highlights the selected node
--------------------------------------------------------------------------*/
system_tree.prototype.SetSelected = function(id)
{
	if (!this.config.useSelection)
	{
		return;
	}
	var cn = this.GetNode(id);
	
	if (cn.hasChildren && !this.config.folderLinks)
	{
		 return;
	}
	
	if (this.selectedNode != id)
	{
		if (this.selectedNode || this.selectedNode == 0)
		{
			eOld = document.getElementById("sel_" + this.strField_root + this.selectedNode);
			if(eOld)
			{
				eOld.style.backgroundColor = this.config.backgroundColor;
				eOld.style.color = this.config.color;
			}
		}
		
		eNew = document.getElementById("sel_" + this.strField_root + id);
		oSystem_Colors.SetSecondary(eNew);
		oSystem_Colors.SetPrimaryBackground(eNew);
		
		this.selectedNode = id;
		if (this.config.useCookies)
		{
			this.setCookie('cs' + this.strField_root, cn.id);
		}
	}
};
/*--------------------------------------------------------------------------
	GetNode
	Returns the node with the specified id
--------------------------------------------------------------------------*/
system_tree.prototype.GetNode = function(id)
{
	
	for (var n=0; n < this.aNodes.length; n++)
	{
		if(this.aNodes[n].id == id)
		{
			return this.aNodes[n];
		}
	}
	return null;
}
/*--------------------------------------------------------------------------
	Toggle Open or close
--------------------------------------------------------------------------*/
system_tree.prototype.toggle = function(id)
{
	var cn = this.GetNode(id);
	
	if(cn.hasChildren == false)
	{
		return;
	}

	bOpen = !cn.isOpen;
		
	if(bOpen == true)
	{
		this.open(id);
	}
	else
	{
		this.close(id);
	}
	
	if (this.config.closeSameLevel)
	{
		this.close(cn);
	}

	if (this.config.useCookies)
	{
		this.updateCookie();
	}
};
/*--------------------------------------------------------------------------
	Opens the tree to a specific node
--------------------------------------------------------------------------*/
system_tree.prototype.open = function(nodeId, bSelect)
{
	for (var n=0; n < this.aNodes.length; n++)
	{
		if (this.aNodes[n].id == nodeId)
		{
			this.nodeStatus(nodeId, true);

			if(bSelect == true)
			{
				this.SetSelected(nodeId);
			}
			break;
		}
	}
};
/*--------------------------------------------------------------------------
	Closes all nodes on the same level as certain node
--------------------------------------------------------------------------*/
system_tree.prototype.close = function(nodeId)
{
	for (var n=0; n < this.aNodes.length; n++)
	{
		if (this.aNodes[n].id == nodeId)
		{
			this.nodeStatus(nodeId, false);
		}
	}
}
/*--------------------------------------------------------------------------
	Changes the status of a node(open or closed)
--------------------------------------------------------------------------*/
system_tree.prototype.nodeStatus = function(id, status)
{
	var node = this.GetNode(id);
	
	bottom = node.lastSibling;
	
	node.isOpen = status;

	eDiv	= document.getElementById('d' + this.strField_root + id);
	eJoin	= document.getElementById('j' + this.strField_root + id);

	element_image = oScreenBuffer.Get("expand_" + this.strField_root + id);
	
	if (this.config.useIcons)
	{
		//eIcon	= document.getElementById('d' + this.strField_root + id);
		//eIcon.src = (status) ? this.aNodes[id].iconOpen : this.aNodes[id].icon;
	}

	if(element_image)
	{
		img = "";
		if(this.config.useLines == true)
		{
			if(bottom == true)
			{
				img = (status) ? this.icon.minusBottom : this.icon.plusBottom;
			}
			else
			{
				img = (status) ? this.icon.minus : this.icon.plus;
			}
		}	
		else
		{
			if(bottom == true)
			{
				img = (status) ? this.icon.minusBottom : this.icon.plusBottom;
			}
			else
			{
				img = (status) ? this.icon.nlMinus : this.icon.nlPlus;
			}
		}	
		
		element_image.src = img;
	}
	/*
		If the element has children
		then we may open or close it as needed
	*/
	if(node.hasChildren)
	{
		strName = "div-" + this.strField_root + "-" + node.id;
		oScreenBuffer.Get(strName).style.display = (status) ? 'block': 'none';
	}
}
//--------------------------------------------------------------------------
/**
	\brief
	\param
	\return
*/
//--------------------------------------------------------------------------
system_tree.prototype.clear = function()
{
	/*
		Create the root div element
		and place it on the parent element
	*/
	//this.element_parent = null;
	this.aNodes = null;
	this.aIndent = null;
	this.aNodes = [];
	this.aIndent = [];
	this.rootNode = null;
	this.rootNode = new tree_node(-1);
	this.selectedNode = null;
	this.selectedFound = false;
}
/*--------------------------------------------------------------------------
	[Cookie] Clears a cookie
--------------------------------------------------------------------------*/
system_tree.prototype.clearCookie = function() {
	var now = new Date();
	var yesterday = new Date(now.getTime() - 1000 * 60 * 60 * 24);
	this.setCookie('co'+this.strField_root, 'cookieValue', yesterday);
	this.setCookie('cs'+this.strField_root, 'cookieValue', yesterday);
};
/*--------------------------------------------------------------------------
	[Cookie] Sets value in a cookie
--------------------------------------------------------------------------*/
system_tree.prototype.setCookie = function(cookieName, cookieValue, expires, path, domain, secure) {
	document.cookie =
		escape(cookieName) + '=' + escape(cookieValue)
		+ (expires ? '; expires=' + expires.toGMTString() : '')
		+ (path ? '; path=' + path : '')
		+ (domain ? '; domain=' + domain : '')
		+ (secure ? '; secure' : '');
};
/*--------------------------------------------------------------------------
	[Cookie] Gets a value from a cookie
--------------------------------------------------------------------------*/
system_tree.prototype.getCookie = function(cookieName)
{
	var cookieValue = '';
	var posName = document.cookie.indexOf(escape(cookieName) + '=');

	if (posName != -1)
	{
		var posValue = posName + (escape(cookieName) + '=').length;
		var endPos = document.cookie.indexOf(';', posValue);
		if (endPos != -1)
		{
			cookieValue = unescape(document.cookie.substring(posValue, endPos));
		}
		else
		{
			cookieValue = unescape(document.cookie.substring(posValue));
		}
	}
	return (cookieValue);
};
/*--------------------------------------------------------------------------
	[Cookie] Returns ids of open nodes as a string
--------------------------------------------------------------------------*/
system_tree.prototype.updateCookie = function()
{
	
	var str = '';
	
	for (var n=0; n < this.aNodes.length; n++)
	{
		if (this.aNodes[n].isOpen && this.aNodes[n].parentId != this.rootNode.id)
		{
			if (str)
			{
				str += '.';
			}
			str += this.aNodes[n].id;
		}
	}
	this.setCookie('co' + this.strField_root, str);
};
/*--------------------------------------------------------------------------
	[Cookie] Checks if a node id is in a cookie
--------------------------------------------------------------------------*/
system_tree.prototype.isOpen = function(id)
{
	if (this.config.useCookies)
	{
		oSystem_Debug.notice("Tree is using cookies.");
		aOpen = this.getCookie('co' + this.strField_root).split('.');
		
		for (var n=0; n < aOpen.length; n++)
		{
			if (aOpen[n] == id)
			{
				return true;
			}
		}
	}
	else
	{
		for (var n=0; n < this.aNodes.length; n++)
		{
			if (this.aNodes[n].id == id)
			{
				return this.aNodes[n].isOpen;
			}
		}
	}
	
	return false;
	
};