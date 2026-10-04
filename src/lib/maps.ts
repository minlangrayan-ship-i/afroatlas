import { geoMercator, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import world from '../data/published/world.json';
import geography from '../data/published/geography.json';
import { countries } from '../data/countries';
export function africaPaths() {
  const features = world.features.filter((f) => f.properties.CONTINENT === 'Africa');
  const collection = { type: 'FeatureCollection', features } as unknown as GeoPermissibleObjects;
  const projection = geoMercator().fitExtent(
    [
      [25, 15],
      [575, 550],
    ],
    collection,
  );
  const path = geoPath(projection);
  return features.map((f) => {
    const code = f.properties.ADM0_A3;
    const country = countries.find((c) => c.ISO3 === code);
    return {
      path: path(f as unknown as GeoPermissibleObjects) || '',
      country: country || null,
      label: country?.nameFr || f.properties.NAME_FR || f.properties.NAME,
    };
  });
}
export function regionPaths(iso: string) {
  const collection = geography.geometries[iso as keyof typeof geography.geometries];
  if (!collection) return [];
  const projection = geoMercator().fitExtent(
    [
      [20, 20],
      [580, 410],
    ],
    collection as unknown as GeoPermissibleObjects,
  );
  const path = geoPath(projection);
  return collection.features.map((f) => ({
    id: f.properties.id,
    label: f.properties.name,
    path: path(f as unknown as GeoPermissibleObjects) || '',
  }));
}
