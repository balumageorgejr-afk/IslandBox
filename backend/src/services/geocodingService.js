const https = require('https');
const { query } = require('../config/db');

const GEOAPIFY_API_KEY = process.env.GEOAPIFY_API_KEY || '';

// Known Bohol/Visayas landmarks for reliable fallback
const BOHOL_FALLBACK_COORDINATES = [
  { match: /panglao|alona|tawala/i, lat: 9.5772, lng: 123.7711, formatted: 'Panglao Island, Bohol, Philippines' },
  { match: /antequera|weaving|basket/i, lat: 9.7797, lng: 123.9008, formatted: 'Antequera, Bohol, Philippines' },
  { match: /jagna|calamay/i, lat: 9.6528, lng: 124.3686, formatted: 'Jagna, Bohol, Philippines' },
  { match: /carmen|chocolate hills|tarsier/i, lat: 9.8297, lng: 124.1972, formatted: 'Carmen, Bohol, Philippines' },
  { match: /tubigon|raffia/i, lat: 9.9519, lng: 123.9622, formatted: 'Tubigon, Bohol, Philippines' },
  { match: /tagbilaran|cogon|dampas/i, lat: 9.6444, lng: 123.8558, formatted: 'Tagbilaran City, Bohol, Philippines' },
  { match: /loboc/i, lat: 9.6384, lng: 124.0326, formatted: 'Loboc, Bohol, Philippines' },
  { match: /anda/i, lat: 9.7467, lng: 124.5772, formatted: 'Anda, Bohol, Philippines' },
  { match: /cebu/i, lat: 10.3157, lng: 123.8854, formatted: 'Cebu City, Central Visayas, Philippines' },
];

/**
 * Resolves address string to { latitude, longitude, formatted_address }
 */
async function resolveAddress(addressString) {
  if (!addressString || !addressString.trim()) {
    return {
      latitude: 9.6444,
      longitude: 123.8558,
      formatted_address: 'Tagbilaran City, Bohol, Philippines',
      source: 'default',
    };
  }

  const cleanQuery = addressString.trim().toLowerCase();

  // 1. Check PostgreSQL geocoding_cache
  try {
    const cached = await query(
      'SELECT latitude, longitude, formatted_address FROM geocoding_cache WHERE LOWER(address_query) = $1 LIMIT 1',
      [cleanQuery]
    );

    if (cached.rows.length > 0) {
      return {
        latitude: parseFloat(cached.rows[0].latitude),
        longitude: parseFloat(cached.rows[0].longitude),
        formatted_address: cached.rows[0].formatted_address,
        source: 'db_cache',
      };
    }
  } catch (err) {
    console.warn('Geocoding cache lookup error:', err.message);
  }

  // 2. Query Geoapify API if API key is provided
  if (GEOAPIFY_API_KEY && GEOAPIFY_API_KEY.trim()) {
    try {
      const geoResult = await callGeoapifyApi(addressString, GEOAPIFY_API_KEY);
      if (geoResult && geoResult.latitude && geoResult.longitude) {
        // Save to cache
        await query(
          `INSERT INTO geocoding_cache (address_query, formatted_address, latitude, longitude, raw_response)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (address_query) DO NOTHING;`,
          [
            addressString,
            geoResult.formatted_address,
            geoResult.latitude,
            geoResult.longitude,
            JSON.stringify(geoResult.raw),
          ]
        );
        return {
          latitude: geoResult.latitude,
          longitude: geoResult.longitude,
          formatted_address: geoResult.formatted_address,
          source: 'geoapify_api',
        };
      }
    } catch (apiErr) {
      console.warn('Geoapify call failed, falling back to local coordinate mapper:', apiErr.message);
    }
  }

  // 3. Fallback to Bohol/Visayas landmark coordinates
  for (const item of BOHOL_FALLBACK_COORDINATES) {
    if (item.match.test(addressString)) {
      // Store in cache for future instant lookup
      try {
        await query(
          `INSERT INTO geocoding_cache (address_query, formatted_address, latitude, longitude, raw_response)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (address_query) DO NOTHING;`,
          [
            addressString,
            `${addressString} (${item.formatted})`,
            item.lat,
            item.lng,
            JSON.stringify({ source: 'bohol_fallback', matched: item.formatted }),
          ]
        );
      } catch (e) {
        // ignore cache write error
      }

      return {
        latitude: item.lat,
        longitude: item.lng,
        formatted_address: `${addressString} (${item.formatted})`,
        source: 'bohol_landmark_fallback',
      };
    }
  }

  // Default Central Bohol location (Tagbilaran City)
  return {
    latitude: 9.6444,
    longitude: 123.8558,
    formatted_address: addressString,
    source: 'tagbilaran_default',
  };
}

function callGeoapifyApi(address, apiKey) {
  return new Promise((resolve, reject) => {
    const encodedAddress = encodeURIComponent(address);
    const path = `/v1/geocode/search?text=${encodedAddress}&apiKey=${apiKey}&limit=1`;

    const req = https.get(
      {
        hostname: 'api.geoapify.com',
        path,
        headers: { 'User-Agent': 'IslandBox-Marketplace' },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.features && parsed.features.length > 0) {
              const feat = parsed.features[0];
              const [lon, lat] = feat.geometry.coordinates;
              resolve({
                latitude: lat,
                longitude: lon,
                formatted_address: feat.properties.formatted || address,
                raw: feat,
              });
            } else {
              resolve(null);
            }
          } catch (e) {
            reject(e);
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
  });
}

module.exports = {
  resolveAddress,
};

