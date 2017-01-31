/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
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
package com.wavemaker.runtime.security.provider.database.users;

import java.math.BigInteger;
import java.util.List;

import org.hibernate.Query;
import org.hibernate.Session;
import org.springframework.orm.hibernate4.HibernateCallback;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;

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
            final List list = query.list();
            return getWmUser(list);
        } else {
            final Query query = session.createSQLQuery(usersByUsernameQuery);
            final List list = query.list();
            return getWmUser(list);
        }
    }

    private WMUser getWmUser(List<Object> content) {
        if (content.size() > 0) {
            Object[] resultMap = (Object[]) content.get(0);
            String userId = String.valueOf(resultMap[0]);
            String password = String.valueOf(resultMap[1]);
            // MYSQL returns BigInteger. Enabled cloumn shoulld be introduced or "1" should be removed.
            int enabled = 0;
            final Object column3 = resultMap[2];
            if (column3 instanceof Integer) {
                enabled = (Integer) column3;
            } else if (column3 instanceof BigInteger) {
                final BigInteger bigInteger = (BigInteger) column3;
                enabled = bigInteger.intValue();
            }
            String userName = String.valueOf(resultMap[3]);
            int tenantId = -1;
            long loginTime = System.currentTimeMillis();
            boolean isEnabled = enabled == 1 ? true : false;
            return new WMUser(userId, userName, password, userName, tenantId,
                    Boolean.valueOf(isEnabled), true, true,
                    true, AuthorityUtils.NO_AUTHORITIES, loginTime);
        }
        return null;
    }
}
