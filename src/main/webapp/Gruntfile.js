/*global module,require*/
module.exports = function (grunt) {
    'use strict';

    // load all grunt tasks
    require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);

    // configurable paths
    var wmBuildConfig = {
        scripts: 'scripts',
        application: 'application',
        mobile: 'mobile',
        styles: 'styles',
        components: 'components'
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
                            '<%= config.mobile %>/*'
                        ]
                    }
                ]
            }
        },
        less: {
            dev: {
                files: {
                    '<%= config.application %>/styles/css/wm-style.css': '<%= config.styles %>/less/wm-runtime.less',
                    '<%= config.mobile %>/styles/css/wm-style.css': '<%= config.styles %>/less/wm-runtime.less'
                }
            }
        },
        copy: {
            for_runtime_application_folder: {
                files: [
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
                        cwd: '<%= config.styles %>/fonts',
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
                        cwd: '<%= config.styles %>/fonts',
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
                        src : '<%= config.application %>/scripts/wm-libs.js',
                        dest : '<%= config.mobile %>/scripts/wm-libs.js'
                    },
                    {
                        src : '<%= config.application %>/scripts/wm-libs.min.js',
                        dest : '<%= config.mobile %>/scripts/wm-libs.min.js'
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
                    sourceMap: true
                },
                files: {
                    '<%= config.application %>/scripts/wm-libs.min.js': ['<%= config.application %>/scripts/wm-libs.js'],
                    '<%= config.mobile %>/scripts/wm-libs.min.js': ['<%= config.mobile %>/scripts/wm-libs.js']
                }
            },
            'min-mangle-false' : {
                options: {
                    mangle: false,
                    preserveComments: false,
                    report: 'min',
                    sourceMap: true
                },
                files: {
                    '<%= config.application %>/scripts/runtimeloader.min.js' : ['<%= config.application %>/scripts/runtimeloader.js'],
                    '<%= config.application %>/scripts/wm-loader.min.js' : ['<%= config.application %>/scripts/wm-loader.js'],

                    '<%= config.mobile %>/scripts/mobileruntimeloader.min.js' : ['<%= config.mobile %>/scripts/mobileruntimeloader.js'],
                    '<%= config.mobile %>/scripts/wm-mobileloader.min.js' : ['<%= config.mobile %>/scripts/wm-mobileloader.js']
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
                    '<%= config.application %>/styles/css/wm-style.css': '<%= config.application %>/styles/css/wm-style.css',
                    '<%= config.mobile %>/styles/css/wm-style.css': '<%= config.mobile %>/styles/css/wm-style.css'
                }
            }
        },
        concat: {
            'wm-loader': {
                nonull: true,
                files: {
                    '<%= config.application %>/scripts/placeholders.js': [
                        '<%= config.components %>/placeholders/js/utils.js',
                        '<%= config.components %>/placeholders/js/main.js'
                    ],
                    '<%= config.application %>/scripts/placeholders.min.js': [
                        '<%= config.application %>/scripts/placeholders.js'
                    ],
                    '<%= config.application %>/scripts/wm-loader.js': [
                        '<%= config.application %>/scripts/runtimeloader.js',
                        '<%= config.scripts %>/wmbootstrap.js'
                    ],
                    '<%= config.application %>/scripts/wm-loader.min.js': [
                        '<%= config.application %>/scripts/wm-loader.js'
                    ],
                    '<%= config.mobile %>/scripts/wm-mobileloader.js': [
                        '<%= config.mobile %>/scripts/mobileruntimeloader.js',
                        '<%= config.scripts %>/wmbootstrap.js'
                    ],
                    '<%= config.mobile %>/scripts/wm-mobileloader.min.js': [
                        '<%= config.mobile %>/scripts/wm-mobileloader.js'
                    ],
                    '<%= config.application %>/scripts/wm-libs.js': [
                        '<%= config.components %>/lodash/lodash.js',
                        '<%= config.components %>/jquery/jquery.js',
                        '<%= config.components %>/jquery-ui/js/jquery-ui.js',
                        '<%= config.components %>/socialbyway/js/socialbyway.v1.01-beta.js',
                        '<%= config.components %>/socialbyway/js/socialbyway.ui.v1.01-beta.js',
                        '<%= config.components %>/angular/angular.js',
                        '<%= config.components %>/angular-route/angular-route.js',
                        '<%= config.components %>/angular-animate/angular-animate.js',
                        '<%= config.components %>/angular-toaster/toaster.js',
                        '<%= config.components %>/angular-ui-bootstrap/ui-bootstrap-tpls.js',
                        '<%= config.components %>/moment/moment.js',
                        '<%= config.components %>/fullcalendar/fullcalendar.js',
                        '<%= config.components %>/angular-ui-calendar/calendar.js',
                        '<%= config.components %>/angular-bootstrap-colorpicker/bootstrap-colorpicker-module.js',
                        '<%= config.components %>/angular-sanitize/angular-sanitize.js',
                        '<%= config.components %>/rangy/rangy-core.js',
                        '<%= config.components %>/textAngular/js/textAngular-rangy.min.js',
                        '<%= config.components %>/textAngular/js/textAngular.min.js',
                        '<%= config.components %>/d3/d3.js',
                        '<%= config.components %>/nvd3/nv.d3.js',
                        '<%= config.components %>/ocLazyLoad/ocLazyLoad.min.js',
                        '<%= config.components %>/hammerjs/hammer.js',
                        '<%= config.components %>/ngCordova/ng-cordova.js',
                        '<%= config.scripts %>/modules/gestures/gestures.js',
                        '<%= config.scripts %>/modules/base64/base64.js'
                    ],
                    '<%= config.application %>/scripts/wm-libs.min.js' : [
                        '<%= config.application %>/scripts/wm-libs.js'
                    ]
                }
            },
            'runtime-files': {
                nonull: true,
                files: {
                    '<%= config.application %>/scripts/runtimeloader.js': [
                        '<%= config.scripts %>/config.js',
                        '<%= config.scripts %>/utils.js',
                        '<%= config.scripts %>/formatUtils.js',
                        '<%= config.scripts %>/liveWidgetUtils.js',
                        '<%= config.scripts %>/modules/common/config.js',
                        '<%= config.scripts %>/modules/common/services/baseServiceManager.js',
                        '<%= config.scripts %>/modules/common/services/baseService.js',
                        '<%= config.scripts %>/modules/common/services/fileService.js',
                        '<%= config.scripts %>/modules/common/services/projectService.js',
                        '<%= config.scripts %>/modules/prefabs/services/prefabManager.js',
                        '<%= config.scripts %>/modules/variables/config.js',
                        '<%= config.scripts %>/modules/variables/application/base/basefactory.js',
                        '<%= config.scripts %>/modules/variables/application/base/baseservice.js',
                        '<%= config.scripts %>/modules/variables/application/basicvariable/basicvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/livevariable/livevariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/servicevariable/servicevariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/navigationvariable/navigationvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/notificationvariable/notificationvariableservice.js',
                        '<%= config.scripts %>/modules/layouts/containers/accordion/accordion.js',
                        '<%= config.scripts %>/modules/layouts/containers/mediaList/mediaList.js',
                        '<%= config.scripts %>/modules/layouts/containers/form/form.js',
                        '<%= config.scripts %>/modules/layouts/containers/grid/layoutgrid.js',
                        '<%= config.scripts %>/modules/layouts/containers/list/list.js',
                        '<%= config.scripts %>/modules/layouts/containers/breadcrumb/breadcrumb.js',
                        '<%= config.scripts %>/modules/layouts/containers/nav/nav.js',
                        '<%= config.scripts %>/modules/layouts/containers/navbar/navbar.js',
                        '<%= config.scripts %>/modules/layouts/containers/panel/panel.js',
                        '<%= config.scripts %>/modules/layouts/containers/container/container.js',
                        '<%= config.scripts %>/modules/layouts/containers/tile/tile.js',
                        '<%= config.scripts %>/modules/layouts/containers/tabs/tabs.js',
                        '<%= config.scripts %>/modules/layouts/device/services/mobileevent.js',
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
                        '<%= config.scripts %>/modules/widgets/basic/tree/tree.js',
                        '<%= config.scripts %>/modules/widgets/basic/chart/chart.js',
                        '<%= config.scripts %>/modules/widgets/basic/dataNavigator/dataNavigator.js',
                        '<%= config.scripts %>/modules/widgets/basic/wmtoaster/wmtoaster.js',
                        '<%= config.scripts %>/modules/widgets/basic/progressbar/progressbar.js',
                        '<%= config.scripts %>/modules/widgets/grid/datagrid.js',
                        '<%= config.scripts %>/modules/widgets/dialog/dialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/alertdialog/alertdialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/confirmdialog/confirmdialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/controllers/dialogcontroller.js',
                        '<%= config.scripts %>/modules/widgets/dialog/controllers/notificationdialogcontroller.js',
                        '<%= config.scripts %>/modules/widgets/dialog/iframedialog/iframedialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/pagedialog/pagedialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/logindialog/logindialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/popup/popup.js',
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
                        '<%= config.scripts %>/modules/widgets/form/text/text.js',
                        '<%= config.scripts %>/modules/widgets/form/textarea/textarea.js',
                        '<%= config.scripts %>/modules/widgets/form/time/time.js',
                        '<%= config.scripts %>/modules/widgets/form/richtexteditor/richtexteditor.js',
                        '<%= config.scripts %>/modules/widgets/grid/grid.js',
                        '<%= config.scripts %>/modules/widgets/live/form/liveform.js',
                        '<%= config.scripts %>/modules/widgets/live/filter/livefilter.js',
                        '<%= config.scripts %>/modules/widgets/live/grid/livegrid.js',
                        '<%= config.scripts %>/modules/widgets/live/list/listTemplate.js',
                        '<%= config.scripts %>/modules/widgets/live/list/liveList.js',
                        '<%= config.scripts %>/modules/widgets/advanced/calendar/calendar.js',
                        '<%= config.scripts %>/modules/widgets/advanced/login/login.js',
                        '<%= config.scripts %>/modules/widgets/advanced/carousel/carousel.js',
                        '<%= config.scripts %>/modules/widgets/advanced/rating/rating.js',
                        '<%= config.scripts %>/modules/widgets/prefabs/prefabs.js',
                        '<%= config.scripts %>/modules/plugins/database/config.js',
                        '<%= config.scripts %>/modules/plugins/database/application/services/querybuilder.js',
                        '<%= config.scripts %>/modules/plugins/database/application/services/databaseServices.js',
                        '<%= config.scripts %>/modules/plugins/webservice/config.js',
                        '<%= config.scripts %>/modules/plugins/webservice/application/services/webServices.js',
                        '<%= config.scripts %>/modules/plugins/webservice/application/factories/servicefactory.js',
                        '<%= config.scripts %>/modules/plugins/security/config.js',
                        '<%= config.scripts %>/modules/plugins/security/application/services/securityservices.js',
                        '<%= config.scripts %>/modules/variables/application/loginvariable/loginvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/logoutvariable/logoutvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/timervariable/timervariableservice.js',
                        '<%= config.scripts %>/modules/i18n/config.js',
                        '<%= config.scripts %>/modules/i18n/services/i18nService.js',
                        '<%= config.scripts %>/modules/wmMobile.js'
                    ],
                    '<%= config.application %>/scripts/runtimeloader.min.js': [
                        '<%= config.application %>/scripts/runtimeloader.js'
                    ]

                }
            },
            'mobile-runtime-files': { // mobile changes
                nonull: true,
                files: {
                    '<%= config.mobile %>/scripts/mobileruntimeloader.js': [
                        '<%= config.scripts %>/config.js',
                        '<%= config.scripts %>/utils.js',
                        '<%= config.scripts %>/formatUtils.js',
                        '<%= config.scripts %>/liveWidgetUtils.js',
                        '<%= config.scripts %>/modules/common/config.js',
                        '<%= config.scripts %>/modules/common/services/baseServiceManager.js',
                        '<%= config.scripts %>/modules/common/services/baseService.js',
                        '<%= config.scripts %>/modules/common/services/fileService.js',
                        '<%= config.scripts %>/modules/common/services/projectService.js',
                        '<%= config.scripts %>/modules/prefabs/services/prefabManager.js',
                        '<%= config.scripts %>/modules/variables/config.js',
                        '<%= config.scripts %>/modules/variables/application/base/basefactory.js',
                        '<%= config.scripts %>/modules/variables/application/base/baseservice.js',
                        '<%= config.scripts %>/modules/variables/application/basicvariable/basicvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/livevariable/livevariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/servicevariable/servicevariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/navigationvariable/navigationvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/notificationvariable/notificationvariableservice.js',
                        '<%= config.scripts %>/modules/layouts/containers/accordion/accordion.js',
                        '<%= config.scripts %>/modules/layouts/containers/mediaList/mediaList.js',
                        '<%= config.scripts %>/modules/layouts/containers/form/form.js',
                        '<%= config.scripts %>/modules/layouts/containers/grid/layoutgrid.js',
                        '<%= config.scripts %>/modules/layouts/containers/list/list.js',
                        '<%= config.scripts %>/modules/layouts/containers/nav/nav.js',
                        '<%= config.scripts %>/modules/layouts/containers/panel/panel.js',
                        '<%= config.scripts %>/modules/layouts/containers/container/container.js',
                        '<%= config.scripts %>/modules/layouts/containers/tile/tile.js',
                        '<%= config.scripts %>/modules/layouts/containers/tabs/tabs.js',
                        '<%= config.scripts %>/modules/layouts/device/services/mobileevent.js',
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
                        '<%= config.scripts %>/modules/widgets/basic/tree/tree.js',
                        '<%= config.scripts %>/modules/widgets/basic/chart/chart.js',
                        '<%= config.scripts %>/modules/widgets/basic/dataNavigator/dataNavigator.js',
                        '<%= config.scripts %>/modules/widgets/basic/wmtoaster/wmtoaster.js',
                        '<%= config.scripts %>/modules/widgets/basic/progressbar/progressbar.js',
                        '<%= config.scripts %>/modules/widgets/grid/datagrid.js',
                        '<%= config.scripts %>/modules/widgets/dialog/dialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/alertdialog/alertdialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/confirmdialog/confirmdialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/controllers/dialogcontroller.js',
                        '<%= config.scripts %>/modules/widgets/dialog/controllers/notificationdialogcontroller.js',
                        '<%= config.scripts %>/modules/widgets/dialog/logindialog/logindialog.js',
                        '<%= config.scripts %>/modules/widgets/dialog/popup/popup.js',
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
                        '<%= config.scripts %>/modules/widgets/form/text/text.js',
                        '<%= config.scripts %>/modules/widgets/form/textarea/textarea.js',
                        '<%= config.scripts %>/modules/widgets/form/time/time.js',
                        '<%= config.scripts %>/modules/widgets/form/richtexteditor/richtexteditor.js',
                        '<%= config.scripts %>/modules/widgets/grid/grid.js',
                        '<%= config.scripts %>/modules/widgets/live/form/liveform.js',
                        '<%= config.scripts %>/modules/widgets/live/filter/livefilter.js',
                        '<%= config.scripts %>/modules/widgets/live/grid/livegrid.js',
                        '<%= config.scripts %>/modules/widgets/live/list/listTemplate.js',
                        '<%= config.scripts %>/modules/widgets/live/list/liveList.js',
                        '<%= config.scripts %>/modules/widgets/advanced/calendar/calendar.js',
                        '<%= config.scripts %>/modules/widgets/advanced/login/login.js',
                        '<%= config.scripts %>/modules/widgets/advanced/carousel/carousel.js',
                        '<%= config.scripts %>/modules/widgets/advanced/rating/rating.js',
                        '<%= config.scripts %>/modules/widgets/prefabs/prefabs.js',
                        '<%= config.scripts %>/modules/plugins/database/config.js',
                        '<%= config.scripts %>/modules/plugins/database/application/services/querybuilder.js',
                        '<%= config.scripts %>/modules/plugins/database/application/services/databaseServices.js',
                        '<%= config.scripts %>/modules/plugins/webservice/config.js',
                        '<%= config.scripts %>/modules/plugins/webservice/application/services/webServices.js',
                        '<%= config.scripts %>/modules/plugins/webservice/application/factories/servicefactory.js',
                        '<%= config.scripts %>/modules/plugins/security/config.js',
                        '<%= config.scripts %>/modules/plugins/security/application/services/securityservices.js',
                        '<%= config.scripts %>/modules/variables/application/loginvariable/loginvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/logoutvariable/logoutvariableservice.js',
                        '<%= config.scripts %>/modules/variables/application/timervariable/timervariableservice.js',
                        '<%= config.scripts %>/modules/i18n/config.js',
                        '<%= config.scripts %>/modules/i18n/services/i18nService.js',
                        //Mobile Specific files start
                        '<%= config.scripts %>/modules/mobile/wmMobile.js',
                        '<%= config.scripts %>/modules/mobile/common/services/fileSelectorService.js',
                        '<%= config.scripts %>/modules/mobile/common/services/fileUploadService.js',
                        '<%= config.scripts %>/modules/mobile/layouts/device/services/deviceview.js',
                        '<%= config.scripts %>/modules/mobile/variables/calendar/calendar.js',
                        '<%= config.scripts %>/modules/mobile/variables/contacts/contacts.js',
                        '<%= config.scripts %>/modules/mobile/variables/device/device.js',
                        '<%= config.scripts %>/modules/mobile/variables/file/file.js',
                        '<%= config.scripts %>/modules/mobile/variables/mobileVariable/mobileVariableService.js',
                        '<%= config.scripts %>/modules/mobile/variables/scan/scan.js',
                        '<%= config.scripts %>/modules/mobile/layouts/containers/navbar/navbar.js',
                        '<%= config.scripts %>/modules/mobile/layouts/containers/segmented/segmented.js',
                        '<%= config.scripts %>/modules/mobile/layouts/containers/tabbar/tabbar.js',
                        '<%= config.scripts %>/modules/mobile/layouts/page/leftpanel.js',
                        '<%= config.scripts %>/modules/mobile/widgets/device/camera/camera.js',
                        '<%= config.scripts %>/modules/mobile/widgets/device/barcodeScanner/barcodeScanner.js',
                        '<%= config.scripts %>/modules/mobile/widgets/device/fileBrowser/fileBrowser.js',
                        '<%= config.scripts %>/modules/mobile/widgets/form/fileupload/fileupload.js',
                        '<%= config.scripts %>/modules/mobile/widgets/form/date/date.js',
                        '<%= config.scripts %>/modules/mobile/widgets/form/time/time.js',
                        '<%= config.scripts %>/modules/mobile/widgets/form/datetime/datetime.js',
                        '<%= config.scripts %>/modules/mobile/widgets/live/form/liveform.js'
                    ],
                    '<%= config.mobile %>/scripts/mobileruntimeloader.min.js': [
                        '<%= config.mobile %>/scripts/mobileruntimeloader.js'
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
        'copy',
        'uglify',
        'cssmin'
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

    grunt.registerTask('unitTest', ['build', 'karma:unit']);
};
