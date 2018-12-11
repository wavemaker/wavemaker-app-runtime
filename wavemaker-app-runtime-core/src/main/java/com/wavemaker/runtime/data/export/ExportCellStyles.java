package com.wavemaker.runtime.data.export;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Workbook;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 10/12/18
 */
public class ExportCellStyles {

    private static final int COLUMN_HEADER_FONT_SIZE = 10;

    private CellStyle columnCellStyle;
    private CellStyle dateCellStyle;
    private CellStyle headerCellStyle;

    public ExportCellStyles(Workbook workbook) {
        columnCellStyle = workbook.createCellStyle();
        columnCellStyle.setWrapText(true);

        headerCellStyle = workbook.createCellStyle();
        Font font = workbook.createFont();
        font.setBold(true);
        font.setFontHeightInPoints((short) COLUMN_HEADER_FONT_SIZE);
        headerCellStyle.setWrapText(true);
        headerCellStyle.setFont(font);

        dateCellStyle = workbook.createCellStyle();
        dateCellStyle.setDataFormat(workbook.getCreationHelper().createDataFormat().getFormat("dd-mm-yyyy"));
    }

    public CellStyle getColumnCellStyle() {
        return columnCellStyle;
    }

    public CellStyle getDateCellStyle() {
        return dateCellStyle;
    }

    public CellStyle getHeaderCellStyle() {
        return headerCellStyle;
    }
}
