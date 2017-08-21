
$(document).ready(function() {
    loadAvailableSimulationsDropDown();
});

function loadAvailableSimulationsDropDown() {

    $.ajax({
        url: "http://localhost:9981/gastocks-server/simulation/402881a55e01e784015e01eec66e0000/summary",
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

    $.ajax({
        url: "http://localhost:9981/gastocks-server/simulation/402881a55e01e784015e01eec66e0000/summary",
        cache: false,
        success: function(data) {
          if ((data.length == 0) || (data.symbolSimulationSummaries.length == 0)) {
            alert("No simulation data found!");
            return;
          }
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
