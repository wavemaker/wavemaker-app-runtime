package com.wavemaker.runtime.data.dao.query;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.Map;

public interface WMQueryExecutor {

	public Page<Object> executeNamedQuery(String queryName, Map<String, Object> params, Pageable pageable);
	
	public Page<Object> executeNativeQuery(String queryString, Map<String, Object> params, Pageable pageable);
	
	public Page<Object> executeHQLQuery(String queryString, Map<String, Object> params, Pageable pageable);
	
}
