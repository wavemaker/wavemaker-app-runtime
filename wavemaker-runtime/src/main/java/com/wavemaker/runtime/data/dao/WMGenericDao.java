package com.wavemaker.runtime.data.dao;

import com.wavemaker.runtime.data.jpa.expression.QueryFilter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface WMGenericDao<Entity, Identifier> {

    Entity create(Entity entity);
	
	void update(Entity entity);
	
	void delete(Entity entity);
	
	Entity findById(Identifier entityId);
	
	Page<Entity> list(Pageable pageable);

	public Page<Entity> search(QueryFilter queryFilters[], Pageable pageable);

    public long count();
}
