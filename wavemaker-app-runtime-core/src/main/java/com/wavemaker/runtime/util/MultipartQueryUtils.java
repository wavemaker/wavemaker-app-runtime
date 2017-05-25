package com.wavemaker.runtime.util;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.wavemaker.commons.InvalidInputException;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.commons.json.JSONUtils;
import com.wavemaker.runtime.data.model.queries.QueryParameter;

/**
 * @author <a href="mailto:dilip.gundu@wavemaker.com">Dilip Kumar</a>
 * @since 5/5/17
 */
public class MultipartQueryUtils {

    private static final Logger LOGGER = LoggerFactory.getLogger(MultipartQueryUtils.class);

    public static <T> T readContent(MultipartHttpServletRequest request, Class<T> type) {
        MultipartFile multipartFile = request.getFile(WMMultipartUtils.WM_DATA_JSON);
        T instance;
        try {
            if (multipartFile == null) {
                final String wmJson = request.getParameter(WMMultipartUtils.WM_DATA_JSON);
                if (StringUtils.isBlank(wmJson)) {
                    LOGGER.error("Request does not have wm_data_json multipart data");
                    throw new InvalidInputException("Invalid Input : wm_data_json part can not be NULL or Empty");
                }
                instance = JSONUtils.toObject(wmJson, type);
            } else {
                instance = JSONUtils.toObject(multipartFile.getInputStream(), type);
            }
        } catch (IOException e) {
            throw new WMRuntimeException("Error while reading wm data body", e);
        }
        return instance;
    }

    public static <T extends QueryParameter> void setMultiparts(
            List<T> parameters, MultiValueMap<String, MultipartFile> parts) {
        if (!parts.isEmpty()) {
            for (final String partName : parts.keySet()) {
                if (!WMMultipartUtils.WM_DATA_JSON.equals(partName)) {
                    final T parameter = findParameter(parameters, partName);
                    try {
                        parameter.setTestValue(parts.getFirst(partName).getBytes());
                    } catch (IOException e) {
                        throw new WMRuntimeException("Error while reading multipart request for parameter" + partName,
                                e);
                    }
                }
            }
        }
    }

    private static <T extends QueryParameter> T findParameter(List<T> parameters, String name) {
        for (final T parameter : parameters) {
            if (Objects.equals(parameter.getName(), name)) {
                return parameter;
            }
        }
        throw new WMRuntimeException("Parameter found with name: " + name);
    }
}
