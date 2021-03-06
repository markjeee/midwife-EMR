// --------------------------------------------------------
// Users and Roles.
// --------------------------------------------------------
export const SELECT_USER = 'SELECT_USER'
export const SELECT_PREGNANCY = 'SELECT_PREGNANCY'

export const LOAD_ALL_USERS_REQUEST = 'LOAD_ALL_USERS_REQUEST'
export const LOAD_ALL_USERS_SUCCESS = 'LOAD_ALL_USERS_SUCCESS'
export const LOAD_ALL_USERS_FAILURE = 'LOAD_ALL_USERS_FAILURE'

export const SAVE_USER_REQUEST = 'SAVE_USER_REQUEST'
export const SAVE_USER_SUCCESS = 'SAVE_USER_SUCCESS'
export const SAVE_USER_FAILURE = 'SAVE_USER_FAILURE'

export const ADD_USER_REQUEST = 'ADD_USER_REQUEST'
export const ADD_USER_SUCCESS = 'ADD_USER_SUCCESS'
export const ADD_USER_FAILURE = 'ADD_USER_FAILURE'

export const USER_PASSWORD_RESET_REQUEST = 'USER_PASSWORD_RESET_REQUEST'
export const USER_PASSWORD_RESET_SUCCESS = 'USER_PASSWORD_RESET_SUCCESS'
export const USER_PASSWORD_RESET_FAILURE = 'USER_PASSWORD_RESET_FAILURE'

export const LOAD_USER_PROFILE_REQUEST = 'LOAD_USER_PROFILE_REQUEST'
export const LOAD_USER_PROFILE_SUCCESS = 'LOAD_USER_PROFILE_SUCCESS'
export const LOAD_USER_PROFILE_FAILURE = 'LOAD_USER_PROFILE_FAILURE'

export const DATA_TABLE_REQUEST = 'DATA_TABLE_REQUEST'
export const DATA_TABLE_SUCCESS = 'DATA_TABLE_SUCCESS'
export const DATA_TABLE_FAILURE = 'DATA_TABLE_FAILURE'

// Convenience constants for actions, etc.
export const LOAD_ALL_USERS_SET = [
  LOAD_ALL_USERS_REQUEST,
  LOAD_ALL_USERS_SUCCESS,
  LOAD_ALL_USERS_FAILURE
]
export const SAVE_USER_SET = [
  SAVE_USER_REQUEST,
  SAVE_USER_SUCCESS,
  SAVE_USER_FAILURE
]
export const USER_PASSWORD_RESET_SET = [
  USER_PASSWORD_RESET_REQUEST,
  USER_PASSWORD_RESET_SUCCESS,
  USER_PASSWORD_RESET_FAILURE
]

// We are informed by the server that another client has changed some data
// or we are informing the server that we have changed data.
export const DATA_CHANGE = 'DATA_CHANGE'

// --------------------------------------------------------
// Notifications.
// --------------------------------------------------------
export const ADD_NOTIFICATION = 'ADD_NOTIFICATION'
export const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION'

// --------------------------------------------------------
// Delayed actions.
// --------------------------------------------------------
export const DELAY = 'DELAY'

// --------------------------------------------------------
// Route changes via Redux state.
// --------------------------------------------------------
export const ROUTE_CHANGE = 'ROUTE_CHANGE'

// --------------------------------------------------------
// Patient Search.
// --------------------------------------------------------
export const SEARCH_PATIENT_REQUEST = 'SEARCH_PATIENT_REQUEST'
export const SEARCH_PATIENT_SUCCESS = 'SEARCH_PATIENT_SUCCESS'
export const SEARCH_PATIENT_FAILURE = 'SEARCH_PATIENT_FAILURE'

// --------------------------------------------------------
// Pregnancy.
// --------------------------------------------------------
export const GET_PREGNANCY_REQUEST = 'GET_PREGNANCY_REQUEST'
export const GET_PREGNANCY_SUCCESS = 'GET_PREGNANCY_SUCCESS'
export const GET_PREGNANCY_FAILURE = 'GET_PREGNANCY_FAILURE'
export const CLEAR_PREGNANCY_DATA = 'CLEAR_PREGNANCY_DATA'
export const CHECK_IN_OUT_REQUEST = 'CHECK_IN_OUT_REQUEST'
export const CHECK_IN_OUT_SUCCESS = 'CHECK_IN_OUT_SUCCESS'
export const CHECK_IN_OUT_FAILURE = 'CHECK_IN_OUT_FAILURE'
export const SAVE_PRENATAL_REQUEST = 'SAVE_PRENATAL_REQUEST'
export const SAVE_PRENATAL_SUCCESS = 'SAVE_PRENATAL_SUCCESS'
export const SAVE_PRENATAL_FAILURE = 'SAVE_PRENATAL_FAILURE'


// --------------------------------------------------------
// Authentication related.
// --------------------------------------------------------
export const LOGIN_REQUESTED = 'LOGIN_REQUESTED'
export const LOGIN_SUCCESS = 'LOGIN_SUCCESS'
export const LOGIN_FAILURE = 'LOGIN_FAILURE'
export const AUTHENTICATION_INIT = 'AUTHENTICATION_INIT'
export const SET_COOKIES = 'SET_COOKIES'
export const SET_IS_AUTHENTICATED = 'SET_IS_AUTHENTICATED'
export const SET_USER_ID = 'SET_USER_ID'
export const SET_ROLE_NAME = 'SET_ROLE_NAME'

// --------------------------------------------------------
// Server information stored upon initialization.
// --------------------------------------------------------
export const SERVER_INFO = 'SERVER_INFO'

// Note: will deprecate AUTHENTICATION_UPDATE
//export const AUTHENTICATION_UPDATE = 'AUTHENTICATION_UPDATE'

// --------------------------------------------------------
// Window resize related.
// --------------------------------------------------------
export const WINDOW_RESIZE = 'WINDOW_RESIZE'

// --------------------------------------------------------
// Miscellaneous.
// --------------------------------------------------------
export const SITE_MESSAGE = 'SITE_MESSAGE'
export const SYSTEM_MESSAGE = 'SYSTEM_MESSAGE'
