import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { StyleSpecification } from 'maplibre-gl';
import type { MissionAccentTheme } from './types';

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

const MAP_FALLBACK_PALETTES: Record<
  MissionAccentTheme,
  {
    background: string;
    graticule: string;
    water: string;
    waterway: string;
    boundaryOutline: string;
    boundaryLow: string;
    boundaryMid: string;
    boundaryHigh: string;
    boundaryState: string;
    roadPrimary: string;
    roadTrunk: string;
    roadMotorway: string;
    labelContinent: string;
    labelCountryStrong: string;
    labelCountry: string;
    labelCity: string;
    halo: string;
  }
> = {
  'wm-blue': {
    background: '#07111a',
    graticule: 'rgba(96, 165, 250, 0.12)',
    water: '#0b1824',
    waterway: 'rgba(56, 189, 248, 0.34)',
    boundaryOutline: 'rgba(8, 15, 23, 0.92)',
    boundaryLow: 'rgba(148, 163, 184, 0.26)',
    boundaryMid: 'rgba(125, 211, 252, 0.34)',
    boundaryHigh: 'rgba(148, 163, 184, 0.24)',
    boundaryState: 'rgba(71, 85, 105, 0.28)',
    roadPrimary: 'rgba(56, 189, 248, 0.1)',
    roadTrunk: 'rgba(148, 163, 184, 0.16)',
    roadMotorway: 'rgba(96, 165, 250, 0.18)',
    labelContinent: 'rgba(148, 163, 184, 0.5)',
    labelCountryStrong: 'rgba(203, 213, 225, 0.72)',
    labelCountry: 'rgba(148, 163, 184, 0.58)',
    labelCity: 'rgba(191, 219, 254, 0.62)',
    halo: 'rgba(7, 17, 26, 0.96)',
  },
  palestine: {
    background: '#08100b',
    graticule: 'rgba(74, 222, 128, 0.13)',
    water: '#0a1712',
    waterway: 'rgba(134, 239, 172, 0.22)',
    boundaryOutline: 'rgba(7, 12, 9, 0.94)',
    boundaryLow: 'rgba(167, 243, 208, 0.22)',
    boundaryMid: 'rgba(187, 247, 208, 0.3)',
    boundaryHigh: 'rgba(220, 252, 231, 0.2)',
    boundaryState: 'rgba(134, 239, 172, 0.18)',
    roadPrimary: 'rgba(134, 239, 172, 0.11)',
    roadTrunk: 'rgba(231, 229, 228, 0.14)',
    roadMotorway: 'rgba(248, 113, 113, 0.14)',
    labelContinent: 'rgba(187, 247, 208, 0.42)',
    labelCountryStrong: 'rgba(240, 253, 244, 0.72)',
    labelCountry: 'rgba(220, 252, 231, 0.58)',
    labelCity: 'rgba(187, 247, 208, 0.64)',
    halo: 'rgba(8, 16, 11, 0.96)',
  },
};

function buildTacticalFallbackStyle(accentTheme: MissionAccentTheme): StyleSpecification {
  const palette = MAP_FALLBACK_PALETTES[accentTheme];

  return {
    version: 8,
    name: accentTheme === 'palestine' ? 'Mission Control Tactical Palestine' : 'Mission Control Tactical',
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
          'background-color': palette.background,
        },
      },
      {
        id: 'mc-graticule',
        type: 'line',
        source: 'graticule',
        paint: {
          'line-color': palette.graticule,
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
          'fill-color': palette.water,
          'fill-opacity': 1,
        },
      },
      {
        id: 'waterway',
        type: 'line',
        source: 'carto',
        'source-layer': 'waterway',
        paint: {
          'line-color': palette.waterway,
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
          'line-color': palette.boundaryOutline,
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
            palette.boundaryLow,
            5,
            palette.boundaryMid,
            8,
            palette.boundaryHigh,
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
          'line-color': palette.boundaryState,
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
          'line-color': palette.roadPrimary,
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
          'line-color': palette.roadTrunk,
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
          'line-color': palette.roadMotorway,
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
          'text-color': palette.labelContinent,
          'text-halo-color': palette.halo,
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
          'text-color': palette.labelCountryStrong,
          'text-halo-color': palette.halo,
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
          'text-color': palette.labelCountry,
          'text-halo-color': palette.halo,
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
          'text-color': palette.labelCity,
          'text-halo-color': palette.halo,
          'text-halo-width': 1,
        },
      },
    ],
  };
}

export function resolveMissionControlMapStyle(
  styleUrl?: string,
  accentTheme: MissionAccentTheme = 'wm-blue'
): string | StyleSpecification {
  if (styleUrl) return styleUrl;
  return buildTacticalFallbackStyle(accentTheme);
}
