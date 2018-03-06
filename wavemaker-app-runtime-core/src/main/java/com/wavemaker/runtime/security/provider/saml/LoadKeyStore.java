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

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.URL;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.Certificate;
import java.security.cert.CertificateException;
import java.security.cert.CertificateFactory;
import java.util.List;
import java.util.Properties;

import org.apache.commons.lang3.StringUtils;
import org.opensaml.saml2.metadata.IDPSSODescriptor;
import org.opensaml.saml2.metadata.KeyDescriptor;
import org.opensaml.saml2.metadata.impl.EntityDescriptorImpl;
import org.opensaml.saml2.metadata.provider.FilesystemMetadataProvider;
import org.opensaml.saml2.metadata.provider.MetadataProviderException;
import org.opensaml.xml.XMLObject;
import org.opensaml.xml.parse.BasicParserPool;
import org.opensaml.xml.security.credential.UsageType;
import org.opensaml.xml.signature.KeyInfo;
import org.opensaml.xml.signature.X509Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.model.security.saml.MetadataSource;
import com.wavemaker.commons.util.PropertiesFileUtils;
import com.wavemaker.commons.util.WMIOUtils;
import com.wavemaker.runtime.security.provider.saml.util.FileDownload;

/**
 * Created by ArjunSahasranam on 28/11/16.
 */
public class LoadKeyStore {

    private static final Logger logger = LoggerFactory.getLogger(LoadKeyStore.class);

    private static final String PROVIDERS_SAML_IDP_METADATA_FILE = "providers.saml.idpMetadataFile";
    private static final String PROVIDERS_SAML_IDP_METADATA_URL = "providers.saml.idpMetadataUrl";
    private static final String PROVIDERS_SAML_IDP_METADATA_SOURCE = "providers.saml.idpMetadataSource";

    private static final String PROVIDERS_SAML_KEY_STORE_FILE = "providers.saml.keyStoreFile";
    private static final String PROVIDERS_SAML_KEY_STORE_PASSWORD = "providers.saml.keyStorePassword";
    private static final String KEY = "idpkey";

    public void load() {
        File file = new File(getFileURI("securityService.properties"));
        if (file.exists()) {
            final Properties properties = PropertiesFileUtils.loadProperties(file);
            final String idpMetadataUrl = properties.getProperty(PROVIDERS_SAML_IDP_METADATA_URL);
            final String idpMetadataFile = properties.getProperty(PROVIDERS_SAML_IDP_METADATA_FILE);
            final String idpMetadatSource = properties.getProperty(PROVIDERS_SAML_IDP_METADATA_SOURCE);
            final String keyStoreFileName = properties.getProperty(PROVIDERS_SAML_KEY_STORE_FILE);
            final String keyStorePassword = properties.getProperty(PROVIDERS_SAML_KEY_STORE_PASSWORD);

            if (StringUtils.isNotBlank(keyStoreFileName) && StringUtils.isNotBlank(keyStorePassword)) {
                File keyStoreFile = new File(getFileURI("saml/" + keyStoreFileName));
                InputStream resourceAsStream = null; // stream closed in load method.
                try {
                    resourceAsStream = new FileInputStream(keyStoreFile);
                } catch (FileNotFoundException e) {
                    throw new WMRuntimeException("File" + keyStoreFileName + "not found", e);
                }
                final KeyStore keyStore = load(resourceAsStream, keyStorePassword);
                String idpPublicKey = null;
                if (MetadataSource.URL.name().equals(idpMetadatSource) && StringUtils.isNotBlank(idpMetadataUrl)) {
                    idpPublicKey = loadSAMLIdpMetadataFromUrl(idpMetadataUrl,
                            new File(getFileURI("/saml/metadata/" + SAMLConstants.IDP_METADATA_XML)).getAbsolutePath());
                } else if (MetadataSource.FILE.name().equals(idpMetadatSource) && StringUtils.isNotBlank(idpMetadataFile)){
                    idpPublicKey = loadSAMLIdpMetadataFromFile(idpMetadataFile);
                }
                if (idpPublicKey == null) {
                    throw new WMRuntimeException("Could not find public key in " + keyStoreFile.getName());
                }

                final boolean success = importCertificate(keyStore, KEY, idpPublicKey);
                if (success) {
                    saveKeyStore(keyStore, keyStoreFile, keyStorePassword);
                } else {
                    logger.info("Certificate with {} already found", KEY);
                }
            } else {
                logger.info("saml properties not found or configured");
            }
        }
    }

    private KeyStore load(InputStream keyStoreIS, String password) {
        logger.info("load keystore");
        KeyStore keystore = null;
        try {
            keystore = KeyStore.getInstance(KeyStore.getDefaultType());
            keystore.load(keyStoreIS, password.toCharArray());
        } catch (CertificateException | NoSuchAlgorithmException | KeyStoreException | IOException e) {
            throw new WMRuntimeException("Error creating keystore", e);
        } finally {
            WMIOUtils.closeSilently(keyStoreIS);
        }
        return keystore;
    }

    private String loadSAMLIdpMetadataFromUrl(final String idpMetadataUrl, String filePath) {
        File idpMetadataFile = new File(filePath);
        logger.info("load metadata for {}", idpMetadataUrl);
        try {
            FileDownload fileDownload = new FileDownload();
            idpMetadataFile = fileDownload.download(idpMetadataUrl, new File(filePath));
        } catch (WMRuntimeException e) {
            logger.info("Failed to download metadata file for url {}", idpMetadataUrl, e);
        }
        return readMetadataFile(idpMetadataFile);
    }

    private String loadSAMLIdpMetadataFromFile(String idpMetadataFilePath) {
        logger.info("load metadata for {}", idpMetadataFilePath);
        File idpMetadataFile = new File(getFileURI(idpMetadataFilePath));
        return readMetadataFile(idpMetadataFile);
    }

    private String readMetadataFile(File idpMetadataFile){
        XMLObject metadata = null;
        FilesystemMetadataProvider fileSystemMetadataProvider = null;
        try {
            fileSystemMetadataProvider = new FilesystemMetadataProvider(idpMetadataFile);
            fileSystemMetadataProvider.setParserPool(new BasicParserPool());
            fileSystemMetadataProvider.initialize();
            metadata = fileSystemMetadataProvider.getMetadata();
        } catch (MetadataProviderException e) {
            throw new WMRuntimeException("Failed to read idp metadata ", e);
        } finally {
            if (fileSystemMetadataProvider != null)
                fileSystemMetadataProvider.destroy();
        }
        final IDPSSODescriptor idpssoDescriptor = ((EntityDescriptorImpl) metadata).getIDPSSODescriptor(SAMLConstants.SAML_2_0_PROTOCOL);
        final List<KeyDescriptor> keyDescriptors = idpssoDescriptor.getKeyDescriptors();
        for (KeyDescriptor keyDescriptor : keyDescriptors) {
            if (UsageType.SIGNING == keyDescriptor.getUse()) {
                final KeyInfo keyInfo = keyDescriptor.getKeyInfo();
                final X509Data x509Data = keyInfo.getX509Datas().get(0);
                final org.opensaml.xml.signature.X509Certificate x509Certificate = x509Data.getX509Certificates().get(0);
                return com.wavemaker.commons.util.StringUtils.removeLineFeed(x509Certificate.getValue());
            }
        }
        return null;
    }

    private String createIdpCertificate(final String idpPublicKey) {
        logger.info("create certificate for {}", idpPublicKey);
        StringBuilder idpCertificateBuilder = new StringBuilder();
        idpCertificateBuilder.append("-----BEGIN CERTIFICATE-----\n");
        idpCertificateBuilder.append(idpPublicKey + "\n");
        idpCertificateBuilder.append("-----END CERTIFICATE-----\n");
        return idpCertificateBuilder.toString();
    }

    private boolean importCertificate(KeyStore keystore, String keyAlias, String idpPublicKey) {
        logger.info("import certificate for {} with key {}", idpPublicKey, keyAlias);
        InputStream certIn = null;
        try {
            if (keystore.containsAlias(keyAlias)) {
                return false;
            }
            String idpPublicCertificate = createIdpCertificate(idpPublicKey);
            certIn = new ByteArrayInputStream(idpPublicCertificate.getBytes());
            CertificateFactory cf = CertificateFactory.getInstance("X.509");
            while (certIn.available() > 0) {
                Certificate cert = cf.generateCertificate(certIn);
                keystore.setCertificateEntry(keyAlias, cert);
            }
        } catch (CertificateException | KeyStoreException | IOException e) {
            throw new WMRuntimeException("Error importing certificate to keystore", e);
        } finally {
            WMIOUtils.closeSilently(certIn);
        }
        return true;
    }

    private void saveKeyStore(KeyStore keyStore, File keyStoreFile, String password) {
        logger.info("save keystore");
        FileOutputStream stream = null;
        try {
            stream = new FileOutputStream(keyStoreFile);
            keyStore.store(stream, password.toCharArray());
        } catch (KeyStoreException | IOException | NoSuchAlgorithmException | CertificateException e) {
            throw new WMRuntimeException("Error saving keystore", e);
        } finally {
            WMIOUtils.closeSilently(stream);
        }
    }

    private URI getFileURI(String filePath){
        final ClassLoader contextClassLoader = Thread.currentThread().getContextClassLoader();
        final URL resource = contextClassLoader.getResource(filePath);
        URI uri = null;
        try {
            uri = resource.toURI();
            return uri;
        } catch (URISyntaxException e) {
           new WMRuntimeException("File not found", e);
        }
        return uri;
    }

}
