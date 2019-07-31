/*global module,require*/
module.exports = function (grunt) {
    'use strict';

    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var wmBuildConfig = {
        scripts: 'scripts',
        application: 'application',
        editor: 'editor',
        mobile: 'mobile',
        styles: 'styles',
        components: 'components',
        tmp: 'tmp'
    };

    grunt.initConfig({
        config: wmBuildConfig,
        clean: {
            build: {
                files: [
                    {
                        dot: true,
                        src: [
                            '<%= config.application %>/*',
                            '<%= config.mobile %>/*',
                            '<%= config.editor %>/*',
                            '<%= config.tmp %>/*'
                        ]
                    }
                ]
            }
        },
        concurrent: {
            target1: [
                'uglify:min-mangle-true',
                'uglify:min-mangle-false-studio',
                'uglify:min-mangle-false-application',
                'cssmin'
            ]
        },
        less: {
            dev: {
                files: {
                    '<%= config.tmp %>/styles/css/wm-style.css': '<%= config.styles %>/less/wm-runtime.less',
                    '<%= config.tmp %>/styles/css/wm-responsive.css': '<%= config.styles %>/less/wm-responsive.less'
                }
            }
        },
        copy: {
            for_runtime_application_folder: {
                files: [
                    {
                        cwd: '<%= config.components %>/summernote/dist/font',
                        src: '*',
                        expand: true,
                        dest: '<%= config.application %>/styles/css/font'
                    },
                    {
                        src: '<%= config.styles %>/images/spinner-small.gif',
                        dest: '<%= config.application %>/styles/images/spinner-small.gif'
                    },
                    {
                        src: '<%= config.styles %>/images/loader.gif',
                        dest: '<%= config.application %>/styles/images/loader.gif'
                    },
                    {
                        src: '<%= config.styles %>/images/ui-icons.png',
                        dest: '<%= config.application %>/styles/images/ui-icons.png'
                    },
                    {
                        cwd: '<%= config.components %>/bootstrap/fonts',
                        src: '*',
                        expand: true,
                        dest: '<%= config.application %>/styles/fonts'
                    },
                    {
                        cwd: '<%= config.components %>/font-awesome/fonts',
                        src: '*',
                        expand: true,
                        dest: '<%= config.application %>/styles/fonts'
                    },
                    {
                        cwd: '<%= config.components %>/wavicon/fonts',
                        src: '*',
                        expand: true,
                        dest: '<%= config.application %>/styles/fonts'
                    },
                    {
                        cwd: '<%= config.components %>/wmsicon/fonts',
                        src: '*',
                        expand: true,
                        dest: '<%= config.application %>/styles/fonts'
                    },
                    {
                        cwd: '<%= config.components %>/bootstrap/css',
                        src: 'bootstrap.css.map',
                        expand: true,
                        dest: '<%= config.application %>/styles/css/'
                    },
                    {
                        cwd: '<%= config.components %>/jquery-ui/themes/images',
                        src: '*',
                        expand: true,
                        dest: '<%= config.application %>/styles/css/images'
                    },
                    /*For mobile*/
                    {
                        src: '<%= config.styles %>/images/spinner-small.gif',
                        dest: '<%= config.mobile %>/styles/images/spinner-small.gif'
                    },
                    {
                        src: '<%= config.styles %>/images/loader.gif',
                        dest: '<%= config.mobile %>/styles/images/loader.gif'
                    },
                    {
                        src: '<%= config.styles %>/images/ui-icons.png',
                        dest: '<%= config.mobile %>/styles/images/ui-icons.png'
                    },
                    {
                        cwd: '<%= config.components %>/bootstrap/fonts',
                        src: '*',
                        expand: true,
                        dest: '<%= config.mobile %>/styles/fonts'
                    },
                    {
                        cwd: '<%= config.components %>/font-awesome/fonts',
                        src: '*',
                        expand: true,
                        dest: '<%= config.mobile %>/styles/fonts'
                    },
                    {
                        cwd: '<%= config.components %>/wavicon/fonts',
                        src: '*',
                        expand: true,
                        dest: '<%= config.mobile %>/styles/fonts'
                    },
                    {
                        cwd: '<%= config.components %>/bootstrap/css',
                        src: 'bootstrap.css.map',
                        expand: true,
                        dest: '<%= config.mobile %>/styles/css/'
                    },
                    {
                        cwd: '<%= config.components %>/jquery-ui/themes/images',
                        src: '*',
                        expand: true,
                        dest: '<%= config.mobile %>/styles/css/images'
                    },
                    {
                        src : '<%= config.tmp %>/scripts/wm-application-libs.min.js',
                        dest : '<%= config.application %>/scripts/wm-libs.min.js'
                    },
                    {
                        src : '<%= config.tmp %>/scripts/component-libs/chart.min.js',
                        dest : '<%= config.application %>/scripts/component-libs/chart.min.js'
                    },
                    {
                        src : '<%= config.tmp %>/scripts/component-libs/richTextEditor.min.js',
                        dest : '<%= config.application %>/scripts/component-libs/richTextEditor.min.js'
                    },
                    {
                        src : '<%= config.tmp %>/scripts/component-libs/calendar.min.js',
                        dest : '<%= config.application %>/scripts/component-libs/calendar.min.js'
                    },
                    {
                        src : '<%= config.tmp %>/scripts/component-libs/chart.min.js',
                        dest : '<%= config.mobile %>/scripts/component-libs/chart.min.js'
                    },
                    {
                        src : '<%= config.tmp %>/scripts/component-libs/richTextEditor.min.js',
                        dest : '<%= config.mobile %>/scripts/component-libs/richTextEditor.min.js'
                    },
                    {
                        src : '<%= config.tmp %>/scripts/component-libs/calendar.min.js',
                        dest : '<%= config.mobile %>/scripts/component-libs/calendar.min.js'
                    },
                    {
                        src : '<%= config.tmp %>/scripts/wm-mobile-libs.min.js',
                        dest : '<%= config.mobile %>/scripts/wm-libs.min.js'
                    },
                    {
                        src : '<%= config.tmp %>/styles/css/wm-style.css',
                        dest : '<%= config.application %>/styles/css/wm-style.css'
                    },
                    {
                        src : '<%= config.tmp %>/styles/css/wm-style.css',
                        dest : '<%= config.mobile %>/styles/css/wm-style.css'
                    },
                    {
                        src : '<%= config.tmp %>/styles/css/wm-responsive.css',
                        dest : '<%= config.application %>/styles/css/wm-responsive.css'
                    },
                    {
                        src : '<%= config.tmp %>/styles/css/wm-responsive.css',
                        dest : '<%= config.mobile %>/styles/css/wm-responsive.css'
                    }


                ]
            }
        },
        bower: {
            install: {
                options: {
                    targetDir: './components',
                    layout: 'byComponent',
                    install: true,
                    verbose: false,
                    cleanTargetDir: true,
                    cleanBowerDir: false
                }
            }
        },
        karma: {
            unit: {
                configFile: './test/karma-unit.config.js',
                autoWatch: false,
                singleRun: true
            }
        },
        uglify: {
            'min-mangle-true': {
                options: {
                    mangle: true,
                    preserveComments: false,
                    report: 'min',
                    sourceMap: false
                },
                files: {
                    '<%= config.tmp %>/scripts/wm-application-libs.min.js': ['<%= config.tmp %>/scripts/wm-application-libs.min.js'],
                    '<%= config.tmp %>/scripts/wm-mobile-libs.min.js': ['<%= config.tmp %>/scripts/wm-mobile-libs.min.js']
                }
            },
            'min-mangle-false-studio' : {
                options: {
                    mangle: false,
                    preserveComments: false,
                    report: 'min',
                    sourceMap: false
                },
                files: {
                    '<%= config.editor %>/application/scripts/runtimeloader.min.js' : ['<%= config.editor %>/application/scripts/runtimeloader.js'],
                    '<%= config.editor %>/mobile/scripts/mobileruntimeloader.min.js' : ['<%= config.editor %>/mobile/scripts/mobileruntimeloader.js']
                }
            },
            'min-mangle-false-application' : {
                options: {
                    mangle: false,
                    preserveComments: false,
                    report: 'min',
                    sourceMap: false
                },
                files: {
                    '<%= config.application %>/scripts/wm-loader.min.js' : ['<%= config.application %>/scripts/wm-loader.min.js'],
                    '<%= config.mobile %>/scripts/wm-mobileloader.min.js' : ['<%= config.mobile %>/scripts/wm-mobileloader.min.js']
                }
            }
        },
        cssmin: {
            combine: {
                options: {
                    keepSpecialComments: 0,
                    report: 'min'
                },
                'files': {
                    '<%= config.tmp %>/styles/css/wm-style.css': '<%= config.tmp %>/styles/css/wm-style.css',
                    '<%= config.tmp %>/styles/css/wm-responsive.css': '<%= config.tmp %>/styles/css/wm-responsive.css'
                }
            }
        },
        concat: {
            'wm-loader': {
                nonull: true,
                files: {
                    '<%= config.application %>/scripts/wm-loader.min.js': [
                        '<%= config.editor %>/application/scripts/runtimeloader.js',
                        '<%= config.scripts %>/wmbootstrap.js'
                    ],
                    '<%= config.mobile %>/scripts/wm-mobileloader.min.js': [
                        '<%= config.editor %>/mobile/scripts/mobileruntimeloader.js',
                        '<%= config.scripts %>/wmbootstrap.js'
                    ],
                    '<%= config.tmp %>/scripts/component-libs/chart.min.js': [
                        '<%= config.components %>/nvd3/nv.d3.min.js'
                    ],
                    '<%= config.tmp %>/scripts/component-libs/richTextEditor.min.js': [
                        '<%= config.components %>/textAngular/js/textAngularSetup.js',
                        '<%= config.components %>/textAngular/js/textAngular-rangy.min.js',
                        '<%= config.components %>/textAngular/js/textAngular.js'
                    ],
                    '<%= config.tmp %>/scripts/component-libs/calendar.min.js': [
                        '<%= config.components %>/fullcalendar/fullcalendar.min.js'
                    ],
                    '<%= config.tmp %>/scripts/jquery-ui.min.js': [
                        "<%= config.components %>/jquery-ui/js/core.js",
                        "<%= config.components %>/jquery-ui/js/widget.js",
                        "<%= config.components %>/jquery-ui/js/mouse.js",
                        "<%= config.components %>/jquery-ui/js/draggable.js",
                        "<%= config.components %>/jquery-ui/js/droppable.js",
                        "<%= config.components %>/jquery-ui/js/position.js",
                        "<%= config.components %>/jquery-ui/js/sortable.js",
                        "<%= config.components %>/jquery-ui/js/resizable.js",
                        "<%= config.components %>/jquery-ui/js/selectable.js",
                        "<%= config.components %>/jquery-ui/js/autocomplete.js",
                        "<%= config.components %>/jquery-ui/js/button.js",
                        "<%= config.components %>/jquery-ui/js/menu.js",
                        "<%= config.components %>/jquery-ui/js/selectmenu.js",
                        "<%= config.components %>/jquery-ui/js/slider.js",
                        "<%= config.components %>/jquery-ui/js/tooltip.js"
                    ],
                    '<%= config.tmp %>/scripts/wm-application-libs.min.js': [
                        '<%= config.components %>/lodash/lodash.js',
                        '<%= config.components %>/jquery/jquery.js',
                        '<%= config.tmp %>/scripts/jquery-ui.min.js',
                        '<%= config.components %>/d3/d3.min.js',
                        '<%= config.components %>/progressbar.js/progressbar.js',
                        '<%= config.components %>/angular/angular.js',
                        '<%= config.components %>/angular-route/angular-route.js',
                        '<%= config.components%>/angular-cookies/angular-cookies.js',
                        '<%= config.components %>/angular-animate/angular-animate.js',
                        '<%= config.components %>/angular-toaster/toaster.js',
                        '<%= config.components %>/angular-ui-bootstrap/ui-bootstrap-tpls.js',
                        '<%= config.scripts %>/lib-overrides.js',
                        '<%= config.components %>/textAngular/js/textAngular-sanitize.min.js',
                        '<%= config.components%>/angular-websocket/angular-websocket.min.js',
                        '<%= config.components %>/moment/moment.js',
                        '<%= config.components %>/angular-ui-mask/js/mask.min.js',
                        '<%= config.components %>/angular-ui-calendar/calendar.js',
                        '<%= config.components %>/angular-bootstrap-colorpicker/bootstrap-colorpicker-module.js',
                        //ocLazyLoad -- start
                        '<%= config.components %>/ocLazyLoad/js/ocLazyLoad.core.js',
                        '<%= config.components %>/ocLazyLoad/js/ocLazyLoad.loaders.common.js',
                        '<%= config.components %>/ocLazyLoad/js/ocLazyLoad.loaders.core.js',
                        '<%= config.components %>/ocLazyLoad/js/ocLazyLoad.loaders.cssLoader.js',
                        '<%= config.components %>/ocLazyLoad/js/ocLazyLoad.loaders.jsLoader.js',
                        //ocLazyLoad -- end
                        '<%= config.components %>/hammerjs/hammer.js',
                        '<%= config.components %>/iscroll/build/iscroll.js',
                        '<%= config.scripts %>/modules/swipey/swipey.jquery.plugin.js',
                        '<%= config.scripts %>/modules/gestures/gestures.js',
                        '<%= config.scripts %>/modules/base64/base64.js',
                        '<%= config.scripts %>/modules/xmlToJson/xmlToJson.js'
                    ],
                    '<%= config.tmp %>/scripts/wm-mobile-libs.min.js': [
                        '<%= config.components %>/lodash/lodash.js',
                        '<%= config.components %>/jquery/jquery.js',
                        '<%= config.tmp %>/scripts/jquery-ui.min.js',
                        '<%= config.components %>/d3/d3.min.js',
                        '<%= config.components %>/progressbar.js/progressbar.js',
                        '<%= config.components %>/angular/angular.js',
                        '<%= config.components %>/angular-route/angular-route.js',
                        '<%= config.components %>/angular-animate/angular-animate.js',
                        '<%= config.components%>/angular-cookies/angular-cookies.js',
                        '<%= config.components %>/angular-toaster/toaster.js',
                        '<%= config.components %>/angular-ui-bootstrap/ui-bootstrap-tpls.js',
                        '<%= config.scripts %>/lib-overrides.js',
                        '<%= config.components %>/textAngular/js/textAngular-sanitize.min.js',
                        '<%= config.components%>/angular-websocket/angular-websocket.min.js',
                        '<%= config.components %>/moment/moment.js',
                        '<%= config.components %>/angular-ui-mask/js/mask.min.js',
                        '<%= config.components %>/angular-ui-calendar/calendar.js',
                        '<%= config.components %>/angular-bootstrap-colorpicker/bootstrap-colorpicker-module.js',
                        //ocLazyLoad -- start
                        '<%= config.components %>/ocLazyLoad/js/ocLazyLoad.core.js',
                        '<%= config.components %>/ocLazyLoad/js/ocLazyLoad.loaders.common.js',
                        '<%= config.components %>/ocLazyLoad/js/ocLazyLoad.loaders.core.js',
                        '<%= config.components %>/ocLazyLoad/js/ocLazyLoad.loaders.cssLoader.js',
                        '<%= config.components %>/ocLazyLoad/js/ocLazyLoad.loaders.jsLoader.js',
                        //ocLazyLoad -- end
                        '<%= config.components %>/hammerjs/hammer.js',
                        '<%= config.components %>/iscroll/build/iscroll.js',
                        '<%= config.scripts %>/modules/swipey/swipey.jquery.plugin.js',
                        '<%= config.components %>/ngCordova/ng-cordova.js',
                        '<%= config.components %>/ng-cordova-oauth/ng-cordova-oauth.min.js',
                        '<%= config.scripts %>/modules/gestures/gestures.js',
                        '<%= config.scripts %>/modules/base64/base64.js',
                        '<%= config.scripts %>/modules/xmlToJson/xmlToJson.js'
                    ]
                }
            },
            'runtime-files': {
                nonull: true,
                files: {
                    '<%= config.editor %>/application/scripts/runtimeloader.js': [
                        '<%= config.scripts %>/config.js',
                        '<%= config.scripts %>/utils.js',
                        '<%= config.scripts %>/appDefaults.js',
                        '<%= config.scripts %>/previewConstants.js',
                        '<%= config.scripts %>/formatUtils.js',
                        '<%= config.scripts %>/liveWidgetUtils.js',
                        '<%= config.scripts %>/formWidgetUtils.js',
                        '<%= config.scripts %>/modules/common/config.js',
                        '<%= config.scripts %>/modules/common/services/baseServiceManager.js',
                        '<%= config.scripts %>/modules/common/services/baseService.js',
                        '<%= config.scripts %>/modules/common/services/fileService.js',
                        '<%= config.scripts %>/modules/common/services/fileUploadService.js',
                        '<%= config.scripts %>/modules/common/services/projectService.js',
                        '<%= config.scripts %>/modules/prefabs/services/prefabManager.js',
                        '<%= config.scripts %>/modules/variables/config.js',
                        '<%= config.scripts %>/modules/variables/application/base/basefactory.js',
                        '<%= config.scripts %>/modules/variables/application/base/baseservice.js',
                        '<%= config.scripts %>/modules/variables/application/base/variableService.js',
                        '<%= config.scripts %>/modules/variables/application/base/metaDataFactory.js',
                        '<%= config.scripts %>/modules/variables/application/basicvariable/basicvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/livevariable/livevariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/servicevariable/servicevariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/websocketvariable/websocketvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/navigationvariable/navigationvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/notificationvariable/notificationvariableservice.js',
                        '<%= config.scripts %>/modules/layouts/containers/accordion/accordion.js',
                        '<%= config.scripts %>/modules/layouts/containers/mediaList/mediaList.js',
                        '<%= config.scripts %>/modules/layouts/containers/form/form.js',
                        '<%= config.scripts %>/modules/layouts/containers/grid/layoutgrid.js',
                        '<%= config.scripts %>/modules/layouts/containers/breadcrumb/breadcrumb.js',
                        '<%= config.scripts %>/modules/layouts/containers/nav/nav.js',
                        '<%= config.scripts %>/modules/layouts/containers/navbar/navbar.js',
                        '<%= config.scripts %>/modules/layouts/containers/panel/panel.js',
                        '<%= config.scripts %>/modules/layouts/containers/card/card.js',
                        '<%= config.scripts %>/modules/layouts/containers/container/container.js',
                        '<%= config.scripts %>/modules/layouts/containers/tile/tile.js',
                        '<%= config.scripts %>/modules/layouts/containers/tabs/tabs.js',
                        '<%= config.scripts %>/modules/layouts/containers/wizard/wizard.js',
                        '<%= config.scripts %>/modules/layouts/device/services/deviceview.js',
                        '<%= config.scripts %>/modules/layouts/page/service/viewservice.js',
                        '<%= config.scripts %>/modules/layouts/page/column.js',
                        '<%= config.scripts %>/modules/layouts/page/pagecontent.js',
                        '<%= config.scripts %>/modules/layouts/page/content.js',
                        '<%= config.scripts %>/modules/layouts/page/footer.js',
                        '<%= config.scripts %>/modules/layouts/page/header.js',
                        '<%= config.scripts %>/modules/layouts/page/leftpanel.js',
                        '<%= config.scripts %>/modules/layouts/page/page.js',
                        '<%= config.scripts %>/modules/layouts/page/template.js',
                        '<%= config.scripts %>/modules/layouts/page/rightpanel.js',
                        '<%= config.scripts %>/modules/layouts/page/row.js',
                        '<%= config.scripts %>/modules/layouts/page/topnav.js',
                        '<%= config.scripts %>/modules/layouts/page/view.js',
                        '<%= config.scripts %>/modules/widgets/base/Base.js',
                        '<%= config.scripts %>/modules/widgets/base/initWidget.js',
                        '<%= config.scripts %>/modules/widgets/base/pageContainer.js',
                        '<%= config.scripts %>/modules/widgets/basic/anchor/anchor.js',
                        '<%= config.scripts %>/modules/widgets/basic/icon/icon.js',
                        '<%= config.scripts %>/modules/widgets/basic/htmlwidget/htmlwidget.js',
                        '<%= config.scripts %>/modules/widgets/basic/iframe/iframe.js',
                        '<%= config.scripts %>/modules/widgets/basic/label/label.js',
                        '<%= config.scripts %>/modules/widgets/basic/message/message.js',
                        '<%= config.scripts %>/modules/widgets/basic/picture/picture.js',
                        '<%= config.scripts %>/modules/widgets/basic/popover/popover.js',
                        '<%= config.scripts %>/modules/widgets/basic/video/video.js',
                        '<%= config.scripts %>/modules/widgets/basic/audio/audio.js',
                        '<%= config.scripts %>/modules/widgets/basic/search/search.js',
                        '<%= config.scripts %>/modules/widgets/basic/spinner/spinner.js',
                        '<%= config.scripts %>/modules/widgets/basic/spinner/spinnerService.js',
                        '<%= config.scripts %>/modules/widgets/basic/tree/tree.js',
                        '<%= config.scripts %>/modules/widgets/basic/chart/chart.js',
                        '<%= config.scripts %>/modules/widgets/basic/chart/chartService.js',
                        '<%= config.scripts %>/modules/widgets/basic/pagination/pagination.js',
                        '<%= config.scripts %>/modules/widgets/basic/wmtoaster/wmtoaster.js',
                        '<%= config.scripts %>/modules/widgets/basic/progressbar/progressbar.js',
                        '<%= config.scripts %>/modules/widgets/basic/progressbar/progressCircle.js',
                        '<%= config.scripts %>/modules/widgets/basic/progressbar/progressbarservice.js',
                        '<%= config.scripts %>/modules/widgets/table/datatable.js',
                        '<%= config.scripts %>/modules/widgets/dialog/dialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/alertdialog/alertdialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/confirmdialog/confirmdialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/controllers/dialogcontroller.js',
                        '<%= config.scripts %>/modules/widgets/dialog/controllers/notificationdialogcontroller.js',
                        '<%= config.scripts %>/modules/widgets/dialog/iframedialog/iframedialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/pagedialog/pagedialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/logindialog/logindialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/services/dialogservice.js',
                        '<%= config.scripts %>/modules/widgets/form/button/button.js',
                        '<%= config.scripts %>/modules/widgets/form/buttongroup/buttongroup.js',
                        '<%= config.scripts %>/modules/widgets/form/switch/switch.js',
                        '<%= config.scripts %>/modules/widgets/form/menu/menu.js',
                        '<%= config.scripts %>/modules/widgets/form/slider/slider.js',
                        '<%= config.scripts %>/modules/widgets/form/checkbox/checkbox.js',
                        '<%= config.scripts %>/modules/widgets/form/checkboxset/checkboxset.js',
                        '<%= config.scripts %>/modules/widgets/form/colorpicker/colorpicker.js',
                        '<%= config.scripts %>/modules/widgets/form/composite/compositecontainer.js',
                        '<%= config.scripts %>/modules/widgets/form/currency/currency.js',
                        '<%= config.scripts %>/modules/widgets/form/date/date.js',
                        '<%= config.scripts %>/modules/widgets/form/datetime/datetime.js',
                        '<%= config.scripts %>/modules/widgets/form/fileupload/fileupload.js',
                        '<%= config.scripts %>/modules/widgets/form/radio/radio.js',
                        '<%= config.scripts %>/modules/widgets/form/radioset/radioset.js',
                        '<%= config.scripts %>/modules/widgets/form/select/select.js',
                        '<%= config.scripts %>/modules/widgets/form/chips/chips.js',
                        '<%= config.scripts %>/modules/widgets/form/text/text.js',
                        '<%= config.scripts %>/modules/widgets/form/number/number.js',
                        '<%= config.scripts %>/modules/widgets/form/textarea/textarea.js',
                        '<%= config.scripts %>/modules/widgets/form/time/time.js',
                        '<%= config.scripts %>/modules/widgets/form/richtexteditor/richtexteditor.js',
                        '<%= config.scripts %>/modules/widgets/table/table.js',
                        '<%= config.scripts %>/modules/widgets/live/form/liveform.js',
                        '<%= config.scripts %>/modules/widgets/live/filter/livefilter.js',
                        '<%= config.scripts %>/modules/widgets/live/table/livetable.js',
                        '<%= config.scripts %>/modules/widgets/live/list/listTemplate.js',
                        '<%= config.scripts %>/modules/widgets/live/list/listActionTemplate.js',
                        '<%= config.scripts %>/modules/widgets/live/list/list.js',
                        '<%= config.scripts %>/modules/widgets/advanced/calendar/calendar.js',
                        '<%= config.scripts %>/modules/widgets/advanced/login/login.js',
                        '<%= config.scripts %>/modules/widgets/advanced/carousel/carousel.js',
                        '<%= config.scripts %>/modules/widgets/advanced/rating/rating.js',
                        '<%= config.scripts %>/modules/widgets/advanced/marquee/marquee.js',
                        '<%= config.scripts %>/modules/widgets/prefabs/prefabs.js',
                        '<%= config.scripts %>/modules/widgets/prefabs/prefab-container.js',
                        '<%= config.scripts %>/modules/plugins/database/config.js',
                        '<%= config.scripts %>/modules/plugins/database/application/services/querybuilder.js',
                        '<%= config.scripts %>/modules/plugins/database/application/services/databaseServices.js',
                        '<%= config.scripts %>/modules/plugins/modeldesigner/config.js',
                        '<%= config.scripts %>/modules/plugins/modeldesigner/application/services/modelServices.js',
                        '<%= config.scripts %>/modules/plugins/webservice/config.js',
                        '<%= config.scripts %>/modules/plugins/webservice/application/services/webServices.js',
                        '<%= config.scripts %>/modules/plugins/webservice/application/factories/servicefactory.js',
                        '<%= config.scripts %>/modules/plugins/security/config.js',
                        '<%= config.scripts %>/modules/plugins/security/application/services/securityservices.js',
                        '<%= config.scripts %>/modules/plugins/oAuth/config.js',
                        '<%= config.scripts %>/modules/plugins/oAuth/application/services/oAuthProviderService.js',
                        '<%= config.scripts %>/modules/variables/application/loginvariable/loginvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/logoutvariable/logoutVariableService.js',
                        '<%= config.scripts %>/modules/variables/application/timervariable/timervariableservice.js',
                        '<%= config.scripts %>/modules/i18n/config.js',
                        '<%= config.scripts %>/modules/i18n/services/i18nService.js',
                        '<%= config.scripts %>/modules/wmMobile.js',
                        '<%= config.scripts %>/modules/common/services/navigationService.js'

                    ],
                    '<%= config.editor %>/application/scripts/runtimeloader.min.js': [
                        '<%= config.editor %>/application/scripts/runtimeloader.js'
                    ]

                }
            },
            'mobile-runtime-files': { // mobile changes
                nonull: true,
                files: {
                    '<%= config.editor %>/mobile/scripts/mobileruntimeloader.js': [
                        '<%= config.scripts %>/config.js',
                        '<%= config.scripts %>/utils.js',
                        '<%= config.scripts %>/appDefaults.js',
                        '<%= config.scripts %>/previewConstants.js',
                        '<%= config.scripts %>/formatUtils.js',
                        '<%= config.scripts %>/liveWidgetUtils.js',
                        '<%= config.scripts %>/formWidgetUtils.js',
                        '<%= config.scripts %>/modules/common/config.js',
                        '<%= config.scripts %>/modules/common/services/baseServiceManager.js',
                        '<%= config.scripts %>/modules/common/services/baseService.js',
                        '<%= config.scripts %>/modules/common/services/fileService.js',
                        '<%= config.scripts %>/modules/common/services/fileUploadService.js',
                        '<%= config.scripts %>/modules/common/services/projectService.js',
                        '<%= config.scripts %>/modules/prefabs/services/prefabManager.js',
                        '<%= config.scripts %>/modules/variables/config.js',
                        '<%= config.scripts %>/modules/variables/application/base/basefactory.js',
                        '<%= config.scripts %>/modules/variables/application/base/baseservice.js',
                        '<%= config.scripts %>/modules/variables/application/base/variableService.js',
                        '<%= config.scripts %>/modules/variables/application/base/metaDataFactory.js',
                        '<%= config.scripts %>/modules/variables/application/basicvariable/basicvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/livevariable/livevariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/servicevariable/servicevariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/websocketvariable/websocketvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/navigationvariable/navigationvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/notificationvariable/notificationvariableservice.js',
                        '<%= config.scripts %>/modules/layouts/containers/accordion/accordion.js',
                        '<%= config.scripts %>/modules/layouts/containers/mediaList/mediaList.js',
                        '<%= config.scripts %>/modules/layouts/containers/form/form.js',
                        '<%= config.scripts %>/modules/layouts/containers/grid/layoutgrid.js',
                        '<%= config.scripts %>/modules/layouts/containers/nav/nav.js',
                        '<%= config.scripts %>/modules/layouts/containers/panel/panel.js',
                        '<%= config.scripts %>/modules/layouts/containers/card/card.js',
                        '<%= config.scripts %>/modules/layouts/containers/container/container.js',
                        '<%= config.scripts %>/modules/layouts/containers/tile/tile.js',
                        '<%= config.scripts %>/modules/layouts/containers/tabs/tabs.js',
                        '<%= config.scripts %>/modules/layouts/containers/wizard/wizard.js',
                        '<%= config.scripts %>/modules/layouts/page/service/viewservice.js',
                        '<%= config.scripts %>/modules/layouts/page/column.js',
                        '<%= config.scripts %>/modules/layouts/page/pagecontent.js',
                        '<%= config.scripts %>/modules/layouts/page/content.js',
                        '<%= config.scripts %>/modules/layouts/page/footer.js',
                        '<%= config.scripts %>/modules/layouts/page/header.js',
                        '<%= config.scripts %>/modules/layouts/page/leftpanel.js',
                        '<%= config.scripts %>/modules/layouts/page/page.js',
                        '<%= config.scripts %>/modules/layouts/page/template.js',
                        '<%= config.scripts %>/modules/layouts/page/rightpanel.js',
                        '<%= config.scripts %>/modules/layouts/page/row.js',
                        '<%= config.scripts %>/modules/layouts/page/topnav.js',
                        '<%= config.scripts %>/modules/layouts/page/view.js',
                        '<%= config.scripts %>/modules/widgets/base/Base.js',
                        '<%= config.scripts %>/modules/widgets/base/initWidget.js',
                        '<%= config.scripts %>/modules/widgets/base/pageContainer.js',
                        '<%= config.scripts %>/modules/widgets/basic/anchor/anchor.js',
                        '<%= config.scripts %>/modules/widgets/basic/icon/icon.js',
                        '<%= config.scripts %>/modules/widgets/basic/htmlwidget/htmlwidget.js',
                        '<%= config.scripts %>/modules/widgets/basic/label/label.js',
                        '<%= config.scripts %>/modules/widgets/basic/message/message.js',
                        '<%= config.scripts %>/modules/widgets/basic/picture/picture.js',
                        '<%= config.scripts %>/modules/widgets/basic/popover/popover.js',
                        '<%= config.scripts %>/modules/widgets/basic/video/video.js',
                        '<%= config.scripts %>/modules/widgets/basic/audio/audio.js',
                        '<%= config.scripts %>/modules/widgets/basic/search/search.js',
                        '<%= config.scripts %>/modules/widgets/basic/spinner/spinner.js',
                        '<%= config.scripts %>/modules/widgets/basic/spinner/spinnerService.js',
                        '<%= config.scripts %>/modules/widgets/basic/tree/tree.js',
                        '<%= config.scripts %>/modules/widgets/basic/chart/chart.js',
                        '<%= config.scripts %>/modules/widgets/basic/chart/chartService.js',
                        '<%= config.scripts %>/modules/widgets/basic/pagination/pagination.js',
                        '<%= config.scripts %>/modules/widgets/basic/wmtoaster/wmtoaster.js',
                        '<%= config.scripts %>/modules/widgets/basic/progressbar/progressbar.js',
                        '<%= config.scripts %>/modules/widgets/basic/progressbar/progressCircle.js',
                        '<%= config.scripts %>/modules/widgets/basic/progressbar/progressbarservice.js',
                        '<%= config.scripts %>/modules/widgets/table/datatable.js',
                        '<%= config.scripts %>/modules/widgets/dialog/dialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/alertdialog/alertdialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/confirmdialog/confirmdialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/controllers/dialogcontroller.js',
                        '<%= config.scripts %>/modules/widgets/dialog/controllers/notificationdialogcontroller.js',
                        '<%= config.scripts %>/modules/widgets/dialog/logindialog/logindialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/services/dialogservice.js',
                        '<%= config.scripts %>/modules/widgets/form/button/button.js',
                        '<%= config.scripts %>/modules/widgets/form/buttongroup/buttongroup.js',
                        '<%= config.scripts %>/modules/widgets/form/switch/switch.js',
                        '<%= config.scripts %>/modules/widgets/form/menu/menu.js',
                        '<%= config.scripts %>/modules/widgets/form/slider/slider.js',
                        '<%= config.scripts %>/modules/widgets/form/checkbox/checkbox.js',
                        '<%= config.scripts %>/modules/widgets/form/checkboxset/checkboxset.js',
                        '<%= config.scripts %>/modules/widgets/form/colorpicker/colorpicker.js',
                        '<%= config.scripts %>/modules/widgets/form/composite/compositecontainer.js',
                        '<%= config.scripts %>/modules/widgets/form/currency/currency.js',
                        '<%= config.scripts %>/modules/widgets/form/date/date.js',
                        '<%= config.scripts %>/modules/widgets/form/datetime/datetime.js',
                        '<%= config.scripts %>/modules/widgets/form/fileupload/fileupload.js',
                        '<%= config.scripts %>/modules/widgets/form/radio/radio.js',
                        '<%= config.scripts %>/modules/widgets/form/radioset/radioset.js',
                        '<%= config.scripts %>/modules/widgets/form/select/select.js',
                        '<%= config.scripts %>/modules/widgets/form/chips/chips.js',
                        '<%= config.scripts %>/modules/widgets/form/text/text.js',
                        '<%= config.scripts %>/modules/widgets/form/number/number.js',
                        '<%= config.scripts %>/modules/widgets/form/textarea/textarea.js',
                        '<%= config.scripts %>/modules/widgets/form/time/time.js',
                        '<%= config.scripts %>/modules/widgets/form/richtexteditor/richtexteditor.js',
                        '<%= config.scripts %>/modules/widgets/table/table.js',
                        '<%= config.scripts %>/modules/widgets/live/form/liveform.js',
                        '<%= config.scripts %>/modules/widgets/live/filter/livefilter.js',
                        '<%= config.scripts %>/modules/widgets/live/table/livetable.js',
                        '<%= config.scripts %>/modules/widgets/live/list/listTemplate.js',
                        '<%= config.scripts %>/modules/widgets/live/list/listActionTemplate.js',
                        '<%= config.scripts %>/modules/widgets/live/list/list.js',
                        '<%= config.scripts %>/modules/widgets/advanced/calendar/calendar.js',
                        '<%= config.scripts %>/modules/widgets/advanced/login/login.js',
                        '<%= config.scripts %>/modules/widgets/advanced/carousel/carousel.js',
                        '<%= config.scripts %>/modules/widgets/advanced/rating/rating.js',
                        '<%= config.scripts %>/modules/widgets/advanced/marquee/marquee.js',
                        '<%= config.scripts %>/modules/widgets/prefabs/prefabs.js',
                        '<%= config.scripts %>/modules/plugins/database/config.js',
                        '<%= config.scripts %>/modules/plugins/database/application/services/querybuilder.js',
                        '<%= config.scripts %>/modules/plugins/database/application/services/databaseServices.js',
                        '<%= config.scripts %>/modules/plugins/modeldesigner/config.js',
                        '<%= config.scripts %>/modules/plugins/modeldesigner/application/services/modelServices.js',
                        '<%= config.scripts %>/modules/plugins/webservice/config.js',
                        '<%= config.scripts %>/modules/plugins/webservice/application/services/webServices.js',
                        '<%= config.scripts %>/modules/plugins/webservice/application/factories/servicefactory.js',
                        '<%= config.scripts %>/modules/plugins/security/config.js',
                        '<%= config.scripts %>/modules/plugins/security/application/services/securityservices.js',
                        '<%= config.scripts %>/modules/plugins/oAuth/config.js',
                        '<%= config.scripts %>/modules/plugins/oAuth/application/services/oAuthProviderService.js',
                        '<%= config.scripts %>/modules/variables/application/loginvariable/loginvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/logoutvariable/logoutVariableService.js',
                        '<%= config.scripts %>/modules/variables/application/timervariable/timervariableservice.js',
                        '<%= config.scripts %>/modules/i18n/config.js',
                        '<%= config.scripts %>/modules/i18n/services/i18nService.js',
                        //Mobile Specific files start
                        '<%= config.scripts %>/modules/mobile/wmMobile.js',
                        '<%= config.scripts %>/modules/mobile/common/directives/imageCache.js',
                        '<%= config.scripts %>/modules/mobile/common/directives/smoothScroll.js',
                        '<%= config.scripts %>/modules/mobile/common/services/appAutoUpdateService.js',
                        '<%= config.scripts %>/modules/mobile/common/services/cookieService.js',
                        '<%= config.scripts %>/modules/mobile/common/services/networkService.js',
                        '<%= config.scripts %>/modules/mobile/common/services/deviceService.js',
                        '<%= config.scripts %>/modules/mobile/common/services/deviceFileService.js',
                        '<%= config.scripts %>/modules/mobile/common/services/deviceFileCacheService.js',
                        '<%= config.scripts %>/modules/mobile/common/services/deviceFileOpenerService.js',
                        '<%= config.scripts %>/modules/mobile/common/services/deviceFileDownloadService.js',
                        '<%= config.scripts %>/modules/mobile/common/services/extAppMessageService.js',
                        '<%= config.scripts %>/modules/mobile/common/services/fileSelectorService.js',
                        '<%= config.scripts %>/modules/common/services/navigationService.js',
                        '<%= config.scripts %>/modules/mobile/layouts/device/services/deviceview.js',
                        '<%= config.scripts %>/modules/mobile/variables/calendar/calendar.js',
                        '<%= config.scripts %>/modules/mobile/variables/contacts/contacts.js',
                        '<%= config.scripts %>/modules/mobile/variables/device/device.js',
                        '<%= config.scripts %>/modules/mobile/variables/camera/camera.js',
                        '<%= config.scripts %>/modules/mobile/variables/datasync/datasync.js',
                        '<%= config.scripts %>/modules/mobile/variables/file/file.js',
                        '<%= config.scripts %>/modules/mobile/variables/deviceVariable/deviceVariableService.js',
                        '<%= config.scripts %>/modules/mobile/variables/scan/scan.js',
                        '<%= config.scripts %>/modules/mobile/layouts/containers/navbar/navbar.js',
                        '<%= config.scripts %>/modules/mobile/layouts/containers/segmented/segmented.js',
                        '<%= config.scripts %>/modules/mobile/layouts/containers/tabbar/tabbar.js',
                        '<%= config.scripts %>/modules/mobile/layouts/page/leftpanel.js',
                        '<%= config.scripts %>/modules/mobile/layouts/page/page.js',
                        '<%= config.scripts %>/modules/mobile/widgets/advanced/networkInfoToaster/networkInfoToaster.js',
                        '<%= config.scripts %>/modules/mobile/widgets/device/camera/camera.js',
                        '<%= config.scripts %>/modules/mobile/widgets/device/barcodeScanner/barcodeScanner.js',
                        '<%= config.scripts %>/modules/mobile/widgets/device/fileBrowser/fileBrowser.js',
                        '<%= config.scripts %>/modules/mobile/widgets/device/fileBrowser/deviceMediaService.js',
                        '<%= config.scripts %>/modules/mobile/widgets/form/fileupload/fileupload.js',
                        '<%= config.scripts %>/modules/mobile/plugins/database/services/localDBDataPullService.js',
                        '<%= config.scripts %>/modules/mobile/plugins/database/services/localDBManager.js',
                        '<%= config.scripts %>/modules/mobile/plugins/database/services/localKeyValueService.js',
                        '<%= config.scripts %>/modules/mobile/plugins/database/services/localDBStoreFactory.js',
                        '<%= config.scripts %>/modules/mobile/plugins/database/services/localDBService.js',
                        '<%= config.scripts %>/modules/mobile/plugins/offline/config.js',
                        '<%= config.scripts %>/modules/mobile/plugins/offline/services/changeLogService.js',
                        '<%= config.scripts %>/modules/mobile/plugins/offline/services/offlineFileUploadService.js',
                        '<%= config.scripts %>/modules/mobile/plugins/offline/services/offlineSecurityService.js'
                    ],
                    '<%= config.editor %>/mobile/scripts/mobileruntimeloader.min.js': [
                        '<%= config.editor %>/mobile/scripts/mobileruntimeloader.js'
                    ]
                }
            }
        }
    });

    /*grunt task for production*/
    grunt.registerTask('build-prod', [
        'clean',
        'bower',
        'less',
        'concat',
        'concat:wm-loader',
        'concurrent:target1',
        'copy'
    ]);


    /*grunt task for development*/
    grunt.registerTask('build', [
        'clean',
        'bower',
        'less',
        'concat',
        'concat:wm-loader',
        'copy'
    ]);

    /*grunt task for development no bower*/
    grunt.registerTask('build-dev', [
        'clean',
        'less',
        'concat',
        'concat:wm-loader',
        'copy'
    ]);

    grunt.registerTask('unitTest', ['build', 'karma:unit']);
};
