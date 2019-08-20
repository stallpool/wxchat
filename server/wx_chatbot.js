const i_chat = {
   Calculator: require('./chatbot_calculator').Calculator,
};

const chatbot_rpl_contents_template = `<xml>
<ToUserName><![CDATA[{0}]]></ToUserName>
<FromUserName><![CDATA[{1}]]></FromUserName>
<CreateTime>{2}</CreateTime>
<MsgType><![CDATA[{3}]]></MsgType>
<Content><![CDATA[{4}]]></Content>
</xml>`;
function chatbot_make_contents(to, from, timestamp, type, text) {
   return chatbot_rpl_contents_template.replace(
      '{0}', to
   ).replace(
      '{1}', from
   ).replace(
      '{2}', timestamp
   ).replace(
      '{3}', type
   ).replace(
      '{4}', text.replace(/]]>/g, '] ]>')
   );
}

function get_path(xml, path) {
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

function chat(contents_xml, timestamp) {
   let msg_type = get_path(contents_xml, 'xml.MsgType');
   let obj = {
      type: msg_type,
      timestamp: timestamp,
      createtime: get_path(contents_xml, 'xml.CreateTime'),
      msg_id: get_path(contents_xml, 'xml.MsgId'),
      touser: get_path(contents_xml, 'xml.ToUserName'),
      fromuser: get_path(contents_xml, 'xml.FromUserName'),
   };
   if (
      !obj.touser || !obj.touser.value ||
      !obj.fromuser || !obj.fromuser.value ||
      !obj.type || !obj.type.value ||
      !obj.createtime || !obj.createtime.value ||
      !obj.msg_id || !obj.msg_id.value ||
      !obj.timestamp
   ) {
      return 'success';
   }
   switch(msg_type.value) {
      case 'text':
         obj.text = get_path(contents_xml, 'xml.Content');
         return rpl_text(obj);
      case 'image':
         obj.pic_url = get_path(contents_xml, 'xml.PicUrl');
         obj.media_id = get_path(contents_xml, 'xml.MediaId');
         return rpl_image(obj);
      case 'voice':
         obj.media_id = get_path(contents_xml, 'xml.MediaId');
         obj.format = get_path(contents_xml, 'xml.Format');
         obj.recognition = get_path(contents_xml, 'xml.Recognition');
         return rpl_voice(obj);
      case 'video':
         obj.media_id = get_path(contents_xml, 'xml.MediaId');
         obj.thumb_media_id = get_path(contents_xml, 'xml.ThumbMediaId');
         return rpl_video(obj);
      case 'shortvideo':
         obj.media_id = get_path(contents_xml, 'xml.MediaId');
         obj.thumb_media_id = get_path(contents_xml, 'xml.ThumbMediaId');
         return rpl_shortvideo(obj);
      case 'location':
         obj.scale = get_path(contents_xml, 'xml.Scale');
         obj.label = get_path(contents_xml, 'xml.Label');
         obj.A = get_path(contents_xml, 'xml.Location_X');
         obj.L = get_path(contents_xml, 'xml.Location_Y');
         return rpl_location(obj);
      case 'link':
         obj.title = get_path(contents_xml, 'xml.Title');
         obj.description = get_path(contents_xml, 'xml.Description');
         obj.url = get_path(contents_xml, 'xml.Url');
         return rpl_link(obj);
   }
   return 'success';
}

function rpl_text(chat_obj) {
   let text = chat_obj.text;
   if (!text || !text.value) return 'success';
   if (text.value === '时间') {
      return chatbot_make_contents(
         chat_obj.fromuser.value,
         chat_obj.touser.value,
         chat_obj.timestamp,
         'text',
         `现在是 ${new Date().toString()}`
      );
   }
   if (text.value.startsWith('计算')) {
      return chatbot_make_contents(
         chat_obj.fromuser.value,
         chat_obj.touser.value,
         chat_obj.timestamp,
         'text',
         `结果是 ${new i_chat.Calculator().calculate(text.value.substring(2))}`
      );
   }
   return 'success';
}

function rpl_image(chat_obj) {
   return 'success';
}

function rpl_voice(chat_obj) {
   return 'success';
}

function rpl_video(chat_obj) {
   return 'success';
}

function rpl_shortvideo(chat_obj) {
   return 'success';
}

function rpl_location(chat_obj) {
   return 'success';
}

function rpl_link(chat_obj) {
   return 'success';
}


module.exports = {
   chat,
};