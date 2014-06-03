package com.wavemaker.runtime.data.jpa.repository;

import com.wavemaker.runtime.data.jpa.exception.QueryParameterMismatchException;
import com.wavemaker.runtime.data.jpa.util.QueryHelper;
import org.apache.commons.lang.reflect.ConstructorUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import javax.persistence.EntityManager;
import javax.persistence.Parameter;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import java.math.BigInteger;
import java.util.List;
import java.util.Map;

//@Repository
public class WMQueryExecutorRepositoryImpl implements WMQueryExecutorRepository {

	//@PersistenceContext
	private EntityManager entityManager;

	@Override
	public Page<Object> executeNativeQuery(String queryStr,
			Map<String, String> params, Pageable pageable)
			throws QueryParameterMismatchException {

		Query query = getNativeQuery(queryStr, params);
		Long count = getNativeQueryCount(queryStr, params);

		return getPageableQueryResult(pageable, query, count);
	}

	private Long getNativeQueryCount(String queryStr, Map<String, String> params)
			throws QueryParameterMismatchException {
		String strQuery = QueryHelper.getCountNativeQuery(queryStr, params);
		Query query = entityManager.createNativeQuery(strQuery);
		Long count = ((BigInteger) query.getSingleResult()).longValue();
		return count;
	}

	@SuppressWarnings("unchecked")
	private Page<Object> getPageableQueryResult(Pageable pageable, Query query,
			Long count) {
		query.setFirstResult(pageable.getOffset());
		query.setMaxResults(pageable.getPageSize());
		List<Object> resultList = query.getResultList();
		return new PageImpl<Object>(resultList, pageable, count);
	}

	@Override
	public Page<Object> executeJPQLQuery(String queryStr,
			Map<String, String> params, Pageable pageable)
			throws QueryParameterMismatchException {
		Query query = getJPQLQuery(queryStr, params);

		return getPageableQueryResult(pageable, query, 100L);// This is
																// temporary, It
																// needed to be
																// changed.

	}

	private Query getJPQLQuery(String queryStr, Map<String, String> params)
			throws QueryParameterMismatchException {
		Query query = entityManager.createQuery(queryStr);
		if (!params.isEmpty()) {
			setJPQLQueryParams(query, params);
		}
		return query;
	}

	private Query getNativeQuery(String queryStr, Map<String, String> params) {
		Query query = entityManager.createNativeQuery(queryStr);
		if (!params.isEmpty()) {
			setQueryParams(query, params);
		}
		return query;
	}

	private void setQueryParams(Query query, Map<String, String> params) {
		if (!params.isEmpty()) {
			for (Object key : params.keySet()) {
				String queryParamName = key.toString();
				Object queryParamValue = params.get(key);
				query.setParameter(queryParamName, queryParamValue);
			}
		}

	}

	private void setJPQLQueryParams(Query query, Map<String, String> params)
			throws QueryParameterMismatchException {
		if (!params.isEmpty()) {
			for (Object key : params.keySet()) {
				Object object = null;
				String queryParamName = key.toString();
				Object queryParamValue = params.get(key);
				Parameter<?> parameter = query.getParameter(queryParamName);
				if (parameter == null)
					throw new QueryParameterMismatchException("Parameter "
							+ queryParamName
							+ " does not exist in named query.");
				Class<?> parameterType = parameter.getParameterType();
				try {
					object = ConstructorUtils.invokeExactConstructor(
							parameterType, queryParamValue);
				} catch (Exception exception) {
					throw new QueryParameterMismatchException(
							"Parameter "
									+ queryParamName
									+ " could not be converted to object of expected query type "
									+ parameterType, exception);

				}
				query.setParameter(queryParamName, object);
			}
		}

	}
}
