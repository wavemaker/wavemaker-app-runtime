/*global $, window, angular*/
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
        sortInfo: {
            'field': '',
            'direction': ''
        },
        enableSort: true,
        enableSearch: false,
        height: 100,
        showHeader: false,
        selectFirstRow: false,
        allowAddNewRow: true,
        allowDeleteRow: true,
        allowInlineEditing: true,
        showRowIndex: false,
        enableRowSelection: true,
        enableColumnSelection: true,
        multiselect: false,
        caption: '',
        cssClassNames: {
            'tableRow': 'app-datagrid-row',
            'headerCell': 'app-datagrid-header-cell',
            'tableCell': 'app-datagrid-cell',
            'grid': '',
            'gridDefault': 'table table-condensed',
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
                if (text.toString().search(searchTextRegEx) === -1) {
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
            'style': 'text-align: center;'
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
            'style': 'text-align: center;'
        },
        'rowIndex': {
            'field': 'rowIndex',
            'type': 'custom',
            'displayName': 'S. No.',
            'sortable': false,
            'searchable': false,
            'selectable': false,
            'readonly': true,
            'style': 'text-align: left;'
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
        }
    },

    _getColumnSortDirection: function (field) {
        var sortInfo = this.options.sortInfo;
        return field === sortInfo.field ? sortInfo.direction : '';
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
                headerLabel = value.displayName,
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
            htm += '<th data-col-id="' + id + '" data-col-field="' + field +
                '" class="' + headerClasses + '" style="text-align: ' +
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
            if (type !== 'custom') {
                headerLabel = headerLabel || field;
            }
            if (headerLabel) {
                htm += '<div class="header-data">' + headerLabel + '</div>';
            }
            if (this.options.enableSort && (isUndefined(value.sortable) || value.sortable)) {
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

        return cols + htm;
    },

    /* Returns the seachbox template. */
    _getSearchTemplate: function () {
        var htm,
            sel = '<select name="wm-datagrid" data-element="dgFilterValue" ' +
                'class="form-control app-select input-sm">' +
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
            '<form class="form-search form-inline well well-sm row" onsubmit="return false;"><div class="form-group">' +
                '<label class="control-label app-label" data-element="dgSearchLabel">' +
                    searchLabel + ' </label>' + sel +
                '</div><div class="input-append input-group input-group-sm">' +
                    '<input type="text" data-element="dgSearchText" class="form-control app-textbox" value="" placeholder="Search" style="display: inline-block;"/>' +
                    '<span class="input-group-addon"><button type="button" data-element="dgSearchButton" class="app-search-button app-button " title="Search">' +
                        '<i class="glyphicon glyphicon-search"></i>' +
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

    /* Returns the table actions (edit, delete) cell template. */
    _getRowActionsTemplate: function (colDef) {
        var htm = '';
        if (colDef.operations.indexOf('update') !== -1) {
            htm +=
                '<button type="button" class="app-button edit edit-row-button" title="Edit Row"><i class="glyphicon glyphicon-pencil"></i></button>' +
                '<button type="button" class="app-button save save-edit-row-button hidden" title="Save"><i class="glyphicon glyphicon-ok"></i></button>' +
                '<button type="button" class="app-button cancel cancel-edit-row-button hidden" title="Cancel"><i class="glyphicon glyphicon-remove"></i></button>';
        }
        if (colDef.operations.indexOf('delete') !== -1) {
            htm += '<button type="button" class="app-button delete delete-row-button" title="Delete Record"><i class="glyphicon glyphicon-trash"></i></button>';
        }
        return htm;
    },

    /* Returns the checkbox template. */
    _getCheckboxTemplate: function (row) {
        var checked = row.checked ? ' checked' : '',
            disabled = row.disabed ? ' disabled' : '';
        return '<input type="checkbox"' + checked + disabled + '/>';
    },

    /* Returns the radio template. */
    _getRadioTemplate: function (row) {
        var checked = row.checked ? ' checked' : '',
            disabled = row.disabed ? ' disabled' : '';
        return '<input type="radio" name="" value=""' + checked + disabled + '/>';
    },

    /* Returns the widget template. */
    _getWidgetTemplate: function (colDef, row) {
        var template = '',
            val = row[colDef.field];
        switch (colDef.widgetType) {
        case 'button':
            template = '<button type="button" value="' + val + '">' + val + '</button>';
            break;
        case 'image':
            template = '<img src="' + val + '" alt="' + val + '"/>';
            break;
        }
        return template;
    },

    /* Returns the table cell template. */
    _getColumnTemplate: function (row, colId, colDef) {
        var classes = this.options.cssClassNames.tableCell + ' ' + colDef.class,
            ngClass = colDef.ngClass || '',
            htm = '<td class="' + classes + '" data-col-id="' + colId + '" style="text-align: ' + colDef.textAlignment + ';"',
            colExpression,
            invalidExpression = false,
            ctId = row.pk + '-' + colId,
            template,
            isCellCompiled = false,
            columnValue;
        if (ngClass) {
            htm += 'data-ng-class="' + ngClass + '" data-compiled-template="' + ctId + '" ';
            isCellCompiled = true;
        }

        if (colDef.customExpression) {
            if (isCellCompiled) {
                htm += '>';
            } else {
                htm += 'data-compiled-template="' + ctId + '">';
                isCellCompiled = true;
            }
            htm += colDef.customExpression;
        } else {
            htm += '>';
            if (colDef.type !== 'custom') {
                switch (colDef.type) {
                case 'timestamp':
                    htm += this._getTimestampTemplate(row[colDef.field]);
                    break;
                default:
                    columnValue = row[colDef.field];
                    htm += ((this.Utils.isUndefined(columnValue) || columnValue === null)) ? '' : columnValue;
                    break;
                }
            } else {
                switch (colDef.field) {
                case 'checkbox':
                    htm += this._getCheckboxTemplate(row);
                    break;
                case 'radio':
                    htm += this._getRadioTemplate(row);
                    break;
                case 'rowOperations':
                    htm += this._getRowActionsTemplate(colDef);
                    break;
                case 'rowIndex':
                    htm += row.index;
                    break;
                case 'none':
                    htm += '';
                    break;
                default:
                    columnValue = row[colDef.field];
                    htm += ((this.Utils.isUndefined(columnValue) || columnValue === null)) ? '' : columnValue;
                    break;
                }
            }
        }
        htm += '</td>';
        if (isCellCompiled) {
            this.compiledCellTemplates[ctId] = this.options.getCompiledTemplate(htm, row, colDef) || '';
        }
        return htm;
    },

    _getTimestampTemplate: function (timestamp) {
        if (this.Utils.isUndefined(timestamp) || timestamp === null) {
            return '';
        }
        var SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            d = new Date(timestamp),
            formattedDate = d.getDate() + '-' + (SHORT_MONTH_NAMES[d.getMonth()]) + '-' + d.getFullYear(),
            hours = d.getHours(),
            h = (hours < 10) ? '0' + hours : hours,
            minutes = d.getMinutes(),
            m = (minutes < 10) ? '0' + minutes : minutes,
            seconds = d.getSeconds(),
            s = (seconds < 10) ? '0' + seconds : seconds,
            formattedTime = h + ':' + m + ':' + s;

        return formattedDate + ' ' + formattedTime;
    },

    _getEditableTemplate: function () {
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
            generatedColDefs = {},
            isObject = this.Utils.isObject;

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
            isObject(item) && Object.keys(item).forEach(generateColumnDef);
        });

        this.options.colDefs = colDefs;
        this._prepareHeaderData();
    },

    /* Prepares the grid data by adding a primary key to each row's data. */
    _prepareData: function () {
        var data = [],
            colDefs = this.options.colDefs,
            self = this,
            isObject = this.Utils.isObject;
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
                    len = fields.length;

                for (j = 0; j < len; j++) {
                    var key = fields[j],
                        isArray = undefined;
                    if (key.indexOf('[0]') !== -1) {
                        key = key.replace('[0]', '');
                        isArray = true;
                    }
                    if (isObject(text) && !isArray) {
                        text = text[key];
                    } else if (isArray) {
                        text = text[key][0];
                    } else {
                        text = undefined;
                        break;
                    }
                }

                rowData[colDef.field] = text;
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
            this.gridElement.find('tbody').append($row);
            this.attachEventHandlers($row);
            $row.find('.edit-row-button').trigger('click', {action: 'edit'});
            this.updateSelectAllCheckboxState();
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
            this.gridSearch && this.gridSearch.find(
                '[data-element="dgSearchLabel"]'
            ).text(value);
            break;
        case 'selectFirstRow':
            this.selectFirstRow(value);
            break;
        case 'data':
            this.refreshGridData();
            break;
        case 'enableSort':
            if (!this.options.enableSort) {
                this.gridHeader && this.removeSort();
            } else {
                this.refreshGrid();
            }
            break;
        case 'caption':
            if (this.gridCaption) {
                if (!value.length) {
                    this.element.find('.table-heading').remove();
                    this.gridCaption = null;
                } else {
                    this.gridCaption.text(value);
                }
            } else {
                if (!value.length) {
                    return;
                }
                var caption = $('<h3 class="table-heading">' + value + '</h3>');
                caption.insertBefore(this.gridContainer);
                this.gridCaption = this.element.find('.table-heading');
            }
            break;
        case 'dataStates':
            if (this.dataStatus.state === 'nodata') {
                this.setStatus('nodata', this.dataStatus['nodata']);
            }
            break;
        case 'multiselect': // Fallthrough
        case 'showRadioColumn':
        case 'colDefs':
        case 'showRowIndex':
            this.refreshGrid();
            break;
        case 'cssClassNames':
            var gridClass = this.options.cssClassNames.gridDefault + ' ' + this.options.cssClassNames.grid;
            // Set grid class on table.
            this.gridElement.attr('class', gridClass);
            break;
        }
    },

    getOptions: function () {
        return this.options;
    },

    /* Toggles the table header visibility. */
    _toggleHeader: function () {
        // If header is not already rendered, render it first.
        if (!this.gridElement.find('thead').length) {
            this._renderHeader();
        }

        if (this.options.showHeader) {
            this.gridHeader.show();
        } else {
            this.gridHeader.hide();
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
    selectRow: function (rowData, value) {
        var rowIndex = this.Utils.getObjectIndex(this.options.data, rowData),
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
        var $headerCheckbox = this.gridHeader.find('th input:checkbox'),
            $tbody = this.gridElement.find('tbody'),
            checkedItemsLength = $tbody.find('tr:visible input:checkbox:checked').length,
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
            selected,
            $radio,
            $checkbox;

        $row = $row || $(e.target).closest('tr');
        rowId = $row.attr('data-row-id');
        rowData = this.preparedData[rowId];
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

    /* Toggles the edit state of a row. */
    toggleEditRow: function (e) {
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
            $editableElements;
        if (e.data.action === 'edit') {
            if ($.isFunction(this.options.beforeRowUpdate)) {
                this.options.beforeRowUpdate(rowData, e);
            }

            if (!this.options.allowInlineEditing) {
                return;
            }

            $originalElements.each(function () {
                var $el = $(this),
                    cellText = $el.text(),
                    id = $el.attr('data-col-id'),
                    colDef = self.preparedHeaderData[id],
                    editableTemplate;
                if (!colDef.readonly) {
                    editableTemplate = self._getEditableTemplate(colDef.field);
                    $el.addClass('cell-editing').html(editableTemplate).data('originalText', cellText);
                    // TODO: Use some other selector. Input will fail for other types.
                    $el.find('input').val(cellText);
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
        } else {
            $editableElements = $row.find('td.cell-editing');
            isNewRow = rowId >= this.preparedData.length;
            if (e.data.action === 'save') {
                if ($.isFunction(this.options.onSetRecord)) {
                    this.options.onSetRecord(rowData, e);
                }

                $editableElements.each(function () {
                    var $el = $(this),
                        colId = $el.attr('data-col-id'),
                        colDef = self.preparedHeaderData[colId],
                        text = $el.find('input').val();
                    $el.text(text);
                    rowData[colDef.field] = text;
                });
                if (isNewRow) {
                    this.options.onRowInsert(rowData, e);
                } else {
                    this.options.afterRowUpdate(rowData, e);
                }
            } else {
                if (isNewRow) {
                    $row.remove();
                    return;
                }
                // Cancel edit.
                $editableElements.each(function () {
                    var $el = $(this);
                    $el.text($el.data('originalText'));
                });
            }
            $editButton.removeClass('hidden');
            $cancelButton.addClass('hidden');
            $saveButton.addClass('hidden');
        }
    },

    /* Deletes a row. */
    deleteRow: function (e) {
        e.stopPropagation();
        var $row = $(e.target).closest('tr'),
            rowId = $row.attr('data-row-id'),
            rowData = this.options.data[rowId],
            isNewRow = rowId >= this.preparedData.length;
        if (isNewRow) {
            $row.remove();
            return;
        }
        if ($.isFunction(this.options.onRowDelete)) {
            var className = this.options.cssClassNames['deleteRow'],
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
        this.options.sortHandler.call(this, this.options.sortInfo, e);
    },

    /* Attaches all event handlers for the table. */
    attachEventHandlers: function ($htm) {
        var rowOperationsCol = this._getRowActionsColumnDef(),
            deleteRowHandler;

        if (this.options.enableRowSelection) {
            $htm.on('click', this.rowSelectionHandler.bind(this));
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


        if (this.options.allowInlineEditing || (rowOperationsCol && rowOperationsCol.operations.indexOf('update') !== -1)) {
            $htm.find('.edit-row-button').on('click', {action: 'edit'}, this.toggleEditRow.bind(this));
            $htm.find('.cancel-edit-row-button').on('click', {action: 'cancel'}, this.toggleEditRow.bind(this));
            $htm.find('.save-edit-row-button').on('click', {action: 'save'}, this.toggleEditRow.bind(this));
        }

        if (this.options.allowDeleteRow || (rowOperationsCol && rowOperationsCol.operations.indexOf('delete') !== -1)) {
            deleteRowHandler = this.deleteRowAndUpdateSelectAll;
            if (!this.options.multiselect) {
                deleteRowHandler = this.deleteRow;
            }
            $htm.find('td .delete-row-button').on('click', deleteRowHandler.bind(this));
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
            self.options.searchHandler.call(self, self.searchObj);
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
                var placeholder = colDef.searchPlaceholder || 'Search';
                $htm.find('[data-element="dgSearchText"]').attr('placeholder', placeholder);
            }
            $searchBox.val('');
            // If "No data found" message is shown, and user changes the selection, then fetch all data.
            if (self.dataStatusContainer.find('.status').text() === self.options.dataStates['nodata']) {
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
        var $htm = $(this._getHeaderTemplate()),
            self = this;

        function toggleSelectAll(e) {
            var $table = $(e.target).closest('table'),
                $checkboxes = $('tbody tr:visible td input:checkbox:not(:disabled)', $table),
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

        this.gridElement.append($htm);
        this.gridHeader = this.gridElement.find('thead');
        $htm.on('click', 'input:checkbox', toggleSelectAll);
        if ($.isFunction(this.options.onHeaderClick)) {
            this.gridHeader.on('click', {'col': this.options.colDefs}, this.options.onHeaderClick);
        }

        if (this.gridElement.length) {
            this.gridElement.find('th[data-col-resizable]').resizable({
                handles: 'e',
                minWidth: 50,
                // set COL width
                /* This is needed because if width is initially set on col from coldefs,
                 * then that column was not getting resized.*/
                resize: function (evt, ui) {
                    var $colElement,
                        $cellElements,
                        colIndex = ui.helper.index() + 1;
                    $colElement = self.gridElement.find('colgroup > col:nth-child(' + colIndex + ')');
                    $cellElements = self.gridElement.find('tr > td:nth-child(' + colIndex + ') > div');
                    $colElement.width(ui.size.width);
                    $cellElements.width(ui.size.width);
                    // height must be set in order to prevent IE9 to set wrong height
                    $(this).css('height', 'auto');
                }
            });
        }
    },

    /* Renders the table body. */
    _renderGrid: function () {
        var $htm = $(this._getGridTemplate());
        this.gridElement.append($htm);
        // Set proper data status messages after the grid is rendered.
        if (!this.options.data.length && !this.dataStatus.state.length) {
            this.setStatus('nodata');
        } else {
            this.setStatus(this.dataStatus.state, this.dataStatus.message);
        }
        this.gridBody = this.gridElement.find('tbody');
        this._findAndReplaceCompiledTemplates();
        this.attachEventHandlers($htm);
    },

    /* Renders the table container. */
    _render: function () {
        if (!this.tableId) {
            this.tableId = this.Utils.generateGuid();
        }
        var statusContainer =
                '<div class="overlay" style="display: none;">' +
                    '<div class="loading"></div>' +
                    '<div class="status"></div>' +
                '</div>',
            table =
                '<div class="table-container table-responsive" style="height:' + this.options.height + ';">' +
                    '<table class="' + this.options.cssClassNames.gridDefault + ' ' + this.options.cssClassNames.grid + '" id="table_' + this.tableId + '">' +
                    '</table>' +
                '</div>',
            caption = '<h3 class="table-heading">' + this.options.caption + '</h3>';
        this.gridContainer = $(table);
        this.gridElement = this.gridContainer.find('table');

        // Set the caption if it is present.
        if (this.options.caption.length) {
            this.gridCaption = $(caption);
            this.element.find('.table-heading').remove();
            this.element.append(this.gridCaption);
        }

        // Remove the grid table element.
        this.element.find('.table-container').remove();
        this.element.append(this.gridContainer);
        this.dataStatusContainer = $(statusContainer);
        this.gridContainer.append(this.dataStatusContainer);
        if (this.options.showHeader) {
            this._renderHeader();
        }
        if (this.options.enableSearch) {
            this._renderSearch();
        }
        this._renderGrid();
    },

    setStatus: function (state, message) {
        var loadingIndicator = this.dataStatusContainer.find('.loading');
        this.dataStatus.state = state;
        this.dataStatus.message = message || this.options.dataStates[state];
        this.dataStatusContainer.find('.status').text(this.dataStatus.message);
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
        this.gridContainer.css(key, this.options[key]);
    },

    _destroy: function () {
        this.element.text('');
        window.clearTimeout(this.refreshGridTimeout);
    }
});