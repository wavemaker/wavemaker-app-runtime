package com.wavemaker.runtime.json;

import java.io.IOException;

import org.springframework.data.domain.Sort;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;

/**
 * @author Sujith Simon
 * Created on : 8/10/18
 */

public class SortJsonSerializer extends JsonSerializer<Sort> {

    @Override
    public void serialize(Sort orders, JsonGenerator jsonGenerator, SerializerProvider serializerProvider) throws IOException {
        jsonGenerator.writeStartArray();
        orders.iterator().forEachRemaining(o -> {
            try {
                jsonGenerator.writeObject(o);
            } catch (IOException e) {
                throw new WMRuntimeException(MessageResource.INVALID_OBJECT, o.getClass().getName(), o);
            }
        });
        jsonGenerator.writeEndArray();
    }

    @Override
    public Class<Sort> handledType() {
        return Sort.class;
    }
}