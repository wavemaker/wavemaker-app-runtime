package com.wavemaker.runtime.data.model;

import org.springframework.data.domain.Page;

import java.util.Map;

/**
 * @Author: sowmyad
 */
public class QueryResponse {
    Page<Object> page;

    Map<String, String> metaData;

    public Page<Object> getPages() {
        return page;
    }

    public void setPages(Page<Object> page) {
        this.page = page;
    }

    public Map getMetaData() {
        return metaData;
    }

    public void setMetaData(Map metaData) {
        this.metaData = metaData;
    }
}
