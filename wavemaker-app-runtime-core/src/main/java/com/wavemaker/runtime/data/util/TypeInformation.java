package com.wavemaker.runtime.data.util;

import java.util.List;
import java.util.Map;

import com.wavemaker.runtime.data.Types;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 22/9/16
 */
public class TypeInformation {

    private String className;
    private List<String> idFields;
    private Map<String, Types> fieldVsTypeMap;

    public TypeInformation() {
    }

    public TypeInformation(String className, List<String> idFields, Map<String, Types> fieldVsTypeMap) {
        this.className = className;
        this.idFields = idFields;
        this.fieldVsTypeMap = fieldVsTypeMap;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public List<String> getIdFields() {
        return idFields;
    }

    public void setIdFields(List<String> idFields) {
        this.idFields = idFields;
    }

    public Map<String, Types> getFieldVsTypeMap() {
        return fieldVsTypeMap;
    }

    public void setFieldVsTypeMap(Map<String, Types> fieldVsTypeMap) {
        this.fieldVsTypeMap = fieldVsTypeMap;
    }

    public boolean hasSimpleId() {
        return idFields.size() == 1;
    }

    public String getFirstIdField() {
        return idFields.get(0);
    }
}
