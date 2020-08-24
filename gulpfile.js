/**
 * Gulpfile.
 *
 * Gulp for Pattern Library + WordPress.
 *
 * Implements the following:
 * CSS:
 * - Compiles Less/Sass files
 * - Concats author files with vendor files, merging them into one CSS file (dest/css/style.css)
 * - Minifies merged output (dest/css/style.css -> dest/css/style.min.css), and generates CSS maps
 * - Copies merged output to our WordPress theme and Pattern Library instance
 *
 * JS:
 * - Compiles JS files with Babel transpiler
 * - Concats author files with vendor files, merging them into one JS file (dest/js/scripts.css)
 * - Minifies merged output (dest/js/scripts.css -> dest/js/scripts.min.css)
 * - Copies merged output to our WordPress theme and Pattern Library instance
 *
 * Images:
 * - Optimizes images using gulp-imagemin located in src/img, moves them to PL and WP image folders
 *
 * Pattern Lab:
 * - Generates patterns to view in Pattern Lab, them moves twig files to pattern-lab/source/components -> wp-theme/templates/patterns folder
 */
// eslint-disable-next-line import/order

// Local vars
const srcSass = './src/styles'; // location of our authored SCSS files
const srcJS = './src/scripts'; // location of our authored JS files
const srcImg = './src/images'; // location of our authored Image files
const destPath = './dist'; // Destination folder where author files are compiled to

// -- Loading Gulp plug-ins
const { src, dest, series, watch } = require('gulp');
const { exec } = require('child_process');
const browsersync = require('browser-sync').create();
const scss = require('gulp-sass');
scss.compiler = require('node-sass');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const imagemin = require('gulp-imagemin');
const del = require('del');
const minify = require('gulp-minify');

// Webpack + Gulp
const webpackStream = require('webpack-stream');
const webpackConfig = require('./webpack.config.js');

// -- CSS Gulp Tasks
// Compile Sass
function _scss() {
  return src(`${srcSass}/styles.scss`, { nodir: true })
    .pipe(scss())
    .pipe(
      dest(`${destPath}/css/`, {
        overwrite: true,
      }),
    );
}

// Run postcss rules + plugins on compiled Sass (includes minification)
function _postcss() {
  const plugins = [autoprefixer(), cssnano()];

  return src(`${destPath}/css/styles.css`, {
    nodir: true,
  })
    .pipe(postcss(plugins))
    .pipe(
      rename({
        extname: '.min.css',
      }),
    )
    .pipe(dest(`${destPath}/css/`));
}

// Concat any vendor CSS into -> dest/css/style.css
function _concatcss() {
  return src([`${destPath}/css/styles.css`])
    .pipe(concat('styles.css'))
    .pipe(
      rename({
        basename: 'styles',
      }),
    )
    .pipe(dest(`${destPath}/css/`));
}

// -- JS Gulp Tasks
function _vendorsJs() {
  return src([`${srcJS}/lib/*.js`, `${srcJS}/lib/**/*.js`], {
    allowEmpty: true,
  })
    .pipe(concat('vendors.js'))
    .pipe(dest(`${destPath}/js/`));
}

// Custom JavaScript code
function _customJs() {
  return src(`${srcJS}/scripts.js`, {
    allowEmpty: true,
  })
    .pipe(webpackStream(webpackConfig))
    .pipe(dest(`${destPath}/js/`));
}

function _copyImages(cb) {
  src(`./src/images/*`).pipe(dest(`${destPath}/images/`));
  cb();
}

// -- BrowserSync
function _bsReload(cb) {
  browsersync.reload();
  cb();
}

// Runs all gulp tasks with the exception of BrowserSync
exports.default = series(
  _scss,
  _concatcss,
  _postcss,
  _vendorsJs,
  _customJs,
  _copyImages,
);

exports.dev = function () {
  browsersync.init({
    server: { baseDir: './' },
    open: true,
    injectChanges: true,
  });

  watch(
    ['./src/**/*.js', './src/**/*.scss', '**/*.html'],
    { ignoreInitial: false },
    series(_scss, _concatcss, _postcss, _vendorsJs, _customJs, _bsReload),
  );
};

exports.build = series(
  _scss,
  _concatcss,
  _postcss,
  _vendorsJs,
  _customJs,
  _copyImages,
);
