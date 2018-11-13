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
import java.io.Reader;
import java.util.HashMap;
import java.util.Map;

import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.fasterxml.jackson.core.type.TypeReference;
import com.wavemaker.commons.MessageResource;
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

    public Map<String, ServiceDefinition> build( Reader reader) {
        logger.debug("Building service definitions from Reader");
        final String serviceDefJson = WMIOUtils.toString(reader);
        return buildServiceDef(serviceDefJson);
    }

    public Map<String, ServiceDefinition> build(String serviceDefJson) {
        if (serviceDefJson == null) {
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.invalid.attempt.to.build.service.definition"), "String");
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
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.invalid.attempt.to.build.service.definition"), e, "json");
        }
    }

}
