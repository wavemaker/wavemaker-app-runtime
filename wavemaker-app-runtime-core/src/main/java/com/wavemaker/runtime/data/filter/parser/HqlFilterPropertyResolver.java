package com.wavemaker.runtime.data.filter.parser;

import java.lang.reflect.Field;

import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author Sujith Simon
 * Created on : 8/11/18
 */
public interface HqlFilterPropertyResolver {

    Field findField(String propertyKey);

    JavaType findJavaType(Field field);
}
