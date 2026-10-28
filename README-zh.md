# 纸艺卡丁车（Kâğıt Kart）

在线游戏：[https://yanchuan.online/kart/](https://yanchuan.online/kart/)

双击 [开始游戏.cmd](开始游戏.cmd) 启动；脚本会在 8765–8775 之间选择可用端口并打开浏览器。也可运行 `python tools/serve.py 8765`，访问 `http://127.0.0.1:8765/`。需要 Python 3 和支持 WebGL2 的现代浏览器。运行游戏不需要联网，也不需要运行 `npm install`。

## 内容与操作

- 大奖赛：依次挑战雏菊草原、海峡之夜、冰川隘口、写字台，累计积分进入领奖台。
- 单场比赛：选择一条赛道与七位车手竞速；计时赛：挑战个人纪录和上次最佳成绩的幽灵。每种模式均有 80 g、120 g、200 g 三个速度级别。
- 八位角色、八种道具、三级漂移加速、跳台特技、尾流与程序生成的纸艺场景和音效均保留。
- 键盘：`W`/`↑` 加速，`S`/`↓` 刹车，`A`/`D` 或 `←`/`→` 转向，`Space` 漂移，`X`/`E` 使用道具，`Esc`/`P` 暂停，`M` 静音，`F` 全屏，计时赛中 `R` 重开。
- 手机：屏幕上的方向、油门、漂移、道具、刹车和暂停按钮；支持竖屏、横屏及同时按键。首次比赛显示操作提示。

本地启动时，存档和设置保存在浏览器本地存储。部署到 `/kart/` 后，设置、计时赛成绩和幽灵回放会同步到服务器独立的 SQLite 数据库，同时保留本地副本供断网使用。云存档按浏览器会话 Cookie 隔离；换设备或清除 Cookie 后不会自动找回原会话。手机触控已用移动浏览器环境验证。

## 开发说明

本项目为原创开发，使用 AI 编程助手辅助实现。项目采用模块化架构设计，包含核心引擎、赛道系统、AI、道具系统、音效、UI、场景装饰、特效、角色和过场动画等模块。

主要技术特点：
- 完全代码生成的纸艺视觉效果
- WebAudio 程序生成的音效和音乐
- 无外部资源依赖，仅使用 Three.js 0.186.0
- 模块化代码结构，便于维护和扩展

## 云端部署

`server/index.mjs` 使用 Node.js 24 内置 SQLite，监听 `127.0.0.1:8790`，仅开放 `/kart/` 游戏资源和 `/kart/api/storage`。数据目录通过 `KART_DATA_DIR` 设置，应与代码分离并定期备份；服务器示例为 `/home/ubuntu/kagit-kart-data`。`KART_ORIGIN` 必须与正式 HTTPS 域名一致。`deploy/kart.service` 和 `deploy/nginx-location.conf` 分别是独立 systemd 服务和既有 Nginx HTTPS 站点内的路径代理配置。先备份原 Nginx 配置，再加入 location，执行 `nginx -t` 验证后重载，不替换原站点。

浏览器首次访问会获得仅限 `/kart/` 的 HttpOnly、SameSite Cookie。写入请求校验 Origin、键名和体积；每个会话最多 100 条记录。`npm run test:storage` 验证服务重启持久化、会话隔离、跨站写入和文件路径限制。云端连接失败时游戏仍可使用浏览器本地存档，待下一次访问重试同步。

正式部署：`/home/ubuntu/kagit-kart` 保存游戏代码，`/home/ubuntu/kagit-kart-data/kart.sqlite` 保存存档；systemd 服务为 `kart.service`，已启用开机启动。Nginx 现有站点增加 `/kart/` 代理，原配置备份位于 `/var/backups/kart/daily-reflection-20261024T092452Z.conf`。已在线验证健康检查、桌面和手机加载、存档读写与服务重启持久化、会话隔离、跨站写入拒绝及原日记站点健康检查。

## 验证

在本机 Edge / NVIDIA RTX 4060 上，`npm run test:race` 自动完成四条赛道各三圈，均进入结果页，无控制台错误或赛道布局警告；结果见上层 `evidence/race-tests.jsonl`。`npm run test:local` 验证真实键盘和手机竖/横屏触控，`npm run test:modes` 验证真实计时赛成绩和幽灵存档、四章大奖赛流程、全屏及设置持久化。大奖赛流程测试使用测试 API 快速结束各章，完整实际完赛由四赛道测试覆盖。测试需要本机安装 Node.js、Playwright 和 Edge；游戏本身不需要它们。