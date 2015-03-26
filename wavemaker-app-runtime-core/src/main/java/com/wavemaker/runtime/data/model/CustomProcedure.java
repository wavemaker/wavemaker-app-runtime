package com.wavemaker.runtime.data.model;

import java.util.ArrayList;
import java.util.List;

import org.hibernate.validator.constraints.NotBlank;
import org.hibernate.validator.constraints.NotEmpty;

/**
 * @author Sowmyad
 */
public class CustomProcedure {

	@NotBlank
	@NotEmpty
    private String procedureStr = null;

    private List<CustomProcedureParam> procedureParams = new ArrayList<CustomProcedureParam>();

    public CustomProcedure() {
		super();
	}

	public CustomProcedure(String procedureStr, List<CustomProcedureParam> procedureParams) {
		super();
		this.procedureStr = procedureStr;
		this.procedureParams = procedureParams;
	}

    public String getProcedureStr() {
        return procedureStr;
    }

    public void setProcedureStr(String procedureStr) {
        this.procedureStr = procedureStr;
    }
    
    public List<CustomProcedureParam> getProcedureParams() {
        return procedureParams;
    }

    public void setProcedureParams(List<CustomProcedureParam> procedureParams) {
        this.procedureParams = procedureParams;
    }


}
