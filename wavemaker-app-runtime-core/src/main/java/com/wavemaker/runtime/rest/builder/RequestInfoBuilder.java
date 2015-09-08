package com.wavemaker.runtime.rest.builder;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.rest.model.RestRequestInfo;
import com.wavemaker.runtime.rest.model.RestResponse;

/**
 * Created by ArjunSahasranam on 3/9/15.
 */
public class RequestInfoBuilder {
    private static final Logger LOGGER = LoggerFactory.getLogger(RequestInfoBuilder.class);

    private RestRequestInfo info;

    private RequestInfoBuilder(RestRequestInfo info) {
        this.info = info;
    }

    public static RequestInfoBuilder create() {
        return new RequestInfoBuilder(new RestRequestInfo());
    }

    public RequestInfoBuilder setRedirectEnabled(final boolean redirectEnabled) {
        info.setRedirectEnabled(redirectEnabled);
        return this;
    }

    public RequestInfoBuilder setHeaders(Map<String, Object> headers) {
        info.setHeaders(headers);
        return this;
    }

    public RequestInfoBuilder setMethod(final String method) {
        info.setMethod(method);
        return this;
    }

    public RequestInfoBuilder setSampleRestResponse(final RestResponse sampleRestResponse) {
        info.setSampleRestResponse(sampleRestResponse);
        return this;
    }

    public RequestInfoBuilder setAuthType(final RestRequestInfo.AuthType authType) {
        info.setAuthType(authType);
        return this;
    }

    public RequestInfoBuilder setRequestBody(final Object requestBody) {
        info.setRequestBody(requestBody);
        return this;
    }

    public RequestInfoBuilder setEndpointAddress(final String endpointAddress) {
        info.setEndpointAddress(endpointAddress);
        return this;
    }

    public RequestInfoBuilder setBasicAuthorization(final String authorization) {
        info.setBasicAuthorization(authorization);
        return this;
    }

    public RequestInfoBuilder setContentType(final String contentType) {
        info.setContentType(contentType);
        return this;
    }

    public RestRequestInfo build() {
        LOGGER.info("RestRequestInfo {}", info);
        return info;
    }
}
