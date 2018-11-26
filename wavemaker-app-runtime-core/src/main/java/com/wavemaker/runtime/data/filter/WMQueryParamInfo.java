package com.wavemaker.runtime.data.filter;

import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author Sujith Simon
 * Created on : 22/11/18
 */
public class WMQueryParamInfo {
    private Object value;
    private JavaType javaType;

    public WMQueryParamInfo() {
    }

    public WMQueryParamInfo(Object value, JavaType javaType) {
        this.value = value;
        this.javaType = javaType;
    }

    public WMQueryParamInfo(Object value) {
        this.value = value;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public JavaType getJavaType() {
        return javaType;
    }

    public void setJavaType(JavaType javaType) {
        this.javaType = javaType;
    }

    @Override
    public String toString() {
        return "WMQueryParamInfo{" +
                "value=" + value +
                ", javaType=" + javaType +
                '}';
    }
}
