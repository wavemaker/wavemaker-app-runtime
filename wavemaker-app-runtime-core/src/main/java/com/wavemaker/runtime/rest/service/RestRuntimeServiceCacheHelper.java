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
package com.wavemaker.runtime.rest.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.WeakHashMap;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.commons.util.WMIOUtils;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.rest.model.RestServiceInfoBean;
import com.wavemaker.runtime.rest.processor.RestRuntimeConfig;
import com.wavemaker.runtime.rest.processor.data.HttpRequestDataProcessor;
import com.wavemaker.runtime.rest.processor.data.XWMPrefixDataProcessor;
import com.wavemaker.runtime.util.PropertyPlaceHolderReplacementHelper;
import com.wavemaker.tools.apidocs.tools.core.model.Swagger;

/**
 * @author Uday Shankar
 */
public class RestRuntimeServiceCacheHelper {

    private Map<String, Swagger> serviceIdVsSwaggerCache = new WeakHashMap<>();
    private PropertyPlaceHolderReplacementHelper propertyPlaceHolderReplacementHelper;


    public Swagger getSwaggerDoc(String serviceId) {
        if (!serviceIdVsSwaggerCache.containsKey(serviceId)) {
            InputStream stream = null;
            try {
                stream = Thread.currentThread().getContextClassLoader().getResourceAsStream(serviceId + "_apiTarget.json");
                Reader reader = propertyPlaceHolderReplacementHelper.getPropertyReplaceReader(stream);
                Swagger swaggerDoc = JSONUtils.toObject(reader, Swagger.class);
                serviceIdVsSwaggerCache.put(serviceId, swaggerDoc);
            } catch (IOException e) {
                throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.failed.to.read.swagger"), e, serviceId);
            } finally {
                WMIOUtils.closeSilently(stream);
            }
        }
        return serviceIdVsSwaggerCache.get(serviceId);
    }

    public List<HttpRequestDataProcessor> getHttpRequestDataProcessors(String serviceId) {
        List<HttpRequestDataProcessor> httpRequestDataProcessors = new ArrayList<>();
        httpRequestDataProcessors.add(new XWMPrefixDataProcessor());
        return httpRequestDataProcessors;
    }

    public RestRuntimeConfig getAppRuntimeConfig(String serviceId) {
        RestServiceInfoBean restServiceInfoBean = WMAppContext.getInstance().getSpringBean(serviceId + "ServiceInfo");
        return restServiceInfoBean.getRestRuntimeConfig();
    }

    public void setPropertyPlaceHolderReplacementHelper(PropertyPlaceHolderReplacementHelper propertyPlaceHolderReplacementHelper) {
        this.propertyPlaceHolderReplacementHelper = propertyPlaceHolderReplacementHelper;
    }
}
