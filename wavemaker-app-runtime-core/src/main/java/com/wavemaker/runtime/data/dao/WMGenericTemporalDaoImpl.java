package com.wavemaker.runtime.data.dao;

import java.io.Serializable;
import java.util.Arrays;
import java.util.List;
import javax.annotation.PostConstruct;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate5.HibernateTemplate;

import com.wavemaker.runtime.data.annotations.TableTemporal;
import com.wavemaker.runtime.data.dao.generators.TemporalQueryGenerator;
import com.wavemaker.runtime.data.dao.util.PageUtils;
import com.wavemaker.runtime.data.model.TemporalHistoryEntity;
import com.wavemaker.runtime.data.periods.PeriodClause;
import com.wavemaker.runtime.data.util.HqlQueryBuilder;
import com.wavemaker.runtime.data.util.HqlQueryHelper;
import com.wavemaker.runtime.data.util.Mappers;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/1/18
 */
public abstract class WMGenericTemporalDaoImpl<E extends Serializable, I extends Serializable>
        extends WMGenericDaoImpl<E, I> implements WMGenericTemporalDao<E, I> {

    private Class<TemporalHistoryEntity<E>> historyClass;

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
        }
    }

    protected abstract HibernateTemplate getHistoryTemplate();

    @Override
    public Page<E> findHistory(
            final List<PeriodClause> periodClauses, final String query, final Pageable pageable) {
        Pageable validPageable = PageUtils.defaultIfNull(pageable);

        sortValidator.validate(validPageable, historyClass);

        final HqlQueryBuilder builder = HqlQueryBuilder.newBuilder(historyClass)
                .withFilter(query);
        periodClauses.forEach(builder::withPeriodClause);

        final Page<TemporalHistoryEntity<E>> responsePage = HqlQueryHelper
                .execute(getHistoryTemplate(), historyClass, builder, validPageable);

        return Mappers.map(responsePage, validPageable, TemporalHistoryEntity::asParent);
    }

}
