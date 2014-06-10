package com.wavemaker.runtime.data.dao.query;

import org.hibernate.Query;
import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.hibernate.transform.Transformers;
import org.hibernate.type.Type;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate4.HibernateTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Map;

public class WMQueryExecutorImpl implements WMQueryExecutor {

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
		
		Type[] returnTypes = namedQuery.getReturnTypes();
		if(returnTypes != null) {
			System.out.println("return types : " + Arrays.asList(returnTypes));
		} else {
			System.out.println("return types is null");
		}
		
		String[] returnAliases = namedQuery.getReturnAliases();
		if(returnAliases != null) {
			System.out.println("return aliases : " + Arrays.asList(returnAliases));
		} else {
			System.out.println("return aliases is null" );
		}
		
		if(returnAliases != null)
			namedQuery.setResultTransformer(Transformers.ALIAS_TO_ENTITY_MAP);
		
		configureParameters(namedQuery, params);
		
		return new PageImpl<Object>(namedQuery.list());
	}

	@Transactional(readOnly=true)
	public Page<Object> executeNativeQuery(String queryString, Map<String, Object> params, Pageable pageable) {
		Session currentSession = template.getSessionFactory().getCurrentSession();

		SQLQuery sqlQuery = currentSession.createSQLQuery(queryString);
		sqlQuery.setResultTransformer(Transformers.ALIAS_TO_ENTITY_MAP);
		configureParameters(sqlQuery, params);
		
		return new PageImpl<Object>(sqlQuery.list());
	}

	public Page<Object> executeHQLQuery(String queryString, Map<String, Object> params, Pageable pageable) {
		Session currentSession = template.getSessionFactory().getCurrentSession();

		Query hqlQuery = currentSession.createQuery(queryString);
		hqlQuery.setResultTransformer(Transformers.ALIAS_TO_ENTITY_MAP);
		configureParameters(hqlQuery, params);
		
		return new PageImpl<Object>(hqlQuery.list());
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

}
