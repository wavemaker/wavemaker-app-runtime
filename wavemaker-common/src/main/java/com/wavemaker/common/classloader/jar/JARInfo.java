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


import java.io.File;
import java.util.Date;
import java.util.zip.ZipEntry;
/**
 * This class represents a zip-file (a .jar file) and its attributes like :
 *    1) Name of the ZipEntry
 *    2) EntryDate
 *    3) Size
 *    4) Ratio
 *    5) Packed
 *    6) Path
 * <p>getArrar() on this class's instance gives an array of objects with all the details.
 * We always represent each jarFile in the form of its corresponding JarInfo
 */
public class JARInfo {

    public String zeName      = "";
    public String Name        = "";
    public Date   EntryDate   = null;
    public long   Size        = 0;
    public long   Packed      = 0;
    public String Path        = "";

    private ZipEntry ze ;

    public JARInfo(ZipEntry ze)
    {
        this.ze = ze;
        init();
    }

    private void init()
    {
        zeName = ze.getName();
        int index;
        zeName = zeName.replace('/', File.separatorChar);

        index = zeName.lastIndexOf(File.separatorChar);
        Name = zeName.substring(index+1);
        if(index != -1)
            Path = zeName.substring(0, index+1);

        Size     = ze.getSize();
        Packed   = ze.getCompressedSize();
        EntryDate = new Date(ze.getTime());
    }
    /**
     * This method returns the attributes of the ZipEntry (represented by this class in
     * the form an Object-array viz.
     *         Size of the entry
     *         Ratio
     *         Packed
     *         Path
     */
    public Object[] getArray(){
        Object[] row = {Name, EntryDate,
            new Long(Size), new Long(Packed), Path};
        return row;
    }

    public String toString(){
        return(" Name   ::"+Name+" Date ::"+EntryDate+
            " Size  ::"+Size+" Packed  ::"+Packed+" Path   ::"+Path);
    }

}
