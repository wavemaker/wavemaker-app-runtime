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

import java.math.BigDecimal;
import java.math.BigInteger;
import java.sql.Time;
import java.sql.Timestamp;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * @author Simon Toens
 */
public abstract class TypeConversionUtils {

    private TypeConversionUtils() {
    }

    private static final Map<String, Class<?>> PRIMITIVES = new HashMap<String, Class<?>>(8);

    /**
     * List of primitive wrappers (Integer, etc), including Atomic numbers. All standard subclasses of Number are
     * included, and Boolean.
     */
    private static final Collection<Class<?>> PRIMITIVE_WRAPPERS = new HashSet<Class<?>>(11);

    private static Set<String> PRIMITIVE_DATA_TYPES = new HashSet<String>();;

    private static Set<String> SERVLET_CLASSES = new HashSet<String>();

    static {
        PRIMITIVES.put(boolean.class.getName(), boolean.class);
        PRIMITIVES.put(byte.class.getName(), byte.class);
        PRIMITIVES.put(char.class.getName(), char.class);
        PRIMITIVES.put(double.class.getName(), double.class);
        PRIMITIVES.put(float.class.getName(), float.class);
        PRIMITIVES.put(int.class.getName(), int.class);
        PRIMITIVES.put(long.class.getName(), long.class);
        PRIMITIVES.put(short.class.getName(), short.class);

        PRIMITIVE_WRAPPERS.add(AtomicInteger.class);
        PRIMITIVE_WRAPPERS.add(AtomicLong.class);
        PRIMITIVE_WRAPPERS.add(BigDecimal.class);
        PRIMITIVE_WRAPPERS.add(BigInteger.class);
        PRIMITIVE_WRAPPERS.add(Boolean.class);
        PRIMITIVE_WRAPPERS.add(Byte.class);
        PRIMITIVE_WRAPPERS.add(Character.class);
        PRIMITIVE_WRAPPERS.add(Double.class);
        PRIMITIVE_WRAPPERS.add(Float.class);
        PRIMITIVE_WRAPPERS.add(Integer.class);
        PRIMITIVE_WRAPPERS.add(Long.class);
        PRIMITIVE_WRAPPERS.add(Short.class);

        PRIMITIVE_DATA_TYPES.add("int");
        PRIMITIVE_DATA_TYPES.add("Integer");
        PRIMITIVE_DATA_TYPES.add("java.lang.Integer");

        PRIMITIVE_DATA_TYPES.add("String");
        PRIMITIVE_DATA_TYPES.add("java.lang.String");

        PRIMITIVE_DATA_TYPES.add("float");
        PRIMITIVE_DATA_TYPES.add("Float");
        PRIMITIVE_DATA_TYPES.add("java.lang.Float");

        PRIMITIVE_DATA_TYPES.add("boolean");
        PRIMITIVE_DATA_TYPES.add("Boolean");
        PRIMITIVE_DATA_TYPES.add("java.lang.Boolean");

        PRIMITIVE_DATA_TYPES.add("char");
        PRIMITIVE_DATA_TYPES.add("Character");
        PRIMITIVE_DATA_TYPES.add("java.lang.Character");

        PRIMITIVE_DATA_TYPES.add("byte");
        PRIMITIVE_DATA_TYPES.add("Byte");
        PRIMITIVE_DATA_TYPES.add("java.lang.Byte");

        PRIMITIVE_DATA_TYPES.add("short");
        PRIMITIVE_DATA_TYPES.add("Short");
        PRIMITIVE_DATA_TYPES.add("java.lang.Short");

        PRIMITIVE_DATA_TYPES.add("long");
        PRIMITIVE_DATA_TYPES.add("Long");
        PRIMITIVE_DATA_TYPES.add("java.lang.Long");

        PRIMITIVE_DATA_TYPES.add("double");
        PRIMITIVE_DATA_TYPES.add("Double");
        PRIMITIVE_DATA_TYPES.add("java.lang.Double");

        PRIMITIVE_DATA_TYPES.add("Date");
        PRIMITIVE_DATA_TYPES.add("java.util.Date");

        //servlet related classes...
        SERVLET_CLASSES.add("HttpServletRequest");
        SERVLET_CLASSES.add("HttpServletResponse");
        SERVLET_CLASSES.add("MultipartHttpServletRequest");
    }

    public static boolean isServletClass(String className) {
        return SERVLET_CLASSES.contains(className);
    }

    public static boolean isPrimitive (String dataType){
        if(PRIMITIVE_DATA_TYPES.contains(dataType))
            return true;
        return  false;
    }

    public static Class<?> primitiveForName(String className) {
        return PRIMITIVES.get(className);
    }

    public static Class<?> primitiveWrapperClassByName(String className) {
        for(Class klass: PRIMITIVE_WRAPPERS) {
            if(klass.getSimpleName().equals(className)) {
                return klass;
            }
        }
        return null;
    }

    /**
     * Returns true iff the Class clazz represents a primitive (boolean, int) or a primitive wrapper (Integer),
     * including Big{Integer,Decimal} and Atomic{Integer,Long}. Also, Strings and Dates are included.
     * 
     * @param clazz
     * @return
     */
    public static boolean isPrimitiveOrWrapper(Class<?> clazz) {

        if (clazz.isPrimitive()) {
            return true;
        }

        if (clazz.equals(String.class)) {
            return true;
        }

        if (Date.class.isAssignableFrom(clazz)) {
            return true;
        }

        if (PRIMITIVE_WRAPPERS.contains(clazz)) {
            return true;
        }

        return false;
    }

    /**
     * Return true iff the parameter is an Array or a Collection.
     * 
     * @param clazz
     * @return
     */
    public static boolean isArray(Class<?> clazz) {

        return clazz != null && (Collection.class.isAssignableFrom(clazz) || clazz.isArray());
    }

    /**
     * Return true iff the parameter is a Map.
     * 
     * @param clazz
     * @return
     */
    public static boolean isMap(Class<?> clazz) {

        return clazz != null && Map.class.isAssignableFrom(clazz);
    }

    public static Object fromString(Class<?> type, String s) {
        return fromString(type, s, false);
    }

    public static Object fromString(Class<?> type, String s, boolean isList) {

        if (isList || !isPrimitiveOrWrapper(type)) {
            if (s == null) {
                return null;
            }
            ObjectLiteralParser p = new ObjectLiteralParser(s, type);
            Object o = p.parse();
            return o;
        }

        if (s == null) {
            return null;
        } else if (type == AtomicInteger.class) {
            return null;
        } else if (type == AtomicLong.class) {
            return null;
        } else if (type == BigDecimal.class) {
            return new BigDecimal(s);
        } else if (type == BigInteger.class) {
            return new BigDecimal(s);
        } else if (type == Boolean.class || type == boolean.class) {
            return Boolean.valueOf(s);
        } else if (type == Byte.class || type == byte.class) {
            return Byte.valueOf(s);
        } else if (type == Date.class) {
            if (StringUtils.isNumber(s)) {
                return new Date(Long.parseLong(s));
            } else {
                throw new IllegalArgumentException("Unable to convert " + s + " to " + Date.class.getName());
            }
        } else if(type == java.sql.Date.class){
            if (StringUtils.isNumber(s)) {
                return new java.sql.Date(Long.valueOf(s));
            } else {
                throw new IllegalArgumentException("Unable to convert " + s + " to " + java.sql.Date.class.getName());
            }

        } else if (type == Time.class ) {
            if (StringUtils.isNumber(s)) {
                return new Time(Long.valueOf(s));
            } else {
                throw new IllegalArgumentException("Unable to convert " + s + " to " + Time.class.getName());
            }
        }else if (type == Timestamp.class ) {
            if (StringUtils.isNumber(s)) {
                return new Timestamp(Long.valueOf(s));
            } else {
                throw new IllegalArgumentException("Unable to convert " + s + " to " + Timestamp.class.getName());
            }
        } else if (type == Double.class || type == double.class) {
            return Double.valueOf(s);
        } else if (type == Float.class || type == float.class) {
            return Float.valueOf(s);
        } else if (type == Integer.class || type == int.class) {
            return Integer.valueOf(s);
        } else if (type == Long.class || type == long.class) {
            return Long.valueOf(s);
        } else if (type == Short.class || type == short.class) {
            return Short.valueOf(s);
        } else if (type == String.class ||  type == StringBuffer.class ) {
            return s;
        }  else if (type == Character.class ||  type == char.class ) {
            return Character.valueOf(s.charAt(0));
        }   else {
            throw new AssertionError("Unable to convert \"" + s + "\" to " + type + " - unknown type: " + type);
        }
    }

    public static String getValueString(Class<?> type, String s) {

        if (s == null) {
            return "null";
        } else if (type == String.class || type == StringBuffer.class) {
            return "'" + s + "'";
        } else if (type == Date.class || type == java.sql.Date.class || type == Timestamp.class || type == Time.class) {
            return "'" + s + "'";
        } else {
            return s;
        }
    }

    public static boolean primitivesMatch(Class<?> p1, Class<?> p2) {

        if (!p1.isPrimitive() && !p2.isPrimitive()) {
            return false;
        }

        if (compare(p1, p2, Boolean.class, boolean.class)) {
            return true;
        }
        if (compare(p1, p2, Byte.class, byte.class)) {
            return true;
        }
        if (compare(p1, p2, Double.class, double.class)) {
            return true;
        }
        if (compare(p1, p2, Float.class, float.class)) {
            return true;
        }
        if (compare(p1, p2, Integer.class, int.class)) {
            return true;
        }
        if (compare(p1, p2, Long.class, long.class)) {
            return true;
        }
        if (compare(p1, p2, Short.class, short.class)) {
            return true;
        }

        return false;
    }

    private static boolean compare(Class<?> p1, Class<?> p2, Class<?> t1, Class<?> t2) {

        if (p1 == t1 && p2 == t2) {
            return true;
        }

        if (p1 == t2 && p2 == t1) {
            return true;
        }

        return false;
    }
}