/*
 * -------------------------------------------------------------------------------
 * summaryRpt.js
 *
 * Generates the summary report for a single pregnancy/patient.
 * -------------------------------------------------------------------------------
 */

var _ = require('underscore')
  , moment = require('moment')
  , Promise = require('bluebird')
  , PDFDocument = require('pdfkit')
  , fs = require('fs')
  , os = require('os')
  , path = require('path')
  , Pregnancy = require('../models').Pregnancy
  , Pregnancies = require('../models').Pregnancies
  , Patient = require('../models').Patient
  , Patients = require('../models').Patients
  , Vaccination = require('../models').Vaccination
  , Vaccinations = require('../models').Vaccinations
  , Medication = require('../models').Medication
  , Medications = require('../models').Medications
  , PrenatalExam = require('../models').PrenatalExam
  , PrenatalExams = require('../models').PrenatalExams
  , PregnancyHistory = require('../models').PregnancyHistory
  , PregnancyHistories = require('../models').PregnancyHistories
  , Referral = require('../models').Referral
  , Referrals = require('../models').Referrals
  , LabTestResult = require('../models').LabTestResult
  , LabTestResults = require('../models').LabTestResults
  , User = require('../models').User
  , cfg = require('../config')
  , logInfo = require('../util').logInfo
  , logWarn = require('../util').logWarn
  , logError = require('../util').logError
  , formatDohID = require('../util').formatDohID
  , getGA = require('../util').getGA
  , FONTS = require('./reportGeneral').FONTS
  , centerText = require('./reportGeneral').centerText
  , doSiteTitle = require('./reportGeneral').doSiteTitle
  , doReportName = require('./reportGeneral').doReportName
  , doCellBorders = require('./reportGeneral').doCellBorders
  , loadFontAwesome = require('./reportGeneral').loadFontAwesome
  , blackColor = '#000'
  , greyDarkColor = '#999'
  , greyLightColor = '#AAA'
  , currentPage = 0;    // Tracking the current page that is printing.
  ;

/* --------------------------------------------------------
 * doReportDate()
 *
 * Write the date of the report.
 *
 * param      doc
 * param      opts
 * return     undefined
 * -------------------------------------------------------- */
var doReportDate = function(doc, opts) {
  var pretext = 'Current as of: '
    , theDate = moment().format('MMM DD, YYYY h:mm a')
    , y = 70
    , pretextWidth
    , dateWidth
    , xpos1
    , xpos2
    ;
  doc
    .font(FONTS.Helvetica)
    .fontSize(10);
  pretextWidth = parseInt(doc.widthOfString(pretext), 10);
  dateWidth = parseInt(doc.widthOfString(theDate), 10);
  xpos1 = Math.round((doc.page.width/2) - ((pretextWidth + dateWidth)/2));
  xpos2 = xpos1 + pretextWidth;
  doc
    .text(pretext, xpos1, y)
    .font(FONTS.HelveticaBold)
    .fontSize(10)
    .text(theDate, xpos2, y);
};

/* --------------------------------------------------------
 * doSep()
 *
 * Draw a horizontal separator line at the specified y position.
 * If position is specified it draws the separator on the left
 * or right side of the page.
 *
 * param      doc
 * param      opts
 * param      ypos
 * param      color     - e.g. '#995' or 'red'
 * param      position - null or 'left' or 'right'
 * return     undefined
 * -------------------------------------------------------- */
var doSep = function(doc, opts, ypos, color, position) {
  var left = opts.margins.left
    , right = doc.page.width - opts.margins.right
    ;

  if (position) {
    if (position === 'left') {
      right = (doc.page.width / 2) - 10;
    } else if (position === 'right') {
      left = (doc.page.width / 2) + 10;
    }
  }
  doc
    .lineWidth(1)
    .moveTo(left, ypos)
    .lineTo(right, ypos)
    .stroke(color);
};

/* --------------------------------------------------------
 * doPageCommon()
 *
 * Write out to the report the things that are common to
 * every page of the report.
 *
 * param      doc     - the document
 * param      opts    - options
 * return     undefined
 * -------------------------------------------------------- */
var doPageCommon = function doPageCommon(doc, opts) {
  doSiteTitle(doc, 24);
  doReportName(doc, opts.title, 48);
  doReportDate(doc, opts);
};

/* --------------------------------------------------------
 * doVertFldVal()
 *
 * Write a field label and it's corresponding field value
 * directly underneath it. faint parameter affects how the
 * field is displayed.
 *
 * param      doc
 * param      label
 * param      value
 * param      x - position field should start horizontally
 * param      y - position label should start
 * param      faint - boolean whether label should be faint and smaller
 * return
 * -------------------------------------------------------- */
var doVertFldVal = function(doc, label, value, x, y, faint) {
  var val = value? value: ''
    , y2 = y + 10
    , lblColor = faint? greyDarkColor: blackColor
    , lblSize = faint? 8: 9
    ;
  doc
    .font(FONTS.Helvetica)
    .fontSize(lblSize)
    .fillColor(lblColor)
    .text(label, x, y)
    .fillColor(blackColor)
    .fontSize(9)
    .font(FONTS.HelveticaBold)
    .text(val, x, y2);
  return doc.y;
};

/* --------------------------------------------------------
 * doLabel()
 *
 * Writes out a field label.
 *
 * param      doc
 * param      label
 * param      x
 * param      y
 * return     undefined
 * -------------------------------------------------------- */
var doLabel = function(doc, label, x, y) {
  doc
    .font(FONTS.Helvetica)
    .fontSize(8)
    .fillColor(greyDarkColor)
    .text(label, x, y);
};

/* --------------------------------------------------------
 * doShortAnswer()
 *
 * Label comes first and value (answer) comes after on
 * same line.
 *
 * param      doc
 * param      label
 * param      value
 * param      x
 * param      y
 * param      faint
 * returns    undefined
 * -------------------------------------------------------- */
var doShortAnswer = function(doc, label, value, x, y, faint) {
  var x2
    , lblColor = faint? greyDarkColor: blackColor
    ;
  doc
    .font(FONTS.Helvetica)
    .fontSize(9)
    .fillColor(lblColor)
    .text(label, x, y);

  x2 = parseInt(doc.x + doc.widthOfString(label), 10) + 5;

  doc
    .font(FONTS.HelveticaBold)
    .fontSize(9)
    .fillColor(blackColor)
    .text(value, x2, y);
};


/* --------------------------------------------------------
 * doYesNo()
 *
 * Writes a label and data for a Yes/No short answer.
 *
 * param      doc
 * param      label
 * param      value
 * param      x
 * param      y
 * return     y - new y position
 * -------------------------------------------------------- */
var doYesNo = function(doc, label, value, x, y) {
  var val = ''
    ;
  if (value.toLowerCase() === 'y') val = 'Y';
  if (value.toLowerCase() === 'n') val = 'N';
  doc
    .font(FONTS.HelveticaBold)
    .fontSize(9)
    .fillColor(blackColor)
    .text(val, x, y);
  doc
    .font(FONTS.Helvetica)
    .fontSize(9)
    .fillColor(blackColor)
    .text(label, x + 10, y);
  return doc.y;
};

/* --------------------------------------------------------
 * doCheckbox()
 *
 * Write a checkbox, either checked or not, and the label
 * that goes with it.
 *
 * Note: uses Font-Awesome fonts to display an empty or checked
 * checkbox. See characters available here.
 *
 * http://fortawesome.github.io/Font-Awesome/cheatsheet/
 *
 * param      doc
 * param      label
 * param      value - boolean for checked or not
 * param      x
 * param      y
 * return     y position at the end of writing
 * -------------------------------------------------------- */
var doCheckbox = function(doc, label, value, x, y) {
  var check = value? '\uf046': '\uf096'
    ;

  doc
    .font(FONTS.FontAwesome)
    .fontSize(9)
    .fillColor(blackColor)
    .text(check, x, y-1);   // y value compensate for look of FontAwesome char
  doc
    .font(FONTS.Helvetica)
    .fontSize(9)
    .fillColor(blackColor)
    .text(label, x + 10, y);
  return doc.y;
};

/* --------------------------------------------------------
 * doClientGeneral()
 *
 * Create the general information section for the client.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     simulated object from doTable() with increased y
 * -------------------------------------------------------- */
var doClientGeneral = function(doc, data, opts, ypos) {
  var x = opts.margins.left
    , y = ypos
    , dohID = formatDohID(data.patient.dohID)
    , clientIncome = ''
    , partnerIncome = ''
    , age
    , dob
    ;
  if (data.pregnancy.clientIncome && data.pregnancy.clientIncomePeriod) {
    clientIncome = data.pregnancy.clientIncome + ' / ' +
      data.pregnancy.clientIncomePeriod;
  }
  if (data.pregnancy.partnerIncome && data.pregnancy.partnerIncomePeriod) {
    partnerIncome = data.pregnancy.partnerIncome + ' / ' +
      data.pregnancy.partnerIncomePeriod;
  }

  if (data.patient.dob && moment(data.patient.dob).isValid()) {
    age = moment().diff(moment(data.patient.dob), 'years');
    dob = moment(data.patient.dob).format('MM/DD/YYYY');
  }

  doSep(doc, opts, y, greyLightColor);

  // First line across
  y += 10;
  doVertFldVal(doc, 'Lastname', data.pregnancy.lastname, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Firstname', data.pregnancy.firstname, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Maidenname', data.pregnancy.maidenname, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Nickname', data.pregnancy.nickname, x, y, true);
  x += 100;
  if (age) {
    doVertFldVal(doc, 'DOB (Age)', dob + ' (' + age + ')', x, y, true);
  } else {
    doVertFldVal(doc, 'DOB (Age)', '', x, y, true);
  }
  x += 100;
  doVertFldVal(doc, 'MMC', dohID, x, y, true);
  // Second line
  x = opts.margins.left;
  y += 30;
  doVertFldVal(doc, 'Address', data.pregnancy.address1, x, y, true);
  x += 200;
  doVertFldVal(doc, 'Barangay', data.pregnancy.address3, x, y, true);
  x += 100;
  doVertFldVal(doc, 'City', data.pregnancy.city, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Postal', data.pregnancy.postalCode, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Telephone', data.pregnancy.telephone, x, y, true);
  // Third line
  x = opts.margins.left;
  y += 30;
  doVertFldVal(doc, 'Marital Status', data.pregnancy.maritalStatus, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Religion', data.pregnancy.religion, x, y, true);
  x += 200;
  doVertFldVal(doc, 'Education', data.pregnancy.education, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Client Work', data.pregnancy.work, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Client Income', clientIncome, x, y, true);
  // Fourth line
  x = opts.margins.left;
  y += 30;
  doVertFldVal(doc, 'Partner Firstname', data.pregnancy.partnerFirstname, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Partner Lastname', data.pregnancy.partnerLastname, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Partner Age', data.pregnancy.partnerAge, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Partner Education', data.pregnancy.partnerEducation, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Partner Work', data.pregnancy.partnerWork, x, y, true);
  x += 100;
  doVertFldVal(doc, 'Partner Income', partnerIncome, x, y, true);

  y += 30;
  return {y: y, overflow: false};
};

/* --------------------------------------------------------
 * doPrenatalRisk()
 *
 * Write out the prenatal risk factors in the four key areas
 * of Present, ObHx, MedHx, and Lifestyle.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     object from doTable() with increased y
 * -------------------------------------------------------- */
var doPrenatalRisk = function(doc, data, opts, ypos) {
  var x = opts.margins.left
    , y = ypos
    , colNames = []
    , colData = []
    , tblResult
    ;

  colNames.push('Risk type');
  colNames.push('Code');
  colNames.push('Description                                 ');

  _.each(data.risks, function(risk) {
    var rptData = []
      , riskCode
      ;

    // get the riskCode for this risk
    riskCode = _.find(data.riskCodes, function(rc) {
      return risk.riskCode === rc.id;
    });

    if (riskCode) {
      rptData.push(riskCode.riskType);
      rptData.push(riskCode.name);
      rptData.push(riskCode.description);
      colData.push(rptData);
    }
  });

  // Sort by the riskCode.
  // E.g. [ 'Present', 'A2', 'Age < 18' ]
  colData = _.sortBy(colData, function(row) {
    return row[1];
  });

  doLabel(doc, 'Prenatal Risks', x, y);
  y += 10;
  tblResult = doTable(doc, colNames, colData, opts, y, 'left', true);
  tblResult.y += 10;

  return tblResult;
};


/* --------------------------------------------------------
 * doTransferOfCare()
 *
 * Write out the relevant tranfer of care information if
 * it is available. If the pregnancy.transferOfCare is
 * not filled, this section of the report is not written out.
 *
 * NOTE: doTransferOfCare() and doPregnancyResult() might
 * be refactored into a common function.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     simulated object from doTable() with increased y
 * -------------------------------------------------------- */
var doTransferOfCare = function(doc, data, opts, ypos) {
  var x = (doc.page.width / 2) + 10
    , y = ypos
    , tDate
    , tDateFmt
    , tNote
    ;

  if (data.pregnancy.transferOfCare) {
    tDate = moment(data.pregnancy.transferOfCare);
    if (tDate.isValid()) {
      tDateFmt = tDate.format('MM-DD-YYYY HH:mm');
      tNote = data.pregnancy.transferOfCareNote;
    } else {
    }
  }

  if (tDateFmt) {
    y += 10;
    doShortAnswer(doc, 'Transfer of Care:', tDateFmt, x, y, true);
    if (tNote) {
      y = doVertFldVal(doc, '', tNote, x, y, true);
    }
    return {y: y + 10, overflow: false};
  } else {
    return {y: y, overflow: false};
  }
};


/* --------------------------------------------------------
 * doPregnancyResult()
 *
 * Write out the result of the pregnancy, if recorded.
 *
 * NOTE: doTransferOfCare() and doPregnancyResult() might
 * be refactored into a common function.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     simulated object from doTable() with increase y
 * -------------------------------------------------------- */
var doPregnancyResult = function(doc, data, opts, ypos) {
  var x = (doc.page.width / 2) + 10
    , y = ypos
    , rDate
    , rDateFmt
    , rNote
    ;

  if (data.pregnancy.pregnancyEndDate) {
    rDate = moment(data.pregnancy.pregnancyEndDate);
    if (rDate.isValid()) {
      rDateFmt = rDate.format('MM-DD-YYYY');
      rNote = data.pregnancy.pregnancyEndResult;
    } else {
    }
  }

  if (rDateFmt) {
    y += 10;
    doShortAnswer(doc, 'Pregnancy Result:', rDateFmt, x, y, true);
    if (rNote) {
      y = doVertFldVal(doc, '', rNote, x, y, true);
    }
    return {y: y + 10, overflow: false};
  } else {
    return {y: y, overflow: false};
  }
};

/* --------------------------------------------------------
 * doPrenatal()
 *
 * Creates the prenatal section.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     simulated object from doTable() with increased y
 * -------------------------------------------------------- */
var doPrenatal = function(doc, data, opts, ypos) {
  var x = opts.margins.left
    , y = ypos
    , riskNote = ''
    , lmp = data.pregnancy.lmp
    , edd = data.pregnancy.edd
    , altEdd = data.pregnancy.alternateEdd
    , useAltEdd = data.pregnancy.useAlternateEdd
    , ga = ''
    ;

  if (data.pregnancy.riskNote) {
    riskNote = data.pregnancy.riskNote.replace(/(?:\r\n|\r|\n)/g, ' ');
  }

  if (edd || altEdd) {
    // Favor the alternateEdd if the useAlternateEdd is specified.
    if (useAltEdd && altEdd && moment(altEdd).isAfter('1990-01-01', 'year')) {
      ga = getGA(moment(altEdd));
      edd = edd? moment(edd).format('MM-DD-YYYY'): '';
      altEdd = altEdd? moment(altEdd).format('MM-DD-YYYY'): '';
    } else {
      ga = getGA(moment(edd));
      edd = edd? moment(edd).format('MM-DD-YYYY'): '';
      altEdd = altEdd? moment(altEdd).format('MM-DD-YYYY'): '';
    }
  }

  doSep(doc, opts, ypos, greyLightColor);
  y += 5;
  doVertFldVal(doc, 'GA', ga, x, y, true);
  x += 40;
  if (lmp && _.isDate(lmp)) {
    doVertFldVal(doc, 'Lmp', moment(lmp).format('MM-DD-YYYY'), x, y, true);
  } else {
    // We don't have a valid date, so we print an empty field (the label prints).
    doVertFldVal(doc, 'Lmp', '', x, y, true);
  }
  x += 60;
  doVertFldVal(doc, 'Edd', edd, x, y, true);
  x += 60;
  doVertFldVal(doc, 'Alt Edd', altEdd, x, y, true);
  x += 60;
  doVertFldVal(doc, 'Use Alt Edd', useAltEdd? 'Yes': '', x, y, true);
  x += 60;
  doVertFldVal(doc, 'P/H MCP', data.pregnancy.philHealthMCP? 'Yes': '', x, y, true);
  x += 40;
  doVertFldVal(doc, 'P/H NCP', data.pregnancy.philHealthNCP? 'Yes': '', x, y, true);
  x += 40;
  doVertFldVal(doc, 'P/H Number', data.pregnancy.philHealthID, x, y, true);
  x += 70;
  doVertFldVal(doc, 'P/H Approved', data.pregnancy.philHealthApproved? 'Yes': '', x, y, true);


  y += 30;
  x = opts.margins.left;
  doVertFldVal(doc, 'Risk Notes', riskNote, x, y, true);

  y = doc.y + 10;
  return {y: y, overflow: false};
};

/* --------------------------------------------------------
 * doMidwifeInterview()
 *
 * Writes the information gleaned from the initial midwife interview.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     simulated object from doTable() with increased y
 * -------------------------------------------------------- */
var doMidwifeInterview = function(doc, data, opts, ypos) {
  var x = opts.margins.left
    , y = ypos
    , midwifeNotes = ''
    , noneOfAbove = false
    , gravida = data.pregnancy.gravida? data.pregnancy.gravida: ''
    , para = data.pregnancy.para? data.pregnancy.para: ''
    , abortions = data.pregnancy.abortions? data.pregnancy.abortions: ''
    , living = data.pregnancy.living? data.pregnancy.living: ''
    , stillBirths = data.pregnancy.stillBirths? data.pregnancy.stillBirths: ''
    , term = data.pregnancy.term? data.pregnancy.term: ''
    , preterm = data.pregnancy.preterm? data.pregnancy.preterm: ''
    , x2
    , x3
    ;

  if (data.pregnancy.note) {
    midwifeNotes = data.pregnancy.note.replace(/(?:\r\n|\r|\n)/g, ' ');
  }

  if (data.pregnancy.invertedNipples == 0 &&
      data.pregnancy.hasUS == 0 &&
      data.pregnancy.wantsUS == 0) {
    noneOfAbove = true;
  }

  doSep(doc, opts, ypos, greyLightColor);
  y += 10;
  doLabel(doc, 'Midwife Interview', x, y);

  y += 15;
  y = doCheckbox(doc, 'Inverted nipples?', data.pregnancy.invertedNipples, x, y);
  y = doCheckbox(doc, 'Client has U/S?', data.pregnancy.hasUS, x, y);
  y = doCheckbox(doc, 'Client wants U/S?', data.pregnancy.wantsUS, x, y);
  y = doCheckbox(doc, 'None of the above', noneOfAbove, x, y);

  x += 120;
  x3 = x;     // Save for notes below.
  y = ypos + 10;
  y = doVertFldVal(doc, 'Age of menarche?', data.patient.ageOfMenarche, x, y);

  x += 100;
  y = ypos + 10;
  doShortAnswer(doc, 'Gravida:', gravida, x, y, true);
  x = doc.x + 20;
  x2 = x;   // Save for term and preterm below.
  doShortAnswer(doc, 'Para:', para, x, y, true);
  x = doc.x + 80;
  doShortAnswer(doc, 'Abortions:', abortions, x, y, true);
  x = doc.x + 20;
  doShortAnswer(doc, 'Living:', living, x, y, true);
  x = doc.x + 20;
  doShortAnswer(doc, 'Still births:', stillBirths, x, y, true);

  y += 15;
  doShortAnswer(doc, 'Term:', term, x2, y, true);
  x2 = doc.x + 20;
  doShortAnswer(doc, 'Preterm:', preterm, x2, y, true);

  y += 15;
  y = doVertFldVal(doc, 'Midwife comments', midwifeNotes, x3, y, true);
  if (midwifeNotes.length < 200) {
    y += 30;   // Move it down enough if few notes.
  } else {
    y = doc.y + 15;
  }

  return {y: y, overflow: false};
};

/* --------------------------------------------------------
 * doQuestionnaire()
 *
 * Creates the questionnaire section of the report.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     simulated object from doTable() with increased y
 * -------------------------------------------------------- */
var doQuestionnaire = function(doc, data, opts, ypos) {
  var x = opts.margins.left
    , y = ypos
    , maxY = y
    , questionnaireNote = ''
    ;

  if (data.pregnancy.questionnaireNote) {
    questionnaireNote = data.pregnancy.questionnaireNote.replace(/(?:\r\n|\r|\n)/g, ' ');
  }
  doSep(doc, opts, ypos, greyLightColor);
  y += 10;

  // --------------------------------------------------------
  // Present complaints.
  // --------------------------------------------------------
  doLabel(doc, 'Present complaints', x, y);
  y += 15;
  if (data.pregnancy.currentlyVomiting) {
    y = doCheckbox(doc, 'Been vomiting?', data.pregnancy.currentlyVomiting, x, y);
  }
  if (data.pregnancy.currentlyDizzy) {
    y = doCheckbox(doc, 'Feeling dizzy?', data.pregnancy.currentlyDizzy, x, y);
  }
  if (data.pregnancy.currentlyFainting) {
    y = doCheckbox(doc, 'Have fainted?', data.pregnancy.currentlyFainting, x, y);
  }
  if (data.pregnancy.currentlyBleeding) {
    y = doCheckbox(doc, 'Bleeding?', data.pregnancy.currentlyBleeding, x, y);
  }
  if (data.pregnancy.currentlyUrinationPain) {
    y = doCheckbox(doc, 'Pain in urinating?', data.pregnancy.currentlyUrinationPain, x, y);
  }
  if (data.pregnancy.currentlyBlurryVision) {
    y = doCheckbox(doc, 'Blurry vision?', data.pregnancy.currentlyBlurryVision, x, y);
  }
  if (data.pregnancy.currentlySwelling) {
    y = doCheckbox(doc, 'Swelling?', data.pregnancy.currentlySwelling, x, y);
  }
  if (data.pregnancy.currentlyVaginalPain) {
    y = doCheckbox(doc, 'Vaginal pain?', data.pregnancy.currentlyVaginalPain, x, y);
  }
  if (data.pregnancy.currentlyVaginalItching) {
    y = doCheckbox(doc, 'Vaginal itching?', data.pregnancy.currentlyVaginalItching, x, y);
  }
  if (data.pregnancy.currentlyNone) {
    y = doCheckbox(doc, 'None of the above', data.pregnancy.currentlyNone, x, y);
  }

  // --------------------------------------------------------
  // Present comments.
  // --------------------------------------------------------
  x += 135;
  y = ypos + 10;
  doLabel(doc, 'Present comments', x, y);
  y += 15;
  y = doYesNo(doc, 'Using iodized salt?', data.pregnancy.useIodizedSalt, x, y);
  y = doYesNo(doc, 'Taking medication?', data.pregnancy.takingMedication, x, y);
  y = doYesNo(doc, 'Plan to breastfeed?', data.pregnancy.planToBreastFeed, x, y);
  y += 5;
  y = doVertFldVal(doc, 'Where do you plan to give birth?', data.pregnancy.whereDeliver, x, y);
  y += 5;
  y = doVertFldVal(doc, 'Companion during childbirth?', data.pregnancy.birthCompanion, x, y);
  y += 5;
  y = doCheckbox(doc, 'Practiced family planning?', data.pregnancy.practiceFamilyPlanning, x, y);
  y -= 10;    // Family planning details - just put under checkbox question with no label.
  y = doVertFldVal(doc, '', data.pregnancy.practiceFamilyPlanningDetails, x, y);
  maxY = y;

  // --------------------------------------------------------
  // Family History.
  // --------------------------------------------------------
  x += 165;
  y = ypos + 10;
  doLabel(doc, 'Family History', x, y);
  y += 15;
  if (data.pregnancy.familyHistoryTwins) {
    y = doCheckbox(doc, 'Twins?', data.pregnancy.familyHistoryTwins, x, y);
  }
  if (data.pregnancy.familyHistoryHighBloodPressure) {
    y = doCheckbox(doc, 'High Blood Pressure?', data.pregnancy.familyHistoryHighBloodPressure, x, y);
  }
  if (data.pregnancy.familyHistoryDiabetes) {
    y = doCheckbox(doc, 'Diabetes?', data.pregnancy.familyHistoryDiabetes, x, y);
  }
  if (data.pregnancy.familyHistoryHeartProblems) {
    y = doCheckbox(doc, 'Heart Problems?', data.pregnancy.familyHistoryHeartProblems, x, y);
  }
  if (data.pregnancy.familyHistoryTB) {
    y = doCheckbox(doc, 'TB?', data.pregnancy.familyHistoryTB, x, y);
  }
  if (data.pregnancy.familyHistorySmoking) {
    y = doCheckbox(doc, 'Smoking?', data.pregnancy.familyHistorySmoking, x, y);
  }
  if (data.pregnancy.familyHistoryNone) {
    y = doCheckbox(doc, 'None of the above', data.pregnancy.familyHistoryNone, x, y);
  }

  // --------------------------------------------------------
  // Personal History.
  // --------------------------------------------------------
  x += 150;
  y = ypos + 10;
  doLabel(doc, 'Personal History', x, y);
  y += 15;
  if (data.pregnancy.historyFoodAllergy) {
    y = doCheckbox(doc, 'Food allergy?', data.pregnancy.historyFoodAllergy, x, y);
  }
  if (data.pregnancy.historyMedicineAllergy) {
    y = doCheckbox(doc, 'Medicine allergy?', data.pregnancy.historyMedicineAllergy, x, y);
  }
  if (data.pregnancy.historyAsthma) {
    y = doCheckbox(doc, 'Asthma?', data.pregnancy.historyAsthma, x, y);
  }
  if (data.pregnancy.historyHeartProblems) {
    y = doCheckbox(doc, 'Heart problems?', data.pregnancy.historyHeartProblems, x, y);
  }
  if (data.pregnancy.historyKidneyProblems) {
    y = doCheckbox(doc, 'Kidney problems?', data.pregnancy.historyKidneyProblems, x, y);
  }
  if (data.pregnancy.historyHepatitis) {
    y = doCheckbox(doc, 'Hepatitis?', data.pregnancy.historyHepatitis, x, y);
  }
  if (data.pregnancy.historyGoiter) {
    y = doCheckbox(doc, 'Goiter?', data.pregnancy.historyGoiter, x, y);
  }
  if (data.pregnancy.historyHighBloodPressure) {
    y = doCheckbox(doc, 'High blood pressure?', data.pregnancy.historyHighBloodPressure, x, y);
  }
  if (data.pregnancy.historyHospitalOperation) {
    y = doCheckbox(doc, 'Hospital operation?', data.pregnancy.historyHospitalOperation, x, y);
  }
  if (data.pregnancy.historyBloodTransfusion) {
    y = doCheckbox(doc, 'Blood transfusion?', data.pregnancy.historyBloodTransfusion, x, y);
  }
  if (data.pregnancy.historySmoking) {
    y = doCheckbox(doc, 'Smoking?', data.pregnancy.historySmoking, x, y);
  }
  if (data.pregnancy.historyDrinking) {
    y = doCheckbox(doc, 'Drinking?', data.pregnancy.historyDrinking, x, y);
  }
  if (data.pregnancy.historyNone) {
    y = doCheckbox(doc, 'None of the above?', data.pregnancy.historyNone, x, y);
  }

  // --------------------------------------------------------
  // Notes.
  // --------------------------------------------------------
  if (y < maxY) y = maxY;
  x = opts.margins.left;
  if (questionnaireNote.length > 0) {
    y = doVertFldVal(doc, 'Notes', questionnaireNote, x, y, true);
  }

  doc.moveDown(1);
  y += 10;
  return {y: y, overflow: false};
};

/* --------------------------------------------------------
 * doPregnancyHistory()
 *
 * Creates the historical pregnancy section from the midwife
 * interview.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     object from doTable()
 * -------------------------------------------------------- */
var doPregnancyHistory = function(doc, data, opts, ypos) {
  var x = opts.margins.left
    , y = ypos
    , colNames = []
    , colData = []
    , bottomNote = []
    , tblResult
    ;

  colNames.push('Date       ');
  colNames.push('GA      ');
  colNames.push('Sex');
  colNames.push('Location');
  colNames.push('Attendent');
  colNames.push('Delivery');
  colNames.push('Hours');
  colNames.push('Kg ');
  colNames.push('Epis');
  colNames.push('Repair');
  colNames.push('BreastFed');

  _.each(data.pregnancyHistories, function(row) {
    var data = [];
    if (row.month && row.day && row.year) {
      data.push(row.month + '-' + row.day + '-' + row.year);
    } else if (row.month && row.year) {
      data.push(row.month + '-' + row.year);
    } else if (row.year) {
      data.push(row.year);
    }
    if (row.FT) {
      data.push('FT');
    } else {
      data.push(row.finalGA + ' ' + row.finalGAPeriod);
    }
    data.push(row.sexOfBaby);
    data.push(row.placeOfBirth);
    data.push(row.attendant);
    data.push(row.typeOfDelivery);
    data.push(row.lengthOfLabor);
    data.push(row.birthWeight);
    data.push(row.episTear);
    data.push(row.repaired);
    if (row.howLongBFed) {
      data.push(row.howLongBFed + ' ' + row.howLongBFedPeriod);
    } else {
      data.push('');
    }
    bottomNote.push(row.note? row.note: '');
    colData.push(data);
  });

  doLabel(doc, 'Pregnancy History', x, y);
  y += 10;
  tblResult = doTable(doc, colNames, colData, opts, y, void 0, false, bottomNote);

  return tblResult;
};

/* --------------------------------------------------------
 * doLabResults()
 *
 * Write all of the lab results.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     object from doTable with increased y
 * -------------------------------------------------------- */
var doLabResults = function(doc, data, opts, ypos) {
  var x = opts.margins.left
    , y = ypos
    , colNames = []
    , colData = []
    , tblResult
    ;

  y += 5;
  colNames.push('Type      ');
  colNames.push('Exam                         ');
  colNames.push('Date      ');
  colNames.push('Result                                           ');
  colNames.push('Warn');

  _.each(data.labTestResults, function(row) {
    var data = []
      , result
      , warn = row.warn? 'Yes': ''
      ;
    data.push(row.type);
    data.push(row.name);
    data.push(moment(row.testDate).format('MM-DD-YYYY'));
    result = row.result;
    if (row.result2 && row.result2.length > 0) result += ' - ' + row.result2;
    if (row.unit !== null && row.unit.length > 0) result += ' ' + row.unit;
    data.push(result);
    data.push(warn);
    colData.push(data);
  });

  doLabel(doc, 'Lab Test Results', x, y);
  y += 10;
  tblResult = doTable(doc, colNames, colData, opts, y, undefined, true);
  tblResult.y += 10;

  return tblResult;
};


/* --------------------------------------------------------
 * doVaccinations()
 *
 * Write the list of vaccinations given to the patient.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     object from doTable() with increased y
 * -------------------------------------------------------- */
var doVaccinations = function(doc, data, opts, ypos) {
  var x = (doc.page.width / 2) + 10
    , y = ypos
    , colNames = []
    , colData = []
    , reqTetanus = ''
    , tblResults
    ;

  if (data.pregnancy.numberRequiredTetanus) {
    reqTetanus = '' + data.pregnancy.numberRequiredTetanus;
  }

  colNames.push('Name                      ');
  colNames.push('Date     ');
  colNames.push('Internal');

  _.each(data.vaccinations, function(row) {
    var data = []
      ;
    data.push(row.name);
    if (row.vacDate && moment(row.vacDate).isValid()) {
      data.push(moment(row.vacDate).format('MM-DD-YYYY'));
    } else if (row.vacMonth && row.vacYear) {
      data.push(row.vacMonth + ' - ' + row.vacYear);
    } else if (row.vacYear) {
      data.push(row.vacYear);
    }
    if (row.administeredInternally) {
      data.push('Internal');
    } else {
      data.push('External');
    }
    colData.push(data);
  });

  doLabel(doc, 'Vaccinations', x, y);
  x = doc.page.width - opts.margins.right - 90;
  doShortAnswer(doc, 'Required tetanus:', reqTetanus, x, y, true);

  y += 10;
  tblResults = doTable(doc, colNames, colData, opts, y, 'right');
  tblResults.y += 10;

  return tblResults;
};

/* --------------------------------------------------------
 * doMedications()
 *
 * Write the list of medications given to the patient.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     object from doTable() with increased y
 * -------------------------------------------------------- */
var doMedications = function(doc, data, opts, ypos) {
  var x = opts.margins.left
    , y = ypos
    , colNames = []
    , colData = []
    , tblResults
    ;

  colNames.push('Name                      ');
  colNames.push('Date     ');
  colNames.push('Nbr');

  _.each(data.medications, function(row) {
    var data = []
      ;
    data.push(row.name);
    data.push(moment(row.date).format('MM-DD-YYYY'));
    data.push(row.numberDispensed);
    colData.push(data);
  });

  doLabel(doc, 'Medications', x, y);
  y += 10;
  tblResults = doTable(doc, colNames, colData, opts, y, 'left');
  tblResults.y += 10;

  return tblResults;
};


/* --------------------------------------------------------
 * doPrenatalNotes()
 *
 * Write out the notes for each prenatal exam in a table.
 * There are four note fields, two long and two short.
 *
 * fhtNote  - short
 * fhNote   - short
 * risk     - long
 * note     - long
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     y - new y position
 * -------------------------------------------------------- */
var doPrenatalNotes = function(doc, data, opts, ypos) {
  var x = opts.margins.left
    , y = ypos
    , colNames = []
    , colData = []
    ;

  colNames.push('Date ');
  colNames.push('Risk                          ');
  colNames.push('Other Notes                   ');
  colNames.push('FH Note');
  colNames.push('FHT Note');

  _.each(data.prenatalExams, function(row) {
    var data = []
      ;
    if (row.risk || row.note || row.fhNote || row.fhtNote) {
      data.push(moment(row.date).format('MM-DD-YYYY'));
      data.push(row.risk);
      data.push(row.note);
      data.push(row.fhNote);
      data.push(row.fhtNote);
      colData.push(data);
    }
  });

  doLabel(doc, 'Prenatal Examination Notes', x, y);
  y += 10;
  y = doTable(doc, colNames, colData, opts, y, null, true).y;

  return y + 10;
};

/* --------------------------------------------------------
 * doPrenatalExams()
 *
 * Write out a table of prenatal exams.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     object from doTable() with increased y
 * -------------------------------------------------------- */
var doPrenatalExams = function(doc, data, opts, ypos) {
  var x = opts.margins.left
    , y = ypos
    , colNames = []
    , colData = []
    , estDueDate
    , tblResult
    ;

  // --------------------------------------------------------
  // The estimated due date is required to calculate the GA
  // at each prenatal exam below.
  // --------------------------------------------------------
  if (data.pregnancy.edd || data.pregnancy.alternateEdd) {
    // Favor the alternateEdd if the useAlternateEdd is specified.
    if (data.pregnancy.useAlternateEdd &&
        data.pregnancy.alternateEdd &&
        moment(data.pregnancy.alternateEdd).isAfter('1990-01-01', 'year')) {
      estDueDate = moment(data.pregnancy.alternateEdd);
    } else {
      estDueDate = moment(data.pregnancy.edd);
    }
  }
  colNames.push('Date     ');
  colNames.push('Wgt');
  colNames.push('BP     ');
  colNames.push('CR ');
  colNames.push('Temp');
  colNames.push('RR ');
  colNames.push('GA   ');
  colNames.push('FH');
  colNames.push('FHT');
  colNames.push('POS   ');
  colNames.push('Mvmt');
  colNames.push('Edema');
  colNames.push('Vit');
  colNames.push('Pray');
  colNames.push('Return   ');

  _.each(data.prenatalExams, function(row) {
    var data = []
      , systolic = row.systolic && ! _.isNull(row.systolic)? row.systolic: ''
      , diastolic = row.diastolic && ! _.isNull(row.diastolic)? row.diastolic: ''
      ;
    // Specify a manual line break in the table between the date and name.
    data.push(moment(row.date).format('MM-DD-YYYY') +
        '\n' + row.lastname + ', ' + row.firstname);
    data.push(row.weight);
    data.push(systolic + ' / ' + diastolic);
    data.push(row.cr);
    data.push(row.temperature);
    data.push(row.respiratoryRate);
    if (estDueDate) {
      data.push(getGA(estDueDate, moment(row.date)));
    } else {
      data.push('');
    }
    data.push(row.fh);
    data.push(row.fht);
    data.push(row.pos);
    data.push(row.mvmt? 'Yes': 'No');
    data.push(row.edema);
    data.push(row.vitamin? 'Yes': 'No');
    data.push(row.pray? 'Yes': 'No');
    if (moment(row.returnDate).isValid()) {
      data.push(moment(row.returnDate).format('MM-DD-YYYY'));
    } else {
      data.push('');
    }
    colData.push(data);
  });

  doLabel(doc, 'Prenatal Examinations', x, y);
  y += 10;
  tblResult = doTable(doc, colNames, colData, opts, y, null, true, void 0,
    function(doc, x, y, row, rowIdx) {
      // --------------------------------------------------------
      // The post row callback for the prenatal table which allows
      // the inclusion of the various note fields associated with
      // the prenatal exams, including the progress notes which are
      // not specific to any particular prenatal exam, but per
      // client request should be included in with the prenatal
      // results. Implemented as a closure in order to access the
      // data object as well as other variables in the outer function.
      // --------------------------------------------------------
      var origX = x;

      // --------------------------------------------------------
      // Get the prenatal exam for this row as well as
      // the next one for determining which progress notes
      // to print under this exam.
      // --------------------------------------------------------
      var pExam = data.prenatalExams[rowIdx];
      var pNextExam = data.prenatalExams[rowIdx+1]? data.prenatalExams[rowIdx+1]: void 0;

      // --------------------------------------------------------
      // Convenience assignments.
      // --------------------------------------------------------
      var fhNote = pExam.fhNote? pExam.fhNote: '';
      var fhtNote = pExam.fhtNote? pExam.fhtNote: '';
      var riskNote = pExam.risk? pExam.risk: '';
      var otherNote = pExam.note? pExam.note: '';
      var riskOtherWidth = 240;
      var riskLines = Math.ceil(doc.widthOfString(riskNote) / riskOtherWidth)+1;
      var otherLines = Math.ceil(doc.widthOfString(otherNote) / riskOtherWidth)+1;

      // --------------------------------------------------------
      // Select the progress notes that should be printed along
      // with this prenatal exam. These progress notes are stored
      // in the pnotes array.
      // --------------------------------------------------------
      var pnotes = [];
      var peDate;
      var peNextDate;
      peDate = moment(pExam.date);
      // If there is no next prenatal exam, choose a date so far in future
      // that all remaining progress notes are included.
      peNextDate = pNextExam? moment(pNextExam.date): moment('2200-01-01', 'YYYY-MM-DD');
      pnotes = _.clone(_.filter(data.pnotes, function(note) {
        var nDate = moment(note.noteDate);
        if (nDate.isSame(peDate)) {
          return true;
        } else {
          if (nDate.isAfter(peDate) && nDate.isBefore(peNextDate)) {
            return true;
          } else if (nDate.isBefore(peDate) && rowIdx === 0) {
            // If this is the first prenatal exam, include progress notes
            // for earlier dates.
            return true;
          }
        }
      }));

      // --------------------------------------------------------
      // Position fhNote and fhtNote beside the midwife name
      // with bolded field labels.
      // --------------------------------------------------------
      y -= 10;
      x = 104;
      doc.font(FONTS.HelveticaBold).fontSize(9);
      doc.text('FH Note: ', x, y);
      x = 305;
      doc.text('FHT Note: ', x, y);
      doc.font(FONTS.Helvetica).fontSize(9);
      x = 148;
      doc.text(fhNote, x, y);
      x = 355;
      doc.text(fhtNote, x, y);

      // --------------------------------------------------------
      // Position the risk and other notes on the next line.
      // --------------------------------------------------------
      y += 10;
      if (otherLines > 0) {
        x = origX;
        doc.font(FONTS.HelveticaBold).fontSize(9);
        doc.text('Risk: ', x, y);
        x = 305;
        doc.text('Other: ', x, y);
        doc.font(FONTS.Helvetica).fontSize(9);
        x = 48;
        doc.text(riskNote, x, y, {width: riskOtherWidth});
        x = 340;
        doc.text(otherNote, x, y, {width: riskOtherWidth});

        // Add the additional lines used.
        y += (Math.max(riskLines, otherLines) * 10);
      }

      // --------------------------------------------------------
      // Progresss notes dated between current prenatal exam
      // and the next one, if any. pnotes contains the progress
      // notes to print for this prenatal exam.
      // --------------------------------------------------------
      _.each(pnotes, function(note) {
        var noteDate = moment(note.noteDate).format('MM-DD-YYYY') + ': ';
        var noteStartX = 70;
        var noteWidth = opts.pageWidth - opts.margins.left - opts.margins.right - noteStartX;
        var noteLines = Math.ceil(doc.widthOfString(note.note) / noteWidth);
        x = origX;
        doc.font(FONTS.HelveticaBold).fontSize(9);
        doc.text(noteDate, x, y);
        doc.font(FONTS.Helvetica).fontSize(9);
        x = noteStartX;
        doc.text(note.note, x, y);
        y += (noteLines * 10);
      });

      // Put the settings back.
      doc.font(FONTS.Helvetica).fontSize(9);

      // Requirement: return the new y position to the caller.
      return y;
    });
  tblResult.y += 10;

  return tblResult;
};


/* --------------------------------------------------------
 * doReferrals()
 *
 * Write the referral information.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     object from doTable() with increased y
 * -------------------------------------------------------- */
var doReferrals = function(doc, data, opts, ypos) {
  var x = opts.margins.left
    , y = ypos
    , colNames = []
    , colData = []
    , tblResults
    ;

  colNames.push('Date  ');
  colNames.push('Referred to');
  colNames.push('Reason     ');

  _.each(data.referrals, function(row) {
    var data = []
      ;
    data.push(moment(row.date).format('MM-DD-YYYY'));
    data.push(row.referral);
    data.push(row.reason);
    colData.push(data);
  });

  doLabel(doc, 'Referrals', x, y);
  y += 10;
  tblResults = doTable(doc, colNames, colData, opts, y, 'left');
  tblResults.y += 10;

  return tblResults;
};


/* --------------------------------------------------------
 * doDoctorDentist()
 *
 * Writes the doctor and dentist visit dates.
 *
 * param      doc
 * param      data
 * param      opts
 * param      ypos
 * return     simulated object from doTable() with increased y
 * -------------------------------------------------------- */
var doDoctorDentist = function(doc, data, opts, ypos) {
  var x = (doc.page.width / 2) + 10
    , y = ypos
    , docDate = ''
    , denDate = ''
    ;

  if (data.pregnancy.doctorConsultDate &&
      moment(data.pregnancy.doctorConsultDate).isAfter('1990-01-01', 'year')) {
    docDate = moment(data.pregnancy.doctorConsultDate).format('MM-DD-YYYY');
  }
  if (data.pregnancy.dentistConsultDate &&
      moment(data.pregnancy.dentistConsultDate).isAfter('1990-01-01', 'year')) {
    denDate = moment(data.pregnancy.dentistConsultDate).format('MM-DD-YYYY');
  }

  doVertFldVal(doc, 'Doctor consult', docDate, x, y, true);
  x += 100;
  y = doVertFldVal(doc, 'Dentist consult', denDate, x, y, true);
  y += 20;

  // Simulate the object returned from doTable().
  return {y: y, overflow: false};
};


/* --------------------------------------------------------
 * doTable()
 *
 * Write out a table across the full width of the page using
 * the columns passed unless position parameter is passed.
 * Position parameter can be 'left' or 'right' to create the
 * table on the left half or right half of the page accordingly.
 * Assumes that the columns header titles represent the width
 * of the column. In other words, pad columns with extra
 * spaces should they need to be wider.
 *
 * If the wrap option is set, two features are activated. First
 * the data that does not fit in it's respective column will be
 * split across multiple lines so that it does fit. Second, data
 * that has explicit line feeds in it will be split to different
 * lines on those line feeds.
 *
 * If the bottomNote option is set, it is expected to be an
 * array of the same length as the rows array divided by the
 * length of the columns array. In other words, an entry for each
 * record, even if a particular entry is a blank string. Entries
 * are written at the bottom of the table row. This is good for long
 * notes that don't need a column header.
 *
 * If postRowCB is a function, it will be called after each row has
 * been printed. The function has to be syncronous, should return the
 * new y position, and is passed the following parameters:
 *
 * If the number of rows causes the page to exceed it's bounds,
 * a new page will be added, including the header information, and
 * the rows will be continued on the new overflow page. It is the
 * caller's responsibility to start a new page before calling doTable()
 * if there is not enough room to do at least some of the rows including
 * the table header information.
 *
 *  doc
 *  x
 *  y
 *  row
 *  rowIndex
 *
 *  The postRowCB callback allows additional information to be written
 *  out after the row proper. The postRowCB is called after the
 *  bottomNote, if present, is printed.
 *
 *  Returns an object with two elements, 'y' for the new y position and
 *  'overflow' as a boolean whether an overflow page was added.
 *
 * param      doc
 * param      columns - list of column names
 * param      rows
 * param      opts
 * param      ypos
 * param      position - default is full width, 'left', 'right'
 * param      wrap - whether to wrap data if too long for column
 * param      bottomNote - an array of notes, one per record, to write at bottom
 * param      postRowCB - callback called after each row
 * return     Object with y and overflow elements
 * -------------------------------------------------------- */
var doTable = function(doc, columns, rows, opts, ypos,
    position, wrap, bottomNote, postRowCB) {
  var x = opts.margins.left
    , left = x
    , y = ypos
    , lastY       // Starting y value for the current row.
    , totalY = 0  // Total of the vertical space used for all rows at any point.
    , avgY = 0    // Running average of vertical space used per row.
    , minY = 90   // If overflow, start at this y position on new page.
    , maxY = doc.page.height - opts.margins.bottom - 20 // Overflow trigger.
    , didAddPage = false    // Was a page added due to overflow?
    , pageWidth = opts.pageWidth - opts.margins.left - opts.margins.right
    , colWidth = {}
    , totalColWidth = 0
    , handlePageOverflow = function() {
        if (y > (maxY - avgY)) {
          if (position && position === 'right' && doc.bufferedPageRange().count > (currentPage + 1)) {
            // No need to add a page if the left side has already added on for us.
            logInfo('Summary Report: Advancing a page in doTable() due to overflow.');
            doc.switchToPage(++currentPage);
            y = minY;
            didAddPage = true;
          } else {
            logInfo('Summary Report: Added another page in doTable() due to overflow.');
            doStartPage(doc, opts);
            y = minY;
            didAddPage = true;
            // Reset font to what we expect.
            doc.font(FONTS.Helvetica).fontSize(9);
          }
        }
      }
    ;

  if (position) {
    if (position === 'left') {
      pageWidth = (doc.page.width / 2) - 10;
    } else if (position === 'right') {
      pageWidth = (doc.page.width / 2) - 10;
      x = (doc.page.width / 2) + 10;
      left = x;
    }
  }

  doSep(doc, opts, y, greyLightColor, position);
  y += 5;

  // --------------------------------------------------------
  // Calculate the width of the columns names.
  // --------------------------------------------------------
  doc
    .font(FONTS.HelveticaBold)
    .fillColor(blackColor)
    .fontSize(10);
  _.each(columns, function(col) {
    var width = doc.widthOfString(col);
    colWidth[col] = width;
    totalColWidth += width;
  });

  // --------------------------------------------------------
  // Set the width of the columns.
  // --------------------------------------------------------
  _.each(columns, function(col) {
    colWidth[col] = colWidth[col] * (pageWidth/totalColWidth);
  });

  // --------------------------------------------------------
  // Write out the column headers.
  // --------------------------------------------------------
  _.each(columns, function(col) {
    doc.text(col, x, y);
    x += colWidth[col];
  });
  y += 12;
  doSep(doc, opts, y, greyLightColor, position);

  // --------------------------------------------------------
  // Write out the rows.
  // --------------------------------------------------------
  y += 10;
  lastY = y;
  doc
    .font(FONTS.Helvetica)
    .fontSize(9);
  x = left;
  _.each(rows, function(row, rowNum) {
    var linesUsed = 1
      , maxLinesUsed = linesUsed
      , maxBtmLineLen = 140
      , btmLine
      , numBtmLines
      , btmTmp
      ;

    // Note the starting y position as we begin to print this row.
    lastY = y;

    _.each(row, function(val, idx) {
      if (! val || _.isNull(val)) val = '';
      var currColWidth = colWidth[columns[idx]]
        , textWidth = doc.widthOfString(val)
        , colStart
        ;

      // --------------------------------------------------------
      // Have we exceeded the vertical capabilities of the page
      // after the rows completed so far?
      // --------------------------------------------------------
      handlePageOverflow();

      // Remove the new lines for the purposes of this report.
      val = String(val).replace(/$/g, ' ');

      if (idx > 0) x += colWidth[columns[idx-1]];
      colStart = x;
      if (wrap) {
        if (textWidth > currColWidth) {
          // --------------------------------------------------------
          // Will wrap in column automatically but estimate how many
          // lines so that the separator can be placed accordingly.
          // Longer notes need a little help to fit so we add a bit.
          // --------------------------------------------------------
          linesUsed = Math.ceil((textWidth / currColWidth) * 1.15);
          doc.text(val, x, y, {width: currColWidth});
        } else {
          doc.text(val, x, y);
        }
        maxLinesUsed = linesUsed > maxLinesUsed? linesUsed: maxLinesUsed;
      } else {
        doc.text(val, x, y);
      }
    });
    x = left;
    y += maxLinesUsed * 10;      // Move down the number of lines used.

    if (bottomNote && rowNum < bottomNote.length) {
      if (bottomNote[rowNum]) {
        // --------------------------------------------------------
        // We hard-wrap without special processing at a certain
        // number of characters. This isn't pretty nor graceful.
        // --------------------------------------------------------
        numBtmLines = Math.ceil(bottomNote[rowNum].length / maxBtmLineLen);
        for (btmLine = 0; btmLine < numBtmLines; btmLine++) {
          btmTmp = bottomNote[rowNum].slice(btmLine * maxBtmLineLen, (btmLine * maxBtmLineLen) + maxBtmLineLen);
          doc.text(btmTmp, left, y);
          y += 10;
        }
      }
    }

    // --------------------------------------------------------
    // Post row callback, if present.
    // --------------------------------------------------------
    if (postRowCB && _.isFunction(postRowCB)) {
      y = postRowCB(doc, x, y, row, rowNum);
    }

    doSep(doc, opts, y, greyLightColor, position);
    y += 10;

    // --------------------------------------------------------
    // Calculate the running average of the vertical space used
    // for the rows so far. This allows a slightly more accurate
    // "guess" whether to add a new page by the handlePageOverflow()
    // function. In the case where we overflowed a page already,
    // the first row will yield a y that is less than lastY, so
    // ignore that and fudge the calculation.
    // --------------------------------------------------------
    totalY += y > lastY? y - lastY: avgY;
    avgY = totalY / (rowNum + 1);
  });

  return {y: y + 10, overflow: didAddPage};
};


/* --------------------------------------------------------
 * doAllFooters()
 *
 * Do all of the footers once we know how many pages have
 * been generated. This needs to be done this way to account
 * for overflow pages that were used.
 *
 * param       doc
 * param       opts
 * return      undefined
 * -------------------------------------------------------- */
var doAllFooters = function(doc, opts) {
  var left = 'Summary Report'
    , right = moment().format('MMM DD, YYYY h:mm a')
    , rangePages = doc.bufferedPageRange()
    , i = rangePages.start    // zero-based page
    , j                       // human page
    ;

  for (; i < (rangePages.start + rangePages.count); i++) {
    j = i + 1;
    doc.switchToPage(i);
    doFooter(doc, left, 'Page ' + j + ' of ' + rangePages.count, right, opts)
  }
};

/* --------------------------------------------------------
 * doFooter()
 *
 * Write the footer for the report.
 *
 * param      doc
 * param      left
 * param      middle
 * param      right
 * param      opts
 * return     undefined
 * -------------------------------------------------------- */
var doFooter = function(doc, left, middle, right, opts) {
  var y = doc.page.height - opts.margins.bottom - 20
    , x1= opts.margins.left
    , x2
    , x3
    ;

  if (! left) left = '';
  if (! middle) middle = '';
  if (! right) right = '';

  doSep(doc, opts, y, greyLightColor);
  y += 5;

  // --------------------------------------------------------
  // Calculate horizontal positions.
  // --------------------------------------------------------
  doc
    .font(FONTS.Helvetica)
    .fontSize(9)
    .fillColor(blackColor);
  x2 = (doc.page.width/2) - (doc.widthOfString(middle)/2);
  x3 = doc.page.width - opts.margins.right - doc.widthOfString(right) - 2;

  // --------------------------------------------------------
  // Write out left, middle and right.
  // --------------------------------------------------------
  doc
    .text(left, x1, y)
    .text(middle, x2, y)
    .text(right, x3, y);
};

/* --------------------------------------------------------
 * doPage1()
 *
 * Write out the information for the first page.
 *
 * param      doc     - the document
 * param      data    - the data
 * param      opts    - options
 * return     undefined
 * -------------------------------------------------------- */
var doPage1 = function doPage1(doc, data, opts) {
  var sections = []
    ;

  // No need to add a page on the first page so doStartPage() not used.
  doPageCommon(doc, opts);

  // --------------------------------------------------------
  // Define the sections for this page.
  // --------------------------------------------------------
  sections.push([doClientGeneral]);
  sections.push([doPrenatal]);
  sections.push([doQuestionnaire]);
  sections.push([doMidwifeInterview]);
  sections.push([doPregnancyHistory]);

  // Print as defined.
  doPrintPage(doc, data, opts, sections);
};


/* --------------------------------------------------------
 * doPage2()
 *
 * Write out the information for the second page.
 *
 * param      doc     - the document
 * param      data    - the data
 * param      opts    - options
 * return     undefined
 * -------------------------------------------------------- */
var doPage2 = function doPage2(doc, data, opts) {
  var sections = []
    ;

  doStartPage(doc, opts);

  // --------------------------------------------------------
  // Define the sections for this page.
  // --------------------------------------------------------
  sections.push([doLabResults]);
  sections.push([doMedications, doVaccinations]);
  sections.push([doReferrals, doDoctorDentist]);

  // Print as defined.
  doPrintPage(doc, data, opts, sections);
};

/* --------------------------------------------------------
 * doPage3()
 *
 * Write out the information for the third page.
 *
 * param      doc     - the document
 * param      data    - the data
 * param      opts    - options
 * return     undefined
 * -------------------------------------------------------- */
var doPage3 = function doPage2(doc, data, opts) {
  var sections = []
    ;

  doStartPage(doc, opts);

  // --------------------------------------------------------
  // Define the sections for this page.
  // --------------------------------------------------------
  sections.push([doPrenatalRisk, doTransferOfCare, doPregnancyResult]);
  sections.push([doPrenatalExams]);

  // Print as defined.
  doPrintPage(doc, data, opts, sections);
};

/* --------------------------------------------------------
 * doPrintPage()
 *
 * Manages the printing of a page, including handling overflows
 * of the page onto one or more overflow pages. Expects the
 * near standard doc, data, and opts parameters as well as
 * a fourth, sections.
 *
 * The sections parameter is expected to be an array of arrays,
 * each interior array to consist of the functions to call to
 * produce the section in question. Interior arrays with one
 * element will span the whole width of the page, while those
 * with two will print to the left and right respectfully. E.g.
 *
 * sections = [[doLabResults], [doMedications, doVaccination],
 *             [doReferrals, doDoctorDentist]];
 *
 * Each section function, when called, will be passed doc, data,
 * opts, and y as parameters. Each section is expected to return
 * an object with at least two elements, y and overflow.
 *
 * For ease of terminology, the inner arrays will be referred
 * to as sections. Each section may have one or two parts
 * corresponding to the functions within the inner arrays.
 *
 * It is allowable that there can be more than two parts in
 * a section, but in that case, it is assumed that the parts
 * will not have any risk of overflow, i.e. they have a constant
 * size that is not influenced by data.
 *
 * param      doc
 * param      data
 * param      opts
 * param      sections
 * return     undefined
 * -------------------------------------------------------- */
var doPrintPage = function(doc, data, opts, sections) {
  var minY = 85   // Top/bottom positions for printing on a page.
    , maxY = doc.page.height - opts.margins.bottom - 40
    , y = minY
    , startPage = currentPage
    , partsResults = []
    , funcCnt = 0
    , numSections = _.size(sections)
    ;

  _.each(sections, function(partsArray, secIdx) {
    var isFullWidth = _.size(partsArray) === 1? true: false
      , sectionY = y
      ;
    // --------------------------------------------------------
    // Process this section of either one or two parts.
    // --------------------------------------------------------
    _.each(partsArray, function(func, idx) {
      var didAddPage = false;
      // Run the function and get the result.
      partsResults[idx] = func(doc, data, opts, y);
      funcCnt++;

      // --------------------------------------------------------
      // If a full width section used too much vertical w/o adding
      // page, we add another page for the sake of the next section,
      // unless there isn't another one coming.
      // --------------------------------------------------------
      if (isFullWidth &&
          partsResults[idx].y > maxY &&
          ! partsResults[idx].overflow &&
          secIdx < (numSections - 1)) {
        logInfo('Summary Report: Adding a page in doPrintPage().');
        doStartPage(doc, opts);
        y = minY;
        didAddPage = true;
      }

      // If we are full width, reset y for the next section down.
      if (isFullWidth) {
        // Do not reset y if already done above.
        if (! didAddPage) y = partsResults[idx].y;
      } else {
        if (idx === 0) {
          // First of two side-by-side sections.
          if (partsResults[idx].overflow) {
            // Reset to prior page and y for the next part in this section.
            doc.switchToPage(--currentPage);
          }
          y = sectionY;
        }
        if (idx === 1) {
          // Second of two side-by-side sections.
          if (! partsResults[0].overflow && ! partsResults[1].overflow) {
            // Neither part overflowed, so take the greatest y.
            y = partsResults[0].y > partsResults[1].y? partsResults[0].y: partsResults[1].y;
          } else if (partsResults[0].overflow && ! partsResults[1].overflow) {
            // If the first part overflowed but the second did not,
            // move ahead a page for the sake of the next section and use the
            // y value from the first part because it is the y for the new page.
            doc.switchToPage(++currentPage);
            y = partsResults[0].y;
          } else if (! partsResults[0].overflow && partsResults[1].overflow) {
            // The second part overflowed but the first did not, already moved
            // ahead a page so just take the y from the second part.
            y = partsResults[1].y;
          } else if (partsResults[0].overflow && partsResults[1].overflow) {
            // Both parts overflowed so take the greater of the y values.
            y = partsResults[0].y > partsResults[1].y? partsResults[0].y: partsResults[1].y;
          } else {
            logWarn('doPrintPage(): logic error - should not have reached this point.');
          }
        }
        if (idx > 1) {
          // --------------------------------------------------------
          // Assume that we are not printing left/right parts using
          // doTable() and that overflow with this is not an issue, so
          // just track y.
          // --------------------------------------------------------
          y = partsResults[idx].y;
        }
        if (y > maxY && secIdx < (numSections - 1)) {
          // Add another page if we have gone too far down already and
          // we still have more sections to print.
          logInfo('Summary Report: Adding a page in doPrintPage().');
          doStartPage(doc, opts);
          y = minY;
        }
      }
    });
    partsResults = [];   // Clear for the next section.
  });

};

/* --------------------------------------------------------
 * doStartPage()
 *
 * Add a page and write out the header information.
 *
 * param       doc
 * param       opts
 * return      undefined
 * -------------------------------------------------------- */
var doStartPage = function(doc, opts) {
  doc.addPage();
  doPageCommon(doc, opts);
  currentPage++;
};

/* --------------------------------------------------------
 * doPages()
 *
 * Writes all the pages of the report.
 *
 * param      doc
 * param      data
 * param      opts
 * return     undefined
 * -------------------------------------------------------- */
var doPages = function(doc, data, opts) {
  var currentRow = 0
    , pageNum = 1
    ;

  doPage1(doc, data, opts);
  doPage2(doc, data, opts);
  doPage3(doc, data, opts);

  doAllFooters(doc, opts);
};


/* --------------------------------------------------------
 * getData()
 *
 * Queries the database for the required information. Returns
 * a promise that resolves to an array of data.
 *
 * param      id
 * return     Promise
 * -------------------------------------------------------- */
var getData = function(id) {
  var data = {}
    ;
  return new Promise(function(resolve, reject) {
    Pregnancy.forge({id: id})
      // Pregnancy
      .fetch()
      .then(function(pregnancy) {
        data.pregnancy = pregnancy.toJSON();
      })
      // Patient
      .then(function() {
        return Patient.forge({id: data.pregnancy.patient_id})
          .fetch();
      })
      .then(function(patient) {
        data.patient = patient.toJSON();
      })
      // Vaccinations
      .then(function() {
        return new Vaccinations().query(function(qb) {
          qb.innerJoin('vaccinationType', 'vaccination.vaccinationType', 'vaccinationType.id');
          qb.select(['vaccinationType.name', 'vaccination.id',
                     'vaccination.vaccinationType', 'vaccination.vacDate',
                     'vaccination.vacMonth', 'vaccination.vacYear',
                     'vaccination.administeredInternally', 'vaccination.note',
                     'vaccination.updatedBy', 'vaccination.updatedAt',
                     'vaccination.supervisor', 'vaccination.pregnancy_id']);
          qb.where('pregnancy_id', '=', data.pregnancy.id);
        })
        .fetch();
      })
      .then(function(vaccinations) {
        data.vaccinations = vaccinations.toJSON();
      })
      // Medications
      .then(function() {
        return new Medications().query(function(qb) {
          qb.innerJoin('medicationType', 'medication.medicationType', 'medicationType.id');
          qb.select(['medicationType.name', 'medication.id', 'medication.date',
                     'medication.medicationType', 'medication.numberDispensed',
                     'medication.note', 'medication.updatedBy',
                     'medication.updatedAt', 'medication.supervisor',
                     'medication.pregnancy_id']);
          qb.where('pregnancy_id', '=', data.pregnancy.id);
        })
        .fetch();
      })
      .then(function(medications) {
        data.medications = medications.toJSON();
      })
      // PrenatalExams
      .then(function() {
        return new PrenatalExams().query(function(qb) {
          qb.where('pregnancy_id', '=', data.pregnancy.id);
          qb.innerJoin('user', 'user.id', 'prenatalExam.updatedBy');
          qb.select(['user.firstname', 'user.lastname', 'user.username',
                     'prenatalExam.id', 'prenatalExam.date', 'prenatalExam.weight',
                     'prenatalExam.systolic', 'prenatalExam.diastolic',
                     'prenatalExam.cr', 'prenatalExam.temperature',
                     'prenatalExam.respiratoryRate', 'prenatalExam.fh',
                     'prenatalExam.fhNote', 'prenatalExam.fht',
                     'prenatalExam.fhtNote', 'prenatalExam.pos',
                     'prenatalExam.mvmt', 'prenatalExam.edema', 'prenatalExam.risk',
                     'prenatalExam.vitamin', 'prenatalExam.pray',
                     'prenatalExam.note', 'prenatalExam.returnDate',
                     'prenatalExam.updatedBy', 'prenatalExam.updatedAt',
                     'prenatalExam.supervisor', 'prenatalExam.pregnancy_id']);
          qb.orderBy('prenatalExam.date');
        })
        .fetch();
      })
      .then(function(prenatalExams) {
        data.prenatalExams = prenatalExams.toJSON();
      })
      // PregnancyHistories
      .then(function() {
        return new PregnancyHistories().query(function(qb) {
          qb.where('pregnancy_id', '=', data.pregnancy.id);
          qb.orderBy('pregnancyHistory.year', 'pregnancyHistory.month');
        })
        .fetch();
      })
      .then(function(pregnancyHistories) {
        data.pregnancyHistories = pregnancyHistories.toJSON();
      })
      // Referrals
      .then(function() {
        return new Referrals().query(function(qb) {
          qb.where('pregnancy_id', '=', data.pregnancy.id);
        })
        .fetch();
      })
      .then(function(referrals) {
        data.referrals = referrals.toJSON();
      })
      // Progress Notes
      .then(function() {
        return new Pregnotes().query(function(qb) {
          qb.where('pregnancy_id', '=', data.pregnancy.id);
          qb.andWhere('pregnoteType', '=', 1);  // TODO: fix this hard-code
          qb.orderBy('noteDate');
        })
        .fetch();
      })
      .then(function(pnotes) {
        data.pnotes = pnotes.toJSON();
      })
      // Risks
      .then(function() {
        return new Risks().query(function(qb) {
          qb.where('pregnancy_id', '=', data.pregnancy.id);
        })
        .fetch();
      })
      .then(function(risks) {
        data.risks = risks.toJSON();
      })
      // RiskCodes - get them all
      .then(function() {
        return new RiskCodes().fetch();
      })
      .then(function(rcodes) {
        data.riskCodes = rcodes.toJSON();
      })
      // Lab Test Results
      .then(function() {
        return new LabTestResults().query(function(qb) {
          qb.innerJoin('labTest', 'labTestResult.labTest_id', 'labTest.id');
          qb.innerJoin('labSuite', 'labTest.labSuite_id', 'labSuite.id');
          qb.select(['labTest.name', 'labTest.abbrev', 'labTest.unit',
                     'labSuite.name as type', 'labTestResult.id',
                     'labTestResult.testDate', 'labTestResult.result',
                     'labTestResult.result2', 'labTestResult.warn',
                     'labTestResult.labTest_id', 'labTestResult.pregnancy_id',
                     'labTestResult.updatedBy', 'labTestResult.updatedAt',
                     'labTestResult.supervisor']);
          qb.where('pregnancy_id', '=', data.pregnancy.id);
        })
        .fetch();
      })
      .then(function(labTestResults) {
        data.labTestResults = labTestResults.toJSON();
      })
      // Return all of the data to the caller.
      .then(function() {
        resolve(data);
      })
      .caught(function(err) {
        logError(err);
        reject(err);
      });
  });
};

/* --------------------------------------------------------
 * doReport()
 *
 * Create the summary report for the patient.
 *
 * param      id
 * param      writable
 * return     undefined
 * -------------------------------------------------------- */
var doReport = function doReport(id, writable) {
  var options = {
        bufferPages: true,      // Allow writing to prior pages if desired.
        margins: {
          top: 18
          , right: 18
          , left: 18
          , bottom: 18
        }
        , layout: 'portrait'
        , size: 'letter'
        , info: {
            Title: 'Summary Report: '
            , Author: 'Midwife-EMR Application'
            , Subject: 'Summary Report'
        }
      }
    , doc = new PDFDocument(options)
    , rowsPerPage = 33    // Number of rows per page of this report.
    , opts = {}
    ;

  opts.title = options.info.Title;
  opts.margins = options.margins;
  opts.pageWidth = doc.page.width;
  opts.pageHeight = doc.page.height;
  opts.rowsPerPage = rowsPerPage;

  currentPage = 0;   // Tracking what page we are printing to now, zero based.

  // --------------------------------------------------------
  // Write the report to the writable stream passed.
  // --------------------------------------------------------
  doc.pipe(writable);

  getData(id)
    .then(function(data) {
      opts.title += data.pregnancy.lastname + ', ' + data.pregnancy.firstname;
      doPages(doc, data, opts);
    })
    .then(function() {
      doc.end();
    });
};

/* --------------------------------------------------------
 * run()
 *
 * Create the summary report for a patient.
 * -------------------------------------------------------- */
var run = function run(req, res) {
  var id = req.params.id
    , filePath = path.join(cfg.site.tmpDir, 'rpt-' + (Math.random() * 9999999999) + '.pdf')
    , writable = fs.createWriteStream(filePath)
    , success = false
    , fieldsReady = true
    ;

  // --------------------------------------------------------
  // Check that required fields are in place.
  // --------------------------------------------------------
  if (! id) {
    fieldsReady = false;
    req.flash('error', req.gettext('The pregnancy id for the summary report was not specified.'));
  }
  if (! fieldsReady) {
    logWarn('Summary Report: not all fields supplied.');
    // TODO: better place to go than here?
    res.redirect(cfg.path.search);
  }

  // --------------------------------------------------------
  // When the report is fully built, write it back to the caller.
  // --------------------------------------------------------
  writable.on('finish', function() {
    fs.stat(filePath, function(err, stats) {
      if (err) return logError(err);
      var size = stats.size;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; SummaryRpt.pdf');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Content-Length', ('' + size));
      fs.createReadStream(filePath).pipe(res);    // res is ended by default.
      fs.unlink(filePath);
    });
  });

  doReport(id, writable);
};

module.exports = {
  run: run
};

