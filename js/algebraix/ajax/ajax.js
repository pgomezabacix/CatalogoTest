var LANG = {
	ES: {
		its_necessary_to_specify_a_first_name_and_last_name: 'Es necesario especificar un nombre y apellido',
		username_is_invalid_2: 'Nombre de usuario inv&aacute;lido',
		username_empty_allowed: 'Se permite dejar el campo vac&iacute;o',
		username_pristine: 'Usuario de Google no ha cambiado',
		verified: 'Verificado',
		no_verified: 'No verificado',
	},
	EN: {
		its_necessary_to_specify_a_first_name_and_last_name: 'It is necessary to specify a first name and last name',
		username_is_invalid_2: 'Invalid username',
		username_empty_allowed: 'Leaving username field empty is allowed',
		username_pristine: 'Google username unchanged',
		verified: 'Verified',
		no_verified: 'No verified',
	}
};
var pristineForm = {};
$(document).ready(function() {
	initPristine();
	$('#inner-container').on('algebraix_page_did_change', initPristine);
	function initPristine(){
		pristineForm = {};
		var form = document.getElementsByTagName('form')[0];
		if ( form && form.id == 'a_search_default2' ) {
			form = document.getElementsByTagName('form')[1];
		}
		if (!form) {return}
		var elements = form.elements;
		for (var i = 0; i < elements.length; i++) {
			pristineForm[elements[i].name] = elements[i].value;
		};
	}
});

function ajax_request(url, callback) {
	var self = this;

	if (window.XMLHttpRequest) {
		self.xml_http_req = new XMLHttpRequest();
	} else if (window.ActiveXObject) {
		self.xml_http_req = new ActiveXObject("Microsoft.XMLHTTP");
	}

	self.xml_http_req.open('GET', url, true);

	self.xml_http_req.onreadystatechange = function() {
		if (self.xml_http_req.readyState == 4) {
			var r = JSON.parse(self.xml_http_req.responseText);
			if(callback) callback(r);
			if (r.status == 'OK') {
				switch (r.action) {
					case 'Redirect':
						document.location.href = r.redirect_to;
						break;
					case 'Message':
						switch (r.type) {
							case 'success':
								display_success(r.alerts[0].message);
								//display_success(r.message);
								break;
							case 'info':
								display_info(r.alerts[0].message);
								//display_info(r.message);
								break;
						}
				}
			} else if (r.status == 'Error') {
				display_error(r.alerts[0].message);
				//display_error(r.message);
			} else if ( r.alerts && r.alerts[0].code == 0 ){
				display_error(r.alerts[0].message);
				if ( r.alerts.length > 1 && r.alerts[1].message) {
					display_info(r.alerts[1].message,'box_status_message_shadow',true);
				}
			}
		}
	}

	self.xml_http_req.send();
}

function ajax_verify_username() {

var self = this;
var xml_http_req = false;
var username = document.getElementById("username").value;
var post_url = '/bin/a/users/ajax_check_username_availability/';

	if (!username) {
		display_error(LANG[__LANGUAGE_CODE].username_is_invalid_2);
		return;
	}

	if (window.XMLHttpRequest)
	{
        self.xml_http_req = new XMLHttpRequest();
    }
    else if (window.ActiveXObject) {
        self.xml_http_req = new ActiveXObject("Microsoft.XMLHTTP");
    }

	self.xml_http_req.open('POST', post_url, true);
	self.xml_http_req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

	self.xml_http_req.onreadystatechange = function()
	{
		if (self.xml_http_req.readyState == 4)
		{
			update_div(self.xml_http_req.responseText);
		}
    }

self.xml_http_req.send("value=" + username);

}
function ajax_verify_federated_username() {

	var self = this;
	var usernameInput = document.getElementById("federated_username");
	var gIcon = document.querySelector("#verify_federated_username i");
	var usernameInputError = usernameInput.parentElement.querySelector('#federated_username_error')
	var username = usernameInput.value;
	var domainInput = document.getElementById("federated_domain");
	var domain = domainInput.value;
	var single_domain = document.getElementById("federated_domain").length == 1 ? true : false;
	var post_url = '/bin/a/users/ajax_check_federated_username_availability/';

	return new Promise((resolve, reject) => {

		if (!username) {
			if (single_domain || !domain) {
				display_info(LANG[__LANGUAGE_CODE].username_empty_allowed);
			}
			else {
				display_error(LANG[__LANGUAGE_CODE].username_is_invalid_2);
			}
			return reject("");
		}
		if ( username == pristineForm.federated_username && domain == pristineForm.federated_domain ) {
			usernameInputError.classList.remove('text-red', 'text-green');
			usernameInputError.innerText="";
			gIcon.classList.remove('fas','fa-check','text-green', 'text-red');
			gIcon.classList.add('fab','fa-google','text-blue');
			gIcon.parentElement.classList.add('disabled','pointer-none');
			display_info(LANG[__LANGUAGE_CODE].username_pristine);
			return  resolve("");
		}

		if (window.XMLHttpRequest) {
			self.xml_http_req = new XMLHttpRequest();
		} else if (window.ActiveXObject) {
			self.xml_http_req = new ActiveXObject("Microsoft.XMLHTTP");
		}

		self.xml_http_req.open('POST', post_url, true);
		self.xml_http_req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

		self.xml_http_req.onreadystatechange = function() {
			if (self.xml_http_req.readyState == 4) {
				var res = self.xml_http_req.responseText.split(':');
				if (res[0] == 0) {
					display_error(res[1]);
					reject(self.xml_http_req.responseText);
				} else if (res[0] == 1) {
					usernameInputError.classList.add('text-green');
					usernameInputError.classList.remove('text-red');
					usernameInputError.innerText=LANG[__LANGUAGE_CODE].verified;
					gIcon.classList.remove('fab','fa-google','text-blue');
					gIcon.classList.add('fas','fa-check','text-green');
					display_success(res[1]);
					resolve(self.xml_http_req.responseText);
				}

			}
		}

		self.xml_http_req.send("username=" + username + "&domain=" + domain);

	});

}

function ajax_generate_username() {

var self = this;
var xml_http_req = false;

var lastname;

if ( document.getElementById('lastname') !== null ) {
	var lastname = remove_accents(document.getElementById("lastname").value);
}
else {
	var lastname1 = remove_accents(document.getElementById("lastname1").value);
	var lastname2 = remove_accents(document.getElementById("lastname2").value);
	lastname = lastname1 + ' ' + lastname2;
}
var name = remove_accents(document.getElementById("name").value);

var post_url = '/bin/a/users/x_generate_username/';

	if (!name || !lastname) {
		display_error(LANG[__LANGUAGE_CODE].its_necessary_to_specify_a_first_name_and_last_name);
		return;
	}

	if (window.XMLHttpRequest)
	{
        self.xml_http_req = new XMLHttpRequest();
    }
    else if (window.ActiveXObject) {
        self.xml_http_req = new ActiveXObject("Microsoft.XMLHTTP");
    }

	self.xml_http_req.open('POST', post_url, true);
	self.xml_http_req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

	self.xml_http_req.onreadystatechange = function()
	{
		if (self.xml_http_req.readyState == 4)
		{
			document.getElementById("username").value = self.xml_http_req.responseText;
		}
    }

self.xml_http_req.send("name=" + name + "&lastname=" + lastname);

}

function update_div(result) {

var ra = result.split(":");
	if (ra[0] == 0)
	{
		display_error(ra[1]);
	}
	else if (ra[0] == 1)
	{
		display_success(ra[1]);
	}
}

function x_load(url) {

var d = document.getElementById("box_status_message");

d.style.background = "#FFFFFF";
d.style.color = "#666666";
d.style.display = "block";
d.style.border = "1px solid #CCCCCC";
var msj = $("#box_status_message").data('message') ;
d.innerHTML = "<img src=/images/icons/loading.gif>&nbsp;<font size=\"+1\"><b>" + msj + "...</b></font>";

var self = this;
var xml_http_req = false;

    if (window.XMLHttpRequest) {
        self.xml_http_req = new XMLHttpRequest();
    }
    else if (window.ActiveXObject) {
        self.xml_http_req = new ActiveXObject("Microsoft.XMLHTTP");
    }

	self.xml_http_req.open('POST', url, true);
	self.xml_http_req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=ISO-8859-15;');

	self.xml_http_req.onreadystatechange = function()
	{
		if (self.xml_http_req.readyState == 4)
		{
			document.getElementById("main_content").innerHTML = self.xml_http_req.responseText;
		}
    }

self.xml_http_req.send("ajax_load=1");

}
