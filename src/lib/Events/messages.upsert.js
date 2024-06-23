const { config } = require("../../config")
const { proto, jidNormalizedUser, getContentType, getDevice, protocolMessage, extractMessageContent } = require('@whiskeysockets/baileys')
const { correct } = require("../Correct")
const mt = require('moment-timezone')
const fs = require('fs')
const { Function } = require("../Func")

module.exports = async (chat, sock, commands) => {
    if (chat && chat.messages && chat.messages.length > 0) {
        const m = chat.messages?.[0];
        //const messageType = Object.keys(m.message)[0];
        //console.log(m);
        if (m.key.fromMe) return; // Ignore messages sent by the bot.
        if (!m.message) return //console.log('- Empty Message')
            
        if (m.key) {
            m.id = m.key.id;
            m.chat = m.key.remoteJid;
            m.from = jidNormalizedUser(m.key.remoteJid || m.key.participant);
            m.me = sock.user.id.includes(':') ? sock.user.id.split(':')[0]+'@s.whatsapp.net' : sock.user.id;
            m.fromMe = m.key.fromMe;
            m.isBot = m.isBaileys = m.id.startsWith("BAE5") && m.id.length == 16;
            m.isPrivate = m.from.endsWith("@s.whatsapp.net");
            m.isGroup = m.from.endsWith("@g.us");
            m.sender = sock.decodeJid((m.fromMe && sock.user.id) || m.participant || m.key.participant || m.from || "");
        }

        if (m.message) {
            m.type = getContentType(m.message);
            m.message = extractMessageContent(m.message);
            m.text = (m.type === 'conversation') ? m.message.conversation : (m.type == 'imageMessage') ? m.message.imageMessage.caption : (m.mtype == 'videoMessage') ? m.message.videoMessage.caption : (m.type == 'extendedTextMessage') ? m.message.extendedTextMessage.text : (m.type == 'buttonsResponseMessage') ? m.message.buttonsResponseMessage.selectedButtonId : (m.type == 'listResponseMessage') ? m.message.listResponseMessage.singleSelectReply.selectedRowId : (m.type == 'templateButtonReplyMessage') ? m.message.templateButtonReplyMessage.selectedId : (m.type === 'messageContextInfo') ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectReply.selectedRowId || m.msg) : ''
            m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.type].message[getContentType(m.message[m.type].message)] : m.message[m.type]);
            m.mentions = m.msg?.contextInfo ? m.msg?.contextInfo.mentionedJid : [];
            m.quoted = m.msg?.contextInfo ? m.msg?.contextInfo.quotedMessage : null;
            m.replied = m.msg?.contextInfo ? m.msg.contextInfo.quotedMessage : false;
        }

        if (m.quoted) {
            m.quoted.type = getContentType(m.quoted);
            m.quoted.msg = m.quoted[m.quoted.type];
            m.quoted.mentions = m.msg.contextInfo.mentionedJid;
            m.quoted.id = m.msg.contextInfo.stanzaId;
            m.quoted.sender = jidNormalizedUser(m.msg.contextInfo.participant || m.sender);
            m.quoted.from = m.from;
            m.quoted.isGroup = m.quoted.from.endsWith("@g.us");
            m.quoted.isBot = m.quoted.id.startsWith("BAE5") && m.quoted.id == 16;
            m.quoted.fromMe = m.quoted.sender == jidNormalizedUser(sock.user && sock.user?.id);
            m.quoted.text = m.quoted.msg?.text || m.quoted.msg?.caption || m.quoted.msg?.conversation || m.quoted.msg?.contentText || m.quoted.msg?.selectedDisplayText || m.quoted.msg?.title || "";
        }

        if (m.replied) {
            m.replied.id = m.msg.contextInfo.stanzaId || false
            m.replied.chat = m.msg.contextInfo.remoteJid || m.chat
            m.replied.isBot = m.replied.isBaileys = m.replied.id ? m.replied.id.startsWith('BAE5') && m.replied.id.length === 16 : false
            m.replied.sender = m.replied.from = m.msg.contextInfo.participant || false
            m.replied.mentions = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
            m.replied.fromMe = m.replied.me = m.replied.sender === m.me
            m.replied.mtype = getContentType(m.replied)
            m.replied.text = m.replied.text || m.replied.caption || m.replied.conversation || m.replied.contentText || m.replied.selectedDisplayText || m.replied.title || false
            m.replied.image = m.replied.imageMessage || false
            m.replied.video = m.replied.videoMessage || false
            m.replied.audio = m.replied.audioMessage || false
            m.replied.sticker = m.replied.stickerMessage || false
            m.replied.document = m.replied.documentMessage || false
        }

        m.reply = (text, chatId = m.from, options = {}) => Buffer.isBuffer(text) ? sock.sendFile(chatId, text, 'file', '', m, { ...options }) : sock.sendText(chatId, text, m, { ...options })
        
        let body = (m.type === 'conversation') 
            ? m.message.conversation : (m.type == 'imageMessage') 
            ? m.message.imageMessage.caption : (m.type == 'videoMessage') 
            ? m.message.videoMessage.caption : (m.type == 'extendedTextMessage') 
            ? m.message.extendedTextMessage.text : (m.type == 'buttonsResponseMessage') 
            ? m.message.buttonsResponseMessage.selectedButtonId : (m.type == 'listResponseMessage') 
            ? m.message.listResponseMessage.singleSelectreply.selectedRowId : (m.type == 'templateButtonreplyMessage') 
            ? m.message.templateButtonreplyMessage.selectedId : (m.type === 'messageContextInfo') 
            ? (m.message.buttonsResponseMessage?.selectedButtonId || m.message.listResponseMessage?.singleSelectreply.selectedRowId || m.text) : '' ;

        let metadata = m.isGroup ? await sock.groupMetadata(m.key.remoteJid).catch(() => {}) : '';
        let participants = m.isGroup ? metadata.participants : [m.key.remoteJid]
        let groupAdmin = m.isGroup ? participants.filter(v => v.admin !== null).map(v => v.id) : []
        let deviceID = await getDevice(m.key.id)
        let pushName =  m.pushName
        Jid = m.key.remoteJid
        const prefix =  /^[$]/gi.test(body) ? body.match(/^[$]/gi)[0] : '$'  
        const suffix =  /^[-h]/gi.test(body) ? body.match(/^[-h]/gi)[0] : '-h' 
        let isCmd = body.startsWith(prefix)
        let isSuffix = body.startsWith(suffix)
        const cTime = mt(new Date()).format('DD/MM/YYYY hh:mm:ss')
        
        //let fatih = (m.quoted || m)
        //let zhw = (fatih.mtype == 'buttonsMessage') ? fatih[Object.keys(fatih)[1]] : (fatih.mtype == 'templateMessage') ? fatih.hydratedTemplate[Object.keys(fatih.hydratedTemplate)[1]] : (fatih.mtype == 'product') ? fatih[Object.keys(fatih)[0]] : (fatih.mtype == 'viewOnceMessage') ? fatih.message[Object.keys(fatih.message)[0]] : m.quoted ? m.quoted : m
        //let quoted = (zhw.msg || zhw)
        //let mime = (zhw.msg || zhw).mimetype || ''
        //let isMedia = /image|video|sticker|audio/.test(mime)
        let args = body.trim().split(/ +/).slice(1)
        let arg = args.map((v) => v.toLowerCase())
        let text = q = args.join(" ")
        let cmdName = body.replace(prefix, '').trim().split(/ +/).shift().toLowerCase()
        const cmd = commands.get(cmdName) || Array.from(commands.values()).find((v) => v?.alias?.find((x) => x.toLowerCase() == cmdName)) || "" //const cmd = commands.get(cmdName) || Array.from(commands.values()).filter(v => v!== undefined).find((v) => v.alias.find((x) => x.toLowerCase() == cmdName)) || "" //const cmd = commands.get(cmdName) || Array.from(commands.values()).find((v) => v.alias.find((x) => x.toLowerCase() == cmdName)) || ""

        // ReadMessages
        if (config.options.ReadMessages) { 
            await sock.readMessages([m.key]);
        }

        // PresenseUpdate
        if (m.chat.endsWith('@s.whatsapp.net')) {
            // sock.sendPresenceUpdate('available', m.chat)
        }

        // ReadStatusUpdates
        if (config.options.ReadStatus && m.chat.endsWith('status@broadcast')) {
            await sock.readMessages([m.key]);
        }

        // If msg is Buggy sends this reply
        if (m.message.conversation == 'Buggy') {
            await sock.sendMessage(m.from, { 
                text: `𝘏𝘦𝘭𝘭𝘰, 𝘐'𝘮 𝘉𝘶𝘨𝘨𝘺, 𝘢 𝘴𝘪𝘮𝘱𝘭𝘦 𝘞𝘩𝘢𝘵𝘴𝘈𝘱𝘱 𝘣𝘰𝘵. 𝘊𝘶𝘳𝘳𝘦𝘯𝘵𝘭𝘺 𝘪𝘯 𝘣𝘦𝘵𝘢, 𝘐'𝘭𝘭 𝘴𝘰𝘰𝘯 𝘩𝘢𝘷𝘦 𝘮𝘰𝘳𝘦 𝘱𝘰𝘸𝘦𝘳. 𝘌𝘯𝘫𝘰𝘺 𝘵𝘩𝘦 𝘵𝘪𝘮𝘦 𝘸𝘪𝘵𝘩 𝘮𝘦.\n\n𝘠𝘰𝘶 𝘤𝘢𝘯 𝘤𝘢𝘭𝘭 𝘮𝘦 𝘉𝘶𝘨𝘨𝘺 𝘢𝘯𝘥 𝘪 𝘸𝘪𝘭𝘭 𝘣𝘦 𝘵𝘩𝘦𝘳𝘦 𝘵𝘰 𝘩𝘦𝘭𝘱 𝘺𝘰𝘶. 𝘍𝘰𝘳 𝘣𝘰𝘵 𝘧𝘦𝘢𝘵𝘶𝘳𝘦𝘴, 𝘺𝘰𝘶 𝘤𝘢𝘯 𝘶𝘴𝘦 .𝚖𝚎𝚗𝚞\n\n𝘐𝘧 𝘺𝘰𝘶'𝘳𝘦 𝘩𝘢𝘷𝘪𝘯𝘨 𝘵𝘳𝘰𝘶𝘣𝘭𝘦 𝘶𝘴𝘪𝘯𝘨 𝘵𝘩𝘦 𝘤𝘰𝘮𝘮𝘢𝘯𝘥 𝘶𝘴𝘦 -𝘩 𝘵𝘰 𝘨𝘦𝘵 𝘮𝘰𝘳𝘦 𝘪𝘯𝘧𝘰 𝘢𝘣𝘰𝘶𝘵 𝘵𝘩𝘦 𝘤𝘰𝘮𝘮𝘢𝘯𝘥.\n𝘌𝘹𝘢𝘮𝘱𝘭𝘦: .𝘤𝘰𝘮𝘮𝘢𝘯𝘥 -𝘩\n\n> © 2024 BUGGY-WaBot`,
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: false,
                        renderLargerThumbnail: true,
                        title: `🔰ＢＵＧＧＹ ｖ5.0.1`,
                        body: `Made with 💖 by COSMICBUG`,
                        previewType: 0,
                        mediaType: 1, // 0 for none, 1 for image, 2 for video
                        thumbnail: fs.readFileSync("./src/Utils/assets/buggy.jpg"),
                        mediaUrl: ``,
                    },
                },
            });
        }

        if (m.message.conversation == 'P') {
            const {generateWAMessageFromContent, prepareWAMessageMedia } = require('@whiskeysockets/baileys')
            const msg = generateWAMessageFromContent(m.chat, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata: {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.fromObject({
                            contextInfo: {
                                mentionedJid: [m.sender], 
                                externalAdReply: {  
                                    title: 'Carousel-Message', 
                                    thumbnailUrl: fs.readFileSync("./src/Utils/assets/buggy.jpg"),
                                    mediaType: 2,
                                    renderLargerThumbnail: false
                                }
                            }, 
                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                text: `*Hello, @${m.sender.replace(/@.+/g, '')}!*\nSilahkan Lihat Produk Di Bawah!`}),
                                footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                    text: 'Powered By ICSF Team'
                                }),
                                header: proto.Message.InteractiveMessage.Header.fromObject({
                                    hasMediaAttachment: false
                                }),
                                carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
                                    cards: [
                                        {
                                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                                text: '> 7 Days : 1.000\n> 30 Days : 3.000\n> Permanen : 5.000\n\n`</> Benefit Prem </>`\n\n> Get Unlimited Limit\n> Get Acces All Fitur\n> Get Profile Good'
                                            }),
                                            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                            }),
                                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                                title: '</> Premium Bot </>\n',
                                                hasMediaAttachment: true,...(await prepareWAMessageMedia({ image: fs.readFileSync("./src/Utils/assets/buggy.jpg") }, { upload: sock.waUploadToServer }))
                                            }),
                                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                                buttons: [
                                                            {
                                                                name: "cta_url",
                                                                buttonParamsJson: {"display_text":"Order Here!","url":"https://wa.me/628816609112","merchant_url":"https://wa.me/628816609112"}
                                                            }
                                                        ]
                                                })
                                        },
                                        {
                                            body: proto.Message.InteractiveMessage.Body.fromObject({
                                                text: '> 7 Days : 2.000\n> 30 Days : 4.000\n> Permanen : 7.000\n\n`</> Benefit Sewa </>`\n\n> Auto Welcome\n> Auto Kick\n> Auto Open/Close'
                                            }),
                                            footer: proto.Message.InteractiveMessage.Footer.fromObject({
                                            }),
                                            header: proto.Message.InteractiveMessage.Header.fromObject({
                                                title: '</> Sewa Bot </>\n',
                                                hasMediaAttachment: true,...(await prepareWAMessageMedia({ image: fs.readFileSync("./src/Utils/assets/buggy.jpg") }, { upload: sock.waUploadToServer }))
                                            }),
                                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
                                                buttons: [
                                                            {
                                                                name: "cta_url",
                                                                buttonParamsJson: {"display_text":"Order Here!","url":"https://wa.me/628816609112","merchant_url":"https://wa.me/628816609112"}
                                                            }
                                                        ]
                                                })
                                        }
                                    ]
                                })
                            })
                        }
              }
            }, {})
            sock.relayMessage(m.from, msg.message, { messageId: m.key.id })
         
        }

        if (m.message.conversation =='ppt') {
            sock.sendMessage(m.from, {
                audio: fs.readFileSync("./src/Utils/text.opus"),
                contextInfo: {
                    externalAdReply: {
                        showAdAttribution: false,
                        title: 'Test',
                        body: 'Bla',
                        previewType: 1,
                        mediaType: 3,
                        thumbnail: fs.readFileSync("./src/Utils/assets/buggy.jpg"),

                    }
                }
            },
            { mimetype: 'audio/mp4' }); 
        }
        

        // Notify if someone tagged you in groups!
        let type = getContentType(m.message);
        let mentions = m?.message[type]?.contextInfo?.mentionedJid || [];

        if (mentions.includes(jidNormalizedUser(sock.user.id))) {
            console.log('Got Tagged');
            sock.sendMessage(config.WApp.BotLogs, { text: `You've been tagged!` })
        }

        // Send story image/video to anyone who requests to send it.
        /*
        const mtype = getContentType(m.message);

        if (mtype === "extendedTextMessage") {
            const msg = m.message.extendedTextMessage;
        
            if (m.chat === "status@broadcast") {
                switch (msg.text) {
                    case "send":
                        try {
                            if (!msg.contextInfo?.quotedMessage?.extendedTextMessage?.text) {
                                const type = getContentType(msg.contextInfo?.quotedMessage);
                                const fakeObj = await generateWAMessage(msg?.contextInfo?.participant, {
                                    forward: {
                                        key: {
                                            id: msg?.contextInfo?.stanzaId,
                                            remoteJid: msg?.contextInfo?.participant
                                        },
                                        message: msg?.contextInfo?.quotedMessage || {}
                                    }
                                }, { logger: pino() });
        
                                const buffer = await downloadMediaMessage(fakeObj, "buffer", {}, { reuploadRequest: sock.updateMediaMessage, logger: pino() });
        
                                if (type === "imageMessage") {
                                    await sock.sendMessage(m.key.remoteJid, { image: buffer, jpegThumbnail: fakeObj.message.imageMessage.jpegThumbnail });
                                } else if (type === "videoMessage") {
                                    await sock.sendMessage(m.key.remoteJid, { video: buffer, jpegThumbnail: fakeObj.message.videoMessage.jpegThumbnail });
                                }
                                
                                await sock.sendMessage(config.options.BotLogs, { text: `Story ${type === 'imageMessage' ? 'Image' : 'Video'} has been sent to user: ${m.key.remoteJid}` });
        
                                console.log('Sent story to user!');
                            }
                        } catch (e) {
                            console.log(e);
                        }
                        break;
                }
            } else {
                sock.sendMessage(config.WApp.BotLogs, { text: `Error occurred while sending story Image/Video to user: ${m.key.remoteJid}` });
            }
        }
        
        if (m.message && !isGroup) {
            console.log(`${chalk.black(chalk.bgWhite('Private Chat Received!'))}
            ${chalk.black(chalk.bgWhite('Sender:'))} ${chalk.black(chalk.bgRedBright(m.pushName))}
            ${chalk.black(chalk.bgWhite('Sender ID:'))} ${chalk.black(chalk.bgRedBright(m.key.remoteJid))}
            ${chalk.black(chalk.bgWhite('Message Type:'))} ${chalk.black(chalk.bgRedBright(messageType))}
            ${chalk.black(chalk.bgWhite('Message:'))} ${chalk.black(chalk.bgRedBright(body))}\n`);
        }
       
        /*
        if (m.message && isGroup) {
            console.log("" + "\n" + chalk.black(chalk.bgWhite('[ GRUP ]')), chalk.black(chalk.bgBlueBright(isGroup ? metadata.subject : m.pushName)) + "\n" + chalk.black(chalk.bgWhite('[ TIME ]')), chalk.black(chalk.bgBlueBright(new Date)) + "\n" + chalk.black(chalk.bgWhite('[ FROM ]')), chalk.black(chalk.bgBlueBright(m.pushName + " @" + m.sender.split('@')[0])) + "\n" + chalk.black(chalk.bgWhite('[ BODY ]')), chalk.black(chalk.bgBlueBright(body || type)) + "\n" + "")
        }
        if (m.message && !isGroup) {    
            console.log("" + "\n" + chalk.black(chalk.bgWhite('[ PRIV ]')), chalk.black(chalk.bgRedBright('PRIVATE CHATT')) + "\n" + chalk.black(chalk.bgWhite('[ TIME ]')), chalk.black(chalk.bgRedBright(new Date)) + "\n" + chalk.black(chalk.bgWhite('[ FROM ]')), chalk.black(chalk.bgRedBright(m.pushName + " @" + m.sender.split('@')[0])) + "\n" + chalk.black(chalk.bgWhite('[ BODY ]')), chalk.black(chalk.bgRedBright(body || type)) + "\n" + "")
        }
        */
        if (m.message && m.message.conversation) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 💬 Conversation\n\n🤖 Message:  \x1b[38;5;117m${m.message.conversation}\x1b[0m`);
        }

        if (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.text) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 📝 Text Message\n\n👤 Name: \x1b[38;5;117m${m.pushName}\x1b[0m\n🆔 User ID: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m\n💬 Message : \x1b[38;5;117m${m.message.extendedTextMessage.text}\x1b[0m`);
        }

        if (m.message && m.message.reactionMessage) {
            const reaction = m.message.reactionMessage;
            console.log('\x1b[38;5;198m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🖐️ Reaction Message\n\nReacted By: \x1b[38;5;117m${m.pushName}\x1b[0m\nReacted Emoji: ${reaction.text}`);
        }

        if (m.message && m.message.imageMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🖼️ Image Message\n\n👤 Sender: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m`); // Check for edits

        }

        if (protocolMessage && protocolMessage.editedMessage) {
            const editedMessageText = protocolMessage.editedMessage.conversation;
            const editorJid = m.key.participant || m.key.remoteJid;

            console.log('\x1b[1m\x1b[35m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - ✏️ Edited Message\n\n👤 Editor: \x1b[38;5;117m${editorJid}\x1b[0m\n📝 New Message: ${editedMessageText}`);
        }

        if (m.message && m.message.buttonsResponseMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🛑 Button Response\n\n👤 Name: \x1b[38;5;117m${m.pushName}\x1b[0m\n🆔 User ID: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m\n💬 Response : \x1b[38;5;117m${m.message.buttonsResponseMessage.selectedButtonId}\x1b[0m`);
        }

        if (m.message && m.message.listResponseMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🗃️ List Response\n\n👤 Name: \x1b[38;5;117m${m.pushName}\x1b[0m\n🆔 User ID: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m\n💬 Response : \x1b[38;5;117m${m.message.listResponseMessage.singleSelectReply.selectedRowId}\x1b[0m`);
        }

        if (m.message && m.message.ephemeralMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 📇 Ephemeral Message\n\n👤 Name: \x1b[38;5;117m${m.pushName}\x1b[0m\n🆔 User ID: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m\n💬 Content : \x1b[38;5;117m${m.message.ephemeralMessage.message}\x1b[0m`);
        }

        if (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 📃 Context Info\n\n${util.inspect(m.message.extendedTextMessage.contextInfo)}`);
        }

        if (m.message && m.message.audioMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🔊 Audio Message\n\n👤 Sender: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m`);
        }

        if (m.message && m.message.videoMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🎥 Video Message\n\n👤 Sender: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m`);
        }

        if (m.message && m.message.documentMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 📄 Document Message\n\n👤 Sender: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m`);
        }

        if (m.message && m.message.stickerMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🤖 Sticker Message\n\n👤 Sender: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m`);
        }

        if (m.message && m.message.contactMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 📱 Contact Message\n\n👤 Sender: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m`);
        }

        if (m.message && m.message.locationMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 📍 Location Message\n\n👤 Sender: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m`);
        }

        if (m.message && m.message.liveLocationMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🚩 Live Location Message\n\n👤 Sender: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m`);
        }

        if (m.message && m.message.productMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🛍️ Product Message\n\n👤 Sender: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m`);
        }

        if (m.message && m.message.shoppingMessage) {
            console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🛒 Shopping Message\n\n👤 Sender: \x1b[38;5;117m${m.key.remoteJid}\x1b[0m`);
        }

        if (m.message && m.message.imageMessage && m.message.imageMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🖼️ Image Context Info\n\n${util.inspect(m.message.imageMessage.contextInfo)}`);
        }

        if (m.message && m.message.videoMessage && m.message.videoMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🎥 Video Context Info\n\n${util.inspect(m.message.videoMessage.contextInfo)}`);
        }

        if (m.message && m.message.stickerMessage && m.message.stickerMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🤖 Sticker Context Info\n\n${util.inspect(m.message.stickerMessage.contextInfo)}`);
        }

        if (m.message && m.message.audioMessage && m.message.audioMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🔊 Audio Context Info\n\n${util.inspect(m.message.audioMessage.contextInfo)}`);
        }

        if (m.message && m.message.documentMessage && m.message.documentMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 📄 Document Context Info\n\n${util.inspect(m.message.documentMessage.contextInfo)}`);
        }

        if (m.message && m.message.contactMessage && m.message.contactMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 📱 Contact Context Info\n\n${util.inspect(m.message.contactMessage.contextInfo)}`);
        }

        if (m.message && m.message.locationMessage && m.message.locationMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 📍 Location Context Info\n\n${util.inspect(m.message.locationMessage.contextInfo)}`);
        }

        if (m.message && m.message.liveLocationMessage && m.message.liveLocationMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🚩 Live Location Context Info\n\n${util.inspect(m.message.liveLocationMessage.contextInfo)}`);
        }

        if (m.message && m.message.productMessage && m.message.productMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🛍️ Product Context Info\n\n${util.inspect(m.message.productMessage.contextInfo)}`);
        }

        if (m.message && m.message.shoppingMessage && m.message.shoppingMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 🛒 Shopping Context Info\n\n${util.inspect(m.message.shoppingMessage.contextInfo)}`);
        }

        if (m.message && m.message.ephemeralMessage && m.message.ephemeralMessage.contextInfo) {
            //console.log('\x1b[38;5;201m%s\x1b[0m', `\n[BUGGY] 👽 [${cTime}] - 📇 Ephemeral Context Info\n\n${util.inspect(m.message.ephemeralMessage.contextInfo)}`);
        }

        if (m.message && m.message.locationMessage) {
            // Let's say the user sent their location!
            console.log('Location Shared');
            sock.sendMessage(config.options.BotLogs, {
                text: `Location Shared by: ${m.pushName} -\n\`\`\`${util.inspect(m.message.locationMessage)}\`\`\``,
            });
        }
        else if (m.message && m.message.extendedTextMessage && m.message.extendedTextMessage.contextInfo) {
            // This could be a variety of things like payment requests, so it's more of a generic log.
            //console.log('Context Info Received');
        }

        if (isCmd && !cmd) {
            var array = Array.from(commands.keys());
            
            // Safely map aliases, filtering out commands without aliases
            Array.from(commands.values())
                .filter(v => v.alias) // Ensure v.alias is defined
                .map(v => v.alias)
                .join(" ")
                .replace(/ +/gi, ",")
                .split(",")
                .forEach(v => array.push(v));
            
            var anu = correct(cmdName, array);
            var alias = commands.get(anu.result) || Array.from(commands.values()).find(v => (v.alias || []).find(x => x.toLowerCase() === anu.result)) || "";
        
            // Check if alias is found and handle it properly
            let aliasText = alias ? alias.alias.join(", ") : "N/A";
            let q1 = `Command Not Found!`;
            let q2 = `Did you mean?\n\n*Command :* ${prefix + anu.result}\n*Alias :* ${aliasText}`;
            sock.sendMessage(m.from, {text: q1}, {quoted: m})
            await sock.sendMessage(m.from, {text: q2})
            
        } else if (!cmd) {
            return;
        }
        

        // If the message is from a group, log group details.
        if (m.isGroup) {
            //console.log('Group Info', groupMetadata);
            //console.log('Group Admins', groupAdmins);
        }
        /*
        try {
            // Add initial logging
            console.log('Before condition check:');
            console.log('isCmd:', isCmd);
            console.log('text:', text);
        
            // Ensure text is properly defined before using it
            if (isCmd && typeof text === 'string' && text === '-help') {
                console.log('Condition passed, sending message...');
                console.log('cmd.info:', cmd.info);
        
                // Verify cmd.info is defined and is an object
                if (cmd.info && typeof cmd.info === 'object') {
                    return sock.sendMessage(cmd.info);
                } else {
                    console.error('cmd.info is undefined or not an object:', cmd.info);
                }
            } else {
                console.log('Condition failed.');
            }
        } catch (error) {
            console.error('An error occurred:', error.message);
            console.error(error.stack);
        }     
        */
        
        if (isCmd && cmd) 
            try {
                cmd.start(sock, m, {
                    name: 'BUGGY',
                    metadata,
                    pushName,
                    //participants,
                    body,
                    arg,
                    args,
                    text,
                    prefix,
                    command: cmd.name,
                    commands,
                    Function: Function,
                    toUpper: function toUpper(query) {
                        return query.replace(/^\w/, c => c.toUpperCase())
                    }
                })
            } catch (e) {
                console.error(e);
            }
        // Save this as an outgoing message.
        return m;
    }

}



const file = require.resolve(__filename);
fs.watchFile(file, () => {
	fs.unwatchFile(file);
	console.log((`updated: ${__filename}`));
	delete require.cache[file];
	require(file);
});