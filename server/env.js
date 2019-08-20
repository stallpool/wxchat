const base = __dirname;

const env = {
   base: base,
   debug: !!process.env.WXCHAT_DEBUG,
   auth_internal: false,
   search_path: process.env.WXCHAT_SEARCH_PATH,
   ldap_server: process.env.WXCHAT_LDAP_SERVER,
   keyval: {
      // store key value into file;
      // if null, only in memory
      filename: process.env.WXCHAT_KEYVAL_FILENAME || null
   },
   offer: {
      serve_static: !!process.env.WXCHAT_SERVE_STATIC,
   },
   admins: process.env.WXCHAT_ADMINS?process.env.WXCHAT_ADMINS.split(','):[],
};

module.exports = env;
