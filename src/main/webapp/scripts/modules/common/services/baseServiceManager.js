/*global WM, wm*/
/*jslint todo: true */

/**
 * @ngdoc service
 * @name wm.common.$BaseServiceManager
 * @description
 * The `BaseServiceManager` contains the registration of all the plugin & core services.
 */

wm.modules.wmCommon.providers.BaseServiceManager = function () {
    'use strict';

    var baseServiceConfig = {};

    /*registers the config object with the core and all the plugins*/
    function register(serviceConfig) {
        WM.extend(baseServiceConfig, serviceConfig);
    }

    /*returns the config object*/
    function getConfig() {
        return WM.copy(baseServiceConfig);
    }

    this.getConfig = getConfig;
    this.register = register;

    this.$get = function () {
        return {
            /**
             * @ngdoc function
             * @name wm.common.$BaseServiceManager#getConfig
             * @methodOf wm.common.$BaseServiceManager
             * @function
             *
             * @description
             * returns the configuration object for all the services
             */
            getConfig: getConfig,

            /**
             * @ngdoc function
             * @name wm.common.$BaseServiceManager#register
             * @methodOf wm.common.$BaseServiceManager
             * @function
             *
             * @description
             * registers the config object with all the plugins and core configs'
             *
             * @param {object} config object of a studio module which has to registered
             */
            register: register
        };
    };
};
