package com.wavemaker.runtime.data.filter.parser;


import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.testng.Assert;
import org.testng.annotations.Test;

import com.wavemaker.runtime.data.filter.WMQueryInfo;


/**
 * @author Sujith Simon
 * Created on : 26/10/18
 */
public class HqlParserTest extends HqlParserDataprovider {

    private Logger logger = LoggerFactory.getLogger(HqlParserTest.class);

    @Test(dataProvider = "dataTypeQueriesProvider")
    public void dataTypeConversion(Class dateType, List<String> queries) {
        HqlFilterPropertyResolver propertyResolver = new HqlFilterPropertyResolverImpl(Model.Level1.class);

        assert queries != null;

        for (String query : queries) {
            WMQueryInfo wmQueryInfo = HqlParser.getInstance().parse(query, propertyResolver);
            Assert.assertNotEquals(wmQueryInfo.getParameters().size(), 0, "Could not convert find values in the query " + query);
            for (Object object : wmQueryInfo.getParameters().values()) {
                Assert.assertTrue(dateType.isInstance(object),
                        "'" + object + "' in '" + query + "' could not be converted to " + dateType);
            }
        }

    }


}
