/**
 * 前端日志记录工具
 * 用于记录用户交互操作，帮助调试点击操作等交互问题
 */

// 日志级别枚举
const LOG_LEVEL = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    WARNING: 'WARNING',
    ERROR: 'ERROR'
};

// 当前日志级别
let currentLogLevel = LOG_LEVEL.INFO;

// 日志存储数组
let logStore = [];

// 日志最大存储数量
const MAX_LOGS = 200;

/**
 * 设置日志级别
 * @param {string} level - 日志级别
 */
function setLogLevel(level) {
    if (LOG_LEVEL[level.toUpperCase()]) {
        currentLogLevel = LOG_LEVEL[level.toUpperCase()];
        log(`日志级别已设置为: ${currentLogLevel}`, LOG_LEVEL.INFO);
    }
}

/**
 * 记录日志
 * @param {string} message - 日志消息
 * @param {string} level - 日志级别
 * @param {Object} data - 附加数据（可选）
 */
function log(message, level = LOG_LEVEL.INFO, data = null) {
    // 检查日志级别
    const levelOrder = [LOG_LEVEL.DEBUG, LOG_LEVEL.INFO, LOG_LEVEL.WARNING, LOG_LEVEL.ERROR];
    if (levelOrder.indexOf(level) < levelOrder.indexOf(currentLogLevel)) {
        return;
    }
    
    // 创建日志对象
    const logEntry = {
        timestamp: new Date(),
        level: level,
        message: message,
        data: data
    };
    
    // 添加到存储
    logStore.push(logEntry);
    
    // 如果超过最大存储数量，移除最早的日志
    if (logStore.length > MAX_LOGS) {
        logStore.shift();
    }
    
    // 输出到控制台
    const timestampStr = logEntry.timestamp.toLocaleTimeString();
    const logMessage = `[${timestampStr}] [${level}] ${message}`;
    
    switch (level) {
        case LOG_LEVEL.ERROR:
            console.error(logMessage, data);
            break;
        case LOG_LEVEL.WARNING:
            console.warn(logMessage, data);
            break;
        case LOG_LEVEL.DEBUG:
            console.debug(logMessage, data);
            break;
        default:
            console.log(logMessage, data);
    }
    
    // 更新页面上的日志显示（如果存在日志面板）
    updateLogDisplay();
}

/**
 * 更新页面上的日志显示
 */
function updateLogDisplay() {
    const logPanel = document.getElementById('interaction-log-panel');
    if (!logPanel) return;
    
    const logContent = document.getElementById('interaction-log-content');
    if (!logContent) return;
    
    // 清空现有内容
    logContent.innerHTML = '';
    
    // 添加最新的日志（最多显示50条）
    const logsToShow = logStore.slice(-50);
    
    logsToShow.forEach(entry => {
        const logItem = document.createElement('div');
        logItem.className = `log-item log-${entry.level.toLowerCase()}`;
        
        const timestamp = entry.timestamp.toLocaleTimeString();
        let logHTML = `<span class="log-timestamp">[${timestamp}]</span> `;
        logHTML += `<span class="log-level log-level-${entry.level.toLowerCase()}">[${entry.level}]</span> `;
        logHTML += `<span class="log-message">${entry.message}</span>`;
        
        // 如果有附加数据，也显示出来
        if (entry.data) {
            try {
                const dataStr = JSON.stringify(entry.data, null, 2);
                logHTML += `<pre class="log-data">${dataStr}</pre>`;
            } catch (e) {
                logHTML += `<pre class="log-data">${String(entry.data)}</pre>`;
            }
        }
        
        logItem.innerHTML = logHTML;
        logContent.appendChild(logItem);
    });
    
    // 自动滚动到底部
    logContent.scrollTop = logContent.scrollHeight;
}

/**
 * 创建并显示日志面板
 */
function showLogPanel() {
    // 检查是否已经存在日志面板
    if (document.getElementById('interaction-log-panel')) {
        return;
    }
    
    // 创建日志面板容器
    const logPanel = document.createElement('div');
    logPanel.id = 'interaction-log-panel';
    logPanel.className = 'interaction-log-panel';
    
    // 创建日志头部
    const logHeader = document.createElement('div');
    logHeader.className = 'log-header';
    logHeader.innerHTML = `
        <h3>交互日志</h3>
        <div class="log-controls">
            <button class="btn btn-sm" onclick="clearLogs()">清空</button>
            <button class="btn btn-sm" onclick="toggleLogPanel()">隐藏</button>
        </div>
    `;
    
    // 创建日志内容区域
    const logContent = document.createElement('div');
    logContent.id = 'interaction-log-content';
    logContent.className = 'log-content';
    
    // 组装日志面板
    logPanel.appendChild(logHeader);
    logPanel.appendChild(logContent);
    
    // 添加到页面
    document.body.appendChild(logPanel);
    
    // 应用样式
    applyLogStyles();
    
    // 更新日志显示
    updateLogDisplay();
    
    log('日志面板已显示', LOG_LEVEL.INFO);
}

/**
 * 隐藏日志面板
 */
function hideLogPanel() {
    const logPanel = document.getElementById('interaction-log-panel');
    if (logPanel) {
        document.body.removeChild(logPanel);
        log('日志面板已隐藏', LOG_LEVEL.INFO);
    }
}

/**
 * 切换日志面板显示状态
 */
function toggleLogPanel() {
    const logPanel = document.getElementById('interaction-log-panel');
    if (logPanel) {
        hideLogPanel();
    } else {
        showLogPanel();
    }
}

/**
 * 清空日志
 */
function clearLogs() {
    logStore = [];
    updateLogDisplay();
    log('日志已清空', LOG_LEVEL.INFO);
}

/**
 * 应用日志面板样式
 */
function applyLogStyles() {
    // 检查是否已经存在样式
    if (document.getElementById('log-styles')) {
        return;
    }
    
    // 创建样式元素
    const style = document.createElement('style');
    style.id = 'log-styles';
    style.textContent = `
        /* 日志面板样式 */
        .interaction-log-panel {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 400px;
            height: 300px;
            background-color: #fff;
            border: 1px solid #ddd;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10000;
            display: flex;
            flex-direction: column;
            font-family: monospace;
            font-size: 12px;
        }
        
        .log-header {
            padding: 10px 15px;
            background-color: #f5f5f5;
            border-bottom: 1px solid #ddd;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-radius: 8px 8px 0 0;
        }
        
        .log-header h3 {
            margin: 0;
            font-size: 14px;
            color: #333;
        }
        
        .log-controls {
            display: flex;
            gap: 5px;
        }
        
        .log-controls .btn {
            padding: 4px 8px;
            font-size: 11px;
            border-radius: 3px;
            cursor: pointer;
            background-color: #f0f0f0;
            border: 1px solid #ddd;
        }
        
        .log-controls .btn:hover {
            background-color: #e0e0e0;
        }
        
        .log-content {
            flex: 1;
            padding: 10px;
            overflow-y: auto;
            background-color: #fafafa;
        }
        
        .log-item {
            margin-bottom: 8px;
            padding: 5px;
            border-radius: 3px;
            white-space: pre-wrap;
        }
        
        .log-debug {
            background-color: #f0f8ff;
            border-left: 3px solid #1890ff;
        }
        
        .log-info {
            background-color: #f6ffed;
            border-left: 3px solid #52c41a;
        }
        
        .log-warning {
            background-color: #fffbe6;
            border-left: 3px solid #faad14;
        }
        
        .log-error {
            background-color: #fff2f0;
            border-left: 3px solid #f5222d;
        }
        
        .log-timestamp {
            color: #666;
            font-size: 11px;
        }
        
        .log-level {
            font-weight: bold;
            margin: 0 5px;
        }
        
        .log-level-debug {
            color: #1890ff;
        }
        
        .log-level-info {
            color: #52c41a;
        }
        
        .log-level-warning {
            color: #faad14;
        }
        
        .log-level-error {
            color: #f5222d;
        }
        
        .log-message {
            color: #333;
        }
        
        .log-data {
            margin: 5px 0 0 20px;
            padding: 5px;
            background-color: #fff;
            border: 1px solid #eee;
            border-radius: 3px;
            font-size: 11px;
            color: #666;
            overflow-x: auto;
        }
        
        /* 日志切换按钮 */
        .log-toggle-btn {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: #1890ff;
            color: white;
            border: none;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        
        .log-toggle-btn:hover {
            background-color: #40a9ff;
        }
    `;
    
    // 添加到页面头部
    document.head.appendChild(style);
}

/**
 * 创建日志切换按钮
 */
function createLogToggleButton() {
    // 不创建日志切换按钮
    return;
}

/**
 * 记录菜单项点击事件
 * @param {HTMLElement} element - 点击的元素
 * @param {Event} event - 事件对象
 */
function logMenuItemClick(element, event) {
    const menuText = element.querySelector('.menu-text')?.textContent.trim() || '未知菜单';
    const isActive = element.classList.contains('active');
    const hasSubMenu = element.nextElementSibling && element.nextElementSibling.classList.contains('sub-menu');
    const subMenuVisible = hasSubMenu && element.nextElementSibling.classList.contains('show');
    
    const logData = {
        menuText: menuText,
        isActive: isActive,
        hasSubMenu: hasSubMenu,
        subMenuVisible: subMenuVisible,
        elementClass: element.className,
        clientX: event.clientX,
        clientY: event.clientY,
        timestamp: new Date().toISOString()
    };
    
    log(`菜单项点击: ${menuText}`, LOG_LEVEL.INFO, logData);
}

/**
 * 记录子菜单显示状态变更
 * @param {HTMLElement} subMenu - 子菜单元素
 * @param {boolean} isVisible - 是否显示
 */
function logSubMenuVisibilityChange(subMenu, isVisible) {
    const parentMenuItem = subMenu.previousElementSibling;
    const menuText = parentMenuItem?.querySelector('.menu-text')?.textContent.trim() || '未知菜单';
    
    const logData = {
        menuText: menuText,
        isVisible: isVisible,
        subMenuItemCount: subMenu.querySelectorAll('.sub-menu-item').length
    };
    
    log(`${menuText} 子菜单${isVisible ? '显示' : '隐藏'}`, LOG_LEVEL.DEBUG, logData);
}

// 页面加载完成后初始化日志系统
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        // 记录页面加载完成
        log('页面加载完成，日志系统已初始化', LOG_LEVEL.INFO);
    });
}

// 导出函数，使其可以在其他地方使用
if (typeof window !== 'undefined') {
    window.logger = {
        log: log,
        setLogLevel: setLogLevel,
        showLogPanel: showLogPanel,
        hideLogPanel: hideLogPanel,
        toggleLogPanel: toggleLogPanel,
        clearLogs: clearLogs,
        logMenuItemClick: logMenuItemClick,
        logSubMenuVisibilityChange: logSubMenuVisibilityChange,
        LOG_LEVEL: LOG_LEVEL
    };
}