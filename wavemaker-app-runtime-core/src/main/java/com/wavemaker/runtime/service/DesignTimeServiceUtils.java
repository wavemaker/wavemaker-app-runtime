package com.wavemaker.runtime.service;

import java.util.Collections;
import java.util.List;

import com.wavemaker.runtime.data.model.ReferenceType;
import com.wavemaker.runtime.data.model.queries.QueryType;
import com.wavemaker.runtime.data.model.queries.RuntimeQuery;
import com.wavemaker.runtime.data.model.returns.FieldType;
import com.wavemaker.runtime.data.model.returns.ReturnProperty;
import com.wavemaker.runtime.data.util.DataServiceUtils;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 27/1/17
 */
public class DesignTimeServiceUtils {

    public static boolean isDMLOrUpdateQuery(RuntimeQuery query) {
        return query.getType() != QueryType.SELECT && DataServiceUtils.isDML(query.getQueryString());
    }

    public static List<ReturnProperty> getMetaForDML() {
        return Collections.singletonList(new ReturnProperty(null, new FieldType(ReferenceType.PRIMITIVE, Integer
                .class.getName())));
    }
}
