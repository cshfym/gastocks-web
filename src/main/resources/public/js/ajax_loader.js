
$(document).ready(function() {
    hideLoader();
});

$(document).ajaxStart(function() {
  showLoader();
});

$(document).ajaxComplete(function() {
  hideLoader();
});


function showLoader() {
    $('#divLoading').show();
}

function hideLoader() {
    $('#divLoading').hide();
}
