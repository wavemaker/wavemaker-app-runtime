package com.wavemaker.runtime.data.periods;

import java.sql.Timestamp;
import java.util.Collections;

import com.wavemaker.runtime.data.annotations.TableTemporal;
import com.wavemaker.runtime.data.filter.WMQueryInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 28/11/17
 */
public class AsOfClause implements PeriodClause {

    private final TableTemporal.TemporalType type;
    private final Timestamp timestamp;

    public AsOfClause(final TableTemporal.TemporalType type, final Timestamp timestamp) {
        this.type = type;
        this.timestamp = timestamp;
    }

    @Override
    public WMQueryInfo asWMQueryClause() {
        String variableName = "wm_" + type.asHqlKeyword() + "_as_of_timestamp";
        final String hql = "for "
                + type.asHqlKeyword()
                + " as of :" + variableName;
        return new WMQueryInfo(hql, Collections.singletonMap(variableName, timestamp));
    }
}
