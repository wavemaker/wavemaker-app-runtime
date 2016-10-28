package com.wavemaker.runtime.data.export;

import org.apache.poi.xssf.usermodel.XSSFSheet;
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

    public XSSFWorkbook workbook;

    public XSSFWorkbook build() {
        try {
            if (workbook == null) {
                XSSFWorkbook workbook = new XSSFWorkbook();
                XSSFSheet spreadSheet = workbook.createSheet("Data");
                addFields(spreadSheet);
                addData(spreadSheet);
                this.workbook = workbook;
            }
            return workbook;
        } catch (Exception e) {
            throw new RuntimeException("Exception while building report", e);
        }
    }

    public abstract void addFields(XSSFSheet sheet) throws Exception;

    public abstract void addData(XSSFSheet sheet) throws Exception;


}
