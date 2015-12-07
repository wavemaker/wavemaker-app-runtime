/**
 * Copyright © 2015 WaveMaker, Inc.
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

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.IOUtils;
import org.springframework.ldap.core.ContextSource;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.ldap.userdetails.DefaultLdapAuthoritiesPopulator;

import javax.annotation.PostConstruct;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.HashSet;
import java.util.Set;

/**
 * @author Frankie Fu
 */
public class LdapAuthoritiesPopulator extends DefaultLdapAuthoritiesPopulator {

    private static final String LOGGED_IN_USERNAME = ":LOGGED_IN_USERNAME";

    private String roleProvider;

    private boolean groupSearchDisabled;

    private String roleModel;
    private String roleEntity;
    private String roleTable;
    private String roleProperty;
    private String roleUsername;

    private boolean useRolesQuery;
    private String roleQuery;
    private DataSource dataSource;

    @JsonIgnore
    private String authoritiesByUsernameQuery;

    public LdapAuthoritiesPopulator(ContextSource contextSource, String groupSearchBase) {
        super(contextSource, groupSearchBase);
    }

    @PostConstruct
    protected void init() {
        if (useRolesQuery) {
            authoritiesByUsernameQuery = this.roleQuery;
        } else {
            authoritiesByUsernameQuery = "SELECT " + this.roleProperty + " FROM " + this.roleTable + " WHERE " + this.roleUsername + " = ?";
        }

        if(authoritiesByUsernameQuery.contains(LOGGED_IN_USERNAME)) {
            authoritiesByUsernameQuery = authoritiesByUsernameQuery.replace(LOGGED_IN_USERNAME, "?");
        }
    }

    @Override
    @SuppressWarnings("unchecked")
    public Set getGroupMembershipRoles(String userDn, String username) {
        // GD: Adding in an extra check to determine whether we are getting roles from LDAP or DB
        if (isGroupSearchDisabled()) {
            return new HashSet();
        } else if (this.roleProvider != null && this.roleProvider.equals("Database")) {
            return getAuthoritiesFromDatabase(username);
        } else {
            return super.getGroupMembershipRoles(userDn, username);
        }
    }

    private Set getAuthoritiesFromDatabase(String username) {
        HashSet roles = new HashSet();

        Connection con = null;
        ResultSet rs = null;
        try {
            con = getDataSource().getConnection();

            PreparedStatement ps = con.prepareStatement(authoritiesByUsernameQuery);
            ps.setString(1, username);
            rs = ps.executeQuery();
            while (rs.next()) {
                GrantedAuthority grantedAuthorityImp = new SimpleGrantedAuthority("ROLE_" + rs.getString(1));
                roles.add(grantedAuthorityImp);
            }
        } catch (SQLException e) {
            throw new WMRuntimeException(e);
        } finally {
            IOUtils.closeByLogging(rs);
            IOUtils.closeByLogging(con);
        }
        return roles;
    }

    public boolean isGroupSearchDisabled() {
        return this.groupSearchDisabled;
    }

    public void setGroupSearchDisabled(boolean groupSearchDisabled) {
        this.groupSearchDisabled = groupSearchDisabled;
    }

    public String getRoleModel() {
        return this.roleModel;
    }

    public void setRoleModel(String roleModel) {
        this.roleModel = roleModel;
    }

    public String getRoleEntity() {
        return this.roleEntity;
    }

    public void setRoleEntity(String roleEntity) {
        this.roleEntity = roleEntity;
    }

    public String getRoleTable() {
        return this.roleTable;
    }

    public void setRoleTable(String roleTable) {
        this.roleTable = roleTable;
    }

    public String getRoleProperty() {
        return this.roleProperty;
    }

    public void setRoleProperty(String roleProperty) {
        this.roleProperty = roleProperty;
    }

    public String getRoleProvider() {
        return this.roleProvider;
    }

    public void setRoleProvider(String roleProvider) {
        this.roleProvider = roleProvider;
    }

    public String getRoleUsername() {
        return this.roleUsername;
    }

    public String getRoleQuery() {
        return this.roleQuery;
    }

    public void setRoleQuery(String roleQuery) {
        this.roleQuery = roleQuery;
    }

    public void setRoleUsername(String roleUsername) {
        this.roleUsername = roleUsername;
    }

    public DataSource getDataSource() {
        return this.dataSource;
    }

    public void setDataSource(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public boolean isUseRolesQuery() {
        return useRolesQuery;
    }

    public void setUseRolesQuery(boolean useRolesQuery) {
        this.useRolesQuery = useRolesQuery;
    }
}
