/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
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

import com.wavemaker.studio.json.AlternateJSONTransformer;

/**
 * @author Simon Toens
 */
public class DataServiceConstants {

    public static final String SPRING_CFG_LOCATIONS_ATTR = "locations";

    public static final String SPRING_CFG_EXT = ".spring.xml";

    public static final String ANNO_CHAR = "@";

    public static final String DESIGN_ANNO_CHAR = ANNO_CHAR + "design.";

    public static final String GENERATED_QUERY = DESIGN_ANNO_CHAR + "generated";

    public static final String DB_USERNAME = ".username";

    public static final String DB_PASS = ".password";

    public static final String DB_URL = ".url";

    public static final String CONNECTION_URL = ".url";

    public static final String DB_DRIVER_CLASS_NAME = ".driver_class";

    public static final String DB_DIALECT = ".dialect";

    public static final String DATA_PACKAGE_NAME = "data";

    public static final String PROP_SEP = "" + AlternateJSONTransformer.PROP_SEP;

    public static final String WEB_ROOT_TOKEN = "{WebAppRoot}";

    public static final String TENANT_FIELD_PROPERTY_NAME = "tenantIdField";

    public static final String TENANT_COLUMN_PROPERTY_NAME = "tenantIdColumn";

    public static final String DEFAULT_TENANT_ID_PROPERTY_NAME = "defTenantId";

    public static final String DEFAULT_TENANT_FIELD = "None";

    public static final int DEFAULT_TENANT_ID = 999;

    public static final String QUERY_EXECUTION_CONTROLLER_JAVA = "QueryExecutionController.java";

    public static final String CONTROLLER_DIR = "controller/";

    private DataServiceConstants() {
    }

}
