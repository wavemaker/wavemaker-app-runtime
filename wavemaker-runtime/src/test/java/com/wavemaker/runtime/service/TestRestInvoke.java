package com.wavemaker.runtime.service;

import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.runtime.rest.service.RestConnector;
import com.wavemaker.runtime.rest.service.RestRuntimeService;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.util.HashMap;

/**
 Created by sowmyad on 06-06-2014.
 */
public class TestRestInvoke {
    public static void main(String args[]) throws IOException {


        RestRequestInfo restRequestInfo = new RestRequestInfo();
        restRequestInfo.setBasicAuth(true);
        restRequestInfo.setUserName("manager");
        restRequestInfo.setPassword("manager");
        restRequestInfo.setEndpointAddress("http://localhost:8080/manager/html/list");
        restRequestInfo.setMethod("GET");

        System.out.println(restRequestInfo);

        RestResponse restResponse = new RestConnector().invokeRestCall(restRequestInfo);
        MediaType responseContentType = MediaType.parseMediaType(restResponse.getContentType());
        System.out.println("responseContenType: " + responseContentType);

        String responseBody = restResponse.getResponseBody();
        System.out.println("responseBody: " + responseBody);
    }

}
