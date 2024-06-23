'use strict';
//process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0'
require('events').EventEmitter.defaultMaxListeners = 500
const { makeWASocket, useMultiFileAuthState, makeInMemoryStore, jidDecode, delay, jidNormalizedUser, makeCacheableSignalKeyStore, DisconnectReason, fetchLatestBaileysVersion, Browsers, fetchLatestWaWebVersion, proto, updateMessageWithReceipt } = require('@whiskeysockets/baileys');
const pino = require('pino');
const fs = require('fs');
const path = require('path');
const NodeCache = require('node-cache');
const { config }  = require('./config.js');
const spinnies = new (require('spinnies'))();
const { groupParticipantsUpdate } = require('./lib/Events/group-participants.update.js');
const { userDataSaver } = require('./lib/Functions/userDataSaver.js');
//const { save2MongoDB } = require('./lib/Functions/save2MongoDB.js');
//const { Wa2Tele } = require('./lib/Functions/Wa2Tele.js');
//const { Tele2Wa } = require('./lib/Functions/Tele2Wa.js');
//const { sendStory } = require('./lib/Functions/send2Story.js');
const { groupsUpdate } = require('./lib/Events/groups.update.js');
const ProgressBar = require('cli-progress');
const Collection = require('./lib/Collection.js');
const Bottleneck = require('bottleneck');


//Store implementation 
const store = makeInMemoryStore({ 
	logger: pino({ 
		level: "fatal" 
	}).child({ 
		level: "fatal", 
		stream: "store" 
	}) 
});
/*
//saving store data to file 
store.readFromFile('./src/store/baileys_store.json') //reads the contents of the baileys_store.json file. 
setInterval(() => { //The setInterval function creates a repeating timer that runs the provided function every 10 seconds (10,000 milliseconds).
	store.writeToFile('./src/store/baileys_store.json') //the writeToFile function writes the updated data to the baileys_store.json
}, 10_000)
*/

//Getting message from store		
async function getMessage(key) {
	if (store) {
		const msg = await store.loadMessage(key.remoteJid, key.id);
		return msg?.message || undefined;
	}
	return proto.Message.fromObject({});
}
const Commands = new Collection()

Commands.prefix = config.options.prefix

//Function to load commands
const readCommands = () => {
	
    spinnies.add('loading', { text: 'Loading commands...' });
    let dir = path.join(__dirname, "./commands")
    let dirs = fs.readdirSync(dir)
    let listCommand = {}
    try {
        dirs.forEach(async (res) => {
            let groups = res.toLowerCase()
            Commands.type = dirs.filter(v => v !== "_").map(v => v)
            listCommand[groups] = []
            let files = fs.readdirSync(`${dir}/${res}`).filter((file) => file.endsWith(".js"))
            //console.log(files)
            for (const file of files) {
                const command = require(`${dir}/${res}/${file}`)
                listCommand[groups].push(command)
                Commands.set(command.name, command)
                delay(100)
            }
        })
        Commands.list = listCommand;
		spinnies.succeed('loading', { text: 'Commands loaded successfully!' });
    } catch (e) {
        //console.error(e)
		spinnies.fail('loading', { text: 'Failed to load commands!' });
		console.log('Nothing is there!');
    }
}

const restartInterval = 30; // 30 minutes 

// Initialize the WhatsApp bot
async function WaBot() {
	readCommands()
	const { state, saveCreds } = await useMultiFileAuthState('./src/@session');
	const { version, isLatest, error } = await fetchLatestWaWebVersion().catch(() => fetchLatestBaileysVersion());
	
	if (error) {
		console.log('Check your Internet connection...!');
		delay(30000)
		return WaBot()
	}
	console.log(`Connected Using WAWeb v${version.join(".")}, isLatest: ${isLatest}`);
	
	const logger = pino({
        level: 'silent',
        enabled: true
    })
	const retryCache = new NodeCache({
		stdTTL: 20,
		checkperiod: 20
	}) // for retry message, "waiting message"
		
	const sock = makeWASocket({
		connectTimeoutMs: 20_000,
		defaultQueryTimeoutMs: 60_000,
		keepAliveIntervalMs: 30_000,
		logger: logger,
		version: version,
		browser: Browsers.windows('Desktop'),
		printQRInTerminal: true,
		qrTimeout: 20_000,
		auth: {
			creds: state.creds,
			keys: makeCacheableSignalKeyStore(state.keys, logger)
		},
		syncFullHistory: true,
		shouldSyncHistoryMessage: msg => {
			console.log(`Syncing chats..[${msg.progress}%]`);
			return !!msg.syncType;
		},
		markOnlineOnConnect: true,
		generateHighQualityLinkPreview: true,
		msgRetryCounterCache: retryCache, // Resolve waiting for this message!
		getMessage
	});

	//store.bind(sock.ev);

	// Function to fetch and cache group metadata with rate limiting
	async function fetchAndCacheGroupMetadata() {
    	try {
        	// Fetch all groups
        	const groups = await sock.groupFetchAllParticipating();
        	const groupIds = Object.keys(groups);

        	// Rate limiter to prevent rate-overlimit error
        	const limiter = new Bottleneck({
            	minTime: 2000, // Minimum time in ms between each request
        	});

        	// Function to fetch group metadata
        	const fetchGroupMetadata = async (groupId) => {
            	try {
                	const metadata = await sock.groupMetadata(groupId);
                	// Cache the metadata (e.g., store it in a database or in-memory cache)
                	console.log(`Fetched metadata for group: ${groupId}`);
            	} catch (err) {
                	console.error(`Error fetching metadata for group ${groupId}:`, err);
            	}
        	};

        	// Schedule the fetching of group metadata with the rate limiter
        	groupIds.forEach(groupId => {
            	limiter.schedule(() => fetchGroupMetadata(groupId));
        	});

    	} catch (err) {
        	console.error('Error fetching participating groups:', err);
    	}
	}

	//Listen for connection updates
	sock.ev.on('connection.update', async (update) => {
		const { connection, lastDisconnect, qr, receivedPendingNotifications } = update;
		if (connection === 'undefined' && qr != 'undefined'){
			console.log('[ BUGGY ] - Please scan the QR-Code to begin..!')
			qrcode.generate(qr, {small: true});
		}
		if (connection === 'connecting'){
			spinnies.add('start', {text: 'Connecting...'});
		}
		if (connection === 'open'){
			spinnies.succeed('start', {text: `Connected Successfully.\nLogged in as: ${sock?.user?.name || "BUGGY"}\nOn Number: ${sock.user.id.split(":")[0]}`});			
			await sock.sendMessage(config.WApp.Syslogs, {
				text: `𝘚𝘶𝘤𝘤𝘦𝘴𝘴𝘧𝘶𝘭𝘭𝘺 𝘦𝘴𝘵𝘢𝘣𝘭𝘪𝘴𝘩𝘦𝘥 𝘤𝘰𝘯𝘯𝘦𝘤𝘵𝘪𝘰𝘯 𝘣𝘦𝘵𝘸𝘦𝘦𝘯 𝘉𝘶𝘨𝘨𝘺 & 𝘞𝘩𝘢𝘵𝘴𝘈𝘱𝘱.`,
				contextInfo: {
					externalAdReply: {
						showAdAttribution: false,
						renderLargerThumbnail: true,
						title: `🔰BUGGY v5.0.1`,
						body: `Connection successful✅`,
						previewType: 0, 
						mediaType: 1,
						thumbnail: fs.readFileSync("./src/Utils/assets/buggy.jpg"),
						mediaUrl: ``, 
					},
				},
			});
			//fetchAndCacheGroupMetadata() TODO: Load Commands, Databases (MySQL & MongoDB) Sync Contacts, Groups & Messages! 
		}
		if (receivedPendingNotifications) {
			console.log('[ BUGGY ] - Waiting for new messages!')
		}
		if (connection === "close") {
            const status = lastDisconnect?.error?.output?.statusCode;
            const reason = Object.entries(DisconnectReason).find(i => i[1] === status)?.[0] || 'unknown' ;
            console.log(`[ BUGGY ] - Closed connection, status: ${reason}| ${status} | ${connection}`)

            if (status !== 403 && status !== 401){
				await delay(5000)
                return WaBot()
            }
		}	
	});
		
	sock.ev.on('creds.update', saveCreds); {
		console.log('[ BUGGY ] - Credentials Updated!');
	}
	
	sock.ev.on('messaging-history.set', async (history) =>  {
		const { chats, contacts, messages, isLatest } = history;
		console.log(`[ BUGGY ] - Received: ${chats.length} Chats, ${contacts.length} Contacts & ${messages.length} Messages. isLatest: ${isLatest}`)
	});

	sock.ev.on('messages.upsert', async (chatinfo) => {
		await userDataSaver(chatinfo, sock);
		//await save2MongoDB(chatinfo);
		//await nlp(chatinfo, sock);
	});

	sock.ev.on('messages.upsert', async (chat) => {
		await require('./lib/Events/messages.upsert.js')(chat, sock, Commands)
        //require('./lib/chatEngine.js')(chat, sock)
		//await messageUpsert(chat, sock);
		//await Wa2Tele(chat, sock);
		//await Tele2Wa(chat, sock);
		//await sendStory(chat,sock);
    });
	
	sock.ev.on('messages.update', async () => {
		//console.log(`Message Update:`, JSON.stringify(m));
	});

	sock.decodeJid = (jid) => {
		if (!jid) return jid;
		if (/:\d+@/gi.test(jid)) {
			let decode = jidDecode(jid) || {};
			return (decode.user && decode.server && decode.user + "@" + decode.server) || jid;
		} else return jid;
	};

	sock.ev.on('chats.set', () => {
		console.log('Got some chats..', store.chats.all())
	});

	sock.ev.on('chats.upsert', (chat) => {
		console.log(`Chat upsert: ${chat.id} (${chat.name})`);
	});

	sock.ev.on("contacts.update", (update) => {
		for (let contact of update) {
			let id = jidNormalizedUser(contact.id)
			if (store && store.contacts) 
				store.contacts[id] = { 
					id, 
					name: contact.notify 
				};
		}
	});

	sock.ev.on('message-receipt.update', (msgupdates) => {
		for (const {key, receipt} of msgupdates) {
			const obj = msgupdates[key.remoteJid];
			const msg = obj === null || obj === void 0? void 0 : obj.get(key.id);
			if (msg) {
				updateMessageWithReceipt(msg, receipt);
				console.log(updateMessageWithReceipt);
			}
		}
	});

	sock.ev.on('contacts.upsert', (update) => {
		for (let contact of update) {
			let id = jidNormalizedUser(contact.id)
			if(store && store.contacts)
				store.contacts[id] = {
				...(contact || {}),
				isContact:true
			}
		}
	});

	sock.ev.on('contacts.set', () => {
		console.log('New contacts received!', Object.values(store.contacts))
	});

	sock.ev.on('groups.update', async (grpUpdate) => {
		await groupsUpdate(sock, grpUpdate)
	});

	sock.ev.on('group-participants.update', async ({ id, author, participants, action }) => {		
		await groupParticipantsUpdate( sock, store, id, author, participants, action )
	});


	//Function to handle call events 
	sock.ev.on('call', async(call) => {
		try {
			console.log(`Incoming Call from: ${call[0].from}`);
			// If rejectCall is true, reject the call.
			if (config.options.antiCall) {
				//Extract call details.
				var {id, chatId, isVideo, isGroup} = call[0];
				const callType = isVideo ? 'Video Call' : 'Voice Call' ;
				const IN = isGroup ? 'Group' : 'Private Chat' ;
				//Reject call
				await sock.rejectCall(id, chatId)
				await sock.sendMessage(chatId, {text:`Unavailable to take calls now!`})	
				await sock.sendMessage(config.WApp.CallLogs, {text:`📍Call Notification\n\nReceived ${callType} from: ${chatId} in ${IN}\n\nStatus: Rejected`})
					
				console.log('Message sent to caller:', chatId);	
			} else {
				console.log('Call ignored!');
			}
		} catch (error) {
			console.error('Error handling call:', error);
		}	
	});


	// Schedule a function to restart the socket
	setTimeout(() => {
		console.log('Restarting socket...');
		sock.end();
		//WaBot();
	}, restartInterval * 60_000); 
};	

// Start the bot
WaBot()

const file = require.resolve(__filename);
fs.watchFile(file, () => {
	fs.unwatchFile(file);
	console.log((`updated: ${__filename}`));
	delete require.cache[file];
	require(file);
});

process.on("unhandledRejection", (err) => console.error(err));
process.on("uncaughtException", (err) => console.error(err));