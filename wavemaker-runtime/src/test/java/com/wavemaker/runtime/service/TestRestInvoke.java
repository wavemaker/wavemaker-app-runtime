package com.wavemaker.runtime.service;

import com.wavemaker.common.util.Tuple;
import com.wavemaker.runtime.helper.SchemaConversionHelper;
import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;
import com.wavemaker.runtime.rest.service.RestConnector;
import com.wavemaker.runtime.rest.service.RestRuntimeService;
import net.sf.json.JSON;
import org.springframework.http.MediaType;

import java.io.IOException;
import java.util.HashMap;

/**
 Created by sowmyad on 06-06-2014.
 */
public class TestRestInvoke {
    public static void main(String args[]) throws IOException {


        RestRequestInfo restRequestInfo = new RestRequestInfo();
        restRequestInfo.setBasicAuth(false);
        //restRequestInfo.setUserName("manager");
        //restRequestInfo.setPassword("manager");
        restRequestInfo.setEndpointAddress("http://maps.googleapis.com/maps/api/directions/json?origin=Toronto&destination=Montreal&sensor=false");
        restRequestInfo.setMethod("GET");

        System.out.println(restRequestInfo);

        RestResponse restResponse = new RestConnector().invokeRestCall(restRequestInfo);

        String responseBody = restResponse.getResponseBody();
        if(restResponse.getContentType() != null) {
            MediaType responseContentType = MediaType.parseMediaType(restResponse.getContentType());
            if (MediaType.APPLICATION_XML.getSubtype().equals(responseContentType.getSubtype())) {
                Tuple.Two<String, JSON> rootKeyVsJsonObject = SchemaConversionHelper.convertXmlToJson(responseBody);
                restResponse.setConvertedResponse(rootKeyVsJsonObject.v2.toString());
            }
        }

        MediaType responseContentType = MediaType.parseMediaType(restResponse.getContentType());
        System.out.println("responseContenType: " + responseContentType);

        String responseBodyTxt = restResponse.getResponseBody();
        System.out.println("responseBody: " + responseBodyTxt);
    }

}
