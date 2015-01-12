package com.wavemaker.studio.common.json;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wavemaker.studio.common.util.IOUtils;

/**
 * Created by venuj on 19-05-2014.
 */
public class JSONUtils {

    public static String toJSON(Object object) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.writeValueAsString(object);
    }

    public static void toJSON(File outputFile, Object object) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        mapper.writeValue(outputFile, object);
    }

    public static <T> T toObject(String jsonString, Class<T> t) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        return (T) mapper.readValue(jsonString, t);
    }

    public static <T> T toObject(InputStream jsonStream, Class<T> t) throws IOException {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return (T) mapper.readValue(jsonStream, t);
        } finally {
            IOUtils.closeSilently(jsonStream);
        }
    }

    public static <T> T toObject(File file, Class<T> targetClass) throws IOException {
        return toObject(new FileInputStream(file), targetClass);
    }

}
