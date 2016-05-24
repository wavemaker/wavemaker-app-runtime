package com.wavemaker.runtime.data.expression;

import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.LogicalExpression;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 19/5/16
 */
public interface Joins {

    LogicalExpression criterion(Criterion lhs, Criterion rhs);
}
