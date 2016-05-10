/*global angular, Hammer */

angular.module('angular-gestures', []);

var HGESTURES = {
    hmPinchIn: 'pinchin',
    hmPinchOut: 'pinchout',
    hmSwipeUp: 'swipeup',
    hmSwipeDown: 'swipedown',
    hmSwipeLeft: 'swipeleft',
    hmSwipeRight: 'swiperight'
};

function configureHammerTimeEl(hammertime, event) {
    'use strict';
    switch (event) {
    case 'pinchin':
    case 'pinchout':
        hammertime.get('pinch').set({enable: true});
        break;
    case 'swipeup':
        hammertime.get('swipe').set({direction: Hammer.DIRECTION_VERTICAL, velocity: 0.3});
        break;
    case 'swipedown':
        hammertime.get('swipe').set({direction: Hammer.DIRECTION_VERTICAL, velocity: 0.3});
        break;
    case 'swipeleft':
        hammertime.get('swipe').set({direction: Hammer.DIRECTION_HORIZONTAL, velocity: 0.3});
        break;
    case 'swiperight':
        hammertime.get('swipe').set({direction: Hammer.DIRECTION_HORIZONTAL, velocity: 0.3});
        break;
    }
}

angular.forEach(HGESTURES, function (eventName, directiveName) {
    'use strict';
    angular.module('angular-gestures').directive(directiveName,
        ['$parse', '$timeout', function ($parse, $timeout) {
            return function (scope, element, attr) {
                var hammertime, handler, deRegisterFn;
                deRegisterFn = attr.$observe(directiveName, function (value) {
                    deRegisterFn();
                    var fn = $parse(value);
                    hammertime = new Hammer(element[0], {});
                    configureHammerTimeEl(hammertime, eventName);
                    handler = function (event) {
                        $timeout(function () {
                            fn(scope, {$event: event});
                        }, 0);
                    };
                    hammertime.on(eventName, handler);
                    scope.$on('$destroy', function () {
                        hammertime.off(eventName, handler);
                    });
                });
            };
        }]);
});
