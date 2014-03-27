/*
 * Copyright (C) 2012-2013 CloudJee, Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.wavemaker.studio.prefab.impl;

import java.util.Collection;
import java.util.Map;

import org.apache.commons.collections.CollectionUtils;
import org.apache.commons.collections.Predicate;
import org.apache.commons.lang.StringUtils;
import org.apache.commons.lang.Validate;
import org.springframework.stereotype.Service;

import com.wavemaker.studio.prefab.core.Prefab;
import com.wavemaker.studio.prefab.core.PrefabManager;
import com.wavemaker.studio.prefab.util.Utils;

/**
 * Default implementation for {@link PrefabManager}. A new version of {@link Prefab} is added by disabling the existing
 * version. References to {@link Class}es of disabled {@link Prefab}s should be destroyed for garbage collection.
 * 
 * @author Dilip Kumar
 */
@Service
public class PrefabManagerImpl implements PrefabManager {

	// map containing prefab name in lowercase as key and prefab as value
	private static final Map<String, Prefab> prefabs = Utils.newConcurrentMap();
	private static final Predicate ENABLED_PREDICATE = new Predicate() {

		@Override
		public boolean evaluate(final Object object) {
			return ((Prefab) object).isEnabled();
		}
	};

	@Override
	public synchronized void addPrefab(final Prefab prefab) {
		deletePrefab(prefab.getName());
		prefabs.put(prefab.getName().toLowerCase(), prefab);
	}

	@Override
	public synchronized void deletePrefab(final String prefabName) {
		if (StringUtils.isEmpty(prefabName)) {
			return;
		}

		Prefab existingPrefab = getPrefab(prefabName);

		if (existingPrefab != null) {
			existingPrefab.disable();
			prefabs.remove(existingPrefab.getName().toLowerCase());
		}
	}

    @Override
    public synchronized void deleteAllPrefabs() {
        prefabs.clear();
    }

	@Override
	public Collection<Prefab> getEnabledPrefabs() {
		return CollectionUtils.select(prefabs.values(), ENABLED_PREDICATE);
	}

	@Override
	public Prefab getPrefab(final String prefabName) {
		Validate.notNull(prefabName, "PrefabManagerImpl: Prefab name should not be null");

		return prefabs.get(prefabName.toLowerCase());
	}
}
