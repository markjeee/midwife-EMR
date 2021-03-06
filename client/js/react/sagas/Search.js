import {call, put} from 'redux-saga/effects'
import {takeLatest} from 'redux-saga'
import fetch from 'isomorphic-fetch'

import {API_ROOT} from '../constants/index'
import {checkStatus} from '../utils/sagasHelper'

import {
  SEARCH_PATIENT_REQUEST,
  SEARCH_PATIENT_SUCCESS,
  SEARCH_PATIENT_FAILURE
} from '../constants/ActionTypes'

import {
  addSuccessNotification,
  addWarningNotification,
  addDangerNotification,
  removeNotification
} from '../actions/Notifications'

const options = {
  credentials: 'same-origin',   // Applies _csrf and connection.sid cookies.
  method: 'GET'
}

const infoNotifyTimeout = 2000;
const warningNotifyTimeout = 3000;
const dangerNotifyTimeout = 5000;


// Exported for testing.
export const doSearchPatient = function (searchCriteria) {
  const fetchOpts = Object.assign({}, options)
  return fetch(`${API_ROOT}/search?searchPhrase=${searchCriteria.searchPhrase}`, fetchOpts)
    .then(checkStatus)
    .then((resp) => {
      return resp.json()
    })
    .then((json) => {
      return {results: json}  // Put it in the form the reducer expects.
    })
    .catch((error) => {
      throw {error}
    })
}

// Exported for testing.
export function* searchPatient(action) {
  try {
    const {results, error} = yield call(doSearchPatient, action.payload.searchCriteria)
    let payload = Object.assign({}, {results})
    yield put({type: SEARCH_PATIENT_SUCCESS, payload})
  } catch (error) {
    yield put({type: SEARCH_PATIENT_FAILURE, error})
    const msg = 'Sorry about that, an error was encountered during the search. Try again?'
    const warningNotifyAction = addWarningNotification(msg)
    yield put(warningNotifyAction)
    yield put(removeNotification(warningNotifyAction.payload.id, warningNotifyTimeout))
  }
}

export function* watchSearchPatient() {
  yield* takeLatest(SEARCH_PATIENT_REQUEST, searchPatient)
}


