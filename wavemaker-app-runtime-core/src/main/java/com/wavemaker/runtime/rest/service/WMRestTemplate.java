/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 * <p>
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * <p>
 * http://www.apache.org/licenses/LICENSE-2.0
 * <p>
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.rest.service;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.function.Consumer;

import org.springframework.http.HttpEntity;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.lang.Nullable;
import org.springframework.web.client.HttpMessageConverterExtractor;
import org.springframework.web.client.RequestCallback;
import org.springframework.web.client.ResponseExtractor;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriTemplateHandler;

import com.wavemaker.runtime.util.WMRuntimeUtils;

/**
 * @author Uday Shankar
 */
public class WMRestTemplate extends RestTemplate {

    private UriTemplateHandler uriTemplateHandler = new CustomUriTemplateHandler();
    private Consumer<ClientHttpResponse> extractDataConsumer;

    public WMRestTemplate() {
        super(WMRuntimeUtils.getMessageConverters());
    }

    public RequestCallback getRequestEntityCallBack(Object requestBody) {
        return httpEntityCallback(requestBody);
    }

    public RequestCallback getRequestEntityCallBack(Object requestBody, Type responseType) {
        return httpEntityCallback(requestBody, responseType);
    }

    public <T> ResponseExtractor<ResponseEntity<T>> getResponseEntityExtractor(Type responseType) {
        return responseEntityExtractor(responseType);
    }

    public void setExtractDataConsumer(Consumer<ClientHttpResponse> extractDataConsumer) {
        this.extractDataConsumer = extractDataConsumer;
    }

    @Override
    public <T> ResponseExtractor<ResponseEntity<T>> responseEntityExtractor(Type responseType) {
        return new WmResponseEntityResponseExtractor<>(responseType);
    }

    @Override
    public UriTemplateHandler getUriTemplateHandler() {
        return this.uriTemplateHandler;
    }

    /**
     * Response extractor for {@link HttpEntity}.
     */
    private class WmResponseEntityResponseExtractor<T> implements ResponseExtractor<ResponseEntity<T>> {

        @Nullable
        private final HttpMessageConverterExtractor<T> delegate;

        public WmResponseEntityResponseExtractor(@Nullable Type responseType) {
            if (responseType != null && Void.class != responseType) {
                this.delegate = new HttpMessageConverterExtractor<>(responseType, getMessageConverters());
            } else {
                this.delegate = null;
            }
        }

        @Override
        public ResponseEntity<T> extractData(ClientHttpResponse response) throws IOException {
            if (extractDataConsumer != null) {
                response = new WmBufferingClientHttpResponseWrapper(response);
                extractDataConsumer.accept(response);
            }
            if (this.delegate != null) {
                T body = this.delegate.extractData(response);
                return ResponseEntity.status(response.getRawStatusCode()).headers(response.getHeaders()).body(body);
            } else {
                return ResponseEntity.status(response.getRawStatusCode()).headers(response.getHeaders()).build();
            }
        }
    }

}
