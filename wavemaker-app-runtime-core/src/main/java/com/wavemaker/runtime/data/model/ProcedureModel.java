package com.wavemaker.runtime.data.model;

import java.util.ArrayList;
import java.util.List;

/**
 * @author sowmyad
 */
public class ProcedureModel {

    private String name;
    private String description;
    private List<Procedure> procedures = null;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public List<Procedure> getProcedures() {
        if (procedures == null) {
            return new ArrayList<>();
        }
        return procedures;
    }

    public void setProcedures(List<Procedure> procedures) {
        this.procedures = procedures;
    }


}
