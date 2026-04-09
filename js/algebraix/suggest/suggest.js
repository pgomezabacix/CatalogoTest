function icon_by_auth(auth) {
	if (auth && auth.startsWith('custom')) {
		return auth.replace('custom','');
	}
	switch ( auth ) {
		case 'parent':
			return "fa-circle-user text-purple";
			break;
		case 'sparent':
			return "fa-circle-user text-purple";
			break;
		case 'student':
			return "fa-circle-user text-blue";
			break;
		case 'sstudent':
			return "fa-circle-user text-blue";
			break;
		case 'teacher':
			return "fa-circle-user text-yellow";
			break;
		case 'operator':
			return "fa-circle-user text-green";
			break;
		case 'admin':
			return "fa-circle-user text-red";
			break;
		case 'personnel':
			return "fa-circle-user text-orange";
			break;
		case 'none':
			return "d-none";
			break;
		default:
			return "fa-circle-user text-dark";
	}
	return "fa-circle-user text-dark";
}

var useBSNns;

if (useBSNns)
{
	if (typeof(bsn) == "undefined")
		bsn = {}
	_bsn = bsn;
}
else
{
	_bsn = this;
}

if (typeof(_bsn.Autosuggest) == "undefined")
	_bsn.Autosuggest = {}

_bsn.AutoSuggest = function (fldID, param)
{
	// no DOM - give up!
	//
	if (!document.getElementById)
		return false;

	// get field via DOM
	//
	this.fld = _bsn.DOM.getElement(fldID);

	if (!this.fld)
		return false;

	// init variables
	//
	this.sInput 		= "";
	this.nInputChars 	= 0;
	this.aSuggestions 	= [];
	this.iHighlighted 	= 0;

	// parameters object
	//
	this.oP = (param) ? param : {};

	// defaults
	//
	if (this.oP.minchars == undefined)				this.oP.minchars = 1;
	if (!this.oP.method)							this.oP.meth = "get";
	if (!this.oP.varname)							this.oP.varname = "input";
	if (!this.oP.className)							this.oP.className = "autosuggest";
	if (!this.oP.timeout)							this.oP.timeout = 10000;
	if (!this.oP.delay)								this.oP.delay =500;
	if (!this.oP.offsety)							this.oP.offsety = -5;
	if (!this.oP.shownoresults)						this.oP.shownoresults = true;
	if (!this.oP.noresults)							__LANGUAGE_CODE  == 'ES' ? this.oP.noresults = "No se encontraron resultados." : this.oP.noresults = "No results found.";
	if (!this.oP.maxheight && this.oP.maxheight !== 0)		this.oP.maxheight = 16;
	if (!this.oP.cache && this.oP.cache != false)			this.oP.cache = true;
	if (!this.oP.local && this.oP.local != false)			this.oP.local = false;

	// set keyup handler for field
	// and prevent autocomplete from client
	//
	var pointer = this;

	// NOTE: not using addEventListener because UpArrow fired twice in Safari
	//_bsn.DOM.addEvent( this.fld, 'keyup', function(ev){ return pointer.onKeyPress(ev); } );

	this.fld.onkeypress 	= function(ev){ return pointer.onKeyPress(ev); }
	this.fld.onkeyup 		= function(ev){ return pointer.onKeyUp(ev); }
	this.fld.onclick 		= function(ev){ return pointer.onClick(ev); }

	this.fld.setAttribute("autocomplete","off");
}

_bsn.AutoSuggest.prototype.onKeyPress = function(ev)
{
	var key = (window.event) ? window.event.keyCode : ev.keyCode;

	// set responses to keydown events in the field
	// this allows the user to use the arrow keys to scroll through the results
	// ESCAPE clears the list
	// TAB sets the current highlighted value
	//
	var RETURN = 13;
	var TAB = 9;
	var ESC = 27;

	var bubble = true;

	switch(key)
	{

		case RETURN:
			this.setHighlightedValue();
			bubble = false;
			break;


		case ESC:
			this.clearSuggestions();
			break;
	}

	return bubble;
}



_bsn.AutoSuggest.prototype.onKeyUp = function(ev)
{
	var key = (window.event) ? window.event.keyCode : ev.keyCode;

	// set responses to keydown events in the field
	// this allows the user to use the arrow keys to scroll through the results
	// ESCAPE clears the list
	// TAB sets the current highlighted value
	//

	var ARRUP = 38;
	var ARRDN = 40;

	var bubble = true;

	switch(key)
	{
		case ARRUP:
			this.changeHighlight(key);
			bubble = false;
			break;


		case ARRDN:
			this.changeHighlight(key);
			bubble = false;
			break;


		default:
			this.getSuggestions(this.fld.value);
	}

	return bubble;
}

_bsn.AutoSuggest.prototype.onClick = function(ev)
{
	this.getSuggestions(this.fld.value);
	return true;
}

_bsn.AutoSuggest.prototype.getSuggestions = function (val)
{
	// if input stays the same, do nothing
	//
	if (val == this.sInput && val.length != 0){
		//console.log('input stays the same');
		return false;
	}

	// input length is less than the min required to trigger a request
	// reset input string
	// do nothing
	//
	if (val.length < this.oP.minchars)
	{
		//console.log('input min > required');
		this.sInput = "";
		return false;
	}

	// if caching enabled, and user is typing (ie. length of input is increasing)
	// filter results out of aSuggestions from last request
	//
	if (val.length>this.nInputChars && this.aSuggestions.length && this.oP.cache)
	{
		//console.log('caching enabled, filter from last request');
		var arr = [];
		var input_val = val.toLowerCase();
		for (var i=0;i<this.aSuggestions.length;i++)
		{
			//if (this.aSuggestions[i].value.substr(0,val.length).toLowerCase() == val.toLowerCase())
			if (this.aSuggestions[i].value.toLowerCase().indexOf(input_val) > -1 )
				arr.push( this.aSuggestions[i] );
		}

		this.sInput = val;
		this.nInputChars = val.length;
		this.aSuggestions = arr;

		this.createList(this.aSuggestions);
		return false;
	}
	else
	// do new request
	//
	{
		//console.log('new request');
		this.sInput = val;
		this.nInputChars = val.length;


		var pointer = this;
		clearTimeout(this.ajID);
		this.ajID = setTimeout( function() { pointer.doAjaxRequest() }, this.oP.delay );
	}

	return false;
}

_bsn.AutoSuggest.prototype.doAjaxRequest = function ()
{
	var pointer = this;

	if(this.oP.local){
		var arr = [];
		var data = this.oP.localData;
		for (var i=0;i<data.length;i++)
		{
			if (remove_accents( data[i].value.toLowerCase()).indexOf( remove_accents( this.fld.value.toLowerCase())) != -1) {
				arr.push( data[i] );
			}
		}
		pointer.setSuggestions(arr);
	}else{
		// create ajax request
		var url = this.oP.script+this.oP.varname+"="+escape(this.fld.value);
		var meth = this.oP.meth;

		var onSuccessFunc = function (req) { pointer.setSuggestions(req) };
		var onErrorFunc = function (status) { alert("AJAX error: "+status); };

		var myAjax = new _bsn.Ajax();
		myAjax.makeRequest( url, meth, onSuccessFunc, onErrorFunc );
	}
}

_bsn.AutoSuggest.prototype.setSuggestions = function (req)
{
	this.aSuggestions = [];

	if(this.oP.local){
		this.aSuggestions = req;
	}else if (this.oP.json)
	{
		var jsondata = eval('(' + req.responseText + ')');
		for (var i=0;i<jsondata.results.length;i++)
		{
			this.aSuggestions.push(  { 'id':jsondata.results[i].id, 'value':jsondata.results[i].value, 'info':jsondata.results[i].info, 'extra':jsondata.results[i].extra, 'extra_info':jsondata.results[i].extra_info, 'auth':jsondata.results[i].auth }  );
		}
	}
	else
	{
		var xml = req.responseXML;

		// traverse xml
		//
		var results = xml.getElementsByTagName('results')[0].childNodes;

		for (var i=0;i<results.length;i++)
		{
			if (results[i].hasChildNodes())
				this.aSuggestions.push(  { 'id':results[i].getAttribute('id'), 'value':results[i].childNodes[0].nodeValue, 'info':results[i].getAttribute('info') }  );
		}

	}

	this.idAs = "as_"+this.fld.id;
	this.createList(this.aSuggestions);

}

_bsn.AutoSuggest.prototype.createList = function(arr)
{
	var pointer = this;


	// get rid of old list
	// and clear the list removal timeout
	//
	//_bsn.DOM.removeElement(this.idAs + '_header');
	_bsn.DOM.removeElement(this.idAs);
	this.killTimeout();

	// create holding div
	//
	var div = _bsn.DOM.createElement("div", {id:this.idAs, className:this.oP.className});

	//var header = _bsn.DOM.createElement("div", {id:this.idAs+'_header', className:"as_header"});
	//div.appendChild(header);

	// create and populate ul
	//
	var ul = _bsn.DOM.createElement("ul", {id:"as_ul", className:"dropdown-menu show dropdown-menu--list dropdown-menu--auto-width dropdown-menu--auto-height " + (this.oP.listclass ? this.oP.listclass : '' ) });
	ul.style.maxHeight	= this.oP.maxheight + "rem";
	// loop throught arr of suggestions
	// creating an LI element for each suggestion
	//
	for (var i=0;i<arr.length;i++)
	{
		// format output with the input enclosed in a EM element
		// (as HTML, not DOM)
		//
		var val = encode_html(arr[i].value);
		//remove_accents is a function from standard.functions.js
		var st = remove_accents( val.toLowerCase()).indexOf( remove_accents( this.sInput.toLowerCase() ) );
		var output = val.substring(0,st) + "<strong class='text-red'>" + val.substring(st, st+this.sInput.length) + "</strong>" + val.substring(st+this.sInput.length);

		var div_text = _bsn.DOM.createElement("div", {className:"dropdown-item__text"});
		var span 		= _bsn.DOM.createElement("span", {className:"dropdown-item__text--primary"}, output, true);
		div_text.appendChild(span);

		if (arr[i].info != "") {
			//var span_secondary 		= _bsn.DOM.createElement("span", {className:"dropdown-item__text--secondary"}, arr[i].info + " " + ( arr[i].extra_info || "" ) );
			//var span_secondary 		= _bsn.DOM.createElement("span", {className:"dropdown-item__text--secondary"} );
			var infos = arr[i].info.split("|");
			for(var j = 0; j < infos.length; j++){
				var info_item = _bsn.DOM.createElement("div", {className:"dropdown-item__text--secondary"}, encode_html(infos[j]), true );
				div_text.appendChild(info_item);
			}

			var extra_infos = arr[i].extra_info ? arr[i].extra_info.split("|") : [];
			for(var j = 0; j < extra_infos.length; j++){
				var info_item = _bsn.DOM.createElement("div", {className:"dropdown-item__text--secondary text-orange"}, extra_infos[j], true );
				div_text.appendChild(info_item);
			}

			//div_text.appendChild(span_secondary);
		}

		// if (arr[i].info != "")
		// {
		// 	var span 		= _bsn.DOM.createElement("span", {className:"dropdown-item__text--secondary"}, arr[i].info);
		// 	var br			= _bsn.DOM.createElement("br", {});
		// 	div_text.appendChild(br);
		// 	var small		= _bsn.DOM.createElement("small", {}, arr[i].info);
		// 	span.appendChild(small);
		// }
		//
		// if (arr[i].extra_info != "")
		// {
		// 	var small_extra	= _bsn.DOM.createElement("small", {className:"extra-info"}, arr[i].extra_info);
		// 	span.appendChild(small_extra);
		// }

		var a 		= _bsn.DOM.createElement("a", { href:"javascript:;", className:"dropdown-item"  });
		var icon_class = "fa dropdown-menu__icon " + icon_by_auth(arr[i].auth);
		var icon 		= _bsn.DOM.createElement("span", {className: icon_class});

		a.appendChild(icon);
		a.appendChild(div_text);

		a.name = i+1;
		a.onclick = function () { pointer.setHighlightedValue(); return false; }
		a.onmouseover = function () { pointer.setHighlight(this.name); }

		var li 			= _bsn.DOM.createElement(  "li", {}, a  );

		ul.appendChild( li );
	}

	// no results
	//
	if (arr.length == 0)
	{
		var li 			= _bsn.DOM.createElement(  "li", {className:"dropdown-item"}, this.oP.noresults  );

		ul.appendChild( li );
	}

	div.appendChild( ul );

	// var fbar = _bsn.DOM.createElement("div", {className:"as_bar"});
	// var footer = _bsn.DOM.createElement("div", {className:"as_footer"});
	// footer.appendChild(fbar);
	// div.appendChild(footer);

	// get position of target textfield
	// position holding div below it
	// set width of holding div to width of field
	//
	var pos = _bsn.DOM.getPos(this.fld);

	div.style.left 		= pos.x + "px";
	div.style.top 		= ( pos.y + this.fld.offsetHeight + this.oP.offsety + 10 ) + "px";
	div.style.width 	= this.fld.offsetWidth + "px";
	//div.style.maxHeight	= this.oP.maxheight + "rem";
	//div.style.overflow	= "auto";

	// header.style.left 	= pos.x + "px";
	// header.style.top 	= ( pos.y + this.fld.offsetHeight + this.oP.offsety ) + "px";
	// header.style.width 	= this.fld.offsetWidth + "px";
	// header.style.height     = "10px";


	// set mouseover functions for div
	// when mouse pointer leaves div, set a timeout to remove the list after an interval
	// when mouse enters div, kill the timeout so the list won't be removed
	//
	div.onmouseover 	= function(){ pointer.killTimeout() }
	div.onmouseout 		= function(){ pointer.resetTimeout() }

	var insideModal = document.querySelector('#modal ' + '#' + this.fld.id);

	// add DIV to document
	//
	if (insideModal) {
		// document.getElementById("modal").appendChild(header);
		document.getElementById("modal").appendChild(div);
	}
	else {
		// document.getElementsByTagName("body")[0].appendChild(header);
		document.getElementsByTagName("body")[0].appendChild(div);
	}

	// currently no item is highlighted
	//
	this.iHighlighted = 0;

	// remove list after an interval
	//
	var pointer = this;
	this.toID = setTimeout(function () { pointer.clearSuggestions() }, this.oP.timeout);
}

_bsn.AutoSuggest.prototype.changeHighlight = function(key)
{
	var list = _bsn.DOM.getElement("as_ul");
	if (!list)
		return false;

	var n;

	if (key == 40)
		n = this.iHighlighted + 1;
	else if (key == 38)
		n = this.iHighlighted - 1;


	if (n > list.childNodes.length)
		n = list.childNodes.length;
	if (n < 1)
		n = 1;


	this.setHighlight(n);
}

_bsn.AutoSuggest.prototype.setHighlight = function(n)
{
	var list = _bsn.DOM.getElement("as_ul");
	if (!list)
		return false;

	if (this.iHighlighted > 0)
		this.clearHighlight();

	this.iHighlighted = Number(n);

	list.childNodes[this.iHighlighted-1].className = "as_highlight";


	this.killTimeout();
}

_bsn.AutoSuggest.prototype.clearHighlight = function()
{
	var list = _bsn.DOM.getElement("as_ul");
	if (!list)
		return false;

	if (this.iHighlighted > 0)
	{
		list.childNodes[this.iHighlighted-1].className = "";
		this.iHighlighted = 0;
	}
}

_bsn.AutoSuggest.prototype.setHighlightedValue = function ()
{
	if (this.iHighlighted)
	{
		this.sInput = this.fld.value = this.aSuggestions[ this.iHighlighted-1 ].value;

		// move cursor to end of input (safari)
		//
		this.fld.focus();
		if (this.fld.selectionStart)
			this.fld.setSelectionRange(this.sInput.length, this.sInput.length);


		this.clearSuggestions();

		// pass selected object to callback function, if exists
		//
		if (typeof(this.oP.callback) == "function")
			this.oP.callback( this.aSuggestions[this.iHighlighted-1] );
	}
}

_bsn.AutoSuggest.prototype.killTimeout = function()
{
	clearTimeout(this.toID);
}

_bsn.AutoSuggest.prototype.resetTimeout = function()
{
	clearTimeout(this.toID);
	var pointer = this;
	this.toID = setTimeout(function () { pointer.clearSuggestions() }, 1000);
}

_bsn.AutoSuggest.prototype.clearSuggestions = function ()
{

	this.killTimeout();

	var ele = _bsn.DOM.getElement(this.idAs);
	var pointer = this;
	if (ele)
	{
		var fade = new _bsn.Fader(ele,1,0,250,function () {
			//_bsn.DOM.removeElement(pointer.idAs + '_header');
			_bsn.DOM.removeElement(pointer.idAs);
		});
	}
}

// AJAX PROTOTYPE _____________________________________________
if (typeof(_bsn.Ajax) == "undefined")
	_bsn.Ajax = {}

_bsn.Ajax = function ()
{
	this.req = {};
	this.isIE = false;
}

_bsn.Ajax.prototype.makeRequest = function (url, meth, onComp, onErr)
{

	if (meth != "POST")
		meth = "GET";

	this.onComplete = onComp;
	this.onError = onErr;

	var pointer = this;

	// branch for native XMLHttpRequest object
	if (window.XMLHttpRequest)
	{
		this.req = new XMLHttpRequest();
		this.req.onreadystatechange = function () { pointer.processReqChange() };
		this.req.open("GET", url, true); //
		this.req.send(null);
	// branch for IE/Windows ActiveX version
	}
	else if (window.ActiveXObject)
	{
		this.req = new ActiveXObject("Microsoft.XMLHTTP");
		if (this.req)
		{
			this.req.onreadystatechange = function () { pointer.processReqChange() };
			this.req.open(meth, url, true);
			this.req.send();
		}
	}
}

_bsn.Ajax.prototype.processReqChange = function()
{

	// only if req shows "loaded"
	if (this.req.readyState == 4) {
		// only if "OK"
		if (this.req.status == 200)
		{
			this.onComplete( this.req );
		} else {
			this.onError( this.req.status );
		}
	}
}

// DOM PROTOTYPE _____________________________________________
if (typeof(_bsn.DOM) == "undefined")
	_bsn.DOM = {}

_bsn.DOM.createElement = function ( type, attr, cont, html )
{
	var ne = document.createElement( type );
	if (!ne)
		return false;

	for (var a in attr)
		ne[a] = attr[a];

	if (typeof(cont) == "string" && !html)
		ne.appendChild( document.createTextNode(cont) );
	else if (typeof(cont) == "string" && html)
		ne.innerHTML = cont;
	else if (typeof(cont) == "object")
		ne.appendChild( cont );

	return ne;
}

_bsn.DOM.clearElement = function ( id )
{
	var ele = this.getElement( id );

	if (!ele)
		return false;

	while (ele.childNodes.length)
		ele.removeChild( ele.childNodes[0] );

	return true;
}

_bsn.DOM.removeElement = function ( ele )
{
	var e = this.getElement(ele);

	if (!e)
		return false;
	else if (e.parentNode.removeChild(e))
		return true;
	else
		return false;
}

_bsn.DOM.replaceContent = function ( id, cont, html )
{
	var ele = this.getElement( id );

	if (!ele)
		return false;

	this.clearElement( ele );

	if (typeof(cont) == "string" && !html)
		ele.appendChild( document.createTextNode(cont) );
	else if (typeof(cont) == "string" && html)
		ele.innerHTML = cont;
	else if (typeof(cont) == "object")
		ele.appendChild( cont );
}

_bsn.DOM.getElement = function ( ele )
{
	if (typeof(ele) == "undefined")
	{
		return false;
	}
	else if (typeof(ele) == "string")
	{
		var re = document.getElementById( ele );
		if (!re)
			return false;
		else if (typeof(re.appendChild) != "undefined" ) {
			return re;
		} else {
			return false;
		}
	}
	else if (typeof(ele.appendChild) != "undefined")
		return ele;
	else
		return false;
}

_bsn.DOM.appendChildren = function ( id, arr )
{
	var ele = this.getElement( id );

	if (!ele)
		return false;


	if (typeof(arr) != "object")
		return false;

	for (var i=0;i<arr.length;i++)
	{
		var cont = arr[i];
		if (typeof(cont) == "string")
			ele.appendChild( document.createTextNode(cont) );
		else if (typeof(cont) == "object")
			ele.appendChild( cont );
	}
}

_bsn.DOM.getPos = function ( ele )
{
	var ele = this.getElement(ele);

	var obj = ele;

	var curleft = 0;
	if (obj.offsetParent)
	{
		while (obj.offsetParent)
		{
			curleft += obj.offsetLeft
			obj = obj.offsetParent;
		}
	}
	else if (obj.x)
		curleft += obj.x;


	var obj = ele;

	var curtop = 0;
	if (obj.offsetParent)
	{
		while (obj.offsetParent)
		{
			curtop += obj.offsetTop
			obj = obj.offsetParent;
		}
	}
	else if (obj.y)
		curtop += obj.y;

	return {x:curleft, y:curtop}
}


// FADER PROTOTYPE _____________________________________________
if (typeof(_bsn.Fader) == "undefined")
	_bsn.Fader = {}

_bsn.Fader = function (ele, from, to, fadetime, callback)
{
	if (!ele)
		return false;

	this.ele = ele;

	this.from = from;
	this.to = to;

	this.callback = callback;

	this.nDur = fadetime;

	this.nInt = 50;
	this.nTime = 0;

	var p = this;
	this.nID = setInterval(function() { p._fade() }, this.nInt);
}

_bsn.Fader.prototype._fade = function()
{
	this.nTime += this.nInt;

	var ieop = Math.round( this._tween(this.nTime, this.from, this.to, this.nDur) * 100 );
	var op = ieop / 100;

	if (this.ele.filters) // internet explorer
	{
		try
		{
			this.ele.filters.item("DXImageTransform.Microsoft.Alpha").opacity = ieop;
		} catch (e) {
			// If it is not set initially, the browser will throw an error.  This will set it if it is not set yet.
			this.ele.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(opacity='+ieop+')';
		}
	}
	else // other browsers
	{
		this.ele.style.opacity = op;
	}


	if (this.nTime == this.nDur)
	{
		clearInterval( this.nID );
		if (this.callback != undefined)
			this.callback();
	}
}

_bsn.Fader.prototype._tween = function(t,b,c,d)
{
	return b + ( (c-b) * (t/d) );
}
