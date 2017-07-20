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
package com.wavemaker.runtime.servicedef.helper;

import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.type.TypeReference;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.commons.servicedef.model.ServiceDefinition;
import com.wavemaker.commons.util.WMIOUtils;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 21/3/16
 */
public class ServiceDefinitionHelper {

    private static final Logger logger = LoggerFactory.getLogger(ServiceDefinitionHelper.class);

    public Map<String, ServiceDefinition> build(InputStream inputStream) {
        if (inputStream == null) {
            throw new WMRuntimeException("Attempt to build service definition from null input stream");
        }
        logger.debug("Building service definitions from InputStream");
        final String serviceDefJson = WMIOUtils.toString(inputStream);
        return buildServiceDef(serviceDefJson);
    }

    public Map<String, ServiceDefinition> build(String serviceDefJson) {
        if (serviceDefJson == null) {
            throw new WMRuntimeException("Attempt to build service def from null String");
        }
        logger.debug("Building service definition from json content");
        return buildServiceDef(serviceDefJson);
    }

    private Map<String, ServiceDefinition> buildServiceDef(String serviceDefJson) {
        try {
            Map<String, ServiceDefinition> serviceDefMap = new HashMap<>();
            if (StringUtils.isNotBlank(serviceDefJson)) {
                serviceDefMap = JSONUtils.toObject(serviceDefJson, new TypeReference<HashMap<String, ServiceDefinition>>() {
                });
            }
            return serviceDefMap;
        } catch (IOException e) {
            throw new WMRuntimeException("Failed to build service def from the given json", e);
        }
    }

}
