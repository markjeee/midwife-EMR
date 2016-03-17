import {API_ROOT} from '../constants/index'
import {getUniqueId} from '../utils/index'

// --------------------------------------------------------
// Default options used for all server calls.
// --------------------------------------------------------
let options = {
  credentials: 'same-origin',   // Applies _csrf and connection.sid cookies.
  method: 'GET'
}

export const makeGetAction = (types, test, path, schema, opts) => {
  const callOpts = Object.assign({}, options, opts)
  return (dispatch, getState) => {
    return dispatch({
      payload: {
        types: types,
        test: test,
        call: () => fetch(`${API_ROOT}/${path}`, callOpts),
        schema: schema,
        notifyUser: false
      },
      meta: {
        dataMiddleware: true
      }
    })
  }
}

export const makePostAction = (types, test, path, schema, opts, data, meta) => {
  const callOpts = Object.assign({}, options, opts)
  return (dispatch, getState) => {
    const {_csrf} = getState().authentication.cookies
    callOpts.method = 'POST'
    callOpts.headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    }
    callOpts.body = JSON.stringify(Object.assign({}, data, {_csrf}))
    const {id} = data
    let metaObj = Object.assign({}, meta, {dataMiddleware: true, optimistId: getUniqueId()})
    dispatch({
      payload: {
        types: types,
        call: () => fetch(`${API_ROOT}/${path}/${id}`, callOpts),
        schema: schema,
        notifyUser: true,
        data: data
      },
      meta: metaObj
    })
  }
}
