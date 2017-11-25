
var loadedSymbolData = [];

var noSectorSelection = "** Sector (Optional) **";
var noIndustrySelection = "** Industry (Optional) **";

$(document).ready(function() {
    loadAvailableSectorsDropDown();
    loadAvailableIndustriesDropDown();
    //loadSymbolTable();
});

function loadAvailableSectorsDropDown() {

    $("#ddlSectorList").empty();

    var selectOption = "<option value=default>" + noSectorSelection + "</option>";
    $(selectOption).appendTo("#ddlSectorList");

    $.ajax({
        type: "GET",
        url: SERVER_URL + SECTORS_PATH,
        dataType: "json",
        success: function (data) {
            $.each(data, function(i, object) {
                var option = "<option value=" + object.id + ">" + object.description + "</option>";
                $(option).appendTo('#ddlSectorList');
            });
        }
    });
}

function loadAvailableIndustriesDropDown() {

    $("#ddlIndustriesList").empty();

    var selectOption = "<option value=default>" + noIndustrySelection + "</option>";
    $(selectOption).appendTo("#ddlIndustriesList");

    $.ajax({
        type: "GET",
        url: SERVER_URL + INDUSTRIES_PATH,
        dataType: "json",
        success: function (data) {
            var uniqueIndustryNames = [];
            $.each(data, function(i, el){
                if($.inArray(el.category, uniqueIndustryNames) === -1) uniqueIndustryNames.push(el.category);
            });
            $.each(uniqueIndustryNames, function(i, object) {
                var option = "<option value=default>" + object + "</option>";
                $(option).appendTo('#ddlIndustriesList');
            });
        }
    });
}

function loadSymbolTable() {

    // Price Range
    var min52Weeks = $("#txtMin52WeekPrice").val();
    var max52Weeks = $("#txtMax52WeekPrice").val();
    if (isNullOrUndefined(min52Weeks)) { min52Weeks = 0; }
    if (isNullOrUndefined(max52Weeks)) { max52Weeks = 9999999999.99; }

    // Sector
    var selectedSector = $("#ddlSectorList option:selected").text();
    if (selectedSector.startsWith(noSectorSelection)) {
        selectedSector = "";
    }

    // Industry
    var selectedIndustry = $("#ddlIndustriesList option:selected").text();
    if (selectedIndustry.startsWith(noIndustrySelection)) {
        selectedIndustry = "";
    }

    var postData = {
        maxQuotePrice: max52Weeks,
        minQuotePrice: min52Weeks,
        sector: selectedSector,
        industryCategory: selectedIndustry,
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
            setSymbolTableData([]);
            if (symbolData.length == 0) {
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
