package com.wavemaker.runtime.data.jpa.repository;

import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.NoRepositoryBean;

import com.wavemaker.runtime.data.jpa.exception.QueryParameterMismatchException;
import com.wavemaker.runtime.data.model.CustomQuery;

//@NoRepositoryBean
public interface WMQueryExecutorRepository {

	public Page<Object> executeNativeQuery(String queryStr,
			Map<String, Object> params, Pageable pageable)
            throws QueryParameterMismatchException;

    public Page<Object> executeJPQLQuery(String queryStr,
        			Map<String, Object> params, Pageable pageable)
                    throws QueryParameterMismatchException ;

	Page<Object> executeCustomNativeQuery(CustomQuery query, Pageable pageable) 
			throws QueryParameterMismatchException;

	Page<Object> executeCustomJPQLQuery(CustomQuery query, Pageable pageable)
			throws QueryParameterMismatchException;

}
