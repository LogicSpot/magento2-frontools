## Logicspot (http://logicspot.com) Frontend Tasks for Magneto 2

This repos is currently up to date with "SnowdogApps/magento2-frontools": "1.5.10",

### Quick Start

* `gulp dev` - For local dev. Runs [browserSync](https://www.browsersync.io/) and `inheritance`, `scripts`, `styles`, `watch` tasks.
* `gulp build` - Deploy styles. Run `clean`, `inheritance`, `scripts` and `styles` tasks. Everything you should need for a deployment. See below for flags you can add to customize the output.

### General Notes

Replaces the default Magento 2 grunt tasks to use gulp/sass/babel and all things nice!

This is a Fork of the Snowdog Apps Frontools, but modified (https://github.com/SnowdogApps/magento2-frontools)
See their README for additonal help

### Adding to your project

Start of with adding this package as a dependency to your project, and setting up some scripts to run.

- Create a `package.json` file:

```
{
	"name": "project-name",
	"description": "Project",
	"license": "MIT",
	"version": "1.0.0",
	"devDependencies": {
		"logicspot-frontend-tasks": "^2.2.0"
	},
	"scripts": {
	    "dev":            "gulp dev",
    	"clean":          "gulp clean",
    
    	"build":          "npm run build:local",
    	"build:local":    "gulp deploy --ci",
    	"build:dev":      "gulp deploy --config vendor --ci",
    	"build:staging":  "gulp deploy --config vendor --ci --prod",
    	"build:live":     "gulp deploy --config vendor --ci --prod",
    	"build:test":     "gulp deploy --config vendor --ci --prod"
	},
}
```

- Create a `gulpfile.js` with only calls this module with some optional config

```
require('logicspot-frontend-tasks')({
    "browserSync": {
        "proxy": "https://local.dev",
        "https": true
    }
});
```

- Define your themes in `themes.json`, you can copy the sample file in config folder of this module

## `themes.json` structure

Check `config/themes.json.sample` to get samples
- `src` - full path to theme
- `dest` - full path to `pub/static/[theme_area]/[theme_vendor]/[theme_name]`
- `locale` - array of available locales
- `localeOverwrites` - (default `false`) set to `true` if you want to overwrite some styles for specifilc language. Remember that path to overwriting file has to be same as base file after removing `/i18n/{lang_code}`.
- `parent` - name of parent theme
- `stylesDir` - (default `styles`) path to styles directory. For `theme-blank-sass` it's `styles`. By default Magento 2 use `web/css`.
- `postcss` - (deafult `["plugins.autoprefixer()"]`) PostCSS plugins config. Have to be an array.
- `modules` - list of modules witch you want to map inside your theme
- `ignore` - array of ignore patterns

## `watcher.json` structure
Check `config/watcher.json` to get samples.
- `usePolling` - set this to `true` to successfully watch files over a network (i.e. Docker or Vagrant) or when your watcher dosen't work well. Warining, enabling this option may lead to high CPU utilization! [chokidar docs](https://github.com/paulmillr/chokidar#performance)

## Tasks list

* `scripts` - Run [Babel](https://babeljs.io/), a compiler for writing next generation JavaScript.
	* `--theme name` - Process single theme.
	* `--prod` - Production output - minifies and uglyfy code.
* `browser-sync` - Run [browserSync](https://www.browsersync.io/).
* `clean` - Removes `/pub/static` and `var/view_preprocessed` directory content
* `default` - type `gulp` to see this readme in console.
* `deploy` - Symlink or copy all static assets to `pub/static`. Runs `clean` and `inheritance` tasks.
	* `--theme name` - Specify theme to deploy.
	* `--prod` - Copy files instead of making symlinks.
* `dev` - Runs [browserSync](https://www.browsersync.io/) and `inheritance`, `scripts`, `styles`, `watch` tasks.
  * `--theme name` - Process single theme.
  * `--disableMaps` - Toggles source maps generation.
* `inheritance` - Create necessary symlinks to resolve theme styles inheritance and make the base for styles processing. You have to run in before styles compilation and after adding new files.
* `styles` - Use this task to manually trigger styles processing pipeline.
	* `--theme name` - Process single theme.
	* `--disableMaps` - Toggles source maps generation.
	* `--prod` - Production output - minifies styles and add `.min` sufix.
	* `--ci` - Enable throwing errors. Useful in CI/CD pipelines.
* `watch` - Watch for style changes and run processing tasks.
	* `--theme name` - Process single theme.
	* `--disableMaps` - Enable inline source maps generation.

## Webpack 

Use webpack to create a bundle that will load separately from Require JS. This means you cannot use any of Require's dependencies (such as jQuery), but it will load much faster. It also makes it easy to create separate bundles for global, category page, product page etc.

- Create a `webpack.config.js` in `public_html` with your entries and outputs. See example below.
- To create a global bundle add `<script src="path/to/global.js" src_type="path" async="async"/>` into `Magento_Theme/layout/default_head_blocks.xml`
- To create a product page bundle add `<head><script src="path/to/product.js" src_type="path" async="async"/></head>` to `Magento_Catalog/layout/catalog_product_view.xml`

Here's a basic `webpack.config.js` example.

```javascript
const path = require('path');

const jsPath = path.resolve(__dirname, '../../modules/logicspot_itl-frontend-theme/web/js-webpack/');

module.exports = {
    entry: {
        global: jsPath + '/src/global.js',
        product: jsPath + '/src/product-page.js',
    },
    output: {
        path: jsPath + '/dist/',
        filename: '[name].bundle.js'
    },
    module: {
        loaders: [
            {
                loader: 'babel-loader',
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                query: {
                    presets: ['env']
                }
            }
        ]
    }
};
```
