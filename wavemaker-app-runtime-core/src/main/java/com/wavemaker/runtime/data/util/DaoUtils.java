package com.wavemaker.runtime.data.util;

import java.util.List;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;

import org.hibernate.Session;

/**
 * @author Dilip Kumar
 * @since 2/2/18
 */
public abstract class DaoUtils {

    public static <T> List<T> findAllRemainingChildren(Session session, Class<T> entity, ChildrenFilter<T> filter) {

        final CriteriaBuilder builder = session.getCriteriaBuilder();
        final CriteriaQuery<T> query = builder.createQuery(entity);

        final Root<T> root = query.from(entity);

        query.select(root).where(builder.equal(root.get(filter.parentPropertyName), filter.parent),
                builder.not(root.in(filter.existingChildren)));

        return session.createQuery(query).list();

    }

    public static class ChildrenFilter<T> {

        private String parentPropertyName;
        private Object parent;

        private List<T> existingChildren;

        public ChildrenFilter(final String parentPropertyName, final Object parent, final List<T> existingChildren) {
            this.parentPropertyName = parentPropertyName;
            this.parent = parent;
            this.existingChildren = existingChildren;
        }
    }
}
