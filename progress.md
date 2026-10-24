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

## 临时公网预览（2026-10-24）

- 用户要求先交付可访问链接；通过 Cloudflare Quick Tunnel 暴露独立游戏服务 127.0.0.1:8791，未暴露目录或其他本机应用。
- 地址：https://bio-agreements-merit-outreach.trycloudflare.com/kart/ 。依赖当前电脑与 tunnel/server 进程运行，不保证永久可用。
- 此预览存档位于本机 data/preview/kart.sqlite，尚未迁移腾讯云；正式域名部署仍被 SSH 登录授权阻塞。
- 已通过公网健康检查、桌面/手机浏览器加载、会话隔离、存档写入与刷新恢复；develop-web-game 客户端通过公网进入实车比赛并验证加速、转向及漂移，截图与状态保存在 tools/out/skill-public-preview/，无控制台或资源错误。
- tools/verify-cloud.mjs 现支持 KART_TEST_URL，以复用相同验证检查真实部署。

## 正式部署完成（2026-10-24）

- 通过 screenshot 技能检查桌面后，直接操作已登录的 OrcaTerm 登记部署公钥。旧密钥需要口令，重新生成 kart_cloud 后完成 SSH 登录；私钥仅留在本机 .ssh 中。
- 游戏已上传至腾讯云 43.129.201.110 的 /home/ubuntu/kagit-kart；独立 kart.service 监听 127.0.0.1:8790，已设置开机启动。
- 正式链接：https://yanchuan.online/kart/ 。云存档数据库 /home/ubuntu/kagit-kart-data/kart.sqlite，目录权限 0700。正式部署不依赖本机临时预览。
- 修改前备份 Nginx 至 /var/backups/kart/daily-reflection-20261024T092452Z.conf，语法验证成功后 reload，仅增加 /kart 跳转及 /kart/ 代理。
- 正式域名桌面/手机加载、云存档读写/刷新恢复、不同会话隔离均通过，浏览器无页面或资源错误。线上重启 kart 后存档仍可读取；跨站写入 403、私有源码路径 404、/kart 跳转 308 均通过。原日记应用 /api/health 和 nginx、daily-reflection 服务均正常。
