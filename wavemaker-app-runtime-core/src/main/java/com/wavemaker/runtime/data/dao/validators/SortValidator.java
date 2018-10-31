package com.wavemaker.runtime.data.dao.validators;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import com.wavemaker.commons.InvalidInputException;
import com.wavemaker.commons.MessageResource;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 16/5/17
 */
public class SortValidator {


    public void validate(Pageable pageable, Class<?> entityClass) {
        if (pageable != null && pageable.getSort() != null) {
            final Sort sort = pageable.getSort();
            for (final Sort.Order order : sort) {
                final String propertyName = order.getProperty();
                if (!HqlPropertyResolver.findField(propertyName, entityClass).isPresent()) {
                    throw new InvalidInputException(MessageResource.UNKNOWN_FIELD_NAME, propertyName);
                }
            }
        }
    }


}