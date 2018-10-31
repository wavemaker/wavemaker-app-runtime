package com.wavemaker.runtime.data.filter;

import com.wavemaker.runtime.data.filter.parser.HqlFilterPropertyResolver;
import com.wavemaker.runtime.data.filter.parser.HqlFilterPropertyResolverImpl;
import com.wavemaker.runtime.data.filter.parser.HqlParser;

/**
 * @author Sujith Simon
 * Created on : 30/10/18
 */
public class WMQueryGrammarInterceptor implements QueryInterceptor {

    @Override
    public void intercept(WMQueryInfo queryInfo, Class<?> entity) {

        HqlFilterPropertyResolver resolver = new HqlFilterPropertyResolverImpl(entity);
        WMQueryInfo parsedQuery = HqlParser.getInstance().parse(queryInfo.getQuery(), resolver);

        queryInfo.setQuery(parsedQuery.getQuery());
        queryInfo.getParameters().putAll(parsedQuery.getParameters());
    }
}
