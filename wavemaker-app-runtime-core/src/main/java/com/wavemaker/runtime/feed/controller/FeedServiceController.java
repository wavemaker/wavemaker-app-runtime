/**
 * Copyright © 2013 - 2017 WaveMaker, Inc.
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
package com.wavemaker.runtime.feed.controller;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;

import javax.validation.constraints.NotNull;

import org.hibernate.validator.constraints.NotBlank;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.wavemaker.runtime.feed.model.Feed;
import com.wavemaker.runtime.feed.service.FeedService;
import com.wavemaker.commons.CommonConstants;
import com.wordnik.swagger.annotations.ApiOperation;

/**
 * Created by sunilp on 11/3/15.
 */
@RestController
@RequestMapping(value = "/feed")
public class FeedServiceController {

    @Autowired
    private FeedService feedService;

    @RequestMapping(value = "", method = RequestMethod.GET)
    @ApiOperation(value = "Reads from the InputStream of the specified URL and builds the feed object from the returned XML.")
    public Feed getFeed(@RequestParam("feedURL") @NotNull @NotBlank String feedURL) throws UnsupportedEncodingException{
        return feedService.getFeed(URLDecoder.decode(feedURL, CommonConstants.UTF8));
    }

    @RequestMapping(value = "/auth", method = RequestMethod.GET)
    @ApiOperation(value = "Reads from the InputStream of the specified URL & http auth and builds the feed object from the returned XML.")
    public Feed getFeedWithHttpConfig(@RequestParam("feedURL") @NotNull @NotBlank String feedURL, @RequestParam("httpBasicAuthUsername") @NotNull @NotBlank String httpBasicAuthUsername, @RequestParam("httpBasicAuthPassword") @NotNull @NotBlank String httpBasicAuthPassword, @RequestParam("connectionTimeout") @NotNull @NotBlank int connectionTimeout) throws UnsupportedEncodingException{
        return feedService.getFeedWithHttpConfig(URLDecoder.decode(feedURL, CommonConstants.UTF8), httpBasicAuthUsername, httpBasicAuthPassword, connectionTimeout);
    }

}
