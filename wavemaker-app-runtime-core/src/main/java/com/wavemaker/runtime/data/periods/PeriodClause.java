package com.wavemaker.runtime.data.periods;

import com.wavemaker.runtime.data.filter.WMQueryInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 28/11/17
 */
public interface PeriodClause {

    WMQueryInfo asWMQueryClause();
}
