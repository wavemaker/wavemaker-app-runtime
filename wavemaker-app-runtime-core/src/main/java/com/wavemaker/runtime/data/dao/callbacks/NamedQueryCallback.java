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
package com.wavemaker.runtime.data.dao.callbacks;

import java.util.Map;

import org.hibernate.Query;
import org.hibernate.Session;

import com.wavemaker.runtime.data.model.QueryInfo;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class NamedQueryCallback<T> extends AbstractQueryCallback<T> {

    private final QueryInfo<T> queryInfo;

    public NamedQueryCallback(final QueryInfo<T> queryInfo) {
        this.queryInfo = queryInfo;
    }

    @Override
    protected Query getQuery(final Session session) {
        return session.getNamedQuery(queryInfo.getQueryName());
    }

    @Override
    protected Map<String, Object> getParameters() {
        return queryInfo.getParams();
    }

    @Override
    protected Class<T> getReturnType() {
        return queryInfo.getReturnClass();
    }

}
