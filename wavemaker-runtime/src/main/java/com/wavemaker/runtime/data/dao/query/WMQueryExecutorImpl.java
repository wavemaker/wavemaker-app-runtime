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
import org.springframework.transaction.annotation.Transactional;

public class WMQueryExecutorImpl implements WMQueryExecutor {

    private static final Logger LOGGER = LoggerFactory
            .getLogger(WMQueryExecutorImpl.class);

	private HibernateTemplate template;

    public HibernateTemplate getTemplate() {
        return template;
    }

    public void setTemplate(HibernateTemplate template) {
        this.template = template;
    }

    @Transactional(readOnly=true)
	public Page<Object> executeNamedQuery(String queryName, Map<String, Object> params, Pageable pageable) {
		Session currentSession = template.getSessionFactory().getCurrentSession();
		
		Query namedQuery = currentSession.getNamedQuery(queryName);

        setResultTransformer(namedQuery);
		
		configureParameters(namedQuery, params);
		
		return new PageImpl<Object>(namedQuery.list());
	}

    @Override
    @Transactional(readOnly = true)
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
        setResultTransformer(sqlQuery);
		configureParameters(sqlQuery, params);

        if(pageable!=null)
        {
            Long count = getCount(queryString, params, true);
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
        setResultTransformer(hqlQuery);
		configureParameters(hqlQuery, params);

        if(pageable!=null)
        {
            Long count = getCount(queryString, params, false);
            hqlQuery.setFirstResult(pageable.getOffset());
            hqlQuery.setMaxResults(pageable.getPageSize());
            return new PageImpl(hqlQuery.list(), pageable, count);
        }
        else
            return new PageImpl(hqlQuery.list());
	}

    protected void configureParameters(Query query, Map<String, Object> params) {
        String[] namedParameters = query.getNamedParameters();
        if(namedParameters != null && namedParameters.length > 0) {
            if(params == null || params.isEmpty())
                throw new RuntimeException("Require input parameters such as: " + Arrays.asList(namedParameters));

            for (String namedParameter : namedParameters) {
                Object val = params.get(namedParameter);
                if(val == null)
                    throw new RuntimeException("No value provided for parameter name: " + namedParameter);
                query.setParameter(namedParameter, val);
            }
        }
    }

    private Long getCount(String queryStr, Map<String, Object> params, boolean isNative)
    {
        String strQuery = QueryHelper.getCountQuery(queryStr, params);
        Query query=null;
        if(isNative)
            query = template.getSessionFactory().getCurrentSession().createSQLQuery(strQuery);
        else
            query=template.getSessionFactory().getCurrentSession().createQuery(strQuery);
        Long count = ((Number) query.uniqueResult()).longValue();
        return count;
    }

    private void setResultTransformer(Query namedQuery) {
        String[] returnAliases = namedQuery.getReturnAliases();
        if(returnAliases != null) {
            LOGGER.debug("return aliases : {}" , Arrays.asList(returnAliases));
        } else {
            LOGGER.debug("return aliases is null" );
        }

        if(returnAliases != null)
            namedQuery.setResultTransformer(Transformers.ALIAS_TO_ENTITY_MAP);
    }

}
