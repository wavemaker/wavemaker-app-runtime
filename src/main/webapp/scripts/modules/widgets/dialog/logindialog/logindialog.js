/*global WM, wmCoreModule, wmDialog, _*/
/*Directive for login dialog */

WM.module('wm.widgets.dialog')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/dialog/logindialog.html',
                '<div class="app-dialog modal-dialog app-login-dialog" ng-style="{width: width}" init-widget>' +
                    '<div class="modal-content">' +
                        '<wm-dialogheader iconclass="{{iconclass}}" caption="{{title}}"></wm-dialogheader>' +
                        '<div class="app-dialog-body modal-body" wmtransclude></div>' +
                    '</div>' +
                '</div>'
            );
        $templateCache.put('template/widget/dialog/logindialogcontainer.html', '<div wmtransclude></div>');

    }])
    .directive('wmLogindialog', [
        'PropertiesFactory',
        'WidgetUtilService',
        '$templateCache',
        '$compile',
        'CONSTANTS',
        'Utils',

        function (PropertiesFactory, WidgetUtilService, $templateCache, $compile, CONSTANTS, Utils) {
            'use strict';
            var transcludedContent = '',
                id,
                widgetProps = PropertiesFactory.getPropertiesOf('wm.logindialog', ['wm.basicdialog', 'wm.base', 'wm.base.events.successerror']);

            return {
                'restrict'  : 'E',
                'transclude': CONSTANTS.isStudioMode,
                'scope'     : {'dialogid': '@'},
                'template': function (template, attrs) {
                    transcludedContent = template.html();
                    // to have script tag with name as id in run mode and to have div in studio to be able to style the dialog
                    if (CONSTANTS.isRunMode) {
                        /* replacing wm-logindialog with wm-dialog-container in run mode to have a container for header, content and footer.
                         wm-dialog-container has a template similar to wm-dialog, replacing since wm-dialog returns script tag*/
                        var dialogEle = WM.element(template[0].outerHTML),
                            onsubmit  = dialogEle.attr('on-submit') || '',
                            onsuccess = dialogEle.attr('on-success') || '',
                            onerror   = dialogEle.attr('on-error') || '',
                            dialog    = template[0].outerHTML.replace('<wm-logindialog ', '<wm-dialog-container class="app-login-dialog" ');

                        dialog = dialog.replace('</wm-logindialog>', '</wm-dialog-container>');
                        dialog = '<wm-logindialog-container on-submit="' + onsubmit + '" on-success="' + onsuccess + '" on-error="' + onerror + '">' + dialog + '</wm-logindialog-container>';
                        transcludedContent = dialog;
                        id = attrs.name;
                        return '<script type="text/ng-template" id="' + id + '" login-dialog="true">' + transcludedContent + '</script>';
                    }
                    return $templateCache.get('template/widget/dialog/logindialog.html');
                },
                'replace': true,
                'link'   : {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function ($is, $el, attrs) {

                        if (CONSTANTS.isStudioMode) {
                            $el.append($compile(transcludedContent)($is));
                        }
                        $is = $is || $el.isolateScope();
                        $is.header  = $el.find('[data-identifier=dialog-header]').isolateScope()  || {};
                        $is.content = $el.find('[data-identifier=dialog-content]').isolateScope() || {};
                        // Update the title and iconclass for the old login dialogs based on the parent container property set
                        if (attrs.title && !$is.header.caption) {
                            $is.header.caption = attrs.title;
                        }
                        if (attrs.iconclass && !$is.header.iconclass) {
                            $is.header.iconclass = attrs.iconclass;
                        }

                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ])
    .directive('wmLogindialogContainer', [
        '$templateCache',
        'PropertiesFactory',
        'WidgetUtilService',
        'SecurityService',
        'Utils',
        'CONSTANTS',
        '$window',
        '$timeout',

        function ($templateCache, PropertiesFactory, WidgetUtilService, SecurityService, Utils, CONSTANTS, $window, $timeout) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.logindialog', ['wm.base']);

            return {
                'restrict'  : 'E',
                'transclude': true,
                'scope'     : {
                    'dialogid' : '@',
                    'onSubmit' : '&',
                    'onSuccess': '&',
                    'onError'  : '&'
                },
                'template' : $templateCache.get('template/widget/dialog/logindialogcontainer.html'),
                'replace'  : true,
                'link'     : {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function ($is, $el, attrs) {

                        var $s = $el.scope(),
                            submitFn,
                            loginBtn,
                            loginBtnClickFn,
                            lastLoggedinUser;

                        function onSuccess(event) {
                            $el.trigger('success');
                            $is.onSuccess({'$event': event, '$scope': $is});
                        }

                        function onError(event, error) {
                            $is.loginMessage = $is.$parent.loginMessage = {'type': 'error', 'caption': $is.errormessage || error};
                            $el.trigger('error');
                            $is.onError({'$event': event, '$scope': $is});
                        }

                        if (CONSTANTS.isRunMode) {
                            submitFn = attrs.onSubmit || '';

                            loginBtn = $el.find('[role*="loginbutton"]');
                            // for older projects(<=8.0.6), role won't be there and name="loginbutton" will be present for CommonLoginDialog in Common page
                            if (!loginBtn.length) {
                                loginBtn = $el.find('.app-button[name="loginbutton"]');
                            }
                            loginBtnClickFn  = loginBtn.length ? (loginBtn.isolateScope().onClick || '') : '';

                            // function to be called in case of login
                            $is.doLogin = function (event) {
                                var curUser  = $el.find('[name="usernametext"]').val(),
                                    password = $el.find('[name="passwordtext"]').val(),
                                    rememberMeElement,
                                    rememberMe,
                                    loginDetails;

                                $is.loginMessage = $is.$parent.loginMessage = null;

                                //For old projects
                                rememberMeElement = $el.find('.app-checkbox [name="remembermeCheck"]');

                                //For new projects
                                if (!rememberMeElement.length) {
                                    rememberMeElement = $el.find('.app-checkbox [name="remembermecheck"]');
                                }

                                if (rememberMeElement.length) {
                                    rememberMe = rememberMeElement.val();
                                }

                                // when on-submit not defined, then call the app-login service, else call custom service
                                if (!submitFn && !loginBtnClickFn) {
                                    lastLoggedinUser = SecurityService.getLastLoggedInUser();
                                    loginDetails = {
                                        'username'  : curUser,
                                        'password'  : password,
                                        'rememberme': rememberMe
                                    };
                                    $s.Variables.loginVariable.login(
                                        {'loginInfo': loginDetails, 'mode': 'dialog'},
                                        function () {
                                            if (lastLoggedinUser && curUser !== lastLoggedinUser) {
                                                $window.location = $window.location.pathname;
                                            }
                                            Utils.triggerFn(onSuccess, event);
                                        },
                                        onError.bind(undefined, event)
                                    );
                                } else {
                                    if (loginBtnClickFn) {
                                        loginBtnClickFn({'$event': event, '$scope': $is});
                                    }
                                    //In case of login variable invoke
                                    if (_.startsWith(submitFn, 'Variables.')) {
                                        $is.$root.$emit('invoke-service', submitFn, {'scope': $s, 'mode': 'dialog'}, onSuccess.bind(undefined, event), onError.bind(undefined, event));
                                    } else if (submitFn.indexOf('(') !== -1) {
                                        $is.onSubmit({'$event': event, '$scope': $is});
                                    }
                                }
                            };

                            // to remove the on-click event handler
                            loginBtn.unbind('click');
                            // bind sign-in functionality to the sign-in button
                            loginBtn.click($is.doLogin.bind(undefined));
                            // bind sign-in functionality to the sign-in button
                            $el.find('.app-textbox').keypress(function (evt) {
                                evt.stopPropagation();
                                //Trigger the action to "doLogin" if the "enter" key has been pressed.
                                if (Utils.getActionFromKey(evt) === 'ENTER') {

                                    /**
                                     * As this function is getting executed outside of angular context,
                                     * trigger a digest cycle and then trigger doLogin method, So that the bindings in the loginVariable will be evaluated property
                                     */
                                    $timeout(function () {
                                        $is.doLogin(evt);
                                    });
                                }
                            });
                        }

                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ]);

/**
 * @ngdoc directive
 * @name wm.widgets.dialog.directive:wmLogindialog
 * @restrict E
 *
 * @description
 * The `wmLogindialog` directive defines login dialog widget. <br>
 * An login dialog is created in an independent view.
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires WidgetUtilService
 * @requires $templateCache
 * @requires CONSTANTS
 *
 * @param {string=} name
 *                  Name of the dialog.
 * @param {string=} title
 *                  title of the dialog.
 * @param {string=} width
 *                  Width of the dialog.
 * @param {boolean=} show
 *                  show is a bindable property. <br>
 *                  This property will be used to show/hide the dialog on the web page. <br>
 *                  Default value: `true`.
 * @param {string=} iconclass
 *                  Icon class for the icon in dialog header
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl">
                <wm-view class="dialog-view">
                    <wm-logindialog modal="false" iconclass="wi wi-sign-in" title="Login" name="loginDialog" on-error="logindialog1Error($event, $scope)" on-success="logindialog1Success($event, $scope)">
                        <wm-form>
                            <wm-message type="error" caption="{{errMsg}}" show="{{showErrMsg}}" class="app-logindialog-message" hide-close="true"></wm-message>
                            <wm-composite>
                                <wm-label caption="Username" class="col-md-4"></wm-label>
                                <wm-text placeholder="Enter username" class="app-logindialog-username"></wm-text>
                            </wm-composite>
                            <wm-composite widget="text">
                                <wm-label caption="Password" class="col-md-4"></wm-label>
                                <wm-text type="password" placeholder="Enter password" class="app-logindialog-password"></wm-text>
                            </wm-composite>
                        </wm-form>
                        <wm-dialogactions>
                            <wm-button class="btn-primary" caption="Sign in"></wm-button>
                        </wm-dialogactions>
                    </wm-logindialog>
                </wm-view>
                <wm-button on-click="Widgets.loginDialog.open()" caption="Show Dialog" class="btn-primary"></wm-button>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {}
            function loginDialogController() {}
        </file>
    </example>
 */
