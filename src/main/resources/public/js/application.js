
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

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'X');
    dataTable.addColumn('number', 'Closing Price');
    dataTable.addColumn('number', 'EMA Short Days (' + emaShortDays + ')');
    dataTable.addColumn('number', 'EMA Long Days (' + emaLongDays + ')');

    var allQuotes = [];
    var minPrice = 99999999999;
    var maxPrice = 0;

    // Calculate EMA's for all potential data points
    var emaData = buildEMAData(quoteData, emaShortDays, emaLongDays);

    for (var i = 0; i < quoteData.length; i++) {
        if (i >= tradingDaysCount) { continue; }
        var quoteElement = [];
        quoteElement.push(quoteData[i].quoteDate); // Quote Date
        quoteElement.push(quoteData[i].price); // Closing Price
        quoteElement.push(emaData[i][0]); // EMA Short
        quoteElement.push(emaData[i][1]); // EMA Long
        allQuotes.push(quoteElement);
        if (quoteData[i].price > maxPrice) { maxPrice = quoteData[i].price; }
        if (quoteData[i].price < minPrice) { minPrice = quoteData[i].price; }
    }

    allQuotes.reverse();
    dataTable.addRows(allQuotes);

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
            maxValue: maxPrice + (maxPrice * 0.1),
            minValue: minPrice - (minPrice * 0.1)
        },
        curveType: $('#ckSmoothed').is(':checked') ? 'function' : 'none'
    };

    var chart = new google.visualization.LineChart(document.getElementById('quoteChartDiv'));
    chart.draw(dataTable, options);
}

function buildEMAData(quoteData, emaShortDays, emaLongDays) {

    var emaData = []; // Format: [[short, long][short, long]], i.e. [[12.4, 13.5][12.5, 13.6]]

    quoteData.reverse(); // Reverse to ascending

    // Populate seed EMA data matching quoteData
    for (var i = 0; i < quoteData.length; i++) { emaData[i] = [0.0, 0.0]; }

    // Not enough quote data to calculate EMA data?
    if (quoteData.length < (emaLongDays * 1.5)) { return emaData; }

    for (var i = 0; i < quoteData.length; i++) {

        var previousDayShortEMA = 0.0;
        var previousDayLongEMA = 0.0;

        // Do not begin EMA calculations until both short and long are available
        if (i < (emaLongDays - 1)) { continue; }

        // The first EMA is the average of all values leading up to, including current quote day.
        // i.e. - 12 days, the first 12 are averaged for the day 12 EMA.

        if (previousDayShortEMA == 0.0) {
            var startIndex = (i - emaShortDays) + 1;
            previousDayShortEMA = calculateAverageToWithIndex(quoteData, startIndex, i);
        } else {
            previousDayShortEMA = emaData[i-1][1];
        }

        if (i == (emaLongDays - 1)) {
            var startIndex = (i - emaLongDays) + 1;
            previousDayLongEMA = calculateAverageToWithIndex(quoteData, startIndex, i);
        } else {
            previousDayLongEMA = emaData[i-1][0];
        }

        var shortEMA = calculateEMA(quoteData[i].price, previousDayShortEMA, emaShortDays);
        var longEMA = calculateEMA(quoteData[i].price, previousDayLongEMA, emaLongDays);

        emaData[i][0] = shortEMA;
        emaData[i][1] = longEMA;
    }

    //emaData.reverse();

    return emaData;
}

/**
 * Calculates the exponential moving average for the given price, previous EMA, and days
 * EMA = Price(t) * k + EMA(y) * (1 – k), where t = today, y = yesterday, N = number of days in EMA, k = 2/(N+1)
**/
function calculateEMA(currentPrice, previousDayEMA, days) {
    var k = 2 / (days + 1);
    var exponentialMovingAverage = (currentPrice * k) + (previousDayEMA * (1 - k));
    return roundTo(exponentialMovingAverage, 2);
}


function calculateAverageToWithIndex(data, fromIndex, toIndex) {

    var average = 0.0;
    var count = 0;

    for (var k = fromIndex; k <= toIndex; k++) {
        average += data[k].price;
        count++;
    }

    average = roundTo((average / count), 2);
    return average;
}

function roundTo(n, digits) {

    if (digits === undefined) { digits = 0; }

    var multiplicator = Math.pow(10, digits);
    n = parseFloat((n * multiplicator).toFixed(11));
    return +(Math.round(n) / multiplicator).toFixed(2);
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