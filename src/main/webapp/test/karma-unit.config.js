/*global window, module */
// Karma configuration
// Generated on Tue Sep 03 2013 12:21:29 GMT+0530 (India Standard Time)

module.exports = function (config) {
    "use strict";
    config.set({

        // base path, that will be used to resolve files and exclude
        basePath: '',


        // frameworks to use
        frameworks: ['jasmine'],


        // list of files / patterns to load in the browser
        files: [
            '../build/application/wm-libs.js',
            'angular-mocks.js',
            '../build/application/wm-loader.js',
            '../build/application/runtimeloader.js',
            './test-utils.js',
            '../build/application/placeholders.js',
            '../scripts/modules/widgets/test/common-widget.spec.js',
            '../scripts/modules/layouts/containers/**/test/*.spec.js',
            '../scripts/modules/widgets/dialog/*/test/*.spec.js',
            '../scripts/modules/widgets/**/test/*.spec.js',
        ],


        // list of files to exclude
        exclude: [
            //'../app/scripts/modules/i18n/*.js'
        ],


        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage', 'spec'
        reporters: ['spec'],


        // web server port
        port: 9876,


        // enable / disable colors in the output (reporters and logs)
        colors: true,


        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,


        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,


        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers: ['C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'],
        //browsers: ['PhantomJS'],

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout: 60000,


        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: true,
        reportSlowerThan: 500

    });
};
