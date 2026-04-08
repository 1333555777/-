// ==UserScript==
// @name         视频网站下载助手
// @namespace    video-downloader
// @version      1.0.0
// @description  支持多平台视频网站下载：爱奇艺、优酷、芒果TV、腾讯视频、B站、西瓜视频、1905电影网
// @author       VideoDownloader
// @match        *://*.iqiyi.com/*
// @match        *://*.iq.com/*
// @match        *://*.youku.com/*
// @match        *://*.mgtv.com/*
// @match        *://*.qq.com/*
// @match        *://*.bilibili.com/*
// @match        *://*.xixi.video/*
// @match        *://*.1905.com/*
// @match        *://*.xigua.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_setClipboard
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      *
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        panelColor: '#1890ff',
        panelBg: 'rgba(24, 144, 255, 0.95)',
        position: 'right',
        autoDetect: true
    };

    // ==================== 平台检测 ====================
    const PLATFORMS = {
        'iqiyi': {
            name: '爱奇艺',
            hosts: ['iqiyi.com'],
            paths: ['/v_'],
            videoSelector: '#flashbox video, #player video, .episode-tab-item video',
            apiPatterns: [
                /tvid=([^&]+)/,
                /"tvId":"(\d+)"/,
                /"vid":"([^"]+)"/,
                /vid[:\s=]+["']?([^"'&\s]+)/
            ]
        },
        'iq': {
            name: '爱奇艺国际',
            hosts: ['iq.com'],
            paths: [],
            videoSelector: '#player video, .player-wrapper video',
            apiPatterns: [
                /data-player-vid="([^"]+)"/,
                /"vid":"([^"]+)"/,
                /vid[:\s=]+["']?([^"'&\s]+)/
            ]
        },
        'youku': {
            name: '优酷',
            hosts: ['youku.com'],
            paths: ['/v_show/id_'],
            videoSelector: '#player video, .player-container video',
            apiPatterns: [
                /videoId2['":\s=]+["']?([^"'&\s]+)/,
                /"vid":"?([^"']+)"?/,
                /vid[:\s=]+["']?([^"'&\s]+)/
            ]
        },
        'mgtv': {
            name: '芒果TV',
            hosts: ['mgtv.com'],
            paths: ['/b/', '/l/'],
            videoSelector: '#player video, .player-wrapper video',
            apiPatterns: [
                /data-bid="(\d+)"/,
                /"bid":(\d+)/,
                /"cid":(\d+)/
            ]
        },
        'qq': {
            name: '腾讯视频',
            hosts: ['qq.com'],
            paths: ['/v center/', '/v.play.svpn/'],
            videoSelector: '#player video, .txv_video video',
            apiPatterns: [
                /vid=([^&]+)/,
                /"vid":"?([^"']+)"?/,
                /"cid":"?([^"']+)"?/
            ]
        },
        'bilibili': {
            name: '哔哩哔哩',
            hosts: ['bilibili.com'],
            paths: ['/video/BV', '/video/av'],
            videoSelector: '#bilibiliPlayer video, .bilibili-player video',
            apiPatterns: [
                /\/video\/(BV[\w]+|av\d+)/i,
                /"bvid":"(BV[\w]+)"/i,
                /"aid":(\d+)/
            ],
            useApi: true // B站使用官方API
        },
        '1905': {
            name: '1905电影网',
            hosts: ['1905.com'],
            paths: ['/v/', '/play/'],
            videoSelector: '#player video, .video-wrapper video',
            apiPatterns: [
                /content_id[=:\s]+["']?(\d+)/i,
                /"id":(\d+)/
            ]
        },
        'xigua': {
            name: '西瓜视频',
            hosts: ['xigua.com', 'ixigua.com'],
            paths: ['/video/', '/live/'],
            videoSelector: '#player video, .player-wrapper video',
            apiPatterns: [
                /video\/(\d+)/,
                /"videoId":"?([^"']+)"?/,
                /"id":"?(\d+)"?/
            ]
        }
    };

    // 检测当前平台
    function detectPlatform() {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;

        for (const [key, platform] of Object.entries(PLATFORMS)) {
            const hostMatch = platform.hosts.some(host => hostname.includes(host));
            if (hostMatch) {
                // 检查路径模式
                if (platform.paths.length === 0 || platform.paths.some(p => pathname.includes(p))) {
                    return key;
                }
            }
        }
        return null;
    }

    // ==================== 工具函数 ====================
    function getVideoInfo() {
        const platform = detectPlatform();
        if (!platform) {
            return { error: '不支持的网站' };
        }

        const platformInfo = PLATFORMS[platform];
        let videoData = {
            platform: platform,
            platformName: platformInfo.name,
            title: '',
            url: window.location.href
        };

        // 获取标题
        videoData.title = getTitle(platform);

        // 获取视频ID
        videoData.videoId = extractVideoId(platform);

        // 获取视频URL
        videoData.videoUrl = getCurrentVideoUrl();

        return videoData;
    }

    function getTitle(platform) {
        const selectors = [
            'h1.video-title',
            '.video-title h1',
            '#video-title',
            '.title-wrap h1',
            '.episode-title',
            'h1[class*="title"]',
            '[class*="title"] h1',
            'meta[property="og:title"]',
            'title'
        ];

        for (const selector of selectors) {
            const el = document.querySelector(selector);
            if (el) {
                if (selector.includes('meta')) {
                    return el.getAttribute('content') || '';
                }
                const text = el.textContent?.trim();
                if (text && text.length > 2 && text.length < 200) {
                    return text;
                }
            }
        }

        return document.title.split('_')[0].split('-')[0].trim() || '未识别视频';
    }

    function extractVideoId(platform) {
        const platformInfo = PLATFORMS[platform];
        const url = window.location.href + ' ' + document.body.innerHTML;

        for (const pattern of platformInfo.apiPatterns) {
            const match = url.match(pattern);
            if (match && match[1]) {
                return match[1];
            }
        }

        // 备用：从URL路径提取
        const pathMatch = window.location.pathname.match(/\/(?:video\/|av|watch)([^\/\?]+)/i);
        if (pathMatch) {
            return pathMatch[1];
        }

        return 'unknown';
    }

    function getCurrentVideoUrl() {
        // 尝试从video元素获取当前播放URL
        const videos = document.querySelectorAll('video');
        for (const video of videos) {
            if (video.src && video.src.includes('http') && !video.src.includes('blob:')) {
                return video.src;
            }
            if (video.currentSrc && video.currentSrc.includes('http')) {
                return video.currentSrc;
            }
        }

        // 从source元素获取
        const sources = document.querySelectorAll('video source');
        for (const source of sources) {
            if (source.src && source.src.includes('http')) {
                return source.src;
            }
        }

        return '';
    }

    // ==================== B站专用API ====================
    async function getBilibiliInfo() {
        try {
            const bvidMatch = window.location.pathname.match(/\/video\/(BV[\w]+)/i);
            const aidMatch = window.location.pathname.match(/\/video\/(av\d+)/i);

            let bvid = bvidMatch ? bvidMatch[1].toUpperCase() : null;
            const aid = aidMatch ? aidMatch[1] : null;

            // 如果是av号，转换为BV号
            if (!bvid && aid) {
                try {
                    const response = await fetch(`https://api.bilibili.com/x/web-interface/view?aid=${aid.replace('av', '')}`);
                    const data = await response.json();
                    if (data.code === 0 && data.data) {
                        bvid = data.data.bvid;
                    }
                } catch (e) {
                    console.error('B站API转换失败:', e);
                }
            }

            if (!bvid) return null;

            // 获取视频信息
            const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`);
            const result = await response.json();

            if (result.code !== 0) return null;

            const videoInfo = result.data;
            const cid = videoInfo.cid;

            // 获取播放链接
            const playUrlResponse = await fetch(`https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=80&fnval=0&fnver=0&fourk=1`);
            const playUrlResult = await playUrlResponse.json();

            if (playUrlResult.code !== 0 || !playUrlResult.data) return null;

            const playData = playUrlResult.data;
            const videos = playData.durl || [];

            if (videos.length > 0) {
                return {
                    title: videoInfo.title || 'B站视频',
                    videos: videos.map(v => ({
                        quality: v.order,
                        size: v.size,
                        url: v.url,
                        length: v.length
                    })),
                    cover: videoInfo.pic
                };
            }

            return null;
        } catch (e) {
            console.error('获取B站信息失败:', e);
            return null;
        }
    }

    // ==================== 下载功能 ====================
    async function downloadVideo(url, filename) {
        if (!url || url === '') {
            alert('无法获取视频地址，请刷新页面重试');
            return;
        }

        // 处理blob URL
        if (url.startsWith('blob:')) {
            alert('当前视频使用流媒体协议，无法直接下载');
            return;
        }

        try {
            // 使用GM_download
            GM_download({
                url: url,
                name: filename + '.mp4',
                saveAs: true,
                onload: function() {
                    showNotification('下载成功！', 'success');
                },
                onerror: function(error) {
                    console.error('下载失败:', error);
                    showNotification('下载失败: ' + (error.error || '未知错误'), 'error');
                }
            });
        } catch (e) {
            console.error('下载异常:', e);
            showNotification('下载失败: ' + e.message, 'error');
        }
    }

    async function copyVideoUrl(url) {
        if (!url) {
            alert('无法获取视频地址');
            return;
        }

        GM_setClipboard(url);
        showNotification('视频地址已复制到剪贴板', 'success');
    }

    // ==================== UI界面 ====================
    function createPanel() {
        // 添加样式
        GM_addStyle(`
            .vd-download-panel {
                position: fixed;
                top: 100px;
                ${CONFIG.position}: 20px;
                width: 320px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border-radius: 16px;
                box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                overflow: hidden;
                transition: all 0.3s ease;
            }
            .vd-download-panel.minimized {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                cursor: pointer;
            }
            .vd-download-panel.minimized .vd-panel-content {
                display: none;
            }
            .vd-panel-header {
                background: linear-gradient(135deg, ${CONFIG.panelBg} 0%, #0050b3 100%);
                padding: 16px;
                color: white;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .vd-panel-header h3 {
                margin: 0;
                font-size: 16px;
                font-weight: 600;
            }
            .vd-panel-header .vd-controls {
                display: flex;
                gap: 8px;
            }
            .vd-panel-header button {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            .vd-panel-header button:hover {
                background: rgba(255,255,255,0.3);
                transform: scale(1.1);
            }
            .vd-panel-content {
                padding: 16px;
                max-height: 500px;
                overflow-y: auto;
            }
            .vd-info-section {
                margin-bottom: 16px;
            }
            .vd-info-section label {
                display: block;
                color: #8892a0;
                font-size: 12px;
                margin-bottom: 6px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .vd-info-section .value {
                color: #e6edf3;
                font-size: 14px;
                word-break: break-all;
                background: rgba(255,255,255,0.05);
                padding: 10px 12px;
                border-radius: 8px;
                margin-bottom: 12px;
            }
            .vd-title-value {
                font-weight: 500;
                line-height: 1.5;
            }
            .vd-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 16px;
            }
            .vd-btn {
                padding: 12px 16px;
                border: none;
                border-radius: 10px;
                font-size: 14px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            .vd-btn-primary {
                background: linear-gradient(135deg, ${CONFIG.panelBg} 0%, #0050b3 100%);
                color: white;
                grid-column: span 2;
            }
            .vd-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(24, 144, 255, 0.4);
            }
            .vd-btn-secondary {
                background: rgba(255,255,255,0.1);
                color: #e6edf3;
            }
            .vd-btn-secondary:hover {
                background: rgba(255,255,255,0.2);
            }
            .vd-btn.success {
                background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
                color: white;
            }
            .vd-status {
                padding: 12px;
                border-radius: 8px;
                margin-top: 12px;
                font-size: 13px;
                display: none;
            }
            .vd-status.loading {
                display: block;
                background: rgba(24, 144, 255, 0.15);
                color: #69c0ff;
            }
            .vd-status.success {
                display: block;
                background: rgba(82, 196, 26, 0.15);
                color: #b7eb8f;
            }
            .vd-status.error {
                display: block;
                background: rgba(255, 78, 78, 0.15);
                color: #ff7875;
            }
            .vd-platform-badge {
                display: inline-block;
                background: ${CONFIG.panelBg};
                color: white;
                padding: 4px 10px;
                border-radius: 20px;
                font-size: 11px;
                font-weight: 600;
                margin-bottom: 12px;
            }
            .vd-quality-list {
                margin-top: 8px;
            }
            .vd-quality-item {
                background: rgba(255,255,255,0.05);
                padding: 10px 12px;
                border-radius: 8px;
                margin-bottom: 8px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .vd-quality-item:hover {
                background: rgba(255,255,255,0.1);
            }
            .vd-quality-item button {
                background: ${CONFIG.panelBg};
                border: none;
                color: white;
                padding: 6px 12px;
                border-radius: 6px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
            }
            .vd-quality-item button:hover {
                transform: scale(1.05);
            }
            .vd-quality-info {
                color: #e6edf3;
            }
            .vd-quality-info .size {
                color: #8892a0;
                font-size: 12px;
            }
            .vd-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 24px;
                border-radius: 10px;
                color: white;
                font-size: 14px;
                z-index: 1000000;
                animation: slideIn 0.3s ease;
            }
            .vd-notification.success {
                background: linear-gradient(135deg, #52c41a 0%, #389e0d 100%);
            }
            .vd-notification.error {
                background: linear-gradient(135deg, #ff4d4f 0%, #cf1322 100%);
            }
            .vd-notification.info {
                background: linear-gradient(135deg, ${CONFIG.panelBg} 0%, #0050b3 100%);
            }
            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
        `);

        // 创建面板HTML
        const panel = document.createElement('div');
        panel.className = 'vd-download-panel';
        panel.id = 'vd-download-panel';
        panel.innerHTML = `
            <div class="vd-panel-header">
                <h3>📥 视频下载助手</h3>
                <div class="vd-controls">
                    <button id="vd-minimize-btn" title="最小化">−</button>
                    <button id="vd-close-btn" title="关闭">×</button>
                </div>
            </div>
            <div class="vd-panel-content">
                <div class="vd-info-section">
                    <span class="vd-platform-badge" id="vd-platform-name">检测中...</span>
                    <label>视频标题</label>
                    <div class="value vd-title-value" id="vd-video-title">加载中...</div>
                </div>
                <div class="vd-info-section">
                    <label>视频ID</label>
                    <div class="value" id="vd-video-id">-</div>
                </div>
                <div class="vd-info-section" id="vd-quality-section" style="display:none;">
                    <label>清晰度选择</label>
                    <div class="vd-quality-list" id="vd-quality-list"></div>
                </div>
                <div class="vd-status" id="vd-status"></div>
                <div class="vd-buttons">
                    <button class="vd-btn vd-btn-primary" id="vd-download-btn">
                        <span>⬇️</span> 下载当前视频
                    </button>
                    <button class="vd-btn vd-btn-secondary" id="vd-copy-url-btn">
                        <span>📋</span> 复制地址
                    </button>
                    <button class="vd-btn vd-btn-secondary" id="vd-refresh-btn">
                        <span>🔄</span> 刷新信息
                    </button>
                    <button class="vd-btn vd-btn-secondary" id="vd-open-ytf-btn">
                        <span>🛠️</span> YT-DLP下载
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // 绑定事件
        bindPanelEvents(panel);

        return panel;
    }

    function bindPanelEvents(panel) {
        // 最小化
        document.getElementById('vd-minimize-btn').addEventListener('click', () => {
            panel.classList.toggle('minimized');
        });

        panel.addEventListener('click', (e) => {
            if (panel.classList.contains('minimized') && e.target === panel) {
                panel.classList.remove('minimized');
            }
        });

        // 关闭
        document.getElementById('vd-close-btn').addEventListener('click', () => {
            panel.style.display = 'none';
            // 保存状态
            GM_setValue('panelVisible', false);
        });

        // 下载按钮
        document.getElementById('vd-download-btn').addEventListener('click', async () => {
            const info = getVideoInfo();
            if (info.platform === 'bilibili') {
                // B站特殊处理
                const bilibiliInfo = await getBilibiliInfo();
                if (bilibiliInfo && bilibiliInfo.videos.length > 0) {
                    const video = bilibiliInfo.videos[0];
                    const filename = sanitizeFilename(bilibiliInfo.title);
                    downloadVideo(video.url, filename);
                } else {
                    showNotification('获取B站视频失败', 'error');
                }
            } else {
                const videoUrl = getCurrentVideoUrl();
                if (videoUrl) {
                    const filename = sanitizeFilename(info.title);
                    downloadVideo(videoUrl, filename);
                } else {
                    showNotification('无法获取视频地址，请播放视频后重试', 'error');
                }
            }
        });

        // 复制URL
        document.getElementById('vd-copy-url-btn').addEventListener('click', async () => {
            const info = getVideoInfo();
            let url = getCurrentVideoUrl();

            if (info.platform === 'bilibili') {
                const bilibiliInfo = await getBilibiliInfo();
                if (bilibiliInfo && bilibiliInfo.videos.length > 0) {
                    url = bilibiliInfo.videos[0].url;
                }
            }

            copyVideoUrl(url || window.location.href);
        });

        // 刷新
        document.getElementById('vd-refresh-btn').addEventListener('click', () => {
            updatePanelInfo();
        });

        // YT-DLP
        document.getElementById('vd-open-ytf-btn').addEventListener('click', () => {
            const url = window.location.href;
            const title = document.getElementById('vd-video-title')?.textContent || 'video';
            const command = `yt-dlp -o "${sanitizeFilename(title)}.%(ext)s" "${url}"`;
            GM_setClipboard(command);
            showNotification('YT-DLP命令已复制到剪贴板', 'success');
        });
    }

    function updatePanelInfo() {
        const info = getVideoInfo();
        const platformBadge = document.getElementById('vd-platform-name');
        const titleEl = document.getElementById('vd-video-title');
        const idEl = document.getElementById('vd-video-id');

        if (info.error) {
            platformBadge.textContent = '❌ 不支持';
            titleEl.textContent = info.error;
            idEl.textContent = '-';
            return;
        }

        platformBadge.textContent = '✅ ' + info.platformName;
        titleEl.textContent = info.title;
        idEl.textContent = info.videoId;

        // 如果是B站，加载清晰度列表
        if (info.platform === 'bilibili') {
            loadBilibiliQualityList();
        }
    }

    async function loadBilibiliQualityList() {
        const qualitySection = document.getElementById('vd-quality-section');
        const qualityList = document.getElementById('vd-quality-list');
        const status = document.getElementById('vd-status');

        qualitySection.style.display = 'block';
        status.className = 'vd-status loading';
        status.textContent = '正在获取B站视频信息...';
        status.style.display = 'block';

        try {
            const bilibiliInfo = await getBilibiliInfo();

            if (bilibiliInfo && bilibiliInfo.videos.length > 0) {
                status.className = 'vd-status success';
                status.textContent = '获取成功！';

                qualityList.innerHTML = bilibiliInfo.videos.map((video, index) => {
                    const sizeMB = (video.size / (1024 * 1024)).toFixed(2);
                    return `
                        <div class="vd-quality-item">
                            <div class="vd-quality-info">
                                <div>画质 #${video.quality}</div>
                                <div class="size">大小: ${sizeMB} MB | 时长: ${formatTime(video.length)}</div>
                            </div>
                            <button onclick="downloadVideo('${video.url}', '${sanitizeFilename(bilibiliInfo.title)}_q${video.quality}')">
                                下载
                            </button>
                        </div>
                    `;
                }).join('');
            } else {
                status.className = 'vd-status error';
                status.textContent = '获取视频失败，请刷新页面重试';
            }
        } catch (e) {
            status.className = 'vd-status error';
            status.textContent = '错误: ' + e.message;
        }
    }

    function showNotification(message, type = 'info') {
        // 移除旧通知
        const old = document.querySelector('.vd-notification');
        if (old) old.remove();

        const notification = document.createElement('div');
        notification.className = `vd-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // ==================== 工具函数 ====================
    function sanitizeFilename(name) {
        return name.replace(/[\\/:*?"<>|]/g, '_').substring(0, 100);
    }

    function formatTime(seconds) {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}` : `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ==================== 初始化 ====================
    function init() {
        // 检查是否已关闭
        const isVisible = GM_getValue('panelVisible', true);
        if (!isVisible) return;

        // 创建面板
        const panel = createPanel();

        // 延迟更新信息，等待页面加载
        setTimeout(() => {
            updatePanelInfo();
        }, 1500);

        // 添加全局下载函数
        window.downloadVideo = downloadVideo;
    }

    // 等待页面加载完成
    if (document.readyState === 'complete') {
        init();
    } else {
        window.addEventListener('load', init);
    }

})();
