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
package com.wavemaker.runtime.data.export;

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Blob;
import java.sql.Clob;
import java.sql.Time;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 26/5/16
 */
public enum DataType {

    BYTE(Arrays.asList(Byte.class.getName(), byte.class.getName())) {

    },
    SHORT(Arrays.asList(Short.class.getName(), short.class.getName())) {

    },
    INTEGER(Arrays.asList(Integer.class.getName(), int.class.getName())) {

    },
    LONG(Arrays.asList(Long.class.getName(), long.class.getName())) {

    },
    BIG_INTEGER(Collections.singletonList(BigInteger.class.getName())) {

    },
    FLOAT(Arrays.asList(Float.class.getName(), float.class.getName())) {

    },
    DOUBLE(Arrays.asList(Double.class.getName(), double.class.getName())) {

    },
    BIG_DECIMAL(Collections.singletonList(BigDecimal.class.getName())) {

    },
    BOOLEAN(Arrays.asList(Boolean.class.getName(), boolean.class.getName())) {

    },
    CHARACTER(Arrays.asList(Character.class.getName(), char.class.getName())) {

    },
    STRING(Arrays.asList(String.class.getName(), Clob.class.getName())) {

    },
    BLOB(Arrays.asList(Byte[].class.getName(), byte[].class.getName(), Blob.class.getName())) {

    },
    DATE(Arrays.asList(Date.class.getName(), java.sql.Date.class.getName(), Time.class.getName(),
            Timestamp.class.getName())) {

    },
    DATETIME(Collections.singletonList(LocalDateTime.class.getName())) {

    },
    OBJECT(Collections.singletonList(Object.class.getName())) {

    },
    LIST(Collections.singletonList(List.class.getName())) {

    };

    private final List<String> classNames;


    private static Map<String, DataType> classNameVsTypesMap = new HashMap<>();


    static {
        for (final DataType types : DataType.values()) {
            for (String className : types.getClassNames()) {
                classNameVsTypesMap.put(className, types);
            }
        }
    }

    public static DataType valueFor(String value) {
        return classNameVsTypesMap.get(value);
    }

    DataType(final List<String> classNames) {
        this.classNames = classNames;
    }

    public List<String> getClassNames() {
        return classNames;
    }
}
