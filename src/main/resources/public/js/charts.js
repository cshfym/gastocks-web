
$(document).ready(function() {
    console.log("Document ready!");
    registerSymbolAutoComplete();
});

function registerSymbolAutoComplete() {

    $.ajax({
        url: "http://localhost:9981/gastocks-server/symbols",
        cache: true,
        success: function(symbolData) {
          if (symbolData.length == 0) {
            alert("No data found!");
            return;
          }
          var symbolNames = [];
          for (var i = 0; i < symbolData.length; i++) {
            symbolNames.push(symbolData[i].identifier);
          }
          $("#txtSymbol").autocomplete({
              source: symbolNames
          });
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
             alert("Error calling /symbols!");
             return;
          }
    });
}

function ajaxBuildPriceHistory(tradingDaysCount) {

    var symbol = $("#txtSymbol").val();
    var emaShortDays = $("#txtEMAShort").val();
    var emaLongDays = $("#txtEMALong").val();
    var showEMA = $('#ckShowEMA').is(':checked');

      $.ajax({
            url: "http://localhost:9981/gastocks-server/technicalquote/" + symbol + "/" + emaShortDays + "/" + emaLongDays,
            cache: false,
            success: function(data) {
              if (data.length == 0) {
                alert("No data found!");
                return;
              }
              drawQuoteChart(data, tradingDaysCount, showEMA, emaShortDays, emaLongDays);
              drawMACDChart(data, tradingDaysCount, emaShortDays, emaLongDays);
              // loadSimulationData(symbol);
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                 alert("Error calling /technicalquote with symbol [" + symbol + "]");
                 return [];
             }
       });

}

function loadSimulationData(symbol) {

      $.ajax({
            url: "http://localhost:9981/gastocks-server/simulation" + "/" + "402881a55dedec14015dedee569e0000" + "/" + symbol + "/transactions",
            cache: false,
            success: function(data) {
              if (data.length == 0) {
                return;
              }
              buildSimulationTable(data);
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                 alert("Error calling /technicalquote with symbol [" + symbol + "]");
                 return [];
             }
       });
}

function buildSimulationTable(data) {
    var simulationTable = "<table style='border: 1px solid red;'>";
    simulationTable += "<tr><th>#</th><th>Shares</th><th>Net Proceeds</th><th>Purchase Price</th><th>Purchase Date</th>" +
        "<th>Sell Price</th><th>Sell Date</th></tr>";
    for(var i = 0; i < data.length; i++) {
        var netProceeds = Math.round(((data[i].shares * (data[i].sellPrice - data[i].purchasePrice)) - data[i].commission) * 100) / 100;
        simulationTable += "<tr>";
        simulationTable += "<td>" + (i + 1) + "</td>";
        simulationTable += "<td>" + data[i].shares + "</td>";
        simulationTable += "<td>" + netProceeds + "</td>";
        simulationTable += "<td>" + data[i].purchasePrice + "</td>";
        simulationTable += "<td>" + data[i].purchaseDate + "</td>";
        simulationTable += "<td>" + data[i].sellPrice + "</td>";
        simulationTable += "<td>" + data[i].sellDate + "</td>";
        simulationTable += "</tr>";
    }
    simulationTable += "</table>"
    $("#divSimulationData").html(simulationTable)
}

function drawMACDChart(quoteData, tradingDaysCount, emaShortDays, emaLongDays) {

    var fromDate = Date.parse($("#txtFromDate").val());
    var toDate = Date.parse($("#txtToDate").val());

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'X');
    dataTable.addColumn('number', 'MACD');
    dataTable.addColumn('number', 'Signal Line');
    dataTable.addColumn('number', 'MACD Hist');

    var visibleQuotes = [];

    // Quotes come in descending in order

    for (var i = 0; i < quoteData.length; i++) {

        if (i >= tradingDaysCount) { continue; }

        // Quote date fall within user-specified date window?
        var quoteDate = Date.parse(quoteData[i].quoteDate);
        if ((isNaN(fromDate) == false) && (isNaN(toDate) == false)) {
            if ((quoteDate < fromDate) || (quoteDate > toDate)) {
            continue;
            }
        }

        var quoteElement = [];
        quoteElement.push(quoteData[i].quoteDate); // Quote Date
        quoteElement.push(quoteData[i].macd);
        quoteElement.push(quoteData[i].macdSignalLine);
        quoteElement.push(quoteData[i].macdHist);

        visibleQuotes.push(quoteElement);
    }

    visibleQuotes.reverse(); // Display ascending

    dataTable.addRows(visibleQuotes);

    var title = tradingDaysCount + " Days";
    if (typeof tradingDaysCount == "undefined") {
        title = "All Available"
    }

    var options = {
        backgroundColor: '#333333',
        colors: ['#990a07','blue','yellow'],
        fontSize: 12,
        legend: {
            textStyle: {
                color: '#e6e6e6'
            }
        },
        title: title,
        titleTextStyle: {
            color: '#e6e6e6',
            fontSize: 16
        },
        hAxis: {
            textStyle: {
                color: '#e6e6e6'
            }
        },
        vAxis: {
            format: 'currency',
            fontSize: 12,
            textStyle: {
                color: '#e6e6e6'
            }
        },
        curveType: $('#ckSmoothed').is(':checked') ? 'function' : 'none',
        seriesType: 'line',
        series: {
            2: { type: 'bars' }
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('macdChartDiv'));
    chart.draw(dataTable, options);
}

function drawQuoteChart(quoteData, tradingDaysCount, showEMA, emaShortDays, emaLongDays) {

    var fromDate = Date.parse($("#txtFromDate").val());
    var toDate = Date.parse($("#txtToDate").val());

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'X');
    dataTable.addColumn('number', 'Closing Price');

    if (showEMA) {
        dataTable.addColumn('number', 'EMA Short Days (' + emaShortDays + ')');
        dataTable.addColumn('number', 'EMA Long Days (' + emaLongDays + ')');
    }

    var visibleQuotes = [];
    var minPrice = 99999999999;
    var maxPrice = 0;

    for (var i = 0; i < quoteData.length; i++) {

        if (i >= tradingDaysCount) { continue; }

        // Quote date fall within user-specified date window?
        var quoteDate = Date.parse(quoteData[i].quoteDate);
        if ((isNaN(fromDate) == false) && (isNaN(toDate) == false)) {
            if ((quoteDate < fromDate) || (quoteDate > toDate)) {
            continue;
            }
        }

        var quoteElement = [];
        quoteElement.push(quoteData[i].quoteDate); // Quote Date
        quoteElement.push(quoteData[i].price); // Closing Price

        if (showEMA) {
            quoteElement.push(quoteData[i].emaShort); // EMA Short
            quoteElement.push(quoteData[i].emaLong); // EMA Long
        }

        visibleQuotes.push(quoteElement);

        if (quoteData[i].price > maxPrice) { maxPrice = quoteData[i].price; }
        if (quoteData[i].price < minPrice) { minPrice = quoteData[i].price; }
    }

    visibleQuotes.reverse();

    dataTable.addRows(visibleQuotes);

    var title = tradingDaysCount + " Days";
    if (typeof tradingDaysCount == "undefined") {
        title = "All Available"
    }

    var options = {
        backgroundColor: '#333333',
        colors: ['#990a07','blue','yellow'],
        fontSize: 12,
        legend: {
            textStyle: {
                color: '#e6e6e6'
            }
        },
        title: title,
        titleTextStyle: {
            color: '#e6e6e6',
            fontSize: 16
        },
        hAxis: {
            textStyle: {
                color: '#e6e6e6'
            }

        },
        vAxis: {
            format: 'currency',
            maxValue: maxPrice,
            minValue: minPrice,
            fontSize: 12,
            textStyle: {
                color: '#e6e6e6'
            }
        },
        curveType: $('#ckSmoothed').is(':checked') ? 'function' : 'none'
    };

    var chart = new google.visualization.LineChart(document.getElementById('quoteChartDiv'));
    chart.draw(dataTable, options);
}

/*
function drawCandlestickChart() {
    $.ajax({
      url: "http://localhost:9981/gastocks-server/quote/MYGN",
      cache: true,
      success: function(data) {
        console.log(data);
        var allQuotes = [];
        for (var i = 0; i < data.length; i++) {
          var quoteElement = [];
          quoteElement.push(data[i].quoteDate);
          quoteElement.push(data[i].low);
          quoteElement.push(data[i].price);
          quoteElement.push(data[i].price);
          quoteElement.push(data[i].high);
          console.log(quoteElement);
          allQuotes.push(quoteElement);
        }
        var fullQuoteChart = google.visualization.arrayToDataTable(allQuotes, true);
        var options = { legend: 'none' };
        var chart = new google.visualization.CandlestickChart(document.getElementById('quoteChartDiv'));
        chart.draw(fullQuoteChart, options);
      }
    });
}

*/