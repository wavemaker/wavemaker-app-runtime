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

import org.apache.poi.hssf.usermodel.HSSFSheet;
import org.apache.poi.ss.usermodel.ClientAnchor;
import org.apache.poi.ss.usermodel.Drawing;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 3/11/16
 */
public class ImageUtils {

    public static final int EXPAND_ROW = 1;
    public static final int EXPAND_COLUMN = 2;
    public static final int EXPAND_ROW_AND_COLUMN = 3;
    public static final int OVERLAY_ROW_AND_COLUMN = 7;


    private static final int EMU_PER_MM = 36000;

    public static void addImageToSheet(
            int colNumber, int rowNumber, Sheet sheet, Drawing drawing,
            byte[] image, int imageType, double reqImageWidthMM, double reqImageHeightMM,
            int resizeBehaviour) throws IOException,
            IllegalArgumentException {

        if ((resizeBehaviour != ImageUtils.EXPAND_COLUMN) &&
                (resizeBehaviour != ImageUtils.EXPAND_ROW) &&
                (resizeBehaviour != ImageUtils.EXPAND_ROW_AND_COLUMN) &&
                (resizeBehaviour != ImageUtils.OVERLAY_ROW_AND_COLUMN)) {
            throw new IllegalArgumentException("Invalid value passed to the " +
                    "resizeBehaviour parameter of ImageUtils.addImageToSheet()");
        }

        ImageUnitsConverter.ClientAnchorDetail colClientAnchorDetail = fitImageToColumns(sheet, colNumber,
                reqImageWidthMM, resizeBehaviour);
        ImageUnitsConverter.ClientAnchorDetail rowClientAnchorDetail = fitImageToRows(sheet, rowNumber,
                reqImageHeightMM, resizeBehaviour);

        ClientAnchor anchor = sheet.getWorkbook().getCreationHelper().createClientAnchor();

        anchor.setDx1(0);
        anchor.setDy1(0);
        anchor.setDx2(colClientAnchorDetail.getInset());
        anchor.setDy2(rowClientAnchorDetail.getInset());
        anchor.setCol1(colClientAnchorDetail.getFromIndex());
        anchor.setRow1(rowClientAnchorDetail.getFromIndex());
        anchor.setCol2(colClientAnchorDetail.getToIndex());
        anchor.setRow2(rowClientAnchorDetail.getToIndex());


        anchor.setAnchorType(ClientAnchor.MOVE_AND_RESIZE);


        int index = sheet.getWorkbook().addPicture(image, imageType);
        drawing.createPicture(anchor, index);
    }


    private static ImageUnitsConverter.ClientAnchorDetail fitImageToColumns(
            Sheet sheet, int colNumber,
            double reqImageWidthMM, int resizeBehaviour) {

        ImageUnitsConverter.ClientAnchorDetail colClientAnchorDetail = null;

        double colWidthMM = ImageUnitsConverter.widthUnits2Millimetres(
                (short) sheet.getColumnWidth(colNumber));

        double colCoordinatesPerMM;
        int pictureWidthCoordinates;
        if (colWidthMM < reqImageWidthMM) {

            if ((resizeBehaviour == ImageUtils.EXPAND_COLUMN) ||
                    (resizeBehaviour == ImageUtils.EXPAND_ROW_AND_COLUMN)) {
                sheet.setColumnWidth(colNumber,
                        ImageUnitsConverter.millimetres2WidthUnits(reqImageWidthMM));
                if (sheet instanceof HSSFSheet) {
                    colWidthMM = reqImageWidthMM;
                    colCoordinatesPerMM = ImageUnitsConverter.TOTAL_COLUMN_COORDINATE_POSITIONS /
                            colWidthMM;
                    pictureWidthCoordinates = (int) (reqImageWidthMM * colCoordinatesPerMM);

                } else {
                    pictureWidthCoordinates = (int) reqImageWidthMM * ImageUtils.EMU_PER_MM;
                }
                colClientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(colNumber,
                        colNumber, pictureWidthCoordinates);
            } else if ((resizeBehaviour == ImageUtils.OVERLAY_ROW_AND_COLUMN) ||
                    (resizeBehaviour == ImageUtils.EXPAND_ROW)) {
                colClientAnchorDetail = calculateColumnLocation(sheet,
                        colNumber, reqImageWidthMM);
            }
        } else {
            if (sheet instanceof HSSFSheet) {
                colCoordinatesPerMM = ImageUnitsConverter.TOTAL_COLUMN_COORDINATE_POSITIONS /
                        colWidthMM;
                pictureWidthCoordinates = (int) (reqImageWidthMM * colCoordinatesPerMM);
            } else {
                pictureWidthCoordinates = (int) reqImageWidthMM *
                        ImageUtils.EMU_PER_MM;
            }
            colClientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(colNumber,
                    colNumber, pictureWidthCoordinates);
        }
        return (colClientAnchorDetail);
    }


    private static ImageUnitsConverter.ClientAnchorDetail fitImageToRows(
            Sheet sheet, int rowNumber,
            double reqImageHeightMM, int resizeBehaviour) {
        Row row;
        double rowHeightMM;
        double rowCoordinatesPerMM;
        int pictureHeightCoordinates;
        ImageUnitsConverter.ClientAnchorDetail rowClientAnchorDetail = null;

        row = sheet.getRow(rowNumber);
        if (row == null) {
            row = sheet.createRow(rowNumber);
        }

        rowHeightMM = row.getHeightInPoints() / ImageUnitsConverter.POINTS_PER_MILLIMETRE;


        if (rowHeightMM < reqImageHeightMM) {
            if ((resizeBehaviour == EXPAND_ROW) ||
                    (resizeBehaviour == EXPAND_ROW_AND_COLUMN)) {
                row.setHeightInPoints((float) (reqImageHeightMM *
                        ImageUnitsConverter.POINTS_PER_MILLIMETRE));
                if (sheet instanceof HSSFSheet) {
                    rowHeightMM = reqImageHeightMM;
                    rowCoordinatesPerMM = ImageUnitsConverter.TOTAL_ROW_COORDINATE_POSITIONS /
                            rowHeightMM;
                    pictureHeightCoordinates = (int) (reqImageHeightMM *
                            rowCoordinatesPerMM);
                } else {
                    pictureHeightCoordinates = (int) (reqImageHeightMM * EMU_PER_MM);
                }
                rowClientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(rowNumber,
                        rowNumber, pictureHeightCoordinates);
            } else if ((resizeBehaviour == OVERLAY_ROW_AND_COLUMN) ||
                    (resizeBehaviour == EXPAND_COLUMN)) {
                rowClientAnchorDetail = calculateRowLocation(sheet, rowNumber, reqImageHeightMM);
            }
        } else {
            if (sheet instanceof HSSFSheet) {
                rowCoordinatesPerMM = ImageUnitsConverter.TOTAL_ROW_COORDINATE_POSITIONS /
                        rowHeightMM;
                pictureHeightCoordinates = (int) (reqImageHeightMM * rowCoordinatesPerMM);
            } else {
                pictureHeightCoordinates = (int) (reqImageHeightMM * EMU_PER_MM);
            }
            rowClientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(rowNumber,
                    rowNumber, pictureHeightCoordinates);
        }
        return (rowClientAnchorDetail);
    }

    private static ImageUnitsConverter.ClientAnchorDetail calculateColumnLocation(
            Sheet sheet,
            int startingColumn,
            double reqImageWidthMM) {
        ImageUnitsConverter.ClientAnchorDetail anchorDetail;
        double totalWidthMM = 0.0D;
        double colWidthMM = 0.0D;
        double overlapMM;
        double coordinatePositionsPerMM;
        int toColumn = startingColumn;
        int inset;

        while (totalWidthMM < reqImageWidthMM) {
            colWidthMM = ImageUnitsConverter.widthUnits2Millimetres(
                    (short) (sheet.getColumnWidth(toColumn)));

            totalWidthMM += (colWidthMM + ImageUnitsConverter.CELL_BORDER_WIDTH_MILLIMETRES);
            toColumn++;
        }
        toColumn--;
        if ((int) totalWidthMM == (int) reqImageWidthMM) {
            if (sheet instanceof HSSFSheet) {
                anchorDetail = new ImageUnitsConverter.ClientAnchorDetail(startingColumn,
                        toColumn, ImageUnitsConverter.TOTAL_COLUMN_COORDINATE_POSITIONS);
            } else {
                anchorDetail = new ImageUnitsConverter.ClientAnchorDetail(startingColumn,
                        toColumn, (int) reqImageWidthMM * ImageUtils.EMU_PER_MM);
            }
        } else {
            overlapMM = reqImageWidthMM - (totalWidthMM - colWidthMM);

            if (overlapMM < 0) {
                overlapMM = 0.0D;
            }

            if (sheet instanceof HSSFSheet) {
                coordinatePositionsPerMM = ImageUnitsConverter.TOTAL_COLUMN_COORDINATE_POSITIONS /
                        colWidthMM;
                inset = (int) (coordinatePositionsPerMM * overlapMM);
            } else {
                inset = (int) overlapMM * ImageUtils.EMU_PER_MM;
            }

            anchorDetail = new ImageUnitsConverter.ClientAnchorDetail(startingColumn, toColumn, inset);
        }
        return (anchorDetail);
    }


    private static ImageUnitsConverter.ClientAnchorDetail calculateRowLocation(
            Sheet sheet,
            int startingRow, double reqImageHeightMM) {
        ImageUnitsConverter.ClientAnchorDetail clientAnchorDetail;
        Row row;
        double rowHeightMM = 0.0D;
        double totalRowHeightMM = 0.0D;
        double overlapMM;
        double rowCoordinatesPerMM;
        int toRow = startingRow;
        int inset;

        while (totalRowHeightMM < reqImageHeightMM) {
            row = sheet.getRow(toRow);
            if (row == null) {
                row = sheet.createRow(toRow);
            }
            rowHeightMM = row.getHeightInPoints() /
                    ImageUnitsConverter.POINTS_PER_MILLIMETRE;
            totalRowHeightMM += rowHeightMM;
            toRow++;
        }
        toRow--;
        if ((int) totalRowHeightMM == (int) reqImageHeightMM) {
            if (sheet instanceof HSSFSheet) {
                clientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(startingRow, toRow,
                        ImageUnitsConverter.TOTAL_ROW_COORDINATE_POSITIONS);
            } else {
                clientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(startingRow, toRow,
                        (int) reqImageHeightMM * ImageUtils.EMU_PER_MM);
            }
        } else {
            overlapMM = reqImageHeightMM - (totalRowHeightMM - rowHeightMM);

            if (overlapMM < 0) {
                overlapMM = 0.0D;
            }

            if (sheet instanceof HSSFSheet) {
                rowCoordinatesPerMM = ImageUnitsConverter.TOTAL_ROW_COORDINATE_POSITIONS /
                        rowHeightMM;
                inset = (int) (overlapMM * rowCoordinatesPerMM);
            } else {
                inset = (int) overlapMM * ImageUtils.EMU_PER_MM;
            }
            clientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(startingRow,
                    toRow, inset);
        }
        return (clientAnchorDetail);
    }

}
