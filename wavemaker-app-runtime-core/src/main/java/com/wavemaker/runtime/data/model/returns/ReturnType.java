package com.wavemaker.runtime.data.model.returns;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 26/10/16
 */
public class ReturnType {

    private Type type;
    private String ref;
    private Class<?> typeClass;

    public ReturnType() {
    }

    public ReturnType(final Type type, final String ref) {
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

    public Class<?> getTypeClass() {
        return typeClass;
    }

    public void setTypeClass(final Class<?> typeClass) {
        this.typeClass = typeClass;
    }

    public enum Type {
        SIMPLE,
        COLLECTION,
        REFERENCE
    }
}
