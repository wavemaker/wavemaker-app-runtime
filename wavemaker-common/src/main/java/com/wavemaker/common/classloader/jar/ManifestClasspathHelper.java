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
package com.wavemaker.common.classloader.jar;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.StringTokenizer;
import java.util.jar.Attributes;
import java.util.jar.Manifest;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Reads the mainfest file inside a jar file and returns the relative path of jar entries inside the
 * manifest file.
 *
 * @author Dilip Kumar
 */
public class ManifestClasspathHelper
{
    private static final Logger logger = LoggerFactory.getLogger(ManifestClasspathHelper.class.getName());
    private static final String[] EMPTY_STRING_ARRAY = new String[0];

    /**
     * Returns the entries of jars inside the manifest file.
     *
     * @param manifestStream Manifest file stream
     * @return Array containing the list of jars in manifest.
     */
    public static String[] getJars(InputStream manifestStream)
    {
        Manifest mf = null;
        try {
            mf = new Manifest(manifestStream);
        } catch (IOException e) {
            logger.info("Error while reading the Manifest Jar's Stream ", e);
            return EMPTY_STRING_ARRAY;
        }
        Attributes att = mf.getMainAttributes();
        String cpStr = att.getValue(Attributes.Name.CLASS_PATH);
        if (cpStr == null || cpStr.length() <= 0) {
            return EMPTY_STRING_ARRAY;
        }
        StringTokenizer jarSt = new StringTokenizer(cpStr, " ");
        List tmpAl = new ArrayList();
        while (jarSt.hasMoreTokens()) {
            tmpAl.add(jarSt.nextToken());
        }
        return (String[]) tmpAl.toArray(new String[tmpAl.size()]);
    }
}
