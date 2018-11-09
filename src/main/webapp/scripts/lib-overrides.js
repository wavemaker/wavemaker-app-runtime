/*global angular, _*/

// This file is to override library files.

(function () {
    'use strict';
    // lowercase method on "angular" object is used by "textangular" library which is deprecated angular 1.7.5v.
    angular.lowercase = _.lowerCase;
    angular.uppercase = _.upperCase;
})();