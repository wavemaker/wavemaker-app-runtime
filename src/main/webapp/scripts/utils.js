/*global WM, X2JS, wm, window, document, navigator, Image, location, console, _, $, moment, resolveLocalFileSystemURL, FileReader, Blob, localStorage */
/*jslint todo: true */

/**
 * @ngdoc service
 * @name wm.utils.Utils
 * @requires $rootScope
 * @requires $location
 * @requires $window
 * @requires CONSTANTS
 * @requires $sce
 * @description
 * The `Utils` service provides utility methods.
 */

WM.module('wm.utils', [])
    .controller("EmptyController", WM.noop)
    .service('Utils', ['$rootScope', '$location', '$window', 'CONSTANTS', 'WIDGET_CONSTANTS', '$sce', 'DialogService', '$timeout', '$http', '$filter', '$q', '$cookies', 'wmToaster', '$locale', function ($rootScope, $location, $window, CONSTANTS, WIDGET_CONSTANTS, $sce, DialogService, $timeout, $http, $filter, $q, $cookies, wmToaster, $locale) {
        'use strict';

        var userAgent = navigator.userAgent,
            scriptEl = document.createElement('script'),
            linkEl = document.createElement('link'),
            headNode = document.getElementsByTagName('head')[0],
            isAppleProduct = /Mac|iPod|iPhone|iPad/.test(navigator.platform),
            REGEX = {
                SNAKE_CASE: /[A-Z]/g,
                ANDROID: /Android/i,
                IPHONE: /iPhone/i,
                IPOD: /iPod/i,
                IPAD: /iPad/i,
                ANDROID_TABLET: /android|android 3.0|xoom|sch-i800|playbook|tablet|kindle/i,
                MOBILE: /Mobile/i,
                WINDOWS: /Windows Phone/i,
                SUPPORTED_IMAGE_FORMAT: /\.(bmp|gif|jpe|jpg|jpeg|tif|tiff|pbm|png|ico)$/i,
                SUPPORTED_FILE_FORMAT: /\.(txt|js|css|html|script|properties|json|java|xml|xsd|xjb|smd|xmi|sql|log|wsdl|vm|ftl|jrxml|yml|yaml|md|less|jsp|ts|scss)$/i,
                SUPPORTED_AUDIO_FORMAT: /\.(mp3|ogg|webm|wma|3gp|wav|m4a)$/i,
                SUPPORTED_VIDEO_FORMAT: /\.(mp4|ogg|webm|wmv|mpeg|mpg|avi)$/i,
                PAGE_RESOURCE_PATH: /^\/pages\/.*\.(js|css|html|json)$/,
                MIN_PAGE_RESOURCE_PATH: /.*(page.min.html)$/,
                VALID_EMAIL: /^[a-zA-Z][\w.+]+@[a-zA-Z_]+?\.[a-zA-Z.]{1,4}[a-zA-Z]$/,
                VALID_WEB_URL: /^(http[s]?:\/\/)(www\.){0,1}[a-zA-Z0-9=:?\/\.\-]+(\.[a-zA-Z]{2,5}[\.]{0,1})?/,  //url-regex-validation
                VALID_WEBSOCKET_URL: /^(ws[s]?:\/\/)(www\.){0,1}[a-zA-Z0-9=:?\/\.\-]+(\.[a-zA-Z]{2,5}[\.]{0,1})?/,  //WebSocket url-regex-validation
                REPLACE_PATTERN: /\$\{([^\}]+)\}/g,
                ZIP_FILE: /\.zip$/i,
                EXE_FILE: /\.exe$/i,
                NO_QUOTES_ALLOWED: /^[^'|"]*$/,
                NO_DOUBLE_QUOTES_ALLOWED: /^[^"]*$/,
                VALID_HTML: /<[a-z][\s\S]*>/i,
                VALID_PASSWORD: /^[0-9a-zA-Z-_.@&*!#$%]+$/,
                SPECIAL_CHARACTERS: /[^A-Z0-9a-z_]+/i,
                APP_SERVER_URL_FORMAT: /^(http[s]?:\/\/)(www\.){0,1}[a-zA-Z0-9\.\-]+([:]?[0-9]{2,5}|\.[a-zA-Z]{2,5}[\.]{0,1})(\/?)+[^?#&=]+$/,
                JSON_DATE_FORMAT: /\d{4}-[0-1]\d-[0-3]\d(T[0-2]\d:[0-5]\d:[0-5]\d.\d{1,3}Z$)?/,
                MOBILE_APP_ID: /^(([a-zA-Z]|[a-zA-Z][a-zA-Z0-9]*[a-zA-Z0-9])\.)*([A-Za-z]|[A-Za-z][A-Za-z0-9]*[A-Za-z0-9])$/
            },
            NUMBER_TYPES = ['int', 'integer', 'float', 'double', 'long', 'short', 'byte', 'big_integer', 'big_decimal'],
            SYSTEM_FOLDER_PATHS = {
                'project': ['../lib', '../project', '../project/i18n', '../project/services', '../project/lib', '../project/src', '../project/test', '../project/src/main', '../project/src/main/webapp', '../project/src/main/resources', '../project/src/main/webapp/services', '../project/src/main/webapp/resources', '../project/src/main/webapp/pages', '../project/src/main/webapp/resources/images', '../project/src/main/webapp/resources/WEB-INF', '../project/src/main/webapp/resources/ngLocale', '../project/src/main/webapp/resources/i18n', '../project/src/main/webapp/resources/images/imagelists', '../project/src/main/webapp/resources/audio', '../project/src/main/webapp/resources/video'],
                'resources': ['', '/services', '/resources', '/WEB-INF', '/app', '/pages', '/resources/i18n', '/resources/ngLocale', 'resources/images', 'resources/audio', 'resources/video', 'resources/images/imagelists'],
                'lib': ['../lib'],
                'jar': ['../lib'],
                'locale': ['resources/i18n'],
                'services': ['services'],
                'image': ['resources/images', 'resources/images/imagelists'],
                'audio': ['resources/audio'],
                'video': ['resources/video']
            },
            hasLocalStorage = 'localStorage' in window && window.localStorage !== null,
            browserStorage = {
                storeItem: function (key, value) {
                    if (hasLocalStorage) {
                        window.localStorage.setItem(key, value);
                    }
                },
                getItem: function (key) {
                    if (hasLocalStorage) {
                        return window.localStorage.getItem(key);
                    }
                },
                deleteItem: function (key) {
                    if (hasLocalStorage) {
                        delete window.localStorage[key];
                    }
                }
            },
            operators = ['+', '-', '*', '/', '=', '<', '>', '&', '|', '^', '(', ')', '!', '%', '[', ']', '{','}',',', ';'],
            bindExpressionRegEx = new RegExp('[?:(' +
                operators.map(function(op) { return '\\' + op; }).join('|')
                + ')]', 'g'),
            isI18nResourceFolder = function(path) {
                return _.includes(path, '/i18n');
            },
            isIE11 = function () {
                return navigator.appVersion.indexOf('Trident/') > -1;
            },
            isIE9 = function () {
                return navigator.appVersion.indexOf('MSIE 9') > -1;
            },
            isIE = function () {
                return isIE9() || isIE11() || userAgent.indexOf('MSIE') > -1;
            },
            getNode = function (tree, nodeId) {
                var index, treeLength;
                /*Return undefined if the 'tree' is undefined*/
                if (WM.isUndefined(tree)) {
                    return undefined;
                }
                treeLength = tree.length;
                /*Loop through the tree and match the specified nodeId against the ids of the tree elements*/
                for (index = 0; index < treeLength; index += 1) {
                    /*Return the node if it exists*/
                    if (tree[index].id === nodeId) {
                        return tree[index];
                    }
                }
                /*Return undefined if the tree does not contain the node*/
                return undefined;
            },
            variableCategoryMap = {
                'wm.Variable'            : 'variable',
                'wm.ServiceVariable'     : 'service-variable',
                'wm.LiveVariable'        : 'live-variable',
                'wm.LoginVariable'       : 'login-variable',
                'wm.LogoutVariable'      : 'logout-variable',
                'wm.NavigationVariable'  : 'navigation-variable',
                'wm.NotificationVariable': 'notification-variable',
                'wm.TimerVariable'       : 'timer-variable',
                'wm.DeviceVariable'      : 'device-variable',
                'wm.WebSocketVariable'   : 'websocket-variable'
            },
            dataSetWidgets = {
                'select'       : true,
                'checkboxset'  : true,
                'radioset'     : true,
                'switch'       : true,
                'autocomplete' : true,
                'chips'        : true,
                'typeahead'    : true,
                'rating'       : true
            },
            daysOptions = [{
                'name': 'Sunday',
                'value': '0'
            }, {
                'name': 'Monday',
                'value': '1'
            }, {
                'name': 'Tuesday',
                'value': '2'
            }, {
                'name': 'Wednesday',
                'value': '3'
            }, {
                'name': 'Thursday',
                'value': '4'
            }, {
                'name': 'Friday',
                'value': '5'
            }, {
                'name': 'Saturday',
                'value': '6'
            }],
            DEFAULT_FORMATS = {
                'DATE'           : 'yyyy-MM-dd',
                'TIME'           : 'HH:mm:ss',
                'TIMESTAMP'      : 'timestamp',
                'DATETIME'       : 'yyyy-MM-ddTHH:mm:ss',
                'LOCALDATETIME'  : 'yyyy-MM-ddTHH:mm:ss',
                'DATETIME_ORACLE': 'yyyy-MM-dd HH:mm:ss',
                'DATE_TIME'      : 'yyyy-MM-dd HH:mm:ss'
            },
            indexPage = getIndexPage(),
            pluginConfig = {
                'BARCODE_SCANNER' : [{'name' : 'phonegap-plugin-barcodescanner', 'spec' : '8.0.1'}],
                'CALENDAR'        : [{'name' : 'cordova-plugin-calendar', 'spec' : '5.1.4'}],
                'CAMERA'          : [{'name' : 'cordova-plugin-camera', 'spec' : '4.0.3'},
                                     {'name' : 'cordova-plugin-media-capture', 'spec' : '3.0.2'}],
                'CONTACTS'        : [{'name' : 'cordova-plugin-contacts', 'spec' : '3.0.1'}],
                'COOKIE_MANAGER'  : [{'name' : 'cordova-cookie-emperor', 'spec' : 'https://github.com/RTK/cordova-cookie-emperor.git#3a73cfd'}],
                'FILE'            : [{'name' : 'cordova-plugin-file', 'spec' : '6.0.1'},
                                        {'name': 'cordova-plugin-file-transfer', 'spec': '1.7.1'},
                                        {'name' : 'cordova-plugin-file-opener2', 'spec' : 'https://github.com/wavemaker/cordova-plugin-file-opener2.git#d382e11'},
                                        {'name' : 'cordova-plugin-transport-security', 'spec': '0.1.2'},
                                        {'name' : 'cordova-plugin-zeep', 'spec': '0.0.4'}],
                'GEOLOCATION'     : [{'name' : 'cordova-plugin-geolocation', 'spec' : '4.0.1'}],
                'NETWORK'         : [{'name' : 'cordova-plugin-network-information', 'spec' : '2.0.1'}],
                'VIBRATE'         : [{'name' : 'cordova-plugin-vibration', 'spec' : '3.1.0'}],
                'MEDIAPICKER'     : [{'name' : 'cordova-plugin-mediapicker', 'spec' : '1.0.1'}],
                'MEDIASCANNER'    : [{'name' : 'cordova-plugin-mediascanner', 'spec' : '0.1.3'}],
                'IMAGEPICKER'     : [{'name' : 'cordova-plugin-telerik-imagepicker', 'spec' : 'https://github.com/wavemaker/cordova-imagepicker-1.git#b518919'}],
                'SPLASHSCREEN'    : [{'name' : 'cordova-plugin-splashscreen', 'spec' : '5.0.2'}],
                'DEVICE'          : [{'name' : 'cordova-plugin-device', 'spec': '2.0.2'}],
                'APPVERSION'      : [{'name' : 'cordova-plugin-app-version', 'spec': '0.1.9'}],
                'WHITELIST'       : [{'name' : 'cordova-plugin-whitelist', 'spec': '1.3.3'}],
                'INAPPBROWSER'    : [{'name' : 'cordova-plugin-inappbrowser', 'spec' : '3.0.0'}],
                'STATUSBAR'       : [{'name' : 'cordova-plugin-statusbar', 'spec' : '2.4.2'}],
                'OFFLINE_DB'      : [{'name' : 'cordova-sqlite-storage', 'spec' : 'https://github.com/wavemaker/Cordova-sqlite-storage.git#2cb6cd5'}],
                'CUSTOMURLSCHEME' : [{'name' : 'cordova-plugin-customurlscheme', 'spec' : '4.3.0', 'variables': [{ 'name': 'URL_SCHEME', 'value': ''}]}]
            },
            exportTypesMap   = { 'EXCEL' : '.xlsx', 'CSV' : '.csv'},
            compareBySeparator = ':';

        /* set default attrs for link */
        linkEl.rel = 'stylesheet';
        linkEl.type = 'text/css';

        /* convert camelCase string to a snake-case string */
        function hyphenate(name) {
            return name.replace(REGEX.SNAKE_CASE, function (letter, pos) {
                return (pos ? '-' : '') + letter.toLowerCase();
            });
        }
        /* convert a hyphenated string to a space separated string. */
        function deHyphenate(name) {
            return name.split('-').join(' ');
        }
        /* convert camelCase string to a space separated string */
        function spaceSeparate(name) {
            if (name === name.toUpperCase()) {
                return name;
            }
            return name.replace(REGEX.SNAKE_CASE, function (letter, pos) {
                return (pos ? ' ' : '') + letter;
            });
        }

        /*Replace the character at a particular index*/
        function replaceAt(string, index, character) {
            return string.substr(0, index) + character + string.substr(index + character.length);
        }

        /*Replace multiple patterns at once in a string*/
        function replaceAll(string, regExArray, replaceArray) {
            _.forEach(regExArray, function (value, index) {
                string = _.replace(string, value, replaceArray[index]);
            });
            return string;
        }

        /*Replace '.' with space and capitalize the next letter*/
        function periodSeparate(name) {
            var dotIndex;
            dotIndex = name.indexOf('.');
            if (dotIndex !== -1) {
                name = replaceAt(name, dotIndex + 1, name.charAt(dotIndex + 1).toUpperCase());
                name = replaceAt(name, dotIndex, ' ');
            }
            return name;
        }

        /* capitalize the first-letter of the string passed */
        function initCaps(name) {
            if (!name) {
                return '';
            }
            return name.charAt(0).toUpperCase() + name.substring(1);
        }

        /* capitalize ONLY the first-letter of the string passed, remaining is made lower cased */
        function firstCaps(name) {
            if (!name) {
                return '';
            }
            return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();
        }

        function prettifyLabel(label) {
            label = _.camelCase(label);
            /*capitalize the initial Letter*/
            label = initCaps(label);
            /*Convert camel case words to separated words*/
            label = spaceSeparate(label);
            /*Replace '.' with space and capitalize the next letter*/
            label = periodSeparate(label);
            return label;
        }

        /*Accepts an array or a string separated with symbol and returns prettified result*/
        function prettifyLabels(names, separator) {
            var modifiedNames,
                namesArray = [],
                isArray    = WM.isArray(names);
            separator = separator || ',';

            if (!isArray) {
                namesArray = _.split(names, separator);
            }

            modifiedNames = _.map(namesArray, prettifyLabel);
            if (isArray) {
                return modifiedNames;
            }
            return modifiedNames.join(separator);
        }

        /*function to get variable name bound to an element*/
        function getVariableName(iScope, scope) {
            if (iScope && iScope.binddataset) {
                var variableName,
                    widgetScope,
                    widgetName,
                    isBoundToVariable,
                    isBoundToWidget,
                    parts = iScope.binddataset.split('.');

                isBoundToVariable = _.includes(iScope.binddataset, 'bind:Variables.');

                if (!isBoundToVariable) {
                    isBoundToWidget = _.includes(iScope.binddataset, 'bind:Widgets.');
                }

                if (isBoundToVariable) {
                    variableName = parts[1];
                } else if (isBoundToWidget) {
                    if (WM.isString(iScope.binddataset) && iScope.binddataset !== '') {
                        if (!_.includes(iScope.binddataset, 'selecteditem.')) {
                            widgetName = parts[1];
                            widgetScope = (scope || iScope).Widgets[widgetName];
                            variableName = getVariableName(widgetScope);
                        } else {
                            // Return null if widget is bound to selecteditem.something.
                            variableName = null;
                        }
                    }
                }
                return variableName;
            }
        }
        function isValidWebURL(url) {
            return (REGEX.VALID_WEB_URL).test(url);
        }

        function isValidWebSocketURL(url) {
            return (REGEX.VALID_WEBSOCKET_URL).test(url);
        }

        function isValidAppServerUrl(url) {
            return (REGEX.APP_SERVER_URL_FORMAT).test(url);
        }

        /* returns the zIndex of the parent elements overlay */
        function getParentOverlayElZIndex(element) {
            var parentEl, parentOverlay, parentOvleryZIndex;
            parentEl = element.parent().closest('[widgetid]');
            /* fetch the z-index of parent element */
            if (parentEl.length > 0) {
                parentEl = parentEl.eq(0);
                parentOverlay = parentEl.data('overlayElement');
                if (parentOverlay) {
                    parentOvleryZIndex = parentOverlay.css('zIndex');
                } else if (parentEl.parent().data('overlayElement')) {
                    parentOvleryZIndex = parseInt(parentEl.parent().data('overlayElement').css('zIndex'), 10) + 10;
                } else {
                    /*Temporary fix to assign z-index for elements with no parent overlayElement - Ex: Database-column*/
                    parentOvleryZIndex = 10;
                }
            } else {
                return 100;
            }
            return +parentOvleryZIndex;
        }

    /**
     * Method to check the markup and return valid content even if users makes mistakes
     * @param htmlString
     * @param handleValidMarkUp
     * @param handleInValidMarkUp
     * @return {String}
     */
        function getValidMarkUp(htmlString, handleValidMarkUp, handleInValidMarkUp) {
            var newMarkup = '', checkValidRootElement = function (ele) {
                return WM.element(ele).is('wm-page, wm-partial, wm-template, wm-prefab-container');
            },
                $htm,
                $outerEle,
                $innerEle;

            $htm = WM.element.parseHTML(htmlString);
            //check if the root element is either of the valid elements
            if (checkValidRootElement($htm[0])) {
                newMarkup = htmlString;
                triggerFn(handleValidMarkUp);
            } else {
                //handle the invalid condition
                triggerFn(handleInValidMarkUp);
                //the page markup is not valid
                $outerEle = WM.element('<div>' + htmlString + '</div>');
                $innerEle = $outerEle.find('wm-page, wm-partial, wm-template, wm-prefab-container');

                if ($innerEle.length > 0) {
                    newMarkup = $innerEle[0].outerHTML;
                }
            }
            return newMarkup;
        }
        function formatVariableIconClass(variableCategory) {
            return variableCategoryMap[variableCategory];
        }

        // Generate default field definition object for a given field
        function getFieldDefProps(title, namePrefix, options) {
            var modifiedTitle,
                relatedTable,
                relatedField,
                relatedInfo,
                fieldName,
                isRelated;
            options = options || {};
            if (_.includes(title, '.')) {
                relatedInfo  = _.split(title, '.');
                relatedTable = relatedInfo[0];
                relatedField = relatedInfo[1];
                isRelated    = true;
            }
            if (options.noModifyTitle) {
                modifiedTitle = title;
            } else {
                if (WM.isString(title)) {
                    modifiedTitle = prettifyLabel(title);
                    modifiedTitle = deHyphenate(modifiedTitle);
                    modifiedTitle = namePrefix ? initCaps(namePrefix) + ' ' + modifiedTitle : modifiedTitle;
                } else {
                    modifiedTitle = title;
                }
            }
            title = namePrefix ? namePrefix + '.' + title : title;
            if (isRelated) {
                //For related columns, shorten the title to last two words
                fieldName = _.split(modifiedTitle, ' ');
                fieldName = fieldName.length > 1 ? fieldName[fieldName.length - 2] + ' ' + fieldName[fieldName.length - 1] : fieldName[0];
            } else {
                fieldName = modifiedTitle;
            }
            return options.setBindingField ? {'displayName': fieldName, 'field': title, 'relatedTable': relatedTable, 'relatedField': relatedField || modifiedTitle} : {'displayName': fieldName, 'relatedTable': relatedTable, 'relatedField': relatedField || modifiedTitle};
        }
        /*helper function for prepareFieldDefs*/
        function pushFieldDef(dataObject, columnDefObj, namePrefix, options) {
            /*loop over the fields in the dataObject to process them*/
            if (!options) {
                options = {};
            }
            WM.forEach(dataObject, function (value, title) {
                var defObj = getFieldDefProps(title, namePrefix, options);
                /*if field is a leaf node, push it in the columnDefs*/
                if (!WM.isObject(value) || (WM.isArray(value) && !value[0])) {
                    /*if the column counter has reached upperBound return*/
                    if (options.upperBound && options.columnCount === options.upperBound) {
                        return;
                    }
                    columnDefObj.terminals.push(defObj);
                    /*increment the column counter*/
                    options.columnCount += 1;
                } else {
                    /*else field is an object, process it recursively*/
                    /* if parent node to be included, include it */
                    if (options.columnCount !== options.upperBound) {
                        columnDefObj.objects.push(defObj);
                    }

                    /* if field is an array node, process its first child */
                    if (WM.isArray(value) && value[0]) {
                        pushFieldDef(value[0], columnDefObj, title + '[0]', options);
                    } else {
                        pushFieldDef(value, columnDefObj, title, options);
                    }
                }
            });
        }
        /*function to get the metadata structure (columns) from the data*/
        function getMetaDataFromData(data) {
            var dataObject;
            if (WM.isArray(data)) {
                if (WM.isObject(data[0])) {
                    dataObject = getClonedObject(data[0]);
                    /*Loop over the object to find out any null values. If any null values are present in the first row, check and assign the values from other row.
                     * As column generation is dependent on data, for related fields if first row value is null, columns are not generated.
                     * To prevent this, check the data in other rows and generate the columns. New keys from others rows are also added*/
                    _.forEach(data, function (row, index) {
                        if ((index + 1) >= CONSTANTS.DATA_SEARCH_LIMIT) { //Limit the data search to first 10 records
                            return false;
                        }
                        _.assignWith(dataObject, row, function (objValue, srcValue) {
                            return (objValue === null || objValue === undefined) ? srcValue : objValue;
                        });
                    });
                } else {
                    dataObject = data[0];
                }
            } else {
                dataObject = data;
            }
            return dataObject;
        }
        /*function to prepare column definition objects from the data provided*/
        function prepareFieldDefs(data, options) {
            var dataObject,
                columnDef = {
                    'objects' : [],
                    'terminals' : []
                };
            /*if no data provided, initialize default column definitions*/
            if (!data) {
                data = [];
            }
            if (!options) {
                options = {};
            }
            options.setBindingField = true;
            options.columnCount = 0;
            dataObject = getMetaDataFromData(data);
            /*first of the many data objects from grid data*/
            pushFieldDef(dataObject, columnDef, '', options);
            if (!options || (options && !options.filter)) {
                return columnDef.terminals;
            }
            switch (options.filter) {
            case 'all':
                return columnDef;
            case 'objects':
                return columnDef.objects;
            case 'terminals':
                return columnDef.terminals;
            }
            return columnDef;
        }

        /*function to swap two elements in an array*/
        function swapArrayElements(array, index1, index2) {
            var temp = array[index1];
            array[index1] = array[index2];
            array[index2] = temp;
            return array;
        }

        /*function to swap the given two properties in the object*/
        function swapProperties(data, property1, property2) {
            var temp = data[property1];
            data[property1] = data[property2];
            data[property2] = temp;
        }

        /*function to check if fn is a function and then execute*/
        function triggerFn(fn) {
            /* Use of slice on arguments will make this function not optimizable
            * */

            var start = 1, len = arguments.length, args = new Array(len - start);
            for (start; start < len; start++) {
                args[start - 1] = arguments[start];
            }

            if (WM.isFunction(fn)) {
                return fn.apply(null, args);
            }
        }

        /*function to check if the stylesheet is already loaded */
        function isStyleSheetLoaded(href) {
            return WM.element('link[href="' + href + '"]').length > 0;
        }

        /*function to remove stylesheet if the stylesheet is already loaded */
        function removeStyleSheetLoaded(href) {
            var styleTag = WM.element('link[href="' + href + '"]');
            if (styleTag.length) {
                styleTag.remove();
            }
        }

        /*function to load a stylesheet */
        function loadStyleSheet(url, attr) {
            if (isStyleSheetLoaded(url)) {
                return;
            }
            var link = linkEl.cloneNode();
            link.href = url;
            /*To add attributes to link tag*/
            if (attr && attr.name) {
                link.setAttribute(attr.name, attr.value);
            }
            headNode.appendChild(link);
            return link;
        }

        /*function to load stylesheets */
        function loadStyleSheets(urlArray) {
            if (!urlArray) {
                return;
            }
            /* if the first argument is not an array, convert it to an array */
            if (!WM.isArray(urlArray)) {
                urlArray = [urlArray];
            }
            WM.forEach(urlArray, loadStyleSheet);
        }

        /*function to check if the script is already loaded*/
        function isScriptLoaded(src) {
            return WM.element('script[src="' + src + '"]').length > 0 || WM.element('script[data-src="' + src + '"]').length > 0;
        }

        /* util function to load the content from a url */
        function fetchContent(dataType, url, successCallback, errorCallback, inSync) {

            // IE9: xdomain.js will not allow us to make synchronous requests. Use nativeXMLHTTP
            if (inSync && window.nativeXMLHTTP) {
                var xhr = new window.nativeXMLHTTP(),
                    response;
                xhr.open('GET', url, false);
                xhr.onload = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            response = xhr.responseText;
                            if (dataType === 'json') {
                                response = JSON.parse(xhr.responseText);
                            }
                            successCallback(response);
                        } else {
                            errorCallback();
                        }
                    }
                };
                xhr.send();
            } else {
                WM.element.ajax({
                    type: 'get',
                    dataType: dataType,
                    url: url,
                    success: successCallback,
                    error: errorCallback,
                    async: !inSync
                });
            }
        }

        /*function to load a javascript files */
        function loadScripts(scripts, onsuccess, onerror, hasError, jqxhr) {

            if (!scripts || scripts.length === 0) {
                if (hasError) {
                    triggerFn(onerror, jqxhr);
                } else {
                    triggerFn(onsuccess, jqxhr);
                }
                return;
            }

            var url = scripts.shift();
            if (isScriptLoaded(url)) {
                loadScripts(scripts, onsuccess, onerror);
                return;
            }

            WM.element.getScript(url)
                .done(function (script, textStatus, jqxhr) {
                    loadScripts(scripts, onsuccess, onerror, false, jqxhr);
                })
                .fail(function (jqxhr) {
                    loadScripts([], onsuccess, onerror, true, jqxhr);
                });
        }

        function loadScriptsInSync(urlArray) {

            if (urlArray.length === 0) {
                return;
            }

            var url = urlArray.shift();

            if (isScriptLoaded(url) || !url) {
                return;
            }

            if (url) {
                fetchContent('text', url, function (response) {
                    var script = scriptEl.cloneNode();
                    script.text = response;
                    script.setAttribute('data-src', url);
                    headNode.appendChild(script);
                    loadScriptsInSync(urlArray);
                }, null, true); //load in sync
            }
        }

        /* functions for resource Tab*/
        function isImageFile(fileName) {
            return (REGEX.SUPPORTED_IMAGE_FORMAT).test(fileName);
        }

        function isZipFile(fileName) {
            return (REGEX.ZIP_FILE).test(fileName);
        }

        function isExeFile(fileName) {
            return (REGEX.EXE_FILE).test(fileName);
        }

        function isTextLikeFile(fileName) {
            return (REGEX.SUPPORTED_FILE_FORMAT).test(fileName);
        }

        function isAudioFile(fileName) {
            return (REGEX.SUPPORTED_AUDIO_FORMAT).test(fileName);
        }

        function isVideoFile(fileName) {
            return (REGEX.SUPPORTED_VIDEO_FORMAT).test(fileName);
        }

        function isPageResource(path) {
            return (REGEX.PAGE_RESOURCE_PATH).test(path) && !(REGEX.MIN_PAGE_RESOURCE_PATH).test(path);
        }

        function isAndroid() {
            return (REGEX.ANDROID.test(userAgent));
        }

        function isAndroidPhone() {
            return isAndroid() && (REGEX.MOBILE.test(userAgent));
        }

        function getAndroidVersion() {
            var match = (navigator.userAgent.toLowerCase()).match(/android\s([0-9\.]*)/);
            return match ? match[1] : false;
        }

        function isKitkatDevice() {
            return isAndroid() && parseInt(getAndroidVersion(), 10) === 4;
        }

        function isIphone() {
            return (REGEX.IPHONE.test(userAgent));
        }

        function isIpod() {
            return (REGEX.IPOD.test(userAgent));
        }

        function isIpad() {
            return (REGEX.IPAD.test(userAgent));
        }

        function isIOS() {
            return isIphone() || isIpod() || isIpad();
        }

        function isAndroidTablet() {
            return (REGEX.ANDROID_TABLET.test(userAgent));
        }

        function isTablet() {
           return isIpad() || isAndroidTablet();
        }

        function isWindowsPhone() {
            return (REGEX.WINDOWS.test(userAgent));
        }

        function isMobile() {
            if (CONSTANTS.isRunMode) {
                return isAndroidPhone() || isIphone() || isIpod() || isIpad() || isAndroidTablet() || isWindowsPhone() || WM.element('#wm-mobile-display:visible').length > 0;
            }

            return false;
        }

        /*function to check valid java package name*/
        function isValidJavaPackageName(pkgName) {
            /*
             * Matches fully qualified java class name
             * eg:
             * 1) com.WaveMaker.javaService --> true
             * 2) $com.$WaveMaker.$javaService --> true
             * 3) 1com.2WaveMaker.3javaService --> false numerics at the beginning of the class is not allowed
             * 4) com.W@veM@ker.j@v@Serv!ce --> false
             *
             */
            var VALID_CLASS_NAME_REGEX = /^([a-zA-Z_$][\w$]*\.)*[a-zA-Z_$][\w$]*$/;
            return VALID_CLASS_NAME_REGEX.test(pkgName);
        }

        /*function to check if quotes (both single and double) are NOT present in a string.*/
        function isQuoteNotPresent(str) {
            return REGEX.NO_QUOTES_ALLOWED.test(str);
        }

        //function to check if string contains double quotes
        function isNoDoubleQuoteNotPresent(str) {
            return REGEX.NO_DOUBLE_QUOTES_ALLOWED.test(str);
        }

        /*function to check if string contains HTML tags.*/
        function isValidHtml(str) {
            return REGEX.VALID_HTML.test(str);
        }

        /*function to check if the string contains special characters*/
        function hasSpecialCharacters(str) {
            return REGEX.SPECIAL_CHARACTERS.test(str);
        }

        /**
         * Encodes the query params and returns the encoded url
         * @param url
         * @returns {*} returns encoded url
         */
        function encodeUrlParams(url) {
            var queryParams, encodedParams = '', queryParamsString, index;
            index = url.indexOf('?');
            if (index > -1) {
                index += 1;
                queryParamsString = url.substring(index);
                //Encoding the query params if exist
                if (queryParamsString) {
                    queryParams = queryParamsString.split('&');
                    _.forEach(queryParams, function (param) {
                        var index = _.includes(param, '=') ? param.indexOf('=') : (param && param.length),
                            paramName = param.substr(0, index),
                            paramValue = param.substr(index + 1),
                            decodedParamValue;
                        //add the = for param name only when the param value exists in the given param or empty value is assigned
                        if (paramValue || _.includes(param, '=')) {
                            decodedParamValue = getDecodedParamValue(paramValue);
                            encodedParams += paramName + '=' + encodeURIComponent(decodedParamValue) + '&';
                        } else {
                            encodedParams += paramName + '&';
                        }
                    });
                    encodedParams = encodedParams.slice(0, -1);
                    url = url.replace(queryParamsString, encodedParams);
                }
            }
            return url;
        }

        function getDecodedParamValue(paramValue){
            try {
              paramValue = decodeURIComponent(paramValue);
            } catch(e) {
            }
            return paramValue;
        }


        /**
         * Encodes the url as follows
         *  - the path part is encoded through encodeURI
         *  - the url params are encoded through encodeURIComponent. This is done to encode special characters not encoded through encodeURI
         *
         * @param url
         * @returns {*}
         */
        function encodeUrl(url) {
            var index = url.indexOf('?');
            if (index > -1) {
                // encode the relative path
                url = encodeURI(url.substring(0, index)) + url.substring(index);
                // encode url params, not encoded through encodeURI
                url = encodeUrlParams(url);
            } else {
                url = encodeURI(url);
            }

            return url;
        }


      /**
       * This method removes double slashes in the url
       * e.g. "https://abc.com/service//hrdb/employee//api" will be returned as "https://abc.com/service/hrdb/employee/api"

       * Exceptions:
       * if the url starts with //, https://, http://, wss://, ws:// etc ignore these double slashes
       * if double slashes present in the url apart from the above places, replace the double slashes with single slash

       * @param url, string URL where double slashes will be removed
       * @returns {url}, sanitized url
       */
        function removeExtraSlashes(url) {
          var base64regex = /^data:image\/([a-z]{2,});base64,/;
          if (_.isString(url)) {
                /*
                * support for mobile apps having local file path url starting with file:/// and
                * support for base64 format
                * */
                if (_.startsWith(url, 'file:///') || base64regex.test(url)) {
                    return url;
                }
                return url.replace(new RegExp('([^:]\/)(\/)+', 'g'), '$1');
            }
        }

        /*This function returns the url to the image after checking the validity of url*/
        function getImageUrl(urlString, shouldEncode, defaultUrl) {
            /*In studio mode before setting picturesource, check if the studioController is loaded and new picturesource is in 'styles/images/' path or not.
             * When page is refreshed, loader.gif will be loaded first and it will be in 'style/images/'.
             * Prepend 'services/projects/' + $rootScope.project.id + '/web/resources/images/imagelists/'  if the image url is just image name in the project root,
             * and if the url pointing to resources/images/ then 'services/projects/' + $rootScope.project.id + '/web/'*/
            if (isValidWebURL(urlString)) {
                return urlString;
            }

            //If no value is provided for picturesource assign pictureplaceholder or default-image
            if ((CONSTANTS.isStudioMode && !isImageFile(urlString)) || !urlString) {
                urlString = defaultUrl || 'resources/images/imagelists/default-image.png';
            }

            if (CONSTANTS.isRunMode) {
                urlString = shouldEncode ? encodeUrl(urlString) : urlString;
            } else {
                urlString = getProjectResourcePath($rootScope.project.id) + urlString;
            }

            // if the resource to be loaded is inside a prefab
            if (stringStartsWith(urlString, 'services/prefabs')) {
                return urlString;
            }


            urlString = removeExtraSlashes(urlString);

            return urlString;
        }

        /*This function returns the url to the resource after checking the validity of url*/
        function getResourceURL(urlString) {
            if (isValidWebURL(urlString)) {
                return $sce.trustAsResourceUrl(urlString);
            }
            if (CONSTANTS.isRunMode) {
                return urlString;
            }

            // if the resource to be loaded is inside a prefab
            if (stringStartsWith(urlString, 'services/prefabs')) {
                return urlString;
            }

            urlString = getProjectResourcePath($rootScope.project.id) + urlString;
            return urlString;
        }

        /*This function returns the url to the backgroundImage*/
        function getBackGroundImageUrl(urlString) {
            if (urlString === '' || urlString === 'none') {
                return urlString;
            }
            return 'url(' + getImageUrl(urlString) + ')';
        }

        /* defining safe apply on root scope, so that it is accessible to all other $scope variables.*/
        $rootScope.$safeApply = function ($scope, fn) {
            if ($rootScope.$$phase || $scope.$$phase) {
                //don't worry, the value gets set and AngularJS picks up on it...
                triggerFn(fn);
            } else {
                //this will fire to tell angularjs to notice that a change has happened
                //if it is outside of it's own behavior...
                $scope.$apply(fn);
            }
        };

        /* util function which returns true if the given string starts with test string else returns false */
        function stringStartsWith(str, startsWith, ignoreCase) {
            if (!str) {
                return false;
            }

            var regEx = new RegExp('^' + startsWith, ignoreCase ? 'i' : []);

            return regEx.test(str);
        }

        /* util function which returns true if the given string starts with test string else returns false */
        function stringEndsWith(str, endsWith, ignoreCase) {
            if (!str) {
                return false;
            }

            var regEx = new RegExp(endsWith + '$', ignoreCase ? 'i' : []);

            return regEx.test(str);
        }

        /* function to check if provided object is empty*/
        function isEmptyObject(obj) {
            if (WM.isObject(obj) && !WM.isArray(obj)) {
                return Object.keys(obj).length === 0;
            }
            return false;
        }

        /* function to verify whether the email is valid or not*/
        function isValidEmail(email) {
            return REGEX.VALID_EMAIL.test(email);
        }

        /* function to verify whether the password is valid or not*/
        function isValidPassword(text) {
            return !!REGEX.VALID_PASSWORD.test(text);
        }

        // Valid field name should not contain any special chars other than _ and $
        function isValidFieldName(fieldName) {
            return (/^[0-9a-zA-Z_\$]+$/.test(fieldName));
        }

        function isValidMobileAppId(appId) {
            return !!REGEX.MOBILE_APP_ID.test(appId);
        }

        function getPropertyNode(prop) {
            return {
                'type'                : prop.type,
                'isPrimaryKey'        : prop.isPrimaryKey,
                'generator'           : prop.generator,
                'isRelatedPk'         : prop.isRelatedPk,
                'systemUpdated'       : prop.systemUpdated,
                'systemInserted'      : prop.systemInserted,
                'relatedEntityName'   : prop.relatedEntityName,
                'notNull'             : prop.notNull,
                'defaultValue'        : prop.defaultValue,
                'period'              : prop.period
            };
        }

        /* to handle special characters used while defining variables and page params */
        function checkSpecialCharacters(str) {
            if (hasSpecialCharacters(str)) {
                if (_.includes(str,"'")) {
                    str = str.replace(/'/g, "\\'");
                }
                return str = "['" + str + "']";
            } else {
                return str;
            }
        }

        /* fetch the column names and nested column names from the propertiesMap object */
        function fetchPropertiesMapColumns(propertiesMap, namePrefix, options) {
            var objects = {}, relatedColumnsArr = [], terminals = {}, info,
                columns = getClonedObject(propertiesMap.columns);

            /* iterated trough the propertiesMap columns of all levels and build object with columns having required configuration*/
            _.forEach(columns, function (val) {
                /* if the object is nested type repeat the above process for that nested object through recursively */
                if (val.isRelated) {
                    if (val.isList) {
                        return;
                    }
                    relatedColumnsArr.push(val);
                } else {
                    /* otherwise build object with required configuration */
                    var columnName = namePrefix ? namePrefix + '.' + val.fieldName : val.fieldName;
                    terminals[columnName] = getPropertyNode(val);
                    if (propertiesMap.isRelated) {
                        //For related columns, set not null as true for primary keys and not null
                        terminals[columnName].notNull = propertiesMap.notNull && val.notNull && val.isPrimaryKey;
                    }
                }
            });
            _.forEach(relatedColumnsArr, function (val) {
                //If a related column doesn't have further columns in it the adding the current column and returning
                if (_.isEmpty(val.columns)) {
                    var relColumnName = namePrefix ? namePrefix + '.' + val.relatedColumnName : val.relatedColumnName;
                    terminals[relColumnName] = getPropertyNode(val);
                    return;
                }
                 _.forEach(val.columns, function (col) {
                    if (val.isRelated) {
                        if (col.isPrimaryKey) {
                            col.isRelatedPk = 'true';
                        }
                        col.relatedEntityName = val.relatedEntityName;
                    }
                });

                var columnName = namePrefix ? namePrefix + '.' + val.fieldName : val.fieldName;
                objects[columnName] = getPropertyNode(val);
                info = fetchPropertiesMapColumns(val, val.fieldName, options);

                if (!options || (options && !options.filter)) {
                    //Extend the terminal object with the inner columns. If already present, ignore them.
                    _.assignWith(terminals, info, function (objValue, srcValue) {
                        return _.isUndefined(objValue) ? srcValue : objValue;
                    });
                } else {
                    switch (options.filter) {
                    case 'all':
                        WM.extend(terminals, info.terminals);
                        WM.extend(objects, info.objects);
                        break;
                    case 'objects':
                        WM.extend(objects, info);
                        break;
                    case 'terminals':
                        WM.extend(terminals, info);
                        break;
                    }
                }
            });

            if (!options || (options && !options.filter)) {
                return terminals;
            }
            switch (options.filter) {
            case 'all':
                return {'objects': objects, 'terminals': terminals};
            case 'objects':
                return objects;
            case 'terminals':
                return terminals;
            }
        }

        /*set empty values to all properties of  given object */
        function resetObjectWithEmptyValues(object) {
            var properties;
            if (object) {
                properties = {};
                WM.forEach(object, function (value, key) {
                    properties[key] = '';
                });
            }
            return properties;
        }

        /*function get current Page*/
        function getCurrentPage() {
            var pathName = location.pathname;
            return pathName.split('/').pop() || 'index.html';
        }

        /*function to find if executing in debug mode or normal mode*/
        function isDebugMode() {
            return getCurrentPage().indexOf('-debug') !== -1;
        }

        /*function get current Page*/
        function getIndexPage() {
            return isDebugMode() ? 'index-debug.html' : 'index.html';
        }

        /*function to go to a route in index page*/
        function redirectToIndexPage(path) {
            if (!path) {
                $window.location = indexPage;
            } else {
                $window.location = indexPage + '#' + path;
            }
        }

        /*function to go to a route in index page*/
        function redirectToLoginPage() {
            var locationHash = $location.$$path,
                currentPageName = getCurrentPage();

            /* store the reference url in local storage*/
            browserStorage.storeItem('wm.referenceUrlToStudio', currentPageName + '#' + locationHash);

            $window.location = CONSTANTS.LOGIN_PAGE;
        }

        /*function to handle the load event of the iframe which is called when the iframe is loaded after form submit to
         * handle manipulations after file upload.*/
        function handleUploadIFrameOnLoad(iFrameElement, successCallback, errorCallback, evt) {
            var serverResponse;
            /*removing event listener for the iframe*/
            iFrameElement.off('load', handleUploadIFrameOnLoad);
            /*obtaining the server response of the form submit and prefab import*/
            serverResponse = WM.element('#fileUploadIFrame').contents().find('body').text();
            if (evt && evt.currentTarget) {
                evt.currentTarget.responseText = serverResponse;
            }
            /*removing the iframe element from the DOM markup after import/upload is successful.*/
            iFrameElement.first().remove();
            /*triggering the callback function when succes response is encountered*/
            if (!serverResponse.errorDetails) {
                triggerFn(successCallback,  evt);
            } else {
                triggerFn(errorCallback);
            }
        }

        /*TODO: file upload fallback has been implemented currently only for prefabs. Need to implement for other scenarios.*/
        /*function to facilitate file upload fallback when HTML5 File API is not supported by the browser*/
        function fileUploadFallback(uploadConfig, successCallback, errorCallback) {
            /*creating a hidden iframe to facilitate file upload by way of form submit.*/
            var iFrameElement = WM.element('<iframe id="fileUploadIFrame" name="fileUploadIFrame" class="ng-hide"></iframe>'),
                formElement,
                formAction,
                dataArray,
                index,
                dataObj,
                dataElement,
                elementName,
                elementValue,
                key;

            if (uploadConfig) {
                formAction = uploadConfig.url;
            }

            /*appending iframe element to the body*/
            WM.element('body').append(iFrameElement);

            /*event handler for handling load event of iframe*/
            iFrameElement.on('load', function (evt) {
                handleUploadIFrameOnLoad(iFrameElement, successCallback, errorCallback, evt);
            });

            formElement = WM.element('*[name=' + uploadConfig.formName + ']').first();

            /*creating fields which are necessary as params for importing resources.*/
            if (uploadConfig.data) {
                dataArray = uploadConfig.data;
                /*iterating over data array*/
                for (index = 0; index < dataArray.length; index += 1) {
                    dataObj = dataArray[index];
                    /*iterating over each object to get element name and element value*/
                    for (key in dataObj) {
                        if (dataObj.hasOwnProperty(key)) {
                            elementName = key;
                            elementValue = dataObj[key];
                        }
                    }
                    /*creating element using element name and value obtained.*/
                    dataElement = WM.element('<input type="hidden" name="' + elementName + '" value="' + elementValue + '"/>');
                    /*appending element to formElement*/
                    formElement.append(dataElement);
                }
            }

            /*setting form attributes before form submit. Applying iframe as form target to avoid page reflow.*/
            formElement.attr({
                'target'  : 'fileUploadIFrame',
                'action'  : formAction,
                'method'  : 'post',
                'enctype' : 'multipart/form-data',
                'encoding': 'multipart/form-data'
            });

            /*triggering the form submit event*/
            formElement.submit();
        }

        /*
         * Util method to find the value of a key in the object
         * if key not found and create is true, an object is created against that node
         * Examples:
         * var a = {
         *  b: {
         *      c : {
         *          d: 'test'
         *      }
         *  }
         * }
         * Utils.findValue(a, 'b.c.d') --> 'test'
         * Utils.findValue(a, 'b.c') --> {d: 'test'}
         * Utils.findValue(a, 'e') --> undefined
         * Utils.findValue(a, 'e', true) --> {} and a will become:
         * {
         *   b: {
         *      c : {
         *          d: 'test'
         *      }
         *  },
         *  e: {
         *  }
         * }
         */
        function findValueOf(obj, key, create) {

            if (!obj || !key) {
                return;
            }

            if (!create) {
                return _.get(obj, key);
            }

            var parts = key.split('.'),
                keys  = [],
                skipProcessing;

            _.forEach(parts, function (part) {
                if (!parts.length) { // if the part of a key is not valid, skip the processing.
                    skipProcessing = true;
                    return false;
                }

                var subParts = part.match(/\w+/g),
                    subPart;

                while (subParts.length) {
                    subPart = subParts.shift();
                    keys.push({'key': subPart, 'value': subParts.length ? [] : {}}); // determine whether to create an array or an object
                }
            });

            if (skipProcessing) {
                return undefined;
            }

            _.forEach(keys, function (_key) {
                var tempObj = obj[_key.key];
                if (!WM.isObject(tempObj)) {
                    tempObj = getValidJSON(tempObj);
                    if (!tempObj) {
                        tempObj = _key.value;
                    }
                }
                obj[_key.key] = tempObj;
                obj           = tempObj;
            });

            return obj;
        }

        /*
         * Util method to replace patterns in string with object keys or array values
         * Examples:
         * Utils.replace('Hello, ${first} ${last} !', {first: 'wavemaker', last: 'ng'}) --> Hello, wavemaker ng
         * Utils.replace('Hello, ${0} ${1} !', ['wavemaker','ng']) --> Hello, wavemaker ng
         * Examples if parseError is true:
         * Utils.replace('Hello, {0} {1} !', ['wavemaker','ng']) --> Hello, wavemaker ng
         */
        function replace(template, map, parseError) {
            var regEx = REGEX.REPLACE_PATTERN;
            if (!template) {
                return;
            }

            if (parseError) {
                regEx = /\{([^\}]+)\}/g;
            }
            return template.replace(regEx, function (match, key) {
                return _.get(map, key);
            });
        }

        //get the boolean value
        function getBooleanValue(val) {
            if (val === true || val === 'true') {
                return true;
            }
            if (val === false || val === 'false') {
                return false;
            }
            return val;
        }

        /* returns the prefab names loaded in the markup of current page */
        function getLoadedPrefabNames() {
            return WM.element('[prefabname]').map(function () {return WM.element(this).attr('prefabname'); });
        }

        function getNodeFromJson(tree, nodeId, parentNodeId) {
            var nodeUId,
                parentNodeUId,
                nodeIndex,
                nodeStartIndex,
                node;

            /*Loop through the nodeMap of the tree.*/
            WM.element.each(tree[0].nodeMap, function (uid, name) {
                /*Check if the name matches with the specified nodeId*/
                if (name === nodeId) {
                    nodeUId = uid;

                    if (!parentNodeId) {
                        return false;
                    }
                    /*Check if the name of the parent node matches with the parentNodeId.
                    * If matched, break out of the loop.*/
                    parentNodeUId = nodeUId.substr(0, nodeUId.lastIndexOf('-'));
                    if (tree[0].nodeMap[parentNodeUId] === parentNodeId) {
                        return false;
                    }
                }
            });

            /*Check for sanity.*/
            if (nodeUId) {
                nodeIndex = nodeUId.split('-');
                nodeStartIndex = nodeIndex.shift();
                node = tree[nodeStartIndex];

                /*Get the node based on the nodeIndex*/
                nodeIndex.forEach(function (index) {
                    node = node.children[index];
                });
                return node;
            }
        }

        function addNodeToJson(tree, nodeId, parentNodeUId, options, parentNodeId) {

            options = options || {};

            var node = {
                    'id'            : nodeId,
                    'label'         : options.label,
                    'collapsed'     : options.collapsed,
                    'class'         : options.class,
                    'active'        : options.active,
                    'props'         : options.nodeProps,
                    'isDeletable'   : options.isDeletable,
                    'title'         : options.title,
                    'onDelete'      : options.onDelete,
                    'hasChildren'   : options.hasChildren,
                    'deepSearch'   : options.deepSearch
                },
                parentIndex,
                parentStartIndex,
                parentNode,
                existingNode;

            /*Return if the 'tree' is undefined*/
            if (WM.isUndefined(tree)) {
                return;
            }
            /*If parentNodeUId is not specified, insert the node into the tree and return*/
            if (WM.isUndefined(parentNodeUId) && WM.isUndefined(parentNodeId)) {
                parentNode = tree[0];
            } else {
                if (parentNodeId && !parentNodeUId) {
                    parentNodeUId = getNodeFromJson(tree, parentNodeId).uid;
                }
                parentIndex = parentNodeUId.split('-');
                parentStartIndex = parentIndex.shift();
                parentNode = tree[parentStartIndex];
                parentIndex.forEach(function (index) {
                    parentNode = parentNode.children[index];
                });
            }

            /* case, no node in the tree (empty tree) */
            if (!parentNode) {
                /* make it as a root node and push into the tree */
                node.uid = '0';
                node.nodeMap = {
                    '0': node.id
                };
                tree.push(node);
                return node;
            }

            /*Case: The tree has no children*/
            if (!(parentNode.children) || !(WM.isArray(parentNode.children))) {
                /*Initialize the tree children*/
                parentNode.children = [];
            } else {
                /*Check if a node with the specified id already exists in the tree children and return if found*/
                existingNode = getNode(parentNode.children, nodeId);
                if (existingNode) {
                    return existingNode;
                }
            }
            node.uid = parentNode.uid + '-' + (parentNode.children.length);
            /*Insert the node as a child to the tree and return*/
            parentNode.children.push(node);

            tree[0].nodeMap[node.uid] = nodeId;
            return node;
        }

        function removeJsonNodeChildren(tree, nodeId, parentNodeId) {
            var node = getNodeFromJson(tree, nodeId, parentNodeId);
            /*Check for sanity.*/
            if (node) {
                node.children = undefined;
            }
        }

        function getValidJSON(content) {
            if (!content) {
                return false;
            }
            try {
                var parsedIntValue = parseInt(content, 10);
                /*obtaining json from editor content string*/
                return WM.isObject(content) || !isNaN(parsedIntValue) ? content : JSON.parse(content);
            } catch (e) {
                /*terminating execution if new variable object is not valid json.*/
                return false;
            }
        }

        /* prettify the js content */
        function prettifyJS(content) {
            if (window.js_beautify) {
                return window.js_beautify(content);
            }
            loadScriptsInSync(['_static_/components/js-beautify/js/lib/beautify.js']);
            return window.js_beautify(content);
        }

        /* prettify the html content */
        function prettifyHTML(content) {
            if (window.html_beautify) {
                return window.html_beautify(content);
            }
            loadScriptsInSync(['_static_/components/js-beautify/js/lib/beautify-html.js']);
            return window.html_beautify(content);
        }

        /* prettify the css content */
        function prettifyCSS(content) {
            if (window.css_beautify) {
                return window.css_beautify(content);
            }
            loadScriptsInSync(['_static_/components/js-beautify/js/lib/beautify-css.js']);
            return window.css_beautify(content);
        }

        function getActionFromKey(event) {

            var ctrlOrMetaKey = isAppleProduct ? event.metaKey : event.ctrlKey,
                shiftKey      = event.shiftKey,
                altKey        = event.altKey;

            if (isAppleProduct) {
                if (event.which === 8) {
                    return 'DELETE';
                }
                if (event.metaKey && event.which === 91) { // check for cmd + f in mac for db search
                    return 'DB-FIND';
                }
            } else {
                if (event.which === 46) {
                    return 'DELETE';
                }
                if (event.ctrlKey && event.which === 70) { // check for ctrl+f for db search
                    return 'DB-FIND';
                }
            }

            if (ctrlOrMetaKey) {
                switch (event.which) {
                case 80:
                    return altKey ? 'PREVIEW' : 'UNKNOWN';
                case 81:
                    return altKey ? 'RUN-DEBUG' : 'UNKNOWN';
                case 82:
                    return altKey ? 'RUN' : 'UNKNOWN';
                case 68:
                    return altKey ? 'DEPLOY' : 'UNKNOWN';
                case 83:
                    return 'SAVE';
                case 88:
                    return 'CUT';
                case 67:
                    return 'COPY';
                case 86:
                    return 'PASTE';
                case 90:
                    return event.shiftKey ? 'REDO' : 'UNDO';
                case 37:
                    return 'CTRL-LEFT-ARROW';
                case 38:
                    return 'CTRL-UP-ARROW';
                case 39:
                    return 'CTRL-RIGHT-ARROW';
                case 40:
                    return 'CTRL-DOWN-ARROW';
                }
            } else if (shiftKey) {
                switch (event.which) {
                case 9:
                    return 'SHIFT+TAB';
                case 37:
                    return 'SHIFT+LEFT';
                case 38:
                    return 'SHIFT+UP';
                case 39:
                    return 'SHIFT+RIGHT';
                case 40:
                    return 'SHIFT+DOWN';
                }
            } else {
                switch (event.which) {
                case 8:
                    return 'BACKSPACE';
                case 9:
                    return 'TAB';
                case 13:
                    return 'ENTER';
                case 27:
                    return 'ESC';
                case 37:
                    return 'LEFT-ARROW';
                case 38:
                    return 'UP-ARROW';
                case 39:
                    return 'RIGHT-ARROW';
                case 40:
                    return 'DOWN-ARROW';
                }
            }

            return 'UNKNOWN';
        }

        function preventCachingOf(url) {
            return url;
        }

        function getAllKeysOf(obj, prefix) {
            var keys = [];
            prefix = prefix ? prefix + '.' : '';

            if (WM.isObject(obj) && !WM.isArray(obj)) {
                Object.keys(obj).forEach(function (key) {
                    keys.push(prefix + key);
                    keys = keys.concat(getAllKeysOf(obj[key], prefix + key));
                });
            }
            return keys;
        }

        /* returns the requested service if available */
        function getService(serviceName) {
            if (!serviceName) {
                return;
            }
            /* get a reference to the element where ng-app is defined */
            var appEl = WM.element('[id=ng-app]'), injector;
            if (appEl) {
                try {
                    injector = appEl.injector(); // get the angular injector
                    if (injector) {
                        return injector.get(serviceName); // return the service
                    }
                } catch (e) {
                    return undefined;
                }
            }
        }

        /*removes protocol information from url*/
        function removeProtocol(url) {
            var newUrl;
            if (url.indexOf('http') !== -1) {
                /*Removing the protocol from the url*/
                if (url.indexOf('https:') !== -1) {
                    newUrl = url.substr(6);
                } else {
                    newUrl = url.substr(5);
                }
            } else {
                newUrl = url;
            }
            return newUrl;
        }

        function getCookieByName(name) {
            return $cookies.get(name);
        }

        /*Function to check whether the specified object is a pageable object or not.*/
        function isPageable(obj) {
            var pageable = {
                'content'         : [],
                'first'           : true,
                'last'            : true,
                'number'          : 0,
                'numberOfElements': 10,
                'size'            : 20,
                'sort'            : null,
                'totalElements'   : 10,
                'totalPages'      : 1
            };
            return (WM.equals(_.keys(pageable), _.keys(obj).sort()));
        }

        /* returns true if HTML5 File API is available else false*/
        function isFileUploadSupported() {
            return (window.File && window.FileReader && window.FileList && window.Blob);
        }

        function processMarkup(markupStr) {
            if (!markupStr) {
                return '';
            }
            markupStr = getValidMarkUp(markupStr);

            var content = markupStr.replace(/>\s+</g, '><'),
                root = WM.element('<div></div>');

            /* wm-livelist and wm-login elements will have ngController directive this will result in
             * error:multidir Multiple Directive Resource Contention
             * to resolve this issue,
             * RunMode: remove the ngController directive from the element and add a wrapper with the controller name
             * StudioMode: remove the ngController directive
             */
            if (CONSTANTS.isRunMode) {
                root.html(content).find('wm-list, wm-login, wm-template')
                    .each(function () {
                        var widget = WM.element(this),
                            wrapper,
                            ctrlName = widget.attr('data-ng-controller') || widget.attr('ng-controller');

                        if (ctrlName) {
                            wrapper = WM.element('<div class="app-controller"></div>').attr('data-ng-controller', ctrlName);
                            widget.removeAttr('data-ng-controller ng-controller').wrap(wrapper);
                        }
                    });
                content = root[0].innerHTML;
            }

            return content;
        }
        /*Function to check if date time type*/
        function isDateTimeType(type) {
            if (_.includes(type, '.')) {
                type = _.toLower(extractType(type));
            }
            return _.includes(['date', 'time', 'timestamp', 'datetime', 'localdatetime'], type);
        }
        function getDataSetWidgets() {
            return dataSetWidgets;
        }
        /*Function to get days options*/
        function getDaysOptions() {
            return daysOptions;
        }
        /*Function to get date time default formats*/
        function getDateTimeDefaultFormats() {
            return DEFAULT_FORMATS;
        }

        // This function returns the default format of the selected type from the DEFAULT_FORMATS obj
        function getDateTimeFormatForType(type) {
            return DEFAULT_FORMATS[_.toUpper(type)];
        }

        // This function returns the default format of the selected type from the DEFAULT_FORMATS obj
        function getLocaleDateTimeFormatForType(type) {
            var FORMATS = {
                'DATE'           : $locale.DATETIME_FORMATS.mediumDate,
                'TIME'           : $locale.DATETIME_FORMATS.mediumTime,
                'TIMESTAMP'      : $locale.DATETIME_FORMATS.medium,
                'DATETIME'       : $locale.DATETIME_FORMATS.medium,
                'LOCALDATETIME'  : $locale.DATETIME_FORMATS.medium,
                'DATETIME_ORACLE': $locale.DATETIME_FORMATS.medium,
                'DATE_TIME'      : $locale.DATETIME_FORMATS.medium
            };
            return FORMATS[_.toUpper(type)];
        }

        /*Function that checks if the dataset is valid or not*/
        function isValidDataSet(dataset) {
            return ((WM.isArray(dataset) && dataset.length > 0) || (WM.isObject(dataset) && Object.keys(dataset).length > 0));
        }

        /* to generate all individual contents from the combined version(min.html) of the page */
        function parseCombinedPageContent(pageContent, pageName, applyStylesIfNotExists) {
            /*creating a parent for the content & converting to dom-like element, to process the content*/
            var pageDom = WM.element('<div>' + pageContent + '</div>'),
                htmlEle = pageDom.find('script[id="' + pageName + '.html' + '"]'),
                variableContext = '_' + pageName + 'Page_Variables_',
                $styles;

            htmlEle.remove();
            /* remove the previously loaded styles in studio-mode*/

            if (CONSTANTS.isStudioMode) {
                WM.element('script[id="' + pageName + '.css' + '"]').remove();
            }

            $styles = pageDom.find('style');

            try {
                /*load the styles & scripts*/
                if (applyStylesIfNotExists) {
                    if (!WM.element(document.head).find('style[id="' + pageName + '.css"]').length) {
                        // apply the styles related to template
                        WM.element(document.head).append($styles);
                    }
                }
            } catch (e) {
                console.log(e.message);
            }
            return {
                html: htmlEle.html() || '',
                variables: window[variableContext] || {},
                css: $styles
            };
        }

        /*
         * extracts and returns the last bit from full typeRef of a field
         * e.g. returns 'String' for typeRef = 'java.lang.String'
         * @params: {typeRef} type reference
         */
        function extractType(typeRef) {
            var type;
            if (!typeRef) {
                return 'string';
            }
            type = typeRef && _.toLower(typeRef.substring(typeRef.lastIndexOf('.') + 1));
            type = type === 'localdatetime' ? 'datetime' : type;
            return type;
        }

        /* returns true if the provided data type matches number type */
        function isNumberType(type) {
            return (NUMBER_TYPES.indexOf(extractType(type).toLowerCase()) !== -1);
        }

        function isDeleteResourceAllowed(context, path) {
            return (!SYSTEM_FOLDER_PATHS[context] || SYSTEM_FOLDER_PATHS[context].indexOf(path) === -1);
        }

        /*Function to generate a random number*/
        function random() {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        }

        /*Function to generate a guid based on random numbers.*/
        function generateGUId() {
            return random() + '-' + random() + '-' + random();
        }

        /*to check duplicate names*/
        function isDuplicateName(list, newName, caseSensitive) {
            var retVal = false,
                i;
            /* if list or name doesn't exist, return  */
            if (!list || !newName) {
                return retVal;
            }
            if (caseSensitive) {
                for (i = 0; i < list.length; i += 1) {
                    /* if name found in list, return true */
                    if (list[i].toLowerCase() === newName.toLowerCase()) {
                        retVal = true;
                        break;
                    }
                }
            } else {
                if (list.indexOf(newName) !== -1) {
                    retVal = true;
                }
            }
            return retVal;
        }

        /*
         * scrolls the given element into the visible area of the container.
         * @params: {element} element to be scrolled in to view
         * @params: {container} container of the element
         */
        function scrollIntoView(element, container, offSetParent) {
            var $container = WM.element(container),
                $element = WM.element(element),
                containerTop = $container.scrollTop(),
                containerHeight = $container.height(),
                containerBottom = containerTop + containerHeight,
                elemTop = $element[0] && $element[0].offsetTop,
                elemBottom,
                $parent;
            //If parent is passed, conside the parent offset element also
            if (offSetParent) {
                $parent = $element.parents(offSetParent);
                if ($parent.length) {
                    elemTop = elemTop + $parent[0].offsetTop + $element.height();
                }
            }
            elemBottom = elemTop + $element.height();
            if (elemTop < containerTop) {
                $container.scrollTop(elemTop);
            } else if (elemBottom > containerBottom) {
                $container.scrollTop(elemBottom - containerHeight);
            }
        }

        /*function to compare two arrays and check if the contents are equal*/
        function arraysEqual(arr1, arr2) {
            var i;
            if (arr1.length !== arr2.length) {
                return false;
            }
            for (i = 0; i < arr1.length; i++) {
                if (arr1[i] !== arr2[i]) {
                    return false;
                }
            }
            return true;
        }

        /*Iterate over events and populate 'Javascript' with appropriate event name and args*/
        function getNewEventsObject(prefix, events, args) {
            var newEventName,
                newCustomEvent,
                eventNumber = 0,
                customEvents = [];
            _.forEach(events, function (event, index) {
                if (event === WIDGET_CONSTANTS.EVENTS.JAVASCRIPT) {
                    newCustomEvent = prefix;
                    newEventName = newCustomEvent + args;
                    while (_.includes(events, newEventName)) {
                        eventNumber += 1;
                        newCustomEvent = prefix + eventNumber;
                        newEventName = newCustomEvent + args;
                    }
                    events[index] = newEventName;
                    customEvents = customEvents.concat(newCustomEvent);
                }
            });
            return {
                'events' : events,
                'customEvents' : customEvents
            };
        }

        /*
         * Evaluates expression passed and returns corresponding value of object
         * @params: {object} object from which values are extracted
         * @params: {expression} expression to be evaluated
         * @params: {scope} scope of the fucntion called. Used for eval
         */
        function getEvaluatedExprValue(object, expression, scope) {
            var val;
            /**
             * Evaluate the expression with the scope and object.
             * $eval is used, as expression can be in format of field1 + ' ' + field2
             * $eval can fail, if expression is not in correct format, so attempt the eval function
             */
            val = _.attempt(function () {
                return scope.$eval(expression, object);
            });
            /**
             * $eval fails if field expression has spaces. Ex: 'field name' or 'field@name'
             * As a fallback, get value directly from object or scope
             */
            if (_.isError(val)) {
                val = _.get(object, expression) || _.get(scope, expression);
            }
            return val;
        }

        //extend jQuery -- referred from jQuery-UI
        $.fn.extend({
            scrollParent: function (includeHidden) {
                var position = this.css('position'),
                    excludeStaticParent = position === 'absolute',
                    overflowRegex = includeHidden ? /(auto|scroll|hidden)/ : /(auto|scroll)/,
                    docHeight = document.body.clientHeight,
                    scrollParent = this.parents().filter(function () {
                        var parent = $(this),
                            hasOverFlowAuto;
                        if (excludeStaticParent && parent.css('position') === 'static') {
                            return false;
                        }
                        hasOverFlowAuto = overflowRegex.test(parent.css('overflow') + parent.css('overflow-y'));
                        return hasOverFlowAuto && this.clientHeight <= docHeight;
                    }).eq(0);

                return position === 'fixed' || !scrollParent.length ? $(this[0].ownerDocument || document) : scrollParent;
            }
        });

        function getProjectResourcePath(projectId) {
            return 'services/projects/' + projectId + '/resources/content/web/';
        }

        function getVariableNameFromExpr(expr) {
            var variableRegex = /^bind:Variables\.(.*)\.dataSet/,
                matchValue = expr.match(variableRegex);
            return matchValue && matchValue[1];
        }

        /**
         * Returns a deep cloned replica of the passed object/array
         * @param object object/array to clone
         * @returns a clone of the passed object
         */
        function getClonedObject(object) {
            return _.cloneDeep(object);
        }
        /*  This function returns date object. If val is undefined it returns invalid date */
        function getValidDateObject(val) {
            if (WM.isDate(val)) {
                return val;
            }
            /*if the value is a timestamp string, convert it to a number*/
            if (!isNaN(val)) {
                val = parseInt(val, 10);
            } else {
                /*if the value is in HH:mm:ss format, it returns a wrong date. So append the date to the given value to get date*/
                if (!(new Date(val).getTime())) {
                    val = moment((moment().format('YYYY-MM-DD') + ' ' + val), 'YYYY-MM-DD HH:mm:ss A');
                }
            }
            return new Date(moment(val).valueOf());
        }

        function getMatchModes() {
            //TODO: i18n Pending
            return {
                'startignorecase'    : 'Starts with ignore case',
                'start'              : 'Starts with',
                'endignorecase'      : 'Ends with ignore case',
                'end'                : 'Ends with',
                'anywhereignorecase' : 'Contains ignore case',
                'anywhere'           : 'Contains',
                'exact'              : 'Is equal to',
                'exactignorecase'    : 'Is equal to ignore case'
            };
        }

        // The bound value is replaced with {{item.fieldname}} here. This is needed by the liveList when compiling inner elements
        function updateTmplAttrs($root, parentDataSet, name) {

            var _parentDataSet = parentDataSet.replace('bind:', ''),
                regex          = new RegExp('(' + _parentDataSet + ')(\\[0\\])?(.data\\[\\$i\\])?(.content\\[\\$i\\])?(\\[\\$i\\])?', 'g'),
                currentItemRegEx,
                currentItemWidgetsRegEx;

            if (name) {
                currentItemRegEx        = new RegExp('(Widgets.' + name + '.currentItem)\\b', 'g');
                currentItemWidgetsRegEx = new RegExp('(Widgets.' + name + '.currentItemWidgets)\\b', 'g');
            }

            $root.find('*').each(function () {
                var node = this;

                _.forEach(node.attributes, function (attr) {
                    var value = attr.value;

                    if (_.startsWith(value, 'bind:')) {
                        /*if the attribute value is "bind:xxxxx.xxxx", either the dataSet/scopeDataSet has to contain "xxxx.xxxx" */
                        if (_.includes(value, _parentDataSet) && value !== 'bind:' + _parentDataSet) {
                            value = value.replace('bind:', '');
                            value = value.replace(regex, 'item');
                            value = 'bind:' + value;
                        }
                        //Replace item if widget property is bound to livelist currentItem
                        if (currentItemRegEx && currentItemRegEx.test(value)) {
                            value = value.replace(currentItemRegEx, 'item');
                        }
                        if (currentItemWidgetsRegEx && currentItemWidgetsRegEx.test(value)) {
                            value = value.replace(currentItemWidgetsRegEx, 'currentItemWidgets');
                        }

                        attr.value = value;
                    }
                });
            });
        }
        // expose the methods on the service instance.

        function sort(collection, key, caseSensitive) {
            return _.sortBy(collection, function (item) {
                if (item) {
                    return key
                        ? ((item[key] && !caseSensitive && item[key].toLowerCase) ? item[key].toLowerCase() : item[key]) //object
                        : !caseSensitive && item.toLowerCase ? item.toLowerCase() : item; //array
                }
            });
        }

        function isVariableOrActionEvent(expr){
            return _.startsWith(expr, 'Variables.') || _.startsWith(expr, 'Actions.') || _.startsWith(expr, 'Variables[') || _.startsWith(expr, 'Actions[') ;
        }

        //Function to evaluate expression
        function evalExp(scope, evtValue) {
            var d = $q.defer();
            //Modifying expression in to array notation for variables with special characters in name
            if (_.includes(evtValue, 'Variables.') || _.includes(evtValue, 'Actions.')) {
                var parts = evtValue.split('.');
                evtValue = parts[0] + '["' + parts[1] + '"].' + parts[2];
            }
            //Evaluating in timeout so that the binding get updated
            $timeout(function () {
                //Evaluating for Variables,Widgets and Form events inside list
                if (isVariableOrActionEvent(evtValue) || _.startsWith(evtValue, 'Widgets.') || !_.includes(evtValue, '.')) {
                    scope.$eval(evtValue);
                } else {
                    $rootScope.$emit('invoke-service', evtValue);//Invoking Prefab events
                }

                d.resolve();
            });

            return d.promise;
        }

        //Triggers custom events passed
        function triggerCustomEvents(event, customEvents, callBackScope, data, variable, info) {
            var retVal,
                firstArg = variable || event;
            _.forEach(_.split(customEvents, ';'), function (eventValue) {
                /* if event value is javascript, call the function defined in the callback scope of the variable */
                if (eventValue === WIDGET_CONSTANTS.EVENTS.JAVASCRIPT) {
                    retVal = triggerFn(callBackScope[variable && variable.name + event], firstArg, data, info);
                }
                if (_.startsWith(eventValue, 'Widgets.') || isVariableOrActionEvent(eventValue)) {
                    evalExp(callBackScope, eventValue);
                    return;
                }
                if (eventValue === WIDGET_CONSTANTS.EVENTS.STOP_PROP_FN) {
                    event && event.stopPropagation && event.stopPropagation();
                    return;
                }
                if (_.includes(eventValue, '(')) {
                    retVal = triggerFn(_.get(callBackScope, eventValue.substring(0, eventValue.indexOf('('))), firstArg, data, info);
                } else {
                    // [fallback - 8.3.0] for case where variable re-name migration fails: happens when Variable is not found in the current context
                    // for example, an App variable tries to call a Page variable, the Page variable will not be found in the App context
                    $timeout(function () {
                        $rootScope.$emit("invoke-service", eventValue, {scope: callBackScope});
                        $rootScope.$safeApply(callBackScope);
                    }, null, false);
                }
            });
            return retVal;
        }
        //Construct the form data params from the URL
        function setParamsFromURL(queryParams, params) {
            queryParams = _.split(queryParams, '&');
            _.forEach(queryParams, function (param) {
                param = _.split(param, '=');
                params[param[0]] = decodeURIComponent(_.join(_.slice(param, 1), '='));
            });
        }

        /**
         * Simulates file download in an app through creating and submitting a hidden form in DOM.
         * The action will be initiated through a Service Variable
         *
         * Query Params
         * The request params like query params are added as hidden input elements
         *
         * Header Params
         * The header params for a request are also added along with hidden input elements.
         * This is done as headers can not be set for a form POST call from JavaScript
         *
         * Finally, request parameters are sent as follows:
         * For a GET request, the request data is sent along with the query params.
         * For POST, it is sent as request body.
         *
         * @param variable: the variable that is called from user action
         * @param requestParams object consisting the info to construct the XHR request for the service
         */
        function downloadThroughIframe(requestParams, success) {
            var iFrameElement,
                formEl,
                paramElement,
                queryParams     = '',
                IFRAME_NAME     = 'fileDownloadIFrame',
                FORM_NAME       = 'fileDownloadForm',
                CONTENT_TYPE    = 'Content-Type',
                url             = requestParams.url,
                encType         = _.get(requestParams.headers, CONTENT_TYPE),
                params          = _.pickBy(requestParams.headers, function (val, key) {return key !== CONTENT_TYPE; }),
                WS_CONSTANTS    = getService('WS_CONSTANTS');

            /* look for existing iframe. If exists, remove it first */
            iFrameElement = $('#' + IFRAME_NAME);
            if (iFrameElement.length) {
                iFrameElement.first().remove();
            }
            iFrameElement = WM.element('<iframe id="' + IFRAME_NAME + '" name="' + IFRAME_NAME + '" class="ng-hide"></iframe>');
            formEl        = WM.element('<form id="' + FORM_NAME + '" name="' + FORM_NAME + '"></form>');
            formEl.attr({
                'target'  : iFrameElement.attr("name"),
                'action'  : url,
                'method'  : requestParams.method,
                'enctype' : encType
            });

            /* process query params, append a hidden input element in the form against each param */
            queryParams += url.indexOf('?') !== -1 ? url.substring(url.indexOf('?') + 1) : '';
            queryParams += encType === WS_CONSTANTS.CONTENT_TYPES.FORM_URL_ENCODED ? ((queryParams ? '&' : '') + requestParams.dataParams) : '';

            //For Non body methods only, set the input fields from query parameters
            if (_.includes(WS_CONSTANTS.NON_BODY_HTTP_METHODS, _.toUpper(requestParams.method))) {
                setParamsFromURL(queryParams, params); //Set params for URL query params
            }
            setParamsFromURL(requestParams.data, params); //Set params for request data
            _.forEach(params, function (val, key) {
                paramElement = WM.element('<input type="hidden">');
                paramElement.attr({
                    'name'  : key,
                    'value' : val
                });
                formEl.append(paramElement);
            });

            /* append form to iFrame and iFrame to the document and submit the form */
            WM.element('body').append(iFrameElement);

            // timeout for IE 10, iframeElement.contents() is empty in IE 10 without timeout
            $timeout(function () {
                iFrameElement.contents().find('body').append(formEl);
                formEl.submit();
                triggerFn(success);
            }, 100);
        }

        function triggerOnTimeout(success) {
            $timeout(function () { triggerFn(success); }, 500);
        }

        function downloadFilefromResponse(response, headerFn, success, error) {
            // check for a filename
            var filename = '',
                filenameRegex,
                matches,
                type,
                blob,
                URL,
                downloadUrl,
                popup,
                disposition = headerFn('Content-Disposition');
            if (disposition && disposition.indexOf('attachment') !== -1) {
                filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                matches = filenameRegex.exec(disposition);
                if (matches !== null && matches[1]) {
                    filename = matches[1].replace(/['"]/g, '');
                }
            }

            type = headerFn('Content-Type');
            blob = new Blob([response], { type: type });

            if (typeof window.navigator.msSaveBlob !== 'undefined') {
                // IE workaround for "HTML7007: One or more blob URLs were revoked by closing the blob for which they were created. These URLs will no longer resolve as the data backing the URL has been freed."
                if (window.navigator.msSaveBlob(blob, filename)) {
                    triggerOnTimeout(success);
                } else {
                    triggerFn(error);
                }
            } else {
                URL         = window.URL || window.webkitURL;
                downloadUrl = URL.createObjectURL(blob);

                if (filename) {
                    // use HTML5 a[download] attribute to specify filename
                    var a = document.createElement("a"),
                        reader;
                    // safari doesn't support this yet
                    if (typeof a.download === 'undefined') {
                        reader = new FileReader();
                        reader.onloadend = function () {
                            var url   = reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;'),
                                popup = window.open(url, '_blank');
                            if (!popup) {
                                window.location.href = url;
                            }
                            url = undefined; // release reference before dispatching
                        };
                        reader.onload = triggerOnTimeout(success);
                        reader.onerror = error;
                        reader.readAsDataURL(blob);
                    } else {
                        a.href = downloadUrl;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        triggerOnTimeout(success);
                    }
                } else {
                    popup = window.open(downloadUrl, '_blank');
                    if (!popup) {
                        window.location.href = downloadUrl;
                    }
                }

                $timeout(function () { URL.revokeObjectURL(downloadUrl); }, 100); // cleanup
            }
        }

        /**
         * This function returns the cookieValue if xsrf is enabled.
         * In device, xsrf cookie is stored in localStorage.
         * @returns xsrf cookie value
         */
        function isXsrfEnabled() {
            if (CONSTANTS.hasCordova) {
                return localStorage.getItem(CONSTANTS.XSRF_COOKIE_NAME);
            }
            return getCookieByName(CONSTANTS.XSRF_COOKIE_NAME);
        }

        /**
         * This function includes xsrf headerName and cookie value in the request headers for mobile.
         * xsrf cookie value will be accessed from localStorage.
         * @param config
         * @returns config including xsrf header
         */
        function addXsrfCookieHeader(config) {
            if (isXsrfEnabled()) {
                var xsrfToken      = localStorage.getItem(CONSTANTS.XSRF_COOKIE_NAME),
                    xsrfHeaderName = $http.defaults.xsrfHeaderName;

                config.headers = config.headers || {};
                config.headers[xsrfHeaderName] = xsrfToken;
            }
            return config;
        }

        function downloadThroughAnchor(config, success, error) {
            var url     = config.url,
                method  = config.method,
                data    = config.dataParams || config.data,
                headers = config.headers;

            headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded';

            getService('BaseService').send({
                'target' : 'WebService',
                'action' : 'invokeRuntimeRestCall',
                'method' : method,
                'config' : {
                    'url'    : url,
                    'method' : method,
                    'headers': headers
                },
                'data'   : data,
                'responseType': 'arraybuffer'
            }, function (response, config) {
                setTimeout(function () {
                    downloadFilefromResponse(response, config.headers, success, error);
                }, 900);
            }, function (err) {
                triggerFn(error);
                console.log('error', err);
            });
        }

        // This function adds current timestamp to the fileName.
        function getModifiedFileName(fileName, exportFormat) {
            var fileExtension,
                currentTimestamp = Date.now();

            if (exportFormat) {
                fileExtension = exportTypesMap[exportFormat];
            } else {
                fileExtension = '.' + _.last(_.split(fileName, '.'));
                fileName = _.replace(fileName, fileExtension, '');
            }
            return fileName + '_' + currentTimestamp + fileExtension;
        }

        /**
         * Downloads a file in the browser.
         * Two methods to do so, namely:
         * 1. downloadThroughAnchor, called if
         *      - if a header is to be passed
         *      OR
         *      - if security is ON and XSRF token is to be sent as well
         * NOTE: This method does not work with Safari version 10.0 and below
         *
         * 2. downloadThroughIframe
         *      - this method works across browsers and uses an iframe to downlad the file.
         * @param requestParams request params object
         * @param fileName name for the downloaded file via cordova file transfer in device
         * @param exportFormat downloaded file format
         */
        function simulateFileDownload(requestParams, fileName, exportFormat, success, error) {
            /*success and error callbacks are executed incase of downloadThroughAnchor
            Due to technical limitation cannot be executed incase of iframe*/
            if (CONSTANTS.hasCordova) {
                $rootScope.$emit('device-file-download', requestParams, getModifiedFileName(fileName, exportFormat));
            } else if (!_.isEmpty(requestParams.headers) || isXsrfEnabled()) {
                downloadThroughAnchor(requestParams, success, error);
            } else {
                downloadThroughIframe(requestParams, success);
            }
        }


        //converts the csv representation of roles to array
        function getWidgetRolesArrayFromStr(val) {
            var UNICODE_COMMA_REGEX = /&#44;/g;

            val = val || '';
            if (val === '') {
                return [];
            }
            // replace the unicode equivalent of comma with comma
            return _.split(val, ',').map(function (v) {
                return _.trim(v).replace(UNICODE_COMMA_REGEX, ',');
            });
        }

        // Based on the type of content, sets it as text or html.
        // Usage: Used for setting the caption for widgets.
        function setNodeContent(nodeRef, content) {
            if (WM.isObject(content)) {
                nodeRef.text(JSON.stringify(content));
            } else {
                nodeRef.html(($sce.trustAs($sce.HTML, (WM.isDefined(content) ? content : '').toString()).toString()));
            }
        }
        /**
         * Returns the orderBy Expression based on the 'sort 'option in pageable object
         * returned by backend
         * @param pageableObj
         * @returns {string}
         */
        function getOrderByExpr(pageableObj) {
            pageableObj = pageableObj || [];
            var expressions       = [],
                KEY_VAL_SEPARATOR = ' ',
                FIELD_SEPARATOR   = ',';
            _.forEach(pageableObj, function (obj) {
                expressions.push(obj.property + KEY_VAL_SEPARATOR + obj.direction.toLowerCase());
            });

            return _.join(expressions, FIELD_SEPARATOR);
        }
        /**
         * Returns the orderBy Expression based on the 'sort 'option in pageable object
         * returned by backend
         * @param pageableObj
         * @returns {string}
         */
        function xmlToJson(xmlString, includeRoot) {
            var json = new X2JS({'emptyNodeForm': 'content', 'attributePrefix': '', 'enableToStringFunc': false}).xml_str2json(xmlString);
            if (!includeRoot && json) {
                json = _.get(json, Object.keys(json)[0]);
            }
            return json;
        }


        /**
         * Returns the types array for particular type of widgets
         * @param type of widgets
         * @returns [string]
         */
        function getTypes(type) {
            var types = [];

            if (type === 'form-widgets') {
                types = ["wm-label",
                    "wm-text",
                    "wm-checkbox",
                    "wm-checkboxset",
                    "wm-radio",
                    "wm-radioset",
                    "wm-textarea",
                    "wm-select",
                    "wm-chips",
                    "wm-button",
                    "wm-picture",
                    "wm-anchor",
                    "wm-popover",
                    "wm-date",
                    "wm-calendar",
                    "wm-time",
                    "wm-datetime",
                    "wm-currency",
                    "wm-number",
                    "wm-colorpicker",
                    "wm-slider",
                    "wm-fileupload",
                    "wm-table",
                    "wm-livefilter",
                    "wm-list",
                    "wm-pagination",
                    "wm-html",
                    "wm-prefab",
                    "wm-richtexteditor",
                    "wm-search",
                    "wm-menu",
                    "wm-switch",
                    "wm-nav",
                    "wm-tree",
                    "wm-liveform",
                    "wm-rating",
                    "wm-camera",
                    "wm-barcodescanner",
                    "wm-mobile-navbar ",
                    "wm-chart",
                    "wm-view",
                    "wm-form",
                    "wm-carousel",
                    "wm-media-list",
                    "wm-progress-circle"
                ];
            } else if (type === 'page-container-widgets') {
                types = [
                    'wm-accordionpane',
                    'wm-container',
                    'wm-panel',
                    'wm-tabcontent',
                    'wm-footer',
                    'wm-header',
                    'wm-left-panel',
                    'wm-right-panel',
                    'wm-top-nav',
                    'wm-cardcontent',
                    'wm-wizardstep',
                    'wm-tabpane'
                ];
            } else if (type === 'dialog-widgets') {
                types = ['wm-dialog', 'wm-alertdialog', 'wm-confirmdialog', 'wm-iframedialog', 'wm-pagedialog', 'wm-logindialog'];
            } else if (type === 'spinner-widgets') {
                types = [
                    "wm-checkboxset",
                    "wm-radioset",
                    "wm-calendar",
                    "wm-table",
                    "wm-livefilter",
                    "wm-list",
                    "wm-tree",
                    "wm-liveform",
                    "wm-chart",
                    "wm-view",
                    "wm-form",
                    "wm-carousel",
                    "wm-media-list",
                    'wm-accordionpane',
                    'wm-container',
                    'wm-panel',
                    'wm-tabcontent',
                    'wm-left-panel',
                    'wm-right-panel',
                    'wm-top-nav',
                    'wm-cardcontent',
                    'wm-wizardstep',
                    'wm-tabpane'
                ];
            }
            return types;
        }

        /*
        * Function to trigger DialogService's open with proper scope
         * @param dialogId
         * @param dialogScope
        * */
        function openDialog(dialogId, dialogScope, params) {
            if (!dialogScope) {
                /*case1: Prefab's dialog - setting nearest page's scope
                 *case2: Partials's dialog - setting nearest partials's scope
                 *case3: pages's dialog - setting nearest page's scope
                 * */
                var $scriptEl = WM.element('script[id="' + dialogId + '"]'),
                    isCommonDialog = WM.element('[id="wm-common-content"]').find($scriptEl).length,
                    parentPageScope = $scriptEl.closest('[data-role="pageContainer"]').scope(),
                    isPrefabDialog = parentPageScope && parentPageScope.prefabname;
                if (isPrefabDialog) {
                    dialogScope = parentPageScope;
                } else if (!isCommonDialog) {
                    dialogScope = $scriptEl.closest('[data-role="partial"]').scope() || parentPageScope;
                }
            }
            DialogService.open(dialogId, dialogScope, params);
        }

        /**
         * This function executes the callback function and opens the dialog to download the file.
         * Exports the zip, war file depending on exportType in options.
         * @param cb Service that has to be invoked on export call. Ex: ProjectService.export or PageTemplateService.export
         * @param options object containing projectId, exportType, dialogDetails
         * @returns {*} promise
         */
        function exportHandler(cb, options) {
            var defaultParams =  {
                    projectId: options.params.projectId,
                    targetName: options.params.projectName,
                    exportType: options.params.exportType
                },
                exportOptions = options.defaultParams || defaultParams,
                deferred = $q.defer();

            if (options.params.vcsBranch) {
                exportOptions.vcsRef = options.params.vcsBranch;
            }

            $rootScope.isStudioDisabled = true;

            cb(exportOptions)
                .then(function (fileId) {
                    var dialogParams = options.dialogDetails,
                        fnName = '_downloadFile';

                    // hide spinner
                    $rootScope.isStudioDisabled = false;

                    if (options.params.$s.blockProjectsList) {
                        options.params.$s.blockProjectsList = false;
                    }

                    options.params.$s[fnName] = function () {
                        window.location.href = 'services/projects/' + options.params.projectId + '/downloads/' + fileId;
                        options.params.$s[fnName] = undefined;
                    };

                    DialogService.showConfirmDialog({
                        'caption'    : dialogParams.caption,
                        'controller' : 'EmptyController',
                        'onOk'       : fnName,
                        'content'    : dialogParams.content,
                        'oktext'     : $rootScope.locale.LABEL_DOWNLOAD_NOW,
                        'canceltext' : $rootScope.locale.LABEL_CANCEL,
                        'backdrop'   : true,
                        'scope'      : options.params.$s
                    });
                }, function (errMsg) {
                    // hide spinner
                    $rootScope.isStudioDisabled = false;

                    if (options.params.$s.blockProjectsList) {
                        options.params.$s.blockProjectsList = false;
                    }
                    wmToaster.show('error', $rootScope.locale[options.params.errorMsgKey], errMsg);
                });

            return deferred.promise;
        }

        /* formats the data and returns the array of values.
         * If object is given as param, array of object is returned.
         * If commma separated string is given as param, array of strings is returned.
         */
        function convertToArray(val) {
            if (WM.isDefined(val)) {
                if (val === '') {
                    return val;
                }
                if (WM.isArray(val)) {
                    return val;
                }
                if (WM.isString(val)) {
                    return _.split(val, ',').map(function (opt) {return ('' + opt).trim(); });
                }
                return [val];
            }
        }

        function loadActiveTheme() {
            var themeName =  $rootScope.project.activeTheme || CONSTANTS.DEFAULT_THEME;
            $rootScope.activeTheme = themeName;
            WM.element('link[theme="wmtheme"]').remove();
            if ($rootScope.isMobileApplicationType) {
                themeName += '/android';
            }
            loadStyleSheet(getProjectResourcePath($rootScope.project.id) + 'themes/' + themeName + '/style.css', {name: "theme", value: "wmtheme"});
        }

        //returns true if there are any conflicts in the project and they need to be resolved first
        function isResolveConflictsExists(actionResponse) {
            var conflictsFlag = false,
                actionsInfo;
            if (!_.isEmpty(actionResponse)) {
                actionsInfo = _.groupBy(actionResponse, 'type');
                if (actionsInfo.RESOLVE_CONFLICTS) {
                    conflictsFlag = true;
                }
            }
            return conflictsFlag;
        }

        // returns false if the application is served on https and the requested url is not secure
        function isInsecureContentRequest(url) {

            var parser  = document.createElement('a');
            parser.href = url;

            // for relative urls IE returns the protocol as empty string
            if (parser.protocol === '') {
                return false;
            }

            if (stringStartsWith($location.$$absUrl, 'https://')) {
                return parser.protocol !== 'https:' && parser.protocol !== 'wss:';
            }

            return false;
        }

        //Adding default headers required for the ajax request
        function addDefaultHeaders(xhr) {
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
            // set platformVersion as custom header(X-WM-Platform-Version) if present for all XHR calls
            if(!CONSTANTS.isRunMode) {
                var platformVersion = getCustomHeaderVal(CONSTANTS.CUSTOM_HTTP_HEADERS.WM_PLATFORM_VERSION);
                if (platformVersion) {
                    xhr.setRequestHeader(CONSTANTS.CUSTOM_HTTP_HEADERS.WM_PLATFORM_VERSION, platformVersion);
                }
            }
            //While sending a explict ajax request xsrf token need to be added manually
            var xsrfCookieValue = getCookieByName($http.defaults.xsrfCookieName);
            if (xsrfCookieValue) {
                xhr.setRequestHeader($http.defaults.xsrfHeaderName, xsrfCookieValue);
            }
        }

        /**
         * This function is used to get custom header value to set while making xhr calls
         * @param headerName
         * @returns {*}
         */
        function getCustomHeaderVal(headerName) {
            var headerValue = null;
            switch (headerName) {
                case CONSTANTS.CUSTOM_HTTP_HEADERS.WM_PLATFORM_VERSION:
                    if ($rootScope.project && $rootScope.project.platformVersion) {
                        headerValue = $rootScope.project.platformVersion;
                    }
                    break;
                default:
                    //do nothing;
                    break;
            }
            return headerValue;
        }

        //Format value for datetime types
        function _formatDate(dateValue, type) {
            var epoch;
            if (WM.isDate(dateValue)) {
                epoch = dateValue.getTime();
            } else {
                if (!isNaN(dateValue)) {
                    dateValue = parseInt(dateValue, 10);
                }
                epoch = dateValue && moment(dateValue).valueOf();
            }
            if (type === 'timestamp') {
                return epoch;
            }
            if (type === 'time' && !epoch) {
                epoch = moment(new Date().toDateString() + ' ' + dateValue).valueOf();
            }
            return dateValue && $filter('date')(epoch, getDateTimeFormatForType(type));
        }
        /*Function to convert values of date time types into default formats*/
        function formatDate(value, type) {
            if (_.includes(type, '.')) {
                type = _.toLower(extractType(type));
            }
            if (WM.isArray(value)) {
                return _.map(value, function (val) {
                    return _formatDate(val, type);
                });
            }
            return _formatDate(value, type);
        }

        /**
         * prepare a blob object based on the content and content type provided
         * if content is blob itself, simply returns it back
         * @param val
         * @param valContentType
         * @returns {*}
         */
        function getBlob(val, valContentType) {
            if (val instanceof Blob) {
                return val;
            }
            var jsonVal = getValidJSON(val);
            if (jsonVal && jsonVal instanceof Object) {
                val = new Blob([WM.toJson(jsonVal)], {type: valContentType || 'application/json'});
            } else {
                val = new Blob([val], {type: valContentType || 'text/plain'});
            }
            return val;
        }

        /**
         * This function returns a blob object from the given file path
         * @param filepath
         * @returns promise having blob object
         */
        function convertToBlob(filepath) {
            var deferred = $q.defer();

            //Read the file entry from the file URL
            resolveLocalFileSystemURL(filepath, function (fileEntry) {
                fileEntry.file(function (file) {
                    //file has the cordova file structure. To submit to the backend, convert this file to javascript file
                    var reader = new FileReader();
                    reader.onloadend = function () {
                        var imgBlob = new Blob([this.result], {
                            'type' : file.type
                        });
                        deferred.resolve({'blob' : imgBlob, 'filepath': filepath});
                    };
                    reader.readAsArrayBuffer(file);
                });
            }, deferred.reject);
            return deferred.promise;
        }

        /**
         * Formats style with given format
         * 'px' is default
         * @param val - style value
         * @param format - to which output format you want to style
         * @param forceFormat - even if format is present in val force format with given format
         * @returns val - formatted value
         */
        function formatStyle(val, format, forceFormat) {
            var styleRegExp = /px|em|rem|pt|%/g;
            if (!val) {
                val = '';
            }

            if (forceFormat) {
                val = styleRegExp.replace(val, '');
            } else if(!styleRegExp.test(val)) {
                val = val + (format || 'px');
            }

            return val;
        }

        /**
         * Append given value to the formdata
         * @param formData
         * @param param - Param from which value has to be taken
         * @param paramValue - Value which is to be appended to formdata
         */
        function getFormData(formData, param, paramValue) {
            var paramType = _.toLower(extractType(_.get(param, 'items.type') || param.type)),
                paramContentType = CONSTANTS.isStudioMode ? param['x-WM-CONTENT_TYPE'] : param.contentType;
            if (isFileUploadSupported()) {
                if ((paramType !== 'file') && (paramContentType === 'string' || !paramContentType)) {
                    if (WM.isObject(paramValue)) {
                        paramValue = JSON.stringify(paramValue);
                    }
                    formData.append(param.name, paramValue);
                } else {
                    if (WM.isArray(paramValue) && paramType === 'file') {
                        WM.forEach(paramValue, function (fileObject) {
                            formData.append(param.name, getBlob(fileObject), fileObject.name);
                        });
                    } else {
                        formData.append(param.name, getBlob(paramValue, paramContentType), paramValue && paramValue.name);
                    }
                }
                return formData;
            }
        }

        /**
         * Validate if given access role is in current loggedin user access roles
         * @param roleExp - roles available for current item
         */
        function validateAccessRoles(roleExp) {
            var roles;

            if (roleExp && $rootScope.userRoles && CONSTANTS.isRunMode) {

                roles = _.split(roleExp, ',').map(Function.prototype.call, String.prototype.trim);

                return _.intersection(roles, $rootScope.userRoles).length;
            }

            return true;
        }

        function defineProps($is, $el, config) {
            /*This is to make the "Variables" & "Widgets" available in the Data-navigator it gets compiled with the data table isolate Scope
             * and "Variables", "Widgets" will not be available in that scope.
             * element.scope() might refer to the controller scope/parent scope.*/
            var _scope = $el.scope(); // scope inherited from controller's scope
            config =  config || {};

            Object.defineProperties($is, {
                'Variables': {
                    'get': function () {
                        return _scope.Variables;
                    }
                },
                'Actions': {
                    'get': function () {
                        return _scope.Actions;
                    }
                },
                'Widgets': {
                    'get': function () {
                        return _scope.Widgets;
                    }
                }
            });
            if (config.item) {
                Object.defineProperties($is, {
                    'item': {
                        'get': function () {
                            return _scope.item;
                        }
                    }
                });
            }
            if (config.row) {
                Object.defineProperties($is, {
                    'row': {
                        'get': function () {
                            return _scope.row;
                        }
                    }
                });
            }
        }

        /**
         * Listens for an event for only one time and de-registers the event.
         *
         * @param $s Scope on which the event has to be listened
         * @param event name of the event
         * @param callBack function to invoke
         */
        function listenOnce($s, event, callBack) {
            var deregisterEvent = $s.$on(event, function () {
                deregisterEvent();
                if (callBack) {
                    callBack.apply(undefined, arguments);
                }
            });
            return deregisterEvent;
        }

        /**
         * Returns true, if the given value is a JSON serialized form of date.
         *
         * @param str
         * @returns {boolean}
         */
        function isJSONDate(str) {
            return _.isString(str) && REGEX.JSON_DATE_FORMAT.test(str);
        }

        /**
         * Returns Files, from the formName and fieldName provided.
         *
         * @param formName
         * @param fieldName
         * @param isList
         */
        function getFiles(formName, fieldName, isList) {
            var files = _.get(document.forms, [formName , fieldName, 'files']);
            return isList ? _.map(files, _.identity) : files && files[0];
        }


        /**
         * This function returns true if file size exceeds sizeInMb.
         * @param file file object.
         * @param sizeInMb file size in MB
         * @returns {boolean} true if file size exceeds.
         */
        function isFileSizeWithinLimit(file, sizeInMb) {
            var FILESIZE_MB = 1048576,
                FILE_MAX_SIZE = sizeInMb * FILESIZE_MB;

            return file.size > FILE_MAX_SIZE;
        }

        /**
         * This function returns true by comparing two objects based on the fields
         * @param obj1 object
         * @param obj2 object
         * @param compareBy string field values to compare
         * @returns {boolean} true if object equality returns true based on fields
         */
        function isEqualWithFields(obj1, obj2, compareBy) {
            // compareBy can be 'id' or 'id1, id2' or 'id1, id2:id3'
            // Split the compareby comma separated values
            var _compareBy = _.isArray(compareBy) ? compareBy : _.split(compareBy, ',');

            _compareBy = _.map(_compareBy, _.trim);

            return _.isEqualWith(obj1, obj2, function (o1, o2) {
                return _.every(_compareBy, function(cb) {
                    var cb1, cb2, _cb;

                    //If compareby contains : , compare the values by the keys on either side of :
                    if (_.indexOf(cb, compareBySeparator) === -1) {
                        cb1 = cb2 = _.trim(cb);
                    } else {
                        _cb = _.split(cb, compareBySeparator);
                        cb1 = _.trim(_cb[0]);
                        cb2 = _.trim(_cb[1]);
                    }

                    return _.get(o1, cb1) === _.get(o2, cb2);
                });
            });
        }

        /**
         * This function sets session storage item based on the project ID
         * @param key string
         * @param value string
         */
        function setSessionStorageItem(key, value) {
            var sessionStorageObj = window.sessionStorage.getItem($rootScope.project.id);

            if (sessionStorageObj) {
                sessionStorageObj = JSON.parse(sessionStorageObj);
            } else {
                sessionStorageObj = {};
            }
            sessionStorageObj[key] = value;

            window.sessionStorage.setItem($rootScope.project.id, JSON.stringify(sessionStorageObj));
        }

        /**
         * This function gets session storage item based on the project ID
         * @param key string
         */
        function getSessionStorageItem(key) {
            var sessionStorageObj = window.sessionStorage.getItem($rootScope.project.id);

            if (sessionStorageObj) {
                sessionStorageObj = JSON.parse(sessionStorageObj);
                return sessionStorageObj[key];
            }
            return;
        }

        /**
         * This function invokes the given the function (fn) until the function successfully executes or the maximum number
         * of retries is reached or onBeforeRetry returns false.
         *
         * @param fn - a function that is needs to be invoked. The function can also return a promise as well.
         * @param interval - minimum time gap between successive retries. This argument should be greater or equal to 0.
         * @param maxRetries - maximum number of retries. This argument should be greater than 0. For all other values,
         * maxRetries is infinity.
         * @param onBeforeRetry - a callback function that will be invoked before re-invoking again. This function can
         * return false or a promise that is resolved to false to stop further retry attempts.
         * @returns {*} a promise that is resolved when fn is success (or) maximum retry attempts reached
         * (or) onBeforeRetry returned false.
         */
        function retryIfFails(fn, interval, maxRetries, onBeforeRetry) {
            var defer = $q.defer(),
                retryCount = 0,
                tryFn = function () {
                    retryCount++;
                    if (_.isFunction(fn)) {
                        return fn();
                    }
                };
            maxRetries = (_.isNumber(maxRetries) && maxRetries > 0 ? maxRetries : 0);
            interval = (_.isNumber(interval) && interval > 0 ? interval : 0);
            onBeforeRetry = _.isFunction(onBeforeRetry) ? onBeforeRetry : WM.noop;
            function errorFn() {
                var errArgs = arguments;
                $timeout(function () {
                    $q.when(onBeforeRetry(), function (retry) {
                        if (retry !== false && (!maxRetries || retryCount <= maxRetries)) {
                            $q.when(tryFn(), defer.resolve.bind(defer), errorFn, defer.notify.bind(defer));
                        } else {
                            defer.reject.apply(defer, errArgs);
                        }
                    }, function () {
                        defer.reject.apply(defer, errArgs);
                    });
                }, interval);
            }
            $q.when(tryFn(), defer.resolve.bind(defer), errorFn, defer.notify.bind(defer));
            return defer.promise;
        }

        /**
         * Promise of a defer created using this function, has abort function that will reject the defer when called.
         * @returns {*} angular defer object
         */
        function getAbortableDefer() {
            var d = $q.defer();
            d.promise.abort = function () {
                triggerFn(d.onAbort);
                d.reject('aborted');
                d.isAborted = false;
            };
            return d;
        }

        /*
         * Invokes the given list of functions sequentially with the given arguments. If a function returns a promise,
         * then next function will be invoked only if the promise is resolved.
         */
        function executeDeferChain(fns, args, d, i) {
            var returnObj;
            d = d || $q.defer();
            i = i || 0;
            if (i === 0) {
                fns = _.filter(fns, function (fn) {
                    return !(_.isUndefined(fn) || _.isNull(fn));
                });
            }
            if (fns && i < fns.length) {
                try {
                    returnObj = fns[i].apply(undefined, args);
                    $q.when(returnObj, function () {
                        executeDeferChain(fns, args, d, i + 1);
                    }, d.reject);
                } catch (e) {
                    d.reject(e);
                }
            } else {
                d.resolve();
            }
            return d.promise;
        }

        /**
         * This function disables the right click on the element, when there is no link or if there is any action or events defined on the element
         * @param $el - element
         * @param event - events (like onSelect, onBeforeNavigate)
         * @param action if there are any action on the element
         * @param link
         */
        function disableRightClick($el, event, action, link) {
            if (event || action || !link) {
                $el.on("contextmenu", function(e) {
                    return false;
                });
            }
        }


        /**
         * formatting the expression as required by backend which was enclosed by ${<expression>}.
         * @param fieldDefs
         * returns fieldDefs
         */
        function formatExportExpression(fieldDefs) {
            _.forEach(fieldDefs, function (fieldDef) {
                if (fieldDef.expression) {
                    fieldDef.expression = '${' + fieldDef.expression + '}';
                }
            });
            return fieldDefs;
        }

        function prepareDocLinks(docLinks, studioVersion) {
            var hostname = $window.location.hostname, origin = $window.location.origin,
                isWMO = hostname.indexOf('wavemakeronline.com') !== -1,
                baseUrl;

            /*if (isWMO) {
                baseUrl = 'https://www.wavemaker.com/learn';
                studioVersion = '/' + studioVersion;
            } else {
                baseUrl = origin + '/wavemaker-learn';
                studioVersion = '';
            }*/
            //for ent release temp fix. Always point to wavemaker.com
            baseUrl = 'https://www.wavemaker.com/learn';
            studioVersion = '/' + studioVersion;
            _.forEach(docLinks,function(value, link){
                docLinks[link] = baseUrl + replace(value, _.set({}, 'studio.version', studioVersion));
            });
            return docLinks;
        }

        function getDecodedData (content) {
            return decodeURIComponent(content.replace(/\+/g, ' '));
        }

        $.cachedScript = function () {
            var inProgress = {};
            var resolved = [];

            function onLoad(url) {
                resolved.push(url);
                inProgress[url].resolve();
                inProgress[url] = undefined;
            }

            return function (url) {
                // Check if promise is resolved
                if (resolved.indexOf(url) !== -1) {
                    var deferred = $q.defer();
                    deferred.resolve();
                    return deferred.promise;
                }

                // Check if promise is in progress
                if (inProgress[url]) {
                    return inProgress[url].promise;
                }

                // Create a new promise
                inProgress[url] = $q.defer();

                var options = {
                    dataType: 'script',
                    cache: true,
                    url: url
                };

                jQuery.ajax(options).done(function () {
                    return onLoad(url);
                });

                return inProgress[url].promise;
            };
        }();

        // Function return the studio url.
        function getStudioUrl() {
            var locationObj = $window.location;
            return locationObj.origin + (locationObj.host.indexOf(':8080') > -1 ? '/wavemaker' : '/studio');
        }

        function escapeHtml(unsafe) {
            unsafe = unsafe || '';
            return unsafe
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }
        /**
         * function which splits the expression based on Operators
         * @param string, string which will be split
         * @returns a list of strings after splitting based on Operators**/
        function splitExpression(expression) {
            return expression && expression.split(bindExpressionRegEx);
        }

        /**
         * This function finds the element's closest form and sets the dirty flag
         * @param $ele jQuery element
         */
        function setFormDirty($ele) {
            // explicitly setting form dirty when typeahead is selected
            var formEle = $ele.closest('form');
            if (formEle.length) {
                var formName = formEle.attr('name');
                var scope = formEle.scope();
                if (scope && scope[formName]) {
                    scope[formName].$setDirty();
                }
            }
        }

        this.setSessionStorageItem      = setSessionStorageItem;
        this.getSessionStorageItem      = getSessionStorageItem;
        this.camelCase                  = WM.element.camelCase;
        this.initCaps                   = initCaps;
        this.firstCaps                  = firstCaps;
        this.periodSeparate             = periodSeparate;
        this.spaceSeparate              = spaceSeparate;
        this.replaceAll                 = replaceAll;
        this.prettifyLabel              = prettifyLabel;
        this.prettifyLabels             = prettifyLabels;
        this.getVariableName            = getVariableName;
        this.removeExtraSlashes         = removeExtraSlashes;
        this.getImageUrl                = getImageUrl;
        this.getResourceUrl             = getResourceURL;
        this.encodeUrlParams            = encodeUrlParams;
        this.encodeUrl                  = encodeUrl;
        this.formatVariableIconClass    = formatVariableIconClass;
        this.getBackGroundImageUrl      = getBackGroundImageUrl;
        this.getParentOverlayElZIndex   = getParentOverlayElZIndex;
        this.hyphenate                  = hyphenate;
        this.deHyphenate                = deHyphenate;
        this.isAndroid                  = isAndroid;
        this.isAndroidPhone             = isAndroidPhone;
        this.isKitkatDevice             = isKitkatDevice;
        this.isIphone                   = isIphone;
        this.isIpod                     = isIpod;
        this.isIpad                     = isIpad;
        this.isIOS                      = isIOS;
        this.isAndroidTablet            = isAndroidTablet;
        this.isTablet                   = isTablet;
        this.isMobile                   = isMobile;
        this.isScriptLoaded             = isScriptLoaded;
        this.isValidJavaPackageName     = isValidJavaPackageName;
        this.isValidHtml                = isValidHtml;
        this.hasSpecialCharacters       = hasSpecialCharacters;
        this.checkSpecialCharacters     = checkSpecialCharacters;
        this.isQuoteNotPresent          = isQuoteNotPresent;
        this.isNoDoubleQuoteNotPresent  = isNoDoubleQuoteNotPresent;
        this.stringStartsWith           = stringStartsWith;
        this.stringEndsWith             = stringEndsWith;
        this.isStyleSheetLoaded         = isStyleSheetLoaded;
        this.isValidWebURL              = isValidWebURL;
        this.isValidWebSocketURL        = isValidWebSocketURL;
        this.loadScripts                = loadScripts;
        this.loadStyleSheets            = loadStyleSheets;
        this.loadStyleSheet             = loadStyleSheet;
        this.prepareFieldDefs           = prepareFieldDefs;
        this.getFieldDefProps           = getFieldDefProps;
        this.prettifyCSS                = prettifyCSS;
        this.prettifyHTML               = prettifyHTML;
        this.prettifyJS                 = prettifyJS;
        this.swapArrayElements          = swapArrayElements;
        this.swapProperties             = swapProperties;
        this.triggerFn                  = triggerFn;
        this.isEmptyObject              = isEmptyObject;
        this.isValidEmail               = isValidEmail;
        this.isValidPassword            = isValidPassword;
        this.isValidFieldName           = isValidFieldName;
        this.resetObjectWithEmptyValues = resetObjectWithEmptyValues;
        this.isImageFile                = isImageFile;
        this.isZipFile                  = isZipFile;
        this.isExeFile                  = isExeFile;
        this.isTextLikeFile             = isTextLikeFile;
        this.isAudioFile                = isAudioFile;
        this.isVideoFile                = isVideoFile;
        this.isPageResource             = isPageResource;
        this.findValueOf                = findValueOf;
        this.replace                    = replace;
        this.getBooleanValue            = getBooleanValue;
        this.removeStyleSheetLoaded     = removeStyleSheetLoaded;
        this.fileUploadFallback         = fileUploadFallback;
        this.getCurrentPage             = getCurrentPage;
        this.isDebugMode                = isDebugMode;
        this.getIndexPage               = getIndexPage;
        this.redirectToIndexPage        = redirectToIndexPage;
        this.redirectToLoginPage        = redirectToLoginPage;
        this.browserStorage             = browserStorage;
        this.fetchPropertiesMapColumns  = fetchPropertiesMapColumns;
        this.getLoadedPrefabNames       = getLoadedPrefabNames;
        this.addNodeToJson              = addNodeToJson;
        this.getNodeFromJson            = getNodeFromJson;
        this.removeJsonNodeChildren     = removeJsonNodeChildren;
        this.isIE                       = isIE;
        this.isIE9                      = isIE9;
        this.isIE11                     = isIE11;
        this.isI18nResourceFolder       = isI18nResourceFolder;
        this.getValidJSON               = getValidJSON;
        this.getActionFromKey           = getActionFromKey;
        this.preventCachingOf           = preventCachingOf;
        this.getAllKeysOf               = getAllKeysOf;
        this.fetchContent               = fetchContent;
        this.getService                 = getService;
        this.removeProtocol             = removeProtocol;
        this.getCookieByName            = getCookieByName;
        this.isPageable                 = isPageable;
        this.isNumberType               = isNumberType;
        this.isFileUploadSupported      = isFileUploadSupported;
        this.processMarkup              = processMarkup;
        this.isDateTimeType             = isDateTimeType;
        this.getDataSetWidgets          = getDataSetWidgets;
        this.getDaysOptions             = getDaysOptions;
        this.getDateTimeDefaultFormats  = getDateTimeDefaultFormats;
        this.getDateTimeFormatForType   = getDateTimeFormatForType;
        this.getLocaleDateTimeFormatForType = getLocaleDateTimeFormatForType;
        this.isValidDataSet             = isValidDataSet;
        this.parseCombinedPageContent   = parseCombinedPageContent;
        this.extractType                = extractType;
        this.isDeleteResourceAllowed    = isDeleteResourceAllowed;
        this.generateGUId               = generateGUId;
        this.isDuplicateName            = isDuplicateName;
        this.getValidMarkUp             = getValidMarkUp;
        this.scrollIntoView             = scrollIntoView;
        this.arraysEqual                = arraysEqual;
        this.getNewEventsObject         = getNewEventsObject;
        this.getEvaluatedExprValue      = getEvaluatedExprValue;
        this.getProjectResourcePath     = getProjectResourcePath;
        this.getVariableNameFromExpr    = getVariableNameFromExpr;
        this.getClonedObject            = getClonedObject;
        this.getValidDateObject         = getValidDateObject;
        this.getMatchModes              = getMatchModes;
        this.updateTmplAttrs            = updateTmplAttrs;
        this.sort                       = sort;
        this.triggerCustomEvents        = triggerCustomEvents;
        this.simulateFileDownload       = simulateFileDownload;
        this.getWidgetRolesArrayFromStr = getWidgetRolesArrayFromStr;
        this.setNodeContent             = setNodeContent;
        this.getOrderByExpr             = getOrderByExpr;
        this.xmlToJson                  = xmlToJson;
        this.getTypes                   = getTypes;
        this.openDialog                 = openDialog;
        this.evalExp                    = evalExp;
        this.convertToArray             = convertToArray;
        this.pluginConfig               = pluginConfig;
        this.loadActiveTheme            = loadActiveTheme;
        this.isResolveConflictsExists   = isResolveConflictsExists;
        this.isInsecureContentRequest   = isInsecureContentRequest;
        this.isValidAppServerUrl        = isValidAppServerUrl;
        this.addDefaultHeaders          = addDefaultHeaders;
        this.getCustomHeaderVal         = getCustomHeaderVal;
        this.formatDate                 = formatDate;
        this.getBlob                    = getBlob;
        this.getMetaDataFromData        = getMetaDataFromData;
        this.isAppleProduct             = isAppleProduct;
        this.formatStyle                = formatStyle;
        this.getFormData                = getFormData;
        this.validateAccessRoles        = validateAccessRoles;
        this.defineProps                = defineProps;
        this.listenOnce                 = listenOnce;
        this.convertToBlob              = convertToBlob;
        this.isJSONDate                 = isJSONDate;
        this.isXsrfEnabled              = isXsrfEnabled;
        this.addXsrfCookieHeader        = addXsrfCookieHeader;
        this.getFiles                   = getFiles;
        this.exportHandler              = exportHandler;
        this.isVariableOrActionEvent    = isVariableOrActionEvent;
        this.isFileSizeWithinLimit      = isFileSizeWithinLimit;
        this.isEqualWithFields          = isEqualWithFields;
        this.retryIfFails               = retryIfFails;
        this.getAbortableDefer          = getAbortableDefer;
        this.executeDeferChain          = executeDeferChain;
        this.isValidMobileAppId         = isValidMobileAppId;
        this.disableRightClick          = disableRightClick;
        this.formatExportExpression     = formatExportExpression;
        this.prepareDocLinks            = prepareDocLinks;
        this.getDecodedData             = getDecodedData;
        this.getStudioUrl               = getStudioUrl;
        this.escapeHtml                 = escapeHtml;
        this.splitExpression            = splitExpression;
        this.setFormDirty               = setFormDirty;
    }]);
