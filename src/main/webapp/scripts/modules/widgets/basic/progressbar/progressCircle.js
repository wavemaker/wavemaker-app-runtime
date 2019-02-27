/*global WM, ProgressBar, _*/
/*Directive for Number */

WM.module('wm.widgets.basic')
    .run(['$templateCache', function ($templateCache) {
        'use strict';
        $templateCache.put('template/widget/circle-progress.html',
            '<div init-widget apply-styles></div>'
        );
    }])
    .directive('wmProgressCircle', ['PropertiesFactory', 'WidgetUtilService', 'Utils', function (PropertiesFactory, WidgetUtilService, Utils) {
        'use strict';
        var widgetProps = PropertiesFactory.getPropertiesOf('wm.progress.circle', ['wm.base', 'wm.base.events']),
            notifyFor = {
                'datavalue'        : true,
                'title'            : true,
                'minvalue'         : true,
                'maxvalue'         : true,
                'type'             : true,
                'captionplacement' : true,
                'displayformat'    : true
            },
            /* map of type and classes to be applied*/
            CLASSES = {
                'default'        : '',
                'success'        : 'progress-circle-success',
                'info'           : 'progress-circle-info',
                'warning'        : 'progress-circle-warning',
                'danger'         : 'progress-circle-danger'
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

        function togglePercent($is) {
            var progressBar = getCircleProgressBar($is);
            var textClass;
            if(!progressBar.text) {
                return;
            }
            if (!$is.bindtitle && !$is.title) {
                textClass = _.includes($is.displayformat, '%') ? 'show-percent' : '';
            }
            progressBar.text.className = 'progress-text ' + textClass;
        }

        function getCircleProgressBar($is) {
            var progressBarEl;
            if (!$is.circularProgressbar) {
                progressBarEl = $is.$element;
                progressBarEl.empty();
                $is.circularProgressbar = new ProgressBar.Circle(progressBarEl[0], {
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
                    from: { color: '#333', value: $is.minvalue },
                    to: { color: '#333', value: $is.maxvalue },
                    // Set default step function for all animate calls
                    step: function(state, circle) {
                        var decimalCount, value;
                        if ($is.captionplacement !== 'inside') {
                            return;
                        }
                        decimalCount = getDecimalCount($is.displayformat);
                        value = $is.title || (circle.value() * 100).toFixed(decimalCount);
                        circle.setText(value);
                    }
                });
            }
            return $is.circularProgressbar;
        }

        function render($is) {
            var datavalue = $is.datavalue,
                percent = '',
                isPercentage = isPercentageValue(datavalue),
                progressBar = getCircleProgressBar($is);

            if (isPercentage) {
                datavalue = _.toNumber(datavalue.replace('%', ''));
                percent = datavalue / 100;
            } else {
                datavalue = _.toNumber(datavalue);
                percent = (datavalue - $is.minvalue) / ($is.maxvalue - $is.minvalue);
            }

            if ( _.isNaN(percent)) {
                percent = 0;
            } else {
                percent = percent > 1 ? 1 : (percent < 0 ? 0 : percent);
            }

            if (progressBar.text) {
                progressBar.text.style.color = null;
                progressBar.text.style.display = $is.captionplacement === 'inside' ? 'block' : 'none';
            }
            togglePercent($is);
            progressBar.animate(percent);
        }

        function propertyChangeHandler($is, element, key, nv, ov) {
            switch (key) {
                case 'type':
                    element.removeClass(CLASSES[ov]).addClass(CLASSES[nv]);
                    break;
                case 'hint':
                    element.attr('title', nv);
                case 'datavalue':
                case 'minvalue':
                case 'maxvalue':
                case 'title':
                case 'captionplacement':
                    debouncedRender($is);
                    break;
                case 'displayformat':
                    debouncedRender($is);
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
                    // adding default class through script to avoid showing them in the "class name" property of widget.
                    element.addClass('progress app-progress circle');
                    debouncedRender = _.debounce(render, 100);
                    WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is, element), $is, notifyFor);
                    WidgetUtilService.postWidgetCreate($is, element, attrs);
                }
            }
        };
    }]);