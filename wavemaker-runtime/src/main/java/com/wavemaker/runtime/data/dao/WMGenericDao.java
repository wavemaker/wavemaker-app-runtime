package com.wavemaker.runtime.data.dao;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.wavemaker.runtime.data.expression.QueryFilter;

public interface WMGenericDao<Entity, Identifier> {

    Entity create(Entity entity);
	
	void update(Entity entity);
	
	void delete(Entity entity);
	
	Entity findById(Identifier entityId);
	
	Page<Entity> list(Pageable pageable);

    Page getAssociatedObjects(Object value, String entityName, String key, Pageable pageable);

	public Page<Entity> search(QueryFilter queryFilters[], Pageable pageable);

    public long count();
}
