const path             = require('path'),
    nodeExternals      = require('webpack-node-externals');

module.exports= {
    mode:"development",
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
            {
                test:/.js?$/,
                exclude:/node_modules/,
                use:[
                    {loader:require.resolve('babel-loader')}
                ]
            }
        ]
    },
    plugins:[
    ]
}