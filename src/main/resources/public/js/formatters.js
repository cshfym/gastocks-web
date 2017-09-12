
var YAHOO_FINANCE_URL = "https://finance.yahoo.com/quote/";

function integerFormatter(value) {
    var preformat = currencyFormatter(value);
    return preformat.replace("$","").replace(".00","");
}

function currencyFormatter(value) {

    if ((typeof value == "undefined") || (isNaN(value))) {
        return '<span style="color: red;">N/A</span>'
    }

    value = value.format(2);

    if (value.toString().startsWith("-")) {
        return '<span style="color: red;">-$' + value.toString().replace("-","") + '</span>';
    } else {
        return '<span style="color: #3d7532;">$' + value.toString() + '</span>';
    }
}

function percentageFormatter(value) {

    if (value.toString().startsWith("-")) {
        return '<span style="color: red;">-' + value.toString().replace("-","") + '%</span>';
    } else {
        return '<span style="color: #3d7532;">' + value.toString() + '%</span>';
    }
}

function linkFormatter(value, row, index) {
  return "<a href='" + YAHOO_FINANCE_URL + value + "/profile' target='_blank'>" + value + "</a>";
}