/*global WM, wm*/

/*Defining module for oAuth */
wm.plugins.oauth = WM.module('wm.plugins.oauth', []);

wm.plugins.oauth.controllers = {};
wm.plugins.oauth.services = {};

wm.plugins.oauth.controller(wm.plugins.oauth.controllers);
wm.plugins.oauth.service(wm.plugins.oauth.services);

/*defining constants for oauth module*/
wm.plugins.oauth.constant('OAUTH_URLS', {
    oauthConfiguration : {
        getAuthorizationUrl: {
            url: "services/oauth2/:providerId/authorizationUrl",
            method: "GET"
        }
    }
});

/*Defining the config for the oauth plugins*/
wm.plugins.oauth.config(function (BaseServiceManagerProvider, OAUTH_URLS) {
    'use strict';

    BaseServiceManagerProvider.register(OAUTH_URLS);
});
/*End of oauth services Modules*/
