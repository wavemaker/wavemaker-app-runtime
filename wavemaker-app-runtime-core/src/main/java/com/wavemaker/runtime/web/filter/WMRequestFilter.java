/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.web.filter;

import java.io.IOException;
import java.lang.reflect.Field;
import java.lang.reflect.Method;

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.security.web.context.HttpRequestResponseHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.ReflectionUtils;
import org.springframework.web.filter.GenericFilterBean;

import com.sun.syndication.feed.impl.ToStringBean;
import com.wavemaker.commons.classloader.ClassLoaderUtils;

/**
 * Created by akritim on 3/23/2015.
 */
@Component("wmRequestFilter")
public class WMRequestFilter extends GenericFilterBean {

    private static final Logger logger = LoggerFactory.getLogger(WMRequestFilter.class);
    
    public static final String APP_NAME_KEY = "wm.app.name";

    private static ThreadLocal<HttpRequestResponseHolder> httpRequestResponseHolderThreadLocal = new ThreadLocal<>();

    // Filter and finally clear any cache/thread local objects created by this request on completion
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
        try {
            HttpServletRequest httpServletRequest = (HttpServletRequest) servletRequest;
            HttpServletResponse httpServletResponse = (HttpServletResponse) servletResponse;
            MDC.put(APP_NAME_KEY, httpServletRequest.getServletContext().getContextPath());
            httpRequestResponseHolderThreadLocal.set(new HttpRequestResponseHolder(httpServletRequest, httpServletResponse));
            filterChain.doFilter(servletRequest, servletResponse);
        } finally {
            MDC.remove(APP_NAME_KEY);
            httpRequestResponseHolderThreadLocal.remove();
            this.clearThreadLocalActivityCorrelator();
            this.clearThreadLocalServiceInterceptorFactory();
            this.clearThreadLocalToStringBean();
            this.clearThreadLocalAbstractClassGenerator();
            this.cleanClassFactoryCache();
        }
    }

    private void cleanClassFactoryCache() {
        try {
            String className = "com.sun.xml.internal.bind.v2.ClassFactory";
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), className);
            if (klass == null) {
                klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader().getParent(), className);
            }
            if (klass != null) {
                logger.debug("Calling cleanCache of com.sun.xml.internal.bind.v2.ClassFactory");
                Method cleanCacheMethod = ReflectionUtils.findMethod(klass, "cleanCache");
                if (cleanCacheMethod != null) {
                    cleanCacheMethod.setAccessible(true);
                    cleanCacheMethod.invoke(null, null);
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to clean ClassFactory Cache", e);
        }
    }

    private void clearThreadLocalServiceInterceptorFactory() {
        try {
            String className = "com.sun.xml.internal.ws.api.client.ServiceInterceptorFactory";
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), className);
            if (klass == null) {
                klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader().getParent(), className);
            }
            if (klass != null) {
                Field privateThreadLocalFactoriesField = klass.getDeclaredField("threadLocalFactories");
                privateThreadLocalFactoriesField.setAccessible(true);
                ThreadLocal threadLocal = (ThreadLocal) privateThreadLocalFactoriesField.get(null);
                if (threadLocal != null) {
                    logger.debug("Removing the thread local value of the field threadLocalFactories in the class {}", className);
                    threadLocal.remove();
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to cleanup ServiceInterceptorFactory Thread Local value", e);
        }
    }

    private void clearThreadLocalToStringBean() {
        try {
            String className = "com.sun.syndication.feed.impl.ToStringBean";
            Class klass = ClassLoaderUtils.findLoadedClass(ToStringBean.class.getClassLoader(), className);
            if (klass == null) {
                klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader().getParent(), className);
            }
            if (klass != null) {
                Field prefixTLField = ToStringBean.class.getDeclaredField("PREFIX_TL");
                prefixTLField.setAccessible(true);
                ThreadLocal threadLocal = (ThreadLocal) prefixTLField.get(null);
                if (threadLocal != null) {
                    logger.debug("Removing the thread local value of the field PREFIX_TL in the class {}", className);
                    threadLocal.remove();
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to cleanup ToStringBean Thread Local value", e);
        }
    }

    private void clearThreadLocalActivityCorrelator() {
        try {
            String className = "com.microsoft.sqlserver.jdbc.ActivityCorrelator";
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), className);
            if (klass == null) {
                klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader().getParent(), className);
            }
            if (klass != null) {
                try {
                    Field activityIdTlsField = klass.getDeclaredField("ActivityIdTls");
                    activityIdTlsField.setAccessible(true);
                    ThreadLocal threadLocal = (ThreadLocal) activityIdTlsField.get(null);
                    if (threadLocal != null) {
                        logger.debug("Removing the thread local value of the field ActivityIdTls in the class {}", className);
                        threadLocal.remove();
                    }
                } catch (NoSuchFieldException e) {
                    logger.debug("ActivityIdTls field not found in the class {}", className);
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to cleanup ActivityCorrelator Thread Local value", e);
        }
    }

    private void clearThreadLocalAbstractClassGenerator() {
        try {
            String className = "net.sf.cglib.core.AbstractClassGenerator";
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), className);
            if (klass == null) {
                klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader().getParent(), className);
            }
            if (klass != null) {
                Field currentField = klass.getDeclaredField("CURRENT");
                currentField.setAccessible(true);
                ThreadLocal threadLocal = (ThreadLocal) currentField.get(null);
                if (threadLocal != null) {
                    logger.debug("Removing the thread local value of the field currentField in the class {}", className);
                    threadLocal.remove();
                }
            }
        } catch (Throwable e) {
            logger.warn("Failed to cleanup AbstractClassGenerator Thread Local value", e);
        }
    }

    public static HttpServletRequest getCurrentThreadHttpServletRequest() {
        HttpRequestResponseHolder httpRequestResponseHolder = httpRequestResponseHolderThreadLocal.get();
        if (httpRequestResponseHolder != null) {
            return httpRequestResponseHolder.getRequest();
        }
        return null;
    }

    public static HttpServletResponse getCurrentThreadHttpServletResponse() {
        HttpRequestResponseHolder httpRequestResponseHolder = httpRequestResponseHolderThreadLocal.get();
        if (httpRequestResponseHolder != null) {
            return httpRequestResponseHolder.getResponse();
        }
        return null;
    }
}