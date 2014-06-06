package com.wavemaker.runtime.data.model;

import java.util.ArrayList;
import java.util.List;

public class CustomQuery {

    private String name = null;
    
    public CustomQuery() {
		super();
	}

	public CustomQuery(String name, List<CustomQueryParam> queryParams) {
		super();
		this.name = name;
		this.queryParams = queryParams;
	}

	private List<CustomQueryParam> queryParams = new ArrayList<CustomQueryParam>();
    
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }
    
    public List<CustomQueryParam> getQueryParams() {
        return queryParams;
    }

    public void setQueryParams(List<CustomQueryParam> queryParams) {
        this.queryParams = queryParams;
    }
}
