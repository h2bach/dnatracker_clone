var fs = require("fs");
var _ = require("lodash");
var mongoose = require("mongoose");
var vi = require('../libs/vi.js');
var StaticConfig = require("../config/config.js");
var elastic = require('../libs/elasticsearch.js')(StaticConfig.elasticsearch);

var types = ["COI", "Cytochrome B", "12S", "16S", "18S", "28S","ND2", "ND4", "Cytb", "cytb", "R35", "Rag1"]
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
    iucn_class: {type: String, default: '', trim: true},
    vn_redbook_class: {type: String, default: '', trim: true},
    description: {type: String, default: '', trim: true},
    reference_link: [String],
    distribution: [String],
    images: [String],
    countries: {
        type: [String],
        default: ['Vietnam'],
        validate: [validatorCountry, 'Invalid country']
    },
    seqs: [{
        gen_type: {
            type: String, 
            required: true, 
            trim: true,
            enum: types,
            validate: {
                validator: function(v) {
                    return types.indexOf(v) !== -1;
                },
                message: 'Loại gen không hợp lệ. Các loại gen được hỗ trợ: ' + types.join(', ')
            }
        },
        seq: {type: String, required: true, trim: true},
        accession: {type: String, trim: true}
    }],
    updated_at: {type: Date, default: Date.now}
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
		    fs.unlinkSync(StaticConfig.upload.image.location + "/" + imageName);
	    }
    });
});
SpeciesSchema.post('findOneAndRemove', function (species) {
    elastic.deleteDocument(species._id);
    _.forEach(species.images, function (imageName) {
        if(imageName){
            fs.unlinkSync(StaticConfig.upload.image.location + "/" + imageName);
        }
    });
});

SpeciesSchema.pre('findOneAndUpdate', function (next) {
    this._update.updated_at = new Date();
    next();
});


module.exports = mongoose.model("Species", SpeciesSchema);