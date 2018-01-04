/*global WM, wm, _*/
/*jslint todo: true */
/*jslint sub: true */

/**
 * @ngdoc service
 * @name wm.variables.$MetaDataFactory
 * @description
 * The `MetaDataFactory` service provides the all the meta data for variables.
 */
wm.variables.factories.MetaDataFactory = [
    'VariableService',
    '$q',
    'wmToaster',
    function (VariableService, $q, wmToaster) {

        "use strict";
        var metaInfo = {};
        // Get the service operation info of the project/prefab in run mode
        function load(prefabName) {
            var deferred = $q.defer(),
                method = 'getServiceOpInfo',
                scope = 'APP',
                params = {};
            if (prefabName) {
                scope = prefabName;
                method = 'getPrefabServiceOpInfo';
                params = {'prefabName' : prefabName};
            }
            if (metaInfo[scope]) {
                deferred.resolve();
            }
            //Load metaData for prefabs and app
            VariableService[method](params, function (response) {
                // Caching service operation info
                metaInfo[scope] = response;
                deferred.resolve();
            }, function (errMsg) {
                wmToaster.show('error', 'ERROR', errMsg || 'Cannot fetch service definitions');
                deferred.resolve();
            });
            return deferred.promise;
        }

        // Get metadata of the variable corresponding to operationId and prefabName
        function getByOperationId(operationId, prefabName) {
            var scope = prefabName || 'APP',
                serviceMetaInfo = _.get(metaInfo[scope], operationId);
            // Return metadata of the variable
            if (!serviceMetaInfo) {
                return serviceMetaInfo;
            }
            return _.get(metaInfo[scope], [operationId, 'wmServiceOperationInfo']) || {};
        }
        return {
            /**
             * @ngdoc method
             * @name  wm.variables.$MetaDataFactory#load
             * @methodOf  wm.variables.$MetaDataFactory
             * @description
             * This will load variables meta data
             * @param {string} prefabName prefab name of which metaData are being loaded
             */
            load : load,

            /**
             * @ngdoc method
             * @name  wm.variables.$MetaDataFactory#getByOperationId
             * @methodOf  wm.variables.$MetaDataFactory
             * @description
             * This will return metadata for given operationId and service
             * @param {string} operationId operationId of the variable
             * @param {string} prefabName prefab name of which metaData are being loaded
             */
            getByOperationId : getByOperationId
        };
    }
];