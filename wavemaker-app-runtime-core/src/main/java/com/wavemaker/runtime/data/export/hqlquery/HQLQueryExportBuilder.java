/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.export.hqlquery;

import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellUtil;
import org.hibernate.ScrollableResults;
import org.springframework.beans.BeanUtils;

import com.wavemaker.runtime.data.export.DataType;
import com.wavemaker.runtime.data.export.ExportBuilder;
import com.wavemaker.runtime.data.export.util.DataSourceExporterUtil;
import com.wavemaker.runtime.data.model.ReferenceType;
import com.wavemaker.runtime.data.model.returns.FieldType;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.data.transform.Transformers;
import com.wavemaker.runtime.data.transform.WMResultTransformer;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/11/16
 */
public class HQLQueryExportBuilder extends ExportBuilder {

    private ScrollableResults results;

    private List<ReturnProperty> returnPropertyList;


    private HQLQueryExportBuilder(Class<?> responseType, ScrollableResults results, List<ReturnProperty> returnPropertyList) {
        this.responseType = responseType;
        this.results = results;
        this.returnPropertyList = returnPropertyList;
    }

    public static Workbook build(Class<?> responseType, ScrollableResults results, List<ReturnProperty> returnPropertyList) {
        HQLQueryExportBuilder builder = new HQLQueryExportBuilder(responseType, results, returnPropertyList);
        return builder.build();
    }

    @Override
    public void addColumnHeaders(Sheet sheet, final Class<?> responseType) throws ClassNotFoundException {
        int colNum = STARTING_COLUMN_NUMBER;
        Row colHeaderRow = sheet.createRow(STARTING_ROW_NUMBER);
        final WMResultTransformer wmResultTransformer = Transformers.aliasToMappedClass(responseType);
        if (returnPropertyList.size() == 1 && StringUtils.isBlank(returnPropertyList.get(0).getName())) {
            final ReturnProperty property = returnPropertyList.get(0);
            final FieldType fieldType = property.getFieldType();
            if (fieldType.getType() == ReferenceType.ENTITY) {
                addEntityTypeHeaders(colHeaderRow, colNum, Class.forName(fieldType.getTypeRef()),
                        property.getFieldName(), true);
            }
        } else {
            for (final ReturnProperty property : returnPropertyList) {
                String fieldName = wmResultTransformer.aliasToFieldName(property.getName());
                final FieldType fieldType = property.getFieldType();
                final ReferenceType type = fieldType.getType();
                if (type == ReferenceType.PRIMITIVE) {
                    CellUtil.createCell(colHeaderRow, colNum, fieldName,
                            columnHeaderStyle(colHeaderRow.getSheet().getWorkbook()));
                    colNum++;
                } else if (type == ReferenceType.ENTITY) {
                    colNum = addEntityTypeHeaders(colHeaderRow, colNum, Class.forName(fieldType.getTypeRef()),
                            fieldName, false);
                }
            }
        }
    }

    @Override
    public void addColumnData(final Sheet sheet) throws Exception {
        int rowNum = START_ROW_NUMBER_OF_DATA;
        while (results.next()) {
            Row dataRow = sheet.createRow(rowNum);
            int colNum = STARTING_COLUMN_NUMBER;
            for (final ReturnProperty returnProperty : returnPropertyList) {
                Object data = results.get(colNum);
                FieldType fieldType = returnProperty.getFieldType();
                ReferenceType type = fieldType.getType();
                Cell cell = dataRow.createCell(colNum);
                if (type == ReferenceType.PRIMITIVE) {
                    DataSourceExporterUtil.setCellValue(data, cell);
                    colNum++;
                } else if (type == ReferenceType.ENTITY) {
                    colNum = addEntityTypeColumnData(data, dataRow, colNum, Class.forName(fieldType.getTypeRef()),
                            true);
                }
            }
            rowNum++;
        }
    }

    private int addEntityTypeHeaders(Row colHeaderRow, int colNum, Class<?> typeClass, String fieldPrefix, boolean addChildEntityHeaders)
            throws ClassNotFoundException {
        for (final Field field : typeClass.getDeclaredFields()) {
            String fieldName = field.getName();
            Class<?> fieldType = field.getType();
            DataType dataType = DataType.valueFor(fieldType.getName());
            if (dataType != null && isDataTypeWritable(dataType)) {
                if (StringUtils.isNotBlank(fieldPrefix)) {
                    fieldName = fieldPrefix + "." + fieldName;
                }
                CellUtil.createCell(colHeaderRow, colNum, fieldName, columnHeaderStyle(colHeaderRow.getSheet().getWorkbook()));
                colNum++;
            } else if (dataType == null && addChildEntityHeaders) {
                colNum = addEntityTypeHeaders(colHeaderRow, colNum, fieldType, fieldName, false);
            }
        }
        return colNum;
    }

    private int addEntityTypeColumnData(final Object dataObject, Row row, int colNum, Class<?> typeClass, boolean addChildEntityData)
            throws ClassNotFoundException, InvocationTargetException, IllegalAccessException {
        for (final Field field : typeClass.getDeclaredFields()) {
            String typeName = field.getType().getName();
            DataType dataType = DataType.valueFor(typeName);
            PropertyDescriptor propertyDescriptor = BeanUtils.getPropertyDescriptor(typeClass, field.getName());
            Object data = (dataObject == null) ? null : propertyDescriptor.getReadMethod().invoke(dataObject);
            if (dataType != null && isDataTypeWritable(dataType)) {
                if (dataObject != null) {
                    Cell cell = row.createCell(colNum);
                    DataSourceExporterUtil.setCellValue(data, cell);
                }
                colNum++;
            } else if (dataType == null && addChildEntityData) {
                colNum = addEntityTypeColumnData(data, row, colNum, Class.forName(typeName), false);
            }
        }
        return colNum;
    }

    private boolean isDataTypeWritable(DataType dataType) {
        return dataType != DataType.LIST && dataType != DataType.OBJECT;
    }
}