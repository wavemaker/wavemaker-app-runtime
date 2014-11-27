/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
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
import java.util.Set;

import org.springframework.data.domain.Page;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.support.TransactionCallback;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;

import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.data.dao.query.WMQueryExecutor;
import com.wavemaker.runtime.data.model.CustomQuery;
import com.wavemaker.runtime.data.model.QueryResponse;
import com.wavemaker.runtime.data.util.DataServiceUtils;

/**
 * @author Sowmya
 */

@RequestMapping("/")
public class StudioRuntimeController {

    String queryExecutorBeanName = "{serviceId}WMQueryExecutor";
    String transactionManagerBeanName = "{serviceId}TransactionManager";


    @RequestMapping(value="/{serviceId}/queries/wm_querymetadata" , method = RequestMethod.POST)
    @ResponseBody
    public QueryResponse createMetaData(@RequestBody final CustomQuery customQuery, @PathVariable("serviceId") String serviceId)   {
        if(DataServiceUtils.isDML(customQuery.getQueryStr())){
            return new QueryResponse();
        }
        queryExecutorBeanName =  queryExecutorBeanName.replaceAll("\\{serviceId\\}",serviceId);
        transactionManagerBeanName =  transactionManagerBeanName.replaceAll("\\{serviceId\\}", serviceId);
        PlatformTransactionManager transactionManager = WMAppContext.getInstance().getSpringBean(transactionManagerBeanName);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return txTemplate.execute(new TransactionCallback<QueryResponse>() {
            @Override
            public QueryResponse doInTransaction(TransactionStatus status) {

                QueryResponse queryResponse = new QueryResponse();

                WMQueryExecutor queryExecutor = WMAppContext.getInstance().getSpringBean(queryExecutorBeanName);

                Page<Object> pageResponse =  queryExecutor.executeCustomQuery(customQuery, null);

                queryResponse.setPages(pageResponse);
                queryResponse.setMetaData(prepareMetaData(pageResponse.getContent()));

                return queryResponse;
            }
        });
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
