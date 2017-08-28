
var MAX_SYMBOLS_LOAD = 50;

$(document).ready(function() {
    loadSymbolDropDown();
});

function loadSymbolDropDown() {

    $.ajax({
        url: SERVER_URL + SYMBOLS_PATH,
        cache: true,
        success: function(symbolData) {
            if (symbolData.length == 0) {
                alert("No symbols found!");
                return;
            }

            $.each(symbolData, function(i, object) {

                if (i > MAX_SYMBOLS_LOAD) { return; }

                var option = "<option value=" + object.identifier + ">" + object.description + " (" + object.identifier + ") [" + object.exchangeMarket + "]</option>";
                $(option).appendTo('#ddlSymbols');
            });

        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
             alert("Error calling /symbols!");
             return;
          }
    });
}