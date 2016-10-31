/*global $, window, angular, moment, WM, _, FormData, document, parseInt, Blob, navigator*/
/*jslint todo: true*/
/**
 * JQuery Datagrid widget.
 */

'use strict';

$.widget('wm.datagrid', {
    options: {
        data: [],
        statusMsg: '',
        colDefs: [],
        rowActions: [],
        headerConfig: [],
        sortInfo: {
            'field': '',
            'direction': ''
        },
        isMobile: false,
        enableSort: true,
        filtermode: '',
        height: '100%',
        showHeader: true,
        selectFirstRow: false,
        showRowIndex: false,
        enableRowSelection: true,
        enableColumnSelection: false,
        rowNgClass: '',
        multiselect: false,
        filterNullRecords: true,
        cssClassNames: {
            'tableRow'        : 'app-datagrid-row',
            'headerCell'      : 'app-datagrid-header-cell',
            'groupHeaderCell' : 'app-datagrid-group-header-cell',
            'tableCell'       : 'app-datagrid-cell',
            'grid'            : '',
            'gridDefault'     : 'table',
            'gridBody'        : 'app-datagrid-body',
            'deleteRow'       : 'danger',
            'ascIcon'         : 'wi wi-long-arrow-up',
            'descIcon'        : 'wi wi-long-arrow-down'
        },
        dataStates: {
            'loading': 'Loading...',
            'ready': '',
            'error': 'An error occurred in loading the data.',
            'nodata': 'No data found.'
        },
        startRowIndex: 1,
        editmode: '',
        searchHandler: WM.noop,
        sortHandler: function (sortInfo, e) {
            /* Local sorting if server side sort handler is not provided. */
            e.stopPropagation();
            var data = $.extend(true, [], this.options.data);
            this._setOption('data', _.orderBy(data, sortInfo.field, sortInfo.direction));
            if ($.isFunction(this.options.afterSort)) {
                this.options.afterSort(e);
            }
        }
    },
    customColumnDefs: {
        'checkbox': {
            'field'            : 'checkbox',
            'type'             : 'custom',
            'displayName'      : '',
            'sortable'         : false,
            'searchable'       : false,
            'resizable'        : false,
            'selectable'       : false,
            'readonly'         : true,
            'style'            : 'width: 50px; text-align: center;',
            'textAlignment'    : 'center',
            'isMultiSelectCol' : true,
            'show'             : true
        },
        'radio': {
            'field'         : 'radio',
            'type'          : 'custom',
            'displayName'   : '',
            'sortable'      : false,
            'searchable'    : false,
            'resizable'     : false,
            'selectable'    : false,
            'readonly'      : true,
            'style'         : 'width: 50px; text-align: center;',
            'textAlignment' : 'center',
            'show'          : true
        },
        'rowIndex': {
            'field'         : 'rowIndex',
            'type'          : 'custom',
            'displayName'   : 'S. No.',
            'sortable'      : false,
            'searchable'    : false,
            'selectable'    : false,
            'readonly'      : true,
            'style'         : 'text-align: left;',
            'textAlignment' : 'left',
            'show'          : true
        }
    },
    CONSTANTS: {
        'QUICK_EDIT'   : 'quickedit',
        'INLINE'       : 'inline',
        'FORM'         : 'form',
        'DIALOG'       : 'dialog',
        'SEARCH'       : 'search',
        'MULTI_COLUMN' : 'multicolumn'
    },
    Utils: {
        random: function () {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        },
        isDefined: function (value) {
            return value !== undefined;
        },
        isObject: function (value) {
            return value !== null && typeof value === 'object';
        },
        getObjectIndex: function (data, obj) {
            var matchIndex = -1;
            if (!Array.isArray(data)) {
                return -1;
            }
            data.some(function (data, index) {
                //todo: remove angular dependency.
                if (angular.equals(data, obj)) {
                    matchIndex = index;
                    return true;
                }
            });
            return matchIndex;
        },
        generateGuid: function () {
            var random = this.random;
            return random() + random() + '-' + random() + '-' + random() + '-' +
                random() + '-' + random() + random() + random();
        },
        isValidHtml: function (htm) {
            var validHtmlRegex = /<[a-z][\s\S]*>/i;
            return validHtmlRegex.test(htm);
        },
        isMac: function () {
            return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
        },
        isDeleteKey: function (event) {
            return (this.isMac() && event.which === 8) || event.which === 46;
        }
    },

    _getColumnSortDirection: function (field) {
        var sortInfo = this.options.sortInfo;
        return field === sortInfo.field ? sortInfo.direction : '';
    },
    /*Based on the spacing property, add or remove classes*/
    _toggleSpacingClasses: function (value) {
        switch (value) {
        case 'normal':
            this.gridElement.removeClass('table-condensed');
            this.gridHeaderElement.removeClass('table-condensed');
            if (this.gridSearch) {
                this.gridSearch.find('select').removeClass('input-sm');
                this.gridSearch.find('.input-group').removeClass('input-group-sm');
            }
            break;
        case 'condensed':
            this.gridElement.addClass('table-condensed');
            this.gridHeaderElement.addClass('table-condensed');
            if (this.gridSearch) {
                this.gridSearch.find('select').addClass('input-sm');
                this.gridSearch.find('.input-group').addClass('input-group-sm');
            }
            break;
        }
    },
    //Method to calculate and get the column span of the header cells
    _getColSpan: function (cols) {
        var colSpan = 0,
            self    = this;
        _.forEach(cols, function (col) {
            if (col.columns) {
                colSpan += self._getColSpan(col.columns);
            } else {
                colSpan += 1;
            }
        });
        return colSpan;
    },
    //Method to set the column span of the header cells in the config
    _setColSpan: function (config) {
        var self = this;
        _.forEach(config, function (col) {
            if (col.columns) {
                col.colspan = self._getColSpan(col.columns);
                self._setColSpan(col.columns);
            }
        });
    },
    /* Returns the table header template. */
    _getHeaderTemplate: function () {

        var cols             = '<colgroup>',
            htm              = '<thead>',
            isDefined        = this.Utils.isDefined,
            sortInfo         = this.options.sortInfo,
            sortField        = sortInfo.field,
            self             = this,
            rowTemplates     = [],
            headerConfig     = this.options.headerConfig,
            headerGroupClass = self.options.cssClassNames.groupHeaderCell;
        function generateHeaderCell(value, index) {
            var id            = index,
                field         = value.field,
                headerLabel   = WM.isDefined(value.displayName) ? value.displayName : field,
                sortEnabled   = self.options.enableSort && (_.isUndefined(value.show) || value.show) && (_.isUndefined(value.sortable) || value.sortable) && !value.widgetType,
                headerClasses = self.options.cssClassNames.headerCell,
                sortClass,
                tl = '';

            /* Colgroup */
            cols += '<col';
            if (value.style) {
                cols += ' style="' + value.style + '"';
            }
            cols += '/>';
            /* thead */

            if (isDefined(value.class)) {
                headerClasses +=  ' ' + value.class;
            }
            if (value.selected) {
                headerClasses += ' info';
            }
            if (field === 'checkbox' || field === 'radio') {
                headerClasses += ' grid-col-small';
            }
            tl += '<th data-col-id="' + id + '" data-col-field="' + field + '" class="' + headerClasses + '" title="' + headerLabel + '" style="text-align: ' +
                value.textAlignment + ';"';
            if ((_.isUndefined(value.resizable) || value.resizable) && (_.isUndefined(value.show) || value.show)) { //If show is false, do not add the resize option
                tl += ' data-col-resizable';
            }
            if (self.options.enableColumnSelection && (_.isUndefined(value.selectable) || value.selectable)) {
                tl += ' data-col-selectable';
            }
            if (sortEnabled) {
                tl += ' data-col-sortable';
            }
            tl += '>';
            /* For custom columns, show display name if provided, else don't show any label. */
            if (field === 'checkbox') {
                tl += '<input type="checkbox" />';
            }
            if (field === 'radio') {
                tl += '';
            }
            tl += '<span class="header-data">' + headerLabel + '</span>';
            if (sortEnabled) { //If sort info is present, show the sort icon for that column on grid render
                if (sortField && sortField === value.field && sortInfo.direction) {
                    sortClass = sortInfo.direction === 'asc' ? self.options.cssClassNames.ascIcon : self.options.cssClassNames.descIcon;
                    tl += '<span class="sort-buttons-container active">';
                    tl += '<i class="sort-icon ' + sortClass + ' ' + sortInfo.direction + '"></i>';
                } else {
                    tl += '<span class="sort-buttons-container">';
                    tl += '<i class="sort-icon"></i>';
                }
                tl += '</span>';
            }
            tl += '</th>';
            return tl;
        }
        //Method to generate the header row based on the column group config
        function generateRow(cols, i) {
            var tl = '';
            _.forEach(cols, function (col) {
                var index,
                    value;
                if (col.columns) {
                    //If columns is present, this is a group header cell.
                    tl += '<th colspan="' + col.colspan + '" class="' + headerGroupClass + '"><span class="header-data">' + col.caption + '</span></th>';
                    generateRow(col.columns, (i + 1));
                } else {
                    //For non group cells, fetch the relative field definition and generate the template
                    index = _.findIndex(self.preparedHeaderData, {'field': col.name});
                    value = self.preparedHeaderData[index];
                    if (value) {
                        tl += generateHeaderCell(value, index);
                    }
                }
            });
            rowTemplates[i] = rowTemplates[i] || '';
            rowTemplates[i] += tl;
        }
        //If header config is not present, this is a dynamic grid. Generate headers directly from field defs
        if (_.isEmpty(headerConfig)) {
            htm += '<tr>';
            self.preparedHeaderData.forEach(function (value, index) {
                htm += generateHeaderCell(value, index);
            });
            htm += '</tr>';
        } else {
            this._setColSpan(headerConfig);
            generateRow(headerConfig, 0);
            //Combine all the row templates to generate the header
            htm += _.reduce(rowTemplates, function (template, rowTl, index) {
                var $rowTl = $(rowTl),
                    tl = '',
                    rowSpan = rowTemplates.length - index;
                if (rowSpan > 1) {
                    $rowTl.closest('th.app-datagrid-header-cell').attr('rowspan', rowSpan);
                }
                $rowTl.each(function () {
                    tl += $(this).get(0).outerHTML;
                });
                return template + '<tr>' + tl + '</tr>';
            }, '');
        }
        htm  += '</thead>';
        cols += '</colgroup>';

        return { 'colgroup' : cols, 'header' : htm };
    },

    /* Returns the seachbox template. */
    _getSearchTemplate: function () {
        var htm,
            sel = '<select name="wm-datagrid" data-element="dgFilterValue" ' +
                'class="form-control app-select">' +
                '<option value="" selected>Select Field</option>',
            searchLabel = (this.Utils.isDefined(this.options.searchLabel) &&
                this.options.searchLabel.length) ? this.options.searchLabel : 'Search:';
        this.options.colDefs.forEach(function (colDef, index) {
            if (colDef.field !== 'none' && colDef.field !== 'rowOperations' && colDef.searchable) {
                sel += '<option value="' + colDef.field +
                    '" data-coldef-index="' + index + '">' +
                    (colDef.displayName || colDef.field) + '</option>';
            }
        });

        sel += '</select>';
        htm =
            '<form class="form-search form-inline" onsubmit="return false;"><div class="form-group">' +
                '<input type="text" data-element="dgSearchText" class="form-control app-textbox" value="" placeholder="' +  searchLabel + '" style="display: inline-block;"/>' +
            '</div><div class="input-append input-group">' +
                sel +
                '<span class="input-group-addon"><button type="button" data-element="dgSearchButton" class="app-search-button" title="Search">' +
                        '<i class="wi wi-search"></i>' +
                    '</button></span>' +
                '</div>' +
            '</div></form>';
        return htm;
    },

    /* Returns the tbody markup. */
    _getGridTemplate: function () {
        var self = this,
            $tbody = $('<tbody class="' + this.options.cssClassNames.gridBody + '"></tbody>');

        _.forEach(this.preparedData, function (row) {
            $tbody.append(self._getRowTemplate(row));
        });

        return $tbody;
    },

    /* Returns the table row template. */
    _getRowTemplate: function (row) {
        var htm,
            self            = this,
            gridOptions     = self.options,
            rowNgClass      = gridOptions.rowNgClass,
            rowNgClassExpr  = rowNgClass ? 'ng-class="' + rowNgClass + '"' : '';

        htm = this.preparedHeaderData.reduce(function (prev, current, colIndex) {
            return prev + self._getColumnTemplate(row, colIndex, current);
        }, '<tr tabindex="0" class="' + gridOptions.cssClassNames.tableRow + ' ' + (gridOptions.rowClass || '') + '" data-row-id="' + row.pk + '" ' + rowNgClassExpr + '>');

        htm += '</tr>';
        if (rowNgClass) {
            return gridOptions.getCompiledTemplate(htm, row);
        }
        return htm;
    },

    _getRowActionsColumnDefIndex: function () {
        var i, len = this.preparedHeaderData.length;
        for (i = 0; i < len; i += 1) {
            if (this.preparedHeaderData[i].field === 'rowOperations') {
                return i;
            }
        }
        return -1;
    },

    _getRowActionsColumnDef: function () {
        var index = this._getRowActionsColumnDefIndex();
        if (index !== -1) {
            return this.preparedHeaderData[index];
        }
        return null;
    },

    /* Returns the checkbox template. */
    _getCheckboxTemplate: function (row, isMultiSelectCol) {
        var checked        = row.checked ? ' checked' : '',
            disabled       = row.disabed ? ' disabled' : '',
            chkBoxName     = isMultiSelectCol ? 'gridMultiSelect' : '';
        return '<input name="' + chkBoxName + '" type="checkbox"' + checked + disabled + '/>';
    },

    /* Returns the radio template. */
    _getRadioTemplate: function (row) {
        var checked = row.checked ? ' checked' : '',
            disabled = row.disabed ? ' disabled' : '';
        return '<input type="radio" name="" value=""' + checked + disabled + '/>';
    },

    /* Returns the table cell template. */
    _getColumnTemplate: function (row, colId, colDef) {
        var classes = this.options.cssClassNames.tableCell + ' ' + (colDef.class || ''),
            ngClass = colDef.ngclass || '',
            htm = '<td class="' + classes + '" data-col-id="' + colId + '" style="text-align: ' + colDef.textAlignment + ';"',
            colExpression = colDef.customExpression,
            ctId = row.pk + '-' + colId,
            value,
            isCellCompiled = false,
            columnValue;
        if (colDef.field) {
            //setting the default value
            columnValue = row[colDef.field];
        }
        value = _.get(row, colDef.field);
        if (value) {
            columnValue = value;
        }
        if (ngClass) {
            isCellCompiled = true;
        }
        /*constructing the expression based on the choosen format options*/
        if (colDef.formatpattern && colDef.formatpattern !== "None" && !colExpression) {
            switch (colDef.formatpattern) {
            case 'toDate':
                if (colDef.datepattern) {
                    if (colDef.type === 'datetime') {
                        columnValue = columnValue ? moment(columnValue).valueOf() : undefined;
                    }
                    colExpression = "{{'" + columnValue + "' | toDate:'" + colDef.datepattern + "'}}";
                }
                break;
            case 'toCurrency':
                if (colDef.currencypattern) {
                    colExpression = "{{'" + columnValue + "' | toCurrency:'" + colDef.currencypattern;
                    if (colDef.fractionsize) {
                        colExpression +=  "':'" + colDef.fractionsize + "'}}";
                    } else {
                        colExpression += "'}}";
                    }
                }
                break;
            case 'toNumber':
                if (colDef.fractionsize) {
                    colExpression = "{{'" + columnValue + "' | toNumber:'" + colDef.fractionsize + "'}}";
                }
                break;
            case 'prefix':
                if (colDef.prefix) {
                    colExpression = "{{'" + columnValue + "' | prefix:'" + colDef.prefix + "'}}";
                }
                break;
            case 'suffix':
                if (colDef.suffix) {
                    colExpression = "{{'" + columnValue + "' | suffix:'" + colDef.suffix + "'}}";
                }
                break;
            }
            htm += 'title="' + colExpression + '"';
        }
        if (colExpression) {
            if (isCellCompiled) {
                htm += '>';
            } else {
                htm += 'data-compiled-template="' + ctId + '">';
                isCellCompiled = true;
            }
            htm += colExpression;
        } else {
            if (colDef.type !== 'custom') {
                columnValue = row[colDef.field];
                /* 1. Show "null" values as null if filterNullRecords is true, else show empty string.
                * 2. Show "undefined" values as empty string. */
                if ((this.options.filterNullRecords && columnValue === null) ||
                        _.isUndefined(columnValue)) {
                    columnValue = '';
                }
                htm += 'title="' + columnValue + '">';
                htm += columnValue;
            } else {
                htm += '>';
                switch (colDef.field) {
                case 'checkbox':
                    htm += this._getCheckboxTemplate(row, colDef.isMultiSelectCol);
                    break;
                case 'radio':
                    htm += this._getRadioTemplate(row);
                    break;
                case 'rowOperations':
                    htm += '<span class="actions-column" data-identifier="actionButtons"></span>';
                    break;
                case 'rowIndex':
                    htm += row.index;
                    break;
                case 'none':
                    htm += '';
                    break;
                default:
                    htm += ((_.isUndefined(columnValue) || columnValue === null)) ? '' : columnValue;
                    break;
                }
            }
        }
        htm += '</td>';

        if (ngClass) {
            htm = $(htm).attr({
                'data-ng-class': ngClass,
                'data-compiled-template': ctId
            })[0].outerHTML;
        }

        if (isCellCompiled) {
            this.compiledCellTemplates[ctId] = this.options.getCompiledTemplate(htm, row, colDef, true) || '';
        }
        return htm;
    },
    //Get event related template for editable widget
    _getEventTemplate: function (colDef) {
        var events   = _.filter(_.keys(colDef), function (key) {return _.startsWith(key, 'on'); }),
            template = '';
        _.forEach(events, function (eventName) {
            template += ' ' + _.kebabCase(eventName) + '="' + colDef[eventName] + '" ';
        });
        return template;
    },
    _getEditableTemplate: function ($el, colDef, cellText, rowId) {
        var template,
            formName,
            checkedTmpl,
            placeholder   = _.isUndefined(colDef.placeholder) ? '' : colDef.placeholder,
            dataValue     = cellText ? 'datavalue="' + cellText + '"' : '',
            eventTemplate = this._getEventTemplate(colDef),
            dataFieldName = ' data-field-name="' + colDef.field + '" ',
            disabled      = colDef.disabled ? ' disabled="' + colDef.disabled + '" ' : '',
            required      = colDef.required ? ' required="' + colDef.required + '" ' : '',
            properties    = disabled + dataFieldName + eventTemplate + dataValue + required;
        switch (colDef.editWidgetType) {
        case 'select':
            cellText = cellText || '';
            template =  '<wm-select ' + properties + ' dataset="' + colDef.dataset + '" datafield="' + colDef.datafield + '" displayfield="' + colDef.displayfield + '" placeholder="' + placeholder + '"></wm-select>';
            break;
        case 'autocomplete':
        case 'typeahead':
            $el.addClass('datetime-wrapper');
            template =  '<wm-search ' + properties + ' dataset="' + colDef.dataset + '" datafield="' + colDef.datafield + '" displaylabel="' + colDef.displaylabel + '" searchkey="' +  colDef.searchkey + '" type="autocomplete" placeholder="' + placeholder + '"></wm-select>';
            break;
        case 'date':
            $el.addClass('datetime-wrapper');
            template = '<wm-date ' + properties + ' placeholder="' + placeholder + '"></wm-date>';
            break;
        case 'time':
            $el.addClass('datetime-wrapper');
            template = '<wm-time ' + properties + ' placeholder="' + placeholder + '"></wm-time>';
            break;
        case 'datetime':
            $el.addClass('datetime-wrapper');
            template = '<wm-datetime ' + properties + ' outputformat="yyyy-MM-ddTHH:mm:ss" placeholder="' + placeholder + '"></wm-datetime>';
            break;
        case 'timestamp':
            $el.addClass('datetime-wrapper');
            template = '<wm-datetime ' + properties + ' placeholder="' + placeholder + '"></wm-datetime>';
            break;
        case 'checkbox':
            checkedTmpl = colDef.checkedvalue ? ' checkedvalue="' + colDef.checkedvalue + '" ' : '';
            checkedTmpl += colDef.uncheckedvalue ? ' uncheckedvalue="' + colDef.uncheckedvalue + '" ' : '';
            template = '<wm-checkbox ' + checkedTmpl + properties + '></wm-checkbox>';
            break;
        case 'number':
            template = '<wm-text type="number" ' + properties + ' placeholder="' + placeholder + '"></wm-text>';
            break;
        case 'textarea':
            cellText = cellText || '';
            template = '<wm-textarea ' + properties + ' placeholder="' + placeholder + '"></wm-textarea>';
            break;
        case 'upload':
            formName = colDef.field + '_' + rowId;
            $el.attr('form-name', formName);
            template = '<form name="' + formName + '"><input focus-target' + dataFieldName  + 'class="file-upload" type="file" name="' + colDef.field + '"/></form>';
            break;
        default:
            template = '<wm-text ' + properties + ' placeholder="' + placeholder + '"></wm-text>';
            break;
        }
        return this.options.getCompiledTemplate(template, this.preparedData[rowId] || {}, colDef);
    },
    setHeaderConfigForDefaultFields: function (name) {
        if (_.isEmpty(this.options.headerConfig)) {
            return;
        }
        var fieldName = this.customColumnDefs[name].field;
        _.remove(this.options.headerConfig, {'name': fieldName});
        this.options.headerConfig.unshift({'name': fieldName});
    },
    setDefaultColsData: function (header) {
        if (this.options.showRowIndex) {
            if (header) {
                this.preparedHeaderData.unshift(this.customColumnDefs.rowIndex);
            }
            this.setHeaderConfigForDefaultFields('rowIndex');
        }
        if (this.options.multiselect) {
            if (header) {
                this.preparedHeaderData.unshift(this.customColumnDefs.checkbox);
            }
            this.setHeaderConfigForDefaultFields('checkbox');
        }
        if (!this.options.multiselect && this.options.showRadioColumn) {
            if (header) {
                this.preparedHeaderData.unshift(this.customColumnDefs.radio);
            }
            this.setHeaderConfigForDefaultFields('radio');
        }
    },
    /* Prepares the grid header data by adding custom column definitions if needed. */
    _prepareHeaderData: function () {
        this.preparedHeaderData = [];

        $.extend(this.preparedHeaderData, this.options.colDefs);
        this.setDefaultColsData(true);
    },

    /* Generates default column definitions from given data. */
    _generateCustomColDefs: function () {
        var colDefs = [],
            generatedColDefs = {};

        function generateColumnDef(key) {
            if (!generatedColDefs[key]) {
                var colDef = {
                    'type': 'string',
                    'field': key
                };
                colDefs.push(colDef);
                generatedColDefs[key] = true;
            }
        }

        this.options.data.forEach(function (item) {
            _.keys(item).forEach(generateColumnDef);
        });

        this.options.colDefs = colDefs;
        this._prepareHeaderData();
    },

    /* Prepares the grid data by adding a primary key to each row's data. */
    _prepareData: function () {
        var data = [],
            colDefs = this.options.colDefs,
            self = this,
            isObject = this.Utils.isObject,
            isDefined = this.Utils.isDefined;
        if (!this.options.colDefs.length && this.options.data.length) {
            this._generateCustomColDefs();
        }
        this.options.data.forEach(function (item, i) {
            var rowData = $.extend(true, {}, item);
            colDefs.forEach(function (colDef) {
                if (!colDef.field) {
                    return;
                }
                var fields = colDef.field.split('.'),
                    text = item,
                    j,
                    len = fields.length,
                    key,
                    isArray;

                for (j = 0; j < len; j++) {
                    key = fields[j];
                    isArray = undefined;
                    if (key.indexOf('[0]') !== -1) {
                        key = key.replace('[0]', '');
                        isArray = true;
                    }
                    if (isObject(text) && !isArray) {
                        text = _.get(text, key);
                    } else if (isArray) {
                        text = _.get(text, key + '[0]');
                    } else {
                        text = undefined;
                        break;
                    }
                }
                if (isDefined(text) && colDef.field in item) {
                    rowData[colDef.field] = text;
                } else if (!(colDef.field in item)) {
                    rowData[colDef.field] = text;
                } else if (fields.length > 1 && colDef.field in item) {
                    /* For case when coldef field name has ".", but data is in
                     * format [{'foo.bar': 'test'}], i.e. when the key value is
                     * not a nested object but a primitive value.
                     * (Ideally if coldef name has ".", for e.g. field name 'foo.bar',
                     * data should be [{'foo': {'bar': 'test'}})*/
                    rowData[colDef.field] = item[colDef.field];
                }
            });

            /* Add a unique identifier for each row. */
            rowData.index = self.options.startRowIndex + i;
            rowData.pk = i;
            data.push(rowData);
        });

        this.preparedData = data;
    },

    /* Select previously selected columns after refreshing grid data. */
    _reselectColumns: function () {
        var selectedColumns = [];
        if (this.gridHeader) {
            selectedColumns = this.gridHeader.find('th.info');
            if (selectedColumns.length) {
                selectedColumns.trigger('click');
            }
        }
        //reset select all checkbox.
        if (this.options.multiselect) {
            this.updateSelectAllCheckboxState();
        }
    },

    /* Initializes the grid. */
    _create: function () {
        // Add all instance specific values here.
        $.extend(this, {
            dataStatus: {
                'message': '',
                'state': ''
            },
            preparedData: [],
            preparedHeaderData: [],
            dataStatusContainer: null,
            gridContainer: null,
            gridElement: null,
            gridHeader: null,
            gridBody: null,
            gridSearch: null,
            tableId: null,
            searchObj: {
                'field': '',
                'value': '',
                'event': null
            },
            compiledCellTemplates: {}
        });
        this._setStatus = _.debounce(function () {
            this.__setStatus();
        }, 100);
        this._prepareHeaderData();
        this._prepareData();
        this._render();
    },
    _setGridEditMode: function (val) {
        if ($.isFunction(this.options.setGridEditMode)) {
            this.options.setGridEditMode(val);
        }
    },
    /* Re-renders the whole grid. */
    _refreshGrid: function () {
        this._prepareHeaderData();
        this._prepareData();
        this._render();
        this.setColGroupWidths();
        this.addOrRemoveScroll();
        this._setGridEditMode(false);
    },

    refreshGrid: function () {
        window.clearTimeout(this.refreshGridTimeout);
        this.refreshGridTimeout = window.setTimeout(this._refreshGrid.bind(this), 50);
    },

    /* Re-renders the table body. */
    refreshGridData: function () {
        this._prepareData();
        this.gridBody.remove();
        this._renderGrid();
        this._reselectColumns();
        this.addOrRemoveScroll();
        this._setGridEditMode(false);
    },

    /* Inserts a new blank row in the table. */
    addNewRow: function (skipFocus) {
        var rowId = this.gridBody.find('tr:visible').length,
            rowData = {},
            $row;

        if ($.isFunction(this.options.beforeRowInsert)) {
            this.options.beforeRowInsert();
        }
        rowData.index = this.options.startRowIndex + rowId;
        rowData.pk = rowId;
        if (this.options.editmode === this.CONSTANTS.INLINE || this.options.editmode === this.CONSTANTS.QUICK_EDIT) {
            $row = $(this._getRowTemplate(rowData));
            if (!this.preparedData.length) {
                this.setStatus('ready', this.dataStatus.ready);
            }
            this.gridElement.find('tbody.app-datagrid-body').append($row);
            this._appendRowActions($row, true, rowData);
            this.attachEventHandlers($row);
            $row.trigger('click', [undefined, {action: 'edit', operation: 'new', skipFocus: skipFocus}]);
            this.updateSelectAllCheckboxState();
            this.addOrRemoveScroll();
        }
    },

    /* Returns the selected rows in the table. */
    getSelectedRows: function () {
        this.getSelectedColumns();
        var selectedRowsData = [],
            self = this;

        this.preparedData.forEach(function (data, i) {
            if (data.selected) {
                selectedRowsData.push(self.options.data[i]);
            }
        });
        return selectedRowsData;
    },
    /* Sets the selected rows in the table. */
    selectRows: function (rows) {
        var self = this;
        /*Deselect all the previous selected rows in the table*/
        self.gridBody.find('tr').each(function (index) {
            if (self.preparedData[index].selected) {
                $(this).trigger('click', [$(this), {skipSingleCheck: true}]);
            }
        });
        /*Select the given row. If rows is an array, loop through the array and set the row*/
        if (_.isArray(rows)) {
            _.forEach(rows, function (row) {
                self.selectRow(row, true);
            });
        } else {
            self.selectRow(rows, true);
        }
    },
    /*Set the default widths for the colgroup*/
    setColGroupWidths : function () {
        if (this.options.showHeader) {
            var self       = this,
                headerCols = this.gridHeaderElement.find('col'),
                bodyCols   = this.gridElement.find('col');
            this.gridHeaderElement.find('th.app-datagrid-header-cell').each(function (index) {
                /***setting the header col width based on the content width***/
                var $header      = $(this),
                    width        = $header.width(),
                    id           = $header.attr('data-col-id'),
                    colDef       = self.preparedHeaderData[id],
                    definedWidth = colDef.width;
                if (!_.isUndefined(colDef.show) && !colDef.show) { //If show is false, set width to 0 to hide the column
                    width = 0;
                } else if ($header.hasClass('grid-col-small')) { //For checkbox or radio, set width as 30
                    width = 50;
                } else {
                    if (_.isUndefined(definedWidth) || definedWidth === '' || _.includes(definedWidth, '%')) {
                        width = width > 90 ? width : 90; //columnSanity check to prevent width being too small
                    } else {
                        width = definedWidth;
                    }
                }
                $(headerCols[index]).css('width', width);
                $(bodyCols[index]).css('width', width);
            });
        }
    },

    /* Returns the selected columns in the table. */
    getSelectedColumns: function () {
        var selectedColsData = {},
            headerData = [],
            self = this,
            multiSelectColIndex,
            radioColIndex,
            colIndex;
        $.extend(headerData, this.preparedHeaderData);

        if (this.options.multiselect) {
            headerData.some(function (item, i) {
                if (item.field === 'checkbox') {
                    multiSelectColIndex = i;
                    return true;
                }
            });
            headerData.splice(multiSelectColIndex, 1);
        } else if (this.options.showRadioColumn) {
            headerData.some(function (item, i) {
                if (item.field === 'radio') {
                    radioColIndex = i;
                    return true;
                }
            });
            headerData.splice(radioColIndex, 1);
        }
        if (this.options.showRowIndex) {
            headerData.some(function (item, i) {
                if (item.field === 'rowIndex') {
                    colIndex = i;
                    return true;
                }
            });
            headerData.splice(colIndex, 1);
        }

        headerData.forEach(function (colDef) {
            var field = colDef.field;
            if (colDef.selected) {
                selectedColsData[field] = {
                    'colDef': colDef,
                    'colData': self.options.data.map(function (data) { return data[field]; })
                };
            }
        });
        return selectedColsData;
    },

    /* Sets the options for the grid. */
    _setOption: function (key, value) {
        this._super(key, value);
        switch (key) {
        case 'showHeader':
            this._toggleHeader();
            this._toggleSearch();
            this.setColGroupWidths();
            this.addOrRemoveScroll();
            break;
        case 'filtermode':
            this._toggleSearch();
            break;
        case 'searchLabel':
            if (this.gridSearch) {
                this.gridSearch.find(
                    '[data-element="dgSearchText"]'
                ).attr('placeholder', value);
            }
            break;
        case 'rowngclass':
        case 'rowclass':
            this.refreshGrid();
            break;
        case 'selectFirstRow':
            this.selectFirstRow(value);
            break;
        case 'data':
            this.refreshGridData();
            break;
        case 'dataStates':
            if (this.dataStatus.state === 'nodata') {
                this.setStatus('nodata', this.dataStatus.nodata);
            }
            break;
        case 'multiselect': // Fallthrough
        case 'showRadioColumn':
        case 'colDefs':
        case 'rowActions':
        case 'filterNullRecords':
        case 'showRowIndex':
            this.refreshGrid();
            break;
        case 'cssClassNames':
            var gridClass = this.options.cssClassNames.gridDefault + ' ' + this.options.cssClassNames.grid;
            // Set grid class on table.
            this.gridElement.attr('class', gridClass);
            this.gridHeaderElement.attr('class', gridClass);
            if (this.options.spacing === 'condensed') {
                this._toggleSpacingClasses('condensed');
            }
            break;
        case 'spacing':
            this._toggleSpacingClasses(value);
            break;
        }
    },

    getOptions: function () {
        return this.options;
    },

    /* Toggles the table header visibility. */
    _toggleHeader: function () {
        if (this.gridHeaderElement) {
            this.gridHeaderElement.empty();
        }
        if (this.gridElement) {
            this.gridElement.find('colgroup').remove();
            this.gridElement.find('thead').remove();
        }
        this.setDefaultColsData();
        if (this.options.showHeader) {
            this._renderHeader();
        }
    },

    /* Toggles the searchbox visibility. */
    _toggleSearch: function () {
        if (this.gridSearch) {
            this.gridSearch.remove();
        }
        if (this.options.filtermode === this.CONSTANTS.SEARCH) {
            this._renderSearch();
        } else if (this.options.filtermode === this.CONSTANTS.MULTI_COLUMN) {
            this._renderRowFilter();
        }
    },

    _isCustomExpressionNonEditable: function (customTag, $el) {
        var $input;
        if (!customTag) {
            return false;
        }
        //Check if expression is provided for custom tag.
        if (_.includes(customTag, '{{') && _.includes(customTag, '}}')) {
            //If user gives an invalid expression, return false
            try {
                if ($($el.html()).length) {
                    return true;
                }
            } catch (e) {
                return false;
            }
            return false;
        }
        $input = $(customTag);
        if ($input.attr('type') === 'checkbox') {
            return true;
        }
        return false;
    },
    /* Marks the first row as selected. */
    selectFirstRow: function (value) {
        var $row = this.gridElement.find('tBody tr:first'),
            id = $row.attr('data-row-id');
        // Select the first row if it exists, i.e. it is not the first row being added.
        if ($row.length && this.preparedData.length) {
            this.preparedData[id].selected = !value;
            $row.trigger('click');
        }
    },

    /* Selects a row. */
    selectRow: function (row, value) {
        var rowIndex = angular.isNumber(row) ? row : this.Utils.getObjectIndex(this.options.data, row),
            selector,
            $row;
        if (rowIndex !== -1) {
            selector = 'tr[data-row-id=' + rowIndex + ']';
            $row = this.gridBody.find(selector);
            if ($row.length) {
                this.preparedData[rowIndex].selected = !value;
            }
            $row.trigger('click');
        }
    },
    /**
     * deselect a row
     */
    deselectRow: function (row) {
        this.selectRow(row, false);
    },

    /* Toggles the table row selection. */
    toggleRowSelection: function ($row, selected) {
        if (!$row.length) {
            return;
        }

        var rowId = $row.attr('data-row-id'),
            $checkbox,
            $radio;
        if (!this.preparedData[rowId]) {
            return;
        }
        this.preparedData[rowId].selected = selected;
        if (selected) {
            $row.addClass('active');
        } else {
            $row.removeClass('active');
        }
        if (this.options.showRadioColumn) {
            $radio = $row.find('td input:radio:not(:disabled)');
            $radio.prop('checked', selected);
            this.preparedData[rowId].checked = selected;
        }
        if (this.options.multiselect) {
            $checkbox = $row.find('td input:checkbox:not(:disabled)');
            $checkbox.prop('checked', selected);
            this.preparedData[rowId].checked = selected;
            this.updateSelectAllCheckboxState();
        } else {
            this._deselectPreviousSelection($row);
        }
    },

    /* Checks the header checkbox if all table checkboxes are checked, else unchecks it. */
    updateSelectAllCheckboxState: function () {
        if (!this.options.showHeader) {
            return;
        }
        //As rows visibility is checked, remove loading icon
        this.__setStatus();
        var $headerCheckbox = this.gridHeader.find('th.app-datagrid-header-cell input:checkbox'),
            $tbody = this.gridElement.find('tbody'),
            checkedItemsLength = $tbody.find('tr:visible input[name="gridMultiSelect"]:checkbox:checked').length,
            visibleRowsLength = $tbody.find('tr:visible').length;

        if (!visibleRowsLength) {
            $headerCheckbox.prop('checked', false);
            return;
        }
        if (checkedItemsLength === visibleRowsLength) {
            $headerCheckbox.prop('checked', true);
        } else {
            $headerCheckbox.prop('checked', false);
        }
    },

    /* Handles row selection. */
    rowSelectionHandler: function (e, $row, options) {
        options = options || {};
        e.stopPropagation();
        var rowId,
            rowData,
            data,
            selected,
            action = options.action;
        if (action || (this.options.editmode === this.CONSTANTS.QUICK_EDIT && $(e.target).hasClass('app-datagrid-cell'))) {
            //In case of advanced edit, Edit the row on click of a row
            options.action = options.action || 'edit';
            this.toggleEditRow(e, options);
            if (options.skipSelect) {
                return;
            }
        }
        $row = $row || $(e.target).closest('tr');
        rowId = $row.attr('data-row-id');
        rowData = this.preparedData[rowId];
        data = this.options.data[rowId];

        if (!options.skipSingleCheck && (($row.hasClass('active') && !this.options.multiselect) || !rowData)) {
            return;
        }
        selected = rowData.selected || false;
        selected = !selected;
        this.toggleRowSelection($row, selected);
        if (selected && $.isFunction(this.options.onRowSelect)) {
            this.options.onRowSelect(data, e);
        }
        if (!selected && $.isFunction(this.options.onRowDeselect)) {
            this.options.onRowDeselect(data, e);
        }
    },
    /*Handles the double click of the grid row*/
    rowDblClickHandler: function (e, $row) {
        e.stopPropagation();
        $row = $row || $(e.target).closest('tr');
        var rowData, rowId = $row.attr('data-row-id');
        rowData = this.preparedData[rowId];
        if (!rowData) {
            return;
        }
        if ($.isFunction(this.options.onRowDblClick)) {
            this.options.onRowDblClick(rowData, e);
        }
    },
    headerClickHandler: function (e) {
        var $th = $(e.target).closest('th.app-datagrid-header-cell'),
            id = $th.attr('data-col-id');
        this.options.onHeaderClick(this.preparedHeaderData[id], e);
    },
    /* Handles column selection. */
    columnSelectionHandler: function (e) {
        e.stopImmediatePropagation();
        var $th = $(e.target).closest('th.app-datagrid-header-cell'),
            id = $th.attr('data-col-id'),
            colDef = this.preparedHeaderData[id],
            field = colDef.field,
            selector = 'td[data-col-id="' + id + '"]',
            $column = this.gridElement.find(selector),
            selected = $column.data('selected') || false,
            colInfo = {
                colDef: colDef,
                data: this.options.data.map(function (data) { return data[field]; }),
                sortDirection: this._getColumnSortDirection(colDef.field)
            };
        selected = !selected;
        colDef.selected = selected;
        $column.data('selected', selected);

        if (selected) {
            $column.addClass('info');
            $th.addClass('info');
            if ($.isFunction(this.options.onColumnSelect)) {
                this.options.onColumnSelect(colInfo, e);
            }
        } else {
            $column.removeClass('info');
            $th.removeClass('info');
            if ($.isFunction(this.options.onColumnDeselect)) {
                /*TODO: Confirm what to send to the callback (coldef?).*/
                this.options.onColumnDeselect(colInfo, e);
            }
        }
    },
    _getValue: function ($el) {
        var type = $el.attr('type'),
            text;
        if (type === 'checkbox') {
            text = $el.prop('checked').toString();
        } else {
            text = $el.val();
            $el.text(WM.isDefined(text) ? text : '');
        }
        return text;
    },
    getTextValue: function ($el, colDef, fields) {
        var text,
            $ie       = $el.find('input'),
            dataValue,
            $elScope;
        text = this._getValue($ie, fields);
        if (colDef.editWidgetType && colDef.editWidgetType !== 'upload' && colDef.editWidgetType !== 'text') {
            $elScope = $el.children().isolateScope();
            if ($elScope) {
                dataValue = $elScope.datavalue;
                text = dataValue === '' ? undefined : dataValue; //Empty value is set from the grid cell. So, set it back to undefined.
            }
        }
        if (colDef.type === 'timestamp' && (!colDef.editWidgetType || colDef.editWidgetType === 'text')) {
            text = parseInt(text, 10);
        }
        return text;
    },
    isDataModified: function ($editableElements, rowData) {
        var isDataChanged = false,
            self          = this;
        function getEpoch(val) {
            return val ? moment(val).valueOf() : val;
        }
        $editableElements.each(function () {
            var $el          = $(this),
                colId        = $el.attr('data-col-id'),
                colDef       = self.preparedHeaderData[colId],
                fields       = _.split(colDef.field, '.'),
                text         = self.getTextValue($el, colDef, fields),
                originalData = _.get(rowData, colDef.field);
            if (colDef.editWidgetType === 'upload') {
                //For upload widget, check if any file is uploaded
                isDataChanged = document.forms[$el.attr('form-name')][colDef.field].files.length > 0;
            } else {
                //If new value and old value are not defined, then data is not changed
                if (!text && (originalData === null || originalData === undefined)) {
                    isDataChanged = false;
                } else {
                    //For datetime, compare the values in epoch format
                    if (colDef.editWidgetType === 'datetime') {
                        isDataChanged =  !(getEpoch(originalData) === getEpoch(text));
                    } else {
                        isDataChanged =  !(originalData == text);
                    }
                }
            }
            if (isDataChanged) {
                return !isDataChanged;
            }
        });
        return isDataChanged;
    },
    disableActions: function (val) {
        //Disable edit and delete actions while editing a row
        this.gridBody.find('.edit-row-button').prop('disabled', val);
        this.gridBody.find('.delete-row-button').prop('disabled', val);
    },
    //Function to the first input element in a row
    setFocusOnElement: function (e, $el) {
        var $firstEl,
            $target = $(e.target);
        if (!$el) {
            $el = $target.closest('tr').find('td.cell-editing');
        }
        $firstEl = $($el).first().find('input');
        if (!$firstEl.length) {
            $firstEl = $($el).first().find('textarea');
        }
        if (!$firstEl.length) {
            $firstEl = $($el).first().find('select');
        }
        if ($target.hasClass('app-datagrid-cell')) {
            $target.find('input').focus();
        } else {
            $firstEl.focus();
        }
    },
    removeNewRow: function ($row) {
        this.disableActions(false);
        this._setGridEditMode(false);
        $row.attr('data-removed', true);
        $row.remove();
        if (!this.preparedData.length) {
            this.setStatus('nodata', this.dataStatus.nodata);
        }
        this.addOrRemoveScroll();
    },
    //Method to save a row which is in editable state
    saveRow: function (callBack) {
        this.gridBody.find('tr.row-editing').each(function () {
            $(this).trigger('click', [undefined, {action: 'save', skipSelect: true, noMsg: true, success: callBack}]);
        });
    },
    /* Toggles the edit state of a row. */
    toggleEditRow: function (e, options) {
        e.stopPropagation();
        var $row = $(e.target).closest('tr'),
            $originalElements = $row.find('td'),
            $editButton = $row.find('.edit-row-button'),
            $cancelButton = $row.find('.cancel-edit-row-button'),
            $saveButton = $row.find('.save-edit-row-button'),
            $deleteButton = $row.find('.delete-row-button'),
            rowData = this.options.data[$row.attr('data-row-id')] || {},
            self = this,
            rowId = parseInt($row.attr('data-row-id'), 10),
            isNewRow,
            $editableElements,
            isDataChanged = false,
            formData,
            isFormDataSupported,
            multipartData,
            isValid,
            $requiredEls,
            advancedEdit = self.options.editmode === self.CONSTANTS.QUICK_EDIT;
        if ($row.attr('data-removed') === 'true') {
            //Even after removing row, focus out is triggered and edit is called. In this case, return here
            return;
        }
        options = options || {};
        e.data  = e.data  || {};
        if (e.data.action === 'edit' || options.action === 'edit') {
            if (advancedEdit && self.gridBody.find('tr.row-editing').length) {
                //In case of advanced edit, save the previous row
                self.saveRow(function (skipFocus, error) {
                    self.editSuccessHandler(skipFocus, error, e, $row, true);
                });
                return;
            }
            $row.addClass('row-editing');
            if ($.isFunction(this.options.beforeRowUpdate)) {
                this.options.beforeRowUpdate(rowData, e);
            }

            if (self.options.editmode === self.CONSTANTS.FORM || self.options.editmode === self.CONSTANTS.DIALOG) {
                return;
            }
            this._setGridEditMode(true);
            this.disableActions(true);
            $deleteButton.prop('disabled', false);

            $originalElements.each(function () {
                var $el = $(this),
                    cellText = $el.text(),
                    id = $el.attr('data-col-id'),
                    colDef = self.preparedHeaderData[id],
                    editableTemplate,
                    value,
                //Set the values to the generated input elements
                    setInputValue = function (value) {
                        var childIs;
                        if (options.operation !== 'new') {
                            //For widgets, set the datavalue. Upload uses html file upload. So, no need to set value
                            if (colDef.editWidgetType) {
                                if (colDef.editWidgetType === 'upload') {
                                    return;
                                }
                                childIs = $el.children().isolateScope();
                                //For checkbox, set value from row data as cellText may contain string values of true or false
                                if (colDef.editWidgetType === 'checkbox') {
                                    childIs.datavalue = _.get(rowData, colDef.field);
                                } else {
                                    childIs.datavalue = value;
                                }
                            }
                            $el.find('input').val(value);
                        }
                    };
                if (!colDef.readonly) {
                    if (options.operation === 'new') {
                        value = colDef.defaultvalue;
                    } else {
                        value = cellText;
                    }
                    editableTemplate = self._getEditableTemplate($el, colDef, value, rowId);
                    // TODO: Use some other selector. Input will fail for other types.
                    if (!(colDef.customExpression || colDef.formatpattern)) {
                        $el.addClass('cell-editing').html(editableTemplate).data('originalText', value);
                        setInputValue(cellText);
                    } else {
                        if (self._isCustomExpressionNonEditable(colDef.customExpression, $el)) {
                            $el.addClass('cell-editing editable-expression').data('originalValue', {'template': colDef.customExpression, 'rowData': _.cloneDeep(rowData), 'colDef': colDef});
                        }
                        $el.addClass('cell-editing editable-expression').html(editableTemplate).data('originalText', cellText);
                        // Put the original value while editing, not the formatted value.
                        setInputValue(_.get(rowData, colDef.field));
                    }
                }
                if (colDef.required) {
                    $el.addClass('required-field form-group');
                }
            });

            // Show editable row.
            $editButton.addClass('hidden');
            $cancelButton.removeClass('hidden');
            $saveButton.removeClass('hidden');
            $editableElements = $row.find('td.cell-editing');
            $editableElements.on('click', function (e) {
                e.stopPropagation();
            });
            if (!options.skipFocus && $editableElements) {
                self.setFocusOnElement(e, $editableElements);
            }
        } else {
            $editableElements = $row.find('td.cell-editing');
            isNewRow = rowId >= this.preparedData.length;
            if (e.data.action === 'save' || options.action === 'save') {
                $requiredEls = $editableElements.find('.ng-invalid-required');
                //If required fields are present and value is not filled, return here
                if ($requiredEls.length > 0) {
                    $requiredEls.addClass('ng-touched');
                    if ($.isFunction(options.success)) {
                        options.success(false, true);
                    }
                    return;
                }
                isFormDataSupported = (window.File && window.FileReader && window.FileList && window.Blob);
                multipartData = false;
                if (isFormDataSupported) {
                    /* Angular does not bind file values so using native object to send files */
                    formData = new FormData();
                }
                if (isNewRow) {
                    isDataChanged = true;
                } else {
                    isDataChanged = this.isDataModified($editableElements, rowData);
                }
                if (isDataChanged) {
                    $editableElements.each(function () {
                        var $el    = $(this),
                            colId  = $el.attr('data-col-id'),
                            colDef = self.preparedHeaderData[colId],
                            fields = _.split(colDef.field, '.'),
                            text;
                        text = self.getTextValue($el, colDef, fields);
                        if (fields.length === 1 && colDef.editWidgetType === 'upload') {
                            if (isFormDataSupported) {
                                multipartData = true;
                                formData.append(colDef.field, document.forms[$el.attr('form-name')][colDef.field].files[0]);
                                _.set(rowData, colDef.field, _.get(rowData, colDef.field) === null ? null : '');
                            }
                        } else {
                            text = ((fields.length === 1 || isNewRow) && text === '') ? undefined : text; //Set empty values as undefined
                            if (WM.isDefined(text)) {
                                text = text === 'null' ? null : text; //For select, null is returned as string null. Set this back to ull
                                if (text === null) {
                                    if (fields.length > 1) {
                                        _.set(rowData, fields[0], text); //For related fields, set the object to null
                                    } else {
                                        _.set(rowData, colDef.field, ''); //Set to empty for normal fields
                                    }
                                } else {
                                    _.set(rowData, colDef.field, text);
                                }
                            } else {
                                //Set undefined while editing the rows
                                if (fields.length === 1 && !isNewRow) {
                                    _.set(rowData, colDef.field, text);
                                }
                            }
                        }
                    });
                    if (multipartData) {
                        formData.append('wm_data_json', new Blob([JSON.stringify(rowData)], {
                            type: 'application/json'
                        }));
                        rowData = formData;
                    }
                    if (isNewRow) {
                        if (advancedEdit && !multipartData && _.isEmpty(rowData)) {
                            self.removeNewRow($row);
                            if ($.isFunction(options.success)) {
                                options.success(false, undefined, true);
                            }
                            return;
                        }
                        if ($.isFunction(this.options.onBeforeRowInsert)) {
                            isValid = this.options.onBeforeRowInsert(rowData, e);
                            if (isValid === false) {
                                return;
                            }
                        }
                        this.options.onRowInsert(rowData, e, multipartData, options.success);
                    } else {
                        if ($.isFunction(this.options.onBeforeRowUpdate)) {
                            isValid = this.options.onBeforeRowUpdate(rowData, e);
                            if (isValid === false) {
                                return;
                            }
                        }
                        this.options.afterRowUpdate(rowData, e, multipartData, options.success);
                    }
                } else {
                    this.cancelEdit($row);
                    $editButton.removeClass('hidden');
                    $cancelButton.addClass('hidden');
                    $saveButton.addClass('hidden');
                    if (!options.noMsg) {
                        this.options.noChangesDetected();
                    }
                    if ($.isFunction(options.success)) {
                        options.success(false);
                    }
                }
            } else {
                if (isNewRow) {
                    self.removeNewRow($row);
                    return;
                }
                // Cancel edit.
                this.cancelEdit($row);
                $editButton.removeClass('hidden');
                $cancelButton.addClass('hidden');
                $saveButton.addClass('hidden');
            }
        }
        this.addOrRemoveScroll();
    },
    cancelEdit: function ($row) {
        var self = this,
            $editableElements = $row.find('td.cell-editing');
        this.disableActions(false);
        this._setGridEditMode(false);
        $row.removeClass('row-editing');
        $editableElements.off('click');
        $editableElements.each(function () {
            var $el   = $(this),
                value = $el.data('originalValue'),
                originalValue,
                template;
            $el.removeClass('datetime-wrapper cell-editing required-field form-group');
            if (!value) {
                $el.text($el.data('originalText') || '');
            } else {
                originalValue = value;
                if (originalValue.template) {
                    template = self.options.getCompiledTemplate(originalValue.template, originalValue.rowData, originalValue.colDef);
                    $el.html(template);
                } else {
                    $el.html(originalValue || '');
                }
            }
        });
    },
    hideRowEditMode: function ($row) {
        var $editableElements = $row.find('td.cell-editing'),
            $editButton       = $row.find('.edit-row-button'),
            $cancelButton     = $row.find('.cancel-edit-row-button'),
            $saveButton       = $row.find('.save-edit-row-button'),
            self              = this;
        $row.removeClass('row-editing');
        $editableElements.off('click');
        this.disableActions(false);
        this._setGridEditMode(false);
        $editableElements.each(function () {
            var $el   = $(this),
                value = $el.data('originalValue'),
                originalValue,
                template,
                text,
                colDef;
            $el.removeClass('datetime-wrapper cell-editing required-field form-group');
            if (!value) {
                colDef = self.preparedHeaderData[$el.attr('data-col-id')];
                text   = self.getTextValue($el, colDef, colDef.field.split('.'));
                $el.text(WM.isDefined(text) ? text : '');
            } else {
                originalValue = value;
                if (originalValue.template) {
                    template = self.options.getCompiledTemplate(originalValue.template, originalValue.rowData, originalValue.colDef, true);
                    $el.html(template);
                } else {
                    $el.html(originalValue || '');
                }
            }
        });
        $editButton.removeClass('hidden');
        $cancelButton.addClass('hidden');
        $saveButton.addClass('hidden');
        this.addOrRemoveScroll();
    },
    /* Deletes a row. */
    deleteRow: function (e) {
        e.stopPropagation();
        var $row = $(e.target).closest('tr'),
            rowId = $row.attr('data-row-id'),
            rowData = this.options.data[rowId],
            isNewRow = rowId >= this.preparedData.length,
            className,
            isActiveRow,
            self = this;
        if ($.isFunction(this.options.beforeRowDelete)) {
            this.options.beforeRowDelete(rowData, e);
        }
        if (isNewRow) {
            this.disableActions(false);
            this._setGridEditMode(false);
            $row.attr('data-removed', true);
            $row.remove();
            if (!this.preparedData.length) {
                //On delete of a new row with no data, show no data message
                this.setStatus('nodata', this.dataStatus.nodata);
            }
            this.addOrRemoveScroll();
            return;
        }
        if ($.isFunction(this.options.onRowDelete)) {
            className = this.options.cssClassNames.deleteRow;
            isActiveRow = $row.attr('class').indexOf('active') !== -1;
            if (isActiveRow) {
                $row.removeClass('active');
            }
            $row.addClass(className);
            this.options.onRowDelete(rowData, function () {
                if (isActiveRow) {
                    $row.addClass('active');
                }
                $row.removeClass(className);
                self.addOrRemoveScroll();
            }, e, function (skipFocus, error) {
                //For quick edit, on clicking of delete button or DELETE key, edit the next row
                if (self.options.editmode !== self.CONSTANTS.QUICK_EDIT || !($(e.target).hasClass('delete-row-button') || self.Utils.isDeleteKey(e))) {
                    return;
                }
                //Call set status, so that the rows are visible for fom operations
                self.__setStatus();
                var rowID,
                    $nextRow;
                if (error) {
                    return;
                }
                //On success, Focus the next row. If row is not present, focus the previous row
                rowID = +$(e.target).closest('tr').attr('data-row-id');
                $nextRow = self.gridBody.find('tr[data-row-id="' + rowID  + '"]');
                if (!$nextRow.length) {
                    $nextRow = self.gridBody.find('tr[data-row-id="' + (rowID - 1)  + '"]');
                }
                $nextRow.trigger('click', [undefined, {action: 'edit', skipFocus: skipFocus}]);
            });
        }
    },

    /* Deletes a row and updates the header checkbox if multiselect is true. */
    deleteRowAndUpdateSelectAll: function (e) {
        this.deleteRow(e);
        this.updateSelectAllCheckboxState();
    },

    /* Keeps a track of the currently selected row, and deselects the previous row, if multiselect is false. */
    _deselectPreviousSelection: function ($row) {
        var selectedRows = this.gridBody.find('tr.active'),
            rowId = $row.attr('data-row-id'),
            self = this;
        selectedRows.each(function () {
            var id = $(this).attr('data-row-id'),
                preparedData = self.preparedData[id];
            if (id !== rowId && preparedData) {
                $(this).find('input:radio').prop('checked', false);
                preparedData.selected = preparedData.checked = false;
                $(this).removeClass('active');
            }
        });
    },
    //Method to remove sort icons from the column header cells
    resetSortIcons: function ($el) {
        var $sortContainer;
        //If sort icon is not passed, find out the sort icon from the active class
        if (!$el && this.gridHeader) {
            $sortContainer = this.gridHeader.find('.sort-buttons-container.active');
            $el            = $sortContainer.find('i.sort-icon');
            $sortContainer.removeClass('active');
        }
        $el.removeClass('desc asc').removeClass(this.options.cssClassNames.descIcon).removeClass(this.options.cssClassNames.ascIcon);
    },
    /* Handles table sorting. */
    sortHandler: function (e) {
        e.stopImmediatePropagation();
        var $e                  = $(e.target),
            $th                 = $e.closest('th.app-datagrid-header-cell'),
            id                  = $th.attr('data-col-id'),
            $sortContainer      = $th.find('.sort-buttons-container'),
            $sortIcon           = $sortContainer.find('i.sort-icon'),
            direction           = $sortIcon.hasClass('asc') ? 'desc' : $sortIcon.hasClass('desc') ? '' : 'asc',
            sortInfo            = this.options.sortInfo,
            $previousSortMarker = this.gridHeader.find('.sort-buttons-container.active'),
            field               = $th.attr('data-col-field'),
            $previousSortedColumn,
            $previousSortIcon,
            colId,
            colDef;
        this.resetSortIcons($sortIcon);
        $sortIcon.addClass(direction);
        //Add the classes based on the direction
        if (direction === 'asc') {
            $sortIcon.addClass(this.options.cssClassNames.ascIcon);
            $sortContainer.addClass('active');
        } else if (direction === 'desc') {
            $sortIcon.addClass(this.options.cssClassNames.descIcon);
            $sortContainer.addClass('active');
        }
        if ($previousSortMarker.length) {
            //Reset the previous sorted column icons and info
            $previousSortedColumn = $previousSortMarker.closest('th.app-datagrid-header-cell');
            colId                 = $previousSortedColumn.attr('data-col-id');
            colDef                = this.preparedHeaderData[colId];
            $previousSortIcon     = $previousSortMarker.find('i.sort-icon');
            if (colDef.field !== field) {
                $previousSortMarker.removeClass('active');
                this.resetSortIcons($previousSortIcon);
            }
            colDef.sortInfo = {'sorted': false, 'direction': ''};
        }
        sortInfo.direction = direction;
        sortInfo.field     = field;
        if (direction !== '') {
            this.preparedHeaderData[id].sortInfo = {'sorted': true, 'direction': direction};
        }
        this.options.sortHandler.call(this, this.options.sortInfo, e, 'sort');
    },
    //Method to handle up and next key presses
    processUpDownKeys: function (event, $row, direction) {
        var self = this;
        if ($row.hasClass('row-editing') && self.options.editmode === self.CONSTANTS.QUICK_EDIT) {
            self.toggleEditRow(event, {
                'action'  : 'save',
                'noMsg'   : true,
                'success' : function (skipFocus, error) {
                    self.editSuccessHandler(skipFocus, error, event, $row, true, direction);
                }
            });
        } else {
            $row = direction === 'down' ? $row.next() : $row.prev();
            $row.focus();
        }
    },
    // Handles keydown event on row items.
    onKeyDown: function (event) {
        var $target   = $(event.target),
            $row      = $target.closest('tr'),
            quickEdit = this.options.editmode === this.CONSTANTS.QUICK_EDIT,
            rowId,
            isNewRow;
        if (this.Utils.isDeleteKey(event)) { //Delete Key
            //For input elements, dont delete the row
            if ($target.is('input') || $target.hasClass('form-control')) {
                return;
            }
            this.deleteRow(event);
            return;
        }
        if (event.which === 27) { //Escape key
            rowId = parseInt($row.attr('data-row-id'), 10);
            isNewRow = rowId >= this.preparedData.length;
            //On Escape, cancel the row edit
            $row.trigger('click', [undefined, {action: 'cancel'}]);
            if (!isNewRow) {
                $row.focus();
            }
            return;
        }
        if (event.which === 13) { //Enter key
            if (quickEdit && $target.hasClass('app-datagrid-row')) {
                $row.trigger('click', [undefined, {action: 'edit'}]);
            } else {
                $row.trigger('click');
            }
            return;
        }
        if (event.which === 38) { // up-arrow action
            this.processUpDownKeys(event, $row, 'up');
            return;
        }
        if (event.which === 40) { // down-arrow action
            this.processUpDownKeys(event, $row, 'down');
        }
    },
    editSuccessHandler: function (skipFocus, error, e, $row, isSameRow, direction) {
        var self = this,
            rowID,
            $nextRow;
        //Call set status, so that the rows are visible for fom operations
        self.__setStatus();
        //On error, focus the current row first element
        if (error) {
            self.setFocusOnElement(e);
            return;
        }
        //On success, make next row editable. If next row is not present, add new row
        rowID = +$row.attr('data-row-id');
        if (direction) {
            rowID    = direction === 'down' ? ++rowID : --rowID;
            $nextRow = self.gridBody.find('tr[data-row-id="' + rowID + '"]');
            if ($nextRow.length) {
                $nextRow.focus();
            } else {
                $row.focus();
            }
            return;
        }
        if (!isSameRow) {
            rowID++;
        }
        $nextRow = self.gridBody.find('tr[data-row-id="' + rowID + '"]');
        if ($nextRow.length) {
            $nextRow.trigger('click', [undefined, {action: 'edit', skipFocus: skipFocus, skipSelect: self.options.multiselect}]);
        } else {
            self.addNewRow(skipFocus);
        }
    },
    /* Attaches all event handlers for the table. */
    attachEventHandlers: function ($htm) {
        var rowOperationsCol = this._getRowActionsColumnDef(),
            $header          = this.gridHeader,
            self             = this,
            deleteRowHandler;

        if (this.options.enableRowSelection) {
            $htm.on('click', this.rowSelectionHandler.bind(this));
            $htm.on('dblclick', this.rowDblClickHandler.bind(this));
            $htm.on('keydown', this.onKeyDown.bind(this));
        }

        if ($header) {
            if (this.options.enableColumnSelection) {
                $header.find('th[data-col-selectable]').on('click', this.columnSelectionHandler.bind(this));
            } else {
                $header.find('th[data-col-selectable]').off('click');
            }

            if (this.options.enableSort) {
                if (this.options.enableColumnSelection) {
                    $header.find('th[data-col-sortable] .header-data').on('click', this.sortHandler.bind(this));
                } else {
                    $header.find('th[data-col-sortable]').on('click', this.sortHandler.bind(this));
                }
            } else {
                if (this.options.enableColumnSelection) {
                    $header.find('th[data-col-sortable] .header-data').off('click');
                } else {
                    $header.find('th[data-col-sortable]').off('click');
                }
            }
        }
        if (this.options.rowActions.length) {
            $htm.find('.row-action').on('click', {action: 'edit'}, this._handleCustomEvents.bind(this));
            $htm.find('.cancel-edit-row-button').on('click', {action: 'cancel'}, this.toggleEditRow.bind(this));
            $htm.find('.save-edit-row-button').on('click', {action: 'save'}, this.toggleEditRow.bind(this));
        } else {
            if ((this.options.editmode === this.CONSTANTS.INLINE || this.options.editmode === this.CONSTANTS.QUICK_EDIT) || (rowOperationsCol && _.includes(rowOperationsCol.operations, 'update'))) {
                $htm.find('.edit-row-button').on('click', {action: 'edit'}, this.toggleEditRow.bind(this));
                $htm.find('.cancel-edit-row-button').on('click', {action: 'cancel'}, this.toggleEditRow.bind(this));
                $htm.find('.save-edit-row-button').on('click', {action: 'save'}, this.toggleEditRow.bind(this));
            }

            if (rowOperationsCol && _.includes(rowOperationsCol.operations, 'delete')) {
                deleteRowHandler = this.deleteRowAndUpdateSelectAll;
                if (!this.options.multiselect) {
                    deleteRowHandler = this.deleteRow;
                }
                $htm.find('td .delete-row-button').on('click', deleteRowHandler.bind(this));
            }
        }
        if (self.options.editmode === self.CONSTANTS.QUICK_EDIT) {
            //On tab out of a row, save the current row and make next row editable
            $htm.on('focusout', 'tr', function (e) {
                var $target        = $(e.target),
                    $row           = $target.closest('tr'),
                    $relatedTarget = $(e.relatedTarget);
                //Save the row on last column of the data table. If class has danger, confirm dialog is opened, so dont save the row.
                if (!$target.closest('td').is(':last-child') || $row.hasClass('danger')) {
                    return;
                }
                //If focusout is because of input element or row action or current row, dont save the row
                if ($relatedTarget.attr('focus-target') === '' || $relatedTarget.hasClass('active') || $relatedTarget.hasClass('row-action-button')) {
                    return;
                }
                self.toggleEditRow(e, {
                    'action'  : 'save',
                    'noMsg'   : true,
                    'success' : function (skipFocus, error, isNewRow) {
                        if (!isNewRow) {
                            self.editSuccessHandler(skipFocus, error, e, $row);
                        }
                    }
                });
            });
        }
    },

    /* Replaces all the templates needing angular compilation with the actual compiled templates. */
    _findAndReplaceCompiledTemplates: function () {
        if (!this.gridBody) {
            return;
        }
        var $compiledCells = this.gridBody.find('td[data-compiled-template]'),
            self = this;

        $compiledCells.each(function () {
            var $cell = $(this),
                id = $cell.attr('data-compiled-template');

            $cell.replaceWith(self.compiledCellTemplates[id]);
        });
    },

    /* Renders the search box. */
    _renderSearch: function () {
        var $htm = $(this._getSearchTemplate()),
            self = this,
            $searchBox;

        function search(e) {
            e.stopPropagation();
            var searchText = $htm.find('[data-element="dgSearchText"]')[0].value,
                $filterField = $htm.find('[data-element="dgFilterValue"]'),
                field = $filterField[0].value,
                colDefIndex = $htm.find('option:selected').attr('data-coldef-index'),
                colDef = self.options.colDefs[colDefIndex],
                type = colDef && colDef.type ? colDef.type : '';

            self.searchObj = {
                'field': field,
                'value': searchText,
                'type': type,
                'event': e
            };
            self.options.searchHandler.call(self, self.searchObj, e, 'search');
        }

        this.element.find('.form-search').remove();
        $htm.insertBefore(this.gridContainer);
        this.gridSearch = this.element.find('.form-search');

        $searchBox = this.gridSearch.find('[data-element="dgSearchText"]');
        this.gridSearch.find('.app-search-button').on('click', search);
        this.gridSearch.find('[data-element="dgFilterValue"]').on('change', function (e) {
            // If "No data found" message is shown, and user changes the selection, then fetch all data.
            if (self.dataStatusContainer.find('.status').text() === self.options.dataStates.nodata) {
                search(e);
            }
        });
        $searchBox.on('keyup', function (e) {
            e.stopPropagation();
            // If the search text is empty then show all the rows.
            if (!$(this).val()) {
                if (self.searchObj.value) {
                    self.searchObj.value = '';
                    search(e);
                }
            }
            /* Search only when enter key is pressed. */
            if (e.which === 13) {
                search(e);
            }
        });
    },
    //Get the respective widget template
    _getFilterWidgetTemplate: function (field) {
        var widget      = field.filterwidget || 'text',
            placeholder = field.filterplaceholder || '',
            fieldName   = field.field,
            template;
        widget = widget === 'number' ? 'text' : widget;
        widget = widget === 'autocomplete' ? 'search' : widget;
        template =  '<wm-' + widget + ' placeholder="' + placeholder + '" scopedatavalue="rowFilter[\'' + fieldName + '\'].value" on-change="onRowFilterChange()" disabled="{{emptyMatchModes.indexOf(rowFilter[\'' + fieldName + '\'].matchMode) > -1}}"';
        switch (field.filterwidget) {
        case 'number':
            template += ' type="number" ';
            break;
        case 'select':
            if (field.isLiveVariable) {
                template += ' scopedataset="fullFieldDefs[' + field.index + '].filterdataset"';
            } else {
                template += ' dataset="' + this.options.getBindDataSet() + '" datafield="' + fieldName + '" displayfield="' + fieldName + '"';
            }
            template += ' orderby="' + fieldName + ':asc"';
            break;
        case 'autocomplete':
            template += ' type="autocomplete" dataset="' + this.options.getBindDataSet() + '" datafield="' + fieldName + '" searchkey="' + fieldName + '" displaylabel="' + fieldName + '" on-submit="onRowFilterChange()" orderby="' + fieldName + ':asc"';
            break;
        }
        template += '></wm-' + widget + '>';
        return template;
    },
    //Generate the row level filter
    _renderRowFilter: function () {
        var htm  = '<tr class="filter-row">',
            self = this;
        this.gridHeaderElement.find('.filter-row').remove();
        this.preparedHeaderData.forEach(function (field) {
            var fieldName = field.field;
            if (!field.searchable) {
                htm += '<th></th>';
                return;
            }
            htm += '<th>' +
                        '<span class="input-group">' +
                            self._getFilterWidgetTemplate(field) +
                            '<span class="input-group-addon" uib-dropdown dropdown-append-to-body>' +
                                '<button class="btn-transparent btn app-button" type="button"  uib-dropdown-toggle><i class="app-icon wi wi-filter-list"></i></button>' +
                                '<ul class="dropdown-menu pull-right" uib-dropdown-menu> <li ng-repeat="matchMode in matchModeTypesMap[\'' + field.type + '\' || \'string\']" ng-class="{active: matchMode === (rowFilter[\'' + fieldName + '\'].matchMode || matchModeTypesMap[\'' + field.type + '\' || \'string\'][0])}"><a href="javascript:void(0);" ng-click="onFilterConditionSelect(\'' + fieldName + '\', matchMode)">{{matchModesMap[matchMode]}}</a></li> </ul>' +
                            '</span>' +
                            '<span class="input-group-addon" ng-if="showClearIcon(\'' + fieldName + '\')"><button class="btn-transparent btn app-button" type="button" ng-click="clearRowFilter(\'' + fieldName + '\')"><i class="app-icon wi wi-clear"></i></button></span>' +
                        '</span>' +
                    '</th>';
        }, this);
        htm += '</tr>';
        if (this.options.showHeader) {
            this.gridHeader.append(this.options.compileTemplateInGridScope(htm));
        } else {
            this.gridHeaderElement.append('<thead></thead>').append(this.options.compileTemplateInGridScope(htm));
        }
        this.gridSearch = this.gridHeaderElement.find('.filter-row');
    },
    /* Renders the table header. */
    _renderHeader: function () {
        var headerTemplate = this._getHeaderTemplate(),
            $colgroup      = $(headerTemplate.colgroup),
            self           = this,
            $header;
        if (!this.options.showHeader) {
            this.gridElement.prepend($colgroup);
            return;
        }
        $header   = $(headerTemplate.header);
        function toggleSelectAll(e) {
            var $checkboxes = $('tbody tr:visible td input[name="gridMultiSelect"]:checkbox', self.gridElement),
                checked = this.checked;
            $checkboxes.prop('checked', checked);
            $checkboxes.each(function () {
                var $row    = $(this).closest('tr'),
                    rowId   = $row.attr('data-row-id'),
                    rowData = self.options.data[rowId];
                self.toggleRowSelection($row, checked);
                if (checked && $.isFunction(self.options.onRowSelect)) {
                    self.options.onRowSelect(rowData, e);
                }
                if (!checked && $.isFunction(self.options.onRowDeselect)) {
                    self.options.onRowDeselect(rowData, e);
                }
            });
        }
        /*For mobile view, append header to the main table only*/
        if (this.options.isMobile) {
            this.gridElement.append($colgroup).append($header);
            this.gridHeader = this.gridElement.find('thead');
        } else {
            /**Append the colgroup to the header and the body.
             * Colgroup is used to maintain the consistent widths between the header table and body table**/
            this.gridHeaderElement.append($colgroup).append($header);
            /**As jquery references the colgroup, clone the colgroup and add it to the table body**/
            this.gridElement.prepend($colgroup.clone());
            this.gridHeader = this.gridHeaderElement.find('thead');
        }
        /**Add event handler, to the select all checkbox on the header**/
        $header.on('click', '.app-datagrid-header-cell input:checkbox', toggleSelectAll);

        if ($.isFunction(this.options.onHeaderClick)) {
            this.gridHeader.find('th.app-datagrid-header-cell').on('click', this.headerClickHandler.bind(this));
        }

        if (!this.options.isMobile && this.gridHeaderElement.length) {
            this.gridHeaderElement.find('th[data-col-resizable]').resizable({
                handles: 'e',
                minWidth: 50,
                // set COL width
                /* This is needed because if width is initially set on col from coldefs,
                 * then that column was not getting resized.*/
                resize: function (evt, ui) {
                    var $colElement,
                        $colHeaderElement,
                        $cellElements,
                        colIndex      = +ui.helper.attr('data-col-id') + 1,
                        originalWidth = ui.helper.width(),
                        newWidth      = ui.size.width,
                        originalTableWidth,
                        newTableWidth;
                    $colHeaderElement = self.gridHeaderElement.find('colgroup > col:nth-child(' + colIndex + ')');
                    $colElement = self.gridElement.find('colgroup > col:nth-child(' + colIndex + ')');
                    $cellElements = self.gridElement.find('tr > td:nth-child(' + colIndex + ') > div');
                    $colElement.width(newWidth);
                    $colHeaderElement.width(newWidth);
                    $cellElements.width(newWidth);
                    // height must be set in order to prevent IE9 to set wrong height
                    $(this).css('height', 'auto');
                    /*Adjust the table width only if the column width is increased*/
                    if (newWidth > ui.originalSize.width) {
                        /*Increase or decrease table width on resizing the column*/
                        originalTableWidth = self.gridHeaderElement.width();
                        newTableWidth = originalTableWidth + newWidth - originalWidth;
                        self.gridHeaderElement.width(newTableWidth);
                        self.gridElement.width(newTableWidth);
                    }
                    self.addOrRemoveScroll();
                }
            });
            /*On scroll of the content table, scroll the header*/
            this.gridElement.parent().scroll(function () {
                self.gridHeaderElement.parent().prop("scrollLeft", this.scrollLeft);
            });
        }
    },
    addOrRemoveScroll: function () {
        var gridContent = this.gridContainer.find('.app-grid-content').get(0),
            gridHeader = this.gridContainer.find('.app-grid-header');
        /*If scroll bar is present on the grid content, add padding to the header*/
        if ((gridContent.scrollHeight > gridContent.clientHeight) && !this.Utils.isMac()) {
            gridHeader.addClass('scroll-visible');
        } else {
            gridHeader.removeClass('scroll-visible');
        }
    },

    //Triggers actual function in scope
    _handleCustomEvents: function (e, options) {
        this.options.handleCustomEvents(e, options);
    },

    //Generates markup for row operations
    _getRowActionsTemplate: function () {
        var saveCancelTemplateAdded = false,
            rowOperationsCol,
            actionsTemplate = '<span> ',
            saveCancelTemplate = '<button type="button" class="save row-action-button btn app-button btn-transparent save-edit-row-button hidden" title="Save"><i class="wi wi-done"></i></button> ' +
                                 '<button type="button" class="cancel row-action-button btn app-button btn-transparent cancel-edit-row-button hidden" title="Cancel"><i class="wi wi-cancel"></i></button> ';
        //Generate the expression for properties which have binding expression
        function generateBindExpr(val) {
            if (_.startsWith(val, 'bind:')) {
                return '{{' + _.replace(val, 'bind:', '') + '}}';
            }
            return val;
        }
        if (this.options.rowActions.length) {
            _.forEach(this.options.rowActions, function (def) {
                var clsAttr = 'row-action row-action-button app-button btn ' + def.class, ngShowAttr = '';
                if (def.show === 'true' || def.show === 'false') {
                    clsAttr += def.show === 'true' ? '' : ' ng-hide ';
                } else if (_.includes(def.show, 'bind:')) {
                    ngShowAttr = _.replace(def.show, 'bind:', '');
                }
                //Adding 'edit' class if at least one of the action is 'editRow()'
                if (_.includes(def.action, 'editRow()')) {
                    clsAttr += ' edit edit-row-button ';
                } else if (_.includes(def.action, 'deleteRow()')) {
                    clsAttr += ' delete delete-row-button ';
                }

                actionsTemplate += '<button type="button" data-action-key="' + def.key + '" class="' + clsAttr + '" title="' + generateBindExpr(def.title) + '" ' + (ngShowAttr ? ' ng-show="' + ngShowAttr + '"' : '') + (def.tabindex ? (' tabindex="' + def.tabindex + '"') : '') + '>'
                    + '<i class="app-icon ' + def.iconclass + '"></i>';
                if (def.displayName) {
                    actionsTemplate += '<span class="btn-caption">' + generateBindExpr(def.displayName) + '</span>';//Appending display name
                }
                actionsTemplate += '</button>';
                if (_.includes(def.action, 'editRow()')) {
                    actionsTemplate += !saveCancelTemplateAdded ? saveCancelTemplate : '';
                    saveCancelTemplateAdded = true;
                }
            });
        } else {
            //Appending old template for old projects depending on grid level attributes
            rowOperationsCol = this._getRowActionsColumnDef() || {};
            if (_.includes(rowOperationsCol.operations, 'update')) {
                actionsTemplate += '<button type="button" class="row-action-button btn app-button btn-transparent edit edit-row-button" title="Edit Row"><i class="wi wi-pencil"></i></button> ' +
                    saveCancelTemplate;
            }
            if (_.includes(rowOperationsCol.operations, 'delete')) {
                actionsTemplate += '<button type="button" class="row-action-button btn app-button btn-transparent delete delete-row-button" title="Delete Record"><i class="wi wi-trash"></i></button> ';
            }
        }
        actionsTemplate += '</span>';
        return actionsTemplate;
    },

    //Appends row operations markup to grid template
    _appendRowActions : function ($htm, isNewRow, rowData) {
        var self, template,
            rowOperationsCol = this._getRowActionsColumnDef();
        if (this.options.rowActions.length || rowOperationsCol) {
            self = this;
            template = self._getRowActionsTemplate();
            $htm.find("[data-identifier='actionButtons']").each(function (index) {
                if (isNewRow) {
                    $(this).empty().append(self.options.getCompiledTemplate(template, rowData, rowOperationsCol));
                } else {
                    $(this).empty().append(self.options.getCompiledTemplate(template, self.preparedData[index], rowOperationsCol));
                }
            });
        }
    },
    /* Renders the table body. */
    _renderGrid: function () {
        var $htm = $(this._getGridTemplate());
        this.gridElement.append($htm);
        // Set proper data status messages after the grid is rendered.
        if (!this.options.data.length && this.dataStatus.state === 'nodata') {
            this.setStatus('nodata');
        } else {
            this.dataStatus.state = this.dataStatus.state || 'loading';
            this.dataStatus.message = this.dataStatus.message || this.options.dataStates.loading;
            this.setStatus(this.dataStatus.state, this.dataStatus.message);
        }
        this.gridBody = this.gridElement.find('tbody');
        this._findAndReplaceCompiledTemplates();
        this._appendRowActions($htm);
        this.attachEventHandlers($htm);
        if ($.isFunction(this.options.onDataRender)) {
            this.options.onDataRender();
        }
        if (this.options.selectFirstRow) {
            if (this.options.multiselect) {
                //Set selectFirstRow to false, to prevent first item being selected in next page
                this.options.selectFirstRow = false;
            }
            this.selectFirstRow(true);
        }
    },

    /* Renders the table container. */
    _render: function () {
        if (!this.tableId) {
            this.tableId = this.Utils.generateGuid();
        }
        var statusContainer =
                '<div class="overlay" style="display: none;">' +
                    '<div class="status"><i class="fa fa-spinner fa-spin"></i><span class="message"></span></div>' +
                '</div>',
            table = '<div class="table-container table-responsive"><div class="app-grid-header ' +
                    '"><div class="app-grid-header-inner"><table class="' + this.options.cssClassNames.gridDefault + ' ' + this.options.cssClassNames.grid + '" id="table_header_' + this.tableId + '">' +
                    '</table></div></div><div class="app-grid-content" style="height:' + this.options.height + ';"><table class="' + this.options.cssClassNames.gridDefault + ' ' + this.options.cssClassNames.grid + '" id="table_' + this.tableId + '">' +
                    '</table></div>' +
                '</div>';
        this.gridContainer = $(table);
        this.gridElement = this.gridContainer.find('.app-grid-content table');
        this.gridHeaderElement = this.gridContainer.find('.app-grid-header table');
        // Remove the grid table element.
        this.element.find('.table-container').remove();
        this.element.append(this.gridContainer);
        this.dataStatusContainer = $(statusContainer);
        this.gridContainer.append(this.dataStatusContainer);
        this._renderHeader();
        if (this.options.filtermode === this.CONSTANTS.SEARCH) {
            this._renderSearch();
        } else if (this.options.filtermode === this.CONSTANTS.MULTI_COLUMN) {
            this._renderRowFilter();
        }
        if (this.options.spacing === 'condensed') {
            this._toggleSpacingClasses('condensed');
        }
        this._renderGrid();
    },
    __setStatus: function () {
        var loadingIndicator = this.dataStatusContainer.find('.fa'),
            state            = this.dataStatus.state;
        this.dataStatusContainer.find('.message').text(this.dataStatus.message);
        if (state === 'loading') {
            loadingIndicator.show();
        } else {
            loadingIndicator.hide();
        }
        if (state === 'ready') {
            this.dataStatusContainer.hide();
        } else {
            this.dataStatusContainer.show();
        }
        if (state === 'nodata' || state === 'loading' || state === 'error') {
            if (this.options.height === '100%' || this.options.height === 'auto') { //If height is auto or 100%, Set the loading overlay height as present grid content height
                if (state === 'nodata') {
                    this.dataStatusContainer.css('height', 'auto');
                    this.dataStatus.contentHeight = 0;
                } else {
                    this.dataStatus.height = this.dataStatus.height || this.dataStatusContainer.outerHeight();
                    this.dataStatus.contentHeight = this.gridElement.outerHeight() || this.dataStatus.contentHeight;
                    this.dataStatusContainer.css('height', this.dataStatus.height > this.dataStatus.contentHeight ? 'auto' : this.dataStatus.contentHeight);
                }
            }
            this.gridContainer.addClass('show-msg');
        } else {
            this.gridContainer.removeClass('show-msg');
        }
        this.addOrRemoveScroll();
    },
    //This method is used to show or hide data loading/ no data found overlay
    setStatus: function (state, message) {
        this.dataStatus.state   = state;
        this.dataStatus.message = message || this.options.dataStates[state];
        //First time call the status function, afterwards use debounce with 100 ms wait
        if (this._setStatusCalled) {
            this._setStatus();
        } else {
            this.__setStatus();
            this._setStatusCalled = true;
        }
    },

    setGridDimensions: function (key, value) {
        if (value.indexOf('px') === -1 && value.indexOf('%') === -1 && value.indexOf('em') === -1 && value != 'auto') {
            value = value + 'px';
        }
        this.options[key] = value;
        if (key === 'height') {
            this.gridContainer.find('.app-grid-content').css(key, value);
            this.dataStatusContainer.css(key, value);
        }
        this.addOrRemoveScroll();
    },
    /*Change the column header title. function will be called if display name changes in runmode*/
    setColumnProp: function (fieldName, property, val) {
        var $col;
        switch (property) {
        case 'displayName':
            $col = this.gridHeader.find('th[data-col-field="' + fieldName + '"]');
            $col.attr('title', val);
            $col.find('.header-data').text(val);
            break;
        }
    },

    _destroy: function () {
        this.element.text('');
        window.clearTimeout(this.refreshGridTimeout);
    }
});
