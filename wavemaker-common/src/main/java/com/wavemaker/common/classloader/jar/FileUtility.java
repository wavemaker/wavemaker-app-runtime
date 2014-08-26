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
import java.io.OutputStream;


/**
 * Utility Class for File operations.
 *
 * @author Dilip Kumar
 */

public class FileUtility {
    /**
     * Copies source stream contents to destination stream.
     *
     * @param source      inputStream
     * @param destination outputStream
     * @throws java.io.IOException
     */
    public static void copyFile(InputStream source,
                                OutputStream destination)
            throws IOException {

        try {
            byte[] b = new byte[5120];
            int r = source.read(b);
            while (r > 0) {
                destination.write(b, 0, r);
                r = source.read(b);
            }
        } finally {
            try {
                if (source != null) {
                    source.close();
                }
            } catch (IOException e) {
            }
            try {
                if (destination != null) {
                    destination.close();
                }
            } catch (IOException e) {
            }
        }
    }
}