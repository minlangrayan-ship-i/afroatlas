import { withLocale, useLocale } from '../lib/locale-react';
import {
  languageOptions,
  compatibleLanguage,
  regionLabel,
  sortedRegions,
  sortLabels,
} from '../lib/presentation';
import { useClientReady } from '../lib/use-client-ready';
import { useCommunityGeography } from '../lib/community-catalogue';
import { countries, europeanContexts } from '../data/countries';
import regions from '../data/published/regions.json';
import type { NameAssertion } from '../lib/schema';
import type { Destination } from '../lib/destination';
function DestinationPicker({
  value,
  onChange,
  names,
}: {
  value: Destination;
  onChange: (value: Destination) => void;
  names: NameAssertion[];
}) {
  const ready = useClientReady();
  const locale = useLocale();
  const geography = useCommunityGeography();
  const countryOptions = sortLabels([...countries, ...europeanContexts], (c) => c.nameFr, locale);
  const languages = languageOptions(names, value.country, value.region, locale);
  return (
    <fieldset className="destination-picker" disabled={!ready} aria-busy={!ready}>
      <legend>Où souhaitez-vous demander ce produit ?</legend>
      <p>Choisissez le contexte du vendeur ou de votre interlocuteur.</p>
      <div className="destination-fields">
        <label>
          Pays de l’interlocuteur
          <select
            aria-label="Pays de l’interlocuteur"
            value={value.country}
            onChange={(e) => onChange({ country: e.target.value, region: '', language: '' })}
          >
            <option value="">Choisir un pays</option>
            {countryOptions.map((c) => (
              <option key={c.ISO3} value={c.ISO3}>
                {c.nameFr}
              </option>
            ))}
            {geography
              .filter(
                (e) => e.kind === 'country' && !countryOptions.some((c) => c.ISO3 === e.country),
              )
              .map((e) => (
                <option key={e.id} value={e.country} data-no-translate>
                  {e.labelFr || e.name || e.country}
                </option>
              ))}
          </select>
        </label>
        <label>
          Région (facultatif)
          <select
            aria-label="Région de l’interlocuteur"
            disabled={!value.country}
            value={value.region}
            onChange={(e) =>
              onChange({
                ...value,
                region: e.target.value,
                language: compatibleLanguage(value.language, names, value.country, e.target.value),
              })
            }
          >
            <option value="">Région non précisée</option>
            {sortedRegions(
              regions.filter((r) => r.countryISO3 === value.country),
              locale,
            ).map((r) => (
              <option key={r.id} value={r.id}>
                {regionLabel(r)}
              </option>
            ))}
            {geography
              .filter(
                (e) =>
                  e.kind === 'region' &&
                  e.country === value.country &&
                  !regions.some((r) => r.id === e.region),
              )
              .map((e) => (
                <option key={e.id} value={e.region} data-no-translate>
                  {e.labelFr || e.name || e.region}
                </option>
              ))}
          </select>
        </label>
        <label>
          Langue (facultatif)
          <select
            aria-label="Langue de l’interlocuteur"
            disabled={!value.country}
            value={value.language}
            onChange={(e) => onChange({ ...value, language: e.target.value })}
          >
            <option value="">Langue non précisée</option>
            {languages.map((l) => (
              <option key={l.id} value={l.id}>
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </fieldset>
  );
}
export default withLocale(DestinationPicker);
