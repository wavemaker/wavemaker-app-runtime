package com.wavemaker.runtime.data.periods;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;

import com.wavemaker.runtime.data.annotations.TableTemporal;
import com.wavemaker.runtime.data.filter.WMQueryInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 29/11/17
 */
public class BetweenClause implements PeriodClause {
    private final TableTemporal.TemporalType type;
    private final Date from;
    private final Date to;

    public BetweenClause(final TableTemporal.TemporalType type, final Date from, final Date to) {
        this.type = type;
        this.from = from;
        this.to = to;
    }


    @Override
    public WMQueryInfo asWMQueryClause() {
        String var1Name = "wm_" + type.asHqlKeyword() + "_from_timestamp";
        String var2Name = "wm_" + type.asHqlKeyword() + "_and_timestamp";
        String hql = type.asHqlKeyword() + " between :" + var1Name + " and :" + var2Name;

        Map<String, Object> parameters = new HashMap<>(2);
        parameters.put(var1Name, from);
        parameters.put(var2Name, to);

        return new WMQueryInfo(hql, parameters);
    }
}
