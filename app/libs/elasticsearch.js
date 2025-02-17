var _ = require("lodash");
var Q = require("q");
var elasticsearch = require('elasticsearch');

module.exports = function (config) {
    var elasticClient = new elasticsearch.Client(_.pick(config, ['host']));
    var indexName = config.indexName;
    var typeName = config.typeName;

    return {
        getSuggestions: function (input) {
            return elasticClient.suggest({
                index: indexName,
                type: typeName,
                body: {
                    species_suggest: {
                        text: input,
                        completion: {
                            field: "suggest"
                        }
                    }
                }
            })
        },
        addDocument: function (_id, _body) {
            return elasticClient.index({
                index: indexName,
                type: typeName,
                id: _id,
                body: _body
            });
        },
        deleteDocument: function (_id) {
            return elasticClient.delete({
                index: indexName,
                type: typeName,
                id: _id.toString()
            });
        },
        initMapping: function initMapping(input) {
            return function () {
                return elasticClient.indices.putMapping(input);
            }
        },
        deleteIndex: function () {
            return elasticClient.indices.delete({
                index: indexName
            });
        },
        initIndex: function () {
            return elasticClient.indices.create({
                index: indexName
            });
        },
        indexExists: function () {
            return elasticClient.indices.exists({
                index: indexName
            });
        },
        search: function (text) {
            var defer = Q.defer();
            var results = [];
            elasticClient.search({
                index: indexName,
                scroll: '30s',
                q: text
            }, function getMoreUntilDone(error, response) {
                response.hits.hits.forEach(function (hit) {
                    results.push(hit);
                });

                if (response.hits.total !== results.length) {
                    elasticClient.scroll({
                        scrollId: response._scroll_id,
                        scroll: '30s'
                    }, getMoreUntilDone);
                } else {
                    defer.resolve(results);
                }
            });
            return defer.promise;
        }
    }
};