package com.wavemaker.runtime.data.export.nativesql;

import java.sql.ResultSet;
import java.sql.ResultSetMetaData;
import java.sql.SQLException;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.ss.util.CellUtil;

import com.wavemaker.runtime.data.export.ExportBuilder;
import com.wavemaker.runtime.data.export.util.DataSourceExporterUtil;
import com.wavemaker.runtime.data.transform.Transformers;
import com.wavemaker.runtime.data.transform.WMResultTransformer;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/11/16
 */
public class NativeSQLExportBuilder extends ExportBuilder {


    private ResultSet resultSet;

    private NativeSQLExportBuilder(final Class<?> responseType, final ResultSet resultSet) {
        this.responseType = responseType;
        this.resultSet = resultSet;
    }

    public static Workbook build(Class<?> responseType, ResultSet results) {
        NativeSQLExportBuilder builder = new NativeSQLExportBuilder(responseType, results);
        return builder.build();
    }

    @Override
    @SuppressWarnings("unchecked")
    public void addColumnHeaders(Sheet sheet, final Class<?> responseType) throws SQLException {
        int rowNum = STARTING_ROW_NUMBER;
        Row colHeaderRow = sheet.createRow(rowNum);
        Integer colNum = STARTING_COLUMN_NUMBER;
        ResultSetMetaData metaData = resultSet.getMetaData();
        final WMResultTransformer wmResultTransformer = Transformers.aliasToMappedClass(responseType);
        for (int columnIndex = 1; columnIndex <= metaData.getColumnCount(); columnIndex++) {
            String columnName = metaData.getColumnName(columnIndex);
            String fieldName = wmResultTransformer.aliasToFieldName(columnName);
            CellUtil.createCell(colHeaderRow, colNum, fieldName, columnHeaderStyle(sheet.getWorkbook()));
            colNum++;
        }
        sheet.autoSizeColumn(rowNum);
    }

    @Override
    @SuppressWarnings("unchecked")
    public void addColumnData(Sheet spreadSheet) throws SQLException {
        int rowNum = START_ROW_NUMBER_OF_DATA;
        ResultSetMetaData metaData = resultSet.getMetaData();
        while (resultSet.next()) {
            Row row = spreadSheet.createRow(rowNum);
            row.setHeightInPoints(ROW_HEIGHT);
            Integer colNum = STARTING_COLUMN_NUMBER;
            for (int columnIndex = 1; columnIndex <= metaData.getColumnCount(); columnIndex++) {
                Object columnValue = resultSet.getObject(columnIndex);
                Cell cell = row.createCell(colNum);
                DataSourceExporterUtil.setCellValue(columnValue, cell);
                colNum++;
            }
            spreadSheet.autoSizeColumn(rowNum);
            rowNum++;
        }
    }
}
