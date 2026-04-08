# 📥 视频网站下载助手 - 使用说明

## 🚀 安装步骤

### 1. 安装用户脚本管理器
- **Tampermonkey** (推荐): https://www.tampermonkey.net/
- **Violentmonkey**: https://violentmonkey.github.io/
- **Greasemonkey**: 仅Firefox https://www.greasespot.net/

### 2. 安装脚本
1. 打开 Tampermonkey 扩展
2. 点击左侧菜单 `+` 或 `添加新脚本`
3. 复制 `视频网站下载助手.user.js` 的全部内容
4. 粘贴并保存 (Ctrl+S)

### 3. 使用
访问支持的视频网站，页面右下角会出现下载助手面板。

---

## ✅ 支持的平台

| 平台 | 网址 | 状态 |
|------|------|------|
| 爱奇艺 | iqiyi.com | ✅ |
| 爱奇艺国际 | iq.com | ✅ |
| 优酷 | youku.com | ✅ |
| 芒果TV | mgtv.com | ✅ |
| 腾讯视频 | qq.com | ✅ |
| 哔哩哔哩 | bilibili.com | ✅ |
| 西瓜视频 | xigua.com / ixigua.com | ✅ |
| 1905电影网 | 1905.com | ✅ |

---

## 🎯 功能说明

### 界面按钮
- **⬇️ 下载当前视频**: 直接下载当前页面播放的视频
- **📋 复制地址**: 复制视频直链到剪贴板
- **🔄 刷新信息**: 重新获取视频信息
- **🛠️ YT-DLP命令**: 复制 yt-dlp 下载命令（需安装yt-dlp）

### 特殊功能 - B站多画质选择
B站用户可以查看并选择不同画质的视频进行下载。

### YT-DLP 推荐
如需更好的下载体验，推荐安装 [yt-dlp](https://github.com/yt-dlp/yt-dlp)：
```bash
# Windows (需PowerShell 7+)
iwr -OutFile yt-dlp.exe https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe

# 使用示例
.\yt-dlp "视频链接"
.\yt-dlp -f "bestvideo+bestaudio/best" "视频链接"
```

---

## ⚠️ 注意事项

1. **部分视频可能无法下载**: 由于版权保护，部分视频可能有下载限制
2. **刷新页面后重试**: 如果获取不到视频地址，请播放视频后点击刷新
3. **B站需播放视频**: B站需要先点击播放视频才能获取下载地址
4. **M3U8流媒体**: 部分视频使用流媒体协议可能无法直接下载

---

## 🔧 技术原理

脚本通过以下方式获取视频信息：
1. 从页面DOM提取视频元素
2. 调用各平台公开API获取视频直链
3. 使用Tampermonkey的GM_download进行下载

---

## 📝 更新日志

### v1.0.0 (2026-04-08)
- 初始版本
- 支持8大主流视频平台
- B站多画质选择
- YT-DLP命令生成
