module.exports = {
    port: 3000,
    testPaths: {
        windows: 'C:/Users/YSK/Dropbox/testing/dacast/',
        linux: '/home/ec2-user/autotests/dacast_autotests/'
    },
    testCommands: {
        windows: 'node runTests2.js',
        linux: 'xvfb-run node runTests2.js'
    }
};