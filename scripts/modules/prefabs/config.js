/*global WM, wm*/
/*jslint todo: true */

/*Definition of the Prefabs Module*/
/**
 * @ngdoc overview
 * @name wm.prefabs
 * @description
 * The 'wm.prefabs' module provides existing prefabs in the studio.
 */
WM.module('wm.prefabs', ['wm.widgets.base'])
    .config(function (WidgetPropertiesProvider) {
        "use strict";

        WidgetPropertiesProvider.addGroup({"name": "prefabs", "namekey": "LABEL_PREFABS", "iconclass": "prefab"});

        WidgetPropertiesProvider.addSubGroup(
            {
                "name": "prefabssubgroup",
                "namekey": "LABEL_THEMES",
                "parent": "prefabs",
                "widgets": []
            }
        );
    });
/*End of Module definition*/