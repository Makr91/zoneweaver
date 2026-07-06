import { loadConfig } from '../utils/config.js';
import { log } from '../utils/Logger.js';
import SettingsController from './SettingsController.js';

/**
 * Collection Controller - Manages keyed config collections in Hyperweaver Server settings
 * Only accessible by super-admin users
 */
class CollectionController {
  /**
   * Resolve a dotted config path (e.g. "authentication.oidc_providers") to the
   * collection field object it points at. Guards against prototype-pollution keys
   * and verifies the target is actually a `type: collection` field.
   * @param {Object} config - Full loaded config
   * @param {string} dottedPath - Dotted path to the collection field
   * @returns {{ field?: Object, error?: string }}
   */
  static resolveCollectionField(config, dottedPath) {
    const segments = String(dottedPath || '').split('.');

    if (segments.length === 0 || segments.some(seg => !seg)) {
      return { error: 'Invalid collection path' };
    }

    let node = config;
    for (const seg of segments) {
      if (seg === '__proto__' || seg === 'constructor' || seg === 'prototype') {
        return { error: 'Invalid collection path' };
      }
      if (!node || typeof node !== 'object') {
        return { error: `Collection not found: ${dottedPath}` };
      }
      node = node[seg];
    }

    if (!node || typeof node !== 'object' || node.type !== 'collection') {
      return { error: `Not a managed collection: ${dottedPath}` };
    }

    return { field: node };
  }

  /**
   * Coerce and validate a single incoming value against its item-schema field
   * metadata (type, options, min/max).
   * @returns {{ value?: *, error?: string }}
   */
  static coerceCollectionValue(fieldKey, meta, raw) {
    const label = meta.label || fieldKey;

    if (meta.type === 'boolean') {
      return { value: raw === true || raw === 'true' };
    }

    if (meta.type === 'integer') {
      const num = typeof raw === 'number' ? raw : parseInt(raw, 10);
      if (Number.isNaN(num)) {
        return { error: `${label} must be a number` };
      }
      const { validation = {} } = meta;
      const min = validation.min !== undefined ? validation.min : meta.min;
      const max = validation.max !== undefined ? validation.max : meta.max;
      if (min !== undefined && num < min) {
        return { error: `${label} must be at least ${min}` };
      }
      if (max !== undefined && num > max) {
        return { error: `${label} must be at most ${max}` };
      }
      return { value: num };
    }

    if (meta.type === 'select' && Array.isArray(meta.options) && meta.options.length > 0) {
      const options = meta.options.map(opt => (opt && typeof opt === 'object' ? opt.value : opt));
      if (!options.includes(raw)) {
        return { error: `${label} must be one of: ${options.join(', ')}` };
      }
      return { value: raw };
    }

    return { value: raw === null || raw === undefined ? '' : String(raw) };
  }

  /**
   * Build a fully {value}-wrapped collection item from incoming flat values,
   * driven entirely by the field's item_schema. Only schema-declared fields are
   * written (unknown input keys are dropped). Secret fields left blank on update
   * keep their existing value. Enforces required fields, defaults, and coercion.
   * @param {Object} field - The collection field (with item_schema/secret_fields)
   * @param {Object} incoming - Flat { fieldKey: value } from the request
   * @param {Object|null} existingItem - Current stored item when updating
   * @returns {{ item?: Object, error?: string }}
   */
  static buildCollectionItem(field, incoming, existingItem = null) {
    const itemSchema = field.item_schema || {};
    const secretFields = field.secret_fields || [];
    const isUpdate = Boolean(existingItem);
    const values = incoming && typeof incoming === 'object' ? incoming : {};
    const item = isUpdate ? { ...existingItem } : {};

    for (const [fieldKey, meta] of Object.entries(itemSchema)) {
      const label = meta.label || fieldKey;
      const provided = Object.hasOwn(values, fieldKey);
      const isSecret = secretFields.includes(fieldKey);
      let raw = values[fieldKey];

      // Secret left blank: keep existing on update, require on create.
      if (isSecret && (!provided || raw === '' || raw === null || raw === undefined)) {
        if (isUpdate && existingItem[fieldKey] !== undefined) {
          item[fieldKey] = existingItem[fieldKey];
          continue;
        }
        if (meta.required) {
          return { error: `${label} is required` };
        }
        item[fieldKey] = { type: meta.type, value: '' };
        continue;
      }

      if (!provided) {
        if (isUpdate && existingItem[fieldKey] !== undefined) {
          item[fieldKey] = existingItem[fieldKey];
          continue;
        }
        if (meta.value !== undefined) {
          raw = meta.value;
        } else if (meta.type === 'boolean') {
          raw = false;
        } else {
          raw = '';
        }
      }

      const coerced = CollectionController.coerceCollectionValue(fieldKey, meta, raw);
      if (coerced.error) {
        return { error: coerced.error };
      }

      if (
        meta.required &&
        meta.type !== 'boolean' &&
        (coerced.value === '' || coerced.value === null || coerced.value === undefined)
      ) {
        return { error: `${label} is required` };
      }

      item[fieldKey] = { type: meta.type, value: coerced.value };
    }

    return { item };
  }

  /**
   * @swagger
   * /api/settings/collections/{path}:
   *   get:
   *     summary: List items in a keyed config collection (Super-admin only)
   *     description: Returns the items of a collection config field. Secret fields are never returned (a has-flag is sent instead).
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Collection items retrieved successfully
   */
  static getCollection(req, res) {
    try {
      const config = loadConfig();
      const { field, error } = CollectionController.resolveCollectionField(config, req.params.path);
      if (error) {
        return res.status(404).json({ success: false, message: error });
      }

      const itemSchema = field.item_schema || {};
      const secretFields = field.secret_fields || [];
      const stored = field.value && typeof field.value === 'object' ? field.value : {};

      const items = Object.entries(stored).map(([key, entry]) => {
        const out = { _key: key };
        for (const [fieldKey, meta] of Object.entries(itemSchema)) {
          if (secretFields.includes(fieldKey)) {
            out[`__has_${fieldKey}`] = Boolean(entry?.[fieldKey]?.value);
            continue;
          }
          let outValue = entry?.[fieldKey]?.value;
          if (outValue === undefined) {
            outValue = meta.value;
          }
          if (outValue === undefined) {
            outValue = '';
          }
          out[fieldKey] = outValue;
        }
        return out;
      });

      return res.json({ success: true, items });
    } catch (error) {
      log.settings.error('Error listing collection', { error: error.message });
      return res.status(500).json({
        success: false,
        message: `Failed to list collection: ${error.message}`,
      });
    }
  }

  /**
   * @swagger
   * /api/settings/collections/{path}:
   *   post:
   *     summary: Create an item in a keyed config collection (Super-admin only)
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Item created
   */
  static createCollectionItem(req, res) {
    try {
      const { key, values } = req.body;

      if (
        !key ||
        typeof key !== 'string' ||
        key === '__proto__' ||
        key === 'constructor' ||
        key === 'prototype' ||
        !/^[a-z0-9_]+$/i.test(key)
      ) {
        return res.status(400).json({
          success: false,
          message: 'Item key must contain only letters, numbers, and underscores',
        });
      }

      const config = loadConfig();
      const { field, error } = CollectionController.resolveCollectionField(config, req.params.path);
      if (error) {
        return res.status(404).json({ success: false, message: error });
      }

      if (!field.value || typeof field.value !== 'object') {
        field.value = {};
      }
      if (field.value[key]) {
        return res.status(409).json({ success: false, message: `'${key}' already exists` });
      }

      const built = CollectionController.buildCollectionItem(field, values, null);
      if (built.error) {
        return res.status(400).json({ success: false, message: built.error });
      }

      field.value[key] = built.item;
      const backupPath = SettingsController.writeConfigWithBackup(config);

      log.settings.info('Collection item created', {
        user: req.user.username,
        collection: req.params.path,
        key,
        backupPath,
      });

      return res.json({
        success: true,
        message: `'${key}' created${field.requires_restart ? '. Restart the server to apply changes.' : '.'}`,
        requiresRestart: field.requires_restart === true,
      });
    } catch (error) {
      log.settings.error('Error creating collection item', { error: error.message });
      return res.status(500).json({
        success: false,
        message: `Failed to create item: ${error.message}`,
      });
    }
  }

  /**
   * @swagger
   * /api/settings/collections/{path}/{key}:
   *   put:
   *     summary: Update an item in a keyed config collection (Super-admin only)
   *     description: Only provided fields change. Blank secret fields keep their current value.
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Item updated
   */
  static updateCollectionItem(req, res) {
    try {
      const { key } = req.params;
      if (!key || key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return res.status(400).json({ success: false, message: 'Invalid item key' });
      }
      const { values } = req.body;
      const config = loadConfig();
      const { field, error } = CollectionController.resolveCollectionField(config, req.params.path);
      if (error) {
        return res.status(404).json({ success: false, message: error });
      }

      if (!field.value || !field.value[key]) {
        return res.status(404).json({ success: false, message: `'${key}' not found` });
      }

      const built = CollectionController.buildCollectionItem(field, values, field.value[key]);
      if (built.error) {
        return res.status(400).json({ success: false, message: built.error });
      }

      field.value[key] = built.item;
      const backupPath = SettingsController.writeConfigWithBackup(config);

      log.settings.info('Collection item updated', {
        user: req.user.username,
        collection: req.params.path,
        key,
        backupPath,
      });

      return res.json({
        success: true,
        message: `'${key}' updated${field.requires_restart ? '. Restart the server to apply changes.' : '.'}`,
        requiresRestart: field.requires_restart === true,
      });
    } catch (error) {
      log.settings.error('Error updating collection item', { error: error.message });
      return res.status(500).json({
        success: false,
        message: `Failed to update item: ${error.message}`,
      });
    }
  }

  /**
   * @swagger
   * /api/settings/collections/{path}/{key}:
   *   delete:
   *     summary: Delete an item from a keyed config collection (Super-admin only)
   *     tags: [System Settings]
   *     security:
   *       - JwtAuth: []
   *     responses:
   *       200:
   *         description: Item deleted
   */
  static deleteCollectionItem(req, res) {
    try {
      const { key } = req.params;
      if (!key || key === '__proto__' || key === 'constructor' || key === 'prototype') {
        return res.status(400).json({ success: false, message: 'Invalid item key' });
      }
      const config = loadConfig();
      const { field, error } = CollectionController.resolveCollectionField(config, req.params.path);
      if (error) {
        return res.status(404).json({ success: false, message: error });
      }

      if (!field.value || !field.value[key]) {
        return res.status(404).json({ success: false, message: `'${key}' not found` });
      }

      delete field.value[key];
      const backupPath = SettingsController.writeConfigWithBackup(config);

      log.settings.info('Collection item deleted', {
        user: req.user.username,
        collection: req.params.path,
        key,
        backupPath,
      });

      return res.json({
        success: true,
        message: `'${key}' deleted${field.requires_restart ? '. Restart the server to apply changes.' : '.'}`,
        requiresRestart: field.requires_restart === true,
      });
    } catch (error) {
      log.settings.error('Error deleting collection item', { error: error.message });
      return res.status(500).json({
        success: false,
        message: `Failed to delete item: ${error.message}`,
      });
    }
  }
}

export default CollectionController;
