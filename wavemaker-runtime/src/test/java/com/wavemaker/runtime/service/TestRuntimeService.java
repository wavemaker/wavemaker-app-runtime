package com.wavemaker.runtime.service;

import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.runtime.rest.service.RestConnector;
import com.wavemaker.runtime.rest.service.RestRuntimeService;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.util.HashMap;

/**
 * Created by venuj on 03-06-2014.
 */
public class TestRuntimeService {

    public static void main(String args[]) throws IOException {
        System.out.println(MediaType.APPLICATION_XML.getSubtype());
        System.out.println(MediaType.parseMediaType("text/xml").getSubtype());

        RuntimeService runtimeService = new RuntimeService();


        RestRuntimeService restRuntimeService = new RestRuntimeService();
        HashMap<String, String> params = new HashMap<String, String>();
//        params.put("Cookie", "JSESSIONID=D29BE72223C8525D4A75A2B3006CCBB5");
//        params.put("RequestBody", "{\"name\":\"runCreatedProject\"}");

        params.put("q", "delhi");
        params.put("mode", "xml");

        RestResponse restResponse1 = runtimeService.executeRestCall("openweathermap", "invoke", params);
        System.out.println(restResponse1);

//        RestRequestInfo restRequestInfo = restRuntimeService.getRestRequestInfo("openweathermap", "invoke", params);
//        System.out.println(restRequestInfo);
//
//        RestResponse restResponse = new RestConnector().invokeRestCall(restRequestInfo);
//        MediaType responseContentType = MediaType.parseMediaType(restResponse.getContentType());
//        System.out.println("responseContenType: " + responseContentType);
//
        String responseBody = restResponse1.getResponseBody();
        System.out.println("responseBody: " + responseBody);
        System.out.println("convertedResponseBody: " + restResponse1.getConvertedResponse());
    }
}


