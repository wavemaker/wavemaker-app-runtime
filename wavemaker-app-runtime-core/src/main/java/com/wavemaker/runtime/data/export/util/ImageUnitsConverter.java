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

/**
 * This code is taken from org.apache.poi.ss.examples
 *
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 21/11/16
 */
public class ImageUnitsConverter {

    private ImageUnitsConverter(){}

    public static final int TOTAL_COLUMN_COORDINATE_POSITIONS = 1023; // MB
    public static final int TOTAL_ROW_COORDINATE_POSITIONS = 255;     // MB
    public static final int PIXELS_PER_INCH = 96;                     // MB
    public static final double PIXELS_PER_MILLIMETRES = 3.78;         // MB
    public static final double POINTS_PER_MILLIMETRE = 2.83;          // MB
    public static final double CELL_BORDER_WIDTH_MILLIMETRES = 2.0D;  // MB
    public static final short EXCEL_COLUMN_WIDTH_FACTOR = 256;
    public static final int UNIT_OFFSET_LENGTH = 7;
    private static final int[] UNIT_OFFSET_MAP = {0, 36, 73, 109, 146, 182, 219};


    public static short pixel2WidthUnits(int pxs) {
        short widthUnits = (short) (EXCEL_COLUMN_WIDTH_FACTOR *
                (pxs / UNIT_OFFSET_LENGTH));
        widthUnits += UNIT_OFFSET_MAP[(pxs % UNIT_OFFSET_LENGTH)];
        return widthUnits;
    }


    public static int widthUnits2Pixel(short widthUnits) {
        int pixels = (widthUnits / EXCEL_COLUMN_WIDTH_FACTOR)
                * UNIT_OFFSET_LENGTH;
        int offsetWidthUnits = widthUnits % EXCEL_COLUMN_WIDTH_FACTOR;
        pixels += Math.round((float) offsetWidthUnits /
                ((float) EXCEL_COLUMN_WIDTH_FACTOR / UNIT_OFFSET_LENGTH));
        return pixels;
    }

    public static double widthUnits2Millimetres(short widthUnits) {
        return (ImageUnitsConverter.widthUnits2Pixel(widthUnits) /
                ImageUnitsConverter.PIXELS_PER_MILLIMETRES);
    }


    public static int millimetres2WidthUnits(double millimetres) {
        return (ImageUnitsConverter.pixel2WidthUnits((int) (millimetres *
                ImageUnitsConverter.PIXELS_PER_MILLIMETRES)));
    }


    public static class ClientAnchorDetail {

        private int fromIndex = 0;
        private int toIndex = 0;
        private int inset = 0;


        public ClientAnchorDetail(int fromIndex, int toIndex, int inset) {
            this.fromIndex = fromIndex;
            this.toIndex = toIndex;
            this.inset = inset;
        }


        public int getFromIndex() {
            return (this.fromIndex);
        }


        public int getToIndex() {
            return (this.toIndex);
        }


        public int getInset() {
            return (this.inset);
        }

    }

}
