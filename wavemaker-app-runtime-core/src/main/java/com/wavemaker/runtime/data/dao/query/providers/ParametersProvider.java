package com.wavemaker.runtime.data.dao.query.providers;

import java.util.Optional;

import org.hibernate.Session;
import org.hibernate.query.Query;
import org.hibernate.type.Type;


/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 4/8/17
 */
public interface ParametersProvider {

    /**
     * Returns the value for given parameter name.
     *
     *
     * @param session
     * @param name parameter name.
     * @return parameter value, null if no value present.
     */
    Object getValue(final Session session, String name);

    /**
     * Returns the {@link Class#getCanonicalName()} for given parameter name.
     *
     * @param name parameter name.
     * @return returns class name, {@link Optional#empty()} if not present.
     */
    Optional<Type> getType(Session session, String name);

    /**
     * Utility method to configure parameters to given query.
     *
     * @param session hibernate session
     * @param query query to be configured
     * @param <R> query return type.
     * @return Returns the given query
     */
    default <R> Query<R> configure(Session session, Query<R> query) {
        query.getParameterMetadata().getNamedParameterNames().forEach(parameterName -> {
            final Object value = getValue(session, parameterName);
            final Optional<Type> typeOptional = getType(session, parameterName);

            if (typeOptional.isPresent()) {
                query.setParameter(parameterName, value, typeOptional.get());
            } else {
                query.setParameter(parameterName, value);
            }
        });

        return query;
    }


}
