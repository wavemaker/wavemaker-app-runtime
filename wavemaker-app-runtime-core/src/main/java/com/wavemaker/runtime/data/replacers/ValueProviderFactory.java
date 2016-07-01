package com.wavemaker.runtime.data.replacers;

import java.lang.annotation.Annotation;
import java.util.HashMap;
import java.util.Map;

import com.wavemaker.runtime.data.annotations.Encrypted;
import com.wavemaker.runtime.data.annotations.ServerDefinedProperty;
import com.wavemaker.runtime.data.replacers.providers.EncryptedValueProviderBuilder;
import com.wavemaker.runtime.data.replacers.providers.ServerDefinedPropertyProvider;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/6/16
 */
public class ValueProviderFactory {

    private static Map<Class<? extends Annotation>, ValueProviderBuilder> annotationValueProviderBuilderMap;

    static {
        annotationValueProviderBuilderMap = new HashMap<>();

        annotationValueProviderBuilderMap.put(Encrypted.class, new EncryptedValueProviderBuilder());
        annotationValueProviderBuilderMap.put(ServerDefinedProperty.class, new ServerDefinedPropertyProvider
                .SystemVariableProviderBuilder());
    }


    public static ValueProviderBuilder getBuilder(Class<? extends Annotation> annotationType) {

        return annotationValueProviderBuilderMap.get(annotationType);
    }

    public static boolean contains(Class<? extends Annotation> type) {
        return annotationValueProviderBuilderMap.containsKey(type);
    }
}
