/*global WM, ProgressBar, _*/
/*Directive for Number */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/circle-progress.html',
            '<div class="progress app-progress circle {{strokeColor}}" title="{{hint}}" init-widget apply-styles></div>'
        );
    }])
    .directive('wmCircleProgress', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.progress.circle', ['wm.base', 'wm.base.events']),
            notifyFor = {
                'datavalue'        : true,
                'minvalue'         : true,
                'maxvalue'         : true,
                'type'             : true,
                'captionplacement' : true,
                'displayformat'    : true
            },
            /* map of type and classes to be applied*/
            CLASSES = {
                'default'        : '',
                'success'        : 'progress-bar-success',
                'info'           : 'progress-bar-info',
                'warning'        : 'progress-bar-warning',
                'danger'         : 'progress-bar-danger'
            },
            debouncedRender;

        // This function returns the maximum number of decimal digits allowed.
        function getDecimalCount(val) {
            val = val || '9';
            val = val.replace(/\%$/, '');

            var n = val.lastIndexOf('.');

            return (n === -1) ? 0 : (val.length - n - 1);
        }

        function isPercentageValue(value) {
            if (WM.isString(value)) {
                value = value.trim();
                return value.charAt(value.length - 1) === '%';
            }
        }

        function getCircleProgressBar(scope) {
            var progressBarEl;
            if (!scope.circularProgressbar) {
                progressBarEl = scope.$element;
                progressBarEl.empty();
                scope.circularProgressbar = new ProgressBar.Circle(progressBarEl[0], {
                    color: '#aaa',
                    strokeWidth: 5,
                    trailWidth: 5,
                    easing: 'easeInOut',
                    duration: 1000,
                    svgStyle: {
                        display: 'block'
                    },
                    text: {
                        autoStyleContainer: false
                    },
                    from: { color: '#333', value: scope.minvalue },
                    to: { color: '#333', value: scope.maxvalue },
                    // Set default step function for all animate calls
                    step: function(state, circle) {
                        var decimalCount, value;
                        if (scope.captionplacement !== 'inside') {
                            return;
                        }
                        decimalCount = getDecimalCount(scope.displayformat);
                        value = (circle.value() * 100).toFixed(decimalCount);
                        circle.setText(value);
                    }
                });
            }
            return scope.circularProgressbar;
        }

        function render(scope) {
            var datavalue = scope.datavalue,
                percent = '',
                isPercentage = isPercentageValue(datavalue),
                progressBar = getCircleProgressBar(scope);

            if (isPercentage) {
                datavalue = _.toNumber(datavalue.replace('%', ''));
                percent = datavalue / 100;
            } else {
                datavalue = _.toNumber(datavalue);
                percent = (datavalue - scope.minvalue) / (scope.maxvalue - scope.minvalue);
            }

            if ( _.isNaN(percent)) {
                percent = 0;
            } else {
                percent = percent > 1 ? 1 : (percent < 0 ? 0 : percent);
            }

            if (progressBar.text) {
                progressBar.text.style.fontFamily = 'Helvetica, sans-serif';
                progressBar.text.style.fontSize = '2rem';
                progressBar.text.className = (_.includes(scope.displayformat, '%') ? ' show-percent' : '');
            }
            progressBar.animate(percent);
        }

        function propertyChangeHandler($is, element, key, nv) {
            var progressBar;
            switch (key) {
                case 'type':
                    $is.strokeColor = CLASSES[nv];
                    break;
                case 'datavalue':
                case 'minvalue':
                case 'maxvalue':
                case 'captionplacement':
                    debouncedRender($is);
                    break;
                case 'displayformat':
                    progressBar = getCircleProgressBar($is);
                    if (progressBar && progressBar.text) {
                        progressBar.text.className =  (_.includes(nv, '%') ? ' show-percent' : '');
                    }
                    break;
            }

        }


        return {
            'restrict': 'E',
            'replace': true,
            'scope': {},
            'templateUrl': 'template/widget/circle-progress.html',
            'link': {
                'pre': function ($is, $el, attrs) {
                    $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                },
                'post': function ($is, element, attrs) {
                    debouncedRender = _.debounce(render, 100);
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, element), $is, notifyFor);
                    WidgetUtilService.postWidgetCreate($is, element, attrs);
                }
            }
        };
    }]);