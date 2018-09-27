package com.wavemaker.runtime.util;

import com.wavemaker.runtime.rest.model.HttpResponseDetails;
import com.wavemaker.runtime.rest.util.HttpResponseUtils;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.testng.annotations.Test;

import java.net.HttpCookie;
import java.util.ArrayList;
import java.util.List;

import static org.testng.Assert.*;

public class HttpResponseUtilTest {
    private static final String SET_COOKIE_HEADER = "Set-Cookie";

    @Test
    public void getCookiesTest() {
        assertNotNull(HttpResponseUtils.getCookies(getHttpResponseDetails()));
    }

    @Test
    public void setCookiesTest() {
        HttpResponseUtils.setCookies(getHttpResponseDetails(), getHttpCookieList());
    }

    @Test
    public void toStringWithoutParametersTest() {
        MediaType mediaType = new MediaType("NAME", "VALUE");
        assertNotNull(HttpResponseUtils.toStringWithoutParameters(mediaType));
    }

    private HttpResponseDetails getHttpResponseDetails() {
        HttpResponseDetails httpResponseDetails = new HttpResponseDetails();
        httpResponseDetails.setStatusCode(200);
        httpResponseDetails.setHeaders(getHttpHeaders());
        return httpResponseDetails;
    }

    private static HttpHeaders getHttpHeaders() {
        List<String> listHttp = new ArrayList<>();
        listHttp.add("Cookie=Value121");
        HttpHeaders httpHeaders = new HttpHeaders();
        httpHeaders.add("a1", "a1");
        httpHeaders.put(SET_COOKIE_HEADER, listHttp);
        return httpHeaders;
    }

    private static List<HttpCookie> getHttpCookieList() {
        HttpCookie httpCookie = new HttpCookie("id", "11111");
        httpCookie.setPath("/Wavemaker/test");
        httpCookie.setMaxAge(1559685475);
        httpCookie.setDiscard(true);
        List<HttpCookie> httpCookiesList = new ArrayList<>();
        httpCookiesList.add(httpCookie);
        return httpCookiesList;
    }
}
