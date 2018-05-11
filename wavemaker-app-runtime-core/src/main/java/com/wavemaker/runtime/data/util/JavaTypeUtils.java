package com.wavemaker.runtime.data.util;

import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

import org.apache.commons.lang3.ClassUtils;
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

    private static final Set<String> BOOLEAN_TRUE_CASES = new HashSet<>();

    static {
        for (final JavaType javaType : JavaType.values()) {
            classNameVsJavaTypeMap.add(javaType.getClassName(), javaType);
            classNameVsJavaTypeMap.add(javaType.getPrimitiveClassName(), javaType);
        }
        classNameVsJavaTypeMap.add(Date.class.getCanonicalName(), JavaType.DATE);

        BOOLEAN_TRUE_CASES.add("1");
        BOOLEAN_TRUE_CASES.add("true");
        BOOLEAN_TRUE_CASES.add("t");
        BOOLEAN_TRUE_CASES.add("y");
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

    public static Optional<JavaType> fromClassName(String className) {
        return Optional.ofNullable(classNameVsJavaTypeMap.getFirst(className));
    }

    public static boolean isKnownType(Class<?> type) {
        type = ClassUtils.primitiveToWrapper(type);
        final String typeName = type.getCanonicalName();
        //Since, java.util.Date is obtained from hql meta data.
        return (classNameVsJavaTypeMap.containsKey(typeName) || Date.class.getCanonicalName().equals(typeName));
    }

    public static boolean isNotCollectionType(final Class<?> typeClass) {
        return !Collection.class.isAssignableFrom(typeClass);
    }

    public static boolean isTrue(String booleanInString) {
        return BOOLEAN_TRUE_CASES.contains(booleanInString.toLowerCase());
    }
}
