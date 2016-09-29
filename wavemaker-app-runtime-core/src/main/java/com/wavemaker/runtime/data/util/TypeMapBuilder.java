package com.wavemaker.runtime.data.util;

import java.beans.PropertyDescriptor;
import java.util.*;

import javax.persistence.Id;

import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.BeanUtils;

import com.wavemaker.runtime.data.Types;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 27/5/16
 */
public class TypeMapBuilder {


    public static TypeInformation buildFieldNameVsTypeMap(Class<?> clazz, boolean addEntityFields) {
        return _buildFieldNameVsTypeMap(clazz, "", true, addEntityFields);
    }


    public static TypeInformation _buildFieldNameVsTypeMap(Class<?> clazz, String fieldPrefix, boolean loopOnce, boolean addEntityFields) {
        try {
            Map<String, Types> fieldNameVsTypeMap = new LinkedHashMap<>();
            List<String> idFields = new ArrayList<>();
            PropertyDescriptor[] descriptors = BeanUtils.getPropertyDescriptors(clazz);
            for (PropertyDescriptor descriptor : descriptors) {
                Class fieldType = descriptor.getPropertyType();
                String fieldName = descriptor.getName();

                if (descriptor.getReadMethod().isAnnotationPresent(Id.class)) {
                    idFields.add(fieldName);
                }

                if (Collection.class != fieldType && !StringUtils.equalsIgnoreCase("class", descriptor.getName())) {
                    String typeClassName = fieldType.getName();
                    Types type = Types.valueFor(typeClassName);
                    if (type != null) {
                        if (Types.LIST != type) {
                            if (StringUtils.isNotBlank(fieldPrefix)) {
                                fieldName = fieldPrefix + "." + fieldName;
                            }
                            fieldNameVsTypeMap.put(fieldName, type);
                        }
                    } else if (loopOnce) {
                        if (addEntityFields) {
                            fieldNameVsTypeMap.put(fieldName, Types.OBJECT);
                        }
                        fieldNameVsTypeMap.putAll(_buildFieldNameVsTypeMap(fieldType, fieldName, false, addEntityFields).getFieldVsTypeMap());
                    }
                }
            }
            return new TypeInformation(clazz.getName(), idFields, fieldNameVsTypeMap);
        } catch (Exception e) {
            throw new RuntimeException("error while mapping fieldNames with typeNames", e);
        }
    }
}
