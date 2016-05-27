package com.wavemaker.runtime.data.util;

import java.lang.reflect.Field;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashMap;

import org.apache.commons.lang3.StringUtils;

import com.wavemaker.runtime.data.JasperType;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 27/5/16
 */
public class ReportContext {


    public HashMap<String, JasperType> buildFieldNameVsTypeMap(String className) {
        return _buildFieldNameVsTypeMap(className, "", true);
    }


    private HashMap<String, JasperType> _buildFieldNameVsTypeMap(String entityName, String fieldPrefix, boolean loopOnce) {
        try {
            Class entity = Class.forName(entityName);
            HashMap<String, JasperType> fieldNameVsTypeMap = new LinkedHashMap<>();
            for (Field field : entity.getDeclaredFields()) {
                Class fieldType = field.getType();
                String fieldName = field.getName();
                if (Collection.class != fieldType) {
                    String typeClassName = fieldType.getName();
                    JasperType jasperType = JasperType.valueFor(typeClassName);
                    if (jasperType != null) {
                        if (StringUtils.isNotBlank(fieldPrefix)) {
//                            entity.getSimpleName().toLowerCase() + "." +
                            fieldName = fieldPrefix + "." + fieldName;
                        }
                        fieldNameVsTypeMap.put(fieldName, jasperType);
                    } else if (loopOnce) {
                        fieldNameVsTypeMap.putAll(_buildFieldNameVsTypeMap(typeClassName, fieldName, false));
                    }
                }
            }
            return fieldNameVsTypeMap;
        } catch (Exception e) {
            throw new RuntimeException("error while mapping fieldNames with typeNames", e);
        }
    }
}
