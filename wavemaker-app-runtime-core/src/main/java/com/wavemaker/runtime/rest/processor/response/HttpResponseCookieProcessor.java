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
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Collections;
import java.util.List;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.rest.model.CookieStore;
import com.wavemaker.runtime.rest.model.HttpResponseDetails;
import com.wavemaker.runtime.rest.util.HttpResponseUtils;

/**
 * @author Uday Shankar
 */
public class HttpResponseCookieProcessor extends AbstractHttpResponseProcessor {

    private PersistenceStrategy persistenceStrategy;

    @Override
    public void doProcess(HttpResponseProcessorContext httpResponseProcessorContext) {
        HttpServletRequest httpServletRequest = httpResponseProcessorContext.getHttpServletRequest();
        if (httpServletRequest == null) {
            return;
        }
        HttpResponseDetails httpResponseDetails = httpResponseProcessorContext.getHttpResponseDetails();
        List<HttpCookie> cookies = HttpResponseUtils.getCookies(httpResponseDetails);


        switch (persistenceStrategy) {
            case CLIENT:
                updateCookiePath(httpServletRequest, httpResponseDetails, cookies);
                break;
            case USER_SESSION:
                persistInUserSession(httpResponseProcessorContext, httpServletRequest, cookies);
                HttpResponseUtils.setCookies(httpResponseDetails, Collections.emptyList());
                break;
            case NONE:
                HttpResponseUtils.setCookies(httpResponseDetails, Collections.emptyList());
                break;
            default:
                throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.unknown.strategytype"));
        }
    }


    private void updateCookiePath(HttpServletRequest httpServletRequest, HttpResponseDetails httpResponseDetails, List<HttpCookie> cookies) {
        String newCookiePath = getCookiePath(httpServletRequest);
        if (StringUtils.isNotBlank(newCookiePath) && CollectionUtils.isNotEmpty(cookies)) {
            for (HttpCookie httpCookie : cookies) {
                httpCookie.setPath(newCookiePath);//Updates path
            }
            HttpResponseUtils.setCookies(httpResponseDetails, cookies);
        }
    }

    private void persistInUserSession(HttpResponseProcessorContext httpResponseProcessorContext, HttpServletRequest httpServletRequest, List<HttpCookie> cookies) {
        HttpSession httpSession = httpServletRequest.getSession(false);
        if (httpSession != null) {
            CookieStore cookieStore = (CookieStore) httpSession.getAttribute("wm.cookieStore");
            synchronized (httpSession) {
                if (cookieStore == null) {
                    cookieStore = new CookieStore();
                    httpSession.setAttribute("wm.cookieStore", cookieStore);
                }

            }
            URL url = null;
            try {
                url = new URL(httpResponseProcessorContext.getHttpRequestDetails().getEndpointAddress());
            } catch (MalformedURLException e) {
                throw new WMRuntimeException(e);
            }
            String host = url.getHost();
            for (HttpCookie httpCookie : cookies) {
                cookieStore.addCookie(host, httpCookie);
            }
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

    public enum PersistenceStrategy {
        CLIENT,
        USER_SESSION,
        NONE
    }


    public PersistenceStrategy getPersistenceStrategy() {
        return persistenceStrategy;
    }

    public void setPersistenceStrategy(PersistenceStrategy persistenceStrategy) {
        this.persistenceStrategy = persistenceStrategy;
    }
}
