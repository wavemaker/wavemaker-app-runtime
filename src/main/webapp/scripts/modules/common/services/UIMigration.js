/*global wm, WM*/
wm.modules.wmCommon.services.UIMigration = [
    'CONSTANTS',

    function (CONSTANTS) {
        'use strict';

        var pageContainerWidgets = [
                'wm-footer',
                'wm-header',
                'wm-left-panel',
                'wm-right-panel',
                'wm-top-nav',
                'wm-accordioncontent',
                'wm-container',
                'wm-tile',
                'wm-breadcrumb',
                'wm-panel',
                'wm-panel-footer',
                'wm-tabcontent'
            ];

        /* for the page container widgets change the attribute-name from `page` to `content` */
        function task1(markup) {
            markup.find(pageContainerWidgets.join(', '))
                .each(function () {
                    var el = this,
                        hasPageAttr = el.hasAttribute('page'),
                        hasContentAttr = el.hasAttribute('content');

                    if (hasPageAttr) {
                        if (!hasContentAttr) {
                            el.setAttribute('content', el.getAttribute('page'));
                        }
                        el.removeAttribute('page');
                    }
                });

            return markup;
        }

        /* for wm-tabs node change the remove `vertical` attibute and add `tabsposition` attribute */
        function task2(markup) {
            markup.find('wm-tabs')
                .each(function () {
                    var el = this;

                    if (el.hasAttribute('vertical')) {
                        if (el.getAttribute('vertical') === 'true' && !el.hasAttribute('tabsposition')) {
                            el.setAttribute('tabsposition', 'left');
                        }
                        el.removeAttribute('vertical');
                    }
                });

            return markup;
        }


        /* wm-livelist and wm-login elements will have ngController directive this will result in
         * error:multidir Multiple Directive Resource Contention
         * to resolve this issue,
         * RunMode: remove the ngController directive from the element and add a wrapper with the controller name
         * StudioMode: remove the ngController directive
         */
        function task3(markup, isIncludedPage) {
            if (!CONSTANTS.isStudioMode || !isIncludedPage) {
                return markup;
            }
            // remove data-ng-controller attribute from wm-livelist and wm-login widgets
            markup.find('wm-livelist, wm-login, wm-template')
                .each(function () {
                    WM.element(this).removeAttr('data-ng-controller ng-controller');
                });

            return markup;
        }


        function task4(markup) {
            if (!CONSTANTS.isRunMode) {
                return markup;
            }
            // remove data-ng-controller attribute from wm-livelist and wm-login widgets
            markup.find('wm-livelist, wm-login, wm-template')
                .each(function () {
                    var widget = WM.element(this),
                        wrapper,
                        ctrlName = widget.attr('data-ng-controller') || widget.attr('ng-controller');

                    if (ctrlName) {
                        wrapper = WM.element('<div class="app-controller"></div>').attr('data-ng-controller', ctrlName);
                        widget.removeAttr('data-ng-controller ng-controller').wrap(wrapper);
                    }
                });

            return markup;
        }

        this.run = function (markup, isIncludedPage, processRoot) {
            var dummyRoot = markup;

            if (processRoot) {
                dummyRoot = WM.element('<div></div>');
                dummyRoot.append(markup);
            }

            task1(dummyRoot);
            task2(dummyRoot);
            task3(dummyRoot, isIncludedPage);
            task4(dummyRoot);

            if (processRoot) {
                return dummyRoot.children();
            }

            return dummyRoot;
        };
    }
];