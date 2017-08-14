/*----------------------------------------------------------------------------\
|                           DHTML Spell Checker 1.0                           |
|                         Implementation Neutral Logic                        |
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
| 2005-07-24 | Split webFXSpellCheckHandler object into a separate file.      |
|-----------------------------------------------------------------------------|
| Created 2005-05-23 | All changes are in the log above. | Updated 2005-07-24 |
\----------------------------------------------------------------------------*/

/* Word Status Constants */
var RTSS_UNKNOWN_WORD = 0; // Not yet checked
var RTSS_VALID_WORD   = 1; // Valid word (confirmed by server)
var RTSS_INVALID_WORD = 2; // Invalid word (confirmed by server)
var RTSS_PENDING_WORD = 3; // In queue


/*----------------------------------------------------------------------------\
|                          Global Spell Check Handler                         |
\----------------------------------------------------------------------------*/

var webFXSpellCheckHandler = {
	activeRequest: false,
	words        : new Array(),
	pending      : new Array(),
	activeWord   : null,
	instances    : new Array(),
	serverURI    : '/spell.cgi', // http://me.eae.net/stuff/spellchecker/spell.cgi
	invalidWordBg: 'red',        // url(http://me.eae.net/stuff/spellchecker/images/redline.png) repeat-x bottom
	httpMethod   : 'POST',       // GET or POST
	httpParamSep : ';',          // Use ampersand ('&') for PHP backend (default configuration doesn't support semicolon separator)
	wordsPerReq  : 100
};

/*----------------------------------------------------------------------------\
|                               Static Methods                                |
\----------------------------------------------------------------------------*/

webFXSpellCheckHandler._init = function() {
	var menu, inner, item;

	menu = document.createElement('div');
	menu.style.zIndex = 30;
	menu.id = 'webfxSpellCheckMenu';
	menu.className = 'webfx-spellchecker-menu';
	menu.style.display = 'none';

	inner = document.createElement('div');
	inner.className = 'inner';
	menu.appendChild(inner);

	item = document.createElement('div');
	item.className = 'separator';
	inner.appendChild(item);

	item = document.createElement('a');
	item.href = 'javascript:webFXSpellCheckHandler._ignoreWord();'
	item.appendChild(document.createTextNode('Ignore'));
	inner.appendChild(item);

	document.body.appendChild(menu);
};


webFXSpellCheckHandler._spellCheck = function(word) {
	if (webFXSpellCheckHandler.words[word]) { return webFXSpellCheckHandler.words[word][0]; }
	webFXSpellCheckHandler.words[word] = [RTSS_PENDING_WORD];
	webFXSpellCheckHandler.pending.push(word);
	if (!webFXSpellCheckHandler.activeRequest) { window.setTimeout('webFXSpellCheckHandler._askServer()', 10); }

	return RTSS_PENDING_WORD;
};

webFXSpellCheckHandler._askServer = function() {
	var i, len, uri, arg, word, aMap, xmlHttp;
	var async = true;

	if (webFXSpellCheckHandler.activeRequest) { return; }
	arg = '';
	len = webFXSpellCheckHandler.pending.length;
	if (len) {
		webFXSpellCheckHandler.activeRequest = true;
		aMap = new Array();

		if (len > webFXSpellCheckHandler.wordsPerReq) { len = webFXSpellCheckHandler.wordsPerReq; }
		for (i = 0; i < len; i++) {

			word = webFXSpellCheckHandler.pending.shift();

			arg += ((i)?webFXSpellCheckHandler.httpParamSep:'') + i + '=' + word;
			webFXSpellCheckHandler.words[word] = [RTSS_PENDING_WORD];
			aMap[i] = word;
		}
		if (webFXSpellCheckHandler.httpMethod == 'GET') {
			uri = webFXSpellCheckHandler.serverURI + '?' + arg;
			arg = '';
		}
		else { uri = webFXSpellCheckHandler.serverURI; }

		if (window.XMLHttpRequest) {
			xmlHttp = new XMLHttpRequest();
			xmlHttp.onload = function() {
				webFXSpellCheckHandler._serverResponseHandler(xmlHttp.responseText, aMap);
			};
		}
		else if (window.ActiveXObject) {
			xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");
			if (!xmlHttp) { return; }
			xmlHttp.onreadystatechange = function() {
				if (xmlHttp.readyState == 4) {
					webFXSpellCheckHandler._serverResponseHandler(xmlHttp.responseText, aMap);
				}
	  	};
		}
		
		//alert(uri);
		
		xmlHttp.open(webFXSpellCheckHandler.httpMethod, uri, async);
  		xmlHttp.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  		xmlHttp.setRequestHeader("Content-Length", arg.length);
  		xmlHttp.send(arg);
	}
};


webFXSpellCheckHandler._serverResponseHandler = function(sData, aMap) {
	var i, flag, len, data, word, suggestions;

	//alert(sData);

	try {
		eval(sData);
	}
	catch (oe) { return; }
	len = data.length;
	for (i = 0; i < len; i++) {
		flag = data[i][0];
		word = aMap[i];
		suggestions = data[i][1];
		if (!webFXSpellCheckHandler.words[word]) {
			return;
		}
		switch (flag) {
			case 0:
				webFXSpellCheckHandler.words[word][0] = RTSS_INVALID_WORD;
				webFXSpellCheckHandler.words[word][1] = suggestions;
				break;
			case 1:
				webFXSpellCheckHandler.words[word][0] = RTSS_VALID_WORD;
				break;
		};
	}
	webFXSpellCheckHandler.activeRequest = false;
	webFXSpellCheckHandler._updateWords();
	if (webFXSpellCheckHandler.pending.length) { webFXSpellCheckHandler._askServer(); }
};


webFXSpellCheckHandler._updateWords = function() {
	var aNodes, i, n, len, eInstance, ow;
	
	for (n = 0; n < webFXSpellCheckHandler.instances.length; n++) {
		aNodes = webFXSpellCheckHandler.instances[n].elCont.getElementsByTagName('span');
		len = aNodes.length;
		for (i = 0; i < len; i++) {
			if (aNodes[i].childNodes.length != 1) { continue; }
			if (aNodes[i].firstChild.nodeType != 3) { continue; }
			ow = webFXSpellCheckHandler.words[aNodes[i].firstChild.nodeValue];
			if (!ow) { continue; }
			switch (ow[0]) {
				case RTSS_VALID_WORD:
				case RTSS_PENDING_WORD: aNodes[i].style.background = 'none';                               break;
				case RTSS_INVALID_WORD: aNodes[i].style.background = webFXSpellCheckHandler.invalidWordBg; break;
			};
}	}	};

webFXSpellCheckHandler._showSuggestionsMenu = function(e, el, word, instance) {
	var menu, len, item, sep, frame, aSuggestions, doc, x, y, o;

	if (!webFXSpellCheckHandler.words[word]) { return; }

	menu = document.getElementById('webfxSpellCheckMenu');
	len = menu.firstChild.childNodes.length;
	while (len > 2) { menu.firstChild.removeChild(menu.firstChild.firstChild); len--; }
	sep = menu.firstChild.firstChild;

	aSuggestions = webFXSpellCheckHandler.words[word][1];
	len = aSuggestions.length;
	if (len > 10) { len = 10; }
	for (i = 0; i < len; i++) {
		item = document.createElement('a');
		item.href = 'javascript:webFXSpellCheckHandler._replaceWord(' + instance + ', "' + aSuggestions[i] + '");'
		item.appendChild(document.createTextNode(aSuggestions[i]));
		menu.firstChild.insertBefore(item, sep);
	}
	if (len == 0) {
		item = document.createElement('a');
		item.href = 'javascript:void(0);'
		item.appendChild(document.createTextNode('No suggestions'));
		menu.firstChild.insertBefore(item, sep);
	}

	var n;
	for (n = 0; n < webFXSpellCheckHandler.instances.length; n++) {
		if (webFXSpellCheckHandler.instances[n].doc == el.ownerDocument) {
			frame = webFXSpellCheckHandler.instances[n].el;
			doc   = webFXSpellCheckHandler.instances[n].doc;
	}	}

	x = 0; y = 0;
	for (o = frame; o; o = o.offsetParent) {
		x += (o.offsetLeft - o.scrollLeft);
		y += (o.offsetTop - o.scrollTop);
	}

	if (document.all) {
		menu.style.left = x + (e.pageX || e.clientX) + 'px';
		menu.style.top  = y + (e.pageY || e.clientY) + (el.offsetHeight/2) + 'px';
	}
	else {
		menu.style.left = x + ((e.pageX || e.clientX) - document.body.scrollLeft) + 'px';
		menu.style.top  = y + ((e.pageY || e.clientY) - document.body.scrollTop) + (el.offsetHeight/2) + 'px';
	}
	menu.style.display = 'block';

	webFXSpellCheckHandler.activeWord = word;
};


webFXSpellCheckHandler._replaceWord = function(instance, word) {
	var o, sel, r;
	
	o = webFXSpellCheckHandler.instances[instance];
	if (o) {
		o.self.replaceActive(word);
	}
	
	webFXSpellCheckHandler._hideSuggestionsMenu();
};


webFXSpellCheckHandler._ignoreWord = function() {
	var word, i, len, o;
	
	word = webFXSpellCheckHandler.activeWord;
	
	if (word) {
		webFXSpellCheckHandler.words[word][0] = RTSS_VALID_WORD;
		webFXSpellCheckHandler.words[word][1] = [];
		
		len = webFXSpellCheckHandler.instances.length;
		for (i = 0; i < len; i++) {
			o = webFXSpellCheckHandler.instances[i];
			o.self.rescan();
		}
	}
	
	webFXSpellCheckHandler._hideSuggestionsMenu();
};


webFXSpellCheckHandler._hideSuggestionsMenu = function() {
	document.getElementById('webfxSpellCheckMenu').style.display = 'none';
	webFXSpellCheckHandler.activeWord = null;
};
