package com.wavemaker.runtime.web.filter;

import java.io.IOException;
import java.lang.reflect.Field;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.GenericFilterBean;

import com.wavemaker.studio.common.classloader.ClassLoaderUtils;

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
            this.clearThreadLocalActivityCorrelator();
            this.clearThreadLocalServiceInterceptorFactory();
            this.clearThreadLocalToStringBean();
            this.clearThreadLocalAbstractClassGenerator();
            this.cleanClassFactoryCache();
        }
    }

    private void cleanClassFactoryCache() {
        try {
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), "com.sun.xml.bind.v2.ClassFactory");
            if (klass != null) {
                klass.getMethod("cleanCache").invoke(null);
            }
        } catch (Throwable e) {
            logger.warn("Failed to clean ClassFactory Cache", e);
        }
    }

    private void clearThreadLocalServiceInterceptorFactory() {
        try {
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), "com.sun.xml.ws.api.client.ServiceInterceptorFactory");
            if (klass != null) {
                Field privateThreadLocalFactoriesField = klass.getDeclaredField("threadLocalFactories");
                privateThreadLocalFactoriesField.setAccessible(true);
                ThreadLocal threadLocal = (ThreadLocal) privateThreadLocalFactoriesField.get(null);
                if (threadLocal != null) {
                    threadLocal.remove();
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to cleanup ServiceInterceptorFactory Thread Local", e);
        }
    }

    private void clearThreadLocalToStringBean() {
        try {
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), "com.sun.syndication.feed.impl.ToStringBean");
            if (klass != null) {
                Field privatePREFIX_TLField = klass.getDeclaredField("PREFIX_TL");
                privatePREFIX_TLField.setAccessible(true);
                ThreadLocal threadLocal = (ThreadLocal) privatePREFIX_TLField.get(null);
                if (threadLocal != null) {
                    threadLocal.remove();
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to cleanup ToStringBean Thread Local", e);
        }
    }

    private void clearThreadLocalActivityCorrelator() {
        try {
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), "com.microsoft.sqlserver.jdbc.ActivityCorrelator");
            if (klass != null) {
                Field activityIdTls = klass.getDeclaredField("ActivityIdTls");
                activityIdTls.setAccessible(true);
                ThreadLocal threadLocal = (ThreadLocal) activityIdTls.get(null);
                if (threadLocal != null) {
                    threadLocal.remove();
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to cleanup ActivityCorrelator Thread Local", e);
        }
    }

    private void clearThreadLocalAbstractClassGenerator() {
        try {
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), "net.sf.cglib.core.AbstractClassGenerator");
            if (klass != null) {
                Field CURRENT = klass.getDeclaredField("CURRENT");
                CURRENT.setAccessible(true);
                ThreadLocal threadLocal = (ThreadLocal) CURRENT.get(null);
                if (threadLocal != null) {
                    threadLocal.remove();
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to cleanup AbstractClassGenerator Thread Local", e);
        }
    }
}
