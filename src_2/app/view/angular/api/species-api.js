"use strict";

(function () {

    angular.module('dna-tracker.api.species', [
        ])

        .factory("speciesApi", function (Api, Upload) {
            return {
                getAll: function () {
                    return Api.get("/api/species");
                },
                getOneById: function (species_id) {
                    return Api.get("/api/species/id/" + species_id);
                },
                getOneByAccession: function (species_accession) {
                    return Api.get("/api/species/accession/" + species_accession);
                },
                update: function (info) {
                    return Api.post("/api/species/" + info.species._id, info);
                },
                updateWithFile: function (info, image) {
                    return Api.uploadCustom({
                        url: "/api/species/" + info.species._id,
                        arrayKey: '',
                        data: {
	                        image: image,
	                        species: JSON.stringify(info.species),
	                        deletedImages: info.deletedImages
                        }
                    });
                },
                delete: function (species) {
                    return Api.delete("/api/species/" + species._id);
                },
                search: function (text) {
                    return Api.get("/api/species/search/" + text);
                },
                exportDb: function () {
                    return Api.get("/api/export-db");
                }
            };
        })
    ;

})();