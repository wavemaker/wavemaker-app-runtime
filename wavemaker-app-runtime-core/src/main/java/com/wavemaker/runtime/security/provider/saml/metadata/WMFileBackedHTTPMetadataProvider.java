package com.wavemaker.runtime.security.provider.saml.metadata;

import java.io.File;
import java.net.URISyntaxException;

import org.opensaml.saml2.metadata.provider.FileBackedHTTPMetadataProvider;
import org.opensaml.saml2.metadata.provider.MetadataProviderException;

/**
 *
 * Similar to {@link FileBackedHTTPMetadataProvider} except that it looks up backup file from classpath.
 *
 * Created by ArjunSahasranam on 9/12/16.
 */
public class WMFileBackedHTTPMetadataProvider extends FileBackedHTTPMetadataProvider {

    public WMFileBackedHTTPMetadataProvider(String metadataURL, int requestTimeout, String backupFilePath) throws URISyntaxException, MetadataProviderException {
        super(metadataURL, requestTimeout, new File(WMFileBackedHTTPMetadataProvider.class.getResource(backupFilePath).toURI()).getAbsolutePath());
    }
}
