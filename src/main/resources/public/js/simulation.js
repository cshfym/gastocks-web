var SERVER_URL = "http://localhost:9981/gastocks-server";
var SIMULATIONS_PATH = "/simulations";
var SIMULATION_SUMMARY_PATH = "/summary?compact=true"

$(document).ready(function() {
    loadAvailableSimulationsDropDown();
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
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
             alert("Error calling /simulation: " + errorThrown);
             return [];
         }
    });
}

function setTableData(data) {
    $('#tblSimulation').bootstrapTable({
        data: data
    });
}

function setSummaryHeaderLabels(data) {

    $("#spanTotalInvestment").html("$" + data.totalInvestment);
    $("#spanNetProceeds").html("$" + data.netProceeds + " (" + data.netProceedsPercentage + "%)");
    $("#spanGrossProceeds").html("$" + data.grossProceeds + " (" + data.grossProceedsPercentage + "%)");
    $("#spanCommissionCost").html("$" + data.totalCommissionCost);

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
    }

    return '$' + value;
}

function percentageFormatter(value) {
    return value + '%';
}
