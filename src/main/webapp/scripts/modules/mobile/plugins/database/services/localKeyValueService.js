/*global wm, WM, _*/
/**
 * @ngdoc service
 * @name wm.plugins.database.services.$LocalKeyValueService
 * @description
 * The 'wm.plugins.database.services.$LocalKeyValueService' stores key-value pair.
 */
wm.plugins.database.services.LocalKeyValueService = [function () {
    'use strict';
    var store;
    function fetchEntry(key) {
        var filterCriteria = [{
            'attributeName' : 'key',
            'attributeValue' : key,
            'attributeType' : 'STRING',
            'filterCondition' : 'EQUALS'
        }];
        return store.filter(filterCriteria);
    }
    return {
        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalKeyValueService#init
         * @methodOf wm.plugins.database.services.$LocalKeyValueService
         * @description
         * Initializes the service with the given store.
         *
         * @param {object} storeToUse a store with id, key, value with fields.
         * @returns {object} a promise that is resolved when data is persisted.
         */
        'init' : function (storeToUse) {
            store = storeToUse;
        },
        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalKeyValueService#put
         * @methodOf wm.plugins.database.services.$LocalKeyValueService
         * @description
         * clear data in all databases.
         *
         * @param {string} key key
         * @param {string} value value
         * @returns {object} a promise that is resolved when data is persisted.
         */
        'put' : function (key, value) {
            if (value) {
                value = JSON.stringify(value);
            }
            return fetchEntry(key).then(function (result) {
                if (result && result.length > 0) {
                    return store.save({
                        'id' : result[0].id,
                        'key' : key,
                        'value' : value
                    });
                }
                return store.add({
                    'key' : key,
                    'value' : value
                });
            });
        },
        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalKeyValueService#remove
         * @methodOf wm.plugins.database.services.$LocalKeyValueService
         * @description
         * clear data in all databases.
         *
         * @param {string} key key
         * @returns {object} a promise that is resolved when respective value is removed from store.
         */
        'remove' : function (key) {
            return fetchEntry(key).then(function (result) {
                if (result && result.length > 0) {
                    return store.delete(result[0].id);
                }
            });
        },
        /**
         * @ngdoc method
         * @name wm.plugins.database.services.$LocalKeyValueService#get
         * @methodOf wm.plugins.database.services.$LocalKeyValueService
         * @description
         * retrieves the value mapped to the key.
         *
         * @param {string} key key
         * @returns {object} a promise that is resolved when value is retrieved from store.
         */
        'get' : function (key) {
            return fetchEntry(key).then(function (result) {
                var value;
                if (result && result.length > 0) {
                    value = result[0].value;
                    if (value) {
                        value = JSON.parse(value);
                    }
                }
                return value;
            });
        }
    };
}];