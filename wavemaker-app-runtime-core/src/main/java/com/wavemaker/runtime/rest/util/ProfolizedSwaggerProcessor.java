package com.wavemaker.runtime.rest.util;

import java.io.IOException;
import java.io.Reader;
import java.util.Map;

import org.apache.commons.io.IOUtils;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.runtime.util.PropertyPlaceHolderReplacementHelper;
import com.wavemaker.tools.apidocs.tools.core.model.Swagger;

public class ProfolizedSwaggerProcessor {

    private PropertyPlaceHolderReplacementHelper propertyPlaceHolderReplacementHelper;

    public Swagger processPlaceHolders(Map<String, Object> profolizedSwagger) {
        try {
            Reader reader =
                    propertyPlaceHolderReplacementHelper.getPropertyReplaceReader(IOUtils.toInputStream(JSONUtils.toJSON(profolizedSwagger)));
            return JSONUtils.toObject(reader, Swagger.class);
        } catch (IOException e) {
            throw new WMRuntimeException(MessageResource.create("com.wavemaker.runtime.failed.to.read.swagger"), e);
        }
    }

    public void setPropertyPlaceHolderReplacementHelper(PropertyPlaceHolderReplacementHelper propertyPlaceHolderReplacementHelper) {
        this.propertyPlaceHolderReplacementHelper = propertyPlaceHolderReplacementHelper;
    }
}
