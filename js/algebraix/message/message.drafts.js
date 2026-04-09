function __GBX_MESSAGE_DRAFT_SAVER() {
	
	this.timer = {};
	this.message_has_changed = false;
	this.form_signature = '';

	this.initialize = function( PP ) {
		
		var CHAIN_ID = PP.form.find('input[name="chain_id"]').val();
		
		if ( CHAIN_ID != undefined && CHAIN_ID.length === 8 ) {
			var FORM_CONTENT = JSON.stringify( PP.form.serializeArray() ) + PP.base64_message_content;
			var FORM_SIGNATURE = Base64.encode( FORM_CONTENT );
			this.form_signature = FORM_SIGNATURE;
		}
		
	};

	this.save_every_8s = function( PP ) {
	
		this.timer = setInterval(function () {
				
			var DRAFT_ID = PP.form.find('input[name="draft_id"]').val();
			if ( typeof(DRAFT_ID) === 'undefined' ) return false;
			
			var CHAIN_ID = PP.form.find('input[name="chain_id"]').val();
			var MESSAGE = tinyMCE.get('wysiwyg_message').getContent();
			
			var FORM_CONTENT = JSON.stringify(PP.form.serializeArray()) + Base64.encode( MESSAGE );
			var FORM_SIGNATURE = Base64.encode( FORM_CONTENT );
			
			if ( FORM_SIGNATURE !== this.__GBX_DRAFT_SAVER.form_signature ) {
				this.__GBX_DRAFT_SAVER.message_has_changed = true;
			}
			
			this.__GBX_DRAFT_SAVER.form_signature = FORM_SIGNATURE;
			
			var ACTION_ID = PP.form.find('input[name="action_id"]').val();
			var RECIPIENT_ID_STRING = PP.form.find('input[name="recipient_id"]').val();
			var SUBJECT = PP.form.find('input[name="subject"]').val();
			var SHOW_RECIPIENTS = PP.form.find('input[name="show_recipients"]').prop('checked')  ? 1 : 0;
			var IS_NOTICE = PP.form.find('input[name="is_notice"]').prop('checked')  ? 1 : 0;
			var IS_FORWARD = PP.form.find('input[name="is_forward"]').val();
			var MESSAGE_SENDED = PP.form.find(`input[id="${PP.form.attr('id')}_submit_clicked"]`).val();
			const TEMPLATE_ID = PP.form.find('select[name="template_id"]').val();
			const VARIABLES = PP.form.find('input[name="variables"]').val();
			const CEC_ID = PP.form.find('input[name="cec_id"]').val();
			
			if ( this.__GBX_DRAFT_SAVER.message_has_changed && SUBJECT.length > 2 && MESSAGE_SENDED == 0) {
				
				var URL = '/bin/' + PP.auth + '/messaging/x_save_draft/';

				$.post( URL,
					{
						draft_id : DRAFT_ID,
						chain_id : CHAIN_ID,
						action_id : ACTION_ID,
						recipient_id_string : RECIPIENT_ID_STRING,
						subject : SUBJECT,
						message : MESSAGE,
						show_recipients : SHOW_RECIPIENTS,
						is_notice : IS_NOTICE,
						is_forward : IS_FORWARD,
						template_id : TEMPLATE_ID,
						variables: VARIABLES,
						cec_id: CEC_ID,
					},
					function( RESPONSE ) {
						if ( RESPONSE === 'OK' ) {
							var HTML = "<div class='text-green' style='float:right;font-weight:500'>";
							HTML += '<i class="fas fa-circle-check"></i> ';
							HTML += PP.draft_saved_message + "</div>";
							var EL = $(HTML);
							PP.form.find('input[name="subject"]').after( EL );
							EL.delay(3000).fadeOut('slow');
						}
					}
				);
				
				this.__GBX_DRAFT_SAVER.message_has_changed = false;
				
			}
			
		}, 8000);
	}

};
