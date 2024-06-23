const fs = require('fs');

let oldMetadata = {};

async function groupsUpdate( sock, grpUpdate) {
  //console.log('Test', grpUpdate);
  const id = grpUpdate.id;
    try {
      const metadata = await sock.groupMetadata(id);
      const groupName = metadata.subject;
      const groupDesc = metadata.desc;
      //const groupPic = metadata.picture; 
      const groupSize = metadata.participants.length;
      const superAdmin = metadata.participants.find((participant) => participant.isSuperAdmin).id;
      const admins = metadata.participants
      .filter((participant) => participant.isAdmin)
      .map((admin) => admin.id);
      
      if (oldMetadata[id]) {
        const oldMeta = oldMetadata[id];
        if (groupName !== oldMeta.subject) {
          console.log(`Group name updated: ${groupName}`);
          await sock.sendMessage(grpUpdate.id, { text: `${metadata.subject}\n\nChanged by: ${id.author}\n\n> © 2024 BUGGY-WaBot`,
          contextInfo: {
            externalAdReply: {
              showAdAttribution: false,
              renderLargerThumbnail: true,
              title: `✗ ＧＲＯＵＰ-ＵＰＤＡＴＥ`,
              body: `Group Name has been changed!`,
              previewType: 0, 
              mediaType: 1, // 0 for none, 1 for image, 2 for video
              thumbnail: fs.readFileSync("./src/Utils/assets/thumb.jpg")
              }, 
            },
          },
        )
        }
        if (groupDesc !== oldMeta.desc) {
          console.log(`Group description updated: ${groupDesc}`);
          await sock.sendMessage(grpUpdate.id, { text: `${metadata.subject}\n\nChanged by: ${id.author}\n\n> © 2024 BUGGY-WaBot`,
          contextInfo: {
            externalAdReply: {
              showAdAttribution: false,
              renderLargerThumbnail: true,
              title: `✗ ＧＲＯＵＰ-ＵＰＤＡＴＥ`,
              body: `Group Description has been changed!`,
              previewType: 0, 
              mediaType: 1, // 0 for none, 1 for image, 2 for video
              thumbnail: fs.readFileSync("./src/Utils/assets/thumb.jpg")
              }, 
            },
          },
        )
        }
        if (groupSize !== oldMeta.participants.length) {
          console.log(`Group size updated: ${groupSize}`);
        }
        if (superAdmin !== oldMeta.participants.find((participant) => participant.isSuperAdmin).id) {
          console.log(`Super admin updated: ${superAdmin}`);
        }
        if (!admins.every((admin) => oldMeta.participants.some((participant) => participant.id === admin && participant.isAdmin))) {
          console.log(`Admins updated: ${admins.map((admin) => admin).join(', ')}`);
        }
      }
  
      oldMetadata[id] = metadata;

    } catch (error) {
      console.error(`Error processing group update ${id}:`, error);
    }
}

module.exports = { groupsUpdate };
/*
let file = require.resolve(__filename);
fs.watchFile(file, () => {
	fs.unwatchFile(file);
	console.log((`updated: ${__filename}`));
	delete require.cache[file];
	require(file);
});
*/