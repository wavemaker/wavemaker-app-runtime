package com.wavemaker.runtime;

import java.io.IOException;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;

/**
 * Created by sunilp on 10/12/14.
 */
public class ByteArraySerializer extends JsonSerializer<byte[]> {

    public ByteArraySerializer() {
        super();
    }

    @Override
    public void serialize(byte[] value, JsonGenerator jgen, SerializerProvider provider) throws IOException, JsonProcessingException {
        jgen.writeBinary("".getBytes());
    }
}
