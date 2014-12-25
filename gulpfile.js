
var releaseName = 'canvasfw';

var unminifiedFileName = releaseName + '.js';
var minifiedFileName = releaseName + '.min.js';

var mainSourceFile = './src/canvasfw.js';
var sourceFiles = './src/*.js';
var testFiles = './test/*.test.js';
var testHelperFiles = './test/helpers/*.js';
var imageFiles = './test/assets/*.png';
var buildFolder = './build/';

var imageLoader = './bower_components/ImageLoader/build/imageloader.min.js';

var gulp = require('gulp');
var glob = require('glob');
// var changed = require('gulp-changed');
// var concat = require('gulp-concat');
var stripDebug = require('gulp-strip-debug');
var uglify = require('gulp-uglify');
// var connect = require('gulp-connect');
var karma = require('gulp-karma');
var connect = require('gulp-connect');
var browserify = require('browserify');
var istanbul = require('browserify-istanbul');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');



var karmaSingleRunOptions = { configFile: 'karma.conf.js', action: 'run' };

gulp.task('build', function() {

    // build minified filename
    browserify(mainSourceFile)
        .bundle()
        // Pass desired output filename to vinyl-source-stream
        .pipe(source(minifiedFileName))
        // Convert streaming vinyl files to use buffers
        .pipe(buffer())
        .pipe(stripDebug())
        .pipe(uglify())
        // Start piping stream to tasks!
        .pipe(gulp.dest(buildFolder));

    // build unminified file
    browserify(mainSourceFile)
        .bundle()
        .pipe(source(unminifiedFileName))
        .pipe(buffer())
        .pipe(stripDebug())
        .pipe(gulp.dest(buildFolder));
});

gulp.task('server:start', function() {
    connect.server({port: 8080});
});

gulp.task('test', function() {

    // connect.server({port: 8080});

    // var browserifyOptions = {
    //     entries: [
    //         mainSourceFile,
    //         glob.sync(testHelperFiles),
    //         glob.sync(testFiles),
    //         imageLoader
    //     ]
    // };


    // browserify(browserifyOptions)
    //     .bundle()
    //     .pipe(source(unminifiedFileName))
    //     .pipe(buffer())
    //     .pipe(stripDebug())
    //     .pipe(gulp.dest(buildFolder))
    //     .pipe(karma(karmaSingleRunOptions))
    //     .on('end', function () {
    //         connect.serverClose();
    //     })
    //     .on('error', function (err) {
    //         throw err;
    //     });

    // return gulp.src([sourceFiles, testHelperFiles, testFiles, imageLoader])
    //     .pipe(karma(karmaSingleRunOptions))
    //     .on('end', function () {
    //         connect.serverClose();
    //     })
    //     .on('error', function (err) {
    //         throw err;
    //     });

    var browserifyOptions = {
        entries: [
            './src/canvasfw.js',
            imageLoader,
            glob.sync('./test/helpers/*.js'),
            glob.sync('./test/*.js')
        ],
        debug: true,
        insertGlobals: true
    };

    var istanbulOptions = {
        ignore: [
            "**/bower_components/**",
            "**/node_modules/**",
            "**/test/**",
            "**/tests/**"
        ],
        defaultIgnore: false
    };

    var karmaOptions = {
        configFile: './karma.conf.js',
        action: "run"
    };

connect.server({port: 8080});

 return browserify(browserifyOptions)
        // .on("error", handleError)
        .transform(istanbul(istanbulOptions))
        // .on("error", handleError)
        .bundle()

        // .on("error", handleError)
        .pipe(source('testbundle.js'))
        // .on("error", handleError)
        .pipe(buffer())
        // .pipe(uglify())
        // .on("error", handleError)
        .pipe(gulp.dest('./coverage'))
        .pipe(karma(karmaOptions))
        .on('end', function () {
            connect.serverClose();
        })
        // .on("error", handleError);
});

gulp.task('test-unminified', function() {

});

gulp.task('test-minified', function() {

});

gulp.task('default', ['scripts'], function() {

});
