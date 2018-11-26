package com.wavemaker.runtime.data.filter.parser;


import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testng.Assert;
import org.testng.annotations.Test;

import com.wavemaker.runtime.data.exception.HqlGrammarException;
import com.wavemaker.runtime.data.filter.WMQueryInfo;
import com.wavemaker.runtime.data.filter.WMQueryParamInfo;
import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.HqlParserDataProvider;
import com.wavemaker.runtime.data.filter.parser.utils.models.Model;


/**
 * @author Sujith Simon
 * Created on : 26/10/18
 */
public class HqlParserTest extends HqlParserDataProvider {

    private Logger logger = LoggerFactory.getLogger(HqlParserTest.class);


    @Test(dataProvider = "dataTypeQueriesProvider")
    public void comparisionAndDataTypeCheck(Class dateType, List<String> queries) throws ClassNotFoundException {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        assert queries != null;

        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            for (WMQueryParamInfo wmQueryParamInfo : wmQueryInfo.getParameters().values()) {
                Assert.assertSame(dateType, Class.forName(wmQueryParamInfo.getJavaType().getClassName()),
                        "'" + wmQueryParamInfo + "' in '" + query + "' could not be converted to " + dateType);
            }
        }
    }

    @Test(dataProvider = "nullValuesQueriesProvider")
    public void nullValues(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        assert queries != null;

        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertEquals(wmQueryInfo.getParameters().size(), 0);
        }
    }

    @Test(dataProvider = "syntaxErrorQueriesProvider",
            expectedExceptions = HqlGrammarException.class,
            expectedExceptionsMessageRegExp = ".*Failed to parse.*")
    public void syntaxErrors(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        assert queries != null;

        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNull(wmQueryInfo);
        }
    }

    @Test(dataProvider = "sqlInjectionQueriesProvider",
            expectedExceptions = HqlGrammarException.class,
            expectedExceptionsMessageRegExp = ".*Failed to parse.*")
    public void sqlInjections(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        assert queries != null;

        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNull(wmQueryInfo);
        }
    }


    @Test(dataProvider = "betweenPositiveQueriesProvider")
    public void betweenPositive(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotNull(wmQueryInfo);
        }
    }

    @Test(dataProvider = "betweenNegativeQueriesProvider",
            expectedExceptions = HqlGrammarException.class,
            expectedExceptionsMessageRegExp = ".*Failed to parse.*")
    public void betweenNegative(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotNull(wmQueryInfo);
        }
    }

    @Test(dataProvider = "inPositiveQueriesProvider")
    public void inPositive(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotNull(wmQueryInfo);
        }
    }

    @Test(dataProvider = "inNegativeQueriesProvider",
            expectedExceptions = HqlGrammarException.class,
            expectedExceptionsMessageRegExp = ".*Failed to parse.*")
    public void inNegative(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotNull(wmQueryInfo);
        }
    }

    @Test(dataProvider = "likePositiveQueriesProvider")
    public void likePositive(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotNull(wmQueryInfo);
        }
    }

    @Test(dataProvider = "likeNegativeQueriesProvider",
            expectedExceptions = HqlGrammarException.class,
            expectedExceptionsMessageRegExp = ".*Failed to parse.*")
    public void likeNegative(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotNull(wmQueryInfo);
        }
    }


    @Test(dataProvider = "nestedBracesPositiveQueriesProvider")
    public void nestedBracesPositive(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotNull(wmQueryInfo);
        }
    }

    @Test(dataProvider = "nestedBracesNegativeQueriesProvider",
            expectedExceptions = HqlGrammarException.class,
            expectedExceptionsMessageRegExp = ".*Failed to parse.*")
    public void nestedBracesNegative(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotNull(wmQueryInfo);
        }
    }


    @Test(dataProvider = "propertyPositiveQueriesProvider")
    public void propertyPositive(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotNull(wmQueryInfo);
        }
    }

    @Test(dataProvider = "propertyNegativeQueriesProvider",
            expectedExceptions = HqlGrammarException.class,
            expectedExceptionsMessageRegExp = ".*is not a comparable.*")
    public void propertyNegative(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotNull(wmQueryInfo);
        }
    }

    @Test(dataProvider = "InvalidPropertyQueriesProvider",
            expectedExceptions = HqlGrammarException.class,
            expectedExceptionsMessageRegExp = ".*Property.*is not valid.*")
    public void invalidProperties(Class dateType, List<String> queries) {
        logger.debug("Testing for the Data type {}.", dateType);
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.class);
        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotNull(wmQueryInfo);
        }
    }


}
