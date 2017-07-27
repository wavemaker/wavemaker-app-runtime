/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.model;

import java.util.Map;

import org.springframework.data.domain.Pageable;

import com.wavemaker.runtime.data.dao.query.types.ParameterTypeResolver;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 15/11/16
 */
public class PageableQueryInfo<T> extends QueryInfo<T> {

    private final Pageable pageable;

    public PageableQueryInfo(
            final String queryName, final Map<String, Object> params, final ParameterTypeResolver resolver,
            final Class<T> returnClass, final Pageable pageable) {
        super(queryName, params, resolver, returnClass);
        this.pageable = pageable;
    }

    public Pageable getPageable() {
        return pageable;
    }
}
