'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const nugget = require('nugget');
const rc = require('rc');
const pump = require('pump');
const tfs = require('tar-fs');
const zlib = require('zlib');
const pkg = require('./package.json');
const supportedTargets = require('./package.json').supportedTargets;

function onerror(err) {
  throw err;
}

/**
 * Download and Install prebuild
 * @param runtime
 * @param abi
 * @param platform
 * @param arch
 * @param cb Callback
 */
function install(runtime, abi, platform, arch, cb) {
  const essential = runtime + '-v' + abi + '-' + platform + '-' + arch;
  const pkgVersion = pkg.version;
  const currentPlatform = pkg.name + '-v' + pkgVersion + '-' + essential;

  console.log('Downloading prebuild for platform:', currentPlatform);
  let downloadUrl = 'https://github.com/wilix-team/iohook/releases/download/v' + pkgVersion + '/' + currentPlatform + '.tar.gz';

  let nuggetOpts = {
    dir: os.tmpdir(),
    target: 'prebuild.tar.gz',
    strictSSL: true
  };

  let npmrc = {};

  try {
    rc('npm', npmrc);
  } catch (error) {
    console.warn('Error reading npm configuration: ' + error.message);
  }

  if (npmrc && npmrc.proxy) {
    nuggetOpts.proxy = npmrc.proxy;
  }

  if (npmrc && npmrc['https-proxy']) {
    nuggetOpts.proxy = npmrc['https-proxy'];
  }

  if (npmrc && npmrc['strict-ssl'] === false) {
    nuggetOpts.strictSSL = false;
  }

  nugget(downloadUrl, nuggetOpts, function(errors) {
    if (errors) {
      const error = errors[0];

      if (error.message.indexOf('404') === -1) {
        onerror(error);
      } else {
        console.error('Prebuild for current platform (' + currentPlatform + ') not found!');
        console.error('Try to compile for your platform:');
        console.error('# cd node_modules/iohook;');
        console.error('# npm run compile');
        console.error('');
        onerror('Prebuild for current platform (' + currentPlatform + ') not found!');
      }
    }

    let options = {
      readable: true,
      writable: true,
      hardlinkAsFilesFallback: true
    };

    let binaryName;
    let updateName = function(entry) {
      if (/\.node$/i.test(entry.name)) binaryName = entry.name
    };
    let targetFile = path.join(__dirname, 'builds', essential);
    let extract = tfs.extract(targetFile, options)
      .on('entry', updateName);
    pump(fs.createReadStream(path.join(nuggetOpts.dir, nuggetOpts.target)), zlib.createGunzip(), extract, function(err) {
      if (err) {
        return onerror(err);
      }
      cb()
    });
  });
}

/**
 * Return options for iohook from package.json
 * @return {Object}
 */
function optionsFromPackage(attempts) {
  attempts = attempts || 2;
  if (attempts > 5) {
    console.log('Can\'t resolve main package.json file');
    return {
      targets: [],
      platforms: [process.platform],
      arches: [process.arch]
    }
  }
  let mainPath = Array(attempts).join("../");
  try {
    const content = fs.readFileSync(path.join(__dirname, mainPath, 'package.json'), 'utf-8');
    const packageJson = JSON.parse(content);
    const opts = packageJson.iohook || {};
    if (!opts.targets) {
      opts.targets = []
    }
    if (!opts.platforms) opts.platforms = [process.platform];
    if (!opts.arches) opts.arches = [process.arch];
    return opts
  } catch (e) {
    return optionsFromPackage(attempts + 1);
  }
}

const abi = process.versions.modules;
const platforms = ["linux-x64", "linux-ia32", "win32-x64", "win32-ia32", "darwin-x64"];
var platform = platforms[4]
install("electron", 73, platform.split('-')[0], platform.split('-')[1], function(){});
