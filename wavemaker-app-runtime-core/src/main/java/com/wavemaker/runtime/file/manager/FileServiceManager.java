/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
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
package com.wavemaker.runtime.file.manager;

import java.io.BufferedOutputStream;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import org.apache.commons.lang.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.wavemaker.commons.util.WMIOUtils;


@Service
public class FileServiceManager {


    /**
     * Delegate method for file service upload method. This method creates a unique file name from the filename
     * if necessary.
     * <p/>
     * PARAMS:
     * file : multipart file to be uploaded.
     * relativePath : This is the relative path where file will be uploaded.
     * uploadDirectory : The directory to which the file needs to be uploaded.
     * <p/>
     *
     * @return File
     * ******************************************************************************
     */
    public File uploadFile(MultipartFile file, String relativePath, File uploadDirectory) throws IOException {
        File relativeUploadDirectory = getRelativeUploadDirectory(uploadDirectory, relativePath);

        File outputFile = createUniqueFile(file.getOriginalFilename(), relativeUploadDirectory);

                /* Write the file to the filesystem */
        InputStream inputStream = null;
        OutputStream outputStream = null;
        try {
            inputStream = file.getInputStream();
            outputStream = new BufferedOutputStream(new FileOutputStream(outputFile));
            WMIOUtils.copy(inputStream, outputStream);
        } finally {
            WMIOUtils.closeSilently(inputStream);
            WMIOUtils.closeSilently(outputStream);
        }

        return outputFile;
    }

    /**
     * Delegate method for file service upload method. This method accepts the name of the file to be uploaded,
     * <p/>
     * PARAMS:
     * file : multipart file to be uploaded.
     * targetFilename: the file name for the file to be uploaded.
     * relativePath : This is the relative path where file will be uploaded.
     * uploadDirectory : The directory to which the file needs to be uploaded.
     * <p/>
     *
     * @return File
     * ******************************************************************************
     */
    public File uploadFile(MultipartFile file, String targetFilename, String relativePath, File uploadDirectory) throws IOException {
        File relativeUploadDirectory = getRelativeUploadDirectory(uploadDirectory, relativePath);

        File outputFile = new File(relativeUploadDirectory, targetFilename);

        /* Write the file to the filesystem */
        InputStream inputStream = null;
        OutputStream outputStream = null;
        try {
            inputStream = file.getInputStream();
            outputStream = new BufferedOutputStream(new FileOutputStream(outputFile));
            WMIOUtils.copy(inputStream, outputStream);
        } finally {
            WMIOUtils.closeSilently(inputStream);
            WMIOUtils.closeSilently(outputStream);
        }


        return outputFile;
    }

    public File createUniqueFile(String originalFileName, File dir) {
    /* Create a file object that does not point to an existing file.
     * Loop through names until we find a filename not already in use */
        boolean hasExtension = originalFileName.indexOf('.') != -1;
        String name = (hasExtension) ?
                originalFileName.substring(0, originalFileName.lastIndexOf('.')) : originalFileName;
        String ext = (hasExtension) ?
                originalFileName.substring(originalFileName.lastIndexOf('.')) : "";

        File outputFile = new File(dir, originalFileName);
        for (int i = 0; i < 10000 && outputFile.exists(); i++) {
            outputFile = new File(dir, name + i + ext);
        }
        return outputFile;
    }

    /**
     * This method is deprecated, instead use the method {@link FileServiceManager#listFiles(File, String)}
     */
    public File[] listFiles(File uploadDirectory) throws IOException {
        return listFiles(uploadDirectory, null);
    }


    /**
     * *****************************************************************************
     * NAME: listFiles
     * DESCRIPTION:
     * Returns a description of every file in the uploadDir.
     * RETURNS array of File
     * ******************************************************************************
     */
    public File[] listFiles(File uploadDirectory, String relativePath) throws IOException {
        File relativeUploadDirectory = getRelativeUploadDirectory(uploadDirectory, relativePath);
        /*Get a list of files; ignore any filename starting with "." as these are
        typically private or temporary files not for users to interact with*/
        File[] files = relativeUploadDirectory.listFiles(
                pathname -> !pathname.isDirectory() && (pathname.getName().indexOf('.') != 0));

        if (files == null) {
            throw new FileNotFoundException("Given directory " + uploadDirectory + " does not exist.");
        }


        return files;
    }

    /**
     * This method is deprecated, instead use the method {@link FileServiceManager#deleteFile(String, String, File)}
     */
    @Deprecated
    public boolean deleteFile(String file, File uploadDirectory) throws IOException {
        return deleteFile(file, null, uploadDirectory);
    }

    /**
     * *****************************************************************************
     * NAME: deleteFile
     * DESCRIPTION:
     * Deletes the files with the given path or name.  If the parameters are just file
     * names, it will look for files of that name in the uploadDir.  If its a full path
     * will delete the file at that path IF that path is within the uploadDir.
     * RETURNS boolean to indicate if success or failure of operation.
     * **************************************************************************
     */
    public boolean deleteFile(String file, String relativePath, File uploadDirectory) throws IOException {
        File relativeUploadDirectory = getRelativeUploadDirectory(uploadDirectory, relativePath);

        File f = (file.startsWith("/")) ? new File(file) : new File(relativeUploadDirectory, file);

        // verify that the path specified by the server is a valid path, and not, say,
        // your operating system, or your .password file.
        if (f.getAbsolutePath().indexOf(uploadDirectory.getAbsolutePath()) != 0) {
            throw new RuntimeException("Deletion of file at " + f.getAbsolutePath() + " is not allowed. ");
        }
        return f.delete();
    }

    /**
     * This method is deprecated, instead use the method {@link FileServiceManager#downloadFile(String, String, File)}
     */
    @Deprecated
    public File downloadFile(String file, File uploadDirectory) throws Exception {
        return downloadFile(file, null, uploadDirectory);
    }

    /**
     * *****************************************************************************
     * NAME: downloadFile
     * DESCRIPTION:
     * The specified file will be downloaded to the user's computer.
     * - file: filename (if the file is in uploadDir) or path
     * - filename: Optional string; if used, then this is the name that the user will see
     * for the downloaded file.  Else its name matches whats on the server.
     * PARAMS:
     * file : name of the file to be uploaded.
     * uploadDirectory : The directory where the file resides.
     * RETURNS File
     * **************************************************************************
     */
    public File downloadFile(String file, String relativePath, File uploadDirectory) throws Exception {
        File relativeUploadDirectory = getRelativeUploadDirectory(uploadDirectory, relativePath);
        File f = (file.startsWith("/")) ? new File(file) : new File(relativeUploadDirectory, file);

        // verify that the path specified by the server is a valid path, and not, say,
        // your .password file.
        if (f.getAbsolutePath().indexOf(uploadDirectory.getAbsolutePath()) != 0)
            throw new Exception("File not in uploadDir");

        if (!f.exists())
            throw new Exception("File with name " + file + "  not found");

        return f;
    }

    private File getRelativeUploadDirectory(File uploadDirectory, String relativePath) {
        File relativeUploadDirectory = uploadDirectory;
        if (StringUtils.isNotBlank(relativePath)) {
            relativePath = relativePath.trim();
            if (!relativePath.endsWith("/")) {
                relativePath = relativePath + "/";
            }
            relativeUploadDirectory = new File(uploadDirectory.getAbsolutePath(), relativePath);

            /* Find our upload directory, make sure it exists */
            if (!relativeUploadDirectory.exists()) {
                relativeUploadDirectory.mkdirs();
            }
        }
        return relativeUploadDirectory;
    }

}
