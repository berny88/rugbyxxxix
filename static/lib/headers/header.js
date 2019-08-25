// Build Error message function
function showAlertError(message) {
	showAlertErrorCommon(message, "alert_error_placeholder");
}

// Build Success message function
function showAlertSuccess(message) {
	showAlertSuccessCommon(message, "alert_success_placeholder");
}

// Build Warning message function
function showAlertWarning(message) {
	showAlertWarningCommon(message, "alert_warning_placeholder");
}

//Build Info message function
function showAlertInfo(message) {
	showAlertInfoCommon(message, "alert_info_placeholder");
}

/**
 * common message zone
 */
//Build Error message function
function showAlertErrorCommon(message, idHtmlElt) {
	$("#" + idHtmlElt)
			.html('<div class="alert alert-danger alert-dismissable">'
                        + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
						+ message + '</div>');
	$("#div_" + idHtmlElt).show();
}

//Build Success message function
function showAlertSuccessCommon(message, idHtmlElt) {
	$("#" + idHtmlElt)
			.html('<div class="alert alert-success alert-dismissable">'
			            + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
			            + message + '</div>');
	$("#div_" + idHtmlElt).show();
}

// Build Warning message function
function showAlertWarningCommon(message, idHtmlElt) {
	$("#" + idHtmlElt)
			.html('<div class="alert alert-warning alert-dismissable">'
                        + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
                        + message + '</div>');
	$("#div_" + idHtmlElt).show();
}

//Build Info message function
function showAlertInfoCommon(message, idHtmlElt) {
	$("#" + idHtmlElt)
			.html('<div class="alert alert-info alert-dismissable">'
                        + '<button type="button" class="close" data-dismiss="alert" aria-label="Close"><span aria-hidden="true">&times;</span></button>'
						+ message + '</div>');
	$("#div_" + idHtmlElt).show();
}

/**
 * hideAlerts
 * param not mandatory, but it can be a string or an arry of string
 */
function hideAlerts(idHtmlElts) {
	$("#div_alert_error_placeholder").hide();
	$("#div_alert_warning_placeholder").hide();
	$("#div_alert_success_placeholder").hide();
	$("#div_alert_info_placeholder").hide();
	
	// if is an arry or a string
	if(idHtmlElts != null) {
		if(typeof(idHtmlElts) == 'array') {
			for(i = 0; i < idHtmlElts.length; i++) {
				$("#div_" + idHtmlElts[i]).hide();
			}
			
		} else if(typeof(idHtmlElts) == 'string') {
			$("#div_" + idHtmlElts).hide();
		}
	} 
};
