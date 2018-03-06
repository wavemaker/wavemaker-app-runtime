/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.security.provider.saml;

import java.util.Arrays;
import java.util.List;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.lang3.ArrayUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
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
    public Object loadUserBySAML(final SAMLCredential credential) {
        final String username = credential.getNameID().getValue();

        List<GrantedAuthority> authorities = null;
        if (StringUtils.isNotBlank(roleAttributeName)) {
            final String attributeValues[] = credential.getAttributeAsStringArray(roleAttributeName);
            LOGGER.info("Attribute values for {} is {}", roleAttributeName, Arrays.toString(attributeValues));
            if (ArrayUtils.isNotEmpty(attributeValues)) {
                authorities = AuthorityUtils.createAuthorityList(attributeValues);
            }
        }

        if (CollectionUtils.isEmpty(authorities)) {
            authorities = AuthorityUtils.NO_AUTHORITIES;
        }

        return new WMUser("", username, "", username, 0, true, true, true, true, authorities,
                System.currentTimeMillis());
    }

    public String getRoleAttributeName() {
        return roleAttributeName;
    }

    public void setRoleAttributeName(final String roleAttributeName) {
        this.roleAttributeName = roleAttributeName;
    }
}
