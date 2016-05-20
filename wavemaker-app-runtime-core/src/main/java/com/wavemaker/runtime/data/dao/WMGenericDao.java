/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
 * <p/>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p/>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p/>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.data.dao;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.wavemaker.runtime.data.expression.QueryFilter;
import com.wavemaker.runtime.export.ExportType;
import com.wavemaker.runtime.file.model.Downloadable;

public interface WMGenericDao<Entity, Identifier> {

    Entity create(Entity entity);

    void update(Entity entity);

    void delete(Entity entity);

    Entity findById(Identifier entityId);

    Page<Entity> list(Pageable pageable);

    Page getAssociatedObjects(Object value, String entityName, String key, Pageable pageable);

    Page<Entity> search(QueryFilter queryFilters[], Pageable pageable);

    Page<Entity> searchByQuery(String query, Pageable pageable);

    long count();

    Downloadable export(ExportType exportType, String query, Pageable pageable);
}
