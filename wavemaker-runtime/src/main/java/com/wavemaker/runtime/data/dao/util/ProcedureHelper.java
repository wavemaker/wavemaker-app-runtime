package com.wavemaker.runtime.data.dao.util;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

import org.hibernate.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.runtime.data.model.CustomProcedureParam;

public class ProcedureHelper {

    private static final Logger LOGGER = LoggerFactory
            .getLogger(ProcedureHelper.class);

    public static void configureParameters(Query query, Map<String, List<Object>> params) {
        String[] namedParameters = query.getNamedParameters();
        if(namedParameters != null && namedParameters.length > 0) {
            if(params == null || params.isEmpty())
                throw new RuntimeException("Require input parameters such as: " + Arrays.asList(namedParameters));

            for (String namedParameter : namedParameters) {
                Object val = ((CustomProcedureParam)params.get(namedParameter).get(0)).getParamValue();
                if(val == null)
                    throw new RuntimeException("No value provided for parameter name: " + namedParameter);
                query.setParameter(namedParameter, val);
            }
        }
    }

}
