/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
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
package com.wavemaker.studio.common.util;

import java.beans.IntrospectionException;
import java.beans.Introspector;
import java.beans.PropertyDescriptor;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;

import com.wavemaker.studio.common.WMRuntimeException;

/**
 * Utility methods that work with Class instances (see ObjectUtils, as well).
 * 
 * @author Matt Small
 */
public class ClassUtils {

    public static Object newInstance(Class<?> c) {
        try {
            return c.newInstance();
        } catch (InstantiationException ex) {
            String s = ex.getMessage();
            if (s == null || s.equals("")) {
                s = "Failed to instantiate " + c.getName();
            }
            throw new WMRuntimeException(s, ex);
        } catch (IllegalAccessException ex) {
            throw new WMRuntimeException(ex);
        }
    }

    /**
     * Get all public methods of a class, except for methods contained in Object.
     */
    public static List<Method> getPublicMethods(Class<?> c) {

        Method[] allMethods = c.getMethods();
        List<Method> ret = new ArrayList<Method>(allMethods.length);

        for (int i = 0; i < allMethods.length; i++) {
            if (!allMethods[i].getDeclaringClass().equals(Object.class)) {
                ret.add(allMethods[i]);
            }
        }

        return ret;
    }

    public static List<Field> getPublicFields(Class<?> c) {
        return getPublicFields(c, null);
    }

    public static List<Field> getPublicFields(Class<?> c, Class<?> fieldType) {

        List<Field> rtn = new ArrayList<Field>();

        Field[] f = c.getFields();

        for (int i = 0; i < f.length; i++) {
            if (fieldType != null) {
                if (!fieldType.isAssignableFrom(f[i].getType())) {
                    continue;
                }
            }
            rtn.add(f[i]);
        }

        return rtn;
    }

    public static String getPropertyGetterName(String propertyName) {
        return "get" + StringUtils.upperCaseFirstLetter(propertyName);
    }

    public static String getAltPropertyGetterName(String propertyName) {
        return "is" + StringUtils.upperCaseFirstLetter(propertyName);
    }

    public static String getPropertySetterName(String propertyName) {
        return "set" + StringUtils.upperCaseFirstLetter(propertyName);
    }

    public static boolean isPrimitivesWrapper(Type type) {
        if (!(type instanceof Class)) {
            return false;
        }
        Class<Object> klass = (Class) type;
        List<PropertyDescriptor> propertyDescriptors = getPropertyDescriptors(klass);
        for (PropertyDescriptor propertyDescriptor : propertyDescriptors) {
            Class<?> propertyType = propertyDescriptor.getPropertyType();
            if(!TypeConversionUtils.isPrimitive(propertyType.getName()) && !propertyType.isEnum()) {
                return false;
            }
        }
        return true;
    }

    public static List<PropertyDescriptor> getPropertyDescriptors(Class klass) {
        try {
            PropertyDescriptor[] propertyDescriptors = Introspector.getBeanInfo(klass).getPropertyDescriptors();
            List<PropertyDescriptor> propertyDescriptorList = new ArrayList<>();
            for (PropertyDescriptor propertyDescriptor : propertyDescriptors) {
                if(Object.class.equals(propertyDescriptor.getReadMethod().getDeclaringClass())) {
                    continue;
                }
                propertyDescriptorList.add(propertyDescriptor);
            }
            return propertyDescriptorList;
        } catch (IntrospectionException e) {
            throw new WMRuntimeException("Failed to introspect class [" + klass + "]", e);
        }
    }

    private ClassUtils() {
    }
}