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
package com.wavemaker.runtime.rest.util;

import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import com.wavemaker.tools.apidocs.tools.core.model.ExternalDocs;
import com.wavemaker.tools.apidocs.tools.core.model.Info;
import com.wavemaker.tools.apidocs.tools.core.model.Model;
import com.wavemaker.tools.apidocs.tools.core.model.Path;
import com.wavemaker.tools.apidocs.tools.core.model.SecurityRequirement;
import com.wavemaker.tools.apidocs.tools.core.model.Tag;
import com.wavemaker.tools.apidocs.tools.core.model.auth.SecuritySchemeDefinition;
import com.wavemaker.tools.apidocs.tools.core.model.parameters.Parameter;

@JsonInclude(Include.NON_NULL)
public class ProfolizedSwagger {

    protected String swagger = "2.0";
    protected Info info;
    protected String host;
    protected String basePath;
    protected List<Tag> tags;
    protected List<String> schemes;
    protected List<String> consumes;
    protected List<String> produces;
    protected List<SecurityRequirement> securityRequirement;
    protected Map<String, Path> paths;
    protected Map<String, SecuritySchemeDefinition> securityDefinitions;
    protected Map<String, Model> definitions;
    protected Map<String, Parameter> parameters;
    protected ExternalDocs externalDocs;

    public ProfolizedSwagger() {
        this.tags = new LinkedList<>();
    }

    // builders
    public ProfolizedSwagger info(Info info) {
        this.setInfo(info);
        return this;
    }

    public ProfolizedSwagger host(String host) {
        this.setHost(host);
        return this;
    }

    public ProfolizedSwagger basePath(String basePath) {
        this.setBasePath(basePath);
        return this;
    }

    public ProfolizedSwagger externalDocs(ExternalDocs value) {
        this.setExternalDocs(value);
        return this;
    }

    public ProfolizedSwagger tags(List<Tag> tags) {
        Objects.requireNonNull(tags, "Tags cannot be null");
        this.setTags(tags);
        return this;
    }

    public ProfolizedSwagger tag(Tag tag) {
        this.addTag(tag);
        return this;
    }

    public ProfolizedSwagger consumes(List<String> consumes) {
        this.setConsumes(consumes);
        return this;
    }

    public ProfolizedSwagger consumes(String consumes) {
        this.addConsumes(consumes);
        return this;
    }

    public ProfolizedSwagger produces(List<String> produces) {
        this.setProduces(produces);
        return this;
    }

    public ProfolizedSwagger produces(String produces) {
        this.addProduces(produces);
        return this;
    }

    public ProfolizedSwagger paths(Map<String, Path> paths) {
        this.setPaths(paths);
        return this;
    }

    public ProfolizedSwagger path(String key, Path path) {
        if (this.paths == null) {
            this.paths = new LinkedHashMap<String, Path>();
        }
        this.paths.put(key, path);
        return this;
    }

    public ProfolizedSwagger parameter(String key, Parameter parameter) {
        this.addParameter(key, parameter);
        return this;
    }

    public ProfolizedSwagger securityDefinition(String name, SecuritySchemeDefinition securityDefinition) {
        this.addSecurityDefinition(name, securityDefinition);
        return this;
    }

    public ProfolizedSwagger model(String name, Model model) {
        this.addDefinition(name, model);
        return this;
    }

    // getter & setters
    public String getSwagger() {
        return swagger;
    }

    public void setSwagger(String swagger) {
        this.swagger = swagger;
    }

    public Info getInfo() {
        return info;
    }

    public void setInfo(Info info) {
        this.info = info;
    }

    public String getHost() {
        return host;
    }

    public void setHost(String host) {
        this.host = host;
    }

    public String getBasePath() {
        return basePath;
    }

    public void setBasePath(String basePath) {
        this.basePath = basePath;
    }

    public List<String> getSchemes() {
        return schemes;
    }

    public void setSchemes(List<String> schemes) {
        this.schemes = schemes;
    }


    public List<Tag> getTags() {
        return tags;
    }

    public void setTags(List<Tag> tags) {
        this.tags = tags;
    }

    public void addTag(Tag tag) {
        if (tag.getName() != null) {
            boolean found = false;
            for (Tag existing : this.tags) {
                if (existing.getName().equals(tag.getName())) {
                    found = true;
                }
            }
            if (!found) {
                this.tags.add(tag);
                Collections.sort(this.tags);
            }
        }
    }

    public List<String> getConsumes() {
        return consumes;
    }

    public void setConsumes(List<String> consumes) {
        this.consumes = consumes;
    }

    public void addConsumes(String consumes) {
        if (this.consumes == null) {
            this.consumes = new ArrayList<String>();
        }
        this.consumes.add(consumes);
    }

    public List<String> getProduces() {
        return produces;
    }

    public void setProduces(List<String> produces) {
        this.produces = produces;
    }

    public void addProduces(String produces) {
        if (this.produces == null) {
            this.produces = new ArrayList<String>();
        }
        this.produces.add(produces);
    }

    public Map<String, Path> getPaths() {
        if (paths == null) {
            return null;
        }
        Map<String, Path> sorted = new LinkedHashMap<String, Path>();
        List<String> keys = new ArrayList<String>();
        keys.addAll(paths.keySet());
        Collections.sort(keys);

        for (String key : keys) {
            sorted.put(key, paths.get(key));
        }
        return sorted;
    }

    public void setPaths(Map<String, Path> paths) {
        this.paths = paths;
    }

    public Path getPath(String path) {
        if (this.paths == null) {
            return null;
        }
        return this.paths.get(path);
    }

    public Map<String, SecuritySchemeDefinition> getSecurityDefinitions() {
        return securityDefinitions;
    }

    public void setSecurityDefinitions(Map<String, SecuritySchemeDefinition> securityDefinitions) {
        this.securityDefinitions = securityDefinitions;
    }

    public void addSecurityDefinition(String name, SecuritySchemeDefinition securityDefinition) {
        if (this.securityDefinitions == null) {
            this.securityDefinitions = new HashMap<String, SecuritySchemeDefinition>();
        }
        this.securityDefinitions.put(name, securityDefinition);
    }

    public void setDefinitions(Map<String, Model> definitions) {
        this.definitions = definitions;
    }

    public Map<String, Model> getDefinitions() {
        return definitions;
    }

    public void addDefinition(String key, Model model) {
        if (this.definitions == null) {
            this.definitions = new HashMap<String, Model>();
        }
        this.definitions.put(key, model);
    }

    public Map<String, Parameter> getParameters() {
        return parameters;
    }

    public void setParameters(Map<String, Parameter> parameters) {
        this.parameters = parameters;
    }

    public Parameter getParameter(String parameter) {
        if (this.parameters == null) {
            return null;
        }
        return this.parameters.get(parameter);
    }

    public void addParameter(String key, Parameter parameter) {
        if (this.parameters == null) {
            this.parameters = new HashMap<String, Parameter>();
        }
        this.parameters.put(key, parameter);
    }

    public ExternalDocs getExternalDocs() {
        return externalDocs;
    }

    public void setExternalDocs(ExternalDocs value) {
        externalDocs = value;
    }
}
