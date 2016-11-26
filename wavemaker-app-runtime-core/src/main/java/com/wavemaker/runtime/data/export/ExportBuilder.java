package com.wavemaker.runtime.data.export;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/11/16
 */
public abstract class ExportBuilder {

    protected static final int STARTING_COLUMN_NUMBER = 0;
    protected static final int START_ROW_NUMBER_OF_DATA = 1;
    protected static final int STARTING_ROW_NUMBER = 0;
    protected static final int ROW_HEIGHT = 25;

    private static final int COLUMN_HEADER_FONT_SIZE = 10;

    public abstract void addColumnHeaders(Sheet sheet) throws Exception;

    public abstract void addColumnData(Sheet sheet) throws Exception;

    protected CellStyle columnHeaderStyle(Workbook workbook) {
        CellStyle columnNameStyle = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) COLUMN_HEADER_FONT_SIZE);
        columnNameStyle.setWrapText(true);
        columnNameStyle.setFont(font);
        return columnNameStyle;
    }

    public Workbook build() {
        try {
            XSSFWorkbook workbook = new XSSFWorkbook();
            Sheet spreadSheet = workbook.createSheet("Data");
            addColumnHeaders(spreadSheet);
            addColumnData(spreadSheet);
            autoSizeAllColumns(workbook);
            return workbook;
        } catch (Exception e) {
            throw new RuntimeException("Exception while building report", e);
        }
    }

    private void autoSizeAllColumns(Workbook workbook) {
        for (int sheetIndex = 0; sheetIndex < workbook.getNumberOfSheets(); sheetIndex++) {
            Sheet sheet = workbook.getSheetAt(sheetIndex);
            int firstRowNum = sheet.getFirstRowNum();
            Row row = sheet.getRow(firstRowNum);
            int lastCellNum = row.getLastCellNum();
            for (int i = 0; i < lastCellNum; i++) {
                sheet.autoSizeColumn(row.getCell(lastCellNum).getColumnIndex());
            }
        }
    }
}
