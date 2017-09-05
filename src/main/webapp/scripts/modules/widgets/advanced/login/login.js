/*global WM, window*/
/*jslint sub: true*/
/*Directive for login-from */

WM.module('wm.widgets.advanced')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/advanced/login.html',
            '<div init-widget class="app-login" apply-styles="container">' +
                '<wm-message scopedataset="loginMessage" class="app-login-message"></wm-message>' +
                '<form autocomplete="off" class="app-form app-login-form" method="post" wmtransclude></form>' +
            '</div>');

    }])
    .directive('wmLogin', ['PropertiesFactory', '$rootScope', '$templateCache', 'WidgetUtilService', 'CONSTANTS', '$controller', 'Utils', function (PropertiesFactory, $rootScope, $templateCache, WidgetUtilService, CONSTANTS, $controller, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.login', ['wm.base', 'wm.layouts.login', 'wm.base.events.successerror']);

        return {
            'restrict'  : 'E',
            'replace'   : true,
            'scope'     : {'onSuccess': '&', 'onError': '&'},
            'transclude': true,
            'template'  : $templateCache.get('template/widget/advanced/login.html'),
            'compile'   : function (tElement, tAttr) {

                /* in run mode there is separate controller for login widget but not in studio mode,
                 * to prevent errors in studio mode create and empty function
                 * with particular controller name */
                if (CONSTANTS.isStudioMode) {
                    window[tAttr.name + 'Controller'] = WM.noop;
                }

                return {
                    'pre': function (scope, $el, attrs) {
                        scope.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        if (CONSTANTS.isRunMode) {
                            var loginController;
                            /*
                             * Extend the properties from the login controller exposed to end user in page script
                             * Kept in try/catch as the controller may not be available sometimes
                             */
                            try {
                                loginController = scope.name + 'Controller';
                                $controller(loginController, {$scope: element.scope()});
                            } catch (ignore) {
                            }
                            /* submit button click-handler */
                            element.find('.app-login-button').unbind('click');

                            /* when on-submit not defined, then call the app-login service, else call custom service*/
                            element.find('.app-login-button').click(function (event) {
                                var loginDetails,
                                    successFn = attrs.onSuccess || '',
                                    errorFn   = attrs.onError || '',
                                    submitFn  = attrs.onSubmit || '',
                                    clickFn   = WM.element(this).isolateScope().onClick || WM.element(this).isolateScope().onTap || '',
                                    $userName = element.find('[name="usernametext"]'),
                                    $password = element.find('[name="passwordtext"]'),
                                    rememberMeElement,
                                    $rememberMe,
                                    onSuccess = function () {
                                        element.trigger('success');
                                        if (successFn.indexOf('(') !== -1) {
                                            scope.onSuccess({$event: event, $scope: scope});
                                        } else {
                                            $rootScope.$emit('invoke-service', successFn, {scope: element.scope()});
                                        }
                                    },
                                    onError = function (error) {
                                        scope.loginMessage = {
                                            type: 'error',
                                            caption: scope.errormessage || error || $rootScope.appLocale.LABEL_INVALID_USERNAME_OR_PASSWORD
                                        };
                                        element.trigger('error');
                                        if (errorFn.indexOf('(') !== -1) {
                                            scope.onError({$event: event, $scope: scope});
                                        } else {
                                            $rootScope.$emit('invoke-service', errorFn, {scope: element.scope()});
                                        }
                                    };
                                scope.loginMessage = null;

                                //For old projects
                                rememberMeElement = element.find('.app-checkbox [name="remembermeCheck"]');

                                //For new projects
                                if (!rememberMeElement.length) {
                                    rememberMeElement = element.find('.app-checkbox [name="remembermecheck"]');
                                }

                                if (rememberMeElement.length) {
                                    $rememberMe = rememberMeElement.scope().datavalue;
                                }

                                // prevent the actions when the userName/Pwd fields are not valid.
                                if ($userName.controller('ngModel').$invalid || $password.controller('ngModel').$invalid) {
                                    return;
                                }

                                /* when on-submit not defined, then call the app-login service, else call custom service*/
                                if (!submitFn && !clickFn) {
                                    loginDetails = {
                                        'username'   : $userName.val(),
                                        'password'   : $password.val(),
                                        'rememberme' : $rememberMe
                                    };
                                    element.scope().Variables.loginAction.login({loginInfo: loginDetails}, onSuccess, onError);
                                } else {
                                    if (clickFn) {
                                        clickFn({$event: event, $scope: scope});
                                    }
                                    //In case of login variable invoke
                                    if (Utils.isVariableOrActionEvent(submitFn)) {
                                        $rootScope.$emit('invoke-service', submitFn, {scope: element.scope()}, onSuccess, onError);
                                    } else if (submitFn.indexOf('(') !== -1) {
                                        scope.onSubmit({$event: event, $scope: scope});
                                    }
                                }
                            });
                        }

                        WidgetUtilService.postWidgetCreate(scope, element, attrs);
                    }
                };
            }
        };
    }]);

/**
 * @ngdoc directive
 * @name wm.widgets.advanced.directive:wmLogin
 * @restrict E
 *
 * @description
 * The `wmLogin` directive defines the loginForm widget.
 * It can be dragged and moved in the canvas.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $rootScope
 * @requires $templateCache
 * @requires WidgetUtilService

 * @param {string=}  name
 *                   Name of the login widget.
 * @param {string=} width
 *                  Width of the login widget.
 * @param {string=} height
 *                  Height of the login widget.
 * @param {boolean=} show
 *                   Show is a bindable property. <br>
 *                   This property will be used to show/hide the login widget on the web page. <br>
 *                   Default value: `true`. <br>
 * @param {string=}  errormessage
 *                   string containing the error-message.
 * @param {string=}  on-success
 *                   Callback function for `success` event.
 * @param {string=}  on-error
 *                   Callback function for `error` event.
 * @param {string=}  on-submit
 *                   Callback function for `submit` event.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div class="wm-app" ng-controller="Ctrl">
                <wm-panel>
                    <wm-login>
                        <wm-composite>
                            <wm-label caption="Username"></wm-label>
                            <wm-text placeholder="Enter username" class="app-login-username"></wm-text>
                        </wm-composite>
                        <wm-composite widget="text">
                            <wm-label caption="Password"></wm-label>
                            <wm-text type="password" placeholder="Enter password" class="app-login-password"></wm-text>
                        </wm-composite>
                        <wm-container>
                            <wm-container textalign="right">
                                <wm-button type="submit" caption="Sign in" class="app-login-button btn-primary"></wm-button>
                            </wm-container>
                            <wm-composite widget="checkbox">
                                <wm-checkbox class="app-login-rememberme col-md-7" scopedatavalue="user.rememberMe" caption="Remember Me"></wm-checkbox>
                                <wm-anchor caption="Forgot Password" class="app-login-forgotlink col-md-5"></wm-anchor>
                            </wm-composite>
                        </wm-container>
                    </wm-login>
                </wm-panel>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
        </file>
    </example>
 */