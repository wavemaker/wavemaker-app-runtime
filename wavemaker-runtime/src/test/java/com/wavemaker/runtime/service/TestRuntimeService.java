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
        RestRuntimeService restRuntimeService = new RestRuntimeService();
        HashMap<String, String> params = new HashMap<String, String>();
        params.put("Cookie", "JSESSIONID=D29BE72223C8525D4A75A2B3006CCBB5");
        params.put("RequestBody", "{\"name\":\"runCreatedProject\"}");
        RestRequestInfo restRequestInfo = restRuntimeService.getRestRequestInfo("localhost", "invoke", params);
        System.out.println(restRequestInfo);

        RestResponse restResponse = new RestConnector().invokeRestCall(restRequestInfo);
        MediaType responseContentType = MediaType.parseMediaType(restResponse.getContentType());
        System.out.println("responseContenType: " + responseContentType);

        String responseBody = restResponse.getResponseBody();
        System.out.println("responseBody: " + responseBody);
    }
}


