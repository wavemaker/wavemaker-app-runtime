package com.wavemaker.runtime.data.dao.callbacks;

import java.util.List;
import java.util.Map;

import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.Session;
import org.springframework.orm.hibernate4.HibernateCallback;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.exception.EntityNotFoundException;
import com.wavemaker.runtime.data.exception.MultipleRecordsException;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 16/3/17
 */
public abstract class AbstractQueryCallback<T> implements HibernateCallback<T> {

    @Override
    @SuppressWarnings("unchecked")
    public T doInHibernate(final Session session) throws HibernateException {
        final Query query = getQuery(session);
        QueryHelper.configureParameters(query, getParameters());
        QueryHelper.setResultTransformer(query, getReturnType());

        final List list = query.list();

        if (list.isEmpty()) {
            throw new EntityNotFoundException("No row exists");
        }

        if (list.size() == 1) {
            return (T) list.get(0);
        }

        throw new MultipleRecordsException("More than one row exists. Expected: 1 but found: " + list.size());
    }

    protected abstract Query getQuery(final Session session);

    protected abstract Map<String, Object> getParameters();

    protected abstract Class<?> getReturnType();
}
