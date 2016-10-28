package com.wavemaker.runtime.data.export.hqlquery;

import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.util.List;

import org.apache.commons.lang3.StringUtils;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.hibernate.ScrollableResults;
import org.springframework.beans.BeanUtils;

import com.wavemaker.runtime.data.export.DataType;
import com.wavemaker.runtime.data.export.ExportBuilder;
import com.wavemaker.runtime.data.export.util.ReportDataSourceUtils;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.data.model.returns.ReturnType;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/11/16
 */
public class HQLQueryExportBuilder extends ExportBuilder {

    private ScrollableResults results;

    private List<ReturnProperty> returnPropertyList;


    public HQLQueryExportBuilder(ScrollableResults results, List<ReturnProperty> returnPropertyList) {
        this.results = results;
        this.returnPropertyList = returnPropertyList;
    }


    @Override
    public void addFields(XSSFSheet sheet) throws ClassNotFoundException {
        int colNum = STARTING_COLUMN_NUMBER;
        XSSFRow titleRow = sheet.createRow(STARTING_ROW_NUMBER);
        for (final ReturnProperty returnProperty : returnPropertyList) {
            ReturnType returnType = returnProperty.getReturnType();
            if (returnType.getType() == ReturnType.Type.SIMPLE) {
                XSSFCell cell = titleRow.createCell(colNum);
                ReportDataSourceUtils.addColumnTitleCell(cell, returnProperty.getName());
                colNum++;
            } else if (returnType.getType() == ReturnType.Type.REFERENCE) {
                colNum = addEntityTypeFields(titleRow, colNum, returnType.getRef(), "",
                        true);
            }
        }
    }

    @Override
    public void addData(XSSFSheet sheet) {
        int rowNum = START_ROW_NUMBER_OF_DATA;
        try {
            while (results.next()) {
                XSSFRow row = sheet.createRow(rowNum);
                int colNum = STARTING_COLUMN_NUMBER;
                for (final ReturnProperty returnProperty : returnPropertyList) {
                    XSSFCell cell = row.createCell(colNum);
                    ReturnType.Type type = returnProperty.getReturnType().getType();
                    if (type == ReturnType.Type.SIMPLE) {
                        ReportDataSourceUtils.addCell(results.get(colNum), cell);
                        colNum++;
                    } else if (type == ReturnType.Type.REFERENCE) {
                        Object dataObject = results.get(0);
                        if (dataObject != null) {
                            colNum = addEntityTypeFieldData(row, colNum, dataObject, true);
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

    private int addEntityTypeFields(
            XSSFRow row, int colNum, String className, String prefix, boolean loopOnce) throws
            ClassNotFoundException {
        Class<?> aClass = Class.forName(className);
        for (final Field field : aClass.getDeclaredFields()) {
            XSSFCell cell = row.createCell(colNum);
            String typeName = field.getType().getName();
            DataType dataType = DataType.valueFor(typeName);
            String cellValue = field.getName();
            if (dataType != null) {
                if (dataType != DataType.LIST && dataType != DataType.OBJECT) {
                    if (StringUtils.isNotBlank(prefix)) {
                        cellValue = prefix + '.' + cellValue;
                    }
                    ReportDataSourceUtils.addColumnTitleCell(cell, cellValue);
                }
            } else if (loopOnce) {
                addEntityTypeFields(row, colNum, typeName, cellValue, false);
            }
            colNum++;
        }
        return colNum;
    }


    private int addEntityTypeFieldData(
            final XSSFRow row, int colNum,
            final Object dataObject, final boolean loopOnce) throws IllegalAccessException, InvocationTargetException {
        Class<?> aClass = dataObject.getClass();
        for (final Field field : aClass.getDeclaredFields()) {
            XSSFCell cell = row.createCell(colNum);
            PropertyDescriptor descriptor = BeanUtils.getPropertyDescriptor(aClass, field.getName());
            String typeName = field.getType().getName();
            Object dataValue = descriptor.getReadMethod().invoke(dataObject);
            DataType dataType = DataType.valueFor(typeName);
            if (dataType != null) {
                if (dataType != DataType.LIST && dataType != DataType.OBJECT) {
                    ReportDataSourceUtils.addCell(dataValue, cell);
                }
            } else if (loopOnce) {
                addEntityTypeFieldData(row, colNum, dataValue, false);
            }
            colNum++;
        }
        return colNum;
    }
}

