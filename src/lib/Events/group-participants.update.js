const { config }  = require("../../config");
const fs = require('fs');
const Limiter = require("bottleneck");
const limiter = new Limiter({
  maxConcurrent: 10,
  minTime: 1000, // wait for at least 1 second between requests
});

async function groupParticipantsUpdate( sock, m, store, id, author, participants, action ) {
	try {
		const metadata = await limiter.schedule(() => sock.groupMetadata(id));
		const groupName = metadata.title
		const groupSize = metadata.size
		const superAdmin = metadata.owner
	
		for (const jid of participants)
		if (action == 'add') {
			sock.sendMessage(config.WApp.GrpUpdates, {text: `Participant added in: ${groupName}\nAdded by: ${author}\nParticipant: ${jid.split('@')[0]}\n\nGroup Size: ${groupSize}\n\nOwner: ${superAdmin}`});
			  await sock.sendMessage(id, { text: `Hello ${jid.split('@')[0]}\n\nWelcome to ${groupName}\n\nTotal Members: ${groupSize}\n\n> © 2024 BUGGY-WaBot`,
			  mentions:[jid],
				contextInfo: {
					externalAdReply: {
						showAdAttribution: false,
						renderLargerThumbnail: true,
						title: `✗ ＧＲＯＵＰ-ＵＰＤＡＴＥ`,
						body: `♟️New Member Joined!`,
						previewType: 0, 
						mediaType: 1, // 0 for none, 1 for image, 2 for video
						thumbnail: fs.readFileSync("./src/Utils/assets/thumb.jpg")
						}, 
					},
				},
			); 
		} else if (action  == 'promote'){
			sock.sendMessage(config.WApp.GrpUpdates, {text: `Participant promoted in: ${metadata.subject}\nAuthor: ${author}\nParticipant: ${jid}`})
		} else if (action == 'demote'){
			sock.sendMessage(config.WApp.GrpUpdates, {text: `Participant demoted in: ${metadata.subject}\nAuthor: ${author}\nParticipant: ${jid}`})
		} else if (action == 'remove'){
			sock.sendMessage(config.WApp.GrpUpdates, {text: `Participant removed in: ${metadata.subject}\nAuthor: ${author}\nParticipant: ${jid}`})
		}
	}
	catch {
		console.log('Error: Group Participants Update:\n',error);
	}

}

module.exports = { groupParticipantsUpdate };

/* For rate limit
const Limiter = require("bottleneck");
const limiter = new Limiter({
  maxConcurrent: 1,
  minTime: 1000, // wait for at least 1 second between requests
});

async function groupParticipantsUpdate(sock, id) {
  try {
    const metadata = await limiter.schedule(() => sock.groupMetadata(id));
    // handle the metadata
  } catch (error) {
    console.error(error);
  }
}
*/