/*global wm, WM, _, cordova*/
/*jslint sub: true */
/**
 * Directive for image caching on device. This for mobile apps only.
 */
wm.modules.wmCommon.directive('wmImageCache', [
    'CONSTANTS',
    'DeviceFileCacheService',
    '$rootScope',
    function (CONSTANTS, DeviceFileCacheService, $rs) {
        'use strict';
        var STORAGE_TYPE = {
            TEMPORARY : 'temporary',
            PERMANANT : 'permanant'
        };
        /**
         * Observes a attribute changes. Observe will be destroyed when scope destroy.
         *
         * @param scope
         * @param attrs
         * @param attrName
         * @param callBack
         */
        function observe(scope, attrs, attrName, callBack) {
            var stopObserving = attrs.$observe(attrName, callBack);
            scope.$on('$destroy', function () {
                stopObserving();
            });
        }

        /**
         * Replaces the src attribute of IMG element with local cache path
         *
         * @param val
         * @param element
         * @param isPersistent
         */
        function replaceWithLocal(val, $el, isPersistent) {
            if (!_.includes(val, '{{') && _.startsWith(val, 'http') && $el[0].tagName === 'IMG') {
                //show some default image until cache file is being found or downloaded,
                $rs.$evalAsync(function () {
                    $el.attr('src', 'resources/images/imagelists/default-image.png');
                });
                DeviceFileCacheService.getLocalPath(val, true, isPersistent).then(function (localPath) {
                    $el.attr('src', localPath);
                }, function () {
                    $el.attr('src', val);
                });
            }
        }

        return {
            'restrict': 'A',
            'link': function ($s, $el, $attrs) {
                var observing = false;
                if (CONSTANTS.hasCordova) {
                    observe($s, $attrs, 'wmImageCache', function () {
                        if ($attrs.wmImageCache === STORAGE_TYPE.TEMPORARY || $attrs.wmImageCache === STORAGE_TYPE.PERMANANT) {
                            var isPersistent = $attrs.wmImageCache === STORAGE_TYPE.PERMANANT;
                            if (!observing) {
                                observe($s, $attrs, 'ngSrc', function (val) {
                                    replaceWithLocal(val, $el, isPersistent);
                                });
                                replaceWithLocal($attrs.ngSrc, $el, isPersistent);
                                observing = true;
                            }
                        }
                    });
                }
            }
        };
    }]);