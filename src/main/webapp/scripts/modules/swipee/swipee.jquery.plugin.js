// Get a regular interval for drawing to the screen
window.requestAnimationFrame = (function(callback) {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimaitonFrame ||
        function(callback) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
(function($) {
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
        max = Math.abs,
        queue = [],
        activeEventProcessor;

    function ScrollObserver(parent, child, direction) {
        var elementsToObserve = (function(array) {
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
            $.each(elementsToObserve, function() {
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
            $.each(elementsToObserve, function() {
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
        this.hasSrcolled = function() {
            return isVerticalScroll() || isHorizontalScroll();
        };
    }

    function SwipeEventSmoother() {
        var queue = [],
            isProcessing = false,
            time;

        function process() {
            if (queue.length > 0) {
                //if (time !== 0) {
                //console.log("time %d", Date.now() - time);
                //}
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

        this.push = function(fn) {
            queue.push(fn);
        };

        this.process = function() {
            if (!isProcessing) {
                isProcessing = true;
                //time = 0;
                process();
            }
        }
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
            eventSplits = [];
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
            console.log(JSON.stringify(eventSplits));
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
            em.preventDefault();
            onActiveSwipe(em, settings);
        };
        swipeEndHandler = function(ee) {
            ee.preventDefault();
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

    function getAndroidVersion() {
        var match = (navigator.userAgent.toLowerCase()).match(/android\s([0-9\.]*)/);
        return match ? match[1] : false;
    }

    function listenPassiveSwipe(touch, settings) {
        var passiveSwipeHandler,
            destroyListeners;
        settings.scrollObserver = new ScrollObserver(event.currentTarget, event.target, settings.direction);
        discardSwipe = 0;
        passiveSwipeHandler = function(em) {
            em.preventDefault();
            var distance;
            if (discardSwipe) {
                destroyListeners();
            } else if (isThresholdReached(getTouchEvent(em), settings)) {
                if (settings.scrollObserver.hasSrcolled() || listenActiveSwipe(em, settings)) {
                    discardSwipe = 1;
                    // check for kitkat version.
                    if (parseInt(getAndroidVersion(), 10) === 4) {
                        settings.data.length = settings.data.length * 100;
                        onActiveSwipeEnd(em, settings);
                    }
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
        settings.target.on('mousedown touchstart', function(es) {
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
                            console.log('trace ' + trace);
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