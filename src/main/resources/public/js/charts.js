
var quoteChart;
var quoteChartDataTable;

var chartSelectBeginDate = "";
var chartSelectEndDate = "";

var noSectorSelection = "** Select Sector **";

$(document).ready(function() {
    console.log("Document ready!");
    loadAvailableSimulationsDropDown();
    // loadAvailableSectorsDropDown();
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
             alert("Error calling /symbols: " + errorThrown + ", textStatus: " + textStatus);
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

/*
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
*/

function reloadChart() {
    ajaxBuildAllCharts("Reload");
}

function resetDateFilter() {
    $("#txtFromDate").val("");
    $("#txtToDate").val("");
    ajaxBuildAllCharts("Reload")
}

/**
 * Primary entrypoint for building all charts. Chains together multiple AJAX calls:
   #: Load simulation data.
   #: Load sector data.
   #: Load basic quote technical data (includes MACD, RSI, OBV.
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
        ajaxLoadSectorBySymbol(tradingDaysCount, null, symbol);
    } else {

        // Load simulation data, build charts.

        var fullUrl = SERVER_URL + SIMULATIONS_PATH + "/" + selectedSimulationId + "/" + symbol + TRANSACTIONS_PATH;

        $.ajax({
            url: fullUrl,
            success: function(simulationData) {
                buildSimulationTable(simulationData);
                ajaxLoadSectorBySymbol(tradingDaysCount, simulationData, symbol);
            },
            error: function(XMLHttpRequest, textStatus, errorThrown) {
                console.log("Error calling " + fullUrl + " with symbol [" + symbol + "]");
                ajaxLoadSectorBySymbol(tradingDaysCount, [], symbol);
             }
        });

    }
}

function ajaxLoadSectorBySymbol(tradingDaysCount, simulationData, symbol) {

    var fullUrl = SERVER_URL + SECTORS_PATH + "/" +  symbol;

    $.ajax({
        type: "GET",
        url: fullUrl,
        contentType: "application/json",
        dataType: "json",
        cache: false,
        success: function(sector) {
            ajaxLoadSectorChart(sector, tradingDaysCount, simulationData, symbol);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            console.log("Error calling " + fullUrl + " with sector [" + selectedSector + "] - " + errorThrown);
            ajaxBuildQuoteCharts([], tradingDaysCount, simulationData, symbol);
        }
    });
}

function ajaxLoadSectorChart(sector, tradingDaysCount, simulationData, symbol) {

    var fullUrl = SERVER_URL + TECHNICAL_QUOTE_PATH + "/" + SECTOR_PATH + "/" +  sector.description;

    $.ajax({
        type: "GET",
        url: fullUrl,
        contentType: "application/json",
        dataType: "json",
        cache: false,
        success: function(sectorQuoteData) {
          ajaxBuildQuoteCharts(sectorQuoteData, tradingDaysCount, null, symbol);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
             console.log("Error calling " + fullUrl + " with sector [" + selectedSector + "] - " + errorThrown);
             ajaxBuildQuoteCharts([], tradingDaysCount, [], symbol);
         }
    });
}

function ajaxBuildQuoteCharts(sectorQuoteData, tradingDaysCount, simulationData, symbol) {

    var showEMA = $('#ckShowEMA').is(':checked');

    var emaShortDays = $("#txtEMAShort").val();
    var emaLongDays = $("#txtEMALong").val();

    var postData = {
        macdRequestParameters: {
            macdShortPeriod: emaShortDays,
            macdLongPeriod: emaLongDays
        },
        rsiRequestParameters: {
            interval: 14,
            overBoughtLine: 70,
            overSoldLine: 30
        },
        onBalanceVolumeRequestParameters: {
            onBalanceVolumeShortPeriod: 12,
            onBalanceVolumeLongPeriod: 26
        },
        emvRequestParameters: {
          	periods: 14,
          	boxRatio: 1000000.0,
          	volumeTriggerPercentage: 1.25,
            highLowTriggerPercentage: 1.50
        }
    };

    var fullUrl = SERVER_URL + TECHNICAL_QUOTE_PATH + "/" +  symbol;
    var requestBody = JSON.stringify(postData);

    $.ajax({
        type: "POST",
        url: fullUrl,
        contentType: "application/json",
        dataType: "json",
        data: requestBody,
        cache: false,
        beforeSend: function () {
            if (localCache.exists(fullUrl, requestBody)) {
                var cacheData = localCache.get(fullUrl, requestBody);
                drawAllCharts(cacheData, sectorQuoteData, simulationData, tradingDaysCount, showEMA, emaShortDays, emaLongDays);
                return false;
            }
            return true;
        },
        success: function(quoteData) {
          if (quoteData.length == 0) {
            alert("No data found!");
            return;
          }
          localCache.set(fullUrl, requestBody, quoteData, null);
          drawAllCharts(quoteData, sectorQuoteData, simulationData, tradingDaysCount, showEMA, emaShortDays, emaLongDays);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
             alert("Error calling /technicalquote with symbol [" + symbol + "] - " + errorThrown);
             return [];
         }
    });
}

function drawAllCharts(data, sectorQuoteData, simulationData, tradingDaysCount, showEMA, emaShortDays, emaLongDays) {

    drawQuoteChart(data, sectorQuoteData, simulationData, tradingDaysCount, showEMA, emaShortDays, emaLongDays);
    drawMACDChart(data, simulationData, tradingDaysCount, emaShortDays, emaLongDays);
    drawRSIChart(data, simulationData, tradingDaysCount);
    drawOBVChart(data, simulationData, tradingDaysCount);
    drawEMVChart(data, simulationData, tradingDaysCount);
    drawVolumeChart(data, simulationData, tradingDaysCount);
}

function buildSimulationTable(data) {

    var simulationTableData = [];

    $.each(data, function(i, object) {

        var netProceeds = Math.round(((object.shares * (object.sellPrice - object.purchasePrice)) - object.commission) * 100) / 100;

        var simulationData = {
            "number": i + 1,
            "shares": object.shares,
            "cost": object.shares * object.purchasePrice,
            "net_proceeds": netProceeds,
            "purchase_price": object.purchasePrice,
            "purchase_date": object.purchaseDate,
            "sell_price": object.sellPrice,
            "sell_date": object.sellDate
        };
        simulationTableData.push(simulationData);
    });

    setSimulationTableData(simulationTableData);
}

function drawQuoteChart(quoteData, sectorQuoteData, simulationData, tradingDaysCount, showEMA, emaShortDays, emaLongDays) {

    var fromDate = Date.parse($("#txtFromDate").val());
    var toDate = Date.parse($("#txtToDate").val());

    quoteChartDataTable = new google.visualization.DataTable();
    quoteChartDataTable.addColumn('string', 'X');
    quoteChartDataTable.addColumn('number', 'Closing Price');
    quoteChartDataTable.addColumn({ type: 'string', role: 'annotation' });
    quoteChartDataTable.addColumn({ type: 'string', role: 'annotationText' });
    quoteChartDataTable.addColumn('number', 'BUY Position (Simulation)');
    quoteChartDataTable.addColumn({ type: 'boolean', role: 'emphasis' });
    quoteChartDataTable.addColumn('number', '52-Week Average');
    quoteChartDataTable.addColumn('number', 'Sector Average');

    if (showEMA) {
        quoteChartDataTable.addColumn('number', 'EMA Short Days (' + emaShortDays + ')');
        quoteChartDataTable.addColumn('number', 'EMA Long Days (' + emaLongDays + ')');
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
        quoteElement.push(quoteData[i].quoteMetadata._52WeekAverage);

        // Display the sector quote value
        var showSector = $('#ckShowSector').is(':checked');
        if (showSector) {
            var sectorQuoteForDate = getSectorQuoteForQuoteDate(sectorQuoteData, quoteDate)
            if (sectorQuoteForDate != null) {
                quoteElement.push(sectorQuoteForDate.price);
            } else {
                quoteElement.push(null);
            }
        } else {
            quoteElement.push(null);
        }

        if (showEMA) {
            quoteElement.push(quoteData[i].macdParameters.emaShort); // EMA Short
            quoteElement.push(quoteData[i].macdParameters.emaLong); // EMA Long
        }

        visibleQuotes.push(quoteElement);

        if (quoteData[i].price > maxPrice) { maxPrice = quoteData[i].price; }
        if (quoteData[i].price < minPrice) { minPrice = quoteData[i].price; }
    }

    visibleQuotes.reverse();

    quoteChartDataTable.addRows(visibleQuotes);

    var title = tradingDaysCount + " Days Quotes";
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
            0: { color: '#2286cc' },                        // Price quote line
            1: { color: 'red' },                            // Buy position
            2: { color: '#cbd1d3', lineDashStyle: [2,2] },  // 52-Week average
            3: { color: 'orange' },                          // Sector quote line
            4: { color: 'yellow' },                         // EMA short days
            5: { color: 'red' }                             // EMA long days
        },
        title: title,
        titleTextStyle: {
            color: '#e6e6e6',
            fontSize: 16
        },
        vAxis: {
            0: {
                format: 'currency',
                maxValue: maxPrice,
                minValue: minPrice,
                fontSize: 12,
                textStyle: {
                    color: '#e6e6e6'
                }
            }
        }
    };

    quoteChart = new google.visualization.LineChart(document.getElementById('quoteChartDiv'));

    google.visualization.events.addListener(quoteChart, 'select', quoteChartSelectHandler);
    quoteChart.draw(quoteChartDataTable, options);
}

function quoteChartSelectHandler() {

    // quoteChart and quoteChartDataTable should not be null at this point.

    var selectedItem = quoteChart.getSelection()[0];
    if (selectedItem) {
        var selectedValue = quoteChartDataTable.getValue(selectedItem.row, 0);
        if (chartSelectBeginDate == "") {
            chartSelectBeginDate = selectedValue;
        } else {
            chartSelectEndDate = selectedValue;
            $("#txtFromDate").val(chartSelectBeginDate);
            $("#txtToDate").val(chartSelectEndDate);
            chartSelectBeginDate = "";
            chartSelectEndDate = "";
            reloadChart();
        }
    }
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

        quoteElement.push(quoteData[i].macdParameters.macd);
        // Add BUY or SELL markers on quote line.
        var transactionType = quoteDateTransactionType(simulationData, quoteData[i].quoteDate);
        if ((transactionType == "BUY") || (transactionType == "SELL")) {
            quoteElement.push(transactionType);
            quoteElement.push(transactionType + " - " + quoteData[i].quoteDate + " at $" + quoteData[i].price);
        } else {
            quoteElement.push(null);
            quoteElement.push(null);
        }

        quoteElement.push(quoteData[i].macdParameters.macdSignalLine);
        quoteElement.push(quoteData[i].macdParameters.macdHist);

        visibleQuotes.push(quoteElement);
    }

    visibleQuotes.reverse(); // Display ascending

    dataTable.addRows(visibleQuotes);

    var title = tradingDaysCount + " Days MACD";
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
            2: { targetAxisIndex: 0, type: 'bars' }
        },
        title: title,
        titleTextStyle: {
            color: '#e6e6e6',
            fontSize: 16
        },
        vAxis: {
            0: {
                format: 'currency',
                fontSize: 12,
                textStyle: {
                    color: '#e6e6e6'
                }
            }
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('macdChartDiv'));
    chart.draw(dataTable, options);
}

function drawRSIChart(quoteData, simulationData, tradingDaysCount) {

    var fromDate = Date.parse($("#txtFromDate").val());
    var toDate = Date.parse($("#txtToDate").val());

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'X');
    dataTable.addColumn('number', 'RSI');
    dataTable.addColumn({ type: 'string', role: 'annotation' });
    dataTable.addColumn({ type: 'string', role: 'annotationText' });
    dataTable.addColumn('number', 'BUY Position (Simulation)');
    dataTable.addColumn({ type: 'boolean', role: 'emphasis' });
    dataTable.addColumn('number', 'Overbought');
    dataTable.addColumn('number', 'Oversold');

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

        quoteElement.push(quoteData[i].rsiParameters.relativeStrengthIndex);

        /* Add BUY or SELL markers on quote line. */
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
            quoteElement.push(quoteData[i].rsiParameters.relativeStrengthIndex);
            quoteElement.push(true);
        } else {
            quoteElement.push(null);
            quoteElement.push(false);
        }

        quoteElement.push(70); // Overbought line
        quoteElement.push(30); // Oversold line

        visibleQuotes.push(quoteElement);
    }

    visibleQuotes.reverse(); // Display ascending

    dataTable.addRows(visibleQuotes);

    var title = tradingDaysCount + " Days RSI";
    if (tradingDaysCount == "99999") {
        title = "All Available"
    }

    var options = {
        backgroundColor: '#333333',
        chartArea: {
            width: '90%',
            height: '80%'
        },
        colors: [
            '#2286cc',      // RSI
            'red',          // Overbought
            'green',        // Oversold
            'red'           // Buy position
        ],
        crosshair: {
            trigger: 'both',
            color: '#64f740',
            opacity: 0.75
        },
        curveType: 'function',
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
            // 2: { targetAxisIndex: 0, type: 'bars' }
        },
        title: title,
        titleTextStyle: {
            color: '#e6e6e6',
            fontSize: 16
        },
        vAxis: {
            format: '#',
            maxValue: 100,
            minValue: 0,
            viewWindow: {
                min: 0,
                max: 100
            },
            fontSize: 12,
            textStyle: {
                color: '#e6e6e6'
            }
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('rsiChartDiv'));
    chart.draw(dataTable, options);
}

function drawOBVChart(quoteData, simulationData, tradingDaysCount) {

    var fromDate = Date.parse($("#txtFromDate").val());
    var toDate = Date.parse($("#txtToDate").val());

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'X');
    dataTable.addColumn('number', 'OBV (x1000)');
    dataTable.addColumn({ type: 'string', role: 'annotation' });
    dataTable.addColumn({ type: 'string', role: 'annotationText' });
    dataTable.addColumn('number', 'BUY Position (Simulation)');
    dataTable.addColumn({ type: 'boolean', role: 'emphasis' });

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

        quoteElement.push(quoteData[i].onBalanceVolumeData.onBalanceVolume);

        /* Add BUY or SELL markers on quote line. */
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
            quoteElement.push(quoteData[i].rsiParameters.relativeStrengthIndex);
            quoteElement.push(true);
        } else {
            quoteElement.push(null);
            quoteElement.push(false);
        }

        visibleQuotes.push(quoteElement);
    }

    visibleQuotes.reverse(); // Display ascending

    dataTable.addRows(visibleQuotes);

    var title = tradingDaysCount + " Days On-Balance Volume";
    if (tradingDaysCount == "99999") {
        title = "All Available"
    }

    var options = {
        backgroundColor: '#333333',
        chartArea: {
            width: '90%',
            height: '80%'
        },
        colors: [
            '#2286cc',      // OBV
            'red',          // Overbought
            'green',        // Oversold
            'red'           // Buy position
        ],
        crosshair: {
            trigger: 'both',
            color: '#64f740',
            opacity: 0.75
        },
        curveType: 'function',
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
            // 2: { targetAxisIndex: 0, type: 'bars' }
        },
        title: title,
        titleTextStyle: {
            color: '#e6e6e6',
            fontSize: 16
        },
        vAxis: {
            format: '#',
            fontSize: 12,
            textStyle: {
                color: '#e6e6e6'
            }
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('obvChartDiv'));
    chart.draw(dataTable, options);
}

function drawEMVChart(quoteData, simulationData, tradingDaysCount) {

    var fromDate = Date.parse($("#txtFromDate").val());
    var toDate = Date.parse($("#txtToDate").val());

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'X');
    dataTable.addColumn('number', 'EMV (14-Day)');
    dataTable.addColumn('number', 'Easy Movement');
    dataTable.addColumn('number', 'Difficult Movement');
    dataTable.addColumn({ type: 'string', role: 'annotation' });
    dataTable.addColumn({ type: 'string', role: 'annotationText' });

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

        quoteElement.push(quoteData[i].emvTechnicalData.easeOfMovementSMA);

        // Easy movement indicators
        if (quoteData[i].emvTechnicalData.easyMovement) {
            quoteElement.push(quoteData[i].emvTechnicalData.easeOfMovementSMA);
        } else {
            quoteElement.push(null);
        }

        // Difficult movement indicators
        if (quoteData[i].emvTechnicalData.difficultMovement) {
            quoteElement.push(quoteData[i].emvTechnicalData.easeOfMovementSMA);
        } else {
            quoteElement.push(null);
        }

        // Add BUY or SELL markers on quote line.
        var transactionType = quoteDateTransactionType(simulationData, quoteData[i].quoteDate);
        if ((transactionType == "BUY") || (transactionType == "SELL")) {
            quoteElement.push(transactionType);
            quoteElement.push(transactionType + " - " + quoteData[i].quoteDate + " at $" + quoteData[i].price);
        } else {
            quoteElement.push(null);
            quoteElement.push(null);
        }

        visibleQuotes.push(quoteElement);
    }

    visibleQuotes.reverse(); // Display ascending

    dataTable.addRows(visibleQuotes);

    var title = tradingDaysCount + " Days EMV";
    if (tradingDaysCount == "99999") {
        title = "All Available"
    }

    var options = {
        backgroundColor: '#333333',
        chartArea: {
            width: '90%',
            height: '80%'
        },
        colors: ['#2286cc','#b73337'],
        crosshair: {
            trigger: 'both',
            color: '#64f740',
            opacity: 0.75
        },
        curveType: 'function',
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
            0: { targetAxisIndex: 0, type: 'line' },
            1: { // Easy movement
                pointShape: 'circle',
                pointSize: 10,
                color: 'green'
            },
            2: { // Difficult movement
                pointShape: 'circle',
                pointSize: 10,
                color: 'red'
            }
        },
        title: title,
        titleTextStyle: {
            color: '#e6e6e6',
            fontSize: 16
        },
        vAxes: {
            0: {
                fontSize: 12,
                textStyle: {
                    color: '#e6e6e6'
                }
            }
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('emvChartDiv'));
    chart.draw(dataTable, options);
}

function drawVolumeChart(quoteData, simulationData, tradingDaysCount) {

    var fromDate = Date.parse($("#txtFromDate").val());
    var toDate = Date.parse($("#txtToDate").val());

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'X');
    dataTable.addColumn('number', 'Volume');
    dataTable.addColumn({ type: 'string', role: 'annotation' });
    dataTable.addColumn({ type: 'string', role: 'annotationText' });

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

        quoteElement.push(quoteData[i].volume);

        // Add BUY or SELL markers on quote line.
        var transactionType = quoteDateTransactionType(simulationData, quoteData[i].quoteDate);
        if ((transactionType == "BUY") || (transactionType == "SELL")) {
            quoteElement.push(transactionType);
            quoteElement.push(transactionType + " - " + quoteData[i].quoteDate + " at $" + quoteData[i].price);
        } else {
            quoteElement.push(null);
            quoteElement.push(null);
        }

        visibleQuotes.push(quoteElement);
    }

    visibleQuotes.reverse(); // Display ascending

    dataTable.addRows(visibleQuotes);

    var title = tradingDaysCount + " Days - Volume";
    if (tradingDaysCount == "99999") {
        title = "All Available"
    }

    var options = {
        backgroundColor: '#333333',
        chartArea: {
            width: '90%',
            height: '80%'
        },
        colors: ['#2286cc','#b73337'],
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
            0: { targetAxisIndex: 0, type: 'bars' }
        },
        title: title,
        titleTextStyle: {
            color: '#e6e6e6',
            fontSize: 16
        },
        vAxes: {
            0: { fontSize: 12 }
        }
    };

    var chart = new google.visualization.LineChart(document.getElementById('volumeChartDiv'));
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

function getSectorQuoteForQuoteDate(sectorQuoteData, quoteDate) {

    if (sectorQuoteData == null) { return null; }

    var quoteDateObj = new Date(quoteDate);

    for (var i = 0; i < sectorQuoteData.length; i++) {
        var sectorQuoteDate = new Date(sectorQuoteData[i].quoteDate);
        if (quoteDateObj.getTime() == sectorQuoteDate.getTime()) {
            return sectorQuoteData[i];
        }
    }

    return null;
}

function setSimulationTableData(data) {

    $('#tblSimulationData').bootstrapTable("load", data);
    $('#tblSimulationData').bootstrapTable({
        data: data
    });
}
