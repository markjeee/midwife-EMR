/*
 * -------------------------------------------------------------------------------
 * PrenatalExam.js
 *
 * The model for prenatal exams.
 * -------------------------------------------------------------------------------
 */

var moment = require('moment')
  , Promise = require('bluebird')
    // Default settings used unless Bookshelf already initialized.
  , dbSettings = require('../config').database
  , Bookshelf = (require('bookshelf').DB || require('./DB').init(dbSettings))
  , PrenatalExam = {}
  ;

/*
CREATE TABLE `prenatalExam` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `weight` decimal(4,1) DEFAULT NULL,
  `systolic` int(11) DEFAULT NULL,
  `diastolic` int(11) DEFAULT NULL,
  `cr` int(11) DEFAULT NULL,
  `temperature` decimal(4,1) DEFAULT NULL,
  `respiratoryRate` int(11) DEFAULT NULL,
  `fh` int(11) DEFAULT NULL,
  `fhNote` varchar(30) DEFAULT NULL,
  `fht` int(11) DEFAULT NULL,
  `fhtNote` varchar(20) DEFAULT NULL,
  `pos` varchar(10) DEFAULT NULL,
  `mvmt` tinyint(1) DEFAULT NULL,
  `edema` varchar(4) DEFAULT NULL,
  `risk` varchar(100) DEFAULT NULL,
  `vitamin` tinyint(1) DEFAULT NULL,
  `pray` tinyint(1) DEFAULT NULL,
  `note` varchar(100) DEFAULT NULL,
  `returnDate` date DEFAULT NULL,
  `updatedBy` int(11) NOT NULL,
  `updatedAt` datetime NOT NULL,
  `supervisor` int(11) DEFAULT NULL,
  `pregnancy_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `pregnancy_id` (`pregnancy_id`),
  KEY `updatedBy` (`updatedBy`),
  KEY `supervisor` (`supervisor`),
  CONSTRAINT `prenatalExam_ibfk_1` FOREIGN KEY (`pregnancy_id`) REFERENCES `pregnancy` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `prenatalExam_ibfk_2` FOREIGN KEY (`updatedBy`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION,
  CONSTRAINT `prenatalExam_ibfk_3` FOREIGN KEY (`supervisor`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB AUTO_INCREMENT=10001 DEFAULT CHARSET=latin1
*/

PrenatalExam = Bookshelf.Model.extend({
  tableName: 'prenatalExam'

  , permittedAttributes: ['id', 'date', 'weight', 'systolic', 'diastolic', 'cr',
      'temperature', 'respiratoryRate', 'fh', 'fhNote', 'fht', 'fhtNote', 'pos',
      'mvmt', 'edema', 'risk', 'vitamin', 'pray', 'note', 'returnDate',
      'updatedBy', 'updatedAt', 'supervisor', 'pregnancy_id']

  , initialize: function() {
      this.on('saving', this.saving, this);
    }

  , saving: function(model) {
      // Enforce permittedAttributes.
      Bookshelf.Model.prototype.saving.apply(this, model);
    }

  // --------------------------------------------------------
  // Relationships
  // --------------------------------------------------------

  , pregnancy: function() {
      return this.belongsTo(require('./Pregnancy').Pregnancy, 'pregnancy_id');
    }

}, {
  // --------------------------------------------------------
  // Class Properties.
  // --------------------------------------------------------

});

PrenatalExams = Bookshelf.Collection.extend({
  model: PrenatalExam
});

module.exports = {
  PrenatalExam: PrenatalExam
  , PrenatalExams: PrenatalExams
};

