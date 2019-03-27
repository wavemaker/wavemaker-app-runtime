package com.wavemaker.runtime.filter.etag;

import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * Created by srujant on 26/3/19.
 */
public class CacheFilterConfig {

    private RequestMatcher cacheRequestMatcher;
    private RequestMatcher etagRequestMatcher;

    public CacheFilterConfig() {
    }

    public RequestMatcher getCacheRequestMatcher() {
        return cacheRequestMatcher;
    }

    public void setCacheRequestMatcher(RequestMatcher cacheRequestMatcher) {
        this.cacheRequestMatcher = cacheRequestMatcher;
    }

    public RequestMatcher getEtagRequestMatcher() {
        return etagRequestMatcher;
    }

    public void setEtagRequestMatcher(RequestMatcher etagRequestMatcher) {
        this.etagRequestMatcher = etagRequestMatcher;
    }

}
