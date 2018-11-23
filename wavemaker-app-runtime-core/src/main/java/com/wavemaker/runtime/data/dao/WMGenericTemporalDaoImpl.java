package com.wavemaker.runtime.data.dao;

import java.beans.PropertyDescriptor;
import java.io.Serializable;
import java.lang.reflect.InvocationTargetException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import javax.annotation.PostConstruct;
import javax.persistence.Column;
import javax.persistence.Id;
import javax.persistence.Transient;

import org.hibernate.query.Query;
import org.springframework.beans.BeanUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate5.HibernateTemplate;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.annotations.TableTemporal;
import com.wavemaker.runtime.data.dao.generators.TemporalQueryGenerator;
import com.wavemaker.runtime.data.dao.query.types.RuntimeParameterTypeResolver;
import com.wavemaker.runtime.data.dao.util.PageUtils;
import com.wavemaker.runtime.data.dao.util.ParametersConfigurator;
import com.wavemaker.runtime.data.filter.WMQueryInfo;
import com.wavemaker.runtime.data.hql.DeleteQueryBuilder;
import com.wavemaker.runtime.data.hql.SelectQueryBuilder;
import com.wavemaker.runtime.data.hql.UpdateQueryBuilder;
import com.wavemaker.runtime.data.model.TemporalHistoryEntity;
import com.wavemaker.runtime.data.periods.PeriodClause;
import com.wavemaker.runtime.data.util.AnnotationUtils;
import com.wavemaker.runtime.data.util.HqlQueryHelper;
import com.wavemaker.runtime.data.util.PropertyDescription;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/1/18
 */
public abstract class WMGenericTemporalDaoImpl<E extends Serializable, I extends Serializable>
        extends WMGenericDaoImpl<E, I> implements WMGenericTemporalDao<E, I> {

    private Class<TemporalHistoryEntity<E>> historyClass;

    private List<PropertyDescriptor> updatableProperties;

    @SuppressWarnings("unchecked")
    @PostConstruct
    @Override
    public void init() {
        super.init();

        if (entityClass.isAnnotationPresent(TableTemporal.class)) {
            final TableTemporal temporal = entityClass.getAnnotation(TableTemporal.class);
            // decorating with given temporal types
            final boolean applicationTemporalExists = Arrays.stream(temporal.value())
                    .anyMatch(temporalType -> temporalType == TableTemporal.TemporalType.APPLICATION);

            if (applicationTemporalExists) {
                queryGenerator = new TemporalQueryGenerator<>(queryGenerator, TableTemporal.TemporalType.APPLICATION);
            }

            historyClass = (Class<TemporalHistoryEntity<E>>) temporal.historyClass();

            updatableProperties = AnnotationUtils.findProperties(historyClass).stream()
                    .filter(description -> description.isAnnotationNotPresent(Id.class))
                    .filter(description -> description.isAnnotationNotPresent(Transient.class))
                    .filter(description -> {
                        final Optional<Column> optionalColumn = description.findAnnotation(Column.class);
                        return optionalColumn.isPresent() && optionalColumn.get().updatable();
                    })
                    .map(PropertyDescription::getDescriptor)
                    .map(PropertyDescriptor::getName)
                    .map(name -> BeanUtils.getPropertyDescriptor(entityClass, name))
                    .collect(Collectors.toList());
        } else {
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.tableTemporal.annotation.error"), entityClass.getName());
        }
    }

    protected abstract HibernateTemplate getHistoryTemplate();

    @Override
    public Page<E> findByPeriod(
            final List<PeriodClause> periodClauses, final String query, final Pageable pageable) {
        Pageable validPageable = PageUtils.defaultIfNull(pageable);

        sortValidator.validate(validPageable, historyClass);

        final SelectQueryBuilder builder = new SelectQueryBuilder(historyClass)
                .withFilter(query);
        periodClauses.forEach(builder::withPeriodClause);

        final Page<TemporalHistoryEntity<E>> responsePage = HqlQueryHelper
                .execute(getHistoryTemplate(), historyClass, builder, validPageable);

        return responsePage.map(TemporalHistoryEntity::asParent);
    }

    @Override
    public Page<E> findByIdAndPeriod(
            final Map<String, Object> identifier, final List<PeriodClause> periodClauses, final Pageable pageable) {
        Pageable validPageable = PageUtils.defaultIfNull(pageable);

        sortValidator.validate(validPageable, historyClass);

        final SelectQueryBuilder builder = new SelectQueryBuilder(historyClass)
                .withFilterConditions(identifier);
        periodClauses.forEach(builder::withPeriodClause);

        final Page<TemporalHistoryEntity<E>> responsePage = HqlQueryHelper
                .execute(getHistoryTemplate(), historyClass, builder, validPageable);

        return responsePage.map(TemporalHistoryEntity::asParent);
    }

    @Override
    public int update(
            final Map<String, Object> identifier, final PeriodClause periodClause, final E entity) {
        UpdateQueryBuilder builder = new UpdateQueryBuilder(historyClass);

        builder.withFilterConditions(identifier);
        builder.withPeriodClause(periodClause);

        updatableProperties.forEach(property -> {
            try {
                builder.withSetter(property.getName(),
                        property.getReadMethod().invoke(entity));
            } catch (IllegalAccessException | InvocationTargetException e) {
                throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.property.read.error"), e, property.getName());
            }
        });

        return executeUpdateDeleteQuery(builder.build());
    }

    @Override
    public int update(
            final PeriodClause periodClause, final String filter, final E entity) {
        UpdateQueryBuilder builder = new UpdateQueryBuilder(historyClass);

        builder.withFilter(filter);
        builder.withPeriodClause(periodClause);

        updatableProperties.forEach(property -> {
            try {
                builder.withSetter(property.getName(),
                        property.getReadMethod().invoke(entity));
            } catch (IllegalAccessException | InvocationTargetException e) {
                throw new WMRuntimeException("Error while reading property: " + property.getName() + " value", e);
            }
        });

        return executeUpdateDeleteQuery(builder.build());
    }

    @Override
    public int delete(final Map<String, Object> identifier, final PeriodClause periodClause) {
        DeleteQueryBuilder builder = new DeleteQueryBuilder(historyClass);

        builder.withFilterConditions(identifier);
        builder.withPeriodClause(periodClause);

        return executeUpdateDeleteQuery(builder.build());
    }

    @Override
    public int delete(final PeriodClause periodClause, final String filter) {
        DeleteQueryBuilder builder = new DeleteQueryBuilder(historyClass);

        builder.withFilter(filter);
        builder.withPeriodClause(periodClause);

        return executeUpdateDeleteQuery(builder.build());
    }

    private int executeUpdateDeleteQuery(final WMQueryInfo queryInfo) {
        return getHistoryTemplate().execute(session -> {
            final Query<?> query = session.createQuery(queryInfo.getQuery());
            ParametersConfigurator.configure(query, queryInfo.getParameterValueMap(),
                    new RuntimeParameterTypeResolver(queryInfo.getParameters(), session.getTypeHelper()));
            return query.executeUpdate();
        });
    }
}
