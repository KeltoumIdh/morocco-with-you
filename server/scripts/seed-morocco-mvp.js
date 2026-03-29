#!/usr/bin/env node
/**
 * Morocco MVP catalogue seed from JSONL.
 *
 * Usage:
 *   node server/scripts/seed-morocco-mvp.js --sql
 *   node server/scripts/seed-morocco-mvp.js --sql --file server/seed/morocco_mvp_seed.jsonl > seed_inserts.sql
 *
 *   SEED_ADMIN_BASE_URL=http://localhost:3000/api/admin \
 *   SEED_ADMIN_BEARER=<supabase_jwt_of_user_with_profiles.role=admin> \
 *   node server/scripts/seed-morocco-mvp.js --post
 *
 * Admin routes require Bearer JWT + profiles.role = 'admin' (see server/middleware/auth.js).
 */

import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_JSONL = join(__dirname, '../seed/morocco_mvp_seed.jsonl');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { mode: null, file: DEFAULT_JSONL };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sql') out.mode = 'sql';
    else if (args[i] === '--post') out.mode = 'post';
    else if (args[i] === '--file' && args[i + 1]) {
      out.file = args[++i];
    }
  }
  if (!out.mode) out.mode = 'sql';
  return out;
}

function sqlStr(v) {
  if (v === null || v === undefined) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

function sqlNum(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : 'NULL';
}

function sqlBool(v) {
  return v === false ? 'FALSE' : 'TRUE';
}

function sqlTextArray(arr) {
  if (!arr || !Array.isArray(arr) || arr.length === 0) return `'{}'::text[]`;
  const inner = arr.map((t) => sqlStr(t)).join(', ');
  return `ARRAY[${inner}]::text[]`;
}

function sqlJsonbArr(arr) {
  if (!arr || !Array.isArray(arr)) return `'[]'::jsonb`;
  return sqlStr(JSON.stringify(arr)) + '::jsonb';
}

function loadRows(file) {
  const raw = readFileSync(file, 'utf8');
  return raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, idx) => {
      try {
        return JSON.parse(line);
      } catch (e) {
        throw new Error(`JSONL line ${idx + 1}: ${e.message}`);
      }
    });
}

function rowToSql(row) {
  const d = row.long_description ?? row.short_description ?? '';
  const img = row.image_url;
  const tags = row.tags ?? [];

  switch (row.entity) {
    case 'experience':
      return `INSERT INTO experiences (title, location, description, image_url, price, duration, max_group, tags, gradient, is_active, featured)
VALUES (${sqlStr(row.title)}, ${sqlStr(row.location)}, ${sqlStr(d)}, ${sqlStr(img)}, ${sqlNum(row.price)}, ${sqlStr(row.duration)}, ${sqlNum(row.max_group ?? 8)}, ${sqlTextArray(tags)}, ${row.gradient != null ? sqlStr(row.gradient) : 'NULL'}, ${sqlBool(row.is_active)}, FALSE);`;

    case 'activity':
      return `INSERT INTO activities (title, location, city, description, price, price_type, duration, max_group, tags, category, image_urls, is_active)
VALUES (${sqlStr(row.title)}, ${sqlStr(row.location)}, ${sqlStr(row.city)}, ${sqlStr(d)}, ${sqlNum(row.price)}, ${sqlStr(row.price_type || 'per_person')}, ${sqlStr(row.duration)}, ${sqlNum(row.max_group ?? 20)}, ${sqlTextArray(tags)}, ${sqlStr(row.category)}, ${sqlTextArray(img ? [img] : [])}, ${sqlBool(row.is_active)});`;

    case 'accommodation':
      return `INSERT INTO accommodations (name, type, location, city, description, price_from, tags, image_urls, stars, is_active)
VALUES (${sqlStr(row.title)}, ${sqlStr(row.accommodation_type)}, ${sqlStr(row.location)}, ${sqlStr(row.city)}, ${sqlStr(d)}, ${sqlNum(row.price_from)}, ${sqlTextArray(tags)}, ${sqlTextArray(img ? [img] : [])}, ${sqlNum(row.stars)}, ${sqlBool(row.is_active)});`;

    case 'restaurant':
      return `INSERT INTO restaurants (name, cuisine, location, city, description, price_range, tags, image_urls, is_active)
VALUES (${sqlStr(row.title)}, ${sqlStr(row.cuisine)}, ${sqlStr(row.location)}, ${sqlStr(row.city)}, ${sqlStr(d)}, ${sqlStr(row.price_range)}, ${sqlTextArray(tags)}, ${sqlTextArray(img ? [img] : [])}, ${sqlBool(row.is_active)});`;

    case 'package':
      return `INSERT INTO packages (title, subtitle, description, duration_days, cities, price_from, tags, highlights, image_urls, difficulty, is_active)
VALUES (${sqlStr(row.title)}, ${sqlStr(row.subtitle ?? '')}, ${sqlStr(d)}, ${sqlNum(row.duration_days)}, ${sqlTextArray(row.cities || [])}, ${sqlNum(row.price_from)}, ${sqlTextArray(tags)}, ${sqlTextArray(row.highlights || [])}, ${sqlTextArray(img ? [img] : [])}, ${sqlStr(row.difficulty || 'easy')}, ${sqlBool(row.is_active)});`;

    case 'provider':
      return `INSERT INTO providers (name, type, city, description, logo_url, tags, email, phone, status, verified)
VALUES (${sqlStr(row.title)}, ${sqlStr(row.provider_type)}, ${sqlStr(row.city)}, ${sqlStr(d)}, ${sqlStr(img)}, ${sqlTextArray(tags)}, ${row.email ? sqlStr(row.email) : 'NULL'}, ${row.phone ? sqlStr(row.phone) : 'NULL'}, 'active', FALSE);`;

    case 'group_trip':
      return `INSERT INTO group_trips (title, subtitle, destination, start_date, end_date, max_capacity, price_per_person, description, tags, image_urls, status, difficulty, program)
VALUES (${sqlStr(row.title)}, ${sqlStr(row.subtitle ?? '')}, ${sqlStr(row.destination)}, ${sqlStr(row.start_date)}::date, ${sqlStr(row.end_date)}::date, ${sqlNum(row.max_capacity ?? 16)}, ${sqlNum(row.price_per_person)}, ${sqlStr(d)}, ${sqlTextArray(tags)}, ${sqlTextArray(img ? [img] : [])}, ${sqlStr(row.status || 'open')}, ${sqlStr(row.difficulty || 'easy')}, ${sqlJsonbArr(row.program ?? [])});`;

    default:
      throw new Error(`Unknown entity: ${row.entity}`);
  }
}

function rowToApi(row) {
  const description = row.long_description ?? row.short_description ?? '';
  const image_urls = row.image_url ? [row.image_url] : [];

  switch (row.entity) {
    case 'experience':
      return {
        path: '/experiences',
        body: {
          title: row.title,
          location: row.location,
          description,
          price: row.price,
          duration: row.duration,
          max_group: row.max_group ?? 8,
          tags: row.tags ?? [],
          gradient: row.gradient,
          image_url: row.image_url,
          is_active: row.is_active !== false,
          featured: false,
        },
      };
    case 'activity':
      return {
        path: '/activities',
        body: {
          title: row.title,
          location: row.location,
          city: row.city,
          description,
          price: row.price,
          price_type: row.price_type || 'per_person',
          duration: row.duration,
          max_group: row.max_group ?? 20,
          tags: row.tags ?? [],
          category: row.category,
          image_urls,
          is_active: row.is_active !== false,
        },
      };
    case 'accommodation':
      return {
        path: '/accommodations',
        body: {
          name: row.title,
          type: row.accommodation_type,
          location: row.location,
          city: row.city,
          description,
          price_from: row.price_from,
          stars: row.stars,
          tags: row.tags ?? [],
          image_urls,
          is_active: row.is_active !== false,
        },
      };
    case 'restaurant':
      return {
        path: '/restaurants',
        body: {
          name: row.title,
          cuisine: row.cuisine,
          location: row.location,
          city: row.city,
          description,
          price_range: row.price_range,
          tags: row.tags ?? [],
          image_urls,
          is_active: row.is_active !== false,
        },
      };
    case 'package':
      return {
        path: '/packages',
        body: {
          title: row.title,
          subtitle: row.subtitle,
          description,
          duration_days: row.duration_days,
          price_from: row.price_from,
          cities: row.cities ?? [],
          tags: row.tags ?? [],
          highlights: row.highlights ?? [],
          image_urls,
          difficulty: row.difficulty || 'easy',
          is_active: row.is_active !== false,
        },
      };
    case 'provider':
      return {
        path: '/providers',
        body: {
          name: row.title,
          type: row.provider_type,
          city: row.city,
          description,
          logo_url: row.image_url,
          tags: row.tags ?? [],
          email: row.email,
          phone: row.phone,
          status: 'active',
          verified: false,
        },
      };
    case 'group_trip':
      return {
        path: '/group-trips',
        body: {
          title: row.title,
          subtitle: row.subtitle,
          destination: row.destination,
          start_date: row.start_date,
          end_date: row.end_date,
          max_capacity: row.max_capacity ?? 16,
          price_per_person: row.price_per_person,
          description,
          tags: row.tags ?? [],
          image_urls,
          status: row.status || 'open',
          difficulty: row.difficulty || 'easy',
          program: row.program ?? [],
        },
      };
    default:
      throw new Error(`Unknown entity: ${row.entity}`);
  }
}

async function main() {
  const { mode, file } = parseArgs();
  const rows = loadRows(file);

  if (mode === 'sql') {
    console.log('-- Morocco With You MVP seed (generated from JSONL)\nBEGIN;');
    for (const row of rows) {
      console.log(rowToSql(row));
    }
    console.log('COMMIT;');
    return;
  }

  const base = (process.env.SEED_ADMIN_BASE_URL || 'http://localhost:3000/api/admin').replace(/\/$/, '');
  const token = process.env.SEED_ADMIN_BEARER;
  if (!token) {
    console.error('SEED_ADMIN_BEARER is required for --post');
    process.exit(1);
  }

  for (const row of rows) {
    const { path, body } = rowToApi(row);
    const url = `${base}${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    if (!res.ok) {
      console.error(`FAIL ${row.entity} ${row.slug_hint || row.title}:`, res.status, json);
      process.exit(1);
    }
    console.log(`OK ${row.entity} ${row.slug_hint || row.title} -> ${json.id || 'created'}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
