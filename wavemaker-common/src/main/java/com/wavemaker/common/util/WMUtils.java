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
package com.wavemaker.common.util;

import com.wavemaker.common.WMRuntimeException;
import org.springframework.http.MediaType;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;
import java.util.List;

/**
 * @author Uday Shankar
 */
public class WMUtils {

    private static final String UTF8 = "UTF-8";

    public static String getFileExtensionFromFileName(String fileName) {
        int indexOfDot = fileName.lastIndexOf(".");
        return (indexOfDot == -1) ? "":fileName.substring(indexOfDot + 1);
    }

    public static String decodeRequestURI(String requestURI) {
        try {
            return URLDecoder.decode(requestURI, UTF8);
        } catch (UnsupportedEncodingException e) {
            throw new WMRuntimeException("Failed to decode request URI", e);
        }
    }

    public static boolean isXmlMediaType(MediaType mediaType) {
        return MediaType.APPLICATION_XML.equals(mediaType) || MediaType.TEXT_XML.equals(mediaType) || MediaType.APPLICATION_ATOM_XML.equals(mediaType);
    }

    public static boolean isJsonMediaType(MediaType mediaType) {
        return MediaType.APPLICATION_JSON.equals(mediaType);
    }

    public static String[] getStringList(Object obj) {
        if (obj instanceof String) {
            return new String[]{(String) obj};
        }
        if (obj instanceof String[]) {
            return  (String[]) obj;
        }
        if (obj instanceof List) {
            List o = (List) obj;
            return (String[]) o.toArray(new String[]{});
        }
        throw new WMRuntimeException("obj of type " + obj.getClass() + " not supported by this method");
    }

    public static boolean areObjectsEqual(Object o1, Object o2) {
        if(o1 == o2 ) {
            return true;
        }
        if(o1 == null || o2 == null) {
            return false;
        }
        return o1.equals(o2);
    }

    public static StringWrapper wrapString(String response)
    {
        return new StringWrapper(response);
    }

    public static class StringWrapper
    {
        private String result;

        public StringWrapper(String result) {
            this.result = result;
        }

        public String getResult() {
            return result;
        }
    }


}
