var path = require('path');

module.exports = {
    db_name: "dna_tracker_db",
    db_name_cytoB: "dna_tracker_cytoB_db",
    db_name_coi: "dna_tracker_coi_db",
    db_folder: "./db",
    working_folder: "./tmp",
    blast: {
        "-db": "./db/dna_tracker_db",
        "-outfmt": 15,
        "-perc_identity": 90
    },
    blast_coi: {
        "-db": "./db/dna_tracker_coi_db",
        "-outfmt": 15,
        "-perc_identity": 90
    },
    blast_cytoB: {
        "-db": "./db/dna_tracker_cytoB_db",
        "-outfmt": 15,
        "-perc_identity": 90
    },
    jwt_secret: "dna-tracker",
    root_user: {
        username: "root",
        password: "4w3gtf33fre56y57junhgbfv_Fdf"
    },
    init_folder: [
        './tmp',
        './uploads/img'
    ],
    upload: {
        fasta: {
            location: './tmp',
            fileName: function (file) {
                return "file-" + Date.now() + ".txt";
            }
        },
        image: {
            staticFolder: "/species-image",
            location: './uploads/img',
            fileName: function (file) {
                return "img-" + Date.now() + path.extname(file.originalname);
            }
        },
        importFile: {
            location: './tmp',
            fileName: function (file) {
                return "import-db-" + Date.now() + path.extname(file.originalname);
            }
        }
    },
    elasticsearch: {
        indexName: "dna_tracker",
        typeName: "species",
        host: process.env.ES_HOST,
        "settings": {
            "analysis": {
                "filter": {
                    "stemmer_filter": {
                        "type": "stemmer",
                        "language": "english"
                    },
                    "autocomplete_filter": {
                        "max_shingle_size": "5",
                        "min_shingle_size": "2",
                        "type": "shingle"
                    },
                    "stopwords_filter": {
                        "type": "stop",
                        "stopwords": ["_english_"]
                    },
                    "ngram_filter": {
                        "type": "ngram",
                        "min_gram": 2,
                        "max_gram": 15
                    }
                },
                "analyzer": {
                    "did_you_mean": {
                        "filter": ["lowercase"],
                        "char_filter": ["html_strip"],
                        "type": "custom",
                        "tokenizer": "vi_tokenizer"
                    },
                    "autocomplete": {
                        "filter": ["lowercase", "autocomplete_filter"],
                        "char_filter": ["html_strip"],
                        "type": "custom",
                        "tokenizer": "standard"
                    },
                    "default": {
                        "filter": ["lowercase", "stopwords_filter", "stemmer_filter"],
                        "char_filter": ["html_strip"],
                        "type": "custom",
                        "tokenizer": "vi_tokenizer"
                    }
                }
            }
        },
        mapping: {
            index: "dna_tracker",
            type: "species",
            body: {
                properties: {
                    text: {type: "string"},
                    suggest: {
                        type: "completion",
                        analyzer: "simple",
                        search_analyzer: "simple",
                        payloads: true
                    }
                }
            }
        }
    },
    env: {
        dev: {
            port: 3000,
            elasticsearch: "localhost:9200",
            staticFolder: "./app/view"
        },
        production: {
            port: 3000,
            elasticsearch: "http://52.77.209.25:9200",
            staticFolder: "./production"
        }
    }
};
