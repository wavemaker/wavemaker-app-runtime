package com.wavemaker.runtime.data.export;

import java.beans.PropertyDescriptor;

import org.springframework.beans.BeanUtils;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.util.JavaTypeUtils;

public class SimpleFieldValueProvider implements FieldValueProvider {

    private final String fieldName;
    private Class<?> dataClass;

    public SimpleFieldValueProvider(String fieldName, Class<?> dataClass) {
        this.fieldName = fieldName;
        this.dataClass = dataClass;
    }

    @Override
    public Object getValue(Object object) {
        String[] nestedFields = fieldName.split("\\.");
        Object value = null;
        Object nestedRowData = object;
        try {
            for (String name : nestedFields) {
                PropertyDescriptor propertyDescriptor = BeanUtils.getPropertyDescriptor(dataClass, name);
                value = (nestedRowData == null) ? null : propertyDescriptor.getReadMethod().invoke(nestedRowData);
                if(value == null) {
                    break;
                }
                nestedRowData = value;
                Class<?> propertyType = propertyDescriptor.getPropertyType();
                if (!JavaTypeUtils.isKnownType(propertyType)) {
                    dataClass = propertyType;
                }
            }
            return value;
        } catch (Exception e) {
            throw new WMRuntimeException("Invalid field name", e);
        }
    }
}
