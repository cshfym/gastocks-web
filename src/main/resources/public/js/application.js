
function ajaxBuildPriceHistory(tradingDaysCount) {

    var symbol = $("#txtSymbol").val();

    $.ajax({
        url: "http://localhost:9981/gastocks-server/quote/" + symbol,
        cache: true,
        success: function(data) {
          drawLineChart(data, tradingDaysCount);
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
             alert("Error calling /quote with symbol [" + symbol + "]");
             return [];
          }
    });
}

function drawLineChart(quoteData, tradingDaysCount) {

    if (quoteData == 0) {
        alert("No data found.");
        return
    }

    var emaShortDays = $("#txtEMAShort").val();
    var emaLongDays = $("#txtEMALong").val();

    var fromDate = Date.parse($("#txtFromDate").val());
    var toDate = Date.parse($("#txtToDate").val());

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'X');
    dataTable.addColumn('number', 'Closing Price');
    dataTable.addColumn('number', 'EMA Short Days (' + emaShortDays + ')');
    dataTable.addColumn('number', 'EMA Long Days (' + emaLongDays + ')');

    var visibleQuotes = [];
    var minPrice = 99999999999;
    var maxPrice = 0;

    // Calculate EMA's for all potential data points
    var emaData = buildEMAData(quoteData, emaShortDays, emaLongDays);

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

        var emaForDate = getEMAForDate(emaData, quoteData[i].quoteDate)
        quoteElement.push(emaForDate[1]); // Short
        quoteElement.push(emaForDate[2]); // Long
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
        title: title,
        hAxis: {
            title: 'Date'
        },
        vAxis: {
            format: 'currency',
            maxValue: maxPrice,
            minValue: minPrice
        },
        curveType: $('#ckSmoothed').is(':checked') ? 'function' : 'none'
    };

    var chart = new google.visualization.LineChart(document.getElementById('quoteChartDiv'));
    chart.draw(dataTable, options);
}

/**
 * Builds a full EMA data array for all available data, given short and long day parameters.
**/
function buildEMAData(data, emaShortDays, emaLongDays) {

    var quoteData = copyArray(data);

    quoteData.reverse();

    // Calculate out as much EMA data as possible for both short/long parameters
    var emaData = []; // Format: [[date, short, long][date, short, long]], i.e. [["2017-08-01", 12.4, 13.5]["2017-08-02", 12.5, 13.6]]
    for (var i = 0; i < quoteData.length; i++) { emaData[i] = ["", 0.0, 0.0]; }
    for (var i = 0; i < quoteData.length; i++) {
        emaData[i][0] = quoteData[i].quoteDate;
        // Set zero index (oldest quote) EMA equal to quote date
        if (i == 0) {
            emaData[i][1] = quoteData[i].price;
            emaData[i][2] = quoteData[i].price;
        } else {
            emaData[i][1] = calculateEMA(quoteData[i].price, emaData[i-1][1], emaShortDays);
            emaData[i][2] = calculateEMA(quoteData[i].price, emaData[i-1][2], emaLongDays);
        }
    }

    return emaData;
}

/**
 * Calculates the exponential moving average for the given price, previous EMA, and days
 * EMA = (Current price - EMA(previous day)) x multiplier + EMA(previous day)
**/
function calculateEMA(currentPrice, previousDayEMA, days) {
    var multiplier = 2/(+days + 1);
    var exponentialMovingAverage = (currentPrice * multiplier) + (previousDayEMA * (1 - multiplier));
    return roundTo(exponentialMovingAverage, 4);
}

function getEMAForDate(emaData, date) {

    for (var i = 0; i < emaData.length; i++) {
        if (emaData[i][0] == date) {
            return emaData[i];
        }
    }
}

function roundTo(n, digits) {

    if (digits === undefined) { digits = 0; }

    var multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    return +(Math.round(n) / multiplicator).toFixed(digits);
}

function copyArray(array) {
    var newArray = [];
    for (var z = 0; z < array.length; z++) { newArray.push(array[z]); }
    return newArray;
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