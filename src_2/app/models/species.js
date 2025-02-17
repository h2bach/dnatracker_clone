var fs = require("fs");
var _ = require("lodash");
var mongoose = require("mongoose");
var vi = require('../libs/vi.js');
var StaticConfig = require("../config/config.js");
var elastic = require('../libs/elasticsearch.js')(StaticConfig.elasticsearch);

var types = ["COI", "Cytochrome B"];
var countries = ["Vietnam", "Laos", "Campuchia"];

function validatorCountry (values) {
    _.forEach(values, function (val) {
        if (countries.indexOf(val) < 0) {
            return false;
        }
    });
    return true;
}

var SpeciesSchema = new mongoose.Schema({
    scientific_name: {type: String, default: '', trim: true},
    english_name: {type: String, default: '', trim: true},
    vietnamese_name: {type: String, default: '', trim: true},
    laos_name: {type: String, default: '', trim: true},
    campuchia_name: {type: String, default: '', trim: true},
    type: String,
    countries: {type: [String], validate: validatorCountry, default: [countries[0]]},
    distribution: [String],
    lat_lng: [{lat: Number, lng: Number}],
    conservation_status: {type: String, default: '', trim: true},
    images: [String],
    reference_link: [String],
    iucn_class: String,
    vn_redbook_class: String,
    seqs: [{
        accession: {type: String, default: '', trim: true},
        gen_type: {type: String, enum: types, default: types[0]},
        seq: {type: String, default: '', trim: true},
        location: {lat: Number, lng: Number}
    }],
    updated_at: {type: Date, default: Date.now},
    description: {type: String, default: '', trim: true},
    img_source: {type: String, default: '', trim: true}
});

var hookElasticSearch = function (species) {
    var _species = _.pick(species, "scientific_name vietnamese_name english_name".split(" "));

    // id of elastic document must be a string
    var createIndexText = function (doc) {
        var data = [];
        _.forEach(doc, function (value, key) {
            if (value) {
                _.forEach(value.split(" "), function (word) {
                    if (word.length > 0) {
                        var _word = word.replace(/[\(\)\-]/, '');
                        data.push(_word);
                        vi.hasMark(_word) ? data.push(vi.removeMark(_word)) : null;
                    }
                })
            }
        });
        return data;
    };

    var genDisplayText = function (doc, joinChar) {
        var joinChar = joinChar || " ";
        var returnText = [];
        _.forEach(doc, function (value) {
            if(value && value.length > 0) {
                returnText.push(value);
            }
        });
        return returnText.join(joinChar);
    };

    var speciesData = {
        display: genDisplayText(_species, "-"),
        text: createIndexText(_species).join(" "),
        suggest: {
            input: createIndexText(_species),
            output: genDisplayText(_species, "-"),
            payload: {
                species_id: species._id
            }
        }
    };

    elastic.addDocument(species._id.toString(), speciesData);
};

SpeciesSchema.post('save', hookElasticSearch);
SpeciesSchema.post('findOneAndUpdate', hookElasticSearch);
SpeciesSchema.post('remove', function (species) {
    elastic.deleteDocument(species._id);
    _.forEach(species.images, function (imageName) {
	    if(imageName){
		    fs.unlink(StaticConfig.upload.image.location + "/" + imageName);
	    }
    });
});
SpeciesSchema.post('findOneAndRemove', function (species) {
    elastic.deleteDocument(species._id);
    _.forEach(species.images, function (imageName) {
        if(imageName){
            fs.unlink(StaticConfig.upload.image.location + "/" + imageName);
        }
    });
});

SpeciesSchema.pre('findOneAndUpdate', function (next) {
    this._update.updated_at = new Date();
    next();
});


module.exports = mongoose.model("Species", SpeciesSchema);