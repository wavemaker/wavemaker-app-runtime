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
        sortInfo: {
            'field': '',
            'direction': ''
        },
        isMobile: false,
        enableSort: true,
        enableSearch: false,
        height: 100,
        showHeader: true,
        selectFirstRow: false,
        allowAddNewRow: true,
        allowDeleteRow: true,
        allowInlineEditing: true,
        showRowIndex: false,
        enableRowSelection: true,
        enableColumnSelection: true,
        multiselect: false,
        filterNullRecords: true,
        cssClassNames: {
            'tableRow': 'app-datagrid-row',
            'headerCell': 'app-datagrid-header-cell',
            'tableCell': 'app-datagrid-cell',
            'grid': '',
            'gridDefault': 'table',
            'gridBody': 'app-datagrid-body',
            'deleteRow': 'danger'
        },
        dataStates: {
            'loading': 'Loading...',
            'ready': '',
            'error': 'An error occurred in loading the data.',
            'nodata': 'No data found.'
        },
        startRowIndex: 1,
        searchHandler: function (searchObj) {
            var searchText = searchObj.value,
                searchTextRegEx,
                field = searchObj.field,
                hasField = field.length,
                $rows = this.gridElement.find('tbody tr'),
                self = this;
            if (!searchText) {
                $rows.show();
                return;
            }

            searchTextRegEx = new RegExp(searchText, 'i');

            $rows.each(function () {
                var $row = $(this),
                    rowId = $row.attr('data-row-id'),
                    text = hasField ? self.preparedData[rowId][field] : $row.text();

                // If the list item does not contain the text phrase fade it out
                if (text === null || text.toString().search(searchTextRegEx) === -1) {
                    $row.hide();
                } else {
                    $row.show();
                }
            });
        },
        sortHandler: function (sortInfo, e) {
            /* Local sorting if server side sort handler is not provided. */
            e.stopPropagation();
            var sortFn = this.Utils.sortFn,
                sorter = sortFn(sortInfo.field, sortInfo.direction),
                data = $.extend(true, [], this.options.data);
            this._setOption('data', data.sort(sorter));
            if ($.isFunction(this.options.afterSort)) {
                this.options.afterSort();
            }
        }
    },
    customColumnDefs: {
        'checkbox': {
            'field': 'checkbox',
            'type': 'custom',
            'displayName': '',
            'sortable': false,
            'searchable': false,
            'resizable': false,
            'selectable': false,
            'readonly': true,
            'style': 'width: 30px; text-align: center;',
            'textAlignment': 'center',
            'isMultiSelectCol': true
        },
        'radio': {
            'field': 'radio',
            'type': 'custom',
            'displayName': '',
            'sortable': false,
            'searchable': false,
            'resizable': false,
            'selectable': false,
            'readonly': true,
            'style': 'width: 30px; text-align: center;',
            'textAlignment': 'center'
        },
        'rowIndex': {
            'field': 'rowIndex',
            'type': 'custom',
            'displayName': 'S. No.',
            'sortable': false,
            'searchable': false,
            'selectable': false,
            'readonly': true,
            'style': 'text-align: left;',
            'textAlignment': 'left'
        }
    },
    Utils: {
        random: function () {
            return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
        },
        sortFn: function (key, direction) {
            return function (a, b) {
                var strA = a[key] || '',
                    strB = b[key] || '',
                    dir = direction === 'asc' ? -1 : 1;
                if (a[key] && typeof a[key] === 'string') {
                    strA = a[key].toLowerCase();
                }
                if (b[key] && typeof b[key] === 'string') {
                    strB = b[key].toLowerCase();
                }
                return strA === strB ? 0 : (strA < strB ? dir : -dir);
            };
        },
        isDefined: function (value) {
            return value !== undefined;
        },
        isUndefined: function (value) {
            return value === undefined;
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
    /* Returns the table header template. */
    _getHeaderTemplate: function () {

        var cols = '<colgroup>',
            htm = '<thead><tr>',
            isDefined = this.Utils.isDefined,
            isUndefined = this.Utils.isUndefined;

        this.preparedHeaderData.forEach(function (value, index) {

            var id = index,
                type = value.type,
                field = value.field,
                headerLabel = WM.isDefined(value.displayName) ? value.displayName : field,
                headerClasses = this.options.cssClassNames.headerCell,
                sortInfo,
                sortField,
                asc_active,
                desc_active;

            /* Colgroup */
            cols += '<col';
            if (value.style) {
                cols += ' style="' + value.style + '"';
            }
            cols += '/>';
            /* thead */

            if (type === 'custom' && isDefined(value.class)) {
                headerClasses +=  ' ' + value.class;
            }
            if (value.selected) {
                headerClasses += ' info';
            }
            if (field === 'checkbox' || field === 'radio') {
                headerClasses += ' grid-col-small';
            }
            htm += '<th data-col-id="' + id + '" data-col-field="' + field + '" class="' + headerClasses + '" title="' + headerLabel + '" style="text-align: ' +
                value.textAlignment + ';"';
            if (isUndefined(value.resizable) || value.resizable) {
                htm += ' data-col-resizable';
            }
            if (isUndefined(value.selectable) || value.selectable) {
                htm += ' data-col-selectable';
            }
            htm += '>';
            /* For custom columns, show display name if provided, else don't show any label. */
            if (field === 'checkbox') {
                htm += '<input type="checkbox" />';
            }
            if (field === 'radio') {
                htm += '';
            }
            htm += '<div class="header-data">' + headerLabel + '</div>';
            if (this.options.enableSort && (isUndefined(value.sortable) || value.sortable) && !value.widgetType) {
                htm += '<span class="sort-buttons-container">';
                sortInfo = this.options.sortInfo;
                sortField = sortInfo.field;
                asc_active = sortInfo.direction === 'asc' ? ' active' : '';
                desc_active = sortInfo.direction === 'desc' ? ' active' : '';
                if (sortField && sortField === value.field) {
                    htm += '<button class="sort-button" title="Sort Ascending"><i class="sort-icon up' + asc_active + '"></i></button>';
                    htm += '<button type="button" class="sort-button" title="Sort Descending"><i class="sort-icon down' + desc_active + '"></i></button>';
                } else {
                    htm += '<button type="button" class="sort-button"><i class="sort-icon up" title="Sort Ascending"></i></button>';
                    htm += '<button type="button" class="sort-button"><i class="sort-icon down" title="Sort Descending"></i></button>';
                }
                htm += '</span>';
            }
            htm += '</th>';
        }, this);
        htm += '</tr></thead>';
        cols += '</colgroup>';

        return { 'colgroup' : cols, 'header' : htm };
    },

    /* Returns the seachbox template. */
    _getSearchTemplate: function () {
        var htm,
            sel = '<select name="wm-datagrid" data-element="dgFilterValue" ' +
                'class="form-control app-select">' +
                '<option value="" selected>Select Column</option>',
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
                '<label class="control-label app-label" data-element="dgSearchLabel">' +
                    searchLabel + ' </label>' + sel +
                '</div><div class="input-append input-group">' +
                    '<input type="text" data-element="dgSearchText" class="form-control app-textbox" value="" placeholder="Search" style="display: inline-block;"/>' +
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
            htm;
        htm = this.preparedData.reduce(function (prev, current) {
            return prev + self._getRowTemplate(current);
        }, '<tbody class="' + this.options.cssClassNames.gridBody + '">');

        htm += '</tbody>';
        return htm;
    },

    /* Returns the table row template. */
    _getRowTemplate: function (row) {
        var htm,
            self = this;

        htm = this.preparedHeaderData.reduce(function (prev, current, colIndex) {
            return prev + self._getColumnTemplate(row, colIndex, current);
        }, '<tr class="' + this.options.cssClassNames.tableRow + '" data-row-id="' + row.pk + '">');

        htm += '</tr>';
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
                        this.Utils.isUndefined(columnValue)) {
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
                    htm += ((this.Utils.isUndefined(columnValue) || columnValue === null)) ? '' : columnValue;
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

    _getEditableTemplate: function ($el, colDef, cellText, rowId) {
        if (colDef.editWidgetType) {
            var template,
                formName,
                dataValue = cellText ? 'datavalue="' + cellText + '"' : '';
            switch (colDef.editWidgetType) {
            case 'select':
                cellText = cellText || '';
                template =  '<wm-select ' + dataValue + ' dataset="' + colDef.dataset + '" datafield="' + colDef.datafield + '" displayfield="' + colDef.displayfield + '"></wm-select>';
                break;
            case 'typeahead':
                $el.addClass('datetime-wrapper');
                template =  '<wm-search ' + dataValue + ' dataset="' + colDef.dataset + '" datafield="' + colDef.datafield + '" displaylabel="' + colDef.displaylabel + '" searchkey="' +  colDef.searchkey + '" type="typeahead"></wm-select>';
                break;
            case 'date':
                $el.addClass('datetime-wrapper');
                template = '<wm-date ' + dataValue + '></wm-date>';
                break;
            case 'time':
                $el.addClass('datetime-wrapper');
                template = '<wm-time ' + dataValue + '></wm-time>';
                break;
            case 'datetime':
                $el.addClass('datetime-wrapper');
                template = '<wm-datetime ' + dataValue + ' outputformat="yyyy-MM-ddTHH:mm:ss"></wm-datetime>';
                break;
            case 'checkbox':
                template = '<wm-checkbox ' + dataValue + ' height="10px"></wm-checkbox>';
                break;
            case 'number':
                template = '<wm-text type="number" ' + dataValue + '></wm-text>';
                break;
            case 'textarea':
                cellText = cellText || '';
                template = '<wm-textarea ' + dataValue + '></wm-textarea>';
                break;
            case 'upload':
                formName = colDef.field + '_' + rowId;
                $el.attr('form-name', formName);
                template = '<form name="' + formName + '"><input class="file-upload" type="file" name="' + colDef.field + '"/></form>';
                break;
            default:
                template = '<wm-text ' + dataValue + '></wm-text>';
                break;
            }
            return this.options.compileTemplateInGridScope(template);
        }
        return '<input class="editable form-control app-textbox" type="text" value=""/>';
    },

    /* Prepares the grid header data by adding custom column definitions if needed. */
    _prepareHeaderData: function () {
        this.preparedHeaderData = [];

        $.extend(this.preparedHeaderData, this.options.colDefs);
        if (this.options.showRowIndex) {
            this.preparedHeaderData.unshift(this.customColumnDefs.rowIndex);
        }
        if (this.options.multiselect) {
            this.preparedHeaderData.unshift(this.customColumnDefs.checkbox);
        }
        if (!this.options.multiselect && this.options.showRadioColumn) {
            this.preparedHeaderData.unshift(this.customColumnDefs.radio);
        }
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
        this._prepareHeaderData();
        this._prepareData();
        this._render();
    },

    /* Removes the sort buttons, and the corresponding handler if sorting is disabled. */
    removeSort: function () {
        this.gridHeader.find('.sort-button').off('click');
        this.gridHeader.find('.sort-buttons-container').remove();
    },

    /* Re-renders the whole grid. */
    _refreshGrid: function () {
        this._prepareHeaderData();
        this._prepareData();
        this._render();
        this.setColGroupWidths();
        this.checkScrollBar();
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
        this.checkScrollBar();
    },

    /* Inserts a new blank row in the table. */
    addNewRow: function () {
        var rowId = this.gridBody.find('tr:visible').length,
            rowData = {},
            $row;

        rowData.index = this.options.startRowIndex + rowId;
        rowData.pk = rowId;
        if (this.options.allowAddNewRow) {
            $row = $(this._getRowTemplate(rowData));
            if (!this.preparedData.length) {
                this.setStatus('ready', this.dataStatus.ready);
            }
            this.gridElement.find('tbody.app-datagrid-body').append($row);
            this._appendRowActions($row);
            this.attachEventHandlers($row);
            $row.find('.edit-row-button').trigger('click', {operation: 'new'});
            this.updateSelectAllCheckboxState();
            this.checkScrollBar();
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
                $(this).trigger('click');
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
            var self = this,
                headerCols = this.gridHeaderElement.find('col'),
                bodyCols = this.gridElement.find('col');
            this.gridHeaderElement.find('th').each(function (index) {
                /***setting the header col width based on the content width***/
                var $header = $(this),
                    width = $header.width(),
                    id = $header.attr('data-col-id'),
                    colDef = self.preparedHeaderData[id];
                width = $header.hasClass('grid-col-small') ? 30 : (width > 50 ? width : (colDef.width || 50)); //Keep width as 30 for checkbox and radio; columnSanity check to prevent width being too small
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
            break;
        case 'enableSearch':
            this._toggleSearch();
            break;
        case 'searchLabel':
            if (this.gridSearch) {
                this.gridSearch.find(
                    '[data-element="dgSearchLabel"]'
                ).text(value);
            }
            break;
        case 'selectFirstRow':
            this.selectFirstRow(value);
            break;
        case 'data':
            this.refreshGridData();
            break;
        case 'enableSort':
            if (!this.options.enableSort) {
                if (this.gridHeader) {
                    this.removeSort();
                }
            } else {
                this.refreshGrid();
            }
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
        // If header is not already rendered, render it first.
        if (!this.gridHeaderElement.find('thead th').length) {
            this._renderHeader();
        }

        if (this.options.showHeader) {
            this.gridHeaderElement.show();
        } else {
            this.gridHeaderElement.hide();
        }
    },

    /* Toggles the searchbox visibility. */
    _toggleSearch: function () {
        // If search is not already rendered, render it first.
        if (!this.gridSearch) {
            this._renderSearch();
        }

        if (this.options.enableSearch) {
            this.gridSearch.removeClass('hidden');
        } else {
            this.gridSearch.addClass('hidden');
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
        var $headerCheckbox = this.gridHeader.find('th input:checkbox'),
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
    rowSelectionHandler: function (e, $row) {
        e.stopPropagation();
        var rowId,
            rowData,
            selected;

        $row = $row || $(e.target).closest('tr');
        rowId = $row.attr('data-row-id');
        rowData = this.preparedData[rowId];
        if (!rowData) {
            return;
        }
        selected = rowData.selected || false;
        selected = !selected;
        this.toggleRowSelection($row, selected);
        if (selected && $.isFunction(this.options.onRowSelect)) {
            this.options.onRowSelect(rowData, e);
        }
        if (!selected && $.isFunction(this.options.onRowDeselect)) {
            this.options.onRowDeselect(rowData, e);
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
    /* Handles column selection. */
    columnSelectionHandler: function (e) {
        e.stopImmediatePropagation();
        var $th = $(e.target).closest('th'),
            id = $th.attr('data-col-id'),
            colDef = this.preparedHeaderData[id],
            field = colDef.field,
            selector = 'td[data-col-id="' + id + '"]',
            $column = this.gridElement.find(selector),
            selected = $column.data('selected') || false,
            colInfo = {
                colDef: colDef,
                data: this.options.data.map(function (data) { return data[field]; }),
                sortDirection: this._getColumnSortDirection(colDef)
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
            $el.text(text || '');
        }
        return text;
    },
    getTextValue: function ($el, colDef, fields) {
        var text,
            $ie       = $el.find('input'),
            dataValue;
        text = this._getValue($ie, fields);
        if (colDef.editWidgetType && colDef.editWidgetType !== 'upload' && colDef.editWidgetType !== 'text') {
            dataValue = $el.children().isolateScope().datavalue;
            text = dataValue === '' ? undefined : dataValue; //Empty value is set from the grid cell. So, set it back to undefined.
        }
        if (colDef.type === 'timestamp' && (!colDef.editWidgetType || colDef.editWidgetType === 'text')) {
            text = parseInt(text, 10);
        }
        return text;
    },
    isDataModified: function ($editableElements, rowData) {
        var isDataChanged = false,
            self          = this;
        $editableElements.each(function () {
            var $el          = $(this),
                colId        = $el.attr('data-col-id'),
                colDef       = self.preparedHeaderData[colId],
                fields       = _.split(colDef.field, '.'),
                text         = self.getTextValue($el, colDef, fields),
                originalData = _.get(rowData, colDef.field);
            isDataChanged = !text && originalData === null ? false : !(originalData == text);
            if (isDataChanged) {
                return !isDataChanged;
            }
        });
        return isDataChanged;
    },
    /* Toggles the edit state of a row. */
    toggleEditRow: function (e, options) {
        e.stopPropagation();
        var $row = $(e.target).closest('tr'),
            $originalElements = $row.find('td'),
            $editButton = $row.find('.edit-row-button'),
            $cancelButton = $row.find('.cancel-edit-row-button'),
            $saveButton = $row.find('.save-edit-row-button'),
            rowData = this.options.data[$row.attr('data-row-id')] || {},
            self = this,
            rowId = parseInt($row.attr('data-row-id'), 10),
            isNewRow,
            $editableElements,
            isDataChanged = false,
            formData,
            isFormDataSupported,
            multipartData,
            firstEditableEle;
        if (e.data.action === 'edit') {
            if ($.isFunction(this.options.beforeRowUpdate)) {
                this.options.beforeRowUpdate(rowData, e);
            }

            if ($.isFunction(this.options.setGridEditMode)) {
                this.options.setGridEditMode(true);
            }

            if (!this.options.allowInlineEditing) {
                return;
            }

            $originalElements.each(function () {
                var $el = $(this),
                    cellText = $el.text(),
                    id = $el.attr('data-col-id'),
                    colDef = self.preparedHeaderData[id],
                    editableTemplate,
                    value,
                //Set the values to the generated input elements
                    setInputValue = function (value) {
                        if (!options || options.operation !== 'new') {
                            //For widgets, set the datavalue. Upload uses html file upload. So, no need to set value
                            if (colDef.editWidgetType) {
                                if (colDef.editWidgetType === 'upload') {
                                    return;
                                }
                                $el.children().isolateScope().datavalue = value;
                            }
                            $el.find('input').val(value);
                        }
                    };
                if (!colDef.readonly) {
                    if (options && options.operation === 'new') {
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
            });

            // Show editable row.
            $editButton.addClass('hidden');
            $cancelButton.removeClass('hidden');
            $saveButton.removeClass('hidden');
            $editableElements = $row.find('td.cell-editing');
            if ($editableElements) {
                firstEditableEle = $($editableElements).first().find('input');
                if (!firstEditableEle.length) {
                    firstEditableEle = $($editableElements).first().find('textarea');
                }
                if (!firstEditableEle.length) {
                    firstEditableEle = $($editableElements).first().find('select');
                }
                firstEditableEle.focus();
            }
            $editableElements.on('click', function (e) {
                e.stopPropagation();
            });
        } else {
            $editableElements = $row.find('td.cell-editing');
            isNewRow = rowId >= this.preparedData.length;
            if (e.data.action === 'save') {
                isFormDataSupported = (window.File && window.FileReader && window.FileList && window.Blob);
                multipartData = false;
                if (isFormDataSupported) {
                    /* Angular does not bind file values so using native object to send files */
                    formData = new FormData();
                }
                if ($.isFunction(this.options.onSetRecord)) {
                    this.options.onSetRecord(rowData, e);
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
                        $el.removeClass('datetime-wrapper');
                        text = self.getTextValue($el, colDef, fields);
                        if (fields.length === 1 && colDef.editWidgetType === 'upload') {
                            if (isFormDataSupported) {
                                multipartData = true;
                                formData.append(colDef.field, document.forms[$el.attr('form-name')][colDef.field].files[0]);
                                _.set(rowData, colDef.field, _.get(rowData, colDef.field) === null ? null : '');
                            }
                        } else {
                            if (WM.isDefined(text) && text !== null) {
                                _.set(rowData, colDef.field, text);
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
                        this.options.onRowInsert(rowData, e, multipartData);
                    } else {
                        this.options.afterRowUpdate(rowData, e, multipartData);
                    }
                } else {
                    this.cancelEdit($editableElements);
                    $editButton.removeClass('hidden');
                    $cancelButton.addClass('hidden');
                    $saveButton.addClass('hidden');
                    this.options.noChangesDetected();
                }
            } else {
                if (isNewRow) {
                    $row.remove();
                    if (!this.preparedData.length) {
                        this.setStatus('nodata', this.dataStatus.nodata);
                    }
                    this.checkScrollBar();
                    return;
                }
                if ($.isFunction(this.options.setGridEditMode)) {
                    this.options.setGridEditMode(false);
                }
                // Cancel edit.
                this.cancelEdit($editableElements);
                $editButton.removeClass('hidden');
                $cancelButton.addClass('hidden');
                $saveButton.addClass('hidden');
            }
        }
        this.checkScrollBar();
    },
    cancelEdit: function ($editableElements) {
        var self = this;
        $editableElements.each(function () {
            var $el   = $(this),
                value = $el.data('originalValue'),
                originalValue,
                template;
            $el.removeClass('datetime-wrapper cell-editing');
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
        if ($.isFunction(this.options.setGridEditMode)) {
            this.options.setGridEditMode(false);
        }
        $editableElements.each(function () {
            var $el   = $(this),
                value = $el.data('originalValue'),
                originalValue,
                template,
                text,
                colDef;
            $el.removeClass('datetime-wrapper cell-editing');
            if (!value) {
                colDef = self.preparedHeaderData[$el.attr('data-col-id')];
                text   = self.getTextValue($el, colDef, colDef.field.split('.'));
                $el.text(text || '');
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
        this.checkScrollBar();
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
        if (isNewRow) {
            $row.remove();
            this.checkScrollBar();
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
                self.checkScrollBar();
            }, e);
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
        selectedRows.each(function (index, el) {
            var id = $(this).attr('data-row-id'),
                preparedData = self.preparedData[id];
            if (id !== rowId && preparedData) {
                $(this).find('input:radio').prop('checked', false);
                preparedData.selected = preparedData.checked = false;
                $(this).removeClass('active');
            }
        });
    },

    /* Handles table sorting. */
    sortHandler: function (e) {
        e.stopImmediatePropagation();
        var $sortButton = $(e.target).closest('.sort-button'),
            $th = $sortButton.closest('th'),
            id = $th.attr('data-col-id'),
            $sortIcon = $sortButton.find('i'),
            direction = $sortIcon.hasClass('up') ? 'asc' : 'desc',
            sortInfo = this.options.sortInfo,
            $previousSortMarker = this.gridHeader.find('.active'),
            field = $th.attr('data-col-field'),
            $previousSortedColumn,
            colId,
            colDef;
        /* If same field is sorted in same direction again then return. */
        if (sortInfo.field && sortInfo.field === field && sortInfo.direction === direction) {
            return;
        }
        $sortIcon.addClass('active');
        if ($previousSortMarker.length) {
            $previousSortedColumn = $previousSortMarker.closest('th');
            colId = $previousSortedColumn.attr('data-col-id');
            colDef = this.preparedHeaderData[colId];
            $previousSortMarker.removeClass('active');
            colDef.sortInfo = {'sorted': false, 'direction': ''};
        }
        sortInfo.direction = direction;
        sortInfo.field = field;
        this.preparedHeaderData[id].sortInfo = {'sorted': true, 'direction': direction};
        this.options.sortHandler.call(this, this.options.sortInfo, e, 'sort');
    },

    /* Attaches all event handlers for the table. */
    attachEventHandlers: function ($htm) {
        var rowOperationsCol = this._getRowActionsColumnDef(),
            deleteRowHandler;

        if (this.options.enableRowSelection) {
            $htm.on('click', this.rowSelectionHandler.bind(this));
            $htm.on('dblclick', this.rowDblClickHandler.bind(this));
            if (this.options.selectFirstRow) {
                this.selectFirstRow(true);
            }
        }

        if (this.gridHeader) {
            if (this.options.enableColumnSelection) {
                this.gridHeader.find('th[data-col-selectable]').on('click', this.columnSelectionHandler.bind(this));
            }

            if (this.options.enableSort) {
                this.gridHeader.find('.sort-button').on('click', this.sortHandler.bind(this));
            }
        }
        if (this.options.rowActions.length) {
            $htm.find('.row-action').on('click', {action: 'edit'}, this._handleCustomEvents.bind(this));
            $htm.find('.cancel-edit-row-button').on('click', {action: 'cancel'}, this.toggleEditRow.bind(this));
            $htm.find('.save-edit-row-button').on('click', {action: 'save'}, this.toggleEditRow.bind(this));
        } else {
            if (this.options.allowInlineEditing || (rowOperationsCol && _.includes(rowOperationsCol.operations, 'update'))) {
                $htm.find('.edit-row-button').on('click', {action: 'edit'}, this.toggleEditRow.bind(this));
                $htm.find('.cancel-edit-row-button').on('click', {action: 'cancel'}, this.toggleEditRow.bind(this));
                $htm.find('.save-edit-row-button').on('click', {action: 'save'}, this.toggleEditRow.bind(this));
            }

            if (this.options.allowDeleteRow || (rowOperationsCol && _.includes(rowOperationsCol.operations, 'delete'))) {
                deleteRowHandler = this.deleteRowAndUpdateSelectAll;
                if (!this.options.multiselect) {
                    deleteRowHandler = this.deleteRow;
                }
                $htm.find('td .delete-row-button').on('click', deleteRowHandler.bind(this));
            }
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
            $searchBox,
            placeholder;

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
            var colDefIndex = $htm.find('option:selected').attr('data-coldef-index'),
                colDef = self.options.colDefs[colDefIndex];
            if (colDef) {
                placeholder = colDef.searchPlaceholder || 'Search';
                $htm.find('[data-element="dgSearchText"]').attr('placeholder', placeholder);
            }
            $searchBox.val('');
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

    /* Renders the table header. */
    _renderHeader: function () {
        var headerTemplate = this._getHeaderTemplate(),
            $colgroup      = $(headerTemplate.colgroup),
            self           = this,
            $header;
        if (!this.options.showHeader) {
            this.gridElement.append($colgroup);
            return;
        }
        $header   = $(headerTemplate.header);
        function toggleSelectAll(e) {
            var $checkboxes = $('tbody tr:visible td input[name="gridMultiSelect"]:checkbox', self.gridElement),
                checked = this.checked;
            $checkboxes.prop('checked', checked);
            $checkboxes.each(function () {
                var $row = $(this).closest('tr'),
                    rowId = $row.attr('data-row-id'),
                    rowData = self.preparedData[rowId];
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
            this.gridElement.append($colgroup.clone());
            this.gridHeader = this.gridHeaderElement.find('thead');
        }
        /**Add event handler, to the select all checkbox on the header**/
        $header.on('click', 'input:checkbox', toggleSelectAll);

        if ($.isFunction(this.options.onHeaderClick)) {
            this.gridHeader.on('click', {'col': this.options.colDefs}, this.options.onHeaderClick);
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
                        colIndex = ui.helper.index() + 1,
                        originalWidth = self.gridHeaderElement.find('thead > tr > th:nth-child(' + colIndex + ')').width(),
                        newWidth = ui.size.width,
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
                    self.checkScrollBar();
                }
            });
            /*On scroll of the content table, scroll the header*/
            this.gridElement.parent().scroll(function () {
                self.gridHeaderElement.parent().prop("scrollLeft", this.scrollLeft);
            });
        }
    },
    checkScrollBar: function () {
        var gridContent = this.gridContainer.find('.app-grid-content').get(0),
            gridHeader = this.gridContainer.find('.app-grid-header');
        /*If scroll bar is present on the grid content, add padding to the header*/
        if ((gridContent.scrollHeight > gridContent.clientHeight) && !this.Utils.isMac()) {
            gridHeader.addClass('sort-visible');
        } else {
            gridHeader.removeClass('sort-visible');
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

                }

                actionsTemplate += '<button type="button" data-action-key="' + def.key + '" class="' + clsAttr + '" title="' + def.title + '" ' + (ngShowAttr ? ' ng-show="' + ngShowAttr + '"' : '') + '>'
                    + '<i class="app-icon ' + def.iconclass + '"></i><span class="btn-caption">' + def.displayName + '</span></button>';
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
    _appendRowActions : function ($htm) {
        var self, template,
            rowOperationsCol = this._getRowActionsColumnDef();
        if (this.options.rowActions.length || rowOperationsCol) {
            self = this;
            template = self._getRowActionsTemplate();
            $htm.find("[data-identifier='actionButtons']").each(function () {
                $(this).empty().append(self.options.compileTemplateInGridScope(template));
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
    },

    /* Renders the table container. */
    _render: function () {
        if (!this.tableId) {
            this.tableId = this.Utils.generateGuid();
        }
        var sortVisible = this.Utils.isMac() ? '' : 'sort-visible',
            statusContainer =
                '<div class="overlay" style="display: none;">' +
                    '<div class="status"><i class="fa fa-spinner fa-spin"></i><span class="message"></span></div>' +
                '</div>',
            table = '<div class="table-container table-responsive"><div class="app-grid-header ' + sortVisible +
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
        if (this.options.enableSearch) {
            this._renderSearch();
        }
        if (this.options.spacing === 'condensed') {
            this._toggleSpacingClasses('condensed');
        }
        this._renderGrid();
    },

    setStatus: function (state, message) {
        var loadingIndicator = this.dataStatusContainer.find('.fa');
        this.dataStatus.state = state;
        this.dataStatus.message = message || this.options.dataStates[state];
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
        if (state === 'nodata') {
            this.dataStatusContainer.addClass('bg-none');
        } else {
            this.dataStatusContainer.removeClass('bg-none');
        }
    },

    setGridDimensions: function (key, value) {
        if (value.indexOf('px') === -1 && value.indexOf('%') === -1 && value.indexOf('em') === -1 && value != 'auto') {
            value = value + 'px';
        }
        this.options[key] = value;
        if (key === 'height') {
            this.gridContainer.find('.app-grid-content').css(key, value);
        }
        this.checkScrollBar();
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
