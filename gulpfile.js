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
var copy = require('gulp-copy');
var Server = require('karma').Server;

// browserify transformers
var babel = require('babelify');
var bShim = require('browserify-shim');
var cssify = require('cssify');
var p = require('partialify');

// documents, gitbook build
var gitbook = require('gitbook');

function compile(watch, indexFile, bundleFile) {

  indexFile = indexFile || './src/index.js';
  bundleFile = bundleFile || 'ng-time-machine.js';

  var b = browserify(indexFile,
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
        .pipe(source(bundleFile))
        .pipe(buffer())
        .pipe(sourcemaps.init({loadMaps: true}))
        .pipe(sourcemaps.write('./'))
        .pipe(gulp.dest('./dist'));
  }

  if (watch) {
    bundler.on('update', function () {
      console.log('-> bundling...', bundleFile);
      rebundle();
    });
  }

  rebundle();
}

function watch() {
  return compile(true);
}

gulp.task('build', function () {
  compile();
  return compile(false, './src/index-store-focus.js', 'ng-time-machine-store-focus.js');
});

gulp.task('watch', function () {
  compile(true);
  return compile(true, './src/index-store-focus.js', 'ng-time-machine-store-focus.js');
});


gulp.task('test', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, done).start();
});
gulp.task('test-dev', function (done) {
  new Server({
    configFile: __dirname + '/karma.conf.js',
    singleRun: false,
    autoWatch: true
  }, done).start();
});
gulp.task('default', ['watch']);

/**
 * Update version on bower.json
 * Update version on package.json
 * Git tag for version
 */
gulp.task('version-up', function () {
  var args = process.argv;
  var tagVersion = args.slice(-1);
  var fs = require('fs');

  tagVersion = tagVersion[0].replace('--', '');

  var pkg = require('./package.json');
  pkg.version = tagVersion;
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));

  var bower = require('./bower.json');
  bower.version = tagVersion;
  fs.writeFileSync('bower.json', JSON.stringify(bower, null, 2));

  var git = require('gulp-git');
  git.tag('v' + tagVersion, 'Version up');

});


/**
 * Build the docs and push to github pages
 **/
gulp.task('build-ghpages', function () {
  return gulp.src(['./dist/**/*'])
      .pipe(copy('./build'))
});


gulp.task('gitbook', function (done) {
  var book = new gitbook.Book('docs/', {
    "config": {
      "output": "build/"
    }
  });

  book.parse()
      .then(function () {
        return book.generate('website');
      })
      .then(function () {

        var stream = gulp.src(['./dist/**/*'])
            .pipe(copy('./build'));

        stream.on('end', function () {
          gulp.src(['./example/**/*'])
              .pipe(copy('./build'))
              .on('end', function () {
                console.log('COPIED examples...');
                done()
              });
        });

        stream.on('error', function (err) {
          console.error(err);
          done(err);
        })

      })
});

gulp.task('example-copy', ['gitbook'], function () {
  return gulp.src(['./example/**/*'])
      .pipe(copy('./build'));
});

gulp.task('push-pages', ['gitbook'], function () {
  return gulp.src(['./build/**/*'])
      .pipe(ghPages({push: true}));
});
