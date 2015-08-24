/*global WM, window*/
/*jslint sub: true*/
/*Directive for login-from */

WM.module("wm.widgets.advanced")
    .run(['$templateCache', function ($templateCache) {
        "use strict";
        $templateCache.put("template/widget/advanced/login.html",
            '<div init-widget class="app-login" data-ng-show="show" apply-styles="container">' +
                '<wm-message scopedataset="loginMessage" class="app-login-message"></wm-message>' +
                '<form autocomplete="off" class="app-form app-login-form" method="post" wmtransclude>' +
                '</form>' +
            '</div>');

    }]).directive('wmLogin', ['PropertiesFactory', '$rootScope', '$templateCache', 'WidgetUtilService', 'CONSTANTS', '$controller', function (PropertiesFactory, $rootScope, $templateCache, WidgetUtilService, CONSTANTS, $controller) {
        "use strict";
        var widgetProps = PropertiesFactory.getPropertiesOf("wm.login", ["wm.base", "wm.base.editors", "wm.base.events.successerror"]);

        return {
            'restrict': 'E',
            'replace': true,
            'scope': {
                'onSuccess': '&',
                'onError': '&'
            },
            transclude: true,
            'template': $templateCache.get("template/widget/advanced/login.html"),
            'compile': function (tElement, tAttr) {

                /* in run mode there is separate controller for login widget but not in studio mode,
                 * to prevent errors in studio mode create and empty function
                 * with particular controller name */
                if (CONSTANTS.isStudioMode) {
                    window[tAttr.name + "Controller"] = WM.noop;
                }

                return {
                    'pre': function (scope) {
                        scope.widgetProps = widgetProps;
                    },
                    'post': function (scope, element, attrs) {
                        if (CONSTANTS.isRunMode) {
                            var loginController;
                            /*
                             * Extend the properties from the login controller exposed to end user in page script
                             * Kept in try/catch as the controller may not be available sometimes
                             */
                            try {
                                loginController = scope.name + "Controller";
                                $controller(loginController, {$scope: element.scope()});
                            } catch (ignore) {
                            }
                            /* submit button click-handler */
                            element.find('.app-login-button').unbind('click');

                            /* when on-submit not defined, then call the app-login service, else call custom service*/
                            element.find('.app-login-button').click(function (event) {
                                var loginDetails,
                                    successFn = attrs.onSuccess || '',
                                    errorFn = attrs.onError || '',
                                    submitFn = attrs.onSubmit || '',
                                    clickFn = WM.element(this).isolateScope().onClick || '',
                                    onSuccess = function () {
                                        element.trigger("success");
                                        if (successFn.indexOf('(') !== -1) {
                                            scope.onSuccess({$event: event, $scope: scope});
                                        } else {
                                            $rootScope.$emit('invoke-service', successFn, {scope: element.scope()});
                                        }
                                    },
                                    onError = function (error) {
                                        scope.loginMessage = {
                                            type: 'error',
                                            caption: scope.errormessage || error || $rootScope.appLocale['LABEL_INVALID_USERNAME_OR_PASSWORD']
                                        };
                                        element.trigger("error");
                                        if (errorFn.indexOf('(') !== -1) {
                                            scope.onError({$event: event, $scope: scope});
                                        } else {
                                            $rootScope.$emit('invoke-service', errorFn, {scope: element.scope()});
                                        }
                                    };
                                scope.loginMessage = null;
                                /* when on-submit not defined, then call the app-login service, else call custom service*/
                                if (!submitFn && !clickFn) {
                                    loginDetails = {
                                        username: element.find('[name="usernametext"]').val(),
                                        password: element.find('[name="passwordtext"]').val()
                                    };
                                    element.scope().Variables.loginVariable.login({loginInfo: loginDetails}, onSuccess, onError);
                                } else {
                                    if (clickFn) {
                                        clickFn({$event: event, $scope: scope});
                                    }
                                    if (submitFn.indexOf('(') !== -1) {
                                        scope.onSubmit({$event: event, $scope: scope});
                                    } else {
                                        $rootScope.$emit('invoke-service', submitFn, {scope: element.scope()}, onSuccess, onError);
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
 *   <example module="wmCore">
 *       <file name="index.html">
 *           <div class="wm-app">
 *               <wm-panel width='300px'>
 *                   <wm-login name="login1" data-ng-controller="Ctrl">
 *                      <wm-composite name="composite1">
 *                           <wm-label caption="Username" name="label5"></wm-label>
 *                           <wm-text placeholder="Enter username" name="usernametext" class="app-login-username"></wm-text>
 *                      </wm-composite>
 *                      <wm-composite widget="text" name="composite2">
 *                          <wm-label caption="Password" name="label6"></wm-label>
 *                          <wm-text type="password" name="passwordtext" placeholder="Enter password" class="app-login-password"></wm-text>
 *                      </wm-composite>
 *                      <wm-button type="submit" caption="Sign in" width="100%" class="app-login-button btn-primary" name="button9" on-click='loginVariable'></wm-button>
 *                      <wm-composite widget="checkbox" name="composite3">
 *                          <wm-checkbox name="checkbox1" class="app-login-rememberme" scopedatavalue="user.rememberMe"></wm-checkbox>
 *                          <wm-label caption="Remember Me" class="app-login-remembermetext" name="label7"></wm-label>
 *                          <wm-anchor caption="Forgot Password" class="app-login-forgotlink" name="anchor4"></wm-anchor>
 *                      </wm-composite>
 *                  </wm-login>
 *              </wm-panel>
 *           </div>
 *       </file>
 *       <file name="script.js">
 *          function Ctrl($scope) {
 *
 *              $scope.f = function (eventtype) {
 *
 *              }
 *           }
 *       </file>
 *   </example>
 */