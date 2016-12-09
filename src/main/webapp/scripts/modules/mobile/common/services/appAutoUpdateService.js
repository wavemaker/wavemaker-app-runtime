/*global wm, WM, cordova*/
/*jslint sub: true */
WM.module('wm.widgets.advanced')
    .run(['$templateCache', function ($templateCache) {
        'use strict';

        $templateCache.put('template/widget/advanced/appUpdate.html',
            '<div class="modal fade in" ng-style="{display : show ? \'block\' : \'none\'}">' +
                '<div class="modal-dialog">' +
                    '<div class="modal-content">' +
                        '<div class="modal-body">' +
                            '<span>{{message}}</span>' +
                            '<div class="progress" ng-show="downloading">' +
                                '<div class="progress-bar" ng-style="{ \'width\' : downloadProgress + \'%\'}"></div>' +
                            '</div>' +
                        '</div>' +
                        '<div class="modal-footer">' +
                            '<button type="button" class="btn btn-default" data-dismiss="modal" ng-click="cancel()">Skip update</button>' +
                            '<button type="button" class="btn btn-primary" ng-hide="downloading" ng-click="updateApp()">Update</button>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>');
    }]);

wm.modules.wmCommon.services.AppAutoUpdateService = [
    '$compile',
    '$cordovaFile',
    '$cordovaFileOpener2',
    '$cordovaFileTransfer',
    '$http',
    '$q',
    '$rootScope',
    '$templateCache',
    function ($compile, $cordovaFile, $cordovaFileOpener2, $cordovaFileTransfer, $http, $q, $rootScope, $templateCache) {
        'use strict';
        var config, ele, scope, fileName = 'app-auto-update.apk';

        function cleanAutoUpdateFile() {
            $cordovaFile.removeFile(cordova.file.externalApplicationStorageDirectory, fileName);
        }

        function installLatestVersion() {
            var downloadLink = config.host + '/appBuild/rest/mobileBuilds/android/download?',
                apkFile =  cordova.file.externalApplicationStorageDirectory + fileName;

            downloadLink += 'token=' + config.token
                            + '&buildNumber=' + config.latestBuildNumber
                            + '&fileName=' + fileName;
            $cordovaFileTransfer.download(downloadLink, apkFile, {}, true)
                .then(function () {
                    $cordovaFileOpener2.open(apkFile, 'application/vnd.android.package-archive');
                }, function () {
                    scope.message = 'Failed to download latest version.';
                }, function (progress) {
                    scope.downloadProgress = (progress.loaded / progress.total) * 100;
                });
            scope.message = 'Downloading the latest version ['+ config.latestVersion +'].';
            scope.downloading = true;
        }

        function getUserConfirmationAndInstall() {
            scope = $rootScope.$new();
            scope.downloadProgress = 0;
            scope.updateApp = installLatestVersion;
            scope.show = true;
            scope.downloading = false;
            scope.message = 'There is an update available. Would you like to update the app?';
            scope.cancel = function () {
                ele.remove();
                scope.$destroy();
            };
            ele = $compile($templateCache.get('template/widget/advanced/appUpdate.html'))(scope);
            WM.element('body:first').append(ele);
            $templateCache.remove('template/widget/advanced/appUpdate.html');
        }

        function checkForUpdate() {
            var deferred = $q.defer();
            $http.get(config.host + '/appBuild/rest/mobileBuilds/latest_build?token=' + config.token)
                .then(function (response) {
                    var latestBuildNumber = response.data.success.body.buildNumber,
                        latestVersion =  response.data.success.body.version;
                    if (config.buildNumber < latestBuildNumber) {
                        config.latestBuildNumber = latestBuildNumber;
                        config.latestVersion = latestVersion;
                        deferred.resolve(latestBuildNumber);
                    } else {
                        deferred.reject();
                    }
                });
            return deferred.promise;
        }

        this.start = function () {
            $cordovaFile.readAsText(cordova.file.applicationDirectory + 'www', 'build_meta.json')
                .then(function (data) {
                    config = JSON.parse(data)
                    if (config.buildMode === 'DEVELOPMENT_MODE') {
                        cleanAutoUpdateFile();
                        checkForUpdate().then(getUserConfirmationAndInstall.bind(undefined));
                    }
                });
        };
    }];