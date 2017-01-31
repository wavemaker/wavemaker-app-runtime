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

import com.sun.syndication.feed.synd.SyndContent;
import com.sun.syndication.feed.synd.SyndEntry;

/**
 * Builder class used for building {@link Entry} object from {@link SyndEntry} object
 * @author Uday Shankar
 */
public class EntryBuilder {

    public static Entry getEntry(SyndEntry syndEntry) {
        Entry entry = new Entry();
        entry.setAuthor(syndEntry.getAuthor());
        SyndContent description = syndEntry.getDescription();
        entry.setDescription((description!=null)?description.getValue() : null);
        entry.setLink(syndEntry.getLink());
        entry.setPublishedDate(syndEntry.getPublishedDate());
        entry.setTitle(syndEntry.getTitle());
        entry.setUpdatedDate(syndEntry.getUpdatedDate());
        entry.setUri(syndEntry.getUri());
        return entry;
    }
}
