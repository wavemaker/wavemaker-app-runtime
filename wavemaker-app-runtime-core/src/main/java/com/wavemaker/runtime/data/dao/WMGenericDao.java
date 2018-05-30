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
package com.wavemaker.runtime.data.dao;

import java.io.OutputStream;
import java.util.List;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate5.HibernateCallback;

import com.wavemaker.runtime.data.export.ExportOptions;
import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.data.model.AggregationInfo;
import com.wavemaker.runtime.file.model.Downloadable;

public interface WMGenericDao<E, I> {

    E create(E entity);

    void update(E entity);

    void delete(E entity);

    E findById(I entityId);

    default List<E> findByMultipleIds(List<I> ids) {
        return findByMultipleIds(ids, true);
    }

    List<E> findByMultipleIds(List<I> ids, boolean orderedReturn);

    E findByUniqueKey(final Map<String, Object> fieldValueMap);

    Page<E> list(Pageable pageable);

    @Deprecated
    Page getAssociatedObjects(Object value, String entityName, String key, Pageable pageable);

    Page<E> search(QueryFilter[] queryFilters, Pageable pageable);

    Page<E> searchByQuery(String query, Pageable pageable);

    long count();

    long count(String query);

    Page<Map<String, Object>> getAggregatedValues(final AggregationInfo aggregationInfo, Pageable pageable);

    Downloadable export(ExportType exportType, String query, Pageable pageable);

    void export(ExportOptions options, Pageable pageable, OutputStream outputStream);

    E refresh(E entity);

    void evict(E entity);

    <T> T execute(HibernateCallback<T> callback);
}
