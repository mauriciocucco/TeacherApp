import * as Dotenv from 'dotenv-webpack';
import * as CompressionPlugin from 'compression-webpack-plugin';
import * as BrotliPlugin from 'brotli-webpack-plugin';

module.exports = {
	plugins: [
		new Dotenv({
			systemvars: true,
		}),
		new BrotliPlugin({
			asset: '[fileWithoutExt].[ext].br',
			test: /\.(js|css|html|svg|txt|eot|otf|ttf|gif)$/,
		}),
		new CompressionPlugin({
			compressionOptions: { level: 1 },
			minRatio: 0.8,
			algorithm: 'gzip',
		}),
	],
};
