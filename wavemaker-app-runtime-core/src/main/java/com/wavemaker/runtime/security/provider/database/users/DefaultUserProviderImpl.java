package com.wavemaker.runtime.security.provider.database.users;

import java.util.List;
import java.util.Map;

import org.hibernate.Query;
import org.hibernate.Session;
import org.springframework.orm.hibernate4.HibernateCallback;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.security.WMUser;
import com.wavemaker.runtime.security.WMUserDetails;
import com.wavemaker.runtime.security.provider.database.AbstractDatabaseSupport;

/**
 * Created by ArjunSahasranam on 11/3/16.
 */
public class DefaultUserProviderImpl extends AbstractDatabaseSupport implements UserProvider {
    private String usersByUsernameQuery = "SELECT userid, password, 1, username FROM User WHERE username = ?";

    public String getUsersByUsernameQuery() {
        return usersByUsernameQuery;
    }

    public void setUsersByUsernameQuery(final String usersByUsernameQuery) {
        this.usersByUsernameQuery = usersByUsernameQuery;
    }

    public UserDetails loadUser(final String username) throws UsernameNotFoundException {
        final WMUser wmUser = getTransactionTemplate().execute(new TransactionCallback<WMUser>() {
            @Override
            public WMUser doInTransaction(final TransactionStatus status) {
                WMUser wmUser = getHibernateTemplate().execute(new HibernateCallback<WMUser>() {
                    @Override
                    public WMUser doInHibernate(Session session) {
                        return getWmUser(session, username);
                    }
                });
                return wmUser;
            }
        });
        return wmUser;
    }

    public UserDetails createUserDetails(String username, UserDetails userFromUserQuery,
            List<GrantedAuthority> combinedAuthorities) {
        String returnUsername = userFromUserQuery.getUsername();

        WMUserDetails wmUserDetails = (WMUserDetails) userFromUserQuery;
        String userLongName = wmUserDetails.getUserLongName();
        int tenantId = wmUserDetails.getTenantId();
        String userId = wmUserDetails.getUserId();
        long loginTime = wmUserDetails.getLoginTime();

        return new WMUser(userId, returnUsername, userFromUserQuery.getPassword(), userLongName, tenantId,
                userFromUserQuery.isEnabled(),
                true, true, true, combinedAuthorities, loginTime);
    }

    private WMUser getWmUser(final Session session, final String username) {
        String usersByUsernameQuery = getUsersByUsernameQuery();
        usersByUsernameQuery = usersByUsernameQuery.replace("?", "\'" + username + "\'");
        if (isHql()) {
            final Query query = session.createQuery(usersByUsernameQuery);
            QueryHelper.setResultTransformer(query);
            final List list = query.list();
            String[] params = {"0", "1", "2", "3"};
            return getWmUser(list, params);
        } else {
            final Query query = session.createSQLQuery(usersByUsernameQuery);
            QueryHelper.setResultTransformer(query);
            final List list = query.list();
            String[] params = {"USERID", "USERNAME", "C3", "PASSWORD"};
            return getWmUser(list, params);
        }
    }

    private WMUser getWmUser(List<Object> content, String... params) {
        if (content.size() > 0) {
            final Map<String, Object> resultMap = (Map) content.get(0);
            int userId = (Integer) resultMap.get(params[0]);
            String password = String.valueOf(resultMap.get(params[1]));
            int enabled = (Integer) resultMap.get(params[2]);
            String userName = String.valueOf(resultMap.get(params[3]));
            int tenantId = -1;
            long loginTime = System.currentTimeMillis();
            boolean isEnabled = enabled == 1 ? true : false;
            return new WMUser(String.valueOf(userId), userName, password, userName, tenantId,
                    Boolean.valueOf(isEnabled), true, true,
                    true, AuthorityUtils.NO_AUTHORITIES, loginTime);
        }
        return null;
    }
}
