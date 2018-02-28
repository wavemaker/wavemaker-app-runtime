/*global $, window */

// Get a regular interval for drawing to the screen
window.requestAnimationFrame = (function () {
    'use strict';
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimaitonFrame ||
        function (callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
(function ($) {
    'use strict';
    var DIRECTIONS = {
            'NONE': 0,
            'HORIZONTAL': 1,
            'LEFT_TO_RIGHT': 2,
            'RIGHT_TO_LEFT': 3,
            'VERTICAL': 4,
            'TOP_TO_DOWN': 5,
            'DOWN_TO_TOP': 6
        },
        discardSwipe,
        SwipeTracer,
        abs = Math.abs,
        max = Math.max,
        queue = [],
        activeEventProcessor;

    function ScrollObserver(parent, child, direction) {
        var elementsToObserve = (function (array) {
            var iter = child;
            while (iter) {
                array.push({
                    '$ele': $(iter),
                    'last': {
                        'scrollLeft': iter.iscroll ? iter.iscroll.x : iter.scrollLeft,
                        'scrollTop': iter.iscroll ? iter.iscroll.y : iter.scrollTop
                    }
                });
                iter = iter.parentElement;
            }
            return array;
        })([]);

        function isVerticalScroll() {
            var result;
            $.each(elementsToObserve, function () {
                if (this.$ele[0].iscroll) {
                    if (this.$ele[0].iscroll.y !== this.last.scrollTop) {
                        result = true;
                }
                } else if (this.$ele[0].scrollTop !== this.last.scrollTop) {
                    result = true;
                }
            });
            return result;
        }

        function isHorizontalScroll() {
            var result;
            $.each(elementsToObserve, function () {
                if (this.$ele[0].iscroll) {
                    if (this.$ele[0].iscroll.x !== this.last.scrollLeft) {
                        result = true;
                    }
                } else if (this.$ele[0].scrollLeft !== this.last.scrollLeft) {
                    result = true;
                }
            });
            return result;
        }
        this.hasSrcolled = function () {
            return isVerticalScroll() || isHorizontalScroll();
        };
    }

    function SwipeEventSmoother() {
        var queue = [],
            isProcessing = false,
            time;

        function process() {
            if (queue.length > 0) {
                time = Date.now();
                try {
                    queue.shift()();
                } catch (e) {
                    console.error("Function invocation failed", e);
                }
                window.requestAnimationFrame(process);
            } else {
                isProcessing = false;
            }
        }

        this.push = function (fn) {
            queue.push(fn);
        };

        this.process = function () {
            if (!isProcessing) {
                isProcessing = true;
                //time = 0;
                process();
            }
        };
    }

    activeEventProcessor = new SwipeEventSmoother();

    function getTouchEvent(event) {
        return (event.originalEvent && event.originalEvent.touches && event.originalEvent.touches[0]) ||
            (event && event.touches && event.touches[0]) ||
            event;
    }

    function computeDistance(startPoint, endPoint, direction) {
        var distance = 0,
            deltaX,
            deltaY;
        if (direction === DIRECTIONS.HORIZONTAL) {
            distance = endPoint.x - startPoint.x;
        } else if (direction === DIRECTIONS.LEFT_TO_RIGHT) {
            distance = max(endPoint.x - startPoint.x, 0);
        } else if (direction === DIRECTIONS.RIGHT_TO_LEFT) {
            distance = max(startPoint.x - endPoint.x, 0);
        } else if (direction === DIRECTIONS.VERTICAL) {
            distance = endPoint.y - startPoint.y;
        } else if (direction === DIRECTIONS.TOP_TO_DOWN) {
            distance = max(endPoint.y - startPoint.y, 0);
        } else if (direction === DIRECTIONS.DOWN_TO_TOP) {
            distance = max(startPoint.y - endPoint.y, 0);
        } else {
            deltaX = endPoint.x - startPoint.x;
            deltaY = endPoint.y - startPoint.y;
            distance = max(abs(deltaX), abs(deltaY));
            if ((deltaX < 0 && abs(deltaX) === distance) || (deltaY < 0 && abs(deltaY) === distance)) {
                distance = -distance
            }
        }
        return distance;
    }

    function onActiveSwipe(event, settings) {
        var touch = getTouchEvent(event),
            startPoint = settings.data.path[0],
            point = {
                'x': touch.pageX,
                'y': touch.pageY
            },
            distance = computeDistance(startPoint, point, settings.direction),
            eventSplits = [],
            increment,
            limit;
        settings.renderInProgress = false;
        if (distance !== settings.lastDistance) {
            increment = (distance < settings.lastDistance ? -1 : 1) * 30;
            limit = (distance - settings.lastDistance);
            for (var i = increment;
                 (increment > 0 && i <= limit) || (increment < 0 && i >= limit); i += increment) {
                eventSplits.push(i + settings.lastDistance);
            }
            if (limit % increment !== 0) {
                eventSplits.push(limit % abs(increment) + (eventSplits.length === 0 ? settings.lastDistance : eventSplits[eventSplits.length - 1]));
            }
            //eventSplits = [distance];
            settings.lastDistance = distance;
            $.each(eventSplits, function() {
                var d = this;
                activeEventProcessor.push(function() {
                    settings.data.length = d;
                    settings.data.totalLength += abs(d);
                    settings.data.velocity = abs(settings.data.totalLength / (Date.now() - settings.data.startTime));
                    settings.data.path.push(point);
                    if (settings.onSwipe.call(settings.target, event, settings.data) === false) {
                        onActiveSwipeEnd(event, settings);
                    }
                    SwipeTracer.onSwipe(event, settings.data);
                });
            });
            activeEventProcessor.process();
        }
    }

    function onActiveSwipeEnd(event, settings) {
        var touch = getTouchEvent(event);
        if (touch) {
            settings.data.path.push({
                'x': touch.pageX,
                'y': touch.pageY
            });
        }
        activeEventProcessor.push(function() {
            SwipeTracer.onSwipeEnd(event, settings.data);
            settings.onSwipeEnd.call(settings.target, event, settings.data);
        });
        activeEventProcessor.process();
        settings.destroyListeners();
    }

    function listenActiveSwipe(event, settings) {
        var touch = getTouchEvent(event),
            swipeHandler,
            swipeEndHandler,
            passiveDistance,
            passiveSwipeStartPoint = settings.data.path[0],
            activeSwipeStartPoint = {
                'x': touch.pageX,
                'y': touch.pageY
            };
        passiveDistance = computeDistance(passiveSwipeStartPoint, activeSwipeStartPoint, settings.direction);
        settings.data.length = passiveDistance < 0 ? -1 : 1;
        settings.lastDistance = settings.data.length;
        settings.data.path = [activeSwipeStartPoint];
        settings.data.totalLength = abs(settings.data.length);
        settings.data.startTime = Date.now();
        if (settings.onSwipeStart.call(settings.target, event, settings.data) === false) {
            return false;
        }
        swipeHandler = function(em) {
            onActiveSwipe(em, settings);
        };
        swipeEndHandler = function(ee) {
            onActiveSwipeEnd(ee, settings);
        };
        SwipeTracer.onSwipeStart(event, settings.data);
        settings.swipeTarget.addEventListener('mousemove', swipeHandler);
        settings.swipeTarget.addEventListener('touchmove', swipeHandler);
        document.addEventListener('mouseup', swipeEndHandler);
        document.addEventListener('touchend', swipeEndHandler);
        // remove if there are any destroyListeners already present on setting object.
        settings.destroyListeners && settings.destroyListeners();
        settings.destroyListeners = function() {
            settings.swipeTarget.removeEventListener('mousemove', swipeHandler);
            settings.swipeTarget.removeEventListener('touchmove', swipeHandler);
            document.removeEventListener('mouseup', swipeEndHandler);
            document.removeEventListener('touchend', swipeEndHandler);
            settings.destroyListeners = $.noop;
        };
        return true;
    }

    function isThresholdReached(touch, settings) {
        var startPoint = settings.data.path[0],
            endPoint = {
                'x': touch.pageX,
                'y': touch.pageY
            },
            distance = computeDistance(startPoint, endPoint, settings.direction);
        return abs(distance) > settings.threshold;
    }

    function listenPassiveSwipe(touch, settings) {
        var passiveSwipeHandler,
            destroyListeners;
        settings.scrollObserver = new ScrollObserver(event.currentTarget, event.target, settings.direction);
        discardSwipe = 0;
        passiveSwipeHandler = function(em) {
            var distance;
            if (discardSwipe) {
                destroyListeners();
            } else if (isThresholdReached(getTouchEvent(em), settings)) {
                if (settings.scrollObserver.hasSrcolled() || listenActiveSwipe(em, settings)) {
                    discardSwipe = 1;
                }
            }
        };
        destroyListeners = function() {
            settings.swipeTarget.removeEventListener('mousemove', passiveSwipeHandler);
            settings.swipeTarget.removeEventListener('touchmove', passiveSwipeHandler);
            document.removeEventListener('mouseup', destroyListeners);
            document.removeEventListener('touchend', destroyListeners);
            settings.scrollObserver = null;
        };
        settings.data = {
            path: [{
                'x': touch.pageX,
                'y': touch.pageY
            }]
        };
        settings.swipeTarget.addEventListener('mousemove', passiveSwipeHandler);
        settings.swipeTarget.addEventListener('touchmove', passiveSwipeHandler);
        document.addEventListener('mouseup', destroyListeners);
        document.addEventListener('touchend', destroyListeners);
    }


    function bind(settings) {
        // Listens for events depending on value passed to bindEvents.
        var events = settings.bindEvents,
            listenFor = '';
        if (_.includes(events, 'touch')) {
            listenFor += ' touchstart';
        } else if (_.includes(events, 'mouse')) {
            listenFor += ' mousedown';
        }

        if (!listenFor) {
            return;
        }

        settings.target.on(listenFor, function(es) {
            var touch = getTouchEvent(es);
            if (touch) {
                listenPassiveSwipe(touch, settings);
            }
        });
    }
    $.fn.swipee = function(settings) {
        this.each(function() {
            bind($.extend({
                'direction': DIRECTIONS.NONE,
                'target': $(this),
                'bindEvents': ['touch', 'mouse'],
                'swipeTarget': document,
                'threshold': 30,
                'onSwipeStart': $.noop,
                'onSwipe': $.noop,
                'onSwipeEnd': $.noop
            }, settings));
        });
        return this;
    };

    SwipeTracer = {
        'onSwipeStart': function(e, data) {
            if ($.fn.swipee.trace) {
                $('body').append('<svg height="100vh" width="100vw" ' +
                '   style="position : fixed;top: 0;left: 0; width:100vw; height: 100vh; z-index:10000" id ="canvas">' +
                '       <path stroke="rgba(0, 0, 0, 0.5)" stroke-linecap="round" stroke-width="20" fill-opacity="0" ' +
                '           stroke-opacity="0.8" d="M' + data.path[0].x + ' ' + data.path[0].y + ' " />' +
                '   </svg>');
                data.tracer = {
                    pathd: $('#canvas path')
                };
            }
        },
        'onSwipe': function(e, data) {
            if (data.tracer) {
                var d = data.tracer.pathd.attr('d'),
                    p = data.path[data.path.length - 1];
                data.tracer.pathd.attr('d', d + ' L' + p.x + ' ' + p.y + ' ');
            }
        },
        'onSwipeEnd': function(e, data) {
            if (data.tracer) {
                var firstPoint = data.path[0],
                    expected = [firstPoint, {
                        y: firstPoint.y - 50
                    }, {
                        x: firstPoint.x + 50
                    }, {
                        y: firstPoint.y + 50
                    }],
                    trace = 0;
                _.forEach(data.path, function(p) {
                    var ep;
                    if (trace !== expected.length) {
                        ep = expected[trace];
                        if ((!ep.x || ep.x <= p.x) && (!ep.y || ep.y <= p.y)) {
                            trace++;
                        }
                    }
                });
                setTimeout(function() {
                    $('body >#canvas').remove();
                }, 500);
            }
        }
    };
    $.fn.swipee.DIRECTIONS = DIRECTIONS;
})(jQuery);

// Plugin extension for swipeAnimation.
(function ($) {
    var $parse,
        expressionRegex = /\$\{\{[a-zA-Z\+-/%\.\*\s\(\)\d,\\'"\$_]*\}\}/;

    // Angular parser to parse the expression inside the interpolation
    function compile(script) {
        var tArr = [],
            match;
        $parse = $parse || WM.element('body:first').injector().get('$parse');
        if (_.isFunction(script)) {
            return script;
        } else {
            while ((match = expressionRegex.exec(script)) !== null) {
                var expression = match[0],
                    prefix = script.substring(0, match.index);
                script = script.substring(match.index + expression.length);
                expression = expression.substring(3, expression.length - 2);
                tArr.push(prefix);
                tArr.push($parse(expression).bind({}));
            }
            tArr.push(script);
            return function() {
                var args = arguments;
                return _.map(tArr, function(v) {
                    return _.isFunction(v) ? v.apply(undefined, args) : v;
                }).join('');
            };
        }

    }

    function getObject(obj, $ele) {
        if (_.isFunction(obj)) {
            return obj.apply($ele);
        }
        return obj;
    }

    function VelocityComputator() {
        var lastDistance = 0,
            lastTime = 0,
            v = 0;
        return {
            addDistance: function(d) {
                var currentTime = Date.now();
                if (Math.abs(d - lastDistance) > 10 && currentTime !== lastTime) {
                    v = (d - lastDistance) / (currentTime - lastTime);
                    lastDistance = d;
                    lastTime = currentTime;
                }
                if (v < 0) {
                    v = Math.min(v, -3);
                } else {
                    v = Math.max(v, 3);
                }
                return this;
            },
            getVelocity: function() {
                return v;
            },
            getTime: function(d) {
                return Math.abs(d / v);
            }
        };
    }

    /**
     * lower and upper bounds are relative distance from the center.
     * Calculates the lower and upper bounds based on relative position from center
     * @param $el
     * @param settings
     */
    function calculateBounds($el, settings) {
        var centerVal = 0,
            bounds = getObject(settings.bounds, $el);

        if (!_.isUndefined(bounds.center)) {
            centerVal = bounds.center;
        }
        if (!_.isUndefined(bounds.lower)) {
            bounds.lower = bounds.lower + centerVal;
        }
        if (!_.isUndefined(bounds.upper)) {
            bounds.upper = bounds.upper + centerVal;
        }

        return bounds;
    }

    /**
     * This function checks if target is a function or an element and gets the target element.
     * @param settings
     */
    function retrieveTargets(settings) {
        _.forEach(settings.animation, function(a) {
            if (_.isFunction(a.target) || a.targetFn) {
                a.targetFn = _.isUndefined(a.targetFn) ? a.target : a.targetFn;
                a.target = a.targetFn();
            }
        });
    }

    /**
     * Getter and setter for settings object
     * @constructor
     */
    function SettingsProperty() {
        this.setSettings = function (settings, $el) {
            $el.data('swipeAnimationDefaults', settings);
        };
        this.getSettings = function ($el) {
            return $el.data('swipeAnimationDefaults');
        }
    }

    /**
     * This function handles the animation on element
     * @param settings , metadata related to animation
     * @param metaData , contains the distance moved i.e. $d and current position $D, and also bounds details
     * @param time , time to persist transition
     * @param $el , element on which swipe is applied
     */
    function animate(settings, metaData, time, $el) {
        _.forEach(settings.animation, function(a) {
            a.target.css(_.mapValues(a.css, function(v, k) {
                return v(metaData);
            }));
            a.target.css({
                'transition': 'all ease-out ' + time + 'ms'
            });
            a.target.one('webkitTransitionEnd', function() {
                a.target.css({
                    'transition': ''
                });
            });
        });
        setTimeout(function() {
            if (metaData.$D === metaData.bounds.lower) {
                settings.onLower.call($el);
            } else if (metaData.$D === metaData.bounds.upper) {
                settings.onUpper.call($el);
            }
            settings.onAnimation();
        }, time);
    }

    var methods = {
        'gotoUpper': function () {
            swipeToEnd(this, 'upper', arguments[1]);
        },
        'gotoLower': function (time) {
            swipeToEnd(this, 'lower',arguments[1]);
        }
    };

    // This function animates to the upper or lower bound.
    function swipeToEnd($ele, moveTo, time) {
        var settingsObj = new SettingsProperty(),
            settings = settingsObj.getSettings($ele),
            metaData = {},
            bounds = calculateBounds($ele, settings),
            context;

        retrieveTargets(settings);

        time = time || 300;

        context = getObject(settings.context, $ele);
        metaData = _.extend({}, context);
        metaData.$d = 0;
        metaData.$D = moveTo === 'lower' ? bounds.lower : bounds.upper;
        metaData.bounds = bounds;

        animate(settings, metaData, time, $ele, true);
    }

    // This function adds swipe functionality on the element.
    function addSwipee($ele, settings) {
        var state = {
            'max': Math.max,
            'min': Math.min,
            'abs': Math.abs,
            '$D': 0
        };

        if (!_.isArray(settings.animation)) {
            var target = settings.animation.target || $ele,
                css = settings.animation.css || settings.animation;
            delete css[$ele];
            settings.animation = [{
                'target': target,
                'css': css
            }];
        }
        _.forEach(settings.animation, function(a) {
            a.css = _.mapValues(a.css, function(v, k) {
                return compile(v);
            });
        });
        var settingsObj = new SettingsProperty();
        settingsObj.setSettings(settings, $ele);
        $ele.swipee({
            'direction': settings.direction,
            'threshold': settings.threshold,
            'bindEvents': settings.bindEvents,
            'onSwipeStart': function(e, data) {
                var cd;
                state.$d = 0;

                state.bounds = calculateBounds(this, settings);
                if (!_.isUndefined(state.bounds.center)) {
                    state.$D = state.bounds.center;
                } else {
                    state.$D = 0;
                }

                cd = state.$D + data.length;

                // by default strict is true
                if (_.isUndefined(state.bounds.strict)) {
                    state.bounds.strict = true;
                }

                if (state.bounds.strict && ((_.isUndefined(state.bounds.lower) && data.length < 0) ||
                    (!_.isUndefined(state.bounds.lower) && state.bounds.lower > cd) ||
                    (_.isUndefined(state.bounds.upper) && data.length > 0) ||
                    (!_.isUndefined(state.bounds.upper) && state.bounds.upper < cd))) {
                    return false;
                }
                state.vc = VelocityComputator();
                state.context = getObject(settings.context, $ele);
                state.localState = _.extend({}, state.context);

                retrieveTargets(settings);

                _.forEach(settings.animation, function(a) {
                    a.target.css({
                        'transition': 'none'
                    });
                });
            },
            'onSwipe': function(e, data) {
                var localState = state.localState,
                    cd = state.$D + data.length;

                localState.$d = data.length;
                localState.$D = state.$D;

                // only in strict mode, restrict the $d value to go beyond the bounds.
                if (state.bounds.strict) {
                    if (!_.isUndefined(state.bounds.lower) && state.bounds.lower > cd) {
                        localState.$d = state.bounds.lower;
                    } else if (!_.isUndefined(state.bounds.upper) && state.bounds.upper < cd) {
                        localState.$d = state.bounds.upper;
                    }
                }

                state.vc.addDistance(data.length);
                _.forEach(settings.animation, function(a) {
                    a.target.css(_.mapValues(a.css, function(v, k) {
                        return v(localState);
                    }));
                });
            },
            'onSwipeEnd': function(e, data) {
                var localState = state.localState,
                    cd = state.$D + data.length,
                    v = state.vc.getVelocity(),
                    time;

                localState.$d = data.length;
                localState.$D = state.$D;

                // assigns upper or lower bounds to $D
                if (!_.isUndefined(state.bounds.lower) && v <= 0 && state.$D > cd) {
                    localState.$D = state.bounds.lower;
                } else if (!_.isUndefined(state.bounds.upper) && v >= 0 && state.$D < cd) {
                    localState.$D = state.bounds.upper;
                }

                localState.$d = 0;
                localState.bounds = state.bounds;
                state.$D = localState.$D;
                time = state.vc.getTime(localState.$D - cd);

                animate(settings, localState, time, $ele);
            }
        });
    }

    // Adds the swipe functionality on the element
    $.fn.swipeAnimation = function(settings) {
        if (methods[settings]) {
            return methods[settings].apply(this, arguments);
        }
        this.each(function() {
            addSwipee($(this), $.extend({
                'direction': $.fn.swipee.DIRECTIONS.HORIZONTAL,
                //'step': 10,
                'threshold': 30,
                'bindEvents': ['touch'],
                'bounds': {},
                'context': {},
                'animation': {},
                'onLower': $.noop,
                'onUpper': $.noop,
                'onAnimation': $.noop
            }, settings));
        });
        return this;
    };
})(jQuery);