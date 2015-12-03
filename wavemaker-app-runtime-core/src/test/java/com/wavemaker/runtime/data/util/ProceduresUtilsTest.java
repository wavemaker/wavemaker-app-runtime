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
package com.wavemaker.runtime.data.util;

import com.wavemaker.runtime.data.model.CustomProcedure;
import com.wavemaker.runtime.data.util.ProceduresUtils;
import com.wavemaker.runtime.data.model.ProcedureParamType;
import com.wavemaker.runtime.data.model.CustomProcedureParam;


import org.testng.Assert;
import org.testng.annotations.Test;

import java.util.ArrayList;
import java.util.List;

import static org.testng.Assert.*;


/**
 * Created by anitha on 2/11/15.
 */

@Test
public class ProceduresUtilsTest {


    public void hasOutParamTest() {
        ProceduresUtils p = new ProceduresUtils();
        CustomProcedureParam cmp1 = new CustomProcedureParam("example", p, ProcedureParamType.OUT, "int");
        CustomProcedureParam cmp2 = new CustomProcedureParam("Sample", p, ProcedureParamType.IN, "int");
        CustomProcedureParam cmp3 = new CustomProcedureParam("test", p, ProcedureParamType.IN_OUT, "int");
        CustomProcedureParam cmp4= new CustomProcedureParam("Checking",p,ProcedureParamType.IN,"int");
        List<CustomProcedureParam> customProcedureParamList= new ArrayList<>();
        List<CustomProcedureParam> customProcedureParamList1= new ArrayList<>();
        List<CustomProcedureParam> customProcedureParamList2= new ArrayList<>();
        customProcedureParamList.add(cmp1);
        customProcedureParamList.add(cmp2);
        customProcedureParamList1.add(cmp2);
        customProcedureParamList1.add(cmp4);
        customProcedureParamList2.add(cmp3);
        assertTrue(ProceduresUtils.hasOutParam(customProcedureParamList));
        assertFalse(ProceduresUtils.hasOutParam(customProcedureParamList1));
        assertTrue(ProceduresUtils.hasOutParam(customProcedureParamList2));
        assertTrue(ProceduresUtils.hasOutParam(customProcedureParamList));
        assertFalse(ProceduresUtils.hasOutParam(customProcedureParamList1));

    }

    public void hasOutParamTypeTest(){
        ProceduresUtils p = new ProceduresUtils();
        CustomProcedureParam cmp1= new CustomProcedureParam("example",p,ProcedureParamType.OUT,"int");
        assertTrue(ProceduresUtils.hasOutParamType(cmp1));
        CustomProcedureParam cmp2= new CustomProcedureParam("sample",p,ProcedureParamType.IN,"int");
        assertFalse(ProceduresUtils.hasOutParamType(cmp2));
        CustomProcedureParam cmp3= new CustomProcedureParam("example",p,ProcedureParamType.IN_OUT,"int");
        assertTrue(ProceduresUtils.hasOutParamType(cmp3));

    }



}















