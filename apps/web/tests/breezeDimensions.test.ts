import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getHubIconSet } from '../src/services/hubData.js';
import { renderSvgString } from '../src/services/renderService.js';

describe('KDE Breeze Icon Dimensions and ViewBox', () => {
  it('ensures KDE Breeze icons retain their 22x22 dimensions instead of defaulting to 16x16', async () => {
    const hubRes = await getHubIconSet('breeze');
    assert.ok(hubRes, 'Breeze set must load');

    const icon = hubRes.iconSet.icons['accept_signal'];
    assert.ok(icon, 'accept_signal icon must exist');

    // Root cause: width and height must not be undefined
    assert.equal(icon.width, 22, `Expected width to be 22, but got ${icon.width}`);
    assert.equal(icon.height, 22, `Expected height to be 22, but got ${icon.height}`);

    // Rendered SVG must have viewBox 0 0 22 22, not 0 0 16 16
    const svg = renderSvgString(icon, { size: 24 });
    assert.match(svg, /viewBox="0 0 22 22"/, 'Breeze icon SVG viewBox must be 0 0 22 22 so it is not clipped');
    assert.doesNotMatch(svg, /viewBox="0 0 16 16"/, 'Breeze icon must not be cut off with a 16x16 viewBox');
  });

  it('correctly resolves aliases in KDE Breeze with full 22x22 dimensions', async () => {
    const hubRes = await getHubIconSet('breeze');
    assert.ok(hubRes, 'Breeze set must load');

    const aliasIcon = hubRes.iconSet.icons['accept_signal-symbolic'];
    assert.ok(aliasIcon, 'accept_signal-symbolic alias must resolve as a valid icon');
    assert.equal(aliasIcon.width, 22);
    assert.equal(aliasIcon.height, 22);

    const svg = renderSvgString(aliasIcon, { size: 32 });
    assert.match(svg, /viewBox="0 0 22 22"/);
  });
});
