
var loadedSymbolData = [];

$(document).ready(function() {
    loadSymbolDropDown();
});

function loadSymbolDropDown() {

    var min52Weeks = $("#txtMin52WeekPrice").val();
    var max52Weeks = $("#txtMax52WeekPrice").val();


    if (isNullOrUndefined(min52Weeks)) { min52Weeks = 0; }
    if (isNullOrUndefined(max52Weeks)) { max52Weeks = 9999999999.99; }

    var postData = {
        maxQuotePrice: max52Weeks,
        minQuotePrice: min52Weeks,
        sector: "Utilities",
        industryCategory: "",
        industrySubCategory: ""

    };

    $.ajax({
        type: "POST",
        url: SERVER_URL + SYMBOLS_VSE_PATH,
        cache: false,
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(postData),
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
                    "company_name": object.companyName,
                    "min_price": object.minPrice,
                    "max_price": object.maxPrice,
                    "avg_price": object.avgPrice,
                    "max_price_stdev": object.maxPriceStdev,
                    "avg_price_stdev": object.avgPriceStdev,
                    "sector": object.sector,
                    "industry_category": object.industryCategory,
                    "industry_sub_category": object.industrySubCategory
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
