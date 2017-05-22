package com.wavemaker.runtime.data.util;

import java.util.Collection;

import org.hibernate.HibernateException;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;

import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 23/2/17
 */
public class JavaTypeUtils {

    private static MultiValueMap<String, JavaType> classNameVsJavaTypeMap = new LinkedMultiValueMap<>();

    static {
        classNameVsJavaTypeMap.add(JavaType.BYTE.getClassName(), JavaType.BYTE);
        classNameVsJavaTypeMap.add(JavaType.SHORT.getClassName(), JavaType.SHORT);
        classNameVsJavaTypeMap.add(JavaType.INTEGER.getClassName(), JavaType.INTEGER);
        classNameVsJavaTypeMap.add(JavaType.LONG.getClassName(), JavaType.LONG);
        classNameVsJavaTypeMap.add(JavaType.BIG_INTEGER.getClassName(), JavaType.BIG_INTEGER);
        classNameVsJavaTypeMap.add(JavaType.FLOAT.getClassName(), JavaType.FLOAT);
        classNameVsJavaTypeMap.add(JavaType.DOUBLE.getClassName(), JavaType.DOUBLE);
        classNameVsJavaTypeMap.add(JavaType.BIG_DECIMAL.getClassName(), JavaType.BIG_DECIMAL);
        classNameVsJavaTypeMap.add(JavaType.BOOLEAN.getClassName(), JavaType.BOOLEAN);
        classNameVsJavaTypeMap.add(JavaType.YES_OR_NO.getClassName(), JavaType.YES_OR_NO);
        classNameVsJavaTypeMap.add(JavaType.TRUE_OR_FALSE.getClassName(), JavaType.TRUE_OR_FALSE);
        classNameVsJavaTypeMap.add(JavaType.CHARACTER.getClassName(), JavaType.CHARACTER);
        classNameVsJavaTypeMap.add(JavaType.STRING.getClassName(), JavaType.STRING);
        classNameVsJavaTypeMap.add(JavaType.TEXT.getClassName(), JavaType.TEXT);
        classNameVsJavaTypeMap.add(JavaType.CLOB.getClassName(), JavaType.CLOB);
        classNameVsJavaTypeMap.add(JavaType.BLOB.getClassName(), JavaType.BLOB);
        classNameVsJavaTypeMap.add(JavaType.DATE.getClassName(), JavaType.DATE);
        classNameVsJavaTypeMap.add(JavaType.TIME.getClassName(), JavaType.TIME);
        classNameVsJavaTypeMap.add(JavaType.DATETIME.getClassName(), JavaType.DATETIME);
        classNameVsJavaTypeMap.add(JavaType.TIMESTAMP.getClassName(), JavaType.TIMESTAMP);
        classNameVsJavaTypeMap.add(JavaType.CURSOR.getClassName(), JavaType.CURSOR);
    }

    public static Object convert(String toClass, Object value) {
        Object convertedValue = value;

        if (classNameVsJavaTypeMap.containsKey(toClass)) {
            for (final JavaType javaType : classNameVsJavaTypeMap.get(toClass)) {
                try {
                    convertedValue = javaType.fromDbValue(value);
                    break;
                } catch (HibernateException e) {
                    // ignore
                }
            }
        }

        return convertedValue;
    }

    public static boolean isKnownType(Class<?> type) {
        final String typeName = type.getCanonicalName();
        return classNameVsJavaTypeMap.containsKey(typeName);
    }

    public static boolean isNotCollectionType(final Class<?> typeClass) {
        return !Collection.class.isAssignableFrom(typeClass);
    }
}
