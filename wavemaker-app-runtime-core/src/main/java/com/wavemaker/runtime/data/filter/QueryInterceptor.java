package com.wavemaker.runtime.data.filter;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/12/16
 */
public interface QueryInterceptor {

    void intercept(WMQueryInfo queryInfo);

}
