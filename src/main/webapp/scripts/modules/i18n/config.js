/*global WM, studio, wm*/

/* Module for il8n */
WM.module('i18n', ['wm.common']).constant('WM_RUNTIME_LOCALIZATION_URLS', {
    'i18nService': {
        'getAppLocale': {
            url: 'services/application/i18n',
            method: 'GET'
        },
        'getLocale': {
            url: 'services/application/i18n/:locale',
            method: 'GET'
        }
    }
});

WM.module('i18n').config(function (BaseServiceManagerProvider, WM_RUNTIME_LOCALIZATION_URLS) {
    'use strict';
    BaseServiceManagerProvider.register(WM_RUNTIME_LOCALIZATION_URLS);
});