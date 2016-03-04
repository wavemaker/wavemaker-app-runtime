/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.security;

import org.springframework.jdbc.core.RowMapper;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.jdbc.JdbcDaoImpl;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;

/**
 * In the default <code>org.acegisecurity.userdetails.jdbc.JdbcDaoImpl</code>
 * the SQL parameter type for authoritiesByUsernameQuery is hardcoded to
 * <code>Types.VARCHAR</code>. This doesn't work well if the actual type for the
 * parameter is something else like <code>Types.INTEGER</code>. This seems to be
 * a problem only in PostgreSQL, other databases like MySQL seems to will just
 * covert the parameter value to the right type.
 * 
 * @author Frankie Fu
 */
public class EnhancedJdbcDaoImpl extends JdbcDaoImpl {

	private static final String LOGGED_IN_USERNAME = ":LOGGED_IN_USERNAME";

	@Override
	protected void initDao() {
		String authoritiesByUsernameQuery = getAuthoritiesByUsernameQuery();
		if(authoritiesByUsernameQuery != null && authoritiesByUsernameQuery.contains(LOGGED_IN_USERNAME)) {
		    authoritiesByUsernameQuery = authoritiesByUsernameQuery.replace(LOGGED_IN_USERNAME, "?");
		}
		this.setAuthoritiesByUsernameQuery(authoritiesByUsernameQuery);
	}

    @Override
    protected List<UserDetails> loadUsersByUsername(String username) {
        return getJdbcTemplate().query(getUsersByUsernameQuery(), new String[] {username}, new RowMapper<UserDetails>() {
            public UserDetails mapRow(ResultSet rs, int rowNum) throws SQLException {
                String userId = rs.getString(1);
                String password = rs.getString(2);
                boolean enabled = rs.getBoolean(3);
                String userName = rs.getString(4);

                int tenantId = -1;
                long loginTime = System.currentTimeMillis();
                return new WMUser(userId, userName, password, userName, tenantId, enabled, true, true,
                                    true, AuthorityUtils.NO_AUTHORITIES, loginTime);
            }
        });
    }

    @Override
    protected UserDetails createUserDetails(String username, UserDetails userFromUserQuery,
                                            List<GrantedAuthority> combinedAuthorities) {
        String returnUsername = userFromUserQuery.getUsername();

        if (!isUsernameBasedPrimaryKey()) {
            returnUsername = username;
        }

        WMUserDetails wmUserDetails = (WMUserDetails) userFromUserQuery;
        String userLongName = wmUserDetails.getUserLongName();
        int tenantId = wmUserDetails.getTenantId();
        String userId = wmUserDetails.getUserId();
        long loginTime = wmUserDetails.getLoginTime();

        return new WMUser(userId, returnUsername, userFromUserQuery.getPassword(), userLongName, tenantId, userFromUserQuery.isEnabled(),
                true, true, true, combinedAuthorities, loginTime);
    }

    @Override
    protected List<GrantedAuthority> loadUserAuthorities(String username) {
        final String rolePrefix = super.getRolePrefix();
        return getJdbcTemplate().query(super.getAuthoritiesByUsernameQuery(), new String[] {username}, new RowMapper<GrantedAuthority>() {
            public GrantedAuthority mapRow(ResultSet rs, int rowNum) throws SQLException {
                return new SimpleGrantedAuthority(rolePrefix + rs.getString(rs.getMetaData().getColumnCount()));
            }
        });
    }
}
