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
 * This works on device, mobile browsers.
 */
wm.modules.wmCommon.directive('wmSmoothscroll', ['Utils', '$rootScope', function (Utils, $rs) {
    'use strict';

    // Creates iScroll instance.
    function createSmoothScroll($s, $el, $events) {
        var options,
            iScroll,
            removeWatcher;

        // Set the fadeScrollbars to true only when content is scrollable inside the smoothscroll-container
        options = {
            'scrollbars' : true,
            'preventDefault': false,
            'bounce': Utils.isIOS(),
            'fadeScrollbars': false,
            'disablePointer': true, // disable the pointer events as it causes lag in scrolling (jerky).
            'disableTouch': false, // false to be usable with touch devices
            'disableMouse': false // false to be usable with a mouse (desktop)
        };

        // Add fadeScrollbars options only when smoothscroll container is included, which means content is scrollable.
        if ($events) {
            options.fadeScrollbars = true;
        }

        if (!$el[0].children.length) {
            return {};
        }
        iScroll = new IScroll($el[0], options);

        if ($events) {
            // map all events on previous iscroll to the newly created iscroll.
            _.map($events, function (val, key) {
                iScroll._events[key] = val;
            });
            iScroll.refresh();
        }

        // refresh the indicators.
        iScroll.indicatorRefresh = function () {
            var indicators = $el[0].iscroll.indicators,
                i;
            if (indicators.length) {
                for (i = 0; i < indicators.length; i++) {
                    indicators[i].refresh();
                }
            }
        };

        $el[0].iscroll = iScroll;

        /* This function gets called for every digest cycle.
         * When element has scroll (i.e. scrollHeight > clientHeight), a div with smoothscroll-container class will be added.
         * new iScroll will be initialised on the element after the div addition, by removing the existing iscroll on the element.
         * This div will have no height, so the elements inside this div will inherit this height, i.e. no height,
         * Scenario: tabs with 100% height, as it covers the pageContent with no scroll, this div will not be added.
         * TODO: Scenario: tabs with 100% height and add others widgets after/before, as it has scroll, this div will be added.
         *          But tabs having 100% height will not be honoured as div is having no height.
         */
        removeWatcher = $rs.$watch(_.debounce(function () {
            if (iScroll !== null) {
                iScroll.refresh();
                // Check for scrollable content and if smoothscroll-container div is already added.
                if (iScroll.wrapper && !_.includes(iScroll.wrapper.children[0].classList, 'smoothscroll-container') && iScroll.wrapper.scrollHeight > iScroll.wrapper.clientHeight) {
                    var cloneEvents = iScroll._events;

                    // Adds the smoothscroll container div wrapper only when element has scrollable content.
                    WM.element(iScroll.wrapper.children).wrapAll('<div class="smoothscroll-container"></div>');

                    // destroy the existing iscroll on the element
                    iScroll.destroy();
                    // Removing if any styles are added on scroller element.
                    WM.element(iScroll.scroller).css({
                        'transition-timing-function': '',
                        'transition-duration': '',
                        'transform': ''
                    });

                    iScroll = null;
                    delete $el[0].iscroll;
                    removeWatcher();

                    // create new iscroll instance on the element
                    createSmoothScroll($s, $el, cloneEvents);
                }
            }
        }, 100));

        $s.$on('$destroy', function () {
            if (iScroll !== null) {
                iScroll.destroy();
            }
        });

        return {
            iScroll: iScroll,
            destroy: function () {
                iScroll.destroy();
                WM.element(iScroll.scroller).css({
                    'transition-timing-function': '',
                    'transition-duration': '',
                    'transform': ''
                });

                iScroll = null;
                delete $el[0].iscroll;
                removeWatcher();
            }
        };
    }

    return {
        'restrict': 'A',
        'link': function ($s, $el, attrs) {
            if (Utils.isMobile() && !Utils.isKitkatDevice()) {
                var smoothScroll;
                // observe the smoothscroll attr
                attrs.$observe('wmSmoothscroll', function (nv) {
                    if (nv === 'true') {
                        $el.addClass('smoothscroll-wrapper');
                        smoothScroll = createSmoothScroll($s, $el);
                    } else if (smoothScroll) {
                        smoothScroll.destroy();
                    }
                });
            }
        }
    };
}]);