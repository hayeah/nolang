var packageDependencies = require("./package.json").dependencies || [];

var dependencies = {};
Object.keys(packageDependencies).forEach(mod => {
  dependencies[mod] = "commonjs " + mod;
});

module.exports = {
  entry: "./test.ts",
  target: 'node',
  output: {
   path: "./build",
   filename: "index.js",
  },

  resolve: {
    extensions: ["", ".webpack.js", ".web.js", ".js",".ts"]
  },

  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: 'babel',
        query: {
          presets: ["es2015"],
        },
      },

      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        loader: 'babel?presets[]=es2015!ts?transpileOnly=true',
      }
    ]
  },

  externals: dependencies,

  devtool: "source-map"
}