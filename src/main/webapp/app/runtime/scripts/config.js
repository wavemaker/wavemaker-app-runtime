/*global window*/
/*jslint todo: true */

/* Aliasing the 'angular' variable */
var WM = window.angular;

/*Namespace for the application*/
var wm = {};

wm.init = (function () {
    'use strict';

    /*wm modules*/
    wm.modules = {};

    /*Plugin modules*/
    wm.plugins = {};
}());

WM.module('wm.layouts.page', []);
WM.module('wm.layouts.containers', []);
WM.module('wm.layouts.device', []);

WM.module('wm.widgets.basic', ['toaster']);
WM.module('wm.widgets.form', []);
WM.module('wm.widgets.dialog', ['ui.bootstrap.modal']);
WM.module('wm.widgets.grid', []);
WM.module('wm.widgets.live', []);
WM.module('wm.widgets.advanced', ['ui.calendar']);
WM.module('wm.prefabs', ['wm.widgets.base']);
WM.module('wm.themes', ['wm.widgets.base']);

WM.module('wm.layouts', ['wm.layouts.page', 'wm.layouts.containers', 'wm.layouts.device']);

WM.module('wm.widgets', [
    'wm.widgets.base',
    'wm.widgets.basic',
    'wm.widgets.form',
    'wm.widgets.dialog',
    'wm.widgets.grid',
    'wm.widgets.live',
    'wm.widgets.advanced'
]);