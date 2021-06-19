module.exports = {
    /**
     * @description Request to get content of specified url.
     * @param {String} url 
     * @returns Content of url
     */
    get: function (url) {
        return new Promise((resolve, reject) => {
            const http = require('http'),
                  https = require('https');
    
            let client = http;
    
            if (url.toString().indexOf("https") === 0) {
                client = https;
            }
    
            client.get(url, (resp) => {
                let data = '';
    
                resp.on('data', (chunk) => {
                    data += chunk;
                });
    
                resp.on('end', () => {
                    resolve(data);
                });
    
            }).on("error", (err) => {
                reject(err);
            });
        });
    },
    toUnit: function (int) {
        var bytes = int;
        var sizes = [' bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        for (var i = 0; i < sizes.length; i++) {
            if (bytes <= 1024) {
                return bytes + sizes[i];
            } else {
                bytes = parseFloat(bytes / 1024).toFixed()
            }
        }
        return bytes + 'PB';
    }
}