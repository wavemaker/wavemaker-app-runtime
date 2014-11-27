package com.wavemaker.runtime.data.dao.procedure;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.net.URL;
import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Types;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.PostConstruct;

import org.hibernate.SQLQuery;
import org.hibernate.Session;
import org.hibernate.internal.SessionImpl;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.orm.hibernate4.HibernateTemplate;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wavemaker.common.MessageResource;
import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.util.StringUtils;
import com.wavemaker.common.util.TypeConversionUtils;
import com.wavemaker.runtime.data.dao.util.ProcedureHelper;
import com.wavemaker.runtime.data.model.CustomProcedure;
import com.wavemaker.runtime.data.model.CustomProcedureParam;
import com.wavemaker.runtime.data.model.Procedure;
import com.wavemaker.runtime.data.model.ProcedureModel;
import com.wavemaker.runtime.data.model.ProcedureParam;
import com.wavemaker.runtime.data.model.ProcedureParamType;

public class WMProcedureExecutorImpl implements WMProcedureExecutor {

    private static final Logger LOGGER = LoggerFactory.getLogger(WMProcedureExecutorImpl.class);

    private HibernateTemplate template = null;
    private String serviceId = null;
    private ProcedureModel procedureModel = null;

    public HibernateTemplate getTemplate() {
        return template;
    }

    public void setTemplate(HibernateTemplate template) {
        this.template = template;
    }

    public String getServiceId() {
        return serviceId;
    }

    public void setServiceId(String serviceId) {
        this.serviceId = serviceId;
    }

    @PostConstruct
    protected void init() {
        URL resourceURL = Thread.currentThread().getContextClassLoader().getResource(serviceId + "-procedures.mappings.json");
        File mappingFile = new File(resourceURL.getFile());
        ObjectMapper mapper = new ObjectMapper();
        try {
            procedureModel=  mapper.readValue(new FileInputStream(mappingFile), ProcedureModel.class);
        } catch (IOException e) {
            throw new WMRuntimeException("Failed to map the procedures mapping file", e);
        }
    }

   public List<Object> executeNamedProcedure( String procedureName, Map<String, Object> params) {

        String procedureString = "";
        boolean hasOutParam = false;

        try {
            Map<String, List<Object>> custParams = new HashMap<String, List<Object>>();
            for (Procedure procedureWrapper : procedureModel.getProcedures()) {
                if(procedureWrapper.getName().equals(procedureName)) {
                    procedureString = procedureWrapper.getProcedure();
                    for (String key : params.keySet()) {
                        ProcedureParam procedureParam = getProcedureParam(key, procedureWrapper.getProcedureParams());
                        Integer position = getProcedureParamPosition(key, procedureWrapper.getProcedureParams());
                        if(procedureParam.getProcedureParamType().equals(ProcedureParamType.IN_OUT) || procedureParam.getProcedureParamType().equals(ProcedureParamType.OUT))
                        {
                            hasOutParam = false;
                        }
                        List<Object> paramsMap = new ArrayList<Object>();
                        paramsMap.add(new CustomProcedureParam(procedureParam.getParamName(),params.get(key), procedureParam.getProcedureParamType(), procedureParam.getValueType()));
                        paramsMap.add(position);
                        custParams.put(key, paramsMap);
                    }
                    break;
                }

            }
            if(!hasOutParam)
                return executeNativeProcedure(procedureString, custParams);
            else
                return nativeJDBCCall(procedureString, custParams);

        } catch (Exception e) {
            throw  new WMRuntimeException("Failed to execute Named Procedure", e);

        }


    }

    private Integer getProcedureParamPosition(String key, List<ProcedureParam> procedureParams) {
        for(int i=0; i<procedureParams.size();i++){
            if(procedureParams.get(i).getParamName().equals(key))
                return i+1;

        }
        return  null;

    }

    private ProcedureParam getProcedureParam(String key, List<ProcedureParam> procedureParams) {
        for (ProcedureParam procedureParam : procedureParams) {
            if(procedureParam.getParamName().equals(key)){
                return procedureParam;
            }
        }
        return null;
    }

    @Override
    public List<Object> executeCustomProcedure(CustomProcedure customProcedure) {
        Map<String, List<Object>> params = new HashMap<String, List<Object>>();
        prepareParams(params, customProcedure.getProcedureParams());
        if(!hasOutParam(customProcedure))
            return executeNativeProcedure(customProcedure.getProcedureStr(), params);
        else
            return nativeJDBCCall(customProcedure.getProcedureStr(), params);

    }

    private List<Object> nativeJDBCCall(String procedureStr, Map<String, List<Object>> params) {
        Session session = template.getSessionFactory().openSession();
        Connection conn = ((SessionImpl) session).connection();
        try{

            SQLQuery sqlProcedure = session.createSQLQuery(procedureStr);
            String[] namedParams = sqlProcedure.getNamedParameters();
            CallableStatement callableStatement = conn.prepareCall(getJDBCString(procedureStr, namedParams));

            List<Integer> outParams = new ArrayList<Integer>();
            for (String namedParam : namedParams) {
                List<Object> paramTypes = params.get(namedParam);

                CustomProcedureParam procedureParam =(CustomProcedureParam) paramTypes.get(0);
                if(procedureParam.getProcedureParamType().equals(ProcedureParamType.IN_OUT) || procedureParam.getProcedureParamType().equals(ProcedureParamType.OUT)){
                    String typeName = StringUtils.splitPackageAndClass(procedureParam.getValueType()).v2;
                    Integer typeCode = null;
                    typeCode = typeName.equals("String") ? Types.VARCHAR : (Integer)Types.class.getField(typeName.toUpperCase()).get(null);
                    callableStatement.registerOutParameter((Integer)paramTypes.get(1), typeCode);
                    outParams.add((Integer)paramTypes.get(1));
                }else if(procedureParam.getProcedureParamType().equals(ProcedureParamType.IN) || procedureParam.getProcedureParamType().equals(ProcedureParamType.IN_OUT) ){
                    callableStatement.setObject((Integer)paramTypes.get(1),procedureParam.getParamValue());
                }
            }

            callableStatement.execute();
            List<Object> outData = new ArrayList<Object>();
            for (Integer outParam : outParams) {
                 outData.add(callableStatement.getObject(outParam));
            }
            return outData;
        }catch(Exception e){
          throw  new WMRuntimeException("Faild to execute procedure ", e);
        }


    }

    private String getJDBCString(String procedureStr, String[] namedParams) {
        String targetString = procedureStr;
        for (String namedParam : namedParams) {
            targetString = targetString.replace(":"+namedParam, "?");
        }
        return targetString;

    }

    private boolean hasOutParam(CustomProcedure customProcedure){
        for (CustomProcedureParam customProcedureParam : customProcedure.getProcedureParams()) {
            if(customProcedureParam.getProcedureParamType().equals(ProcedureParamType.IN_OUT) || customProcedureParam.getProcedureParamType().equals(ProcedureParamType.OUT)){
                return true;
            }
        }
        return false;
    }

    private void prepareParams(Map<String, List<Object>> params, List<CustomProcedureParam> customProcedureParams) {

        if (customProcedureParams != null && !customProcedureParams.isEmpty()) {
            for (int i=0; i<customProcedureParams.size();i++) {
                CustomProcedureParam customProcedureParam = customProcedureParams.get(i);
                List<Object> paramMetaData = new ArrayList<Object>();


                Object paramValue = customProcedureParam.getParamValue();
                Object processParamValue = getValueObject(customProcedureParam);
                if(processParamValue != null){
                    paramValue = processParamValue;
                }
                customProcedureParam.setParamValue(paramValue);
                paramMetaData.add(customProcedureParam);
                paramMetaData.add(i+1);
                params.put(customProcedureParam.getParamName(), paramMetaData);
            }
        }

    }

    private Object getValueObject(CustomProcedureParam customProcedureParam) {
        Object paramValue;
        try {
            Class loader = Class.forName(customProcedureParam.getValueType());
            paramValue = TypeConversionUtils.fromString(loader, customProcedureParam.getParamValue().toString(), false);
        } catch (IllegalArgumentException ex) {
            LOGGER.error("Failed to Convert param value for procedure", ex);
            throw new WMRuntimeException(MessageResource.QUERY_CONV_FAILURE, ex);
        } catch (ClassNotFoundException ex) {
            throw new WMRuntimeException(MessageResource.CLASS_NOT_FOUND, ex, customProcedureParam.getProcedureParamType());
        }
        return paramValue;
    }

    protected List<Object> executeNativeProcedure(String procedureString, Map<String, List<Object>> params) {
        SQLQuery sqlProcedure = createNativeProcedure(procedureString, params);
        return sqlProcedure.list();
    }

    private SQLQuery createNativeProcedure(String procedureString, Map<String, List<Object>> params) {
        Session currentSession = template.getSessionFactory().getCurrentSession();
        SQLQuery sqlProcedure = currentSession.createSQLQuery(procedureString);
        ProcedureHelper.configureParameters(sqlProcedure, params);
        return sqlProcedure;
    }


}