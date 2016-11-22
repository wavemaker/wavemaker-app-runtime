package com.wavemaker.runtime.security.provider.saml;

import org.apache.commons.lang3.StringUtils;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.saml.SAMLCredential;
import org.springframework.security.saml.userdetails.SAMLUserDetailsService;

import com.wavemaker.runtime.security.WMUser;

/**
 * Created by ArjunSahasranam on 23/11/16.
 */
public class WMSAMLUserDetailsService implements SAMLUserDetailsService {

    private String roleAttributeName;

    @Override
    public Object loadUserBySAML(final SAMLCredential credential) throws UsernameNotFoundException {
        final String username = credential.getNameID().getValue();
        if (StringUtils.isNotBlank(roleAttributeName)) {
            final String[] attrValues = credential.getAttributeAsStringArray(roleAttributeName);
            if (attrValues == null) {
                return createNoAuthoritiesUser(username);
            } else {
                return new WMUser("", username, "", username, 0, true, true, true, true,
                        AuthorityUtils.createAuthorityList(attrValues),
                        System.currentTimeMillis());
            }

        } else {
            return createNoAuthoritiesUser(username);
        }
    }

    public String getRoleAttributeName() {
        return roleAttributeName;
    }

    public void setRoleAttributeName(final String roleAttributeName) {
        this.roleAttributeName = roleAttributeName;
    }

    private WMUser createNoAuthoritiesUser(String username) {
        return new WMUser("", username, "", username, 0, true, true, true, true, AuthorityUtils.NO_AUTHORITIES,
                System.currentTimeMillis());
    }
}
