package com.wavemaker.runtime.data.model;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.validator.constraints.NotBlank;
import org.hibernate.validator.constraints.NotEmpty;

public class CustomQuery {

	@NotBlank
	@NotEmpty
    private String queryStr = null;
    
    public CustomQuery() {
		super();
	}

	public CustomQuery(String queryStr, List<CustomQueryParam> queryParams) {
		super();
		this.queryStr = queryStr;
		this.queryParams = queryParams;
	}

	private List<CustomQueryParam> queryParams = new ArrayList<CustomQueryParam>();
    
    public String getQueryStr() {
        return queryStr;
    }

    public void setQueryStr(String queryStr) {
        this.queryStr = queryStr;
    }
    
    public List<CustomQueryParam> getQueryParams() {
        return queryParams;
    }

    public void setQueryParams(List<CustomQueryParam> queryParams) {
        this.queryParams = queryParams;
    }
}
