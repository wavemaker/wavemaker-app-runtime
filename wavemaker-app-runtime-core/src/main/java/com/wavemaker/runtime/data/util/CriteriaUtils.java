package com.wavemaker.runtime.data.util;

import java.util.Set;

import org.hibernate.Criteria;
import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.Order;
import org.hibernate.criterion.Projections;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.data.spring.WMPageImpl;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 25/5/16
 */
public abstract class CriteriaUtils {

    public static final String SEARCH_PROPERTY_DELIMITER = ".";

    public static Criterion createCriterion(QueryFilter queryFilter) {
        Object attributeValue = queryFilter.getAttributeValue();
        String attributeName = queryFilter.getAttributeName();
        return queryFilter.getFilterCondition().criterion(attributeName, attributeValue);
    }

    public static Page executeAndGetPageableData(Criteria criteria, Pageable pageable, Set<String> aliases) {
        if (pageable != null) {
            long count = getRowCount(criteria);
            updateCriteriaForPageable(criteria, pageable, aliases);
            return new WMPageImpl(criteria.list(), pageable, count);
        } else {
            return new WMPageImpl(criteria.list());
        }
    }

    public static Long getRowCount(Criteria criteria) {
        //set the projection
        criteria.setProjection(Projections.rowCount());

        Long count;
        try {
            count = (Long) criteria.uniqueResult();

            if (count == null) {
                count = 0L;
            }
        } finally {
            //unset the projection
            criteria.setProjection(null);
            criteria.setResultTransformer(Criteria.ROOT_ENTITY);
        }
        return count;
    }


    public static Criteria criteriaForRelatedProperty(
            Criteria criteria, final String attributeName, final Set<String> aliases) {
        final int indexOfDot = attributeName.lastIndexOf(SEARCH_PROPERTY_DELIMITER);
        if (indexOfDot != -1) {
            String relatedEntityName = attributeName.substring(0, indexOfDot);
            if (aliases == null) {
                return criteria.createAlias(relatedEntityName, relatedEntityName);
            } else if (!aliases.contains(relatedEntityName)) {
                aliases.add(relatedEntityName);
                return criteria.createAlias(relatedEntityName, relatedEntityName);
            }
        }
        return criteria;
    }

    public static void updateCriteriaForPageable(Criteria criteria, Pageable pageable, Set<String> aliases) {
        if (pageable == null) {
            throw new RuntimeException("Pageable object cannot be null");
        }
        criteria.setFirstResult(pageable.getOffset());
        criteria.setMaxResults(pageable.getPageSize());
        if (pageable.getSort() != null) {
            for (final Sort.Order order : pageable.getSort()) {
                final String property = order.getProperty();
                criteriaForRelatedProperty(criteria, property, aliases);
                if (order.getDirection() == Sort.Direction.DESC) {
                    criteria.addOrder(Order.desc(property));
                } else {
                    criteria.addOrder(Order.asc(property));
                }
            }
        }
    }
}
