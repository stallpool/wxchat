const i_url = require('url');
const crypto = require('crypto');

const i_utils = require('./utils');
const i_wxchatbot = require('./wx_chatbot');

class WXBizMsgCodec {
   constructor() {}

   sha1(timestamp, nonce, text) {
      return crypto.createHash('sha1').update(
         [process.env.WEIXIN_TOKEN, timestamp, nonce, text].sort((a,b) => a>b?1:-1).join(''), 'utf8'
      ).digest('hex');
   }

   padding(textbuf) {
      let textlen = textbuf.length;
      let padlen = 32 - (textlen % 32);
      let i = padlen;
      if (!padlen) padlen = 32;
      let pad = [];
      while (i > 0) {
         pad.push(padlen);
         i --;
      }
      return Buffer.concat([textbuf, Buffer.from(pad)]);
   }

   depadding(textbuf) {
      let textlen = textbuf.length;
      let padlen = textbuf[textlen-1];
      if (padlen < 1 || padlen > 32) padlen = 0;
      return textbuf.slice(0, textlen-padlen);
   }

   encrypt(text, appid) {
      let textbuf = Buffer.from(text, 'utf8');
      textbuf = Buffer.concat([
         randomString(16), htonl(textbuf.length),
         textbuf, Buffer.from(appid)
      ]);
      textbuf = this.padding(textbuf);
      let key = Buffer.from(process.env.WEIXIN_ENCODINGAESKEY + '=', 'base64');
      let cipher = crypto.createCipheriv('aes-256-cbc', key, key.slice(0, 16));
      cipher.setAutoPadding(false);
      let encrypted = cipher.update(textbuf, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      return encrypted.toString('base64');
   }

   decrypt(text, appid) {
      let key = Buffer.from(process.env.WEIXIN_ENCODINGAESKEY + '=', 'base64');
      let decipher = crypto.createDecipheriv('aes-256-cbc', key, key.slice(0, 16));
      let textbuf = Buffer.from(text, 'base64');
      let decrypted = decipher.update(textbuf);
      try {
         decrypted = Buffer.concat([decrypted, decipher.final()])
      } catch (e) {}
      decrypted = decrypted.toString('utf8');
      let i = decrypted.indexOf('<');
      let j = decrypted.lastIndexOf('>');
      let checked_appid = decrypted.substring(j+1);
      let matched_appid = /[a-zA-Z0-9]+/.exec(checked_appid);
      checked_appid = matched_appid?matched_appid[0]:null;
      if (checked_appid !== appid) return null;
      decrypted = decrypted.substring(i, j+1);
      return decrypted;
   }
}

function randomString(size) {
   const set = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890';
   let buf = Buffer.alloc(size);
   for (let i = 0; i < size; i++) {
      buf[i] = set.charCodeAt(~~(Math.random() * set.length));
   }
   return buf;
}

function htonl (n) {
   let buf = Buffer.alloc(4);
   buf[0] = (n & 0xFF000000) >> 24;
   buf[1] = (n & 0x00FF0000) >> 16;
   buf[2] = (n & 0x0000FF00) >> 8;
   buf[3] = (n & 0x000000FF);
   return buf;
}

function nltoh (buf) {
   return (buf[0] << 24) | (buf[1] << 16) | (buf[2] << 8) | (buf[3]);
}

function parse_query_string(url) {
   let parts = i_url.parse(url);
   let obj = {};
   if (!parts.query) return obj;
   parts.query.split('&').forEach((keyval) => {
      let pair = keyval.split('=');
      if (pair[1]) {
         obj[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      } else {
         obj[decodeURIComponent(pair[0])] = null;
      }
   });
   return obj;
}

function parse_xml(text) {
   // e.g. <xml, >, <path, >, <encrypt, >, <![CDATA[ ..., >, ... ]], >, </encrypt, >, </path, >, </xml, >
   // e.g. <xml     <path     <encrypt     <![CDATA[ ...     ... ]]     </encrypt     </path     </xml
   // e.g.  xml      path      encrypt      ![CDATA[ ...     ... ]],     /encrypt      /path      /xml
   let root = {}, stack = [root], state = 0;
   if (!text) return root;
   let parts = text.split('>');
   parts.forEach((x) => {
      let sec = x.trim().split('<');
      let prefix = sec[0];
      let name = sec[1];
      if (state === 1) {
         let node = stack[stack.length-1];
         if (prefix.endsWith(']]')) {
            node.value += prefix.substring(0, prefix.length-2);
            state = 0;
         } else {
            node.value += prefix + '<';
         }
      } else if (state === 0 && name && name.startsWith('/')) {
         let node = stack.pop();
         if (!node) return;
         if (node.value) node.value += prefix; else node.value = prefix;
      } else if (state === 0 && name && name.startsWith('![CDATA[') && !prefix) {
         let node = stack[stack.length-1];
         if (name.endsWith(']]')) {
            node.value = name.substring(8, name.length-2);
         } else {
            node.value = name.substring(8) + '<';
            state = 1;
         }
      } else if (state === 0 && name && !prefix) {
         let newnode = {};
         let parent = stack[stack.length-1];
         stack.push(newnode);
         if (!parent.children) parent.children = [];
         parent.children.push(newnode);
         newnode.name = name;
      }
   });
   return root;
}

function get_xml_by_path(xml, path) {
   let parts = path.split('.');
   let cur = xml;
   parts.forEach((name) => {
      if (!cur || !cur.children || !cur.children.length) return null;
      for (let i = 0, n = cur.children.length; i < n; i++) {
         let item = cur.children[i];
         if (item.name === name) {
            cur = item;
            return;
         }
      }
      return null;
   });
   return cur;
}

function check_signature(signature, timestamp, nonce) {
   if (!signature || !timestamp || !nonce) {
      return false;
   }
   let checked = crypto.createHash('sha1').update(
      [process.env.WEIXIN_TOKEN, timestamp, nonce].sort((a,b) => a>b?1:-1).join(''), 'utf8'
   ).digest('hex');
   if (checked === signature) {
      return true;
   }
   return false;
}

async function signature(req, res) {
   let query = parse_query_string(req.url);
   let signature = query.signature;
   let echostr = query.echostr;
   let timestamp = query.timestamp;
   let nonce = query.nonce;
   if (echostr && check_signature(signature, timestamp, nonce)) {
      res.end(echostr);
      return;
   }
   res.end('');
}

const chatbot_rpl_template = `<xml>
<Encrypt><![CDATA[{0}]]></Encrypt>
<MsgSignature><![CDATA[{1}]]></MsgSignature>
<TimeStamp>{2}</TimeStamp><Nonce>
<![CDATA[{3}]]></Nonce>
</xml>`
async function chatbot_chat(contents_xml, timestamp) {
   return i_wxchatbot.chat(contents_xml, timestamp);
}
async function chatbot (req, res) {
   let param = parse_query_string(req.url);
   let signature = param.signature;
   let timestamp = param.timestamp;
   let nonce = param.nonce;
   let encrypt_type = param.encrypt_type;
   let msg_signature = param.msg_signature;
   if (!check_signature(signature, timestamp, nonce)) {
      return i_utils.Web.e400(res);
   }
   let q = await i_utils.Web.read_request_binary(req);
   let xml = parse_xml(q.toString());
   let to_user_name = get_xml_by_path(xml, 'xml.ToUserName');
   let encrypt = get_xml_by_path(xml, 'xml.Encrypt');
   let codec = new WXBizMsgCodec();
   let codec_signature = codec.sha1(timestamp, nonce, encrypt.value);
   if (codec_signature !== msg_signature || encrypt_type !== 'aes') {
      console.log('[security.warn]', encrypt_type, 'should:', msg_signature, 'but:', codec_signature);
      return i_utils.Web.e400(res);
   }
   let contents = codec.decrypt(encrypt.value, process.env.WEIXIN_APPID);
   let contents_xml = parse_xml(contents);
   let rpl_timestamp = '' + ~~(new Date().getTime()/1000);
   let rpl_contents = 'success';
   if (contents_xml) {
      rpl_contents = await chatbot_chat(contents_xml, timestamp);
   }
   let rpl_encrypted = codec.encrypt(rpl_contents, process.env.WEIXIN_APPID);
   let rpl_encrypted_signature = codec.sha1(rpl_timestamp, nonce, rpl_encrypted);
   let rpl_xml = chatbot_rpl_template.replace(
      '{0}', rpl_encrypted
   ).replace(
      '{1}', rpl_encrypted_signature
   ).replace(
      '{2}', rpl_timestamp
   ).replace(
      '{3}', nonce
   );
   res.end(rpl_xml);
}

const api = {
   v1: (req, res, options) => {
      if (req.method === 'GET') {
         signature(req, res);
      } else if (req.method === 'POST') {
         chatbot(req, res);
      }
   }
};

module.exports = api;
