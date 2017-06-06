package com.wavemaker.runtime.rest.model;

import java.net.HttpCookie;
import java.util.ArrayList;
import java.util.List;

import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

/**
 * Created by srujant on 5/6/17.
 */
public class CookieStore {

    private MultiValueMap<String, HttpCookie> hostVsCookieList = new LinkedMultiValueMap<>();

    public synchronized void addCookie(String host, HttpCookie httpCookie) {
        hostVsCookieList.add(host, httpCookie);
    }

    public synchronized List<HttpCookie> getHttpCookieList(String host) {
        List<HttpCookie> httpCookieList = hostVsCookieList.get(host);
        return (httpCookieList != null) ? new ArrayList(httpCookieList) : null;
    }
}
