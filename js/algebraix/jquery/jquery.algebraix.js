(function($) {

	$.fn.x_submit = function ( OPTIONS ) {

		if ( typeof(OPTIONS) != 'object' ) OPTIONS = {};

		this[0].x_submit = true;

		if ( this[0].onsubmit ) {
			this[0].onsubmit = null;
		}

		return this.bind( 'submit', function() {
			// dont do this for mobile browsers
			if ( typeof(tinyMCE) !== "undefined" ) {

				if (tinyMCE.editors.length) {
					tinyMCE.triggerSave();
				};

			}

			if ( this.validations ) {
				var STATUS = this.validations.call(this);
				if ( STATUS === false ) return false;
			}

			var PARAMS = $(this).serialize() + '&x_submit=' + (new Date()).getTime();
			var _URL = $(this).attr('action');

			var FORM = this;
			{
				var modalElement = $(FORM).closest('.modal');
				if (modalElement[0]) {
					modalElement.on('hidden.bs.modal', runAjax);
					modalElement.modal('hide');
				}
				else runAjax();
			}

			function runAjax() {
				$.ajax({
					url: _URL,
					dataType: 'json',
					data: PARAMS,
					type: 'POST',
					success: function( RESPONSE ) {

						if (RESPONSE.action == 'REDIRECT') {
							let url = new URL(RESPONSE.location);
							if (!__DEVEL_MODE) url.searchParams.set("x_load", Math.random());
							$.address.value(btoa(url.pathname + url.search));
							return;
						}

						// destroy tinymce, timers and other problematic objects
						__GBX_object_cleanup();

						var RESPONSE_MORE_LENGTH = 0;

						if ( RESPONSE.alerts ) {
							if ( RESPONSE.alerts.length > 1) {
								RESPONSE_MORE_LENGTH = RESPONSE.alerts.length;
							}
						}

						if ( RESPONSE.x_submit && RESPONSE.html ) {
							if ( RESPONSE.auth_error ) {
								display_error(RESPONSE.alerts[0].message);
								return false;
							}
							$('#inner-container').html(RESPONSE.html);
							$('#BREADCRUMBS').html(RESPONSE.breadcrumbs);
							$('#help-bar').html(RESPONSE.help_string);

						}

						if ( RESPONSE.show && RESPONSE.alerts && RESPONSE.alerts[0].message && !RESPONSE_MORE_LENGTH ) {

							if ( RESPONSE.code === 1 ) {
								if ( OPTIONS.clear ) FORM.reset();
								display_success(RESPONSE.alerts[0].message, RESPONSE.alert_container );
							}
							else if ( RESPONSE.code === 0 ) {
								display_error(RESPONSE.alerts[0].message, RESPONSE.alert_container );
							}
							else if ( RESPONSE.code === 2 ) {
								display_info(RESPONSE.alerts[0].message, RESPONSE.alert_container );
							}

						}
						else if ( RESPONSE.show && RESPONSE_MORE_LENGTH ) {

							if ( RESPONSE.alerts[1].code === 1 ) {

								if ( OPTIONS.clear ) FORM.reset();
								display_success(RESPONSE.alerts[1].message, RESPONSE.alert_container);

							}
							else if ( RESPONSE.alerts[1].code === 0 ) {
								display_error(RESPONSE.alerts[1].message, RESPONSE.alert_container);
							}
							else if ( RESPONSE.alerts[1].code === 2 ) {
								display_info(RESPONSE.alerts[1].message, RESPONSE.alert_container);
							}

						}

						setTimeout(function() {
								$("input[type=submit]").prop('disabled', false).removeClass('blocked_button');
								$("input[type=button]").prop('disabled', false).removeClass('blocked_button');
								$("button").prop('disabled', false).removeClass('blocked_button');
						}, 3000 );

						$('#inner-container').trigger('algebraix_page_did_change');
						if( !RESPONSE.no_scroll ) {
							$(window).scrollTop(0);
						}
						return false;

					},
					error: algebraix_ajax_error
				})
			}

			return false;

		});

	};

	$.fn.x_submit_hash = function () {

		if ( typeof(this) == 'object' && !this.length )
			return false;

		this[0].x_submit = true;

		if ( this[0].onsubmit ) {
			this[0].onsubmit = null;
		}

		return this.bind( 'submit', function() {

			if ( this.validations ) {
				var STATUS = this.validations.call(this);
				if ( STATUS === false ) return false;
			}

			var PARAMS = $(this).serialize() + "&x_utf8_encoded=1";
			var URL = $(this).attr('action');
			var URI = URL.match(/\/bin\S+$/);

			if ( URI == null ) {
				return false;
			}

			var BASE64 = Base64.encode(URI[0] + '?x_epoch=' + (new Date()).getTime() + '&' + PARAMS);

			// hash too long, fall back to plain submit
			if ( BASE64.length > 4096 ) {
				$(window).scrollTop();
				display_loading();
				$.fn.bind_submit.call(this);
				return false;
			}
			else {
				window.location = '#/' + BASE64;
			}

			return false;

		});

	};
})(jQuery);

var X_LOCATION = '';

$(document).ready(function() {
	if (!$.address) return;
	$.address.init(function(EVENT) {}).change(function(EVENT) {
		if ( EVENT.value === '/STATUSMESSAGES' ) {
			return false;
		}

		if ( EVENT.value.length == 1 ) {

			var URL = String(window.location);
			var URI = URL.match(/\/bin\S+$/);

			if ( URI == null ) {
				return false;
			}

			if ( X_LOCATION.length == 0 ) {
				return false;
			}

			var GREETING = 0;
			try { GREETING = parseInt(__ALGEBRAIX_SHOW_GREETING) } catch(e) { GREETING = 0 };

			if ( GREETING === 1 ) {
				var QA_MATCH = URI[0].match(/\?/);
				URI[0] += QA_MATCH ? '&show_greeting=1' : '?show_greeting=1';
				__ALGEBRAIX_SHOW_GREETING = 0;
			}

			load_uri(URI[0], false);
			return false;

		}

		var BASE64 = EVENT.value.substring(1,EVENT.value.length);
		var URI = Base64.decode(BASE64);
		//console.log(LOADING, 'false?');
		if ( !LOADING ){
			clean_captcha_uri();
			load_uri(URI, true);
			//console.log(URI);
		}
		return false;

	});

});

function navigate_to(uri) {
	if (__DEVEL_MODE) document.location = uri
	else $.address.value(btoa(uri))
}

function refresh_after_ajax(uri) {
	jQuery.ajax(uri).done(function(result) {
		var restore_state = 0;
		if (typeof result === 'object' && result.restore_state) restore_state = 1;

		var uri;
		if (__DEVEL_MODE) uri = document.location.pathname + document.location.search;
		else uri = atob(document.location.hash.substring(2, document.location.hash.length))
				|| document.location.pathname + document.location.search;

		uri = uri.split('?');
		var pathname = uri[0];
		var search = new URLSearchParams(uri[1]);
		var params = [];
		for(var param of search) {
			if ( ['x_load', 'x_serial', 'x_submit', 'x_restore_state', 'x_preserve_params'].includes(param[0]) ) continue;
			params.push(param[0] + '=' + param[1]);
		}
		if (restore_state) params.push('x_restore_state=1&x_preserve_params=1');
		params = '?' + params.join('&');
		uri = pathname + params;

		if (__DEVEL_MODE) document.location = uri;
		else {
			if (btoa(uri) === document.location.hash.substring(2, document.location.hash.length))
				load_uri(uri, 1);
			else $.address.value(btoa(uri))
		};
	})
}

var SERIAL = 0;
var LOADING = false;

function load_uri(URI, X_LOAD) {

	LOADING = true;

	$(document).scrollLeft(0).scrollTop(0);
	$('body').trigger('algebraix_page_change');
	document.body.dispatchEvent(new Event("web_v2_algebraix_page_change"));

	// destroy tinymce, timers and other problematic objects
	__GBX_object_cleanup();

	if (X_LOAD) {
		display_loading('inner-container');
	}
	var X_LOAD_URI = '';
	var MATCH = URI.match(/\?/);

	if ( MATCH ) {
		X_LOAD_URI = URI + '&x_load=' + (new Date()).getTime();
	}
	else {
		X_LOAD_URI = URI + '?x_load=' + (new Date()).getTime();
	}

	SERIAL++;
	X_LOAD_URI += '&x_serial=' + SERIAL;

	var PARAMS = X_LOAD_URI.replace(/^.*\?/, '');
	X_LOAD_URI = X_LOAD_URI.replace(/\?.*$/, '');
	PARAMS += '&HTTP_REFERER=' + X_LOCATION;
	X_LOCATION = X_LOAD_URI;

	if (typeof gtag !== 'undefined') {
		try {
			gtag('set', { 'page_path': X_LOCATION });
			gtag('event', 'page_view');
		} catch(e) {
			console.log(e);
		}
	}
	else if (typeof dataLayer !== 'undefined') {
		try {
			dataLayer.push({
				'event'           : 'page_view',
				'custom_page_path': X_LOCATION,
			});
			let auth = URI.match(/\/bin\/([a-zA-Z])\//);
			let url = "/bin/" + auth[1] + "/start/x_watch_analytics/";
			let otherData = {
				'event'           : 'page_view',
				'custom_page_path': X_LOCATION,
				'auth'            : auth[1],
				'URI'             : URI,
			};
			$.ajax({
				url: url,
				type: 'POST',
				contentType: 'application/json',
				data: JSON.stringify(otherData),
				success: function(json) {
					if (json) {
						console.log(json);
					}
				}
			});
		} catch(e) {
			console.log(e);
		}
	}
	$.ajax({
		url: X_LOAD_URI,
		type : 'POST',
		dataType : 'json',
		data : PARAMS,
		success: function(DATA) {

			LOADING = false;
			if ( DATA.auth_error ) {
				$('#inner-container').html('<div id="all-alerts"></div>');
				if (DATA.alerts[0].redirect_url) {
					display_error_redirect(DATA.alerts[0].message, 'box_status_message', DATA.alerts[0].redirect_url);
				}
				else {
					display_error(DATA.alerts[0].message);
				}
				if ( DATA.alerts.length > 1 && DATA.alerts[1].message) {
					display_info(DATA.alerts[1].message,'box_status_message_shadow',true);
				}
				return false;
			}

			if ( typeof(DATA.location) != 'undefined' ) {
				window.location = DATA.location;
				return false;
			}

			if ( DATA.x_serial != SERIAL ) {
				return false;
			}

			$('#inner-container').html(DATA.html).removeClass('d-flex');
			$('#BREADCRUMBS').html(DATA.breadcrumbs);
			$('#secondary-breadcrumbs').html(DATA.secondary_breadcrumbs);
			$('#help-pill').html(DATA.help_string);

			if ( $('.interface-switch').length > 0 ) {
				var HREF_BASE64 = Base64.encode(X_LOCATION);
				var SWITCH_HREF = $('.interface-switch').attr('href');
				SWITCH_HREF = SWITCH_HREF.replace(/&ref=.+$|$/,'&ref='+HREF_BASE64);
				$('.interface-switch').attr('href', SWITCH_HREF);
			}

			MESSAGES_STRING = ( parseInt(DATA.unread_message_count) > 0 ) ? DATA.unread_message_count : "";

			$(".MESSAGE_COUNT").html(MESSAGES_STRING);
			//sorttable.init();

			$('#inner-container').trigger('algebraix_page_did_change');

			return true;

		},
		error: algebraix_ajax_error

	});

};

function back_refresh_controls() {

	$('select.back-refresh').each(function(){
		$(this).trigger('change');
	});

}

function algebraix_ajax_error (xhr, status, error) {
	if($('.cssload-loading').length){
		$('.cssload-loading').parent().remove();
	}
	LOADING = false;
	// cloudflare captcha
	if ( String(xhr.responseText).match(/window._cf_chl_opt/) ) {
		manage_captcha(xhr.responseText);
	}
	var ERROR_CODE    = xhr.getResponseHeader('X-Error-Code');
	var ERROR_DISPLAY = xhr.getResponseHeader('X-Error-Display');

	$("input[type=submit]").prop('disabled', false).removeClass('blocked_button');
	$("input[type=button]").prop('disabled', false).removeClass('blocked_button');
	$("button").prop('disabled', false).removeClass('blocked_button');

	switch (status) {
	case 'timeout':
		display_error('Se ha excedido el tiempo de espera para la operaci&oacute;n. '
			      + 'Por favor verifique su conexi&oacute;n a Internet e intente de nuevo. '
			      + 'C&oacute;digo de error: NET_TIMEOUT');
		break;
	case 'error':
		if ( xhr.status == 502 ) {
			display_error('Se ha producido un error durante la conexi&oacute;n. Por favor intente de nuevo o contacte a soporte t&eacute;cnico. '
				      + 'C&oacute;digo de error: E502 '
					  + ERROR_CODE);
		}
		else if ( xhr.status == 504 ) {
			display_error('Se ha excedido el tiempo de espera para la operaci&oacute;n. Por favor contacte a soporte t&eacute;cnico. '
				      + 'C&oacute;digo de error: E504 '
					  + ERROR_CODE);
		}
		else if ( xhr.readyState < 4 ) {
			display_error('Se ha producido un error al conectarse a la plataforma. '
				      + 'Por favor verifique su conexi&oacute;n a Internet e intente de nuevo. '
				      + 'C&oacute;digo de error: NET_ERROR');
		}
		else if ( xhr.status == 500 ) {
			display_error('Se ha producido un error en el sistema. Por favor contacte a soporte t&eacute;cnico. '
				+ 'C&oacute;digo de error: ISE500 '
				+ ERROR_CODE)
		}
		else if (xhr.status === 429) { }
		else {
			display_error('Error. Error JS:' + String(status).toUpperCase()+ ':' +error );
		}
		break;
	case 'abort':
		display_error('El navegador ha interrumpido la operaci&oacute;n. Por favor intente de nuevo.');
		break;
	case 'parsererror':
		if ( ERROR_DISPLAY !== null && String(xhr.responseText).match(/caller|^ERROR/) ) {
			if ( String(xhr.responseText).match(/^ERROR/) ) {
				display_error("<pre>" + xhr.responseText + "</pre>");
			}
			else {
				display_error(xhr.responseText);
			}
		}
		else {
			display_error('Se ha producido un error. Por favor intente de nuevo o contacte a soporte t&eacute;cnico. '
				      + 'C&oacute;digo de error: RESPONSE_ERROR '
					  + ERROR_CODE);
		}
		break;
	default:
		display_error('Se ha producido un error. Por favor intente de nuevo o contacte a soporte t&eacute;cnico. Error JS:'
			      + String(status).toUpperCase()+ ':' +error );
	}
}

function __GBX_object_cleanup() {

	// destroy and remove all tinyMCE editors
	// this fixes a bug where a reloaded page has no tinyMCE
	if ( typeof(tinyMCE) !== 'undefined' ) {
		for (var id in tinyMCE.editors) {
			if ( !isNaN(id) ) {
				tinyMCE.editors[id].remove();
			}
		}
	}

	if ( typeof(__GBX_DRAFT_SAVER) !== 'undefined' ) {
		clearTimeout(__GBX_DRAFT_SAVER.timer);
		delete __GBX_DRAFT_SAVER;
	}

}

function StringBuffer()
{
    this.buffer = [];
}

StringBuffer.prototype.append = function append(string)
{
    this.buffer.push(string);
    return this;
};

StringBuffer.prototype.toString = function toString()
{
    return this.buffer.join("");
};

var Base64 =
{
    codex : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",

    encode : function (input)
    {
        var output = new StringBuffer();

        var enumerator = new Utf8EncodeEnumerator(input);
        while (enumerator.moveNext())
        {
            var chr1 = enumerator.current;

            enumerator.moveNext();
            var chr2 = enumerator.current;

            enumerator.moveNext();
            var chr3 = enumerator.current;

            var enc1 = chr1 >> 2;
            var enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            var enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            var enc4 = chr3 & 63;

            if (isNaN(chr2))
            {
                enc3 = enc4 = 64;
            }
            else if (isNaN(chr3))
            {
                enc4 = 64;
            }

            output.append(this.codex.charAt(enc1) + this.codex.charAt(enc2) + this.codex.charAt(enc3) + this.codex.charAt(enc4));
        }

        return output.toString();
    },

    decode : function (input)
    {
        var output = new StringBuffer();

        var enumerator = new Base64DecodeEnumerator(input);
        while (enumerator.moveNext())
        {
            var charCode = enumerator.current;

            if (charCode < 128)
                output.append(String.fromCharCode(charCode));
            else if ((charCode > 191) && (charCode < 224))
            {
                enumerator.moveNext();
                var charCode2 = enumerator.current;

                output.append(String.fromCharCode(((charCode & 31) << 6) | (charCode2 & 63)));
            }
            else
            {
                enumerator.moveNext();
                var charCode2 = enumerator.current;

                enumerator.moveNext();
                var charCode3 = enumerator.current;

                output.append(String.fromCharCode(((charCode & 15) << 12) | ((charCode2 & 63) << 6) | (charCode3 & 63)));
            }
        }

        return output.toString();
    }
}


function Utf8EncodeEnumerator(input)
{
    this._input = input;
    this._index = -1;
    this._buffer = [];
}

Utf8EncodeEnumerator.prototype =
{
    current: Number.NaN,

    moveNext: function()
    {
        if (this._buffer.length > 0)
        {
            this.current = this._buffer.shift();
            return true;
        }
        else if (this._index >= (this._input.length - 1))
        {
            this.current = Number.NaN;
            return false;
        }
        else
        {
            var charCode = this._input.charCodeAt(++this._index);

            // "\r\n" -> "\n"
            //
            if ((charCode == 13) && (this._input.charCodeAt(this._index + 1) == 10))
            {
                charCode = 10;
                this._index += 2;
            }

            if (charCode < 128)
            {
                this.current = charCode;
            }
            else if ((charCode > 127) && (charCode < 2048))
            {
                this.current = (charCode >> 6) | 192;
                this._buffer.push((charCode & 63) | 128);
            }
            else
            {
                this.current = (charCode >> 12) | 224;
                this._buffer.push(((charCode >> 6) & 63) | 128);
                this._buffer.push((charCode & 63) | 128);
            }

            return true;
        }
    }
}

function Base64DecodeEnumerator(input)
{
    this._input = input;
    this._index = -1;
    this._buffer = [];
}

Base64DecodeEnumerator.prototype =
{
    current: 64,

    moveNext: function()
    {
        if (this._buffer.length > 0)
        {
            this.current = this._buffer.shift();
            return true;
        }
        else if (this._index >= (this._input.length - 1))
        {
            this.current = 64;
            return false;
        }
        else
        {
            var enc1 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc2 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc3 = Base64.codex.indexOf(this._input.charAt(++this._index));
            var enc4 = Base64.codex.indexOf(this._input.charAt(++this._index));

            var chr1 = (enc1 << 2) | (enc2 >> 4);
            var chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            var chr3 = ((enc3 & 3) << 6) | enc4;

            this.current = chr1;

            if (enc3 != 64)
                this._buffer.push(chr2);

            if (enc4 != 64)
                this._buffer.push(chr3);

            return true;
        }
    }
};

function manage_captcha(response) {
	let scriptRegex = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
	let scriptMatch = scriptRegex.exec(response);
	let scriptContent = scriptMatch ? scriptMatch[1] : null;

	if (scriptContent) {

		var uri = atob(document.location.hash.substring(2, document.location.hash.length))
				|| document.location.pathname + document.location.search;

		uri = uri.split('?');
		var search = new URLSearchParams(uri[1]);
		var params = [];
		for(var param of search) {
			if ( ['x_load', 'x_serial', 'x_submit', 'x_restore_state', 'x_preserve_params'].includes(param[0]) ) continue;
			params.push(param[0] + '=' + param[1]);
		}
		params = '&x_load=0&' + params.join('&');
		var urlMatch = scriptContent.match(/history\.replaceState\(null, null, "(.*?)"/);
		let urlFinal = urlMatch[1].replace(/\\\//g, "/") + params;
		window.location.href = urlFinal;

	}
}

function clean_captcha_uri() {
	let urlParams = new URLSearchParams(window.location.search);
	if ( urlParams.has('__cf_chl_tk') || urlParams.has('__cf_chl_f_tk') || urlParams.has('__cf_chl_rt_tk') ) {
		urlParams.delete('__cf_chl_tk');
		urlParams.delete('__cf_chl_f_tk');
		urlParams.delete('__cf_chl_rt_tk');
		let newUrl = window.location.pathname + '?' + urlParams.toString();
		history.pushState(null, '', newUrl);
	}
}