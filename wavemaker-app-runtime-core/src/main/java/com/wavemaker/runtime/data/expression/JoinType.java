package com.wavemaker.runtime.data.expression;

import java.util.HashMap;
import java.util.Map;

import org.hibernate.criterion.Criterion;
import org.hibernate.criterion.LogicalExpression;
import org.hibernate.criterion.Restrictions;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 19/5/16
 */
public enum JoinType {

    AND("and") {
        @Override
        public LogicalExpression criterion(Criterion lhs, Criterion rhs) {
            return Restrictions.and(lhs, rhs);
        }
    },
    OR("or") {
        @Override
        public LogicalExpression criterion(Criterion lhs, Criterion rhs) {
            return Restrictions.or(lhs, rhs);
        }
    };

    static Map<String, JoinType> nameVsJoinType = new HashMap<>();

    static {
        for (JoinType joinType : JoinType.values()) {
            nameVsJoinType.put(joinType.getName(),joinType);
        }
    }

    private String name;

    JoinType(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }

    public abstract LogicalExpression criterion(Criterion lhs, Criterion rhs);

    public static JoinType valueFor(String typeName) {
        return nameVsJoinType.get(typeName.toLowerCase());
    }


}
