const fs = require('fs');

const config = {
    omdb : {
        url: 'https://www.omdbapi.com/',
        key: '5fa0312b'
    },
    options: {
        antiCall: true, //If true, rejects calls. If false do nothing.
        aboutUpdate: "", //leave empty to do nothing.
        BAdmin: [919746824845], //Give number for administration.
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
        MovGrp: "120363028891755196@g.us", //Mov grp
        UserLogs: "120363245835527889@g.us", //For saving user data.
        BotLogs: "120363032238569810@g.us", //Give chat/group id to send logs. 
        CallLogs: "120363291777826885@g.us",
        Syslogs: "120363273008568064@g.us",
        GrpUpdates: "120363032238569810@g.us",
        ErrLogs: "120363292760134394@g.us",
    },
    Tele: {
        userID: '295659233',
        appID: '16618822',
        apiHash: 'b30f57c233df3daa10ec47bede728715',
        channelID: '2121409821', //To save image, audio, video & documents from WhatsApp.
        groupID: '2053369164', //To send messages to WhatsApp.
        botID: '6773630491',
        botUserName: '@thebuggybot',
        botToken: '6773630491:AAHBkTWXl561udd0p19yQ-tlcLbT8rEpqoc',
    },
    MongoDB: {
        URI: "mongodb://localhost:27017/BUGGY"
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