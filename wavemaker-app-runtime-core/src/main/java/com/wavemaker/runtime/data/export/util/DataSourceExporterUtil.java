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

import java.lang.reflect.Method;
import java.sql.ResultSet;

import org.apache.poi.ss.usermodel.Cell;
import org.hibernate.ScrollableResults;
import org.hibernate.internal.AbstractScrollableResults;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 07/11/16
 */
public class DataSourceExporterUtil {

    private DataSourceExporterUtil(){}


    public static ResultSet constructResultSet(ScrollableResults scroll) {
        try {
            Method resultSetMethod = AbstractScrollableResults.class.getDeclaredMethod("getResultSet");
            resultSetMethod.setAccessible(true);
            return (ResultSet) resultSetMethod.invoke(scroll);
        } catch (Exception e) {
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.failed.to.fetch.resultset"), e);
        }
    }


    public static void setCellValue(Object data, final Cell cell) {
        try {
            if (data != null) {
                if (!byte[].class.equals(data.getClass())) {
                    cell.setCellValue(data.toString());
                } else {
                    ImageUtils.addImageToSheet((byte[]) data, cell);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Error while exporting data to report", e);
        }
    }
}
