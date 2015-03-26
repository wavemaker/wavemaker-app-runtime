package com.wavemaker.runtime.data.dao.procedure;

import java.util.List;
import java.util.Map;

import com.wavemaker.runtime.data.model.CustomProcedure;

public interface WMProcedureExecutor {

	public List<Object> executeNamedProcedure(String procedureName, Map<String, Object> params);

	public List<Object> executeCustomProcedure(CustomProcedure customProcedure);



}
