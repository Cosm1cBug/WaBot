const { proto, generateWAMessageFromContent, prepareWAMessageMedia } = require("@whiskeysockets/baileys") 
const fs = require('fs');
const { config }  = require('../../config.js');

module.exports = {
    name: 'ctx',
    alias: ['ctest'],
    //type: "entertainment",
    start: async(sock, m, { command, prefix, text }) => {
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
                            isForwarded: true, 
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: '120363144038483540@newsletter',
                                newsletterName: 'Powered By : dcodekemii', 
                                serverMessageId: -1
                            },
                            businessMessageForwardInfo: { 
                                businessOwnerJid: sock.decodeJid(sock.user.id) 
                            },
                            forwardingScore: 256,
                            externalAdReply: {  
                                title: 'DCODEKEMII', 
                                thumbnailUrl: fs.readFileSync("./src/Utils/assets/buggy.jpg"), 
                                mediaType: 1,
                                renderLargerThumbnail: true
                            }
                        }, 
                        body: proto.Message.InteractiveMessage.Body.fromObject({

                            text: `*Hello, @${m.sender.replace(/@.+/g, '')}!*\nSilahkan Lihat Produk Di Bawah!`
                        }),
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
}