const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const OmitJSforCSSPlugin = require('../../../../src/index.js');
const path = require('path');

module.exports = {
	entry: {
		b: path.join(__dirname, '../shared/styles.js')
	},
	output: {
		filename: '[name].js',
		path: path.join(__dirname, '/dir')
	},
	module: {
		rules: [
			{
				test: /\.css$/,
				use: [
					MiniCssExtractPlugin.loader,
					'css-loader'
				]
			}
		]
	},
	mode : 'development',
	plugins: [new MiniCssExtractPlugin({ filename: '[name].css' }), new OmitJSforCSSPlugin({ verbose: true })],
	devtool: 'source-map',
	stats: 'none'
};
