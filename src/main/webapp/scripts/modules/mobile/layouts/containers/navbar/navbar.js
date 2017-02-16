/*global WM, _ */
/*Directive for Navbar*/

WM.module('wm.layouts.containers')
    .run(['$templateCache', function ($tc) {
        'use strict';

        $tc.put('template/layouts/containers/mobile/navbar.html',
            '<header data-role="mobile-navbar" init-widget listen-property="dataset" class="app-header app-mobile-navbar {{class}}" apply-styles>' +
                '<nav class="navbar" ng-show="!showSearchbar">' +
                    '<div class="mobile-navbar-left">' +
                        '<ul class="nav navbar-nav navbar-left">' +
                            '<li ng-if="showLeftnav" >' +
                                '<a ng-click="leftNavPanel.toggle();">' +
                                    '<i ng-class="leftnavpaneliconclass"></i>' +
                                '</a>' +
                            '</li>' +
                            '<li ng-if="backbutton">' +
                                '<a class="btn-back" type="button" ng-click="goBack($event)">' +
                                    '<i ng-class="backbuttoniconclass"></i><span>{{backbuttonlabel}}</span>' +
                                '</a>' +
                            '</li>' +
                        '</ul>' +
                    '</div>' +
                    '<div class="mobile-navbar-center">' +
                        '<div class="navbar-header">' +
                            '<h1 class="navbar-brand">' +
                                '<img data-identifier="img" class="brand-image" alt="{{title}}" width="32" height="32" ng-if="imgsrc" ng-src="{{imagesrc}}"/>' +
                                '<span class="title">{{title}}</span>' +
                            '</h1>' +
                        '</div>' +
                    '</div>' +
                    '<div class="mobile-navbar-right">' +
                        '<ul class="nav navbar-nav navbar-right">' +
                            '<li wmtransclude></li>' +
                            '<li ng-if="searchbutton">' +
                                '<a class="btn-search btn-transparent" type="button" ng-click="showSearchBar();">' +
                                    '<i ng-class="searchbuttoniconclass"></i><span>{{searchbuttonlabel}}</span>' +
                                '</a>' +
                            '</li>' +
                        '</ul>' +
                    '</div>' +
                '</nav>' +
                '<nav class="navbar searchbar" ng-if="showSearchbar">' +
                    '<div class="mobile-navbar-left">' +
                        '<ul class="nav navbar-nav navbar-left">' +
                            '<li>' +
                                '<a class="btn-back" type="button" ng-click="goBacktoPreviousView($event)">' +
                                    '<i ng-class="backbuttoniconclass"></i>' +
                                '</a>' +
                            '</li>' +
                        '</ul>' +
                    '</div>' +
                    '<div class="mobile-navbar-center search-container">' +
                        '<wm-search scopedataset="_dataset" searchkey="{{searchkey}}" displaylabel="{{displaylabel}}" datafield="{{datafield}}" displayimagesrc="{{displayimagesrc}}" datavalue="bind:datavalue" on-submit="onSubmission($event)" placeholder="{{searchplaceholder}}" navsearchbar="true" readonly="{{readonlySearchBar}}"></wm-search>' +
                    '</div>' +
                    '<div class="mobile-navbar-right">' +
                        '<ul class="nav navbar-nav navbar-right">' +
                            '<li>' +
                                '<a class="btn-cancel btn-transparent" type="button" ng-click="goBacktoPreviousView($event);"> Cancel </a>' +
                            '</li>' +
                        '</ul>' +
                    '</div>' +
                '</nav>' +
            '</header>'
            );
    }])
    .directive('wmMobileNavbar', [
        '$templateCache',
        'PropertiesFactory',
        'WidgetUtilService',
        'CONSTANTS',
        'Utils',
        'NavigationService',
        '$window',

        function ($templateCache, PropertiesFactory, WidgetUtilService, CONSTANTS, Utils, NavigationService, $window) {
            'use strict';

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.layouts.mobile.navbar', ['wm.base']),
                notifyFor = {
                    'imgsrc'         : true,
                    'dataset'        : true,
                    'searchkey'      : true,
                    'displaylabel'   : true,
                    'displayimagesrc': true,
                    'defaultview'    : true
                };

            // update the query and datavalue before submit.
            function onSubmit($is, $el, event) {
                var $searchEle     = $el.find('.app-mobile-search'),
                    $searchElScope = $searchEle.isolateScope();

                $is.query       = $searchElScope.query;
                $is.datavalue   = $searchElScope.datavalue;
                if ($is.onSearch) {
                    $is.onSearch({$event: event, $scope: $is});
                }
            }

            // set the show property for the search related properties
            function enableWidgetProps($is, wp, bool) {
                wp.searchbuttoniconclass.show     = wp.searchbuttonlabel.show =
                    wp.searchplaceholder.show     = wp.scopedatavalue.show    =
                    wp.scopedataset.show          = wp.dataset.show           =
                    wp.searchkey.show             = wp.displaylabel.show      =
                    wp.displayimagesrc.show       = wp.datafield.show         =
                    wp.datavalue.show             =  bool;
                if ($is.active) {
                    $is.$emit('wms:refresh-properties-panel');
                }
            }

            // switches the view based on defaultview
            function switchView($is, view) {
                $is.showSearchbar = (view !== 'actionview');
            }

            // go to the previous visited page.
            function goBack(attrs, $is, $event) {
                if (attrs.onBackbtnclick && $is.onBackbtnclick) {
                    $is.onBackbtnclick({'$event' : $event, '$scope' : $is});
                } else if (CONSTANTS.hasCordova) {
                    $window.history.go(-1);
                } else {
                    NavigationService.goToPrevious();
                }
            }

            // enable the search view
            function showSearchBar($is) {
                $is.showSearchbar = true;
            }

            //goto previous view or page
            function goBacktoPreviousView($is, $event) {
                if ($is.defaultview === 'actionview') {
                    // switches the view from search to action or actio to search.
                    $is.switchView('actionview');
                } else {
                    // goes back to the previous visited page.
                    $is.goBack($event);
                }
            }

            // Define the property change handler. This function will be triggered when there is a change in the widget property
            function propertyChangeHandler($is, key, newVal) {
                switch (key) {
                case 'imgsrc':
                    $is.imagesrc = Utils.getImageUrl(newVal);
                    break;
                case 'dataset':
                    $is._dataset = newVal.data;
                    break;
                case 'defaultview':
                    $is.showSearchbar = (newVal === 'searchview');

                    // show the search related properties only if default view is searchview.
                    if ($is.widgetid) {
                        var wp = $is.widgetProps;
                        enableWidgetProps($is, wp, newVal === 'searchview');
                    }
                    break;
                }
            }

            return {
                'restrict'  : 'E',
                'replace'   : true,
                'scope'     : {},
                'transclude': true,
                'template'  : $templateCache.get('template/layouts/containers/mobile/navbar.html'),
                'link'      : {
                    'pre' : function ($is) {
                        // Applying widget properties to directive scope
                        $is.widgetProps   = widgetProps;
                        $is.showSearchbar = false;
                        $is.readonlySearchBar = CONSTANTS.isStudioMode ? true : false;
                    },
                    'post': function ($is, $el, attrs) {
                        $is.leftNavPanel = ($el.closest('.app-page').find('.app-left-panel:first')).isolateScope();

                        if ($is.leftNavPanel) {
                            $is.showLeftnav = attrs.showLeftnav !== 'false';
                        }

                        if (CONSTANTS.isRunMode) {
                            $is.goBack = goBack.bind(undefined, attrs, $is);

                            $is.switchView = switchView.bind(undefined, $is);

                            $is.goBacktoPreviousView = goBacktoPreviousView.bind(undefined, $is);

                            $is.showSearchBar = showSearchBar.bind(undefined, $is);

                            // this function is called when searchquery is submitted.
                            $is.onSubmission = onSubmit.bind(undefined, $is, $el);
                        }

                        // Register the property change handler
                        WidgetUtilService.registerPropertyChangeListener(propertyChangeHandler.bind(undefined, $is), $is, notifyFor);
                        /*Cleaning the widget markup such that the widget wrapper is not cluttered with unnecessary property or
                         * style declarations.*/
                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }]);

/**
 * @ngdoc directive
 * @name wm.layouts.containers.directive:wmMobileNavbar
 * @restrict E
 * @element ANY
 * @description
 * The 'wmMobileNavbar' directive defines a dynamic navigation bar for a mobile applicatino.
 * wmNavbar is internally used by wmTopNav.
 *
 * @param {string=} title
 *                  Title to show at the center.
 * @param {string=} name
 *                  Name of the navbar.
 * @param {string=} height
 *                  Height of the navabr.
 * @param {string=} backbutton
 *                  if true, back button will be shown. Default true.
 * @param {string=} backbuttonlabel
 *                  back button label.
 * @param {string=} searchbutton
 *                  if true, search button will be shown. Default false.
 * @param {string=} searchbuttonlabel
 *                  search button label.
 * @param {string=} searchplaceholder
 *                  search placeholder.
 * @param {string=} show
 *                  This property determines whether or not the navbar is visible. This property is a bindable property.
 * @param {string=} defaultview
 *                  This property shows searchbar if set to search-view and shows actionbar if set to action-view.
 * @param {string=} searchquery
 *                  This property is an outbound property. It contains the search query.
 * @param {string=} scopedataset
 *                  The script variable that contains the data to be provided to the search widget, that can be searched onto.
 * @param {string=} dataset
 *                  The data to be provided the search widget from a live variable or the property panel, that can be searched onto. <br>
 *                  This is a bindable property.
 * @param {string=} searchkey
 *                  The key to be searched in the data provided to the searchbar.
 * @param {string=} displaylabel
 *                  The property to be displayed in the search auto-complete.
 * @param {string=} imagesource
 *                  This property sets the image to be displayed in the search results.
 * @param {string=} datafield
 *                  This property sets the dataValue to be returned by a select editor when the list is populated using the dataSet property.
 * @param {string=} datavalue
 *                  This property sets the default text to the searchbar. Outbound datavalue property contains the search result.
 * @param {string=} onBackbtnclick
 *                  Callback function which will be triggered after the backbutton click.
 * @param {string=} onSearch
 *                  Callback function which will be triggered after the search.
 *
 * @example
 <example module="wmCore">
 <file name="index.html">
     <div ng-controller="Ctrl" class="wm-app">
     <wm-top-nav>
         <wm-mobile-navbar title="XMobile" fontweight="bold" fontsize="2" fontunit="em" padding="5px 0 0 0">
            <wm-button caption="Users" type="button" iconclass="wi wi-trash"></wm-button>
         </wm-mobile-navbar>
     </wm-top-nav>
     </div>
 </file>
 <file name="script.js">
 function Ctrl($scope) {}
 </file>
 </example>
 */





