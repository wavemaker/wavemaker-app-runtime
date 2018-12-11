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

import java.lang.reflect.Method;
import java.sql.Date;
import java.sql.ResultSet;
import java.util.Optional;

import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellType;
import org.hibernate.ScrollableResults;
import org.hibernate.internal.AbstractScrollableResults;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.export.ExportCellStyles;
import com.wavemaker.runtime.data.model.JavaType;
import com.wavemaker.runtime.data.util.JavaTypeUtils;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 07/11/16
 */
public class DataSourceExporterUtil {

    private DataSourceExporterUtil() {
    }


    public static ResultSet constructResultSet(ScrollableResults scroll) {
        try {
            Method resultSetMethod = AbstractScrollableResults.class.getDeclaredMethod("getResultSet");
            resultSetMethod.setAccessible(true);
            return (ResultSet) resultSetMethod.invoke(scroll);
        } catch (Exception e) {
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.failed.to.fetch.resultset"), e);
        }
    }


    public static void setCellValue(Object data, final Cell cell, ExportCellStyles cellStyles) {
        try {
            cell.setCellStyle(cellStyles.getColumnCellStyle());
            if (data != null) {
                final Optional<JavaType> typeOptional = JavaTypeUtils.fromClassName(data.getClass().getCanonicalName());
                if (typeOptional.isPresent()) {
                    switch (typeOptional.get()) {
                        case BLOB:
                            ImageUtils.addImageToSheet((byte[]) data, cell);
                            break;
                        case DATE:
                            cell.setCellValue((Date) data);
                            cell.setCellStyle(cellStyles.getDateCellStyle());
                            break;
                        case INTEGER:
                        case SHORT:
                        case LONG:
                        case BIG_INTEGER:
                        case DOUBLE:
                        case FLOAT:
                        case BIG_DECIMAL:
                            cell.setCellType(CellType.NUMERIC);
                            cell.setCellValue((double) JavaType.DOUBLE.fromString(data.toString()));
                            break;
                        case BOOLEAN:
                            cell.setCellValue((boolean) data);
                            break;
                        default:
                            cell.setCellValue(data.toString());
                            break;
                    }
                } else {
                    cell.setCellValue(data.toString());
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error while exporting data to report", e);
        }
    }
}
