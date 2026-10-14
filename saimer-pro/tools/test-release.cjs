const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const seo = require('./seo.cjs');
const { build, validateRelease } = require('./build-production.cjs');
const readiness = seo.config.releaseReadiness;
const contact = seo.read('contact/index.html');
const privacy = seo.read('privacy/index.html');
let cases = 0;
validateRelease(readiness, contact, privacy); cases++;
for (const mutate of [r => { delete r.email; }, r => { r.email.status = 'pending'; }, r => { r.email.verifiedOn = ''; }, r => { r.email.evidence = ''; }]) {
  const r = structuredClone(readiness); mutate(r);
  assert.throws(() => validateRelease(r, contact, privacy), /往復送受信/); cases++;
}
const wrongAddress = structuredClone(readiness); wrongAddress.email.address = 'other@example.com';
assert.throws(() => validateRelease(wrongAddress, contact, privacy), /一致/); cases++;
assert.throws(() => validateRelease(readiness, contact.replace('data-contact-ready="true"', 'data-contact-ready="false"'), privacy), /一致/); cases++;
for (const mutate of [r => { delete r.privacy; }, r => { r.privacy.status = 'pending'; }, r => { r.privacy.approvedOn = ''; }, r => { r.privacy.evidence = ''; }]) {
  const r = structuredClone(readiness); mutate(r);
  assert.throws(() => validateRelease(r, contact, privacy), /最終承認/); cases++;
}
assert.throws(() => validateRelease(readiness, contact, privacy.replace('個人情報の取得', '変更した個人情報の取得')), /承認後に変更/); cases++;
// A blocked build must not leave a deployable partial package.
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'saimer-release-'));
const previous = readiness.privacy.status;
try {
  readiness.privacy.status = 'pending';
  const output = path.join(temp, 'public_html');
  assert.throws(() => build(output), /最終承認/);
  assert(!fs.existsSync(output)); cases++;
} finally {
  readiness.privacy.status = previous;
  assert(path.dirname(temp) === os.tmpdir() && path.basename(temp).startsWith('saimer-release-'));
  fs.rmSync(temp, { recursive: true, force: true });
}
console.log(JSON.stringify({ releaseCases: cases, emailVerified: true, privacyApproved: true, changedWordingBlocked: true, partialOutputPrevented: true }));
