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
package com.wavemaker.runtime.rest.model;

/**
 * Created by ArjunSahasranam on 6/10/15.
 */

import com.wavemaker.runtime.rest.processor.RestRuntimeConfig;

/**
 * Responsible for registering rest urls to SimpleUrlHandlerMapping through RestServiceBeanPostProcessor.
 */
public class RestServiceInfoBean {
    private String url;
    private String httpMethod;
    private String serviceName;
    private RestRuntimeConfig restRuntimeConfig;

    public RestServiceInfoBean() {

    }

    public String getUrl() {
        return url;
    }

    public void setUrl(final String url) {
        this.url = url;
    }

    public String getHttpMethod() {
        return httpMethod;
    }

    public void setHttpMethod(final String httpMethod) {
        this.httpMethod = httpMethod;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(final String serviceName) {
        this.serviceName = serviceName;
    }

    public RestRuntimeConfig getRestRuntimeConfig() {
        return restRuntimeConfig;
    }

    public void setRestRuntimeConfig(RestRuntimeConfig restRuntimeConfig) {
        this.restRuntimeConfig = restRuntimeConfig;
    }

    @Override
    public String toString() {
        return "Service:" + serviceName + " Url:" + url + " Method:" + httpMethod;
    }
}
