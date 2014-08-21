var concat = require('broccoli-concat');
var filterES6Modules = require('broccoli-es6-module-filter');
var mergeTrees = require('broccoli-merge-trees');
var moveFile = require('broccoli-file-mover');
var pickFiles = require('broccoli-static-compiler');
var uglifyJavaScript = require('broccoli-uglify-js');
var wrapFiles = require('broccoli-wrap');
var jshint = require('broccoli-jshint');

var trees = [
  createAMDTree(),
  createStandaloneTree()
];

module.exports = mergeTrees(trees);

function createAMDTree() {
  // dist/groot.amd.js: all AMD compiled modules concatenated into 1 file
  var amd = filterES6Modules('lib', {
    moduleType: 'amd',
    anonymous: false,
  });

  amd = concat(amd, {
    inputFiles: [
      'rsvp/**/*.js',
      'rsvp.js',
      'groot/**/*.js',
      'groot.js'
    ],
    outputFile: '/groot.amd.js'
  });

  return amd;
}

function createStandaloneTree() {
  var vendorFiles = [
    'loader.js/loader.js',
    'rsvp/rsvp.js',
    'route-recognizer/dist/route-recognizer.amd.js',
    'router.js/dist/router.amd.js',
    'Immutable.js',
    'jquery.js',
    'backburner.js',
    'vdom.amd.js'
  ];

  var browser = pickFiles('vendor', {
    files: vendorFiles,
    srcDir: '/',
    destDir: '/'
  });

  browser = mergeTrees([browser, createAMDTree()]);

  browser = concat(browser, {
    inputFiles: vendorFiles.concat([
      'groot.amd.js'
    ]),
    outputFile: '/groot.js'
  });

  var end = [];
  end.push("window.groot = requireModule('groot')['default'];");
  end = end.join("\n");

  browser = wrapFiles(browser, {
    wrapper: ['', end],
    extensions: ['js']
  });

  var minified = pickFiles(browser, {
    srcDir: '/',
    destDir: '/'
  });
  minified = moveFile(minified, {
    srcFile: '/groot.js',
    destFile: '/groot.min.js'
  });
  minified = uglifyJavaScript(minified, {
    mangle: true
  });

  return mergeTrees([browser, minified]);
}
