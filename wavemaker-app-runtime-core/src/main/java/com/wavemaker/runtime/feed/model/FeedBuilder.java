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
package com.wavemaker.runtime.feed.model;

import java.util.ArrayList;
import java.util.List;

import com.sun.syndication.feed.synd.SyndEntry;
import com.sun.syndication.feed.synd.SyndFeed;

/**
 * Builder class used for building {@link Feed} object from {@link SyndFeed} object
 * @author Uday Shankar
 */
public class FeedBuilder {

    private FeedBuilder(){}

    public static Feed getFeed(SyndFeed syndFeed) {
        Feed feed = new Feed();
        feed.setAuthor(syndFeed.getAuthor());
        feed.setCopyright(syndFeed.getCopyright());
        feed.setDescription(syndFeed.getDescription());
        feed.setEncoding(syndFeed.getEncoding());


        List<Entry> entryList = new ArrayList<>();
        List<SyndEntry> syndEntryList = syndFeed.getEntries();
        if(syndEntryList != null) {
            for (SyndEntry syndEntry : syndEntryList) {
                entryList.add(EntryBuilder.getEntry(syndEntry));
            }
        }
        feed.setEntries(entryList.toArray(new Entry[entryList.size()]));

        feed.setFeedType(syndFeed.getFeedType());
        feed.setLanguage(syndFeed.getLanguage());
        feed.setLink(syndFeed.getLink());
        feed.setPublishedDate(syndFeed.getPublishedDate());
        feed.setTitle(syndFeed.getTitle());
        feed.setUri(syndFeed.getUri());
        return feed;
    }
}
