package com.wavemaker.runtime.data.dao.query;

import com.wavemaker.runtime.data.model.CustomQuery;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface WMQueryExecutor {

	public Page<Object> executeNamedQuery(String queryName, Map<String, Object> params, Pageable pageable);
	
	public Page<Object> executeCustomQuery(CustomQuery customQuery, Pageable pageable);

}
