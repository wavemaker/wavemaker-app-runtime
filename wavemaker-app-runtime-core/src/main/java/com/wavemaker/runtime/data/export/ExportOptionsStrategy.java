package com.wavemaker.runtime.data.export;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.apache.commons.lang.WordUtils;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.util.CollectionUtils;

import com.wavemaker.commons.MessageResource;
import com.wavemaker.commons.WMRuntimeException;
import com.wavemaker.runtime.data.dao.validators.HqlPropertyResolver;
import com.wavemaker.runtime.data.util.JavaTypeUtils;


public class ExportOptionsStrategy {

    private static final Logger LOGGER = LoggerFactory.getLogger(ExportOptionsStrategy.class);

    private List<ExportField> exportFields;

    public ExportOptionsStrategy(ExportOptions options, Class<?> entityClass) {
        init(options, entityClass);
    }

    public List<String> getDisplayNames() {
        return this.exportFields.stream()
                .map(ExportField::getDisplayName)
                .collect(Collectors.toList());
    }

    public List<Object> readRowData(Object rowData) {
        return this.exportFields.stream()
                .map(exportField -> exportField.getValueProvider().getValue(rowData))
                .collect(Collectors.toList());
    }

    private void init(ExportOptions options, Class<?> entityClass) {
        List<FieldInfo> fieldInfos = options.getFields();

        if (CollectionUtils.isEmpty(fieldInfos)) {
            fieldInfos = includeAllFields(entityClass, "", true);
        }

        this.exportFields = fieldInfos.stream()
                .map(fieldInfo -> generateExportField(entityClass, fieldInfo))
                .collect(Collectors.toList());
    }

    private ExportField generateExportField(final Class<?> entityClass, final FieldInfo fieldInfo) {
        String displayName = getDisplayName(fieldInfo);
        FieldValueProvider provider;
        if (StringUtils.isNotBlank(fieldInfo.getField())) {
            final Optional<Field> fieldOptional = HqlPropertyResolver.findField(fieldInfo.getField(), entityClass);
            if (fieldOptional.isPresent()) {
                provider = new SimpleFieldValueProvider(fieldInfo.getField(), entityClass);
            } else {
                LOGGER.warn("Field: {} not present in the Entity class: {}", fieldInfo.getField(),
                        entityClass.getName());
                provider = object -> null;
            }
        } else if (StringUtils.isNotBlank(fieldInfo.getExpression())) {
            provider = new ExpressionFieldValueProvider(fieldInfo.getExpression());
        } else {
            throw new WMRuntimeException(
                    MessageResource.create("com.wavemaker.runtime.no.fieldName.or.expression"));
        }
        return new ExportField(displayName, provider);
    }


    private List<FieldInfo> includeAllFields(Class<?> dataClass, String prefix, boolean includeChildren) {
        try {
            List<FieldInfo> fieldInfos = new ArrayList<>();
            for (final Field field : dataClass.getDeclaredFields()) {
                String fieldName = field.getName();
                final Class<?> type = field.getType();
                if (JavaTypeUtils.isKnownType(type)) {
                    if (StringUtils.isNotBlank(prefix)) {
                        fieldName = prefix + '.' + fieldName;
                    }
                    fieldInfos.add(new FieldInfo(fieldName));
                } else if (includeChildren && JavaTypeUtils.isNotCollectionType(type)) {
                    fieldInfos.addAll(includeAllFields(Class.forName(type.getName()), fieldName, false));
                }
            }
            return fieldInfos;
        } catch (Exception e) {
            throw new WMRuntimeException(
                    MessageResource.create("com.wavemaker.runtime.unexpected.exportOptions.generation.error"), e);
        }
    }

    private String getDisplayName(FieldInfo fieldInfo) {
        if (StringUtils.isBlank(fieldInfo.getHeader())) {
            if (StringUtils.isNotBlank(fieldInfo.getField())) {
                return capitaliseFieldName(fieldInfo.getField());
            } else {
                return "";
            }
        } else {
            return fieldInfo.getHeader();
        }
    }

    private String capitaliseFieldName(String fieldName) {
        String[] nestedFieldNames = fieldName.split("\\.");
        StringBuilder displayName = new StringBuilder();
        for (int i = 0; i < nestedFieldNames.length; i++) {
            displayName.append(WordUtils.capitalize(nestedFieldNames[i]));
            if (i != nestedFieldNames.length - 1) {
                displayName.append(" ");
            }
        }
        return displayName.toString();
    }

}
