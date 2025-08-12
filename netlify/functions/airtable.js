const BASE_ID = process.env.AIRTABLE_BASE_ID || 'appngTzrsiNEo3rIN';

exports.handler = async function(event) {
  const { httpMethod, queryStringParameters = {} } = event;
  const { httpMethod, queryStringParameters } = event;
  const { table, recordId, offset, pageSize } = queryStringParameters;

  if (!table) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'table is required' })
    };
  }

  let url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`;
  const baseId = queryStringParameters.baseId || BASE_ID;
  let url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
  if (recordId) {
    url += `/${recordId}`;
  }

  const params = new URLSearchParams();
  if (offset) params.append('offset', offset);
  if (pageSize) params.append('pageSize', pageSize);
  const qs = params.toString();
  if (qs) url += `?${qs}`;

  const init = {
    method: httpMethod,
    headers: {
      'Authorization': `Bearer ${process.env.AIRTABLE_PAT}`,
      'Content-Type': 'application/json'
    }
  };

  if (httpMethod !== 'GET' && httpMethod !== 'HEAD') {
    init.body = event.body;
  }

  try {
    const resp = await fetch(url, init);
    const text = await resp.text();
    return {
      statusCode: resp.status,
      headers: {
        'Content-Type': resp.headers.get('content-type') || 'application/json'
      },
      body: text
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
