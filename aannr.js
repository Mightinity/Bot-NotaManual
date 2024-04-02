require('dotenv').config()
const fs = require('fs');
const cron = require('node-cron');
const { Client, LocalAuth } = require('whatsapp-web.js');
const { DateTime } = require('luxon');
const Spinnies = require('spinnies');
const chalk = require('chalk');

const { sendTelegramLog, aboutClient, generateID } = require('./jsfunction/essentials');

const spinnies = new Spinnies();
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: 'client-one',
        dataPath: './cookieSessions'
    }),
    puppeteer: {
        args: ['--no-sandbox']
    }
});

var qrcode = require('qrcode-terminal');
const startTimeBooting = Date.now();

client.initialize();

spinnies.add('Loading', { text: 'Opening WhatsApp Web...' });
sendTelegramLog('Start booting Report Nota Manual WhatsApp bot...');

client.on('loading_screen', (percent, message) => {
    spinnies.update('Loading', { text: `Status: ${message} ${percent}%` });
    sendTelegramLog(`Status: ${message} ${percent}%`);
});

client.on('qr', (qr) => {   
    spinnies.add('GeneratedQR', { text: 'Generating a QR Code...' });
    console.log(chalk.greenBright('[!] Scan this QR to Login'));
    qrcode.generate(qr, { small: true });
    spinnies.succeed('GeneratedQR', { text: 'QR Code Generated.' });
    sendTelegramLog('QR Code Generated. Please scan on CLI');
    spinnies.update('Loading', { text: 'Waiting to scan' });
});

client.on('auth_failure', (msg) => {
    spinnies.fail('Loading', { text: `✗ Authentication failure: : ${msg}` });
    sendTelegramLog(`✗ Authentication failure: : ${msg}`);
});

client.on('ready', async () => {
    const finishTimeBooting = Date.now();
    const elapsedTimeSeconds = (finishTimeBooting - startTimeBooting) / 1000;
    spinnies.succeed('Loading', { text: 'Report Nota Manual BOT online and ready to use!', succeedColor: 'greenBright' });
    sendTelegramLog(`Report Nota Manual BOT online and ready to use!\n\nTime Booting: ${elapsedTimeSeconds} second(s)`);
    aboutClient(client);

    fs.readFile('outlet.json', 'utf8', async (err, data) => {
        if (err) {
            console.error('Error reading outlet file:', err);
            return;
        }
        const outlets = JSON.parse(data);        
        
        cron.schedule('* * * * *', async () => {
            const chat = await client.getChatById(process.env.WHATSAPP_GROUP_ID); //DEBUG GORUPID = "120363188986406978@g.us"
            const now = DateTime.local().setZone('Asia/Jakarta');
            const isClosedTime = now.hour === 8 && now.minute === 0;
            const isOpenedTime = now.hour === 0 && now.minute === 0;

            if (isClosedTime) {
                sendTelegramLog("Group di tutup")
                await chat.setMessagesAdminsOnly(true);
            } else if (isOpenedTime) {
                const yesterday = now.minus({ days: 1 });
                const yesterdayFormatted = yesterday.toFormat('dd LLLL yyyy');
                const mentions = chat.participants.map((participant) => `${participant.id.user}@c.us`);
                await chat.setMessagesAdminsOnly(false);
    
                let message = `‼ *REMINDER* ‼\nOUTLET YANG SUDAH TERVALIDASI NOTA MANUAL TANGGAL *${yesterdayFormatted}*\n\n`;
                outlets.forEach(outlet => {
                    message += `- ${outlet} ❌\n`;
                });
                message += `\n*NOTES:*\n📌 Waktu *VALIDASI* Jam 00.00 - 08.00 WIB.\n📌 Ada / tidak nota manual tetap konfirmasi ke Validator.\n📌 Jika manager tidak ada konfirmasi Nota Manual atau lewat dari Jam 08.00 maka tidak di validasi dan dianggap hilang.\n📌 Manager yang belum konfirmasi nota manual maka setoran hari itu juga tidak di proses.\n\nMohon Kerjasama-nya\nTerimakasih!`;
                await chat.sendMessage(message, { mentions });
                sendTelegramLog("Group di buka + Reminder");
            }
        })
    })
});

client.on('message', async (msg) => {
    const chat = await msg.getChat()
    const contact = await msg.getContact();
    console.log(chalk.yellowBright(`💬 ${contact.pushname} : ${msg.body}`));
    sendTelegramLog(`💬 [${contact.number}] - ${contact.pushname}: ${msg.body}`);

    try {
        if (msg.body.startsWith("!sticker")){
            const idSticker = await generateID(16);
            let titleStickerName = idSticker;
            if(msg.hasMedia){
                if (msg.body[8] === " "){
                    try {
                        titleStickerName = msg.body.split(" ")[1].slice(0, 16);
                    } catch (err) {
                        msg.reply("Caught Error, check log messages or contact an administrator")
                        sendTelegramLog(`Caught Error !sticker: ${err}`)
                        return;
                    }
                }
                const media = await msg.downloadMedia();
                chat.sendMessage(media, {
                    sendMediaAsSticker: true,
                    stickerName: titleStickerName,
                    stickerAuthor: "44nnr-bot",
                });
                msg.reply("_Sticker on process..._")
            } else {
                msg.reply("_Error: Send a images/media then !sticker_")
            }
        }
    } catch (err) {
        console.log(chalk.red(err))
        sendTelegramLog(`❗❗❗ Caught Error: ${err}`);
        return;
    }
})
