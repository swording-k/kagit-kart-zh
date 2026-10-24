# 纸艺卡丁车（Kâğıt Kart）本地中文版

双击 [开始游戏.cmd](开始游戏.cmd) 启动；脚本会在 8765–8775 之间选择可用端口并打开浏览器。也可运行 `python tools/serve.py 8765`，访问 `http://127.0.0.1:8765/`。需要 Python 3 和支持 WebGL2 的现代浏览器。运行游戏不需要联网，也不需要运行 `npm install`。

## 内容与操作

- 大奖赛：依次挑战雏菊草原、海峡之夜、冰川隘口、写字台，累计积分进入领奖台。
- 单场比赛：选择一条赛道与七位车手竞速；计时赛：挑战个人纪录和上次最佳成绩的幽灵。每种模式均有 80 g、120 g、200 g 三个速度级别。
- 八位角色、八种道具、三级漂移加速、跳台特技、尾流与程序生成的纸艺场景和音效均保留。
- 键盘：`W`/`↑` 加速，`S`/`↓` 刹车，`A`/`D` 或 `←`/`→` 转向，`Space` 漂移，`X`/`E` 使用道具，`Esc`/`P` 暂停，`M` 静音，`F` 全屏，计时赛中 `R` 重开。
- 手机：屏幕上的方向、油门、漂移、道具、刹车和暂停按钮；支持竖屏、横屏及同时按键。首次比赛显示操作提示。

本地启动时，存档和设置保存在浏览器本地存储。部署到 `/kart/` 后，设置、计时赛成绩和幽灵回放会同步到服务器独立的 SQLite 数据库，同时保留本地副本供断网使用。云存档按浏览器会话 Cookie 隔离；换设备或清除 Cookie 后不会自动找回原会话。手机触控已用移动浏览器环境验证。

## 来源与实现

参考视频：[X 上的纸艺卡丁车展示](https://x.com/jackson77li/status/2111969961875042425?s=46)。进一步定位到原作者 Burak Erdemci 的[完整项目](https://github.com/BurakErdemci/kagit-kart)，本地基线提交为 `da100b21ae1c5332d2843d21a9bb7b68b97e9c2a`。本交付基于公开源码做本地中文化与离线适配，**不是**从视频反编译出的原始代码，也不是独立重写。原项目未附许可证；保留原作者、README 和架构文档。未经权利人许可，重新发布或商用存在版权风险。

原作的详细模块契约见 [ARCHITECTURE.md](ARCHITECTURE.md)。主要实现路径：`src/main.js` 管理状态机与比赛生命周期；`src/kart/` 管理车辆物理、碰撞和幽灵；`src/track/`、`src/scenery/` 生成赛道及布景；`src/ai/`、`src/items/`、`src/race/` 负责 AI、道具和比赛规则；`src/render/`、`src/characters/`、`src/cinematics/` 实现纸艺画面；`src/ui/` 和 `src/input/` 实现菜单、HUD 与输入；`src/audio/` 程序合成音效。纹理、模型、音乐和字体形状主要在运行时生成，唯一渲染库 Three.js 0.186.0 已放在 `vendor/`，其许可证见 `vendor/THREE-LICENSE.txt`。

本地改动包括中文菜单、角色和赛道名称、操作说明、HUD、动画字幕及书页文字；`index.html` 改用本地 import map；`tools/serve.py` 提供原发布环境的 HTML 包装；`tools/start.ps1` 和批处理文件提供启动入口；`tools/verify-*.mjs` 提供验收脚本。保留内部角色和赛道 ID，避免破坏存档、资源生成和游戏逻辑。

## 云端部署

`server/index.mjs` 使用 Node.js 24 内置 SQLite，监听 `127.0.0.1:8790`，仅开放 `/kart/` 游戏资源和 `/kart/api/storage`。数据目录通过 `KART_DATA_DIR` 设置，应与代码分离并定期备份；服务器示例为 `/home/ubuntu/kagit-kart-data`。`KART_ORIGIN` 必须与正式 HTTPS 域名一致。`deploy/kart.service` 和 `deploy/nginx-location.conf` 分别是独立 systemd 服务和既有 Nginx HTTPS 站点内的路径代理配置。先备份原 Nginx 配置，再加入 location，执行 `nginx -t` 验证后重载，不替换原站点。

浏览器首次访问会获得仅限 `/kart/` 的 HttpOnly、SameSite Cookie。写入请求校验 Origin、键名和体积；每个会话最多 100 条记录。`npm run test:storage` 验证服务重启持久化、会话隔离、跨站写入和文件路径限制。云端连接失败时游戏仍可使用浏览器本地存档，待下一次访问重试同步。

## REA 与 Skill

已安装并使用 REA（`reverse-engineer-anything`）观察发布页面及浏览器脚本包。证据位于上层 `evidence/rea-published-bundle.json`、`evidence/rea-original-screenshot.json`；网页脚本分析证据 ID 为 `ev_cb04de10dc9aea0712e34dc744bc982a93300ddd74c79b50ad217d14c4e0e031`，观察到 80 个脚本并成功解析 80 个。REA 的静态观察不能证明运行时或服务器内部行为，因此架构依据公开源码与本地实测确认。

依照提供的 Skill 截图，安装并调用了 `game-developer`、`game-feel`、`game-ui-ux`、`threejs-game-ui-designer`、`develop-web-game`。它们用于玩法和输入审查、UI 与触控布局检查、Playwright 截图/状态验证；REA Skill 用于逆向观察。Skill 仅安装在当前 Codex 环境，不作为游戏运行依赖。

## 验证

在本机 Edge / NVIDIA RTX 4060 上，`npm run test:race` 自动完成四条赛道各三圈，均进入结果页，无控制台错误或赛道布局警告；结果见上层 `evidence/race-tests.jsonl`。`npm run test:local` 验证真实键盘和手机竖/横屏触控，`npm run test:modes` 验证真实计时赛成绩和幽灵存档、四章大奖赛流程、全屏及设置持久化。大奖赛流程测试使用测试 API 快速结束各章，完整实际完赛由四赛道测试覆盖。测试需要本机安装 Node.js、Playwright 和 Edge；游戏本身不需要它们。
