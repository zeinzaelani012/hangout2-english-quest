// Tier 1 rendering — turns the manifest into MP3s a paid TTS provider makes.
// Part K rule 4: the app never blocks on this. Tier 0 ships free, today; this
// script runs offline, on the developer's machine, whenever a provider key is
// available. The app and this script share one contract: /public/audio/<hash>.mp3
// keyed by role + normalised text, never by slot id or voice.
//
// Usage:
//   TTS_PROVIDER=elevenlabs ELEVENLABS_API_KEY=... TTS_VOICE_ID=... npm run audio:render
//   TTS_PROVIDER=openai     OPENAI_API_KEY=...     TTS_VOICE_ID=alloy   npm run audio:render
//   TTS_PROVIDER=google     GOOGLE_TTS_KEY=...                          npm run audio:render
//   TTS_PROVIDER=azure      AZURE_SPEECH_KEY=... AZURE_SPEECH_REGION=... npm run audio:render
//   --only=unit3            render one unit's clips
//   --force                 re-render clips whose files already exist
//
// Per clip we write a sidecar JSON (provider, voiceId, voiceName, renderedAt)
// — this is what Settings → Voice reads to say WHICH voice rendered a file,
// and it is why the manifest itself has no voice field.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const MANIFEST = path.join(ROOT, 'src/data/audio/manifest.json');
const OUT_DIR = path.join(ROOT, 'public/audio');
const RENDER_INFO = path.join(ROOT, 'src/data/audio/render-info.json');

const PROVIDERS = new Set(['elevenlabs', 'openai', 'google', 'azure']);

const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const onlyArg = args.find(a => a.startsWith('--only='));
const onlyUnit = onlyArg ? Number(onlyArg.split('=')[1]) : null;

const provider = process.env.TTS_PROVIDER ?? '';
const KEYS = {
  elevenlabs: process.env.ELEVENLABS_API_KEY,
  openai: process.env.OPENAI_API_KEY,
  google: process.env.GOOGLE_TTS_KEY,
  azure: process.env.AZURE_SPEECH_KEY,
};
const voiceId = process.env.TTS_VOICE_ID ?? '';
const voiceName = process.env.TTS_VOICE_NAME ?? voiceId ?? '';

function fail(msg) {
  console.error(`render-audio: ${msg}`);
  process.exit(1);
}

if (!PROVIDERS.has(provider)) {
  fail(`set TTS_PROVIDER to one of ${[...PROVIDERS].join(', ')} — the key is read from the matching env var and never logged`);
}
if (!KEYS[provider]) {
  fail(`no API key found for ${provider} — set the env var and try again (the key is never logged or committed)`);
}

const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
fs.mkdirSync(OUT_DIR, { recursive: true });

const clips = Object.values(manifest.clips)
  .filter(c => (onlyUnit === null ? true : c.unit === onlyUnit))
  .sort((a, b) => (a.unit - b.unit) || a.hash.localeCompare(b.hash));

console.log(`render-audio: provider=${provider}, clips in scope=${clips.length}${onlyUnit ? ` (unit ${onlyUnit})` : ''}`);

// The four provider endpoints. Each call returns raw MP3 bytes; all
// post-processing happens locally in ffmpeg so every provider sounds the same.
async function synthesize(clip) {
  const text = clip.text;
  switch (provider) {
    case 'elevenlabs': {
      const id = voiceId || fail('set TTS_VOICE_ID for elevenlabs');
      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'xi-api-key': KEYS.elevenlabs, 'content-type': 'application/json' },
        body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2' }),
      });
      if (!res.ok) throw new Error(`elevenlabs ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    }
    case 'openai': {
      const res = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: { authorization: `Bearer ${KEYS.openai}`, 'content-type': 'application/json' },
        body: JSON.stringify({ model: 'tts-1', voice: voiceId || 'alloy', input: text, response_format: 'mp3' }),
      });
      if (!res.ok) throw new Error(`openai ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    }
    case 'google': {
      const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${KEYS.google}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: 'en-US' },
          audioConfig: { audioEncoding: 'MP3' },
        }),
      });
      if (!res.ok) throw new Error(`google ${res.status}`);
      const data = await res.json();
      return Buffer.from(data.audioContent, 'base64');
    }
    case 'azure': {
      const region = process.env.AZURE_SPEECH_REGION ?? fail('set AZURE_SPEECH_REGION for azure');
      const tokenRes = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
        method: 'POST',
        headers: { 'Ocp-Apim-Subscription-Key': KEYS.azure },
      });
      if (!tokenRes.ok) throw new Error(`azure token ${tokenRes.status}`);
      const token = await tokenRes.text();
      const ssml =
        `<speak version="1.0" xml:lang="en-US"><voice name="${voiceName || 'en-US-AriaNeural'}">` +
        text.replace(/&/g, '&amp;').replace(/</g, '&lt;') +
        '</voice></speak>';
      const res = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: 'POST',
        headers: { authorization: `Bearer ${token}`, 'content-type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-16khz-32kbitrate-mono-mp3' },
        body: ssml,
      });
      if (!res.ok) throw new Error(`azure ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    }
  }
}

// Post-process (Part I): trim leading silence to 150 ms and trailing to
// 300 ms, normalise to -16 LUFS, export 64 kbps mono MP3. Over 20 MB per
// unit means the wrong bitrate — 64 kbps mono is the whole budget.
function postProcess(rawPath, outPath) {
  execFileSync('ffmpeg', [
    '-y', '-i', rawPath,
    '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.3,areverse,loudnorm=I=-16:TP=-1.5:LRA=11',
    '-ar', '24000', '-ac', '1', '-b:a', '64k',
    outPath,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
}

let done = 0, skipped = 0, failed = 0;
const renderInfo = JSON.parse(fs.readFileSync(RENDER_INFO, 'utf8'));
const tmpRaw = path.join(OUT_DIR, '.raw.mp3');

for (const clip of clips) {
  const outPath = path.join(OUT_DIR, `${clip.hash}.mp3`);
  if (fs.existsSync(outPath) && !FORCE) {
    skipped++;
    continue;
  }
  try {
    const audio = await synthesize(clip);
    fs.writeFileSync(tmpRaw, audio);
    postProcess(tmpRaw, outPath);
    fs.rmSync(tmpRaw, { force: true });
    renderInfo.clips[clip.hash] = {
      provider,
      voiceId: voiceId || provider,
      voiceName: voiceName || provider,
      renderedAt: new Date().toISOString(),
    };
    done++;
    if (done % 25 === 0) console.log(`  rendered ${done}…`);
  } catch (err) {
    failed++;
    console.error(`  FAIL ${clip.hash} (${clip.category}, unit ${clip.unit}): ${err.message}`);
    fs.rmSync(tmpRaw, { force: true });
    // A failure here should stop the run, not silently produce a hole.
    if (failed >= 3) fail('three clips failed in a row — stopping before burning the key budget');
  }
}

renderInfo.generated = new Date().toISOString();
renderInfo.provider = provider;
fs.writeFileSync(RENDER_INFO, `${JSON.stringify(renderInfo, null, 2)}\n`);

console.log(`render-audio: rendered=${done} skipped=${skipped} failed=${failed}`);
console.log('render-audio: run `npm run audio:verify` to check the result');
