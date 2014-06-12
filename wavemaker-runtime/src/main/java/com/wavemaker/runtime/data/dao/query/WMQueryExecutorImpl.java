package com.wavemaker.runtime.data.dao.query;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.model.CustomQuery;
import com.wavemaker.runtime.data.model.CustomQueryParam;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.hibernate.transform.Transformers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate4.HibernateTemplate;

public class WMQueryExecutorImpl implements WMQueryExecutor {

    private static final Logger LOGGER = LoggerFactory
            .getLogger(WMQueryExecutorImpl.class);
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
                params.put(customQueryParam.getParamName(), customQueryParam.getParamValue());
            }
        }

        if(customQuery.isNativeSql()) {
            return executeNativeQuery(customQuery.getQueryStr(), params, pageable);
        } else {
            return executeHQLQuery(customQuery.getQueryStr(), params, pageable);
        }
    }

	protected Page<Object> executeNativeQuery(String queryString, Map<String, Object> params, Pageable pageable) {
		Session currentSession = template.getSessionFactory().getCurrentSession();

		SQLQuery sqlQuery = currentSession.createSQLQuery(queryString);
        QueryHelper.setResultTransformer(sqlQuery);
		QueryHelper.configureParameters(sqlQuery, params);

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

	protected Page<Object> executeHQLQuery(String queryString, Map<String, Object> params, Pageable pageable) {
		Session currentSession = template.getSessionFactory().getCurrentSession();

		Query hqlQuery = currentSession.createQuery(queryString);
        QueryHelper.setResultTransformer(hqlQuery);
		QueryHelper.configureParameters(hqlQuery, params);

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
}