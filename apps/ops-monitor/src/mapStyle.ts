import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { StyleSpecification } from 'maplibre-gl';

const CARTO_VECTOR_SOURCE = {
  type: 'vector' as const,
  url: 'https://tiles.basemaps.cartocdn.com/vector/carto.streets/v1/tiles.json',
};

function buildGraticule(): FeatureCollection<LineString> {
  const features: Array<Feature<LineString>> = [];

  for (let longitude = -180; longitude <= 180; longitude += 15) {
    features.push({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [longitude, -85],
          [longitude, 85],
        ],
      },
    });
  }

  for (let latitude = -75; latitude <= 75; latitude += 15) {
    features.push({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [-180, latitude],
          [180, latitude],
        ],
      },
    });
  }

  return {
    type: 'FeatureCollection',
    features,
  };
}

const TACTICAL_FALLBACK_STYLE: StyleSpecification = {
  version: 8,
  name: 'Mission Control Tactical',
  glyphs: 'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
  sprite: 'https://tiles.basemaps.cartocdn.com/gl/dark-matter-gl-style/sprite',
  sources: {
    carto: CARTO_VECTOR_SOURCE,
    graticule: {
      type: 'geojson',
      data: buildGraticule(),
    },
  },
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: {
        'background-color': '#07111a',
      },
    },
    {
      id: 'mc-graticule',
      type: 'line',
      source: 'graticule',
      paint: {
        'line-color': 'rgba(96, 165, 250, 0.12)',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0,
          0.35,
          6,
          0.8,
        ],
        'line-dasharray': [2, 4],
      },
    },
    {
      id: 'water',
      type: 'fill',
      source: 'carto',
      'source-layer': 'water',
      minzoom: 0,
      maxzoom: 24,
      filter: ['all', ['==', '$type', 'Polygon']],
      paint: {
        'fill-color': '#0b1824',
        'fill-opacity': 1,
      },
    },
    {
      id: 'waterway',
      type: 'line',
      source: 'carto',
      'source-layer': 'waterway',
      paint: {
        'line-color': 'rgba(56, 189, 248, 0.34)',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          3,
          0.35,
          8,
          0.7,
          15,
          1.6,
        ],
      },
    },
    {
      id: 'boundary_country_outline',
      type: 'line',
      source: 'carto',
      'source-layer': 'boundary',
      filter: ['all', ['==', 'admin_level', 2], ['==', 'maritime', 0]],
      paint: {
        'line-color': 'rgba(8, 15, 23, 0.92)',
        'line-opacity': 1,
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          2,
          2.4,
          6,
          4.2,
        ],
      },
    },
    {
      id: 'boundary_country_inner',
      type: 'line',
      source: 'carto',
      'source-layer': 'boundary',
      filter: ['all', ['==', 'admin_level', 2], ['==', 'maritime', 0]],
      paint: {
        'line-color': [
          'interpolate',
          ['linear'],
          ['zoom'],
          2,
          'rgba(148, 163, 184, 0.26)',
          5,
          'rgba(125, 211, 252, 0.34)',
          8,
          'rgba(148, 163, 184, 0.24)',
        ],
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          2,
          0.7,
          6,
          1.1,
          9,
          1.4,
        ],
      },
    },
    {
      id: 'boundary_state',
      type: 'line',
      source: 'carto',
      'source-layer': 'boundary',
      minzoom: 4,
      filter: ['all', ['==', 'admin_level', 4], ['==', 'maritime', 0]],
      paint: {
        'line-color': 'rgba(71, 85, 105, 0.28)',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          4,
          0.35,
          8,
          0.85,
        ],
        'line-dasharray': [1, 2.5],
      },
    },
    {
      id: 'road_pri_fill_noramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'transportation',
      minzoom: 10,
      maxzoom: 24,
      filter: ['all', ['==', 'class', 'primary'], ['!=', 'ramp', 1], ['!has', 'brunnel']],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          0.3,
          13,
          1.4,
          16,
          5,
        ],
        'line-color': 'rgba(56, 189, 248, 0.1)',
      },
    },
    {
      id: 'road_trunk_fill_noramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'transportation',
      minzoom: 10,
      maxzoom: 24,
      filter: ['all', ['==', 'class', 'trunk'], ['!=', 'ramp', 1], ['!has', 'brunnel']],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          0.45,
          13,
          1.8,
          16,
          5.8,
        ],
        'line-color': 'rgba(148, 163, 184, 0.16)',
      },
    },
    {
      id: 'road_mot_fill_noramp',
      type: 'line',
      source: 'carto',
      'source-layer': 'transportation',
      minzoom: 10,
      maxzoom: 24,
      filter: ['all', ['==', 'class', 'motorway'], ['!=', 'ramp', 1], ['!has', 'brunnel']],
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          10,
          0.6,
          13,
          2.1,
          16,
          6.4,
        ],
        'line-color': 'rgba(96, 165, 250, 0.18)',
      },
    },
    {
      id: 'place_continent',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      minzoom: 0,
      maxzoom: 2,
      filter: ['all', ['==', 'class', 'continent']],
      layout: {
        'text-field': '{name_en}',
        'text-font': ['Montserrat Medium', 'Open Sans Bold', 'Noto Sans Regular'],
        'text-transform': 'uppercase',
        'text-size': 14,
        'text-letter-spacing': 0.18,
        'text-max-width': 9,
      },
      paint: {
        'text-color': 'rgba(148, 163, 184, 0.5)',
        'text-halo-color': 'rgba(7, 17, 26, 0.96)',
        'text-halo-width': 1,
      },
    },
    {
      id: 'place_country_1',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      minzoom: 2,
      maxzoom: 7,
      filter: ['all', ['==', 'class', 'country'], ['<=', 'rank', 2]],
      layout: {
        'text-field': '{name_en}',
        'text-font': ['Montserrat Medium', 'Open Sans Bold', 'Noto Sans Regular'],
        'text-transform': 'uppercase',
        'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 6, 13],
        'text-max-width': ['interpolate', ['linear'], ['zoom'], 2, 6, 5, 11],
        'text-letter-spacing': 0.08,
      },
      paint: {
        'text-color': 'rgba(203, 213, 225, 0.72)',
        'text-halo-color': 'rgba(7, 17, 26, 0.96)',
        'text-halo-width': 1.2,
      },
    },
    {
      id: 'place_country_2',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      minzoom: 3,
      maxzoom: 10,
      filter: ['all', ['==', 'class', 'country'], ['>=', 'rank', 3], ['has', 'iso_a2']],
      layout: {
        'text-field': '{name_en}',
        'text-font': ['Montserrat Medium', 'Open Sans Bold', 'Noto Sans Regular'],
        'text-transform': 'uppercase',
        'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 8, 12],
        'text-letter-spacing': 0.06,
      },
      paint: {
        'text-color': 'rgba(148, 163, 184, 0.58)',
        'text-halo-color': 'rgba(7, 17, 26, 0.92)',
        'text-halo-width': 1,
      },
    },
    {
      id: 'place_city_r6',
      type: 'symbol',
      source: 'carto',
      'source-layer': 'place',
      minzoom: 8,
      maxzoom: 15,
      filter: ['all', ['==', 'class', 'city'], ['>=', 'rank', 6]],
      layout: {
        'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name']],
        'text-font': ['Montserrat Medium', 'Open Sans Bold', 'Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 14, 17],
        'text-transform': 'uppercase',
        'text-max-width': 10,
      },
      paint: {
        'text-color': 'rgba(191, 219, 254, 0.62)',
        'text-halo-color': 'rgba(7, 17, 26, 0.92)',
        'text-halo-width': 1,
      },
    },
  ],
};

export function resolveMissionControlMapStyle(styleUrl?: string): string | StyleSpecification {
  if (styleUrl) return styleUrl;
  return TACTICAL_FALLBACK_STYLE;
}
