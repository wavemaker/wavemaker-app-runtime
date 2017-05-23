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
package com.wavemaker.runtime.rest.processor.response;

import java.net.HttpCookie;
import java.util.Collections;
import java.util.List;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.InitializingBean;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.rest.model.HttpResponseDetails;
import com.wavemaker.runtime.rest.util.HttpResponseUtils;

/**
 * @author Uday Shankar
 */
public class HttpResponseCookieProcessor extends AbstractHttpResponseProcessor implements InitializingBean {

    private boolean clearCookieHeader;
    private boolean updateCookiePath;

    @Override
    public void afterPropertiesSet() throws Exception {
        if (clearCookieHeader && updateCookiePath) {
            throw new WMRuntimeException("Cannot have both clearCookieHeader and updateCookiePath set");
        }
    }


    @Override
    public void doProcess(HttpResponseProcessorContext httpResponseProcessorContext) {
        HttpResponseDetails httpResponseDetails = httpResponseProcessorContext.getHttpResponseDetails();
        if(updateCookiePath) {
            List<HttpCookie> cookies = HttpResponseUtils.getCookies(httpResponseDetails);
            String cookiePath = getCookiePath(httpResponseProcessorContext.getHttpServletRequest());
            if (StringUtils.isNotBlank(cookiePath) && CollectionUtils.isNotEmpty(cookies)) {
                for (HttpCookie httpCookie : cookies) {
                    httpCookie.setPath(cookiePath);//Updates path
                }
                HttpResponseUtils.setCookies(httpResponseDetails, cookies);
            }
        }
        if(clearCookieHeader){
            HttpResponseUtils.setCookies(httpResponseDetails, Collections.EMPTY_LIST);
        }
    }

    private String getCookiePath(HttpServletRequest httpServletRequest) {
        StringBuilder sb = new StringBuilder();
        if (StringUtils.isNotBlank(httpServletRequest.getContextPath())) {
            sb.append(httpServletRequest.getContextPath());
        }

        if (StringUtils.isNotBlank(httpServletRequest.getServletPath())) {
            sb.append(httpServletRequest.getServletPath());
        }

        if (StringUtils.isNotBlank(httpServletRequest.getPathInfo())) {
            sb.append(httpServletRequest.getPathInfo());
        }
        return sb.toString();
    }

    public boolean isClearCookieHeader() {
        return clearCookieHeader;
    }

    public void setClearCookieHeader(boolean clearCookieHeader) {
        this.clearCookieHeader = clearCookieHeader;
    }

    public boolean isUpdateCookiePath() {
        return updateCookiePath;
    }

    public void setUpdateCookiePath(boolean updateCookiePath) {
        this.updateCookiePath = updateCookiePath;
    }
}
