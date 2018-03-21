/*global angular*/
/*
 * base64 encode/decode compatible with window.btoa/atob
 */
angular.module('base64', []).constant('$base64', {
    encode: window.btoa,
    decode: window.atob
});
