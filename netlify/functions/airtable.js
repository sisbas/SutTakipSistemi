const https = require('https');

const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appngTzrsiNEo3rIN';
const TOKEN = process.env.AIRTABLE_PAT;

exports.handler = async function(event) {
  const { httpMethod, queryStringParameters = {} } = event;
  const { table, recordId, offset, pageSize } = queryStringParameters;

  if (!TOKEN) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'AIRTABLE_PAT not configured' })
    };
  }

  if (!table) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'table is required' })
    };
  }

  let path = `/v0/${BASE_ID}/${encodeURIComponent(table)}`;
  if (recordId) {
    path += `/${recordId}`;
  }

  const params = new URLSearchParams();
  if (offset) params.append('offset', offset);
  if (pageSize) params.append('pageSize', pageSize);
  const qs = params.toString();
  if (qs) path += `?${qs}`;

  const body = (httpMethod !== 'GET' && httpMethod !== 'HEAD') ? (event.body || '') : null;

  const headers = {
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Type': 'application/json'
  };

  if (body) {
    headers['Content-Length'] = Buffer.byteLength(body);
  }

  const options = {
    method: httpMethod,
    hostname: 'api.airtable.com',
    path,
    headers
  };

  return new Promise(resolve => {
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: {
            'Content-Type': res.headers['content-type'] || 'application/json'
          },
          body: data
        });
      });
    });

    req.on('error', err => {
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: err.message })
      });
    });

    if (body) {
      req.write(body);
    }
    req.end();
  });
};
