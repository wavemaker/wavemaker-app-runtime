package com.wavemaker.runtime.security.provider.database;

import org.springframework.orm.hibernate4.HibernateOperations;
import org.springframework.orm.hibernate4.HibernateTemplate;
import org.springframework.orm.hibernate4.support.HibernateDaoSupport;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/**
 * Created by ArjunSahasranam on 11/3/16.
 */
public abstract class AbstractDatabaseSupport extends HibernateDaoSupport {

    protected TransactionTemplate transactionTemplate;
    protected PlatformTransactionManager transactionManager;
    protected boolean hql = false;

    public boolean isHql() {
        return hql;
    }

    public void setHql(final boolean hql) {
        this.hql = hql;
    }

    public PlatformTransactionManager getTransactionManager() {
        return transactionManager;
    }

    public void setTransactionManager(final PlatformTransactionManager transactionManager) {
        this.transactionManager = transactionManager;
        this.transactionTemplate = new TransactionTemplate(this.transactionManager);
    }

    public TransactionTemplate getTransactionTemplate() {
        return transactionTemplate;
    }

    public void setHibernateTemplate(final HibernateOperations hibernateTemplate) {
        super.setHibernateTemplate((HibernateTemplate) hibernateTemplate);
    }
}
