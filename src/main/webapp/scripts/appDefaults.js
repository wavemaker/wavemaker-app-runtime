/*global WM, _*/

WM.module('wm.utils')
    .service('AppDefaults', function () {
        'use strict';

        var map = {};

        /*
         * Maps key with a value
         * Usage:
         *      setAppDefault('key1', val1)
         *      setAppDefault({
         *          'key1': val1
         *          'key2': val2
         *      });
         */
        function setAppDefault(key, value) {

            if (WM.isString(key)) {
                map[key] = value;
            } else if (WM.isObject(key)) {
                _.assign(map, key);
            }
        }

        // returns the value mapped with the key
        function getAppDefault(key) {
            return map[key];
        }

        this.set = setAppDefault;
        this.get = getAppDefault;
    });

