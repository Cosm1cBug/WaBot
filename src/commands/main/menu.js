const fs = require('fs');

module.exports = {
    name: "menu",
    alias: ["help","list"],
    type: "hide",
    start: async(sock, m, { commands, args = [], prefix, text, toUpper }) => {
        const { pushName } = m
        if (args.length > 0 && args[args.length - 1] === '-h') {
            args.pop();
            let name = args[0].toLowerCase();
            let cmd = commands.get(name) || Array.from(commands.values()).find((v) => v && v.alias && v.alias.includes(name)) 
            
            if (!cmd || cmd.type == "hide") {
                return sock.sendMessage(m.from, { text: "No Command Found"}, { quoted: m });
            } else {
                let data = [];
                data.push(`*Command :* ${cmd.name.replace(/^\w/, c => c.toUpperCase())}`)
                if (cmd.alias) data.push(`*Alias :* ${cmd.alias.join(", ")}`)
                if (cmd.use) data.push(`*Use:* ${cmd.use}`);
                if (cmd.desc) data.push(`*Description :* ${cmd.desc}\n`)
                if (cmd.example) data.push(`*Example :* ${cmd.example.replace(/%prefix/gi, prefix).replace(/%command/gi, cmd.name).replace(/%text/gi, text)}`)
                return sock.sendMessage(m.from, { text: `*Info Command ${cmd.name.replace(/^\w/, c => c.toUpperCase())}*\n\n${data.join("\n")}`}, { quoted: m });
            }
        }
        
        let txt = `𝘏𝘦𝘭𝘭𝘰 ${pushName},\n𝘐'𝘮 𝘉𝘶𝘨𝘨𝘺, 𝘢 𝘴𝘪𝘮𝘱𝘭𝘦 𝘞𝘩𝘢𝘵𝘴𝘈𝘱𝘱 𝘣𝘰𝘵. 𝘊𝘶𝘳𝘳𝘦𝘯𝘵𝘭𝘺 𝘪𝘯 𝘣𝘦𝘵𝘢, 𝘐'𝘭𝘭 𝘴𝘰𝘰𝘯 𝘩𝘢𝘷𝘦 𝘮𝘰𝘳𝘦 𝘱𝘰𝘸𝘦𝘳. 𝘌𝘯𝘫𝘰𝘺 𝘵𝘩𝘦 𝘵𝘪𝘮𝘦 𝘸𝘪𝘵𝘩 𝘮𝘦.\n\n`

        for (let type of commands.type) {
            const commandList = commands.list[type].filter(v => v.type !== "hide");
            if (commandList.length > 0) {
                txt += `✗ ${toUpper(type)} Menu\n\n`;
                txt += `${commandList.map((cmd) => `❐ ${prefix + cmd.name} ${cmd.use ? " " + cmd.use : ""}`).join("\n")}\n\n`;
            }
        }

        txt += `> © 2024 BUGGY-WaBot`;

        await sock.sendMessage(m.from, { 
            text: txt,
            contextInfo: {
                externalAdReply: {
                    showAdAttribution: false,
                    renderLargerThumbnail: true,
                    title: `🔰ＢＵＧＧＹ ｖ5.0.1`,
                    body: `Made with 💖 by COSMICBUG`,
                    previewType: 0,
                    mediaType: 1, // 0 for none, 1 for image, 2 for video
                    thumbnail: fs.readFileSync("./src/Utils/assets/buggy.jpg")
                },
            },
        });
    },
    noLimit: true,
}
