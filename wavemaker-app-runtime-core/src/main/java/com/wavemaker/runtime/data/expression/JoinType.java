/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
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
