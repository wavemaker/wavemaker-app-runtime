package com.wavemaker.runtime.data.expression;

import java.util.Collection;
import java.util.Iterator;

import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.MatchMode;
import org.hibernate.criterion.Restrictions;

/**
 * @author <a href="mailto:sunil.pulugula@wavemaker.com">Sunil Kumar</a>
 * @since 15/2/16
 */
public interface Criteria {

    public Criterion criterion(final String name, final Object value);

}
