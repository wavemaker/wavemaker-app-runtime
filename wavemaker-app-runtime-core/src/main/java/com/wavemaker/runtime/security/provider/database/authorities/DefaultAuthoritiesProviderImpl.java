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
package com.wavemaker.runtime.security.provider.database.authorities;

import java.util.ArrayList;
import java.util.List;

import javax.annotation.PostConstruct;

import org.hibernate.Session;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import com.wavemaker.runtime.security.core.AuthenticationContext;
import com.wavemaker.runtime.security.core.AuthoritiesProvider;
import com.wavemaker.runtime.security.provider.database.AbstractDatabaseSupport;

/**
 * Created by ArjunSahasranam on 11/3/16.
 */
public class DefaultAuthoritiesProviderImpl extends AbstractDatabaseSupport implements AuthoritiesProvider {

    private static final String USERNAME = "username";
    private static final String COLON_USERNAME = ":username";
    private static final String Q_MARK = "?";

    private String authoritiesByUsernameQuery = "SELECT userid, role FROM User WHERE username = ?";
    private String rolePrefix = "ROLE_";
    private boolean rolesByQuery = false;
    private static final String LOGGED_IN_USERNAME = ":LOGGED_IN_USERNAME";


    @PostConstruct
    protected void init() {
        if (authoritiesByUsernameQuery.contains(LOGGED_IN_USERNAME)) {
            authoritiesByUsernameQuery = authoritiesByUsernameQuery.replace(LOGGED_IN_USERNAME, COLON_USERNAME);
        }
        if (authoritiesByUsernameQuery.contains(Q_MARK)) {
            authoritiesByUsernameQuery = authoritiesByUsernameQuery.replace(Q_MARK, COLON_USERNAME);
        }
    }

    @Override
    public List<GrantedAuthority> loadAuthorities(AuthenticationContext authenticationContext) {
        return getTransactionTemplate()
                .execute(status -> getHibernateTemplate().execute(session -> getGrantedAuthorities(session, authenticationContext.getUsername())));
    }

    public String getAuthoritiesByUsernameQuery() {
        return authoritiesByUsernameQuery;
    }

    public void setAuthoritiesByUsernameQuery(final String authoritiesByUsernameQuery) {
        this.authoritiesByUsernameQuery = authoritiesByUsernameQuery;
    }

    public String getRolePrefix() {
        return rolePrefix;
    }

    public void setRolePrefix(final String rolePrefix) {
        this.rolePrefix = rolePrefix;
    }

    public boolean isRolesByQuery() {
        return rolesByQuery;
    }

    public void setRolesByQuery(final boolean rolesByQuery) {
        this.rolesByQuery = rolesByQuery;
    }

    public List<GrantedAuthority> loadUserAuthorities(final String username) {
        return getTransactionTemplate()
                .execute(status -> getHibernateTemplate().execute(session -> getGrantedAuthorities(session, username)));
    }

    private List<GrantedAuthority> getGrantedAuthorities(final Session session, final String username) {
        String authoritiesByUsernameQuery = getAuthoritiesByUsernameQuery();
        if (!isHql()) {
            return getGrantedAuthoritiesByNativeSql(session, authoritiesByUsernameQuery, username);
        } else {
            return getGrantedAuthoritiesByHQL(session, authoritiesByUsernameQuery, username);
        }
    }

    private List<GrantedAuthority> getGrantedAuthoritiesByHQL(
            Session session, String authoritiesByUsernameQuery, String username) {
        final List list = session.createQuery(authoritiesByUsernameQuery).setParameter(USERNAME, username).list();
        return getAuthorities(list);
    }

    private List<GrantedAuthority> getGrantedAuthoritiesByNativeSql(
            Session session, String authoritiesByUsernameQuery, String username) {
        final List list = session.createNativeQuery(authoritiesByUsernameQuery).setParameter(USERNAME, username).list();
        return getAuthorities(list);
    }

    private List<GrantedAuthority> getAuthorities(List<Object> content) {
        List<GrantedAuthority> grantedAuthorities = new ArrayList<>();
        if (!content.isEmpty()) {
            for (Object o : content) {
                Object role = null;
                if (o instanceof Object[]) {
                    Object[] result = (Object[]) o;
                    if (result.length == 1) {
                        role = String.valueOf(result[0]);
                    } else {
                        role = String.valueOf(result[1]);
                    }
                } else {
                    role = o;
                }
                SimpleGrantedAuthority simpleGrantedAuthority = new SimpleGrantedAuthority(getRolePrefix() + role);
                grantedAuthorities.add(simpleGrantedAuthority);
            }
            return grantedAuthorities;
        }
        return grantedAuthorities;
    }

}
