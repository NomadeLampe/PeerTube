import * as validator from 'validator'
import { CONSTRAINTS_FIELDS } from '../../../initializers'
import { isTestInstance } from '../../core-utils'
import { exists } from '../misc'

function isActivityPubUrlValid (url: string) {
  const isURLOptions = {
    require_host: true,
    require_tld: true,
    require_protocol: true,
    require_valid_protocol: true,
    protocols: [ 'http', 'https' ]
  }

  // We validate 'localhost', so we don't have the top level domain
  if (isTestInstance()) {
    isURLOptions.require_tld = false
  }

  return exists(url) && validator.isURL(url, isURLOptions) && validator.isLength(url, CONSTRAINTS_FIELDS.ACCOUNTS.URL)
}

function isBaseActivityValid (activity: any, type: string) {
  return (activity['@context'] === undefined || Array.isArray(activity['@context'])) &&
    activity.type === type &&
    isActivityPubUrlValid(activity.id) &&
    isActivityPubUrlValid(activity.actor) &&
    (
      activity.to === undefined ||
      (Array.isArray(activity.to) && activity.to.every(t => isActivityPubUrlValid(t)))
    ) &&
    (
      activity.cc === undefined ||
      (Array.isArray(activity.cc) && activity.cc.every(t => isActivityPubUrlValid(t)))
    )
}

export {
  isActivityPubUrlValid,
  isBaseActivityValid
}
