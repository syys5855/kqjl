let xlsx = require('node-xlsx').default;
let fs = require('fs');
let path = require('path')


/**
 * [[]] data 
 */
exports.write = function(data, fileName = "test.xlsx") {
    return new Promise((res, rej) => {
        console.assert(data instanceof Array);
        let buffer = xlsx.build([{ name: "mySheetName", data: data }]), // Returns a buffer
            filePath = path.join(__dirname, `../temp/${fileName}`)

        fs.writeFile(filePath, buffer, 'binary', (err) => {
            err ? rej(err) : res(filePath);
        });
    });
}