// ==UserScript==
// @name         视频资源聚合搜索器
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  聚合搜索多个视频平台的资源，包括B站、YouTube、优酷、爱奇艺、腾讯视频等
// @author       WorkBuddy
// @match        *://*/*
// @grant        GM_addStyle
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // 配置
    const CONFIG = {
        // 快捷键：Ctrl/Cmd + Shift + V
        shortcutKey: 'v',
        // 搜索引擎配置
        searchEngines: [
            // 主流视频平台
            {
                name: 'Bilibili',
                icon: '📺',
                url: 'https://search.bilibili.com/all?keyword={keyword}',
                color: '#FB7299',
                category: 'main'
            },
            {
                name: 'YouTube',
                icon: '▶️',
                url: 'https://www.youtube.com/results?search_query={keyword}',
                color: '#FF0000',
                category: 'main'
            },
            {
                name: '优酷',
                icon: '👖',
                url: 'https://so.youku.com/search_video/q_{keyword}',
                color: '#1E90FF',
                category: 'main'
            },
            {
                name: '爱奇艺',
                icon: '🥝',
                url: 'https://so.iqiyi.com/so/q_{keyword}',
                color: '#00BE06',
                category: 'main'
            },
            {
                name: '腾讯视频',
                icon: '🐧',
                url: 'https://v.qq.com/x/search/?q={keyword}',
                color: '#00A0FF',
                category: 'main'
            },
            {
                name: '芒果TV',
                icon: '🥭',
                url: 'https://so.mgtv.com/so?k={keyword}',
                color: '#FF6600',
                category: 'main'
            },
            {
                name: '西瓜视频',
                icon: '🍉',
                url: 'https://www.ixigua.com/search/{keyword}',
                color: '#FF4444',
                category: 'main'
            },
            {
                name: '抖音',
                icon: '🎵',
                url: 'https://www.douyin.com/search/{keyword}',
                color: '#000000',
                category: 'main'
            },
            {
                name: '快手',
                icon: '⚡',
                url: 'https://www.kuaishou.com/search/video?searchKey={keyword}',
                color: '#FF6600',
                category: 'main'
            },
            // 动漫平台
            {
                name: 'AcFun',
                icon: '🅰️',
                url: 'https://www.acfun.cn/search?keyword={keyword}',
                color: '#FD4C5D',
                category: 'anime'
            },
            {
                name: '樱花动漫',
                icon: '🌸',
                url: 'http://www.yinghuadm.cn/search/?wd={keyword}',
                color: '#FFB7C5',
                category: 'anime'
            },
            {
                name: 'AGE动漫',
                icon: '👑',
                url: 'https://www.agemys.net/search?query={keyword}',
                color: '#9B59B6',
                category: 'anime'
            },
            {
                name: 'ZzzFun',
                icon: '💤',
                url: 'http://www.zzzfun.com/vod_search.html?wd={keyword}',
                color: '#3498DB',
                category: 'anime'
            },
            {
                name: '嘀哩嘀哩',
                icon: '🌐',
                url: 'https://www.dilidili.tv/search/?wd={keyword}',
                color: '#00CED1',
                category: 'anime'
            },
            // 影视资源站
            {
                name: '豆瓣',
                icon: '📖',
                url: 'https://search.douban.com/movie/subject_search?search_text={keyword}',
                color: '#00B51D',
                category: 'resource'
            },
            {
                name: '电影天堂',
                icon: '🎬',
                url: 'https://www.dytt8.net/plus/search.php?kwtype=0&keyword={keyword}',
                color: '#FF6B6B',
                category: 'resource'
            },
            {
                name: 'BT天堂',
                icon: '🔽',
                url: 'https://www.bt-tt.com/search/{keyword}.html',
                color: '#E74C3C',
                category: 'resource'
            },
            {
                name: '片库',
                icon: '📚',
                url: 'https://www.pianku.tv/search.html?wd={keyword}',
                color: '#F39C12',
                category: 'resource'
            },
            {
                name: '茶杯狐',
                icon: '🦊',
                url: 'https://www.cupfox.app/search?key={keyword}',
                color: '#E67E22',
                category: 'resource'
            },
            {
                name: 'LIBVIO',
                icon: '📀',
                url: 'https://www.libvio.fun/search/-------------.html?wd={keyword}',
                color: '#1ABC9C',
                category: 'resource'
            },
            {
                name: '555电影',
                icon: '🎭',
                url: 'https://www.555dy1.com/vodsearch/-------------.html?wd={keyword}',
                color: '#9B59B6',
                category: 'resource'
            },
            {
                name: '大师兄影视',
                icon: '👤',
                url: 'https://www.dsxys.com/search.html?wd={keyword}',
                color: '#34495E',
                category: 'resource'
            },
            {
                name: '厂长资源',
                icon: '🏭',
                url: 'https://www.czspp.com/vodsearch/-------------.html?wd={keyword}',
                color: '#16A085',
                category: 'resource'
            },
            {
                name: '在线之家',
                icon: '🏠',
                url: 'https://www.zxzj.pro/vodsearch/-------------.html?wd={keyword}',
                color: '#2980B9',
                category: 'resource'
            },
            {
                name: '低端影视',
                icon: '⬇️',
                url: 'https://ddys.art/search/{keyword}/',
                color: '#7F8C8D',
                category: 'resource'
            },
            // 网盘搜索
            {
                name: '阿里云盘搜索',
                icon: '☁️',
                url: 'https://www.alipanx.com/search?keyword={keyword}',
                color: '#FF6A00',
                category: 'cloud'
            },
            {
                name: '小兔搜搜',
                icon: '🐰',
                url: 'https://www.xuesousou.net/search?keyword={keyword}',
                color: '#FF85A2',
                category: 'cloud'
            },
            {
                name: '猫狸盘搜',
                icon: '🐱',
                url: 'https://www.alipansou.com/search?keyword={keyword}',
                color: '#FF6B9D',
                category: 'cloud'
            },
            // 字幕组
            {
                name: '人人影视',
                icon: '👥',
                url: 'https://www.YYeTs.com/search?keyword={keyword}',
                color: '#3498DB',
                category: 'subtitle'
            },
            {
                name: 'SubHD',
                icon: '📝',
                url: 'https://subhd.tv/search/{keyword}',
                color: '#27AE60',
                category: 'subtitle'
            }
        ]
    };

    // 创建样式
    GM_addStyle(`
        #video-search-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(5px);
            z-index: 999999;
            display: none;
            justify-content: center;
            align-items: flex-start;
            padding-top: 100px;
            animation: fadeIn 0.2s ease;
        }

        #video-search-overlay.active {
            display: flex;
        }

        #video-search-container {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border-radius: 20px;
            padding: 30px;
            width: 90%;
            max-width: 800px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
            animation: slideDown 0.3s ease;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        #video-search-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
        }

        #video-search-header h2 {
            color: #fff;
            margin: 0;
            font-size: 20px;
            display: flex;
            align-items: center;
            gap: 10px;
        }

        #video-search-close {
            margin-left: auto;
            background: none;
            border: none;
            color: #888;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 36px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: all 0.2s;
        }

        #video-search-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: #fff;
        }

        #video-search-input-wrapper {
            position: relative;
            margin-bottom: 25px;
        }

        #video-search-input {
            width: 100%;
            padding: 18px 25px;
            font-size: 18px;
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            background: rgba(0, 0, 0, 0.3);
            color: #fff;
            outline: none;
            transition: all 0.3s;
            box-sizing: border-box;
        }

        #video-search-input:focus {
            border-color: #FB7299;
            background: rgba(0, 0, 0, 0.5);
            box-shadow: 0 0 20px rgba(251, 114, 153, 0.3);
        }

        #video-search-input::placeholder {
            color: #666;
        }

        #video-search-shortcut-hint {
            position: absolute;
            right: 15px;
            top: 50%;
            transform: translateY(-50%);
            color: #666;
            font-size: 12px;
            background: rgba(255, 255, 255, 0.1);
            padding: 4px 8px;
            border-radius: 6px;
        }

        #video-search-engines {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
            gap: 12px;
            max-height: 400px;
            overflow-y: auto;
            padding-right: 10px;
        }

        #video-search-engines::-webkit-scrollbar {
            width: 6px;
        }

        #video-search-engines::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
            border-radius: 3px;
        }

        #video-search-engines::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 3px;
        }

        #video-search-engines::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.3);
        }

        .video-search-category {
            grid-column: 1 / -1;
            color: #888;
            font-size: 13px;
            font-weight: 600;
            margin-top: 15px;
            margin-bottom: 5px;
            padding-left: 5px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .video-search-category:first-of-type {
            margin-top: 0;
        }

        .video-search-engine-btn {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 15px 18px;
            border: none;
            border-radius: 12px;
            background: rgba(255, 255, 255, 0.05);
            color: #fff;
            cursor: pointer;
            transition: all 0.3s;
            font-size: 14px;
            font-weight: 500;
            text-align: left;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }

        .video-search-engine-btn:hover {
            transform: translateY(-3px);
            background: rgba(255, 255, 255, 0.1);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        }

        .video-search-engine-btn .engine-icon {
            font-size: 20px;
            width: 30px;
            text-align: center;
        }

        .video-search-engine-btn .engine-name {
            flex: 1;
        }

        .video-search-engine-btn.all-search {
            grid-column: 1 / -1;
            justify-content: center;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            font-size: 16px;
            padding: 18px;
        }

        .video-search-engine-btn.all-search:hover {
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        .video-search-all-group {
            grid-column: 1 / -1;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 10px;
        }

        .video-search-engine-btn.all-search.main {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .video-search-engine-btn.all-search.anime {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .video-search-engine-btn.all-search.resource {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .video-search-engine-btn.all-search.cloud {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .video-search-engine-btn.all-search.main:hover {
            background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        .video-search-engine-btn.all-search.anime:hover {
            background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%);
            box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);
        }

        .video-search-engine-btn.all-search.resource:hover {
            background: linear-gradient(135deg, #00f2fe 0%, #4facfe 100%);
            box-shadow: 0 10px 30px rgba(79, 172, 254, 0.4);
        }

        .video-search-engine-btn.all-search.cloud:hover {
            background: linear-gradient(135deg, #38f9d7 0%, #43e97b 100%);
            box-shadow: 0 10px 30px rgba(67, 233, 123, 0.4);
        }

        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        /* 浮动按钮 */
        #video-search-floating-btn {
            position: fixed;
            bottom: 30px;
            right: 30px;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FB7299 0%, #FF6B6B 100%);
            border: none;
            color: #fff;
            font-size: 24px;
            cursor: pointer;
            box-shadow: 0 8px 25px rgba(251, 114, 153, 0.4);
            z-index: 999998;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        #video-search-floating-btn:hover {
            transform: scale(1.1) rotate(10deg);
            box-shadow: 0 12px 35px rgba(251, 114, 153, 0.5);
        }

        #video-search-floating-btn:active {
            transform: scale(0.95);
        }

        /* 提示信息 */
        .video-search-toast {
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%) translateY(100px);
            background: rgba(0, 0, 0, 0.8);
            color: #fff;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 1000000;
            opacity: 0;
            transition: all 0.3s;
        }

        .video-search-toast.show {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    `);

    // 创建DOM元素
    function createSearchUI() {
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.id = 'video-search-overlay';

        // 创建搜索容器
        const container = document.createElement('div');
        container.id = 'video-search-container';

        // 头部
        const header = document.createElement('div');
        header.id = 'video-search-header';
        header.innerHTML = `
            <h2>🔍 视频资源聚合搜索</h2>
            <button id="video-search-close">×</button>
        `;

        // 输入框
        const inputWrapper = document.createElement('div');
        inputWrapper.id = 'video-search-input-wrapper';
        inputWrapper.innerHTML = `
            <input type="text" id="video-search-input" placeholder="输入视频名称、电影、电视剧、动漫..." autocomplete="off">
            <span id="video-search-shortcut-hint">Ctrl+Shift+V</span>
        `;

        // 搜索引擎按钮区域
        const enginesDiv = document.createElement('div');
        enginesDiv.id = 'video-search-engines';

        // 添加"全部搜索"按钮组
        const searchAllGroup = document.createElement('div');
        searchAllGroup.className = 'video-search-all-group';
        searchAllGroup.innerHTML = `
            <button class="video-search-engine-btn all-search main" onclick="window.videoSearchSearchAll()">
                🚀 搜索主流平台
            </button>
            <button class="video-search-engine-btn all-search anime" onclick="window.videoSearchSearchCategory('anime')">
                🎌 搜索动漫
            </button>
            <button class="video-search-engine-btn all-search resource" onclick="window.videoSearchSearchCategory('resource')">
                🎬 搜索影视资源
            </button>
            <button class="video-search-engine-btn all-search cloud" onclick="window.videoSearchSearchCategory('cloud')">
                ☁️ 搜索网盘
            </button>
        `;
        enginesDiv.appendChild(searchAllGroup);

        // 暴露函数到全局
        window.videoSearchSearchAll = searchAll;
        window.videoSearchSearchCategory = searchByCategory;

        // 添加分类标题和按钮
        const categories = {
            main: { title: '📺 主流平台', engines: [] },
            anime: { title: '🎌 动漫专区', engines: [] },
            resource: { title: '🎬 影视资源', engines: [] },
            cloud: { title: '☁️ 网盘搜索', engines: [] },
            subtitle: { title: '📝 字幕资源', engines: [] }
        };

        // 按分类整理搜索引擎
        CONFIG.searchEngines.forEach(engine => {
            if (categories[engine.category]) {
                categories[engine.category].engines.push(engine);
            }
        });

        // 创建分类区域
        Object.entries(categories).forEach(([key, category]) => {
            if (category.engines.length === 0) return;

            // 分类标题
            const categoryTitle = document.createElement('div');
            categoryTitle.className = 'video-search-category';
            categoryTitle.textContent = category.title;
            enginesDiv.appendChild(categoryTitle);

            // 该分类下的按钮
            category.engines.forEach(engine => {
                const btn = document.createElement('button');
                btn.className = 'video-search-engine-btn';
                btn.style.borderLeft = `4px solid ${engine.color}`;
                btn.innerHTML = `
                    <span class="engine-icon">${engine.icon}</span>
                    <span class="engine-name">${engine.name}</span>
                `;
                btn.onclick = () => search(engine);
                enginesDiv.appendChild(btn);
            });
        });

        container.appendChild(header);
        container.appendChild(inputWrapper);
        container.appendChild(enginesDiv);
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        // 创建浮动按钮
        const floatingBtn = document.createElement('button');
        floatingBtn.id = 'video-search-floating-btn';
        floatingBtn.innerHTML = '🔍';
        floatingBtn.title = '视频搜索 (Ctrl+Shift+V)';
        floatingBtn.onclick = showSearch;
        document.body.appendChild(floatingBtn);

        // 创建提示元素
        const toast = document.createElement('div');
        toast.className = 'video-search-toast';
        document.body.appendChild(toast);

        // 绑定事件
        document.getElementById('video-search-close').onclick = hideSearch;
        document.getElementById('video-search-input').onkeydown = (e) => {
            if (e.key === 'Enter') {
                searchAll();
            }
        };

        // 点击遮罩关闭
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                hideSearch();
            }
        };
    }

    // 显示搜索框
    function showSearch() {
        const overlay = document.getElementById('video-search-overlay');
        const input = document.getElementById('video-search-input');
        overlay.classList.add('active');
        input.value = '';
        input.focus();
    }

    // 隐藏搜索框
    function hideSearch() {
        const overlay = document.getElementById('video-search-overlay');
        overlay.classList.remove('active');
    }

    // 搜索单个平台
    function search(engine) {
        const input = document.getElementById('video-search-input');
        const keyword = input.value.trim();

        if (!keyword) {
            showToast('请输入搜索关键词');
            input.focus();
            return;
        }

        const url = engine.url.replace('{keyword}', encodeURIComponent(keyword));
        GM_openInTab(url, { active: true });
        hideSearch();
    }

    // 搜索所有平台
    function searchAll() {
        const input = document.getElementById('video-search-input');
        const keyword = input.value.trim();

        if (!keyword) {
            showToast('请输入搜索关键词');
            input.focus();
            return;
        }

        // 只打开主流平台，避免打开太多标签
        const mainEngines = CONFIG.searchEngines.filter(e => e.category === 'main');
        mainEngines.forEach((engine, index) => {
            setTimeout(() => {
                const url = engine.url.replace('{keyword}', encodeURIComponent(keyword));
                GM_openInTab(url, { active: index === 0 });
            }, index * 200);
        });

        showToast(`正在打开 ${mainEngines.length} 个主流平台...`);
        hideSearch();
    }

    // 按分类搜索
    function searchByCategory(category) {
        const input = document.getElementById('video-search-input');
        const keyword = input.value.trim();

        if (!keyword) {
            showToast('请输入搜索关键词');
            input.focus();
            return;
        }

        const categoryEngines = CONFIG.searchEngines.filter(e => e.category === category);
        categoryEngines.forEach((engine, index) => {
            setTimeout(() => {
                const url = engine.url.replace('{keyword}', encodeURIComponent(keyword));
                GM_openInTab(url, { active: index === 0 });
            }, index * 200);
        });

        const categoryNames = {
            main: '主流平台',
            anime: '动漫平台',
            resource: '影视资源站',
            cloud: '网盘搜索',
            subtitle: '字幕资源'
        };

        showToast(`正在打开 ${categoryNames[category]}...`);
        hideSearch();
    }

    // 显示提示
    function showToast(message) {
        const toast = document.querySelector('.video-search-toast');
        toast.textContent = message;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // 键盘快捷键
    function handleKeydown(e) {
        // Ctrl/Cmd + Shift + V
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === CONFIG.shortcutKey) {
            e.preventDefault();
            const overlay = document.getElementById('video-search-overlay');
            if (overlay.classList.contains('active')) {
                hideSearch();
            } else {
                showSearch();
            }
        }

        // ESC关闭
        if (e.key === 'Escape') {
            const overlay = document.getElementById('video-search-overlay');
            if (overlay.classList.contains('active')) {
                hideSearch();
            }
        }
    }

    // 初始化
    function init() {
        createSearchUI();
        document.addEventListener('keydown', handleKeydown);
        console.log('[视频资源聚合搜索器] 已加载，按 Ctrl+Shift+V 打开搜索');
    }

    // 等待页面加载完成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
