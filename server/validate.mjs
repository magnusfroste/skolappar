// A tiny validator for the JSON Schema subset used by the API and the MCP tools.
// Strings are trimmed; unknown object properties are dropped; defaults are applied.

export class ValidationError extends Error {}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]+$/;

export function isHttpUrl(value, maxLength = 2048) {
  if (typeof value !== 'string' || value.length > maxLength) return false;
  try {
    const u = new URL(value);
    return (u.protocol === 'http:' || u.protocol === 'https:') && Boolean(u.hostname);
  } catch {
    return false;
  }
}

export const isUuid = (value) => typeof value === 'string' && UUID.test(value);
export const isEmail = (value) => typeof value === 'string' && value.length <= 254 && EMAIL.test(value);

function typeOf(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

function matchesType(type, value) {
  const actual = typeOf(value);
  if (type === 'number') return actual === 'number' || actual === 'integer';
  return actual === type;
}

export function validate(schema, value, path = 'input') {
  if (!schema || (!schema.type && !schema.enum && !schema.properties && !schema.items)) {
    return value; // any JSON value
  }
  if (typeof value === 'string') value = value.trim();

  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    if (!types.some((t) => matchesType(t, value))) {
      throw new ValidationError(`${path}: expected ${types.join(' or ')}`);
    }
    if (value === null) return null;
  }

  if (schema.enum && !schema.enum.includes(value)) {
    throw new ValidationError(`${path}: must be one of ${schema.enum.join(', ')}`);
  }

  if (typeof value === 'string') {
    if (schema.minLength != null && value.length < schema.minLength) {
      throw new ValidationError(`${path}: at least ${schema.minLength} characters`);
    }
    if (schema.maxLength != null && value.length > schema.maxLength) {
      throw new ValidationError(`${path}: at most ${schema.maxLength} characters`);
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
      throw new ValidationError(`${path}: invalid format`);
    }
    if (schema.format === 'uuid' && !isUuid(value)) throw new ValidationError(`${path}: must be a uuid`);
    if (schema.format === 'uri' && !isHttpUrl(value)) throw new ValidationError(`${path}: must be an http(s) URL`);
    if (schema.format === 'email' && !isEmail(value)) throw new ValidationError(`${path}: must be an email address`);
  }

  if (typeof value === 'number') {
    if (schema.minimum != null && value < schema.minimum) throw new ValidationError(`${path}: must be >= ${schema.minimum}`);
    if (schema.maximum != null && value > schema.maximum) throw new ValidationError(`${path}: must be <= ${schema.maximum}`);
  }

  if (Array.isArray(value)) {
    if (schema.maxItems != null && value.length > schema.maxItems) {
      throw new ValidationError(`${path}: at most ${schema.maxItems} items`);
    }
    if (schema.items) value = value.map((item, i) => validate(schema.items, item, `${path}[${i}]`));
  }

  if (schema.type === 'object' && value && typeof value === 'object' && !Array.isArray(value)) {
    const out = {};
    const props = schema.properties || {};
    for (const [key, propSchema] of Object.entries(props)) {
      let v = value[key];
      if (v === undefined && propSchema.default !== undefined) v = propSchema.default;
      if (v === undefined) continue;
      out[key] = validate(propSchema, v, key);
    }
    for (const key of schema.required || []) {
      if (out[key] === undefined || out[key] === '') throw new ValidationError(`${key}: required`);
    }
    return out;
  }
  return value;
}
