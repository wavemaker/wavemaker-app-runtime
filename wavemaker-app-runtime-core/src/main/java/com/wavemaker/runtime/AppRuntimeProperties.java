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
package com.wavemaker.runtime;

import java.io.InputStream;
import java.util.Properties;

import com.wavemaker.commons.util.PropertiesFileUtils;
import com.wavemaker.commons.util.WMIOUtils;

/**
 * Created by srujant on 29/12/16.
 */
public class AppRuntimeProperties {

    private AppRuntimeProperties(){}


    private static Properties properties;

    static {
        InputStream inputStream = AppRuntimeProperties.class.getClassLoader().getResourceAsStream("app.properties");
        properties = PropertiesFileUtils.loadProperties(inputStream);
        WMIOUtils.closeSilently(inputStream);
    }

    public static String getProperty(String key) {
        return properties.getProperty(key);
    }


}
