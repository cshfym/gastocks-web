
var loadedSymbolData = [];

$(document).ready(function() {
    loadSymbolDropDown();
});

function loadSymbolDropDown() {

    var min52Weeks = $("#txtMin52WeekPrice").val();
    var max52Weeks = $("#txtMax52WeekPrice").val();

    var OPTIONS = "";
    if (!isNullOrUndefined(min52Weeks) && !isNullOrUndefined(max52Weeks)) {
        OPTIONS = "?minQuotePrice=" + min52Weeks + "&maxQuotePrice=" + max52Weeks;
    }

    $.ajax({
        url: SERVER_URL + SYMBOLS_VSE_PATH + OPTIONS,
        cache: true,
        success: function(symbolData) {
            if (symbolData.length == 0) {
                alert("No symbols found!");
                return;
            }

            var symbolTableData = [];
            setSymbolTableData([]);

            $.each(symbolData, function(i, object) {
                var option = "<option value=" + object.identifier + ">" + object.description + " (" + object.identifier + ") [" + object.exchangeMarketShortName + "]</option>";
                $(option).appendTo('#ddlSymbols');
                var symbolData = {
                    "symbol": object.identifier,
                    "description": object.description,
                    "min_price": object.minPrice,
                    "max_price": object.maxPrice,
                    "avg_price": object.avgPrice,
                    "max_price_stdev": object.maxPriceStdev,
                    "avg_price_stdev": object.avgPriceStdev,
                    "sector": object.sector,
                    "industry": object.industry
                };
                symbolTableData.push(symbolData);
            });

            setSymbolTableData(symbolTableData);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
             alert("Error calling /symbols!");
             return;
          }
    });
}

function setSymbolTableData(data) {

    $('#tblSymbols').bootstrapTable("load", data);
    $('#tblSymbols').bootstrapTable({
        data: data
    });

    loadedSymbolData = data;
}

function promptCopySymbolList() {

    var symbolList = buildSymbolList();

    window.prompt("Copy to clipboard: Ctrl+C, Enter", symbolList);
}

function buildSymbolList() {

    var symbolList = "";

    $.each(loadedSymbolData, function(i, object) {
        symbolList += object.symbol;
        if (i < (loadedSymbolData.length - 1)) {
            symbolList += ",";
        }
    });

    return symbolList;
}
