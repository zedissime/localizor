const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const chokidar = require('chokidar');
const get = require('lodash/get');
const isNil = require('lodash/isNil');

const defaultConfig = {
  root: 'src',
  localeFile: 'locale',
  extension: 'yml',
  defaultLocale: 'en',
  targetFile: 'translations',
  watch: true,
  ignoreFiles: /(^|[\/\\])\../,
};


const runControlFile = path.resolve(process.cwd(), '.localizorrc');
const packageConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json')));
const config = fs.existsSync(runControlFile) ? JSON.parse(fs.readFileSync(runControlFile)) : defaultConfig;


const ROOT = path.resolve(process.cwd(), config.root);
const LOCALE_FILE = `.${config.localeFile}.${config.extension}`;
const TARGET_FILE = `${config.targetFile}.${config.extension}`;

const watcher = chokidar.watch('.', {
  ignored: [config.ignoreFiles || defaultConfig.ignoreFiles, TARGET_FILE],
  persistent: true,
});

const set = (obj, objectPath, val) => {
  const stringToPath = (objPath) => {
    if (typeof objPath !== 'string') return objPath;
    const output = [];
    objPath.split('.').forEach((item) => {
      item.split(/\[([^}]+)\]/g).forEach((key) => {
        if (key.length > 0) {
          output.push(key);
        }
      });
    });
    return output;
  };
  const p = stringToPath(objectPath);
  const {length} = p;
  let current = obj;
  p.forEach((key, index) => {
    const isArray = key.slice(-2) === '[]';
    const k = isArray ? key.slice(0, -2) : key;
    if (isArray && Object.prototype.toString.call(current[k]) !== '[object Array]') {
      current[k] = [];
    }
    if (index === length - 1) {
      if (isArray) {
        current[k].push(val);
      } else {
        current[k] = val;
      }
    } else {
      if (!current[k]) {
        current[k] = {};
      }
      current = current[k];
    }
  });
};

const walk = (dir) => {
  if (!fs.existsSync(dir)) {
    throw new Error(`root "${config.root}" does not exists`);
  }
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const f = path.join(dir, file);
    const stat = fs.statSync(f);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(f));
    } else {
      if (f.includes(LOCALE_FILE)) {
        results.push(f);
      }
    }
  });
  return results;
};

const getStructure = (pathToWalk, structure = []) => {
  if (pathToWalk === ROOT) {
    return structure;
  }
  const current = path.basename(pathToWalk);
  structure.unshift(current.replace(LOCALE_FILE, ''));
  return getStructure(path.resolve(pathToWalk, '..'), structure);
};

const getFilesStructures = (files) => {
  const structure = {};
  files.forEach((file) => {
    return structure[file] = getStructure(file);
  });
  return structure;
};

const generateTranslationFileContent = (content) => {
  if (config.extension === 'yml') {
    return yaml.safeDump(content, {
      styles: {
        '!!null': 'canonical',
      },
      sortKeys: true,
    });
  } else if (config.extension === 'json') {
    return JSON.stringify(content);
  }
};

const getTranslationFileContent = (filePath) => {
  if (config.extension === 'yml') {
    return yaml.safeLoad(fs.readFileSync(filePath, 'utf8'));
  } else if (config.extension === 'json') {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  }
};

const createTranslations = () => {
  try {
    const translations = {};
    const localeFiles = walk(ROOT);
    const structures = getFilesStructures(localeFiles);
    Object.keys(structures).forEach((filePath) => {
      set(translations, structures[filePath].join('.'), getTranslationFileContent(filePath));
    });
    fs.writeFileSync(path.resolve(TARGET_FILE), generateTranslationFileContent({[config.defaultLocale]: translations}));
    console.log('translations updated');
  } catch (e) {
    console.error(e);
  }
};

const migrateTranslations = (fromLocale) => {
  try {
    const localeFiles = walk(ROOT);
    const structures = getFilesStructures(localeFiles);
    const sourcesTranslations = getTranslationFileContent(path.resolve('src', 'locales', `translation.${fromLocale}.yml`))[fromLocale]
    Object.keys(structures).forEach((filePath) => {
      const content = get(sourcesTranslations, structures[filePath].join('.'));
      if(isNil(content)) {
        return
      }
      fs.writeFileSync(path.resolve(filePath), generateTranslationFileContent(content));
    });
  } catch (e) {
    console.error(e);
  }
};

const init = () => {
  console.log(`init ${packageConfig.name}@${packageConfig.version}`);
  let watching = false;
  if (config.watch && !watching) {
    watcher
      .on('change', () => {
        createTranslations();
      })
      .on('unlink', () => {
        createTranslations();
      });
    watching = true;
  } else {
    createTranslations();
  }
};

module.exports = {
  init,
  createTranslations,
  migrateTranslations
};
