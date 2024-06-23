const { config } = require("../../config");
const parsePhoneNumber = require('libphonenumber-js');
const countries = require('iso-3166-1-alpha-2');
const mt = require('moment-timezone');
const fs = require('fs');

let userCounter = 1; // Initialize user counter for serialized user number
let users = {}; //creates an empty object named users.
    
if (fs.existsSync('./src/store/userData.json')) { //checks if the file userData.json exists in the store directory.
    const userData = fs.readFileSync('./src/store/userData.json'); //If the file exists, the readFileSync function reads the contents of the userData.json file into a string.
    users = JSON.parse(userData); //The JSON.parse() function converts the string containing the JSON data from the file into a JavaScript object. This object is then assigned to the users variable.
}

// Load userCounter from file if it exists
if (fs.existsSync('./src/store/userCounter.txt')) {
       const counterData = fs.readFileSync('./src/store/userCounter.txt', 'utf8').trim(); // Trim any leading/trailing whitespace
       if (counterData !== '') {
           const counterValue = parseInt(counterData, 10); // Parse counterData to an integer
           if (!isNaN(counterValue)) {
               userCounter = counterValue;
           }
       }
}

async function userDataSaver(chatinfo, sock) {
    if(chatinfo.messages && chatinfo.messages.length) {
        const msg = chatinfo.messages[0];
        const userJid = msg.key.remoteJid.endsWith('@s.whatsapp.net') ? msg.key.remoteJid : msg.key.participant; //msg.key.participant //Only fetch participants
        const serializedUserNumber = `#${userCounter}`;
        const Contakt = userJid && userJid.includes('@') ? userJid.split('@')[0] : ''; //userJid ? userJid.split('@')[0] : ''; // Check if userJid is not undefined before splitting
        const phoneNumber = '+' + Contakt;
        const phoneNumberObj = parsePhoneNumber(phoneNumber, { extended: true}); // We set extended: true for more detailed parsing
        let countryCode;
        let countryName;
        let PhoneNumberWithCountryCode;    
        // Get the country code
        if (phoneNumberObj) {
            countryCode = phoneNumberObj.country;
            // Get the country name
            countryName = countries.getCountry(countryCode);
            // Get the formatted phone number with country code
            PhoneNumberWithCountryCode = phoneNumberObj.formatInternational();
        } else {
            //console.log('Invalid phone number', userJid);
        }
        const pushName = msg.pushName || '𝙱𝚞𝚐𝚐𝚢 𝚄𝚜𝚎𝚛';
        const JoinTime = mt(new Date()).format('DD/MM/YYYY hh:mm:ss')
        // Check if user already exists in userData.json
        if (!users[userJid]) {
            // Add user information to the object (users)
            users[userJid] = {
                UserID: serializedUserNumber,
                Name: pushName,
                Contact: PhoneNumberWithCountryCode,
                CountryCode: countryCode,
                Country: countryName,
                Joined: JoinTime
            };

            userCounter ++; // Increment the user counter for the next user
            // Serialize the user object (users) to JSON format
            const userData = JSON.stringify(users, null, 2);
            const Msg = `❐ User ID: ${serializedUserNumber}\n❐ Name: ${pushName}\n❐ Number: ${PhoneNumberWithCountryCode}\n❐ Country Code: ${countryCode}\n❐ Country: ${countryName}\n❐ Joined: ${JoinTime}\n\n> Artisanal COSMICBUG`;
            await sock.sendMessage(config.WApp.UserLogs, {text: Msg,
                                contextInfo: {
                                    externalAdReply: {
                                        showAdAttribution: false,
                                        renderLargerThumbnail: true,
                                        title: `🔰BUGGY v5.0.1`,
                                        body: `♟️New User Joined!`,
                                        previewType: 0, 
                                        mediaType: 1, // 0 for none, 1 for image, 2 for video
                                        thumbnail: fs.readFileSync("./src/Utils/assets/buggy.jpg"),
                                        mediaUrl: ``, 
                                    }, 
                                },
                            },
                        );
                // Write the JSON data to a file
                await fs.promises.writeFile('./src/store/userData.json', userData, (err) => {
                    if (err) {
                        console.error('Error writing user data to file:', err);
                    } else {
                        //console.log('User data saved to store/userData.json'); //Commented to avoid noise in terminal.
                    }
                });
                // Write userCounter to file
                await fs.promises.writeFile('./src/store/userCounter.txt', userCounter.toString(), (err) => {
                    if (err) {
                        console.error('Error writing user counter to file:', err);
                    } else {
                        //console.log('User counter saved to store/userCounter.txt'); //Commented to avoid noise in terminal.
                    }
                });
            } else {
                //console.log('User already exists in userData.json'); //Commented to avoid noise in terminal.
            }
        }
}

module.exports = { userDataSaver };