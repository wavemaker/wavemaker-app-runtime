/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
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

package com.wavemaker.runtime.data.sqlserver;

import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.hibernate.Transaction;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.invocation.InvocationOnMock;
import org.mockito.stubbing.Answer;
import org.springframework.jdbc.datasource.ConnectionProxy;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.orm.hibernate4.HibernateTransactionManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import java.sql.Statement;

import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;
import static org.mockito.Mockito.*;

public class SqlServerUserImpersonatingDataSourceProxyTest {

    @Mock
    private DataSource targetDataSource;

    @Mock
    private Connection connection;

    @Mock
    private Statement statement;

    @Mock
    private SessionFactory sessionFactory;

    @Mock
    private Session session;

    @Mock
    private Transaction tx;

    @Before
    public void setUp() throws SQLException {
        MockitoAnnotations.initMocks(this);
        when(this.targetDataSource.getConnection()).thenReturn(this.connection);
        when(this.connection.createStatement()).thenReturn(this.statement);
        when(this.sessionFactory.openSession()).thenReturn(this.session);
        when(this.session.getTransaction()).thenReturn(this.tx);
        when(this.session.beginTransaction()).thenReturn(this.tx);
    }

    @After
    public void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    public void testGetConnectionWithDataSourceTxMgr() throws SQLException {
        SecurityContext context = new SecurityContextImpl();
        Authentication auth = new UsernamePasswordAuthenticationToken("foo", "bar");
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        DataSource proxy = new SqlServerUserImpersonatingDataSourceProxy(this.targetDataSource);
        PlatformTransactionManager txManager = new DataSourceTransactionManager(proxy);
        TransactionStatus status = txManager.getTransaction(null);
        Connection conn = DataSourceUtils.getConnection(proxy);
        assertNotNull(conn);
        assertTrue(conn instanceof ConnectionProxy);
        verify(this.statement).execute("EXECUTE AS USER='foo'");
        txManager.commit(status);
        verify(this.statement).execute("REVERT");
    }

   /* @SuppressWarnings("deprecation")
    @Test
    public void testGetConnectionWithHibernateTxMgr() throws SQLException {
        SecurityContext context = new SecurityContextImpl();
        Authentication auth = new UsernamePasswordAuthenticationToken("foo", "bar");
        context.setAuthentication(auth);
        SecurityContextHolder.setContext(context);
        DataSource proxy = new SqlServerUserImpersonatingDataSourceProxy(this.targetDataSource);
        ConnectionAnswer answer = new ConnectionAnswer(proxy);
//        when(this.session.connection()).thenAnswer(answer);
        HibernateTransactionManager txManager = new HibernateTransactionManager(this.sessionFactory);
        txManager.setDataSource(proxy);
        TransactionStatus status = txManager.getTransaction(null);
        when(this.session.isConnected()).thenReturn(Boolean.TRUE);
        Connection conn = DataSourceUtils.getConnection(proxy);
        assertNotNull(conn);
        assertTrue(conn instanceof ConnectionProxy);
        verify(this.statement).execute("EXECUTE AS USER='foo'");
        when(this.session.close()).thenAnswer(new CloseAnswer(proxy));
        txManager.commit(status);
        verify(this.statement).execute("REVERT");
    }*/

    @Test
    public void testGetConnectionUnauthenticated() throws SQLException {
        DataSource proxy = new SqlServerUserImpersonatingDataSourceProxy(this.targetDataSource);
        PlatformTransactionManager txManager = new DataSourceTransactionManager(proxy);
        TransactionStatus status = txManager.getTransaction(null);
        Connection conn = DataSourceUtils.getConnection(proxy);
        assertNotNull(conn);
        assertTrue(conn instanceof ConnectionProxy);
        verify(this.statement, atMost(0)).execute("EXECUTE AS USER='foo'");
        txManager.commit(status);
        verify(this.statement, atMost(0)).execute("REVERT");
    }

    private static final class ConnectionAnswer implements Answer<Connection> {

        private Connection connection = null;

        private final DataSource dataSource;

        public ConnectionAnswer(DataSource dataSource) {
            this.dataSource = dataSource;
        }

        @Override
        public Connection answer(InvocationOnMock invocation) throws Throwable {
            if (this.connection == null) {
                this.connection = this.dataSource.getConnection();
            }
            return this.connection;
        }
    }

    private static final class CloseAnswer implements Answer<Connection> {

        private final DataSource dataSource;

        public CloseAnswer(DataSource dataSource) {
            this.dataSource = dataSource;
        }

        @Override
        public Connection answer(InvocationOnMock invocation) throws Throwable {
            Connection connection = DataSourceUtils.getConnection(this.dataSource);
            DataSourceUtils.releaseConnection(connection, this.dataSource);
            return connection;
        }
    }
}
