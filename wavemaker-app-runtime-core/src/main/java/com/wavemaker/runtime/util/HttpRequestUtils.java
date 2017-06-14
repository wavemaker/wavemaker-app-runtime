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
package com.wavemaker.runtime.util;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.ByteArrayHttpMessageConverter;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.converter.StringHttpMessageConverter;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import com.wavemaker.commons.io.DeleteTempFileOnCloseInputStream;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.runtime.rest.model.Message;

/**
 * Created by ArjunSahasranam on 9/6/16.
 */
public class HttpRequestUtils {
    private HttpRequestUtils() {

    }

    public static boolean isAjaxRequest(HttpServletRequest request) {
        return "XMLHttpRequest".equals(request.getHeader("X-Requested-With"));
    }

    public static String getServiceUrl(HttpServletRequest request) {
        StringBuffer requestURL = request.getRequestURL();
        String contextPath = request.getContextPath();

        String serviceHostUrl = requestURL.substring(0, requestURL.lastIndexOf(contextPath));
        String serviceUrl = serviceHostUrl + contextPath;
        return serviceUrl;
    }

    public static Message getFormMessage(Map<String, Object> map) {
        MultiValueMap<String, Object> multiValueMap = getMultiValueMap(map);
        return createMessage(multiValueMap, MediaType.APPLICATION_FORM_URLENCODED_VALUE);
    }

    public static Message getMultipartMessage(Map<String, Object> map) {
        MultiValueMap<String, Object> multiValueMap = getMultiValueMap(map);
        return createMessage(multiValueMap, MediaType.MULTIPART_FORM_DATA_VALUE);
    }

    public static Message getJsonMessage(Object body) {
        if (body == null || "".equals(body)) {
            throw new RuntimeException("object cannot be empty");
        }
        Message message = new Message();
        message.setHttpHeaders(new HttpHeaders());
        try {
            message.setInputStream(org.apache.commons.io.IOUtils.toInputStream(JSONUtils.toJSON(body)));
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
        return message;
    }

    public static Message createMessage(MultiValueMap<String, Object> map, String contentType) {
        RestHttpOutputMessage httpOutputMessage = new HttpRequestUtils.RestHttpOutputMessage();
        httpOutputMessage.setHttpHeaders(new HttpHeaders());
        FormHttpMessageConverter formHttpMessageConverter = new FormHttpMessageConverter();
        formHttpMessageConverter.setPartConverters(getPartConverters());
        try {
            File file = File.createTempFile("requestBody",".tmp");
            try (OutputStream outputStream = new BufferedOutputStream(new FileOutputStream(file))){
                httpOutputMessage.setOutputStream(outputStream);
                formHttpMessageConverter.write(map, MediaType.valueOf(contentType), httpOutputMessage);
            }
            Message message = new Message();
            message.setHttpHeaders(httpOutputMessage.getHttpHeaders());
            message.setInputStream(new DeleteTempFileOnCloseInputStream(file));
            return message;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create message body", e);
        }
    }

    private static List<HttpMessageConverter<?>> getPartConverters(){
        List<HttpMessageConverter<?>> messageConverters = new ArrayList<>();
        StringHttpMessageConverter stringHttpMessageConverter = new StringHttpMessageConverter() {

            @Override
            protected MediaType getDefaultContentType(String t) throws IOException {
                return null;
            }
        };
        messageConverters.add(stringHttpMessageConverter);
        messageConverters.add(new ByteArrayHttpMessageConverter());
        messageConverters.add(new WmFileSystemResourceConverter());
        return messageConverters;
    }


    private static MultiValueMap<String, Object> getMultiValueMap(Map<String, Object> map) {
        MultiValueMap<String, Object> multiValueMap;
        if (map instanceof MultiValueMap) {
            multiValueMap = (MultiValueMap) map;
        } else {
            multiValueMap = new LinkedMultiValueMap();
            multiValueMap.setAll(map);
        }
        return multiValueMap;
    }

    private static class RestHttpOutputMessage implements HttpOutputMessage {

        private OutputStream outputStream;
        private HttpHeaders httpHeaders;

        @Override
        public OutputStream getBody() throws IOException {
            return outputStream;
        }

        @Override
        public HttpHeaders getHeaders() {
            return httpHeaders;
        }

        public OutputStream getOutputStream() {
            return outputStream;
        }

        public void setOutputStream(OutputStream outputStream) {
            this.outputStream = outputStream;
        }

        public HttpHeaders getHttpHeaders() {
            return httpHeaders;
        }

        public void setHttpHeaders(HttpHeaders httpHeaders) {
            this.httpHeaders = httpHeaders;
        }
    }

}
