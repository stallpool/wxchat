function tokenize(text, stops) {
   if (!text) return [];
   let output = [];
   let n = text.length;
   let last = 0;
   if (!stops) stops = common_stops;
   for (let i = 0; i < n; i++) {
      let ch = text.charAt(i);
      let ch_code = ch.charCodeAt(0);
      if (stops.indexOf(ch) >= 0) {
         if (last < i) {
            output.push(text.substring(last, i));
         }
         output.push(ch);
         last = i + 1;
      } else if (ch_code < 0 || ch_code > 127) {
         // hello你好 ==> [hello, 你, 好]
         if (last < i) {
            output.push(text.substring(last, i));
         }
         // multiple lang
         output.push(ch);
         last = i + 1;
      }
   }
   if (last < n) output.push(text.substring(last));
   return output.map((x) => ({ value: x }));
}

const common_stops = [
   '~', '`', '!', '@', '#', '$', '%', '^', '&', '*', '(', ')',
   '-', /*'_'*/, '=', '+', '{', '}', '[', ']', '\\', '|', ':', ';',
   '"', '\'', ',', '.', '<', '>', '/', '?', ' ', '\t', '\r', '\n'
];

module.exports = {
   common_stops,
   tokenize,
};