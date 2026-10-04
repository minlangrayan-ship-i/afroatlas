import { request, json, date } from './common.mjs';
const regions = [],
  metadata = [],
  geometries = {},
  gaps = [];
for (const ISO3 of ['CMR', 'CIV', 'MAR', 'SEN', 'MLI']) {
  try {
    const url = `https://www.geoboundaries.org/api/current/gbOpen/${ISO3}/ADM1/`;
    const meta = await request(url);
    if (meta.boundaryType !== 'ADM1' || meta.boundaryISO !== ISO3)
      throw new Error('Niveau ou pays incorrect');
    const geo = await request(meta.simplifiedGeometryGeoJSON || meta.gjDownloadURL);
    if (geo.features.length !== Number(meta.admUnitCount))
      throw new Error('Nombre de subdivisions incohérent');
    for (const [i, feature] of geo.features.entries()) {
      if (!feature.properties.shapeName) throw new Error('Nom manquant');
      const id = `region-${ISO3}-${feature.properties.shapeID || i}`;
      regions.push({
        id,
        countryISO3: ISO3,
        name: feature.properties.shapeName,
        adminLevel: 1,
        geometryRef: id,
        boundaryYear: String(meta.boundaryYearRepresented),
        sourceIds: [`geoboundaries-${ISO3}`],
      });
      feature.properties = { id, name: feature.properties.shapeName };
    }
    geometries[ISO3] = geo;
    metadata.push({
      id: `geoboundaries-${ISO3}`,
      title: `geoBoundaries gbOpen ${ISO3} ADM1`,
      publisher: 'geoBoundaries / wmgeolab',
      url,
      licenseId: meta.boundaryLicense,
      source: meta.boundarySource,
      sourceUrl: meta.boundarySourceURL,
      boundaryYear: String(meta.boundaryYearRepresented),
      boundaryCanonical: meta.boundaryCanonical,
      retrievedAt: date,
      datasetVersion: meta.boundaryID,
      geometryUrl: meta.simplifiedGeometryGeoJSON || meta.gjDownloadURL,
      count: geo.features.length,
    });
    console.log(
      `REGIONS ${ISO3}: ${geo.features.length}, ${meta.boundaryYearRepresented}, ${meta.boundaryLicense}`,
    );
  } catch (error) {
    gaps.push({ countryISO3: ISO3, reason: error.message });
    console.log(`REGION GAP ${ISO3}: ${error.message}`);
  }
}
try {
  const url =
    'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/ne_110m_admin_0_countries.geojson';
  const world = await request(url);
  await json('src/data/published/world.json', world);
  metadata.push({
    id: 'natural-earth',
    title: 'Natural Earth admin 0 — 110m',
    publisher: 'Natural Earth',
    url,
    licenseId: 'Public domain',
    retrievedAt: date,
    datasetVersion: '5.1.2',
    note: 'Carte de découverte non autoritative ; représentation Natural Earth des limites, aucun rattachement culturel déduit.',
  });
} catch (error) {
  gaps.push({ source: 'natural-earth', reason: error.message });
  await json('src/data/published/world.json', { type: 'FeatureCollection', features: [] });
}
await json('src/data/published/geography.json', { regions, metadata, geometries, gaps });
await json('src/data/published/regions.json', regions);
