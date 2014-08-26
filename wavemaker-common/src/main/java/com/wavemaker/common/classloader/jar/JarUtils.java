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

/**
 *  Utility file for Archiving
 *
 * @author Dilip Kumar
 */

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.Hashtable;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;
import java.util.zip.ZipInputStream;

public class JarUtils {

    public JarUtils() {
	}

	/**
	 * This method extracts the entries into a hashTable, name-of-the-zip Vs the JarInfo
	 * @param zis      : input stream to zip-Object (of type Zip)
	 */
	public static Hashtable extract(ZipInputStream zis) throws IOException {
		try {
			Hashtable entries = new Hashtable();
			ZipEntry ze = null;
			while ((ze = zis.getNextEntry()) != null) {
				try {
					JARInfo info = new JARInfo(ze);
					entries.put(info.zeName, info);
				} finally {
					zis.closeEntry();
				}
			}
			return entries;
		} finally {
			zis.close();
		}
	}

    /**
	 * This method returns the ByteArrayInputStream for the entry in the specified
	 * zipFileName
	 * @param entryName : name of the file for which the ByteArrayInputStream is required
	 * @param zipName  : name of the zip file
	 */
	public static ByteArrayInputStream extractEntry(String entryName, String zipName)
	        throws IOException {
        ZipFile zip = new ZipFile(zipName);
        try {
            ZipEntry entry = zip.getEntry(trim(entryName));
            if(entry==null) {
                throw new IOException("The entry " + entryName + " is not present in the archive " + zipName);
            }
            InputStream inputStream = zip.getInputStream(entry);
            ByteArrayOutputStream baos = new ByteArrayOutputStream((int) entry.getSize());
            FileUtility.copyFile(inputStream, baos);
            return new ByteArrayInputStream(baos.toByteArray());
        } finally {
            zip.close();
        }
    }

	/**
	 * This method returns the ByteArrayInputStream for the entry in the specified
	 * InputStream (for the zipFileName)
	 * @param entryName : name of the file for which the ByteArrayInputStream is required
	 * @param is        : inputStream of the zipFile in which the entry could be found
	 */
	public static ByteArrayInputStream extractEntry(String entryName, InputStream is)
	        throws IOException {
		byte[] b = extractEntryInBytes(entryName, is);
		if (b == null) throw new IllegalArgumentException(" EntryName :" + entryName + " not found in archive file");

		return new ByteArrayInputStream(b);
	}

	/**
	 * This method returns a byte-array for the entry in the specified
	 * zipFileName
	 * @param entryName : name of the file for which the ByteArrayInputStream is required
	 * @param zipName  : name of the zip file
	 */
	public static byte[] extractEntryInBytes(String entryName, String zipName)
	        throws IOException {
		ZipFile zipFile = null;
		InputStream is = null;
		try {
			zipFile = new ZipFile(zipName);
			ZipEntry entry = zipFile.getEntry(entryName);
			if (entry == null)
				throw new IOException("EntryName :" + entryName + " not found in archive file " + zipName);
			is = zipFile.getInputStream(entry);
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			byte[] b = new byte[2048];
			while (true) {
				int read = is.read(b);
				if (read < 0)
					break;
				baos.write(b, 0, read);
			}
			return baos.toByteArray();
		} finally {
			if (is != null)
				is.close();
			if (zipFile != null)
				zipFile.close();
		}
	}

	/**
	 * This method returns a byte-array for the entry in the specified
	 * InputStream (for the zipFileName)
	 * @param entryName : name of the file for which the ByteArrayInputStream is required
	 * @param is        : inputStream of the zipFile in which the entry could be found
	 */
	public static byte[] extractEntryInBytes(String entryName, InputStream is)
	        throws IOException {
		entryName = trim(entryName);

		ZipInputStream zis = null;

		try {

			zis = new ZipInputStream(is);
			for (ZipEntry ze1 = zis.getNextEntry(); ze1 != null; ze1 = zis.getNextEntry()) {
                if (ze1.getName().equals(entryName)) {

					ByteArrayOutputStream bos = new ByteArrayOutputStream();

					byte[] b = new byte[2048];
					int r = zis.read(b);
					while (r > 0) {
						bos.write(b, 0, r);
						r = zis.read(b);
					}
					bos.flush();

					zis.closeEntry();

					return bos.toByteArray();
				}
			}
			return null;
		} finally {
			try {
				if (zis != null)
					zis.close();
				if (is != null)
					is.close();
			} catch (Exception e) {
			}
		}
	}

	public static String trim(String entryName) {
		entryName = entryName.replace('/', File.separatorChar);
		return entryName.replace('\\', '/');
	}
}
