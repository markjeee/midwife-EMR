/* 
 * -------------------------------------------------------------------------------
 * config.js
 *
 * Global configuration which is meant to be loaded first and then overridden as
 * appropriate by the environment specific configuration files.
 *
 * Note: always create the required elements in the cfg object in this file, e.g.
 *
 *    cfg.database = {};
 *    cfg.path = {};
 *
 * then establish default values that are overridden depending upon the environment.
 * ------------------------------------------------------------------------------- 
 */


var cfg = {}
    // Allows i18n-abide's extract-pot script to pick up these 
    // variables and put them into the pot file.
  , gettext = function(param) {return param;}
  ;

// --------------------------------------------------------
// Site settings.
//
// Note: any attribute that needs localization with the
// templates needs to be added to the i18nLocals() function
// in index.js.
// --------------------------------------------------------
cfg.site = {};
cfg.site.title = gettext('Your Site Name');

// --------------------------------------------------------
// Host settings.
// --------------------------------------------------------
cfg.host = {};
cfg.host.port = 4000

// --------------------------------------------------------
// Database settings.
// --------------------------------------------------------
cfg.database = {};
cfg.database.host = 'localhost';
cfg.database.port = 3306;
cfg.database.db = 'yourDBname';
cfg.database.dbUser = 'yourDBuser';
cfg.database.dbPass = 'yourDBpassword';
cfg.database.charset = 'utf8';

// --------------------------------------------------------
// Session settings.
// --------------------------------------------------------
cfg.session = {};
cfg.session.secret = 'yourSESSIONsecret';
cfg.session.pool = true;
cfg.session.table = 'session';
cfg.session.cleanup = true;
cfg.session.config = {
  user: cfg.database.dbUser
  , password: cfg.database.dbPass
  , database: cfg.database.db
};

// --------------------------------------------------------
// Cookie settings.
// --------------------------------------------------------
cfg.cookie = {};
cfg.cookie.secret = 'yourCOOKIEsecret';
cfg.cookie.maxAge = 60 * 60 * 24 * 1000;    // 1 day

// --------------------------------------------------------
// Path settings.
// Using our own near-REST adaptation based upon
// http://microformats.org/wiki/rest/urls
//
// Res = resource, e.g. user or patient
// Rel = related to resource, e.g. roles or labs
// :id = the resource id, e.g. user 4
// :rid = the related to resource id, e.g. role 12
// special = some custom action
//
// Description             Path                     Method
// ------------------------------------------------ ------
// List                    /Res                     GET
// Form to create new      /Res/new                 GET
// Create new record       /Res                     POST
// Read/show a record      /Res/:id                 GET
// Form to edit record     /Res/:id/edit            GET
// Update record           /Res/:id/update          POST
// Delete a record         /Res/:id/delete          POST
// List related to record  /Res/:id/Rel             GET
// Form to create relation /Res/:id/Rel/new         GET
// Create new relation     /Res/:id/Rel             POST
// Read/show relation      /Res/:id/Rel/:rid        GET
// Form to edit relation   /Res/:id/Rel/:rid/edit   GET
// Update relation         /Res/:id/Rel/:rid/update POST
// Delete relation         /Res/:id/Rel/:rid/delete POST
// Custom action for Res   /Res/:id/special         POST
//
// --------------------------------------------------------
cfg.path = {};
cfg.path.home = '/';
cfg.path.login = '/login';
cfg.path.logout = '/logout';
cfg.path.search = '/search';

cfg.path.userList = '/user';
cfg.path.userNewForm = '/user/new';
cfg.path.userCreate = '/user';
cfg.path.userShow = '/user/:id';
cfg.path.userEditForm = '/user/:id/edit';
cfg.path.userUpdate = '/user/:id/update';
cfg.path.userLoad = '/user/:id/:op?';      // for parameter handling

cfg.path.roleList = '/role';
cfg.path.roleNewForm = '/role/new';
cfg.path.roleCreate = '/role';
cfg.path.roleShow = '/role/:id';
cfg.path.roleEditForm = '/role/:id/edit';
cfg.path.roleUpdate = '/role/:id/update';
cfg.path.roleLoad = '/role/:id/:op?';      // for parameter handling

cfg.path.userLoad2 = '/user/:id/role/:op?';   // parameter handling
cfg.path.changeRoles = '/user/:id/role/changeroles';

cfg.path.profile = '/profile';          // GET for form, POST to save

cfg.path.setSuper = '/setsuper';        // GET for form, POST to save

cfg.path.pregnancyList = '/pregnancy';                // GET
cfg.path.pregnancyNewForm = '/pregnancy/new';         // GET
cfg.path.pregnancyCreate = '/pregnancy';              // POST
cfg.path.pregnancyEditForm = '/pregnancy/:id/edit';   // GET
cfg.path.pregnancyUpdate = '/pregnancy/:id/update';   // POST
cfg.path.pregnancyLoad = '/pregnancy/:id/:op?';       // parameter handling

module.exports = cfg;

