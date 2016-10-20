/*global WM, X2JS, wm, window, document, navigator, Image, location, console, _, $, moment*/
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
    .service('Utils', ['$rootScope', '$location', '$window', 'CONSTANTS', '$sce', 'DialogService', '$timeout', function ($rootScope, $location, $window, APPCONSTANTS, $sce, DialogService, $timeout) {
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
                MOBILE: /Mobile/i,
                WINDOWS: /Windows Phone/i,
                SUPPORTED_IMAGE_FORMAT: /\.(bmp|gif|jpe|jpg|jpeg|tif|tiff|pbm|png|ico)$/i,
                SUPPORTED_FILE_FORMAT: /\.(txt|js|css|html|script|properties|json|java|xml|smd|xmi|sql|log|wsdl|vm|ftl|jrxml|yml|yaml)$/i,
                SUPPORTED_AUDIO_FORMAT: /\.(mp3|ogg|webm|wma|3gp|wav)$/i,
                SUPPORTED_VIDEO_FORMAT: /\.(mp4|ogg|webm|wmv|mpeg|mpg|avi)$/i,
                PAGE_RESOURCE_PATH: /^\/pages\/.*\.(js|css|html|json)$/,
                MIN_PAGE_RESOURCE_PATH: /.*(page.min.html)$/,
                VALID_EMAIL: /^[a-zA-Z][\w.]+@[a-zA-Z_]+?\.[a-zA-Z.]{1,4}[a-zA-Z]$/,
                VALID_WEB_URL: /^(http[s]?:\/\/)(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/,  //ref : http://stackoverflow.com/questions/4314741/url-regex-validation
                REPLACE_PATTERN: /\$\{([^\}]+)\}/g,
                ZIP_FILE: /\.zip$/i,
                EXE_FILE: /\.exe$/i,
                NO_QUOTES_ALLOWED: /^[^'|"]*$/,
                VALID_HTML: /<[a-z][\s\S]*>/i,
                VALID_PASSWORD: /^[0-9a-zA-Z-_.@&*!#$%]+$/,
                SPECIAL_CHARACTERS: /[^A-Z0-9a-z_]+/i
            },
            NUMBER_TYPES = ['int', 'integer', 'float', 'double', 'long', 'short', 'byte', 'big_integer', 'big_decimal'],
            SYSTEM_FOLDER_PATHS = {
                'project': ['../lib', '../project', '../project/services', '../project/lib', '../project/src', '../project/test', '../project/src/main', '../project/src/main/webapp', '../project/src/main/resources', '../project/src/main/webapp/services', '../project/src/main/webapp/resources', '../project/src/main/webapp/pages', '../project/src/main/webapp/resources/images', '../project/src/main/webapp/resources/WEB-INF', '../project/src/main/webapp/resources/ngLocale', '../project/src/main/webapp/resources/i18n', '../project/src/main/webapp/resources/images/imagelists', '../project/src/main/webapp/resources/audio', '../project/src/main/webapp/resources/video'],
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
                'wm.TimerVariable'       : 'time',
                'wm.DeviceVariable'      :  'device-variable'
            },
            dateTimeTypes = {
                'date'      : true,
                'time'      : true,
                'timestamp' : true,
                'datetime'  : true
            },
            dataSetWidgets = {
                'select'       : true,
                'checkboxset'  : true,
                'radioset'     : true,
                'switch'       : true,
                'autocomplete' : true,
                'typeahead'    : true
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
            dateTimeDefaultFormats = {
                'date'           : 'yyyy-MM-dd',
                'time'           : 'HH:mm:ss',
                'timestamp'      : 'timestamp',
                'datetime'       : 'yyyy-MM-ddTHH:mm:ss',
                'datetime_oracle': 'yyyy-MM-dd HH:mm:ss'
            },
            indexPage = getIndexPage(),
            pluginConfig = {
                'BARCODE_SCANNER' : [{'name' : 'phonegap-plugin-barcodescanner', 'spec' : '6.0.2', 'variables': [{ 'name': 'CAMERA_USAGE_DESCRIPTION', 'value': 'To scan barcodes'}]}],
                'CALENDAR'        : [{'name' : 'cordova-plugin-calendar', 'spec' : '4.5.5', 'variables': [{'name': 'CALENDAR_USAGE_DESCRIPTION', 'value': 'To show events'}]}],
                'CAMERA'          : [{'name' : 'cordova-plugin-camera', 'spec' : '2.3.0', 'variables': [{ 'name': 'CAMERA_USAGE_DESCRIPTION', 'value': 'To take photos'}]},
                                     {'name' : 'cordova-plugin-media-capture', 'spec' : '1.4.0', 'variables': [{'name': 'CAMERA_USAGE_DESCRIPTION', 'value': 'To take videos'}, { 'name' : 'MICROPHONE_USAGE_DESCRIPTION', 'value' : 'To record voice while taking videos'}, {'name' : 'PHOTO_LIBRARY_USAGE_DESCRIPTION', 'value' : 'To provide photo browsing'}]}],
                'CONTACTS'        : [{'name' : 'cordova-plugin-contacts', 'spec' : '2.2.0', 'variables': [{'name' : 'CONTACTS_USAGE_DESCRIPTION', 'value': 'To show phone numbers'}]}],
                'FILE'            : [{'name' : 'cordova-plugin-file', 'spec' : '4.3.0'}, {'name': 'cordova-plugin-file-transfer', 'spec': '1.6.0'}],
                'GEOLOCATION'     : [{'name' : 'cordova-plugin-geolocation', 'spec' : '2.4.0'}],
                'NETWORK'         : [{'name' : 'cordova-plugin-network-information', 'spec' : '1.3.0'}],
                'VIBRATE'         : [{'name' : 'cordova-plugin-vibration', 'spec' : '2.1.2'}],
                'MEDIAPICKER'     : [{'name' : 'cordova-plugin-mediapicker', 'spec' : '0.0.1'}],
                'IMAGEPICKER'     : [{'name' : 'cordova-plugin-imagepicker', 'spec' : '1.3.0', 'variables' : [{'name' : 'PHOTO_LIBRARY_USAGE_DESCRIPTION', 'value' : 'To provide photo browsing picker'}]}],
                'SPLASHSCREEN'    : [{'name' : 'cordova-plugin-splashscreen', 'spec' : '4.0.0'}],
                'DEVICE'          : [{'name' : 'cordova-plugin-device', 'spec': '1.1.3'}],
                'APPVERSION'      : [{'name' : 'cordova-plugin-app-version', 'spec': '0.1.9'}],
                'WHITELIST'       : [{'name' : 'cordova-plugin-whitelist', 'spec': '1.3.0'}],
                'COMPAT'          : [{'name' : 'cordova-plugin-compat', 'spec': '1.0.0'}],
                'INAPPBROWSER'    : [{'name' : 'cordova-plugin-inappbrowser', 'spec' : '1.5.0'}],
                'STATUSBAR'       : [{'name' : 'cordova-plugin-statusbar', 'spec' : '2.2.0'}]
            };

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
                namesArray = names.split(separator);
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
                return WM.element(ele).is('wm-page, wm-partial, wm-template');
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
                $innerEle = $outerEle.find('wm-page, wm-partial, wm-template');

                if ($innerEle.length > 0) {
                    newMarkup = $innerEle[0].outerHTML;
                }
            }
            return newMarkup;
        }
        function formatVariableIconClass(variableCategory) {
            return variableCategoryMap[variableCategory];
        }

        /*helper function for prepareFieldDefs*/
        function pushFieldDef(dataObject, columnDefObj, namePrefix, options) {
            /*loop over the fields in the dataObject to process them*/
            var modifiedTitle,
                relatedTable,
                relatedField,
                relatedInfo,
                fieldName,
                isRelated;
            if (!options) {
                options = {};
            }
            WM.forEach(dataObject, function (value, title) {
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
                var defObj = options.setBindingField ? {'displayName': fieldName, 'field': title, 'relatedTable': relatedTable, 'relatedField': relatedField || modifiedTitle} : {'displayName': fieldName, 'relatedTable': relatedTable, 'relatedField': relatedField || modifiedTitle};
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
            dataObject = WM.isArray(data) ? data[0] : data;
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
            * https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#32-leaking-arguments
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

        function isIphone() {
            return (REGEX.IPHONE.test(userAgent));
        }

        function isIpod() {
            return (REGEX.IPOD.test(userAgent));
        }

        function isWindowsPhone() {
            return (REGEX.WINDOWS.test(userAgent));
        }

        function isMobile() {
            if (APPCONSTANTS.isRunMode) {
                return isAndroidPhone() || isIphone() || isIpod() || isWindowsPhone() || WM.element('#wm-mobile-display:visible').length > 0;
            }

            return false;
        }

        /*function to check valid java package name*/
        function isValidJavaPackageName(pkgName) {
            return pkgName.match(/^\w[\w\d_.]*[\w\d]$/);
        }

        /*function to check if quotes (both single and double) are NOT present in a string.*/
        function isQuoteNotPresent(str) {
            return REGEX.NO_QUOTES_ALLOWED.test(str);
        }

        /*function to check if string contains HTML tags.*/
        function isValidHtml(str) {
            return REGEX.VALID_HTML.test(str);
        }

        /*function to check if the string contains special characters*/
        function hasSpecialCharacters(str) {
            return REGEX.SPECIAL_CHARACTERS.test(str);
        }

        /*This function returns the url to the image after checking the validity of url*/
        function getImageUrl(urlString) {
            if (APPCONSTANTS.isRunMode) {
                return urlString;
            }
            /*In studio mode before setting picturesource, check if the studioController is loaded and new picturesource is in 'styles/images/' path or not.
             * When page is refreshed, loader.gif will be loaded first and it will be in 'style/images/'.
             * Prepend 'services/projects/' + $rootScope.project.id + '/web/resources/images/imagelists/'  if the image url is just image name in the project root,
             * and if the url pointing to resources/images/ then 'services/projects/' + $rootScope.project.id + '/web/'*/
            if (isValidWebURL(urlString)) {
                return urlString;
            }
            if (!isImageFile(urlString)) {
                urlString = 'resources/images/imagelists/default-image.png';
            }

            // if the resource to be loaded is inside a prefab
            if (stringStartsWith(urlString, 'services/prefabs')) {
                return urlString;
            }

            urlString = getProjectResourcePath($rootScope.project.id) + urlString;
            return urlString;
        }

        /*This function returns the url to the resource after checking the validity of url*/
        function getResourceURL(urlString) {
            if (isValidWebURL(urlString)) {
                return $sce.trustAsResourceUrl(urlString);
            }
            if (APPCONSTANTS.isRunMode) {
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

        function getPropertyNode(prop) {
            return {
                'type'                : prop.type,
                'isPrimaryKey'        : prop.isPrimaryKey,
                'generator'           : prop.generator,
                'isRelatedPk'         : prop.isRelatedPk,
                'systemUpdated'       : prop.systemUpdated,
                'systemInserted'      : prop.systemInserted,
                'relatedEntityName'   : prop.relatedEntityName
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

            $window.location = APPCONSTANTS.LOGIN_PAGE;
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
         */
        function replace(template, map) {
            if (!template) {
                return;
            }

            return template.replace(REGEX.REPLACE_PATTERN, function (match, key) {
                return _.get(map, key);
            });
        }

        /* returns the prefab names loaded in the markup of current page */
        function getLoadedPrefabNames() {
            return WM.element('[prefabname]').map(function () {return WM.element(this).attr('prefabname'); });
        }

        function initializeAction(op, callback) {
            var img = new Image();
                //version = ($rootScope.studioInfo && $rootScope.studioInfo.product && $rootScope.studioInfo.product.version) || '',
                //revision = ($rootScope.studioInfo && $rootScope.studioInfo.product && $rootScope.studioInfo.product.revision) || '';
            img.onload = function () {
                /* image loaded successfully. trigger the callback */
                triggerFn(callback);
            };
            img.onerror = function () {
                /* image failed to load. trigger the callback */
                triggerFn(callback);
            };

           // img.src = 'http://wavemaker.com/img/blank.gif?op=' + op + '&v=' + version + '&r=' + revision + '&preventCache=' + String(Math.random(new Date().getTime())).replace(/\D/, '').substring(0, 8);
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
                    'hasChildren'   : options.hasChildren
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
            var cookiesArray = document.cookie.split('; '),
                cookies      = {};

            if (_.some(cookiesArray, function (cookie) {
                    var index           = cookie.indexOf('='),
                        cookieName      = cookie.substr(0, index),
                        cookieValue     = cookie.substr(index + 1);
                    cookies[cookieName] = cookieValue;

                    if (cookieName === name) { // break the loop when the required cookie is found
                        return true;
                    }

                })) {
                return decodeURIComponent(cookies[name]);
            }
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
            if (APPCONSTANTS.isRunMode) {
                root.html(content).find('wm-livelist, wm-login, wm-template')
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
        /*Function to get date time types*/
        function getDateTimeTypes() {
            return dateTimeTypes;
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
            return dateTimeDefaultFormats;
        }

        /*Function that checks if the dataset is valid or not*/
        function isValidDataSet(dataset) {
            return ((WM.isArray(dataset) && dataset.length > 0) || (WM.isObject(dataset) && Object.keys(dataset).length > 0));
        }

        /* to generate all individual contents from the combined version(min.html) of the page */
        function parseCombinedPageContent(pageContent, pageName) {
            /*creating a parent for the content & converting to dom-like element, to process the content*/
            var pageDom = WM.element('<div>' + pageContent + '</div>'),
                htmlEle = pageDom.find('script[id="' + pageName + '.html' + '"]'),
                variableContext = '_' + pageName + 'Page_Variables_';

            htmlEle.remove();
            /* remove the previously loaded styles in studio-mode*/

            if (APPCONSTANTS.isStudioMode) {
                WM.element('script[id="' + pageName + '.css' + '"]').remove();
            }
            try {
                /*load the styles & scripts*/
                WM.element('head').append(pageDom.find('style, script'));
            } catch (e) {
                console.log(e.message);
            }
            return {
                html: htmlEle.html() || '',
                variables: window[variableContext] || {}
            };
        }

        /*
         * extracts and returns the last bit from full typeRef of a field
         * e.g. returns 'String' for typeRef = 'java.lang.String'
         * @params: {typeRef} type reference
         */
        function extractType(typeRef) {
            if (!typeRef) {
                return 'string';
            }
            return typeRef.substring(typeRef.lastIndexOf('.') + 1);
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
        function scrollIntoView(element, container) {
            var $container = WM.element(container),
                $element = WM.element(element),
                containerTop = $container.scrollTop(),
                containerHeight = $container.height(),
                containerBottom = containerTop + containerHeight,
                elemTop = $element[0] && $element[0].offsetTop,
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
                if (event === 'Javascript') {
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
                    val = moment().format('YYYY-MM-DD') + ' ' + val;
                }
            }
            return new Date(moment(val).valueOf());
        }

        /**
         * Returns an object of variable details from given event value
         * @param evtVal new event value
         * @returns an object of variable details
         */
        /*This function will find category for variable chosen and open corresponding variable*/
        function getVariableDetails(evtVal) {
            var variableType,
                variableCategory,
                matchStr,
                VARIABLE_TYPES = {
                    DATA: 'data',
                    CALL: 'call'
                },
                VARIABLE_CATEGORIES = {
                    SERVICE: 'wm.ServiceVariable',
                    LIVE: 'wm.LiveVariable',
                    NAVIGATION: 'wm.NavigationVariable',
                    DEVICE: 'wm.DeviceVariable',
                    NOTIFICATION: 'wm.NotificationVariable'
                },
                NEW_VARIABLE = {
                    SERVICE: 'New ServiceVariable',
                    LIVE: 'New LiveVariable',
                    NAVIGATION: 'New NavigationCall',
                    DEVICE: 'New DeviceVariable',
                    NOTIFICATION: 'New NotificationCall'
                };
            if (_.includes(evtVal, NEW_VARIABLE.SERVICE)) {
                matchStr = NEW_VARIABLE.SERVICE;
                variableType = VARIABLE_TYPES.DATA;
                variableCategory = VARIABLE_CATEGORIES.SERVICE;
            } else if (_.includes(evtVal, NEW_VARIABLE.LIVE)) {
                matchStr = NEW_VARIABLE.LIVE;
                variableType = VARIABLE_TYPES.DATA;
                variableCategory = VARIABLE_CATEGORIES.LIVE;
            } else if (_.includes(evtVal, NEW_VARIABLE.NAVIGATION)) {
                matchStr = NEW_VARIABLE.NAVIGATION;
                variableType = VARIABLE_TYPES.CALL;
                variableCategory = VARIABLE_CATEGORIES.NAVIGATION;
            } else if (_.includes(evtVal, NEW_VARIABLE.NOTIFICATION)) {
                matchStr = NEW_VARIABLE.NOTIFICATION;
                variableType = VARIABLE_TYPES.CALL;
                variableCategory = VARIABLE_CATEGORIES.NOTIFICATION;
            } else if (_.includes(evtVal, NEW_VARIABLE.DEVICE)) {
                matchStr = NEW_VARIABLE.DEVICE;
                variableType = VARIABLE_TYPES.DATA;
                variableCategory = VARIABLE_CATEGORIES.DEVICE;
            }
            evtVal = evtVal.replace(matchStr, '${0}');
            return {
                'type'      : variableType,
                'category'  : variableCategory,
                'evtVal'    : evtVal
            };
        }
        function getMatchModes() {
            return {
                'start'    : 'start',
                'end'      : 'end',
                'anywhere' : 'anywhere',
                'exact'    : 'exact'
            };
        }

        // The bound value is replaced with {{item.fieldname}} here. This is needed by the liveList when compiling inner elements
        function updateTmplAttrs($root, parentDataSet, name) {

            var _parentDataSet = parentDataSet.replace('bind:', ''),
                regex          = new RegExp('(' + _parentDataSet + ')(\\[0\\])?(.data\\[\\$i\\])?(.content\\[\\$i\\])?(\\[\\$i\\])?', 'g'),
                currentItemRegEx,
                currentItemWidgetsRegEx;

            if (name) {
                currentItemRegEx        = new RegExp('(Widgets.' + name + '.currentItem)', 'g');
                currentItemWidgetsRegEx = new RegExp('(Widgets.' + name + '.currentItemWidgets)', 'g');
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
                            attr.value = 'bind:' + value;
                        }
                        //Replace item if widget property is bound to livelist currentItem
                        if (currentItemRegEx && currentItemRegEx.test(value)) {
                            attr.value = value.replace(currentItemRegEx, 'item');
                        }
                        if (currentItemWidgetsRegEx && currentItemWidgetsRegEx.test(value)) {
                            attr.value = value.replace(currentItemWidgetsRegEx, 'currentItemWidgets');
                        }
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

        //Function to evaluate expression
        function evalExp(scope, evtValue) {
            //Modifying expression in to array notation for variables with special characters in name
            if (_.includes(evtValue, 'Variables.')) {
                var parts = evtValue.split('.');
                evtValue = parts[0] + '["' + parts[1] + '"].' + parts[2];
            }
            //Evaluating in timeout so that the binding get updated
            $timeout(function () {
                //Evaluating for Variables,Widgets and Form events inside list
                if (_.startsWith(evtValue, 'Variables') || _.startsWith(evtValue, 'Widgets.') || !_.includes(evtValue, '.')) {
                    scope.$eval(evtValue);
                } else {
                    $rootScope.$emit('invoke-service', evtValue);//Invoking Prefab events
                }
            });
        }

        //Triggers custom events passed
        function triggerCustomEvents(event, customEvents, callBackScope, data, variable) {
            var retVal,
                firstArg = variable || event;
            _.forEach(_.split(customEvents, ';'), function (eventValue) {
                /* if event value is javascript, call the function defined in the callback scope of the variable */
                if (eventValue === 'Javascript') {
                    retVal = triggerFn(callBackScope[variable && variable.name + event], firstArg, data);
                }
                if (_.startsWith(eventValue, 'Widgets.') || _.startsWith(eventValue, 'Variables.')) {
                    evalExp(callBackScope, eventValue);
                    return;
                }
                if (_.includes(eventValue, '(')) {
                    retVal = triggerFn(callBackScope[eventValue.substring(0, eventValue.indexOf('('))], firstArg, data);
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

        /**
         * Simulates file download in an app through creating and submitting a hidden form in DOM.
         * The action will be initiated through a Service Variable
         * @param variable: the variable that is called from user action
         * @param requestParams object consisting the info to construct the XHR request for the service
         */
        function simulateFileDownload(requestParams) {
            var iFrameElement,
                formEl,
                paramElement,
                queryParams,
                IFRAME_NAME = 'fileDownloadIFrame',
                FORM_NAME   = 'fileDownloadForm',
                url         = requestParams.url;

            /* look for existing iframe. If exists, remove it first */
            iFrameElement = $(IFRAME_NAME);
            if (iFrameElement.length) {
                iFrameElement.first().remove();
            }
            iFrameElement = WM.element('<iframe id="' + IFRAME_NAME + '" name="' + IFRAME_NAME + '" class="ng-hide"></iframe>');
            formEl        = WM.element('<form id="' + FORM_NAME + '" name="' + FORM_NAME + '"></form>');
            formEl.attr({
                'target'  : iFrameElement.attr("name"),
                'action'  : url,
                'method'  : requestParams.method,
                'enctype' : requestParams.headers['Content-Type']
            });

            /* process query params, append a hidden input element in the form against each param */
            queryParams = url.indexOf('?') !== -1 ? url.substring(url.indexOf('?') + 1) :
                    requestParams.headers['Content-Type'] === getService('WS_CONSTANTS').CONTENT_TYPES.FORM_URL_ENCODED ? requestParams.dataParams : '';
            queryParams = _.split(queryParams, '&');
            _.forEach(queryParams, function (param) {
                param = _.split(param, '=');
                paramElement = WM.element('<input type="hidden">');
                paramElement.attr({
                    'name'  : param[0],
                    'value' : decodeURIComponent(_.join(_.slice(param, 1), '='))
                });
                formEl.append(paramElement);
            });

            /* append form to iFrame and iFrame to the document and submit the form */
            WM.element('body').append(iFrameElement);
            iFrameElement.contents().find('body').append(formEl);
            formEl.submit();
        }


        //converts the csv representation of roles to array
        function getWidgetRolesArrayFromStr(val) {
            var UNICODE_COMMA_REGEX = /&#44;/g;

            val = val || '';
            // replace the unicode equivalent of comma with comma
            return val.split(',').map(function (v) {
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
            var expr              = '',
                KEY_VAL_SEPARATOR = ' ',
                FIELD_SEPARATOR   = ',';
            _.forEach(pageableObj, function (obj, index) {
                expr += obj.property + KEY_VAL_SEPARATOR + obj.direction.toLowerCase() + (index > 0 && index < pageableObj.length - 1 ? FIELD_SEPARATOR : '');
            });

            return expr;
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
                    "wm-button",
                    "wm-picture",
                    "wm-anchor",
                    "wm-popover",
                    "wm-date",
                    "wm-calendar",
                    "wm-time",
                    "wm-datetime",
                    "wm-currency",
                    "wm-colorpicker",
                    "wm-slider",
                    "wm-fileupload",
                    "wm-grid",
                    "wm-livefilter",
                    "wm-livelist",
                    "wm-datanavigator",
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
                    "wm-carousel"
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
            }
            return types;
        }

        /*
        * Function to trigger DialogService's open with proper scope
         * @param dialogId
         * @param dialogScope
        * */
        function openDialog(dialogId, dialogScope) {
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
            DialogService.open(dialogId, dialogScope);
        }

        /* formats the data and returns the array of values.
         * If object is given as param, array of object is returned.
         * If commma separated string is given as param, array of strings is returned.
         */
        function convertToArray(val) {
            if (WM.isDefined(val)) {
                if (WM.isArray(val)) {
                    return val;
                }
                if (WM.isString(val)) {
                    return _.split(val, ',').map(function (opt) {return ('' + opt).trim(); });
                }
                return [val];
            }
        }

        this.camelCase                  = WM.element.camelCase;
        this.initCaps                   = initCaps;
        this.firstCaps                  = firstCaps;
        this.periodSeparate             = periodSeparate;
        this.spaceSeparate              = spaceSeparate;
        this.prettifyLabel              = prettifyLabel;
        this.prettifyLabels             = prettifyLabels;
        this.getVariableName            = getVariableName;
        this.getImageUrl                = getImageUrl;
        this.getResourceUrl             = getResourceURL;
        this.formatVariableIconClass    = formatVariableIconClass;
        this.getBackGroundImageUrl      = getBackGroundImageUrl;
        this.getParentOverlayElZIndex   = getParentOverlayElZIndex;
        this.hyphenate                  = hyphenate;
        this.deHyphenate                = deHyphenate;
        this.isAndroid                  = isAndroid;
        this.isAndroidPhone             = isAndroidPhone;
        this.isIphone                   = isIphone;
        this.isIpod                     = isIpod;
        this.isMobile                   = isMobile;
        this.isScriptLoaded             = isScriptLoaded;
        this.isValidJavaPackageName     = isValidJavaPackageName;
        this.isValidHtml                = isValidHtml;
        this.hasSpecialCharacters       = hasSpecialCharacters;
        this.checkSpecialCharacters     = checkSpecialCharacters;
        this.isQuoteNotPresent          = isQuoteNotPresent;
        this.stringStartsWith           = stringStartsWith;
        this.stringEndsWith             = stringEndsWith;
        this.isStyleSheetLoaded         = isStyleSheetLoaded;
        this.isValidWebURL              = isValidWebURL;
        this.loadScripts                = loadScripts;
        this.loadStyleSheets            = loadStyleSheets;
        this.loadStyleSheet             = loadStyleSheet;
        this.prepareFieldDefs           = prepareFieldDefs;
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
        this.initializeAction           = initializeAction;
        this.addNodeToJson              = addNodeToJson;
        this.getNodeFromJson            = getNodeFromJson;
        this.removeJsonNodeChildren     = removeJsonNodeChildren;
        this.isIE                       = isIE;
        this.isIE9                      = isIE9;
        this.isIE11                     = isIE11;
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
        this.getDateTimeTypes           = getDateTimeTypes;
        this.getDataSetWidgets          = getDataSetWidgets;
        this.getDaysOptions             = getDaysOptions;
        this.getDateTimeDefaultFormats  = getDateTimeDefaultFormats;
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
        this.getVariableDetails         = getVariableDetails;
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
    }]);
