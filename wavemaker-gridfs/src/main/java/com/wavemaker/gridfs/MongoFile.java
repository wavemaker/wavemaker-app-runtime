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
package com.wavemaker.gridfs;

import com.mongodb.gridfs.GridFS;
import com.wavemaker.platform.io.File;
import com.wavemaker.platform.io.store.FileStore;
import com.wavemaker.platform.io.store.StoredFile;

/**
 * A {@link File} implementation backed by a mongo {@link GridFS}.
 * 
 * @see MongoFolder
 * 
 * @author Phillip Webb
 */
public class MongoFile extends StoredFile {

    private final MongoResourceStore.MongoFileStore store;

    /**
     * Package scope constructor, files should only be accessed via the {@link MongoFolder},
     * 
     * @param store the file store
     */
    MongoFile(MongoResourceStore.MongoFileStore store) {
        this.store = store;
    }

    @Override
    protected FileStore getStore() {
        return this.store;
    }

}
