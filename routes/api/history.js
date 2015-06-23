/* --------------------------------------------------------
 * history.js
 *
 * "REST"-like api for client calls. Data is read-only so
 * certain standard REST calls do not apply.
 * -------------------------------------------------------- */
var cfg = require('../../config')
  , logInfo = require('../../util').logInfo
  , logWarn = require('../../util').logWarn
  , logError = require('../../util').logError
  , collateRecs = require('../../util').collateRecs
  , mergeRecs = require('../../util').mergeRecs
  , Bookshelf = require('bookshelf')
  , Promise = require('bluebird')
  , _ = require('underscore')
  ;


/* --------------------------------------------------------
 * getAllData()
 *
 * Returns all of the historical data for a specific patient
 * to the caller in one JSON data structure.
 * -------------------------------------------------------- */
var getAllData = function(req, res) {
  var sqlPreg
    , sqlPat
    , sqlRisk
    ;

  if (req.parameters && req.parameters.id1) {
    pregId = req.parameters.id1;
  } else {
    // Bad request since the proper parameter not specified.
    res.statusCode = 400;
    return res.end();
  }

  // PregnancyLog
  sqlPreg = 'SELECT * FROM pregnancyLog WHERE id = ? ORDER BY replacedAt';

  // PatientLog
  sqlPat  = 'SELECT pa.* FROM patientLog pa INNER JOIN pregnancy pr ';
  sqlPat += 'ON pr.patient_id = pa.id WHERE pr.id = ? ORDER BY pa.replacedAt';

  // riskLog
  sqlRisk =  'SELECT rl.*, rc.name, rc.riskType, rc.description FROM riskLog rl ';
  sqlRisk += 'INNER JOIN riskCode rc ON rl.riskCode = rc.id WHERE pregnancy_id = ? ';
  sqlRisk += 'ORDER BY replacedAt';

  return Promise.all([
    getData(sqlPreg, pregId),
    getData(sqlPat, pregId),
    getData(sqlRisk, pregId),
  ]).then(function(results) {
    // --------------------------------------------------------
    // The Angular client expects an array. The first record
    // of the array will be the collated/merged main tables.
    // --------------------------------------------------------
    var data = [];
    var main;
    var secondary = {};

    // --------------------------------------------------------
    // The main tables which are collated/merged.
    // --------------------------------------------------------
    main = _.object([
        'pregnancyLog',
        'patientLog'],
      results);
    main = collateRecs(main, 'replacedAt');
    mergeRecs(main, 'replacedAt');
    data.push(main);

    // --------------------------------------------------------
    // The secondary tables which are provided to the client raw
    // as the second record of the array.
    // --------------------------------------------------------
    secondary.riskLog = results[2];      // riskLog
    // Add more secondary tables here as the come online.
    data.push(secondary);
    res.end(JSON.stringify(data));
  });
};

/* --------------------------------------------------------
 * getData()
 *
 * Return a promise which will resolve to the data for the
 * specified query.
 *
 * param       sql
 * param       pregId
 * return      promise
 * -------------------------------------------------------- */
var getData = function(sql, pregId) {
  var knex
    , sqlRisk
    , results
    ;

  return new Promise(function(resolve, reject) {
    knex = Bookshelf.DB.knex;
    return knex
      .raw(sql, pregId)
      .then(function(data) {
        results = data[0];
        return resolve(results);
      });
  });
};

/* --------------------------------------------------------
 * prenatalFormatted()
 *
 * Return all of the historical records as shown on the
 * prenatal page in the format expected by the front-end.
 * -------------------------------------------------------- */
//var prenatalFormatted = function(req, res) {
  //var pregId;

  //if (req.parameters && req.parameters.id1) {
    //pregId = req.parameters.id1;
  //} else {
    //// Bad request since the proper parameter not specified.
    //res.statusCode = 400;
    //return res.end();
  //}

  //return prenatal(pregId)
    //.then(function(data) {
      //// Adjust the data per caller requirements.

      //data = collateRecs(data, 'replacedAt');
      //mergeRecs(data, 'replacedAt');

      //res.end(JSON.stringify(data));
    //});
//};


/* --------------------------------------------------------
 * pregnancyFormatted()
 *
 * Return all of the historical records for a specfic
 * pregnancy formatted for the front-end.
 * -------------------------------------------------------- */
//var pregnancyFormatted = function(req, res) {
  //var pregId;

  //if (req.parameters && req.parameters.id1) {
    //pregId = req.parameters.id1;
  //} else {
    //// Bad request since the proper parameter not specified.
    //res.statusCode = 400;
    //return res.end();
  //}

  //return pregnancy(pregId)
    //.then(function(data) {
      //// Adjust the data per caller requirements.

      //data = collateRecs(data, 'replacedAt');
      //mergeRecs(data, 'replacedAt');

      //res.end(JSON.stringify(data));
    //});
//};


/* --------------------------------------------------------
 * prenatal()
 *
 * Return all of the historical records as show on the
 * prenatal page for the various tables per the pregnancy id
 * specified.
 * -------------------------------------------------------- */
//var prenatal = function(pregId) {
  //var knex
    //, sqlRisk
    //, riskData
    //;

  //// --------------------------------------------------------
  //// Historical tables for the prenatal page include:
  ////    pregnancyLog, patientLog, riskLog
  //// --------------------------------------------------------
  //sqlRisk = 'SELECT * FROM riskLog WHERE pregnancy_id = ? ORDER BY replacedAt';

  //return new Promise(function(resolve, reject) {
    //knex = Bookshelf.DB.knex;

    //return pregnancy(pregId)
      //.then(function(data) {
        //return knex
          //.raw(sqlRisk, pregId)
          //.then(function(data) {
            //riskData = data[0];
          //})
          //.then(function() {
            //// Merge the data into one object.
            //data.riskLog = riskData;
            //return resolve(data);
          //});
      //});
  //});
//};

/* --------------------------------------------------------
 * pregnancy()
 *
 * Return the pregnancy historical records for the pregnancy.
 * This information will be used across nearly all pages. This
 * includes the patient information as well.
 * -------------------------------------------------------- */
//var pregnancy = function(pregId) {
  //var knex
    //, sqlPreg
    //, sqlPat
    //, pregData
    //, patData
    //, allData = {}
    //;

  //// --------------------------------------------------------
  //// Historical tables: pregnancyLog and patientLog.
  //// --------------------------------------------------------
  //sqlPreg = 'SELECT * FROM pregnancyLog WHERE id = ? ORDER BY replacedAt';
  //sqlPat  = 'SELECT * FROM patientLog WHERE id = ? ORDER BY replacedAt';

  //return new Promise(function(resolve, reject) {
    //knex = Bookshelf.DB.knex;
    //return knex
      //.raw(sqlPreg, pregId)
      //.then(function(data) {
        //pregData = data[0];
      //})
      //.then(function() {
        //return knex.raw(sqlPat, pregData[0].patient_id);
      //})
      //.then(function(data) {
        //patData = data[0];
      //})
      //.then(function() {
        //// Merge the data into one object.
        //allData.pregnancyLog = pregData;
        //allData.patientLog = patData;
        //return resolve(allData);
      //});
  //});
//};

/* --------------------------------------------------------
 * get()
 *
 * Delegates to other functions according to the settings
 * in req.parameters as set by params() upstream.
 * -------------------------------------------------------- */
var get = function(req, res) {
  switch(req.parameters.op2) {
    case 'pregnancy':
      switch(req.parameters.op3) {
        case void 0:
          return getAllData(req, res);
          break;
        default:
          logError('Unsupported API call: ' + req.path);
          res.redirect(cfg.path.search);
      }
    default:
      logError('op2 unknown: ' + req.parameters.op2);
      res.redirect(cfg.path.search);
  }
};

module.exports = {
  get: get
};
