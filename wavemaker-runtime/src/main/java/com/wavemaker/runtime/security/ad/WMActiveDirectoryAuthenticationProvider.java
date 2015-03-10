package com.wavemaker.runtime.security.ad;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.IOUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ldap.core.DirContextOperations;
import org.springframework.ldap.core.DistinguishedName;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import javax.annotation.PostConstruct;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.*;

/**
 * Created by nileshk on 3/3/15.
 */
public class WMActiveDirectoryAuthenticationProvider extends SpringActiveDirectoryLdapAuthenticationProvider {

    private static final Logger logger = LoggerFactory.getLogger(WMActiveDirectoryAuthenticationProvider.class);

    private static final String LOGGED_IN_USERNAME = ":LOGGED_IN_USERNAME";

    private String roleProvider;

    private boolean groupSearchDisabled;
    private String groupRoleAttribute;
    private DataSource dataSource;
    private String roleModel;
    private String roleEntity;
    private String roleTable;
    private String roleProperty;
    private String roleUsername;

    private boolean useRolesQuery;
    private String roleQuery;

    @JsonIgnore
    private String authoritiesByUsernameQuery;

    /**
     * @param domain the domain name (may be null or empty)
     * @param url    an LDAP url (or multiple URLs)
     */
    public WMActiveDirectoryAuthenticationProvider(String domain, String url) {
        super(domain, url);
        setConvertSubErrorCodesToExceptions(true);
    }

    @PostConstruct
    protected void init() {
        if (this.useRolesQuery) {
            authoritiesByUsernameQuery = this.roleQuery;
        } else {
            authoritiesByUsernameQuery = "SELECT " + this.roleProperty + " FROM " + this.roleTable + " WHERE " + this.roleUsername + " = ?";
        }

        if(authoritiesByUsernameQuery.contains(LOGGED_IN_USERNAME)) {
            authoritiesByUsernameQuery = authoritiesByUsernameQuery.replace(LOGGED_IN_USERNAME, "?");
        }

        if(groupRoleAttribute == null && groupRoleAttribute.equals("")) {
            groupRoleAttribute = "memberOf";
        }
    }


    /**
     * Creates the user authority list from the values of the {@code memberOf} attribute obtained from the user's
     * Active Directory entry.
     */
    @Override
    protected Collection<? extends GrantedAuthority> loadUserAuthorities(DirContextOperations userData, String username, String password) {
        if(groupSearchDisabled)
            return AuthorityUtils.NO_AUTHORITIES;

        if (this.roleProvider != null && this.roleProvider.equals("Database")) {
            return getAuthoritiesFromDatabase(username);
        } else {
            return loadUserAuthorities(userData, groupRoleAttribute);
        }
    }

    protected Collection<? extends GrantedAuthority> loadUserAuthorities(DirContextOperations userData, String groupRoleAttribute) {
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
            authorities.add(new SimpleGrantedAuthority(new DistinguishedName(group).removeLast().getValue()));
        }

        return authorities;
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

    public String getRoleModel() {
        return roleModel;
    }

    public void setRoleModel(String roleModel) {
        this.roleModel = roleModel;
    }

    public String getRoleEntity() {
        return roleEntity;
    }

    public void setRoleEntity(String roleEntity) {
        this.roleEntity = roleEntity;
    }

    public String getRoleTable() {
        return roleTable;
    }

    public void setRoleTable(String roleTable) {
        this.roleTable = roleTable;
    }

    public String getRoleProperty() {
        return roleProperty;
    }

    public void setRoleProperty(String roleProperty) {
        this.roleProperty = roleProperty;
    }

    public String getRoleProvider() {
        return roleProvider;
    }

    public void setRoleProvider(String roleProvider) {
        this.roleProvider = roleProvider;
    }

    public String getRoleUsername() {
        return roleUsername;
    }

    public void setRoleUsername(String roleUsername) {
        this.roleUsername = roleUsername;
    }

    public String getRoleQuery() {
        return roleQuery;
    }

    public void setRoleQuery(String roleQuery) {
        this.roleQuery = roleQuery;
    }

    public DataSource getDataSource() {
        return dataSource;
    }

    public void setDataSource(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public boolean isGroupSearchDisabled() {
        return groupSearchDisabled;
    }

    public void setGroupSearchDisabled(boolean groupSearchDisabled) {
        this.groupSearchDisabled = groupSearchDisabled;
    }

    public String getGroupRoleAttribute() {
        return groupRoleAttribute;
    }

    public void setGroupRoleAttribute(String groupRoleAttribute) {
        this.groupRoleAttribute = groupRoleAttribute;
    }

    public boolean isUseRolesQuery() {
        return useRolesQuery;
    }

    public void setUseRolesQuery(boolean useRolesQuery) {
        this.useRolesQuery = useRolesQuery;
    }
}
