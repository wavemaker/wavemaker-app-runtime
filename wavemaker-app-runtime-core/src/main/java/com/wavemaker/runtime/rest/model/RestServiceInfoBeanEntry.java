package com.wavemaker.runtime.rest.model;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 21/5/19
 */
public class RestServiceInfoBeanEntry {
    private String url;
    private String httpMethod;

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

    @Override
    public String toString() {
        return "RestServiceInfoBeanEntry{" +
                "url='" + url + '\'' +
                ", httpMethod='" + httpMethod + '\'' +
                '}';
    }
}
