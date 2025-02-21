var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var chmodr = require('chmodr');

require("./tasks/create-db.js")(gulp);

gulp.task('start-server-dev', function() {
    nodemon({
        script: 'dna-tracker.js',
        ext: 'js',
        "ignore": [
            ".idea/",
            ".vagrant/",
            "backup/",
            "bin/",
            ".git/",
            "doc/",
            "db/",
            "tmp/",
            "tasks/",
            "production",
            "public",
            "app/view"
        ],
        "watch": [
            "app/"
        ],
        env: { 'NODE_ENV': 'dev' }
    });
});

gulp.task('add-permission', function () {
    chmodr(__dirname + "/app/libs/muscle/bin", "0777", function (err) {
        if (err) { throw err; }
    });
});