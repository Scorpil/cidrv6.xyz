const HtmlWebPackPlugin = require('html-webpack-plugin');
module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
	  options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
	    plugins: [
	      "@babel/plugin-proposal-class-properties"
	    ]
          }
        }
      },
      {
        test: /\.html$/,
        use: [
          {
            loader: 'html-loader'
          }
        ]
      },
      {
        test: /\.scss$/,
        use: [
          {
            loader: 'style-loader'
          },
          {
            loader: 'css-loader'
          },
          {
            loader: 'sass-loader'
          }
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebPackPlugin({
      favicon: "./src/favicon-32x32.png",
      template: './src/index.html',
      filename: './index.html'
    })
  ]
};
