/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.export.util;


import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.ClientAnchor;
import org.apache.poi.ss.usermodel.Drawing;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;

/**
 * This code is taken from org.apache.poi.ss.examples.AddDimensionedImage
 *
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 3/11/16
 */
public class ImageUtils {

    private static final int EXPAND_ROW = 1;
    private static final int EXPAND_COLUMN = 2;
    private static final int EXPAND_ROW_AND_COLUMN = 3;
    private static final int OVERLAY_ROW_AND_COLUMN = 7;


    private static final int EMU_PER_MM = 36000;

    private ImageUtils() {}

    public static void addImageToSheet(byte[] image, Cell cell) {
        final Row row = cell.getRow();
        final Sheet sheet = row.getSheet(); // we always provide XSSFSheet

        int resizeBehaviour = ImageUtils.EXPAND_ROW_AND_COLUMN;
        int reqImageWidthMM = 20;
        int reqImageHeightMM = 30;
        ImageUnitsConverter.ClientAnchorDetail colClientAnchorDetail = fitImageToColumns(sheet, cell.getColumnIndex(),
                reqImageWidthMM, resizeBehaviour);
        ImageUnitsConverter.ClientAnchorDetail rowClientAnchorDetail = fitImageToRows(sheet, row.getRowNum(),
                reqImageHeightMM, resizeBehaviour);

        if(colClientAnchorDetail != null && rowClientAnchorDetail != null) {
            ClientAnchor anchor = getClientAnchor(sheet, colClientAnchorDetail, rowClientAnchorDetail);

            int index = sheet.getWorkbook().addPicture(image, Workbook.PICTURE_TYPE_JPEG);
            final Drawing drawing = sheet.createDrawingPatriarch();
            drawing.createPicture(anchor, index);
        }
    }

    private static ImageUnitsConverter.ClientAnchorDetail fitImageToColumns(
            Sheet sheet, int colNumber, double reqImageWidthMM, int resizeBehaviour) {

        ImageUnitsConverter.ClientAnchorDetail colClientAnchorDetail = null;

        double colWidthMM = ImageUnitsConverter.widthUnits2Millimetres(
                (short) sheet.getColumnWidth(colNumber));

        int pictureWidthCoordinates;
        if (colWidthMM < reqImageWidthMM) {
            if ((resizeBehaviour == ImageUtils.EXPAND_COLUMN) ||
                    (resizeBehaviour == ImageUtils.EXPAND_ROW_AND_COLUMN)) {
                sheet.setColumnWidth(colNumber,
                        ImageUnitsConverter.millimetres2WidthUnits(reqImageWidthMM));

                pictureWidthCoordinates = (int) reqImageWidthMM * ImageUtils.EMU_PER_MM;

                colClientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(colNumber,
                        colNumber, pictureWidthCoordinates);
            } else if ((resizeBehaviour == ImageUtils.OVERLAY_ROW_AND_COLUMN) ||
                    (resizeBehaviour == ImageUtils.EXPAND_ROW)) {
                colClientAnchorDetail = calculateColumnLocation(sheet,
                        colNumber, reqImageWidthMM);
            }
        } else {
            pictureWidthCoordinates = (int) reqImageWidthMM * ImageUtils.EMU_PER_MM;
            colClientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(colNumber,
                    colNumber, pictureWidthCoordinates);
        }
        return colClientAnchorDetail;
    }


    private static ImageUnitsConverter.ClientAnchorDetail fitImageToRows(
            Sheet sheet, int rowNumber, double reqImageHeightMM, int resizeBehaviour) {
        Row row;
        double rowHeightMM;
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
                pictureHeightCoordinates = (int) (reqImageHeightMM * EMU_PER_MM);
                rowClientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(rowNumber,
                        rowNumber, pictureHeightCoordinates);
            } else if ((resizeBehaviour == OVERLAY_ROW_AND_COLUMN) ||
                    (resizeBehaviour == EXPAND_COLUMN)) {
                rowClientAnchorDetail = calculateRowLocation(sheet, rowNumber, reqImageHeightMM);
            }
        } else {
            pictureHeightCoordinates = (int) (reqImageHeightMM * EMU_PER_MM);
            rowClientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(rowNumber,
                    rowNumber, pictureHeightCoordinates);
        }
        return (rowClientAnchorDetail);
    }

    private static ImageUnitsConverter.ClientAnchorDetail calculateColumnLocation(
            Sheet sheet, int startingColumn, double reqImageWidthMM) {
        double totalWidthMM = 0.0D;
        double colWidthMM = 0.0D;
        int toColumn = startingColumn;

        while (totalWidthMM < reqImageWidthMM) {
            colWidthMM = ImageUnitsConverter.widthUnits2Millimetres(
                    (short) (sheet.getColumnWidth(toColumn)));

            totalWidthMM += (colWidthMM + ImageUnitsConverter.CELL_BORDER_WIDTH_MILLIMETRES);
            toColumn++;
        }
        toColumn--;
        return getClientAnchorDetail(startingColumn, reqImageWidthMM, totalWidthMM, colWidthMM, toColumn);
    }

    private static ImageUnitsConverter.ClientAnchorDetail calculateRowLocation(
            Sheet sheet, int startingRow, double reqImageHeightMM) {
        Row row;
        double rowHeightMM = 0.0D;
        double totalRowHeightMM = 0.0D;
        int toRow = startingRow;

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
        return getClientAnchorDetail(startingRow, reqImageHeightMM, rowHeightMM, totalRowHeightMM, toRow);
    }

    private static ImageUnitsConverter.ClientAnchorDetail getClientAnchorDetail(
            final int fromIndex, final double requiredDimension, final double indexDimension,
            final double totalDimension, final int toIndex) {
        ImageUnitsConverter.ClientAnchorDetail clientAnchorDetail;

        if ((int) totalDimension == (int) requiredDimension) {
            clientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(fromIndex, toIndex,
                    (int) requiredDimension * ImageUtils.EMU_PER_MM);
        } else {
            double overlapMM = requiredDimension - (totalDimension - indexDimension);
            if (overlapMM < 0) {
                overlapMM = 0.0D;
            }
            int inset = (int) overlapMM * ImageUtils.EMU_PER_MM;
            clientAnchorDetail = new ImageUnitsConverter.ClientAnchorDetail(fromIndex, toIndex, inset);
        }
        return clientAnchorDetail;
    }

    private static ClientAnchor getClientAnchor(
            final Sheet sheet, final ImageUnitsConverter.ClientAnchorDetail colClientAnchorDetail,
            final ImageUnitsConverter.ClientAnchorDetail rowClientAnchorDetail) {
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
        return anchor;
    }

}
