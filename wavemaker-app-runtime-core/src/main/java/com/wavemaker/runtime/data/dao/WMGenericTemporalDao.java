package com.wavemaker.runtime.data.dao;

import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.wavemaker.runtime.data.periods.PeriodClause;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/1/18
 */
public interface WMGenericTemporalDao<E, I> extends WMGenericDao<E, I> {

    Page<E> findByPeriod(List<PeriodClause> periodClauses, String query, Pageable pageable);

    Page<E> findByIdAndPeriod(Map<String, Object> identifier, List<PeriodClause> periodClauses, Pageable pageable);

    int update(Map<String, Object> identifier, PeriodClause periodClause, E entity);

    int update(PeriodClause periodClause, String filter, final E entity);

    int delete(Map<String, Object> identifier, PeriodClause periodClause);

    int delete(PeriodClause periodClause, String filter);
}
