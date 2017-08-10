
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

    var dataTable = new google.visualization.DataTable();
    dataTable.addColumn('string', 'X');
    dataTable.addColumn('number', 'Price');

    var allQuotes = [];
    var minPrice = 99999999999;
    var maxPrice = 0;

    for (var i = 0; i < quoteData.length; i++) {
        if (i >= tradingDaysCount) { continue; }
        var quoteElement = [];
        quoteElement.push(quoteData[i].quoteDate);
        quoteElement.push(quoteData[i].price);
        allQuotes.push(quoteElement);
        if (quoteData[i].price > maxPrice) { maxPrice = quoteData[i].price; }
        if (quoteData[i].price < minPrice) { minPrice = quoteData[i].price; }
    }

    allQuotes.reverse();
    dataTable.addRows(allQuotes);

/*
    var smoothed = 'none';
    if ($('#ckSmoothed').is(':checked')) {
        smoothed = 'function';
    }
*/

    var options = {
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
