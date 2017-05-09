/*global WM, Event, _, document*/
/*Directive for richtexteditor */

WM.module('wm.widgets.form')
    .run(['$templateCache', function ($tc) {
        'use strict';
        $tc.put('template/widget/richtexteditor.html',
            '<div class="app-richtexteditor clearfix" init-widget has-model apply-styles role="input">' +
                '<div text-angular ng-model="_model_" ta-disabled="readonly" placeholder="Enter text"></div>' +
                '<div ta-bind ng-model="_model_" class="ta-preview" ng-if="showpreview"></div>' +
                '<input class="model-holder ng-hide" ng-disabled="disabled">' +
            '</div>'
            );
        $tc.put('template/widget/richtexteditor/table.html', '<div wm-richtexteditor-table on-select="onSelect(selectedRow)"></div>');
    }])
    .directive('wmRichtexteditor', [
        'PropertiesFactory',
        '$templateCache',
        'WidgetUtilService',
        '$injector',
        'Utils',

        function (PropertiesFactory, $tc, WidgetUtilService, $injector, Utils) {
            'use strict';

            var toolbarConfig = {},
                isConfigLoaded = false;

            //creates the table markup
            function createTableMarkup(tableParams) {
                if (WM.isNumber(tableParams.rows) && WM.isNumber(tableParams.columns)
                        && tableParams.rows > 0 && tableParams.columns > 0) {
                    var table = "<table class='table table-bordered custom-table'><tbody contenteditable='false'>",
                        idxRow,
                        idxCol,
                        row;
                    for (idxRow = 0; idxRow < tableParams.rows; idxRow++) {
                        row = "<tr>";
                        for (idxCol = 0; idxCol < tableParams.columns; idxCol++) {
                            row += "<td contenteditable='true'>&nbsp;</td>";
                        }
                        table += row + "</tr>";
                    }
                    return table + "</tbody></table>";
                }
            }

            //inserts the content into the rich text editor
            function insertIntoTextEditor(scope, content) {
                scope.$editor().wrapSelection('insertHtml', content);
            }

            function performTableOperation(el, evt, focusCellMethod) {
                var nodeName,
                    isTableType,
                    self = this,
                    tableMethods = {
                        'next'  : 'focusNextCell',
                        'prev'  : 'focusPrevCell',
                        'delete': 'deleteRow'
                    },
                    tableNodes = ['TR', 'TD', 'TABLE'];
                if (!el) {
                    return;
                }
                nodeName = el.nodeName;
                if (nodeName === 'FONT' || nodeName === '#text') {
                    el = el.parentNode;
                    isTableType = performTableOperation.call(this, el, evt, focusCellMethod);
                } else {
                    if (_.includes(tableNodes, nodeName)) {
                        isTableType = true;
                        self[tableMethods[focusCellMethod]](el);
                        evt.preventDefault();
                    }
                }
                return isTableType;
            }

            function closeAllPopups(tools, ignorePopup) {
                var backgroundColor = _.get(tools, 'backgroundColor'),
                    fontColor = _.get(tools, 'fontColor'),
                    insertTable = _.get(tools, 'insertTable'),
                    formatHeader = _.get(tools, 'formatHeader');
                //close other colorpickers
                if (ignorePopup !== 'backgroundColor' && _.get(backgroundColor, 'isColorPickerOpen')) {
                    backgroundColor.isOpen = false;
                    backgroundColor.$element.find('.colorpicker').removeClass('colorpicker-visible');
                }
                if (ignorePopup !== 'fontColor' && _.get(fontColor, 'isColorPickerOpen')) {
                    fontColor.isOpen = false;
                    fontColor.$element.find('.colorpicker').removeClass('colorpicker-visible');
                }
                if (ignorePopup !== 'insertTable' && _.get(insertTable, 'popoverIsOpen')) {
                    insertTable.popoverIsOpen = false;
                }
                if (ignorePopup !== 'formatHeader' && _.get(formatHeader, 'isOpen')) {
                    formatHeader.isOpen = false;
                }
            }

            //sets the toolbar config to include new plugins
            function setToolBarConfig(taOptions, $el) {
                toolbarConfig.insertTable = {
                    'display': "<div class='toolbar-plugin' ng-init='templateUrl=\"template/widget/richtexteditor/table.html\";'>" +
                        "<button type='button' uib-popover-template='templateUrl' popover-placement='bottom' popover-is-open='popoverIsOpen' ng-click='popoverIsOpen = !popoverIsOpen' class='btn btn-default table-insert' ng-disabled='showHtml()'>" +
                        "<i class='fa fa-table'></i>" +
                        "</button></div>",
                    'iconclass': 'fa fa-table',
                    'tooltiptext': 'Insert table',
                    'action': function (promise, restoreSelection) {
                        //close other popups
                        closeAllPopups(this.$parent.tools, 'insertTable');
                        promise.resolve();
                    },
                    'onSelect':  function (result) {
                        var _parent = this.$parent;
                        _parent.popoverIsOpen = false;
                        insertIntoTextEditor(this, createTableMarkup(result));
                        this.$root.$safeApply(_parent);
                    }
                };
                toolbarConfig.fontColor   = {
                    'display': "<div class='toolbar-plugin colorpicker' ng-init='colorPicker.foreColor=\"#333\"'>" +
                        "<button type='button' ng-style='{borderBottomColor:colorPicker.foreColor}' colorpicker colorpicker-is-open='isColorPickerOpen' colorpicker-parent='true' ng-model='colorPicker.foreColor' class='btn btn-default colorpicker-togglebtn' ng-disabled='showHtml()'>" +
                        "<i class='fa fa-font'></i>" +
                        "</button></div>",
                    'action': function (promise, restoreSelection) {
                        var backgroundPicker = _.get(this.$parent.tools, 'backgroundColor'),
                            tablePopover = _.get(this.$parent.tools, 'insertTable');
                        closeAllPopups(this.$parent.tools, 'fontColor');
                        if (this.isOpen) {
                            this.$element.find('.colorpicker').removeClass('colorpicker-visible');
                        }
                        this.isOpen = !this.isOpen;
                        if (!this.colorPicker || !this.colorPicker.foreColor) {
                            return;
                        }
                        return this.$editor().wrapSelection('foreColor', this.colorPicker.foreColor);
                    }
                };
                toolbarConfig.backgroundColor = {
                    'display': "<div class='toolbar-plugin colorpicker'  ng-init='colorPicker.backColor=\"#333\"'>" +
                        "<button type='button' ng-style='{borderBottomColor:colorPicker.backColor}' colorpicker colorpicker-is-open='isColorPickerOpen' colorpicker-parent='true' ng-model='colorPicker.backColor' class='btn btn-default colorpicker-togglebtn' ng-disabled='showHtml()'>" +
                        "<i class='fa fa-paint-brush'></i>" +
                        "</button>" +
                        "</div>",
                    'action': function(promise, restoreSelection) {
                        var fontColorPicker = _.get(this.$parent.tools, 'fontColor'),
                            tablePopover = _.get(this.$parent.tools, 'insertTable');
                        closeAllPopups(this.$parent.tools, 'backgroundColor');
                        if (this.isOpen) {
                            this.$element.find('.colorpicker').removeClass('colorpicker-visible');
                        }
                        this.isOpen = !this.isOpen;
                        if (!this.colorPicker || !this.colorPicker.backColor) {
                            return;
                        }
                        return this.$editor().wrapSelection('backColor', this.colorPicker.backColor);
                    }
                };
                toolbarConfig.fontName = {
                    'display': "<div class='toolbar-plugin fontname-plugin' uib-dropdown is-open='isOpen'>" +
                        "<button class='btn btn-default' type='button' uib-dropdown-toggle ng-disabled='showHtml()'><i class='fa fa-font'></i><i class='fa fa-caret-down'></i></button>" +
                        "<ul class='font-list' uib-dropdown-menu role='menu'><li role='menuitem' ng-repeat='font in options'><button class='btn btn-default' style='font-family: {{font.css}};' type='button' ng-click='selectFont($event, font.css)'>{{font.name}}</button></li></ul></div>",
                    'action': function (promise, restoreSelection) {
                        promise.resolve();
                        closeAllPopups(this.$parent.tools, 'fontName');
                    },
                    'selectFont': function(event, font) {
                        event.stopPropagation();
                        var _parent = this.$parent;
                        _parent.$editor().wrapSelection('fontName', font);
                        _parent.isOpen = false;
                    },
                    'options': [
                        { name: 'Sans-Serif', css: 'Arial, Helvetica, sans-serif' },
                        { name: 'Serif', css: "'times new roman', serif" },/* TODO:
                        { name: 'Wide', css: "'arial black', sans-serif" },
                        { name: 'Narrow', css: "'arial narrow', sans-serif" },
                        { name: 'Comic Sans MS', css: "'comic sans ms', sans-serif" },*/
                        { name: 'Courier New', css: "'courier new', monospace" },
                        { name: 'Garamond', css: 'garamond, serif' },
                        { name: 'Georgia', css: 'georgia, serif' },
                        { name: 'Tahoma', css: 'tahoma, sans-serif' },/* TODO:
                        { name: 'Trebuchet MS', css: "'trebuchet ms', sans-serif" },
                        { name: "Helvetica", css: "'Helvetica Neue', Helvetica, Arial, sans-serif" },
                        { name: 'Verdana', css: 'verdana, sans-serif' },*/
                        { name: 'Proxima Nova', css: 'proxima_nova_rgregular' }
                    ]
                };
                toolbarConfig.fontSize = {
                    'display': "<div class='toolbar-plugin fontname-plugin' uib-dropdown is-open='isOpen'>" +
                        "<button class='btn btn-default' type='button' uib-dropdown-toggle ng-disabled='showHtml()'><i class='fa fa-text-height'></i><i class='fa fa-caret-down'></i></button>" +
                        "<ul uib-dropdown-menu class='fontsize-list' role='menu'><li role='menuitem' ng-repeat='o in options'><button class='btn btn-default' style='font-family: {{$parent.$parent.tools.fontName.font}};font-size: {{o.css}};' type='button' ng-click='selectSize($event, o.value)'>{{o.name}}</button></li></ul>" +
                        "</div>",
                    'action': function (promise, restoreSelection) {
                        promise.resolve();
                        closeAllPopups(this.$parent.tools, 'fontSize');
                    },
                    'selectSize': function (event, size) {
                        event.stopPropagation();
                        var _parent = this.$parent;
                        _parent.$editor().wrapSelection('fontSize', parseInt(size));
                        _parent.isOpen = false;
                    },
                    'options': [
                        { name: 'xx-small', css: 'xx-small', value: 1 },
                        { name: 'x-small', css: 'x-small', value: 2 },
                        { name: 'small', css: 'small', value: 3 },
                        { name: 'medium', css: 'medium', value: 4 },
                        { name: 'large', css: 'large', value: 5 },
                        { name: 'x-large', css: 'x-large', value: 6 },
                        { name: 'xx-large', css: 'xx-large', value: 7 }
                    ]
                };
                toolbarConfig.formatHeader = {
                    'display': "<div class='toolbar-plugin formatheader-plugin' uib-dropdown is-open='isOpen'>" +
                        "<button class='btn btn-default active' type='button' uib-dropdown-toggle ng-disabled='showHtml()'><span></span><i class='fa fa-caret-down'></i></button>" +
                        "<ul uib-dropdown-menu role='menu'><li role='menuitem' ng-repeat='(key, value) in options'><a ng-click='selectFormat($event, key)'><span ng-class='key.toLocaleLowerCase()'>{{value}}</span></a></li></ul>" +
                        "</div>",
                    'tooltiptext': 'Insert Style',
                    'action': function (promise, restoreSelection) {
                        promise.resolve();
                        closeAllPopups(this.$parent.tools, 'formatHeader');
                    },
                    'selectFormat': function (event, format) {
                        event.stopPropagation();
                        var _parent = this.$parent,
                            _editor = _parent.$editor();
                        _editor.queryFormatBlockState(format.toLowerCase());
                        _editor.wrapSelection('formatBlock', '<' + format + '>');
                        _parent.isOpen = false;
                        this.activeState();
                    },
                    'setNodeName': function (el) {
                        var nodeName;
                        if (!el) {
                            this.nodeLabel = this.options.P;
                        }
                        nodeName = el.nodeName;
                        if (nodeName === 'FONT' || nodeName === '#text') {
                            el = _.get(el, 'parentNode');
                            this.setNodeName(el);
                        } else if (_.includes(_.keys(this.options), nodeName)) {
                            this.nodeLabel = this.options[nodeName];
                        } else {
                            this.nodeLabel = this.options.P;
                        }
                    },
                    'options': {
                        'H1': 'Heading 1',
                        'H2': 'Heading 2',
                        'H3': 'Heading 3',
                        'H4': 'Heading 4',
                        'P' : 'Paragraph',
                        'PRE': 'Pre-formatted'
                    },
                    //activestate is triggered when the caret position changes or any operation is performed on editor, set the button text based on it
                    'activeState': function () {
                        var rangeCount = window.getSelection().rangeCount,
                            currentEl = rangeCount ? _.get(window.getSelection().getRangeAt(0), 'startContainer') : '';

                        this.setNodeName(currentEl);

                        this.$element.find('button span').text(this.nodeLabel);
                        this.$element.find('button').addClass('active');
                        return true;
                    }
                };

                //set the key mappings for the tab and shift tab combinations when inside the table to perform cell navigation
                taOptions.keyMappings = [{
                    'commandKeyCode': 'TabKey',
                    'addTableRow': function($el, columnLength) {
                        var columnTemplate = '<td contenteditable="true">&nbsp;</td>',
                            row = WM.element('<tr></tr>');
                        for (var i =0; i<columnLength; i++) {
                            row.append(columnTemplate);
                        }
                        $el.append(row);
                    },
                    'focusNextCell': function(el) {
                        var nextEl = WM.element(el).next();
                        if (nextEl.length) {
                            nextEl.focus();
                        } else {
                            nextEl = WM.element(el).parent().next().children(':first');
                            if (nextEl.length) {
                                nextEl.focus();
                            } else {
                                this.addTableRow(WM.element(el).parent().parent(), el.parentNode.cells.length);
                                this.focusNextCell(el);
                            }
                        }
                    },
                    'testForKey': function (event) {
                        if (event.keyCode === 9 && !event.shiftKey) {
                            var currentEl = window.getSelection().getRangeAt(0).startContainer;
                            if (performTableOperation.call(this, currentEl, event, 'next')) {
                                return false;
                            }
                            return true;
                        }
                        return false;
                    }
                }, {
                    'commandKeyCode': 'ShiftTabKey',
                    'focusPrevCell': function(el) {
                        var prevEl = WM.element(el).prev();
                        if (prevEl.length) {
                            prevEl.focus();
                        } else {
                            WM.element(el).parent().prev().children(':last').focus();
                        }
                    },
                    'testForKey': function (event) {
                        if (event.keyCode === 9 && event.shiftKey) {
                            var currentEl = window.getSelection().getRangeAt(0).startContainer;
                            if (performTableOperation.call(this, currentEl, event, 'prev')) {
                                return false;
                            }
                            return true;
                        }
                        return false;
                    }
                }, {
                    'commandKeyCode': 'DelTables',
                    'deleteRow': function(el) {
                        var tableRowEl = WM.element(el).closest('tr');
                        tableRowEl.remove();
                    },
                    'testForKey': function(event) {
                        var currentEl;
                        if (event.keyCode === 46 && event.shiftKey) {
                            currentEl = window.getSelection().getRangeAt(0).startContainer;
                            if (performTableOperation.call(this, currentEl, event, 'delete')) {
                                return false;
                            }
                            return true;
                        }
                        return false;
                    }
                }];

                //align the options for the toolbar
                taOptions.toolbar = [
                    ['undo', 'redo', 'backgroundColor'],
                    ['formatHeader'],
                    ['fontName'],
                    ['fontSize'],
                    ['bold', 'italics', 'underline', 'strikeThrough', 'fontColor', 'insertTable'],
                    ['html', 'insertImage', 'insertLink', 'insertVideo'],
                    ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull'],
                    ['ul', 'ol', 'indent', 'outdent'],
                    ['clear']
                ];
            }

            //loads the rich text editor config
            function loadRichTextEditorConfig($el) {
                var taRegisterTool = $injector.get('taRegisterTool'),
                    taOptions = $injector.get('taOptions'),
                    taTools = $injector.get('taTools');

                setToolBarConfig(taOptions, $el);

                //register the extra configs we designed
                _.forEach(toolbarConfig, function(config, widget) {
                    taRegisterTool(widget, config);
                });

                //override the undo action to replace the colors and other values set on action
                _.set(taTools, 'undo.action' , function() {
                    var tools = _.get($el.find('[text-angular-toolbar]').isolateScope(), 'tools');
                    _.set(tools, 'backgroundColor.colorPicker.backColor', '#333');
                    _.set(tools, 'fontColor.colorPicker.foreColor', '#333');
                    return this.$editor().wrapSelection("undo", null);
                });
            }

            // Specific to textAngular.
            // Returns the cssRule corresponding to the placeholder
            function getRule(el) {
                var id = el.find('[contenteditable]').attr('id'),
                    rule;

                if (id) {
                    WM.element(document.head)
                        .find('style:not([id]):empty')
                        .each(function () {
                            var _rules = this.sheet.cssRules || this.sheet.rules;

                            _.forEach(_rules, function (_rule) {
                                if (_.includes(_rule.cssText, '#' + id)) {
                                    rule = _rule.style;
                                    return false;
                                }
                            });
                            if (rule) {
                                return false;
                            }
                        });
                }
                return rule || {};
            }

            var widgetProps = PropertiesFactory.getPropertiesOf('wm.richtexteditor', ['wm.base']),
                notifyFor = {
                    'placeholder': true,
                    'showpreview': true
                },
                taApplyCustomRenderers;

            /* Define the property change handler. This function will be triggered when there is a change in the widget property */
            function propertyChangeHandler($is, $taEl, key, nv) {
                switch (key) {
                // placehodler for the textAngular works with the pseudo clasess (:before).
                // To update the placeholder dynamically, get a reference to the cssRule and update the content property with the new placeholder
                case 'placeholder':
                    if (!$is._rule) {
                        $is._rule = getRule($taEl);
                    }

                    $is._rule.content = '"' + nv + '"';

                    break;
                case 'showpreview':
                    $is.showpreview = nv;
                    break;
                }
            }

            function getCursorPosition() {
                var selection,
                    retObj,
                    taSelection;

                taSelection = $injector.get('taSelection');

                try {
                    selection  = taSelection.getSelection();
                    retObj     = {
                        'start': selection.start.offset,
                        'end'  : selection.end.offset
                    };
                } catch (e) {
                    retObj = {};
                }
                return retObj;
            }

            return {
                'restrict': 'E',
                'scope': {},
                'replace': true,
                'template': function (tElement, tAttrs) {
                    var template = WM.element($tc.get('template/widget/richtexteditor.html'));
                    /*Set name for the model-holder, to ease submitting a form*/
                    template.find('.model-holder').attr('name', tAttrs.name);
                    return template[0].outerHTML;
                },
                'link': {
                    'pre': function ($is, $el, attrs) {
                        $is.widgetProps = attrs.widgetid ? Utils.getClonedObject(widgetProps) : widgetProps;
                        if (!isConfigLoaded) {
                            loadRichTextEditorConfig($el);
                            isConfigLoaded = true;
                        }
                    },
                    'post': function ($is, $el, attrs) {
                        /* register the property change handler */
                        WidgetUtilService.registerPropertyChangeListener(
                            propertyChangeHandler.bind(undefined, $is, $el.children().first()),
                            $is,
                            notifyFor
                        );

                        var hiddenInputEl = $el.children('input'),
                            ngModelCtrl;

                        function getChangeEvt() {
                            var changeEvt;
                            //for IE the event constructor doesn't work so use the createEvent proto
                            if (typeof(Event) === 'function') {
                                changeEvt = new Event('change');
                            } else{
                                changeEvt = document.createEvent('Event');
                                changeEvt.initEvent('change', true, true);
                            }
                            return changeEvt;
                        }

                        if (!attrs.widgetid && attrs.scopedatavalue) {
                            $is.$on('$destroy', $is.$watch('_model_', function (newVal) {
                                hiddenInputEl.val(newVal);
                            }));
                        }

                        ngModelCtrl = $el.children('[text-angular]').controller('ngModel');
                        ngModelCtrl.$viewChangeListeners.push(function () {
                            if (!taApplyCustomRenderers) {
                                taApplyCustomRenderers = $injector.get("taApplyCustomRenderers");
                            }
                            $is.htmlcontent = taApplyCustomRenderers($is.datavalue);
                            $is._onChange(getChangeEvt());
                        });

                        /*Called from form reset when users clicks on form reset*/
                        $is.reset = function () {
                            //TODO implement custom reset logic here
                            $is._model_ = '';
                        };

                        $is.getCursorPosition  = getCursorPosition;

                        WidgetUtilService.postWidgetCreate($is, $el, attrs);
                    }
                }
            };
        }
    ])
    .directive('wmRichtexteditorTable', ['$templateCache', 'Utils', function ($tc, Utils) {
        'use strict';
        var rowCount = 10,
            columnCount = 10,
            minRows = 10,
            minColumns = 10;

        function generateTableGrid() {
            var html = '<table role="grid" class="table editor-grid editor-grid-border" aria-readonly="true">',
                x,
                y;

            for (y = 0; y < rowCount; y++) {
                html += '<tr>';

                for (x = 0; x < columnCount; x++) {
                    html += '<td role="gridcell" tabindex="-1"><a href="#" ' +
                        'data-mce-x="' + x + '" data-mce-y="' + y + '"></a></td>';
                }

                html += '</tr>';
            }

            html += '</table>';

            html += '<div class="table-plugin-text">1 x 1</div>';

            return '<div>' + html + '</div>';
        }

        function addRow($el) {
            var html = '',
                x;

            html += '<tr>';

            for (x = 0; x < columnCount; x++) {
                html += '<td role="gridcell" tabindex="-1"><a href="#" ' +
                    'data-mce-x="' + x + '" data-mce-y="' + rowCount + '"></a></td>';
            }

            html += '</tr>';

            $el.find('table tbody').append(html);

            rowCount++;
        }

        function deleteRow($el, y) {
            $el.find('table tr:last').remove();
            rowCount--;
            if ($el.find('table tr').length > minRows && y + 1 < minRows) {
                deleteRow($el, y);
            }
        }

        function addColumn($el) {
            var rows = $el.find('tr');

            rows.each(function (index, row) {
                var anchor = '<a href="#" ' +
                    'data-mce-x="' + columnCount + '" data-mce-y="' + index + '"></a>',
                    newColEl = row.insertCell(columnCount);
                WM.element(newColEl).append(anchor);
            });

            columnCount++;
        }

        function deleteColumn($el, x) {
            var rows = $el.find('tr');

            rows.each(function (index, row) {
                WM.element(row).find('td:last').remove();
            });
            columnCount--;

            if ($el.find('table tr:first td').length > minColumns && x + 1 < minColumns) {
                deleteColumn($el, x);
            }
        }

        function selectGrid(tx, ty, control) {
            var table = WM.element(control).find('table')[0],
                x,
                y,
                focusCell,
                cell,
                active;

            table.nextSibling.innerHTML = (tx + 1) + ' x ' + (ty + 1);

            for (y = 0; y < rowCount; y++) {
                for (x = 0; x < columnCount; x++) {
                    cell = table.rows[y].childNodes[x].firstChild;
                    active = x <= tx && y <= ty;

                    if (active) {
                        WM.element(cell).addClass('editor-active');
                        focusCell = cell;
                    } else {
                        WM.element(cell).removeClass('editor-active');
                    }
                }
            }

            return focusCell.parentNode;
        }

        return {
            'restrict': 'A',
            'replace': true,
            'scope': {
                'onSelect': '&'
            },
            'template': function() {
                return generateTableGrid();
            },
            'compile': function () {
                return {
                    'post': function ($is, $el, attrs) {
                        $el.on('mouseover', function (e) {
                            var target = e.target, x, y;

                            if (target.tagName.toUpperCase() == 'A') {
                                x = parseInt(target.getAttribute('data-mce-x'), 10);
                                y = parseInt(target.getAttribute('data-mce-y'), 10);

                                if (x !== this.lastX || y !== this.lastY) {
                                    selectGrid(x, y, $el[0]);
                                    this.lastX = x;
                                    this.lastY = y;
                                }
                                //add new rows and columns when user mouseovers the last element
                                if (y >= minRows - 1 && y + 1 === rowCount) {
                                    addRow($el);
                                } else if (y < rowCount && rowCount > minRows) {
                                    deleteRow($el, y);
                                }
                                if (x >= minColumns - 1 && x + 1 === columnCount) {
                                    addColumn($el);
                                } else if (x < columnCount && columnCount > minColumns) {
                                    deleteColumn($el, x);
                                }
                            }
                        });

                        $el.on('click', function (e) {
                            var self = this;

                            if (e.target.tagName.toUpperCase() == 'A') {
                                e.preventDefault();
                                e.stopPropagation();
                                $is.$parent.selectedRow = {
                                    rows: self.lastY + 1,
                                    columns: self.lastX + 1
                                };
                                if (WM.isFunction($is.onSelect)) {
                                    $is.onSelect({
                                        rows: self.lastY + 1,
                                        columns: self.lastX + 1
                                    });
                                }
                            }
                        });

                        selectGrid(0, 0, $el[0]);
                    }
                };
            }
        };
    }]);


/**
 * @ngdoc directive
 * @name wm.widgets.form.directive:wmRichtexteditor
 * @restrict E
 *
 * @description
 * The `wmRichtexteditor` directive defines a rich text editor widget. <br>
 *
 * <strong>method:</strong> <em>getCursorPosition</em> <br>
 * Returns the position of the cursor if the cursor is inside the editor. <br>
 * Returned object contains the start and end offsets. <br>
 * ```js
 * var position = widget.getCursorPosition(); // widget is the isolateScope of the richTextEditor widget.
 * // In run mode widgets can be accessed as -- $scope.Widgets._widgetName_
 * console.log(position); // prints {start: 4, end: 10}
 * ```
 * @scope
 *
 * @requires PropertiesFactory
 * @requires $templateCache
 * @requires WidgetUtilService
 *
 * @param {string=}  name
 *                   Name of the rich-text-editor widget.
 * @param {string=}  placeholder
 *                   Initial text in the rich-text-editor widget.
 * @param {number=} tabindex
 *                  This property specifies the tab order of the rich-text-editor widget.
 * @param {string=} width
 *                  Width of the rich-text-editor widget.
 * @param {string=} height
 *                  Height of the rich-text-editor widget.
 * @param {string=} scopedatavalue
 *                  The script variable that contains the data to be displayed on rich-text-editor widget.
 * @param {string=} datavalue
 *                  This is the default value to  be displayed on rich-text-editor widget. <br>
 *                  Note that the display value is just what the user sees initially, and is not always the dataValue returned by the widget. <br>
 *                  This is a bindable property.
 * @param {string=} htmlcontent
 *                  This is the output value of rich-text-editor widget. <br>
 *                  This is the non-sanitized output of the widget. Includes iframe html content.<br>
 *                  This is a bindable property.
 * @param {boolean=} readonly
 *                   Selecting this checkbox property prevents the user from being able to change the data value of a widget. <br>
 *                   Default value: `false`.
 * @param {boolean=} show
 *                   This is a bindable property. <br>
 *                   This property will be used to show/hide the rich-text-editor widget on the web page. <br>
 *                   Default value: `true`.
 * @param {boolean=} showpreview
 *                   To show or hide the preview part of the rich-text-editor widget. <br>
 *                   Default value: `false`.
 * @param {string=}  on-change
 *                   Callback function which will be triggered when the widget value is changed.
 *
 * @example
    <example module="wmCore">
        <file name="index.html">
            <div ng-controller="Ctrl" class="wm-app">
                <wm-composite>
                    <wm-label caption="Placeholder:"></wm-label>
                    <wm-text scopedatavalue="placeholder"></wm-text>
                </wm-composite>
                <wm-composite>
                    <wm-label caption="Show:"></wm-label>
                    <wm-checkbox name="checkbox1" scopedatavalue="show" checked="checked"></wm-checkbox>
                </wm-composite>
                <wm-composite>
                    <wm-label caption="Show Preview:"></wm-label>
                    <wm-checkbox name="checkbox1" scopedatavalue="preview"></wm-checkbox>
                </wm-composite>
                <wm-richtexteditor name="example-richtexteditor" show='{{show}}' placeholder='{{placeholder}}' showpreview='{{preview}}'>
                </wm-richtexteditor>
            </div>
        </file>
        <file name="script.js">
           function Ctrl($scope) {
               $scope.show=true;
               $scope.placeholder = "Sample Text";
           }
        </file>
    </example>
 */
