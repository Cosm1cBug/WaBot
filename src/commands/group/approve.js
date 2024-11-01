module.exports = {
  name: 'approve',
  info: 'Approves join request of given user.',
  private: false,
  func: async (sock, chat, m, text) => {
    if (!msg.isGroup) return await msg.reply({ text: '*This command can only be used in group!*' });
    if (!(await msg.isAdmin(msg.me))) return await msg.reply({ text: '*I am not an admin of this group!*' });
    if (!(await msg.isAdmin(msg.sender))) return await msg.reply({ text: '*You are not an admin of this group!*' });
    if (!text || !text.startsWith('+')) return await msg.reply({ text: '*Please enter the number of user with +countrycode for approving!*' });
    let list = [];
    let lis = await sock.groupRequestParticipantsList(msg.chat);
    lis.map((l) => list.push('+' + l.jid.split('@')[0]));
    if (!list.includes(text)) return await msg.reply({ text: '*This user didn\'t sent join request to this group!*' });
    await sock.groupRequestParticipantsUpdate(msg.chat, [text.replace('+', '') + '@s.whatsapp.net'], 'approve');
    return await msg.reply({ text: '*Approved @' + text.replace('+', '') + '\'s join request!*' });
  }
}
