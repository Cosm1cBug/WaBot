const fs = require('fs')

module.exports = {
    name: "profile",
    alias: ["me"],
    info: "profile Check Information",
    type: "users",
    example: "%prefix%command",
	noLimit: true,
    start: async(sock, m, ) => {
		let usrBio
		try {
			usrBio = await sock.fetchStatus(m.from);
		} catch {
			usrBio = "Nothing.."
		}

		try {
			var pp = await sock.profilePictureUrl(m.from, "image");
		} catch {
			var pp = fs.readFileSync("./src/Utils/assets/default.jpg");
		}
		let caption = `┌──⭓ *Profile Info*\n`
		    caption += `│\n`
		    caption += `│⭔ Username : ${m.pushName}\n`
		    caption += `│⭔ About : ${usrBio.status || usrBio}\n`;
		    caption += `│\n`
		    caption += `└───────⭓\n`

		sock.sendMessage(m.from, { image: pp },{text: caption}, {quoted: m})
    }
}