package com.wavemaker.runtime.data.dao;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.wavemaker.runtime.data.periods.PeriodClause;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 3/1/18
 */
public interface WMGenericTemporalDao<Entity, Identifier> extends WMGenericDao<Entity, Identifier> {

    Page<Entity> findHistory(List<PeriodClause> periodClauses, String query, Pageable pageable);

}
