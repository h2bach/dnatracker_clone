var fs = require("fs");
var _ = require("lodash");
var Q = require("q");
var request = require("request");

var hostUrl = "http://www.ncbi.nlm.nih.gov/blast/Blast.cgi?";

var putRequestBlastCgi = function (url) {
    var defer = Q.defer();
    var getInfoFromHtml = function (html) {
        return {
            rid: html.match(/RID = (\w+)/)[1],
            rtoe: html.match(/RTOE = (\w+)/)[1]
        }
    };
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            defer.resolve(getInfoFromHtml(body));
        }
    });
    return defer.promise;
};

var getFileResult = function (requestInfo) {
    var defer = Q.defer();
    var urlGetResult = hostUrl + "CMD=Get&RID=" + requestInfo.rid + "&FORMAT_TYPE=JSON2_S";

    var getInfo = function () {
        request(urlGetResult, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body.indexOf("BlastOutput2") >= 0) {
                    defer.resolve(body);
                } else {
                    setTimeout(function () {
                        getInfo();
                    }, 1000 * 5);
                }
            }
        });
    };

    setTimeout(function () {
        getInfo();
    }, 1000 * (parseInt(requestInfo.rtoe)));
    return defer.promise;
};

module.exports = {
    query: function (querySeq) {
        var urlApi = hostUrl + "DATABASE=nr&PROGRAM=blastn" +
            "&FILTER=L&EXPECT=0.01&FORMAT_TYPE=JSON2_S" +
            "&NCBI_GI=on&HITLIST_SIZE=10&CMD=Put&QUERY=" +
            querySeq;
        
        return putRequestBlastCgi(urlApi)
            .then(getFileResult)
    },
    
    search: function (querySeq) {
        var urlApi = hostUrl + "DATABASE=nr&PROGRAM=blastn" +
            "&FILTER=L&EXPECT=0.01&FORMAT_TYPE=JSON2_S" +
            "&NCBI_GI=on&HITLIST_SIZE=10&CMD=Put&QUERY=" +
            querySeq;

        return putRequestBlastCgi(urlApi).then(function (requestInfo) {
            var defer = Q.defer();
            defer.resolve(hostUrl + "CMD=Get&RID=" + requestInfo.rid);
            return defer.promise;
        });
    }
};