package com.wavemaker.runtime.data.export.nativesql;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;

import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;

import com.wavemaker.runtime.data.export.ExportBuilder;
import com.wavemaker.runtime.data.export.util.ReportDataSourceUtils;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/11/16
 */
public class NativeSQLExportBuilder extends ExportBuilder {


    private ResultSet resultSet;

    public NativeSQLExportBuilder(final ResultSet resultSet) {
        this.resultSet = resultSet;
    }


    @Override
    @SuppressWarnings("unchecked")
    public void addFields(
            XSSFSheet sheet) throws SQLException {
        int rowNum = STARTING_ROW_NUMBER;
        XSSFRow titleRow = sheet.createRow(rowNum);
        Integer colNum = STARTING_COLUMN_NUMBER;
        ResultSetMetaData metaData = resultSet.getMetaData();

        for (int columnIndex = 1; columnIndex <= metaData.getColumnCount(); columnIndex++) {
            XSSFCell cell = titleRow.createCell(colNum);
            String columnName = metaData.getColumnName(columnIndex);
            ReportDataSourceUtils.addColumnTitleCell(cell, columnName);
            colNum++;
        }
        sheet.autoSizeColumn(rowNum);
    }

    @Override
    @SuppressWarnings("unchecked")
    public void addData(
            XSSFSheet spreadSheet) throws SQLException {
        int rowNum = START_ROW_NUMBER_OF_DATA;
        ResultSetMetaData metaData = resultSet.getMetaData();
        while (resultSet.next()) {
            XSSFRow row = spreadSheet.createRow(rowNum);
            row.setHeightInPoints(ROW_HEIGHT);
            Integer colNum = STARTING_COLUMN_NUMBER;
            for (int columnIndex = 1; columnIndex <= metaData.getColumnCount(); columnIndex++) {
                Object columnValue = resultSet.getObject(columnIndex);
                XSSFCell cell = row.createCell(colNum);
                ReportDataSourceUtils.addCell(columnValue, cell);
                colNum++;
            }
            spreadSheet.autoSizeColumn(rowNum);
            rowNum++;
        }
    }
}
