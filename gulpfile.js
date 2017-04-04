/*
 *
 * Harma Davtian gulp build script
 *
 * */

// Alphabetized list of variables

var babel = require('gulp-babel'),
    bower = require('gulp-bower'),
    browserSync = require('browser-sync'),
    cleanCSS = require('gulp-clean-css'),
    concat = require('gulp-concat'),
    del = require('del'),
    folders = require('gulp-folders'),
    gulp = require('gulp'),
    gulpFilter = require('gulp-filter'),
    imagemin = require('gulp-imagemin'),
    jpegoptim = require('imagemin-jpegoptim'),
    mainBowerFiles = require('gulp-main-bower-files'),
    order = require('gulp-order'),
    path = require('path'),
    pngquant = require('imagemin-pngquant'),
    reload = browserSync.reload,
    rename = require('gulp-rename'),
    sass = require('gulp-sass'),
    sourcemaps = require('gulp-sourcemaps'),
    uglify = require('gulp-uglify');

// storing comming paths

var config = {
    bowerDir: './bower_components',

    src: {
        root: './src',
        js: './src/js',
        siteJs: './src/js/site',
        scss: './src/scss',
        vendorJs: './src/js/vendor',
        angularApps: './src/angular-apps',
        images: './src/images'
    },

    dest: {
        root: './build',
        js: './build/js',
        scss: './build/css',
        vendorJs: './build/js/vendor',
        angularApps: './build/js/angular-apps',
        images: './build/images'
    }
};

// *******************************************************************************************
// Tasks
// *******************************************************************************************

// ===========================================================================================
// Task Name: scripts-site
// Description: concatenate js files in js/site, uglify and copy to build folder.
// If order of inclusion is necessary then use the order() plugin
// ===========================================================================================
gulp.task('scripts-site', function(){
    gulp.src(config.src.siteJs + '**/*.js')
        .pipe(sourcemaps.init())

        // if you need to load things in order, use order like so
        .pipe(order([
            'one.js',
            'two.js',
            'three.js'
        ],{base: './src/js/site'}))

        .pipe(babel())
        .on('error', console.error.bind(console))
        .pipe(uglify())
        .pipe(concat('site.js'))
        .pipe(rename({suffix:'.min'}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.dest.js))
        .pipe(reload({ stream: true }));
});

// ===========================================================================================
// Task Name: scripts-vendor
// Description: concatenate src/js/vendor js files to one file, uglify and copy to build folder
// this may be unnecessary, we are now using bower
// ===========================================================================================
gulp.task('scripts-vendor', function(){
    gulp.src(path.join(config.src.vendorJs, '**/*.js'))
        .pipe(sourcemaps.init())
        .pipe(order([
            'jquery*'
        ]))
        .pipe(uglify())
        .pipe(concat('vendor.js'))
        .pipe(rename({suffix:'.min'}))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.dest.js))
        .pipe(reload({stream:true}));
});

// ===========================================================================================
// Task Name: sass
// Description: compiles sass, writes to src dir and triggers browser sync
// ===========================================================================================
gulp.task('sass', function(){
    return gulp.src(path.join(config.src.scss, '**/*.scss'))
        .pipe(sourcemaps.init())
        .pipe(sass({outputStyle: 'compressed'})).on('error', sass.logError)
        .pipe(gulp.dest(config.dest.scss))
        .pipe(reload({stream:true}));
});

// ===========================================================================================
// Task Name: html
// Description: Triggers browser sync on changes to .html files and copies html files to build folder
// ===========================================================================================
gulp.task('html', function(){
    gulp.src(path.join(config.src.root, '**/*.html'))
        .pipe(gulp.dest(config.dest.root))
        .pipe(reload({stream:true}));
});

// ===========================================================================================
// Task Name: images
// Description: Triggers browser sync on changes to image files
// ===========================================================================================
gulp.task('images', function(){
    gulp.src(path.join(config.src.images,'**/*'))
        .pipe(gulp.dest(config.dest.images));
});

// ===========================================================================================
// Task Name: images-compress
// Description: Copies images from src to build and compresses them
// ===========================================================================================
gulp.task('images-compress', function(){
    return gulp.src(path.join( config.src.images, '**/*'))
        .pipe(imagemin({
            svgoPlugins: [
                {removeViewBox: false},
                {cleanupIDs: false}
            ],
            use: [pngquant(),jpegoptim({progressive: true})]
        }))
        .pipe(gulp.dest(config.dest.images));
});

// ===========================================================================================
// Task Name: browser-sync
// Description: Initializes browserSync gulp plugin
// ===========================================================================================
gulp.task('browser-sync', function(){
    browserSync.init({
       server: {
           baseDir: 'build'
       }
   });
});

// or if you are using lamp or iis, you can 'proxy', meaning, you run your other server
// and point this to it

/*
gulp.task('browser-sync', function () {
    browserSync.init({
        proxy: 'localhost:82', //our PHP server
        port: 3334, // our new port
        open: true,
        watchTask: true
    });
});
*/

// -------------------------------------------------------------
// bower
// -------------------------------------------------------------
gulp.task('bower', function(){
   return bower()
       .pipe(gulp.dest(config.bowerDir));
});

gulp.task('main-bower-files', function() {

    var filterJS = gulpFilter('**/*.js', { restore: true });
    gulp.src('./bower.json')
        .pipe(sourcemaps.init())
        .pipe(mainBowerFiles({ includeDev: true }))
        .pipe(filterJS)
        .pipe(concat('vendor-bower.js'))
        .pipe(uglify())
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.dest.vendorJs));


    // We're using bower to include bootstrap-sass in the project
    // The bootstrap-sass does not have an entry point for the SASS compilation. The bower.json file points to
    //  assets/stylesheets/_bootstrap.scss, but that won't compile since it starts with an underscore.
    // A lot of people seem to just include _boostrap.scss in their main.scss files, but we're trying to create a vendor.css
    // So at gulp runtime, let's create an entry point, bootstrap.css, that just has this one line:
    //  @include "_bootstrap";
    // Then, in the main bower.json, we'll override the default settings with:
    //      "overrides": {
    //          "bootstrap-sass": {
    //              "main": [
    //                  "assets/stylesheets/custom-bootstrap.scss",
    //                  "assets/javascripts/bootstrap.js"
    //              ]
    //          }
    //      }
    require('fs').writeFileSync(config.bowerDir + '/bootstrap-sass/assets/stylesheets/custom-bootstrap.scss', '@import "_bootstrap";');



    var filterCSS = gulpFilter(['**/*.css', '**/*.scss'], { restore: true });
    return gulp.src('./bower.json')
        //.pipe(sourcemaps.init())
        .pipe(mainBowerFiles({ includeDev: true }))
        .pipe(filterCSS)
        .pipe(sass({ outputStyle: 'compressed' }))
        .pipe(concat('vendor.css'))
        .pipe(cleanCSS())
        //.pipe(sourcemaps.write('.'))
        .pipe(gulp.dest(config.dest.scss));

});

// ===========================================================================================
// Task Name: bower-install-plugins
// ===========================================================================================
gulp.task('bower-install-plugins', ['bower']);

// ===========================================================================================
// Task Name: clean:dest
// ===========================================================================================
gulp.task('clean:dest', function(){
    return del([
        config.dest.root
    ]);
});

// ===========================================================================================
// Task Name: watch
// Description:
// ===========================================================================================
gulp.task('watch', ['browser-sync'], function(){
    gulp.watch(path.join(config.src.js, '**/*.js'), ['scripts-site']);
    gulp.watch(path.join(config.src.scss, '**/*.scss'), ['sass']);
    gulp.watch(path.join(config.src.root, '**/*.html'), ['html']);
    gulp.watch(path.join(config.src.images, '**/*'), ['images']);
});

// ===========================================================================================
// Task Name: default
// ===========================================================================================
gulp.task('default', [
    'html',
    'images',
    'scripts-site',
    //'scripts-vendor',
    'sass',
    'main-bower-files',
    'browser-sync',
    'watch'
]);

// ===========================================================================================
// Task Name: build
// ===========================================================================================
gulp.task('build', [
    'clean:dest',
    'html',
    'images-compress',
    'scripts-site',
    //'scripts-vendor',
    'sass',
    'main-bower-files'
]);

/*
 - First run: npm install
 - Second run: bower install
 - then run: gulp
 */
