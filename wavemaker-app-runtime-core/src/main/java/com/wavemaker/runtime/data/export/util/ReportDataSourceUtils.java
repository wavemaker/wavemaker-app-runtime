package com.wavemaker.runtime.data.export.util;

import java.lang.reflect.Method;
import java.sql.ResultSet;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Drawing;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFCell;
import org.apache.poi.xssf.usermodel.XSSFRow;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.hibernate.ScrollableResults;
import org.hibernate.internal.AbstractScrollableResults;

import com.wavemaker.studio.common.WMRuntimeException;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 07/11/16
 */
public class ReportDataSourceUtils {


    private static final int WORKBOOK_FONT_SIZE = 12;

    public static ResultSet constructResultSet(ScrollableResults scroll) {
        try {
            Method resultSetMethod = AbstractScrollableResults.class.getDeclaredMethod("getResultSet");
            resultSetMethod.setAccessible(true);
            return (ResultSet) resultSetMethod.invoke(scroll);
        } catch (Exception e) {
            throw new WMRuntimeException("Failed to fetch ResultSet", e);
        }
    }


    public static void addCell(
            Object data, final XSSFCell cell) {
        try {
            XSSFRow row = cell.getRow();
            XSSFSheet sheet = row.getSheet();
            if (data == null) {
                cell.setCellValue("");
            } else {
                if (!byte[].class.equals(data.getClass())) {
                    cell.setCellValue(data.toString());
                } else {
                    Drawing drawing = sheet.createDrawingPatriarch();
                    ImageUtils.addImageToSheet(cell.getColumnIndex(), row.getRowNum(), sheet, drawing, (byte[]) data,
                            Workbook.PICTURE_TYPE_JPEG, 20, 30, ImageUtils.EXPAND_ROW_AND_COLUMN);

                }
            }
            sheet.autoSizeColumn(cell.getColumnIndex());
        } catch (Exception e) {
            throw new RuntimeException("Error while exporting data to report", e);
        }
    }

    public static void addColumnTitleCell(
            XSSFCell cell, final String cellValue) {
        XSSFSheet sheet = cell.getRow().getSheet();
        XSSFWorkbook workbook = sheet.getWorkbook();
        cell.setCellValue(cellValue);
        cell.setCellStyle(columnTitleStyle(workbook));
        sheet.autoSizeColumn(cell.getColumnIndex());
    }

    private static CellStyle columnTitleStyle(XSSFWorkbook workbook) {
        CellStyle columnNameStyle = workbook.createCellStyle();

        Font font = workbook.createFont();
        font.setBold(true);
        font.setBoldweight(Font.BOLDWEIGHT_NORMAL);
        font.setFontHeightInPoints((short) WORKBOOK_FONT_SIZE);

        columnNameStyle.setWrapText(true);
        columnNameStyle.setFont(font);
        return columnNameStyle;
    }

}
