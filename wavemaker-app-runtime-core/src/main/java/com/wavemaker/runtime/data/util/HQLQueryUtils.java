package com.wavemaker.runtime.data.util;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.apache.commons.lang3.StringUtils;
import org.hibernate.HibernateException;
import org.hibernate.Query;
import org.hibernate.Session;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.orm.hibernate4.HibernateCallback;
import org.springframework.orm.hibernate4.HibernateTemplate;

import com.wavemaker.runtime.data.dao.util.QueryHelper;
import com.wavemaker.runtime.data.expression.Type;
import com.wavemaker.runtime.data.spring.WMPageImpl;

public class HQLQueryUtils {

    private static final byte FIELD_NAME = 1;
    private static final byte EXPRESSION = 2;
    private static final byte VALUE = 3;
    private static final String FROM = " from ";
    private static final String WHERE = " where ";
    private static final String WILDCARD_ENTRY = "%";
    private static final String QUERY_EXPRESSION = "([\\w]+)[\\s]+(startsWith|endsWith|containing)[\\s]+[\"'](([^(\\\\)[\"']])*)[\"']";
    private static Pattern pattern = Pattern.compile(QUERY_EXPRESSION);

    public static String buildHQL(String entityClass, String query) {
        String queryFilter = StringUtils.EMPTY;
        if(StringUtils.isNotBlank(query)) {
            queryFilter = WHERE + replaceExpressionWithHQL(query);
        }
        return FROM + entityClass + queryFilter;
    }

    public static String replaceExpressionWithHQL(String query) {
        Matcher matcher = pattern.matcher(query);
        StringBuffer hqlQuery = new StringBuffer();
        while(matcher.find()) {
            String value = "";
            switch(Type.valueFor(matcher.group(EXPRESSION))) {
                case STARTING_WITH:
                    value = matcher.group(VALUE) + WILDCARD_ENTRY;
                    break;
                case ENDING_WITH:
                    value = WILDCARD_ENTRY + matcher.group(VALUE);
                    break;
                case CONTAINING:
                    value = WILDCARD_ENTRY + matcher.group(VALUE) + WILDCARD_ENTRY;
                    break;
            }
            matcher.appendReplacement(hqlQuery, matcher.group(FIELD_NAME) + " like " + "'" + value + "'");
        }
        matcher.appendTail(hqlQuery);
        return hqlQuery.toString();
    }

    public static Query createHQLQuery(String entityClass, String query, Pageable pageable, Session session) {
        Query hqlQuery = session.createQuery(buildHQL(entityClass, query));
        if(pageable != null) {
            hqlQuery.setFirstResult(pageable.getOffset());
            hqlQuery.setMaxResults(pageable.getPageSize());
        }
        return hqlQuery;
    }

    public static Page executeHQLQuery(final Query hqlQuery, final Map<String, Object> params, final Pageable pageable, final HibernateTemplate template) {

        return template.execute(new HibernateCallback<Page<Object>>() {
            public Page<Object> doInHibernate(Session session) throws HibernateException {
                QueryHelper.setResultTransformer(hqlQuery);
                QueryHelper.configureParameters(hqlQuery, params);
                if (pageable != null) {
                    Long count = QueryHelper.getQueryResultCount(hqlQuery.getQueryString(), params, false, template);
                    return new WMPageImpl(hqlQuery.list(), pageable, count);
                }
                return new WMPageImpl(hqlQuery.list());
            }
        });
    }

}
