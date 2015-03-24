/**
 * Copyright (C) 2014 WaveMaker, Inc. All rights reserved.
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
package com.wavemaker.studio.common;

import com.wavemaker.studio.common.i18n.ResourceConstraint;
import com.wavemaker.studio.common.i18n.ResourceManager;
import com.wavemaker.studio.common.util.ClassUtils;

import java.lang.reflect.Field;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * All known resources defined in our resource bundles. These constants are meant to be used when instantiating a
 * WM(Runtime)Exception. The underlying message can be accessed using getMessage/getDetailMessage.
 *
 * @author Simon Toens
 */
public class MessageResource {

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource QUERY_CONV_FAILURE = new MessageResource("com.wavemaker.runtime.data$QueryConvFailure");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource CLASS_NOT_FOUND = new MessageResource("com.wavemaker.runtime.data$ClassNotFound");


    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource JSONRPC_CONTROLLER_METHOD_NOT_FOUND = new MessageResource("com.wavemaker.runtime.server$MethodNotFound");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONRPC_CONTROLLER_BAD_PARAMS_NON_EMPTY = new MessageResource(
            "com.wavemaker.runtime.server$BadParamsNonEmpty");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONRPC_CONTROLLER_BAD_PARAMS_UNKNOWN_TYPE = new MessageResource(
            "com.wavemaker.runtime.server$BadParamsUnknownType");

    // input: method name, class name
    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_BADMETHODOVERLOAD = new MessageResource("com.wavemaker.runtime.server$BadMethodOverload");

    // input name of method, name of declaring class (maybe through
    // ((Method)obj).getDeclaringClass())
    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_FAILEDINVOKE = new MessageResource("com.wavemaker.runtime.server$InvokeMethodFailed");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_PARAMTYPEGENERIC = new MessageResource("com.wavemaker.runtime.server$JSONParamTypeNoGenerics");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource SERVER_NOMETHODORID = new MessageResource("com.wavemaker.runtime.server$NoMethodIdFound");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource JSONPARAMETER_COULD_NOTLLOAD_TYPE = new MessageResource(
            "com.wavemaker.runtime.server$JSONParameterCouldNotLoadType");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource BOTH_ARGUMENT_TYPES = new MessageResource("com.wavemaker.runtime.server$BothArgumentTypes");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_PARSE_REQUEST = new MessageResource("com.wavemaker.runtime.server$FailedToParseRequest");

    // input: service id
    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNKNOWN_SERVICE = new MessageResource("com.wavemaker.runtime.service$UnknownService");

    // input: service type
    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNKNOWN_SERVICE_TYPE = new MessageResource("com.wavemaker.runtime.service$UnknownServiceType");

    // input: service type
    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource MULTIPLE_SERVICE_BEANS = new MessageResource("com.wavemaker.runtime.service$MultipleServiceBeans");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource SERVICEWIRE_ID_DUP = new MessageResource("com.wavemaker.runtime.service$DuplicateServiceIDs");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource EXPECTED_REFLECT_SW = new MessageResource("com.wavemaker.runtime.service.reflect$ExpectedReflectSW");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource NO_SERVICEWIRE = new MessageResource("com.wavemaker.runtime.service$NoServiceWireForService");

    // input: service id
    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource NO_SERVICE_GENERATOR = new MessageResource("com.wavemaker.runtime.service$NoServiceGenerator");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UTIL_FILEUTILS_PATHDNE = new MessageResource("com.wavemaker.studio.common.util$FileUtils_PathDNE");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UTIL_FILEUTILS_PATHNOTDIR = new MessageResource("com.wavemaker.studio.common.util$FileUtils_PathNotDir");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource NULL_CLASS = new MessageResource("com.wavemaker.studio.common.util$NullClass");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource STUDIO_UNKNOWN_LOCATION = new MessageResource("com.wavemaker.studio$UnknownStaticFileLocation");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource UTIL_FILEUTILS_REACHEDROOT = new MessageResource("com.wavemaker.studio.common.util$FileUtils_ReachedRoot");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_FAILED_PARSING = new MessageResource("com.wavemaker.studio.json$FailedParsing");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_TYPE_UNKNOWNRAWTYPE = new MessageResource("com.wavemaker.studio.json$Type_UnknownRawType");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_TYPE_UNKNOWNPARAMTYPE = new MessageResource("com.wavemaker.studio.json$Type_UnknownParameterType");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_TYPE_NOGENERICS = new MessageResource("com.wavemaker.studio.json$Type_NoGenerics");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_FAILED_GENERICARRAYTYPE = new MessageResource("com.wavemaker.studio.json$FailedGenericArrayType");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_FAILEDINSTANCE_MAP = new MessageResource("com.wavemaker.studio.json$FailedInstantiationMap");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_OBJECT_REQUIRED_FOR_MAP_CONVERSION = new MessageResource("com.wavemaker.studio.json$JSONObjectRequiredForMap");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource JSON_TYPEDEF_REQUIRED = new MessageResource("com.wavemaker.studio.json$TypeDefRequired");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_OBJECTTYPEDEF_REQUIRED = new MessageResource("com.wavemaker.studio.json$ObjectTypeDefRequired");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_FAILEDINSTANCE_COLLECTION = new MessageResource("com.wavemaker.studio.json$FailedInstantiationCollection");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_COLL_OR_ARRAY = new MessageResource("com.wavemaker.studio.json$UnknownCollectionType");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_COLL_IN_SET = new MessageResource("com.wavemaker.studio.json$UnknownCollInSet");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_UNHANDLED_TYPE = new MessageResource("com.wavemaker.studio.json$UnhandledType");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_PRIM_NEWINSTANCE_ARG_REQ = new MessageResource("com.wavemaker.studio.json$PrimitiveNewInstanceRequiresArg");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_NUMBER_TYPE = new MessageResource("com.wavemaker.studio.json$UnknownNumberType");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_FAILED_TO_CONVERT = new MessageResource("com.wavemaker.studio.json$FailedToConvert");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_OBJECT_TYPE = new MessageResource("com.wavemaker.studio.json$UnknownObjectType");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_NO_PROP_MATCHES_KEY = new MessageResource("com.wavemaker.studio.json$NoPropertyMatchKey");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_NO_WRITE_METHOD = new MessageResource("com.wavemaker.studio.json$NoWriteMethod");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_PRIMITIVE_TYPE = new MessageResource("com.wavemaker.studio.json$UnknownPrimitiveType");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_RAW_TYPE_NOT_CLASS = new MessageResource("com.wavemaker.studio.json$RawTypeNotClass");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_EXPECTED_COLLECTION = new MessageResource("com.wavemaker.studio.json$ExpectedCollection");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_TYPE = new MessageResource("com.wavemaker.studio.json$UnknownType");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_USE_FIELD_FOR_ARRAY = new MessageResource("com.wavemaker.studio.json$UseFieldForArray");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource JSON_NO_GETTER_IN_TYPE = new MessageResource("com.wavemaker.studio.json$NoGetterInType");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource ERROR_GETTING_PROPERTY = new MessageResource("com.wavemaker.studio.json$ErrorGettingProperty");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_BAD_HANDLE_TYPE = new MessageResource("com.wavemaker.studio.json$UnexpectedHandleType");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_CYCLE_FOUND = new MessageResource("com.wavemaker.studio.json$CycleFound");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_BAD_CYCLE_HANDLER = new MessageResource("com.wavemaker.studio.json$UnknownCycleHandler");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DATABASE_CONNECTION_EXCEPTION = new MessageResource("com.wavemaker.runtime.data$DBConnectionException");

    private static final Map<MessageResource, ResourceConstraint> annotations = new HashMap<MessageResource, ResourceConstraint>();

    static {
        List<Field> fields = ClassUtils.getPublicFields(MessageResource.class, MessageResource.class);
        populateAnnotationsMap(fields);
    }

    protected static void populateAnnotationsMap(List<Field> fields) {
        try {
            for (Field f : fields) {
                annotations.put((MessageResource) f.get(null), f.getAnnotation(ResourceConstraint.class));
            }
        } catch (IllegalAccessException ex) {
            throw new AssertionError(ex);
        }
    }

    private final String key;

    protected MessageResource(String key) {
        if (key == null) {
            throw new IllegalArgumentException("key cannot be null");
        }
        this.key = key;
    }

    public String getMessage() {
        return getMessage((Object[]) null);
    }

    public String getMessage(Object... args) {
        return getMessage(this.key, getNumArgsRequired(), args);
    }

    public String getMessageKey() {
        return this.key;
    }

    public int getNumArgsRequired() {
        return annotations.get(this).numArgs();
    }

    private String getMessage(String key, int numArgsRequired, Object... args) {
        if (numArgsRequired > 0) {
            if (args == null || args.length != numArgsRequired) {
                throw new IllegalArgumentException(key + ": " + "args don't match.  msg requires: " + numArgsRequired + " " + "passed in: "
                        + (args == null ? "null" : args.length));
            }
        }
        return ResourceManager.getInstance().getMessage(key, args);
    }

}
