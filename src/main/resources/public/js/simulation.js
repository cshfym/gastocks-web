
$(document).ready(function() {
    loadAvailableSimulationsDropDown();
    resetSimulationData();
});

function loadAvailableSimulationsDropDown() {

    $("#ddlSimulationList").empty();

    var selectOption = "<option value=default>** Select Simulation **</option>";
    $(selectOption).appendTo("#ddlSimulationList");

    $.ajax({
        type: "GET",
        url: SERVER_URL + SIMULATIONS_PATH,
        dataType: "json",
        success: function (data) {
            $.each(data, function(i, object) {
                var option = "<option value=" + object.id + ">" + object.description + " (" + object.runDate + ")</option>";
                $(option).appendTo('#ddlSimulationList');
            });
        }
    });
}

function getSimulationFromServer(id) {

    $.ajax({
        url: SERVER_URL + SIMULATIONS_PATH + "/" + id + "/summary",
        cache: false,
        success: function(data) {

        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
             alert("Error calling /simulation: " + errorThrown);
             return [];
         }
    });
}

function loadSimulationData() {

    resetSimulationData();

    var selectedSimulationId = $("#ddlSimulationList").val();
    if (selectedSimulationId.startsWith("**")) {
        return;
    }

    $.ajax({
        url: SERVER_URL + SIMULATIONS_PATH + "/" + selectedSimulationId + SIMULATION_SUMMARY_PATH,
        cache: false,
        success: function(data) {
          if ((data.length == 0) || (data.symbolSimulationSummaries.length == 0)) {
            alert("No simulation data found!");
            return;
          }
          $("#divSimulationTitle").html(data.description + " (" + data.runDate + ")");
          var simulationData = [];
          var simulationSummaries = data.symbolSimulationSummaries;
          for(var i = 0; i < simulationSummaries.length; i++) {
            var symbolData = {
                "symbol": simulationSummaries[i].symbol,
                "total_investment": simulationSummaries[i].totalInvestment,
                "net_proceeds": simulationSummaries[i].netProceeds,
                "net_proceeds_pct": simulationSummaries[i].netProceedsPercentage,
                "gross_proceeds": simulationSummaries[i].grossProceeds,
                "gross_proceeds_pct": simulationSummaries[i].grossProceedsPercentage,
                "invest_period_days": simulationSummaries[i].investmentPeriodDays
            };
            simulationData.push(symbolData);
          }
          setTableData(simulationData);
          setSummaryHeaderLabels(data);
          setSimulationParameters(data);
          setParameterLabels(data);
          setMacdParameterLabels(data);
          setRsiParameterLabels(data);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
             alert("Error calling /simulation: " + errorThrown);
             return [];
         }
    });
}

function resetSimulationData() {

    setTableData([]);

    $("#spanTotalInvestment").html("");
    $("#spanNetProceeds").html("");
    $("#spanGrossProceeds").html("");
    $("#spanTotalCommissionCost").html("");
    $("#spanTotalTransactionCount").html("");
    $("#txtSimulationParameters").val("");

    $("#spanDescription").html("");
    $("#spanShares").html("");
    $("#spanCommissionCost").html("");
    $("#spanMaxPurchasePrice").html("");
    $("#spanMinPurchasePrice").html("");
    $("#spanMacdPositiveTrigger").html("");
    $("#spanMacdShortPeriod").html("");
    $("#spanMacdLongPeriod").html("");
    $("#spanRsiInterval").html("");
    $("#spanRsiOverBoughtLine").html("");
    $("#spanRsiOverSoldLine").html("");
    $("#spanSellOpenPositions").html("");
    $("#spanOnlyTransactOnPriceChange").html("");
}

function resetSimulationInputs() {

    $("#txtSimulationDescription").val("");
    $("#txtCommissionCost").val("");
    $("#txtShares").val("");
    $("#txtMaxPurchasePrice").val("");
    $("#txtMinPurchasePrice").val("");
    $("#txtMacdShortPeriod").val("");
    $("#txtMacdLongPeriod").val("");
    $("#txtSimulationSymbols").val("");
    $("#ckSellOpenPositions").attr('checked', false);
    $("#ckOnlyTransactOnPriceChange").attr('checked', true);
    $("#ckMacdPositiveOnly").attr('checked', false);
}

function setTableData(data) {
    $('#tblSimulation').bootstrapTable("load", data);
    $('#tblSimulation').bootstrapTable({
        data: data
    });
}

function setSummaryHeaderLabels(data) {

    $("#spanTotalInvestment").html(currencyFormatter(data.totalInvestment));
    $("#spanNetProceeds").html(currencyFormatter(data.netProceeds) + " (" + percentageFormatter(data.netProceedsPercentage) + ")");
    $("#spanGrossProceeds").html(currencyFormatter(data.grossProceeds) + " (" + percentageFormatter(data.grossProceedsPercentage) + ")");
    $("#spanTotalCommissionCost").html(currencyFormatter(data.totalCommissionCost));
    $("#spanTotalTransactionCount").html(integerFormatter(data.transactionCount));
}

function setParameterLabels(data) {

    var parameterJson = JSON.parse(data.attributes);

    $("#spanShares").html(parameterJson.shares);
    $("#spanCommissionCost").html(currencyFormatter(parameterJson.commissionPrice));
    $("#spanMaxPurchasePrice").html(currencyFormatter(parameterJson.maxPurchasePrice));
    $("#spanMinPurchasePrice").html(currencyFormatter(parameterJson.minPurchasePrice));
    $("#spanSellOpenPositions").html(parameterJson.sellOpenPositions.toString());
    $("#spanOnlyTransactOnPriceChange").html(safeCheckBoolean(parameterJson.onlyTransactOnPriceChange).toString());
}

function setMacdParameterLabels(data) {

    var parameterJson = JSON.parse(data.attributes);

    var macdPositiveTrigger = parameterJson.macdParameters.macdPositiveTrigger;
    $("#spanMacdPositiveTrigger").html(macdPositiveTrigger.toString());
    $("#spanMacdShortPeriod").html(parameterJson.macdParameters.macdShortPeriod);
    $("#spanMacdLongPeriod").html(parameterJson.macdParameters.macdLongPeriod);
}

function setRsiParameterLabels(data) {

    var parameterJson = JSON.parse(data.attributes);

    $("#spanRsiInterval").html(parameterJson.rsiRequestParameters.interval);
    $("#spanRsiOverBoughtLine").html(parameterJson.rsiRequestParameters.overBoughtLine);
    $("#spanRsiOverSoldLine").html(parameterJson.rsiRequestParameters.overSoldLine);
}

function setSimulationParameters(data) {
    $("#txtSimulationParameters").val(data.attributes);
}

function createAndSubmitSimulation() {

    if (!confirm("Submit simulation, are you sure?")) { return; }

    var symbolList = $("#txtSimulationSymbols").val().split(",");

    var postData = {
        description: $("#txtSimulationDescription").val(),
        commissionPrice: $("#txtCommissionCost").val(),
        shares: $("#txtShares").val(),
        symbols: symbolList,
        maxPurchasePrice: $("#txtMaxPurchasePrice").val(),
        minPurchasePrice: $("#txtMinPurchasePrice").val(),
        sellOpenPositions: $("#ckSellOpenPositions").is(':checked') ? true : false,
        onlyTransactOnPriceChange: $("#ckOnlyTransactOnPriceChange").is(':checked') ? true : false,
        macdParameters: {
            macdShortPeriod: $("#txtMacdShortPeriod").val(),
            macdLongPeriod: $("#txtMacdLongPeriod").val(),
            macdPositiveTrigger: $('#ckMacdPositiveOnly').is(':checked') ? true : false
        },
        rsiRequestParameters: {
            interval: $("#txtRsiInterval").val(),
            overBoughtLine: $("#txtRsiOverBoughtLine").val(),
            overSoldLine: $("#txtRsiOverSoldLine").val()
        }
    };

    $.ajax({
        type: "POST",
        url: SERVER_URL + SIMULATIONS_PATH,
        contentType: "application/json",
        dataType: "json",
        data: JSON.stringify(postData),
        success: function (data) {
            alert("Good to go!");
            resetSimulationInputs();
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            alert("Error calling POST " + SERVER_URL + SIMULATIONS_PATH + ": " + errorThrown);
            return;
        }
    });
}

function queryParams() {
    return {
        type: 'owner',
        sort: 'updated',
        direction: 'desc',
        per_page: 100,
        page: 1
    };
}

