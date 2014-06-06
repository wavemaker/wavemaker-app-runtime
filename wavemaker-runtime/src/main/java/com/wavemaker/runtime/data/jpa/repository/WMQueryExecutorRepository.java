package com.wavemaker.runtime.data.jpa.repository;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.NoRepositoryBean;

import com.wavemaker.runtime.data.jpa.exception.QueryParameterMismatchException;
import com.wavemaker.runtime.data.model.Query;

//@NoRepositoryBean
public interface WMQueryExecutorRepository {

	Page<Object> executeNativeQuery(Query query,
			Map<String, Object> params, Pageable pageable) throws QueryParameterMismatchException;

	Page<Object> executeJPQLQuery(Query query, Map<String, Object> params,
			Pageable pageable) throws QueryParameterMismatchException;

}
