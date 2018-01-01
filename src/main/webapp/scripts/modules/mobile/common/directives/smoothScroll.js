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
wm.modules.wmCommon.directive('wmSmoothscroll', ['Utils', 'CONSTANTS', '$rootScope', function (Utils, CONSTANTS, $rs) {
    'use strict';

    // Creates iScroll instance.
    function createSmoothScroll($s, $el) {
        var options,
            iScroll,
            removeWatcher;

        options = {
            'scrollbars': true,
            'preventDefault': false,
            'bounce': Utils.isIOS(),
            'fadeScrollbars': true
        };

        if (!$el[0].children.length) {
            return {};
        }
        iScroll = new IScroll($el[0], options);
        $el[0].iscroll = iScroll;

        removeWatcher = $rs.$watch(_.debounce(function () {
            iScroll.refresh();
        }, 100));

        $s.$on('$destroy', function () {
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
            if (Utils.isMobile()) {
                var smoothScroll;
                // observe the smoothscroll attr
                attrs.$observe('wmSmoothscroll', function (nv) {
                    if (nv === 'true') {
                        smoothScroll = createSmoothScroll($s, $el);

                        // listen to scrollStart event.
                        if (smoothScroll.iScroll) {
                            smoothScroll.iScroll.on('scrollStart', function () {
                                if (_.includes(this.wrapper.children[0].classList, 'smoothscroll-container')) {
                                    // stop listening to scroll event.
                                    smoothScroll.iScroll.off('scrollStart');
                                } else if (this.wrapper.scrollHeight > this.wrapper.clientHeight) {
                                    // Adds the smoothscroll container div wrapper only when element has scrollable content.
                                    var children = this.wrapper.children,
                                        $scrollerEl = children[0],
                                        $scrollerStyle = $scrollerEl.style,
                                        style = 'transition-timing-function: ' + $scrollerStyle.transitionTimingFunction +  ';transition-duration: ' + $scrollerStyle.transitionDuration + ';transform: ' + $scrollerStyle.transform;

                                    $scrollerEl.removeAttribute('style');

                                    // if element is scrollable then destroy the iscroll on element.
                                    // and re-create smoothscroll after adding the div
                                    smoothScroll.destroy();

                                    WM.element(this.wrapper.children).wrapAll('<div class="smoothscroll-container" style="' + style + '"></div>');
                                    // stop listening to scroll event.
                                    smoothScroll.iScroll.off('scrollStart');
                                    createSmoothScroll($s, $el);
                                }
                            });
                        }
                    } else if (smoothScroll) {
                        smoothScroll.destroy();
                    }
                });
            }
        }
    };
}]);