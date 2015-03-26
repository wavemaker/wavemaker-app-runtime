package com.wavemaker.runtime.data.model;

import java.util.List;
import java.util.Map;

/**
 * @Author: sowmyad
 */
public class ProcedureResponse {
    List<Object> procedureResult;

    Map<String, String> metaData;

    public List<Object> getProcedureResult() {
        return procedureResult;
    }

    public void setProcedureResult(List<Object> page) {
        this.procedureResult = page;
    }

    public Map getMetaData() {
        return metaData;
    }

    public void setMetaData(Map metaData) {
        this.metaData = metaData;
    }
}
