package com.wavemaker.runtime.security;

import java.io.Serializable;

import com.fasterxml.jackson.annotation.JsonIgnore;

/**
 * Created by srujant on 14/11/18.
 */
public class Attribute implements Serializable{


    private AttributeScope scope;
    private Object value;

    public Attribute(AttributeScope scope, Object value) {
        this.scope = scope;
        this.value = value;
    }

    public AttributeScope getScope() {
        return scope;
    }

    public Object getValue() {
        return value;
    }


    public enum AttributeScope {
        /*
        *  This attributescoped variables will be used both in backend and frontend.
        * */
        ALL,
        /*
        * This attributescoped variables get's persisted only in backend.
        * */
        SERVER_ONLY;
    }

}
