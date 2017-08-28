
var SERVER_URL = "http://localhost:9981/gastocks-server";
var SYMBOLS_PATH = "/symbols";
var SIMULATIONS_PATH = "/simulations";
var SIMULATION_SUMMARY_PATH = "/summary"
var TRANSACTIONS_PATH = "/transactions";
var TECHNICAL_QUOTE_PATH = "/technicalquote";

Number.prototype.format = function(n, x) {
    var re = '(\\d)(?=(\\d{' + (x || 3) + '})+' + (n > 0 ? '\\.' : '$') + ')';
    return this.toFixed(Math.max(0, ~~n)).replace(new RegExp(re, 'g'), '$1,');
};