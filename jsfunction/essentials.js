require('dotenv').config()
const chalk = require("chalk");
const TelegramBot = require('node-telegram-bot-api');
const botTelegram = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: false });
var qrcode = require('qrcode-terminal');

function generateID(length) {
    const char = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = '';

    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * char.length);
        result += char.charAt(randomIndex);
    }

    return result;
}

async function generateQRCode(qr) {
    return new Promise((resolve, reject) => {
        qrcode.toDataURL(qr, { small: true }, (err, dataURI) => {
            if (err) {
                reject(err);
            } else {
                resolve(dataURI);
            }
        });
    });
}

function sendTelegramLog(messagelog){
    if (process.env.LOG_TELEGRAM_ENABLE == "TRUE"){
        botTelegram.sendMessage(process.env.TELEGRAM_CHATID, messagelog)
    } else {
        console.log(messagelog)
    }
}

function aboutClient(client) {
    console.log(chalk.cyan(
        '\nAbout Client :' +
        '\n  - Username : ' + client.info.pushname +
        '\n  - Phone    : ' + client.info.wid.user +
        '\n  - Platform : ' + client.info.platform + '\n'
    ));
}

module.exports = { generateID, generateQRCode, sendTelegramLog, aboutClient }