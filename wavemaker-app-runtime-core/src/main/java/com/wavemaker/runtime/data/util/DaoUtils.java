package com.wavemaker.runtime.data.util;

import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;

import org.apache.commons.lang3.ArrayUtils;
import org.hibernate.Session;

import com.wavemaker.runtime.data.expression.AttributeType;
import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.data.expression.Type;

/**
 * @author Dilip Kumar
 * @since 2/2/18
 */
public abstract class DaoUtils {

    public static <T> List<T> findAllRemainingChildren(Session session, Class<T> entity, ChildrenFilter<T> filter) {
        return findAllChildren(session, entity, filter);
    }

    public static <T> List<T> findAllChildren(Session session, Class<T> entity, ChildrenFilter<T> filter) {

        final CriteriaBuilder builder = session.getCriteriaBuilder();
        final CriteriaQuery<T> query = builder.createQuery(entity);

        final Root<T> root = query.from(entity);

        if (!filter.existingChildren.isEmpty()) {
            query.select(root).where(builder.equal(root.get(filter.parentPropertyName), filter.parent),
                    builder.not(root.in(filter.existingChildren)));
        } else {
            query.select(root).where(builder.equal(root.get(filter.parentPropertyName), filter.parent));
        }

        return session.createQuery(query).list();
    }

    public static void validateQueryFilters(QueryFilter[] queryFilters) {
        if (ArrayUtils.isNotEmpty(queryFilters)) {
            for (QueryFilter queryFilter : queryFilters) {
                Object attributeValue = queryFilter.getAttributeValue();
                if (attributeValue == null || queryFilter.getFilterCondition() == Type.NULL) {
                    continue;
                }

                AttributeType attributeType = queryFilter.getAttributeType();
                if (attributeValue instanceof Collection) {
                    Collection collection = (Collection) attributeValue;
                    Object[] objects = collection.toArray();
                    updateObjectsArray(objects, attributeType);
                    queryFilter.setAttributeValue(Arrays.asList(objects));
                } else if (attributeValue.getClass().isArray()) {
                    Object[] objects = (Object[]) attributeValue;
                    updateObjectsArray(objects, attributeType);
                    queryFilter.setAttributeValue(objects);
                } else {
                    queryFilter.setAttributeValue(getUpdatedAttributeValue(attributeValue, attributeType));
                }
            }
        }
    }

    private static void updateObjectsArray(Object[] objects, AttributeType attributeType) {
        for (int i = 0; i < objects.length; i++) {
            objects[i] = getUpdatedAttributeValue(objects[i], attributeType);
        }
    }

    private static Object getUpdatedAttributeValue(Object attributeValue, AttributeType attributeType) {
        return attributeType.toJavaType(attributeValue);
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

        public ChildrenFilter(final String parentPropertyName, final Object parent) {
            this(parentPropertyName, parent, Collections.emptyList());
        }
    }
}
