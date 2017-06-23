/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.wavemaker.runtime.util;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Field;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;
import java.net.URLConnection;
import java.sql.Blob;
import java.sql.SQLException;
import java.util.Map;
import java.util.Random;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.commons.io.IOUtils;
import org.apache.commons.lang.RandomStringUtils;
import org.apache.commons.lang3.StringUtils;
import org.hibernate.Hibernate;
import org.hibernate.Session;
import org.hibernate.SessionFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.google.common.base.Optional;
import com.wavemaker.commons.InvalidInputException;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.WMAppContext;
import com.wavemaker.runtime.WMAppObjectMapper;
import com.wavemaker.runtime.file.model.DownloadResponse;
import net.sf.jmimemagic.Magic;
import net.sf.jmimemagic.MagicException;
import net.sf.jmimemagic.MagicMatch;
import net.sf.jmimemagic.MagicMatchNotFoundException;
import net.sf.jmimemagic.MagicParseException;

/**
 * @author sunilp
 */
public class WMMultipartUtils {

    private static final Logger LOGGER = LoggerFactory.getLogger(WMMultipartUtils.class);

    private static final int READ_LIMIT_FOR_CONTENT_TYPE = 2048;
    private static final int FILE_NAME_LENGTH = 12;

    public static final String WM_DATA_JSON = "wm_data_json";

    public static final String BYTE_ARRAY = "byte[]";

    public static final String BLOB = "Blob";

    public static <T> T toObject(MultipartHttpServletRequest multipartHttpServletRequest, Class<T> instance) {
        return toObject(multipartHttpServletRequest, instance, null);
    }

    public static <T> T toObject(
            MultipartHttpServletRequest multipartHttpServletRequest, Class<T> instance, String serviceId) {
        T t = null;
        try {
            MultipartFile multipartFile = multipartHttpServletRequest.getFile(WM_DATA_JSON);
            if (multipartFile == null) {
                final String wmJson = multipartHttpServletRequest.getParameter(WM_DATA_JSON);
                if (StringUtils.isBlank(wmJson)) {
                    LOGGER.error("Request does not have wm_data_json multipart data");
                    throw new InvalidInputException("Invalid Input : wm_data_json part can not be NULL or Empty");
                }
                t = toObject(wmJson, instance);
            } else {
                t = toObject(multipartFile, instance);
            }
            setMultipartsToObject(multipartHttpServletRequest.getFileMap(), t, serviceId);
        } catch (IOException | IllegalAccessException | InvocationTargetException | NoSuchFieldException | NoSuchMethodException | SQLException e) {
            LOGGER.error("Exception while creating a new Instance with information: {}", t);
            throw new WMRuntimeException("Exception while preparing multipart request", e);
        }
        return t;
    }

    public static <T> T toObject(MultipartFile multipartFile, Class<T> instance) throws IOException {
        WMAppObjectMapper objectMapper = WMAppObjectMapper.getInstance();
        return objectMapper.readValue(multipartFile.getInputStream(), instance);
    }

    public static <T> T toObject(String json, Class<T> instance) throws IOException {
        WMAppObjectMapper objectMapper = WMAppObjectMapper.getInstance();
        return objectMapper.readValue(json, instance);
    }


    /**
     * This Api is used to update blob content from old instance to new instance when blob type content is NULL in the
     * new instance
     *
     * @param oldInstance : persisted instance.
     * @param newInstance : changes in the persisted instance.
     * @param <T>
     * @return returns newInstance with updated blob content
     */
    public static <T> T updateLobsContent(T oldInstance, T newInstance) {
        Field[] fields = newInstance.getClass().getDeclaredFields();
        for (Field field : fields) {
            String type = field.getType().getSimpleName();
            if (BYTE_ARRAY.equals(type) || BLOB.equals(type)) {
                String getMethodName = "get" + StringUtils.capitalize(field.getName());
                try {
                    Method getMethod = newInstance.getClass().getMethod(getMethodName, new Class<?>[]{});
                    Object object = getMethod.invoke(newInstance, new Object[]{});
                    if (object == null || (object instanceof byte[] && ((byte[]) object).length == 0)) {
                        String setMethodName = "set" + StringUtils.capitalize(field.getName());
                        Method setMethod = newInstance.getClass().getMethod(setMethodName, field.getType());
                        Object oldObject = getMethod.invoke(oldInstance, new Object[]{});
                        setMethod.invoke(newInstance, oldObject);
                    }
                } catch (NoSuchMethodException | IllegalAccessException | InvocationTargetException e) {
                    LOGGER.error("Failed to update blob content", e);
                    throw new WMRuntimeException("Failed to update blob content", e);
                }
            }
        }
        return newInstance;
    }

    private static <T> T setMultipartsToObject(
            Map<String, MultipartFile> multiparts, T instance,
            String serviceId) throws IOException, NoSuchFieldException, NoSuchMethodException, IllegalAccessException, InvocationTargetException, SQLException {
        Class aClass = instance.getClass();
        for (String part : multiparts.keySet()) {
            if (!part.equals(WM_DATA_JSON)) {
                Field field = aClass.getDeclaredField(part);
                field.setAccessible(true);
                String methodName = "set" + StringUtils.capitalize(field.getName());
                Method method = aClass.getMethod(methodName, (Class<?>) field.getType());
                MultipartFile multipartFile = multiparts.get(part);
                invokeMethod(instance, multipartFile.getInputStream(), method, field, serviceId);
            }
        }
        return instance;
    }

    private static <T> T invokeMethod(
            T instance, InputStream inputStream, Method method, Field field,
            String serviceId) throws IOException, IllegalAccessException, InvocationTargetException, SQLException {
        byte[] byteArray = IOUtils.toByteArray(inputStream);
        if (field.getType().isInstance("")) {
            String content = com.wavemaker.commons.util.IOUtils.toString(inputStream);
            method.invoke(instance, content);
        } else if (BYTE_ARRAY.equals(field.getType().getSimpleName())) {
            method.invoke(instance, byteArray);
        } else if (BLOB.equals(field.getType().getSimpleName())) {
            SessionFactory sessionFactory = WMAppContext.getInstance().getSpringBean(serviceId + "SessionFactory");
            Session session = sessionFactory.openSession();
            try {
                session = sessionFactory.openSession();
                Blob blob = Hibernate.getLobCreator(session)
                        .createBlob(new ByteArrayInputStream(byteArray), byteArray.length);
                method.invoke(instance, blob);
            } finally {
                if (session != null) {
                    session.close();
                }
            }
        } else {
            LOGGER.error("Casting multipart {} to {} is not supported", field.getName(),
                    field.getType().getSimpleName());
            throw new WMRuntimeException("Casting multipart " + field.getName() + " to " + field.getType()
                    .getSimpleName() + " is not supported");
        }
        return instance;
    }

    public static byte[] toByteArray(MultipartFile file) {
        try {
            return file == null ? null : file.getBytes();
        } catch (IOException e) {
            throw new WMRuntimeException("Error while reading multi part file", e);
        }
    }

    /**
     * get a match from a stream of data
     *
     * @param data bytes of data
     * @return Guessed content type of given bytes
     * @throws MagicException Failed to Guess!
     */
    public static String guessContentType(byte[] data) throws MagicException {
        return getMagicMatch(data).getMimeType();
    }

    /**
     * get a match from a stream of data
     *
     * @param data bytes of data
     * @return Guessed extension of given bytes
     * @throws MagicException Failed to Guess!
     */
    public static String guessExtension(byte[] data) throws MagicException {
        return getMagicMatch(data).getExtension();
    }

    /**
     * Generate Http response for a field in any Instance
     *
     * @param instance any Instance
     * @param fieldName name of the field
     * @param httpServletRequest to prepare content type
     * @param httpServletResponse to generate response for the given field
     */
    public static <T> void buildHttpResponseForBlob(
            T instance, String fieldName, HttpServletRequest httpServletRequest,
            HttpServletResponse httpServletResponse) {
        try {
            byte[] bytes = getBlobBytes((T) instance, fieldName);
            httpServletResponse.setContentType(getMatchingContentType(bytes, httpServletRequest));
            httpServletResponse.setHeader("Content-Disposition",
                    "filename=" + fieldName + new Random().nextInt(99) + ";size=" + bytes.length);
            int contentLength = IOUtils.copy(new ByteArrayInputStream(bytes), httpServletResponse.getOutputStream());
            httpServletResponse.setContentLength(contentLength);
        } catch (IOException | NoSuchMethodException | IllegalAccessException | InvocationTargetException e) {
            throw new WMRuntimeException("Failed to prepare response for fieldName" + fieldName, e);
        }

    }

    public static <T> DownloadResponse buildDownloadResponseForBlob(
            T instance, String fieldName, HttpServletRequest httpServletRequest, boolean download) {
        DownloadResponse downloadResponse = new DownloadResponse();
        try {
            String filename = httpServletRequest.getParameter("filename");
            if (StringUtils.isBlank(filename)) {
                filename = fieldName + new Random().nextInt(99);
            }
            byte[] bytes = getBlobBytes(instance, fieldName);
            downloadResponse.setContents(new ByteArrayInputStream(bytes));
            downloadResponse.setContentType(getMatchingContentType(bytes, httpServletRequest));
            downloadResponse.setFileName(filename);
            downloadResponse.setInline(!download);
        } catch (IOException | NoSuchMethodException | IllegalAccessException | InvocationTargetException e) {
            throw new WMRuntimeException("Failed to prepare response for fieldName" + fieldName, e);
        }
        return downloadResponse;
    }

    public static DownloadResponse buildDownloadResponse(
            HttpServletRequest request, InputStream is, boolean download) {
        DownloadResponse downloadResponse = new DownloadResponse();
        try {
            downloadResponse.setContents(is);
            downloadResponse.setInline(!download);

            String contentType = null;
            String filename = request.getParameter("filename");
            String extension = "";

            final Optional<MagicMatch> magicMatchOptional = getMagicType(is);
            if (magicMatchOptional.isPresent()) {
                contentType = magicMatchOptional.get().getMimeType();
                extension = "." + magicMatchOptional.get().getExtension();
            } else if (StringUtils.isNotBlank(filename)) {
                contentType = URLConnection.guessContentTypeFromName(filename);
            }

            if (StringUtils.isBlank(filename)) {
                filename = RandomStringUtils.randomAlphanumeric(FILE_NAME_LENGTH);
            }

            if (StringUtils.isBlank(contentType)) {
                contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
            }

            downloadResponse.setContentType(contentType);
            downloadResponse.setFileName(filename + extension);

        } catch (IOException | MagicException e) {
            throw new WMRuntimeException("Failed to prepare response.", e);
        }
        return downloadResponse;
    }

    private static <T> byte[] getBlobBytes(
            final T instance,
            final String fieldName) throws NoSuchMethodException, IllegalAccessException, InvocationTargetException, IOException {
        String methodName = "get" + StringUtils.capitalize(fieldName);
        Method method = instance.getClass().getMethod(methodName);
        byte[] bytes = null;
        if (BLOB.equals(method.getReturnType().getSimpleName())) {
            Blob blob = (Blob) method.invoke(instance);
            try {
                bytes = (blob != null) ? IOUtils.toByteArray(blob.getBinaryStream()) : null;
            } catch (SQLException e) {
                throw new WMRuntimeException("Failed to cast Blob content ", e);
            }
        } else if (BYTE_ARRAY.equals(method.getReturnType().getSimpleName())) {
            bytes = (byte[]) method.invoke(instance);
        }
        if (bytes == null) {
            throw new WMRuntimeException("Data is empty in column " + fieldName);
        }
        return bytes;
    }

    /**
     * Guess Content type for the given bytes using Magic apis.
     * If any exception using magic api, then getting content type from request.
     *
     * @param bytes stream of bytes
     * @param httpServletRequest
     * @return content type for given bytes
     */
    private static String getMatchingContentType(byte[] bytes, HttpServletRequest httpServletRequest) {
        String contentType = null;
        try {
            contentType = WMMultipartUtils.guessContentType(bytes);
        } catch (MagicException e) {
            //do nothing
        }
        if (contentType == null) {
            contentType = httpServletRequest.getContentType();
        }
        return contentType;
    }

    private static Optional<MagicMatch> getMagicType(final InputStream is) throws IOException, MagicException {
        Optional<MagicMatch> result = Optional.absent();
        if (is.markSupported()) {
            byte[] bytes = new byte[READ_LIMIT_FOR_CONTENT_TYPE];
            is.mark(READ_LIMIT_FOR_CONTENT_TYPE);
            is.read(bytes);
            is.reset();
            try {
                result = Optional.of(getMagicMatch(bytes));
            } catch (MagicException e) {
                // ignore
            }
        }
        return result;
    }

    private static MagicMatch getMagicMatch(byte[] data) throws MagicException {
        try {
            return Magic.getMagicMatch(data);
        } catch (MagicParseException | MagicMatchNotFoundException | MagicException e) {
            throw new MagicException("Failed to guess magic match for the given bytes", e);
        }
    }
}
