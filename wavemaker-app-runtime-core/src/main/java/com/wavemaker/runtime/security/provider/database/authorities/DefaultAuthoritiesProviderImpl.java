package com.wavemaker.runtime.security.provider.database.authorities;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.hibernate.Query;
import org.hibernate.Session;
import org.springframework.orm.hibernate4.HibernateCallback;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.security.provider.database.AbstractDatabaseSupport;

/**
 * Created by ArjunSahasranam on 11/3/16.
 */
public class DefaultAuthoritiesProviderImpl extends AbstractDatabaseSupport implements AuthoritiesProvider {

    private String authoritiesByUsernameQuery = "SELECT userid, role FROM User WHERE username = ?";
    private String rolePrefix = "ROLE_";
    private boolean rolesByQuery = false;
    private static final String LOGGED_IN_USERNAME = ":LOGGED_IN_USERNAME";


    @PostConstruct
    protected void init() {
        if(authoritiesByUsernameQuery.contains(LOGGED_IN_USERNAME)) {
            authoritiesByUsernameQuery = authoritiesByUsernameQuery.replace(LOGGED_IN_USERNAME, "?");
        }
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
        final List<GrantedAuthority> execute = getTransactionTemplate().execute(
                new TransactionCallback<List<GrantedAuthority>>() {
                    @Override
                    public List<GrantedAuthority> doInTransaction(final TransactionStatus status) {
                        final List<GrantedAuthority> grantedAuthorities = getHibernateTemplate()
                                .execute(new HibernateCallback<List<GrantedAuthority>>() {
                                    @Override
                                    public List<GrantedAuthority> doInHibernate(Session session) {
                                        return getGrantedAuthorities(session, username);
                                    }
                                });
                        return grantedAuthorities;
                    }
                });
        return execute;
    }

    private List<GrantedAuthority> getGrantedAuthorities(final Session session, final String username) {
        String authoritiesByUsernameQuery = getAuthoritiesByUsernameQuery();
        authoritiesByUsernameQuery = authoritiesByUsernameQuery.replace("?", "\'" + username + "\'");
        if (isRolesByQuery() || !isHql()) {
            return getGrantedAuthoritiesByNativeSql(session, authoritiesByUsernameQuery);
        } else {
            return getGrantedAuthoritiesByHQL(session, authoritiesByUsernameQuery);
        }
    }

    private List<GrantedAuthority> getGrantedAuthoritiesByHQL(Session session, String authoritiesByUsernameQuery) {
        final Query query = session.createQuery(authoritiesByUsernameQuery);
        QueryHelper.setResultTransformer(query);
        final List list = query.list();
        String[] params = {"0", "1"};
        return getAuthorities(list, params);
    }

    private List<GrantedAuthority> getGrantedAuthoritiesByNativeSql(
            final Session session, final String authoritiesByUsernameQuery) {
        final Query query = session.createSQLQuery(authoritiesByUsernameQuery);
        QueryHelper.setResultTransformer(query);
        final List list = query.list();
        String[] params = {"USERID", "ROLE"};
        return getAuthorities(list, params);
    }

    private List<GrantedAuthority> getAuthorities(List<Object> content, String... params) {
        List<GrantedAuthority> grantedAuthorities = new ArrayList<>();
        if (content.size() > 0) {
            final Map<String, Object> resultMap = (Map) content.get(0);
            for (Map.Entry<String, Object> entry : resultMap.entrySet()) {
                String role = String.valueOf(resultMap.get(params[1]));
                SimpleGrantedAuthority simpleGrantedAuthority = new SimpleGrantedAuthority(getRolePrefix() + role);
                grantedAuthorities.add(simpleGrantedAuthority);
            }
            return grantedAuthorities;
        }
        return grantedAuthorities;
    }

}
