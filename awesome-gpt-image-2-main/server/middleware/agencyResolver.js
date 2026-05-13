import * as AgencyService from '../services/agencyService.js';

const agencyCache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

export async function agencyResolver(req, res, next) {
  try {
    const host = req.hostname || req.get('host') || '';
    const origin = req.get('origin') || '';
    const referer = req.get('referer') || '';

    let hostname = host;
    if (!hostname && origin) {
      try { hostname = new URL(origin).hostname; } catch {}
    }
    if (!hostname && referer) {
      try { hostname = new URL(referer).hostname; } catch {}
    }

    const mainDomain = process.env.MAIN_DOMAIN || 'localhost';
    req.agency = null;

    if (hostname && hostname !== mainDomain && hostname !== `www.${mainDomain}` && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const parts = hostname.split('.');
      if (parts.length >= 3 || (parts.length === 2 && hostname.endsWith('.localhost'))) {
        const subdomain = parts[0];

        const cached = agencyCache.get(subdomain);
        if (cached && Date.now() - cached.ts < CACHE_TTL) {
          req.agency = cached.data;
        } else {
          const agency = await AgencyService.getAgencyBySubdomain(subdomain);
          if (agency && agency.status === 'active') {
            req.agency = agency;
            agencyCache.set(subdomain, { data: agency, ts: Date.now() });
          }
        }
      }
    }

    if (!req.agency && req.user && req.user.role === 'agency') {
      const cached = agencyCache.get(`user_${req.user.id}`);
      if (cached && Date.now() - cached.ts < CACHE_TTL) {
        req.agency = cached.data;
      } else {
        const agency = await AgencyService.getAgencyByUserId(req.user.id);
        if (agency) {
          req.agency = agency;
          agencyCache.set(`user_${req.user.id}`, { data: agency, ts: Date.now() });
        }
      }
    }

    next();
  } catch (err) {
    console.error('[AgencyResolver] Error:', err.message);
    next();
  }
}

export function clearAgencyCache(key) {
  if (key) {
    agencyCache.delete(key);
  } else {
    agencyCache.clear();
  }
}
