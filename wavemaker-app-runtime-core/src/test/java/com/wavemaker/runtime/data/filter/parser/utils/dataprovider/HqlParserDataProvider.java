package com.wavemaker.runtime.data.filter.parser.utils.dataprovider;

import java.util.Collections;
import java.util.List;

import org.testng.annotations.DataProvider;

import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries.BetweenQueries;
import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries.DataTypeQueries;
import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries.InQueries;
import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries.InvalidPropertyQueries;
import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries.LikeQueries;
import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries.NestedBracesQueries;
import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries.NullCheckQueries;
import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries.PropertyQueries;
import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries.SqlInjectionQueries;
import com.wavemaker.runtime.data.filter.parser.utils.dataprovider.queries.SyntaxErrorQueries;

/**
 * @author Sujith Simon
 * Created on : 2/11/18
 */
public class HqlParserDataProvider {

    @DataProvider
    public static Object[][] dataTypeQueriesProvider() {
        return getParameters(DataTypeQueries::getQueries, FieldsMetadata.getFields());
    }


    @DataProvider
    public static Object[][] nullValuesQueriesProvider() {
        return getParameters(NullCheckQueries::getQueries, FieldsMetadata.getFields());
    }


    @DataProvider
    public static Object[][] syntaxErrorQueriesProvider() {
        return getParameters(SyntaxErrorQueries::getQueries, Collections.singletonList(String.class));
    }


    @DataProvider
    public static Object[][] sqlInjectionQueriesProvider() {
        return getParameters(SqlInjectionQueries::getQueries, Collections.singletonList(String.class));
    }


    @DataProvider
    public static Object[][] betweenPositiveQueriesProvider() {
        return getParameters(BetweenQueries::getPositiveQueries, FieldsMetadata.getFieldsExcluding(Boolean.class, String.class));
    }

    @DataProvider
    public static Object[][] betweenNegativeQueriesProvider() {
        return getParameters(BetweenQueries::getNegativeQueries, FieldsMetadata.getFieldsExcluding(Boolean.class, String.class));
    }

    @DataProvider
    public static Object[][] inPositiveQueriesProvider() {
        return getParameters(InQueries::getPositiveQueries, FieldsMetadata.getFieldsExcluding(Boolean.class, String.class));
    }

    @DataProvider
    public static Object[][] inNegativeQueriesProvider() {
        return getParameters(InQueries::getNegativeQueries, FieldsMetadata.getFieldsExcluding(Boolean.class, String.class));
    }

    @DataProvider
    public static Object[][] likePositiveQueriesProvider() {
        return getParameters(LikeQueries::getPositiveQueries, Collections.singletonList(String.class));
    }

    @DataProvider
    public static Object[][] likeNegativeQueriesProvider() {
        return getParameters(LikeQueries::getNegativeQueries, Collections.singletonList(String.class));
    }


    @DataProvider
    public static Object[][] nestedBracesPositiveQueriesProvider() {
        return getParameters(NestedBracesQueries::getPositiveQueries, FieldsMetadata.getFields());
    }

    @DataProvider
    public static Object[][] nestedBracesNegativeQueriesProvider() {
        return getParameters(NestedBracesQueries::getNegativeQueries, FieldsMetadata.getFields());
    }

    @DataProvider
    public static Object[][] propertyPositiveQueriesProvider() {
        return getParameters(PropertyQueries::getPositiveQueries, Collections.singletonList(String.class));
    }

    @DataProvider
    public static Object[][] propertyNegativeQueriesProvider() {
        return getParameters(PropertyQueries::getNegativeQueries, Collections.singletonList(String.class));
    }

    @DataProvider
    public static Object[][] InvalidPropertyQueriesProvider() {
        return getParameters(InvalidPropertyQueries::getQueries, Collections.singletonList(String.class));
    }

    private static Object[][] getParameters(QueriesProvider queriesProvider, List<Class<?>> fields) {
        Object[][] parameters = new Object[fields.size()][2];
        int i = 0;
        for (Class<?> dataType : fields) {
            List<String> queries = queriesProvider.getQueries(dataType);

            parameters[i][0] = dataType;
            parameters[i][1] = queries;
            i++;
        }

        return parameters;
    }

    @FunctionalInterface
    private interface QueriesProvider {
        List<String> getQueries(Class dataType);
    }


}
