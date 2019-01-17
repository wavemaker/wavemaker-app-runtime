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
package com.wavemaker.runtime.rest.util;

import java.net.HttpCookie;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.apache.commons.collections4.CollectionUtils;
import org.apache.commons.lang3.StringUtils;
import org.springframework.http.MediaType;

import com.wavemaker.runtime.rest.model.HttpResponseDetails;

/**
 * @author Uday Shankar
 */
public class HttpResponseUtils {

    private HttpResponseUtils(){}

    private static final String SET_COOKIE_HEADER="Set-Cookie";

    public static List<HttpCookie> getCookies(HttpResponseDetails httpResponseDetails) {
        List<HttpCookie> httpCookieList = new ArrayList<>();
        Map<String, List<String>> responseHeaders = httpResponseDetails.getHeaders();
        if (responseHeaders != null) {
            List<String> setCookieHeaderValues = responseHeaders.get(SET_COOKIE_HEADER);
            if (CollectionUtils.isNotEmpty(setCookieHeaderValues)) {
                for (String setCookieHeaderValue : setCookieHeaderValues) {
                    List<HttpCookie> httpCookies = HttpCookie.parse(setCookieHeaderValue);
                    httpCookieList.addAll(httpCookies);
                }
                return httpCookieList;
            }
        }
        return httpCookieList;
    }

    public static void setCookies(HttpResponseDetails httpResponseDetails, List<HttpCookie> httpCookieList) {
        Map<String, List<String>> responseHeaders = httpResponseDetails.getHeaders();
        responseHeaders.remove(SET_COOKIE_HEADER);
        List<String> setCookieHeaderValues = new ArrayList<>();
        for (HttpCookie httpCookie : httpCookieList) {
            setCookieHeaderValues.add(toString(httpCookie));
        }
        if (!setCookieHeaderValues.isEmpty()) {
            responseHeaders.put(SET_COOKIE_HEADER, setCookieHeaderValues);
        }
    }

    public static String toString(HttpCookie httpCookie) {
        StringBuilder result = new StringBuilder()
                .append(httpCookie.getName())
                .append("=")
                .append("\"")
                .append(httpCookie.getValue())
                .append("\"");

        if(StringUtils.isNotBlank(httpCookie.getPath())){
            result.append("; path=").append(httpCookie.getPath());
        }
        if(httpCookie.getDiscard()){
            result.append("; discard=").append(1);
        }
        if(httpCookie.getMaxAge() != -1){
            result.append("; max-age=").append(httpCookie.getMaxAge());
        }

        return result.toString();
    }

    public static String toStringWithoutParameters(MediaType mediaType) {
        StringBuilder sb = new StringBuilder();
        sb.append(mediaType.getType());
        sb.append('/');
        sb.append(mediaType.getSubtype());
        return sb.toString();
    }
}
