/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
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

import javax.servlet.FilterChain;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.GenericFilterBean;

import com.sun.syndication.feed.impl.ToStringBean;
import com.sun.xml.bind.v2.ClassFactory;
import com.sun.xml.ws.api.client.ServiceInterceptorFactory;
import com.wavemaker.commons.classloader.ClassLoaderUtils;

/**
 * Created by akritim on 3/23/2015.
 */
@Component("wmRequestCleanupFilter")
public class WMRequestCleanupFilter extends GenericFilterBean {

    private static final Logger logger = LoggerFactory.getLogger(WMRequestCleanupFilter.class);

    // Filter and finally clear any cache/thread local objects created by this request on completion
    @Override
    public void doFilter(ServletRequest servletRequest, ServletResponse servletResponse, FilterChain filterChain) throws IOException, ServletException {
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
            String className = "com.sun.xml.bind.v2.ClassFactory";
            Class klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader(), className);
            if (klass == null) {
                klass = ClassLoaderUtils.findLoadedClass(Thread.currentThread().getContextClassLoader().getParent(), className);
            }
            if (klass != null) {
                logger.debug("Calling cleanCache of {}", ClassFactory.class);
                ClassFactory.cleanCache();
            }
        } catch (Throwable e) {
            logger.warn("Failed to clean ClassFactory Cache", e);
        }
    }

    private void clearThreadLocalServiceInterceptorFactory() {
        try {
            String className = "com.sun.xml.ws.api.client.ServiceInterceptorFactory";
            Class klass = ClassLoaderUtils.findLoadedClass(ServiceInterceptorFactory.class.getClassLoader(), className);
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
               Field activityIdTlsField = klass.getDeclaredField("ActivityIdTls");
               activityIdTlsField.setAccessible(true);
               ThreadLocal threadLocal = (ThreadLocal) activityIdTlsField.get(null);
               if (threadLocal != null) {
                   logger.debug("Removing the thread local value of the field ActivityIdTls in the class {}", className);
                   threadLocal.remove();
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
}
