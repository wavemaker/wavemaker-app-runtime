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
package com.wavemaker.runtime.security.provider.saml;

import com.wavemaker.commons.model.security.saml.MetadataSource;

/**
 * Created by ArjunSahasranam on 23/11/16.
 */
public class SAMLConfig {
    private String idpMetadataUrl;
    private String idpMetadataFileLocation;
    private ValidateType validateType;
    private MetadataSource metadataSource;

    public String getIdpMetadataUrl() {
        return idpMetadataUrl;
    }

    public void setIdpMetadataUrl(final String idpMetadataUrl) {
        this.idpMetadataUrl = idpMetadataUrl;
    }

    public String getIdpMetadataFileLocation() {
        return idpMetadataFileLocation;
    }

    public void setIdpMetadataFileLocation(final String idpMetadataFileLocation) {
        this.idpMetadataFileLocation = idpMetadataFileLocation;
    }

    public ValidateType getValidateType() {
        return validateType;
    }

    public void setValidateType(final ValidateType validateType) {
        this.validateType = validateType;
    }

    public MetadataSource getMetadataSource() {
        return metadataSource;
    }

    public void setMetadataSource(final MetadataSource metadataSource) {
        this.metadataSource = metadataSource;
    }

    public enum ValidateType {
        STRICT,  // String.equals()
        RELAXED, // DEV MODE
        NONE // none
    }
}
