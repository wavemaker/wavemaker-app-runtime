package com.wavemaker.runtime.security.authority;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.util.Assert;

/**
 * Created by srujant on 14/11/18.
 */
public class SimpleGrantedAuthority implements GrantedAuthority {

    private String role;

    public SimpleGrantedAuthority() {
    }

    public SimpleGrantedAuthority(String role) {
        Assert.hasText(role, "A granted authority textual representation is required");
        this.role = role;
    }

    @Override
    public String getAuthority() {
        return role;
    }


    public void setAuthority(String role) {
        this.role = role;
    }


    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj instanceof SimpleGrantedAuthority) {
            return role.equals(((SimpleGrantedAuthority) obj).role);
        }
        return false;
    }

    @Override
    public int hashCode() {
        return this.role.hashCode();
    }

    @Override
    public String toString() {
        return this.role;
    }
}
