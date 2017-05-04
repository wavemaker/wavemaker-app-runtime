/*global WM, window, _, cordova, document, navigator */

WM.module('wm.mobile', ['wm.variables', 'wm.layouts', 'wm.widgets', 'ngCordova', 'ngCordovaOauth', 'wm.plugins.offline'])
    //Initialize project
    .run(['$rootScope', '$location', 'CONSTANTS', '$cordovaFileTransfer', '$cordovaFileOpener2', 'Utils', '$cordovaFile', 'wmToaster', 'wmSpinner',
        // Don't remove below services. This is required for initialization
        'AppAutoUpdateService', 'DeviceFileService', 'DeviceFileCacheService',
        function ($rootScope, $location, CONSTANTS, $cordovaFileTransfer, $cordovaFileOpener2, Utils, $cordovaFile, wmToaster, wmSpinner) {
            'use strict';

            var initialScreenSize,
                $appEl,
                pageReadyDeregister;

            /* Mark the mobileApplication type to true */
            $rootScope.isMobileApplicationType = true;

            function hideSpinner(id) {
                wmSpinner.hide(id);
            }

            if ($location.protocol() === 'file') {
                CONSTANTS.hasCordova = true;
                $appEl =  WM.element('.wm-app:first');
                initialScreenSize = window.innerHeight;

                $appEl.addClass('cordova');

                // keyboard class is added when keyboard is open.
                window.addEventListener('resize', function () {
                    if (window.innerHeight < initialScreenSize) {
                        $appEl.addClass('keyboard');
                    } else {
                        $appEl.removeClass('keyboard');
                    }
                });

                // This function downloads the file in device and open the file using fileOpener.
                $rootScope.$on('device-file-download', function ($evt, config, fileName) {
                    var fileDirectory,
                        filepath,
                        url = config.url,
                        spinnerId = wmSpinner.show();

                    if (Utils.isIOS()) {
                        fileDirectory = cordova.file.dataDirectory;
                    } else {
                        fileDirectory = cordova.file.externalDataDirectory;
                    }

                    filepath = fileDirectory + fileName;

                    $cordovaFileTransfer.download(url, filepath, {}, true)
                        .then(function (fileEntry) {
                            // find the mime type of the file and open the file.
                            $cordovaFile.checkFile(filepath, '').then(function (entry) {
                                entry.file(function (data) {
                                    $cordovaFileOpener2.open(fileEntry.toURL(), data.type)
                                        .then(hideSpinner.bind(undefined, spinnerId))
                                        .catch(function () {
                                            hideSpinner(spinnerId);
                                            wmToaster.show('error',  'Failed to open the file.');
                                        });
                                });
                            });
                        }, function (error) {
                            hideSpinner(spinnerId);
                            wmToaster.show('error',  'Failed to download ', error);
                        });
                }, false);

                pageReadyDeregister = $rootScope.$on('page-ready', function () {
                    navigator.splashscreen.hide();
                    pageReadyDeregister();
                });
            }
        }])
    //Initialize variables
    .run(['Variables', 'WIDGET_CONSTANTS', 'BaseVariablePropertyFactory', 'DeviceVariableService', 'NavigationVariableService',
        function (Variables, WIDGET_CONSTANTS, BaseVariablePropertyFactory, DeviceVariableService) {
            'use strict';

            /* Register Mobile specific Variables*/
            Variables.addVariableConfig({
                'collectionType': 'data',
                'category': 'wm.DeviceVariable',
                'defaultName': 'deviceVariable',
                'newVariableKey': 'New DeviceVariable'
            });
            /* Add additional event options.*/
            WIDGET_CONSTANTS.EVENTS_OPTIONS.push('New DeviceVariable');
            /* Add segment navigation option */
            BaseVariablePropertyFactory.addNavigationOption('gotoSegment', 'gotoSegment');
            //Register the Mobile variable.
            BaseVariablePropertyFactory.register('wm.DeviceVariable',
                {'invoke': DeviceVariableService.invoke},
                ['wm.DeviceVariable'],
                {});
            /* enable page transitions.*/
            BaseVariablePropertyFactory.getPropertyMap('wm.NavigationVariable').pageTransitions.hide = false;
        }])
    //Apply platform OS specific stylesheets
    .run(['$rootScope', 'CONSTANTS', 'Utils', function ($rootScope, CONSTANTS, Utils) {
        'use strict';
        var selectedOs = '';

        function applyOSTheme(os) {
            var themeUrl = '',
                oldStyleSheet = WM.element('link[theme="wmtheme"]:first'),
                newStyleSheet;
            selectedOs = os || selectedOs;
            themeUrl = 'themes/' + $rootScope.project.activeTheme + '/' + selectedOs.toLowerCase() + '/' + 'style.css';
            if (CONSTANTS.isStudioMode) {
                themeUrl = Utils.getProjectResourcePath($rootScope.project.id) + themeUrl;
            }
            newStyleSheet = Utils.loadStyleSheet(themeUrl, {name: 'theme', value: 'wmtheme'});
            if (newStyleSheet) {
                WM.element(newStyleSheet).insertAfter(oldStyleSheet);
                oldStyleSheet.remove();
            }
        }
        if (CONSTANTS.isStudioMode) {
            $rootScope.$on('switch-device', function (event, device) {
                applyOSTheme(device.os);
            });
        } else if (CONSTANTS.isRunMode) {
            //This is for preview page
            window.onmessage = function (msg) {
                var data = Utils.isIE9() ? JSON.parse(msg.data) : msg.data;
                $rootScope.selectedViewPort = data.device;
                if (WM.isObject(data) && data.key === 'switch-device') {
                    applyOSTheme(data.device.os);
                }
            };
            //On Application start
            $rootScope.$on('application-ready', function () {
                var msgContent = {key: 'on-load'};
                //Notify preview window that application is ready. Otherwise, identify the OS.
                if (window.top !== window) {
                    window.top.postMessage(Utils.isIE9() ? JSON.stringify(msgContent) : msgContent, '*');
                } else if (Utils.isAndroid() || Utils.isAndroidTablet()) {
                    applyOSTheme('android');
                } else if (Utils.isIphone() || Utils.isIpod() || Utils.isIpad()) {
                    applyOSTheme('ios');
                }
            });
        }
    }]);