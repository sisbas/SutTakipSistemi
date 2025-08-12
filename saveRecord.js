const fetch = globalThis.fetch || ((...args) => import('node-fetch').then(({default: fetch}) => fetch(...args)));

const BASE_ID = 'appngTzrsiNEo3rIN';
const TOKEN = 'patsJ4tw6oyhjni4x.5bc8cb0bd6e294bf21f49fb569b069ecfa4238828330459fe19fd9aee5dbeb2b';

async function saveRecord(table, fields) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${encodeURIComponent(table)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ records: [{ fields }] })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${text}`);
  }

  return res.json();
}

if (require.main === module) {
  saveRecord('Tablo1', {
    'Müstahsil Adı': 'Örnek',
    'Tarih': new Date().toISOString().split('T')[0],
    'Sabah Süt (L)': 5,
    'Akşam Süt (L)': 3,
    'Toplam Süt (L)': 8,
    'Köy': 'Yuvalı',
    'Kayıt Tarihi': new Date().toISOString()
  })
    .then(data => {
      console.log('Kayıt eklendi:', data.records[0].id);
    })
    .catch(err => {
      console.error('Kayıt hatası:', err.message);
    });
}

module.exports = saveRecord;
