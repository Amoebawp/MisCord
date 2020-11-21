const ServerModel = require('../Models/Servers')
const Utils = require("../../util/Util")
require('dotenv').config()
let secret = ""
module.exports = class ServerController {
    constructor(client) {
        this.client = client;
        secret = process.env.SECRET;
    }

    addServer(guild, server) {
        return new Promise(async (resolve, reject) => {
            if (!guild) { reject("missing guild") }
            const doc = new ServerModel({
                guild: guild,
                server_id: server.id,
                server_name: server.name,
                server_ip: server.ip,
                server_gameport: server.gameport,
                server_rconport: server.rconport,
                server_password: Utils.encrypt_data(server.password, secret),
                server_authkey: Utils.encrypt_data(server.authkey, secret)
            })

            await doc.save()
                .then(saved => {
                    const new_server = saved.toObject()
                    if (new_server && new_server.server_id === server.id) {
                        resolve(saved.server_id)
                    } else {
                        reject("Error Saving Data, [serverId not match]")
                    }
                })
                .catch(err => {
                    reject(`Error in SaveData: ${err}`)
                })
        })
    }


    getServers(guild) {
        return new Promise(async (resolve, reject) => {
            if (!guild) { reject("missing guild") }
            const servers = await ServerModel.find({ guild: guild })
            if (!servers) {
                reject(servers)
            } else {
                resolve(servers)
            }
        })
    }

    getServer(guild, server_data) {
        return new Promise(async (resolve, reject) => {
            if (!guild) { reject("missing guild") }
            const server = await ServerModel.findOne({ guild: guild, ...server_data })
            if (!server) {
                resolve(server)
            } else {
                server.password = Utils.decrypt_data(server.password, secret)
                server.authkey = Utils.decrypt_data(server.authkey, secret)
                resolve(server)
            }
        })
    }

    delServer(guild, server_id) {
        return new Promise(async (resolve, reject) => {
            if (!guild) { reject("missing guild") }
            if (!server_id) { reject("missing server_id") }
            const server = await ServerModel.findOne({ server_id: server_id })
            if (!server) {
                reject("that server does not exist")
            } else {
                resolve(await server.remove())
            }
        })
    }
}