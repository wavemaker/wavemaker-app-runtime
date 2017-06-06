package com.wavemaker.runtime.rest.processor.request;

import java.net.HttpCookie;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpSession;

import org.springframework.http.HttpHeaders;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.rest.model.CookieStore;
import com.wavemaker.runtime.rest.model.HttpRequestData;
import com.wavemaker.runtime.rest.model.HttpRequestDetails;

/**
 * Created by srujant on 5/6/17.
 */
public class HttpRequestCookieProcessor extends AbstractHttpRequestProcessor {


    private static final String COOKIE = "Cookie";


    @Override
    protected void doProcess(HttpRequestProcessorContext httpRequestProcessorContext) {
        HttpServletRequest httpServletRequest = httpRequestProcessorContext.getHttpServletRequest();
        HttpSession httpSession = httpServletRequest.getSession(false);
        if (httpSession == null) {
            return;
        }
        CookieStore cookieStore = (CookieStore) httpSession.getAttribute("wm.cookieStore");
        if (cookieStore == null) {
            return;
        }
        URL url;
        try {
            url = new URL(httpRequestProcessorContext.getHttpRequestDetails().getEndpointAddress());
        } catch (MalformedURLException e) {
            throw new WMRuntimeException(e);
        }
        String host = url.getHost();
        List<HttpCookie> httpCookieList = cookieStore.getHttpCookieList(host);
        if (httpCookieList != null) {
            String path = url.getPath();
            String cookieValue = getCookieValue(httpCookieList, path, httpRequestProcessorContext);

            HttpRequestDetails httpRequestDetails = httpRequestProcessorContext.getHttpRequestDetails();
            HttpHeaders httpHeaders = httpRequestDetails.getHeaders();
            httpHeaders.remove(COOKIE);
            httpHeaders.add(COOKIE, cookieValue);
        }

    }

    private String getCookieValue(List<HttpCookie> httpCookieList, String path, HttpRequestProcessorContext httpRequestProcessorContext) {
        StringBuilder sb = new StringBuilder();
        HttpRequestData httpRequestData = httpRequestProcessorContext.getHttpRequestData();
        HttpHeaders httpHeaders = httpRequestData.getHttpHeaders();
        List<String> cookies = httpHeaders.get(COOKIE);
        boolean first = true;
        if (cookies != null) {
            for (String cookie : cookies) {
                addCookie(sb, first, cookie);
                first = false;
            }
        }

        for (HttpCookie httpCookie : httpCookieList) {
            if (path.startsWith(httpCookie.getPath())) {
                String cookie = toString(httpCookie);
                addCookie(sb, first, cookie);
                first = false;
            }
        }
        return sb.toString();
    }

    private void addCookie(StringBuilder sb, boolean first, String cookie) {
        if (!first) {
            sb.append("; ");
        }
        sb.append(cookie);
    }

    private String toString(HttpCookie httpCookie) {
        StringBuilder sb = new StringBuilder();
        sb.append(httpCookie.getName()).append('=').append(httpCookie.getValue());
        return sb.toString();
    }

}
