 function drawLineChart() {
     $.ajax({
       url: "http://localhost:9981/gastocks-server/quote/MYGN",
       cache: true,
       success: function(data) {

         var dataTable = new google.visualization.DataTable();
         dataTable.addColumn('string', 'X');
         dataTable.addColumn('number', 'Price');

         var allQuotes = [];
         for (var i = 0; i < data.length; i++) {
           var quoteElement = [];
           quoteElement.push(data[i].quoteDate);
           quoteElement.push(data[i].price);
           allQuotes.push(quoteElement);
         }
         dataTable.addRows(allQuotes);
         //var fullQuoteChart = google.visualization.arrayToDataTable(allQuotes, true);
         var options = {
           hAxis: {
             title: 'Date'
           },
           vAxis: {
             title: 'Price'
          }
        };

        var chart = new google.visualization.LineChart(document.getElementById('quote_chart_div'));
        chart.draw(dataTable, options);
       }
     });
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
        var chart = new google.visualization.CandlestickChart(document.getElementById('quote_chart_div'));
        chart.draw(fullQuoteChart, options);
      }
    });
}