var algebraix = algebraix || {};

algebraix.standard_functions =  (function() {
/* First attempt to add some namespacing for standard JS functions, to aid organization in the future.
   Try to add new functions under the algebraix namespace. */
	'use strict';

	return {
		ok_text: 'Ok',
		is_canvas_supported: function (){
			var elem = document.createElement('canvas');
			return !!(elem.getContext && elem.getContext('2d'));
		},

		plot_flot_data: function (json, placeholder_div, width, height, opts) {

			//is bars so set the correct height
			if ( json.flot_options.hasOwnProperty('bars')){
				height = 800;
			}

			if (typeof width === "undefined") {
				width = 600;
			}
			if (typeof height === "undefined") {
				height = 400;
			}
			if (typeof opts === "undefined") {
				opts = {};
			}
			if (typeof opts.printable === "undefined") {
				opts.printable = false;
			}
			// Flot plot won't work unless the placeholder already has dimensions set
			$(placeholder_div).width(width);
			$(placeholder_div).height(height);
			if (opts.printable && !algebraix.standard_functions.is_canvas_supported()) {
				/* HACK: For reasons unknown, the first slice of the first Flot pie chart always disappears
					when printing in IE8. So here we have to add a dummy pie chart, and then hide it, so that the next
					pie chart (the real 1st one) prints properly */
				if ($('#dummy_pie').length === 0 ){
					var fake_div = $("<div>", {id: "dummy_pie", height: 600, width: 600});
					$('body').prepend(fake_div);
					$.plot($(fake_div), [[1, 1]], { series: { pie: { show: true } } });
					fake_div.hide();
				}
				//As if the above wasn't enough, we also need to do this or the graph will be positioned off the page
				$(placeholder_div).css({'text-align': 'left'});
			}

			if (!opts.hidden_parent) {
				if(placeholder_div == "#sessions_by_country"){
					json.flot_options['grid']['clickable'] = true;
					$.plot($(placeholder_div), json.chart_data, json.flot_options);
					$(placeholder_div).bind("plotclick", function (event, pos, item) {
					    // axis coordinates for other axes, if present, are in pos.x2, pos.x3, ...
					    // if you need global screen coordinates, they are pos.pageX, pos.pageY

					    if (item) {
					    	var label = '';
					    	if(item['series']['xaxis']['ticks'].length == 0){
					    		label = item['series']['xaxis']['rotatedTicks'][item.dataIndex]['label'];
					    	}else{
					    		label = item['series']['xaxis']['ticks'][item.dataIndex]['label'];
					    	}
					        detailed_info(label);
					    }
					});
					$(placeholder_div).bind("plothover", function(event, pos, item) {
					  if(item){
					    $(placeholder_div).css("cursor", "pointer");
					  }else{
					    $(placeholder_div).css("cursor", "default");
					  }
					});
				}else{
					$.plot($(placeholder_div), json.chart_data, json.flot_options);
				}
			}
			else {
				// Divs need to be initially visible or Flot will fail to plot the graph correctly
				$(opts.hidden_parent).show();
				$.plot($(placeholder_div), json.chart_data, json.flot_options);
				$(opts.hidden_parent).hide();

			}
		},

		get_chart_data_and_plot: function(data, placeholder_div, width, height, opts) {
			/* Function for plotting Flot chart data retrieved via templating or AJAX */
			if (typeof data === "string") {
				// Ajax - assume URL
				$.ajax({
					url: data,
					cache: false,
					success: function(json) {
						algebraix.standard_functions.plot_flot_data(json, placeholder_div, width, height, opts);
					}
				});

			} else if (typeof data === "object") {
				// Templated - assume JSON object
				algebraix.standard_functions.plot_flot_data(data, placeholder_div, width, height, opts);
			}
		},
		css_error_input : function( element ) {
			$(element).addClass('material-form__input--error');
		},
		css_no_error_input : function( element ) {
			$(element).removeClass('material-form__input--error');
		},
		decode_html_entities : function (texto){
			return $("<div/>").html(texto).text();
		},
		show: function(id) {
			$(id).removeClass('d-none');
		},
		hide: function(id) {
			$(id).addClass('d-none');
		},
		is_hide: function(id) {
			return $(id).hasClass('d-none');
		},
		gradebook_conversion_color_canvas: function() {
			$('.GRADE_COLORS').each(function () {
				var c = document.createElement('canvas');
				var ctx = c.getContext('2d');

				c.width = 16;
				c.height = 10;

				var grd = ctx.createLinearGradient(0, 0, 0, 16);
				grd.addColorStop(0, $(this).css('background-color'));

				ctx.fillStyle = grd;
				ctx.fillRect(0, 0, 10, 16);

				$(this).after(c);
				$(this).hide();
			});
		},
		gradebook_conversion_color_canvas: function() {
			$('.GRADE_COLORS').each(function () {
				var c = document.createElement('canvas');
				var ctx = c.getContext('2d');

				c.width = 16;
				c.height = 10;

				var grd = ctx.createLinearGradient(0, 0, 0, 16);
				grd.addColorStop(0, $(this).css('background-color'));

				ctx.fillStyle = grd;
				ctx.fillRect(0, 0, 10, 16);

				$(this).after(c);
				$(this).hide();
			});
		},
		keysort_array_objects: function ( array_objects, keysort ) {
			return array_objects.sort(function (a, b) {
				if (a[keysort] > b[keysort]) {
					return 1;
				}
				if (a[keysort] < b[keysort]) {
					return -1;
				}
				// a must be equal to b
				return 0;
			});
		},
		// @param searchText: text to filter several items
		// @param querySelectorItems: js query selector for each item to filter
		// @querySelectorTextItem: query selector where we have a text in the item to check to filter
		// @idElementHideEmpty: id of the dom element to hide when the filter get 0 results
		// @idElementShowEmpty: id of the dom element to show when the filter get 0 results
		filter: function ( searchText, querySelectorItems, querySelectorTextItem, idElementHideEmpty, idElementShowEmpty) {
			let fill = [...document.querySelectorAll(querySelectorItems)].map(
				gr => {
					return {
						element: gr,
						text: [...gr.querySelectorAll(querySelectorTextItem)].map( txt => remove_accents(txt.innerText.toLowerCase())).join('')
					}
				}
			);
			let anyResultsShow = false;
			if(!searchText.length){
				fill.forEach((item, i) => {
					anyResultsShow = true;
					item.element.classList.remove('d-none');
				});
			}else{
				let searching = remove_accents(searchText.toLowerCase());
				fill.forEach(elem => {
					let to_search = elem.text;
					const hideItem = to_search.indexOf(searching) == -1;
					elem.element.classList.toggle('d-none', hideItem);
					if( !hideItem ) {
						anyResultsShow = true;
					}
				});
			}
			if( !anyResultsShow ) {
				algebraix.standard_functions.hide('#'+idElementHideEmpty);
				algebraix.standard_functions.show('#'+idElementShowEmpty);
			}
			else {
				algebraix.standard_functions.show('#'+idElementHideEmpty);
				algebraix.standard_functions.hide('#'+idElementShowEmpty);
			}
		},
		// ip = IP v4/v6 address
		// ip_version = IPv4/IPv6 (IPv4 default)
		verify_ip_addresses: function(ip, ip_version = 'IPv4') {
			let regexIp = /^(\d{1,3}\.){3}\d{1,3}$/;
			let regexIpWithMask = /^(\d{1,3}\.){3}\d{1,3}\/([1-2]?[0-9]|3[0-2])$/;
			let regexIpAlgebraix = /^algebraix$/;

			if ( ip_version == 'IPv6' ) {
				ip = ip.trim();
				regexIp = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
				regexIpWithMask = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))(\/(12[0-8]|1[01][0-9]|[1-9]?[0-9]))?$/;
			}
			
			if ( regexIp.test(ip) || regexIpWithMask.test(ip) ) {
				return true;
			}

			if ( ip_version == 'IPv4' && regexIpAlgebraix.test(ip) ) {
				return true;
			}

			return false;
		}
	};
})();

function numbers_only(myfield, e, dec)
{
	var key;
	var keychar;

	if (window.event)
		key = window.event.keyCode;
	else if (e)
		key = e.which;
	else
		return true;
	keychar = String.fromCharCode(key);

	if ((key==null) || (key==0) || (key==8) || (key==9) || (key==13) || (key==27) )
		return true;
	else if (this.getSelection().toString().length == myfield.maxLength ) // we have selected text an is fully selected
		return true;
	else if ((("0123456789").indexOf(keychar) > -1)) {
		if (myfield.maxLength > 0 && myfield.value.length >= myfield.maxLength) {
			return false;
		}
		return true;
	}
	else if (dec && (keychar == ".")) {
		myfield.form.elements[dec].focus();
		return false;
	}
	else
		return false;
}

function number_commify(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + ',' + '$2');
	}
	return x1 + x2;
}

var cFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function currency_format(value){
	let multiple = value && typeof value === 'string' ? value.split(' ') : false;
	let result;
	if(multiple){
		result = multiple.reduce((joint, val) => {
			if(val.trim().length && val.trim() !== '\n'){
				if(joint.length){
					joint += '<br>';
				}
				joint += cFormatter.format(parseFloat(val));
			}
			return joint;
		}, '');
	} else {
		result = cFormatter.format(value);
	}
	return result;
}

// Mostly for footable, keep text on columns but sort by numeric value of data-sort-value
function keepText(valueOrElement){
	valueOrElement = $(valueOrElement).text();
	return valueOrElement;
}
function useFloatSort(valueOrElement){
	var data = $(valueOrElement).data('sortValue');
	valueOrElement = data ? data : parseFloat($(valueOrElement).text());
	return parseFloat(valueOrElement);
}

function check_length_validation_keyup( myfield, dec, e ) {
	if(myfield.max && parseFloat( $(myfield).val() ) > parseFloat( myfield.max ) ){
		$(myfield).val( myfield.max );
	}
	if (myfield.maxLength > 0 && myfield.value.length > myfield.maxLength) {
		$(myfield).val( $(myfield).val().substr (0, myfield.maxLength ) );
		return;
	}
	if(isNaN(parseFloat( $(myfield).val() )) && $(myfield).val() != '.') {
		$(myfield).val($(myfield).val());
	}

	// we check the maxLength and decimal but in the keyup because the user can select some text and write
	if ( 'undefined' != typeof(dec) && dec > 0 ) {

		var stringRegExp = "\\.";
		var wholeStringRegExp = '';
		for (var i = 0; i < parseInt(dec); i++ ) {
			stringRegExp += "\\d";
		}

		var myRe = new RegExp( stringRegExp );

		var floatValue = parseFloat($(myfield).val());
		if ( myRe.exec( String(floatValue)) !== null  ) {
			var ind_point = floatValue.toString().indexOf('.');
			if ( ind_point >= 0 ) {
				if ( $(myfield).val().substring(ind_point,$(myfield).val().length-1).length  > dec  ){
					$(myfield).val( $(myfield).val().substr (0, ind_point + dec + 1 ) );
				}
			}
		}
	}
}
function money_only(myfield, e, dec )
{
	// key
	var key;
	var keychar;
	if (window.event)
		key = window.event.keyCode;
	else if (e)
		key = e.which;
	else
		return true;
	keychar = String.fromCharCode(key);
	//keyup validation
	var eventos = $._data( myfield, 'events' );
	var has_key_up_val = 0;
	if ( eventos && eventos.keyup) {
		$.each( eventos.keyup, function(i,o) {
		    if( o.handler.toString().indexOf('check_length_validation_keyup') != -1 )  {
			    has_key_up_val = 1;
		    }
		});
	}
	if( !has_key_up_val ) {
		$(myfield).on('keyup', function ( event ) {
			check_length_validation_keyup(myfield, dec, event) ;
		});
	}
	var validInput = "0123456789";
	if ((key===null) || (key===0) || (key==8) || (key==9) || (key==13) || (key==27) )
		return true;
	else if (validInput.indexOf(keychar) > -1) {
		return true;
	}
	else if ((key==46)) {
		return ( String(myfield.value).match(/\./) === null ) ? true : false;
	}
	else
		return false;
}

function number_between_0_1000(number){
        if ( !isNaN( number ) && 0 <= number && 1000 >= number ) return true;
        return false;
}

function link_new_window(url, web_base) {

	var re = /^https*\:\/\/.*/i;
	var redirect;

	if (url.match(re)) {
		redirect = url;
	}
	else {
		redirect = 'http://' + url;
	}

	if (web_base) {
		redirect = web_base + url;
	}

	window.open (redirect,"mywindow","width=1024,height=800,toolbar=yes,location=yes,directories=yes,status=yes,menubar=yes,scrollbars=yes,copyhistory=yes,resizable=yes");

}

function help_window(url) {

	var re = /^https*\:\/\/.*/i;
	var redirect;

	if (url.match(re)) {
		redirect = url;
	}
	else {
		redirect = 'http://' + url;
	}

	window.open(redirect,"_blank");

}

function get_div(div) {

	var divCollection	= document.getElementsByTagName("div");
	var d;

	for (var c = 0; c < divCollection.length; c++)
	{
		if (divCollection[c].getAttribute("id") == div)
			d = divCollection[c];
	}

	return(d);

}

function hide_div(divId) {
	document.getElementById(divId).style.display = 'none';
}

function expand_and_hide_div(div_number) {

	var div_name = "_d_" + div_number;
	var image_name = "_i_" + div_number;
	var divs = document.getElementById(div_name).style;
	divs.display = divs.display ? "" : "none";

	if (document[image_name])
	{
		document[image_name].src = divs.display ? "/images/icons/expand.gif" : "/images/icons/contract.gif";
	}
	else
	{
		document.all[image_name].src = divs.display ? "/images/icons/expand.gif" : "/images/icons/contract.gif";
	}

}

function highlight_row(obj, newClass) {
	obj.className = newClass;
}

function add_to_list(form_name, hidden_name, select_name, hidden_value, select_value) {

	var soptions 	 = document.forms[form_name][select_name].options;
	var next_option  = soptions.length;
	var found	 = false;

	if (next_option > 0) for (var c = 0; c < soptions.length; c++) if (soptions[c].value == hidden_value) found = true;

	if (found == false)
	{
		soptions[next_option] = new Option(select_value, hidden_value);
		update_hidden_value_from_list(form_name, select_name, hidden_name);
	}

}

function delete_from_list(form_name, hidden_name, select_name, hidden_value) {

	var soptions = document.forms[form_name][select_name].options;

	if (soptions.length > 0)
	{
		for (var c = 0; c < soptions.length; c++)
		{
			if (soptions[c].value == hidden_value) soptions[c] = "";
			update_hidden_value_from_list(form_name, select_name, hidden_name);
		}
	}

}

function delete_selected_from_list(form_name, select_name, hidden_name) {

	var soptions 	= document.forms[form_name][select_name].options;
	var sindex 	= get_selected_option(form_name, select_name);

	if (soptions.length > 0)
	{
		soptions[sindex] = "";
		update_hidden_value_from_list(form_name, select_name, hidden_name);
	}

}

function get_selected_option(form_name, select_name) {

	var soptions = document.forms[form_name][select_name].options;

	for (var c = 0; c < soptions.length; c++)
	{
		if (soptions[c].selected) return(c);

	}

}

function update_hidden_value_from_list(form_name, select_name, hidden_name) {

	var soptions = document.forms[form_name][select_name].options;
	var hidden   = document.forms[form_name][hidden_name];
	hidden.value = "";

	for (var c = 0; c < soptions.length; c++)
	{
		hidden.value = hidden.value + soptions[c].value + ",";
	}

}

function clearStatus(){
	$("#all-alerts .row .snackbar").remove();
}

function dismissSnackbar(element) {
	//element.parentNode.parentNode.setAttribute('style', 'display:none');
	$(element).closest('.snackbar').remove();
}


function userColor(user) {
	switch (user) {
		case 'student':
			return 'text-blue';
		case 'teacher':
			return 'text-yellow';
		case 'admin':
			return 'text-red';
		case 'parent':
			return 'text-purple';
		case 'operator':
			return 'text-green';
		case 'personnel':
			return 'text-orange';
		default:
			return 'text-dark'
	}
}

function snackBar(snackColor, title, btn,  exit) {

	if(snackColor == ''){
		color = 'snackbar--dark';
		btn = 'btn-text-light';
	}

	if(exit == '' || exit == undefined){
		exit = 'scale-exit';
	} else {
		exit = '';
	}

	var accept = 'accept';
	if (__LANGUAGE_CODE == 'ES'){
		accept = 'Aceptar'
	}

	var HTML = '<div class="snackbar ' + snackColor + ' ' + exit + ' ">' +
		'<div class="snackbar__text"><span class="snackbar__text--primary">' + title + '</span></div>' +
			'<div class="snackbar__action">' +
                '<button type="button" class="btn ' + btn + '" onClick="dismissSnackbar(this)">'+accept+'</button>' +
			'</div>' +
		'</div>';

	if($('#all-alerts').length){
		$('#all-alerts').html('');
		$('#all-alerts').append(HTML);
	}else{
        if($('.loading-container').length){
            $('.loading-container').remove();
        }
		$('#inner-container').append(HTML);

	}

}


function display_error(strInfo, divId) {

	if (typeof divId == 'undefined') {
		divId = 'box_status_message';
		scroll(0,0);
	}
	var accept = 'accept';
	if (typeof __LANGUAGE_CODE == "undefined" || __LANGUAGE_CODE == 'ES' ){
		accept = 'Aceptar'
	}

	var HTML = '<div class="snackbar snackbar--red">' +
		'<i class="fas fa-circle-exclamation snackbar__icon"></i>' +
		'<div class="snackbar__text"><span class="snackbar__text--primary">' + strInfo + '</span></div>' +
		'<div class="snackbar__action">' +
		'<button type="button" class="btn btn-text--light" onClick="dismissSnackbar(this)">'+accept+'</button>' +
		'</div>' +
		'</div>';

	var d = document.getElementById(divId);

	if ( d === null ) {
		var main_content_div = document.getElementById('all-alerts');
		if ( main_content_div === null ){
			var inner_container = document.getElementById('inner-container');
			inner_container.innerHTML = "<div id='all-alerts'></div>";
			main_content_div = document.getElementById('all-alerts');
		}

		main_content_div.innerHTML = "<div id='box_status_message'></div>";
		d = document.getElementById('box_status_message');
	}
	if ( strInfo ) {
		$(d).html(HTML).show();
	}
	let algeForms = document.querySelectorAll('form[data-block_form_button]');
	if ( algeForms.length ) {
		setTimeout( function() {
			algeForms.forEach(algeForm => {
				algeForm.querySelectorAll('button[type=submit], input[type=submit]').forEach(inputElement => {
					inputElement.classList.remove('disabled');
					inputElement.disabled = false;
				});
				let submitSentinel = document.getElementById(algeForm.name + '_submit_clicked');
				if(submitSentinel){
					submitSentinel.value = 0;
				}
			});
		}, 500 );
	}

}

function display_error_url(strInfo, divId = undefined, url, external = false) {

	if (typeof divId == 'undefined') {
		divId = 'box_status_message';
		scroll(0,0);
	}
	var accept = 'Go';
	if (__LANGUAGE_CODE == 'ES'){
		accept = 'Ir'
	}
	let hrefAnotherTab='';
	if(external)
		hrefAnotherTab = 'target="_blank"'

	var address = btoa(url + '&x_load=' + (Math.random() * 1024));

	var HTML = '<div class="snackbar snackbar--red">' +
		'<i class="fas fa-circle-exclamation snackbar__icon"></i>' +
		'<div class="snackbar__text"><span class="snackbar__text--primary">' + strInfo + '</span></div>' +
		'<div class="snackbar__action">' +
		'<a type="button" href="'+ url +'" rel="address:/'+ address +'" '+hrefAnotherTab+' class="btn btn--outline--white">'+accept+'</a>' +
		'</div>' +
		'</div>';

	var d = document.getElementById(divId);

	if ( d === null ) {
		var main_content_div = document.getElementById('all-alerts');
		main_content_div.innerHTML = "<div id=box_status_message></div>";
		d = document.getElementById('box_status_message');
	}

	$(d).html(HTML).show();
	if ( $("form[data-block_form_button]").length ) {
		setTimeout( function() {
			$("button[type=submit]").removeAttr('disabled').removeClass('blocked_button');
			$("input[type=submit]").removeAttr('disabled').removeClass('blocked_button');
		}, 500 );
	}

}

function display_error_redirect(strInfo, divId = undefined, redirect_url) {

	if (typeof divId == 'undefined') {
		divId = 'box_status_message';
		scroll(0,0);
	}
	var accept = 'accept';
	if (typeof __LANGUAGE_CODE == "undefined" || __LANGUAGE_CODE == 'ES' ){
		accept = 'Aceptar'
	}
	var HTML = '<div class="snackbar snackbar--red">' +
		'<i class="fas fa-circle-exclamation snackbar__icon"></i>' +
		'<div class="snackbar__text"><span class="snackbar__text--primary">' + strInfo + '</span></div>' +
		'<div class="snackbar__action">' +
		'<button type="button" onClick="window.location.href=\''+ redirect_url +'\'" class="btn btn-text--light">'+accept+'</button>' +
		'</div>' +
		'</div>';

	var d = document.getElementById(divId);

	if ( d === null ) {
		var main_content_div = document.getElementById('all-alerts');
		main_content_div.innerHTML = "<div id=box_status_message></div>";
		d = document.getElementById('box_status_message');
	}

	$(d).html(HTML).show();
	if ( $("form[data-block_form_button]").length ) {
		setTimeout( function() {
			$("button[type=submit]").removeAttr('disabled').removeClass('blocked_button');
			$("input[type=submit]").removeAttr('disabled').removeClass('blocked_button');
		}, 500 );
	}

}

function display_info(strInfo, divId, append) {

	if (typeof divId == 'undefined') {
		divId = 'box_status_message';
		scroll(0,0);
	}
	else if ( append === true ) {
		var new_d = "<div id="+divId+"></div>";
		$('#box_status_message').after( $(new_d) );
	}

	var accept = 'accept';
	if (__LANGUAGE_CODE == 'ES'){
		accept = 'Aceptar'
	}

	var HTML = '<div class="snackbar snackbar--dark">' +
		'<i class="fas fa-info snackbar__icon"></i>' +
		'<div class="snackbar__text"><span class="snackbar__text--primary">' + strInfo + '</span></div>' +
		'<div class="snackbar__action">' +
			'<button type="button" class="btn btn-text--light" onClick="dismissSnackbar(this)">'+accept+'</button>' +
		'</div>' +
		'</div>';

	var d = document.getElementById(divId);

	if ( d === null ) {
		var main_content_div = document.getElementById('all-alerts');
		if ( main_content_div === null ){
			var inner_container = document.getElementById('inner-container');
			inner_container.innerHTML = "<div id='all-alerts'></div>";
			main_content_div = document.getElementById('all-alerts');
		}
		main_content_div.innerHTML = "<div id=box_status_message></div>";
		d = document.getElementById('box_status_message');
	}

	$(d).html(HTML).show();

}

function display_info_url(strInfo, divId, url) {

	if (typeof divId == 'undefined') {
		divId = 'box_status_message';
		scroll(0,0);
	}

	var accept = 'Go';
	if (__LANGUAGE_CODE == 'ES'){
		accept = 'Ir'
	}

	var HTML = '<div class="snackbar snackbar--dark">' +
		'<i class="fas fa-info snackbar__icon"></i>' +
		'<div class="snackbar__text"><span class="snackbar__text--primary">' + strInfo + '</span></div>' +
		'<div class="snackbar__action">' +
			'<a type="button" href="'+ url +'" class="btn btn--outline--white">'+accept+'</a>' +
		'</div>' +
		'</div>';

	var d = document.getElementById(divId);

	if ( d === null ) {
		var main_content_div = document.getElementById('all-alerts');
		main_content_div.innerHTML = "<div id=box_status_message></div>";
		d = document.getElementById('box_status_message');
	}

	$(d).html(HTML).show();

}

function display_alert(strInfo, divId) {

	if (typeof divId == 'undefined') {
		divId = 'box_status_message';
		scroll(0,0);
	}
	
	var accept = 'accept';
	if (__LANGUAGE_CODE == 'ES'){
		accept = 'Aceptar'
	}

	var HTML = '<div class="snackbar snackbar--orange">' +
		'<i class="fas fa-triangle-exclamation snackbar__icon"></i>' +
		'<div class="snackbar__text"><span class="snackbar__text--primary">' + strInfo + '</span></div>' +
		'<div class="snackbar__action">' +
			'<button type="button" class="btn btn-text--dark" onClick="dismissSnackbar(this)">'+accept+'</button>' +
		'</div>' +
		'</div>';

	var d = document.getElementById(divId);

	if ( d === null ) {
		var main_content_div = document.getElementById('all-alerts');
		if ( main_content_div === null ){
			var inner_container = document.getElementById('inner-container');
			inner_container.innerHTML = "<div id='all-alerts'></div>";
			main_content_div = document.getElementById('all-alerts');
		}
		main_content_div.innerHTML = "<div id=box_status_message></div>";
		d = document.getElementById('box_status_message');
	}

	$(d).html(HTML).show();
}

function display_warning(strInfo, divId) {

	if (typeof divId == 'undefined') {
		divId = 'box_status_message';
		scroll(0,0);
	}

	var accept = 'accept';
	if (__LANGUAGE_CODE == 'ES'){
		accept = 'Aceptar'
	}

	var HTML = '<div class="snackbar snackbar--yellow">' +
		'<i class="fas fa-triangle-exclamation snackbar__icon"></i>' +
		'<div class="snackbar__text"><span class="snackbar__text--primary">' + strInfo + '</span></div>' +
		'<div class="snackbar__action">' +
			'<button type="button" class="btn btn-text--dark" onClick="dismissSnackbar(this)">'+accept+'</button>' +
		'</div>' +
		'</div>';

	var d = document.getElementById(divId);

	if ( d === null ) {
		var main_content_div = document.getElementById('all-alerts');
		if ( main_content_div === null ){
			var inner_container = document.getElementById('inner-container');
			inner_container.innerHTML = "<div id='all-alerts'></div>";
			main_content_div = document.getElementById('all-alerts');
		}
		main_content_div.innerHTML = "<div id=box_status_message></div>";
		d = document.getElementById('box_status_message');
	}

	$(d).html(HTML).show();

}

function display_warning_url(strInfo, divId, url) {

	if (typeof divId == 'undefined') {
		divId = 'box_status_message';
		scroll(0,0);
	}

	var accept = 'Go';
	if (__LANGUAGE_CODE == 'ES'){
		accept = 'Ir'
	}

	var HTML = '<div class="snackbar snackbar--yellow">' +
		'<i class="fas fa-triangle-exclamation snackbar__icon"></i>' +
		'<div class="snackbar__text"><span class="snackbar__text--primary">' + strInfo + '</span></div>' +
		'<div class="snackbar__action">' +
			'<a type="button" href="'+ url +'" class="btn btn--outline--white">'+accept+'</a>' +
		'</div>' +
		'</div>';

	var d = document.getElementById(divId);

	if ( d === null ) {
		var main_content_div = document.getElementById('all-alerts');
		main_content_div.innerHTML = "<div id=box_status_message></div>";
		d = document.getElementById('box_status_message');
	}

	$(d).html(HTML).show();

}

function display_loading( SPECIFIC_DIV_ID ) {
	var DIV_ID = 'box_status_message';
	//var msj    = document.getElementById(DIV_ID).getAttribute('data-message');
	if ( SPECIFIC_DIV_ID ) {
		DIV_ID = SPECIFIC_DIV_ID;
	}

	var HTML = '<div class="loading-container">\n' +
		'    <svg class="loading-container--loader" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="150px" height="150px" viewBox="0 0 60 45" enable-background="new 0 0 45 35" xml:space="preserve">\n' +
		'\n' +
		'  <path class="path" fill="#FFFFFF" stroke="#000000" stroke-width="4" stroke-miterlimit="10" d="M66.039,133.545c0,0-21-57,18-67s49-4,65,8\n' +
		'\ts30,41,53,27s66,4,58,32s-5,44,18,57s22,46,0,45s-54-40-68-16s-40,88-83,48s11-61-11-80s-79-7-70-41\n' +
		'\tC46.039,146.545,53.039,128.545,66.039,133.545z"></path>\n' +
		'\n' +
		'        <path class="bar-yellow" d="M41.7,20.7h-3.6c-0.3,0-0.6,0.1-0.8,0.3c-0.2,0.2-0.4,0.4-0.5,0.6l-5.6,11.6h3.6c0.3,0,0.6-0.1,0.8-0.3\n' +
		'\t\t\t\tc0.2-0.2,0.4-0.4,0.5-0.6L41.7,20.7z"></path>\n' +
		'        <path class="bar-red" d="M45.3,26.5H42c-0.3,0-0.6,0.1-0.8,0.3c-0.2,0.2-0.4,0.4-0.5,0.6l-2.8,5.8h3.4c0.3,0,0.6-0.1,0.8-0.3\n' +
		'\t\t\t\tc0.2-0.2,0.4-0.4,0.5-0.6L45.3,26.5z"></path>\n' +
		'        <path class="bar-blue" d="M33.4,15.3c-0.2,0.2-0.4,0.4-0.5,0.6l-4,8.4l-4.3,8.9h3.7c0.3,0,0.6-0.1,0.8-0.3c0.2-0.2,0.4-0.4,0.5-0.6\n' +
		'\t\t\t\tl7.6-15.7L38,15h-3.7C33.9,15,33.7,15.1,33.4,15.3z"></path>\n' +
		'\n' +
		'        <path class="" fill="none" stroke="#E3E1E8" stroke-width="3" d="M22.2,31.9l-6,0.1c0,0-3.4,0.3-3.4-2.7c0-2.9,3.7-2.8,3.7-2.8h3.8c0,0-2.2-3.8,0.5-7.4\n' +
		'\t\t\t\tc2.6-3.4,6.5-2.7,6.5-2.7s-0.1-5.9,6.5-7.2c6.8-1.3,8.9,6,8.9,6"></path>\n' +
		'\n' +
		'        <path class="cloud" fill="none" stroke="#112aa9" stroke-width="3" d="M22.2,31.9l-6,0.1c0,0-3.4,0.3-3.4-2.7c0-2.9,3.7-2.8,3.7-2.8h3.8c0,0-2.2-3.8,0.5-7.4\n' +
		'\t\t\t\tc2.6-3.4,6.5-2.7,6.5-2.7s-0.1-5.9,6.5-7.2c6.8-1.3,8.9,6,8.9,6"></path>\n' +
		'</svg>\n' +
		'</div>';

	var d = document.getElementById(DIV_ID);

	if ( d === null ) {
		var main_content_div = document.getElementById('all-alerts');
		main_content_div.innerHTML = "<div id=box_status_message></div>";
		d = document.getElementById('box_status_message');
	}

	$(d).addClass('d-flex').html(HTML).show();

}

function remove_loading(){
	if($('.loading-container').length){
		$('.loading-container').remove();
	}
}

function display_success(strInfo, divId) {

	if (typeof divId == 'undefined') {
		divId = 'box_status_message';
		scroll(0,0);
	}

	var accept = 'accept';
	if (typeof __LANGUAGE_CODE == "undefined" || __LANGUAGE_CODE == 'ES'){
		accept = 'Aceptar'
	}
	var HTML = '<div class="snackbar snackbar--green scale-exit-alert animation-delay--5">' +
		'<i class="fas fa-check snackbar__icon"></i>' +
		'<svg class="snackbar__svg " viewBox="0 0 40 40"><circle class="snackbar__circle animation-duration--5" cy="50%" cx="50%" r="16"></circle></svg>' +
		'<div class="snackbar__text break-word"><span class="snackbar__text--primary">' + strInfo + '</span></div>' +
		'<div class="snackbar__action">' +
			'<button type="button" class="btn btn-text--light" onClick="dismissSnackbar(this)">'+accept+'</button>' +
		'</div>' +
		'</div>';

	var d = document.getElementById(divId);

	if ( d === null ) {
		var main_content_div = document.getElementById('all-alerts');
		main_content_div.innerHTML = "<div id=box_status_message></div>";
		d = document.getElementById('box_status_message');
	}

	$(d).html(HTML).show();

}

function display_success_url(strInfo, divId,url) {

	if (typeof divId == 'undefined') {
		divId = 'box_status_message';
		scroll(0,0);
	}

	var accept = 'Go';
	if (__LANGUAGE_CODE == 'ES'){
		accept = 'Ir'
	}
	var HTML = '<div class="snackbar snackbar--green scale-exit-alert animation-delay--5">' +
		'<i class="fas fa-check snackbar__icon"></i>' +
		'<svg class="snackbar__svg " viewBox="0 0 40 40"><circle class="snackbar__circle animation-duration--5" cy="50%" cx="50%" r="16"></circle></svg>' +
		'<div class="snackbar__text"><span class="snackbar__text--primary">' + strInfo + '</span></div>' +
		'<div class="snackbar__action">' +
			'<a type="button" href="'+ url +'" class="btn btn--outline--white">'+accept+'</a>' +
		'</div>' +
		'</div>';

	var d = document.getElementById(divId);

	if ( d === null ) {
		var main_content_div = document.getElementById('all-alerts');
		main_content_div.innerHTML = "<div id=box_status_message></div>";
		d = document.getElementById('box_status_message');
	}

	$(d).html(HTML).show();

}

function flag_error_text_field(field) {
	field.style.border = '1px #b11b1d dotted';
}

function select_deselect_all_checkboxes(form_name) {

	var cb 		= document.getElementById('checkbox_controller');
	var form	= document.forms[form_name];

	if (cb.checked == true ) {
		for (var c = 0; c < form.elements.length; c++) {
			if (form.elements[c].type == "checkbox") {
				form.elements[c].checked = true;
			}
		}
	}
	else if (cb.checked == false ) {
		for (var c = 0; c < form.elements.length; c++) {
			if (form.elements[c].type == "checkbox") {
				form.elements[c].checked = false;
			}
		}
	}

}

function add_to_text_field(form_name, field_name, hidden_name, hidden_value, field_value) {
	document.forms[form_name][field_name].value 	= field_value;
	document.forms[form_name][hidden_name].value 	= hidden_value;
}

function delete_from_text_field(form_name, field_name, hidden_name) {
	document.forms[form_name][field_name].value 	= "";
	document.forms[form_name][hidden_name].value 	= "";
}

function increase_textarea_size(textarea_id) {
	var d 		= document.getElementById(textarea_id);
	var height	= (d.style.height.substring(0,(d.style.height.length-2)) * 1);
	d.style.height	= (height + 50).toString() + 'px';
}

function decrease_textarea_size(textarea_id) {

	var d 		= document.getElementById(textarea_id);
	var height	= (d.style.height.substring(0,(d.style.height.length-2)) * 1);

	if ((height - 50) < 15) {
		d.style.height		= (height - 50).toString() + 'px';
	}
	else {
		d.style.height		= (height - 50).toString() + 'px';
	}

}

function switch_tab(id, max_ids) {

	for (var c = 1; c <= max_ids; c++)
	{

		var tab		= document.getElementById("_t_" + c);
		var div		= document.getElementById("_tc_" + c);

		if (c == id)
		{
			tab.className 		= 'active';
			div.style.display	= 'block';
		}
		else
		{
			tab.className 		= '';
			div.style.display	= 'none';
		}

	}

}

function remove_accents(s) {

	var r=s.toLowerCase();

	r = r.replace(new RegExp(/[\u00E0-\u00E5]/g),"a");
	r = r.replace(new RegExp(/[\u00E8-\u00EB]/g),"e");
	r = r.replace(new RegExp(/[\u00EC-\u00EF]/g),"i");
	r = r.replace(new RegExp(/\u00F1/g),"n");
	r = r.replace(new RegExp(/[\u00F2-\u00F6]/g),"o");
	r = r.replace(new RegExp(/[\u00F9-\u00FC]/g),"u");

	return r;

};

function accents_to_html(s) {

	var r=s.toLowerCase();

	r = r.replace(new RegExp(/[àáâãäå]/g),"&aacute;");
	r = r.replace(new RegExp(/[èéêë]/g),"&eacute;");
	r = r.replace(new RegExp(/[ìíîï]/g),"&iacute;");
	r = r.replace(new RegExp(/ñ/g),"&ntilde;");
	r = r.replace(new RegExp(/[òóôõö]/g),"&oacute;");
	r = r.replace(new RegExp(/[ùúûü]/g),"&uacute;");
	r = r.replace(new RegExp(/[À]/g),"&iquest;");
	r = r.replace(new RegExp(/[Á]/g),"&iexcl;");

	return r;

};

function convert_table_to_excel(TABLE_IDS, URL, FILENAME, SHEET_NAMES, REPLACE_ALL_BOOLEANS) {

	var TABLES = new Array();

	var NODE = null;
	var insert = null;
	var custom = null;

	for (var c in TABLE_IDS) {
		if ( document.getElementById(TABLE_IDS[c]) ) {
			//fix for tables that have filter and duplicate headers Ticket: ALG-T5277
			/************** Remove filtering row **************/
			var table = document.getElementById(TABLE_IDS[c]);
			var filteringRow;
			if (table) {
				let thead = table.querySelector('thead');
				if (thead) {
					let _filteringRow = thead.querySelector('tr.footable-filtering:first-child');
					filteringRow = _filteringRow;
					if (_filteringRow) {
						_filteringRow.remove();
					}
				}
			}
			/************** Remove filtering row **************/

			var toUpdate = document.getElementById(TABLE_IDS[c]).querySelectorAll("tr td i.fa-circle-xmark , tr td i.fa-circle-check, tr td i.text-custom-algebraix");
			$.each(toUpdate, function(index, value) {
				insert = false;
				if(value.className.match(/text-custom-algebraix/) && !value.hasChildNodes() ){
					custom = value.className.match(/text-custom_\S*/);
					NODE = document.createElement('label');
					if (custom && custom[0]) {
						custom = custom[0].split('_');
						custom = custom[1] ? custom[1] : custom[0];
						NODE.innerText = `2_${custom}`;
					}else{
						NODE.innerText = `2_`;
					}
					NODE.className = 'hidden';
					insert = true;
				}else if(value.className.match(/text-green/) && !value.hasChildNodes() ){
					NODE = document.createElement('label');
					NODE.innerText = "0_";
					NODE.className = 'hidden';
					insert = true;
				}else if(value.className.match(/text-red/) && !value.hasChildNodes() ){
					NODE = document.createElement('label');
					NODE.innerText = "1_";
					NODE.className = 'hidden';
					insert = true;
				}
				if(insert){
					value.appendChild(NODE);
				}
				NODE = null;
			});

			var HEADER_ID = 'HEADER_' + TABLE_IDS[c];
			var HEADER_DATA = '';

			if ( document.getElementById(HEADER_ID) ) {
				HEADER_DATA = document.getElementById(HEADER_ID).innerHTML;
			}

			TABLES[c] = {
				header : HEADER_DATA,
				data : document.getElementById(TABLE_IDS[c]).innerHTML
			};

			/************** Add filtering row **************/
			if (table) {
				let thead = table.querySelector('thead');
				if (thead && filteringRow) {
					thead.insertBefore(filteringRow, thead.firstChild);
				}
			}
			/************** Add filtering row **************/
		}
	}

	var jsonValue = JSON.stringify(TABLES);

	var FORM = document.createElement("FORM");
	FORM.method = "POST";
	FORM.action = URL;

	var INPUT = document.createElement("INPUT");
	INPUT.name = "tables";
	INPUT.type = "HIDDEN";
	INPUT.value = jsonValue;
	FORM.appendChild(INPUT);

	//For excel header data (report_name variable)
	var report_name = document.createElement("INPUT");
	report_name.name = "report_name";
	report_name.type = "HIDDEN";
	if( FILENAME !== undefined ){
		report_name.value = FILENAME.substring(0, FILENAME.lastIndexOf('.'));
	}else{
		report_name.value = 'Algebraix';
	}
	FORM.appendChild(report_name);

	if ( FILENAME !== undefined ) {
		var INPUT_FILENAME = document.createElement("INPUT");
		INPUT_FILENAME.name = "filename";
		INPUT_FILENAME.type = "HIDDEN";
		INPUT_FILENAME.value = FILENAME;
		FORM.appendChild(INPUT_FILENAME);
	}

	if ( SHEET_NAMES !== undefined && SHEET_NAMES.length > 0 ) {
		var INPUT_SHEET_NAMES = document.createElement("INPUT");
		INPUT_SHEET_NAMES.name = "sheet_names";
		INPUT_SHEET_NAMES.type = "HIDDEN";
		INPUT_SHEET_NAMES.value = remove_accents( JSON.stringify(SHEET_NAMES) );
		FORM.appendChild(INPUT_SHEET_NAMES);
	}

	if ( REPLACE_ALL_BOOLEANS !== undefined ) {
		var INPUT_REPLACE_ALL_BOOLEANS = document.createElement("INPUT");
		INPUT_REPLACE_ALL_BOOLEANS.name = "replace_all_booleans";
		INPUT_REPLACE_ALL_BOOLEANS.type = "HIDDEN";
		INPUT_REPLACE_ALL_BOOLEANS.value = 1;
		FORM.appendChild(INPUT_REPLACE_ALL_BOOLEANS);
	}

	document.body.appendChild(FORM);
	FORM.submit();
	document.body.removeChild(FORM);

}

function number_pad(NUMBER, LENGTH){

	var RESULT = '' + NUMBER;

	while ( RESULT.length < LENGTH ) {
		RESULT = '0' + RESULT;
	}

	return RESULT;

}

// return a string if your arg is a string, empty string otherwise
function string_or_empty(x) {
	return ( typeof(x) === 'string' ) ? x : ( ( typeof(x) === 'number' ) ? String(x) : '' );
}

// fixed point rounding : all values should be expressed as n x 10e-3, that is, 8.5 should be 8500
// takes an object with the following keys:
// approved_method 	: scalar rounding method
// failed_method	: scalar
// failed_value		: scalar
// minimum_possible	: scalar
// minimum_passing	: scalar
// grade		: scalar
// returns rounded grade x 10e-3
function fp_rounded_grade(x) {

	var method;
	var rounded_grade;
	var grade = parseInt(x.grade);

	if ( x.minimum_passing === undefined || grade >= x.minimum_passing ) {
		method = x.approved_method;
	}
	else {
		method = x.failed_method;
	}

	if ( x.minimum_possible !== undefined && grade < x.minimum_possible ) grade = x.minimum_possible;

	switch ( method ) {
	case 'WHOLE':
		rounded_grade = grade + 500;
		rounded_grade = rounded_grade - ( rounded_grade % 1000 );
		break;
	case 'WHOLE6':
		if ( ( (grade / 100) % 10 ) >= 6  )
		{
			rounded_grade = grade + 500;
			rounded_grade = rounded_grade - ( rounded_grade % 1000 );
		}

		else
		{
			rounded_grade = grade;
		}

		break;
	case 'DECIMAL1':
		rounded_grade = grade + 50;
		rounded_grade = rounded_grade - ( rounded_grade % 100 );
		break;
	case 'DECIMAL2':
		rounded_grade = grade + 5;
		rounded_grade = rounded_grade - ( rounded_grade % 10 );
		break;
	case 'CUTWHOLE':
		rounded_grade = grade - ( grade % 1000 );
		break;
	case 'CUT':
		rounded_grade = grade - ( grade % 100 );
		break;
	case 'CUT2':
		rounded_grade = grade - ( grade % 10 );
		break;
	case 'SPECIFIC':
		rounded_grade = x.failed_value;
		break;
	default:
		rounded_grade = grade;
	}

	if ( x.minimum_possible !== undefined && rounded_grade < x.minimum_possible ) rounded_grade = x.minimum_possible;

	return rounded_grade;
}

// convert n to n x10e-3, that is, 8.532 => 8532
// that keeps our significant digits in integer realm, which avoids most binary fraction problems
// such as 0.3 + 0.6 = 0.899, turns to 300+600=900, no problem
function fp_convert(x) {

	if ( isNaN(parseFloat(x)) ) return 0;

	// we're not using parseFloat to avoid breaking values such as 0.1
	// we'll use string fu instead
	var input = String(x).replace(/\s/g,'');
	var output = 0;
	if ( input.match(/^(\d+|\d+\.\d+)$/) === null ) return 0;

	// we'll shift the decimal dot three spaces to the right
	var shift = 3;

	// however, if this is a floating point value already then we'll be shifting less
	while ( input.match(/\./) !== null ) {
		input = input.replace(/\.(\d)/,'$1.').replace(/\.$/,'');
		shift--;
	}

	// by this point "input" should be an integer
	output = parseInt(input) * Math.pow(10, shift);
	// and we want output to be an integer as well
	output = parseInt(output);

	return output;

}

// convert n x10e-3 to n, that is, 8532 => 8.532
// but do it with string manipulation to avoid lossage when calculating something such as 0.9
// x	: integer to be converted
// n	: integer, optional decimal positions --- no rounding, truncation, 3 positions max
function fp_revert(x,n) {

	// we won't use parseFloat or all our work will go to waste
	// instead we have to do some string fu
	var num = '00000' + parseInt(x);
	num = num.replace(/^.*(.{7})$/,'$1').replace(/(.{3})$/,'.$1').replace(/^0*/,'');
	if ( undefined !== n && ! isNaN(parseInt(n)) && parseInt(n) >= 0 && parseInt(n) <= 3 ) {
		var ii = -3 + parseInt(n);
		while ( ii < 0 ) {
			num = num.replace(/\d$/, '');
			ii++;
		}
		num = num.replace(/\.$/, '');
	}
	return num;

}

function fp_get_decimals(x) {

	var APPROVED = ( x.grade >= x.minimum_passing ) ? true : false;
	var DECIMALS = 1;
	var METHOD = APPROVED ? x.approved_method : x.failed_method;

	switch ( METHOD ) {
	case 'WHOLE':
		DECIMALS = 0;
		break;
	case 'WHOLE6':
		DECIMALS = 0;
		break;
	case 'DECIMAL1':
		DECIMALS = 1;
		break;
	case 'DECIMAL2':
		DECIMALS = 2;
		break;
	case 'CUTWHOLE':
		DECIMALS = 0;
		break;
	case 'CUT':
		DECIMALS = 1;
		break;
	case 'CUT2':
		DECIMALS = 2;
		break;
	case 'SPECIFIC':
		DECIMALS = 2;
		break;
	default:
		DECIMALS = 0;
	}

	return(DECIMALS);

}

if (!Array.prototype.indexOf) {
	Array.prototype.indexOf = function(obj, start) {
		for (var i = (start || 0), j = this.length; i < j; i++) {
			if (this[i] === obj) { return i; }
		}
		return -1;
	}
}

String.prototype.interpolate = function (o) {
    return this.replace(/{([^{}]*)}/g,
        function (a, b) {
            var r = o[b];
            return typeof r === 'string' || typeof r === 'number' ? r : a;
        }
    );
};

function mrt( TEMPLATE_ID ) {
    this.TEMPLATE_ID = TEMPLATE_ID;
    var TEMPLATE = document.getElementById(TEMPLATE_ID);
    var TEMPLATE_DATA = TEMPLATE.innerHTML;
    this.process = function( DATA ) {
        var CONTENT = TEMPLATE_DATA.interpolate(DATA);
        return CONTENT;
    };
};

function algebraix_check_checkbox( CHECKBOX_NAME, CHECKED ) {
        var CURRENT_VALUE = $("input[name=" + CHECKBOX_NAME + "]").prop('checked') ? true : false;
        var CHECKED_VALUE = ( CHECKED === true || parseInt(CHECKED) === 1 ) ? true : false;
        $("input[name=" + CHECKBOX_NAME + "]").prop('checked', CHECKED_VALUE);
        if ( CURRENT_VALUE !== CHECKED_VALUE ) {
                $("input[name=" + CHECKBOX_NAME + "]").trigger('change');
        }
}

function algebraix_select_dropdown_option( SELECT_NAME, VALUE ) {
        if ( VALUE === undefined || VALUE === null || VALUE.length === 0 ) {
                return true;
        }
        $("select[name=" + SELECT_NAME + "]").prop('selectedIndex',0).find('option[value=' + VALUE + ']').prop('selected', true);
}

function algebraix_check_radio( RADIO_NAME, VALUE ) {
        if ( VALUE === undefined || VALUE === null || VALUE.length === 0 ) {
                return true;
        }
        $("input[name=" + RADIO_NAME + "]").filter("[value=" + VALUE + "]").prop('checked', true);
}

// Reference for button:  https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
// Reference for buttons: https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
// options: { buttons: Number, useEventListener: Boolean }
function algebraix_onclick( selector, fn, options ) {
	if ( fn == void 0 ) return;
	var elements;
	if ( selector instanceof Element ) elements = [selector];
	else {
		var nodes = document.querySelectorAll(selector);
		if ( !(nodes.forEach instanceof Function) ) nodes.forEach = function(fn) { for( var i = 0; i < this.length; i++ ) fn(this[i]) }
		elements = nodes;
	}
	if ( !elements.length ) return;
	if ( !(options instanceof Object && !(options instanceof Array)) ) options = { buttons: 1, useEventListener: false };
	else {
		if ( typeof options.buttons != 'number' ) options.buttons = 1;
		if ( typeof options.useEventListener != 'boolean' ) options.useEventListener = true;
	}
	const makefn = function(buttons) {
		const invokefn = function(button) {
			switch (button) { // See reference for button and buttons
				case 1: return 4  & buttons;
				case 2: return 2  & buttons;
				case 3: return 8  & buttons;
				case 4: return 16 & buttons;
				default: return false;
			}
		}
		return function(e) {
			if ( !invokefn(e.button) ) return;
			e.preventDefault();
			fn(e);
		};
	};
	if (options.useEventListener) {
		if ( 1 & options.buttons ) elements.forEach( function(e) { e.addEventListener( 'click', fn ) } );
		if ( options.buttons > 1 ) elements.forEach( function(e) { e.addEventListener( 'auxclick', makefn(options.buttons) ) } );
	} else {
		if ( 1 & options.buttons ) elements.forEach( function(e) { e.onclick = fn } );
		if ( options.buttons > 1 ) elements.forEach( function(e) { e.onauxclick = makefn(options.buttons) } );
	}
}

function algebraix_location(e, location) {
	if 	( location == void 0 )	return;
	if 	( e 	   == void 0 )	{ document.location = location	}
	else if ( e.which  == 2      )	{ window.open(location)		}
	else 				{ document.location = location	}
}

function algebraix_bind_anchors_href_to_inputs() {
	var anchors = document.querySelectorAll('a');
	var anchorsLength = anchors.length;
	for( var i = 0; i < anchorsLength; i++ ) {
		let a = anchors[i];
		if ( a.href == null || a.href === "#" || a.href.startsWith("javascript:")) continue;
		var matches = a.href.match( /##.*?##/g );
		if ( matches == null || a._input_binding_done ) continue;
		a._input_binding_done = true;
		a._alg_href = a.href;
		const elements = matches.map( function(m) { return document.querySelector('#' + m.slice(2, -2)) }).filter(function(el) { return el != null } );
		const value = function(el) {
			var value = function() { return '' }
			if      ( el.tagName == 'SELECT'   ) { value = function() { return el[el.selectedIndex].value } }
			else if ( el.type    == 'checkbox' ) { value = function() { return el.checked ? 1 : 0 } }
			else if ( el.type    == 'text'     ) { value = function() { return el.value } }
			else if ( el.type    == 'hidden'     ) { value = function() { return el.value } }
			return value;
		};
		elements.forEach( function(el) { el._alg_value = value(el) } );
		const update = function() {
			var href = a._alg_href;
			elements.forEach( function(el) { href = href.replace( '##' + el.id + '##', el._alg_value() ) } );
			a.href = href;
		};
		elements.forEach( function(el) {
			if (typeof(el.onchange) == 'function') {
				const fn = el.onchange;
				el.onchange = function(e) {
					fn(e);
					update(e);
				}
			} else {
				el.onchange = update;
			}
		} );
		update();
	}
};

function algebraix_attach_middle_click_to_javascript_anchor(element) {
	var attach = function(a) {
		a._middle_click_attached = true;
		algebraix_onclick( a, function() { eval( a.href.slice(11) ) }, { buttons: 4 } );
	}
	if ( element != null && element.tag == 'a' ) {
		if( !element.href.match(/javascript:.*\(.*\)/) ) return;
		if( element._middle_click_attached ) return;
		attach(element);
	} else {
		var container = element ? element : document;
		var nodeList = container.querySelectorAll('a');
		var anchors = [];
		var nodeListLength = nodeList.length;
		for( var i = 0; i < nodeListLength; i++ ) if( nodeList[i].href.match(/javascript:.*\(.*\)/) ) anchors.push(nodeList[i]);
		anchors.filter( function(a) { return !a._middle_click_attached } ).forEach(attach);
	}
}

function fileInput() {
	$('.input-file').each(function() {
		var $input = $(this),
			$label = $input.parent('.js-labelFile'),
			labelVal = $label.find('.js-fileName').html();

		$input.on('change', function(event) {
			$label.find('i').addClass('d-none');
			var spinner = '<div class="spinner-border spinner-border-sm " role="status"></div>';
			$label.addClass('has-file').find('.js-fileName').html(spinner);
			var fileName = '';
			if (event.target.value) fileName = event.target.value.split('\\').pop();
			if (event.target.files && event.target.files.length > 1) fileName = event.target.files.length;
			if (fileName) {
				$label.addClass('has-file').find('.js-fileName').html(fileName);
				$label.find('i').removeClass('d-none');
			} else{
				$label.removeClass('has-file').find('.js-fileName').html(labelVal);
				$label.find('i').removeClass('d-none');
			}
		});

	});

};



/*
* @param type    ej. "danger","info","success"
* @param title    title, optional
* @param message  paragraph text
* @param yesText  text that appear in ok button, optional
* @param lang     language, optional
* @param handler  the fat arrow call, is not necessary put in the function call
*/

function sweetAlgebraix(type, title, message, yesText, lang, handler) {
	/* Safari 9 */
	title = title || '';
	yesText = yesText || 'Aceptar';
	lang = lang || '';
	var cancel = "cancelar";

	if (lang == "EN"){
		cancel = "cancel"
	}

	if (Array.isArray(yesText)) {
		cancel = yesText[1];
		yesText = yesText[0];
	}

	$("<div class='modal fade' id='sweetAlgebraix' role='dialog'>" +
			"<div class='modal-dialog modal-dialog-centered sweet-algebraix'>" +
				"<div class='modal-content'> " +
					"<div class='modal-header'>" +
							iconSweetAlgebraix(type) +
					"</div>" +
					"<div class='modal-body'> "+
							"<h6>"
							+ title +
							"</h6>"
							+ message +
					"</div> "+
						"<div class='modal-footer'>"+
							"<div class='modal-footer--right'>"+
								"<button class='btn btn-text--dark btn-no'>"+cancel+"</button>"+
								`<button class='ml-2 btn btn--outline--${type==="danger"?"red":(type==="success"?"green":"blue")} btn-yes'>`+yesText+"</button>"+
						"</div>"+
					"</div>"+
				"</div> " +
			"</div> " +
		"</div>"
	).appendTo('body');

	//Trigger the modal
	$("#sweetAlgebraix").modal({
		backdrop: 'static',
		keyboard: false
	});

	//Hide all popover while modal
	$('[data-toggle="popover"]').popover('hide');

	//Pass true to a callback function
	$(".btn-yes").click(function () {
		handler(true);
		$("#sweetAlgebraix").modal("hide");
	});

	//Pass false to callback function
	$(".btn-no").click(function () {
		handler(false);
		$("#sweetAlgebraix").modal("hide");
	});

	//Remove the modal once it is closed.
	$("#sweetAlgebraix").on('hidden.bs.modal', function () {
		$("#sweetAlgebraix").remove();
	});
}
function iconSweetAlgebraix(type) {

	var icon = '';
	switch (type) {
		case 'danger':
			icon = "<i class='fas fa-circle-exclamation text-red icon--lg'></i>";
			break;
		case 'info':
			icon = "<i class='fas fa-circle-info text-blue icon--lg'></i>";
			break;
		case 'success':
			icon = "<i class='fas fa-circle-question text-blue icon--lg'></i>"
			break;
		case 'warning':
			icon = "<i class='fas fa-circle-exclamation text-yellow icon--lg'></i>"
			break;

	}
	return icon
}
function userAgent(string, element) {
	var nAgt = string;
	var browserName = "";
	var fullVersion = "";
	var nameOffset, verOffset, ix;

// In Opera, the true version is after "Opera" or after "Version"
	if ((verOffset = nAgt.indexOf("Opera")) != -1) {
		browserName = "Opera";
		fullVersion = nAgt.substring(verOffset + 6);
		if ((verOffset = nAgt.indexOf("Version")) != -1)
			fullVersion = nAgt.substring(verOffset + 8);
	}
// In MSIE, the true version is after "MSIE" in userAgent
	else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
		browserName = "Microsoft Internet Explorer";
		fullVersion = nAgt.substring(verOffset + 5);
	}
// In Chrome, the true version is after "Chrome"
	else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
		browserName = "Chrome";
		fullVersion = nAgt.substring(verOffset + 7);
	}
// In Safari, the true version is after "Safari" or after "Version"
	else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
		browserName = "Safari";
		fullVersion = nAgt.substring(verOffset + 7);
		if ((verOffset = nAgt.indexOf("Version")) != -1)
			fullVersion = nAgt.substring(verOffset + 8);
	}
// In Firefox, the true version is after "Firefox"
	else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
		browserName = "Firefox";
		fullVersion = nAgt.substring(verOffset + 8);
	}
// In most other browsers, "name/version" is at the end of userAgent
	else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
		(verOffset = nAgt.lastIndexOf('/'))) {
		browserName = nAgt.substring(nameOffset, verOffset);
		fullVersion = nAgt.substring(verOffset + 1);
		if (browserName.toLowerCase() == browserName.toUpperCase()) {
			browserName = navigator.appName;
		}
	}
// trim the fullVersion string at semicolon/space if present
	if ((ix = fullVersion.indexOf(";")) != -1)
		fullVersion = fullVersion.substring(0, ix);
	if ((ix = fullVersion.indexOf(" ")) != -1)
		fullVersion = fullVersion.substring(0, ix);


	var OSName = "Unknown OS";

	if (string.indexOf("Windows NT 10.0") != -1) OSName = "Windows 10";
	else if (string.indexOf("Windows NT 6.2") != -1) OSName = "Windows 8";
	else if (string.indexOf("Windows NT 6.1") != -1) OSName = "Windows 7";
	else if (string.indexOf("Windows NT 6.0") != -1) OSName = "Windows Vista";
	else if (string.indexOf("Windows NT 5.1") != -1) OSName = "Windows XP";
	else if (string.indexOf("Windows NT 5.0") != -1) OSName = "Windows 2000";
	else if (string.indexOf("Win") != -1) OSName = "Windows";
	else if (string.indexOf("Mac OS X 10_12") != -1) OSName = "Mac OS Sierra";
	else if (string.indexOf("Mac OS X 10_0") != -1) OSName = "Mac OS Cheetah";
	else if (string.indexOf("Mac OS X 10_1") != -1) OSName = "Mac OS Puma";
	else if (string.indexOf("Mac OS X 10_2") != -1) OSName = "Mac OS Jaguar";
	else if (string.indexOf("Mac OS X 10_3") != -1) OSName = "Mac OS Panther";
	else if (string.indexOf("Mac OS X 10_4") != -1) OSName = "Mac OS Tiger";
	else if (string.indexOf("Mac OS X 10_5") != -1) OSName = "Mac OS Leopard";
	else if (string.indexOf("Mac OS X 10_7") != -1) OSName = "Mac OS Snow";
	else if (string.indexOf("Mac OS X 10_8") != -1) OSName = "Mac OS Lion";
	else if (string.indexOf("Mac OS X 10_9") != -1) OSName = "Mac OS Mavericks";
	else if (string.indexOf("Mac OS X 10_10") != -1) OSName = "Mac OS Yosemite";
	else if (string.indexOf("Mac OS X 10_11") != -1) OSName = "Mac OS Capitan";
	else if (string.indexOf("Mac OS X 10_12") != -1) OSName = "Mac OS Sierra";
	else if (string.indexOf("Mac OS X 10_13") != -1) OSName = "Mac OS High Sierra";
	else if (string.indexOf("Mac OS X 10_14") != -1) OSName = "Mac OS High Mojave";
	else if (string.indexOf("Mac") != -1) OSName = "MacOS";
	else if (string.indexOf("X11") != -1) OSName = "UNIX";
	else if (string.indexOf("Android") != -1) OSName = "Android";
	else if (string.indexOf("like Mac") != -1) OSName = "iOS";
	else if (string.indexOf("Linux") != -1) OSName = "Linux";

	$(element).text(browserName + " " + fullVersion.substring(0, 2) + ", " + OSName + "  ");

}

function userAgentInfo(string) {
	var nAgt = string;
	var browserName = "";
	var fullVersion = "";
	var nameOffset, verOffset, ix;

// BGPROC
	if ((verOffset = nAgt.indexOf("BGPROC")) != -1) {
		return { name: 'BGPROC', version: '', os: 'Server Process', os_long: 'Server Process' };
	}

// Edge
	if ((verOffset = nAgt.indexOf("Edg")) != -1) {
		browserName = "Edge";
		fullVersion = nAgt.substring(verOffset + 4);
	}
// In Opera, the true version is after "Opera" or after "Version"
	else if ((verOffset = nAgt.indexOf("Opera")) != -1) {
		browserName = "Opera";
		fullVersion = nAgt.substring(verOffset + 6);
		if ((verOffset = nAgt.indexOf("Version")) != -1)
			fullVersion = nAgt.substring(verOffset + 8);
	}
// In MSIE, the true version is after "MSIE" in userAgent
	else if ((verOffset = nAgt.indexOf("MSIE")) != -1) {
		browserName = "Microsoft Internet Explorer";
		fullVersion = nAgt.substring(verOffset + 5);
	}
// In Chrome, the true version is after "Chrome"
	else if ((verOffset = nAgt.indexOf("Chrome")) != -1) {
		browserName = "Chrome";
		fullVersion = nAgt.substring(verOffset + 7);
	}
// In Safari, the true version is after "Safari" or after "Version"
	else if ((verOffset = nAgt.indexOf("Safari")) != -1) {
		browserName = "Safari";
		fullVersion = nAgt.substring(verOffset + 7);
		if ((verOffset = nAgt.indexOf("Version")) != -1)
			fullVersion = nAgt.substring(verOffset + 8);
	}
// In Firefox, the true version is after "Firefox"
	else if ((verOffset = nAgt.indexOf("Firefox")) != -1) {
		browserName = "Firefox";
		fullVersion = nAgt.substring(verOffset + 8);
	}
// In most other browsers, "name/version" is at the end of userAgent
	else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) <
		(verOffset = nAgt.lastIndexOf('/'))) {
		browserName = nAgt.substring(nameOffset, verOffset);
		fullVersion = nAgt.substring(verOffset + 1);
		if (browserName.toLowerCase() == browserName.toUpperCase()) {
			browserName = navigator.appName;
		}
	}
// trim the fullVersion string at semicolon/space if present
	if ((ix = fullVersion.indexOf(";")) != -1)
		fullVersion = fullVersion.substring(0, ix);
	if ((ix = fullVersion.indexOf(" ")) != -1)
		fullVersion = fullVersion.substring(0, ix);


	var OSName = "Unknown OS";
	var OS = "Unknown";

	if (string.indexOf("Windows NT 10.0") != -1){ OSName = "Windows 10"; OS = "Windows"; }
	else if (string.indexOf("Windows NT 6.2") != -1){ OSName = "Windows 8"; OS = "Windows"; }
	else if (string.indexOf("Windows NT 6.1") != -1){ OSName = "Windows 7"; OS = "Windows"; }
	else if (string.indexOf("Windows NT 6.0") != -1){ OSName = "Windows Vista"; OS = "Windows"; }
	else if (string.indexOf("Windows NT 5.1") != -1){ OSName = "Windows XP"; OS = "Windows"; }
	else if (string.indexOf("Windows NT 5.0") != -1){ OSName = "Windows 2000"; OS = "Windows"; }
	else if (string.indexOf("Win") != -1){ OSName = "Windows"; OS = "Windows"; }
	else if (string.indexOf("Mac OS X 10_10") != -1){ OSName = "Mac OS Yosemite"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_11") != -1){ OSName = "Mac OS Capitan"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_12") != -1){ OSName = "Mac OS Sierra"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_13") != -1){ OSName = "Mac OS High Sierra"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_14") != -1){ OSName = "Mac OS High Mojave"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_15") != -1){ OSName = "Mac OS Catalina"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_0") != -1){ OSName = "Mac OS Cheetah"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_1") != -1){ OSName = "Mac OS Puma"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_2") != -1){ OSName = "Mac OS Jaguar"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_3") != -1){ OSName = "Mac OS Panther"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_4") != -1){ OSName = "Mac OS Tiger"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_5") != -1){ OSName = "Mac OS Leopard"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_7") != -1){ OSName = "Mac OS Snow"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_8") != -1){ OSName = "Mac OS Lion"; OS = "Mac"; }
	else if (string.indexOf("Mac OS X 10_9") != -1){ OSName = "Mac OS Mavericks"; OS = "Mac"; }
	else if (string.indexOf("Mac") != -1){ OSName = "MacOS"; OS = "Mac"; }
	else if (string.indexOf("X11") != -1){ OSName = "UNIX"; OS = "UNIX"; }
	else if (string.indexOf("Android") != -1){ OSName = "Android"; OS = "Android"; }
	else if (string.indexOf("like Mac") != -1){ OSName = "iOS"; OS = "iOS"; }
	else if (string.indexOf("Linux") != -1){ OSName = "Linux"; OS = "Linux"; }

	return { name: browserName, version: fullVersion.substring(0, 2), os: OS, os_long: OSName };
}

function browserIcon(browser) {
	switch(browser) {
		case 'Edge':
			return 'fab fa-edge text-blue';
		case 'Opera':
			return 'fab fa-opera text-red';
		case 'Microsoft Internet Explorer':
			return 'fab fa-internet-explorer text-teal';
		case 'Chrome':
			return 'fab fa-chrome text-green';
		case 'Safari':
			return 'fab fa-safari text-blue';
		case 'Firefox':
			return 'fab fa-firefox text-orange';
		case 'Mobile':
			return 'fab fa-apple text-dark';
		case 'curl':
			return 'fas fa-laptop-code text-dark';
		case 'BGPROC':
			return 'fas fa-server text-dark';
		default:
			return 'fas fa-question text-gray';
	}
}

function OSIcon(os) {
	switch(os) {
		case 'Windows':
			return 'fab fa-windows text-blue';
		case 'Mac':
			return 'fab fa-apple text-purple';
		case 'iOS':
			return 'fab fa-apple text-dark';
		case 'Android':
			return 'fab fa-android text-green';
		case 'Linux':
			return 'fab fa-linux text-dark';
		default:
			return 'fas fa-question text-gray';
	}
}

/*confetti*/
function getRandomArrayItem(array) {
	return array[Math.floor(Math.random() * array.length)];
}

function getRandomInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

function getRandomFloat(min, max) {
	return Math.random() * (max - min) + min;
}

function getRotation() {
	return Math.floor(Math.random() * 360) + 1;
}

var particleSettings = {
	numConfetti: Math.floor(innerWidth / 22),
	colors: ["blue", "yellow", "red", "green", "purple"],
	shapes: ["square", "circle", "rectangle", "squiggle"],
	baseClass: 'particle',
	topOffset: 320,
	leftOffset: 240,
	windowHeight: window.innerHeight,
	windowWidth: window.innerWidth,
	sizeMin: 6,
	sizeMax: 10,
	removeTime: 5000
};

var birthdayCounter = 0;

function confetti(settings, counter) {
	var docFrag = document.createDocumentFragment();
	var fragDiv = document.createElement("div");
	fragDiv.classList += "particles particles-" + counter;
	for (var i = 0; i < settings.numConfetti; i++) {
		var color = getRandomArrayItem(settings.colors);
		var shape = getRandomArrayItem(settings.shapes);
		var size = getRandomInt(settings.sizeMin, settings.sizeMax);
		if (shape != 'squiggle') {
			var confetti = document.createElement("div");
			confetti.className += settings.baseClass + " particle--" + color + " particle--" + shape;
			confetti.style.top = -settings.topOffset + getRandomInt(0, settings.topOffset) + "px";
			confetti.style.left = getRandomInt(0, settings.windowWidth) + "px";
			confetti.style.height = size + "px";
			confetti.style.width = (shape == 'rectangle' ? size * 2 : size) + "px";
		} else {
			var confetti = document.createElementNS("http://www.w3.org/2000/svg", "svg");
			var path = document.createElementNS("http://www.w3.org/2000/svg", 'path');
			confetti.setAttribute("class", settings.baseClass + " particle--" + shape);
			confetti.setAttribute("viewBox", "0 0 50 200");
			confetti.setAttribute("width", size * 2);
			confetti.setAttribute("height", size * 2);
			confetti.style.top = -settings.topOffset + getRandomInt(0, settings.topOffset) + "px";
			confetti.style.left = getRandomInt(0, settings.windowWidth) + "px";
			path.setAttribute('d', 'M15,190.27A15,15,0,0,1,2.28,167.33l15-24.12-15-24.11a15,15,0,0,1,0-15.89l15-24.1L2.28,55a15,15,0,0,1,0-15.89l20-32A15,15,0,0,1,47.74,23L32.69,47.06l15.05,24.1a15,15,0,0,1,0,15.89L32.69,111.16l15.05,24.11a15,15,0,0,1,0,15.89l-20,32.05A15,15,0,0,1,15,190.27Z');
			path.setAttribute("class", " path--" + color);
			confetti.appendChild(path);
		}

		fragDiv.appendChild(confetti);
	}
	docFrag.appendChild(fragDiv);
	document.body.appendChild(docFrag);
	setTimeout(function () {
		var c = document.querySelectorAll('.particles-' + counter + ' .' + settings.baseClass);
		var remove = ".particles-" + counter;
		for (var i = 0; i < c.length; ++i) {
			var newY = settings.windowHeight + getRandomInt(settings.windowHeight, 0);
			var newX = parseInt(c[i].style.left, 10) + getRandomInt(-settings.leftOffset, settings.leftOffset);
			c[i].style.top = newY + "px";
			c[i].style.left = newX + "px";
			c[i].style.transform = "rotateZ(" + getRotation() + "deg)";
		}
		removeConfetti(settings.removeTime, remove);
	}, 50, counter);
}

function removeConfetti(miliseconds, removeSelector) {
	setTimeout(function () {
		document.querySelector(removeSelector).remove();
	}, miliseconds, removeSelector);
}

/* Birthday animation js */
var confettiSettings = {
	numConfetti: 15,
	distance: 48,
	colors: ["blue", "yellow", "red", "green", "purple"],
	shapes: ["square", "circle", "rectangle"]
};

function emit() {
	//console.log("confetti");
	//var elem = $(".confetti");
	// elem.remove();
	document.querySelectorAll(".confetti").forEach(function(e){ e.parentNode.removeChild(e); });

	var container = document.getElementById("confetti-container");
	var containerRect = container.getBoundingClientRect();
	containerRect = container;
	var containerData = {
		height: containerRect.offsetHeight,
		width: containerRect.offsetWidth
	};
	var start = {
		x: containerData.width / 2,
		y: containerData.height / 2
	};

	var maxY = start.y - confettiSettings.distance;
	var minY = start.y + confettiSettings.distance;

	var maxX = start.x - confettiSettings.distance;
	var minX = start.x + confettiSettings.distance;

	var docFrag = document.createDocumentFragment();
	var particles = [];
	for (var i = 0; i < confettiSettings.numConfetti; i++) {
		var confetti = document.createElement("div");
		var color = getRandomArrayItem(confettiSettings.colors);
		var shape = getRandomArrayItem(confettiSettings.shapes);
		var size = getRandomInt(8, 4);

		confetti.className += "confetti " + color + " " + shape;
		confetti.style.top = start.y + "px";
		confetti.style.left = start.x + "px";
		confetti.style.height = size + "px";
		confetti.style.width = size + "px";
		confetti.style.transition = "all " + getRandomFloat(1.5, 0.5) + "s ease";
		docFrag.appendChild(confetti);
	}

	container.appendChild(docFrag);
	setTimeout(function () {
		var c = document.querySelectorAll('.confetti');
		for (var i = 0; i < c.length; ++i) {
			var newX = getRandomInt(minX, maxX);
			var newY = getRandomInt(minY, maxY);
			c[i].style.top = newY + "px";
			c[i].style.left = newX + "px";
			c[i].style.transform = "rotateZ(" + getRotation() + "deg)";
		}
	}, 50);

}

/*confetti*/

function checkAll(me,selector) {
	inputCheckUncheck( [...document.querySelectorAll(selector + ' input[type=checkbox]:enabled')], me.checked);
}

function inputCheckUncheck(inputs, checked) {
	inputs.map(element => element.checked = checked);
}

function orValidationCheckBox(checkboxes) {
	var result = false;
	for (var i = 0; i < checkboxes.length; i++){
		result = result || checkboxes[i].checked
	}
	return result
}

function validateInputFile(nameInput) {

	var input = $('input[name=' + nameInput + ']');
	var response = true;

	if (input.length > 0 && input[0].accept && input[0].files) {
		var input_types = input[0].accept;
		var types = input_types.split(",");
		var input_mime = input[0].files;
		for (var mime = 0; mime < input_mime.length; mime++) {
			for (var type = 0; type < types.length; type++) {
				if ( types[type].trim() == input_mime[mime].type ) {
					response = true;
					break;
				}else{
					response = false;
				}
			}
			if (!response) {
				break;
			}
		}
	}

	if (input.length > 0 && input[0].getAttribute('data-exclude') && input[0].files) {
		var input_types = input[0].getAttribute('data-exclude');
		var types = input_types.split(",");
		var input_mime = input[0].files;
		for (var mime = 0; mime < input_mime.length; mime++) {
			for (var type = 0; type < types.length; type++) {
				if ( types[type].trim() == input_mime[mime].type ) {
					response = false;
					break;
				}
				else if ( input_mime[mime].name.match( new RegExp(types[type].trim().replace(".","\\.") + '$', 'i') ) ) {
					response = false;
					break;
				}
			}
			if (!response) {
				break;
			}
		}
	}

	return response;
}

function validateInputFileSize(nameInput, size) {

	var input = $('input[name=' + nameInput + ']');
	var response = true;
	if (!size) {
		size = 30000000;
	}

	if ( input.length > 0 && input[0].files ) {
		var input_file = input[0].files;
		for (var i = 0; i < input_file.length; i++) {
			if (input_file[i].size > size) {
				response = false;
				break;
			}
		}
	}


	return response;

}


function passValInit(passInput, passConfirm, passToggle){
	let passwordInput = document.getElementById(passInput);
	let passConfirmInput = document.getElementById(passConfirm);
	let reqContainer = document.getElementById('passwordHelperContainer');
	let reqIcons = reqContainer.querySelectorAll('.material-list__meta');
	let form = passwordInput.form;
	let passToggler = document.getElementById(passToggle);


	let passVissible = false;
	// Shows or hides input content as plain text on click.
	// E.g. **** <-> abcd
	passToggler.addEventListener('click', function(){
		passVissible = !passVissible;
		this.classList.toggle('fa-eye-slash', passVissible);
		this.classList.toggle('fa-eye', !passVissible);
		passwordInput.type = passVissible ? 'text' : 'password';

	});
	// Forces password input to be password type on submit
	form.addEventListener('submit', ()=> passwordInput.type = 'password');
	let passDic = [];
	// Set up every possible message for password strength meter
	if (typeof __LANGUAGE_CODE !== 'undefined' && __LANGUAGE_CODE !== 'ES'){
		passDic['too_weak'] = 'Too weak';
		passDic['weak'] = 'Weak';
		passDic['moderate'] = 'Moderate';
		passDic['strong'] = 'Strong';
		passDic['matched'] = 'Passwords match';
		passDic['unmatched'] = 'Passwords don&apos;t match';
	} else {
		passDic['too_weak'] = 'Muy d&eacute;bil';
		passDic['weak'] = 'D&eacute;bil';
		passDic['moderate'] = 'Moderada';
		passDic['strong'] = 'Robusta';
		passDic['matched'] = 'Las contrase&ntilde;as coinciden';
		passDic['unmatched'] = 'Las contrase&ntilde;as no coinciden';
	}
	return {
		form: form,
		submit: form.querySelector('input[type="submit"], button[type="submit"], .submit'),
		passInput: passwordInput,
		passConfirm: passConfirmInput,
		validatePassword: function (){
			let passVal = this.passInput.value;
			let usernameVal;
			let score = 0;
			// longitud
			score += passVal.length * 4;
			let longitudMin = passVal.length >= 8;
			reqIcons[0].setAttribute('class', (longitudMin ? 'fa fa-circle-check text-green material-list__meta' : 'fa fa-xmark text-red material-list__meta'))

			//mayus
			let totalMayus = passVal.match(/[A-Z]/g) ? passVal.match(/[A-Z]/g).length : 0;
			let totalMinus = passVal.match(/[a-z]/g) ? passVal.match(/[a-z]/g).length : 0;
			if(totalMayus){
				score += totalMinus*2;
				//minus
				score += totalMayus*2;
			}
			reqIcons[1].setAttribute('class', (!!totalMayus ? 'fa fa-circle-check text-green material-list__meta' : 'fa fa-xmark text-red material-list__meta'))
			//simbolos
			let totalSyms = passVal.match(/\W/g) ? passVal.match(/\W/g).length : 0;
			score += totalSyms*6;
			reqIcons[2].setAttribute('class', (!!totalSyms ? 'fa fa-circle-check text-green material-list__meta' : 'fas fa-question text-dark material-list__meta'))

			//nums
			let totalNums = passVal.match(/\d/g) ? passVal.match(/\d/g).length : 0;
			score += totalNums*4;
			reqIcons[3].setAttribute('class', (!!totalNums ? 'fa fa-circle-check text-green material-list__meta' : 'fa fa-xmark text-red material-list__meta'))

			//username
			let hasUsername = 0;
			$('input[name="username"]').each(function(){
				usernameVal = this.value;
				if( usernameVal ){
					hasUsername = passVal.toLowerCase().includes(usernameVal.toLowerCase()) ? 1 : 0;
					if (hasUsername) {
						return false;
					}
					return true;
				}
			});
			score -= hasUsername*3;
			reqIcons[4].setAttribute('class', (!!hasUsername ? 'fa fa-xmark text-red material-list__meta' : 'fa fa-circle-check text-green material-list__meta'))

			//numeros y simbolos no al final o al inicio
			score += (totalNums - !!passVal.match(/\d$/g) - !!passVal.match(/^\d/g) + totalSyms - !!passVal.match(/\W$/g) - !!passVal.match(/^\W/g))*2;
			// Requisitos
			let reqs = longitudMin + !!totalNums + !!totalSyms + !!totalMayus + !!totalMinus;
			let reqsMet = false
			// rechaza solo letras o solo numeros o nombre de usuario
			if(longitudMin && !!totalNums && !!totalMayus && !(!!hasUsername)){
				reqsMet = true;
				score += reqs * 2;
			}

			let longitud = passVal.length;
			reqContainer.classList.toggle('d-none', longitud === 0);
			let helperDiv = this.passInput.parentElement.querySelector('.material-form__helper-div');
			helperDiv.classList.toggle('d-none', longitud === 0);
			if(longitud){
				if((passVal.match(/[a-z]/ig) ? passVal.match(/[a-z]/ig).length : 0) === passVal.length || (passVal.match(/\d/g) ? passVal.match(/\d/g).length : 0) === passVal.length){
					score -= passVal.length;
				}
			}

			let passBarClass;
			let helperClass;
			let iconClass;
			let helper = this.passInput.parentElement.querySelector('.material-form__helper-text');

			this.passInput.setAttribute('class', 'material-form__input--password');
			// Elements used to dynamically show password strength
			switch(true){
				case score >0 && score <= 20 :  passBarClass = 'material-form__helper-div--weak';
					this.validPass = false;
					helper.innerHTML = passDic['too_weak'];
					helperClass = 'text-red';
					break;
				case score > 20 && score <= 40: passBarClass = 'material-form__helper-div--poor';
					this.validPass = false;
					helper.innerHTML = passDic['weak'];
					helperClass = 'text-orange';
					break;
				case score > 40 && score <= 75: passBarClass = 'material-form__helper-div--good';
					this.validPass = reqsMet;
					helper.innerText = passDic['moderate'];
					helperClass = 'text-yellow';
					break;
				case score > 75: passBarClass = 'material-form__helper-div--excellent';
					this.validPass = reqsMet;
					helper.innerText = passDic['strong'];
					helperClass = 'text-green';
					break;
				default: passBarClass = '';
					this.passInput.setAttribute('class', '');
					this.validPass = false;
					helper.innerText = '';
					iconClass = 'd-none';
			}
			helperDiv.children[0].setAttribute('class', passBarClass)
			helper.setAttribute('class', 'material-form__helper-text ' + helperClass);
			this.updateForm()

		},
		validPass: false,
		confirmPassword: !!passConfirmInput ? function(){
			// This function validates whether both passwords are the same
			let same = this.passConfirm.value === this.passInput.value;
			let helper = this.passConfirm.parentElement.querySelector('.material-form__helper-text');
			let helperIcon = helper.previousElementSibling.children[0];
			if(this.passConfirm.value.length || this.passInput.value.length){
				if(same){
					this.passConfirmed = true;
					this.passConfirm.setAttribute('class', 'material-form__input--correct');
					helper.setAttribute('class', 'material-form__helper-text text-green');
					helperIcon.setAttribute('class', 'fas fa-check text-green');
					helper.innerHTML = passDic['matched'];
				} else {
					this.passConfirmed = false;
					this.passConfirm.setAttribute('class', 'material-form__input--error');
					helper.setAttribute('class', 'material-form__helper-text text-red');
					helperIcon.setAttribute('class', 'fas fa-exclamation text-red');
					helper.innerHTML = passDic['unmatched'];
				}
			} else {
				this.passConfirm.setAttribute('class', '');
				helperIcon.classList.add('d-none')
				helper.innerHTML = '';
			}
			this.updateForm();
		} : null,
		passConfirmed: !passConfirmInput,
		updateForm: function(){
			// Enable/disable form based on password strength
			if(this.passInput.value.length === 0 && (!!this.passConfirm && this.passConfirm.value.length ===0)){
				this.submit.disabled = false;
			} else {
				this.submit.disabled = !(this.validPass && this.passConfirmed);
			}
		}
	}
}
// Kind of encodeURIComponent for ISO-8859
function escapeComponent(str) {
    return escape(str).replace(/\+/g, '%2B');
}

// Kind of $.param for ISO-8859
$.paramLatin = function( a ) {
    var s = [];
     $.each( a, function( i, kv ) {
        s[ s.length ] = escapeComponent(kv.name) +"="+ escapeComponent(kv.value);
    });
     return s.join("&").replace(/%20/g, '+');
};

// Kind of $.fn.serialize for ISO-8859
$.fn.serializeLatin = function() {
    return $.paramLatin( this.serializeArray() );
};

function algebraix_loadScript(url, callback){
	var script = document.createElement("script")
	script.type = "text/javascript";

	if (script.readyState){  //IE
		script.onreadystatechange = function(){
			if (script.readyState == "loaded" ||
				script.readyState == "complete"){
				script.onreadystatechange = null;
				callback();
			}
		};
	} else {  //Others
		script.onload = function(){
			callback();
		};
	}

	script.src = url;
	document.getElementById("inner-container").appendChild(script);
}

function uuidv4() {
    return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, function(c) {
        return (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    });
}

function openRequestedSinglePopup(url) {
	try { new URL(url) }
	catch (e) { return display_error("Enlace invalido") }
    var fn = openRequestedSinglePopup;
    if (fn.windowObjectReference == null || fn.windowObjectReference.closed) {
        fn.windowObjectReference = window.open(url, '', fn.windowFeatures());
    } else if (fn.previousUrl != url) {
        fn.windowObjectReference = window.open(url, '', fn.windowFeatures());
        fn.windowObjectReference.focus();
    } else {
        fn.windowObjectReference.focus();
    };
	fn.previousUrl = url;
}
openRequestedSinglePopup.previousUrl = null;
openRequestedSinglePopup.windowObjectReference = null;
openRequestedSinglePopup.windowFeatures = function() {
    var width = window.screen.width * .5;
    var height = window.screen.height * .8;
    var leftPosition = screenX = (window.screen.width / 2) - ((width / 2) + 10);
    var topPosition = screenY = (window.screen.height / 2) - ((height / 2) + 50);
	width = 'width=' + width;
	height = 'height=' + height;
	leftPosition = 'leftPosition=' + leftPosition;
	topPosition = 'topPosition=' + topPosition;
	screenX = 'screenX=' + screenX;
	screenY = 'screenY=' + screenY;
    var windowFeatures = [
        height, width, leftPosition, topPosition, screenX, screenY,
        'status=no', 'resizable=yes', 'toolbar=no', 'menubar=no',
        'scrollbars=no', 'location=no', 'directories=no'
    ];
    return windowFeatures.join(",", windowFeatures);
};

function isValidHttpUrl(url, options) {
    options = options || {};

    var starts_with_http_protocol = /^(https?:\/\/)/i.exec(url);
    if (!starts_with_http_protocol) throw {
        type: 'MISSING_HTTP_PROTOCOL'
    }

    var protocol = starts_with_http_protocol[1];
    var hostname = url.slice(protocol.length).split('/')[0].split('.');

    if (hostname.length < 2) throw {
        type: 'INVALID_HOSTNAME'
    }

    var tld = hostname.pop();
    var is_valid_tld = /^[a-z]+$/i.exec(tld);
    if (!is_valid_tld) throw {
        type: 'INVALID_HOSTNAME'
    }

    var label_re = /^[a-z][a-z0-9\-]*$/i;
    hostname.forEach(function(label) {
		// Domain name label cannot end with hyphen
        if (label.charAt(label.length - 1) === '-') throw {
            type: 'INVALID_HOSTNAME'
        }
        var is_valid_label = label_re.exec(label);
        if (!is_valid_label) throw {
            type: 'INVALID_HOSTNAME'
        }
    })

	var match;
	if (options && options.failOnRootPath) {
		var is_not_root_path = /^(https?):\/\/(.+?)(\/(?=\S).+)$/.exec(url);
		if (!is_not_root_path) throw {
			type: 'FAILED_ON_ROOT_PATH'
		}
		match = is_not_root_path;
	}
	else match = /^(https?):\/\/([^\/]+)(\/?.*)$/.exec(url);

	return {
		protocol: match[1],
		hostname: match[2],
		path: match[3] || '/'
	}
}

function detectLinkPlatform(url, options) {
	options = options || {};
	try {
		url = isValidHttpUrl(url);
	}
	catch (e) {
		if (options.dontThrowException) return 'OTHER';
		throw e;
	}

	if (url.hostname.endsWith('meet.google.com'))
		return 'GOOGLE_MEET'
	else if (url.hostname.endsWith('zoom.us'))
		return 'ZOOM'
	else if (url.hostname.endsWith('join.skype.com'))
		return 'SKYPE'
	else if (url.hostname.endsWith('teams.microsoft.com'))
		return 'TEAMS'

	return 'OTHER';
}

function copyLink(value, container) {
	var temp = $("<input>")[0];
	container.appendChild(temp);
	temp.value = $.trim(value);
	temp.select();
	document.execCommand("copy");
	temp.remove();
	var text = 'Copied to clipboard';
	if (__LANGUAGE_CODE == 'ES'){
		text = 'Copiado al portapapeles'
	}
	 display_success(text);
}

function nFormatter(num, digits) {
  var si = [
    { value: 1, symbol: "" },
    { value: 1E3, symbol: "k" },
    { value: 1E6, symbol: "M" },
    { value: 1E9, symbol: "G" },
    { value: 1E12, symbol: "T" },
    { value: 1E15, symbol: "P" },
    { value: 1E18, symbol: "E" }
  ];
  var rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
  var i;
  for (i = si.length - 1; i > 0; i--) {
    if (num >= si[i].value) {
      break;
    }
  }
  return (num / si[i].value).toFixed(digits).replace(rx, "$1") + si[i].symbol;
}

// This function removes characters outside the iso-8859-1 table
// using the character's Unicode Code Point because
// the first 256 characters of Unicode are identical to iso-8859-1
// Unicode blocks this function works with:
// 		- (0000—007F) Basic Latin
// 		- (0080-00FF) Latin-1 Supplement
function removeNonLatinChars(text) {
    var length = text.length;
    var safe_text = text;
    for (var i = 0; i < length; i++) {
        if (safe_text.codePointAt(i) > 0xFF) {
            safe_text = safe_text.slice(0, i) + safe_text.slice(i + 1);
            length--;
            i--;
        }
    }
	return safe_text;
}

function enable_google_button(){
	let gIcon = document.querySelector("#verify_federated_username i");
	let federated_username = document.querySelector('#federated_username')
	let federated_domain = document.querySelector('#federated_domain')
	let verify_federated_username = document.querySelector('#verify_federated_username')
	let federated_username_error = document.querySelector('#federated_username_error')

	federated_username_error.classList.remove('text-green', 'text-red');

	if(federated_username.value == ''){
		federated_username_error.innerText= "";
		federated_domain.parentElement.classList.add('mb-0');
		document.querySelector('input[type="submit"], button[type="submit"]').classList.remove('disabled', 'pointer-none');
	}else{
		federated_username_error.innerText= LANG[__LANGUAGE_CODE].no_verified;
		federated_username_error.classList.add('text-red');
		federated_domain.parentElement.classList.remove('mb-0');
		document.querySelector('input[type="submit"], button[type="submit"]').classList.add('disabled', 'pointer-none');
	}
	gIcon.classList.remove('fas','fa-check','text-green','fab','fa-google','text-blue');
	gIcon.classList.add('fab','fa-google','text-red');

	if(federated_domain.value.length > 0 && federated_username.value.length > 0 ){
		verify_federated_username.classList.remove('disabled','pointer-none');
		return;
	}
	verify_federated_username.classList.add('disabled','pointer-none');
	return;
}

algebraix.dates_functions = {
	getArrayDates : (startDateString, endDateString) => {
		const getDate = (dateString) => {
			const [day, month, year] = dateString.split("/");
			return new Date(`${month}/${day}/${year}`);
		};

		const addDay = function () {
			const date = new Date(this.valueOf());
			date.setDate(date.getDate() + 1);
			return date;
		}

		const startDate = getDate(startDateString), endDate = getDate(endDateString);
		const dateStrings = [];
		let currentDate = startDate;
		while (currentDate <= endDate) {
			dateStrings.push(currentDate );
			currentDate = addDay.call(currentDate);
		}
		return dateStrings;
	}
};

function encode_html(str) {
	if (typeof str !== 'string') {
		return str;
	}

	return str
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}
