const path             = require('path'),
    UglifyJsPlugin     = require('uglifyjs-webpack-plugin'),
    nodeExternals      = require('webpack-node-externals');
module.exports= {
    mode:"production",
    entry:"./index.js",
    output:{
        filename:"bundle.js",
        path:path.resolve(__dirname,'../build')
    },
    target:"node",
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                parallel: true,
                cache: true,
                uglifyOptions: {output: {comments: false}}
            })
        ],
    },
    devtool:"cheap-module-source-map",
    externals:[nodeExternals()],
    module:{
        rules:[
            // {
            //     test: /\.(js|mjs|jsx|ts|tsx)$/,
            //     exclude: /node_modules/,
            //     enforce: 'pre',
            //     use: [{
            //         loader: require.resolve('eslint-loader'),
            //         options: {
            //             formatter: require.resolve('react-dev-utils/eslintFormatter'),
            //             eslintPath: require.resolve('eslint'),
            //         },
            //     }]
            // },
            {
                test:/.js?$/,
                exclude:/node_modules/,
                use:[
                    {loader:require.resolve('babel-loader')}
                ]
            }
        ]
    },
    plugins:[]
}