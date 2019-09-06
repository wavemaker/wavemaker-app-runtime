/*global $, window, angular, moment, WM, _, document, parseInt, navigator*/
/*jslint todo: true*/
/**
 * JQuery Datagrid widget.
 */

'use strict';

$.widget('wm.datatable', {
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
        showNewRow: true,
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
            'descIcon'        : 'wi wi-long-arrow-down',
            'selectedColumn'  : 'selected-column'
        },
        dataStates: {
            'loading': 'Loading...',
            'ready': '',
            'error': 'An error occurred in loading the data.',
            'nodata': 'No data found.'
        },
        messages: {
            'selectField': 'Select Field'
        },
        loadingicon: '',
        startRowIndex: 1,
        editmode: '',
        actionsEnabled: {
            'edit'  : true,
            'new'   : true
        },
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
                this.gridSearch.find('.form-group').removeClass('form-group-sm');
                this.gridSearch.find('select').removeClass('input-sm');
                this.gridSearch.find('.input-group').removeClass('input-group-sm');
            }
            break;
        case 'condensed':
            this.gridElement.addClass('table-condensed');
            this.gridHeaderElement.addClass('table-condensed');
            if (this.gridSearch) {
                this.gridSearch.find('.form-group').addClass('form-group-sm');
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
            var colDef;
            if (col.isGroup) {
                colSpan += self._getColSpan(col.columns);
            } else {
                colDef =  _.find(self.preparedHeaderData, {'field': col.field});
                //If show is false, don't increment the col span
                colSpan = (!_.isUndefined(colDef.show) && !colDef.show) ? colSpan : colSpan + 1;
            }
        });
        return colSpan;
    },
    //Method to set the column span of the header cells in the config
    _setColSpan: function (config) {
        var self = this;
        _.forEach(config, function (col) {
            if (col.isGroup) {
                col.colspan = self._getColSpan(col.columns);
                self.gridHeader.find('th[data-col-group="' + col.field + '"]').attr('colspan', col.colspan);
                self._setColSpan(col.columns);
            }
        });
    },
    /* Returns the table header template. */
    _getHeaderTemplate: function () {

        var $colgroup        = $('<colgroup></colgroup>'),
            $htm             = $('<thead></thead>'),
            isDefined        = this.Utils.isDefined,
            sortInfo         = this.options.sortInfo,
            sortField        = sortInfo.field,
            self             = this,
            rowTemplates     = [],
            headerConfig     = this.options.headerConfig,
            headerGroupClass = self.options.cssClassNames.groupHeaderCell,
            $row;
        function generateHeaderCell(value, index) {
            var id            = index,
                field         = value.field,
                headerLabel   = WM.isDefined(value.displayName) ? value.displayName : (field || ''),
                titleLabel    = headerLabel,
                sortEnabled   = self.options.enableSort && (_.isUndefined(value.show) || value.show) && (_.isUndefined(value.sortable) || value.sortable),
                headerClasses = self.options.cssClassNames.headerCell,
                sortClass,
                tl = '',
                $th,
                $col,
                $sortSpan,
                $sortIcon;
            headerLabel = (!WM.isDefined(headerLabel) || headerLabel === '') ? '&nbsp;' : headerLabel; //If headername is empty, add an empty space
            $col = $('<col/>');
            if (value.style) {
                $col.attr('style', value.style);
            }
            $colgroup.append($col);
            /* thead */

            if (isDefined(value.class)) {
                headerClasses +=  ' ' + value.class;
            }
            if (value.selected) {
                headerClasses += ' ' + self.options.cssClassNames.selectedColumn + ' ';
            }
            if (field === 'checkbox' || field === 'radio') {
                headerClasses += ' grid-col-small';
            }
            tl += '<th';
            if ((_.isUndefined(value.resizable) || value.resizable) && (_.isUndefined(value.show) || value.show)) { //If show is false, do not add the resize option
                tl += ' data-col-resizable';
            }
            if (self.options.enableColumnSelection && (_.isUndefined(value.selectable) || value.selectable)) {
                tl += ' data-col-selectable';
            }
            if (sortEnabled) {
                tl += ' data-col-sortable';
            }
            tl += '></th>';
            $th = $(tl);
            $th.attr({
                'data-col-id'    : id,
                'data-col-field' : field,
                'title'          : titleLabel,
                'style'          : 'text-align: ' + value.textAlignment
            });
            $th.addClass(headerClasses);
            /* For custom columns, show display name if provided, else don't show any label. */
            if (field === 'checkbox') {
                $th.append('<input type="checkbox" />');
            }
            $th.append('<span class="header-data">' + headerLabel + '</span>');
            if (sortEnabled) { //If sort info is present, show the sort icon for that column on grid render
                $sortSpan = $('<span class="sort-buttons-container"></span>');
                $sortIcon = $('<i class="sort-icon"></i>');
                if (sortField && sortField === value.field && sortInfo.direction) {
                    sortClass = sortInfo.direction === 'asc' ? self.options.cssClassNames.ascIcon : self.options.cssClassNames.descIcon;
                    $sortSpan.addClass('active');
                    $sortIcon.addClass(sortClass + ' ' + sortInfo.direction);
                }
                $th.append($sortSpan.append($sortIcon));
            }
            return $th.get(0).outerHTML;
        }
        //Method to generate the header row based on the column group config
        function generateRow(cols, i) {
            var tl = '';
            _.forEach(cols, function (col) {
                var index,
                    value,
                    classes,
                    styles,
                    $groupTl;
                if (col.columns && col.columns.length) {
                    //If columns is present, this is a group header cell.
                    $groupTl = $('<th></th>');
                    classes  = headerGroupClass + ' ' + (col.class || '');
                    styles   = 'text-align: ' + col.textAlignment + ';background-color: ' + (col.backgroundColor || '') + ';';
                    $groupTl.attr({
                        'data-col-group' : col.field,
                        'class'          : classes,
                        'style'          : styles,
                        'title'          : col.displayName
                    });
                    $groupTl.append('<span class="header-data">' + col.displayName + '</span>');
                    tl += $groupTl.get(0).outerHTML;
                    generateRow(col.columns, (i + 1));
                } else {
                    //For non group cells, fetch the relative field definition and generate the template
                    index = _.findIndex(self.preparedHeaderData, {'field': col.field});
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
            $row = $('<tr></tr>');
            self.preparedHeaderData.forEach(function (value, index) {
                $row.append(generateHeaderCell(value, index));
            });
            $htm.append($row);
        } else {
            generateRow(headerConfig, 0);
            //Combine all the row templates to generate the header
            $htm.append(_.reduce(rowTemplates, function (template, rowTl, index) {
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
            }, ''));
        }

        return { 'colgroup' : $colgroup, 'header' : $htm };
    },

    /* Returns the seachbox template. */
    _getSearchTemplate: function () {
        var htm,
            sel = '<select name="wm-datatable" data-element="dgFilterValue" ' +
                'class="form-control app-select">' +
                '<option value="" selected class="placeholder">' + this.options.messages.selectField + '</option>',
            searchLabel = (this.Utils.isDefined(this.options.searchLabel) &&
                this.options.searchLabel.length) ? this.options.searchLabel : '';
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
                '<span class="input-group-addon"><button type="button" data-element="dgSearchButton" class="app-search-button" title="' + searchLabel + '">' +
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
        var $htm,
            self            = this,
            gridOptions     = self.options,
            rowNgClass      = gridOptions.rowNgClass,
            rowNgClassExpr  = rowNgClass ? 'ng-class="' + rowNgClass + '"' : '';

        $htm = $('<tr tabindex="0" class="' + gridOptions.cssClassNames.tableRow + ' ' + (gridOptions.rowClass || '') + '" data-row-id="' + row.$$pk + '" ' + rowNgClassExpr + '></tr>');
        this.preparedHeaderData.forEach(function (current, colIndex) {
            $htm.append(self._getColumnTemplate(row, colIndex, current));
        });

        if (rowNgClass) {
            return gridOptions.getCompiledTemplate($htm, row);
        }
        return $htm;
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
            chkBoxName     = isMultiSelectCol ? 'rowMultiSelectInput' : '';
        return '<input ' + chkBoxName + ' type="checkbox"' + checked + disabled + '/>';
    },

    /* Returns the radio template. */
    _getRadioTemplate: function (row) {
        var checked = row.checked ? ' checked' : '',
            disabled = row.disabed ? ' disabled' : '';
        return '<input type="radio" rowSelectInput name="" value=""' + checked + disabled + '/>';
    },

    /* Returns the table cell template. */
    _getColumnTemplate: function (row, colId, colDef) {
        var $htm,
            columnValue,
            innerTmpl,
            classes         = this.options.cssClassNames.tableCell + ' ' + (colDef.class || ''),
            ngClass         = colDef.ngclass || '',
            colExpression   = colDef.customExpression,
            ctId            = row.$$pk + '-' + colId,
            isCellCompiled  = false,
            formatPattern   = colDef.formatpattern,
            datePattern     = colDef.datepattern,
            isRowCompiled   = !!this.options.rowNgClass;

        $htm = $('<td class="' + classes + '" data-col-id="' + colId + '" style="text-align: ' + colDef.textAlignment + ';"></td>');

        columnValue = _.get(row, colDef.field) ;

        if (!formatPattern) {
            if (colDef.type === 'date' && this.options.dateFormat) {
                formatPattern = 'toDate';
                datePattern  = this.options.dateFormat;
            } else if (colDef.type === 'time' && this.options.timeFormat) {
                formatPattern = 'toDate';
                datePattern  = this.options.timeFormat;
            } else if (colDef.type === 'datetime' && this.options.dateTimeFormat) {
                formatPattern = 'toDate';
                datePattern  = this.options.dateTimeFormat;
            }
        }

        /*constructing the expression based on the choosen format options*/
        if (formatPattern && formatPattern !== "None" && !colExpression) {
            switch (formatPattern) {
            case 'toDate':
                if (datePattern) {
                    if (colDef.type === 'datetime') {
                        columnValue = columnValue ? moment(columnValue).valueOf() : undefined;
                    }
                    colExpression = "{{'" + columnValue + "' | toDate:'" + datePattern + "'}}";
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
            case 'numberToString':
                if (colDef.fractionsize) {
                    colExpression = "{{'" + columnValue + "' | numberToString:'" + colDef.fractionsize + "'}}";
                }
                break;
            case 'stringToNumber':
                colExpression = "{{'" + columnValue + "' | stringToNumber}}";
                break;
            case 'timeFromNow':
                colExpression = "{{'" + columnValue + "' | timeFromNow}}";
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
            $htm.attr('title', colExpression);
        }

        if (colExpression) {
            isCellCompiled = true;
            $htm.html(colExpression);
        } else {
            if (colDef.type !== 'custom') {
                columnValue = _.get(row, colDef.field);
                /* 1. Show "null" values as null if filterNullRecords is true, else show empty string.
                * 2. Show "undefined" values as empty string. */
                if ((this.options.filterNullRecords && columnValue === null) ||
                        _.isUndefined(columnValue)) {
                    columnValue = '';
                }
                $htm.attr('title', columnValue);
                //Add empty quote, to convert boolean false to 'false', so that value is rendered
                $htm.html("" + columnValue);
            } else {
                switch (colDef.field) {
                case 'checkbox':
                    innerTmpl = this._getCheckboxTemplate(row, colDef.isMultiSelectCol);
                    break;
                case 'radio':
                    innerTmpl = this._getRadioTemplate(row);
                    break;
                case 'rowOperations':
                    innerTmpl = '<span class="actions-column" data-identifier="actionButtons"></span>';
                    break;
                case 'rowIndex':
                    innerTmpl = row.index;
                    break;
                case 'none':
                    innerTmpl = '';
                    break;
                default:
                    innerTmpl = (_.isUndefined(columnValue) || columnValue === null) ? '' : columnValue;
                }
                $htm.html(innerTmpl);
            }
        }

        if (ngClass) {
            $htm.attr('data-ng-class', ngClass);
            isCellCompiled = true;
        }

        //If cell needs to be compiled and row is not compiled, call the compile function
        if (isCellCompiled && !isRowCompiled) {
            $htm.attr('data-compiled-template', ctId);
            this.compiledCellTemplates[ctId] = this.options.getCompiledTemplate($htm, row, colDef, true) || '';
        }
        return $htm;
    },
    //Get event related template for editable widget
    _getEventTemplate: function (colDef) {
        var events   = _.filter(_.keys(colDef), function (key) {return _.startsWith(key, 'on'); }),
            changeEvt,
            template = '';
        //On change events for the widget
        changeEvt = colDef.editWidgetType === 'autocomplete' ? 'onSubmit' : 'onChange';
        events = _.union(events, [changeEvt]);
        _.forEach(events, function (eventName) {
            template += ' ' + _.kebabCase(eventName) + '="';
            if (eventName === 'onSubmit' || eventName === 'onChange') {
                template += '_' + eventName + 'Field($event, $scope, newVal, oldVal);'
            }
            template += (colDef[eventName] || '') + '" ';
        });
        return template;
    },
    _getEditableTemplate: function ($el, colDef, cellText, rowId, operation) {
        var template,
            formName,
            checkedTmpl,
            placeholder   = _.isUndefined(colDef.placeholder) ? '' : colDef.placeholder,
            dataValue     = (WM.isDefined(cellText) && cellText !== null) ? cellText : undefined,
            eventTemplate = this._getEventTemplate(colDef),
            dataFieldName = ' data-field-name="' + colDef.field + '" ',
            disabled      = (operation !== 'new' && colDef.primaryKey && colDef.generator === 'assigned' && !colDef.relatedEntityName && !colDef.period) ? true : colDef.disabled,//In edit mode, set disabled for assigned columns
            disabledTl    = disabled ? ' disabled="' + disabled + '" ' : '',
            required      = colDef.required ? ' required="' + colDef.required + '" ' : '',
            showdropdownonExpression= colDef.showdropdownon ? ' showdropdownon="' + colDef.showdropdownon + '" ' : '',
            dataentrymodeExpression= colDef.dataentrymode ? ' dataentrymode="' + colDef.dataentrymode + '" ' : '',
            datePattern   = colDef.editdatepattern ? ((colDef.editWidgetType === 'time' ? 'timepattern' : 'datepattern') + '="' + colDef.editdatepattern + '" ') : '',
            properties    = disabledTl + dataFieldName + eventTemplate + required + datePattern,
            index         = colDef.index,
            limit         = colDef.limit ? ' limit="' + colDef.limit + '" ' : '',
            //If dataset is bound, set the dataset. Else, set the scopedataset.
            dataSetTl     = (colDef.isDataSetBound || colDef.isAutoCompleteDataSet) && !colDef.isDefinedData ? 'dataset="' + colDef.dataset + '"' : ' scopedataset="fullFieldDefs[' + index + '].dataset"';
        switch (colDef.editWidgetType) {
        case 'select':
            cellText = cellText || '';
            template =  '<wm-select ' + properties + dataSetTl + ' datafield="' + colDef.datafield + '" displayfield="' + colDef.displayfield + '" placeholder="' + placeholder + '"></wm-select>';
            break;
        case 'autocomplete':
        case 'typeahead':
            $el.addClass('datetime-wrapper');
            template =  '<wm-search ' + properties + dataSetTl + limit + ' datafield="' + colDef.datafield + '" displaylabel="' + colDef.displaylabel + '" searchkey="' +  colDef.searchkey + '" ' + (colDef.dataoptions ? ' dataoptions="fullFieldDefs[' + index + '].dataoptions"' : '') + ' type="autocomplete" placeholder="' + placeholder + '"></wm-search>';
            break;
        case 'date':
            $el.addClass('datetime-wrapper');
            template = '<wm-date ' + properties + ' placeholder="' + placeholder + '"' + showdropdownonExpression + dataentrymodeExpression + '></wm-date>';
            break;
        case 'time':
            $el.addClass('datetime-wrapper');
            template = '<wm-time ' + properties + ' placeholder="' + placeholder + '"'  + showdropdownonExpression + dataentrymodeExpression + '></wm-time>';
            break;
        case 'datetime':
            $el.addClass('datetime-wrapper');
            template = '<wm-datetime ' + properties + ' outputformat="yyyy-MM-ddTHH:mm:ss" placeholder="' + placeholder + '"'  + showdropdownonExpression + dataentrymodeExpression + '></wm-datetime>';
            break;
        case 'timestamp':
            $el.addClass('datetime-wrapper');
            template = '<wm-datetime ' + properties + ' placeholder="' + placeholder + '"'  + showdropdownonExpression + dataentrymodeExpression + '></wm-datetime>';
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
        if (WM.isDefined(dataValue)) {
            template = $(template);
            template.attr('datavalue', dataValue);
        }
        $el.addClass(colDef.editWidgetType + '-widget');
        return this.options.getCompiledTemplate(template, this.preparedData[rowId] || {}, colDef);
    },
    setHeaderConfigForDefaultFields: function (name) {
        if (_.isEmpty(this.options.headerConfig)) {
            return;
        }
        var fieldName = this.customColumnDefs[name].field;
        _.remove(this.options.headerConfig, {'field': fieldName});
        this.options.headerConfig.unshift({'field': fieldName, 'isPredefined': true});
    },
    setDefaultColsData: function (header) {
        //If columns are not present, do not add the default columns
        if (_.isEmpty(this.preparedHeaderData)) {
            return;
        }
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
                if (isDefined(text)) {
                    rowData[colDef.field] = text;
                } else if (fields.length > 1 && _.has(item, colDef.field)) {
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
            rowData.$$pk = i;
            data.push(rowData);
        });

        this.preparedData = data;
    },

    /* Select previously selected columns after refreshing grid data. */
    _reselectColumns: function () {
        var selectedColumns = [],
            self = this;
        //If enableColumnSelection is set to true, reselect the columns on data refresh
        if (this.gridHeader && this.options.enableColumnSelection) {
            selectedColumns = this.gridHeader.find('th.' + this.options.cssClassNames.selectedColumn);
            //Call the column selection handler on each of the selected columns
            if (selectedColumns.length) {
                selectedColumns.each(function () {
                    self.columnSelectionHandler(undefined, $(this));
                });
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
    //Populate row data with default data
    setDefaultRowData: function (rowData) {
        _.forEach(this.preparedHeaderData, function (colDef) {
            rowData[colDef.field] = colDef.defaultvalue;
        });
    },
    /* Inserts a new blank row in the table. */
    addNewRow: function (skipFocus, alwaysNewRow) {
        var rowId = this.gridBody.find('tr:visible').length || 99999, //Dummy value if rows are not there
            self = this,
            rowData = {},
            $row,
            $gridBody,
            $alwaysNewRow;

        if (!alwaysNewRow && $.isFunction(this.options.beforeRowInsert)) {
            this.options.beforeRowInsert();
        }

        $gridBody       = this.gridElement.find('tbody.app-datagrid-body');
        $alwaysNewRow    = $gridBody.find('tr.always-new-row');
        //Focus the new row if already present
        if ($alwaysNewRow.length) {
            this.setFocusOnElement(undefined, $alwaysNewRow);
            return;
        }

        rowData.index = this.options.startRowIndex + rowId;
        rowData.$$pk = rowId;
        if (this.options.editmode !== this.CONSTANTS.FORM && this.options.editmode !== this.CONSTANTS.DIALOG) {
            $row = $(this._getRowTemplate(rowData));
            if (!this.preparedData.length) {
                this.setStatus('ready', this.dataStatus.ready);
            }
            //Based on the form position, add new row at top or bottom
            if (this.options.formPosition === 'top') {
                $gridBody.prepend($row);
            } else {
                $gridBody.append($row);
            }
            this._appendRowActions($row, true, rowData);
            this.attachEventHandlers($row);
            //For quick edit, do not remove the delete button
            if (alwaysNewRow || this.options.editmode !== this.CONSTANTS.QUICK_EDIT) {
                $row.find('.delete-row-button').hide();
                //Hide the edit button for always new row
                if (alwaysNewRow) {
                    $row.find('.edit-row-button').hide()
                }
            }
            this._findAndReplaceCompiledTemplates();

            //For always show new row, make the row editable with default values
            if (alwaysNewRow) {
                this.setDefaultRowData(rowData);

                $row.addClass('always-new-row').addClass('row-editing');
                this.makeRowEditable($row, rowData, 'new');
            } else {
                $row.trigger('click', [undefined, {action: 'edit', operation: 'new', skipFocus: skipFocus}]);
            }

            this.updateSelectAllCheckboxState();
            this.addOrRemoveScroll();
            this.options.timeoutCall(function () {
                self.setColGroupWidths();
            }, 100);
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
        self.gridBody.find('tr.app-datagrid-row').each(function (index) {
            if (self.preparedData[index] && self.preparedData[index].selected) {
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
        var self        = this,
            headerCols  = this.options.isMobile ? this.gridElement.find('col') : this.gridHeaderElement.find('col'),
            bodyCols    = this.gridElement.find('col'),
            headerCells = this.options.showHeader ? this.gridContainer.find('th.app-datagrid-header-cell') : this.gridElement.find('tr.app-datagrid-row:first td'),
            colLength   = this.preparedHeaderData.length,
            scrollLeft  = this.gridElement.parent().prop('scrollLeft'); //Preserve the scroll left to keep the same scroll after setting width
        if (!headerCols.length && !headerCells.length) {
            return;
        }
        //Set the col spans for the header groups
        this._setColSpan(this.options.headerConfig);
        //First Hide or show the column based on the show property so that width is calculated correctly
        headerCells.each(function () {
            var id           = Number($(this).attr('data-col-id')),
                colDef       = self.preparedHeaderData[id],
                $headerCell  = self.gridContainer.find('th[data-col-id="' + id + '"]'),
                $tdCell      = self.gridElement.find('td.app-datagrid-cell[data-col-id="' + id + '"]'),
                definedWidth = colDef.width,
                $headerCol   = $(headerCols[id]),
                $bodyCol     = $(bodyCols[id]),
                width;
            if (!_.isUndefined(colDef.show) && !colDef.show) { //If show is false, set width to 0 to hide the column
                //Hide the header and column if show is false
                $headerCell.hide();
                $tdCell.hide();
                $headerCol.hide();
                $bodyCol.hide();
            } else {
                $headerCell.show();
                $tdCell.show();
                $headerCol.show();
                $bodyCol.show();
            }
            //If default width is set, reset the width so that correct width is set on reload
            if ($headerCol.length && $headerCol[0].style.width === '90px') {
                width = _.isUndefined(definedWidth) ? '' : definedWidth;
                $headerCol.css('width', width);
                $bodyCol.css('width', width);
            }
        });
        //setting the header col width based on the content width
        headerCells.each(function () {
            var $header      = $(this),
                id           = Number($header.attr('data-col-id')),
                colDef       = self.preparedHeaderData[id],
                definedWidth = colDef.width,
                width,
                tempWidth,
                $headerCol;
            if (!_.isUndefined(colDef.show) && !colDef.show) { //If show is false, set width to 0 to hide the column
                //Hide the header and column if show is false
                width = 0;
            } else {
                if ($header.hasClass('grid-col-small')) { //For checkbox or radio, set width as 30
                    width = 50;
                } else {
                    if (_.isUndefined(definedWidth) || definedWidth === '' || _.includes(definedWidth, '%')) {
                        $headerCol = $(headerCols[id]);
                        if ($headerCol.length) {
                            tempWidth = $headerCol[0].style.width;
                            if (tempWidth === '' || tempWidth === '0px' || tempWidth === '90px' || _.includes(tempWidth, '%')) { //If width is not 0px, width is already set. So, set the same width again
                                width = $header.width();
                                width = width > 90 ? ((colLength === id + 1) ? width - 17 : width) : 90; //columnSanity check to prevent width being too small and Last column, adjust for the scroll width
                            } else {
                                width = tempWidth;
                            }
                        }
                    } else {
                        width = definedWidth;
                    }
                }
            }
            $(headerCols[id]).css('width', width);
            $(bodyCols[id]).css('width', width);
        });
        this.gridElement.parent().prop('scrollLeft', scrollLeft);
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
                this.gridSearch.find('[data-element="dgSearchText"]').attr('placeholder', value);
                this.gridSearch.find('[data-element="dgSearchButton"]').attr('title', value);
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
            } else if (this.dataStatus.state === 'loading') {
                this.setStatus('loading');
            }
            break;
        case 'loadingicon':
            this.dataStatusContainer.find('i').removeClass().addClass(this.options.loadingicon);
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
        case 'messages':
            this.gridSearch && this.gridSearch.find('option.placeholder').text(value && value.selectField);
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
            this.setColGroupWidths();
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
        if ($input.length) { //If expression is html, return true
            return true;
        }
        return false;
    },
    /* Marks the first row as selected. */
    selectFirstRow: function (value, visible) {
        var $row,
            id;
        //If visible flag is true, select the first visible row item (Do not select the always new row)
        if (visible && this.gridElement.find('tBody').is(':visible')) {
            this.__setStatus();
            $row = this.gridElement.find('tBody tr:visible:not(.always-new-row):first');
        } else {
            $row = this.gridElement.find('tBody tr:not(.always-new-row):first');
        }
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
            $radio = $row.find('td input[rowSelectInput]:radio:not(:disabled)');
            $radio.prop('checked', selected);
            this.preparedData[rowId].checked = selected;
        }
        if (this.options.multiselect) {
            $checkbox = $row.find('td input[rowMultiSelectInput]:checkbox:not(:disabled)');
            $checkbox.prop('checked', selected);
            this.preparedData[rowId].checked = selected;
            this.updateSelectAllCheckboxState();
        } else {
            this._deselectPreviousSelection($row);
        }
    },

    /* Checks the header checkbox if all table checkboxes are checked, else unchecks it. */
    updateSelectAllCheckboxState: function () {
        if (!this.options.showHeader || !this.options.multiselect) {
            return;
        }
        //As rows visibility is checked, remove loading icon
        this.__setStatus();
        var $headerCheckbox = this.gridHeader.find('th.app-datagrid-header-cell input:checkbox'),
            $tbody = this.gridElement.find('tbody'),
            checkedItemsLength = $tbody.find('tr:visible input[rowMultiSelectInput]:checkbox:checked').length,
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
        var rowId,
            rowData,
            data,
            selected,
            self        = this,
            action      = options.action,
            $target     = $(e.target),
            isQuickEdit = this.options.editmode === this.CONSTANTS.QUICK_EDIT;
        function callRowSelectionEvents() {
            if (selected && $.isFunction(self.options.onRowSelect)) {
                self.options.onRowSelect(data, e);
            }
            if (!selected && $.isFunction(self.options.onRowDeselect)) {
                self.options.onRowDeselect(data, e);
            }
        }

        $row = $row || $target.closest('tr');

        if (action || (isQuickEdit && $target.hasClass('app-datagrid-cell') && !$row.hasClass('always-new-row'))) {
            //In case of advanced edit, Edit the row on click of a row
            options.action = options.action || 'edit';

            if (options.operation === 'new' || self.options.actionsEnabled.edit) {
                this.toggleEditRow(e, options);
            }

            if (options.skipSelect) {
                return;
            }
        }
        rowId = $row.attr('data-row-id');
        rowData = this.preparedData[rowId];
        data = this.options.data[rowId];
        selected = (rowData && rowData.selected) || false;
        if (!options.skipSingleCheck && (($row.hasClass('active') && !this.options.multiselect) || !rowData)) {
            if (!isQuickEdit) { //For quick edit, row will be in edit mode. So,, no need to call events.
                callRowSelectionEvents();
            }
            return;
        }
        selected = !selected;
        this.toggleRowSelection($row, selected);
        callRowSelectionEvents();
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
    closePopover: function() {
        //If the DataTable is in the popover, popover shouldn't be closed
        if (!this.element.closest('.app-popover').length) {
            //removes all the popovers
            $('.app-popover').remove();
        }
    },
    headerClickHandler: function (e) {
        var $th = $(e.target).closest('th.app-datagrid-header-cell'),
            id = $th.attr('data-col-id');
        //Closing the popovers if any present when clicked on header or while sorting
        this.closePopover();
        this.options.onHeaderClick(this.preparedHeaderData[id], e);
    },
    /* Handles column selection. */
    columnSelectionHandler: function (e, $headerCell) {
        if (e) {
            e.stopImmediatePropagation();
        }
        var $th = e ? $(e.target).closest('th.app-datagrid-header-cell') : $headerCell,
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
            },
            selectedClass = this.options.cssClassNames.selectedColumn;
        selected = !selected;
        colDef.selected = selected;
        $column.data('selected', selected);

        if (selected) {
            $column.addClass(selectedClass);
            $th.addClass(selectedClass);
            if ($.isFunction(this.options.onColumnSelect) && e) {
                this.options.onColumnSelect(colInfo, e);
            }
        } else {
            $column.removeClass(selectedClass);
            $th.removeClass(selectedClass);
            if ($.isFunction(this.options.onColumnDeselect) && e) {
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
        if (colDef.editWidgetType && colDef.editWidgetType !== 'upload') {
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
                if (!WM.isDefined(text) && (originalData === null || originalData === undefined)) {
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
    //Focus the active row
    focusActiveRow: function () {
        this.gridBody.find('tr.active').focus();
    },
    disableActions: function (val) {
        var $deleteBtns = this.gridBody.find('.delete-row-button'),
            $editBtns   =  this.gridBody.find('.edit-row-button');
        if (val) {
            //Disable edit and delete actions while editing a row
            $editBtns.addClass('disabled-action');
            $deleteBtns.addClass('disabled-action');
        } else {
            $editBtns.removeClass('disabled-action');
            $deleteBtns.removeClass('disabled-action');
        }
    },
    //Function to the first input element in a row
    setFocusOnElement: function (e, $el, skipDelay) {
        var $firstEl,
            $target = e && $(e.target),
            $focusEl;
        //If focused directly on the cell, focus the input in the cell
        if ($target && $target.hasClass('app-datagrid-cell')) {
            $firstEl = $target.find('input');
        } else {
            if (!$el) {
                $el = $target.closest('tr').find('td.cell-editing');
            } else if ($el.hasClass('app-datagrid-row')) {
                $el = $el.find('td.cell-editing');
            }

            $firstEl = $($el).first().find('input');
            if (!$firstEl.length) {
                $firstEl = $($el).first().find('textarea');
            }
            if (!$firstEl.length) {
                $firstEl = $($el).first().find('select');
            }
        }
        //Focus and select the first element
        if ($firstEl.length) {
            $focusEl = $firstEl.first();
            if (skipDelay) {
                $focusEl.focus();
                $focusEl.select();
            } else {
                this.options.timeoutCall(function () {
                    $focusEl.focus();
                    $focusEl.select();
                });
            }
        }
    },
    removeNewRow: function ($row) {
        this.disableActions(false);
        this._setGridEditMode(false);

        //Don't remove the always new row
        if ($row.hasClass('always-new-row')) {
            return;
        }

        $row.attr('data-removed', true);
        $row.remove();
        if (!this.preparedData.length) {
            this.setStatus('nodata', this.dataStatus.nodata);
        }
        this.addOrRemoveScroll();
    },
    //Method to save a row which is in editable state
    saveRow: function (callBack) {
        this.gridBody.find('tr.row-editing:not(.always-new-row)').each(function () {
            $(this).trigger('click', [undefined, {action: 'save', skipSelect: true, noMsg: true, success: callBack}]);
        });
    },
    //Method to make row editable with widgets
    makeRowEditable: function ($row, rowData, operation) {
        var self                = this,
            $originalElements   = $row.find('td.app-datagrid-cell'),
            rowId               = parseInt($row.attr('data-row-id'), 10),
            $editableElements;
        $originalElements.each(function () {
            var $el      = $(this),
                cellText = $el.text(),
                id       = $el.attr('data-col-id'),
                colDef   = self.preparedHeaderData[id],
                value,
                editableTemplate;
            if (!colDef.readonly) {
                value = _.get(rowData, colDef.field);
                editableTemplate = self._getEditableTemplate($el, colDef, value, rowId, operation);
                if (!(colDef.customExpression || colDef.formatpattern)) {
                    $el.addClass('cell-editing').html(editableTemplate).data('originalText', cellText);
                } else {
                    if (self._isCustomExpressionNonEditable(colDef.customExpression, $el)) {
                        $el.addClass('cell-editing editable-expression').data('originalValue', {'template': colDef.customExpression, 'rowData': _.cloneDeep(rowData), 'colDef': colDef});
                    }
                    $el.addClass('cell-editing editable-expression').html(editableTemplate).data('originalText', cellText);
                }
                if (colDef.required) {
                    $el.addClass('required-field form-group');
                }
            }
        });

        $editableElements = $row.find('td.cell-editing');
        $editableElements.on('click', function (e) {
            e.stopPropagation();
        });
        $editableElements.on('keydown', function (e) {
            //To prevent up and down arrows, navigating to other rows in edit mode
            if (e.which === 38 || e.which === 40) {
                e.stopPropagation();
            }
        });
    },
    _isNewRow: function ($row) {
        var rowId = parseInt($row.attr('data-row-id'), 10);
        return rowId >= this.preparedData.length || $row.hasClass('always-new-row');
    },
    /* Toggles the edit state of a row. */
    toggleEditRow: function (e, options) {
        options = options || {};
        if (e) {
            e.stopPropagation();
        }
        //Closing the popovers if clicked on any row for Quick edit
        this.closePopover();
        var $row = options.$row || $(e.target).closest('tr'),
            $editButton = $row.find('.edit-row-button'),
            $cancelButton = $row.find('.cancel-edit-row-button'),
            $saveButton = $row.find('.save-edit-row-button'),
            $deleteButton = $row.find('.delete-row-button'),
            rowData = _.cloneDeep(this.options.data[$row.attr('data-row-id')]) || {},
            self = this,
            rowId = parseInt($row.attr('data-row-id'), 10),
            action,
            isNewRow,
            $editableElements,
            isDataChanged = false,
            isValid,
            $requiredEls,
            advancedEdit = self.options.editmode === self.CONSTANTS.QUICK_EDIT;

        //On success of update or delete
        function onSaveSuccess(skipFocus, error) {
            if ($.isFunction(options.success)) {
                options.success(skipFocus, error);
            }
            if (!advancedEdit || self.options.actionsEnabled.edit) {
                self.focusActiveRow();
            }
        }

        if ($row.attr('data-removed') === 'true') {
            //Even after removing row, focus out is triggered and edit is called. In this case, return here
            return;
        }
        //Select the current edited row
        if (options.selectRow) {
            this.selectRow(rowData, true);
        }
        e       = e || {};
        e.data  = e.data  || {};
        action  = e.data.action || options.action;
        if (action === 'edit') {
            if (advancedEdit && self.gridBody.find('tr.row-editing:not(.always-new-row)').length) {
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
            //For new operation, set the rowdata from the default values
            if (options.operation === 'new') {
                self.setDefaultRowData(rowData);
            }
            //Event for on before form render. User can update row data here.
            if ($.isFunction(this.options.onBeforeFormRender)) {
                isValid = this.options.onBeforeFormRender(rowData, e, options.operation || action);
                if (isValid === false) {
                    return;
                }
            }
            this._setGridEditMode(true);
            this.disableActions(true);
            $deleteButton.removeClass('disabled-action');
            this.makeRowEditable($row, rowData, options.operation);
            // Show editable row.
            $editButton.addClass('hidden');
            $cancelButton.removeClass('hidden');
            $saveButton.removeClass('hidden');
            $editableElements = $row.find('td.cell-editing');
            if (!options.skipFocus && $editableElements) {
                self.setFocusOnElement(e, $editableElements);
            }
            //Event for on before form render. User can access form widgets here.
            if ($.isFunction(this.options.onFormRender)) {
                this.options.onFormRender($row, e, options.operation || action);
            }
        } else {
            $editableElements = $row.find('td.cell-editing');
            isNewRow = self._isNewRow($row);
            if (action === 'save') {

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
                            _.set(rowData, colDef.field, _.get(document.forms, [$el.attr('form-name'), colDef.field, 'files', 0]));
                        } else {
                            text = ((fields.length === 1 || isNewRow) && text === '') ? undefined : text; //Set empty values as undefined
                            if (WM.isDefined(text)) {
                                text = text === 'null' ? null : text; //For select, null is returned as string null. Set this back to ull
                                if (text === null) {
                                    if (fields.length > 1) {
                                        _.set(rowData, fields[0], text); //For related fields, set the object to null
                                    } else {
                                        if (!isNewRow) {
                                            _.set(rowData, colDef.field, ''); //Set to empty for normal fields
                                        }
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

                    if (isNewRow && advancedEdit && _.isEmpty(rowData)) {
                        self.removeNewRow($row);
                        if ($.isFunction(options.success)) {
                            options.success(false, undefined, true);
                        }
                        return;
                    }

                    $requiredEls = $editableElements.find('.ng-invalid-required');
                    //If required fields are present and value is not filled, return here
                    if ($requiredEls.length > 0) {
                        $requiredEls.addClass('ng-touched');
                        if ($.isFunction(options.success)) {
                            options.success(false, true);
                        }
                        return;
                    }

                    if (isNewRow) {
                        if ($.isFunction(this.options.onBeforeRowInsert)) {
                            isValid = this.options.onBeforeRowInsert(rowData, e, options);
                            if (isValid === false) {
                                return;
                            }
                        }
                        this.options.onRowInsert(rowData, e, onSaveSuccess, options);
                    } else {
                        if ($.isFunction(this.options.onBeforeRowUpdate)) {
                            isValid = this.options.onBeforeRowUpdate(rowData, e, options);
                            if (isValid === false) {
                                return;
                            }
                        }
                        this.options.afterRowUpdate(rowData, e, onSaveSuccess, options);
                    }
                } else {
                    this.cancelEdit($row);
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
            }
        }
        this.addOrRemoveScroll();
    },
    cancelEdit: function ($row) {
        var self = this,
            $editableElements = $row.find('td.cell-editing'),
            $cancelButton     = $row.find('.cancel-edit-row-button'),
            $saveButton       = $row.find('.save-edit-row-button'),
            $editButton       = $row.find('.edit-row-button');
        this.disableActions(false);
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
                    $el.html(originalValue);
                }
            }
        });
        $editButton.removeClass('hidden');
        $cancelButton.addClass('hidden');
        $saveButton.addClass('hidden');
        this._setGridEditMode(false);
    },
    //Function to close the current editing row
    closeEditedRow: function() {
      var $row = this.gridBody.find('tr.row-editing');
      if ($row.length) {
          //If new row, remove the row. Else, cancel the row edit
          if (this._isNewRow($row)) {
              this.removeNewRow($row);
          } else {
              this.cancelEdit($row);
          }
      }
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
                    $el.html(originalValue);
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
            isNewRow = this._isNewRow($row),
            className,
            isActiveRow,
            isValid,
            options = {},
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
        /* calling onbeforerowDelete callback function.*/
        if($.isFunction(this.options.onBeforeRowDelete)) {
            isValid = this.options.onBeforeRowDelete(rowData, e, options);
            if (isValid === false) {
                return;
            }
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
            }, options);
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
                $(this).find('input[rowSelectInput]:radio').prop('checked', false);
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
        this._setGridEditMode(false);
        this.closeEditedRow();
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
    //Reset new row data
    resetNewRow: function ($row) {
        var rowData   = {},
            self      = this;

        self.setDefaultRowData(rowData);

        //Set the default values for widgets in the row
        $row.find('[data-field-name]').each(function () {
            var $input = WM.element(this),
                fieldName = $input.attr('data-field-name');
            _.set($input.isolateScope(), 'datavalue', rowData[fieldName]);
        });
        //Remove ng touched classes
        $row.find('.ng-touched').removeClass('ng-touched');
        self.options.safeApply();
        self.setFocusOnElement(undefined, $row, true);
    },
    // Handles keydown event on row items.
    onKeyDown: function (event) {
        var $target   = $(event.target),
            $row      = $target.closest('tr'),
            self      = this,
            quickEdit = this.options.editmode === this.CONSTANTS.QUICK_EDIT,
            isNewRow;
        if (this.Utils.isDeleteKey(event)) { //Delete Key
            //For input elements, dont delete the row. If delete button is not present, dont allowe deleting by keyboard shortcut
            if (!this.options.actionsEnabled.delete || $target.is('input') || $target.hasClass('form-control')) {
                return;
            }
            this.deleteRow(event);
            return;
        }
        if (event.which === 27) { //Escape key
            isNewRow = this._isNewRow($row);
            //On Escape, cancel the row edit
            if (isNewRow && $row.hasClass('always-new-row')) {
                $target.blur();
                self.resetNewRow($row);
            } else {
                $row.trigger('click', [undefined, {action: 'cancel'}]);
            }

            if (!isNewRow) {
                $row.focus();
            }
            return;
        }
        if (event.which === 13) { //Enter key
            if (quickEdit && $target.hasClass('app-datagrid-row') && !$target.hasClass('row-editing')) {
                $row.trigger('click', [undefined, {action: 'edit'}]);
            } else {
                //On click of enter while inside a widget in editing row, save the row
                if ($row.hasClass('row-editing') && $target.closest('[data-field-name]').length) {
                    $target.blur(); //Blur the input, to update the model
                    self.toggleEditRow(event, {
                        'action'  : 'save',
                        'success' : function (skipFocus, error) {
                            //On error, focus the same field. Else, focus the row
                            if (error) {
                                $target.focus();
                            } else {
                                self.focusActiveRow();
                            }
                        }
                    });
                } else {
                    $row.trigger('click');
                }
            }
            //Stop the enter keypress from submitting any parent form. If target is button, event should not be stopped as this stops click event on button
            if (!$target.is('button')) {
                event.stopPropagation();
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
            rowID = direction === 'down' ? ++rowID : --rowID;
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

        //For always new row, dont trigger the edit action
        if ($nextRow.hasClass('always-new-row')) {
            if (self.options.formPosition !== 'top' || $row.hasClass('always-new-row')) {
                self.addNewRow(skipFocus);
            }
        } else if ($nextRow.length) {
            $nextRow.trigger('click', [undefined, {action: 'edit', skipFocus: skipFocus, skipSelect: self.options.multiselect}]);
        } else if (self.options.actionsEnabled.new) {
            self.addNewRow(skipFocus);
        }
    },
    //Method to check if the docus is on last column
    isLastColumn: function ($target) {
        var $cell = $target.closest('td.app-datagrid-cell'),
            $editCells;

        if ($cell.is(':last-child')) {
            return true;
        }

        if ($cell.hasClass('cell-editing')) {
            //Find and compare the last editable column which is not disabled
            $editCells = $cell.closest('tr.app-datagrid-row').find('.cell-editing').has('> :not([disabled="disabled"])');
            return $cell.attr('data-col-id') === $editCells.last().attr('data-col-id');
        }
        return false;
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
            if ((this.options.editmode !== this.CONSTANTS.FORM && this.options.editmode !== this.CONSTANTS.DIALOG) || (rowOperationsCol && _.includes(rowOperationsCol.operations, 'update'))) {
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
                    $relatedTarget = $(e.relatedTarget),
                    invalidTargets = '.row-editing:not(".always-new-row"), .row-action-button, .app-datagrid-cell, .caption';
                //Check if the focus out element is outside the grid or some special elements
                function isInvalidTarget() {
                    if (!$relatedTarget.closest('.app-grid').length) {
                        return true;
                    }
                    return $relatedTarget.is(invalidTargets);
                }

                //If focus is on the same row, return here
                if ($relatedTarget.is('tr')) {
                    if ($relatedTarget.attr('data-row-id') === $row.attr('data-row-id')) {
                        return;
                    }
                }

                //Save the row on last column of the data table. If class has danger, confirm dialog is opened, so dont save the row. Do not save the row if focus is out of input file.
                if (!self.isLastColumn($target, $relatedTarget) || $row.hasClass('danger') || e.relatedTarget === null || $target.hasClass('file-upload')) {
                    return;
                }
                //If focusout is because of input element or row action or current row, dont save the row
                if ($relatedTarget.attr('focus-target') === '' || isInvalidTarget()) {
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
            widgetName  = ' name="' + this.options.name + '_filter_' + fieldName + '"',
            timeFormat  = this.options.timeFormat || 'hh:mm:ss a',
            template,
            filterOptions;
        widget = widget === 'number' ? 'text' : widget;
        widget = widget === 'autocomplete' ? 'search' : widget;
        template =  '<wm-' + widget + widgetName + ' placeholder="' + placeholder + '" scopedatavalue="rowFilter[\'' + fieldName + '\'].value" on-change="onRowFilterChange(\'' + fieldName + '\')" disabled="{{emptyMatchModes.indexOf(rowFilter[\'' + fieldName + '\'].matchMode) > -1}}"';
        switch (field.filterwidget) {
        case 'number':
            template += ' type="number" ';
            break;
        case 'select':
            if (field._isLiveVariable) {
                template += ' scopedataset="fullFieldDefs[' + field.index + '].__filterdataset" orderby="' + fieldName + ':asc"';
            } else if (field._isFilterDataSetBound) {
                template += ' dataset="' + field.filterdataset + '" datafield="' + field.filterdatafield + '" displayfield="' + field.filterdisplayfield + '"';
            } else {
                template += ' dataset="' + this.options.getBindDataSet() + '" datafield="' + fieldName + '" displayfield="' + fieldName + '" orderby="' + fieldName + ':asc"';
            }
            break;
        case 'autocomplete':
            if (field._isLiveVariable) {
                filterOptions = field.filterdataoptions;
                template += ' dataset="' + this.options.getBindDataSet() + '" dataoptions="fullFieldDefs[' + field.index + '].filterdataoptions" datafield="' + filterOptions.aliasColumn + '" searchkey="' + filterOptions.distinctField + '" displaylabel="' + filterOptions.aliasColumn + '"';
            } else if (field._isFilterDataSetBound) {
                template += ' dataset="' + field.filterdataset + '"  datafield="' + field.filterdatafield + '" searchkey="' + field.filtersearchkey + '" displaylabel="' + field.filterdisplaylabel + '" ';
            } else {
                template += ' dataset="' + this.options.getBindDataSet() + '"  datafield="' + fieldName + '" searchkey="' + fieldName + '" displaylabel="' + fieldName + '" orderby="' + fieldName + ':asc"';
            }
            template += ' type="autocomplete" on-submit="onRowFilterChange(\'' + fieldName + '\')"';
            break;
        case 'time':
            template += ' timepattern="' + timeFormat + '" ';
            break;
        }
        template += '></wm-' + widget + '>';
        return template;
    },
    //Generate the row level filter
    _renderRowFilter: function () {
        var htm            = '<tr class="filter-row">',
            self           = this,
            $headerElement = (this.options.isMobile && !this.options.showHeader) ? this.gridElement : this.gridHeaderElement,
            compiledFilterTl;
        $headerElement.find('.filter-row').remove();
        this.preparedHeaderData.forEach(function (field, index) {
            var fieldName = field.field,
                widget    = field.filterwidget || 'text';
            if (!field.searchable) {
                htm += '<th data-col-id="' + index + '"></th>';
                return;
            }
            htm += '<th data-col-id="' + index + '">' +
                        '<span class="input-group ' + widget + '">' +
                            self._getFilterWidgetTemplate(field) +
                            '<span class="input-group-addon filter-clear-icon" ng-if="showClearIcon(\'' + fieldName + '\')"><button class="btn-transparent btn app-button" type="button" ng-click="clearRowFilter(\'' + fieldName + '\')"><i class="app-icon wi wi-clear"></i></button></span>' +
                            '<span class="input-group-addon" uib-dropdown dropdown-append-to-body>' +
                                '<button class="btn-transparent btn app-button" type="button"  uib-dropdown-toggle><i class="app-icon wi wi-filter-list"></i></button>' +
                                '<ul class="matchmode-dropdown dropdown-menu" uib-dropdown-menu> <li ng-repeat="matchMode in matchModeTypesMap[\'' + field.type + '\' || \'string\']" ng-class="{active: matchMode === (rowFilter[\'' + fieldName + '\'].matchMode || matchModeTypesMap[\'' + field.type + '\' || \'string\'][0])}"><a href="javascript:void(0);" ng-click="onFilterConditionSelect(\'' + fieldName + '\', matchMode)">{{matchModeMsgs[matchMode]}}</a></li> </ul>' +
                            '</span>' +
                        '</span>' +
                    '</th>';
        }, this);
        htm += '</tr>';
        compiledFilterTl = this.options.compileTemplateInGridScope(htm);
        if (this.options.showHeader) {
            this.gridHeader.append(compiledFilterTl);
        } else {
            if (this.options.isMobile) {
                $headerElement.append($('<thead></thead>').append(compiledFilterTl));
            } else {
                $headerElement.append('<thead></thead>').append(compiledFilterTl);
            }
        }
        this.gridSearch = $headerElement.find('.filter-row');
    },
    /* Renders the table header. */
    _renderHeader: function () {
        var headerTemplate = this._getHeaderTemplate(),
            $colgroup      = headerTemplate.colgroup,
            self           = this,
            $header;
        /*On scroll of the content table, scroll the header*/
        this.gridElement.parent().scroll(function () {
            self.gridHeaderElement.parent().prop('scrollLeft', this.scrollLeft);
        });
        if (!this.options.showHeader) {
            this.gridHeaderElement.append($colgroup);
            this.gridElement.prepend($colgroup.clone());
            return;
        }
        $header   = headerTemplate.header;
        function toggleSelectAll(e) {
            var $checkboxes = $('tbody tr:visible td input[rowMultiSelectInput]:checkbox', self.gridElement),
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
                    self.options.redrawWidgets();
                }
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
            self = this,
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
                var clsAttr    = 'row-action row-action-button app-button btn ' + def.class,
                    ngShowAttr = '',
                    ngDisabled = def.disabled ? ' ng-disabled="' + _.replace(def.disabled, 'bind:', '') + '" ' : '';
                if (def.show === 'true' || def.show === 'false') {
                    clsAttr += def.show === 'true' ? '' : ' ng-hide ';
                } else if (_.includes(def.show, 'bind:')) {
                    ngShowAttr = _.replace(def.show, 'bind:', '');
                }
                //Adding 'edit' class if at least one of the action is 'editRow()'
                if (_.includes(def.action, 'editRow()')) {
                    clsAttr += ' edit edit-row-button ';
                    self.options.actionsEnabled.edit = true;
                } else if (_.includes(def.action, 'deleteRow()')) {
                    clsAttr += ' delete delete-row-button ';
                    self.options.actionsEnabled.delete = true;
                }

                actionsTemplate += '<button type="button" data-action-key="' + def.key + '" class="' + clsAttr + '" title="' + generateBindExpr(def.title) + '" ' + (ngShowAttr ? ' ng-show="' + ngShowAttr + '"' : '') + (def.tabindex ? (' tabindex="' + def.tabindex + '"') : '') + ngDisabled + '>'
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
                self.options.actionsEnabled.edit = true;
                actionsTemplate += '<button type="button" class="row-action-button btn app-button btn-transparent edit edit-row-button" title="Edit Row"><i class="wi wi-pencil"></i></button> ' +
                    saveCancelTemplate;
            }
            if (_.includes(rowOperationsCol.operations, 'delete')) {
                self.options.actionsEnabled.delete = true;
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
        this.__setStatus();
        //Add new row, if always show new row is present for quick edit
        if ( this.options.editmode === this.CONSTANTS.QUICK_EDIT && this.options.showNewRow) {
            this.addNewRow(false, true);
        }
        this.setColGroupWidths();
        if ($.isFunction(this.options.onDataRender)) {
            this.options.onDataRender();
        }
        if (this.options.selectFirstRow) {
            if (this.options.multiselect) {
                //Set selectFirstRow to false, to prevent first item being selected in next page
                this.options.selectFirstRow = false;
            }
            this.selectFirstRow(true, true);
        }
    },

    /* Renders the table container. */
    _render: function () {
        if (!this.tableId) {
            this.tableId = this.Utils.generateGuid();
        }
        var statusContainer =
                '<div class="overlay" style="display: none;">' +
                    '<div class="status"><i class="' + this.options.loadingicon + '"></i><span class="message"></span></div>' +
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
        var loadingIndicator = this.dataStatusContainer.find('i'),
            state            = this.dataStatus.state;
        this.dataStatusContainer.find('.message').text(this.dataStatus.message);
        if (state === 'loading') {
            loadingIndicator.removeClass('ng-hide');
        } else {
            loadingIndicator.addClass('ng-hide');
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
        var $newRow;
        //If state is nodata and always new row is present, change state to ready
        if (state === 'nodata') {
            $newRow = this.gridElement && this.gridElement.find('tbody.app-datagrid-body tr.always-new-row');
            state = ($newRow && $newRow.length) ? 'ready' : state;
        }

        this.dataStatus.state   = state;
        this.options.setGridState(state);
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
    setColumnProp: function (fieldName, property, val, isGroup) {
        var $col;
        switch (property) {
        case 'displayName':
            if (isGroup) {
                $col = this.gridHeader.find('th[data-col-group="' + fieldName + '"]');
            } else {
                $col = this.gridHeader.find('th[data-col-field="' + fieldName + '"]');
            }
            $col.attr('title', val);
            $col.find('.header-data').html(val);

            //Change the display name in the search filter options
            if (this.options.filtermode === this.CONSTANTS.SEARCH && this.gridSearch) {
                this.gridSearch.find('select option[value="' + fieldName + '"]').text(val);
            }
            break;
        }
    },

    _destroy: function () {
        this.element.text('');
        window.clearTimeout(this.refreshGridTimeout);
    }
});
