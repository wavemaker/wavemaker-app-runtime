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

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.wavemaker.runtime.data.export.ExportType;
import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.data.model.AggregationInfo;
import com.wavemaker.runtime.file.model.Downloadable;

public interface WMGenericDao<Entity, Identifier> {

    Entity create(Entity entity);

    void update(Entity entity);

    void delete(Entity entity);

    Entity findById(Identifier entityId);

    Entity findByUniqueKey(final Map<String, Object> fieldValueMap);

    Page<Entity> list(Pageable pageable);

    @Deprecated
    Page getAssociatedObjects(Object value, String entityName, String key, Pageable pageable);

    Page<Entity> search(QueryFilter queryFilters[], Pageable pageable);

    Page<Entity> searchByQuery(String query, Pageable pageable);

    long count();

    long count(String query);

    Page<Map<String, Object>> getAggregatedValues(final AggregationInfo aggregationInfo, Pageable pageable);

    Downloadable export(ExportType exportType, String query, Pageable pageable);
}
