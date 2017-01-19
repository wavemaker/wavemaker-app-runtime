package com.wavemaker.runtime.util;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.FormHttpMessageConverter;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import com.wavemaker.runtime.rest.model.Message;
import com.wavemaker.studio.common.io.DeleteTempFileOnCloseInputStream;
import com.wavemaker.studio.common.json.JSONUtils;
import com.wavemaker.studio.common.util.IOUtils;

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
        Message message;
        try {
            File file = File.createTempFile("requestBody",".tmp");
            httpOutputMessage.setOutputStream(new FileOutputStream(file));
            if (MediaType.APPLICATION_FORM_URLENCODED_VALUE.equals(contentType)) {
                formHttpMessageConverter.write(map, MediaType.APPLICATION_FORM_URLENCODED, httpOutputMessage);
            } else if (MediaType.MULTIPART_FORM_DATA_VALUE.equals(contentType)) {
                formHttpMessageConverter.write(map, MediaType.MULTIPART_FORM_DATA, httpOutputMessage);
            }
            message = new Message();
            message.setHttpHeaders(httpOutputMessage.getHttpHeaders());
            message.setInputStream(new DeleteTempFileOnCloseInputStream(file));
        } catch (Exception e) {
            throw new RuntimeException("Failed to create message body", e);
        }
        return message;
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
