/*global wm, WM, window*/
/**
 * @ngdoc service
 * @name wm.device.$MobileEventService
 * @description
 * The `MobileEventService` service is responsible for
 * providing touch and swipe functions for touch responsive devices.
 */

WM.module("wm.layouts.device")
    .service("MobileEventService", function () {
        "use strict";
        var SWIPE_DIRECTION = {LEFT: "LEFT", UP: "UP", DOWN: "DOWN", RIGHT: "RIGHT"};

        /**
         * identify swipe direction and call the callback
         * @param direction
         * @param selector
         * @param callback
         */
        function swipe(direction, selector, callback) {
            var ALLOWED_TIME = 2000, // maximum time allowed to complete a swipe
                startPosition = {},
                startTime,
                touchElement = WM.element(selector)[0];

            touchElement.addEventListener("touchstart", function (touchEvent) {
                touchEvent.preventDefault();
                startTime = new Date().getTime();
                var touchObj = touchEvent.changedTouches[0];
                startPosition.x = touchObj.pageX;
                startPosition.y = touchObj.pageY;
            }, false);

            touchElement.addEventListener("touchmove", function (touchEvent) {
                touchEvent.preventDefault();
            }, false);

            touchElement.addEventListener("touchend", function (touchEvent) {
                touchEvent.preventDefault();
                var swipeDuration = new Date().getTime() - startTime,
                    distance = {},
                    touchObj = touchEvent.changedTouches[0],
                    actualSwipeDirection;

                /* swipe direction should be found only if swipe occurs within the allowed time limit */
                if (swipeDuration <= ALLOWED_TIME) {
                    distance.x = touchObj.pageX - startPosition.x;
                    distance.y = touchObj.pageY - startPosition.y;
                    if (Math.abs(distance.x) >= 0 && Math.abs(distance.x) >= Math.abs(distance.y)) {
                        actualSwipeDirection = (distance.x < 0) ? SWIPE_DIRECTION.LEFT : SWIPE_DIRECTION.RIGHT;
                    } else if (Math.abs(distance.y) >= 0 && Math.abs(distance.y) >= Math.abs(distance.x)) {
                        actualSwipeDirection = (distance.y < 0) ? SWIPE_DIRECTION.UP : SWIPE_DIRECTION.DOWN;
                    }
                    if (actualSwipeDirection === direction) {
                        callback();
                    }
                }
            }, false);

        }

        return {
            /**
             * method to bind touch event
             * @param selector
             * @param callback
             */
            touch: function (selector, callback) {
                var el = WM.element(selector)[0];
                if (el) {
                    // if the device supports touch events, use them
                    if ('ontouchend' in window) {
                        el.addEventListener("touchend", function () {
                            callback();
                        }, false);
                    } else {
                        // fallback in the case where device doesn't support touch events
                        el.addEventListener("click", function () {
                            callback();
                        }, false);
                    }
                }
            },
            /**
             * method to bind swipe up event
             * @param selector
             * @param callback
             */
            swipeUp: function (selector, callback) {
                swipe(SWIPE_DIRECTION.UP, selector, callback);
            },
            /**
             * method to bind swipe down event
             * @param selector
             * @param callback
             */
            swipeDown: function (selector, callback) {
                swipe(SWIPE_DIRECTION.DOWN, selector, callback);
            },
            /**
             * method to bind swipe left event
             * @param selector
             * @param callback
             */
            swipeLeft: function (selector, callback) {
                swipe(SWIPE_DIRECTION.LEFT, selector, callback);
            },
            /**
             * method to bind swipe right event
             * @param selector
             * @param callback
             */
            swipeRight: function (selector, callback) {
                swipe(SWIPE_DIRECTION.RIGHT, selector, callback);
            }
        };
    });
