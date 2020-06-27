import React from 'react';
import ReactDOM from 'react-dom';
import ol from 'openlayers';
import {addLocaleData, IntlProvider, defineMessages, injectIntl, intlShape} from 'react-intl';
import LayerList from '@boundlessgeo/sdk/components/LayerList';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import CustomTheme from './theme';
import FeatureTable from '@boundlessgeo/sdk/components/FeatureTable';
import Measure from '@boundlessgeo/sdk/components/Measure';
import MapPanel from '@boundlessgeo/sdk/components/MapPanel';
import Select from '@boundlessgeo/sdk/components/Select';
import Geolocation from '@boundlessgeo/sdk/components/Geolocation';
import Zoom from '@boundlessgeo/sdk/components/Zoom';
import HomeButton from '@boundlessgeo/sdk/components/HomeButton';
import InfoPopup from '@boundlessgeo/sdk/components/InfoPopup';
import EditPopup from '@boundlessgeo/sdk/components/EditPopup';
import Header from '@boundlessgeo/sdk/components/Header';
import Navigation from '@boundlessgeo/sdk/components/Navigation';
import enLocaleData from 'react-intl/locale-data/en';
import enMessages from '@boundlessgeo/sdk/locale/en';
import injectTapEventPlugin from 'react-tap-event-plugin';
import Geocoding from '@boundlessgeo/sdk/components/Geocoding';
import GeocodingResults from '@boundlessgeo/sdk/components/GeocodingResults';
import Button from '@boundlessgeo/sdk/components/Button';

injectTapEventPlugin();
addLocaleData(enLocaleData);

let ObjectGeoStyle = new ol.style.Style({
    image: new ol.style.Circle({
        radius: 2.0,
        stroke: new ol.style.Stroke({
            color: 'rgba(0,0,0,255)',
            lineDash: null,
            width: 1
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0,0,0,1.0)'
        })
    })
});

let processingPointStyle = new ol.style.Style({
    image: new ol.style.Icon({
        src: './data/processingPoint.png',
    })
});

let collectionPointStyle = new ol.style.Style({
    image: new ol.style.Icon({
        src: './data/collectionPoint4.png',
        opacity: 0.5
    })
});

let style_recycling = new ol.style.Style({
    fill: new ol.style.Fill({
        color: 'rgb(0, 128, 0)'
    }),
    image: new ol.style.Icon({
        scale: 0.030000,
        anchorOrigin: 'top-left',
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        anchor: [1, 1],
        src: './data/styles/amenity_recycling.svg',
    })
});

let trashStyle = [
    new ol.style.Style({
        image: new ol.style.Icon({
            src: './data/user-trash-icon.png',
        })
    })];

// базовый стиль (нет кластеризации)
let baseStylePopp = [new ol.style.Style({
    image: new ol.style.Circle({
        radius: 7.0,
        stroke: new ol.style.Stroke({
            color: 'rgba(0,0,0,255)',
            lineDash: null,
            width: 1
        }),
        fill: new ol.style.Fill({
            color: 'rgba(255,255,255,1.0)'
        })
    })
}), new ol.style.Style({
    image: new ol.style.Circle({
        radius: 1.0,
        stroke: new ol.style.Stroke({
            color: 'rgba(0,0,0,255)',
            lineDash: null,
            width: 1
        }),
        fill: new ol.style.Fill({
            color: 'rgba(0,0,0,1.0)'
        })
    })
})];

// кластеризация
let clusterStyleCachePopp = {};
let stylePopp = function (feature) {
    let style;
    let features = feature.get('features');
    let size = 0;
    for (let i = 0, ii = features.length; i < ii; ++i) {
        if (features[i].selected) {
            return null;
        }
        if (features[i].hide !== true) {
            size++;
        }
    }
    if (size === 0) {
        return null;
    }
    if (size !== 1) {
        style = clusterStyleCachePopp[size];
        if (!style) {
            style = new ol.style.Style({
                image: new ol.style.Circle({
                    radius: 10,
                    stroke: new ol.style.Stroke({
                        color: '#fff'
                    }),
                    fill: new ol.style.Fill({
                        color: 'rgb(0, 128, 0)'
                    })
                }),
                text: new ol.style.Text({
                    text: size.toString(),
                    fill: new ol.style.Fill({
                        color: '#fff'
                    })
                })
            });
            clusterStyleCachePopp[size] = style;
        }
        return style;
    } else {
        return baseStylePopp;
    }
};

let areaRBsource = new ol.source.Vector({
    format: new ol.format.GeoJSON(),

    url: function (extent, resolution, projection) {
        return '/geoserver/wfs?service=WFS&' +
            'version=1.1.0&request=GetFeature&typename=geoCadastr2020:areaRB&' +
            'outputFormat=application/json&srsname=EPSG:3857&' +
            'bbox=' + extent.join(',') + ',EPSG:3857';
    },
    strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
        maxZoom: 19
    }))
});

let ObjectGeoSource = new ol.source.Vector({
    format: new ol.format.GeoJSON(),

    url: function (extent, resolution, projection) {
        return '/geoserver/wfs?service=WFS&' +
            'version=1.1.0&request=GetFeature&typename=Cadastr2020:information_oro&' +
            'outputFormat=application/json&srsname=EPSG:3857&' +
            'bbox=' + extent.join(',') + ',EPSG:3857';
    },
    strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
        maxZoom: 19
    }))
});

let ProcessingPointSource = new ol.source.Vector({
    format: new ol.format.GeoJSON(),

    url: function (extent, resolution, projection) {
        return '/geoserver/wfs?service=WFS&' +
            'version=1.1.0&request=GetFeature&typename=Cadastr2020:processing_point&' +
            'outputFormat=application/json&srsname=EPSG:3857&' +
            'bbox=' + extent.join(',') + ',EPSG:3857';
    },
    strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
        maxZoom: 19
    }))
});

let CollectionPointSource = new ol.source.Vector({
    format: new ol.format.GeoJSON(),

    url: function (extent, resolution, projection) {
        return '/geoserver/wfs?service=WFS&' +
            'version=1.1.0&request=GetFeature&typename=Cadastr2020:collection_point&' +
            'outputFormat=application/json&srsname=EPSG:3857&' +
            'bbox=' + extent.join(',') + ',EPSG:3857';
    },
    strategy: ol.loadingstrategy.tile(ol.tilegrid.createXYZ({
        maxZoom: 19
    }))
});

let areaRB = new ol.layer.Vector({
    source: areaRBsource,
    isSelectable: true,

    id: 'wfst',
    wfsInfo: {
        featureNS: 'http://www.opengeospatial.net/geocadastr2020',
        attributes: ['name', 'area', 'shape_leng'],
        featureType: 'areaRB',
        featurePrefix: 'geoCadastr2020',
        geometryType: 'MultiPolygon',
        geometryName: 'geom',
        url: '/geoserver/wfs'
    },
    isWFST: true,
    title: 'Районы РБ',
    popupInfo: '<h4 align="center"><u>[name]</u></h4> ' +
        '<div class="col-1-3"><b>Площадь</b>:</div> <div class="col-2-3">[area] кв.км</div>',
    style: new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'black',
            width: 1
        }),
        fill: new ol.style.Fill({
            color: 'rgba(102, 207, 255,0.3)'
        })
    })
});

let viewObjectGeo = new ol.layer.Vector({
    //source: new ol.source.Cluster({source: viewObjectGeoSource}),
    source: ObjectGeoSource,
    isSelectable: true,

    id: 'wfst1',
    wfsInfo: {
        featureNS: 'http://www.opengeospatial.net/cadastr2020',
        attributes: ['name_', 'address', 'capacity', 'num_reg_re', 'year_explu', 'oktmo',
            'name_purpo', 'name_speci', 'name_condi', 'area_ga', 'power_m', 'power_t',
            'szz_m', 'latitude', 'longitude', 'tenant', 'monitoring', 'protection'],
        featureType: 'information_oro',
        featurePrefix: 'Cadastr2020',
        geometryType: 'Point',
        geometryName: 'geom',
        url: '/geoserver/wfs'
    },
    isWFST: true,
    title: 'Объекты р-я отходов',
    popupInfo: '<h4 align="center"><u>[name_] (ОРО)</u></h4> ' +
        '<div class="col-1-3"><b>Адрес</b>:</div> <div class="col-2-3">[address]</div>' +
        '<div class="col-1-3"><b>Вместимость</b>:</div> <div class="col-2-3">[capacity] куб.м</div>' +
        '<div class="col-1-3"><b>№ рег. в ГРОРО</b>:</div> <div class="col-2-3">[num_reg_reestr]</div>' +
        '<div class="col-1-3"><b>Ввод в экспл.</b>:</div> <div class="col-2-3">[year_expluat] год</div>' +
        '<div class="col-1-3"><b>Код ОКТМО</b>:</div> <div class="col-2-3">[oktmo]</div>' +
        '<div class="col-1-3"><b>Код назнач.</b>:</div> <div class="col-2-3">[purpose]</div>' +
        '<div class="col-1-3"><b>Код вида</b>:</div> <div class="col-2-3">[species]</div>' +
        '<div class="col-1-3"><b>Код состояния</b>:</div> <div class="col-2-3">[condition]</div>' +
        '<div class="col-1-3"><b>Мощность</b>:</div> <div class="col-2-3">[power_m] куб.м/год</div>' +
        '<div class="col-1-3"><b>Мощность</b>:</div> <div class="col-2-3">[power_t] т/год</div>' +
        '<div class="col-1-3"><b>СЗЗ</b>:</div> <div class="col-2-3">[szz_m] м</div>' +
        '<div class="col-1-3"><b>Долгота</b>:</div> <div class="col-2-3">[longitude]</div>' +
        '<div class="col-1-3"><b>Широта</b>:</div> <div class="col-2-3">[latitude]</div>' +
        '<div class="col-1-3"><b>Код владельца</b>:</div> <div class="col-2-3">[tenant_id]</div>' +
        '<div class="col-1-3"><b>Территория</b>:</div> <div class="col-2-3">[special_terr]</div>' +
        '<div class="col-1-3"><b>Мониторинг</b>:</div> <div class="col-2-3">[monitoring]</div>' +
        '<div class="col-1-3"><b>Вид защиты</b>:</div> <div class="col-2-3">[protection]</div>'
    ,
    style: ObjectGeoStyle
});

let viewProcessingPoint = new ol.layer.Vector({
    source: ProcessingPointSource,
    isSelectable: true,

    id: 'wfst2',
    wfsInfo: {
        featureNS: 'http://www.opengeospatial.net/cadastr2020',
        attributes: ['name_', 'address', 'oktmo', 'subject_id', 'longitude',
            'latitude','power', 'fkko_list', 'resources_list','date_expluat'],
        featureType: 'processing_point',
        featurePrefix: 'Cadastr2020',
        geometryType: 'Point',
        geometryName: 'geom',
        url: '/geoserver/wfs'
    },
    isWFST: true,
    title: 'Пункты обработки отходов',
    popupInfo: '<h4 align="center"><u>[name_] (ПОО)</u></h4> ' +
        '<div class="col-1-3"><b>Адрес</b>:</div> <div class="col-2-3">[address]</div>' +
        '<div class="col-1-3"><b>Код ОКТМО</b>:</div> <div class="col-2-3">[oktmo]</div>' +
        '<div class="col-1-3"><b>ID владельца</b>:</div> <div class="col-2-3">[subject_id]</div>' +
        '<div class="col-1-3"><b>Долгота</b>:</div> <div class="col-2-3">[longitude]</div>' +
        '<div class="col-1-3"><b>Широта</b>:</div> <div class="col-2-3">[latitude]</div>' +
        '<div class="col-1-3"><b>Мощность</b>:</div> <div class="col-2-3">[power] куб.м/год</div>' +
        '<div class="col-1-3"><b>Перечень отходов</b>:</div> <div class="col-2-3">[fkko_list]</div>' +
        '<div class="col-1-3"><b>Лист ресурсов</b>:</div> <div class="col-2-3">[resources_list]</div>' +
        '<div class="col-1-3"><b>Ввод в экспл.</b>:</div> <div class="col-2-3">[date_expluat]</div>',
    style: processingPointStyle
});

let viewCollectionPoint = new ol.layer.Vector({
    source: CollectionPointSource,
    isSelectable: true,

    id: 'wfst3',
    wfsInfo: {
        featureNS: 'http://www.opengeospatial.net/cadastr2020',
        attributes: ['name_', 'address', 'oktmo', 'subject_id', 'longitude',
            'latitude','power', 'fkko_list','date_expluat'],
        featureType: 'collection_point',
        featurePrefix: 'Cadastr2020',
        geometryType: 'Point',
        geometryName: 'geom',
        url: '/geoserver/wfs'
    },
    isWFST: true,
    title: 'Пункты сбора отходов',
    popupInfo: '<h4 align="center"><u>[name_] (ПCО)</u></h4> ' +
        '<div class="col-1-3"><b>Адрес</b>:</div> <div class="col-2-3">[address]</div>' +
        '<div class="col-1-3"><b>Код ОКТМО</b>:</div> <div class="col-2-3">[oktmo]</div>' +
        '<div class="col-1-3"><b>ID владельца</b>:</div> <div class="col-2-3">[subject_id]</div>' +
        '<div class="col-1-3"><b>Долгота</b>:</div> <div class="col-2-3">[longitude]</div>' +
        '<div class="col-1-3"><b>Широта</b>:</div> <div class="col-2-3">[latitude]</div>' +
        '<div class="col-1-3"><b>Перечень отходов</b>:</div> <div class="col-2-3">[fkko_list]</div>' +
        '<div class="col-1-3"><b>Ввод в экспл.</b>:</div> <div class="col-2-3">[date_expluat]</div>',
    style: collectionPointStyle
});

let mousePositionControl = new ol.control.MousePosition({
        projection: 'EPSG:4326',
        className: 'custom-mouse-position',
        target: document.getElementById('location'),
        coordinateFormat: ol.coordinate.createStringXY(8),
        undefinedHTML: '&nbsp;'
      });

let map = new ol.Map({
    //controls: [],
    layers: [
        new ol.layer.Group({
            type: 'base-group',
            title: 'Базовые карты',
            layers: [
                new ol.layer.Tile({
                    type: 'base',
                    title: 'OpenStreetMap',
                    source: new ol.source.OSM()
                }),
                new ol.layer.Tile({
                    type: 'base',
                    title: 'CartoDB light',
                    visible: false,
                    source: new ol.source.XYZ({
                        url: 'http://s.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
                    })
                }),
                new ol.layer.Tile({
                    type: 'base',
                    title: 'CartoDB dark',
                    visible: false,
                    source: new ol.source.XYZ({
                        url: 'http://s.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
                    })
                }),
                new ol.layer.Tile({
                    type: 'base',
                    title: 'Aerial World Imagery',
                    visible: false,
                    source: new ol.source.XYZ({
                        url: 'http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
                    })
                })
            ]
        }),
        new ol.layer.Group({
            type: 'my-group',
            title: 'Geoserver Layers',
            layers: [
                areaRB,
                viewObjectGeo,
                viewProcessingPoint,
                viewCollectionPoint
                /* new ol.layer.Vector({
                   title: 'ОРО',
                   popupInfo: '<b>Название</b>:[name_]<br><b>Адрес</b>:[address]',
                   isSelectable: true,
                   geometryType: 'Point',
                   attributes: ['name_', 'address', 'name_purpo'],
                   source: new ol.source.Vector({
                     format: new ol.format.GeoJSON(),
                     url: './data/wasteObjects.json'
                   })
                 })*/
            ]
        })
    ],
    // controls: [new ol.control.Attribution({collapsible: false}), new ol.control.ScaleLine()].extend ([mousePositionControl]),
    controls: ol.control.defaults({
        zoom: false,
        attribution: true,
        attributionOptions: {collapsible: false}
    }).extend([mousePositionControl]),
    view: new ol.View({
        center: ol.proj.fromLonLat([56, 54]),
        zoom: 7
    })
});

let locale = 'en';
let i18n = enMessages;

class WasteCadastr extends React.Component {
    constructor(props) {
        super(props);
    }

    getChildContext() {
        return {
            muiTheme: getMuiTheme(CustomTheme)
        };
    }

    _toggle(el) {
        if (el.style.display === 'block') {
            el.style.display = 'none';
        } else {
            el.style.display = 'block';
        }
    }

    _toggleTable() {
        this._toggle(ReactDOM.findDOMNode(this.refs.tablePanel));
        this.refs.table.getWrappedInstance().setDimensionsOnState();
    }

    layerListOpen(value) {
        this.setState({
            addLayerOpen: true
        });
    }

    layerListClose(value) {
        this.setState({
            addLayerOpen: false
        });
    }

    render() {
        let header = (
            <Header
                title='Прототип ГИС-компоненты АИС "Кадастр отходов" на основе СПО'
                showLeftIcon={false}>
                <Geocoding className='geocoding-place'/>
                <Navigation toggleGroup='navigation' secondary={true}/>
                <Measure toggleGroup='navigation' map={map}/>
                <Select toggleGroup='navigation' map={map}/>
                <Button toggleGroup='nav' buttonType='Icon' iconClassName='headerIcons ms ms-table' tooltip='Таблица'
                        onTouchTap={this._toggleTable.bind(this)}/>
            </Header>);
        return (
            <div id='content'>
                <div>
                    {header}
                    <div className='map'>
                        <Navigation secondary={false}/>
                        <MapPanel id='map' map={map}/>
                        <div id='geocoding-results' className='geocoding-results-panel'><GeocodingResults map={map}/>
                        </div>
                        <div id='popup' className='ol-popup'><InfoPopup toggleGroup='navigation' toolId='nav'
                                                                        infoFormat='application/vnd.ogc.gml' map={map}/>
                        </div>
                        <div id='editpopup' className='ol-popup'><EditPopup toggleGroup='navigation' map={map}/></div>
                        <div id='geolocation-control'><Geolocation map={map}/></div>
                        <div id='home-button'><HomeButton map={map}/></div>
                        <div id='zoom-buttons'><Zoom map={map}/></div>

                        <div id='layerlist'><LayerList allowFiltering={false} showOpacity={true} showDownload={false}
                                                       showGroupContent={true} showZoomTo={false} allowReordering={true}
                                                       map={map}/></div>
                        <div ref='tablePanel' id='table-panel' className='attributes-table'><FeatureTable
                            toggleGroup='navigation' ref='table' map={map}/></div>

                    </div>
                </div>
            </div>
        );
    }
}

WasteCadastr.propTypes = {intl: intlShape.isRequired};

WasteCadastr.childContextTypes = {muiTheme: React.PropTypes.object};

WasteCadastr = injectIntl(WasteCadastr);

ReactDOM.render(<IntlProvider locale={locale}
                              messages={i18n}><WasteCadastr/></IntlProvider>, document.getElementById('main'));
