'use strict';
module.exports = function(gulp, config, plugins) { // eslint-disable-line func-names
	return (resolve) => {

		const themes  = plugins.getThemes();

		config.watcher = require('../helper/config-loader')('watcher.json', plugins, config);

		plugins.path                 = require('path');
		plugins.helper               = {};
		plugins.helper.babel         = require('../helper/babel');
		plugins.helper.dependecyTree = require('../helper/dependency-tree-builder');
		plugins.helper.inheritance   = require('../helper/inheritance-resolver');
		plugins.helper.sass          = require('../helper/scss');
		plugins.helper.svg           = require('../helper/svg');

		plugins.log(
			plugins.ansiColors.yellow('Initializing watcher...')
		);

		themes.forEach(name => {
			const theme = config.themes[name],
				  themeTempSrc = config.tempPath + theme.dest.replace('pub/static', ''),
				  themeDest = config.projectPath + theme.dest,
				  themeSrc = [config.projectPath + theme.src];

			let excludeFiles = [...config.ignore, ...(theme.ignore ? theme.ignore: [])];

			// Add modules source directeoried to theme source paths array
			if (theme.modules) {
				Object.keys(theme.modules).forEach(module => {
					themeSrc.push(config.projectPath + theme.modules[module]);
				});
			}

			// Chokidar watcher config
			const watcherConfig = { // eslint-disable-line one-var
				ignoreInitial: true,
				usePolling: config.watcher.usePolling,
				ignored: excludeFiles
			};

			// Initialize watchers
			const tempWatcher = plugins.chokidar.watch(themeTempSrc, watcherConfig), // eslint-disable-line one-var
			      srcWatcher = plugins.chokidar.watch(themeSrc, watcherConfig),
			      destWatcher = plugins.chokidar.watch(themeDest, watcherConfig);

			let reinitTimeout = false,
			    sassDependecyTree = {};

			function generateSassDependencyTree() {
				// Cleanup tree
				sassDependecyTree = {};

				// Find all main SASS files
				plugins.globby.sync([
				themeTempSrc + '/**/*.scss',
				'!/**/_*.scss'
				]).forEach(file => {
					// Generate array of main file dependecies
					sassDependecyTree[file] = plugins.helper.dependecyTree(plugins, file);
				});
			}

			generateSassDependencyTree();

			function reinitialize(path) {
				// Reset previously set timeout
				clearTimeout(reinitTimeout);

				// Timeout to run only once while moving or renaming files
				reinitTimeout = setTimeout(() => {
					plugins.log(
						plugins.ansiColors.yellow('Change detected.') + ' ' +
						plugins.ansiColors.green('Theme:') + ' ' +
						plugins.ansiColors.blue(name) + ' ' +
						plugins.ansiColors.green('File:') + ' ' +
						plugins.ansiColors.blue(plugins.path.relative(config.projectPath, path))
					);

					plugins.log(
						plugins.ansiColors.yellow('Resolving inheritance.') + ' ' +
						plugins.ansiColors.green('Theme:') + ' ' +
						plugins.ansiColors.blue(name)
					);

					// Disable watcher to not fire tons of events while solving inheritance
					tempWatcher.unwatch(themeTempSrc);

					// Run inheritance resolver just for one theme without parent(s)
					plugins.helper.inheritance(plugins, config, name, false).then(() => {
						// Regenerate SASS Dependency Tree
						generateSassDependencyTree();

						// Add all files to watch again after solving inheritance
						tempWatcher.add(themeTempSrc);

						// Emit event on added / moved / renamed / deleted file to trigger regualr pipeline
						plugins.globby.sync(themeTempSrc + '/**/' + plugins.path.basename(path))
						.forEach(file => {
							tempWatcher.emit('change', file);
						});
					});
				}, 100);
			}

			// Watch add / move / rename / delete events on source files
			srcWatcher
				.on('add', reinitialize)
				.on('addDir', reinitialize)
				.on('unlink', reinitialize)
				.on('unlinkDir', reinitialize);

			// print msg when temp dir watcher is initialized
			tempWatcher.on('ready', () => {
				plugins.log(
					plugins.ansiColors.yellow('Watcher initialized!') + ' ' +
					plugins.ansiColors.green('Theme:') + ' ' +
					plugins.ansiColors.blue(name) + ' ' +
					plugins.ansiColors.green('and dependencies...')
				);
			});

			// Events handling
			tempWatcher.on('change', path => {

				// Print message to know what's going on
				plugins.log(
					plugins.ansiColors.yellow('Change detected.') + ' ' +
					plugins.ansiColors.green('Theme:') + ' ' +
					plugins.ansiColors.blue(name) + ' ' +
					plugins.ansiColors.green('File:') + ' ' +
					plugins.ansiColors.blue(plugins.path.relative(config.projectPath, path))
				);

				// SASS Compilation
				if (plugins.path.extname(path) === '.scss') {
					let found = false;

					Object.keys(sassDependecyTree).forEach(file => {
						if (sassDependecyTree[file].includes('.' + plugins.path.sep + path)) {
							found = true;
							plugins.helper.sass(gulp, plugins, config, name, file);
						}
					});
					
					if(found) { 
						plugins.log( plugins.ansiColors.yellow('Compiling SASS...') );
					}
				}

				// Babel
				if (plugins.path.basename(path).includes('.js')) {
					plugins.log( plugins.ansiColors.yellow('Compiling JS...') );
					plugins.helper.babel(gulp, plugins, config, name, path);
				}

				// SVG Sprite
				if (plugins.path.extname(path) === '.svg') {
					plugins.log( plugins.ansiColors.yellow('Compiling SVG...') );
					plugins.helper.svg(gulp, plugins, config, name);
				}

				// Files that require reload after save
				if (['.html', '.phtml', '.xml', '.csv', '.js'].some(ext => {
					return plugins.path.extname(path) === ext;
				})) {
					plugins.browserSync.reload();
				}
			});
		
		});

		resolve();

	};
};