package com.wavemaker.runtime.web.filter;

import com.sun.syndication.feed.impl.ToStringBean;
import com.sun.xml.bind.v2.ClassFactory;
import com.sun.xml.ws.api.client.ServiceInterceptorFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.GenericFilterBean;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import java.io.IOException;
import java.lang.reflect.Field;
import java.util.Set;

/**
 * Created by akritim on 3/23/2015.
 */
@Component("wmRequestCleanupFilter")
public class WMRequestCleanupFilter extends GenericFilterBean {

    private static final Logger logger = LoggerFactory.getLogger(WMRequestCleanupFilter.class);

    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        // Filter and finally clear any cache/thread local objects created by this request on completion
        try {
            filterChain.doFilter(servletRequest, servletResponse);
        } finally {
            this.clearThreadLocalServiceInterceptorFactory();
            this.clearThreadLocalToStringBean();
            cleanClassFactoryCache();
        }
    }

    private void cleanClassFactoryCache() {
        try {
            ClassFactory.cleanCache();
        } catch (Throwable e) {
            logger.warn("Failed to clean ClassFactory Cache", e);
        }
    }

    private void clearThreadLocalServiceInterceptorFactory() {
        try {
            Field privateThreadLocalFactoriesField = ServiceInterceptorFactory.class.getDeclaredField("threadLocalFactories");
            privateThreadLocalFactoriesField.setAccessible(true);

            ThreadLocal<Set<ServiceInterceptorFactory>> threadLocal = (ThreadLocal<Set<ServiceInterceptorFactory>>) privateThreadLocalFactoriesField.get(null);
            if (threadLocal != null) {
                threadLocal.remove();
            }
        } catch (Throwable e) {
            logger.warn("Failed to cleanup ServiceInterceptorFactory Thread Local", e);
        }
    }

    private void clearThreadLocalToStringBean() {
        try {
            Field privatePREFIX_TLField = ToStringBean.class.getDeclaredField("PREFIX_TL");
            privatePREFIX_TLField.setAccessible(true);

            ThreadLocal threadLocal = (ThreadLocal) privatePREFIX_TLField.get(null);
            if (threadLocal != null) {
                threadLocal.remove();
            }
        } catch (Throwable e) {
            logger.warn("Failed to cleanup ToStringBean Thread Local", e);
        }
    }
}
