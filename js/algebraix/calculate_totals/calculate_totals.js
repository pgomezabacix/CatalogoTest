function check_minimumpossible( GRADE, element ) {
	var MINIMUM_POSSIBLE_GRADE = parseFloat( $(element).data('minimum_possible_grade') );
	var USER_CONFIGURATION_CODE = $(element).data('user_configuration_code');
	var INFORMATION_ONLY = $(element).data('information_only');
	if ( isNaN(GRADE) ) {
		if ( isNaN(MINIMUM_POSSIBLE_GRADE) ) {
			GRADE = 0;
		}
		else {
			GRADE = MINIMUM_POSSIBLE_GRADE;
		}
	};
	
	var TYPE = $(element).attr('name').split('_')[0];
	
	if ( GRADE < MINIMUM_POSSIBLE_GRADE ) {
		if( !( USER_CONFIGURATION_CODE == 'T' && INFORMATION_ONLY == 1 ) && TYPE != 'f' ){
			GRADE = MINIMUM_POSSIBLE_GRADE;
		}
	}
	return GRADE;
}
function calculate_totals( div_id ) {

	var ALL_GRADES = [];
	var STUDENT_CLASS_GRADES = {};

	var ALL_EXTRA_CREDITS = [];
	var EXTRA_CREDIT_CLASSES = JSON.parse( $('#json_extra_credit_classes').val() );
	if( 'undefined' != typeof div_id && '' !== div_id) {
		div_id = '#' + div_id + ' ';
	} else {
		div_id = '';
	}
	// compile all needed data
	$(div_id+ ".CRITERIA_GRADE, " + div_id + ".NO_CRITERIA, " + div_id + ".EXTRA_CREDIT_GRADE").each( function() {
	
		var IS_MISSING = this.value ? false : true;
		var ORIGINAL_GRADE = $(this).val();
		var GRADE = parseFloat($(this).val());
		var MINIMUM_POSSIBLE_GRADE = parseFloat( $(this).data('minimum_possible_grade') );
		var MAXIMUM_POSSIBLE_GRADE = parseFloat( $(this).attr('max') );

		GRADE = check_minimumpossible( GRADE, this );

		if ( GRADE > MAXIMUM_POSSIBLE_GRADE ) {
			GRADE = MAXIMUM_POSSIBLE_GRADE;
		}

		if ( $(this).hasClass('CRITERIA_GRADE') ) {
		
			ROUNDING = {
				grade            : fp_convert( GRADE ),
				approved_method  : $(this).data('approved_period_rounding'),
				failed_method    : $(this).data('failed_period_rounding'),
				failed_value     : fp_convert( $(this).data('failed_period_value') ),
				minimum_passing  : fp_convert( $(this).data('minimum_passing_grade') ),
				minimum_possible : fp_convert( MINIMUM_POSSIBLE_GRADE ),
			};
			
									
			var PADDED_GRADE = fp_rounded_grade(ROUNDING);

			var DECIMALS = fp_get_decimals({
				grade            : PADDED_GRADE,
				approved_method  : $(this).data('approved_period_rounding'),
				failed_method    : $(this).data('failed_period_rounding'),
				minimum_passing  : fp_convert( $(this).data('minimum_passing_grade') ),
				minimum_possible : fp_convert( MINIMUM_POSSIBLE_GRADE ),
			});
			
			GRADE = fp_revert( fp_rounded_grade(ROUNDING), DECIMALS );
			GRADE = check_minimumpossible( GRADE, this );
		}

		var MINIMUM_PASSING_GRADE = $(this).data('minimum_passing_grade');
		var APPROVE_REQUIRED = parseInt($(this).data('approve_required'));
		
		var REQUIREMENTS_FAILED = false;
		
		if ( parseFloat(GRADE) < parseFloat(MINIMUM_PASSING_GRADE) && APPROVE_REQUIRED === 1 ) {
			REQUIREMENTS_FAILED = true;
		}
		
		var PERCENTAGE = $(this).attr('criteria_percentage');
		var NAME = $(this).attr('name');
		var VV = NAME.split('_');
		var CLASS_INSTANCE_ID = VV[1];
		var CLASS_DEFINITION_ID = VV[2];
		var STUDENT_ID = VV[3];
		var PERIOD_ID = VV[4];		
		var CRITERIA_ID = VV[7];		
		
		var KEY = CLASS_INSTANCE_ID + '_' + CLASS_DEFINITION_ID + '_' + STUDENT_ID + '_' + PERIOD_ID;

		if( '' === ORIGINAL_GRADE || parseFloat(ORIGINAL_GRADE) != parseFloat(GRADE) && $(this).data('msg_rounded_grade_diff_id') ) {
			$('#' + $(this).data('msg_rounded_grade_diff_id') ).attr('data-content', $(this).data('msg_rounded_grade_diff') + ' ' + GRADE);
			$('#' + $(this).data('msg_rounded_grade_diff_id') ).show();
		}
		else {
			$('#' + $(this).data('msg_rounded_grade_diff_id') ).hide();
		}
		if ( VV[0] == 'e' && EXTRA_CREDIT_CLASSES[CLASS_INSTANCE_ID] === 1 ) {
			// add up extra credits if this class has them
			ALL_EXTRA_CREDITS.push({
				'class_instance_id' : CLASS_INSTANCE_ID,
				'class_definition_id' : CLASS_DEFINITION_ID,
				'period_id' : PERIOD_ID,
				'student_id' : STUDENT_ID,
				'extra_credits' : $(this).val()
			});
		}
		else {

			ALL_GRADES.push({
				'class_instance_id' : CLASS_INSTANCE_ID,
				'class_definition_id' : CLASS_DEFINITION_ID,
				'period_id' : PERIOD_ID,
				'student_id' : STUDENT_ID,
				'criteria_id' : CRITERIA_ID,
				'percentage' : PERCENTAGE,
				'grade' : GRADE,
				'is_missing' : IS_MISSING
			});		
			
			if (!STUDENT_CLASS_GRADES[KEY]) {
				STUDENT_CLASS_GRADES[KEY] = {
					"_total_available" : 100,
					"_total_score" : 0,
					"_total_weighted" : 0,				
					"_total_score_criteria_count" : 0,
					"_total_criteria_count" : 0,
					"_total_missing_count" : 0,
					"_requirements_failed" : false,
					"grade" : 0
				};
			}
			
			if ( REQUIREMENTS_FAILED ) {
				STUDENT_CLASS_GRADES[KEY]._requirements_failed = true;
			}
		}
				
	});
	if ( ALL_GRADES.length > 0 ) {
		$.ajax('/bin/t/gradebooks/x_round_class_criteria/', {
			method: 'POST',
			async: false,
			data: {
				all_grades_json: JSON.stringify(ALL_GRADES),
				all_extra_credits_json: JSON.stringify(ALL_EXTRA_CREDITS)
			},
			success: function (data) {
				STUDENT_CLASS_GRADES = data.grades;
				for ( KEY in STUDENT_CLASS_GRADES ) {
					
					var AVERAGE = STUDENT_CLASS_GRADES[KEY].grade;
					
					var DIV_SELECTOR = "#CTOTAL_" + KEY;
					var VAL_SELECTOR = "#CVALUE_" + KEY;
					
					var VV = KEY.split('_');
					var CLASS_INSTANCE_ID = VV[0];
					var STUDENT_ID = VV[2];
					var PERIOD_ID = VV[3];
					
					var ATTENDANCE_REQUIREMENTS_FAILED = $(DIV_SELECTOR).data('attendance_requirements_failed');
					if (ATTENDANCE_REQUIREMENTS_FAILED !== 1) {
						$(DIV_SELECTOR).text(AVERAGE);
						$(VAL_SELECTOR).val(AVERAGE);
					}
				}
			},
			error: function (data) {
				console.log('Error!');
			}
		});
	}
	return;
}