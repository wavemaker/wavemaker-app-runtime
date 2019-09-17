/*global WM, wm*/
/*jslint todo: true */
/**
 * @ngdoc service
 * @name wm.webservice.$WebService
 * @description
 * The `WebService` provides the details about the web based service apis
 */

wm.plugins.webServices.services.WebService = function (BaseService) {
    'use strict';

    /* APIs returned by the WebService.*/
    return {

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#testRestService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * tests a REST service through the specified url of teh service. Returns the response of the service (else throws an error message)
         *
         * @param {object} connectionParams object containing parameters for the request
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */

        testRestService: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'invokeRestCall',
                data: connectionParams.data,
                urlParams: connectionParams.urlParams,
                headers: connectionParams.headers
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#populateRestService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * takes a REST service url and gives out the default field values required to build/import the REST service
         *
         * @param {object} connectionParams object containing parameters for the request (else throws an error message)
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */

        populateRestService: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'generateRESTWsdlSettings',
                data : connectionParams.data,
                urlParams: connectionParams.urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#buildRestService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * builds/imports a REST service
         *
         * @param {object} connectionParams object containing parameters for the request
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */

        buildRestService: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'buildRestService',
                data : connectionParams.data,
                urlParams: connectionParams.urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#updateRestService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * updates a REST service
         *
         * @param {object} connectionParams object containing parameters for the request
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */

        updateRestService: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'updateRestService',
                data : connectionParams.data,
                urlParams: connectionParams.urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#importWSDL
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * imports a soap service through the WSDL URL of the service (else throws an error message)
         *
         * @param {object} connectionParams object containing parameters for the request
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */

        importWSDL: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'importWSDL',
                params: connectionParams.params,
                urlParams: connectionParams.urlParams,
                data: connectionParams.content
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#importWSDL
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * imports a soap service through the WSDL URL of the service (else throws an error message)
         *
         * @param {object} connectionParams object containing parameters for the request
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */

        uploadWSDL: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'uploadWSDL',
                params: connectionParams.params,
                urlParams: connectionParams.urlParams,
                data: connectionParams.content
            }, successCallback,failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#listServicesWithType
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * fetches all the services in a project from backend (else throws an error message)
         *
         * @param {function} urlParams params required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */

        listServicesWithType: function (urlParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'listServicesWithType',
                urlParams: urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#getServiceOperations
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * gets the operations corresponding to a service (else throws an error message)
         *
         * @param {object} urlParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */

        getServiceOperations: function (urlParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'getServiceMethods',
                urlParams : urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#getServiceOperationParams
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * gets the params and return types corresponding to an operation of a service (else throws an error message)
         *
         * @param {object} urlParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        getServiceOperationParams: function (urlParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'getServiceOperationParams',
                urlParams : urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#getRESTDetails
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * gets the details for an existing REST web service in a project.
         *
         * @param {object} urlParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        getRESTDetails: function (urlParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'getRESTDetails',
                urlParams: urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#getSoapServiceSettings
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * gets the details for an existing SOAP web service in a project.
         *
         * @param {object} urlParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        getSoapServiceSettings: function (urlParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'getSoapServiceSettings',
                urlParams: urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#setSoapServiceSettings
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * gets the details for an existing SOAP web service in a project.
         *
         * @param {object} urlParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        setSoapServiceSettings: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'setSoapServiceSettings',
                data : connectionParams.data,
                urlParams: connectionParams.urlParams
            }, successCallback,failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.WebService.$WebService#reImportSoapService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * reimport for an existing SOAP web service in a project.
         *
         * @param {object} connectionParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        reImportSoapService: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'reImportSoapService',
                data : connectionParams.content,
                params: connectionParams.params,
                urlParams: connectionParams.urlParams
            }, successCallback,failureCallback);
        },


        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#getWSDL
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * gets the wsdl corresponding to a service (else throws an error message)
         *
         * @param {object} urlParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        getWSDL: function (urlParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'getWSDL',
                urlParams: urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#getBindingProperties
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * gets the binding properties corresponding to a service (else throws an error message)
         *
         * @param {string} projectName current project name
         * @param {string} serviceId id of the service for which methods are required
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        getBindingProperties: function (urlParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'getBindingProperties',
                urlParams: urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#setBindingProperties
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * sets the(modified) binding properties corresponding to a service (else throws an error message)
         *
         * @param {object} urlParams parameters required for the service
         * @param {object} data post data parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        setBindingProperties: function (urlParams, data, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'setBindingProperties',
                urlParams: urlParams,
                data: data
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#listTypes
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * gets the available data types corresponding to a project (else throws an error message)
         *
         * @param {object} urlParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        listTypes: function (urlParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'listTypes',
                urlParams: urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#listTypes
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * gets the available data types corresponding to a prefab (else throws an error message)
         *
         * @param {object} urlParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        listPrefabTypes: function (urlParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'listPrefabTypes',
                urlParams: urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#registerFeedService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * registers a feed service to a project (else throws an error message)
         *
         * @param {object} connectionParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        registerFeedService: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'registerFeedService',
                urlParams: connectionParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#invoke
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * calls a web service and retrieves the data from the service(used in run mode)
         *
         * @param {object} connectionParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        invoke: function (connectionParams, successCallback, failureCallback) {
            return BaseService.send({
                target: 'WebService',
                action: 'invoke',
                urlParams: {
                    "serviceFile": connectionParams.serviceFile
                },
                data: {
                    "id": 123,
                    "method": connectionParams.method,
                    "params": connectionParams.params
                },
                config: {
                    "url": connectionParams.url
                },
                "byPassResult": true
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#invokeRestService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * calls a REST web service and retrieves the data from the service(used in run mode)
         *
         * @param {object} connectionParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        invokeRestService: function (connectionParams, successCallback, failureCallback) {
            return BaseService.send({
                target: 'WebService',
                action: connectionParams.target,
                data: connectionParams.params[2],
                urlParams: {
                    serviceID: connectionParams.params[0] ,
                    operationID: connectionParams.params[1]
                },
                config: {
                    "url": connectionParams.url
                },
                "byPassResult": true
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#remove
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * removes the specified web service from the project
         *
         * @param {object} urlParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */

        remove: function (urlParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'remove',
                urlParams : urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#retrieveServiceOperations
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * retrieves the specific operations for the specified service
         *
         * @param {object} params parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        retrieveServiceOperations: function (params, successCallback, failureCallback) {
            BaseService.send({
                target: 'WebService',
                action: 'retrieveServiceOperations',
                urlParams: params.urlParams
            }, successCallback, failureCallback);
        },
        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#invokeJavaService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * invokes the java service
         *
         * @param {object} params parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        invokeJavaService: function (params, successCallback, failureCallback) {
            BaseService.send({
                target: 'WebService',
                action: 'invokeRuntimeRestCall',
                method: params.method,
                config: {
                    url : params.url,
                    method: params.method,
                    headers: params.headers
                },
                data: params.dataParams || undefined,
                "withCredentials": params.withCredentials,
                "isDirectCall": params.isDirectCall,
                "byPassResult": true,
                "isExtURL": params.isExtURL
            }, successCallback, failureCallback);
        },
        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#buildApiRestService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * takes a REST service url and gives out the default field values required to build/import the REST service
         *
         * @param {object} connectionParams object containing parameters for the request (else throws an error message)
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        buildApiRestService: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'buildApiRestService',
                data: connectionParams
            }, successCallback, failureCallback);
        },
        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#configureWebSocketService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * takes a REST service url and gives out the default field values required to build/import the REST service
         *
         * @param {object} connectionParams object containing parameters for the request (else throws an error message)
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        configureWebSocketService: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'configureWebSocketService',
                data : connectionParams.data,
                urlParams: connectionParams.urlParams
            }, successCallback, failureCallback);
        },
        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#buildWebSocketService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * takes a REST service url and gives out the default field values required to build/import the REST service
         *
         * @param {object} connectionParams object containing parameters for the request (else throws an error message)
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        buildWebSocketService: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'buildWebSocketService',
                data : connectionParams.data,
                urlParams: connectionParams.urlParams
            }, successCallback, failureCallback);
        },
        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#updateWebSocketService
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * takes a REST service url and gives out the default field values required to build/import the REST service
         *
         * @param {object} connectionParams object containing parameters for the request (else throws an error message)
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        updateWebSocketService: function (connectionParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'updateWebSocketService',
                data : connectionParams.data,
                urlParams: connectionParams.urlParams
            }, successCallback, failureCallback);
        },

        /**
         * @ngdoc function
         * @name wm.webservice.$WebService#getWebSocketServiceDetails
         * @methodOf wm.webservice.$WebService
         * @function
         *
         * @description
         * gets the details for an existing WebSocket service in a project.
         *
         * @param {object} urlParams parameters required for the service
         * @param {function} successCallback to be called on success
         * @param {function} failureCallback to be called on failure
         */
        getWebSocketServiceDetails: function (urlParams, successCallback, failureCallback) {

            BaseService.send({
                target: 'WebService',
                action: 'getWebSocketServiceDetails',
                urlParams: urlParams
            }, successCallback, failureCallback);
        },

        uploadOpenAPI: function(connectionParams, successCallback, failureCallback) {
            BaseService.send({
                target: 'WebService',
                action: 'uploadOpenAPI',
                data: connectionParams.data,
                urlParams: connectionParams.urlParams,
                params: connectionParams.params
            }, successCallback, failureCallback);
        }
    };
};