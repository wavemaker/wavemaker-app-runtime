/*global WM,_, $, window */
/*jslint todo: true */
/*Directive for carousel */
WM.module('wm.widgets.advanced')
    .run(['$templateCache', function ($tc) {
        'use strict';
        $tc.put('template/widget/advanced/carousel/static/carousel.html',
                '<div init-widget class="app-carousel carousel slide" ng-class="navigationClass" apply-styles wm-gestures="{{gestures}}">' +
                    '<ol class="carousel-indicators">' +
                        '<li ng-repeat="content in contents" ng-class="{\'active\': activeIndex === $index}" ng-click="goTo($index)"></li>' +
                    '</ol>' +
                    '<div class="carousel-inner" wmtransclude></div>' +
                    '<a class="left carousel-control" ng-click="prev()">' +
                        '<i class="wi wi-chevron-left"></i>' +
                    '</a>' +
                    '<a class="right carousel-control" ng-click="next()">' +
                        '<i class="wi wi-chevron-right"></i>' +
                    '</a>' +
                '</div>'
            );
        $tc.put('template/widget/advanced/carousel/design/dynamic/carousel.html',
            '<div apply-styles init-widget class="app-carousel carousel slide" wmtransclude wm-gestures="{{gestures}}"></div>'
            );

        $tc.put('template/widget/advanced/carousel/design/static/carousel.html',
                 '<div init-widget class="app-carousel carousel slide" apply-styles wm-gestures="{{gestures}}">' +
                     '<div class="carousel-inner" wmtransclude></div>' +
                     '<div class="carousel-actions">' +
                        '<ul class="pagination" >' +
                            '<li ng-repeat="content in contents" ng-class="{\'active\': activeIndex === $index}"">' +
                                '<a href="javascript:void(0);" ng-click="goTo($index)">{{$index + 1}}</a>' +
                            '</li>' +
                        '</ul>' +
                     '</div>' +
                 '</div>'
            );

        $tc.put('template/widget/advanced/carousel/dynamic/carousel.html',
            '<div class="app-carousel" ng-class="navigationClass" init-widget wmtransclude apply-styles data-identifier="carousel">' +
                '<div class="text-center" ng-if="noDataFound">{{nodatamessage}}</div>' +
            '</div>'
            );

        $tc.put('template/widget/advanced/carousel/carousel-content.html',
            '<div class="app-carousel-item item" apply-styles init-widget wmtransclude></div>'
            );

    }])
    .directive('wmCarousel', [
        '$interval',
        'PropertiesFactory',
        '$templateCache',
        'CONSTANTS',
        '$timeout',
        'WidgetUtilService',
        '$compile',
        'Utils',

        function ($interval, PropertiesFactory, $templateCache, CONSTANTS, $timeout, WidgetUtilService, $compile, Utils) {
            'use strict';

            var widgetProps,
                directiveDefn,
                notifyFor,
                slideTemplateWrapper,
                CAROUSEL_TYPE = {'STATIC': 'static', 'DYNAMIC': 'dynamic'};

            widgetProps = PropertiesFactory.getPropertiesOf('wm.carousel', ['wm.base']);
            notifyFor = CONSTANTS.isStudioMode ? {
                'dataset': true,
                'type': true,
                'animation': true
            } : {
                'dataset': true,
                'controls': true,
                'animation': true
            };

            slideTemplateWrapper =
                '<div uib-carousel interval="interval" active="active" ng-show="!noDataFound" no-wrap="noWrapSlides">' +
                    '<div uib-slide ng-repeat="item in fieldDefs track by $index"  index="$index"></div>' +
                '</div>';

            function updateFieldDefs($is, data) {
                $is.fieldDefs = data;
                $is.noDataFound = !$is.fieldDefs.length;
            }

            function getVariable($is, variableName) {

                if (!variableName) {
                    return undefined;
                }

                var variables = $is.Variables || {};
                return variables[variableName];
            }

            function onDataChange($is, nv) {
                if (nv) {
                    $is.noDataFound = false;
                    if (nv.data) {
                        nv = nv.data;
                    } else {
                        if (!_.includes($is.binddataset, 'bind:Widgets.')) {
                            var boundVariableName = Utils.getVariableName($is),
                                variable = getVariable($is, boundVariableName);
                            // data from the live list must have .data filed
                            if (variable && variable.category === 'wm.LiveVariable') {
                                return;
                            }
                        }
                    }

                    //If the data is a pageable object, then display the content.
                    if (WM.isObject(nv) && Utils.isPageable(nv)) {
                        nv = nv.content;
                    }

                    if (WM.isObject(nv) && !WM.isArray(nv)) {
                        nv = [nv];
                    }
                    if (!$is.binddataset) {
                        if (WM.isString(nv)) {
                            nv = nv.split(',');
                        }
                    }
                    if (WM.isArray(nv)) {
                        updateFieldDefs($is, nv);
                    }
                } else {
                    if (CONSTANTS.isRunMode) {
                        updateFieldDefs($is, []);
                    }
                }
            }


            function propertyChangeHandler($is, attrs, key, newVal) {
                var widgetProperties = $is.widgetProps;

                switch (key) {
                case 'dataset':
                    if (attrs.type === CAROUSEL_TYPE.DYNAMIC) {
                        onDataChange($is, newVal);
                    }
                    break;
                case 'type':
                    widgetProperties.addchild.show = newVal !== CAROUSEL_TYPE.DYNAMIC;
                    widgetProperties.nodatamessage.show = widgetProperties.dataset.show  = newVal === CAROUSEL_TYPE.DYNAMIC;
                    break;
                case 'animation':
                    if (CONSTANTS.isStudioMode) {
                        widgetProperties.animationinterval.show = (newVal === 'auto');
                    } else {
                        $is.interval = newVal === 'auto' ? $is.animationinterval * 1000 : 0;
                        if (!attrs.type) {
                            $is.play();
                        }
                    }

                    break;
                case 'controls':
                    switch (newVal) {
                    case 'indicators':
                        $is.navigationClass = 'hide-navs';
                        break;
                    case 'navs':
                        $is.navigationClass = 'hide-indicators';
                        break;
                    case 'none':
                        $is.navigationClass = 'hide-both';
                        break;
                    }
                    break;
                }
            }

            function applyWrapper($tmplContent) {
                var $tmpl = WM.element(slideTemplateWrapper);
                $tmpl.children().first().append($tmplContent);
                return $tmpl;
            }

            function prepareSlideTemplate(tmpl, attrs) {
                var $tmpl = WM.element(tmpl),
                    $div  = WM.element('<div></div>'),
                    parentDataSet = attrs.dataset || attrs.scopedataset;

                $tmpl = $div.append($tmpl);
                if (parentDataSet) {
                    Utils.updateTmplAttrs($tmpl, parentDataSet, attrs.name);
                }
                $tmpl = applyWrapper($tmpl, attrs);
                return $tmpl;
            }

            //this function decides which template should be set based on the condition.
            function templateFn($el, attrs) {
                // if type attribute is set then dynamic carousel template is used.
                if (attrs.type) {
                    return $templateCache.get('template/widget/advanced/carousel' + (CONSTANTS.isStudioMode ? '/design/dynamic/' : '/dynamic/') + 'carousel.html');
                }
                return $templateCache.get('template/widget/advanced/carousel' + (CONSTANTS.isStudioMode ? '/design/static/' : '/static/') + 'carousel.html');
            }

            function onDestroy($is, handlers) {
                handlers.forEach(Utils.triggerFn);
            }

            // Adds swipe functionality on the element.
            function addSwipee($scope, $ele) {
                var state = {
                    'activeItem': '',
                    'leftItem': '',
                    'rightItem': '',
                    'follower': '',
                    'noOfItems': ''
                };
                $ele.swipee({
                    'direction': $.fn.swipee.DIRECTIONS.HORIZONTAL,
                    'onSwipeStart': function () {
                        var items = this.find('>.app-carousel-item');
                        state.activeIndex = $scope.activeIndex;
                        state.noOfItems = items.length;
                        state.activeItem = items.eq(state.activeIndex);
                        state.leftItem = items.eq((state.noOfItems + state.activeIndex - 1) % state.noOfItems);
                        state.rightItem = items.eq((state.noOfItems + state.activeIndex + 1) % state.noOfItems);
                        state.activeItem.css({
                            'transition': 'none'
                        });
                        state.leftItem.css({
                            'transition': 'none'
                        });
                        state.rightItem.css({
                            'transition': 'none'
                        });

                        this.addClass('swipee-transition');
                    },
                    'onSwipe': function (e, data) {
                        // assign the follower and translate depending on data.length
                        if (state.follower !== state.leftItem && data.length > 0) {
                            if (state.follower) {
                                state.follower.css({
                                    'transform': 'translate3d(0, 0, 0)'
                                });
                            }
                            state.follower = state.leftItem;
                        } else if (state.follower !== state.rightItem && data.length < 0) {
                            if (state.follower) {
                                state.follower.css({
                                    'transform': 'translate3d(0, 0, 0)'
                                });
                            }
                            state.follower = state.rightItem;
                        }
                        state.activeItem.css({
                            'transform': 'translate3d(' + data.length + 'px, 0, 0)'
                        });
                        state.follower.css({
                            'transform': 'translate3d(' + data.length + 'px, 0, 0)'
                        });
                    },
                    'onSwipeEnd': function (e, data) {
                        var index = state.activeIndex,
                            ltr = false;

                        this.removeClass('swipee-transition');

                        // update the activeIndex depending on data.length and reset the styles.
                        if (data.length > 50) {
                            index--;
                            ltr = true;
                        } else if (-data.length > 50) {
                            index++;
                        }

                        state.activeItem.css({
                            'transition': '',
                            'transform': ''
                        });
                        state.leftItem.css({
                            'transition': '',
                            'transform': ''
                        });
                        state.rightItem.css({
                            'transition': '',
                            'transform': ''
                        });
                        state = {};

                        $scope.goTo(index, ltr);
                    }
                });
            }

            // This function applies transition on the items.
            function animate(items, from, to, ltr) {
                var callback = {
                        'success': WM.noop,
                        'then': function (fn) {
                            this.success = fn;
                        }
                    },
                    tx = ltr ? 100 : -100,
                    // item at from index
                    item = items.eq((from + items.length) % items.length),
                    // item at to index
                    follower = items.eq((to + items.length) % items.length);
                window.requestAnimationFrame(function () {
                    if (from === to) {
                        tx = 0;
                    } else {
                        if (ltr) {
                            follower.addClass('left-item').removeClass('right-item');
                        } else {
                            follower.addClass('right-item').removeClass('left-item');
                        }
                        item.removeClass('right-item left-item');
                    }
                    item.css({
                        '-webkit-transition': '-webkit-transform 1s linear',
                        '-webkit-transform': 'translate3d(' + tx + '%, 0, 0)',
                        'transition': 'transform 1s linear',
                        'transform': 'translate3d(' + tx + '%, 0, 0)'
                    });
                    follower.css({
                        '-webkit-transition': '-webkit-transform 1s linear',
                        '-webkit-transform': 'translate3d(' + tx + '%, 0, 0)',
                        'transition': 'transform 1s linear',
                        'transform': 'translate3d(' + tx + '%, 0, 0)'
                    });
                });
                $timeout(function () {
                    item.css({
                        '-webkit-transition': 'none',
                        '-webkit-transform': '',
                        'transition': 'none',
                        'transform': ''
                    });
                    follower.css({
                        '-webkit-transition': 'none',
                        '-webkit-transform': '',
                        'transition': 'none',
                        'transform': ''
                    });
                    // execute the callback fn.
                    callback.success();
                }, 1500);
                return callback;
            }

            // Sets active item, leftItem, rightItem by removing / adding respective classes.
            function setActiveItem(items, from, to) {
                // if from and to are undefined then set to 0 index.
                from = from || 0;
                to = to || 0;

                // if there is only one carousel-item then there won't be any right or left-item.
                if (items.length === 1) {
                    items.eq(0).removeClass('left-item right-item');
                    return;
                }

                items.eq((items.length + from) % items.length).removeClass('left-item').addClass('right-item');
                items.eq((items.length + to - 1) % items.length).addClass('left-item').removeClass('right-item');
                items.eq((items.length + to) % items.length).removeClass('left-item right-item');
                items.eq((items.length + to + 1) % items.length).addClass('right-item').removeClass('left-item');
            }

            directiveDefn = {
                'restrict'  : 'E',
                'scope'     : {},
                'transclude': true,
                'template'  : templateFn,
                'replace'   : true,
                'controller': function ($scope) {
                    var _map = {};
                    // this keeps a copy of carousel-template
                    this.$set = function (key, value) {
                        _map[key] = value;
                    };
                    // this gets a template based on the key.
                    this.$get = function (key) {
                        return _map[key];
                    };
                    this.register = function (contentScope) {
                        // check for the first index of the slide deck and class active
                        if (!$scope.contents.length) {
                            contentScope.getElement().addClass('active');
                        }

                        $scope.contents.push(contentScope);
                        //In studio mode the last slide is selected after add
                        if ($scope.widgetid) {
                            $scope.last();
                        }
                    };
                    this.unregister = function (contentScope) {
                        var i, len = $scope.contents.length;
                        for (i = 0; i < len; i++) {
                            if ($scope.contents[i].$id === contentScope.$id) {
                                break;
                            }
                        }
                        $scope.contents.splice(i, 1);
                        $scope.activeIndex = $scope.contents.length - 1;
                        $scope.goTo($scope.activeIndex);
                    };
                },
                'link' : {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                        $is.widgetProps.nodatamessage.show = attrs.type === CAROUSEL_TYPE.DYNAMIC;
                        $is.noDataFound = false;
                        if (!attrs.type) {
                            $is.contents    = [];
                            $is.activeIndex = 0;
                            //static carousel don't have current slide.
                            if (attrs.widgetid) {
                                widgetProps.currentslide.show = false;
                            }

                            $is.isMoving = false;

                            //function for slide  to move to a specific slide index
                            $is.goTo = function (index, direction) {
                                var ltr,
                                    oldElement,
                                    newElement,
                                    oldIndex,
                                    content = $el.find('>.carousel-inner'),
                                    items = content.find('>.app-carousel-item'),
                                    elScope;

                                index = (items.length + index) % items.length;

                                if (index === $is.activeIndex) {
                                    return;
                                }

                                // if the carousel is not animating then move to another slide.
                                if (!$is.contents[$is.activeIndex]) {
                                    return;
                                }

                                oldElement = $is.contents[$is.activeIndex].getElement();
                                newElement = $is.contents[index].getElement();
                                oldIndex = $is.activeIndex;

                                if ($is.widgetid) {
                                    oldElement.removeClass('active');
                                    newElement.addClass('active');
                                    $is.activeIndex  = index;
                                    setActiveItem(items, oldIndex, index);
                                } else if (index !== $is.activeIndex && !$is.isMoving) {
                                    $is.isMoving = true;
                                    $is.stop();
                                    if (direction === 'next') {
                                        ltr = false;
                                    } else if (direction === 'prev') {
                                        ltr = true;
                                    } else if (_.isBoolean(direction)) {
                                        ltr = direction;
                                    }

                                    if (WM.isUndefined(ltr)) {
                                        ltr = $is.activeIndex > index;
                                    }
                                    animate(items, $is.activeIndex, index, ltr).then(function () {
                                        setActiveItem(items, oldIndex, index);
                                        $is.isMoving = false;
                                    });
                                    $is.activeIndex  = index;
                                    $is.play();
                                    Utils.triggerFn($is.onChange, {$isolateScope: $is, newIndex: index, oldIndex: oldIndex});
                                    /* some widgets like charts needs to be redrawn when a carousel becomes active for the first time */
                                    $el.find('>.ng-isolate-scope')
                                        .each(function () {
                                            elScope = WM.element(this).isolateScope();
                                            if (elScope) {
                                                Utils.triggerFn(elScope.redraw);
                                            }
                                        });
                                }
                            };

                            //function to move to next slide
                            $is.next = function () {
                                if (!$el.find('>.carousel-inner').hasClass('swipee-transition')) {
                                    $is.goTo($is.activeIndex + 1, 'next');
                                }
                            };

                            //function to move to previous slide
                            $is.prev = function () {
                                if (!$el.find('>.carousel-inner').hasClass('swipee-transition')) {
                                    $is.goTo($is.activeIndex - 1, 'prev');
                                }
                            };

                            //function to move to first slide
                            $is.first = function () {
                                $is.goTo(0);
                            };

                            //function to move to last slide
                            $is.last = function () {
                                $is.goTo($is.contents.length - 1);
                            };

                            //define play and stop methods
                            if (CONSTANTS.isRunMode) {
                                //function to play the slides
                                $is.play = function () {
                                    if (!$is.autoPlay && $is.interval >= 600 && $is.animation === 'auto') {
                                        $is.autoPlay = $interval(function () {
                                            $is.next();
                                        }, $is.interval);
                                    }
                                };

                                //function to stop the slides
                                $is.stop = function () {
                                    if ($is.autoPlay) {
                                        $interval.cancel($is.autoPlay);
                                    }
                                    $is.autoPlay = undefined;
                                };
                            }
                        }
                    },
                    'post': function ($is, $el, attrs, listCtrl) {
                        var handlers = [],
                            $slideTemplate,
                            _onDestroy,
                            $innerCarousel,
                            items,
                            content;

                        Utils.defineProps($is, $el);

                        content = $el.find('>.carousel-inner');
                        items = content.find('>.app-carousel-item');
                        items.addClass('right-item');
                        setActiveItem(items);

                        if (CONSTANTS.isRunMode) {
                            if (!attrs.type) {
                                $is.play();
                            } else {
                                $is.noDataFound = attrs.type === CAROUSEL_TYPE.DYNAMIC && (undefined === ($is.binddataset || $is.scopedataset));
                                $slideTemplate = prepareSlideTemplate(listCtrl.$get('carouselTemplate'), attrs);
                                $el.prepend($slideTemplate);
                                $compile($slideTemplate)($el.closest('[data-identifier="carousel"]').isolateScope());
                                handlers.push($is.$watch('active', function (nv, ov) {
                                    if (nv !== undefined) {
                                        $is.currentslide = $is.fieldDefs[nv];
                                        $is.previousslide = $is.fieldDefs[ov];
                                        if (attrs.onChange) {
                                            Utils.triggerFn($is.onChange, {$isolateScope: $is, newIndex: nv, oldIndex: ov});
                                        }
                                    }
                                }));
                                $is.noWrapSlides = false;
                                $is.onSwipe = function (direction) {
                                    $innerCarousel = $el.find('>.carousel-inner').scope();
                                    if (direction === 'left') {
                                        $innerCarousel.next();
                                    } else {
                                        $innerCarousel.prev();
                                    }
                                };
                            }
                        }

                        // add swipe functionality on element for mobile device.
                        if ($is.gestures === 'on' && Utils.isMobile()) {
                            $el.addClass('swipee-carousel');
                            addSwipee($is, content);
                        }

                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, attrs), $is, notifyFor);
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                        _onDestroy = onDestroy.bind(undefined, $is, handlers);
                        $is.$on('$destroy', _onDestroy);
                        $el.on('$destroy', _onDestroy);
                    }
                }
            };

            return directiveDefn;
        }
    ])
    .directive('wmCarouselContent', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        'Utils',

        function (PropertiesFactory, $templateCache, WidgetUtilService, Utils) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.carouselcontent', ['wm.base', 'wm.containers']);
            return {
                'restrict'  : 'E',
                'scope'     : {},
                'transclude': true,
                'template'  : $templateCache.get('template/widget/advanced/carousel/carousel-content.html'),
                'replace'   : true,
                'require'   : '^wmCarousel',
                'link'      : {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                    },
                    'post': function ($is, $el, attrs, controller) {
                        $is.getElement = function () {
                            return $el;
                        };
                        $is.$on('$destroy', function () {
                            controller.unregister($is);
                        });
                        controller.register($is);
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ])
    .directive('wmCarouselTemplate', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        'CONSTANTS',
        'Utils',

        function (PropertiesFactory, $templateCache, WidgetUtilService, CONSTANTS, Utils) {
            'use strict';
            var widgetProps = PropertiesFactory.getPropertiesOf('wm.carouselcontent', ['wm.base', 'wm.containers']),
                directiveDefn;

            function preLinkFn($is, $el, attrs) {
                $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
            }

            function studioMode_postLinkFn($is, $el, attrs) {
                WidgetUtilService.postWidgetCreate($is, $el, attrs);
            }

            function runMode_preLinkFn($is, $el, attrs, listCtrl) {
                listCtrl.$set('carouselTemplate', $el.children());
                $el.remove();
            }

            directiveDefn = {
                'restrict' : 'E',
                'replace'   : true
            };

            if (CONSTANTS.isStudioMode) {
                WM.extend(directiveDefn, {
                    'transclude': true,
                    'scope'     : {},
                    'template'  : $templateCache.get('template/widget/advanced/carousel/carousel-content.html'),
                    'link'      : {
                        'pre' : preLinkFn,
                        'post': studioMode_postLinkFn
                    }
                });
            } else {
                WM.extend(directiveDefn, {
                    'scope'     : {},
                    'terminal'  : true,
                    'require'   : '^wmCarousel',
                    'link'      : {
                        'pre' : runMode_preLinkFn
                    }
                });
            }

            return directiveDefn;
        }
    ]);

/**
 * @ngdoc directive
 * @name wm.widgets.advanced.directive:wmCarousel
 * @restrict E
 *
 * @description
 * The `wmCarousel` directive defines wm-carousel widget.
 *
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires CONSTANTS
 * @requires $timeout
 * @requires WidgetUtilService
 * @requires $compile
 * @requires Utils
 *
 *
 * @param {string=} name
 *                  Name of the carousel.
 * @param {string=} width
 *                  Width of the carousel widget.
 * @param {string=} height
 *                  Height of the carousel widget.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the carousel on the web page. <br>
 *                  Default value: `true`.
 * @param {number=} animationinterval
 *                  Defines the time interval (in seconds) between two slide transitions.  <br>
 *                  Default value: `3`.
 *
 * @param {string=} dataset
 *                  Sets the data for the list.<br>
 *                  This is a bindable property.<br>
 *                  When bound to a variable, the data associated with the variable is displayed in the list.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-carousel animationinterval="5" height="100%">
                    <wm-carousel-content>
                        <wm-picture width="100%" name="picture3" picturesource="https://farm8.staticflickr.com/7555/16037316110_f0bef69033_z.jpg"></wm-picture>
                    </wm-carousel-content>
                    <wm-carousel-content>
                        <wm-picture width="100%" name="picture5" picturesource="https://farm6.staticflickr.com/5002/5237179864_552d6098f5_z_d.jpg"></wm-picture>
                    </wm-carousel-content>
                    <wm-carousel-content>
                        <wm-picture name="picture6" width="100%" picturesource="https://farm4.staticflickr.com/3024/3103220799_16f3b1db98_z_d.jpg"></wm-picture>
                    </wm-carousel-content>
                </wm-carousel>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.demo = true;
            }
        </file>
    </example>
 */
/**
 * @ngdoc directive
 * @name wm.widgets.advanced.directive:wmCarouselContent
 * @restrict E
 *
 * @description
 * The `wmCarouselContent` directive defines wm-carousel-content widget.<br>
 * This widget has to be used with in wm-carousel.
 *
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires CONSTANTS
 *
 * @param {string=} name
 *                  Name of the carousel content.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the carousel on the web page. <br>
 *                  Default value: `true`.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-carousel animationinterval="5" height="100%">
                    <wm-carousel-content>
                        <wm-picture width="100%" name="picture3" picturesource="https://farm8.staticflickr.com/7555/16037316110_f0bef69033_z.jpg"></wm-picture>
                    </wm-carousel-content>
                    <wm-carousel-content>
                        <wm-picture width="100%" name="picture5" picturesource="https://farm6.staticflickr.com/5002/5237179864_552d6098f5_z_d.jpg"></wm-picture>
                    </wm-carousel-content>
                    <wm-carousel-content>
                        <wm-picture name="picture6" width="100%" picturesource="https://farm4.staticflickr.com/3024/3103220799_16f3b1db98_z_d.jpg"></wm-picture>
                    </wm-carousel-content>
                </wm-carousel>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.demo = true;
            }
        </file>
    </example>
 */
/**
 * @ngdoc directive
 * @name wm.widgets.advanced.directive:wmCarouselContentTemplate
 * @restrict E
 *
 * @description
 * The `wmCarouselContentTemplate` directive defines wm-carousel-content-template widget.<br>
 * This widget has to be used with in wm-carousel.
 *
 *
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires CONSTANTS
 * @requires WidgetUtilService
 *
 * @param {string=} name
 *                  Name of the carousel content template.
 * @param {boolean=} show
 *                  Show is a bindable property. <br>
 *                  This property will be used to show/hide the carousel on the web page. <br>
 *                  Default value: `true`.
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-carousel animationinterval="5" height="100%">
                    <wm-carousel-content-template type='dynamic'>
                         <wm-picture width="100%" name="picture3" picturesource="https://farm8.staticflickr.com/7555/16037316110_f0bef69033_z.jpg"></wm-picture>
                    </wm-carousel-content-template>
                </wm-carousel>
            </div>
        </file>
        <file name="script.js">
            function Ctrl($scope) {
                $scope.demo = true;
            }
        </file>
     </example>
 */