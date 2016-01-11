/**
 * Copyright © 2015 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.controller;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.dao.procedure.WMProcedureExecutor;
import com.wavemaker.runtime.data.dao.query.WMQueryExecutor;
import com.wavemaker.runtime.data.model.CustomProcedure;
import com.wavemaker.runtime.data.model.CustomProcedureParam;
import com.wavemaker.runtime.data.model.CustomQuery;
import com.wavemaker.runtime.data.model.ProcedureResponse;
import com.wavemaker.runtime.data.model.QueryResponse;
import com.wavemaker.runtime.data.util.DataServiceUtils;
import com.wavemaker.runtime.data.util.ProceduresUtils;
import com.wavemaker.studio.common.util.PropertiesFileUtils;
import com.wavemaker.studio.common.wrapper.StringWrapper;

/**
 * @author Sowmya
 */

@RestController
@RequestMapping("/")
public class AppRuntimeController {

    private static final String QUERY_EXECUTOR_BEAN_NAME = "{serviceId}WMQueryExecutor";
    private static final String TRANSACTION_MANAGER_BEAN_NAME = "{serviceId}TransactionManager";
    private static final String PROCEDURE_EXECUTOR_BEAN_NAME = "{serviceId}WMProcedureExecutor";

    private String applicationType = null;

    @RequestMapping(value="/application/type" , method = RequestMethod.GET)
    public StringWrapper getApplicationType() {
        if (applicationType == null) {
            synchronized (this) {
                if (applicationType == null) {
                    Properties properties = PropertiesFileUtils.loadFromXml(AppRuntimeController.class.getClassLoader().getResourceAsStream(".wmproject.properties"));
                    applicationType = properties.getProperty("type");
                }
            }
        }
        return new StringWrapper(applicationType);
    }

    @RequestMapping(value="/{serviceId}/queries/wm_querymetadata" , method = RequestMethod.POST)
    public QueryResponse createMetaData(@RequestBody final CustomQuery customQuery, @PathVariable("serviceId") String serviceId)   {
        if(DataServiceUtils.isDML(customQuery.getQueryStr())){
            return new QueryResponse();
        }

        final String queryExecutorBeanName =  QUERY_EXECUTOR_BEAN_NAME.replaceAll("\\{serviceId\\}",serviceId);
        final String transactionManagerBeanName =  TRANSACTION_MANAGER_BEAN_NAME.replaceAll("\\{serviceId\\}", serviceId);
        PlatformTransactionManager transactionManager = WMAppContext.getInstance().getSpringBean(transactionManagerBeanName);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return txTemplate.execute(new TransactionCallback<QueryResponse>() {
            @Override
            public QueryResponse doInTransaction(TransactionStatus status) {

                WMQueryExecutor queryExecutor = WMAppContext.getInstance().getSpringBean(queryExecutorBeanName);
                final PageRequest pageable = new PageRequest(0, 5, null);
                Page<Object> pageResponse =  queryExecutor.executeCustomQuery(customQuery, pageable);

                QueryResponse queryResponse = new QueryResponse();
                queryResponse.setPages(pageResponse);
                queryResponse.setMetaData(prepareMetaData(pageResponse.getContent()));
                return queryResponse;
            }
        });
    }

    @RequestMapping(value="/{serviceId}/procedures/wm_proceduremetadata" , method = RequestMethod.POST)
    public ProcedureResponse createMetaDataForProcedures(@RequestBody final CustomProcedure customProcedure, @PathVariable("serviceId") String serviceId)   {
        final String procedureExecutorBeanName =  PROCEDURE_EXECUTOR_BEAN_NAME.replaceAll("\\{serviceId\\}",serviceId);
        String transactionManagerBeanName =  TRANSACTION_MANAGER_BEAN_NAME.replaceAll("\\{serviceId\\}", serviceId);

        PlatformTransactionManager transactionManager = WMAppContext.getInstance().getSpringBean(transactionManagerBeanName);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return txTemplate.execute(new TransactionCallback<ProcedureResponse>() {
            @Override
            public ProcedureResponse doInTransaction(TransactionStatus status) {

                WMProcedureExecutor wmProcedureExecutor = WMAppContext.getInstance().getSpringBean(procedureExecutorBeanName);
                List<Object> response =  wmProcedureExecutor.executeCustomProcedure(customProcedure);

                ProcedureResponse procedureResponse = new ProcedureResponse();
                procedureResponse.setProcedureResult(response);

                if(ProceduresUtils.hasOutParam(customProcedure.getProcedureParams())){
                    procedureResponse.setMetaData(prepareFromOutParams(customProcedure));
                }else{
                    procedureResponse.setMetaData(prepareMetaData(response));
                }
                return procedureResponse;
            }
        });
    }

    private Map<String, String> prepareFromOutParams(CustomProcedure customProcedure) {
        Map<String, String> metaData = new HashMap<>();
        for (CustomProcedureParam customProcedureParam : customProcedure.getProcedureParams()) {
            if(ProceduresUtils.hasOutParamType(customProcedureParam)){
                metaData.put(customProcedureParam.getParamName(), customProcedureParam.getValueType()) ;
            }
        }
        return metaData;
    }

    private Map prepareMetaData(List response) {
        Map<String, String> result = new HashMap<String, String>();
        if(response.size() == 0){
            return result;
        }
        Object res = response.get(0);
        //A join result gives response an array
        if(res instanceof Object[]){
            Object[] joinRes = (Object[])res;
            for(Object ob : joinRes){
                prepareBaseOnType(ob, result);
            }
        } else{
            prepareBaseOnType(res, result);
        }
        return result;
    }

    private void prepareBaseOnType(Object queryResonse, Map<String, String> result){
        if(queryResonse instanceof Map){
            prepareFromMap((Map)queryResonse, result);
        }else{
            prepareFromObject(queryResonse, result);
        }
    }

    private void prepareFromMap(Map queryResMap, Map result){

        Set<Map.Entry> mapSet = queryResMap.entrySet();
        for(Map.Entry entr :  mapSet){
            String type = entr.getValue() == null ? String.class.getName() : entr.getValue().getClass().getName();
            result.put(entr.getKey().toString(),type);
        }
    }

    private void prepareFromObject(Object queryResponse, Map result){
        Field[] fields = queryResponse.getClass().getDeclaredFields();
        for(Field field : fields){
            String fieldName = field.getName();
            if(result.containsKey(field.getName())){
                fieldName = queryResponse.getClass().getSimpleName() + "." + fieldName;
            }
            result.put(fieldName, field.getType().getName());
        }
    }

}
