/**
 * Created by Phuc on 9/9/2015.
 */

var gulp = require('gulp');
var sourcemaps = require('gulp-sourcemaps');
var source = require('vinyl-source-stream');
var buffer = require('vinyl-buffer');
var browserify = require('browserify');
var watchify = require('watchify');
var ghPages = require('gulp-gh-pages');

// browserify transformers
var babel = require('babelify');
var bShim = require('browserify-shim');
var cssify = require('cssify');
var p = require('partialify');

function compile(watch) {

  var b = browserify('./src/index.js',
          {
            debug: true
          })
          .external('angular')
          .transform(p)
          .transform(babel)
          .transform(cssify)
          .transform(bShim)
      ;
  var bundler = watchify(b);

  function rebundle() {
    bundler.bundle()
        .on('error', function (err) {
          console.error(err);
          this.emit('end');
        })
        .pipe(source('ng-time-machine.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist'));
  }

  if (watch) {
    bundler.on('update', function () {
      console.log('-> bundling...');
      rebundle();
    });
  }

  rebundle();
}

function watch() {
  return compile(true);
};

gulp.task('build', function () {
  return compile();
});
gulp.task('watch', function () {
  return watch();
});

gulp.task('deploy', function(){

  gulp.task('deploy', function() {
    return gulp.src('./dist/**/*')
        .pipe(ghPages());
  });

});

gulp.task('default', ['watch']);
