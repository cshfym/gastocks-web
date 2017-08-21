
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
