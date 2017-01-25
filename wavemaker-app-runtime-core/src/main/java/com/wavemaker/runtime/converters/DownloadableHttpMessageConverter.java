/**
 * Copyright © 2013 - 2016 WaveMaker, Inc.
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
package com.wavemaker.runtime.converters;

import com.wavemaker.runtime.file.model.DownloadResponse;
import com.wavemaker.runtime.file.model.Downloadable;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.util.IOUtils;
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
            if(downloadable.isInline()){
                servletServerHttpResponse.getServletResponse().setHeader("Content-Disposition", "inline;filename=\"" + fileName + "\"");
            }else{
                servletServerHttpResponse.getServletResponse().setHeader("Content-Disposition", "attachment;filename=\"" + fileName + "\"");
            }
            servletServerHttpResponse.getServletResponse().setContentType(contentType);
            if (downloadable.getContentLength() != null){
                servletServerHttpResponse.getServletResponse().setContentLength(downloadable.getContentLength());
            }
            IOUtils.copy(downloadable.getContents(), servletServerHttpResponse.getServletResponse().getOutputStream(), true, false);
        }
    }
}

