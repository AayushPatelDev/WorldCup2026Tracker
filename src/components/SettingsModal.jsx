import { useState } from 'react';
import TimezoneSelect from './TimezoneSelect.jsx';
import { Globe, Close } from './Icons.jsx';
import { detectedTz, tzAbbr, fmtTime } from '../lib/helpers.js';

// Timezone settings. `firstRun` is the post-login "Looks right?" confirmation
// when no preference has been saved yet.
export default function SettingsModal({ tz, onSave, onClose, firstRun = false }) {
  const [value, setValue] = useState(tz || detectedTz);
  const now = new Date();

  return (
    <div className="modal-backdrop" onClick={firstRun ? undefined : onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3 className="modal-title">
            <Globe size={16} /> {firstRun ? 'SET YOUR TIMEZONE' : 'TIMEZONE'}
          </h3>
          {!firstRun && (
            <button type="button" className="drawer-close" onClick={onClose} title="Close">
              <Close />
            </button>
          )}
        </div>

        <p className="modal-sub">
          {firstRun
            ? `We detected ${detectedTz.replace(/_/g, ' ')}. Looks right? Every kickoff time across Pitchside will be shown in this zone.`
            : 'All kickoff times across Pitchside are shown in this zone.'}
        </p>

        <TimezoneSelect value={value} onChange={setValue} />

        <div className="modal-preview mono">
          Right now: {fmtTime(now, value)} {tzAbbr(value, now)}
        </div>

        <div className="modal-actions">
          {firstRun && value !== detectedTz && (
            <button type="button" className="btn btn-ghost" onClick={() => setValue(detectedTz)}>
              Reset to detected
            </button>
          )}
          <button type="button" className="btn btn-gold" onClick={() => onSave(value)}>
            {firstRun ? 'Looks right — save' : 'Save timezone'}
          </button>
        </div>
      </div>
    </div>
  );
}
