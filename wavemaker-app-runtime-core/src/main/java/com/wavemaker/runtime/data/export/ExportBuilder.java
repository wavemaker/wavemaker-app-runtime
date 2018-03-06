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

import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;

import org.apache.commons.lang3.StringUtils;
import org.apache.poi.hssf.usermodel.HSSFFont;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellUtil;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.BeanUtils;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.export.util.DataSourceExporterUtil;
import com.wavemaker.runtime.data.util.JavaTypeUtils;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/11/16
 */
public class ExportBuilder {

    private static final int FIRST_ROW_NUMBER = 0;
    private static final int FIRST_COLUMN_NUMBER = 0;
    private static final int COLUMN_HEADER_FONT_SIZE = 10;

    private QueryExtractor queryExtractor;

    public ExportBuilder(final QueryExtractor queryExtractor) {
        this.queryExtractor = queryExtractor;
    }

    public Workbook build() {
        try {
            XSSFWorkbook workbook = new XSSFWorkbook();
            Sheet spreadSheet = workbook.createSheet("Data");
            fillSheet(spreadSheet);
            autoSizeAllColumns(workbook);
            return workbook;
        } catch (Exception e) {
            throw new WMRuntimeException("Exception while building report", e);
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
            fillHeader(dataClass, row, FIRST_COLUMN_NUMBER, "", true);
            row = row.getSheet().createRow(++rowNum);
        }
        fillData(rowData, dataClass, row, FIRST_COLUMN_NUMBER, true);
        return ++rowNum;
    }

    private int fillHeader(final Class<?> dataClass, Row row, int colNum, String prefix, boolean includeChildren)
            throws Exception {
        for (final Field field : dataClass.getDeclaredFields()) {
            String fieldName = field.getName();
            final Class<?> type = field.getType();
            if (JavaTypeUtils.isKnownType(type)) {
                if (StringUtils.isNotBlank(prefix)) {
                    fieldName = prefix + '.' + fieldName;
                }
                CellUtil.createCell(row, colNum, fieldName, columnHeaderStyle(row.getSheet().getWorkbook()));
                colNum++;
            } else if (includeChildren && JavaTypeUtils.isNotCollectionType(type)) {
                colNum = fillHeader(Class.forName(type.getName()), row, colNum, fieldName, false);
            }
        }
        return colNum;
    }

    private int fillData(
            Object rowData, final Class<?> dataClass, Row row, int colNum, boolean includeChildren) throws Exception {
        for (final Field field : dataClass.getDeclaredFields()) {
            PropertyDescriptor propertyDescriptor = BeanUtils.getPropertyDescriptor(dataClass, field.getName());
            Object value = (rowData == null) ? null : propertyDescriptor.getReadMethod().invoke(rowData);
            final Class<?> type = field.getType();
            if (JavaTypeUtils.isKnownType(type)) {
                final Cell cell = row.createCell(colNum);
                DataSourceExporterUtil.setCellValue(value, cell);
                colNum++;
            } else if (includeChildren && JavaTypeUtils.isNotCollectionType(type)) {
                colNum = fillData(value, Class.forName(type.getName()), row, colNum, false);
            }
        }
        return colNum;
    }

    private CellStyle columnHeaderStyle(Workbook workbook) {
        CellStyle columnNameStyle = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBoldweight(HSSFFont.BOLDWEIGHT_BOLD);
        font.setFontHeightInPoints((short) COLUMN_HEADER_FONT_SIZE);
        columnNameStyle.setWrapText(true);
        columnNameStyle.setFont(font);
        return columnNameStyle;
    }
}
