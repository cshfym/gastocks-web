
var localCache = {
    data: {},
    set: function (url, parameters, cachedData, callback) {
        var key = hash(url, parameters);
        console.log("Setting cache for key: " + key);
        localCache.remove(key);
        localCache.data[key] = cachedData;
        if ($.isFunction(callback)) {
            callback(cachedData);
        }
    },
    remove: function (url, parameters) {
        delete localCache.data[hash(url, parameters)];
    },
    exists: function (url, parameters) {
        var key = hash(url, parameters);
        console.log("Peeking cache for key: " + key);
        var has = localCache.data.hasOwnProperty(key) && localCache.data[key] !== null;
        console.log("Cach available for key: " + has);
        return has;
    },
    get: function (url, parameters) {
        var key = hash(url, parameters);
        console.log("Getting cache for key: " + key);
        return localCache.data[key];
    }
};

function hash(url, parameters) {

    var key = url + parameters;

    var hash = 0, i, chr;

    if (key === 0) { return hash; }

    for (i = 0; i < key.length; i++) {
        chr = key.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }

    return hash;
};


/*
$(function () {
    var url = '/echo/jsonp/';
    $('#ajaxButton').click(function (e) {
        $.ajax({
            url: url,
            data: {
                test: 'value'
            },
            cache: true,
            beforeSend: function () {
                if (localCache.exist(url)) {
                    doSomething(localCache.get(url));
                    return false;
                }
                return true;
            },
            complete: function (jqXHR, textStatus) {
                localCache.set(url, jqXHR, doSomething);
            }
        });
    });
});
*/

