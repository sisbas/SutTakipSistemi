const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

exports.handler = async function(event) {
  try {
    const { httpMethod, queryStringParameters = {} } = event;
    const { table, recordId } = queryStringParameters;

    if (!SUPABASE_URL || !SUPABASE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured' })
      };
    }

    if (!table) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'table is required' })
      };
    }

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json'
    };

    if (httpMethod === 'GET') {
      const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
      url.searchParams.set('select', '*');
      const resp = await fetch(url, { headers });
      const data = await resp.json();
      return { statusCode: resp.status, body: JSON.stringify(data) };
    }

    if (httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const record = (body.records && body.records[0] && body.records[0].fields) || body;
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(record)
      });
      const data = await resp.json();
      return { statusCode: resp.status, body: JSON.stringify(data) };
    }

    if (httpMethod === 'PATCH') {
      if (!recordId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'recordId is required' }) };
      }
      const body = JSON.parse(event.body || '{}');
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${recordId}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(body.fields || body)
      });
      const data = await resp.json();
      return { statusCode: resp.status, body: JSON.stringify(data) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || String(err) }) };
  }
};
