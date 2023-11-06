const process = require('process');
const useDefaultConfig = require('@ionic/app-scripts/config/webpack.config.js');

const env = process.env.IONIC_ENV;

if (env === 'dev' || env === 'development') {
   useDefaultConfig[env].devtool = 'inline-source-map';
}

module.exports = () => useDefaultConfig;