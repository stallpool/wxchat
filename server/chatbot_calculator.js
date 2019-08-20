const priority = {
   '+': 5,
   '-': 5,
   '*': 6,
   '/': 6,
   '^': 7,
};

class Calculator {
   constructor() {}

   calculate(expression) {
      let tokens = [{value: ''}];
      let state = 0; // 0 = start; 1 = int; 2 = float;
      for (let i = 0, n = expression.length; i < n; i++) {
         let ch = expression.charAt(i);
         let last = tokens[tokens.length-1];
         if (ch >= '0' && ch <= '9') {
            last.value += ch;
            last.number = true;
            if (state === 0) state = 1;
         } else if (ch === '.') {
            if (last.value === 0) last.value = '0.'; else last.value += ch;
            last.number = true;
            state = 2;
         } else if (['+', '-', '*', '/', '^', '(', ')'].includes(ch)) {
            tokens.push({value: ch});
            tokens.push({value: ''});
            state = 0;
         } else if ([' ', '\t', '\n', '\r'].includes(ch)) {
         } else {
            let op = '';
            while(i < n) {
               if (/[0-9. \t\n\r+\-*\/\^()]/.test(ch)) {
                  i--; break;
               }
               op += ch;
               ch = expression.charAt(++i);
            }
            if (op) tokens.push({value: op});
         }
      } // for
      tokens = tokens.filter((x) => !!x.value);
      tokens.forEach((x) => {
         if (x.number) {
            x.value = parseFloat(x.value);
         } else if (x.value === 'pi') {
            x.number = true;
            x.value = Math.PI;
         } else if (x.value === 'e') {
            x.number = true;
            x.value = Math.E;
         }
      });

      let number_stack = [], op_stack = [];
      for (let i = 0, n = tokens.length; i < n; i++) {
         let token = tokens[i];
         if (token.number) {
            number_stack.push(token.value);
         } else if (token.value === ')') {
            let last_op = op_stack[op_stack.length-1];
            while (last_op && last_op !== '(') {
               act_calc(last_op);
               last_op = op_stack[op_stack.length-1]
            }
            let num = number_stack.pop();
            if (num !== '(') {
               number_stack.pop();
               number_stack.push(num);
            }
            op_stack.pop();
         } else {
            if (token.value === '(') number_stack.push(token.value);
            let last_op = op_stack[op_stack.length-1];
            if (last_op && last_op !== '(' && token.value !== '(') {
               let p1 = priority[last_op] || 9;
               let p2 = priority[token.value] || 9;
               if (p1 >= p2) act_calc(last_op);
            }
            op_stack.push(token.value);
         }
      } // for
      while (op_stack.length) act_calc(op_stack[op_stack.length-1]);
      let r = number_stack.pop();
      if (!r && r !== 0) r = 'NaN';
      return r;

      function act_calc(op) {
         let a, b;
         switch(op) {
            case '+':
               a = number_stack.pop();
               b = number_stack.pop();
               if (b === '(') {
                  number_stack.push('(');
                  b = 0;
               }
               number_stack.push(b+a);
               break;
            case '-':
               a = number_stack.pop();
               b = number_stack.pop();
               if (b === '(') {
                  number_stack.push('(');
                  b = 0;
               }
               number_stack.push(b-a);
               break;
            case '*':
               a = number_stack.pop();
               b = number_stack.pop();
               number_stack.push(b*a);
               break;
            case '/':
               a = number_stack.pop();
               b = number_stack.pop();
               number_stack.push(b/a);
               break;
            case '^':
               a = number_stack.pop();
               b = number_stack.pop();
               number_stack.push(Math.pow(b, a));
               break;
            case 'sqrt':
               a = number_stack.pop();
               number_stack.push(Math.sqrt(a));
               break;
            case 'sin':
               a = number_stack.pop();
               number_stack.push(Math.sin(a));
               break;
            case 'cos':
               a = number_stack.pop();
               number_stack.push(Math.cos(a));
               break;
            case 'tan':
               a = number_stack.pop();
               number_stack.push(Math.tan(a));
               break;
            case 'abs':
               a = number_stack.pop();
               number_stack.push(Math.abs(a));
               break;
            case 'log':
               a = number_stack.pop();
               number_stack.push(Math.log(a));
               break;
            case 'floor':
               a = number_stack.pop();
               number_stack.push(Math.floor(a));
               break;
            case 'ceil':
               a = number_stack.pop();
               number_stack.push(Math.ceil(a));
               break;
         }
         op_stack.pop();
      }
   }
}

module.exports = {
   Calculator,
}

if (require.main === module) {
   let exp = process.argv[2];
   //exp = 'sin(pi/2) + sqrt( 4+4*3 )';
   console.log(new Calculator().calculate(exp));
}