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

package com.wavemaker.studio.json.util;

import org.antlr.runtime.RecognitionException;

import com.wavemaker.studio.json.JSON;
import com.wavemaker.studio.json.JSONObject;
import com.wavemaker.studio.json.JSONUnmarshaller;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;

/**
 * Util methods for testing JSON
 * 
 * @author Jeremy Grelle
 */
public abstract class JsonTestUtils {

    /**
     * Compare two JSON-formatted strings; make sure the objects they return are equivalent.
     * 
     * @param expected The first JSON-format string to compare.
     * @param actual The second JSON-format string to compare.
     * @throws RecognitionException
     */
    public static void assertJSONStringsEquals(String expected, String actual) throws RecognitionException {

        JSON jo1 = JSONUnmarshaller.unmarshal(expected);
        assertTrue(jo1.isObject());
        JSONObject o1 = (JSONObject) jo1;
        JSON jo2 = JSONUnmarshaller.unmarshal(actual);
        assertTrue(jo2.isObject());
        JSONObject o2 = (JSONObject) jo2;

        assertEquals(o1, o2);
    }
}
