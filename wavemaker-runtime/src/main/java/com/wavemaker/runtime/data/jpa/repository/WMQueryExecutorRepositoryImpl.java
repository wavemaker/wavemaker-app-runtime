package com.wavemaker.runtime.data.jpa.repository;

import com.wavemaker.runtime.data.jpa.exception.QueryParameterMismatchException;
import com.wavemaker.runtime.data.jpa.util.QueryHelper;
import com.wavemaker.runtime.data.model.CustomQuery;
import com.wavemaker.runtime.data.model.CustomQueryParam;

import java.util.List;
import java.util.Map;

import javax.persistence.EntityManager;
import javax.persistence.Parameter;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;

import org.apache.commons.lang.reflect.ConstructorUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.repository.NoRepositoryBean;

@NoRepositoryBean
public class WMQueryExecutorRepositoryImpl implements WMQueryExecutorRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public Page<Object> executeNativeQuery(String queryStr,
			Map<String, Object> params, Pageable pageable)
            throws QueryParameterMismatchException {
        
    	Query query = getNativeQuery(queryStr, params);
        Long count = getCount(queryStr, params, true);

        return getPageableQueryResult(pageable, query, count);
    }

    private Long getCount(String queryStr, Map<String, Object> params, boolean isNative)
            throws QueryParameterMismatchException {
        String strQuery = QueryHelper.getCountQuery(queryStr, params);
        Query query=null;
        if(isNative)
            query = entityManager.createNativeQuery(strQuery);
        else
            query=entityManager.createQuery(strQuery);

        Long count = ((Number) query.getSingleResult()).longValue();
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
			Map<String, Object> params, Pageable pageable)
            throws QueryParameterMismatchException {
    	
        Query query = getJPQLQuery(queryStr, params);

        Long count = getCount(queryStr, params, false);

        return getPageableQueryResult(pageable, query, count);
    }
    
    private Query getJPQLQuery(String queryStr, Map<String, Object> params)
            throws QueryParameterMismatchException {
        Query query = entityManager.createQuery(queryStr);
        if (!params.isEmpty()) {
            setJPQLQueryParams(query, params);
        }
        return query;
    }

    private Query getNativeQuery(String queryStr, Map<String, Object> params) {
        Query query = entityManager.createNativeQuery(queryStr);
        if (!params.isEmpty()) {
            setQueryParams(query, params);
        }
        return query;
    }

    private void setQueryParams(Query query, Map<String, Object> params) {
        if (!params.isEmpty()) {
            for (Object key : params.keySet()) {
                String queryParamName = key.toString();
                Object queryParamValue = params.get(key);
                query.setParameter(queryParamName, queryParamValue);
            }
        }

    }

    private void setJPQLQueryParams(Query query, Map<String, Object> params)
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
    
    @Override
	public Page<Object> executeCustomNativeQuery(CustomQuery customQuery,
			Pageable pageable) throws QueryParameterMismatchException {
		Query query = getCustomNativeQuery(customQuery);
		Long count = getCustomCount(customQuery,true);

		return getPageableQueryResult(pageable, query, count);
	}

	private Long getCustomCount(CustomQuery customQuery, boolean isNative) {
		String strQuery = QueryHelper.getCountCustomQuery(customQuery.getQueryStr(), customQuery.getQueryParams());
        Query query=null;
        if(isNative)
            query = entityManager.createNativeQuery(strQuery);
        else
            query=entityManager.createQuery(strQuery);

        Long count = ((Number) query.getSingleResult()).longValue();
        return count;
	}

	private Query getCustomNativeQuery(CustomQuery customQuery) {
		Query query = entityManager.createNativeQuery(customQuery.getQueryStr());
        if (!customQuery.getQueryParams().isEmpty()) {
            setCustomQueryParams(query, customQuery.getQueryParams());
        }
        return query;
	}
	
	private void setCustomQueryParams(Query query, List<CustomQueryParam> list) {
        if (!list.isEmpty()) {
            for (CustomQueryParam param : list) {
                String queryParamName = param.getParamName();
                Object queryParamValue = param.getParamValue();
                query.setParameter(queryParamName, queryParamValue);
            }
        }

    }

	@Override
	public Page<Object> executeCustomJPQLQuery(CustomQuery customQuery,
			Pageable pageable) throws QueryParameterMismatchException {
		Query query = getJPQLCustomQuery(customQuery);

		return getPageableQueryResult(pageable, query, 100L);
	}

	private Query getJPQLCustomQuery(CustomQuery customQuery) {
		Query query = entityManager.createQuery(customQuery.getQueryStr());
        if (!customQuery.getQueryParams().isEmpty()) {
        	setJPQLCustomQueryParams(query, customQuery.getQueryParams());
        }
        return query;
	}
	
	 private void setJPQLCustomQueryParams(Query query, List<CustomQueryParam> list)
	            throws QueryParameterMismatchException {
	        if (!list.isEmpty()) {
	        	for (CustomQueryParam param : list) {
	                Object object = null;
	                String queryParamName = param.getParamName();
	                Object queryParamValue = param.getParamValue();
	                Parameter<?> parameter = query.getParameter(queryParamName);
	                if (parameter == null)
	                    throw new QueryParameterMismatchException("Parameter "
	                            + queryParamName
	                            + " does not exist in named query.");
	                Class<?> parameterType = null;
					try {
						parameterType = Class.forName(param.getParamType());
					} catch (ClassNotFoundException e) {
						// TODO Auto-generated catch block
						e.printStackTrace();
					}
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
