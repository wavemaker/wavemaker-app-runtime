package com.wavemaker.runtime.security.authenticationToken;

/**
 * Created by srujant on 13/11/18.
 */

import java.security.Principal;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.springframework.security.core.AuthenticatedPrincipal;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.wavemaker.runtime.security.authority.SimpleGrantedAuthority;

public abstract class AbstractAuthenticationToken implements Authentication {
    private Collection<SimpleGrantedAuthority> authorities;
    private Object details;
    private boolean authenticated = false;

    public AbstractAuthenticationToken() {
    }

    public AbstractAuthenticationToken(Collection<GrantedAuthority> authorities) {
        if (authorities == null) {
            this.authorities = Collections.emptyList();
            return;
        }

        for (GrantedAuthority a : authorities) {
            if (a == null) {
                throw new IllegalArgumentException("Authorities collection cannot contain any null elements");
            }
        }
        List<SimpleGrantedAuthority> temp = new ArrayList(authorities);
        this.authorities = Collections.unmodifiableList(temp);
    }

    public Collection<SimpleGrantedAuthority> getAuthorities() {
        return authorities;
    }

    public String getName() {
        if (this.getPrincipal() instanceof UserDetails) {
            return ((UserDetails) this.getPrincipal()).getUsername();
        }
        if (this.getPrincipal() instanceof AuthenticatedPrincipal) {
            return ((AuthenticatedPrincipal) this.getPrincipal()).getName();
        }
        if (this.getPrincipal() instanceof Principal) {
            return ((Principal) this.getPrincipal()).getName();
        }

        return (this.getPrincipal() == null) ? "" : this.getPrincipal().toString();
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }

    public Object getDetails() {
        return details;
    }

    public void setDetails(Object details) {
        this.details = details;
    }

    @Override
    public boolean equals(Object obj) {
        if (!(obj instanceof AbstractAuthenticationToken)) {
            return false;
        }

        AbstractAuthenticationToken test = (AbstractAuthenticationToken) obj;

        if (!authorities.equals(test.authorities)) {
            return false;
        }

        if ((this.details == null) && (test.getDetails() != null)) {
            return false;
        }

        if ((this.details != null) && (test.getDetails() == null)) {
            return false;
        }

        if ((this.details != null) && (!this.details.equals(test.getDetails()))) {
            return false;
        }

        if ((this.getCredentials() == null) && (test.getCredentials() != null)) {
            return false;
        }

        if ((this.getCredentials() != null)
                && !this.getCredentials().equals(test.getCredentials())) {
            return false;
        }

        if (this.getPrincipal() == null && test.getPrincipal() != null) {
            return false;
        }

        if (this.getPrincipal() != null
                && !this.getPrincipal().equals(test.getPrincipal())) {
            return false;
        }

        return this.isAuthenticated() == test.isAuthenticated();
    }

    @Override
    public int hashCode() {
        int code = 31;

        for (GrantedAuthority authority : authorities) {
            code ^= authority.hashCode();
        }

        if (this.getPrincipal() != null) {
            code ^= this.getPrincipal().hashCode();
        }

        if (this.getCredentials() != null) {
            code ^= this.getCredentials().hashCode();
        }

        if (this.getDetails() != null) {
            code ^= this.getDetails().hashCode();
        }

        if (this.isAuthenticated()) {
            code ^= -37;
        }

        return code;
    }

    @Override
    public String toString() {
        StringBuilder sb = new StringBuilder();
        sb.append(super.toString()).append(": ");
        sb.append("Principal: ").append(this.getPrincipal()).append("; ");
        sb.append("Credentials: [PROTECTED]; ");
        sb.append("Authenticated: ").append(this.isAuthenticated()).append("; ");
        sb.append("Details: ").append(this.getDetails()).append("; ");

        if (!authorities.isEmpty()) {
            sb.append("Granted Authorities: ");

            int i = 0;
            for (GrantedAuthority authority : authorities) {
                if (i++ > 0) {
                    sb.append(", ");
                }

                sb.append(authority);
            }
        } else {
            sb.append("Not granted any authorities");
        }

        return sb.toString();
    }

    public void setAuthorities(Collection<SimpleGrantedAuthority> authorities) {
        this.authorities = authorities;
    }
}
