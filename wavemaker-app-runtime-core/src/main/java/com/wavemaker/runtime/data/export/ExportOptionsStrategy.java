package com.wavemaker.runtime.data.export;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;

import org.apache.commons.lang.WordUtils;
import org.apache.commons.lang3.StringUtils;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.util.JavaTypeUtils;


public class ExportOptionsStrategy {
    private ExportOptions options;
    public ExportOptionsStrategy(ExportOptions options, Class<?> entityClass) {
        this.options = options;
        setFieldsIfEmpty(entityClass);
    }

    public List<String> getDisplayNames() {
        List<String> fieldNames = new ArrayList<>();
        for(FieldInfo field : options.getFields()) {
            fieldNames.add(getDisplayName(field));
        }
        return fieldNames;
    }

    public List<Object> getFilteredRowData(Class<?> dataClass, Object rowData) throws Exception{
        List<FieldInfo> fieldInfos = options.getFields();
        List<Object> rowValues = new ArrayList<>();
        for (final FieldInfo fieldInfo : fieldInfos) {
            rowValues.add(getColumnValue(dataClass, rowData, fieldInfo));
        }
        return rowValues;
    }

    private void setFieldsIfEmpty(Class<?> dataClass) {
        if(options.getFields().isEmpty()) {
            includeAllFields(dataClass, "", true);
        }
    }

    private void includeAllFields(Class<?> dataClass, String prefix, boolean includeChildren) {
        try {
            List<FieldInfo> fieldInfos = options.getFields();
            for (final Field field : dataClass.getDeclaredFields()) {
                String fieldName = field.getName();
                final Class<?> type = field.getType();
                if (JavaTypeUtils.isKnownType(type)) {
                    if (StringUtils.isNotBlank(prefix)) {
                        fieldName = prefix + '.' + fieldName;
                    }
                    fieldInfos.add(new FieldInfo(fieldName));
                } else if (includeChildren && JavaTypeUtils.isNotCollectionType(type)) {
                    includeAllFields(Class.forName(type.getName()), fieldName, false);
                }
            }
        } catch (Exception e) {
            throw new WMRuntimeException("Unexpected Error during ExportOptions generation.", e);
        }
    }

    private String getDisplayName(FieldInfo fieldInfo) {
        return fieldInfo.getHeader() != null ? fieldInfo.getHeader() : capitaliseFieldName(fieldInfo.getField());
    }

    private String capitaliseFieldName(String fieldName) {
        String[] nestedFieldNames = fieldName.split("\\.");
        StringBuilder displayName = new StringBuilder();
        for (int i = 0; i < nestedFieldNames.length; i++) {
            displayName.append(WordUtils.capitalize(nestedFieldNames[i]));
            if(i != nestedFieldNames.length - 1) {
                displayName.append(" ");
            }
        }
        return displayName.toString();
    }

    private Object getColumnValue(Class<?> dataClass, Object rowData, FieldInfo fieldInfo) throws Exception {
        Object value;
        FieldValueProvider provider;
        if(fieldInfo.getField() != null) {
            provider = new SimpleFieldValueProvider(fieldInfo.getField(), dataClass);
            value = provider.getValue(rowData);
        }
        else if(fieldInfo.getExpression() != null){
            provider = new ExpressionFieldValueProvider(fieldInfo.getExpression());
            value = provider.getValue(rowData);
        }
        else {
            throw new WMRuntimeException("No Field name or Expression provided.");
        }
        return value;
    }

}
