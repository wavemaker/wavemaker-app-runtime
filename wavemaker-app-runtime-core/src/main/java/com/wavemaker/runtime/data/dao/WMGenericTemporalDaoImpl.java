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
import com.wavemaker.runtime.data.model.TemporalHistoryEntity;
import com.wavemaker.runtime.data.periods.PeriodClause;
import com.wavemaker.runtime.data.util.HqlQueryBuilder;
import com.wavemaker.runtime.data.util.HqlQueryHelper;
import com.wavemaker.runtime.data.util.Mappers;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/1/18
 */
public abstract class WMGenericTemporalDaoImpl<Entity extends Serializable, Identifier extends Serializable>
        extends WMGenericDaoImpl<Entity, Identifier>
        implements WMGenericTemporalDao<Entity, Identifier> {

    private Class<TemporalHistoryEntity<Entity>> historyClass;

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

            historyClass = (Class<TemporalHistoryEntity<Entity>>) temporal.historyClass();
        }
    }

    protected abstract HibernateTemplate getHistoryTemplate();

    @Override
    public Page<Entity> findHistory(
            final List<PeriodClause> periodClauses, final String query, final Pageable pageable) {

        final HqlQueryBuilder builder = HqlQueryBuilder.newBuilder(historyClass)
                .withFilter(query);
        periodClauses.forEach(builder::withPeriodClause);

        final Page<TemporalHistoryEntity<Entity>> responsePage = HqlQueryHelper
                .execute(getHistoryTemplate(), historyClass, builder, pageable);

        return Mappers.map(responsePage, pageable, TemporalHistoryEntity::asParent);
    }

}
