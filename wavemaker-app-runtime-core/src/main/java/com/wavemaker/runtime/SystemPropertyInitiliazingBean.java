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

import java.util.Map;

import org.apache.commons.collections.MapUtils;
import org.springframework.beans.factory.InitializingBean;

public class SystemPropertyInitiliazingBean implements InitializingBean {

    private Map<String, String> systemProperties;

    @Override
    public void afterPropertiesSet() throws Exception {
        if (MapUtils.isNotEmpty(this.systemProperties)) {
            systemProperties.forEach(System::setProperty);
        }
    }

    public void setSystemProperties(Map<String, String> systemProperties) {
        this.systemProperties = systemProperties;
    }

}
