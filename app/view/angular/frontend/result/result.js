"use strict";

(function () {

    angular.module("dna-tracker.frontend.result", [
        "dna-tracker.modal.species"
    ])

        .config(["$stateProvider", "modalSpeciesProvider", function ($stateProvider, modalSpeciesProvider) {
            $stateProvider
                .state("frontend.result-dna", {
                    url: "result-dna",
                    templateUrl: "angular/frontend/result/result-dna.html",
                    params: {
                        result: null,
                        method: null,
                        seq: null
                    },
                    controller: "result-dna.ctrl",
                    resolve: {
                        result: ['$stateParams', function ($stateParams) {
                            return $stateParams.result;
                        }]
                    }
                })
                .state("frontend.result-species", {
                    url: "result-species",
                    templateUrl: "angular/frontend/result/result-species.html",
                    params: {inputSearch: null},
                    controller: "result-species.ctrl",
                    resolve: {
                        inputSearch: ['$stateParams', function ($stateParams) {
                            return $stateParams.inputSearch;
                        }]
                    }
                });
	        
            modalSpeciesProvider.state("frontend.result-species.species");
            modalSpeciesProvider.state("frontend.result-dna.species");
        }])

        .controller("result-dna.ctrl", function ($scope, $state, SearchApi, result, previewSpeciesModal, User, MapModal) {
            if (!result) {
                $state.go("frontend.search-dna");
                return;
            }
            $scope.User = User;

            $scope.method = result.data.method;
            $scope.report = result.data.report;
            $scope.tree = result.data.tree;
            $scope.message = result.data.message;
            $scope.queryInfo = result.data.queryInfo;

            $scope.view = {
                searching: false,
                searchNormal: true
            };

            $scope.search = function () {
                $scope.view.searching = true;
                $scope.view.searchNormal = false;
                var handleResult = function (resp) {
                    window.location = resp.data.data.url;
                };

                var info = angular.copy($scope.queryInfo);
                delete info.submitTime;

                SearchApi.search(info, $scope.method, $scope.queryInfo.typeGen, true)
                    .then(handleResult);
            };

	        $scope.viewSpecies = function (species_id) {
		        previewSpeciesModal.open(species_id);
	        };

	        $scope.viewLocation = function (location) {
                MapModal.open(2, location, null);
	        };
        })

        .controller("result-species.ctrl", function ($scope, $state, inputSearch, speciesApi) {
            $scope.inputSearch = inputSearch;
            $scope.results = [];
            $scope.search = function () {
                speciesApi.search($scope.inputSearch).then(function (resp) {
                    $scope.results = resp.data.data;
                });
            };

            if ($scope.inputSearch) {
                $scope.search();
            }

            $scope.view = function (species_id) {
                $state.go("frontend.result-species.species", {species_id: species_id});
            };
        })

        .directive("tree", function () {
            return {
                restrict: "A",
                link: function ($scope, elem, attrs) {
                    var newick = Newick.parse(attrs.newick);
                    var options = {
	                    skipTicks: $scope.method == 'maximum_parsimony',
                        width: 800,
                        height: 400,
                        color: {
                            distance_line: "black",
                            distance_text: "black"
                        },
                        customLeaf: function (vis) {
                            vis.selectAll('g.leaf.node')
                                .append("svg:a")
                                .attr("xlink:href", function (d) {
                                    return "#/result-dna#" + d.name;
                                })
                                .append("svg:text")
                                .attr("dx", 8)
                                .attr("dy", 3)
                                .attr("text-anchor", "start")
                                .attr('font-family', 'Helvetica Neue, Helvetica, sans-serif')
                                .attr('font-size', '10px')
                                .attr('fill', 'black')
                                .text(function (d) {
                                    var name = d.name == $scope.queryInfo.randomID ? $scope.queryInfo.title || "chuỗi cần tìm" : d.name;
                                    return name + ' (' + d.length + ')';
                                });
                        }
                    };
                    d3.phylogram.build('#svgCanvas', newick, options);
                }
            };
        })

        .directive("alignmentResult", function () {
            var genNumberString = function (number) {
                return number + " ".repeat(6 - number.toString().length);
            };
            var genLine = function (data, startIndex, endIndex) {
                var text = "Query  " + genNumberString(startIndex + data.query_from) + data.qseq.substring(startIndex, endIndex) + " ".repeat(2) + (endIndex + data.query_from - 1) + "\n";
                text += " ".repeat(13) + data.midline.substring(startIndex, endIndex) + "\n";
                text += "Sbjct  " + genNumberString(startIndex + data.hit_from) + data.hseq.substring(startIndex, endIndex) + " ".repeat(2) + (endIndex + data.hit_from - 1) + "\n";
                text += "\n";
                return text;
            };
            var genAlignment = function (data, lineLength) {
                var index = 0;
                var returnAlignment = "";
                while (index < data.align_len) {
                    var startIndex = index;
                    var endIndex = index + lineLength < data.align_len ? index += lineLength : index += data.align_len - index;
                    returnAlignment += genLine(data, startIndex, endIndex);
                    index = endIndex;
                }
                return returnAlignment;
            };

            return {
                restrict: "E",
                scope: {
                    alignment: "=",
                    lineLength: "="
                },
                link: function ($scope, elem, attrs) {
                    $scope.lineLength = $scope.lineLength || 60;
                    var $pre = $('<pre></pre>');
                    elem.append($pre);
                    $pre.html(genAlignment($scope.alignment, $scope.lineLength));
                }
            };
        })

        .directive("speciesInfo", function(speciesApi) {
            return {
                restrict: "A",
                link: function($scope, elem, attrs) {
                    speciesApi.getOneByAccession($scope.hit.description[0].id).then(function (resp) {
                        $scope.data = resp.data.data;
                        $scope.seq = _.find($scope.data.seqs, function (seq) {
                            return seq.accession == $scope.hit.description[0].accession;
                        })
                    });
                }
            };
        })


    ;

})();