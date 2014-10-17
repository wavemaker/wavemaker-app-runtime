package com.wavemaker.runtime.util;

import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.util.Iterator;
import java.util.Map;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wavemaker.common.InvalidInputException;
import com.wavemaker.common.WMRuntimeException;

/**
 * @author sunilp
 */
public class WMMultipartUtils {

    private static final Logger LOGGER = LoggerFactory.getLogger(WMMultipartUtils.class);

    public static final String WM_DATA_JSON = "wm_data_json";

    public static <T> T toObject(MultipartHttpServletRequest multipartHttpServletRequest, Class<T> instance) {
        T t = null;
        try {
            MultipartFile multipartFile = multipartHttpServletRequest.getFile(WM_DATA_JSON);
            if (multipartFile == null) {
                LOGGER.error("Request does not have wm_data_json multipart data");
                throw new InvalidInputException("Invalid Input : wm_data_json part can not be NULL or Empty");
            }
            t = toObject(multipartFile, instance);
            setMultipartsToObject(multipartHttpServletRequest.getFileMap(), t);
        } catch (IOException | IllegalAccessException | InvocationTargetException | NoSuchFieldException | NoSuchMethodException e) {
            LOGGER.error("Exception while creating a new employee with information: {}", t);
            throw new WMRuntimeException("Exception while preparing multipart request");
        }
        return t;
    }

    public static <T> T toObject(MultipartFile multipartFile, Class<T> instance) throws IOException {
        ObjectMapper mapper = new ObjectMapper();
        return mapper.readValue(multipartFile.getInputStream(), instance);
    }

    public static <T> T setMultipartsToObject(Map<String, MultipartFile> multiparts, T instance) throws IOException, NoSuchFieldException, NoSuchMethodException, IllegalAccessException, InvocationTargetException {
        Class aClass = instance.getClass();
        for (String part : multiparts.keySet()) {
            Field field = aClass.getDeclaredField(part);
            field.setAccessible(true);
            String methodName = "set" + StringUtils.capitalize(field.getName());
            Method method = aClass.getMethod(methodName, (Class<?>) field.getType());
            if (!part.equals(WM_DATA_JSON)) {
                MultipartFile multipartFile = multiparts.get(part);
                invokeMethod(instance, multipartFile.getInputStream(), method, field);
            }
        }
        return instance;
    }

    private static <T> T invokeMethod(T instance, InputStream inputStream, Method method, Field field) throws IOException, IllegalAccessException, InvocationTargetException {
        if (field.getType().isInstance(new String())) {
            String content = IOUtils.toString(inputStream);
            method.invoke(instance, content);
        } else if (field.getType().getSimpleName().equals("byte[]")) {
            byte[] byteArray = IOUtils.toByteArray(inputStream);
            method.invoke(instance, byteArray);
        } else {
            LOGGER.error("Casting multipart " + field.getName() + " to " + field.getType().getSimpleName() + " is not supported");
            throw new WMRuntimeException("Casting multipart " + field.getName() + " to " + field.getType().getSimpleName() + " is not supported");
        }
        return instance;
    }
}
