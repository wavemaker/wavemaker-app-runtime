package com.wavemaker.runtime.data.filter.parser;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.springframework.core.io.ClassPathResource;
import org.testng.annotations.DataProvider;

import com.fasterxml.jackson.core.type.TypeReference;
import com.wavemaker.runtime.WMObjectMapper;
import com.wavemaker.runtime.data.model.JavaType;

/**
 * @author Sujith Simon
 * Created on : 2/11/18
 */
public class HqlParserDataprovider {

    private static final List<JavaType> unsupportedJavaTypes = Arrays.asList(JavaType.BLOB, JavaType.CURSOR);

    private static final String dataTypeQueriesFile = "/com/wavemaker/runtime/filter/dataTypeQueries.json";

    @DataProvider
    public static Object[][] dataTypeQueriesProvider() throws ClassNotFoundException, IOException {
        Map<String, List<String>> queryMap =
                WMObjectMapper.getInstance().readValue(new ClassPathResource(dataTypeQueriesFile).getFile()
                        , new TypeReference<Map<String, List<String>>>() {
                        });

        Object[][] parameters = new Object[JavaType.values().length - unsupportedJavaTypes.size()][2];

        int i = 0;
        for (JavaType javaType : JavaType.values()) {
            if (unsupportedJavaTypes.contains(javaType)) {
                continue;
            }
            Class dataType = Class.forName(javaType.getClassName());
            List<String> queries = queryMap.get(dataType.getName());
            parameters[i][0] = dataType;
            parameters[i][1] = queries;
            i++;
        }

        return parameters;
    }

}
