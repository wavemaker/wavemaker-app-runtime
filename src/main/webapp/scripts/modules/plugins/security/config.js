/*global WM, wm*/

/*Defining module for Security */
wm.plugins.security = WM.module('wm.plugins.security', []);

wm.plugins.security.controllers = {};
wm.plugins.security.services = {};
wm.plugins.security.factories = {};
wm.plugins.security.directives = {};

wm.plugins.security.controller(wm.plugins.security.controllers);
wm.plugins.security.service(wm.plugins.security.services);
wm.plugins.security.factory(wm.plugins.security.factories);
wm.plugins.security.directive(wm.plugins.security.directives);

/*defining constants for Security module*/
wm.plugins.security.constant('SECURITY_URLS', {
    Security : {
        getMethods: {
            url: "services/projects/:projectID/services/securityService/operations",
            method: "GET"
        },
        getGeneralOptions: {
            url: "services/projects/:projectID/securityservice/general",
            method: "GET"
        },
        setGeneralOptions: {
            url: "services/projects/:projectID/securityservice/general",
            method: "POST"
        },
        getAuthInfo: {
            url: "services/projects/:projectID/securityservice/authInfo",
            method: "GET"
        },
        setAuthInfo: {
            url: "services/projects/:projectID/securityservice/authInfo",
            method: "POST"
        },
        configDemo: {
            url: "services/projects/:projectID/securityservice/providers/demo",
            method: "POST"
        },
        getDemoOptions: {
            url: "services/projects/:projectID/securityservice/providers/demo",
            method: "GET"
        },
        configDatabase: {
            url: "services/projects/:projectID/securityservice/providers/database",
            method: "POST"
        },
        getDatabaseOptions: {
            url: "services/projects/:projectID/securityservice/providers/database",
            method: "GET"
        },
        configAD: {
            url: "services/projects/:projectID/securityservice/providers/activedirectory",
            method: "POST"
        },
        getADOptions: {
            url: "services/projects/:projectID/securityservice/providers/activedirectory",
            method: "GET"
        },
        configLDAP: {
            url: "services/projects/:projectID/securityservice/providers/ldap",
            method: "POST"
        },
        getLDAPOptions: {
            url: "services/projects/:projectID/securityservice/providers/ldap",
            method: "GET"
        },
        testLDAPConnection: {
            url: "services/projects/:projectID/securityservice/providers/ldap/testconnection",
            method: "POST"
        },
        getCASOptions: {
            url: "services/projects/:projectID/securityservice/providers/cas",
            method: "GET"
        },
        configCAS: {
            url: "services/projects/:projectID/securityservice/providers/cas",
            method: "POST"
        },
        getSAMLOptions: {
            url: "services/projects/:projectID/securityservice/providers/saml",
            method: "GET"
        },
        configSAML: {
            url: "services/projects/:projectID/securityservice/providers/saml",
            method: "POST"
        },
        loadIdpMetadata: {
            url: "services/projects/:projectID/securityservice/providers/saml/loadidpmetadata?idpMetadataUrl=:idpMetadataUrl",
            method: "GET"
        },
        uploadIdpMetadata: {
            url: "services/projects/:projectID/securityservice/providers/saml/loadidpmetadata",
            method: "POST",
            headers: {
                'Content-Type': undefined
            }
        },
        getOpenIdOptions: {
            url: "services/projects/:projectID/securityservice/providers/openId",
            method: "GET"
        },
        configOpenId: {
            url: "services/projects/:projectID/securityservice/providers/openId",
            method: "POST"
        },
        getDefaultProviders: {
            url: "services/openid/providers/default",
            method: "GET"
        },
        configCustomAuth: {
            url: "services/projects/:projectID/securityservice/providers/customauth",
            method: "POST"
        },
        getCustomAuthOptions: {
            url: "services/projects/:projectID/securityservice/providers/customauth",
            method: "GET"
        },
        getPortMapping: {
            url: "services/projects/:projectID/securityservice/portmapping",
            method: "GET"
        },
        getSecurityInterceptURLs: {
            url: "services/projects/:projectID/securityservice/intercepturls",
            method: "GET"
        },
        setSecurityInterceptURLs: {
            url: "services/projects/:projectID/securityservice/intercepturls",
            method: "POST"
        },
        getRoles: {
            url: "services/projects/:projectID/securityservice/roles",
            method: "GET"
        },
        setRoles: {
            url: "services/projects/:projectID/securityservice/roles",
            method: "POST"
        },
        getRolesConfig: {
            url: "services/projects/:projectID/securityservice/rolesconfig",
            method: "GET"
        },
        setRolesConfig: {
            url: "services/projects/:projectID/securityservice/rolesconfig",
            method: "POST"
        },
        generateConfig: {
            url: "services/projects/:projectID/securityservice/generateconfig",
            method: "POST"
        },
        appLogin: {
            url: "j_spring_security_check",
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        },
        appLogout: {
            url: "j_spring_security_logout",
            method: "POST"
        },
        getLoggedInUser: {
            url: "services/security/user",
            method: "GET"
        },
        getConfig: {
            url: "services/security/info",
            method: "GET"
        },
        getMobileConfig: {
            url: "metadata/app/security-config.json",
            method: "GET"
        },
        configCustomSecurity: {
            url: "services/projects/:projectID/securityservice/providers/customauth",
            method: "POST"
        },
        getCustomSecurityConfig: {
            url: "services/projects/:projectID/securityservice/providers/customauth",
            method: "GET"
        },
        testADConnection: {
            url: "services/projects/:projectID/securityservice/providers/ad/testconnection",
            method: "POST"
        },
        getPolicyConfig: {
            url: "services/projects/:projectID/securityservice/xss/policy",
            method: "GET"
        },
        setPolicyConfig: {
            url: "services/projects/:projectID/securityservice/xss/policy",
            method: "PUT"
        }
    }
});

/*Defining the config for the Security plugins*/
wm.plugins.security.config(function (BaseServiceManagerProvider, SECURITY_URLS) {
    'use strict';

    BaseServiceManagerProvider.register(SECURITY_URLS);
});
/*End of security services Modules*/
