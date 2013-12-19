/*
 * Copyright (C) 2012-2013 CloudJee, Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */
package com.wavemaker.common.util;

/*
 * Copyright (C) 2012-2013 CloudJee, Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import java.io.File;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import javax.xml.xpath.XPath;
import javax.xml.xpath.XPathConstants;
import javax.xml.xpath.XPathFactory;

import org.w3c.dom.Document;
import org.w3c.dom.NodeList;

import com.wavemaker.common.MessageResource;
import com.wavemaker.common.WMRuntimeException;
import com.wavemaker.common.XMLException;

/**
 * @author Sunil Kumar
 */
public class ProjectUtils {

    public static final String DOC_BASE = "docBase";

    public static boolean replacePathInProjectXML(File xmlFile, String path) {
        if (xmlFile != null && xmlFile.exists()) {
            try {
                DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
                DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
                Document doc = dBuilder.parse(xmlFile);
                doc.getDocumentElement().setAttribute(DOC_BASE, path);


                Transformer transformer = TransformerFactory.newInstance().newTransformer();
                StreamResult output = new StreamResult(xmlFile);
                DOMSource input = new DOMSource(doc);
                transformer.transform(input, output);

                return true;
            } catch (Exception e) {
                throw new XMLException(MessageResource.UNABLE_TO_PARSE_XML);
            }
        }
        return true;
    }

    public static boolean replaceProjectNameInApplicationXML(java.io.File xmlFile, String projectName) {
        if (xmlFile != null && xmlFile.exists()) {
            try {
                DocumentBuilderFactory dbFactory = DocumentBuilderFactory.newInstance();
                DocumentBuilder dBuilder = dbFactory.newDocumentBuilder();
                Document doc = dBuilder.parse(xmlFile);
                NodeList nodeList = doc.getDocumentElement().getChildNodes();

                XPathFactory factory = XPathFactory.newInstance();
                XPath xpath = factory.newXPath();
                String expression = "//application//display-name";
                nodeList = (NodeList) xpath.evaluate(expression, doc, XPathConstants.NODESET);
                nodeList.item(0).setTextContent(projectName);

                expression = "//application//module//web//web-uri";
                nodeList = (NodeList) xpath.evaluate(expression, doc, XPathConstants.NODESET);
                nodeList.item(0).setTextContent(projectName + ".war");

                expression = "//application//module//web//context-root";
                nodeList = (NodeList) xpath.evaluate(expression, doc, XPathConstants.NODESET);
                nodeList.item(0).setTextContent("/" + projectName);

                Transformer transformer = TransformerFactory.newInstance().newTransformer();
                StreamResult output = new StreamResult(xmlFile);
                DOMSource input = new DOMSource(doc);
                transformer.transform(input, output);

                return true;
            } catch (Exception e) {
                throw new XMLException(MessageResource.UNABLE_TO_PARSE_XML);
            }
        }
        throw new WMRuntimeException(MessageResource.FILE_OR_DIRECTORY_NOT_EXIST, xmlFile != null ? xmlFile.getName() : null);
    }
}
