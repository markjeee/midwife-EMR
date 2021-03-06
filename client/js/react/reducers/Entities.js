/*
 * -------------------------------------------------------------------------------
 * Entities.js
 *
 * Top-level reducer for all entities.
 * -------------------------------------------------------------------------------
 */
import {isNumber, each, keys} from 'underscore'

import {
  LOAD_ALL_USERS_REQUEST,
  LOAD_ALL_USERS_SUCCESS,
  LOAD_ALL_USERS_FAILURE,
  SAVE_USER_REQUEST,
  SAVE_USER_SUCCESS,
  SAVE_USER_FAILURE,
  ADD_USER_REQUEST,
  ADD_USER_SUCCESS,
  ADD_USER_FAILURE,
  CLEAR_PREGNANCY_DATA,
  GET_PREGNANCY_REQUEST,
  GET_PREGNANCY_SUCCESS,
  GET_PREGNANCY_FAILURE,
  CHECK_IN_OUT_SUCCESS,
  LOAD_USER_PROFILE_SUCCESS,
  DATA_TABLE_SUCCESS
} from '../constants/ActionTypes'

// --------------------------------------------------------
// Default values. Exported for the sake of testing.
// --------------------------------------------------------
export const DEFAULT_ENTITIES = {
  customField: {},
  event: {},
  eventType: {},
  healthTeaching: {},
  labSuite: {},
  labTest: {},
  labTestResult: {},
  labTestValue: {},
  medication: {},
  medicationType: {},
  patient: {},
  pregnancy: {},
  pregnancyHistory: {},
  pregnote: {},
  pregnoteType: {},
  prenatalExam: {},
  referral: {},
  risk: {},
  riskCode: {},
  role: {},
  schedule: {},
  user: {},
  vaccination: {},
  vaccinationType: {}
}

const PREGNANCY_TABLES = [
  'customField',
  'event',
  'eventType',
  'healthTeaching',
  'labSuite',
  'labTest',
  'labTestResult',
  'labTestValue',
  'medication',
  'medicationType',
  'patient',
  'pregnancy',
  'pregnancyHistory',
  'pregnote',
  'pregnoteType',
  'prenatalExam',
  'referral',
  'risk',
  'riskCode',
  'schedule',
  'vaccination',
  'vaccinationType'
]

const entities = (state = DEFAULT_ENTITIES, action) => {
  let newState
  switch (action.type) {
    case LOAD_ALL_USERS_SUCCESS:
      newState = Object.assign({}, state)
      newState.user = action.payload.json.entities.user
      // Since role is a lookup table, we depend upon the lookup
      // table load to populate those rows.
      return newState

    case SAVE_USER_REQUEST:
      // Assumes optimist update.
      let user = Object.assign({}, state.user)
      if (action.optimist && action.payload.data &&
          action.payload.data.hasOwnProperty('id')) {
        const id = action.payload.data.id
        user[id] = action.payload.data
      }
      return Object.assign({}, state, {user: user})

    case ADD_USER_SUCCESS:
      // Add the user that the server passed back into the state.
      if (true) {
        // Add the role field to match what normalizr does.
        const newUser = Object.assign({}, action.payload)
        newUser.role = newUser.role_id

        // Add the new user to the user list.
        const newUsers = Object.assign({}, state.user)
        newUsers['' + action.payload.id] = newUser

        // Add the new user list into the new state.
        const newState = Object.assign({}, state, {user: newUsers})
        return newState
      }

    case CLEAR_PREGNANCY_DATA:
      // Clear all pregnancy tables.
      if (true) {
        const newState = Object.assign({}, state)
        each(PREGNANCY_TABLES, (tbl) => {
          newState[tbl] = {}
        })
        return newState
      }

    case GET_PREGNANCY_SUCCESS:
      // Add the pregnancy record and related records to state.
      // TODO: ensure that this properly handles one to many relationships.
      if (true) {
        const newState = Object.assign({}, state)
        if (action.payload && action.payload.entities && action.payload.entities.pregnancy) {
          each(keys(action.payload.entities), (tbl) => {
            each(action.payload.entities[tbl], (rec, id) => {
              newState[tbl][id] = rec
            })
          })
          return newState
        }
        return state
      }

    case CHECK_IN_OUT_SUCCESS:
      // --------------------------------------------------------
      // For checkin/checkout operations with a specific pregnancy,
      // set the prenatalCheckinPriority accordingly. Does not
      // affect state for new client checkins when there is no
      // associated pregnancy record yet.
      //
      // Note: the CHECK_IN_OUT_SUCCESS action is handled in the
      // entities and search reducers.
      // --------------------------------------------------------
      if (true) {
        const newState = Object.assign({}, state)
        if (action.payload) {
          const {operation, pregId, priority} = action.payload
          if (operation && pregId) {
            const preg = newState.pregnancy[pregId]
            if (operation === 'checkin') {
              if (preg) {
                newState.pregnancy[pregId].prenatalCheckinPriority = priority
              }
            } else if (operation === 'checkout') {
              if (preg) {
                newState.pregnancy[pregId].prenatalCheckinPriority = 0
              }
            }
          }
        }
        return newState
      }

    case LOAD_USER_PROFILE_SUCCESS:
      // --------------------------------------------------------
      // The user's profile is in action.payload. We set the
      // appropriate user record based upon the user's id.
      // --------------------------------------------------------
      if (true) {
        const newState = Object.assign({}, state)
        const id = action.payload.id
        newState.user[id] = action.payload
        return newState
      }

    case DATA_TABLE_SUCCESS:
      // --------------------------------------------------------
      // One of the data tables is being refreshed entirely. This
      // usually is one of the lookup tables.
      // --------------------------------------------------------
      if (true) {
        const newState = Object.assign({}, state)
        const tableName = Object.keys(action.payload.entities)[0]
        newState[tableName] = action.payload.entities[tableName]
        return newState
      }

    default:
      return state
  }
}

export default entities
