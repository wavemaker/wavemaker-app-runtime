package com.wavemaker.runtime.data.periods;

import java.sql.Timestamp;
import java.util.HashMap;
import java.util.Map;

import com.wavemaker.runtime.data.annotations.TableTemporal;
import com.wavemaker.runtime.data.filter.WMQueryInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/11/17
 */
public class FromToClause implements PeriodClause {

    private final TableTemporal.TemporalType type;
    private final Timestamp from;
    private final Timestamp to;

    public FromToClause(final TableTemporal.TemporalType type, final Timestamp from, final Timestamp to) {
        this.type = type;
        this.from = from;
        this.to = to;
    }


    @Override
    public WMQueryInfo asWMQueryClause() {
        String var1Name = "wm_" + type.asHqlKeyword() + "_from_timestamp";
        String var2Name = "wm_" + type.asHqlKeyword() + "_to_timestamp";
        String hql = "for " + type.asHqlKeyword() + " from :" + var1Name + " to :" + var2Name;

        Map<String, Object> parameters = new HashMap<>(2);
        parameters.put(var1Name, from);
        parameters.put(var2Name, to);

        return new WMQueryInfo(hql, parameters);
    }
}
