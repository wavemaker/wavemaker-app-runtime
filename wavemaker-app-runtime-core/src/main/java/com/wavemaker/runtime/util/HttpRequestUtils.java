package com.wavemaker.runtime.util;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.LinkedHashMap;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;

/**
 * Created by ArjunSahasranam on 9/6/16.
 */
public class HttpRequestUtils {
    private HttpRequestUtils(){

    }

    public static boolean isAjaxRequest(HttpServletRequest request) {
        return "XMLHttpRequest".equals(request.getHeader("X-Requested-With"));
    }

    public static String getServiceUrl(HttpServletRequest request){
        StringBuffer requestURL = request.getRequestURL();
        String contextPath = request.getContextPath();

        String serviceHostUrl = requestURL.substring(0, requestURL.lastIndexOf(contextPath));
        String serviceUrl = serviceHostUrl + contextPath;
        return serviceUrl;
    }

    public static Map<String, Object> getFormUrlencodedDataAsMap(String encodedData) throws UnsupportedEncodingException {
        return getFormUrlencodedDataAsMap(encodedData, "UTF-8");
    }

    public static Map<String, Object> getFormUrlencodedDataAsMap(String encodedData, String encoding) throws UnsupportedEncodingException {
        Map<String, Object> map = new LinkedHashMap();
        for (String keyValue : encodedData.trim().split("&")) {

            String[] tokens = keyValue.trim().split("=");
            String key = tokens[0];
            String value = tokens.length == 1 ? null : URLDecoder.decode(tokens[1], encoding);
            map.put(key, value);
        }
        return map;
    }
}
