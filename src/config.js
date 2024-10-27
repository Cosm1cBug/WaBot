const fs = require('fs');

const config = {
    omdb : {
        url: 'https://www.omdbapi.com/',
        key: ''
    },
    options: {
        antiCall: true, //If true, rejects calls. If false do nothing.
        aboutUpdate: "", //leave empty to do nothing.
        BAdmin: [123456789], //Give number for administration.
        prefix: /^[$]/gi, //Msgs starting with '.' considered as commands.
        ReadMessages: true, //set true to read messages
        ReadStatus: true, //set true to read status/stories
        sessionName: "", //Give session name (folderName)
        language: "en",
        timezone: "Asia/Kolkata",
    },
    Exif: {
        packName: "🗦BUGGY🗧",
        packAuthor: "🗦COSMICBUG🗧",
    },
    WApp: {
        MovGrp: "1234567@g.us", //Mov grp
        UserLogs: "12345678@g.us", //For saving user data.
        BotLogs: "12345678@g.us", //Give chat/group id to send logs. 
        CallLogs: "12345678@g.us",
        Syslogs: "1234567@g.us",
        GrpUpdates: "1234567@g.us",
        ErrLogs: "1234567@g.us",
    },
    Tele: {
        userID: '123456',
        appID: '1234567',
        apiHash: 'sdfg2345gh234v',
        channelID: '1234567', //To save image, audio, video & documents from WhatsApp.
        groupID: '1234567', //To send messages to WhatsApp.
        botID: '123456',
        botUserName: '@thebuggybot',
        botToken: '6773630491:12sdfgh23fgh-tlcLbT8rEpqoc',
    },
    MongoDB: {
        URI: "mongodb://localhost:27017/"
    },
    WorkMode: {
        public: true //set true to make public
    },
    OpenAI: {
        apiKey: ''
    },
    Gemini: {
        apiKey: ''
    }
}

module.exports = { config };
//working fine!

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(`Updated:'${__filename}'`)
    delete require.cache[file]
    require(file)
})
