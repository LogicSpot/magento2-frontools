'use strict';
module.exports = function (gulp, plugins, config, name) { // eslint-disable-line func-names
  const theme = config.themes[name] || [],
        cleanFilePattern = '**/*.js';

  let optimizeDest = [],
      optimizeSrc = [];

  theme.locale.forEach(locale => {
    optimizeDest.push(config.projectPath + theme.dest + '/' + locale);
  });

  optimizeDest.forEach(path => {
    optimizeSrc.push(path + '/' + cleanFilePattern);
  });

	return gulp.src(
		[...optimizeSrc, '!**/*.min.js']
	)
    .pipe(plugins.uglify())
    .pipe(plugins.multiDest(optimizeDest))
    .on('error', err => plugins.log(plugins.ansiColors.red('[Error]'), err.toString()) )
    .pipe(plugins.logger({
      display   : 'name',
      beforeEach: 'Theme: ' + name + ' ',
      afterEach : ' Uglified'
    }));
};
