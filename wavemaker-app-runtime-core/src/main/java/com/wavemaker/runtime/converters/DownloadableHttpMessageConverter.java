package com.wavemaker.runtime.converters;

import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.file.model.Downloadable;
import com.wavemaker.studio.common.WMRuntimeException;
import com.wavemaker.studio.common.util.IOUtils;
import org.apache.commons.lang3.StringUtils;
import org.apache.tika.Tika;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.HttpOutputMessage;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.converter.HttpMessageNotWritableException;
import org.springframework.http.server.ServletServerHttpResponse;

import java.io.IOException;
import java.io.InputStream;

/**
 * @Author: sowmyad
 */
public class DownloadableHttpMessageConverter extends WMCustomAbstractHttpMessageConverter<Downloadable> {

    public DownloadableHttpMessageConverter() {
        super(MediaType.ALL);
    }
    @Override
    protected boolean supports(Class<?> clazz) {
       return Downloadable.class.isAssignableFrom(clazz);
    }

    @Override
    protected DownloadResponse readInternal(Class<? extends Downloadable> clazz, HttpInputMessage inputMessage) throws IOException, HttpMessageNotReadableException {
       throw new WMRuntimeException("Does not support DownloadResponse de-serialization");
    }

    @Override
    protected void writeInternal(Downloadable downloadable, HttpOutputMessage outputMessage) throws IOException, HttpMessageNotWritableException {

        ServletServerHttpResponse servletServerHttpResponse = (ServletServerHttpResponse)outputMessage;
        InputStream contents = downloadable.getContents();
        if (contents != null) {
            String fileName = downloadable.getFileName();
            String contentType = StringUtils.isNotBlank(downloadable.getContentType()) ? downloadable.getContentType() : new Tika().detect(fileName);
            servletServerHttpResponse.getServletResponse().setHeader("Content-Disposition", "attachment;filename=\"" + fileName + "\"");
            servletServerHttpResponse.getServletResponse().setContentType(contentType);
            if(downloadable.getContentLength() != null){
                servletServerHttpResponse.getServletResponse().setContentLength(downloadable.getContentLength());
            }
            IOUtils.copy(downloadable.getContents(), servletServerHttpResponse.getServletResponse().getOutputStream(), true, false);
        }
    }
}

