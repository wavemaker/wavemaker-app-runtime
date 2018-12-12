package com.wavemaker.runtime.data.export;

import java.beans.PropertyDescriptor;

import org.springframework.beans.BeanUtils;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.util.JavaTypeUtils;

public class SimpleFieldValueProvider implements FieldValueProvider {

    private final String fieldName;
    private final Class<?> dataClass;

    public SimpleFieldValueProvider(String fieldName, Class<?> dataClass) {
        this.fieldName = fieldName;
        this.dataClass = dataClass;
    }

    @Override
    public Object getValue(Object object) {
        String[] nestedFields = fieldName.split("\\.");
        Object value = null;
        Object nestedRowData = object;
        Class<?> currentClass = this.dataClass;
        try {
            for (String name : nestedFields) {
                PropertyDescriptor propertyDescriptor = BeanUtils.getPropertyDescriptor(currentClass, name);
                value = (nestedRowData == null) ? null : propertyDescriptor.getReadMethod().invoke(nestedRowData);
                if(value == null) {
                    break;
                }
                nestedRowData = value;
                Class<?> propertyType = propertyDescriptor.getPropertyType();
                if (!JavaTypeUtils.isKnownType(propertyType)) {
                    currentClass = propertyType;
                }
            }
            return value;
        } catch (Exception e) {
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.invalid.field.name"), e);
        }
    }
}
