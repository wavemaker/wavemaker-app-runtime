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
