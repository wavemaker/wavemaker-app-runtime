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
package com.wavemaker.runtime.data.export.util;

import java.io.IOException;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.util.ArrayList;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.DataFormatter;
import org.apache.poi.ss.usermodel.FormulaEvaluator;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;

/**
 * This code is taken from org.apache.poi.ss.examples
 *
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 3/11/16
 */
public class CSVConverterUtil {

    private Workbook workbook;
    private DataFormatter formatter = new DataFormatter(true);
    private FormulaEvaluator evaluator;
    private ArrayList<ArrayList<String>> csvData;
    private int maxRowWidth = 0;
    private String separator = DEFAULT_SEPARATOR;

    private static final String DEFAULT_SEPARATOR = ",";

    public CSVConverterUtil(final Workbook workbook) {
        this.workbook = workbook;
        this.csvData = new ArrayList<>();
        this.evaluator = this.workbook.getCreationHelper().createFormulaEvaluator();
    }

    public void convert(OutputStream outputStream) {
        try {
            convertToCSV();
            toCSV(outputStream);
        } catch (Exception e) {
            throw new RuntimeException("Error while exporting data to CSV format", e);
        }
    }

    private void convertToCSV() {
        Sheet sheet;
        Row row;
        int lastRowNum;

        int sheetCount = this.workbook.getNumberOfSheets();
        for (int index = 0; index < sheetCount; index++) {
            sheet = this.workbook.getSheetAt(index);
            if (sheet.getPhysicalNumberOfRows() > 0) {
                lastRowNum = sheet.getLastRowNum();
                for (int i = 0; i <= lastRowNum; i++) {
                    row = sheet.getRow(i);
                    rowToCSV(row);
                }
            }
        }
    }

    private void toCSV(OutputStream outStream) throws IOException {
        StringBuffer buffer;
        ArrayList<String> line;
        OutputStreamWriter osWriter = new OutputStreamWriter(outStream);
        String csvLineElement;
        try {
            for (int i = 0; i < this.csvData.size(); i++) {
                buffer = new StringBuffer();
                line = this.csvData.get(i);
                for (int j = 0; j < this.maxRowWidth; j++) {
                    if (line.size() > j) {
                        csvLineElement = line.get(j);
                        if (csvLineElement != null) {
                            buffer.append(this.escapeEmbeddedCharacters(
                                    csvLineElement));
                        }
                    }
                    if (j < (this.maxRowWidth - 1)) {
                        buffer.append(this.separator);
                    }
                }

                osWriter.write(buffer.toString().trim());

                if (i < (this.csvData.size() - 1)) {
                    osWriter.write("\n");
                }
            }
        } finally {
            osWriter.flush();
            osWriter.close();
        }
    }

    private String escapeEmbeddedCharacters(String field) {
        StringBuffer buffer;

        if (field.contains("\"")) {
            buffer = new StringBuffer(field.replaceAll("\"", "\\\"\\\""));
            buffer.insert(0, "\"");
            buffer.append("\"");
        } else {
            buffer = new StringBuffer(field);
            if ((buffer.indexOf(this.separator)) > -1 ||
                    (buffer.indexOf("\n")) > -1) {
                buffer.insert(0, "\"");
                buffer.append("\"");
            }
        }
        return (buffer.toString().trim());
    }


    /**
     * Called to convert a row of cells into a line of data that can later be output to the CSV file.
     *
     * @param row An instance of either the HSSFRow or XSSFRow classes that encapsulates information about a row of
     *            cells recovered from an Excel workbook.
     */
    private void rowToCSV(Row row) {
        Cell cell;
        int lastCellNum;
        ArrayList<String> csvLine = new ArrayList<>();

        if (row != null) {

            lastCellNum = row.getLastCellNum();
            for (int i = 0; i <= lastCellNum; i++) {
                cell = row.getCell(i);
                if (cell == null) {
                    csvLine.add("");
                } else {
                    if (cell.getCellType() != Cell.CELL_TYPE_FORMULA) {
                        csvLine.add(this.formatter.formatCellValue(cell));
                    } else {
                        csvLine.add(this.formatter.formatCellValue(cell, this.evaluator));
                    }
                }
            }
            if (lastCellNum > this.maxRowWidth) {
                this.maxRowWidth = lastCellNum;
            }
        }
        this.csvData.add(csvLine);
    }
}
