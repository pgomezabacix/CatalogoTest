//
// security library
//
// name 			- [ usage ]					description
// ====================================================================================================================
//
// required/req 		- [ required ] 					field is required.
// requireone			- [ required,required ]				at least one of these fields is required
// length/len   		- [ len=N ]    					field must be exactly N characters.
// maxlength/maxlen		- [ maxlen=N ]					field must not be more than N characters.
// minlength/minlen		- [ minlen=N ]					field must me atleast N characters.
// alphanumeric/alnum		- [ alnum ]					field must be A-Za-z0-9.
// numeric/num			- [ num ]  					field must 0-9.
// numfloat 			- [ numfloat ]  				field must 0-9 but it can have decimals
// numfloat2 			- [ numfloat2 ]  				field must 0-9 but it can have 1 or 2 decimals examples: 1, 1.1, 1.11
// alphabetic/alpha		- [ alpha ] 					field must be A-Za-z.
// alnumhyphen			- [ alnumhyphen ]				field must be A-Za-z0-9\-_.
// rfc				- [ rfc ]					field must be a valid rfc, match the pattern /^[A-ZÑ&]{3,4}[0-9]{2}[0-1][0-9][0-3][0-9][A-Z0-9]{2}[A0-9]$/
// zipcode			- [ zipcode ]					field must be a valid zip code, match the pattern /^[0-9]{5}$/
// email			- [ email ]					field must be "valid" email.
// validemail			- [ validemail ]					field must be "valid" email, but not required.
// lessthan/lt			- [ lt=N ]					field value must be less than N.
// greaterthan/gt		- [ gt=N ]					field value must be greater than N.
// selectoption			- [ selectoption ]				selected option in pulldown must not be 0.
// ischecked			- [ ischecked ]					checkbox field must be checked.
// money			- [ money ]					field must be numeric with two decimals
// passwordmatches		- [ passwordmatches ]				field and prefixed with '_' field must contain same value.
// phone			- [ phone ]					field must be numeric and exactly 10 characters.
// bool				- [ bool ]					field must have a value, similar to required.
// date				- [ date ]					field must math regexp /\d{2}\/\d{2}\/\d{4}/ (eg : 02/12/2007)
// listhasoptions		- [ listhasoptions ] 				listbox (multiple select) must have atleast one value.
// 										useful for javascript generated lists. (JAVASCRIPT ONLY)
// javascript			- [ javascript - function name instead of field name ]
//										function will be executed and must return true or false. (JAVASCRIPT ONLY)
// unique			- [ unique=TABLE.FIELD ]		field must not already exist in FIELD column of TABLE. (PERL ONLY)
// uniquecombo			- [ uniquecombo=TABLE.FIELD ]	combination of fields must not already exist in FIELD column of TABLE. (PERL ONLY)
//										the fields are separated by bars ( | )
//										eg. name|lastname:This name lastname combination already exists in the database.
// satconcept			- [ satconcept ]				field must validate via a_charges_x_check_sat_concept
// satunit			- [ satunit ]					field must validate via a_charges_x_check_sat_unit
//

var globalFormName;

function security(frmname, hide_loading) {

	globalFormName = frmname;

	this.formobj = document.forms[frmname];
	if (this.formobj)
		this.formobj.hide_loading = hide_loading ? true : false;

	if (!this.formobj) {
		alert("BUG : could not get form object " + frmname);
		return;
	}

	if (this.formobj.onsubmit) {
		this.formobj.old_onsubmit = this.formobj.onsubmit;
		this.formobj.onsubmit = null;
	}
	else {
		this.formobj.old_onsubmit = null;
	}

	if ($(this.formobj).filter('.x_submit').length) {
		this.formobj.validations = form_submit_handler;
	}
	else {
		this.formobj.onsubmit = form_submit_handler;
	}

	this.addvalidation = add_validation;
	this.setAddnlValidationFunction = set_addnl_vfunction;
	this.clearAllValidations = clear_all_validations;
	this.removeValidation = remove_validation;

}

function set_addnl_vfunction(functionname) {
	this.formobj.addnlvalidation = functionname;
}

function clear_all_validations() {
	for (var itr = 0; itr < this.formobj.elements.length; itr++) {
		this.formobj.elements[itr].validationset = null;
	}
}

function form_submit_handler() {
	for (var itr = 0; itr < this.elements.length; itr++) {

		if (this.elements[itr].validationset && !this.elements[itr].validationset.validate()) {
			return false;
		}

	}

	if (this.addnlvalidation) {
		str = " var ret = " + this.addnlvalidation + "()";
		eval(str);
		if (!ret) return ret;
	}

	//$(".alert").hide();

	if (!this.hide_loading) {
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
		$("#inner-container").append(HTML);
	}

}

function add_validation(itemname, descriptor, errstr) {

	if (!this.formobj) {
		alert("SX.ERR");
		return;
	}

	if (descriptor.substring(0, 7) === '(IFDEF)') {
		return;
	}

	if (descriptor === "javascript" || descriptor === "javascriptinput")
	{
		var hidden = manage_javascript(itemname, descriptor);
		this.formobj.appendChild(hidden);
		var itemobj = hidden;
	}
	else {
		var itemobj = this.formobj[itemname];
	}

	if (!itemobj) {
		alert("SX.ERR - missing object named: " + itemname);
		return;
	}

	if (!itemobj.validationset) {
		if (typeof (itemobj) == 'object' && itemobj.length > 0 && !itemobj.tagName) {
			for (var i = 0; i < itemobj.length; i++) {
				itemobj[i].validationset = new ValidationSet(itemobj[i]);
			}
		}
		else {
			itemobj.validationset = new ValidationSet(itemobj);
		}
	}

	if (typeof (itemobj) == 'object' && itemobj.length > 0 && !itemobj.tagName) {
		for (var i = 0; i < itemobj.length; i++) {
			itemobj[i].validationset.add(descriptor, errstr);
		}
	}
	else {
		itemobj.validationset.add(descriptor, errstr);
	}

}

function remove_validation(itemname, noAlert) {
	if (!this.formobj) {
		alert("SX.ERR");
		return;
	}

	let itemobj = this.formobj[itemname];

	let isJS = false;
	if (!itemobj) {
		const regexp = /\([^\)]*\)(.*)/;
		const itemJsId = 'jsinputval_' + itemname.replace(regexp, "$1");
		itemobj = document.getElementById(itemJsId);
		isJS = true;
	}
	if (!itemobj ) {
		if( !noAlert ) {
			alert("SX.ERR - missing object named: " + itemname);
		}
		return;
	}

	itemobj.validationset = null;
	if( isJS ) {
		itemobj.remove();
	}
}

function manage_javascript(itemname, descriptor){
	let errorElement = descriptor === 'javascriptinput';
	const regexp = /\([^\)]*\)/;
	// alert if function isnt defined
	let fullFunction;
	let function_name;
	let inputId = 'jsinputval_';
	if(errorElement){
		var split = itemname.split(regexp);
		function_name = split[0].replace(regexp, "");//replace the parentesis and parameters for empty
		fullFunction = itemname.substr(0,itemname.length - split[1].length );
		errorElement = split[1];
	}else {
		function_name = itemname.replace(regexp, "");//replace the parentesis and parameters for empty
		fullFunction = itemname;
	}
	inputId += function_name + ( errorElement ? errorElement : '' );

	if (!eval("typeof " + function_name + " == 'function'")) {
		alert("SX.ERR - missing js function: " + itemname);
		return;
	}

	var hidden = document.createElement("INPUT");
	hidden.id = inputId;
	hidden.type = "hidden";
	// this is how you do it in firefox
	// hidden.setAttribute("TYPE","hidden");
	hidden.javascript = true;
	hidden.function_name = function_name;
	//we find the params ( string )
	var patt = new RegExp( regexp );
	var params_exec = patt.exec(fullFunction);
	var params_string = '';
	if( params_exec.length > 0 && params_exec[0].length > 0 ) {
		params_string = params_exec[0].substr( 1, params_exec[0].length - 2).trim();
	}
	var params_object = params_string.split(',');
	hidden.function_params = $.map(params_object, function(value, index) {
		value = value.replace (/^\s*[\'\"]/, '');
		value = value.replace (/[\'\"]\s*$/, '');
		return [value];
	});
	// if javascriptinput
	if(errorElement){
		hidden.error_element = errorElement;
	}

	return hidden;
}

function ValidationDesc(inputitem, desc, error) {
	this.desc = desc;
	this.error = error;
	this.itemobj = inputitem;
	this.validate = vdesc_validate;
}

function vdesc_validate() {
	if (!V2validateData(this.desc, this.itemobj, this.error)) {

/*		if (this.itemobj.type == 'text' || this.itemobj.type == 'select-one') {
			this.itemobj.style.border = '1px #b11b1d dotted';
		}*/

		return false;
	}

	return true;

}

function ValidationSet(inputitem) {

	this.vSet = new Array();
	this.add = add_validationdesc;
	this.validate = vset_validate;
	this.itemobj = inputitem;

}

function add_validationdesc(desc, error) {
	this.vSet[this.vSet.length] = new ValidationDesc(this.itemobj, desc, error);
}

function vset_validate() {
	for (var itr = 0; itr < this.vSet.length; itr++) {
		if (!this.vSet[itr].validate()) {
			return false;
		}
	}
	return true;
}

function validateEmailv2(email) {
	if (email.length <= 0) {
		return true;
	}
	if( email.charAt(email.length - 1) == ";"){
		return false;
	}
	var email_regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
	var emails = email.split(/[;,]/);
	var result = true;
	emails.forEach((item) => {
		if(email_regex.test(item) == false) {
			result = false;
		}
	});

	return result;
}

function validateRFC(rfc) {
	if (rfc.length <= 0) return true;
	if (rfc.match(/^[A-ZÑ&]{3,4}[0-9]{2}[0-1][0-9][0-3][0-9][A-Z0-9]{2}[A0-9]$/) !== null) return true;

	return false;
}

function validateZipCode(zipCode) {
	if (zipCode.length <= 0) return true;
	if (zipCode.match(/^[0-9]{5}$/) !== null) return true;

	return false;
}

function validateCURP(curp) {
	if (curp.length <= 0) return true;
	if (curp.match(/^[A-Z][AEIOUX][A-Z]{2}[0-9]{2}[0-1][0-9][0-3][0-9][MH][A-Z]{2}[BCDFGHJKLMNÑPQRSTVWXYZ]{3}[0-9A-Z][0-9]$/) !== null) return true;

	return false;
}

function validate_sat_concept(value) {
	if (value.length != 8) return false;
	if (value === '00000000') return false;
	return true;
}

function validate_sat_unit(value) {
	if (value.length <= 1 || value.length > 3) return false;
	if (value == '000') return false;
	return true;
}

function message_and_highlight(objValue, strError) {
	highlight_form_item(objValue);
	display_error(strError);
	enableSubmit();
	return false;
}

function highlight_form_item(objValue) {
	var highlight;

	if (objValue.type == 'text' || objValue.type == 'select-one') {
		highlight = objValue;
	}
	else if (objValue.dataset != null && objValue.dataset.validation_field_highlight.length > 0) {
		highlight = document.getElementById(objValue.dataset.validation_field_highlight);
	}

	if (highlight != null) {
		highlight.classList.add('material-form__input--error');
		highlight.focus();
	}
}
function enableSubmit() {
	if ( $("form[data-block_form_button]").length ) {
		setTimeout( function() {
			$("input[type=submit]").removeAttr('disabled').removeClass('blocked_button');
			$("button.submit").removeAttr('disabled').removeClass('blocked_button');
			$("button[type=submit]").removeAttr('disabled').removeClass('blocked_button');

			var allForms = document.querySelectorAll("form:not(.material-form--footable)");

			for( i = 0; i < allForms.length; i++) {
				var form_name = allForms[i].attributes.name;
				$("#" + form_name.value + "_submit_clicked").val(0);
			}
			//$("input[type=button]").removeAttr('disabled').removeClass('blocked_button');
		}, 500 );
	}
}

function manageError(objValue,errorFake, errorMsgElement, strError ) {

    if (errorMsgElement) {
        errorMsgElement.textContent = strError;
    }else{
	display_error(strError);
    }
    if (errorFake) {
        errorFake.classList.add('material-form__input--error');
        errorFake.focus();
    } else {
		if(objValue){
			objValue.classList.add('material-form__input--error');
			objValue.focus();
		}
    }
	enableSubmit();
}
function manageErrorTinyMCE(objValue, errorMsgElement, strError ) {

	if (errorMsgElement) {
		errorMsgElement.textContent = strError;
		enableSubmit();
	}else{
		display_error(strError);
		enableSubmit();
	}
		document.querySelector('.mce-tinymce').classList.add('material-form__input--error');
		objValue.focus();

}
function manageClearErrorTinyMCE(objValue, errorMsgElement ) {
	if(errorMsgElement) {
		errorMsgElement.textContent = "";
	}
	document.querySelector('.mce-tinymce').classList.remove('material-form__input--error');

}

function manageErrorRadio(radios, strError ) {
	for (var i = 0; i < radios.length; i++) {
		radios[i].nextElementSibling.classList.add('material-check__radio-border--red');
	}
	display_error(strError);
	enableSubmit();
	radios[0].focus();
	//aun no se agregan los fake
}

function manageClearRadio(radios){
	for (var i = 0; i < radios.length; i++) {
		radios[i].nextElementSibling.classList.remove('material-check__radio-border--red');
	}
	document.getElementById('all-alerts').innerHTML = ''
}

function manageErrorCheckbox(checkboxes, strError, errorMsgElement ) {

	checkboxes.forEach(checkbox => {
		checkbox.nextElementSibling.firstElementChild.classList.add('material-check__radio-border--red');
	});

	if (errorMsgElement) {
        errorMsgElement.textContent = strError;
    } else{
		display_error(strError);
    }

	enableSubmit();
}

function manageClearCheckbox(checkboxes){
	checkboxes.forEach(checkbox => {
		checkbox.nextElementSibling.firstElementChild.classList.remove('material-check__radio-border--red');
	});

	document.getElementById('all-alerts').innerHTML = ''
}


function manageErrorSelect(objValue,errorFake, errorMsgElement, strError ) {
	if (errorMsgElement) {
		errorMsgElement.textContent = strError;
		enableSubmit();
	}else{
		display_error(strError);
		enableSubmit();
	}
	if (errorFake) {
		errorFake.classList.add('material-form__input--error');
		errorFake.focus();
	} else {
		if(objValue.offsetParent.querySelector('.select2-selection'))
		{
			objValue.offsetParent.querySelector('.select2-selection').classList.add('material-form__input--error');
			objValue.focus();
		}else{
			manageError(objValue,errorFake, errorMsgElement, strError);
		}
	}
}
function manageClearSelect(objValue, errorFake, errorMsgElement ) {
	if(errorMsgElement) {
		errorMsgElement.textContent = "";
	}

	if (errorFake) {
		errorFake.classList.remove('material-form__input--error');
	} else {
		if(objValue.offsetParent.querySelector('.select2-selection'))
		{
			objValue.offsetParent.querySelector('.select2-selection').classList.remove('material-form__input--error');
		}else{
			objValue.classList.remove('material-form__input--error');
		}
	}
}

function manageClearError(objValue, errorFake, errorMsgElement ) {
	if(errorMsgElement) {
		errorMsgElement.textContent = "";
	}

    if (errorFake) {
        errorFake.classList.remove('material-form__input--error');
    } else {
        objValue.classList.remove('material-form__input--error');
    }
}


function V2validateData(strValidateStr, objValue, strError) {
	var epos = strValidateStr.search("=");
	var command = "";
	var cmdvalue = "";
	var d = document.getElementById("box_status_message");
	var errorMsgElement = document.getElementById(objValue.id + "_error");
	var errorFake = document.getElementById(objValue.id + "_fake");


	if (epos >= 0) {
		command = strValidateStr.substring(0, epos);
		cmdvalue = strValidateStr.substr(epos + 1);
	}
	else {
		command = strValidateStr;
	}

	// dont do validations if the validation has the IFDEF modifier, and the value were validating is blank
	// ie - dont do all the password validations ( min length ) if no password was input, because the user doesnt want
	// to change it, but wants to change other elements in the form
	if (command.substring(0, 7) === '(IFDEF)') {
		command = command.substring(7);
		if (objValue.value.length === 0) {
			return true;
		}
	}
	//console.log(objValue);

	switch(command)
	{

	case "req":
	case "required":
		{

			var field_value = null;

			if (objValue.type == 'textarea') {

				try {

					field_value = tinyMCE.get(objValue.name).getContent();

					if (eval(field_value.length) == 0 || field_value.value == 0 || field_value.value == "0") {
						manageErrorTinyMCE(objValue, errorMsgElement, strError );
						return false;

					}else{
						manageClearErrorTinyMCE(objValue, errorMsgElement );
					}
				}
				catch (IGNORE) {
					field_value = objValue.value;
				}
			}
			else if (objValue.type == 'radio') {
				var result = false;
				var radios = document.getElementsByName(objValue.name);
				for (var i = 0; i < radios.length; i++) {
					result = result || radios[i].checked
				}

				result ? manageClearRadio(radios) : manageErrorRadio(radios, strError );
				return result;
			}
			else if (objValue.type =='checkbox') {
				const checkboxes = document.getElementsByName(objValue.name);
				let result = false;

				checkboxes.forEach((checkbox) => {
					result = result || checkbox.checked;
				});				

				result ? manageClearCheckbox(checkboxes) : manageErrorCheckbox(checkboxes, strError, errorMsgElement );
				return result;
			}
			else if (objValue.type == 'select-one') {
				if (eval(objValue.value.length) == 0 || objValue.value.value == 0 || objValue.value.value == "0" || objValue.value == '-1') {
					manageErrorSelect(objValue,errorFake, errorMsgElement, strError );
					return false;

				}else{
					manageClearSelect(objValue,errorFake, errorMsgElement, strError );
					field_value = objValue.value;
				}

			}
			else {
				field_value = objValue.value;
			}

			field_value = field_value.trim();
			if (eval(field_value.length) == 0 || field_value.value == 0 || field_value.value == "0") {
				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}else{
                manageClearError(objValue,errorFake, errorMsgElement, strError );
            }

			break;
		}
	case "requireone":
		{
			var fields = cmdvalue.split(',');
			var hasValue = false;

			for (var i = 0; i < fields.length; i++) {
				var fieldName = fields[i];
				var field = document.getElementsByName(fieldName)[0];

				if (field && field.value && field.value.trim().length > 0) {
					hasValue = true;
					break;
				}
			}

			if (!hasValue) {
				manageError(objValue, errorFake, errorMsgElement, strError);
				return false;
			}
			else {
				manageClearError(objValue, errorFake, errorMsgElement);
			}

			break;
		}
	case "length":
	case "len":
		{
			if (eval(objValue.value.length) != eval(cmdvalue)) {
				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "maxlength":
	case "maxlen":
		{
			if (eval(objValue.value.length) > eval(cmdvalue)) {
				manageError(objValue,errorFake, errorMsgElement, strError )
				return false;

			}
			break;
		}
	case "minlength":
	case "minlen":
		{
			if (eval(objValue.value.length) < eval(cmdvalue)) {
				manageError(objValue,errorFake, errorMsgElement, strError )
				return false;


			}
			break;
		}
		case "alnum":
	    case "alphanumeric":
		{
			var charpos = objValue.value.search("[^A-Za-z0-9]");
			if (objValue.value.length > 0 && charpos >= 0) {
				manageError(objValue,errorFake, errorMsgElement, strError )
				return false;

			}
			break;
		}
	case "num":
	case "numeric":
		{
			var charpos = objValue.value.search("[^0-9]");
			if (objValue.value.length > 0 && charpos >= 0) {
				manageError(objValue,errorFake, errorMsgElement, strError )
				return false;

			}
			break;
		}
	case "numfloat":
		{
			var regexp_numfloat = /^\d+\.*\d*$/;
			if (objValue.value.match(regexp_numfloat) == null) {
				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "numfloat2":
		{
			var regexp_numfloat = /^\d+(\.\d{1,2})?$/;
			if (objValue.value && objValue.value.match(regexp_numfloat) == null) {
				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;
			}
			break;
		}
	case "alphabetic":
	case "alpha":
		{
			var charpos = objValue.value.search("[^A-Za-z]");
			if (objValue.value.length > 0 && charpos >= 0) {
				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "alnumhyphen":
		{
			var charpos = objValue.value.search("[^A-Za-z0-9\-_]");
			if (objValue.value.length > 0 && charpos >= 0) {

				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "email":
		{
			if (!validateEmailv2(objValue.value) || !objValue.value.length) {

				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "validemail":
		{
			if (!validateEmailv2(objValue.value)) {
				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;
			}
			break;
		}
	case "rfc":
		{
			objValue.value = String(objValue.value).toUpperCase();

			if (!validateRFC(objValue.value) || !objValue.value.length) {
				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}

			break;
		}
	case "zipcode":
		{
			if (!validateZipCode(objValue.value)) {
				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;
			}

			break;
		}
	case "lt":
	case "lessthan":
		{
			if (isNaN(objValue.value) || eval(objValue.value) >= eval(cmdvalue)) {
				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "gt":
	case "greaterthan":
		{
			if (isNaN(objValue.value) || eval(objValue.value) <= eval(cmdvalue)) {

				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "selectoption":
		{
			if (!objValue.selectedIndex.valueOf()) {

				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "ischecked":
		{
			if (!objValue.checked) {

				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "passwordmatches":
		{

			var password_confirmation = "_" + objValue.name;

			if (objValue.value != document.forms[globalFormName][password_confirmation].value) {

				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "phone":
		{
			if (cmdvalue == "opt" && !objValue.value.length) {
				break;
			}

			var charpos = objValue.value.search("[^0-9]");

			if (objValue.value.length != 10) {

				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			else if (objValue.value.length > 0 && charpos >= 0) {

				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "bool":
		{
			if (objValue.value == 0) {
				display_error(strError);
				window.location.hash = "STATUSMESSAGES";
				return false;
			}
			break;
		}
	case "listhasoptions":
		{
			if (objValue.options.length == 0) {

				display_error(strError);
				return false;

			}
			break;
		}
	case "date":
		{
			var regexp_date = /^\d{2}\/\d{2}\/\d{4}/;
			if (objValue.value.match(regexp_date) == null) {

				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "money":
		{
			var regexp_money = /^\d+\.\d{2}$/;
			if (objValue.value.match(regexp_money) == null) {

				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "javascript":
		{
			var fn = window[objValue.function_name];
			var js_result = true;
			if (typeof fn === "function") {
				js_result = fn.apply(null, objValue.function_params);
			}
			if (!js_result) {
				manageError(objValue,errorFake, errorMsgElement, strError );
				return false;

			}
			break;
		}
	case "javascriptinput":
		{
			var fn = window[objValue.function_name];
			var js_result = true;
			if (typeof fn === "function") {
				js_result = fn.apply(null, objValue.function_params);
			}
			errorMsgElement = document.getElementById(objValue.error_element + "_error");
			errorFake = document.getElementById(objValue.error_element + "_fake");
			inputObj = document.getElementById(objValue.error_element);
			if (!js_result) {
				manageError(inputObj,errorFake, errorMsgElement, strError );
				return false;
			}else{
				if(inputObj){
					manageClearError(inputObj,errorFake, errorMsgElement, strError );
				}
			}
			break;
		}
	case "satconcept":
		{
			if (!validate_sat_concept(objValue.value)) {
				return message_and_highlight(objValue, strError);
			}
			break;
		}
	case "satunit":
		{
			if (!validate_sat_unit(objValue.value)) {
				return message_and_highlight(objValue, strError);
			}
			break;
		}

	}
	return true;
}
