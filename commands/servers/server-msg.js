const { Command } = require('discord.js-commando');

const Utils = require("../../util/BotUtils")
const Interop = require("../../Plugins/MiscreatedInterop");

module.exports = class MisServerRestartCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'server-msg',
            group: 'servers',
            memberName: 'server-msg',
            description: 'send a message via in-game chat as the specified server',
            examples: [
                `${client.commandPrefix} server-msg [serverId] [message]`,
                `${client.commandPrefix} server-msg e32dfw2 "restarting in 5 minutes due to mod updates"`,
            ],
            guildOnly: true,
            userPermissions: ['ADMINISTRATOR'],
            args: [
                {
                    key: 'serverId',
                    prompt: 'enter the serverId to send a message',
                    type: 'string',
                },
                {
                    key: 'messageContent',
                    prompt: 'enter a Message to Announce or nothing to Skip - server will still send the usual announcements, use this to give players a reason.',
                    type: 'string',
                }
            ]
        });
    }

    async run(message, args) {
        let serverId = args.serverId
        let messageContent = args.messageContent
        if (!serverId) { return message.say("You must specify a serverId to send a message.") }
        if (!messageContent) { return message.say("You must specify a message to send.") }
        return new Promise(async (fulfill, reject) => {

            try {
                fulfill(
                    await this.client.MiscreatedServers.getServer(message.guild.id, { server_id: serverId }).then(res => {
                        return res
                    })
                )
            } catch (err) {
                reject(err)
            }
        })
            .then(result => {

                //! Server with id `serverId` found
                return new Promise(async (fulfill, reject) => {
                    if (result && result.server_id) {
                        try {
                            let server = new Interop(result.server_ip, result.server_rconport, result.server_password)
                            // ensure we have a valid server object.
                            if (!server) { reject(`failed to create misrcon interface for server: ${serverId}`) }

                            fulfill(await server.sendMessage(messageContent))
                        } catch (err) {
                            reject(err)
                        }
                    } else {
                        if (this.client.isDebugBuild) { console.log(result) };
                        reject(`Invalid ServerData Please remove and Re add server: ${serverId} \n _this shouldnt happen if you keep seeing this message please report it as a bug_`)
                    }

                })
                    //* Message Sent
                    .then(result => {
                        if (result) {
                            //debugging
                            if (this.client.isDebugBuild) { console.log(result) };
                            let embed = Utils.generateSuccessEmbed(result,"message sent!")
                            message.say(embed)
                        }

                    })
                    //! Couldnt fetch Server Info
                    .catch(err => {
                        let embed = Utils.generateFailEmbed(`${err}`, "Error in sendMessage!")
                        message.say(embed)
                    })

            })
            .catch(err => {
                //! Server with id `serverId` Not found
                let embed = Utils.generateFailEmbed(`Server not found or Invalid serverId specified: ${err}`, "Failed!")
                message.say(embed)
            })
    }
};