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
package com.wavemaker.runtime.data.filter;

import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/12/16
 */
public enum WMHqlFunction {
    DT {
        @Override
        public Object convertValue(final String fromValue) {
            return JavaType.DATETIME.fromString(fromValue);
        }
    },
    TS {
        @Override
        public Object convertValue(final String fromValue) {
            return JavaType.TIMESTAMP.fromString(fromValue);
        }
    },
    FLOAT {
        @Override
        public Object convertValue(final String fromValue) {
            return JavaType.FLOAT.fromString(fromValue);
        }
    },
    BOOL {
        @Override
        public Object convertValue(final String fromValue) {
            return JavaType.BOOLEAN.fromString(fromValue);
        }
    };

    public abstract Object convertValue(String fromValue);
}
