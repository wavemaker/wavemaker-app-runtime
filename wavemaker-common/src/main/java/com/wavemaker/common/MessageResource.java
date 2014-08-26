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
package com.wavemaker.common;

import java.lang.reflect.Field;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.wavemaker.common.util.ClassUtils;

/**
 * All known resources defined in our resource bundles. These constants are meant to be used when instantiating a
 * WM(Runtime)Exception. The underlying message can be accessed using getMessage/getDetailMessage.
 *
 * @author Simon Toens
 */
public class MessageResource {

    // input: service name, operation name, known operations
    @ResourceConstraint(numArgs = 3, hasDetailMsg = true)
    public static final MessageResource OPERATION_NOT_FOUND = new MessageResource("com.wavemaker.runtime.service$OperationNotFound");

    // input: operation name
    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource DUPLICATE_OPERATION = new MessageResource("com.wavemaker.runtime.service$DuplicateOperation");

    // input:
    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource CANNOT_ROLLBACK_TX = new MessageResource("com.wavemaker.runtime.data$CannotRollback");

    // input: query name, arguments passed to the query
    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource QUERY_NO_PARMS = new MessageResource("com.wavemaker.runtime.data$QueryDoesntTakeParams");

    // input: query name, required params
    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource QUERY_REQUIRES_PARAMS = new MessageResource("com.wavemaker.runtime.data$QueryRequiresParams");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource JSONRPC_CONTROLLER_METHOD_NOT_FOUND = new MessageResource("com.wavemaker.runtime.server$MethodNotFound");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONRPC_CONTROLLER_BAD_PARAMS_NON_EMPTY = new MessageResource(
            "com.wavemaker.runtime.server$BadParamsNonEmpty");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONRPC_CONTROLLER_BAD_PARAMS_UNKNOWN_TYPE = new MessageResource(
            "com.wavemaker.runtime.server$BadParamsUnknownType");

    // input: service name, length of classes list
    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_LISTSNOTEQUAL = new MessageResource("com.wavemaker.runtime.server$ListsNotEqual");

    // input: name of unhandled primitive type
    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_BADPRIMITIVETYPE = new MessageResource("com.wavemaker.runtime.server$CantHandlePrimitiveType");

    // input: value attempted to convert, type of value, destination type
    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_FAILEDCONVERSION = new MessageResource("com.wavemaker.runtime.server$FailedConversion");

    // input: value attempted to convert, type of value, destination type
    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_BADNUMBERCONVERSION = new MessageResource("com.wavemaker.runtime.server$BadNumberConversion");

    // input: value, type
    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_BADNUMBERFORMAT = new MessageResource("com.wavemaker.runtime.server$BadNumberFormat");

    // input: method name, class name
    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_BADMETHODOVERLOAD = new MessageResource("com.wavemaker.runtime.server$BadMethodOverload");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_NONHOMOGENEOUSARRAY = new MessageResource("com.wavemaker.runtime.server$NonHomogeneousReturn");

    // input name of method, name of declaring class (maybe through
    // ((Method)obj).getDeclaringClass())
    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_FAILEDINVOKE = new MessageResource("com.wavemaker.runtime.server$InvokeMethodFailed");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_NONARRAYSEQ = new MessageResource("com.wavemaker.runtime.server$NonArraySequenceConversion");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_PARAMTYPEGENERIC = new MessageResource("com.wavemaker.runtime.server$JSONParamTypeNoGenerics");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource JSONUTILS_NOGET = new MessageResource("com.wavemaker.runtime.server$JSONGetNotSupported");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource SERVER_NOMETHODORID = new MessageResource("com.wavemaker.runtime.server$NoMethodIdFound");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource SERVER_NOPARAMNAME = new MessageResource("com.wavemaker.runtime.server$NoParamNameFound");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource SERVER_NOREQUEST = new MessageResource("com.wavemaker.runtime.server$NoRequestFound");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource SERVER_NORESPONSE = new MessageResource("com.wavemaker.runtime.server$NoResponseFound");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource JSONPARAMETER_COULD_NOTLLOAD_TYPE = new MessageResource(
            "com.wavemaker.runtime.server$JSONParameterCouldNotLoadType");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource RUNTIME_UNINITIALIZED = new MessageResource("com.wavemaker.runtime.server$RuntimeUninitialized");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource BOTH_ARGUMENT_TYPES = new MessageResource("com.wavemaker.runtime.server$BothArgumentTypes");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_PARSE_REQUEST = new MessageResource("com.wavemaker.runtime.server$FailedToParseRequest");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = true)
    public static final MessageResource UNKNOWN_SERVICE_DEFINITION = new MessageResource("com.wavemaker.runtime.service$UnknownServiceDefinition");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource TYPE_NOT_FOUND = new MessageResource("com.wavemaker.runtime.service$TypeNotFound");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource NO_SERVICE_FROM_ID_TYPE = new MessageResource("com.wavemaker.runtime.service$NoServiceFromIdType");

    // input: service id
    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNKNOWN_SERVICE = new MessageResource("com.wavemaker.runtime.service$UnknownService");

    // input: service type
    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNKNOWN_SERVICE_TYPE = new MessageResource("com.wavemaker.runtime.service$UnknownServiceType");

    // input: service type
    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource MULTIPLE_SERVICE_BEANS = new MessageResource("com.wavemaker.runtime.service$MultipleServiceBeans");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource TOO_MANY_MODULES_FOR_EXTENSION_POINT = new MessageResource("com.wavemaker.runtime.module$MoreThanOneModule");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource MODULEWIRE_MISSING_NAME = new MessageResource("com.wavemaker.runtime.module$ModuleWireMissingName");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource MODULE_UNKNOWN_RESOURCE_TYPE = new MessageResource("com.wavemaker.runtime.module$ModuleUnknownResourceType");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource MODULE_BAD_NAME = new MessageResource("com.wavemaker.runtime.module$ModuleBadName");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource MODULE_DUPLICATE = new MessageResource("com.wavemaker.runtime.module$ModuleDuplicates");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource SERVICEWIRE_ID_DUP = new MessageResource("com.wavemaker.runtime.service$DuplicateServiceIDs");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource EXPECTED_REFLECT_SW = new MessageResource("com.wavemaker.runtime.service.reflect$ExpectedReflectSW");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource MODULE_NOT_FOUND = new MessageResource("com.wavemaker.runtime.module$ModuleNotFound");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource MODULE_UNINITIALIZED = new MessageResource("com.wavemaker.runtime.module$ModuleUninitialized");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource NO_MODULE_LOOKUP = new MessageResource("com.wavemaker.runtime.module$NoModuleLookupForURL");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource NO_MODULE_RESOURCE = new MessageResource("com.wavemaker.runtime.module$NoModuleResourceFound");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource NO_SERVICEWIRE = new MessageResource("com.wavemaker.runtime.service$NoServiceWireForService");

    // input: service id
    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource NO_SERVICE_GENERATOR = new MessageResource("com.wavemaker.runtime.service$NoServiceGenerator");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource LIB_DIR_NOT_DIR = new MessageResource("com.wavemaker.runtime.service$LibDirNotDir");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource WS_NULL_WSDL_URI = new MessageResource("com.wavemaker.runtime.ws$NullWsdlUri");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource WS_MISSING_TYPEMAPPER = new MessageResource("com.wavemaker.runtime.ws$MissingTypeMapper");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource WS_RPC_ENCODED_NOT_SUPPORTED = new MessageResource("com.wavemaker.runtime.ws$RpcEncodedNotSupported");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource WS_REST_WSDL_MISSING_URL = new MessageResource("com.wavemaker.runtime.ws$RestWsdlMissingUrl");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource PROVIDE_EITHER_WSDL_URL_OR_FILE = new MessageResource("com.wavemaker.runtime.ws$ProvideEitherWSDLURLOrFile");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource WS_WADL_METHOD_NOT_FOUND = new MessageResource("com.wavemaker.runtime.ws$WadlMethodNotFound");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource CONTENT_TYPE_IS_NOT_SUPPORTED = new MessageResource("com.wavemaker.runtime.ws$ContentTypeIsNotSupported");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_PARSE_RESPONSE = new MessageResource("com.wavemaker.runtime.ws$FailedToParseResponse");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_INVOKE_SERVICE = new MessageResource("com.wavemaker.runtime.ws$FailedToInvokeService");

    // input: name(s) of required property(ies)
    @ResourceConstraint(numArgs = 1, hasDetailMsg = true)
    public static final MessageResource MISSING_SYS_PROPERTIES = new MessageResource("com.wavemaker.platform$SysPropertyNotSet");

    // input: property name, path to file
    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource PROPERTY_MUST_BE_DIR = new MessageResource("com.wavemaker.platform$PropertyMustBeDir");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PROJECTCOPY_SOURCE_DNE = new MessageResource("com.wavemaker.platform$ProjectCopySourceDNE");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PROJECTCOPY_DEST_DE = new MessageResource("com.wavemaker.platform$ProjectCopyDestDE");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource PROJECT_DNE = new MessageResource("com.wavemaker.platform$ProjectDNE");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PROJECT_CONFLICT = new MessageResource("com.wavemaker.platform$ProjectConflict");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PROJECT_INVALID_NAME = new MessageResource("com.wavemaker.platform$ProjectInvalidName");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PROJECT_USERHOMEDNE = new MessageResource("com.wavemaker.platform$Project_UserHomeDNE");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PROJECT_DIR_DOES_NOT_EXIST = new MessageResource("com.wavemaker.platform$ProjectDirDoesNotExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource TEMPLATE_DOES_NOT_EXIST = new MessageResource("com.wavemaker.platform$TemplateDoesNotExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource TEMPLATE_ALREADY_EXIST = new MessageResource("com.wavemaker.platform$TemplateAlreadyExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_TEMPLATE = new MessageResource("com.wavemaker.platform$InvalidTemplate");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_PROJECT = new MessageResource("com.wavemaker.platform$InvalidProject");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PROJECT_ALREADY_EXIST = new MessageResource("com.wavemaker.platform$ProjectAlreadyExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_DELETE_TEMPLATE = new MessageResource("com.wavemaker.platform$FailedToDeleteTemplate");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_DELETE_PREFAB = new MessageResource("com.wavemaker.platform$FailedToDeletePrefab");


    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource SAVE_AS_NOT_POSSIBLE = new MessageResource("com.wavemaker.platform$SaveAsNotPossible");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource PAGECP_SOURCEDNE = new MessageResource("com.wavemaker.platform$Pages_Copy_SourcePageDNE");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource PAGECP_TARGET_EXISTS = new MessageResource("com.wavemaker.platform$Pages_Copy_TargetExists");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource PROJECT_NEWER_THAN_STUDIO = new MessageResource("com.wavemaker.platform$ProjectNewerThanStudio");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource NO_DATA_SERVICE_MGR_BEAN_FOUND = new MessageResource("com.wavemaker.platform$NoDataServiceMgrBeanFound");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource NO_PROJECT_FROM_SESSION = new MessageResource("com.wavemaker.platform$NoProjectFromSession");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource ADD_SRV_UPGRADE_NO_SPRING_FILE = new MessageResource("com.wavemaker.platform$AddServiceUpgrade_NoSpringFile");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PROJECTNAME_CONTAINS_SPECIAL_CHARACTER = new MessageResource("com.wavemaker.platform$ProjectNameContainsSpecialCharacter");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource PROJECT_TOO_MANY_SERVICE_WIRES = new MessageResource("com.wavemaker.platform.project$TooManyServiceWires");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource PROJECT_TOO_OLD_FOR_UPGRADE = new MessageResource("com.wavemaker.platform$ProjectTooOldForUpgrade");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UTIL_FILEUTILS_PATHDNE = new MessageResource("com.wavemaker.common.util$FileUtils_PathDNE");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UTIL_FILEUTILS_PATHNOTDIR = new MessageResource("com.wavemaker.common.util$FileUtils_PathNotDir");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource NULL_CLASS = new MessageResource("com.wavemaker.common.util$NullClass");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource STUDIO_PROJECT_UNKNOWN_TYPE = new MessageResource("com.wavemaker.studio$Project_UnknownType");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource STUDIO_UNKNOWN_SERVICE = new MessageResource("com.wavemaker.studio$ServiceUnknown");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource STUDIO_UNKNOWN_LOCATION = new MessageResource("com.wavemaker.studio$UnknownStaticFileLocation");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource THEME_NAME_CAN_NOT_BE_NULL_OR_EMPTY = new MessageResource("com.wavemaker.studio$ThemeNameCanNotBeNullOrEmpty");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource THEME_DOES_NOT_EXIST = new MessageResource("com.wavemaker.studio$ThemeDoesNotExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource THEME_ASSOCIATED = new MessageResource("com.wavemaker.studio$ThemeAssociated");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource THEME_ALREADY_EXIST_IN_PROJECT = new MessageResource("com.wavemaker.studio$ThemeAlreadyExistInProject");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource THEME_ALREADY_EXIST_IN_STUDIO = new MessageResource("com.wavemaker.studio$ThemeAlreadyExistInStudio");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_THEME = new MessageResource("com.wavemaker.studio$InvalidTheme");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_PREFAB = new MessageResource("com.wavemaker.studio$InvalidPrefab");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource CONFIGURATION_EXCEPTION = new MessageResource("com.wavemaker.studio$ConfigurationException");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PREFAB_PROPERTY_MISSING_IN_CONFIG_FILE = new MessageResource("com.wavemaker.studio$PrefabPropertyMissingInConfigFile");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource THEME_IS_INACTIVE = new MessageResource("com.wavemaker.studio$ThemeIsInactive");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource UTIL_FILEUTILS_REACHEDROOT = new MessageResource("com.wavemaker.common.util$FileUtils_ReachedRoot");

    // input: invalid service id, reason
    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource INVALID_SERVICE_ID = new MessageResource("com.wavemaker.platform$InvalidServiceId");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource SERVICE_ALREADY_EXIST = new MessageResource("com.wavemaker.platform$ServiceAlreadyExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource SAMPLE_DATABASE_ALREADY_EXIST = new MessageResource("com.wavemaker.platform$SampleDataBaseAlreadyExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNABLE_TO_FIND_FOREIGN_KEY_COLUMN = new MessageResource("com.wavemaker.platform$UnableToFindForeignKeyColumn");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource INVALID_CLASS_NAME = new MessageResource("com.wavemaker.platform$InvalidClassName");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_SERVICE_DEF_NO_ID = new MessageResource("com.wavemaker.platform$InvalidServiceNoId");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource ERROR_LOADING_SERVICEDEF = new MessageResource("com.wavemaker.platform$ErrorLoadingServiceDef");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource NO_EXTERNAL_BEAN_DEF = new MessageResource("com.wavemaker.platform.service$NoExternalBeanDef");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource NO_DESIGN_SERVICE_TYPE_FOUND = new MessageResource("com.wavemaker.platform.service$NoDesignServiceTypeFound");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource UNKNOWN_TYPE_OF_TYPE = new MessageResource("com.wavemaker.platform.service$UnknownTypeOfType");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource NO_PRIMARY_KEY = new MessageResource("com.wavemaker.platform.data$NoPrimaryKey");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNKNOWN_DEPLOYMENT_TARGET = new MessageResource("com.wavemaker.platform.deployment$UnknownDeploymentTarget");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNKNOWN_PWS_TOOLS_MANAGER = new MessageResource("com.wavemaker.platform.pwst$UnknownPwsToolsManager");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNKNOWN_PWS_LOGIN_MANAGER = new MessageResource("com.wavemaker.platform.pwst$UnknownPwsLoginManager");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNKNOWN_CLOUDSERVER_MGR = new MessageResource("com.wavemaker.platform.cloudmgr$UnknownCloudServerMgr");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNKNOWN_CLOUDSTORAGE_MGR = new MessageResource("com.wavemaker.platform.cloudmgr$UnknownCloudStorageMgr");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = true)
    public static final MessageResource UNSET_SCHEMA = new MessageResource("com.wavemaker.platform.data$SchemaShouldNotBeSet");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource INVALID_SCHEMA = new MessageResource("com.wavemaker.platform$InvalidSchema");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FILE_TYPE_NOT_SUPPORTED = new MessageResource("com.wavemaker.platform$FileTypeNotSupported");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PACKAGE_TYPE_NOT_SUPPORTED = new MessageResource("com.wavemaker.platform$PackageTypeNotSupported");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource PACKAGE_OF_THIS_FILE_TYPE_IS_NOT_SUPPORTED = new MessageResource("com.wavemaker.platform$PackageOfThisFileTypeNotSupported");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FILE_DOES_NOT_EXIST = new MessageResource("com.wavemaker.platform$FileDoesNotExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_LOAD_STUDIO_PROPERTIES = new MessageResource("com.wavemaker.studio$FailedToLoadStudioProperties");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FILE_NOT_DELETED = new MessageResource("com.wavemaker.platform$FailedToDeleteFile");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FOLDER_NOT_DELETED = new MessageResource("com.wavemaker.platform$FailedToDeleteFolder");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource RESOURCE_NOT_ALLOWED_FOR_DELETION = new MessageResource("com.wavemaker.platform$ResourceNotAllowedForDeletion");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource COULD_NOT_EXPORT_EMPTY_DATABASE = new MessageResource("com.wavemaker.platform$CouldNotExportEmptyDatabase");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource INSUFFICIENT_RESOURCES_TO_CREATE_JAR_FILE = new MessageResource("com.wavemaker.platform$InsufficientResourcesToCreateJarFile");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource UNABLE_TO_PARSE_XML = new MessageResource("com.wavemaker.platform$Unable_To_Parse_XML");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource CATALOG_SHOULD_BE_SET = new MessageResource("com.wavemaker.platform.data$CatalogShouldBeSet");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource MISMATCH_CATALOG_DBNAME = new MessageResource("com.wavemaker.platform.data$CatalogDoesNotMatchDBName");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource WM_HOME_DOES_NOT_EXIST = new MessageResource("com.wavemaker.platform.data$WMHomeDoesNotExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource DATAMODEL_DOES_NOT_EXIST = new MessageResource("com.wavemaker.platform.data$DataModelDoesNotExist");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource NO_TABLE_FOUND = new MessageResource("com.wavemaker.platform.data$NoTableFound");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DATAMODEL_NAME_NOT_SET = new MessageResource("com.wavemaker.platform.data$DataModelNotSet");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource ENTITY_NAME_NOT_SET = new MessageResource("com.wavemaker.platform.data$EntityNameNotSet");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource ENTITIES_NOT_FOUND = new MessageResource("com.wavemaker.platform.data$EntitiesNotFound");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource PACKAGE_NAME_NOT_SET = new MessageResource("com.wavemaker.platform.data$PackageNameNotSet");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_PACKAGE_NAME = new MessageResource("com.wavemaker.platform.data$InvalidPackageName");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource TYPE_NOT_CREATED = new MessageResource("com.wavemaker.platform.data$TypeNotCreated");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PUBLISHED_DATA_MODEL_DNE = new MessageResource("com.wavemaker.platform.data$PublishedDataModelDNE");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource NO_DATAMODEL_CHANGES = new MessageResource("com.wavemaker.platform.data$NoDataModelChanges");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILURE_IN_PREPARING_CON_URL = new MessageResource("com.wavemaker.platform.data$FailureInPreparingConUrl");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DATAMODEL_REVERT_FAILURE = new MessageResource("com.wavemaker.platform.data$DataModelRevertFailure");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DATAMODEL_REVERT_NOTPOSSIBLE = new MessageResource("com.wavemaker.platform.data$DataModelRevertNotPossible");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource QUERY_GEN_FAILURE = new MessageResource("com.wavemaker.platform.data$QueryGenFailure");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILURE_IN_QUERY_BUILDER = new MessageResource("com.wavemaker.platform.data$FailureInQueryBuilder");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource DATAMODEL_FILE_DOES_NOT_EXIST = new MessageResource("com.wavemaker.platform.data$DataModelFileDoesNotExist");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILURE_DATAMODEL_DRAFT_DEL = new MessageResource("com.wavemaker.platform.data$FailureDataModelDraftDel");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILURE_IN_FETCHING_PUBLISHED_DM = new MessageResource("com.wavemaker.platform.data$FailureInFetchingPublishedDM");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILURE_IN_FETCHING_DRAFT_DM = new MessageResource("com.wavemaker.platform.data$FailureInFetchingDraftDM");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILURE_IN_FETCHING_QUERY_FILE = new MessageResource("com.wavemaker.platform.data$FailureInFetchingQueryFile");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILURE_IN_DATABASE_MIGRATION = new MessageResource("com.wavemaker.platform.data$FailureInDatabaseMigration");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILURE_IN_SAVING_DRAFT_DM = new MessageResource("com.wavemaker.platform.data$FailureInSavingDraftDM");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILURE_IN_SAVING_QUERY_MODEL = new MessageResource("com.wavemaker.platform.data$FailureInSavingQueryModel");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILURE_IN_SAVING_PUBLISHED_DM = new MessageResource("com.wavemaker.platform.data$FailureInSavingPublishedDM");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DM_ALREADY_EXISTS = new MessageResource("com.wavemaker.platform.data$DMAlreadyExists");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DM_IMPORT_FAILURE = new MessageResource("com.wavemaker.platform.data$DMImportFailure");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource DM_NOT_EXITS = new MessageResource("com.wavemaker.platform.data$DMNotExists");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_REIMPORT = new MessageResource("com.wavemaker.platform.data$FailedToReimport");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_ESTABLISH_CON = new MessageResource("com.wavemaker.platform.data$FailedToEstablishCon");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_EXE_SCRIPT = new MessageResource("com.wavemaker.platform.data$FailedToExeScript");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILURE_IN_DATAMODEL_EXPORT = new MessageResource("com.wavemaker.platform.data$FailureInDataModelExport");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_GETDDL = new MessageResource("com.wavemaker.platform.data$FailedToGetDDL");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILURE_IN_READING_CON_PROPS = new MessageResource("com.wavemaker.platform.data$FailureInReadingConProps");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_WRITE_CON_PROPS = new MessageResource("com.wavemaker.platform.data$FailedToWriteConProps");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource SERVICE_ID_BLANK = new MessageResource("com.wavemaker.platform.data$ServiceIdBlank");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource SRC_FLD_NOT_FOUND = new MessageResource("com.wavemaker.platform.data$SrcFldNotFound");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource SPECIFY_REVENG_FILE = new MessageResource("com.wavemaker.platform.data$SpecifyRevengFile");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource TABLE_DOES_NOT_EXIST = new MessageResource("com.wavemaker.platform.data$TableDoesNotExit");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource TABLE_CANNOT_BE_DEL = new MessageResource("com.wavemaker.platform.data$TableCanbeDel");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource TABLE_ALREADY_EXISTS = new MessageResource("com.wavemaker.platform.data$TableAlreadyExists");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource COL_ALREADY_EXIST = new MessageResource("com.wavemaker.platform.data$ColAlreadyExists");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FOREIGN_KEY_NOT_POSSIBLE = new MessageResource("com.wavemaker.platform.data$ForeingKeyNotPossible");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource PK_COL_CANNTBE_DEL = new MessageResource("com.wavemaker.platform.data$PkColCannbeDel");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DEL_REL_TO_DEL_COLUMN = new MessageResource("com.wavemaker.platform.data$DelRelToDelColumn");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource SQL_MISMATCH = new MessageResource("com.wavemaker.platform.data$SqlMismatch");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource USER_CANTMARK_FOREIGNKEY = new MessageResource("com.wavemaker.platform.data$UserCanntMarkForeignKey");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource PK_WITH_REL_EXISTS = new MessageResource("com.wavemaker.platform.data$PkWithRelExists");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource PK_HAS_ALREADY_RELATION = new MessageResource("com.wavemaker.platform.data$PKHasAlreadyRelation");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource PRIMARY_REL_CANNTBE_DEL = new MessageResource("com.wavemaker.platform.data$PrimaryRelCanntbeDel");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource TARGET_REL_NOTFOUND = new MessageResource("com.wavemaker.platform.data$TargetRelNotFound");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource NON_PRIMARY_REL_CANNTBE_UPDATED = new MessageResource("com.wavemaker.platform.data$NonPrimaryRelCanntBeUpdated");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_UPDATE_REL = new MessageResource("com.wavemaker.platform.data$FailedToUpdateRel");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource RELATION_ALREADY_EXISTS = new MessageResource("com.wavemaker.platform.data$RelationAlreadyExists");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource RELATED_TYPE_DOESNT_EXIST = new MessageResource("com.wavemaker.platform.data$RelatedTypeDoesNtExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource ATLEAST_ONE_RELCOL_EXISTS = new MessageResource("com.wavemaker.platform.data$AtleastOneRelColExists");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource RELATED_COL_ALREADY_FK = new MessageResource("com.wavemaker.platform.data$RelatedColAlreadyFk");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource RELATION_WITH_COMPKEY_NOTPOSSIBLE = new MessageResource("com.wavemaker.platform.data$RelationWithComkeyNotpossible");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource RELATEDCOLS_MISMATCH_SIZE = new MessageResource("com.wavemaker.platform.data$RelatedColsMismatchSize");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource RELATEDCOL_HAS_FOREIGNKEY = new MessageResource("com.wavemaker.platform.data$RelatedcolHasForeingkey");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource PK_COLS_CNT_NOT_MATCHED = new MessageResource("com.wavemaker.platform.data$PkColsCntNotMatched");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource REL_COLS_CNT_MISMATCH = new MessageResource("com.wavemaker.platform.data$RelColsCntMismatch");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource ONETOZERO_REL_NOTPOSSIBLE = new MessageResource("com.wavemaker.platform.data$OneToZeroRelNotPossibe");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource PK_COL_BLOB_NOT_SUPPORTED = new MessageResource("com.wavemaker.platform.data$PkColBlobNotSupported");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PKCOL_LENG_GRT_ZERO = new MessageResource("com.wavemaker.platform.data$PkColLengGrtZero");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PKCOL_LENGT_LESS_TWOFIVEFIVE = new MessageResource("com.wavemaker.platform.data$PkColLengtLessTwoFiveFive");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource COL_LEN_GRT_ZERO = new MessageResource("com.wavemaker.platform.data$ColLenGrtZero");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_FAILED_PARSING = new MessageResource("com.wavemaker.json$FailedParsing");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_TYPE_UNKNOWNRAWTYPE = new MessageResource("com.wavemaker.json$Type_UnknownRawType");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_TYPE_UNKNOWNPARAMTYPE = new MessageResource("com.wavemaker.json$Type_UnknownParameterType");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_TYPE_NOGENERICS = new MessageResource("com.wavemaker.json$Type_NoGenerics");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_FAILED_GENERICARRAYTYPE = new MessageResource("com.wavemaker.json$FailedGenericArrayType");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_FAILEDINSTANCE_MAP = new MessageResource("com.wavemaker.json$FailedInstantiationMap");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_OBJECT_REQUIRED_FOR_MAP_CONVERSION = new MessageResource("com.wavemaker.json$JSONObjectRequiredForMap");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource JSON_TYPEDEF_REQUIRED = new MessageResource("com.wavemaker.json$TypeDefRequired");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_OBJECTTYPEDEF_REQUIRED = new MessageResource("com.wavemaker.json$ObjectTypeDefRequired");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_FAILEDINSTANCE_COLLECTION = new MessageResource("com.wavemaker.json$FailedInstantiationCollection");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_COLL_OR_ARRAY = new MessageResource("com.wavemaker.json$UnknownCollectionType");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_COLL_IN_SET = new MessageResource("com.wavemaker.json$UnknownCollInSet");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_UNHANDLED_TYPE = new MessageResource("com.wavemaker.json$UnhandledType");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_PRIM_NEWINSTANCE_ARG_REQ = new MessageResource("com.wavemaker.json$PrimitiveNewInstanceRequiresArg");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_NUMBER_TYPE = new MessageResource("com.wavemaker.json$UnknownNumberType");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_FAILED_TO_CONVERT = new MessageResource("com.wavemaker.json$FailedToConvert");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_OBJECT_TYPE = new MessageResource("com.wavemaker.json$UnknownObjectType");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_NO_PROP_MATCHES_KEY = new MessageResource("com.wavemaker.json$NoPropertyMatchKey");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_NO_WRITE_METHOD = new MessageResource("com.wavemaker.json$NoWriteMethod");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_PRIMITIVE_TYPE = new MessageResource("com.wavemaker.json$UnknownPrimitiveType");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_RAW_TYPE_NOT_CLASS = new MessageResource("com.wavemaker.json$RawTypeNotClass");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_EXPECTED_COLLECTION = new MessageResource("com.wavemaker.json$ExpectedCollection");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_UNKNOWN_TYPE = new MessageResource("com.wavemaker.json$UnknownType");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_USE_FIELD_FOR_ARRAY = new MessageResource("com.wavemaker.json$UseFieldForArray");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource JSON_NO_GETTER_IN_TYPE = new MessageResource("com.wavemaker.json$NoGetterInType");

    @ResourceConstraint(numArgs = 3, hasDetailMsg = false)
    public static final MessageResource ERROR_GETTING_PROPERTY = new MessageResource("com.wavemaker.json$ErrorGettingProperty");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_BAD_HANDLE_TYPE = new MessageResource("com.wavemaker.json$UnexpectedHandleType");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource JSON_CYCLE_FOUND = new MessageResource("com.wavemaker.json$CycleFound");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource JSON_BAD_CYCLE_HANDLER = new MessageResource("com.wavemaker.json$UnknownCycleHandler");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource VALUE_COULD_NOT_NULL = new MessageResource("com.wavemaker.platform$ValueCouldNotBeNULL");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource IllEGAL_ARGUMENT_VALUE = new MessageResource("com.wavemaker.platform$IllegalArgumentValue");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_UNDEPLOY_PROJECT = new MessageResource("com.wavemaker.platform.deployment$FailedToUndeployProject");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_ACTION = new MessageResource("com.wavemaker.platform.deployment$InvalidAction");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource CONVERSION_IS_NOT_SUPPORTED = new MessageResource("com.wavemaker.platform$ConversionIsNotSupported");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource MISSING_FIELD_VALUE = new MessageResource("com.wavemaker.json$MissingFieldValue");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_FIELD_VALUE = new MessageResource("com.wavemaker.json$InvalidFieldValue");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_OBJECT = new MessageResource("com.wavemaker.json$InvalidObject");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNRECOGNIZED_FIELD = new MessageResource("com.wavemaker.json$UnrecognizedField");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_JSON = new MessageResource("com.wavemaker.json$InvalidJsonObject");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource MESSAGE_NOT_READABLE = new MessageResource("com.wavemaker.json$MessageNotReadable");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNEXPECTED_ERROR = new MessageResource("com.wavemaker.json$UnexpectedError");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource ONLY_ZIP_FILES_ALLOWED_FOR_PREFABS = new MessageResource("com.wavemaker.json$onlyZipFilesAllowedForPrefabs");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource ALREADY_PREFAB_EXISTS = new MessageResource("com.wavemaker.json$alreadyPrefabExists");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource PREFAB_DOES_NOT_EXIST = new MessageResource("com.wavemaker.json$prefabdoesNotExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource NOT_A_FILE = new MessageResource("com.wavemaker.json$prefabdoesNotExist");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource USERNAME_ALREADY_EXISTS = new MessageResource("com.wavemaker.usernameAlreadyExists");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource EMAIL_ALREADY_EXISTS = new MessageResource("com.wavemaker.emailAlreadyExists");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_TOKEN = new MessageResource("com.wavemaker.invalidToken");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource USER_IS_ALREADY_CONFIRMED = new MessageResource("com.wavemaker.userAlreadyConfirmed");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource USER_DNE_WITH_USERNAME = new MessageResource("com.wavemaker.noUserWithUsername");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource USER_DNE_WITH_EMAIL = new MessageResource("com.wavemaker.noUserWithEmail");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource RESOURCE_DNE_WITH_ID = new MessageResource("com.wavemaker.resourceDNEWithId");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DEPLOYMENT_ID_COUlD_NOT_BE_NULL = new MessageResource("com.wavemaker.deployment$IdCouldNotBeNull");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource DEPLOYMENT_ID_DOES_NOT_EXIST = new MessageResource("com.wavemaker.deployment$IdDoesNotExist");
    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DEPLOYMENT_INFO_COULD_NOT_BE_EMPTY_OR_NULL = new MessageResource("com.wavemaker.deployment$DeploymentInfoCouldNotBeEmptyOrNull");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource INVALID_CREDENTIALS = new MessageResource("com.wavemaker.invalidCredentials");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_AUTHENTICATE = new MessageResource("com.wavemaker.failedToAuthenticate");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource ACCESS_DENIED = new MessageResource("com.wavemaker.accessDenied");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource UNAUTHORIZED = new MessageResource("com.wavemaker.unAuthorized");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource USER_ALREADY_LOGGED_OUT = new MessageResource("com.wavemaker.userAlreadyLoggedOut");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource EMPTY_WAVEMAKER_CLOUD_ACCOUNT_DETAILS = new MessageResource("com.wavemaker.emptyWavemakerCloudAccountDetails");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource OLD_PASSWORD_DOES_NOT_MATCH = new MessageResource("com.wavemaker.oldPasswordDoesNotMatch");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource NEW_PASSWORD_SAME_AS_OLD_PASSWORD = new MessageResource("com.wavemaker.newPasswordSameAsOldPassword");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource USER_DOES_NOT_EXIST_WITH_ID = new MessageResource("com.wavemaker.userDoesNotExistWithId");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource USER_ALREADY_ADDED_FOR_THE_PROJECT = new MessageResource("com.wavemaker.userAlreadyAddedForTheProject");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource USER_NOT_PRESENT_IN_PROJECT_FOR_REMOVAL = new MessageResource("com.wavemaker.userNotPresentInProjectForRemoval");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource CANNOT_REMOVE_OWNER_FROM_PROJECT_USERS = new MessageResource("com.wavemaker.cannotRemoveOwnerFromProjectUsers");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DATABASE_CONNECTION_EXCEPTION = new MessageResource("com.wavemaker.runtime.data$DBConnectionException");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DATABASE_COMMIT_EXCEPTION = new MessageResource("com.wavemaker.runtime.data$DBCommitException");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource DATABASE_SQL_EXECUTION_EXCEPTION = new MessageResource("com.wavemaker.runtime.data$DBSQLException");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource COMMUNICATION_EXCEPTION = new MessageResource("com.wavemaker.runtime.data$CommunicationException");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource DATABASE_INVALID_DATA_ACCESS_RESOURCE_USAGE_EXCEPTION = new MessageResource("com.wavemaker.runtime.data$DBInvalidDataAccessResourceUsageException");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource DATABASE_OPERATION_FAILED = new MessageResource("com.wavemaker.runtime.data$DBOperationFailedException");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource APPLICATION_FAILED_TO_START = new MessageResource("com.wavemaker.saas.applicationFailedToStart");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_ACTIVATE_USER_CONTAINER = new MessageResource("com.wavemaker.saas.failedToActivateUserContainer");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_LOGIN = new MessageResource("com.wavemaker.saas.failedToLogin");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FIELD_SHOULD_NOT_BE_EMPTY = new MessageResource("com.wavemaker.fieldShouldNotBeEmpty");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_VALIDATE_URL = new MessageResource("com.wavemaker.core.failedToValidateUrl");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_DELETE_PROJECT_FILES = new MessageResource("com.wavemaker.platform.failedToDeleteProjectFiles");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource UNAUTHORIZED_TO_WAVEMAKER_CLOUD = new MessageResource("com.wavemaker.platform.unAuthorizedToWavemakerCloud");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource UNEXPECTED_WAVEMAKER_CLOUD_RESPONSE = new MessageResource("com.wavemaker.platform.unexpectedWavemakerCloudResponse");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource SAAS_CLIENT_APPLICATION_STARTUP_TIMED_OUT = new MessageResource("com.wavemaker.saas.saasclientApplicationStartupTimedOut");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_CREATE_PREFAB_FILES = new MessageResource("com.wavemaker.platform.failedToCreatePrefabFiles");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_DELETE_PREFAB_DUE_TO_DEPENDENCY = new MessageResource("com.wavemaker.platform.failedToDeletePrefabDueToDependency");


    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_REGISTER_PREFAB_FOR_PROJECT = new MessageResource("com.wavemaker.platform.failedToRegisterPrefabForProject");

    @ResourceConstraint(numArgs = 2, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_DE_REGISTER_PREFAB_FOR_PROJECT = new MessageResource("com.wavemaker.platform.failedToDeRegisterPrefabForProject");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_DEPLOY_APPLICATION = new MessageResource("com.wavemaker.platform.failedToDeployApplication");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource MAX_APPLICATIONS_EXCEEDED = new MessageResource("com.wavemaker.core.MaxApplicationsExceeded");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource REMOTE_CLIENT_SERVER_IS_NOT_RUNNING = new MessageResource("com.wavemaker.saas.remoteClientServerIsNotRunning");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource FAILED_TO_READ_WRITE_IN_FILE = new MessageResource("com.wavemaker.platform$FailedToReadWriteInFile");

    @ResourceConstraint(numArgs = 1, hasDetailMsg = false)
    public static final MessageResource INVALID_VCS_TYPE = new MessageResource("com.wavemaker.vcs$InvalidVcsType");
	
	@ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource MERGE_CONFLICT_DURING_PUSH = new MessageResource("com.wavemaker.vcs$MergeConflictDuringPush");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource MERGE_CONFLICT_DURING_PULL = new MessageResource("com.wavemaker.vcs$MergeConflictDuringPull");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource INCORRECT_CREDENTIAL = new MessageResource("com.wavemaker.vcs$IncorrectCredential");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource INCORRECT_DETAIL = new MessageResource("com.wavemaker.vcs$IncorrectDetail");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = true)
    public static final MessageResource VALID_WAVEMAKER_PROJECT = new MessageResource("com.wavemaker.vcs$InvalidProject");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = true)
    public static final MessageResource INVALID_URL = new MessageResource("com.wavemaker.vcs$InvalidUrl");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = true)
    public static final MessageResource PROJECT_EXISTS = new MessageResource("com.wavemaker.vcs$ProjectExists");

    @ResourceConstraint(numArgs = 0, hasDetailMsg = false)
    public static final MessageResource INVALID_REMOTE = new MessageResource("com.wavemaker.vcs$InvalidRemote");



    private static final Map<MessageResource, ResourceConstraint> annotations;

    static {

        Map<MessageResource, ResourceConstraint> m = new HashMap<MessageResource, ResourceConstraint>();

        try {
            List<Field> fields = ClassUtils.getPublicFields(MessageResource.class, MessageResource.class);
            for (Field f : fields) {
                m.put((MessageResource) f.get(null), f.getAnnotation(ResourceConstraint.class));
            }
        } catch (IllegalAccessException ex) {
            throw new AssertionError(ex);
        }

        annotations = Collections.unmodifiableMap(m);

    }

    private static final String DETAIL_KEY = "_detail";

    private static final String ID_KEY = "_id";

    private final String key;

    private MessageResource(String key) {
        if (key == null) {
            throw new IllegalArgumentException("key cannot be null");
        }
        this.key = key;
    }

    public Integer getId() {
        return Integer.parseInt(MessageResource.getMessage(this.key + MessageResource.ID_KEY, 0, (Object[]) null));
    }

    public String getMessage() {
        return getMessage((Object[]) null);
    }

    public String getMessage(Object... args) {
        return MessageResource.getMessage(this.key, getNumArgsRequired(), args);
    }

    public String getDetailMessage() {
        return getDetailMessage((Object[]) null);
    }

    public String getDetailMessage(Object... args) {
        return MessageResource.getMessage(this.key + MessageResource.DETAIL_KEY, getNumDetailArgsRequired(), args);
    }

    public String getMessageKey() {
        return this.key;
    }

    public int getNumArgsRequired() {
        return annotations.get(this).numArgs();
    }

    public int getNumDetailArgsRequired() {
        return annotations.get(this).numArgs();
    }

    public boolean hasDetailedMsg() {
        return annotations.get(this).hasDetailMsg();
    }

    private static String getMessage(String key, int numArgsRequired, Object... args) {
        if (numArgsRequired > 0) {
            if (args == null || args.length != numArgsRequired) {
                throw new IllegalArgumentException(key + ": " + "args don't match.  msg requires: " + numArgsRequired + " " + "passed in: "
                                                           + (args == null ? "null" : args.length));
            }
        }
        return ResourceManager.getInstance().getMessage(key, args);
    }

}
