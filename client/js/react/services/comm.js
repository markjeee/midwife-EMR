import io from 'socket.io-client'
import {normalize} from 'normalizr'

import {
  siteMessage,
  systemMessage,
  authenticationUpdate,
  dataChange
} from '../actions'

import {
  DATA_CHANGE,
  DATA_TABLE_REQUEST,
  DATA_TABLE_SUCCESS,
  DATA_TABLE_FAILURE,
  ADD_USER_REQUEST,
  ADD_USER_SUCCESS,
  ADD_USER_FAILURE,
} from '../constants/ActionTypes'

// Time to wait for the server by default.
const DEFAULT_SERVER_TIMEOUT = 5000

/* --------------------------------------------------------
 * getNextTransactionId()
 *
 * Returns the next transaction id to use.
 * -------------------------------------------------------- */
const getNextTransactionId = () => {
  return ++nextTransactionId
}
let nextTransactionId = 0

import Schemas from '../constants/Schemas'
import {setLookupTable} from '../actions/LookupTables'

const SITE_URL = `${window.location.origin}/site`
const SYSTEM_URL = `${window.location.origin}/system`
const DATA_URL = `${window.location.origin}/data`

let ioData

const sendMsg = (msg, payload) => {
  ioData.emit(msg, JSON.stringify(payload))
}

const handleFailure = (err) => {
  // TODO: handle this properly.
  console.log(err)
}

/* --------------------------------------------------------
 * getLookupTable()
 *
 * Request that the server respond with the contents of a
 * lookup table. The server will only respond to white
 * listed tables.
 *
 * The response will arrive on the data channel.
 *
 * param       table
 * return      undefined
 * -------------------------------------------------------- */
export const getLookupTable = (table) => {
  // --------------------------------------------------------
  // Patterned after Redux, though of course, this is not.
  // --------------------------------------------------------
  const action = {
    type: DATA_TABLE_REQUEST,
    payload: {
      table
    }
  }
  // --------------------------------------------------------
  // TODO: incorporate caching in order to reduce network calls.
  // --------------------------------------------------------
  sendMsg(DATA_TABLE_REQUEST, action)
}

/* --------------------------------------------------------
 * changeData()
 *
 * Takes an action object, which contains the entirety of
 * the change, and adds a transaction id to it for tracking
 * purposes. Allows caller to specify an optional timeout
 * for the server to respond within, otherwise uses default.
 * Resolves as a promise to the caller with the response
 * from the server.
 *
 * param        action  - Redux format action object
 * param        ms      - milliseconds to wait for the server
 * return       promise
 * -------------------------------------------------------- */
export const changeData = (action, ms) => {
  return new Promise((resolve, reject) => {
    // Add a transaction id to the request.
    const transaction = getNextTransactionId()
    const newAction = Object.assign({}, action, {transaction})

    // Set up the timeout to handle a non-responsive server.
    const timeout = setTimeout(() => {
      reject(false)
    }, ms? ms: DEFAULT_SERVER_TIMEOUT)

    // Handle a server response.
    ioData.on(''+transaction, function(data) {
      var retAction = JSON.parse(data)
      clearTimeout(timeout)
      resolve(retAction)
    })

    // Send the request to the server.
    sendMsg(DATA_CHANGE, newAction)
  })
}

const Comm = (store) => {
  const ioSite = io.connect(SITE_URL)
  const ioSystem = io.connect(SYSTEM_URL)
  ioData = io.connect(DATA_URL)

  ioSite.on('site', (data) => {
    store.dispatch(siteMessage(data.data))
  })

  ioSystem.on('system', (data) => {
    store.dispatch(systemMessage(data))
  })

  ioData.on('data', (data) => {
    // TODO: refactor to a switch for efficiency.
    //
    // NOTE: this is not a Redux type, of course, but we follow the same
    // pattern for the server to client communications and use the same
    // constant for the Redux action type.
    if (data.type && data.type === DATA_CHANGE) {
      // Notification from the server that data was
      // changed by a different client.
      store.dispatch(dataChange(data))
    } else if (data.authentication) {
      store.dispatch(authenticationUpdate(data.authentication))
    }
  })

  ioData.on(DATA_TABLE_SUCCESS, (data) => {
    const dataObj = JSON.parse(data)
    const table = dataObj && dataObj.payload && dataObj.payload.data? dataObj.payload.data: void 0
    if (table) {
      const normalized = normalize(table, Schemas.ROLE_ARRAY)
      if (normalized) {
        store.dispatch(setLookupTable(normalized.entities))
      }
    }
  })

  ioData.on(DATA_TABLE_FAILURE, handleFailure)

}

export default Comm

