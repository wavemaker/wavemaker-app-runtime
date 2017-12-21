/*global _, wm, WM, document, navigator, IScroll */

/**
 * @ngdoc directive
 * @name wm.widgets.directive:wmSmoothscroll
 * @restrict A
 * @element ANY
 * @requires Utils
 * @requires CONSTANTS
 * @requires $rootScope
 * @description
 * This directive is used for the applying smooth scroll on scrollable containers.
 * By setting smoothscroll="true" on the element, smooth scroll will be applied on the element.
 * By default page-content, accordion pane, tab pane, segment content, app-left-panel has the smoothscroll set to true.
 * This works only on device.
 */
wm.modules.wmCommon.directive('wmSmoothscroll', ['Utils', 'CONSTANTS', '$rootScope', function (Utils, CONSTANTS, $rs) {
    'use strict';

    // Creates iScroll instance.
    function createSmoothScroll($s, $el) {
        var options,
            iScroll,
            removeWatcher;

        $el.wrapInner(document.createElement('div'));

        options = {
            'scrollbars': true,
            'preventDefault': false,
            'bounce': Utils.isIOS(),
            'fadeScrollbars': true
        };

        iScroll = new IScroll($el[0], options);
        $el[0].iscroll = iScroll;

        removeWatcher = $rs.$watch(_.debounce(function () {
            iScroll.refresh();
        }, 100));

        $s.$on('$destroy', function() {
            iScroll.destroy();
        });

        return {
            iScroll: iScroll,
            destroy: function () {
                iScroll.destroy();
                delete $el[0].iscroll;
                removeWatcher();
            }
        };
    }

    return {
        'restrict': 'A',
        'link': function ($s, $el, attrs) {
            if (CONSTANTS.hasCordova) {
                var smoothScroll;
                // observe the smoothscroll attr
                attrs.$observe('wmSmoothscroll', function (nv) {
                    if (nv === 'true') {
                        smoothScroll = createSmoothScroll($s, $el);
                    } else if (smoothScroll) {
                        smoothScroll.destroy();
                    }
                });
            }
        }
    };
}]);