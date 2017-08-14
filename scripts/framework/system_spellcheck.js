/*----------------------------------------------------------------------------\
|                           DHTML Spell Checker 1.0                           |
|                        Lite Plain Text Implementation                       |
|-----------------------------------------------------------------------------|
|                          Created by Emil A Eklund                           |
|                        (http://eae.net/contact/emil)                        |
|-----------------------------------------------------------------------------|
| A real time spell checker that underline misspelled words as you type. Uses |
| XML HTTP to communicate  with a server side component that  does the actual |
| dictionary lookup. Compatible with IE6 and Mozilla.                         |
|-----------------------------------------------------------------------------|
|                      Copyright (c) 2005 Emil A Eklund                       |
|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
| This program is  free software;  you can redistribute  it and/or  modify it |
| under the terms of the MIT License.                                         |
|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
| Permission  is hereby granted,  free of charge, to  any person  obtaining a |
| copy of this software and associated documentation files (the "Software"),  |
| to deal in the  Software without restriction,  including without limitation |
| the  rights to use, copy, modify,  merge, publish, distribute,  sublicense, |
| and/or  sell copies  of the  Software, and to  permit persons to  whom  the |
| Software is  furnished  to do  so, subject  to  the  following  conditions: |
| The above copyright notice and this  permission notice shall be included in |
| all copies or substantial portions of the Software.                         |
|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
| THE SOFTWARE IS PROVIDED "AS IS",  WITHOUT WARRANTY OF ANY KIND, EXPRESS OR |
| IMPLIED,  INCLUDING BUT NOT LIMITED TO  THE WARRANTIES  OF MERCHANTABILITY, |
| FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE |
| AUTHORS OR  COPYRIGHT  HOLDERS BE  LIABLE FOR  ANY CLAIM,  DAMAGES OR OTHER |
| LIABILITY, WHETHER  IN AN  ACTION OF CONTRACT, TORT OR  OTHERWISE,  ARISING |
| FROM,  OUT OF OR  IN  CONNECTION  WITH  THE  SOFTWARE OR THE  USE OR  OTHER |
| DEALINGS IN THE SOFTWARE.                                                   |
|- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -|
|                         http://eae.net/license/mit                          |
|-----------------------------------------------------------------------------|
| Dependencies: spellcheckerbase.js - Implementation neutral logic and server |
|                                     communication handling.                 |
|               spellchecker.css    - Style definition for the context menu.  |
|               spell.[pl|php|cpp]  - Server side component.                  |
|-----------------------------------------------------------------------------|
| 2005-05-23 | Work started.                                                  |
| 2005-05-27 | First version posted.                                          |
| 2005-05-29 | Fixed various bugs in the Internet Explorer implementation.    |
| 2005-05-30 | Optimized  Mozilla implementation by  eliminating a few  cases |
|            | where the server was asked even though a full word had not yet |
|            | been entered.  Updated XML HTTP implementation to support both |
|            | GET and POST.  Replaced the  dashed red underline  with a wavy |
|            | one using a repeating png backgorund image.                    |
| 2005-06-11 | Implemented support for  rich text  editing.  Fixed a bug that |
|            | caused  an  error  when a  misspelled  word  was  replaced  by |
|            | multiple words in IE.  Improved the update performance (called |
|            | on server reply),  now the content is scaned only once instead |
|            | of for each word.                                              |
| 2005-06-12 | Implemented getHTML, improved performance for IE,  now uses an |
|            | implementaiton  thats  similar to the  mozilla one rather than |
|            | the old that rescaned the active paragraph for each word.      |
| 2005-06-14 | Fixed a focus  problem in  mozilla that  prevented text  entry |
|            | after a correction had been made.                              |
| 2005-07-18 | Fixed two bugs in the Mozilla implementation;  occasionally if |
|            | text was entered directly in  front of a word it  was lost and |
|            | words where not  correctly merged when the  whitespace between |
|            | them was deleted. Also updated the ignore method to ignore all |
|            | occurrence of the affected word.                               |
| 2005-07-19 | Added httpParamSep option as most frameworks doesn't interpret |
|            | semicolon as a field separator. Allows the php backend to work |
|            | with GET if set to '&'.                                        |
| 2005-07-21 | Reimplemented plain text version using a different  technique. |
|            | No longer uses a rich  text component but  rather the original |
|            | text area, made transparent,  and a container  behind it where |
|            | the markup is  applied.  Split WebFXSpellChecker omponent into |
|            | WebFXLiteSpellChecker (this one) and WebFXRichSpellChecker.    |
| 2005-07-26 | Reimplemented the _handleKey method,  now uses the current and |
|            | previous selectionStart and selectionEnd properties to monitor |
|            | changes and to keep the markup container up to date.           |
|-----------------------------------------------------------------------------|
| Created 2005-05-23 | All changes are in the log above. | Updated 2005-07-26 |
\----------------------------------------------------------------------------*/


/*----------------------------------------------------------------------------\
|                      WebFXSpellChecker Implementation                       |
\----------------------------------------------------------------------------*/
function WebFXLiteSpellChecker(el)
{
	var agt, isIe, isGecko, o, elCont, self;

	/* Detect browser */
	agt = navigator.userAgent.toLowerCase();
	isIE    = ((agt.indexOf("msie")  != -1) && (agt.indexOf("opera") == -1));
	isGecko = ((agt.indexOf('gecko') != -1) && (agt.indexOf("khtml") == -1));
	
	if ((!isIE) && (!isGecko))
	{
		this.el        = el;
		this.supported = false;
		return;
	}
	
	/* Set initial values */
	this.supported = true;
	this.elText    = el;
	this._start    = 0;
	this._len      = 0;

	/* Create markup container */
	elCont = document.createElement('div');
	elCont.className = 'webfx-spell-markupbox';
	el.parentNode.insertBefore(elCont, el);
	elCont.style.width = el.clientWidth + 'px';
	elCont.style.height = el.clientHeight + 'px';
	elCont.style.left = el.style.left;//clientLeft + 'px';
	elCont.style.top = el.style.top;//clientLeft + 'px';
	elCont.style.position = "absolute";//top = el.style.top;//clientLeft + 'px';
	elCont.style.zIndex = el.style.zIndex - 1;//2;//position = "absolute";//top = el.style.top;//clientLeft + 'px';
	el.className = 'webfx-spell-textarea';
	this.elCont = elCont;

	/* Register instance and init static webFXSpellCheckHandler if needed */
	if (webFXSpellCheckHandler.instances.length == 0)
	{
		webFXSpellCheckHandler._init();
	}
	
	o = new Object();
	o.elText = el;
	o.elCont = elCont;
	o.self   = this;
	this._instance = webFXSpellCheckHandler.instances.length;
	webFXSpellCheckHandler.instances.push(o);

	/*
	 * Assign event handlers
	 */	
	self = this;
	
	this.elText.onchange = this.elText.onkeyup = function(e)
	{
		self._handleKey();
		self._syncScroll();
	};
	
	this.elText.onselect = function(e) {
		self._determineActiveNode();
		self._syncScroll();
	};
	
	this.elText.onclick = function(e) {
		self._handleClick((e)?e:window.event);
		self._syncScroll();
	};

	/*
	 * As onscroll doesn't work on textareas in gecko (see bug #229089)
	 * the _syncScroll method is called by the onmousemove event handler
	 * instead... not pretty but it works pretty good.
	 */	
	if (isGecko)
	{
		this.elText.onmousemove = function(e)
		{
			self._syncScroll();
		};
	}
	else
	{
		this.elText.onscroll = function(e)
		{
			self._syncScroll();
		};
	}
	
	/* Populate with initial content */
	this.update();
}


WebFXLiteSpellChecker.prototype.getText = function()
{
	return this.elText.value
};


WebFXLiteSpellChecker.prototype.setText = function(str)
{
	this.elText.value = str;
	this.update();
};


WebFXLiteSpellChecker.prototype.replaceActive = function(word)
{
	var str, len, n, offset, start, end, c;
	
	if (this._nodeEnd) {
		this._setWord(this._nodeEnd, word);
		
		str = this.elText.value;
		len = str.length;
		
		offset = this._end;
		
		for (n = offset-2; n >= 0; n--) {
			c = str.substr(n, 1);
			if (!c.match(/[\w\']/)) { break; } //'
		}
		start = n+1;
		
		for (n = offset; n < len; n++) {
			c = str.substr(n, 1);
			if (!c.match(/[\w\']/)) { break; } //'
		}
		end = n;

		this.elText.value = str.substr(0, start) + word + str.substr(end, len-end);
		this._determineActiveNode();	
}	};

WebFXLiteSpellChecker.prototype.rescan = function() {
	var node, word;
	
	for (node = this.elCont.firstChild; node; node = node.nextSibling) {
		if (!node.firstChild) { return; }
		switch (webFXSpellCheckHandler._spellCheck(word)) {
			case RTSS_VALID_WORD:
			case RTSS_PENDING_WORD: node.style.background = 'none';                               break;
			case RTSS_INVALID_WORD: node.style.background = webFXSpellCheckHandler.invalidWordBg; break;
		};
}	};


/*----------------------------------------------------------------------------\
|                               Private Methods                               |
\----------------------------------------------------------------------------*/

WebFXLiteSpellChecker.prototype._getSelection = function() {
	if (document.all) {
		var sr, r, offset;
		sr = document.selection.createRange();
		r = sr.duplicate();
		r.moveToElementText(this.elText);
		r.setEndPoint('EndToEnd', sr);
		this._start = r.text.length - sr.text.length;
		this._end   = this._start + sr.text.length;
	}
	else {
		this._start = this.elText.selectionStart;
		this._end   = this.elText.selectionEnd;
	}
};


WebFXLiteSpellChecker.prototype._handleKey = function(charCode) {
	var str, len, lastStart, lastEnd;
	
	str = this.elText.value;
	len = str.length;
	
	lastStart = this._start;
	lastEnd   = this._end;
	
	this._determineActiveNode();
	
	if ((this._last != str) || (len != this._len)) {
			
		/* Remove deleted/replaced text */
		if (lastEnd > lastStart) {
			this._remove(lastStart, lastEnd);
		}
		
		/* Remove text erased by backspace*/
		else if (lastEnd > this._start) {
			this._remove(this._start, lastEnd);
		}

		/* Append/insert new text */
		if (this._start > lastStart) {
			this._insert(lastStart, this._start);
	}	}

	this._len   = len;
	this._last  = str;
};




WebFXLiteSpellChecker.prototype.update = function() {
	while (this.elCont.firstChild) { this.elCont.removeChild(this.elCont.firstChild); }
	this._insertWord(null, this.elText.value);
};


WebFXLiteSpellChecker.prototype._createWordNode = function(word) {
	var node = document.createElement('span');
	node.className = 'webfx-spellchecker-word';
	node.appendChild(document.createTextNode(word));
	switch (webFXSpellCheckHandler._spellCheck(word)) {
		case RTSS_VALID_WORD:
		case RTSS_PENDING_WORD: node.style.background = 'none';                               break;
		case RTSS_INVALID_WORD: node.style.background = webFXSpellCheckHandler.invalidWordBg; break;
	};
	return node;
};


WebFXLiteSpellChecker.prototype._determineActiveNode = function() {
	var i, len, c, str, node, l;

	this._getSelection();
	this._nodeStart = null;
	this._nodeEnd   = null;
	
	node = this.elCont.firstChild;
	for (i = 0; node; node = node.nextSibling) {
		if (node.nodeType == 1) {
			str = (node.firstChild)?node.firstChild.nodeValue:'\n';
		}
		else { str = node.nodeValue; }
		n = str.length;
		
		if (i+n <= this._start) { this._nodeStart = node; }
		this._nodeEnd = node;
		if (i+n >= this._end) { break; }
		i += n;
	}
	
};


WebFXLiteSpellChecker.prototype._setWord = function(el, word) {
	var i, len, c, str, node, doc, n, last;
	
	len = word.length;
	str = '';
	n = 0;
	for (i = 0; i < len; i++) {
		c = word.substr(i, 1);
		if (!c.match(/[\w\']/)) { // Match all but numbers, letters, - and '
			if (str) {
				el.parentNode.insertBefore(this._createWordNode(str), el);
			}
			
			last = (el.previousSibling)?el.previousSibling.nodeValue:'';
			switch (c) {
				case '\n': node = document.createElement('br');                   break;
				case ' ':  node = document.createTextNode((last == ' ')?' ':' '); break;
				default:   node = document.createTextNode(c);
			};
			el.parentNode.insertBefore(node, el);
			str = '';
			n++;
		}
		else { str += c; }
	}
	if (str) {
		if (el.firstChild) {
			el.firstChild.nodeValue = str;
			switch (webFXSpellCheckHandler._spellCheck(str)) {
				case RTSS_VALID_WORD:
				case RTSS_PENDING_WORD: el.style.background = 'none';                               break;
				case RTSS_INVALID_WORD: el.style.background = webFXSpellCheckHandler.invalidWordBg; break;
			};
		}
		else { 
			node = this._createWordNode(str);
			el.parentNode.replaceChild(node, el);
			el = node;
	}	}
	else {
		node = el.previousSibling;
		el.parentNode.removeChild(el);
		el = node;
	}
	
	return el;
};


WebFXLiteSpellChecker.prototype._insertWord = function(el, word) {
	var i, len, c, str, node, n, last;
	
	len = word.length;
	str = '';
	n = 0;
	node = null;
	for (i = 0; i < len; i++) {
		c = word.substr(i, 1);
		if (!c.match(/[\w\']/)) { // Match all but numbers, letters, - and '
			if (str) {
				if (el) { node = this.elCont.insertBefore(this._createWordNode(str), el); }
				else { node = this.elCont.appendChild(this._createWordNode(str)); }
			}

			last = ((el) && (el.previousSibling))?el.previousSibling.nodeValue:'';
			switch (c) {
				case '\n': node = document.createElement('br'); break;
				case ' ':  node = document.createTextNode((last == ' ')?' ':' '); break;
				default:   node = document.createTextNode(c);
			};
			if (el) { this.elCont.insertBefore(node, el); }
			else { this.elCont.appendChild(node); }
			str = '';
			n++;
		}
		else { str += c; }
	}
	if (str) {
		if (el) { node = this.elCont.insertBefore(this._createWordNode(str), el); }
		else { node = this.elCont.appendChild(this._createWordNode(str)); }
	}
	else if (el) {
		if (!node) { node = el.previousSibling; }
	}
	
	return node;
};

WebFXLiteSpellChecker.prototype._remove = function(startPos, endPos) {
	var node, i, n, startNode, endNode, word, next;

	/* Locate start and end node and determine what to keep of first and last node */	
	i = 0;
	startNode = endNode = null;
	for (node = this.elCont.firstChild; node; node = node.nextSibling) {
		if (node.nodeType == 1) {
			str = (node.firstChild)?node.firstChild.nodeValue:'\n';
		}
		else { str = node.nodeValue; }
		n = str.length;
			
		if ((startNode == null) && (i + n >= startPos)) {
			startNode = node;
			word = str.substr(0, startPos - i);
		}
		if (i + n >= endPos) {
			endNode = node.nextSibling;
			word += str.substr(endPos - i, n - (endPos - i));
			break;
		}
		
		i += n;
	}
	
	if (!startNode) { return; }
	
	/* Remove all but first node */
	for (node = startNode.nextSibling; node != endNode; node = next) {
		next = node.nextSibling;
		this.elCont.removeChild(node);
	}

	/* Set new word */	
	this._setWord(startNode, word);
};

WebFXLiteSpellChecker.prototype._insert = function(startPos, endPos) {
	var str, i, len, c, word, newNode, offset, startNode;

	/* Locate start node and determine offset */	
	i = 0;
	startNode = null;
	for (node = this.elCont.firstChild; node; node = node.nextSibling) {
		if (node.nodeType == 1) {
			str = (node.firstChild)?node.firstChild.nodeValue:'\n';
		}
		else { str = node.nodeValue; }
		n = str.length;
		if (i + n >= startPos) {
			startNode = node;
			offset = startPos - i
			break;
		}
		i += n;
	}
	
	str = this.elText.value.substring(startPos, endPos);
	if (startNode) {
		if (startNode.firstChild) {
			word = node.firstChild.nodeValue.substr(0, offset) + str + node.firstChild.nodeValue.substr(offset, node.firstChild.nodeValue.length);
			this._setWord(startNode, word);
		}
		else { this._insertWord(startNode.nextSibling, str); }
	}

	else {
		len = str.length;
		node = startNode;
		word = '';
		for (i = 0; ; i++) {
			c = str.substr(i, 1);
			if ((i >= len) || (!c.match(/[\w\']/))) { // all but numbers, letters and '
				if (word) {
					newNode = this._createWordNode(word);
					if (node) { this.elCont.insertBefore(newNode, node); }
					else { this.elCont.appendChild(newNode); }
					word = '';
				}
				if (i >= len) { break; }
				
				last = (node && node.previousSibling)?node.previousSibling.nodeValue:'';
				switch (c) {
					case '\n': newNode = document.createElement('br');                   break;
					case ' ':  newNode = document.createTextNode((last == ' ')?' ':' '); break;
					default:   newNode = document.createTextNode(c);
				};
				if (node) { this.elCont.insertBefore(newNode, node); }
				else { this.elCont.appendChild(newNode); }
				
			}
			else { word += c; }
	}	}
};

WebFXLiteSpellChecker.prototype._syncScroll = function() {
	this.elCont.scrollTop = this.elText.scrollTop;
	this.	elCont.scrollLeft = this.elText.scrollLeft;
};

WebFXLiteSpellChecker.prototype._handleClick = function(e) {
	var word, o;
	
	this._determineActiveNode();
	if ((this._nodeEnd) && (this._nodeEnd.firstChild)) {
		word = this._nodeEnd.firstChild.nodeValue;
		o    = webFXSpellCheckHandler.words[word];
		if ((o) && (o[0] == RTSS_INVALID_WORD)) {
			webFXSpellCheckHandler._showSuggestionsMenu(e, this._nodeEnd, word, this._instance);
			return
	}	}
	
	webFXSpellCheckHandler._hideSuggestionsMenu();
};
