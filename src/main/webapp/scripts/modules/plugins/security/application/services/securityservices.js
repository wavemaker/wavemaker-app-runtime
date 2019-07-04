/*global WM, wm, _, _WM_APP_PROPERTIES, localStorage*/
/*jslint todo: true */
/*jslint nomen: true*/
/**
 * @ngdoc service
 * @name wm.security.$SecurityService
 * @description
 * The `SecurityService` provides the details about the security based service apis
 */

wm.plugins.security.services.SecurityService = [
    "BaseService",
    "Utils",
    "$rootScope",
    "CONSTANTS",
    "$q",
    "$http",

    function (BaseService, Utils, $rs, CONSTANTS, $q, $http) {
        'use strict';

        /* to store general options & roles */
        var _roles,
            _rolesConfig,
            _interceptUrls,
            _generalOptions,
            _lastUser,
            _config,
            _mobileconfig,
            loggedInUser,
            requestQueue = {
                'config': []
            },
            _serviceMap = {},
            onLoginCallbacks = [],
            /**
             * merge the security config from mobile and web
             * the loggedIn user's role is fetched from Web config
             * the role-landingPage map is fetched from Mobile config
             * the landing page for loggedIn user is decided from the above two's intersection
             * @param webconfig, the web-config fetched from backend API
             * @returns {finalConfig}
             */
            mergeWebAndMobileConfig = function (webconfig) {
                var userInfo = webconfig.userInfo,
                    roles = _mobileconfig.roles,
                    userRoles,
                    finalConfig = _.extend({}, _mobileconfig),
                    roleObj;
                if (webconfig.authenticated && userInfo) {
                    finalConfig.authenticated = true;
                    userRoles = userInfo.userRoles;
                    roleObj             = _.find(roles, function (o) {return _.includes(userRoles, o.name); }); // find the first role from roles(the first one is with highest priority)
                    if (roleObj) {
                        userInfo.landingPage    = roleObj.homePage || roleObj.landingPage;
                    }
                }

                finalConfig.userInfo = userInfo;
                return finalConfig;
            },
            /**
             * get the security config bundled in the apk file("/metadata/app/security-config.json").
             * Config returned by this call is updated on each build request from the studio.
             * Purpose of having this file is to remove backend dependency from a Mobile App, i.e. NO BACKEND CALL.
             * @param success
             * @param error
             */
            getMobileConfig = function (success, error) {
                if (_mobileconfig) {
                    // if already fetched, return it
                    Utils.triggerFn(success, _mobileconfig);
                    return;
                }
                BaseService.send({
                    target: 'Security',
                    action: 'getMobileConfig'
                }, function (mobileconfig) {
                    _mobileconfig = mobileconfig;
                    Utils.triggerFn(success, _mobileconfig);
                }, error);
            },
            /**
             * gets the security config from the deployed app (backend call)
             * @param success
             * @param error
             */
            getWebConfig = function (success, error) {
                if (_config) {
                    // if already fetched, return it
                    Utils.triggerFn(success, _config);
                    return;
                }
                BaseService.send({
                    target: 'Security',
                    action: 'getConfig'
                }, function (config) {
                    _config = config;
                    Utils.triggerFn(success, _config);
                }, error);
            },
            /**
             * gets the security config for an app
             * @param successCallback
             * @param failureCallback
             * @param isPostLogin
             */
            getConfig = function (successCallback, failureCallback) {
                function invokeQueuedCallbacks(id, method, data) {
                    WM.forEach(requestQueue[id], function (fn) {
                        Utils.triggerFn(fn[method], data);
                    });
                    requestQueue[id] = null;
                }
                function onSuccess(config) {
                    config.homePage = _WM_APP_PROPERTIES.homePage;
                    if (config.userInfo) {
                        // Backend returns landingPage instead of homePage, hence this statement(for consistency)
                        config.userInfo.homePage = config.userInfo.landingPage;
                    }
                    _config = config;
                    loggedInUser = config.userInfo;
                    _lastUser = loggedInUser;
                    invokeQueuedCallbacks('config', 'success', _config);
                }
                function onError(error) {
                    if ($rs.isMobileApplicationType) {
                        _config = {
                            "securityEnabled": false,
                            "authenticated": false,
                            "homePage": _WM_APP_PROPERTIES.homePage,
                            "userInfo": null,
                            "login": null
                        };
                        invokeQueuedCallbacks('config', 'success', _config);
                    } else {
                        invokeQueuedCallbacks('config', 'error', error);
                    }
                }

                if (_config) {
                    // if already fetched, return it
                    Utils.triggerFn(successCallback, _config);
                    return;
                }

                // Queue check, if same queue is already in progress, do not send another request
                requestQueue.config = requestQueue.config || [];
                requestQueue.config.push({
                    success: successCallback,
                    error: failureCallback
                });
                if (requestQueue.config.length > 1) {
                    return;
                }

                if (!CONSTANTS.hasCordova) {
                    // for web project, return config returned from backend API call.
                    getWebConfig(onSuccess, onError);
                } else {
                    /*
                     * for mobile app, first get the mobile config (saved in the apk)
                     * - if security not enabled, just return mobile config (no backend call required)
                     * - else, get Web config (will be  the same API hit for login) and merge the config with _mobileconfig
                     */
                    getMobileConfig(function (mobileconfig) {
                        if (!mobileconfig.securityEnabled) {
                            onSuccess(mobileconfig);
                        } else {
                            getWebConfig(function (config) {
                                config = mergeWebAndMobileConfig(config);
                                onSuccess(config);
                            }, function () {onSuccess(mobileconfig); });
                        }
                    }, onError);
                }
            },
            setConfig = function (config) {
                _lastUser = loggedInUser;
                _config = config;
                loggedInUser = config && config.userInfo;
            },
        /*Function to get the details of the logged-in user in the Application/RUN mode.*/
            getLoggedInUser = function (getConfigFn, successCallback, failureCallback) {
                /*If the details of the logged-in user have already been fetched, trigger the success callback.
                * Else, make a call to the service to fetch details and then trigger the callback.*/
                if (!loggedInUser) {
                    getConfigFn(successCallback, failureCallback);
                } else {
                    Utils.triggerFn(successCallback, loggedInUser);
                }

            };

        /* APIs returned by the SecurityService.*/
        return {

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getMethods
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the methods exposed by the security service in RUN mode
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getMethods: function (projectID, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'getMethods',
                    urlParams: {
                        projectID: projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getGeneralOptions
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get values of general options. These values can determine if security config is enabled or not and also stores the type of datasource to be used. Following are the fields associated in generaloptions object:
             * 1. enforceSecurity - it signifies whether security is enabled or not for the associated project.
             * 2. enforceIndexHtml - it signifies whether default login or custom login page to be used.
             * 3. useSSL - it depicts whether secure socket layer to be used or not.
             * 4. sslPort - if useSSL is true then the value of this parameter to be used. This is invalid in SaaS.
             * 5. authProviders - Its a set containing the Security AUth providers in use. Each element can have one of the following values
             *      - DEMO
             *      - DATABASE
             *      - LDAP
             *      - AD
             *      - CAS
             *      - CUSTOM
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getGeneralOptions: function (projectID, successCallback, failureCallback) {
                if (!_generalOptions) {
                    BaseService.send({
                        target: 'Security',
                        action: 'getGeneralOptions',
                        urlParams: {
                            projectID: projectID
                        }
                    }, function (generalOptions) {
                        _generalOptions = generalOptions;
                        Utils.triggerFn(successCallback, generalOptions);
                    }, failureCallback);
                } else {
                    Utils.triggerFn(successCallback, _generalOptions);
                }
            },
            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#setGeneralOptions
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * to store the general Options of the security in this service
             *
             * @param {object} generalOptions general options
             */

            setGeneralOptions: function (params) {
                var deferred = $q.defer();
                BaseService.send({
                    target: 'Security',
                    action: 'setGeneralOptions',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, function () {
                    _generalOptions = params.config;
                    deferred.resolve();
                }, deferred.reject);
                return deferred.promise;
            },
            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getAuthInfo
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get values of authentication options. These values can determine if security config is enabled or not and also stores the type of datasource to be used. Following are the fields associated in generaloptions object:
             * 1. enforceSecurity - it signifies whether security is enabled or not for the associated project.
             * 2. csrfConfig - it signifies whether csrf security enabled or not and headerName
             * 3. loginConfig - it signifies type,pageName and sessionTimeout
             * 4. rememberMeConfig - it signifies whether rememberMeConfig enabled or not and tokenValiditySeconds.
             * 5.tokenAuthConfig - it signifies whether tokenAuthConfig enabled or not, parameter and tokenValiditySeconds.
             * 6. authProviders - Its a set containing the Security AUth providers in use. Each element can have one of the following values
             *      - DEMO
             *      - DATABASE
             *      - LDAP
             *      -SAML
             *      -Open ID
             *      - AD
             *      - CAS
             *      - CUSTOM
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */


            getAuthInfo:  function (projectID, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'getAuthInfo',
                    urlParams: {
                        projectID: projectID
                    }
                }, function (authInfo) {
                    Utils.triggerFn(successCallback, authInfo);
                }, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#setAuthInfo
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * to store the authentication information of the security in this service
             *
             * @param {object} Authentication information
             */

            setAuthInfo: function (params) {
                var deferred = $q.defer();
                BaseService.send({
                    target: 'Security',
                    action: 'setAuthInfo',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, deferred.resolve, deferred.reject);
                return deferred.promise;
            },

            cacheGeneralOptions: function (generalOptions) {
                _generalOptions = generalOptions;
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#configDemo
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to configure Security Provider as “Demo”. This security provider must be used when the limited default logins must be allowed. Hence, this security provider stores the configuration values in an xml file (project-security.xml), as it is assumed that users will be limited.
             *
             * While calling this API, it is mandatory to set the requestBody.
             * RequestBody consist of two data members:
             * 1. demoUsers - It consist of userid, password and roles (list of string) as its data member. The userid and password must be filled to make it work correctly.
             * 2. generalOptions - It consist of 5 fields viz., enforceSecurity, enforceIndexHtml, useSSL, sslPort and dataSourceType respectively. To configure Demo, dataSourceType must be set to “Demo” and enforceSecurity must be true. Other options must be set as per the requirement.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            configDemo: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'configDemo',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#configDemo
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to configure Security Provider as “Demo”. This security provider must be used when the limited default logins must be allowed. Hence, this security provider stores the configuration values in an xml file (project-security.xml), as it is assumed that users will be limited.
             *
             * While calling this API, it is mandatory to set the requestBody.
             * RequestBody consist of two data members:
             * 1. demoUsers - It consist of userid, password and roles (list of string) as its data member. The userid and password must be filled to make it work correctly.
             * 2. generalOptions - It consist of 5 fields viz., enforceSecurity, enforceIndexHtml, useSSL, sslPort and dataSourceType respectively. To configure Demo, dataSourceType must be set to “Demo” and enforceSecurity must be true. Other options must be set as per the requirement.
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getDemoOptions: function (projectID, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'getDemoOptions',
                    urlParams: {
                        projectID: projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#configDatabase
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to store and access login details from the database. A table is maintained in the database to store the username and password of the user. During login, values of username and password is compared with the values present in the database. On the basis of which it is decided to authorize user or not.
             * To configure Security Provider as “Database”. It requires RequestBody as input in which values for databaseoptions and general options are set. The details of these fields are as follows:
             * 1. Databaseoptions
             *      a) modelName - name of the database.
             *      b) entityName - An entity name.
             *      c) tableName - a table name.
             *      d) unamePropertyName - username property.
             *      e) unameColumnName - username column in the database.
             *      f) uidPropertyName - userid property.
             *      g) uidColumnName - userid column.
             *      h) pwPropertyName - password property.
             *      i) pwColumnName - password column.
             *      j) rolePropertyName - role property.
             *      k) roleColumnName - role column.
             *      l) useRolesQuery - Roles query
             *      m) rolesByUsernameQuery - roles by username query.
             *      n) tenantIdField - tenant ID
             *      o) defTenantId - default tenant ID.
             * 2. GeneralOptions - a generaloptions object
             * The difference between column name and property name is that the column name refers to the database whereas property name refers to the field of an object which is later used for many purposes like in Queries.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            configDatabase: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'configDatabase',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getDatabaseOptions
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the configured values of Database Options. This API should be used when the Security Provider is selected as “Database”. This security provider provides a facility to configure login values with the database which means the authentication details are stored in the database. To execute this API, it is important to configure database first before using configdatabase api.
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getDatabaseOptions: function (projectID, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'getDatabaseOptions',
                    urlParams: {
                        projectID: projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#configAD
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to configure Security Provider as “Active Directory”. Active Directory security provider supports its own non-standardized authentication option and its normal usage pattern is also different from standardized LDAP which uses distinguished name. Hence, it is used instead of LDAP. It require RequestBody as input in which values for LDAPOption is set.
             * Following is the structure of LDAPOptions:
             * 1. Domain - A domain name.
             * 2. Url - a projects url
             * 3. managerDn - manager domain
             * 4. managerPassword - manager password
             * 5. userDnPattern - user domain pattern
             * 6. groupSearchDisabled - a field which represents the group search enable/disable value (boolean).
             * 7. groupSearchBase - a string which contains group search base value.
             * 8. groupRoleAttribute - a string which contains role attribute value.
             * 9. groupSearchFilter - a string which contains group search filter value.
             * 10. roleModel - model name for a role.
             * 11. roleEntity - entity name of the role.
             * 12. roleTable - a table name of the role in the database.
             * 13. roleUsername - username of the role.
             * 14. roleProperty - property of the role.
             * 15. roleQuery - role query.
             * 16. roleProvider - role provider.
             * 17. generalOptions - a general option object.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            configAD: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'configAD',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getADOptions
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the configured values of Active Directory (Security Provider). Note that before using this API, it is important to execute configAD api as it will configure the values for Active Directory Security Provider otherwise it will throw an exception. This API returns the LDAPOption object.
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getADOptions: function (projectID, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'getADOptions',
                    urlParams: {
                        projectID: projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#configLDAP
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to configure Security Provider as “LDAP” (Lightweight Directory Access Protocol). This security provider is used when authentication values must be stored in directory rather than database. The advantage is less processing time required compared to retrieving values from database. To call this API, a RequestBody in which values for LDAPOption is set (Similar to Active Directory) and passed with the call.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            configLDAP: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'configLDAP',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#configOpenId
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to configure Security Provider as “OpenId” .
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            configOpenId: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'configOpenId',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getADOptions
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the values of configured LDAP (Lightweight Directory Access Protocol) security provider. LDAP security provider is used as a central repository for user information and as an authentication service. This API returns LDAPOptions object.
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getLDAPOptions: function (projectID, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'getLDAPOptions',
                    urlParams: {
                        projectID: projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getOpenIdOptions
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the values of configured OpenId security provider.
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getOpenIdOptions: function (projectID, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'getOpenIdOptions',
                    urlParams: {
                        projectID: projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getDefaultProviders
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the all the default providers.
             *
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getDefaultProviders: function (successCallback, failureCallback) {
                return BaseService.execute({
                    target: 'Security',
                    action: 'getDefaultProviders'
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#testLDAPConnection
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to test the LDAP Connection whether it is valid and working or not. To do this, a requestBody is set with LDAPOption object which contains connection detail.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            testLDAPConnection: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'testLDAPConnection',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getCASOptions
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the values of configured CAS (Central Authentication Service) security provider.
             * This API returns appropriate values on the basis of what is set earlier using configureCAS API.
             *
             * Following are the fields which need to be set for using CAS:
             * a) casURL - A CAS url
             * b) projectURL - projects url.
             * c) userDetailsProvider - A string which contains the value “CAS”.
             * d) DatabaseOptions - DatabaseOptions object
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getCASOptions: function (projectID, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'getCASOptions',
                    urlParams: {
                        projectID: projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#configCAS
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The URL configures the CAS as the service provider. This mechanism enables the
             * Configuration parameters should be sent through json object using RequestBody.
             * Following 3 data members value to be set for using CAS:
             * e) casURL - A CAS url.
             * f) projectURL - project url.
             * g) userDetailsProvider - A string which contains the value “CAS”.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            configCAS: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'configCAS',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },



            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getSAMLOptions
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the values of configured SAML security provider.
             * This API returns appropriate values on the basis of what is set earlier using configureSAML API.
             *
             *
             * @param {string} projectID project id
             */

            getSAMLOptions: function (projectID) {
                return BaseService.execute({
                    target: 'Security',
                    action: 'getSAMLOptions',
                    urlParams: {
                        projectID: projectID
                    }
                });
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#configSAML
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * Save SAML configurations.
             * While calling this API, it is mandatory to set the requestBody.
             * Following is the structure of SAMLOptions:
             * 1. samlOptions - this property has all the saml related configuration.
             *  a. createKeystore - (boolean) to auto generate key-store.
             *  b. idpEndpointUrl - Identity Provider endpoint url.
             *  c. idpMetadataUrl - Identity Provider metadata url.
             *  d. idpPublicKey - Identity Provider public key.
             *  e. keyAlias - Alias key.
             *  f. keyStoreLocation - Path where the key-store is placed in the project.
             *  g. keyStoreName - Name of the key-store.
             *  h. keyStorePassword - Key-store password.
             *  i. roleMappingEnabled - (boolean) whether the role is mapped.
             *  j. subjectName - subject name for key-store.
             * 2. generalOptions - It consist of 5 fields viz., enforceSecurity, enforceIndexHtml, useSSL, sslPort and dataSourceType respectively. To configure SAML, dataSourceType must be set to “SAML” and enforceSecurity must be true. Other options must be set as per the requirement.
             *
             * @param {object} params object containing parameters for the request
             */

            configSAML: function (params) {
                return BaseService.execute({
                    target: 'Security',
                    action: 'configSAML',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                });
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#loadIdpMetadata
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * Loads SAML metadata through MetadataUrl.
             *
             * Url Parameters
             * 1) Project ID
             * 2) IDP Metadata URL
             *
             * @param {object} params object containing parameters for the request
             */

            loadIdpMetadata: function (params) {
                return BaseService.execute({
                    target: 'Security',
                    action: 'loadIdpMetadata',
                    urlParams: {
                        projectID: params.projectID,
                        idpMetadataUrl: params.idpMetadataUrl
                    }
                });
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#uploadIdpMetadata
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The uploaded xml file configures SAML as the service provider.
             * Configuration parameters should be sent through json object using RequestBody.
             *
             * This call is a multipart data request. Metadata file should be sent in the request body.
             *
             * @param {object} params object containing parameters for the request
             */

            uploadIdpMetadata: function (params) {
                return BaseService.execute({
                    target: 'Security',
                    action: 'uploadIdpMetadata',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.content
                });
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#configCustomAuth
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to customize the Authorization as per the need. This mechanism provides facility to directly update xml file and customize any authorization as per the requirement. To do this, a RequestBody which consist of config and general option attributes, must be set and sent to configure the values.
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            configCustomAuth: function (projectID, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'configCustomAuth',
                    urlParams: {
                        projectID: projectID
                    }
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getCustomAuthOptions
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get values of Customize Authorization Option. It returns the XML file as a string which contains the detail of authorization mechanism. This XML File is nothing but custom user security bean.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getCustomAuthOptions: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'getCustomAuthOptions',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getPortMapping
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the port detail which is currently in use. Port details are stored in project-security.xml file. On executing this api, the values are returned from this xml. Following is the representation of port values in xml file:
             *  <security:port-mappings>
             *      <security:port-mapping http="8080" https="8443"/>
             *  </security:port-mappings>
             * Where attributes http and https refers to unsecured and secured port.  This method is not valid in SaaS.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getPortMapping: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'getPortMapping',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getSecurityInterceptURLs
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the security intercept url list of the application. These url’s determines the authentication or validation for the urls. This data is retrieved from project-security.xml file under <security:http> tag. In the xml file the entry for security intercept url looks like this:
             * <security:intercept-url pattern="/app.css" access="permitAll"/>
             * where pattern attribute refers to the url pattern and access attribute refers to the authentication level.
             * Also note that there are default 15 url present in the xml file which is entered automatically on enabling security for the first time. Also, it is important to enable security before executing this API otherwise the API will throw an exception.
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getSecurityInterceptURLs: function (projectID, successCallback, failureCallback) {
                if (_interceptUrls === undefined) {
                    BaseService.send({
                        target: 'Security',
                        action: 'getSecurityInterceptURLs',
                        urlParams: {
                            projectID: projectID
                        }
                    }, function (response) {
                        _interceptUrls = response;
                        Utils.triggerFn(successCallback, response);
                    }, failureCallback);
                } else {
                    Utils.triggerFn(successCallback, _interceptUrls);
                }
            },

            clearInterceptUrls: function (serviceName) {
                _.remove(_interceptUrls, function (interceptUrl) {
                    return _.includes(interceptUrl.urlPattern, _serviceMap[serviceName]);
                });
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#setSecurityInterceptURLs
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to add security intercept urls in the project-security.xml file. The intercept url’s is used to authenticate url while its execution. When this api is executed an entry is made in <security:http> tag of project-security.xml file. The entry is as follows:
             * <security:intercept-url pattern="/app.css" access="permitAll"/>
             * where pattern attribute refers to the url pattern and access attribute refers to the authentication level.
             * During calling this api, a RequestBody object has to be set which consist of general options and securityURLMap. SecurityURLMap accepts pattern and access as its key value pair. Please see example for more detail.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            setSecurityInterceptURLs: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'setSecurityInterceptURLs',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, function (response) {
                    _interceptUrls = params.config;
                    Utils.triggerFn(successCallback, response);
                }, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getRoles
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to retrieve the role configuration details. This configuration determines the level of authorization for any given user. The values are present in project-security.xml file. On executing this api, a values in role property is retrieved in the form of string and returned.
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getRoles: function (projectID, successCallback, failureCallback) {
                if (_roles === undefined) {
                    BaseService.send({
                        target: 'Security',
                        action: 'getRoles',
                        urlParams: {
                            projectID: projectID
                        }
                    }, function (response) {
                        _roles = response;
                        Utils.triggerFn(successCallback, response);
                    }, failureCallback);
                } else {
                    Utils.triggerFn(successCallback, _roles);
                }
            },
            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getRolesConfig
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to retrieve the role config landing page details.
             * This configuration defines the landing page configurations for each role. User will be re-directed
             * to the landing page configured for the user's specific role.
             *
             * @param {string} projectID project id
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getRolesConfig: function (projectID, forceReload, successCallback, failureCallback) {
                if (forceReload || !_rolesConfig.length) {
                    BaseService.send({
                        target: 'Security',
                        action: 'getRolesConfig',
                        urlParams: {
                            projectID: projectID
                        }
                    }, function (response) {
                        _rolesConfig = response;
                        Utils.triggerFn(successCallback, response);
                    }, failureCallback);
                } else {
                    Utils.triggerFn(successCallback, _rolesConfig);
                }
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#setRolesConfig
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to set the role configuration details with the landing page configured for each role.
             * The property tag in the xml file is as follows:
             * <property name="roles">
             *      <list>
             *          <role name="admin" desc="">
             *              <role-config landing-page="Admin" />
             *          </role>
             *          <role name="guest" desc="">
             *              <role-config landing-page="Main" />
             *          </role>
             *      </list>
             * </property>
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            setRolesConfig: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'setRolesConfig',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, function (response) {
                    _rolesConfig = params.config;
                    Utils.triggerFn(successCallback, response);
                }, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#generateConfig
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to re-generate provider xml file
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            generateConfig: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'generateConfig',
                    urlParams: {
                        projectID: params.projectID
                    }
                }, function (response) {
                    Utils.triggerFn(successCallback, response);
                }, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#setRoles
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to set the role configuration detail. The role configuration is required to manage the level of authorization for any user. This detail is present in project-security.xml file. On executing this api, role property of securityservice bean is updated with values passed into it. The property tag in the xml file is as follows:
             * <property name="roles">
             *      <list>
             *          <value>admin</value>
             *          <value>guest</value>
             *      </list>
             * </property>
             * Roles values are passed in an RequestBody as an array of string. Please see RequestBody example for more detail.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            setRoles: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'setRoles',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, function (response) {
                    _roles = params.config;
                    Utils.triggerFn(successCallback, response);
                }, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#appLogin
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to login into the app.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            appLogin: function (params, successCallback, failureCallback) {
                var rememberme = WM.isUndefined(params.rememberme) ? false : params.rememberme,
                    loginParams = ['username', 'password', 'rememberme'],
                    customParams = '',
                    self = this;

                // process extra data if passed
                _.each(params, function (value, name) {
                    if (!_.includes(loginParams, name)) {
                        customParams += '&' + encodeURIComponent(name) + '=' + encodeURIComponent(value);
                    }
                });

                return BaseService.send({
                    'target' : 'Security',
                    'action' : 'appLogin',
                    'data'   : 'j_username=' + encodeURIComponent(params.username) +
                        '&j_password=' + encodeURIComponent(params.password) +
                        '&remember-me=' + rememberme +
                        customParams
                }, function (response) {
                    self.getConfig(function (config) {
                        var xsrfCookieValue = response[CONSTANTS.XSRF_COOKIE_NAME];

                        //override the default xsrf cookie name and xsrf header names with WaveMaker specific values
                        if (xsrfCookieValue) {
                            if (CONSTANTS.hasCordova) {
                                localStorage.setItem(CONSTANTS.XSRF_COOKIE_NAME, xsrfCookieValue);
                            }
                            $http.defaults.xsrfCookieName = CONSTANTS.XSRF_COOKIE_NAME;
                            $http.defaults.xsrfHeaderName = config.csrfHeaderName;
                        }
                        // After the successful login in device, this function triggers the pending onLoginCallbacks.
                        _.forEach(onLoginCallbacks, Utils.triggerFn);

                        onLoginCallbacks.length = 0;
                        Utils.triggerFn(successCallback, response);
                    });
                }, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#appLogout
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to logout of the app.
             *
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            appLogout: function (successCallback, failureCallback) {
                return BaseService.send({
                    target: 'Security',
                    action: 'appLogout',
                    byPassResult: true
                }, function (response) {
                    _.set(_config, 'authenticated', false);
                    _.set(_config, 'userInfo', null);
                    if (CONSTANTS.hasCordova) {
                        localStorage.setItem(CONSTANTS.XSRF_COOKIE_NAME, '');
                    }
                    Utils.triggerFn(successCallback, response);
                }, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#isAuthenticated
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to check if the user is authenticated in the RUN mode.
             *
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            isAuthenticated: function (successCallback, failureCallback) {
                this.getConfig(function (config) {
                    Utils.triggerFn(successCallback, config.authenticated);
                }, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getUserName
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the name of the logged in user in RUN mode
             *
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getUserName: function (successCallback, failureCallback) {
                getLoggedInUser(this.getConfig, function (loggedInUser) {
                    Utils.triggerFn(successCallback, loggedInUser.userName);
                }, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getUserId
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the id of the logged in user in RUN mode
             *
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getUserId: function (successCallback, failureCallback) {
                getLoggedInUser(this.getConfig, function (loggedInUser) {
                    Utils.triggerFn(successCallback, loggedInUser.userId);
                }, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getTenantId
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the tenant Id of the logged in user in RUN mode
             *
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getTenantId: function (successCallback, failureCallback) {
                getLoggedInUser(this.getConfig, function (loggedInUser) {
                    Utils.triggerFn(successCallback, loggedInUser.tenantId);
                }, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getUserRoles
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the roles for the logged in users in RUN mode
             *
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            getUserRoles: function (successCallback, failureCallback) {
                this.getConfig(function (config) {
                    Utils.triggerFn(successCallback, config.userInfo.userRoles, config.authenticated);
                }, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#isSecurityEnabled
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to get the status of security service in the project (enabled or not)
             *
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */

            isSecurityEnabled: function (successCallback, failureCallback) {
                this.getConfig(function (loggedInUser) {
                    Utils.triggerFn(successCallback, config.securityEnabled);
                }, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#configCustomSecurity
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * Set the custom security config
             *
             * @param {object} params to be used for setting security
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */
            configCustomSecurity: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'configCustomSecurity',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },
            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getCustomSecurityConfig
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * Get the custom security config
             *
             * @param {object} params to be used for getting custom security config
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */
            getCustomSecurityConfig: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'getCustomSecurityConfig',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getPolicyConfig
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * get the policy config
             *
             * @param {object} params to be used for getting policy config
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */
            getPolicyConfig : function (projectID) {
                var deferred = $q.defer();
                BaseService.execute({
                    target: 'Security',
                    action: 'getPolicyConfig',
                    urlParams: {
                        projectID: projectID
                    }
                }, deferred.resolve, deferred.reject);
                return deferred.promise;
            },
            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#setPolicyConfig
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * set the policy config
             *
             * @param {object} params object containing parameters for the request
             */
            setPolicyConfig : function (params) {
                BaseService.send({
                    target: 'Security',
                    action: 'setPolicyConfig',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                });
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#testADConnection
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * The API is used to test the AD(Active Directory) Connection whether it is valid and working or not.
             * To do this, a requestBody is set with ADOption object which contains connection detail.
             *
             * @param {object} params object containing parameters for the request
             * @param {function} successCallback to be called on success
             * @param {function} failureCallback to be called on failure
             */
            testADConnection: function (params, successCallback, failureCallback) {
                BaseService.send({
                    target: 'Security',
                    action: 'testADConnection',
                    urlParams: {
                        projectID: params.projectID
                    },
                    data: params.config
                }, successCallback, failureCallback);
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#setLoggedInUser
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * to cache the logged in user object
             *
             * @param {object} user user object
             */
            setLoggedInUser: function (user) {
                _lastUser = loggedInUser;
                loggedInUser = user;
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#updateCachedRolesInfo
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * to update the roles info in cache
             *
             * @param {object} rolesConfig array of roles config objects
             */
            updateCachedRolesInfo: function (rolesConfig) {
                /* sanity check */
                if (!WM.isArray(rolesConfig) || !rolesConfig.length) {
                    return;
                }
                _rolesConfig = rolesConfig;
                _roles = _.map(rolesConfig, "name");
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getLastLoggedInUser
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * returns the previous loggedInUser
             *
             * @param {object} rolesConfig array of roles config objects
             */
            getLastLoggedInUser: function () {
                return _lastUser && _lastUser.userName;
            },

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#getConfig
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * to update the roles info in cache
             *
             * @param {object} rolesConfig array of roles config objects
             */
            getConfig: getConfig,

            /**
             * @ngdoc function
             * @name wm.security.$SecurityService#setConfig
             * @methodOf wm.security.$SecurityService
             * @function
             *
             * @description
             * to update the roles info in cache
             *
             * @param {object} rolesConfig array of roles config objects
             */
            setConfig: setConfig,

            setServices: function (serviceMap) {
                _serviceMap = serviceMap;
            },

            /**
             * This function returns a promise. Promise is resolved when security is
             * 1. disabled
             * 2. enabled and user is authenticated
             * 3. enabled and user is not authenticated, then promise is resolved on user login
             * @returns {*} promise
             */
            onUserLogin: function () {
                var deferred = $q.defer();

                this.getConfig(function (config) {
                    if (config.securityEnabled) {
                        if (config.authenticated) {
                            deferred.resolve();
                        } else {
                            onLoginCallbacks.push(deferred.resolve);
                        }
                    } else {
                        deferred.resolve();
                    }
                });

                return deferred.promise;
            },
            /**
             * For web applications, security is handled in Backend Server. So, this function always return true
             * for web applications. In case of Mobile hybrid apps, access is allowed only if,
             * 1) page is public.
             * 2) Security is disabled
             * 3) Security is enabled and user is authenticated
             *
             * @param {string} pageName name of the page.
             * @returns {Object} a promise
             */
            canAccess : function () {
                return $q.resolve();
            }
        };
    }];
