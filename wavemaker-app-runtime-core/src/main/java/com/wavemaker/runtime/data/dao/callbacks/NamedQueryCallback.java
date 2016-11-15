package com.wavemaker.runtime.data.dao.callbacks;

import java.util.List;

import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.Session;
import org.springframework.orm.hibernate4.HibernateCallback;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.model.QueryInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class NamedQueryCallback<T> implements HibernateCallback<T> {

    private final QueryInfo<T> queryInfo;

    public NamedQueryCallback(final QueryInfo<T> queryInfo) {
        this.queryInfo = queryInfo;
    }

    @Override
    @SuppressWarnings("unchecked")
    public T doInHibernate(final Session session) throws HibernateException {
        final Query namedQuery = session.getNamedQuery(queryInfo.getQueryName());
        QueryHelper.configureParameters(namedQuery, queryInfo.getParams());
        QueryHelper.setResultTransformer(namedQuery, queryInfo.getReturnClass());


        final List list = namedQuery.list();
        return list.isEmpty() ? null : (T) list.get(0);
    }

}
