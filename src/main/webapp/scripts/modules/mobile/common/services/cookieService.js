/*global WM,wm, _, localStorage, window */
/**
 * @ngdoc service
 * @name wm.modules.wmCommon.services.$CookieService
 * @description
 * The 'wm.modules.wmCommon.services.$CookieService' helps to save cookies and load them back to browser whenever app
 * restarts.
 */
wm.modules.wmCommon.services.CookieService = [
    '$q',
    'DeviceService',
    function ($q, DeviceService) {
        'use strict';
        var cookieInfoKey = "wavemaker.persistedcookies",
            cookieInfo = {},
            initializationDone;

        /**
         * Just rotates the given string exactly from 1/3 of string length in left to right direction.
         * @param str
         * @returns {string}
         */
        function rotateLTR(str) {
            var arr = str.split(''),
                tArr = [],
                shift = Math.floor(str.length / 3);
            _.forEach(arr, function (v, i) {
                tArr[(i + shift) % arr.length] = arr[i];
            });
            return tArr.join('');
        }

        /**
         * Just rotates the given string exactly from 1/3 of string length in  right to left direction..
         * @param str
         * @returns {string}
         */
        function rotateRTL(str) {
            var arr = str.split(''),
                tArr = [],
                shift = Math.floor(str.length / 3);
            _.forEach(arr, function (v, i) {
                tArr[(arr.length + i - shift) % arr.length] = arr[i];
            });
            return tArr.join('');
        }

        /**
         * Loads persisted cookies from local storage and adds them to the browser.
         * @returns {*}
         */
        function init() {
            var cookieInfoStr = localStorage.getItem(cookieInfoKey),
                promises = [];
            if (cookieInfoStr) {
                cookieInfo = JSON.parse(cookieInfoStr);
                _.forEach(cookieInfo, function (c) {
                    var defer = $q.defer();
                    window.cookieEmperor.setCookie(c.hostname, c.cookieName, rotateRTL(c.cookieValue), function () {
                        defer.resolve();
                    }, function () {
                        defer.reject();
                    });
                    promises.push(defer.promise);
                });
            }
            return $q.all(promises);
        }

        /**
         * @ngdoc method
         * @name wm.modules.wmCommon.services.$CookieService#persistCookie
         * @methodOf wm.modules.wmCommon.services.$CookieService
         * @description
         * This method reads the cookie that has the given hostname and cookie name and saves them.
         *
         * @param {string} hostname domain of cookie
         * @param {string} cookieName name of cookie
         * @returns {object} promise that is resolved when cookie is saved.
         */
        this.persistCookie = function (hostname, cookieName) {
            var d = $q.defer();
            window.cookieEmperor.getCookie(hostname, cookieName, function (data) {
                if (data.cookieValue) {
                    cookieInfo[hostname + '-' + cookieName] = {
                        'hostname': hostname,
                        'cookieName': cookieName,
                        'cookieValue': rotateLTR(data.cookieValue)
                    };
                    localStorage.setItem(cookieInfoKey, JSON.stringify(cookieInfo));
                }
                d.resolve();
            }, function () {
                d.reject();
            });
            return d.promise;
        };

        if (window.cookieEmperor) {
            initializationDone = DeviceService.waitForInitialization('CookieService');
            init().finally(initializationDone);
        }

    }];
