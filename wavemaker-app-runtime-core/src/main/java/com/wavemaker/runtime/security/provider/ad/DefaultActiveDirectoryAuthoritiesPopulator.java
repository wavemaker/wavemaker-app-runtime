package com.wavemaker.runtime.security.provider.ad;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ldap.core.DirContextOperations;
import org.springframework.ldap.core.DistinguishedName;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.authority.SimpleGrantedAuthority;


/**
 * Created by ArjunSahasranam on 22/3/16.
 */
public class DefaultActiveDirectoryAuthoritiesPopulator implements ActiveDirectoryAuthoritiesPopulator {

    private static final Logger logger = LoggerFactory.getLogger(DefaultActiveDirectoryAuthoritiesPopulator.class);
    private String groupRoleAttribute;

    @Override
    public Collection<? extends GrantedAuthority> getGrantedAuthorities(DirContextOperations userData, String username) {
        if(StringUtils.isBlank(groupRoleAttribute)){
            return AuthorityUtils.NO_AUTHORITIES;
        }
        String[] groups = userData.getStringAttributes(groupRoleAttribute);

        if (groups == null) {
            logger.debug("No values for '{}' attribute.", groupRoleAttribute);

            return AuthorityUtils.NO_AUTHORITIES;
        }

        if (logger.isDebugEnabled()) {
            logger.debug("'{}' attribute values: {}" , groupRoleAttribute,  Arrays.asList(groups));
        }

        ArrayList<GrantedAuthority> authorities = new ArrayList<GrantedAuthority>(groups.length);

        for (String group : groups) {
            authorities.add(new SimpleGrantedAuthority("ROLE_"+new DistinguishedName(group).removeLast().getValue()));
        }

        return authorities;

    }

    public String getGroupRoleAttribute() {
        return groupRoleAttribute;
    }

    public void setGroupRoleAttribute(String groupRoleAttribute) {
        this.groupRoleAttribute = groupRoleAttribute;
    }


}
