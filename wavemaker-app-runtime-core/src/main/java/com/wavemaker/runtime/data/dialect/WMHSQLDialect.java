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
package com.wavemaker.runtime.data.dialect;

import org.hibernate.dialect.HSQLDialect;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 26/4/16
 */
public class WMHSQLDialect extends HSQLDialect {

    public static final char EMPTY_CHAR = ' ';

    /**
     * The character specific to this dialect used to begin a quoted identifier.
     *
     * @return The dialect's specific open quote character.
     */
    public char openQuote() {
        return EMPTY_CHAR;
    }

    /**
     * The character specific to this dialect used to close a quoted identifier.
     *
     * @return The dialect's specific close quote character.
     */
    public char closeQuote() {
        return EMPTY_CHAR;
    }

}
