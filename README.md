# wxchat

微信聊天机器人框架

### 如何使用

1. 部署一台有公网IP的机器，假设IP是1.2.3.4
2. `ssh` 登录这台机器，并使用git下载项目代码： `git clone https://github.com/stallpool/wxchat`
3. 确定机器上安装了NodeJS ( https://nodejs.org/en/downloads )，在项目目录下进行 `npm install`
4. 在微信公众号开发者项里，得到 `appid`；在服务配置里填写 `URL` 为 `http://1.2.3.4/api/wxchat` 并设置自己的 `token` 和 `encodingAESKey`，文本传输请选择安全模式（消息传输时会加密）；此时点击确认会报Token验证错误
5. 在配置好的机器上运行项目服务： `WXCHAT_PORT=80 WXCHAT_HOST=0.0.0.0 WEIXIN_APPID=<appid> WEIXIN_TOKEN=<token> WEIXIN_ENCODINGAESKEY=<encoded_aes_key> nohup node server/index.js > server/running.log 2>&1 &`
6. 在微信公众号刚才报错的页面点击“确定”完成公众号和项目服务的连接
7. 用一个微信号关注目标微信公众号，并发送“时间”；该微信号返回当前时间表示 Chatbot 成功

### 范例

- “时间”: 如果微信号向公众号发送“时间”文本，公众号回复当前时间
- “计算”: 如果微信号向公众号发送“计算”和算式文本，比如 `计算 sin(pi/2) + sqrt(4*(3+1) + 9)` ，公众号回复算式计算结果
