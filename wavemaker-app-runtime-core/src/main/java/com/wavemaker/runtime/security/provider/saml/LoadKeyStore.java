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
import org.opensaml.saml2.metadata.provider.FileBackedHTTPMetadataProvider;
import org.opensaml.saml2.metadata.provider.MetadataProviderException;
import org.opensaml.xml.XMLObject;
import org.opensaml.xml.parse.BasicParserPool;
import org.opensaml.xml.security.credential.UsageType;
import org.opensaml.xml.signature.KeyInfo;
import org.opensaml.xml.signature.X509Data;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.IOUtils;
import com.wavemaker.studio.common.util.PropertiesFileUtils;

/**
 * Created by ArjunSahasranam on 28/11/16.
 */
public class LoadKeyStore {

    private static final Logger logger = LoggerFactory.getLogger(LoadKeyStore.class);

    private static final String PROVIDERS_SAML_IDP_METADATA_URL = "providers.saml.idpMetadataUrl";
    private static final String PROVIDERS_SAML_KEY_STORE_FILE = "providers.saml.keyStoreFile";
    private static final String PROVIDERS_SAML_KEY_STORE_PASSWORD = "providers.saml.keyStorePassword";
    private static final String KEY = "idpkey";

    public void load() {
        File file = new File(getFileURI("securityService.properties"));
        if (file.exists()) {
            final Properties properties = PropertiesFileUtils.loadProperties(file);
            final String idpMetadataUrl = properties.getProperty(PROVIDERS_SAML_IDP_METADATA_URL);
            final String keyStoreFileName = properties.getProperty(PROVIDERS_SAML_KEY_STORE_FILE);
            final String keyStorePassword = properties.getProperty(PROVIDERS_SAML_KEY_STORE_PASSWORD);
            if (StringUtils.isNotBlank(idpMetadataUrl) && StringUtils.isNotBlank(keyStoreFileName) && StringUtils.isNotBlank(keyStorePassword)) {
                File keyStoreFile = new File(getFileURI("saml/" + keyStoreFileName));
                InputStream resourceAsStream = null; // stream closed in load method.
                try {
                    resourceAsStream = new FileInputStream(keyStoreFile);
                } catch (FileNotFoundException e) {
                    new WMRuntimeException("File" + keyStoreFileName + "not found", e);
                }
                final KeyStore keyStore = load(resourceAsStream, keyStorePassword);

                final String idpPublicKey = loadSAMLIdpMetadataUrl(idpMetadataUrl,
                        new File(getFileURI("/saml/metadata/" + SAMLConstants.IDP_METADATA_XML)).getAbsolutePath());
                if (idpPublicKey == null) {
                    throw new WMRuntimeException("Could not find public key in " + keyStoreFile.getAbsolutePath());
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
            IOUtils.closeSilently(keyStoreIS);
        }
        return keystore;
    }

    private String loadSAMLIdpMetadataUrl(final String url, String filePath) {
        logger.info("load metadata for {}", url);
        String x509CertificateValue = null;
        XMLObject metadata = null;
        try {
            FileBackedHTTPMetadataProvider httpMetadataProvider = new FileBackedHTTPMetadataProvider(url, 15000, filePath);
            httpMetadataProvider.setParserPool(new BasicParserPool());
            httpMetadataProvider.initialize();
            metadata = httpMetadataProvider.getMetadata();
        } catch (MetadataProviderException e) {
            throw new WMRuntimeException("Failed to read idp metadata from url " + url, e);
        }
        final IDPSSODescriptor idpssoDescriptor = ((EntityDescriptorImpl) metadata)
                .getIDPSSODescriptor("urn:oasis:names:tc:SAML:2.0:protocol");
        final List<KeyDescriptor> keyDescriptors = idpssoDescriptor.getKeyDescriptors();
        for (KeyDescriptor keyDescriptor : keyDescriptors) {
            if (UsageType.SIGNING == keyDescriptor.getUse()) {
                final KeyInfo keyInfo = keyDescriptor.getKeyInfo();
                final X509Data x509Data = keyInfo.getX509Datas().get(0);
                final org.opensaml.xml.signature.X509Certificate x509Certificate = x509Data.getX509Certificates().get(0);
                x509CertificateValue = x509Certificate.getValue();
            }
        }

        return x509CertificateValue;
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
            IOUtils.closeSilently(certIn);
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
            IOUtils.closeSilently(stream);
        }
    }

    private URI getFileURI(String filePath) {
        final ClassLoader contextClassLoader = Thread.currentThread().getContextClassLoader();
        final URL resource = contextClassLoader.getResource(filePath);
        URI uri = null;
        try {
            uri = resource.toURI();
            return uri;
        } catch (URISyntaxException e) {
            new WMRuntimeException("File " + filePath + " not found", e);
        }
        return uri;
    }
}
