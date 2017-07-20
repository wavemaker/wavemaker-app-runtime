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
package com.wavemaker.runtime.security.provider.saml.util;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

import org.apache.commons.io.FileUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.SSLUtils;
import com.wavemaker.commons.util.WMIOUtils;

/**
 * Created by arjuns on 15/12/16.
 */
public class FileDownload {

    private boolean secure;

    public FileDownload() {
        this(true);
    }

    public FileDownload(boolean secure) {
        this.secure = secure;
    }

    public File download(String url, File file) {
        HttpGet httpGet = new HttpGet(url);
        File downloadedFile = null;
        CloseableHttpClient closeableHttpClient = null;
        try {
            if (!secure) {
                closeableHttpClient = HttpClients.custom().
                        setSSLContext(SSLUtils.getAllTrustedCertificateSSLContext()).build();
            } else {
                closeableHttpClient = HttpClients.custom().build();
            }
            downloadedFile = closeableHttpClient.execute(httpGet, new FileResponseHandler(file));
        } catch (IOException e) {
            throw new WMRuntimeException("Failed to download file from url " + url, e);
        } finally {
            WMIOUtils.closeSilently(closeableHttpClient);
        }
        return downloadedFile;
    }

    public static class FileResponseHandler implements ResponseHandler<File> {

        private File file;

        public FileResponseHandler(File file) {
            this.file = file;
        }

        @Override
        public File handleResponse(HttpResponse httpResponse) throws IOException {
            InputStream content = httpResponse.getEntity().getContent();
            FileUtils.copyInputStreamToFile(content, file);
            return file;
        }
    }
}
