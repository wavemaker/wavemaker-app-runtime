package com.wavemaker.runtime.data.dao.query;

import com.wavemaker.common.MessageResource;
import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.util.TypeConversionUtils;
import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.model.CustomQuery;
import com.wavemaker.runtime.data.model.CustomQueryParam;
import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate4.HibernateTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class WMQueryExecutorImpl implements WMQueryExecutor {

    private static final Logger LOGGER = LoggerFactory.getLogger(WMQueryExecutorImpl.class);
    private static final long UNKNOWN_COUNT=-1L;

	private HibernateTemplate template;

    public HibernateTemplate getTemplate() {
        return template;
    }

    public void setTemplate(HibernateTemplate template) {
        this.template = template;
    }

	public Page<Object> executeNamedQuery(String queryName, Map<String, Object> params, Pageable pageable) {
		Session currentSession = template.getSessionFactory().getCurrentSession();
		
		Query namedQuery = currentSession.getNamedQuery(queryName);
        QueryHelper.setResultTransformer(namedQuery);
		QueryHelper.configureParameters(namedQuery, params);
        if(pageable!=null)
        {
            namedQuery.setFirstResult(pageable.getOffset());
            namedQuery.setMaxResults(pageable.getPageSize());
            return new PageImpl(namedQuery.list(), pageable, UNKNOWN_COUNT);
        }
        else
            return new PageImpl(namedQuery.list());
	}

    @Override
    public Page<Object> executeCustomQuery(CustomQuery customQuery, Pageable pageable) {
        Map<String, Object> params = new HashMap<String, Object>();

        List<CustomQueryParam> customQueryParams = customQuery.getQueryParams();
        if(customQueryParams != null && !customQueryParams.isEmpty()){
            for (CustomQueryParam customQueryParam: customQueryParams) {
                Object paramValue = customQueryParam.getParamValue();
                try{
                Class loader = Class.forName(customQueryParam.getParamType());
                paramValue=   TypeConversionUtils.fromString(loader, customQueryParam.getParamValue().toString(), false);
                }
                catch (IllegalArgumentException ex){
                    LOGGER.error("Failed to Convert param value for query", ex);
                    throw new WMRuntimeException(MessageResource.QUERY_CONV_FAILURE, ex);
                }
                catch (ClassNotFoundException ex){
                    throw new WMRuntimeException(MessageResource.CLASS_NOT_FOUND, ex, customQueryParam.getParamType());
                }
                params.put(customQueryParam.getParamName(), paramValue);
            }
        }

        if(customQuery.isNativeSql()) {
            return executeNativeQuery(customQuery.getQueryStr(), params, pageable);
        } else {
            return executeHQLQuery(customQuery.getQueryStr(), params, pageable);
        }
    }

    @Override
    public int executeNamedQueryForUpdate(String queryName, Map<String, Object> params) {
        Session currentSession = template.getSessionFactory().getCurrentSession();

        Query namedQuery = currentSession.getNamedQuery(queryName);
        QueryHelper.setResultTransformer(namedQuery);
        QueryHelper.configureParameters(namedQuery, params);
        return namedQuery.executeUpdate();
    }

    @Override
    public int executeCustomQueryForUpdate(CustomQuery customQuery) {
        Map<String, Object> params = new HashMap<String, Object>();

        List<CustomQueryParam> customQueryParams = customQuery.getQueryParams();
        if(customQueryParams != null && !customQueryParams.isEmpty())
            for (CustomQueryParam customQueryParam : customQueryParams) {
                Object paramValue = customQueryParam.getParamValue();
                try{
                    Class loader = Class.forName(customQueryParam.getParamType());
                    paramValue=   TypeConversionUtils.fromString(loader, customQueryParam.getParamValue().toString(), false);
                }
                catch (IllegalArgumentException ex){
                    LOGGER.error("Failed to Convert param value for query", ex);
                    throw new WMRuntimeException(MessageResource.QUERY_CONV_FAILURE, ex);
                }
                catch (ClassNotFoundException ex){
                    throw new WMRuntimeException(MessageResource.CLASS_NOT_FOUND, ex, customQueryParam.getParamType());
                }
                params.put(customQueryParam.getParamName(), paramValue);
            }

        Query query = null;
        if(customQuery.isNativeSql()) {
            query = createNativeQuery(customQuery.getQueryStr(), params);
        } else {
            query = createHQLQuery(customQuery.getQueryStr(), params);
        }
        return query.executeUpdate();
    }

    protected Page<Object> executeNativeQuery(String queryString, Map<String, Object> params, Pageable pageable) {
        SQLQuery sqlQuery = createNativeQuery(queryString, params);

        if(pageable!=null)
        {
            Long count = QueryHelper.getQueryResultCount(queryString, params, true, template);
            sqlQuery.setFirstResult(pageable.getOffset());
            sqlQuery.setMaxResults(pageable.getPageSize());
            return new PageImpl(sqlQuery.list(), pageable, count);
        }
        else
            return new PageImpl(sqlQuery.list());
	}

    private SQLQuery createNativeQuery(String queryString, Map<String, Object> params) {
        Session currentSession = template.getSessionFactory().getCurrentSession();

        SQLQuery sqlQuery = currentSession.createSQLQuery(queryString);
        QueryHelper.setResultTransformer(sqlQuery);
        QueryHelper.configureParameters(sqlQuery, params);
        return sqlQuery;
    }

    protected Page<Object> executeHQLQuery(String queryString, Map<String, Object> params, Pageable pageable) {
        Query hqlQuery = createHQLQuery(queryString, params);

        if(pageable!=null)
        {
            Long count = QueryHelper.getQueryResultCount(queryString, params, false, template);
            hqlQuery.setFirstResult(pageable.getOffset());
            hqlQuery.setMaxResults(pageable.getPageSize());
            return new PageImpl(hqlQuery.list(), pageable, count);
        }
        else
            return new PageImpl(hqlQuery.list());
	}

    private Query createHQLQuery(String queryString, Map<String, Object> params) {
        Session currentSession = template.getSessionFactory().getCurrentSession();

        Query hqlQuery = currentSession.createQuery(queryString);
        QueryHelper.setResultTransformer(hqlQuery);
        QueryHelper.configureParameters(hqlQuery, params);
        return hqlQuery;
    }
}