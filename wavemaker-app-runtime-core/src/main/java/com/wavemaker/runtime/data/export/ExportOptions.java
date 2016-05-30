package com.wavemaker.runtime.data.export;

import java.util.List;

import org.springframework.data.domain.Pageable;

/**
 * @author <a href="mailto:anusha.dharmasagar@wavemaker.com">Anusha Dharmasagar</a>
 * @since 12/5/16
 */
public class ExportOptions {

    private Pageable pageable;

    private String query;

    //Columns to be displayed
    private List<String> fieldNames;

    public Pageable getPageable() {
        return pageable;
    }

    public void setPageable(Pageable pageable) {
        this.pageable = pageable;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public List<String> getFieldNames() {
        return fieldNames;
    }

    public void setFieldNames(List<String> fieldNames) {
        this.fieldNames = fieldNames;
    }
}
