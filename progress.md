Original prompt: 使用图片中适用的 Skill 和 REA 复刻 X 视频中的纸艺卡丁车游戏，及时展示效果；电脑键盘为主，同时保留手机触控。

## 验收与执行
- 原作已确认：BurakErdemci/kagit-kart，提交 da100b21ae1c5332d2843d21a9bb7b68b97e9c2a。
- 使用原作完整源码保留 4 个章节、8 个角色、3 种模式、道具、漂移、幽灵及纸艺场景。
- 本地化中文，依赖本地保存，提供一键启动。
- 检查四步菜单、键盘驾驶/漂移/道具/暂停、触控、多赛道完赛及结果、无运行错误。
- 已安装并读取 game-developer、game-feel、game-ui-ux、threejs-game-ui-designer、develop-web-game；REA 已安装。
- 原作未附 LICENSE；保留作者及来源，仅本地交付，未执行外部发布。

## 完成情况
- 已比对视频和原作，并使用 REA 记录发布页面与 80 个脚本的静态分析证据。
- 原作完整源码运行；Three.js 0.186.0 本地化，游戏无外部请求；中文版菜单、章节、角色、HUD、字幕和纸页文字已完成。
- 四条赛道各三圈均真实跑完，0 控制台错误及布局警告；键盘加速、转向、漂移、道具、暂停已通过浏览器操作验证。
- 手机竖屏/横屏均已截图检查，触控同时加速转向、漂移、道具、暂停正常。
- 计时赛真实完赛并保存成绩/幽灵，刷新后读取；大奖赛四章结果、积分及领奖台流程通过；全屏、静音持久化通过。
- `develop-web-game` 的 Playwright 客户端已运行并保存截图及游戏状态；交付说明见 `README-zh.md`。

## 云端发布阶段

- 用户要求上传其 GitHub，将存档放在其腾讯云服务器，并返回自有域名链接。
- 现有 `yanchuan.online` 根路径运行每日总结应用；游戏规划放在独立 `/kart/`，保留原站点和数据。
- 已加云端 SQLite 存档服务、浏览器本地回退、独立 systemd 与 Nginx 路由示例；存储隔离与重启持久化测试通过。
- 私有 GitHub 仓库 `xuquanjun1-lab/kagit-kart-zh` 已创建并推送；原作完整历史保留为 upstream。
- `test:storage`、`test:cloud`、`test:local`、`test:modes` 均通过。`develop-web-game` 客户端在 `/kart/` 完成实车截图，修复根 favicon 404 后无报错。
- 真实服务器部署与线上验证待 SSH 公钥授权；原项目无 LICENSE，版权风险应在交付中明确。
