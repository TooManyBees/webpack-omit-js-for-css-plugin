/**
 * OmitJSforCSSPlugin
 * @description : This plugin will omit bundled JS files, for dependencies that are exclusively CSS which become obsolete once extract-text-plugin extracts inlined CSS into its own .css file
 */

const chalk = require('chalk');

/**
 * @param {Object} options - Configurable options
 * @constructor
 */
function OmitJSforCSSPlugin(options) {
  const defaults = {
    preview: false, // OPTIONAL - {Boolean} - A preview of the files that are to be omitted (Will not actually omit)
    cacheOnWatch: false, // OPTIONAL - {Boolean} - Whether it should cache the JS filenames that should be omitted on watch
    verbose: false // OPTIONAL - {Boolean} - Whether it should display which files will be omitted
  };

  if ((typeof options !== 'undefined' && (options === null || typeof options !== 'object')) || Array.isArray(options)) {
    throw new Error('OmitJSforCSSPlugin only takes an options "object" as an argument');
  }

  this.options = Object.assign({}, defaults, options || {});
  this.cacheOmittedFilename = [];
}

/**
 * @function omitFiles
 * @param {Object} omitted - The omitted file's details
 * @param {Object} compilation
 */
OmitJSforCSSPlugin.prototype.omitFiles = function(omitted, compilation) {
  if (this.options.preview) {
    console.log(chalk.bold(chalk.red('PREVIEW')) + chalk.grey(' File to be omitted for ') + chalk.bold(chalk.green(omitted.chunkName)) + ' : ' + chalk.bold(chalk.green(omitted.filename)));
  } else {
    this.options.verbose && console.log(chalk.grey('File Omitted for ') + chalk.bold(chalk.green(omitted.chunkName)) + chalk.grey(' : ') + chalk.bold(chalk.green(omitted.filename)));
    delete compilation.assets[omitted.filename];
  }
};

/**
 * @function findOmissibleFiles
 * @param {Object} compilation
 */
OmitJSforCSSPlugin.prototype.findOmissibleFiles = function(compilation) {
  // Every chunk / entry point
  compilation.chunks.forEach(chunk => {
    // Chunks origin files. ex. origin entry point, ![] entry
    let resourceOrigin = {};
    let assetTypeCount = { internal: 0, css: 0 };

    chunk.origins.forEach(origin => {
      if (typeof origin.module.resource === 'string') {
        resourceOrigin[origin.module.resource] = true;
      }
    });

    // Each entry point will have its own dependencies, based on the files inner deps or the array deps in entry
    chunk.modules.forEach(module => {
      if (!Array.isArray(module.fileDependencies)) {
        return;
      }
      module.fileDependencies.forEach(filepath => {
        if (!resourceOrigin[filepath] && !/(\bnode_modules\b)/.test(filepath)) {
          /\.(css)$/i.test(filepath) ? assetTypeCount.css++ : assetTypeCount.internal++;
        }
      });
    });

    // Get the filenames that will be emitted, generated by the chunk, and omit JS if applicable
    chunk.files.forEach(filename => {
      // If all dependencies of this entry were CSS, then a JS version of this file will be created
      // This js file will be empty due to extract-text-webpack-plugin
      if (assetTypeCount.css > 0 && assetTypeCount.internal === 0 && (/\.(js)$/i.test(filename) || /\.(js).map$/i.test(filename))) {
        let omitted = {
          filename: filename,
          chunkName: chunk.name
        };

        this.cacheOmittedFilename.push(omitted);
        this.omitFiles(omitted, compilation);
      }
    });
  });
};

/**
 * Hook into the webpack compiler
 * @param {Object} compiler - The webpack compiler object 
 */
OmitJSforCSSPlugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', (compilation, callback) => {
    if (this.options.cacheOnWatch && this.cacheOmittedFilename.length) {
      this.cacheOmittedFilename.forEach(omitted => {
        this.omitFiles(omitted, compilation);
      });
    } else {
      this.findOmissibleFiles(compilation);
    }
    callback();
  });
};

module.exports = OmitJSforCSSPlugin;
