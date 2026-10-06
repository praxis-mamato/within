import { useEffect, useId, useMemo, useState } from 'react';
import { formatOffset, isValidZone, loadPlaces, localToUtc, placeLabel, searchPlaces, type Place } from '../geo/places';
import type { Birth } from '../state';

/** Birth date, time with its precision, and place. Every field says why it's needed (PRD §4). */
export function BirthFields({ value, onChange, idPrefix }: { value: Birth; onChange: (b: Birth) => void; idPrefix: string }) {
  const id = (s: string) => `${idPrefix}-${s}`;
  const set = (patch: Partial<Birth>) => onChange({ ...value, ...patch });
  return (
    <>
      <label htmlFor={id('date')}>
        Birth date <span className="hint">Both traditions start from the date.</span>
      </label>
      <input id={id('date')} type="date" value={value.date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ date: e.target.value })} />

      <fieldset className="radio-list">
        <legend>
          Birth time <span className="hint">Needed for rising sign, houses, and some timing. We never guess it.</span>
        </legend>
        {(
          [
            ['exact', 'I know it'],
            ['approximate', 'I know roughly'],
            ['unknown', 'I don’t know'],
          ] as const
        ).map(([v, l]) => (
          <label key={v}>
            <input type="radio" name={id('tp')} checked={value.timePrecision === v} onChange={() => set({ timePrecision: v, time: v === 'unknown' ? '' : value.time || '12:00' })} />
            {l}
          </label>
        ))}
      </fieldset>
      {value.timePrecision !== 'unknown' && (
        <>
          <label htmlFor={id('time')}>Local time of birth</label>
          <input id={id('time')} type="time" value={value.time} onChange={(e) => set({ time: e.target.value })} />
        </>
      )}
      {value.timePrecision === 'approximate' && (
        <>
          <label htmlFor={id('win')}>Give or take</label>
          <select id={id('win')} value={value.windowMinutes} onChange={(e) => set({ windowMinutes: Number(e.target.value) })}>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
            <option value={120}>2 hours</option>
            <option value={240}>4 hours</option>
          </select>
        </>
      )}

      <PlacePicker value={value} onChange={onChange} idPrefix={idPrefix} />
    </>
  );
}

function PlacePicker({ value, onChange, idPrefix }: { value: Birth; onChange: (b: Birth) => void; idPrefix: string }) {
  const listId = useId();
  const [places, setPlaces] = useState<Place[] | null>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [manual, setManual] = useState(false);

  useEffect(() => {
    let live = true;
    loadPlaces().then((p) => live && setPlaces(p));
    return () => {
      live = false;
    };
  }, []);

  const results = useMemo(() => (places && query.trim().length >= 2 ? searchPlaces(places, query) : []), [places, query]);
  const choose = (p: Place) => {
    onChange({ ...value, place: placeLabel(p), lat: p.lat, lon: p.lon, tz: p.tz });
    setQuery('');
    setOpen(false);
  };

  const zones = useMemo(() => {
    try {
      return (Intl as unknown as { supportedValuesOf: (k: string) => string[] }).supportedValuesOf('timeZone');
    } catch {
      return [value.tz];
    }
  }, [value.tz]);

  const resolved = useMemo(() => {
    if (!value.date || !isValidZone(value.tz)) return null;
    try {
      return localToUtc(value.date, value.timePrecision === 'unknown' ? '12:00' : value.time || '12:00', value.tz);
    } catch {
      return null;
    }
  }, [value.date, value.time, value.timePrecision, value.tz]);

  return (
    <>
      <label htmlFor={`${idPrefix}-place`}>
        Birth place <span className="hint">Sets the time zone and the sky’s position. Search towns of 5,000+ people.</span>
      </label>
      <div className="combo">
        <input
          id={`${idPrefix}-place`}
          type="text"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
          autoComplete="off"
          placeholder={places ? 'Start typing a city, e.g. Pune or Portland OR' : 'Loading places…'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (!results.length) return;
            if (e.key === 'ArrowDown') (e.preventDefault(), setActive((active + 1) % results.length));
            else if (e.key === 'ArrowUp') (e.preventDefault(), setActive((active - 1 + results.length) % results.length));
            else if (e.key === 'Enter') (e.preventDefault(), choose(results[active]));
            else if (e.key === 'Escape') setOpen(false);
          }}
        />
        {open && results.length > 0 && (
          <ul id={listId} role="listbox" className="combo-list" aria-label="Matching places">
            {results.map((p, i) => (
              <li
                key={`${p.name}-${p.lat}-${p.lon}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => (e.preventDefault(), choose(p))}
              >
                <strong>{p.name}</strong>
                <span className="small muted">
                  {[p.region, p.country].filter(Boolean).join(', ')} · {p.lat.toFixed(2)}, {p.lon.toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
        )}
        {open && places && query.trim().length >= 2 && results.length === 0 && (
          <p className="small muted" role="status">
            No match. Try a nearby larger town, or enter coordinates below.
          </p>
        )}
      </div>

      <div className="card soft resolved" aria-live="polite">
        <p style={{ margin: 0 }}>
          <strong>{value.place || 'No place chosen yet'}</strong>
        </p>
        <p className="small" style={{ margin: 0 }}>
          {value.lat.toFixed(3)}°{value.lat >= 0 ? 'N' : 'S'}, {Math.abs(value.lon).toFixed(3)}°{value.lon >= 0 ? 'E' : 'W'} · {value.tz}
          {resolved && <> · {formatOffset(resolved.offset)} on that date</>}
        </p>
        {value.timePrecision !== 'unknown' && resolved && (
          <p className="small muted" style={{ margin: 0 }}>
            {value.time} local is {resolved.utc.toISOString().slice(11, 16)} UTC.
          </p>
        )}
        <button type="button" className="link small" aria-expanded={manual} onClick={() => setManual(!manual)}>
          {manual ? 'Hide coordinates' : 'Wrong time zone, or enter coordinates?'}
        </button>
      </div>

      {manual && (
        <div className="row-2">
          <div>
            <label htmlFor={`${idPrefix}-lat`}>Latitude</label>
            <input id={`${idPrefix}-lat`} type="text" inputMode="decimal" value={value.lat} onChange={(e) => Number.isFinite(Number(e.target.value)) && onChange({ ...value, lat: Math.max(-89.9, Math.min(89.9, Number(e.target.value))) })} />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-lon`}>Longitude (east +)</label>
            <input id={`${idPrefix}-lon`} type="text" inputMode="decimal" value={value.lon} onChange={(e) => Number.isFinite(Number(e.target.value)) && onChange({ ...value, lon: Math.max(-180, Math.min(180, Number(e.target.value))) })} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label htmlFor={`${idPrefix}-tz`}>Time zone</label>
            <select id={`${idPrefix}-tz`} value={value.tz} onChange={(e) => onChange({ ...value, tz: e.target.value })}>
              {(zones.includes(value.tz) ? zones : [value.tz, ...zones]).map((z) => (
                <option key={z}>{z}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </>
  );
}
