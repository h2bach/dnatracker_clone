var fs = require("fs");
var _ = require("lodash");
var Q = require("q");
var request = require("request");

var hostUrl = "https://www.ncbi.nlm.nih.gov/blast/Blast.cgi?";

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
        } else {
            defer.reject(error || "Request failed");
        }
    });
    return defer.promise;
};

var getFileResult = function (requestInfo) {
    var defer = Q.defer();
    var urlGetResult = hostUrl + "CMD=Get&RID=" + requestInfo.rid + "&FORMAT_TYPE=JSON2_S";
    var retryCount = 0;
    var maxRetries = 60; // Maximum 5 minutes (60 * 5 seconds)
    var timeoutId;

    var getInfo = function () {
        request(urlGetResult, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                if (body.indexOf("BlastOutput2") >= 0) {
                    defer.resolve(body);
                } else {
                    retryCount++;
                    if (retryCount < maxRetries) {
                        timeoutId = setTimeout(function () {
                            getInfo();
                        }, 1000 * 5);
                    } else {
                        defer.reject("Maximum retry attempts exceeded");
                    }
                }
            } else {
                defer.reject(error || "Failed to get results");
            }
        });
    };

    timeoutId = setTimeout(function () {
        getInfo();
    }, 1000 * (parseInt(requestInfo.rtoe)));

    // Add cleanup method to the promise
    defer.promise.cancel = function() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        defer.reject("Request cancelled");
    };

    return defer.promise;
};

// Hàm parse kết quả NCBI để tương thích với local BLAST
var parseNcbiResult = function(jsonResult) {
    try {
        var data = JSON.parse(jsonResult);
        var search = data.BlastOutput2[0].report.results.search;
        
        // Chuyển đổi format để tương thích với local BLAST
        var hits = search.hits.map(function(hit) {
            return {
                description: [{
                    accession: hit.description[0].accession,
                    sciname: hit.description[0].sciname || hit.description[0].title,
                    id: hit.description[0].id
                }],
                hsps: hit.hsps.map(function(hsp) {
                    return {
                        bit_score: hsp.bit_score,
                        score: hsp.score,
                        evalue: hsp.evalue,
                        identity: hsp.identity,
                        align_len: hsp.align_len,
                        gaps: hsp.gaps || 0,
                        query_strand: hsp.query_strand,
                        hit_strand: hsp.hit_strand,
                        qseq: hsp.qseq,
                        hseq: hsp.hseq,
                        midline: hsp.midline,
                        query_from: hsp.query_from,
                        query_to: hsp.query_to,
                        hit_from: hsp.hit_from,
                        hit_to: hsp.hit_to
                    };
                }),
                len: hit.len
            };
        });

        return {
            hits: hits,
            query_len: search.query_len,
            query_title: search.query_title
        };
    } catch (e) {
        throw new Error("Failed to parse NCBI result: " + e.message);
    }
};

module.exports = {
    query: function (querySeq) {
        var urlApi = hostUrl + "DATABASE=nr&PROGRAM=blastn" +
            "&FILTER=L&EXPECT=0.01&FORMAT_TYPE=JSON2_S" +
            "&NCBI_GI=on&HITLIST_SIZE=10&CMD=Put&QUERY=" +
            querySeq;
        
        return putRequestBlastCgi(urlApi)
            .then(getFileResult)
            .then(parseNcbiResult);
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