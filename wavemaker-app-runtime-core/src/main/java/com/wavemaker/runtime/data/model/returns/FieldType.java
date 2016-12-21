package com.wavemaker.runtime.data.model.returns;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 26/10/16
 */
public class FieldType {

    private Type type;
    private String ref;

    private boolean list;
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    private List<ReturnProperty> properties;

    public FieldType() {
        this.properties = new ArrayList<>();
    }

    public FieldType(final Type type, final String ref) {
        this();
        this.type = type;
        this.ref = ref;
    }

    public Type getType() {
        return type;
    }

    public void setType(final Type type) {
        this.type = type;
    }

    public String getRef() {
        return ref;
    }

    public void setRef(final String ref) {
        this.ref = ref;
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

    public enum Type {
        SIMPLE,
        REFERENCE,
        COMPOSED
    }
}
