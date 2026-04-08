// ==UserScript==
// @name         全网视频增强助手 - 多平台去广告·倍速·净化
// @namespace    https://github.com/video-enhancer
// @version      2.6.0
// @description  支持 iflix / iQIYI海外版(iq.com) / 优酷海外版(youku.tv) / 优酷国内(youku.com) / 1905电影网 / PPTV(PP视频) / 土豆 / 哔哩哔哩 / 西瓜视频 去广告、倍速突破、界面净化、播放增强
// @author       VideoEnhancer
// @icon         https://cdn-icons-png.flaticon.com/512/1384/1384060.png
// @match        *://www.iflix.com/*
// @match        *://*.iflix.com/*
// @match        *://www.iq.com/*
// @match        *://*.iq.com/*
// @match        *://www.youku.tv/*
// @match        *://*.youku.tv/*
// @match        *://www.youku.com/*
// @match        *://*.youku.com/*
// @match        *://www.1905.com/*
// @match        *://*.1905.com/*
// @match        *://www.pptv.com/*
// @match        *://*.pptv.com/*
// @match        *://v.pptv.com/*
// @match        *://www.tudou.com/*
// @match        *://*.tudou.com/*
// @match        *://www.bilibili.com/*
// @match        *://*.bilibili.com/*
// @match        *://www.ixigua.com/*
// @match        *://*.ixigua.com/*
// @match        *://www.ixigua.net/*
// @match        *://*.ixigua.net/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @connect      *
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // ============================================================
    //  全局配置
    // ============================================================
    const CONFIG = {
        version: '2.6.0',
        debug: GM_getValue('debug', false),
        // 广告屏蔽规则
        blockSelectors: {
            // 通用广告选择器
            global: [
                '[id*="ad-"]', '[id*="advert"]', '[id*="guanggao"]',
                '[class*="ad-wrap"]', '[class*="ad-banner"]', '[class*="ad-slot"]',
                '[class*="advert"]', '[class*="guanggao"]', '[class*="sidebar-ad"]',
                '[class*="popup-ad"]', '[class*="float-ad"]', '[class*="overlay-ad"]',
                '[class*="banner-ad"]', '[class*="video-ad"]',
                'iframe[src*="ad"]', 'iframe[src*="doubleclick"]',
                'div[data-ad]', 'div[aria-label="广告"]',
                '.ad-container', '.ad-player', '.ad-layer',
                '.iqp-player-videoad', '.iqp-ad', '.skippable-after',
            ],
            // 爱奇艺海外版 (iq.com)
            iq: [
                '.iqp-banner', '.iqp-side-ad', '.m-iqp-ad',
                '[class*="iqp"][class*="ad"]',
                '.twelve-adv', '.mod-ad', '.m-slider-ad',
                '.iqp-pause-ad',
            ],
            // iflix
            iflix: [
                '.ad-overlay', '[class*="preroll"]', '[class*="midroll"]',
                '[class*="postroll"]', '[class*="sponsor"]',
                '[data-testid*="ad"]',
            ],
            // 优酷
            youku: [
                '.youku-layer-logo', // 优酷logo水印
                '#module-basic-advert', '.adv-area', '.pause-adv',
                '.control-advert', '.corner-mark', '.yk-ad',
                '[class*="advert-"]', '.recommend-ad',
            ],
            // 1905电影网
            moive1905: [
                '.adWrap', '.ad-box', '#ad_', '.side-ad',
                '.top-ad', '.banner-ad',
            ],
            // PPTV / PP视频
            pptv: [
                '.pp-ad', '.ad-wrap', '.ad-box', '.ad-layer',
                '.pp-player-ad', '.suspend-ad',
                '[id*="ad"]', '[class*="ad-"]',
            ],
            // 土豆
            tudou: [
                '.td-ad', '.advert', '.ad-module',
                '.sidebar-promo',
            ],
            // 哔哩哔哩
            bili: [
                '.ad-report', '.bili-ad', '#slide_ad',
                '.video-page-game-card', '.rec-section',
                '.pop-live', '[class*="ad-"]',
                '.bili-dyn-ads', '.video-card-ad',
                '.activity-m', '.vcd', // 视频卡片广告
                '.bangumi-pgc-video-card', // 大会员推广
            ],
            // 西瓜视频
            xigua: [
                '.ad-container', '[class*="xigua-ad"]',
                '.video-feed-ad', '.inline-ad',
            ],
        },
        // 倍速控制
        speedOptions: [0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 3.0, 4.0],
        defaultSpeed: GM_getValue('defaultSpeed', 1.0),
        // 自动跳过片头片尾 (秒)
        skipIntro: GM_getValue('skipIntro', 0),
        skipOutro: GM_getValue('skipOutro', 0),
        // 界面净化
        removePopup: GM_getValue('removePopup', true),    // 去除弹窗
        removeFloat: GM_getValue('removeFloat', true),     // 去除悬浮元素
        removeSidebar: GM_getValue('removeSidebar', false), // 去除侧边栏
        autoFullscreen: GM_getValue('autoFullscreen', false),
        autoPlay: GM_getValue('autoPlay', true),
    };

    // ============================================================
    //  工具函数
    // ============================================================
    const Utils = {
        log(...args) {
            if (CONFIG.debug) {
                console.log(`[视频增强 v${CONFIG.version}]`, ...args);
            }
        },
        info(...args) {
            console.log(`%c[视频增强 v${CONFIG.version}]%c ${args.join(' ')}`,
                'background:#f60;color:#fff;border-radius:3px;padding:0 4px', 'color:#f60');
        },
        currentSite() {
            const h = location.hostname;
            const map = {
                'iflix': /iflix\.com/,
                'iq': /iq\.com/,
                'youku': /youku\.(com|tv)/,
                'movie1905': /1905\.com/,
                'pptv': /pptv\.com/,
                'tudou': /tudou\.com/,
                'bili': /bilibili\.com/,
                'xigua': /ixigua\.(com|net)/,
            };
            for (const [site, re] of Object.entries(map)) {
                if (re.test(h)) return site;
            }
            return 'unknown';
        },
        // 安全移除元素
        remove(el) {
            if (!el) return;
            try { el.remove(); } catch { try { el.parentNode.removeChild(el); } catch {} }
        },
        // 隐藏元素
        hide(el) {
            if (!el) return;
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('height', '0', 'important');
            el.style.setProperty('overflow', 'hidden', 'important');
            el.style.setProperty('pointer-events', 'none', 'important');
        },
        // 观察DOM变化
        observe(target, callback, opts = {}) {
            if (!target) return;
            const observer = new MutationObserver(callback);
            observer.observe(target, {
                childList: true,
                subtree: true,
                ...opts,
            });
            return observer;
        },
        // 等待元素出现
        waitFor(selector, timeout = 10000, parent = document) {
            return new Promise((resolve, reject) => {
                const el = parent.querySelector(selector);
                if (el) return resolve(el);
                const observer = new MutationObserver(() => {
                    const el = parent.querySelector(selector);
                    if (el) { observer.disconnect(); resolve(el); }
                });
                observer.observe(parent, { childList: true, subtree: true });
                setTimeout(() => { observer.disconnect(); reject(new Error(`超时: ${selector}`)); }, timeout);
            });
        },
        // 防抖
        debounce(fn, delay = 300) {
            let timer;
            return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); };
        },
    };

    // ============================================================
    //  模块一：广告拦截
    // ============================================================
    const AdBlocker = {
        removedCount: 0,

        init() {
            const site = Utils.currentSite();
            this.removeStaticAds(site);
            this.observeDynamicAds(site);
            this.interceptRequests(site);
            Utils.info(`广告拦截已启用 [${site}]`);
        },

        // 移除静态广告
        removeStaticAds(site) {
            const selectors = [
                ...CONFIG.blockSelectors.global,
                ...(CONFIG.blockSelectors[site] || []),
            ];
            selectors.forEach(sel => {
                try {
                    document.querySelectorAll(sel).forEach(el => {
                        // 安全检查：避免误删播放器本身
                        if (this.isPlayerElement(el)) return;
                        Utils.hide(el);
                        this.removedCount++;
                    });
                } catch {}
            });
        },

        // 动态广告监控
        observeDynamicAds(site) {
            const debouncedClean = Utils.debounce(() => {
                const selectors = [
                    ...CONFIG.blockSelectors.global,
                    ...(CONFIG.blockSelectors[site] || []),
                ];
                let count = 0;
                selectors.forEach(sel => {
                    try {
                        document.querySelectorAll(sel).forEach(el => {
                            if (this.isPlayerElement(el)) return;
                            if (el.offsetParent !== null || el.style.display !== 'none') {
                                Utils.hide(el);
                                count++;
                            }
                        });
                    } catch {}
                });
                if (count > 0) {
                    this.removedCount += count;
                    Utils.log(`动态清理 ${count} 个广告元素`);
                }
            }, 500);

            Utils.observe(document.body, debouncedClean);
        },

        // 拦截广告请求
        interceptRequests(site) {
            // 拦截广告相关的脚本和资源加载
            const adPatterns = [
                /doubleclick\.net/, /googlesyndication\.com/,
                /ad\.iqiyi\.com/, /ad\.youku\.com/,
                /ad\.bilibili\.com/, /cm\.bilibili\.com/,
                /static\.ad\.pptv\.com/,
                /tanx\.com/, /mm\.taobao\.com/,
                /adnxs\.com/, /adsrvr\.org/,
                /analytics\./, /tracker\./,
                /collect\./, /log\./,
                /beacon\./,
            ];

            const origOpen = XMLHttpRequest.prototype.open;
            const origFetch = window.fetch;

            // 拦截 XHR
            XMLHttpRequest.prototype.open = function (method, url, ...args) {
                if (adPatterns.some(p => p.test(url))) {
                    Utils.log(`拦截广告请求: ${url}`);
                    return; // 不执行请求
                }
                return origOpen.call(this, method, url, ...args);
            };

            // 拦截 Fetch
            window.fetch = function (url, options) {
                const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
                if (adPatterns.some(p => p.test(urlStr))) {
                    Utils.log(`拦截广告Fetch: ${urlStr}`);
                    return Promise.resolve(new Response('', { status: 200 }));
                }
                return origFetch.call(this, url, options);
            };

            // 注入 CSS 隐藏策略
            const hideCSS = adPatterns.map(p => {
                try { return p.source; } catch { return ''; }
            }).join(',');

            if (hideCSS) {
                GM_addStyle(`
                    /* 全局广告屏蔽 */
                    [id*="ad-"], [id*="advert"], [id*="guanggao"],
                    [class*="ad-wrap"], [class*="ad-banner"], [class*="ad-slot"],
                    [class*="advert"], [class*="guanggao"], [class*="sidebar-ad"],
                    [class*="popup-ad"], [class*="float-ad"], [class*="overlay-ad"],
                    .ad-container, .ad-player, .ad-layer,
                    .iqp-player-videoad, .iqp-ad, .skippable-after,
                    .twelve-adv, .mod-ad, .pause-adv,
                    .ad-overlay, [class*="preroll"], [class*="midroll"],
                    #module-basic-advert, .adv-area, .pause-adv, .control-advert,
                    .yk-ad, .recommend-ad,
                    .adWrap, .ad-box, .side-ad, .top-ad,
                    .pp-ad, .ad-wrap, .ad-box, .ad-layer, .pp-player-ad,
                    .td-ad, .advert, .ad-module,
                    .ad-report, .bili-ad, #slide_ad, .video-page-game-card,
                    .rec-section, .pop-live, .vcd, .bili-dyn-ads, .video-card-ad,
                    .activity-m, .bangumi-pgc-video-card,
                    .video-feed-ad, .inline-ad,
                    [data-ad], div[aria-label="广告"], [data-testid*="ad"] {
                        display: none !important;
                        visibility: hidden !important;
                        height: 0 !important;
                        overflow: hidden !important;
                        pointer-events: none !important;
                        position: absolute !important;
                        z-index: -9999 !important;
                    }
                    /* 去除弹窗遮罩 */
                    [class*="modal"][class*="ad"],
                    [class*="popup"][class*="ad"],
                    [class*="dialog"][class*="ad"],
                    [class*="layer"][class*="ad"] {
                        display: none !important;
                    }
                `);
            }
        },

        // 判断是否为播放器核心元素 (避免误删)
        isPlayerElement(el) {
            const tag = el.tagName;
            const cls = el.className || '';
            const id = el.id || '';
            // video/audio 标签绝对不能删
            if (tag === 'VIDEO' || tag === 'AUDIO' || tag === 'SOURCE') return true;
            // 播放器容器不能删
            if (/player|video-box|player-container|xgplayer|bilibili-player/i.test(cls + id)) {
                // 但如果class同时含有ad，则可能是广告层
                if (/ad/i.test(cls + id)) return false;
                return true;
            }
            return false;
        },
    };

    // ============================================================
    //  模块二：视频播放增强
    // ============================================================
    const VideoEnhancer = {
        currentVideo: null,

        init() {
            this.findVideo();
            this.observeVideo();
            Utils.info('视频增强已启用');
        },

        findVideo() {
            const video = document.querySelector('video');
            if (video && video !== this.currentVideo) {
                this.currentVideo = video;
                this.applyEnhancements(video);
            }
        },

        observeVideo() {
            // 持续寻找 video 元素
            const findVideo = Utils.debounce(() => this.findVideo(), 1000);
            Utils.observe(document.body, findVideo);

            // 定时检查 (某些SPA页面)
            setInterval(findVideo, 3000);
        },

        applyEnhancements(video) {
            if (!video) return;
            Utils.log('找到视频播放器，正在应用增强...');

            // 倍速设置
            if (CONFIG.defaultSpeed > 1.0) {
                video.playbackRate = CONFIG.defaultSpeed;
            }

            // 自动播放
            if (CONFIG.autoPlay) {
                video.play().catch(() => {});
            }

            // 去除播放限制
            this.removePlaybackRestrictions(video);

            // 创建控制面板
            this.createControlPanel(video);

            // 自动跳过片头
            this.setupSkipIntro(video);

            // 监听广告插入
            this.monitorAdInsertion(video);
        },

        removePlaybackRestrictions(video) {
            // 去除禁止快进
            const origPlay = HTMLMediaElement.prototype.play;
            video.play = function () {
                return origPlay.call(this).catch(() => {});
            };

            // 允许任意倍速
            try {
                Object.defineProperty(video, 'playbackRate', {
                    get() { return this._playbackRate || 1; },
                    set(v) {
                        this._playbackRate = v;
                        // 绕过某些平台的倍速检查
                        try { this._playbackRate = v; } catch {}
                    },
                    configurable: true,
                });
            } catch {}

            // 禁止暂停广告自动恢复播放
            video.addEventListener('pause', (e) => {
                setTimeout(() => {
                    // 如果是因为广告导致的暂停，3秒后尝试恢复
                    if (video.paused && !document.hidden) {
                        const overlay = document.querySelector(
                            '[class*="ad"][class*="playing"], [class*="ad"][class*="pause"]'
                        );
                        if (!overlay) {
                            // video.play().catch(() => {});
                        }
                    }
                }, 3000);
            });
        },

        // 监控广告插入并自动跳过
        monitorAdInsertion(video) {
            let adDetected = false;

            // 检测广告：通常广告视频时长很短（<30秒）且不可跳过
            const checkAd = () => {
                if (!video.duration || video.duration > 60) {
                    if (adDetected) {
                        adDetected = false;
                        Utils.log('广告结束，恢复正常播放');
                    }
                    return;
                }

                // 检测可能的广告
                const indicators = [
                    document.querySelector('[class*="ad-skip"]'),
                    document.querySelector('[class*="skip-btn"]'),
                    document.querySelector('[class*="countdown"]'),
                    document.querySelector('[class*="ad-time"]'),
                ];

                const adOverlay = document.querySelector(
                    '[class*="ad-layer"], [class*="video-ad"], [class*="player-ad"]'
                );

                if (adOverlay || (video.duration < 30 && video.currentTime < video.duration)) {
                    if (!adDetected) {
                        adDetected = true;
                        Utils.log('检测到广告，尝试跳过...');
                        this.trySkipAd(video);
                    }
                }
            };

            video.addEventListener('timeupdate', Utils.debounce(checkAd, 1000));
            video.addEventListener('loadedmetadata', checkAd);
        },

        trySkipAd(video) {
            // 方法1：寻找跳过按钮并点击
            const skipSelectors = [
                '[class*="skip"]', '[class*="Skip"]',
                'button[class*="close"]', '[class*="ad-close"]',
                '[class*="ad-skip-btn"]', '[class*="skipAd"]',
                '.iqp-player-videoad-close',
                '.skippable-after',
                '[class*="countdown"]', // 倒计时结束后的跳过
            ];

            const clickSkip = () => {
                skipSelectors.forEach(sel => {
                    document.querySelectorAll(sel).forEach(btn => {
                        if (btn.offsetParent !== null) {
                            btn.click();
                            Utils.log('点击跳过按钮:', sel);
                        }
                    });
                });
            };

            // 立即尝试
            clickSkip();
            // 持续尝试
            const interval = setInterval(clickSkip, 500);
            setTimeout(() => clearInterval(interval), 15000); // 最多尝试15秒
        },

        setupSkipIntro(video) {
            if (CONFIG.skipIntro <= 0) return;
            video.addEventListener('timeupdate', () => {
                if (video.currentTime >= CONFIG.skipIntro && video.currentTime < CONFIG.skipIntro + 1) {
                    video.currentTime = CONFIG.skipIntro;
                    Utils.info(`已跳过片头 ${CONFIG.skipIntro}s`);
                }
            });
        },

        createControlPanel(video) {
            if (document.getElementById('ve-control-panel')) return;

            const panel = document.createElement('div');
            panel.id = 've-control-panel';
            panel.innerHTML = `
                <div class="ve-panel-header">
                    <span class="ve-title">🎬 视频增强 v${CONFIG.version}</span>
                    <span class="ve-site">[${Utils.currentSite()}]</span>
                    <button class="ve-toggle" title="收起/展开">−</button>
                </div>
                <div class="ve-panel-body">
                    <div class="ve-section">
                        <label>倍速:</label>
                        <select class="ve-speed">
                            ${CONFIG.speedOptions.map(s =>
                                `<option value="${s}" ${s === CONFIG.defaultSpeed ? 'selected' : ''}>${s}x</option>`
                            ).join('')}
                        </select>
                        <input type="range" class="ve-speed-slider" min="0.25" max="16" step="0.25"
                               value="${CONFIG.defaultSpeed}">
                        <span class="ve-speed-display">${CONFIG.defaultSpeed}x</span>
                    </div>
                    <div class="ve-section">
                        <label>画中画:</label>
                        <button class="ve-pip">开启</button>
                    </div>
                    <div class="ve-section">
                        <label>音量增益:</label>
                        <input type="range" class="ve-volume-boost" min="100" max="300" step="10" value="100">
                        <span class="ve-volume-display">100%</span>
                    </div>
                    <div class="ve-section ve-section-compact">
                        <label>
                            <input type="checkbox" class="ve-auto-play" ${CONFIG.autoPlay ? 'checked' : ''}>
                            自动播放
                        </label>
                        <label>
                            <input type="checkbox" class="ve-auto-fs" ${CONFIG.autoFullscreen ? 'checked' : ''}>
                            自动全屏
                        </label>
                    </div>
                    <div class="ve-section ve-section-compact">
                        <label>跳过片头:</label>
                        <input type="number" class="ve-skip-intro" min="0" max="300" step="5"
                               value="${CONFIG.skipIntro}" style="width:50px"> 秒
                        <label style="margin-left:8px">跳过片尾:</label>
                        <input type="number" class="ve-skip-outro" min="0" max="600" step="5"
                               value="${CONFIG.skipOutro}" style="width:50px"> 秒
                    </div>
                    <div class="ve-section">
                        <button class="ve-screenshot">📸 截图</button>
                        <button class="ve-detect-urls">🔍 检测视频源</button>
                        <button class="ve-copy-url">📋 复制地址</button>
                    </div>
                    <div class="ve-download-area" style="display:none">
                        <div class="ve-section ve-dl-title">🎬 检测到的视频源:</div>
                        <div class="ve-url-list"></div>
                    </div>
                </div>
            `;

            document.body.appendChild(panel);
            this.injectPanelCSS();
            this.bindPanelEvents(panel, video);
            this.makePanelDraggable(panel);
        },

        makePanelDraggable(panel) {
            const header = panel.querySelector('.ve-panel-header');
            let isDragging = false, startX, startY, origX, origY;

            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('.ve-toggle')) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                const rect = panel.getBoundingClientRect();
                origX = rect.left;
                origY = rect.top;
                panel.style.transition = 'none';
            });

            document.addEventListener('mousemove', (e) => {
                if (!isDragging) return;
                panel.style.left = (origX + e.clientX - startX) + 'px';
                panel.style.top = (origY + e.clientY - startY) + 'px';
                panel.style.right = 'auto';
            });

            document.addEventListener('mouseup', () => { isDragging = false; });

            // 收起/展开
            const toggle = panel.querySelector('.ve-toggle');
            toggle.addEventListener('click', () => {
                const body = panel.querySelector('.ve-panel-body');
                const isHidden = body.style.display === 'none';
                body.style.display = isHidden ? 'block' : 'none';
                toggle.textContent = isHidden ? '−' : '+';
            });
        },

        injectPanelCSS() {
            GM_addStyle(`
                #ve-control-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 2147483647;
                    background: rgba(20, 20, 30, 0.92);
                    color: #e0e0e0;
                    border-radius: 12px;
                    box-shadow: 0 4px 24px rgba(0,0,0,0.5);
                    font-family: -apple-system, "Microsoft YaHei", sans-serif;
                    font-size: 13px;
                    min-width: 280px;
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                    user-select: none;
                    transition: opacity 0.3s;
                }
                #ve-control-panel:hover { opacity: 1 !important; }
                .ve-panel-header {
                    display: flex;
                    align-items: center;
                    padding: 8px 12px;
                    cursor: move;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                }
                .ve-title { font-weight: 600; font-size: 14px; color: #fff; }
                .ve-site { margin-left: 8px; color: #888; font-size: 11px; }
                .ve-toggle {
                    margin-left: auto;
                    background: none; border: none;
                    color: #aaa; font-size: 18px;
                    cursor: pointer; padding: 0 4px;
                }
                .ve-toggle:hover { color: #fff; }
                .ve-panel-body { padding: 8px 12px; }
                .ve-section {
                    display: flex; align-items: center;
                    margin: 6px 0; gap: 6px;
                }
                .ve-section-compact { flex-wrap: wrap; }
                .ve-section label { color: #bbb; font-size: 12px; white-space: nowrap; }
                .ve-section select, .ve-section input[type="number"] {
                    background: rgba(255,255,255,0.1); color: #fff;
                    border: 1px solid rgba(255,255,255,0.2);
                    border-radius: 4px; padding: 2px 6px;
                    font-size: 12px; outline: none;
                }
                .ve-section select:focus, .ve-section input:focus {
                    border-color: #4fc3f7;
                }
                .ve-speed-slider { flex: 1; accent-color: #4fc3f7; height: 3px; }
                .ve-speed-display, .ve-volume-display {
                    font-size: 11px; color: #4fc3f7; min-width: 36px; text-align: right;
                }
                .ve-volume-boost { flex: 1; accent-color: #ff9800; height: 3px; }
                .ve-pip {
                    background: rgba(79, 195, 247, 0.2);
                    border: 1px solid #4fc3f7; color: #4fc3f7;
                    border-radius: 4px; padding: 2px 10px; font-size: 12px;
                    cursor: pointer; outline: none;
                }
                .ve-pip:hover { background: rgba(79, 195, 247, 0.3); }
                .ve-screenshot, .ve-download, .ve-copy-url {
                    background: rgba(255,255,255,0.08);
                    border: 1px solid rgba(255,255,255,0.15);
                    color: #ccc; border-radius: 4px;
                    padding: 4px 8px; font-size: 12px;
                    cursor: pointer; outline: none;
                }
                .ve-screenshot:hover, .ve-download:hover, .ve-copy-url:hover {
                    background: rgba(255,255,255,0.15); color: #fff;
                }
                .ve-section input[type="checkbox"] {
                    accent-color: #4fc3f7;
                }
                /* 通知Toast */
                .ve-toast {
                    position: fixed; top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(0,0,0,0.85); color: #fff;
                    padding: 12px 24px; border-radius: 8px;
                    font-size: 14px; z-index: 2147483647;
                    animation: ve-fadeIn 0.3s, ve-fadeOut 0.3s 1.7s forwards;
                    pointer-events: none;
                }
                @keyframes ve-fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes ve-fadeOut { from { opacity: 1; } to { opacity: 0; } }
                /* 视频下载列表 */
                .ve-download-area {
                    margin-top: 8px;
                    border-top: 1px solid rgba(255,255,255,0.1);
                    padding-top: 8px;
                    max-height: 300px;
                    overflow-y: auto;
                }
                .ve-download-area::-webkit-scrollbar { width: 4px; }
                .ve-download-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); border-radius: 2px; }
                .ve-dl-title { color: #4fc3f7; font-weight: 600; font-size: 12px; }
                .ve-url-list { display: flex; flex-direction: column; gap: 6px; }
                .ve-url-row {
                    background: rgba(255,255,255,0.05);
                    border-radius: 6px;
                    padding: 6px 8px;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }
                .ve-url-info { display: flex; align-items: baseline; gap: 6px; }
                .ve-url-label { color: #fff; font-size: 12px; font-weight: 500; }
                .ve-url-meta { color: #888; font-size: 10px; }
                .ve-url-actions { display: flex; gap: 4px; flex-wrap: wrap; }
                .ve-url-actions button {
                    background: rgba(79,195,247,0.15);
                    border: 1px solid rgba(79,195,247,0.3);
                    color: #4fc3f7; border-radius: 3px;
                    padding: 2px 6px; font-size: 11px;
                    cursor: pointer; outline: none;
                }
                .ve-url-actions button:hover { background: rgba(79,195,247,0.3); }
                .ve-url-actions .ve-btn-dl-m3u8 {
                    background: rgba(255,152,0,0.15);
                    border-color: rgba(255,152,0,0.3);
                    color: #ff9800;
                }
                .ve-url-actions .ve-btn-dl-m3u8:hover { background: rgba(255,152,0,0.3); }
            `);
        },

        bindPanelEvents(panel, video) {
            // 倍速控制
            const speedSelect = panel.querySelector('.ve-speed');
            const speedSlider = panel.querySelector('.ve-speed-slider');
            const speedDisplay = panel.querySelector('.ve-speed-display');

            const setSpeed = (val) => {
                const speed = parseFloat(val);
                video.playbackRate = speed;
                speedDisplay.textContent = speed + 'x';
                GM_setValue('defaultSpeed', speed);
            };

            speedSelect.addEventListener('change', (e) => {
                setSpeed(e.target.value);
                speedSlider.value = e.target.value;
            });

            speedSlider.addEventListener('input', (e) => {
                const val = parseFloat(e.target.value);
                video.playbackRate = val;
                speedDisplay.textContent = val + 'x';
            });

            speedSlider.addEventListener('change', (e) => {
                GM_setValue('defaultSpeed', parseFloat(e.target.value));
            });

            // 画中画
            panel.querySelector('.ve-pip').addEventListener('click', () => {
                if (document.pictureInPictureElement) {
                    document.exitPictureInPicture().catch(() => {});
                    panel.querySelector('.ve-pip').textContent = '开启';
                } else if (video.requestPictureInPicture) {
                    video.requestPictureInPicture().then(() => {
                        panel.querySelector('.ve-pip').textContent = '关闭';
                    }).catch(() => {
                        this.showToast('画中画不可用');
                    });
                }
            });

            // 音量增益
            const volumeSlider = panel.querySelector('.ve-volume-boost');
            const volumeDisplay = panel.querySelector('.ve-volume-display');
            volumeSlider.addEventListener('input', (e) => {
                const vol = parseInt(e.target.value);
                video.volume = Math.min(vol / 100, 1);
                volumeDisplay.textContent = vol + '%';
                // 使用Web Audio API实现音量增益
                this.applyVolumeBoost(video, vol / 100);
            });

            // 自动播放
            panel.querySelector('.ve-auto-play').addEventListener('change', (e) => {
                GM_setValue('autoPlay', e.target.checked);
                CONFIG.autoPlay = e.target.checked;
            });

            // 自动全屏
            panel.querySelector('.ve-auto-fs').addEventListener('change', (e) => {
                GM_setValue('autoFullscreen', e.target.checked);
                CONFIG.autoFullscreen = e.target.checked;
                if (e.target.checked) {
                    this.enterFullscreen(video);
                }
            });

            // 跳过片头片尾
            panel.querySelector('.ve-skip-intro').addEventListener('change', (e) => {
                CONFIG.skipIntro = parseInt(e.target.value) || 0;
                GM_setValue('skipIntro', CONFIG.skipIntro);
            });
            panel.querySelector('.ve-skip-outro').addEventListener('change', (e) => {
                CONFIG.skipOutro = parseInt(e.target.value) || 0;
                GM_setValue('skipOutro', CONFIG.skipOutro);
                if (CONFIG.skipOutro > 0) {
                    this.setupSkipOutro(video);
                }
            });

            // 截图
            panel.querySelector('.ve-screenshot').addEventListener('click', () => {
                this.takeScreenshot(video);
            });

            // 检测视频源 & 真正下载
            panel.querySelector('.ve-detect-urls').addEventListener('click', () => {
                VideoDownloader.detect(video, panel);
            });

            // 复制地址
            panel.querySelector('.ve-copy-url').addEventListener('click', () => {
                GM_setClipboard(location.href, 'text');
                this.showToast('已复制当前页面地址');
            });

            // 双击视频全屏
            video.addEventListener('dblclick', () => {
                this.enterFullscreen(video);
            });
        },

        applyVolumeBoost(video, boost) {
            if (boost <= 1) return;
            if (!this._audioCtx) {
                this._audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                this._source = this._audioCtx.createMediaElementSource(video);
                this._gain = this._audioCtx.createGain();
                this._source.connect(this._gain);
                this._gain.connect(this._audioCtx.destination);
            }
            this._gain.gain.value = boost;
        },

        enterFullscreen(video) {
            const container = video.closest('[class*="player"]') || video.closest('div');
            const el = container || video;
            try {
                (el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen).call(el);
            } catch {}
        },

        setupSkipOutro(video) {
            video.addEventListener('timeupdate', () => {
                if (CONFIG.skipOutro > 0 && video.duration) {
                    const remaining = video.duration - video.currentTime;
                    if (remaining <= CONFIG.skipOutro && remaining > CONFIG.skipOutro - 1) {
                        Utils.info(`已跳过片尾 ${CONFIG.skipOutro}s`);
                        video.currentTime = video.duration;
                        video.pause();
                    }
                }
            });
        },

        takeScreenshot(video) {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0);
                const link = document.createElement('a');
                link.download = `screenshot_${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
                this.showToast('截图已保存');
            } catch (e) {
                this.showToast('截图失败（可能有跨域限制）');
            }
        },

        showVideoInfo(video) {
            const info = [
                `当前地址: ${location.href}`,
                `视频时长: ${this.formatTime(video.duration)}`,
                `当前时间: ${this.formatTime(video.currentTime)}`,
                `播放速率: ${video.playbackRate}x`,
                `分辨率: ${video.videoWidth}x${video.videoHeight}`,
            ];
            GM_setClipboard(info.join('\n'), 'text');
            this.showToast('视频信息已复制到剪贴板');
        },

        formatTime(sec) {
            if (!sec || isNaN(sec)) return '00:00';
            const h = Math.floor(sec / 3600);
            const m = Math.floor((sec % 3600) / 60);
            const s = Math.floor(sec % 60);
            return h > 0
                ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                : `${m}:${String(s).padStart(2, '0')}`;
        },

        showToast(msg) {
            const toast = document.createElement('div');
            toast.className = 've-toast';
            toast.textContent = msg;
            document.body.appendChild(toast);
            setTimeout(() => toast.remove(), 2000);
        },
    };

    // ============================================================
    //  模块二B：视频源检测与真实下载
    // ============================================================
    const VideoDownloader = {
        capturedURLs: [],

        init() {
            this.hookMediaRequests();
            Utils.info('视频源拦截已启用');
        },

        // 在 document-start 阶段 hook，拦截所有视频/音频请求
        hookMediaRequests() {
            const self = this;
            const videoExts = /\.(mp4|m3u8|m4s|ts|flv|webm|mkv|avi|mov|mp3|aac|m4a|ogg|wav)(\?|$)/i;
            const videoContentTypes = /(video|audio)\/(mp4|mpeg|ogg|webm|x-flv|mp2t|apple-mpegurl|x-mpegURL|octet-stream|quicktime)/i;
            const cdnPatterns = [
                // B站
                /bilivideo\.com/, /cn-[a-z]+-[a-z]\d*\.bilivideo\.com/,
                /upos-sz-[a-z]+\.bilivideo\.com/, /akamaihd\.net/,
                // 优酷
                /youku\.com\/.*\.(mp4|m3u8)/, /kugou\.com/,
                /vali\.cpm\.youku\.com/, /a1\.ykimg\.com/,
                // 爱奇艺
                /iqiyi\.com\/.*\.(mp4|m3u8)/, /iq\.com\/.*\.(mp4|m3u8)/,
                /qiyi\.com/, /71\.am\.com/,
                // PPTV
                /pptv\.com\/.*\.(mp4|m3u8)/, /ppimg\.com/,
                // 1905
                /1905\.com\/.*\.(mp4|m3u8)/,
                // 西瓜
                /ixigua\.com\/.*\.(mp4|m3u8)/, /pstatp\.com/,
                /snssdk\.com/, /byteimg\.com/,
                // iflix
                /iflix\.com\/.*\.(mp4|m3u8)/,
                // 土豆
                /tudou\.com\/.*\.(mp4|m3u8)/,
                // 通用CDN
                /vod\.|video\.|media\.|stream\.|cdn\./,
                /cloudfront\.net/, /akamaized\.net/,
                /llnwi\.net/, /vod-cdn\./,
                /m3u8/, /\.mp4/, /\.flv/,
            ];

            const isVideoURL = (url) => {
                if (!url || typeof url !== 'string') return false;
                return videoExts.test(url) || cdnPatterns.some(p => p.test(url));
            };

            // Hook XMLHttpRequest
            const origXHROpen = XMLHttpRequest.prototype.open;
            XMLHttpRequest.prototype.open = function (method, url, ...args) {
                if (isVideoURL(url)) {
                    self.captureURL(url, 'XHR');
                }
                return origXHROpen.call(this, method, url, ...args);
            };

            // Hook Fetch
            const origFetch = window.fetch;
            window.fetch = function (urlOrReq, options) {
                const url = typeof urlOrReq === 'string' ? urlOrReq : (urlOrReq && urlOrReq.url) || '';
                if (isVideoURL(url)) {
                    self.captureURL(url, 'Fetch');
                }
                return origFetch.call(this, urlOrReq, options);
            };

            // Hook <video> 和 <source> 的 src 赋值
            const origSetAttribute = Element.prototype.setAttribute;
            Element.prototype.setAttribute = function (name, value) {
                if (this.tagName === 'VIDEO' || this.tagName === 'SOURCE' || this.tagName === 'AUDIO') {
                    if (name === 'src' && value && isVideoURL(value)) {
                        self.captureURL(value, `setAttribute(${this.tagName})`);
                    }
                }
                return origSetAttribute.call(this, name, value);
            };

            // Hook HTMLMediaElement.src setter
            try {
                const origSrcDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
                if (origSrcDesc) {
                    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
                        get() { return origSrcDesc.get.call(this); },
                        set(v) {
                            if (v && isVideoURL(v)) {
                                self.captureURL(v, 'video.src');
                            }
                            return origSrcDesc.set.call(this, v);
                        },
                        configurable: true,
                    });
                }
            } catch {}

            // Hook createElement('source') 追加到 DOM 时
            const origAppendChild = Node.prototype.appendChild;
            Node.prototype.appendChild = function (child) {
                if (child && child.tagName === 'SOURCE') {
                    const src = child.getAttribute('src') || child.src;
                    if (src && isVideoURL(src)) {
                        self.captureURL(src, 'SOURCE appendChild');
                    }
                }
                return origAppendChild.call(this, child);
            };

            // 持续扫描页面上所有 <video> / <source> 元素
            setInterval(() => {
                document.querySelectorAll('video, source, audio').forEach(el => {
                    const src = el.src || el.currentSrc;
                    if (src && isVideoURL(src)) {
                        self.captureURL(src, 'scan');
                    }
                });
            }, 3000);
        },

        captureURL(url, source) {
            // 去重 + 过滤广告
            if (!url || url.startsWith('data:') || url.startsWith('blob:')) return;
            if (url.includes('ad') && url.includes('preroll')) return;

            // 去除追踪参数但保留核心URL
            let cleanURL = url;
            try { cleanURL = new URL(url).href; } catch {}

            // 去重
            if (this.capturedURLs.some(u => this.sameURL(u.url, cleanURL))) return;

            this.capturedURLs.push({ url: cleanURL, source, time: Date.now() });
            Utils.log(`捕获视频源 [${source}]: ${cleanURL.substring(0, 120)}...`);

            // 最多保留 50 条
            if (this.capturedURLs.length > 50) {
                this.capturedURLs = this.capturedURLs.slice(-50);
            }
        },

        sameURL(a, b) {
            try {
                return new URL(a).pathname === new URL(b).pathname;
            } catch {
                return a === b;
            }
        },

        // 主入口：检测并展示可下载的视频源
        detect(video, panel) {
            const downloadArea = panel.querySelector('.ve-download-area');
            const urlList = panel.querySelector('.ve-url-list');

            // 1) 收集当前 video 元素上的源
            const directSrc = video.src || video.currentSrc;
            if (directSrc && !directSrc.startsWith('blob:') && !directSrc.startsWith('data:')) {
                this.captureURL(directSrc, 'video.currentSrc');
            }

            // 2) 收集页面内所有 source 标签
            document.querySelectorAll('source').forEach(el => {
                const s = el.src || el.getAttribute('src');
                if (s) this.captureURL(s, 'source标签');
            });

            // 3) 去重 & 按类型优先排序
            const deduped = this.dedup(this.capturedURLs);
            const sorted = this.sortByPriority(deduped);

            if (sorted.length === 0) {
                this.showToast('未检测到视频源，请先播放视频');
                downloadArea.style.display = 'none';
                return;
            }

            // 4) 渲染列表
            urlList.innerHTML = '';
            sorted.forEach((item, idx) => {
                const row = document.createElement('div');
                row.className = 've-url-row';

                const info = this.analyzeURL(item.url);
                const label = info.label || `视频源 ${idx + 1}`;

                row.innerHTML = `
                    <div class="ve-url-info">
                        <span class="ve-url-label">${label}</span>
                        <span class="ve-url-meta">${info.resolution || ''} ${info.format || ''} [${item.source}]</span>
                    </div>
                    <div class="ve-url-actions">
                        <button class="ve-btn-copy-url" data-url="${this.escapeAttr(item.url)}">复制链接</button>
                        <button class="ve-btn-dl-direct" data-url="${this.escapeAttr(item.url)}">直接下载</button>
                        <button class="ve-btn-dl-tab" data-url="${this.escapeAttr(item.url)}">新标签打开</button>
                        ${info.format === 'm3u8' ? `<button class="ve-btn-dl-m3u8" data-url="${this.escapeAttr(item.url)}">M3U8下载</button>` : ''}
                    </div>
                `;

                urlList.appendChild(row);
            });

            downloadArea.style.display = 'block';

            // 绑定事件
            urlList.querySelectorAll('.ve-btn-copy-url').forEach(btn => {
                btn.addEventListener('click', () => {
                    GM_setClipboard(btn.dataset.url, 'text');
                    this.showToast('链接已复制到剪贴板');
                });
            });
            urlList.querySelectorAll('.ve-btn-dl-direct').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.downloadDirect(btn.dataset.url);
                });
            });
            urlList.querySelectorAll('.ve-btn-dl-tab').forEach(btn => {
                btn.addEventListener('click', () => {
                    window.open(btn.dataset.url, '_blank');
                });
            });
            urlList.querySelectorAll('.ve-btn-dl-m3u8').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.downloadM3U8(btn.dataset.url);
                });
            });
        },

        dedup(list) {
            const seen = new Set();
            return list.filter(item => {
                let key;
                try { key = new URL(item.url).pathname; } catch { key = item.url; }
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            });
        },

        sortByPriority(list) {
            // m3u8 优先 (通常是主视频流), mp4 其次
            const priority = (url) => {
                if (/\.m3u8/i.test(url)) return 10;
                if (/\.mp4/i.test(url)) return 8;
                if (/\.flv/i.test(url)) return 6;
                if (/\.ts/i.test(url)) return 4;
                if (/\.m4s/i.test(url)) return 3;
                return 5;
            };
            return [...list].sort((a, b) => priority(b.url) - priority(a.url));
        },

        analyzeURL(url) {
            const info = { label: '', format: '', resolution: '' };
            // 格式
            if (/\.m3u8/i.test(url)) {
                info.format = 'HLS(m3u8)';
                info.label = 'HLS 视频流';
                // 尝试从URL中识别清晰度
                if (/2160|4k|uhd/i.test(url)) info.resolution = '4K';
                else if (/1080|hd/i.test(url)) info.resolution = '1080P';
                else if (/720|sd/i.test(url)) info.resolution = '720P';
                else if (/480/i.test(url)) info.resolution = '480P';
            } else if (/\.mp4/i.test(url)) {
                info.format = 'MP4';
                info.label = 'MP4 视频';
                if (/2160|4k/i.test(url)) info.resolution = '4K';
                else if (/1080/i.test(url)) info.resolution = '1080P';
                else if (/720/i.test(url)) info.resolution = '720P';
            } else if (/\.flv/i.test(url)) {
                info.format = 'FLV';
                info.label = 'FLV 视频';
            } else if (/\.ts/i.test(url)) {
                info.format = 'TS';
                info.label = 'TS 分片';
            } else if (/\.m4s/i.test(url)) {
                info.format = 'M4S';
                info.label = 'M4S 分片(DASH)';
            } else {
                info.format = '视频';
                info.label = '视频文件';
            }
            return info;
        },

        // 方法A：直接下载 (适用于 mp4 等直链)
        downloadDirect(url) {
            const info = this.analyzeURL(url);
            const filename = this.generateFilename(url, info);

            // 优先使用 a 标签 download 属性 (同源)
            try {
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.style.display = 'none';
                document.body.appendChild(a);
                a.click();
                a.remove();
                this.showToast(`正在下载: ${filename}`);
                return;
            } catch {}

            // 备选：GM_download
            try {
                GM_download({
                    url: url,
                    name: filename,
                    saveAs: true,
                    onerror: (err) => {
                        this.showToast(`下载失败: ${err.error || '未知错误'}`);
                    },
                    onload: () => {
                        this.showToast(`下载完成: ${filename}`);
                    },
                });
                return;
            } catch {}

            // 最终：新标签打开
            this.showToast('直接下载不可用，已在新标签打开');
            window.open(url, '_blank');
        },

        // 方法B：M3U8 下载 (解析 m3u8 → 合并 ts → 下载 mp4)
        async downloadM3U8(m3u8URL) {
            this.showToast('正在解析 M3U8，请稍候...');

            try {
                // 1) 获取 m3u8 内容
                const m3u8Text = await this.fetchText(m3u8URL);
                if (!m3u8Text) {
                    this.showToast('M3U8 内容获取失败');
                    return;
                }

                // 2) 判断是 Master Playlist 还是 Media Playlist
                if (m3u8Text.includes('#EXT-X-STREAM-INF')) {
                    // Master Playlist → 找最高清晰度的子流
                    const lines = m3u8Text.split('\n').filter(l => l.trim());
                    let bestURL = '';
                    let bestBandwidth = 0;
                    for (let i = 0; i < lines.length; i++) {
                        if (lines[i].startsWith('#EXT-X-STREAM-INF')) {
                            const bw = parseInt(lines[i].match(/BANDWIDTH=(\d+)/)?.[1] || '0');
                            const nextLine = lines[i + 1]?.trim();
                            if (nextLine && bw > bestBandwidth && !nextLine.startsWith('#')) {
                                bestBandwidth = bw;
                                bestURL = nextLine;
                            }
                        }
                    }
                    if (!bestURL) {
                        this.showToast('未找到有效的视频流');
                        return;
                    }
                    // 解析相对URL
                    if (!bestURL.startsWith('http')) {
                        bestURL = new URL(bestURL, m3u8URL).href;
                    }
                    Utils.info(`选择最高码率流: ${bestBandwidth / 1000}kbps`);
                    // 递归解析子流
                    return this.downloadM3U8(bestURL);
                }

                // 3) Media Playlist → 提取所有 ts 分片 URL
                const tsLines = m3u8Text.split('\n')
                    .map(l => l.trim())
                    .filter(l => l && !l.startsWith('#'));

                if (tsLines.length === 0) {
                    this.showToast('M3U8 中没有找到视频分片');
                    return;
                }

                // 解析相对URL为绝对URL
                const tsURLs = tsLines.map(ts => {
                    if (ts.startsWith('http')) return ts;
                    try { return new URL(ts, m3u8URL).href; } catch { return ts; }
                });

                this.showToast(`共 ${tsURLs.length} 个分片，开始下载...`);
                Utils.info(`M3U8 分片数: ${tsURLs.length}`);

                // 4) 下载所有 ts 分片 (并发控制)
                const CONCURRENT = 5;
                const chunks = [];
                let completed = 0;

                const downloadOne = async (tsURL, index) => {
                    try {
                        const blob = await this.fetchBlob(tsURL);
                        return { index, blob, ok: true };
                    } catch (e) {
                        Utils.log(`分片 ${index} 下载失败: ${e.message}`);
                        return { index, blob: null, ok: false };
                    }
                };

                // 分批并发
                for (let i = 0; i < tsURLs.length; i += CONCURRENT) {
                    const batch = tsURLs.slice(i, i + CONCURRENT).map((url, j) =>
                        downloadOne(url, i + j)
                    );
                    const results = await Promise.all(batch);
                    results.forEach(r => {
                        if (r.ok && r.blob) {
                            chunks[r.index] = r.blob;
                            completed++;
                        }
                    });
                }

                // 5) 合并为单个 Blob 并下载
                const finalBlob = new Blob(chunks.filter(Boolean), { type: 'video/mp2t' });
                const url = URL.createObjectURL(finalBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = this.generateFilename(m3u8URL, { format: 'mp4', label: 'HLS合并' });
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);

                this.showToast(`下载完成 (${completed}/${tsURLs.length} 分片)`);
            } catch (e) {
                Utils.log(`M3U8 下载失败: ${e.message}`);
                this.showToast(`下载失败: ${e.message}`);
            }
        },

        // 工具：跨域 fetch 文本
        fetchText(url) {
            return new Promise((resolve, reject) => {
                try {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: url,
                        responseType: 'text',
                        onload: (resp) => resolve(resp.responseText),
                        onerror: (err) => reject(new Error(err.statusText || '请求失败')),
                        ontimeout: () => reject(new Error('请求超时')),
                    });
                } catch {
                    // GM_xmlhttpRequest 不可用时退回 fetch
                    fetch(url).then(r => r.text()).then(resolve).catch(reject);
                }
            });
        },

        // 工具：跨域 fetch 为 Blob
        fetchBlob(url) {
            return new Promise((resolve, reject) => {
                try {
                    GM_xmlhttpRequest({
                        method: 'GET',
                        url: url,
                        responseType: 'blob',
                        onload: (resp) => resolve(resp.response),
                        onerror: (err) => reject(new Error(err.statusText || '请求失败')),
                        ontimeout: () => reject(new Error('请求超时')),
                    });
                } catch {
                    fetch(url).then(r => r.blob()).then(resolve).catch(reject);
                }
            });
        },

        generateFilename(url, info) {
            // 尝试从URL中提取有意义的文件名
            let name;
            try {
                const u = new URL(url);
                const pathParts = u.pathname.split('/').filter(Boolean);
                const last = pathParts[pathParts.length - 1] || 'video';
                name = last.replace(/\.[^.]+$/, ''); // 去掉扩展名
                name = name.replace(/[?#].*/, '');   // 去掉查询参数
                name = decodeURIComponent(name);
                // 如果名字太长或太短
                if (name.length < 2 || name.length > 80) {
                    name = `${Utils.currentSite()}_${Date.now()}`;
                }
            } catch {
                name = `${Utils.currentSite()}_${Date.now()}`;
            }
            const ext = info.format === 'mp4' ? '.mp4' : info.format === 'flv' ? '.flv' : '.ts';
            return `${name}${ext}`;
        },

        escapeAttr(str) {
            return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        },
    };

    // ============================================================
    //  模块三：界面净化
    // ============================================================
    const UICleaner = {
        init() {
            const site = Utils.currentSite();
            this.cleanGlobal(site);
            this.cleanSiteSpecific(site);
            this.observeNewElements(site);
            Utils.info(`界面净化已启用 [${site}]`);
        },

        cleanGlobal(site) {
            // 去除弹窗
            if (CONFIG.removePopup) {
                this.hideBySelectors([
                    '[class*="modal"]', '[class*="popup"]', '[class*="dialog"]',
                    '[class*="overlay"]:not([class*="player"])',
                    '[class*="mask"]:not([class*="player"])',
                ], false); // false = 不立即隐藏所有modal，只隐藏广告类
            }

            // 去除悬浮元素
            if (CONFIG.removeFloat) {
                this.hideBySelectors([
                    '[class*="float"]', '[class*="suspend"]',
                    '[class*="fixed-bottom"]', '[class*="fixed-right"]',
                    '[class*="back-top"]', '[class*="go-top"]',
                    '[class*="feedback"]',
                    '[class*="app-download"]', '[class*="download-bar"]',
                    '[class*="login-tip"]', '[class*="vip-tip"]',
                    '[class*="open-app"]',
                ]);
            }

            // 去除侧边栏
            if (CONFIG.removeSidebar) {
                this.hideBySelectors([
                    '[class*="sidebar"]', '[class*="side-bar"]',
                    '[class*="aside"]', '[class*="right-bar"]',
                ]);
            }
        },

        cleanSiteSpecific(site) {
            const rules = {
                iflix: [
                    // 去除注册/登录弹窗
                    '[class*="signup"]', '[class*="login-modal"]',
                    // 去除VIP推广
                    '[class*="premium-promo"]', '[class*="upgrade-banner"]',
                ],
                iq: [
                    // 爱奇艺海外版
                    '.iqp-header-vip', '.iqp-right-vip',
                    '.iqp-tip', '.iqp-guide',
                    '.m-iqp-bottombar', // 移动端底栏
                    '[class*="iqp-layer"]',
                ],
                youku: [
                    // 优酷
                    '.header-vip', '.yk-guide',
                    '.youku-footer', // 页脚
                    '[class*="youku-layer"]',
                    '.sidebar', '#module-subscribe',
                ],
                movie1905: [
                    // 1905
                    '.header-ad', '.footer',
                    '.side-bar', '.recommend',
                ],
                pptv: [
                    // PPTV
                    '.pp-header-ad', '.pp-sidebar',
                    '.pp-footer', '.pp-app-download',
                ],
                tudou: [
                    // 土豆
                    '.td-sidebar', '.td-footer',
                    '.td-app-download', '.td-login',
                ],
                bili: [
                    // B站
                    '.bili-header-m .nav-item:has(.download-icon)',
                    '.international-header .download-entry',
                    '.bili-dyn-home--recommend',
                    '.bili-dyn-item--ad',
                    '.floor-single-card',  // 活动推广
                    '.channel-item--ad',
                    '.pop-live-small-mode', // 直播小窗
                    '.v-wrap .right-section .r-ad',
                    '.bili-mini-mask', // 迷你播放器遮罩
                    '.bili-toast-item', // 各种通知弹窗
                ],
                xigua: [
                    // 西瓜
                    '[class*="xigua-app"]', '[class*="download-bar"]',
                    '.xigua-footer', '.xigua-sidebar',
                ],
            };

            (rules[site] || []).forEach(sel => {
                try {
                    document.querySelectorAll(sel).forEach(el => Utils.hide(el));
                } catch {}
            });
        },

        hideBySelectors(selectors, hideAll = true) {
            selectors.forEach(sel => {
                try {
                    document.querySelectorAll(sel).forEach(el => {
                        // 智能判断：如果是广告/推广相关则隐藏，否则保留
                        if (hideAll) {
                            Utils.hide(el);
                            return;
                        }
                        const text = (el.textContent || '').toLowerCase();
                        const cls = (el.className || '').toLowerCase();
                        const hasAdKeyword = /ad|advert|guanggao|推广|广告|sponsor|promo|vip|会员|premium|upgrade/.test(text + cls);
                        if (hasAdKeyword) {
                            Utils.hide(el);
                        }
                    });
                } catch {}
            });
        },

        observeNewElements(site) {
            const debounced = Utils.debounce(() => {
                this.cleanGlobal(site);
                this.cleanSiteSpecific(site);
            }, 2000);

            Utils.observe(document.body, debounced);
        },
    };

    // ============================================================
    //  模块四：平台专属优化
    // ============================================================
    const PlatformOptimizer = {
        init() {
            const site = Utils.currentSite();
            switch (site) {
                case 'bili': this.optimizeBili(); break;
                case 'iq': this.optimizeIQ(); break;
                case 'youku': this.optimizeYouku(); break;
                case 'iflix': this.optimizeIflix(); break;
                case 'pptv': this.optimizePPTV(); break;
            }
        },

        // B站专属优化
        optimizeBili() {
            Utils.log('应用B站专属优化...');

            // 去除"大会员购买"横幅
            const removeVIPBanner = () => {
                document.querySelectorAll([
                    '.vip-m', '.vip-pay', '.game-card',
                    '.ad-floor', '.bili-float-card',
                    '.activity-banner', '.section-title-ad',
                ].join(',')).forEach(el => Utils.hide(el));
            };

            removeVIPBanner();
            setInterval(removeVIPBanner, 3000);

            // 去除搜索结果中的广告
            this.cleanSearchAds();

            // 简化评论区
            // GM_addStyle(`
            //     .comment-list .ad-videocard { display: none !important; }
            // `);
        },

        cleanSearchAds() {
            const origPushState = history.pushState;
            history.pushState = function () {
                origPushState.apply(this, arguments);
                setTimeout(() => {
                    document.querySelectorAll('.search-result .video-card-ad').forEach(el => Utils.hide(el));
                }, 1000);
            };
        },

        // 爱奇艺海外版专属优化
        optimizeIQ() {
            Utils.log('应用爱奇艺海外版专属优化...');

            // 去除VIP提示
            const removeVIPTips = () => {
                document.querySelectorAll([
                    '.iqp-tip-vip', '.iqp-right-vip',
                    '.vip-icon', '.iqp-vip-layer',
                ].join(',')).forEach(el => Utils.hide(el));
            };
            removeVIPTips();
            setInterval(removeVIPTips, 3000);

            // 恢复右键菜单
            document.addEventListener('contextmenu', (e) => e.stopPropagation(), true);
        },

        // 优酷专属优化
        optimizeYouku() {
            Utils.log('应用优酷专属优化...');

            // 去除水印Logo
            const removeLogo = () => {
                document.querySelectorAll([
                    '.youku-layer-logo',
                    '[class*="watermark"]',
                    '[class*="corner-mark"]',
                ].join(',')).forEach(el => Utils.hide(el));
            };
            removeLogo();
            setInterval(removeLogo, 3000);

            // 恢复右键
            document.addEventListener('contextmenu', (e) => e.stopPropagation(), true);
        },

        // iflix专属优化
        optimizeIflix() {
            Utils.log('应用iflix专属优化...');

            // 去除注册提示
            const removeSignup = () => {
                document.querySelectorAll([
                    '[class*="signup-prompt"]',
                    '[class*="login-wall"]',
                    '[class*="auth-modal"]',
                ].join(',')).forEach(el => Utils.hide(el));
            };
            removeSignup();
            setInterval(removeSignup, 3000);
        },

        // PPTV专属优化
        optimizePPTV() {
            Utils.log('应用PPTV专属优化...');

            const cleanPPTV = () => {
                document.querySelectorAll([
                    '.pp-tip', '.pp-vip-tip',
                    '.pp-app-guide', '.pp-login-tip',
                ].join(',')).forEach(el => Utils.hide(el));
            };
            cleanPPTV();
            setInterval(cleanPPTV, 3000);
        },
    };

    // ============================================================
    //  模块五：快捷键
    // ============================================================
    const Shortcuts = {
        init() {
            document.addEventListener('keydown', (e) => {
                // 忽略输入框中的快捷键
                if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

                const video = document.querySelector('video');
                if (!video) return;

                switch (e.key) {
                    case '>': // 加速
                        e.preventDefault();
                        video.playbackRate = Math.min(video.playbackRate + 0.25, 16);
                        Utils.info(`倍速: ${video.playbackRate}x`);
                        break;
                    case '<': // 减速
                        e.preventDefault();
                        video.playbackRate = Math.max(video.playbackRate - 0.25, 0.25);
                        Utils.info(`倍速: ${video.playbackRate}x`);
                        break;
                    case 'ArrowUp': // 音量+
                        if (e.shiftKey) {
                            e.preventDefault();
                            video.volume = Math.min(video.volume + 0.1, 1);
                        }
                        break;
                    case 'ArrowDown': // 音量-
                        if (e.shiftKey) {
                            e.preventDefault();
                            video.volume = Math.max(video.volume - 0.1, 0);
                        }
                        break;
                    case 'p': // 画中画
                        if (!e.ctrlKey && !e.metaKey) {
                            e.preventDefault();
                            if (document.pictureInPictureElement) {
                                document.exitPictureInPicture().catch(() => {});
                            } else {
                                video.requestPictureInPicture().catch(() => {});
                            }
                        }
                        break;
                    case 'f': // 全屏
                        if (!e.ctrlKey && !e.metaKey) {
                            e.preventDefault();
                            VideoEnhancer.enterFullscreen(video);
                        }
                        break;
                    case 'd': // 调试模式
                        if (e.ctrlKey && e.altKey) {
                            e.preventDefault();
                            CONFIG.debug = !CONFIG.debug;
                            GM_setValue('debug', CONFIG.debug);
                            Utils.info(`调试模式: ${CONFIG.debug ? '开启' : '关闭'}`);
                        }
                        break;
                }
            });
            Utils.info('快捷键: < > 倍速 | Shift+↑↓ 音量 | P 画中画 | F 全屏 | Ctrl+Alt+D 调试');
        },
    };

    // ============================================================
    //  脚本菜单注册
    // ============================================================
    function registerMenuCommands() {
        GM_registerMenuCommand('🎬 打开/关闭 控制面板', () => {
            const panel = document.getElementById('ve-control-panel');
            if (panel) {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
            }
        });

        GM_registerMenuCommand('🔄 重置设置', () => {
            const keys = ['defaultSpeed', 'autoPlay', 'autoFullscreen', 'removePopup', 'removeFloat', 'removeSidebar', 'skipIntro', 'skipOutro', 'debug'];
            keys.forEach(k => GM_setValue(k, undefined));
            GM_notification({ text: '设置已重置，刷新页面生效', title: '视频增强助手' });
            location.reload();
        });

        GM_registerMenuCommand('📊 广告统计', () => {
            GM_notification({
                text: `已屏蔽 ${AdBlocker.removedCount} 个广告元素`,
                title: '视频增强助手 - 广告统计',
            });
        });
    }

    // ============================================================
    //  启动入口
    // ============================================================
    function main() {
        const site = Utils.currentSite();
        Utils.info(`已启动 [${site}] ${location.href}`);

        // 阶段1：document-start 时立即执行的优化
        AdBlocker.init();       // 广告拦截 (CSS注入+请求拦截)
        VideoDownloader.init(); // 视频源拦截 (必须在document-start阶段hook请求)

        // 阶段2：DOM就绪后执行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', onReady);
        } else {
            onReady();
        }

        function onReady() {
            UICleaner.init();            // 界面净化
            PlatformOptimizer.init();    // 平台专属优化
            Shortcuts.init();            // 快捷键
            registerMenuCommands();      // 菜单命令

            // 稍延迟初始化视频增强 (等待播放器加载)
            setTimeout(() => {
                VideoEnhancer.init();
            }, 2000);

            Utils.info(`全部模块已加载完成`);
        }
    }

    // 启动！
    main();
})();
