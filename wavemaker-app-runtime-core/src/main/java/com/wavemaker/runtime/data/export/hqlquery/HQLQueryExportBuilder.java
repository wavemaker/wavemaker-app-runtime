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
import com.wavemaker.runtime.data.model.returns.FieldType;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/11/16
 */
public class HQLQueryExportBuilder extends ExportBuilder {

    private ScrollableResults results;

    private List<ReturnProperty> returnPropertyList;


    private HQLQueryExportBuilder(ScrollableResults results, List<ReturnProperty> returnPropertyList) {
        this.results = results;
        this.returnPropertyList = returnPropertyList;
    }

    public static Workbook build(ScrollableResults results, List<ReturnProperty> returnPropertyList) {
        HQLQueryExportBuilder builder = new HQLQueryExportBuilder(results, returnPropertyList);
        return builder.build();
    }

    @Override
    public void addColumnHeaders(Sheet sheet) throws ClassNotFoundException {
        int colNum = STARTING_COLUMN_NUMBER;
        Row colHeaderRow = sheet.createRow(STARTING_ROW_NUMBER);
        for (final ReturnProperty returnProperty : returnPropertyList) {
            FieldType fieldType = returnProperty.getFieldType();
            FieldType.Type type = fieldType.getType();
            if (type == FieldType.Type.SIMPLE) {
                CellUtil.createCell(colHeaderRow, colNum, returnProperty.getName(),
                        columnHeaderStyle(sheet.getWorkbook()));
                colNum++;
            } else if (type == FieldType.Type.REFERENCE) {
                colNum = addEntityTypeColumnHeaders(colHeaderRow, colNum, Class.forName(fieldType.getRef()), "", true);
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
                FieldType.Type type = fieldType.getType();
                Cell cell = dataRow.createCell(colNum);
                if (type == FieldType.Type.SIMPLE) {
                    DataSourceExporterUtil.setCellValue(data, cell);
                    colNum++;
                } else if (type == FieldType.Type.REFERENCE) {
                    colNum = addEntityTypeColumnData(data, dataRow, colNum, Class.forName(fieldType.getRef()), true);
                }
            }
            rowNum++;
        }
    }

    private int addEntityTypeColumnHeaders(Row row, int colNum, Class<?> typeClass, String prefix, boolean addChildEntityHeaders)
            throws ClassNotFoundException {
        for (final Field field : typeClass.getDeclaredFields()) {
            String typeName = field.getType().getName();
            DataType dataType = DataType.valueFor(typeName);
            String cellValue = field.getName();
            if (dataType != null && isDataTypeWritable(dataType)) {
                if (StringUtils.isNotBlank(prefix)) {
                    cellValue = prefix + '.' + cellValue;
                }
                CellUtil.createCell(row, colNum, cellValue, columnHeaderStyle(row.getSheet().getWorkbook()));
                colNum++;
            } else if (dataType == null && addChildEntityHeaders) {
                colNum = addEntityTypeColumnHeaders(row, colNum, Class.forName(typeName), cellValue, false);
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