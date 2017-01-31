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
package com.wavemaker.runtime.server;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.io.InputStream;
import java.lang.annotation.Annotation;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.ArrayList;
import java.util.List;

import com.thoughtworks.paranamer.AdaptiveParanamer;
import com.thoughtworks.paranamer.ParameterNamesNotFoundException;
import com.wavemaker.runtime.service.annotations.ExposeToClient;
import com.wavemaker.runtime.service.annotations.HideFromClient;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.classloader.ClassLoaderUtils;
import com.wavemaker.commons.util.ClassUtils;
import org.apache.commons.io.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Utility methods for the server components.
 * 
 * @author Matt Small
 */
public class ServerUtils {

    /** Logger for this class and subclasses */
    protected final static Logger logger = LoggerFactory.getLogger(ServerUtils.class);

    private ServerUtils() {
    }

    public static String readInput(HttpServletRequest request) throws IOException {

        InputStream is = request.getInputStream();
        if (is == null) {
            throw new WMRuntimeException("no input stream found in request");
        }

        String input = IOUtils.toString(is, ServerConstants.DEFAULT_ENCODING);

        is.close();

        return input;
    }

    /**
     * Try to determine parameter names for a given method. This will check {@link ParamName} attributes and debugging
     * symbols; if no name can be found, a default "arg-&lt;position>" name will be used.
     * 
     * This will also continue working of method has been loaded by a non-default classloader.
     * 
     * @param method The method to introspect.
     * @return The names of the parameters in an ordered list.
     */
    public static List<String> getParameterNames(Method method) {

        int numParams = method.getParameterTypes().length;
        List<String> ret = new ArrayList<String>(numParams);
        Annotation[][] paramAnnotations = method.getParameterAnnotations();
        Class<?> paramNameClass = ClassLoaderUtils.loadClass(ParamName.class.getName(), method.getDeclaringClass().getClassLoader());

        String[] methodParameterNames;

        try {
            AdaptiveParanamer ap = new AdaptiveParanamer();
            methodParameterNames = ap.lookupParameterNames(method);
            ap = null;
        } catch (ParameterNamesNotFoundException e) {
            logger.info("No parameter names found for method {}", method.getName());
            methodParameterNames = new String[numParams];
        }

        for (int i = 0; i < numParams; i++) {
            String paramName = null;

            if (paramName == null) {
                for (Annotation ann : paramAnnotations[i]) {
                    if (paramNameClass.isAssignableFrom(ann.annotationType())) {
                        try {
                            Method nameMethod = paramNameClass.getMethod("name");
                            paramName = (String) nameMethod.invoke(ann);
                        } catch (SecurityException e) {
                            throw new WMRuntimeException(e);
                        } catch (NoSuchMethodException e) {
                            throw new WMRuntimeException(e);
                        } catch (IllegalAccessException e) {
                            throw new WMRuntimeException(e);
                        } catch (InvocationTargetException e) {
                            throw new WMRuntimeException(e);
                        }

                        break;
                    }
                }
            }

            if (paramName == null && methodParameterNames != null) {
                paramName = methodParameterNames[i];
            }

            if (paramName == null) {
                logger.warn("no parameter name information for parameter {}, method: {}", i, method.getName());
                paramName = "arg-" + (i + 1);
            }

            ret.add(paramName);
        }

        return ret;
    }

    /**
     * Get a list of methods to be exposed to the client. This will obey restrictions from {@link ExposeToClient} and
     * {@link HideFromClient}.
     * 
     * @param klass The class to examine.
     * @return A list of methods to expose to the client in the specified class.
     */
    @SuppressWarnings("unchecked")
    public static List<Method> getClientExposedMethods(Class<?> klass) {

        List<Method> allMethods = ClassUtils.getPublicMethods(klass);
        List<Method> ret = new ArrayList<Method>(allMethods.size());
        ClassLoader cl = klass.getClassLoader();

        Class<Annotation> hideFromClient = (Class<Annotation>) ClassLoaderUtils.loadClass(HideFromClient.class.getCanonicalName(), cl);
        Class<Annotation> exposeToClient = (Class<Annotation>) ClassLoaderUtils.loadClass(ExposeToClient.class.getCanonicalName(), cl);

        if (klass.getAnnotation(hideFromClient) != null) {
            for (Method meth : allMethods) {
                if (meth.getAnnotation(exposeToClient) != null) {
                    ret.add(meth);
                }
            }
        } else {
            for (Method meth : allMethods) {
                if (meth.getAnnotation(hideFromClient) == null) {
                    ret.add(meth);
                }
            }
        }

        return ret;
    }

}
