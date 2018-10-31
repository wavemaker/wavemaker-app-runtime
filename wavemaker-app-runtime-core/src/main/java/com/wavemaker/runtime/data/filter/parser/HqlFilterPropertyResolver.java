package com.wavemaker.runtime.data.filter.parser;

import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author Sujith Simon
 * Created on : 8/11/18
 */
public interface HqlFilterPropertyResolver {

    JavaType resolveProperty(String propertyKey);
    
}
