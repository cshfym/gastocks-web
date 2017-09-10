
var SERVER_URL = "http://localhost:9981/gastocks-server";
var SYMBOLS_PATH = "/symbols/vse";
var SIMULATIONS_PATH = "/simulations";
var SIMULATION_SUMMARY_PATH = "/summary?compact=true"
var TRANSACTIONS_PATH = "/transactions";
var TECHNICAL_QUOTE_PATH = "/technicalquote";

Number.prototype.format = function(n, x) {
    var re = '(\\d)(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$1,');
};

function isNullOrUndefined(value) {

    if (isNaN(value)) { return true; }
    if (typeof value == "undefined") { return true; }
    if ($.trim(value) == "") { return true; }

    return false;
}