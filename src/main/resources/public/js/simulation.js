
var SERVER_URL = "http://localhost:9981/gastocks-server";
var SIMULATIONS_PATH = "/simulations";
var SIMULATION_SUMMARY_PATH = "/summary?compact=true"

$(document).ready(function() {
    loadAvailableSimulationsDropDown();
    resetSimulationData();
});

function loadAvailableSimulationsDropDown() {
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
                "gross_proceeds_pct": simulationSummaries[i].grossProceedsPercentage
            };
            simulationData.push(symbolData);
          }
          setTableData(simulationData);
          setSummaryHeaderLabels(data);
          setSimulationParameters(data);
          setParameterLabels(data);
          setMacdParameterLabels(data);
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
    $("#txtSimulationParameters").val("");

    $("#spanDescription").html("");
    $("#spanShares").html("");
    $("#spanCommissionCost").html("");
    $("#spanMaxPurchasePrice").html("");
    $("#spanMacdPositiveTrigger").html("");
    $("#spanMacdShortPeriod").html("");
    $("#spanMacdLongPeriod").html("");
}

function setTableData(data) {
    $('#tblSimulation').bootstrapTable("load", data);
    $('#tblSimulation').bootstrapTable({
        data: data
    });
}

function setSummaryHeaderLabels(data) {

    $("#spanTotalInvestment").html("$" + data.totalInvestment);
    $("#spanNetProceeds").html(currencyFormatter(data.netProceeds) + " (" + percentageFormatter(data.netProceedsPercentage) + ")");
    $("#spanGrossProceeds").html(currencyFormatter(data.grossProceeds) + " (" + percentageFormatter(data.grossProceedsPercentage) + ")");
    $("#spanTotalCommissionCost").html("$" + data.totalCommissionCost);
}

function setParameterLabels(data) {

    var parameterJson = JSON.parse(data.attributes);

    $("#spanShares").html(parameterJson.shares);
    $("#spanCommissionCost").html("$" + parameterJson.commissionPrice);
    $("#spanMaxPurchasePrice").html("$" + parameterJson.maxPurchasePrice);
}

function setMacdParameterLabels(data) {

    var parameterJson = JSON.parse(data.attributes);

    $("#spanMacdPositiveTrigger").html(parameterJson.macdParameters.macdPositiveTrigger);
    $("#spanMacdShortPeriod").html(parameterJson.macdParameters.macdShortPeriod);
    $("#spanMacdLongPeriod").html(parameterJson.macdParameters.macdLongPeriod);
}

function setSimulationParameters(data) {
    $("#txtSimulationParameters").val(data.attributes);
}

function createAndSubmitSimulation() {

    if (!confirm("Submit simulation, are you sure?")) { return; }

    var postData = {
        description: $("#txtSimulationDescription").val(),
        commissionPrice: $("#txtCommissionCost").val(),
        shares: $("#txtShares").val(),
        symbols: [ "MYGN" ],
        macdParameters: {
            macdShortPeriod: $("#txtMacdShortPeriod").val(),
            macdLongPeriod: $("#txtMacdLongPeriod").val(),
            macdPositiveTrigger: $('#ckMacdPositiveOnly').is(':checked') ? true : false
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
            // Clear fields
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

function currencyFormatter(value) {

    if (value.toString().startsWith("-")) {
        return '<span style="color: red;">-$' + value.toString().replace("-","") + '</span>';
    } else {
        return '<span style="color: #3d7532;">$' + value.toString() + '</span>';
    }

    return '$' + value;
}

function percentageFormatter(value) {

    if (value.toString().startsWith("-")) {
        return '<span style="color: red;">-' + value.toString().replace("-","") + '%</span>';
    } else {
        return '<span style="color: #3d7532;">' + value.toString() + '%</span>';
    }

    return value + '%';
}
