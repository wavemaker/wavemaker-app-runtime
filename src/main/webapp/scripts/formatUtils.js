/*global WM*/

WM.module('wm.utils')
    .config(['$filterProvider', function ($filterProvider) {
        'use strict';
        WM.module('wm.utils').$filter = $filterProvider.register;
    }])
    .service('DataFormatService', [
        '$filter',
        function ($filter) {
            'use strict';

            var MONTH_LONG_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                MONTH_SHORT_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                MERIDIAN_NAMES = ['am', 'pm'],
                DATE_PATTERNS = ['yyyy-MM-dd', 'yyyy-M-dd', 'M-dd-yyyy', 'MM-dd-yy', 'yyyy, dd MMMM', 'yyyy, MMM dd', 'MM/dd/yyyy', 'M/d/yyyy', 'EEE, dd MMM yyyy', 'EEE MMM dd yyyy', 'EEEE, MMMM dd, yyyy', "timestamp"],
                DATE_TIME_PATTERNS = ["yyyy-MM-dd", "yyyy-M-dd", "M-dd-yyyy", "M/d/yyyy", "MM/dd/yyyy", "yyyy, MMM dd", "yyyy, dd MMMM", "MM-dd-yy hh:mm:ss a", "MM-dd-yy hh:mm:ss a Z", "yyyy-MM-dd HH:mm", "yyyy-MM-dd HH:mm:ss:sss", "yyyy-MM-dd hh:mm a", "yyyy-MM-dd hh:mm:ss a", "yyyy-MM-dd hh:mm:ss:sss Z", "yyyy-MM-dd hh:mm:ss:sss a", "EEE MMM dd hh:mm:ss Z yyyy", "EEE, dd MMM yyyy HH:mm:ss Z", "EEEE, MMMM dd, yyyy", "timestamp"],
                TIME_PATTERNS = ['HH:mm:ss', 'HH:mm', 'hh:mm:ss', 'hh:mm', 'hh:mm a', 'H:m:s', 'h:m:s', 'timestamp'],
                CURRENCY_OPTIONS = ["AED", "AFN", "ALL", "AMD", "ARS", "AUD", "AZN", "BAM", "BDT", "BGN", "BHD", "BIF", "BND", "BOB", "BRL", "BWP", "BYR", "BZD", "CAD", "CDF", "CHF", "CLP", "CNY", "COP", "CRC", "CVE", "CZK", "DJF", "DKK", "DOP", "DZD", "EEK", "EGP", "ERN", "ETB", "EUR", "GBP", "GEL", "GHS", "GNF", "GTQ", "HKD", "HNL", "HRK", "HUF", "IDR", "ILS", "INR", "IQD", "IRR", "ISK", "JMD", "JOD", "JPY", "KES", "KHR", "KMF", "KRW", "KWD", "KZT", "LBP", "LKR", "LTL", "LVL", "LYD", "MAD", "MDL", "MGA", "MKD", "MMK", "MOP", "MUR", "MXN", "MYR", "MZN", "NAD", "NGN", "NIO", "NOK", "NPR", "NZD", "OMR", "PAB", "PEN", "PHP", "PKR", "PLN", "PYG", "QAR", "RON", "RSD", "RUB", "RWF", "SAR", "SDG", "SEK", "SGD", "SOS", "SYP", "THB", "TND", "TOP", "TRY", "TTD", "TWD", "TZS", "UAH", "UGX", "USD", "UYU", "UZS", "VEF", "VND", "XAF", "XOF", "YER", "ZAR", "ZMK"],

            //WEEK_LONG_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                //WEEK_SHORT_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
                PARSE_DATE_MAP = {
                    'y': 0,      // placeholder -> ctorIndex
                    'Y': [0, -2000],
                    'M': [1, 1], // placeholder -> [ctorIndex, offset|value array]
                    'n': [1, MONTH_SHORT_NAMES],
                    'N': [1, MONTH_LONG_NAMES],
                    'd': 2,
                    'm': 4,
                    'H': 3,
                    'h': 3,
                    'K': [3, 1],
                    'k': [3, 1],
                    's':  5,
                    'S':  6,
                    'a': [3, MERIDIAN_NAMES]
                },
                customFilters = {};
            function getDateTimePatterns() {
                return DATE_TIME_PATTERNS;
            }
            function getDatePatterns() {
                return DATE_PATTERNS;
            }
            function getTimePatterns() {
                return TIME_PATTERNS;
            }
            function getCurrencyOptions() {
                return CURRENCY_OPTIONS;
            }
            /* converts epoch to date object */
            function epoch2date(epoch) {
                if (!epoch) {
                    return undefined;
                }

                if (WM.isString(epoch)) {
                    epoch = +epoch;
                }

                if (isNaN(epoch)) {
                    return undefined;
                }
                return new Date(epoch);
            }

            /* converts epoch to given date format */
            function epoch2dateStr(epoch, format) {
                return $filter('date')(epoch, format);
            }

            /* converts date object to given date format */
            function date2dateStr(date, format) {
                return $filter('date')(date, format);
            }

            /* converts date object to epoch */
            function date2epoch(date) {
                return date.valueOf();
            }

            /* converts date(in string) in the given format to date object */
            function dateStr2date(date, fmt) {

                var indexMap = {},
                    reIndex = 1,
                    match,
                    format,
                    parser,
                    ctorArgs,
                    i,
                    matchVal,
                    indexEntry,
                    placeholderChar,
                    mapEntry,
                    ctorIndex,
                    valList,
                    listValue,
                    value,
                    retValue;

                if (!date) {
                    return undefined;
                }

                if (!fmt) {
                    retValue = new Date(date);
                    if (isNaN(retValue.valueOf())) {
                        return undefined;
                    }

                    return retValue;
                }

                format = fmt.replace(/^\?/, '');
                if (format !== fmt && !date.length) {
                    return null;
                }

                match = /^\[([+-]\d\d)(\d\d)\]\s*(.*)/.exec(format);
                if (match) {
                    format = match[3];
                }

                parser = new RegExp(format.replace(/(.)(\1*)(?:\[([^\]]*)\])?/g,
                    function (wholeMatch, placeholderChar, placeholderDigits, param) {
                        if (/[dmhkyhs]/i.test(placeholderChar)) {
                            indexMap[reIndex++] = placeholderChar;
                            var plen = placeholderDigits.length + 1;
                            return "(\\d" + (plen < 2 ? "+" : ("{1," + plen + "}")) + ")";
                        }

                        if (placeholderChar === 'z') {
                            reIndex += 2;
                            return "([+-]\\d\\d)(\\d\\d)";
                        }

                        if (/[Nna]/.test(placeholderChar)) {
                            indexMap[reIndex++] = [placeholderChar, param && param.split(',')];
                            return "([a-zA-Z\\u0080-\\u1fff]+)";
                        }

                        if (/w/i.test(placeholderChar)) {
                            return "[a-zA-Z\\u0080-\\u1fff]+";
                        }

                        if (/\s/.test(placeholderChar)) {
                            return "\\s+";
                        }

                        return wholeMatch.replace(/[\\\[\]\/{}()*+?.$|^-]/g, "\\$&");
                    }));

                match = parser.exec(date);
                if (!match) {
                    return undefined;
                }

                ctorArgs = [0, 0, 0, 0, 0, 0,  0];

                function getMatchIndex(list, match) {
                    var j, len;
                    for (j = 0, len = list.length; j < len; j++) {
                        if (match.toLowerCase().indexOf(list[j].toLowerCase()) === 0) {
                            return j;
                        }
                    }
                }

                for (i = 1; i < reIndex; i++) {
                    matchVal = match[i];
                    indexEntry = indexMap[i];
                    if (WM.isArray(indexEntry)) { // for a, n or N
                        placeholderChar = indexEntry[0];
                        mapEntry  = PARSE_DATE_MAP[placeholderChar];
                        ctorIndex = mapEntry[0];
                        valList = indexEntry[1] || mapEntry[1];
                        listValue = getMatchIndex(valList, matchVal);
                        if (listValue === null) {
                            return undefined;
                        }

                        if (placeholderChar === 'a') {
                            ctorArgs[ctorIndex] += listValue * 12;
                        } else {
                            ctorArgs[ctorIndex] = listValue;
                        }
                    } else if (indexEntry) {
                        value = parseFloat(matchVal);
                        mapEntry  = PARSE_DATE_MAP[indexEntry];
                        if (WM.isArray(mapEntry)) {
                            ctorArgs[mapEntry[0]] += value - mapEntry[1];
                        } else {
                            ctorArgs[mapEntry] += value;
                        }
                    }
                }
                return new Date(ctorArgs[0], ctorArgs[1], ctorArgs[2], ctorArgs[3], ctorArgs[4], ctorArgs[5], ctorArgs[6]);
            }

            /* converts date(in string) in the given format to epoch */
            function dateStr2epoch(date, fmt) {
                if (!fmt) {
                    return date2epoch(new Date(date));
                }
                return date2epoch(dateStr2date(date, fmt));
            }

            /* converts given string to number */
            function string2number(data, fracSize) {
                return $filter('number')(data, fracSize);
            }

            /* converts given number to currency */
            function number2currency(data, currencySymbol, fractionSize) {
                currencySymbol = currencySymbol || '';
                return currencySymbol + string2number(data, fractionSize);
            }

            /* converts epoch or date object to date-string in the given format */
            function toDate(data, format) {
                var isEpoch = !isNaN(+data),
                    isDate;
                if (isEpoch) {
                    return epoch2dateStr(data, format);
                }

                isDate = WM.isDate(data);
                if (isDate) {
                    return date2dateStr(data, format);
                }

                return undefined;
            }

            /* converts given input to string */
            function toNumber(data, fracSize) {
                return string2number(data, fracSize);
            }

            /* converts given input to currency */
            function toCurrency(data, currencySymbol, fracSize) {
                return number2currency(data, currencySymbol, fracSize);
            }

            /* padding string will be added to the left of the data */
            function lpad(data, padding) {
                return data ? padding + data : padding;
            }

            /* padding string will be added to the right of the data */
            function rpad(data, padding) {
                return data ? data + padding : padding;
            }

            function prefix(data, padding) {
                return data ? padding + data : padding;
            }

            /* padding string will be added to the right of the data */
            function suffix(data, padding) {
                return data ? data + padding : padding;
            }

            /* register a formatter/filter */
            function register(formatterName, formatterFn) {
                WM.module('wm.utils').$filter(formatterName, formatterFn);
            }

            customFilters.toDate = toDate;
            customFilters.toNumber = toNumber;
            customFilters.toCurrency = toCurrency;
            customFilters.lpad = lpad;
            customFilters.rpad = rpad;
            customFilters.prefix = prefix;
            customFilters.suffix = suffix;

            Object.keys(customFilters).forEach(function (filterName) {
                WM.module('wm.utils').$filter(filterName, function () {
                    return customFilters[filterName];
                });
            });

            /* expose the register method on service */
            this.register = register;
            /*Getter for date time patterns*/
            this.getDateTimePatterns = getDateTimePatterns;
            this.getDatePatterns = getDatePatterns;
            this.getTimePatterns = getTimePatterns;
            this.getCurrencyOptions = getCurrencyOptions;
        }
    ]);