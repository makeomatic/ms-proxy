const Promise = require('bluebird');
const fs = require('fs');
const url = require('url');
const ld = require('lodash');
const path = require('path');
const Validator = require('ms-validation');
const validator = new Validator(__dirname, null, {
  useDefaults: true,
  removeAdditional: true,
});

/**
 * Resolve file, split by lines and return an array of strings
 * @param  {String} filePath
 * @return {Array}
 */
const resolveFile = ld.memoize(function resolveFile(filePath) {
  return fs.readFileSync(filePath, 'utf-8').split('\n');
});

/**
 * Helper to remove empty props
 */
function removeEmptyProps(acc, value, key) {
  if (value) {
    acc[key] = value;
  }

  return acc;
}

/**
 * Goes over each item and parses it as URL if it can
 * @param  {Mixed} data
 * @return {Mixed}
 */
function processMixedData(data) {
  if (!data) {
    return null;
  }

  if (Array.isArray(data)) {
    return data.map(processMixedData);
  }

  if (path.isAbsolute(data)) {
    return processMixedData(resolveFile(data));
  }

  const proxy = ld.reduce(url.parse(data), removeEmptyProps, {});
  const parsed = validator.validateSync('proxy', proxy);
  if (parsed.error) {
    return null;
  }

  return parsed.doc;
}

module.exports = function resolveInlineProxies() {
  const { proxies } = this.config;
  const namespaces = ld.keys(proxies);

  return Promise
    .bind(this)
    .return(namespaces)
    .reduce(function resolveProxies(result, namespace) {
      const mixed = proxies[namespace];
      // make it an array before flatten, is there is always 1 level
      result[namespace] = ld([processMixedData(mixed)]).flattenDeep().compact().value();
      return result;
    }, {});
};
