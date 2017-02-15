package com.wavemaker.runtime.util;

import java.io.IOException;
import java.io.InputStream;

import org.apache.commons.lang3.StringUtils;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.AbstractHttpMessageConverter;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.util.StreamUtils;

import com.wavemaker.commons.rest.WmFileSystemResource;
import com.wavemaker.commons.util.IOUtils;

/**
 * Created by srujant on 14/2/17.
 */
public class WmFileSystemResourceConverter extends AbstractHttpMessageConverter<WmFileSystemResource> {


    @Override
    protected boolean supports(Class<?> clazz) {
        return WmFileSystemResource.class == clazz;
    }

    @Override
    protected WmFileSystemResource readInternal(Class<? extends WmFileSystemResource> clazz, HttpInputMessage inputMessage) throws IOException, HttpMessageNotReadableException {
        return null;
    }

    @Override
    protected MediaType getDefaultContentType(WmFileSystemResource wmFileSystemResource) throws IOException {
        String contentType = wmFileSystemResource.getContentType();
        if (StringUtils.isNotBlank(contentType)) {
            return MediaType.parseMediaType(contentType);
        } else {
            return super.getDefaultContentType(wmFileSystemResource);
        }
    }

    @Override
    protected void writeInternal(WmFileSystemResource wmFileSystemResource, HttpOutputMessage outputMessage)
            throws IOException, HttpMessageNotWritableException {

        InputStream in = wmFileSystemResource.getInputStream();
        try {
            StreamUtils.copy(in, outputMessage.getBody());
        } finally {
            IOUtils.closeSilently(in);
        }
    }

}
