package com.wavemaker.runtime.data;

import org.hibernate.usertype.UserType;

/**
 * Created by sunilp on 26/7/15.
 */
public class CustomType {

    private UserType type;
    private String[] keys;

    public CustomType() {
    }

    public CustomType(UserType type, String[] keys) {
        this.type = type;
        this.keys = keys;
    }

    public String[] getKeys() {
        return keys;
    }

    public void setKeys(String[] keys) {
        this.keys = keys;
    }

    public UserType getType() {
        return type;
    }

    public void setType(UserType type) {
        this.type = type;
    }
}
