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
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.data.model.returns.ReturnType;

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
            ReturnType returnType = returnProperty.getReturnType();
            if (returnType.getType() == ReturnType.Type.SIMPLE) {
                CellUtil.createCell(colHeaderRow, colNum, returnProperty.getName(),
                        columnHeaderStyle(sheet.getWorkbook()));
                colNum++;
            } else if (returnType.getType() == ReturnType.Type.REFERENCE) {
                colNum = addEntityTypeColumnHeaders(colHeaderRow, colNum, returnType.getRef(), "", true);
            }
        }
    }

    @Override
    public void addColumnData(Sheet sheet) {
        int rowNum = START_ROW_NUMBER_OF_DATA;
        try {
            while (results.next()) {
                Row row = sheet.createRow(rowNum);
                int colNum = STARTING_COLUMN_NUMBER;
                for (final ReturnProperty returnProperty : returnPropertyList) {
                    Cell cell = row.createCell(colNum);
                    ReturnType.Type type = returnProperty.getReturnType().getType();
                    if (type == ReturnType.Type.SIMPLE) {
                        DataSourceExporterUtil.setCellValue(results.get(colNum), cell);
                        colNum++;
                    } else if (type == ReturnType.Type.REFERENCE) {
                        Object dataObject = results.get(0);
                        if (dataObject != null) {
                            colNum = addEntityTypeColumnData(row, colNum, dataObject, true);
                        }
                    }
                }
                sheet.autoSizeColumn(rowNum);
                rowNum++;
            }
        } catch (Exception e) {
            throw new RuntimeException("Error while exporting data to report", e);
        }
    }

    private int addEntityTypeColumnHeaders(
            Row row, int colNum, String className, String prefix, boolean loopOnce) throws
            ClassNotFoundException {
        Class<?> aClass = Class.forName(className);
        for (final Field field : aClass.getDeclaredFields()) {
            String typeName = field.getType().getName();
            DataType dataType = DataType.valueFor(typeName);
            String cellValue = field.getName();
            if (dataType != null) {
                if (dataType != DataType.LIST && dataType != DataType.OBJECT) {
                    if (StringUtils.isNotBlank(prefix)) {
                        cellValue = prefix + '.' + cellValue;
                    }
                    CellUtil.createCell(row, colNum, cellValue, columnHeaderStyle(row.getSheet().getWorkbook()));
                }
            } else if (loopOnce) {
                addEntityTypeColumnHeaders(row, colNum, typeName, cellValue, false);
            }
            colNum++;
        }
        return colNum;
    }


    private int addEntityTypeColumnData(
            final Row row, int colNum, final Object dataObject,
            final boolean loopOnce) throws IllegalAccessException, InvocationTargetException {
        Class<?> aClass = dataObject.getClass();
        for (final Field field : aClass.getDeclaredFields()) {
            Cell cell = row.createCell(colNum);
            PropertyDescriptor descriptor = BeanUtils.getPropertyDescriptor(aClass, field.getName());
            String typeName = field.getType().getName();
            Object dataValue = descriptor.getReadMethod().invoke(dataObject);
            DataType dataType = DataType.valueFor(typeName);
            if (dataType != null) {
                if (dataType != DataType.LIST && dataType != DataType.OBJECT) {
                    DataSourceExporterUtil.setCellValue(dataValue, cell);
                }
            } else if (loopOnce) {
                addEntityTypeColumnData(row, colNum, dataValue, false);
            }
            colNum++;
        }
        return colNum;
    }
}

