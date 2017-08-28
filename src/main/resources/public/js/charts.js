
$(document).ready(function() {
    console.log("Document ready!");
    loadAvailableSimulationsDropDown();
    registerSymbolAutoComplete();
    $("#hfDaysSelected").val("");
});

function registerSymbolAutoComplete() {

    $.ajax({
        url: SERVER_URL + SYMBOLS_PATH,
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

function reloadChart() {
    ajaxBuildAllCharts("Reload");
}

/**
 * Primary entrypoint for building all charts. Chains together multiple AJAX calls:
   #1: Load simulation data.
   #2: Load basic quote technical data.
   #3: Load MACD quote data.
**/
function ajaxBuildAllCharts(tradingDaysCount) {

    if (tradingDaysCount == undefined) {
        tradingDaysCount = "99999"; // All
    }

    if (tradingDaysCount == "Reload") {
        tradingDaysCount = $("#hfDaysSelected").val();
    }

    var symbol = $("#txtSymbol").val();

    $("#hfDaysSelected").val(tradingDaysCount);

    var selectedSimulationId = $("#ddlSimulationList").val();

    if (selectedSimulationId.startsWith("**")) {
        // Bypass simulation load, build charts.
        ajaxBuildQuoteCharts(tradingDaysCount, null, symbol);
    } else {

        // Load simulation data, build charts.

        var fullUrl = SERVER_URL + SIMULATIONS_PATH + "/" + selectedSimulationId + "/" + symbol + TRANSACTIONS_PATH;

        $.ajax({
            url: fullUrl,
            cache: false,
            success: function(data) {
                if (data.length == 0) {
                    return [];
                }
                buildSimulationTable(data);
                ajaxBuildQuoteCharts(tradingDaysCount, data, symbol);
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                alert("Error calling " + fullUrl + " with symbol [" + symbol + "]");
                return [];
             }
        });

    }


}

function ajaxBuildQuoteCharts(tradingDaysCount, simulationData, symbol) {

    var emaShortDays = $("#txtEMAShort").val();
    var emaLongDays = $("#txtEMALong").val();
    var showEMA = $('#ckShowEMA').is(':checked');

    var fullUrl = SERVER_URL + TECHNICAL_QUOTE_PATH + "/" +  symbol + "/" + emaShortDays + "/" + emaLongDays;

    $.ajax({
        url: fullUrl,
        cache: false,
        success: function(data) {
          if (data.length == 0) {
            alert("No data found!");
            return;
          }

          drawQuoteChart(data, simulationData, tradingDaysCount, showEMA, emaShortDays, emaLongDays);
          drawMACDChart(data, simulationData, tradingDaysCount, emaShortDays, emaLongDays);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
             alert("Error calling /technicalquote with symbol [" + symbol + "]");
             return [];
         }
    });
}

function buildSimulationTable(data) {

    var simulationTable = "<table>";

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

function drawMACDChart(quoteData, simulationData, tradingDaysCount, emaShortDays, emaLongDays) {

    var fromDate = Date.parse($("#txtFromDate").val());
    var toDate = Date.parse($("#txtToDate").val());

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'X');
    dataTable.addColumn('number', 'MACD');
    dataTable.addColumn({ type: 'string', role: 'annotation' });
    dataTable.addColumn({ type: 'string', role: 'annotationText' });
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
        // Add BUY or SELL markers on quote line.
        var transactionType = quoteDateTransactionType(simulationData, quoteData[i].quoteDate);
        if ((transactionType == "BUY") || (transactionType == "SELL")) {
            quoteElement.push(transactionType);
            quoteElement.push(transactionType + " - " + quoteData[i].quoteDate + " at $" + quoteData[i].price);
        } else {
            quoteElement.push(null);
            quoteElement.push(null);
        }

        quoteElement.push(quoteData[i].macdSignalLine);
        quoteElement.push(quoteData[i].macdHist);


        visibleQuotes.push(quoteElement);
    }

    visibleQuotes.reverse(); // Display ascending

    dataTable.addRows(visibleQuotes);

    var title = tradingDaysCount + " Days";
    if (tradingDaysCount == "99999") {
        title = "All Available"
    }

    var options = {
        backgroundColor: '#333333',
        chartArea: {
            width: '90%',
            height: '80%'
        },
        colors: ['#2286cc','#b73337','yellow'],
        crosshair: {
            trigger: 'both',
            color: '#64f740',
            opacity: 0.75
        },
        curveType: $('#ckSmoothed').is(':checked') ? 'function' : 'none',
        fontSize: 12,
        hAxis: {
            textStyle: {
                color: '#e6e6e6'
            }
        },
        legend: {
            textStyle: {
                color: '#e6e6e6'
            },
            position: 'bottom'
        },
        seriesType: 'line',
        series: {
            2: { type: 'bars' }
        },
        title: title,
        titleTextStyle: {
            color: '#e6e6e6',
            fontSize: 16
        },
        vAxis: {
            format: 'currency',
            fontSize: 12,
            textStyle: {
                color: '#e6e6e6'
            }
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('macdChartDiv'));
    chart.draw(dataTable, options);
}

function drawQuoteChart(quoteData, simulationData, tradingDaysCount, showEMA, emaShortDays, emaLongDays) {

    var fromDate = Date.parse($("#txtFromDate").val());
    var toDate = Date.parse($("#txtToDate").val());

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'X');
    dataTable.addColumn('number', 'Closing Price');
    dataTable.addColumn({ type: 'string', role: 'annotation' });
    dataTable.addColumn({ type: 'string', role: 'annotationText' });
    dataTable.addColumn('number', 'BUY Position (Simulation)');
    dataTable.addColumn({ type: 'boolean', role: 'emphasis' });
    dataTable.addColumn('number', '52-Week Average');

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

        // Add BUY or SELL markers on quote line.
        var transactionType = quoteDateTransactionType(simulationData, quoteData[i].quoteDate);
        if ((transactionType == "BUY") || (transactionType == "SELL")) {
            quoteElement.push(transactionType);
            quoteElement.push(transactionType + " - " + quoteData[i].quoteDate + " at $" + quoteData[i].price);
        } else {
            quoteElement.push(null);
            quoteElement.push(null);
        }

        // Emphasize (thicker line) if the quote date is within a buy and sell transaction period.
        if (isQuoteDateWithinTransactionPeriod(simulationData, quoteData[i].quoteDate)) {
            quoteElement.push(quoteData[i].price);
            quoteElement.push(true);
        } else {
            quoteElement.push(null);
            quoteElement.push(false);
        }

        // Averages
        quoteElement.push(quoteData[i]._52WeekAverage);

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
    if (tradingDaysCount == "99999") {
        title = "All Available"
    }

    var options = {
        backgroundColor: '#333333',
        chartArea: {
            width: '90%',
            height: '80%'
        },
        crosshair: {
            trigger: 'both',
            color: '#64f740',
            opacity: 0.75
        },
        curveType: $('#ckSmoothed').is(':checked') ? 'function' : 'none',
        fontSize: 12,
        hAxis: {
            textStyle: {
                color: '#e6e6e6'
            }

        },
        isStacked: true,
        legend: {
            textStyle: {
                color: '#e6e6e6'
            },
            position: 'bottom'
        },
        seriesType: 'line',
        series: {
            0: { color: '#2286cc' },
            1: { color: 'red' },
            2: { color: '#cbd1d3', lineDashStyle: [2, 2] },
            3: { color: 'yellow' },
            4: { color: 'red' }
        },
        title: title,
        titleTextStyle: {
            color: '#e6e6e6',
            fontSize: 16
        },
        vAxis: {
            format: 'currency',
            maxValue: maxPrice,
            minValue: minPrice,
            fontSize: 12,
            textStyle: {
                color: '#e6e6e6'
            }
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('quoteChartDiv'));
    chart.draw(dataTable, options);
}

/**
 * Returns either "BUY" or "SELL" as transaction type if the quote date falls on a simulation buy/sell date.
**/
function quoteDateTransactionType(simulationData, quoteDate) {

    if (simulationData == null) { return ""; }

    for(var i = 0; i < simulationData.length; i++) {
        if (simulationData[i].purchaseDate == quoteDate) {
            return "BUY";
        }
        if (simulationData[i].sellDate == quoteDate) {
            return "SELL";
        }
    }

    return "";
}

function isQuoteDateWithinTransactionPeriod(simulationData, quoteDate) {

    if (simulationData == null) { return false; }

    var quoteDateObj = new Date(quoteDate);

    for (var i = 0; i < simulationData.length; i++) {
        var purchaseDate = new Date(simulationData[i].purchaseDate);
        var sellDate = new Date(simulationData[i].sellDate);
        if ((quoteDateObj >= purchaseDate) && (quoteDateObj <= sellDate)) {
            return true;
        }
    }

    return false;
}
