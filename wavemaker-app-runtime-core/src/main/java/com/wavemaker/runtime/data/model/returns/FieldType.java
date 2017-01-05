package com.wavemaker.runtime.data.model.returns;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.wavemaker.runtime.data.model.ReferenceType;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 26/10/16
 */
public class FieldType {

    private ReferenceType type;
    private String typeRef;

    private boolean list;
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private List<ReturnProperty> properties;

    public FieldType() {
        this.properties = new ArrayList<>();
    }

    public FieldType(final ReferenceType type, final String typeRef) {
        this();
        this.type = type;
        this.typeRef = typeRef;
    }

    public ReferenceType getType() {
        return type;
    }

    public void setType(final ReferenceType type) {
        this.type = type;
    }

    public String getTypeRef() {
        return typeRef;
    }

    public void setTypeRef(final String typeRef) {
        this.typeRef = typeRef;
    }

    public List<ReturnProperty> getProperties() {
        return properties;
    }

    public void setProperties(final List<ReturnProperty> properties) {
        this.properties = properties;
    }

    public boolean isList() {
        return list;
    }

    public void setList(final boolean list) {
        this.list = list;
    }
}
