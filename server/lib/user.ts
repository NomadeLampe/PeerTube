import * as Sequelize from 'sequelize'
import { createPrivateAndPublicKeys, logger } from '../helpers'
import { CONFIG, sequelizeTypescript } from '../initializers'
import { AccountModel } from '../models/account/account'
import { UserModel } from '../models/account/user'
import { getAccountActivityPubUrl } from './activitypub'
import { createVideoChannel } from './video-channel'

async function createUserAccountAndChannel (user: UserModel, validateUser = true) {
  const { account, videoChannel } = await sequelizeTypescript.transaction(async t => {
    const userOptions = {
      transaction: t,
      validate: validateUser
    }

    const userCreated = await user.save(userOptions)
    const accountCreated = await createLocalAccountWithoutKeys(user.username, user.id, null, t)

    const videoChannelName = `Default ${userCreated.username} channel`
    const videoChannelInfo = {
      name: videoChannelName
    }
    const videoChannel = await createVideoChannel(videoChannelInfo, accountCreated, t)

    return { account: accountCreated, videoChannel }
  })

  // Set account keys, this could be long so process after the account creation and do not block the client
  const { publicKey, privateKey } = await createPrivateAndPublicKeys()
  account.set('publicKey', publicKey)
  account.set('privateKey', privateKey)
  account.save().catch(err => logger.error('Cannot set public/private keys of local account %d.', account.id, err))

  return { account, videoChannel }
}

async function createLocalAccountWithoutKeys (name: string, userId: number, applicationId: number, t: Sequelize.Transaction) {
  const url = getAccountActivityPubUrl(name)

  const accountInstance = new AccountModel({
    name,
    url,
    publicKey: null,
    privateKey: null,
    followersCount: 0,
    followingCount: 0,
    inboxUrl: url + '/inbox',
    outboxUrl: url + '/outbox',
    sharedInboxUrl: CONFIG.WEBSERVER.URL + '/inbox',
    followersUrl: url + '/followers',
    followingUrl: url + '/following',
    userId,
    applicationId,
    serverId: null // It is our server
  })

  return accountInstance.save({ transaction: t })
}

// ---------------------------------------------------------------------------

export {
  createUserAccountAndChannel,
  createLocalAccountWithoutKeys
}
