/**
 * Copyright © 2015 WaveMaker, Inc.
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
package com.wavemaker.runtime.data.util;

import org.hibernate.exception.SQLGrammarException;
import org.springframework.dao.InvalidDataAccessResourceUsageException;

import com.wavemaker.runtime.data.exception.DataServiceRuntimeException;
import com.wavemaker.studio.common.util.SystemUtils;

/**
 * @author Simon Toens
 */
public class DataServiceUtils {

    public static RuntimeException unwrap(Throwable th) {
        if (th instanceof DataServiceRuntimeException) {
            return (DataServiceRuntimeException) th;
        } else {
            th = SystemUtils.getRootException(th);

            if (InvalidDataAccessResourceUsageException.class.isAssignableFrom(th.getClass())) {
                InvalidDataAccessResourceUsageException e = (InvalidDataAccessResourceUsageException) th;
                if (e.getRootCause() != null) {
                    th = e.getRootCause();
                }
            }
            if (th instanceof RuntimeException) {
                return (RuntimeException) th;
            } else {
                return new DataServiceRuntimeException(th);
            }
        }
    }

    public static boolean isDML(String query) {

        String q = query.trim().toLowerCase();

        return q.startsWith("update") || q.startsWith("insert") || q.startsWith("delete") || q.startsWith("alter");
    }

    private DataServiceUtils() {
    }

}
