// netlify/functions/onboarding.js
// Receives client onboarding form submission and emails it to Mark.
// Uses the same Resend setup as assessment.js — requires RESEND_API_KEY env var.

const https = require('https');

// ── HTTP helper ───────────────────────────────────────────────────────────────

function resendPost(apiKey, payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const req = https.request(
      {
        hostname: 'api.resend.com',
        port: 443,
        path: '/emails',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let d = '';
        res.on('data', c => (d += c));
        res.on('end', () => resolve({ status: res.statusCode, body: d }));
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Formatting helpers ────────────────────────────────────────────────────────

const PROBLEM_LABELS = {
  'not-enough-leads':       'Not enough leads or enquiries',
  'website-not-converting': 'Website isn\'t converting visitors',
  'no-google-visibility':   'Not showing up on Google',
  'ads-not-working':        'Paid ads not profitable',
  'slow-outdated-site':     'Website looks outdated / loads slowly',
  'no-strategy':            'No clear marketing strategy',
  'other-problem':          'Something else (see description)',
};

const AD_LABELS = {
  'google-ads': 'Google Ads',
  'meta-ads':   'Meta (Facebook/Instagram)',
  'tiktok-ads': 'TikTok Ads',
  'linkedin-ads': 'LinkedIn Ads',
  'no-ads':     'Not running ads',
};

const BUDGET_LABELS = {
  'under-500':  'Under $500/mo',
  '500-1500':   '$500–$1,500/mo',
  '1500-3000':  '$1,500–$3,000/mo',
  '3000-plus':  '$3,000+/mo',
};

const TIMELINE_LABELS = {
  'immediately':    'Right away',
  '1-month':        'Within a month',
  '1-3-months':     '1–3 months',
  'just-exploring': 'Just exploring',
};

function pill(text, color = '#0f172a', bg = '#f1f5f9') {
  return `<span style="display:inline-block;background:${bg};color:${color};font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;margin:2px 3px 2px 0;letter-spacing:0.03em;">${text}</span>`;
}

function accentPill(text) {
  return pill(text, '#14532d', '#ecfccb');
}

function row(label, value) {
  if (!value || (Array.isArray(value) && value.length === 0)) return '';
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;vertical-align:top;width:38%;">
        <span style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;">${label}</span>
      </td>
      <td style="padding:12px 0 12px 16px;border-bottom:1px solid #f1f5f9;vertical-align:top;">
        <span style="font-size:14px;color:#1e293b;line-height:1.6;">${value}</span>
      </td>
    </tr>`;
}

function section(title, emoji, content) {
  return `
    <div style="margin-bottom:28px;">
      <h2 style="font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:#64748b;margin:0 0 12px;display:flex;align-items:center;gap:6px;">
        ${emoji} ${title}
      </h2>
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;padding:0 16px;">
        <table width="100%" cellpadding="0" cellspacing="0">${content}</table>
      </div>
    </div>`;
}

// ── Email builder ─────────────────────────────────────────────────────────────

function buildEmail(d) {
  const name = `${d.firstName} ${d.lastName}`.trim();
  const problems = (d.mainProblems || []).map(p => accentPill(PROBLEM_LABELS[p] || p)).join('');
  const adPlats  = (d.adPlatforms  || []).map(p => pill(AD_LABELS[p] || p)).join('');

  const budgetLabel   = BUDGET_LABELS[d.budget]   || d.budget   || '—';
  const timelineLabel = TIMELINE_LABELS[d.timeline] || d.timeline || '—';

  // Budget emphasis color
  const budgetColor = d.budget === '3000-plus' ? '#14532d' : d.budget === '1500-3000' ? '#1d4ed8' : '#475569';
  const budgetBg    = d.budget === '3000-plus' ? '#ecfccb' : d.budget === '1500-3000' ? '#dbeafe' : '#f1f5f9';

  const urgencyNote = d.timeline === 'immediately' ? '🔥 Wants to start right away' :
                      d.timeline === '1-month'    ? '⚡ Looking to start within a month' : '';

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:28px 16px;">
<tr><td>
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;margin:0 auto;background:#f8fafc;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.08);">

  <!-- Header -->
  <tr><td style="background:#0b1120;padding:24px 32px;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td>
        <div style="font-size:18px;font-weight:900;color:#fff;letter-spacing:-.02em;">overhauled.ai</div>
        <div style="font-size:12px;color:#84cc16;margin-top:3px;font-weight:700;">New Client Onboarding</div>
      </td>
      <td style="text-align:right;vertical-align:top;">
        ${urgencyNote ? `<div style="font-size:12px;font-weight:700;color:#fbbf24;background:rgba(251,191,36,0.12);border:1px solid rgba(251,191,36,0.25);padding:5px 12px;border-radius:100px;">${urgencyNote}</div>` : ''}
      </td>
    </tr></table>
  </td></tr>

  <!-- Summary bar -->
  <tr><td style="background:#0f172a;padding:16px 32px;border-bottom:2px solid #84cc16;">
    <table width="100%" cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:top;">
        <div style="font-size:20px;font-weight:900;color:#fff;">${name}</div>
        <div style="font-size:14px;color:#94a3b8;margin-top:3px;">${d.businessName}${d.industry ? ` · ${d.industry}` : ''}</div>
        <div style="margin-top:8px;">
          <a href="mailto:${d.email}" style="font-size:13px;color:#84cc16;text-decoration:none;">${d.email}</a>
          ${d.website ? ` · <a href="https://${d.website.replace(/^https?:\/\//, '')}" style="font-size:13px;color:#84cc16;text-decoration:none;">${d.website}</a>` : ''}
        </div>
      </td>
      <td style="text-align:right;vertical-align:top;">
        <div style="display:inline-block;background:${budgetBg};color:${budgetColor};font-size:14px;font-weight:800;padding:8px 16px;border-radius:10px;">${budgetLabel}</div>
        <div style="font-size:11px;color:#64748b;margin-top:4px;text-align:right;">budget</div>
      </td>
    </tr></table>
  </td></tr>

  <!-- Body -->
  <tr><td style="padding:28px 32px;">

    ${section('About the Business', '🏢', `
      ${row('Business name', d.businessName)}
      ${row('Industry', d.industry)}
      ${row('In business', d.businessAge)}
      ${row('Website', d.website ? `<a href="https://${d.website.replace(/^https?:\/\//,'')}" style="color:#65a30d;">${d.website}</a>` : '')}
      ${row('Referred by', d.referralSource)}
    `)}

    ${section('The Problem', '🔍', `
      ${row('Issues flagged', problems || '—')}
      ${row('In their words', d.problemDetail ? `<em style="color:#334155;">"${d.problemDetail}"</em>` : '')}
      ${row('How long', d.problemDuration)}
      ${row('Tried before', d.pastAttempts)}
    `)}

    ${section('Current Setup & Assets', '🛠️', `
      ${row('Website platform', d.websitePlatform)}
      ${row('Running ads on', adPlats || pill('Not running ads'))}
      ${row('Monthly traffic', d.monthlyTraffic)}
      ${row('Email list size', d.emailList)}
      ${row('CRM / Email tool', d.crmTool)}
      ${row('Notes on setup', d.assetNotes)}
    `)}

    ${section('Goals & Budget', '🎯', `
      ${row('Success looks like', d.successLooksLike ? `<em style="color:#334155;">"${d.successLooksLike}"</em>` : '')}
      ${row('Timeline to start', timelineLabel)}
      ${row('Monthly budget', `<strong style="color:${budgetColor};">${budgetLabel}</strong>`)}
      ${row('Anything else', d.anythingElse)}
    `)}

    <!-- CTA -->
    <div style="background:#0b1120;border-radius:12px;padding:24px;text-align:center;">
      <p style="color:#94a3b8;font-size:13px;margin:0 0 12px;">Ready to follow up? Book a call with ${d.firstName}.</p>
      <a href="https://calendly.com/ads-rtu/vrume-quick-connect" style="display:inline-block;background:#84cc16;color:#0b1120;font-weight:800;font-size:14px;padding:12px 28px;border-radius:999px;text-decoration:none;">Book a Call →</a>
      ${d.email ? `<p style="margin:12px 0 0;"><a href="mailto:${d.email}" style="font-size:12px;color:#64748b;">${d.email}</a></p>` : ''}
    </div>

    <p style="font-size:11px;color:#94a3b8;margin:20px 0 0;text-align:center;">
      Submitted via <a href="https://overhauled.ai/onboarding" style="color:#84cc16;">overhauled.ai/onboarding</a>
    </p>

  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

exports.handler = async function (event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const { firstName, lastName, email, businessName } = data;
  if (!firstName || !email || !businessName) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Missing required fields' }) };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const name   = `${firstName} ${lastName || ''}`.trim();
  const subject = `[New Client] ${name} — ${businessName}${data.budget ? ` · ${data.budget}` : ''}`;

  console.log(`[onboarding] ${name} <${email}> · ${businessName}`);

  if (!apiKey) {
    console.log('[onboarding] No RESEND_API_KEY — logging data only:', JSON.stringify(data, null, 2));
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  }

  try {
    const result = await resendPost(apiKey, {
      from: 'Overhauled.ai Onboarding <hello@overhauled.ai>',
      to: ['ads@vrume.com'],
      reply_to: email,
      subject,
      html: buildEmail(data),
    });
    console.log(`[onboarding] Email sent: ${result.status}`);
  } catch (err) {
    console.error('[onboarding] Email failed:', err.message);
    // Don't fail the user-facing request
  }

  return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
};
