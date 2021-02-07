const { Command } = require('discord.js-commando');

const Utils = require("../../util/BotUtils")
const Interop = require("../../Plugins/MiscreatedInterop");
const { Message } = require('discord.js');

module.exports = class MisAddBanlistCommand extends Command {
    constructor(client) {
        super(client, {
            name: 'banlist-add',
            group: 'banlist',
            memberName: 'banlist-add',
            description: 'adds banned steamId for the specified serverId',
            examples: [
                `${client.commandPrefix} banlist-add e32dfw2 710232182323`,
            ],
            guildOnly: true,
            userPermissions: ['ADMINISTRATOR'],
            args: [
                {
                    key: 'serverId',
                    prompt: 'enter the serverId to manage banlist for',
                    type: 'string',
                },
                {
                    key: 'steamId',
                    prompt: 'enter the steam64Id to banlist',
                    type: 'string',
                }
            ]
        });
    }

    async run(message, args) {
        let serverId = args.serverId
        let steamId = args.steamId
        if (!serverId) { return message.say("You must specify a serverId to manage banlist for.") }

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

                            fulfill(await server.banPlayer(steamId))
                        } catch (err) {
                            reject(err)
                        }
                    } else {
                        if (this.client.isDebugBuild) { console.log(result) };
                        reject(`Invalid ServerData Please remove and Re add server: ${serverId} \n _this shouldnt happen if you keep seeing this message please report it as a bug_`)
                    }

                })
                    //* Fetched ServerInfo
                    .then(result => {
                        if (result) {
                            //debugging
                            if (this.client.isDebugBuild) { console.log(result) };
                            let embed = Utils.generateSuccessEmbed(result,"add banlist success!")
                            message.say(embed)
                        }

                    })
                    //! Couldnt fetch Server Info
                    .catch(err => {
                        let embed = Utils.generateFailEmbed(`Error fetching server info ${err}`, "Failed to fetch Server Info!")
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