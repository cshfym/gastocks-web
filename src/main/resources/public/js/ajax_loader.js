
$(document).ready(function() {
    hideLoader();
});

$(document).ajaxStart(function() {
  showLoader();
});

$(document).ajaxComplete(function() {
  hideLoader();
});

$(document).ajaxError(function() {
  hideLoader();
});

function showLoader() {
    $('#divLoading').show();
    $("#overlay").show();
}

function hideLoader() {
    $('#divLoading').hide();
    $("#overlay").hide();
}
