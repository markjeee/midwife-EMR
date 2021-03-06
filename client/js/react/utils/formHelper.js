import React from 'react'
import {map, each, filter} from 'underscore'
import moment from 'moment'

import {DatePick} from '../common/DatePick'

// --------------------------------------------------------
// Error processing functions.
// --------------------------------------------------------

export const getValueFromEvent = (evt) => {
  let value
  if (typeof evt === 'object' && evt._isAMomentObject) {
    // TODO: not sure is this is what is best to return.
    value = evt.toDate();
  } else {
    switch (evt.target.type) {
      case 'checkbox':
        value = evt.target.checked
        break
      case 'select-one':
        value = parseInt(evt.target.value, 10)
        break
      default:
        value = evt.target.value
    }
  }
  return value
}

/* --------------------------------------------------------
 * setValid()
 *
 * Given a field name and an error message, return an error
 * object that has an appropriate isValid property and a
 * message.
 *
 * param       fldName
 * param       msg
 * return      object - error object
 * -------------------------------------------------------- */
export const setValid = (fldName, msg) => {
  const isValid = ! msg || msg.length === 0? true: false
  return {
    field: fldName,
    isValid,
    msg
  }
}


/* --------------------------------------------------------
 * getErrors()
 *
 * Passed the field objects and a copy of the state, run
 * the validation tests, if any, against each field. Returns
 * an object with field names as keys and error messages as
 * values.
 *
 * param       fldObjs
 * param       state
 * return      errors - An error object.
 * -------------------------------------------------------- */
export const getErrors = (fldObjs, state) => {
  // Get an array of error objects that have errors.
  const errors = filter(map(fldObjs, (fld, fldName) => {
    if (fld.validate) {
      return fld.validate(fldName, state[fldName])
    }
    return setValid(fldName)
  }), (e) =>! e.isValid)

  // Convert to a single error object with field names as keys.
  const errObj = {}
  each(errors, (err) => {
    errObj[err.field] = err.msg
  })
  return errObj
}

// --------------------------------------------------------
// Change processing functions.
// --------------------------------------------------------

/* --------------------------------------------------------
 * manageChange()
 *
 * Returns a function that manages the object specified in
 * the state. That function expects to be passed a field
 * name and it returns another function that actually
 * manages the state.
 *
 * Example of use:
 *
 * // In the constructor at the object level to manage the
 * // profile object on the state.
 * this.handleChange = manageChange('profile').bind(this)
 *
 * // In render (or somewhere else) to manage individual
 * // fields within the profile object.
 * const onChange = this.handleChange(fldName)
 *
 * param       object - object in state to manage
 * return      function
 * -------------------------------------------------------- */
export function manageChange(object) {
  return function(name) {
    return (evt) => {
      const value = getValueFromEvent(evt)
      const newState = Object.assign({}, this.state[object], {[name]: value})
      this.setState({[object]: newState})
    }
  }
}

// --------------------------------------------------------
// Validation functions.
// --------------------------------------------------------


/* --------------------------------------------------------
 * notEmpty()
 *
 * Returns an appropriate error object in regard to whether
 * the field is empty.
 *
 * Always returns an error object, but the object's isValid
 * property needs to be inspected to determine if there is an error.
 *
 * param       fldName
 * param       val
 * return      object - error object
 * -------------------------------------------------------- */
export const notEmpty = (fldName, val) => {
  if (! val || val.length === 0) {
    return setValid(fldName, 'This field cannot be empty.')
  }
  return setValid(fldName)
}

/* --------------------------------------------------------
 * onlyNumbers()
 *
 * Returns an appropriate error object in regard to whether
 * the field is not empty and contains only numbers.
 *
 * Always returns an error object, but the object's isValid
 * property needs to be inspected to determine if there is an error.
 * -------------------------------------------------------- */
export const onlyNumbers = (fldName, val) => {
  if (val.length === 0) {
    return setValid(fldName, 'This field cannot be empty.')
  }
  if (Array.every(val, (v) => {return v >= '0' && v <= '9'})) {
    return setValid(fldName)
  }
  return setValid(fldName, 'This field can only contain numbers.')
}

/* --------------------------------------------------------
 * gtZero()
 *
 * Returns an appropriate error object in regard to whether
 * the field is a number that is greater than zero.
 *
 * Always returns an error object, but the object's isValid
 * property needs to be inspected to determine if there is an error.
 * -------------------------------------------------------- */
export const gtZero = (fldName, val) => {
  let num = parseInt(val, 10)
  if (num === NaN) return setValid(fldName, 'This field must be a number.')
  if (num > 0) return setValid(fldName)
  return setValid(fldName, 'This field must be a number greater than zero.')
}

/* --------------------------------------------------------
 * hasSelection()
 *
 * Returns an appropriate error object in regard to whether
 * a selection has been made in a multi-select input, assuming
 * that the id is a number greater than zero for a positive
 * response.
 *
 * Always returns an error object, but the object's isValid
 * property needs to be inspected to determine if there is an error.
 * -------------------------------------------------------- */
export const hasSelection = (fldName, val) => {
  let gtz = gtZero(fldName, val)
  if (! gtz.isValid) {
    // --------------------------------------------------------
    // The selection id is assumed to be a number greater than
    // zero, so if there is an error of any type, just tell the
    // user than a selection must be made.
    // --------------------------------------------------------
    gtz.msg = 'You must make a selection in this field.'
  }
  return gtz
}

// --------------------------------------------------------
// Rendering functions.
// --------------------------------------------------------


export const renderROText = (cfg) => {
  const classes = `form-group col-xs-${cfg.colWidth} fhelper fhelper-text`
  return (
    <div key={cfg.fldName} className={classes}>
      <label>{cfg.lbl}</label>
      <input
        type={cfg.type}
        className='form-control'
        placeholder={cfg.ph}
        value={cfg.val == null? '': cfg.val}
        disabled={true}
        ref={(c) => {
          if (cfg.state) {
            cfg.state['_' + cfg.fldName] = c
          }
        }}
      />
    </div>
  )
}

/* --------------------------------------------------------
 * renderText()
 *
 * Returns an input group for text fields. Also sets a reference
 * on the state passed for the field at '_' + field name, e.g.
 * state._firstname.
 *
 * Expects the following fields on the cfg object passed:
 *    colWidth      - number of Bootstrap columns spanned
 *    fldName       - name of the field
 *    lbl           - label to use on the field
 *    type          - type of the input field
 *    ph            - placeholder value for the input
 *    val           - the value of the input field
 *    onChange      - the onChange handler
 *    state         - (optional) state object to reference errors
 *
 * param       cfg - configuration object
 * return      jsx
 * -------------------------------------------------------- */
export const renderText = (cfg) => {
  const classes = `form-group col-xs-${cfg.colWidth} fhelper fhelper-text`
  return (
    <div key={cfg.fldName} className={classes}>
      <label>{cfg.lbl}</label>
      <input
        type={cfg.type}
        className='form-control'
        placeholder={cfg.ph}
        value={cfg.val == null? '': cfg.val}
        onChange={cfg.onChange}
        ref={(c) => {
          if (cfg.state) {
            cfg.state['_' + cfg.fldName] = c
          }
        }}
      />
      <div className='text-warning'>{
        cfg.state &&
        cfg.state.errors &&
        cfg.state.errors[cfg.fldName]
      }</div>
    </div>
  )
}

/* --------------------------------------------------------
 * renderDate()
 *
 * Returns an input group for date fields. Also sets a reference
 * on the state passed for the field at '_' + field name, e.g.
 * state._firstname.
 *
 * Expects the following fields on the cfg object passed:
 *    colWidth      - number of Bootstrap columns spanned
 *    fldName       - name of the field
 *    lbl           - label to use on the field
 *    type          - type of the input field
 *    val           - the value of the input field
 *    onChange      - the onChange handler
 *    state         - (optional) state object to reference errors
 *
 * param       cfg - configuration object
 * return      jsx
 * -------------------------------------------------------- */
export const renderDate = (cfg) => {
  const dateVal = cfg.val? moment(cfg.val): void 0
  const classes = `form-group col-xs-${cfg.colWidth} fhelper fhelper-text`
  return (
    <div key={cfg.fldName} className={classes}>
      <label>{cfg.lbl}</label>
      <DatePick
        title={cfg.lbl}
        onChange={cfg.onChange}
        val={dateVal}
      />
      <div className='text-warning'>{
        cfg.state &&
        cfg.state.errors &&
        cfg.state.errors[cfg.fldName]
      }</div>
    </div>
  )
}
/* --------------------------------------------------------
 * renderCB()
 *
 * Returns an input group for a checkbox.
 *
 * Expects the following fields on the cfg object passed:
 *    colWidth      - number of Bootstrap columns spanned
 *    fldName       - name of the field
 *    lbl           - label to use on the field
 *    val           - the value of the input field
 *    onChange      - the onChange handler
 *    state         - (optional) state object to reference errors
 *
 * param       cfg - configuration object
 * return      jsx
 * -------------------------------------------------------- */
export const renderCB = (cfg) => {
  const classes = `form-group col-xs-${cfg.colWidth} checkbox fhelper fhelper-checkbox`
  return (
    <div key={cfg.fldName} className={classes}>
      <label className='checkbox'>
        <input
          type='checkbox'
          checked={cfg.val}
          onChange={cfg.onChange}
        /><strong> {cfg.lbl}</strong>
      </label>
      <div className='text-warning'>{
        cfg.state &&
        cfg.state.errors &&
        cfg.state.errors[cfg.fldName]
      }</div>
    </div>
  )
}


/* --------------------------------------------------------
 * renderSelect()
 *
 * Returns an select component. If cfg.val is empty or undefined,
 * the select is set to a blank record.
 *
 * Expects the following fields on the cfg object passed:
 *    colWidth      - number of Bootstrap columns spanned
 *    fldName       - name of the field
 *    lbl           - label to use on the field
 *    val           - the value of the input field
 *    onChange      - the onChange handler
 *    options       - an array of objects representing the options
 *    state         - (optional) state object to reference errors
 *
 * param       cfg - configuration object
 * return      jsx
 * -------------------------------------------------------- */
export const renderSelect = (cfg) => {
  const classes = `form-group col-xs-${cfg.colWidth} fhelper`
  const opts = Object.assign({}, cfg.options)
  let val = cfg.val
  if (! cfg.val) {
    val = -1
    opts['-1'] = {id: -1, value: -1, name: ''}
  }
  return (
    <div className={classes}>
      <label>{cfg.lbl}</label>
      <select
        className='form-control'
        value={val}
        name={cfg.fldName}
        onChange={cfg.onChange}
      >
      {
        map(opts, (rec) => {
          return <option key={rec.id} value={rec.id}>{rec.name}</option>
        })
      }
      </select>
      <div className='text-warning'>{
        cfg.state &&
        cfg.state.errors &&
        cfg.state.errors[cfg.fldName]
      }</div>
    </div>
  )
}

