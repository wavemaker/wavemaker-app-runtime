package com.wavemaker.runtime.security.provider.saml.util;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.IOUtils;
import com.wavemaker.commons.util.SSLUtils;
import org.apache.commons.io.FileUtils;
import org.apache.http.HttpResponse;
import org.apache.http.client.ResponseHandler;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

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
            IOUtils.closeSilently(closeableHttpClient);
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
