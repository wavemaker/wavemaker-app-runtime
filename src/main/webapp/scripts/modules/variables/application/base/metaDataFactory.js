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
        var metaInfo;
        // Get the service operation info of the project in run mode
        function load() {
            var deferred = $q.defer();
            // resolving if service operation info is available in cache
            if (metaInfo) {
                deferred.resolve();
            }
            VariableService.getServiceOpInfo(function (response) {
                // Caching service operation info
                metaInfo = response;
                deferred.resolve();
            }, function (errMsg) {
                wmToaster.show('error', 'ERROR', errMsg || 'Cannot fetch service definitions');
                deferred.resolve();
            });

            return deferred.promise;
        }

        // Get metadata of the variable corresponding to operationId
        function getByOperationId(operationId) {
            // Return metadata of the variable
            return _.get(metaInfo, [operationId, 'wmServiceOperationInfo']) || {};
        }
        return {
            /**
             * @ngdoc method
             * @name  wm.variables.$MetaDataFactory#load
             * @methodOf  wm.variables.$MetaDataFactory
             * @description
             * This will load variables meta data
             */
            load : load,

            /**
             * @ngdoc method
             * @name  wm.variables.$MetaDataFactory#getByOperationId
             * @methodOf  wm.variables.$MetaDataFactory
             * @description
             * This will return metadata for given operationId and service
             * @param {string} operationId operationId of the variable
             */
            getByOperationId : getByOperationId
        };
    }
];