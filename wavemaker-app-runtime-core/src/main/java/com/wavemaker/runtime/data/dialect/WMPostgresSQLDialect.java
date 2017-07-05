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

import org.hibernate.dialect.PostgreSQL82Dialect;
import org.hibernate.dialect.identity.IdentityColumnSupport;

import com.wavemaker.commons.CommonConstants;

/**
 * @author Dilip Kumar
 * @since 19/4/16
 */
public class WMPostgresSQLDialect extends  PostgreSQL82Dialect {

    public WMPostgresSQLDialect() {
        super();

        registerColumnType(CommonConstants.DATE_TIME_WM_TYPE_CODE, "timestamp without time zone");
    }

    @Override
    public IdentityColumnSupport getIdentityColumnSupport() {
        return new WMPostgresIdentityColumnSupport();
    }
}
