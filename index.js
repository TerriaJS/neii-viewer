/**
 * @license
 * Copyright(c) 2012-2015 National ICT Australia Limited (NICTA).
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
 *
 */

'use strict';

/*global require*/

var version = require('./version');

var terriaOptions = {
    baseUrl: 'build/TerriaJS'
};
var configuration = {
    bingMapsKey: undefined // use Cesium key
};

// Check browser compatibility early on.
// A very old browser (e.g. Internet Explorer 8) will fail on requiring-in many of the modules below.
// 'ui' is the name of the DOM element that should contain the error popup if the browser is not compatible
var checkBrowserCompatibility = require('terriajs/lib/ViewModels/checkBrowserCompatibility');
checkBrowserCompatibility('ui');

var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var isCommonMobilePlatform = require('terriajs/lib/Core/isCommonMobilePlatform');
var TerriaViewer = require('terriajs/lib/ViewModels/TerriaViewer');
var registerKnockoutBindings = require('terriajs/lib/Core/registerKnockoutBindings');
var GoogleAnalytics = require('terriajs/lib/Core/GoogleAnalytics');

var AddDataPanelViewModel = require('terriajs/lib/ViewModels/AddDataPanelViewModel');
var AnimationViewModel = require('terriajs/lib/ViewModels/AnimationViewModel');
var BingMapsSearchProviderViewModel = require('terriajs/lib/ViewModels/BingMapsSearchProviderViewModel');
var BrandBarViewModel = require('terriajs/lib/ViewModels/BrandBarViewModel');
var CatalogItemNameSearchProviderViewModel = require('terriajs/lib/ViewModels/CatalogItemNameSearchProviderViewModel');
var createAustraliaBaseMapOptions = require('terriajs/lib/ViewModels/createAustraliaBaseMapOptions');
var createGlobalBaseMapOptions = require('terriajs/lib/ViewModels/createGlobalBaseMapOptions');
var createToolsMenuItem = require('terriajs/lib/ViewModels/createToolsMenuItem');
var DataCatalogTabViewModel = require('terriajs/lib/ViewModels/DataCatalogTabViewModel');
var DistanceLegendViewModel = require('terriajs/lib/ViewModels/DistanceLegendViewModel');
var DragDropViewModel = require('terriajs/lib/ViewModels/DragDropViewModel');
var ExplorerPanelViewModel = require('terriajs/lib/ViewModels/ExplorerPanelViewModel');
var FeatureInfoPanelViewModel = require('terriajs/lib/ViewModels/FeatureInfoPanelViewModel');
var GazetteerSearchProviderViewModel = require('terriajs/lib/ViewModels/GazetteerSearchProviderViewModel');
var GoogleUrlShortener = require('terriajs/lib/Models/GoogleUrlShortener');
var LocationBarViewModel = require('terriajs/lib/ViewModels/LocationBarViewModel');
var MenuBarItemViewModel = require('terriajs/lib/ViewModels/MenuBarItemViewModel');
var MenuBarViewModel = require('terriajs/lib/ViewModels/MenuBarViewModel');
var MutuallyExclusivePanels = require('terriajs/lib/ViewModels/MutuallyExclusivePanels');
var NavigationViewModel = require('terriajs/lib/ViewModels/NavigationViewModel');
var NowViewingAttentionGrabberViewModel = require('terriajs/lib/ViewModels/NowViewingAttentionGrabberViewModel');
var NowViewingTabViewModel = require('terriajs/lib/ViewModels/NowViewingTabViewModel');
var PopupMessageViewModel = require('terriajs/lib/ViewModels/PopupMessageViewModel');
var PopupMessageConfirmationViewModel = require('terriajs/lib/ViewModels/PopupMessageConfirmationViewModel');
var SearchTabViewModel = require('terriajs/lib/ViewModels/SearchTabViewModel');
var SettingsPanelViewModel = require('terriajs/lib/ViewModels/SettingsPanelViewModel');
var SharePopupViewModel = require('terriajs/lib/ViewModels/SharePopupViewModel');
var MapProgressBarViewModel = require('terriajs/lib/ViewModels/MapProgressBarViewModel');
var updateApplicationOnHashChange = require('terriajs/lib/ViewModels/updateApplicationOnHashChange');
var updateApplicationOnMessageFromParentWindow = require('terriajs/lib/ViewModels/updateApplicationOnMessageFromParentWindow');
var DisclaimerViewModel = require('terriajs/lib/ViewModels/DisclaimerViewModel');

var Terria = require('terriajs/lib/Models/Terria');
var registerCatalogMembers = require('terriajs/lib/Models/registerCatalogMembers');
var raiseErrorToUser = require('terriajs/lib/Models/raiseErrorToUser');
var selectBaseMap = require('terriajs/lib/ViewModels/selectBaseMap');
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');

var svgInfo = require('terriajs/lib/SvgPaths/svgInfo');
var svgPlus = require('terriajs/lib/SvgPaths/svgPlus');
var svgShare = require('terriajs/lib/SvgPaths/svgShare');
var svgWorld = require('terriajs/lib/SvgPaths/svgWorld');

// Register custom Knockout.js bindings.  If you're not using the TerriaJS user interface, you can remove this.
registerKnockoutBindings();

// Register all types of catalog members in the core TerriaJS.  If you only want to register a subset of them
// (i.e. to reduce the size of your application if you don't actually use them all), feel free to copy a subset of
// the code in the registerCatalogMembers function here instead.
registerCatalogMembers();

terriaOptions.analytics = new GoogleAnalytics();

// Construct the TerriaJS application, arrange to show errors to the user, and start it up.
var terria = new Terria(terriaOptions);

terria.error.addEventListener(function(e) {
    PopupMessageViewModel.open('ui', {
        title: e.title,
        message: e.message
    });
});

DisclaimerViewModel.create({
    container: 'ui',
    terria: terria
});

terria.start({
    // If you don't want the user to be able to control catalog loading via the URL, remove the applicationUrl property below
    // as well as the call to "updateApplicationOnHashChange" further down.
    applicationUrl: window.location,
    configUrl: 'config.json',
    defaultTo2D: isCommonMobilePlatform(),
    urlShortener: new GoogleUrlShortener({
        terria: terria
    })
}).otherwise(function(e) {
    raiseErrorToUser(terria, e);
}).always(function() {
    configuration.bingMapsKey = terria.configParameters.bingMapsKey ? terria.configParameters.bingMapsKey : configuration.bingMapsKey;

    // Automatically update Terria (load new catalogs, etc.) when the hash part of the URL changes.
    updateApplicationOnHashChange(terria, window);
    updateApplicationOnMessageFromParentWindow(terria, window);

    // Create the map/globe.
    TerriaViewer.create(terria, { developerAttribution: terria.configParameters.developerAttribution });

    // We'll put the entire user interface into a DOM element called 'ui'.
    var ui = document.getElementById('ui');

    // Create the various base map options.
    var australiaBaseMaps = createAustraliaBaseMapOptions(terria);
    var globalBaseMaps = createGlobalBaseMapOptions(terria, configuration.bingMapsKey);

    var allBaseMaps = australiaBaseMaps.concat(globalBaseMaps);
    selectBaseMap(terria, allBaseMaps, 'Bing Maps Aerial with Labels', true);

    // Create the Settings / Map panel.
    var settingsPanel = SettingsPanelViewModel.create({
        container: ui,
        terria: terria,
        isVisible: false,
        baseMaps: allBaseMaps
    });

    var brandBarElements = defaultValue(terria.configParameters.brandBarElements, [
            '',
            '<a target="_blank" href="http://terria.io"><img src="images/terria_logo.png" height="52" title="Version: {{ version }}" /></a>',
            ''
        ]);
    brandBarElements = brandBarElements.map(function(s) { return s.replace(/\{\{\s*version\s*\}\}/, version);});

    // Create the brand bar.
    BrandBarViewModel.create({
        container: ui,
        elements: brandBarElements
    });

    // Create the menu bar.
    MenuBarViewModel.create({
        container: ui,
        terria: terria,
        items: [
            // Add a Tools menu that only appears when "tools=1" is present in the URL.
            createToolsMenuItem(terria, ui),
            new MenuBarItemViewModel({
                label: 'Add data',
                tooltip: 'Add your own data to the map.',
                svgPath: svgPlus,
                svgPathWidth: 11,
                svgPathHeight: 12,
                callback: function() {
                    AddDataPanelViewModel.open({
                        container: ui,
                        terria: terria
                    });
                }
            }),
            new MenuBarItemViewModel({
                label: 'Base Maps',
                tooltip: 'Change the map mode (2D/3D) and base map.',
                svgPath: svgWorld,
                svgPathWidth: 17,
                svgPathHeight: 17,
                observableToToggle: knockout.getObservable(settingsPanel, 'isVisible')
            }),
            new MenuBarItemViewModel({
                label: 'Share',
                tooltip: 'Share your map with others.',
                svgPath: svgShare,
                svgPathWidth: 11,
                svgPathHeight: 13,
                callback: function() {
                    SharePopupViewModel.open({
                        container: ui,
                        terria: terria
                    });
                }
            }),/*
            new MenuBarItemViewModel({
                label: 'Related Maps',
                tooltip: 'View other maps in the NationalMap family.',
                svgPath: svgRelated,
                svgPathWidth: 14,
                svgPathHeight: 13,
                callback: function() {
                    PopupMessageViewModel.open(ui, {
                        title: 'Related Maps',
                        message: require('./lib/Views/RelatedMaps.html'),
                        width: 600,
                        height: 430
                    });
                }
            }),*/
            new MenuBarItemViewModel({
                label: 'About',
                tooltip: 'About NEII Viewer.',
                svgPath: svgInfo,
                svgPathWidth: 18,
                svgPathHeight: 18,
                svgFillRule: 'evenodd',
                href: 'about.html'
            })            
        ]
    });

    // Create the lat/lon/elev and distance widgets.
    LocationBarViewModel.create({
        container: ui,
        terria: terria,
        mapElement: document.getElementById('cesiumContainer')
    });

    DistanceLegendViewModel.create({
        container: ui,
        terria: terria,
        mapElement: document.getElementById('cesiumContainer')
    });

    // Create the navigation controls.
    NavigationViewModel.create({
        container: ui,
        terria: terria
    });

    // Create the animation controls.
    AnimationViewModel.create({
        container: document.getElementById('cesiumContainer'),
        terria: terria,
        mapElementsToDisplace: [
            'cesium-widget-credits',
            'leaflet-control-attribution',
            'distance-legend',
            'location-bar'
        ]
    });

    var nowViewingTab = new NowViewingTabViewModel({
        nowViewing: terria.nowViewing,
        noDataText: "Add data using the Data Services tab."
    });

    var isSmallScreen = document.body.clientWidth <= 700 || document.body.clientHeight <= 420;

    // Create the explorer panel.
    ExplorerPanelViewModel.create({
        container: ui,
        terria: terria,
        mapElementToDisplace: 'cesiumContainer',
        isOpen: !isSmallScreen && !terria.userProperties.hideExplorerPanel,
        tabs: [
            new DataCatalogTabViewModel({
                catalog: terria.catalog,
                name: 'Data Services'
            }),
            nowViewingTab,
            new SearchTabViewModel({
                searchProviders: [
                    new CatalogItemNameSearchProviderViewModel({
                        terria: terria
                    }),
                    new BingMapsSearchProviderViewModel({
                        terria: terria,
                        key: configuration.bingMapsKey
                    }),
                    new GazetteerSearchProviderViewModel({
                        terria: terria
                    })
                ]
            })
        ]
    });

    // Create the feature information popup.
    var featureInfoPanel = FeatureInfoPanelViewModel.create({
        container: ui,
        terria: terria
    });

    // Handle the user dragging/dropping files onto the application.
    DragDropViewModel.create({
        container: ui,
        terria: terria,
        dropTarget: document,
        allowDropInitFiles: true,
        allowDropDataFiles: true,
        validDropElements: ['ui', 'cesiumContainer'],
        invalidDropClasses: ['modal-background']
    });

    // Add a popup that appears the first time a catalog item is enabled,
    // calling the user's attention to the Now Viewing tab.
    NowViewingAttentionGrabberViewModel.create({
        container: ui,
        terria: terria,
        nowViewingTabViewModel: nowViewingTab
    });

    // Make sure only one panel is open in the top right at any time.
    MutuallyExclusivePanels.create({
        panels: [
            settingsPanel,
            featureInfoPanel
        ]
    });

    MapProgressBarViewModel.create({
        container: document.getElementById('cesiumContainer'),
        terria: terria
    });

    document.getElementById('loadingIndicator').style.display = 'none';

    if(terria.configParameters.globalDisclaimer !== undefined) {
      var disclaimer = terria.configParameters.globalDisclaimer;
      var hostname = location.hostname;
      if(disclaimer.enabled && hostname.indexOf('localhost') === -1) {
          var message = '';
          if (!hostname.match(/neii\.org\.au/)) {
            message += require('./lib/Views/DevelopmentDisclaimer.html');
          }
          var options = {
              title: (disclaimer.title !== undefined) ? disclaimer.title : 'Warning',
              confirmText: "Ok",
              width: 600,
              height: 550,
              message: message,
              horizontalPadding : 100
          };

          if(disclaimer.confirmationRequired) {
              // To account for confirmation buttons
              options.height += 30;
              PopupMessageConfirmationViewModel.open(ui, options);
          } else {
              PopupMessageViewModel.open(ui, options);
          }
      }
    }

});
