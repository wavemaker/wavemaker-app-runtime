package com.wavemaker.runtime.data.jpa.repository;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.NoRepositoryBean;

import com.wavemaker.runtime.data.jpa.exception.QueryParameterMismatchException;

@NoRepositoryBean
public interface WMQueryExecutorRepository {

	Page<Object> executeNativeQuery(String queryStr,
			Map<String, String> params, Pageable pageable) throws QueryParameterMismatchException;

	Page<Object> executeJPQLQuery(String queryStr, Map<String, String> params,
			Pageable pageable) throws QueryParameterMismatchException;

}
