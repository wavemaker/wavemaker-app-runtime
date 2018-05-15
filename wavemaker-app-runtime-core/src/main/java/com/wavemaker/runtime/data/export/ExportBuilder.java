/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.export;

import java.io.IOException;
import java.io.OutputStream;
import java.util.List;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellUtil;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.export.util.CSVConverterUtil;
import com.wavemaker.runtime.data.export.util.DataSourceExporterUtil;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/11/16
 */
public class ExportBuilder {

    private static final int FIRST_ROW_NUMBER = 0;
    private static final int FIRST_COLUMN_NUMBER = 0;
    private static final int COLUMN_HEADER_FONT_SIZE = 10;
    private static final int ROW_ACCESS_WINDOW_SIZE = 100;

    private QueryExtractor queryExtractor;
    private ExportOptionsStrategy optionsStrategy;
    private ExportOptions options;

    public ExportBuilder(final QueryExtractor queryExtractor, ExportOptions options, final Class<?> entityClass) {
        this.queryExtractor = queryExtractor;
        this.options = options;
        optionsStrategy = new ExportOptionsStrategy(options, entityClass);
    }

    public void build(OutputStream outputStream) {
        try {
            try (SXSSFWorkbook workbook = new SXSSFWorkbook(ROW_ACCESS_WINDOW_SIZE)) {
                SXSSFSheet spreadSheet = workbook.createSheet("Data");
                fillSheet(spreadSheet);
                spreadSheet.trackAllColumnsForAutoSizing();
                autoSizeAllColumns(workbook);
                exportWorkbook(workbook, options.getExportType(), outputStream);
            }
        } catch (Exception e) {
            throw new WMRuntimeException("Exception while building report", e);
        }
    }

    private void exportWorkbook(final Workbook workbook, final ExportType exportType, OutputStream outputStream) {
        try {
            if (exportType == ExportType.EXCEL) {
                workbook.write(outputStream);
            } else if (exportType == ExportType.CSV) {
                CSVConverterUtil csvConverterUtil = new CSVConverterUtil(workbook);
                csvConverterUtil.convert(outputStream);
            }
        } catch (IOException e) {
            throw new WMRuntimeException("Error while exporting data", e);
        }
    }

    private void fillSheet(Sheet sheet) throws Exception {
        int rowNum = FIRST_ROW_NUMBER;
        while (queryExtractor.next()) {
            Row row = sheet.createRow(rowNum);
            final Object dataObject = queryExtractor.getCurrentRow();
            rowNum = fillRow(dataObject, row, queryExtractor.isFirstRow());
        }
    }

    private void autoSizeAllColumns(Workbook workbook) {
        for (int sheetIndex = 0; sheetIndex < workbook.getNumberOfSheets(); sheetIndex++) {
            Sheet sheet = workbook.getSheetAt(sheetIndex);
            int firstRowNum = sheet.getFirstRowNum();
            Row row = sheet.getRow(firstRowNum);
            int lastCellNum = row.getLastCellNum();
            for (int i = 0; i < lastCellNum; i++) {
                sheet.autoSizeColumn(row.getCell(i).getColumnIndex());
            }
        }
    }

    private int fillRow(Object rowData, Row row, boolean isFirstRow) throws Exception {
        if (rowData == null) {
            throw new WMRuntimeException("Failed to generate report with null Object");
        }
        final Class<?> dataClass = rowData.getClass();
        int rowNum = row.getRowNum();
        if (isFirstRow) {
            fillHeader(row, optionsStrategy.getDisplayNames());
            row = row.getSheet().createRow(++rowNum);
        }
        fillData(optionsStrategy.getFilteredRowData(dataClass, rowData), row);
        return ++rowNum;
    }


    private void fillHeader(Row row, List<String> fieldNames) {
        int colNum = FIRST_COLUMN_NUMBER;
        for (final String fieldName : fieldNames) {
            CellUtil.createCell(row, colNum, fieldName, columnHeaderStyle(row.getSheet().getWorkbook()));
            colNum++;
        }
    }


    private void fillData(List<Object> rowValues, Row row) {
        int colNum = FIRST_COLUMN_NUMBER;
        for (Object value : rowValues) {
            final Cell cell = row.createCell(colNum);
            DataSourceExporterUtil.setCellValue(value, cell);
            colNum++;
        }
    }


    private CellStyle columnHeaderStyle(Workbook workbook) {
        CellStyle columnNameStyle = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) COLUMN_HEADER_FONT_SIZE);
        columnNameStyle.setWrapText(true);
        columnNameStyle.setFont(font);
        return columnNameStyle;
    }
}
