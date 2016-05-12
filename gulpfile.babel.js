/* DEPENDENCIES */
import gulp from 'gulp';
import gulpLoadPlugins from 'gulp-load-plugins';
import browserSync from 'browser-sync';
import browserify from 'browserify';
import babelify from 'babelify';
import assign from 'lodash.assign';
import path from 'path';
import watchify from 'watchify';
import buffer from 'vinyl-buffer';
import source from 'vinyl-source-stream';
import strictify from 'strictify';
import {stream as wiredep} from 'wiredep';
import mochaPhantomjs from 'gulp-mocha-phantomjs';

const $ = gulpLoadPlugins({
    rename: {
        'gulp-util': 'gutil'
    }
});
const reload = browserSync.reload;

/* FILE DESTINATIONS (RELATIVE TO ASSSETS FOLDER) */
var PATHS = {
    root: '/',
    app: 'client',
    app_html: '',
    app_assets: '',
    app_htmlTemplates: '',
    app_styles: '',
    app_images: '',
    app_scripts: '',
    app_fonts: '',
};

PATHS.app_html = path.join(PATHS.app);
PATHS.app_assets = path.join(PATHS.app, 'assets');
PATHS.app_styles = path.join(PATHS.app_assets, 'styles');
PATHS.app_images = path.join(PATHS.app_assets, 'images');
PATHS.app_scripts = path.join(PATHS.app_assets, 'scripts');
PATHS.app_fonts = path.join(PATHS.app_assets, 'fonts');

gulp.task('styles', () => {
    return gulp.src( path.join(PATHS.app_styles, 'scss/style.scss') )
        .pipe($.plumber())
        .pipe($.sourcemaps.init())
        .pipe($.sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', $.sass.logError))
        .pipe($.autoprefixer({
            browsers: ['last 1 version']
        }))
        .pipe($.sourcemaps.write('maps'))
        .pipe(gulp.dest( path.join(PATHS.app_styles, '/css') ))
        .pipe(reload({
            stream: true
        }));
});

function bundle(b) {
  b.bundle()
  .on('error', (err) => {
    $.gutil.log($.gutil.colors.red('Browserify'), err.toString());
    $.gutil.beep();
  })
  .pipe(source('bundle.js'))
  .pipe(buffer())
  .pipe($.sourcemaps.init({loadMaps: true}))
  .pipe($.sourcemaps.write('./'))
  .pipe(gulp.dest('./client/assets/scripts'))
  .pipe(reload({
      stream: true
  }));
}

gulp.task('watchDev', function() {
  let b = browserify({
    cache: {},
    packageCache: {},
    plugin: [watchify],
    debug: true,
    entries: ['./client/assets/scripts/main.js']
  });
  b.on('log', (message) => {
    $.gutil.log($.gutil.colors.green('Browserify'), message);
  });
  b.on('update', bundle.bind(this, b));
  b.transform(babelify, {presets: ['es2015', 'react', 'stage-1']});
  bundle(b);
});

/* BROWSER SYNC */
gulp.task('browser-sync', function() {
    browserSync.init({ 
        server: {
            baseDir: 'client',
            routes: {
                '/bower_components': 'bower_components',
                '/node_modules' : 'node_modules'
            }
        }
    });
});

/* GULP TASKS */
gulp.task('watch', function (){
    gulp.watch([
        'client/*.html'
    ]).on('change', reload);
    gulp.watch([path.join(PATHS.app_styles, '**/*.scss') ], ['styles']);
});
// 
gulp.task('default', ['watch', 'watchDev', 'styles', 'browser-sync']);

gulp.task('mocha', function() {
  return gulp.src('test/*.js', {read: false})
    .pipe($.mocha());
});

gulp.task('testWatch', function() {
    gulp.watch([path.join(PATHS.app_scripts, '**/*.js')], ['watchDev', 'mocha']);
    gulp.watch(['test/tests.js'], ['mocha']);
});

gulp.task('test', ['testWatch', 'watchDev', 'styles', 'mocha']);
