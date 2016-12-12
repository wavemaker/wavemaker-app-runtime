package com.wavemaker.runtime.security.provider.saml;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.saml.SAMLCredential;
import org.springframework.security.saml.userdetails.SAMLUserDetailsService;

import com.wavemaker.runtime.security.WMUser;

/**
 * Created by ArjunSahasranam on 23/11/16.
 */
public class WMSAMLUserDetailsService implements SAMLUserDetailsService {

    private static final Logger LOGGER = LoggerFactory.getLogger(WMSAMLUserDetailsService.class);

    private String roleAttributeName;

    @Override
    public Object loadUserBySAML(final SAMLCredential credential) throws UsernameNotFoundException {
        final String username = credential.getNameID().getValue();
        if (StringUtils.isNotBlank(roleAttributeName)) {
            final String attrValue = credential.getAttributeAsString(roleAttributeName);
            LOGGER.info("Attribute value for {} is {}", roleAttributeName, attrValue);
            if (StringUtils.isNotBlank(attrValue)) {
                return new WMUser("", username, "", username, 0, true, true, true, true,
                        AuthorityUtils.createAuthorityList(attrValue),
                        System.currentTimeMillis());
            } else {
                return createNoAuthoritiesUser(username);
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
