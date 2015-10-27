package com.wavemaker.runtime.rest.model;

/**
 * Created by ArjunSahasranam on 6/10/15.
 */

/**
 * Responsible for registering rest urls to SimpleUrlHandlerMapping through RestServiceBeanPostProcessor.
 */
public class RestServiceInfoBean {
    private String url;
    private String httpMethod;
    private String serviceName;

    public RestServiceInfoBean() {

    }

    public String getUrl() {
        return url;
    }

    public void setUrl(final String url) {
        this.url = url;
    }

    public String getHttpMethod() {
        return httpMethod;
    }

    public void setHttpMethod(final String httpMethod) {
        this.httpMethod = httpMethod;
    }

    public String getServiceName() {
        return serviceName;
    }

    public void setServiceName(final String serviceName) {
        this.serviceName = serviceName;
    }

    @Override
    public String toString() {
        return "Service:" + serviceName + " Url:" + url + " Method:" + httpMethod;
    }
}
