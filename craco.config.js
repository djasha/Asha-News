/**
 * Bundle Optimization Configuration
 * Optimizes webpack configuration for better performance
 */

const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: {
    configure: (webpackConfig, { env, paths }) => {
      // Code splitting optimization
      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunk for third-party libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
            // AI SDKs chunk (large libraries)
            aiLibraries: {
              test: /[\\/]node_modules[\\/](openai|groq-sdk|@directus\/sdk|google-auth-library)[\\/]/,
              name: 'ai-libs',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Firebase chunk
            firebase: {
              test: /[\\/]node_modules[\\/]firebase[\\/]/,
              name: 'firebase',
              chunks: 'all',
              priority: 15,
              enforce: true,
            },
            // Common utilities
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              enforce: true,
            },
          },
        },
        // Runtime chunk optimization
        runtimeChunk: {
          name: 'runtime',
        },
      };

      // Add bundle analyzer in development
      if (env === 'development') {
        webpackConfig.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            openAnalyzer: false,
            defaultSizes: 'parsed',
          })
        );
      }

      // Resolve optimizations
      webpackConfig.resolve = {
        ...webpackConfig.resolve,
        // Prefer ES modules for better tree shaking
        extensions: ['.mjs', '.js', '.jsx', '.json'],
        // Alias for cleaner imports
        alias: {
          ...webpackConfig.resolve.alias,
          '@utils': paths.appSrc + '/utils',
          '@services': paths.appSrc + '/services',
          '@components': paths.appSrc + '/components',
          '@contexts': paths.appSrc + '/contexts',
          '@hooks': paths.appSrc + '/hooks',
          '@config': paths.appSrc + '/config',
        },
      };

      // Module rules for optimization
      webpackConfig.module.rules = [
        ...webpackConfig.module.rules,
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', {
                  modules: false, // Keep ES modules for tree shaking
                  useBuiltIns: 'entry',
                  corejs: 3,
                }],
                ['@babel/preset-react', {
                  runtime: 'automatic',
                }],
              ],
              plugins: [
                '@babel/plugin-syntax-dynamic-import',
                '@babel/plugin-proposal-class-properties',
              ],
            },
          },
        },
      ];

      return webpackConfig;
    },
  },
  plugins: [
    {
      plugin: {
        overrideCracoConfig: ({ cracoConfig }) => {
          // Enable source maps in production for debugging
          if (process.env.NODE_ENV === 'production') {
            cracoConfig.webpack.configure = (webpackConfig) => {
              webpackConfig.devtool = 'source-map';
              return webpackConfig;
            };
          }
          return cracoConfig;
        },
      },
    },
  ],
};
