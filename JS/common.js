/**
 * 通用JavaScript函数库 - 适用于所有页面
 */

/**
 * 显示消息提示
 * @param {string} message - 提示消息
 * @param {string} type - 消息类型：success, error, warning, info
 * @param {number} duration - 显示时长（毫秒），默认3000
 */
function showMessage(message, type = 'info', duration = 3000) {
    // 检查是否已存在消息容器
    let messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        messageContainer.style.position = 'fixed';
        messageContainer.style.top = '20px';
        messageContainer.style.right = '20px';
        messageContainer.style.zIndex = '9999';
        messageContainer.style.display = 'flex';
        messageContainer.style.flexDirection = 'column';
        messageContainer.style.gap = '10px';
        document.body.appendChild(messageContainer);
    }

    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `alert alert-${type}`;
    messageElement.style.minWidth = '300px';
    messageElement.style.padding = '12px 16px';
    messageElement.style.borderRadius = '4px';
    messageElement.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    messageElement.style.transition = 'all 0.3s ease';
    messageElement.style.transform = 'translateX(100%)';
    messageElement.textContent = message;

    // 根据类型设置不同样式
    switch (type) {
        case 'success':
            messageElement.style.backgroundColor = '#f6ffed';
            messageElement.style.border = '1px solid #b7eb8f';
            messageElement.style.color = '#52c41a';
            break;
        case 'error':
            messageElement.style.backgroundColor = '#fff2f0';
            messageElement.style.border = '1px solid #ffccc7';
            messageElement.style.color = '#f5222d';
            break;
        case 'warning':
            messageElement.style.backgroundColor = '#fffbe6';
            messageElement.style.border = '1px solid #ffe58f';
            messageElement.style.color = '#faad14';
            break;
        case 'info':
        default:
            messageElement.style.backgroundColor = '#e6f7ff';
            messageElement.style.border = '1px solid #91d5ff';
            messageElement.style.color = '#1890ff';
            break;
    }

    // 添加到容器
    messageContainer.appendChild(messageElement);

    // 显示动画
    setTimeout(() => {
        messageElement.style.transform = 'translateX(0)';
    }, 10);

    // 自动关闭
    setTimeout(() => {
        messageElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
            messageContainer.removeChild(messageElement);
            if (messageContainer.children.length === 0) {
                document.body.removeChild(messageContainer);
            }
        }, 300);
    }, duration);
}

/**
 * 确认对话框
 * @param {string} message - 确认消息
 * @param {function} confirmCallback - 确认回调函数
 * @param {function} cancelCallback - 取消回调函数
 * @param {string} title - 对话框标题，默认'确认操作'
 */
function confirmDialog(message, confirmCallback, cancelCallback = null, title = '确认操作') {
    // 检查是否已存在确认对话框容器
    let confirmContainer = document.getElementById('confirm-container');
    if (!confirmContainer) {
        confirmContainer = document.createElement('div');
        confirmContainer.id = 'confirm-container';
        confirmContainer.style.position = 'fixed';
        confirmContainer.style.top = '0';
        confirmContainer.style.left = '0';
        confirmContainer.style.width = '100%';
        confirmContainer.style.height = '100%';
        confirmContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        confirmContainer.style.zIndex = '9999';
        confirmContainer.style.display = 'flex';
        confirmContainer.style.alignItems = 'center';
        confirmContainer.style.justifyContent = 'center';
        confirmContainer.style.opacity = '0';
        confirmContainer.style.transition = 'opacity 0.3s ease';
        document.body.appendChild(confirmContainer);

        // 显示动画
        setTimeout(() => {
            confirmContainer.style.opacity = '1';
        }, 10);

        // 点击遮罩关闭
        confirmContainer.addEventListener('click', function(e) {
            if (e.target === confirmContainer) {
                closeConfirmDialog();
                if (cancelCallback) cancelCallback();
            }
        });
    }

    // 创建对话框内容
    const dialogContent = document.createElement('div');
    dialogContent.className = 'confirm-dialog';
    dialogContent.style.backgroundColor = '#fff';
    dialogContent.style.borderRadius = '8px';
    dialogContent.style.width = '90%';
    dialogContent.style.maxWidth = '400px';
    dialogContent.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
    dialogContent.style.transform = 'scale(0.9)';
    dialogContent.style.transition = 'transform 0.3s ease';
    confirmContainer.appendChild(dialogContent);

    // 显示动画
    setTimeout(() => {
        dialogContent.style.transform = 'scale(1)';
    }, 10);

    // 创建标题
    const dialogTitle = document.createElement('div');
    dialogTitle.className = 'confirm-title';
    dialogTitle.style.padding = '20px 20px 0';
    dialogTitle.style.fontSize = '18px';
    dialogTitle.style.fontWeight = '500';
    dialogTitle.style.color = '#333';
    dialogTitle.textContent = title;
    dialogContent.appendChild(dialogTitle);

    // 创建消息
    const dialogMessage = document.createElement('div');
    dialogMessage.className = 'confirm-message';
    dialogMessage.style.padding = '20px';
    dialogMessage.style.fontSize = '14px';
    dialogMessage.style.color = '#666';
    dialogMessage.style.lineHeight = '1.6';
    dialogMessage.textContent = message;
    dialogContent.appendChild(dialogMessage);

    // 创建按钮组
    const dialogButtons = document.createElement('div');
    dialogButtons.className = 'confirm-buttons';
    dialogButtons.style.padding = '0 20px 20px';
    dialogButtons.style.display = 'flex';
    dialogButtons.style.justifyContent = 'flex-end';
    dialogButtons.style.gap = '10px';
    dialogContent.appendChild(dialogButtons);

    // 创建取消按钮
    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-default';
    cancelButton.textContent = '取消';
    cancelButton.addEventListener('click', function() {
        closeConfirmDialog();
        if (cancelCallback) cancelCallback();
    });
    dialogButtons.appendChild(cancelButton);

    // 创建确认按钮
    const confirmButton = document.createElement('button');
    confirmButton.className = 'btn btn-danger';
    confirmButton.textContent = '确定';
    confirmButton.addEventListener('click', function() {
        closeConfirmDialog();
        if (confirmCallback) confirmCallback();
    });
    dialogButtons.appendChild(confirmButton);

    // 关闭确认对话框函数
    function closeConfirmDialog() {
        dialogContent.style.transform = 'scale(0.9)';
        confirmContainer.style.opacity = '0';
        setTimeout(() => {
            if (dialogContent && confirmContainer.contains(dialogContent)) {
                confirmContainer.removeChild(dialogContent);
            }
            if (confirmContainer && confirmContainer.children.length === 0) {
                document.body.removeChild(confirmContainer);
            }
        }, 300);
    }
}

/**
 * 验证表单字段
 * @param {string} value - 字段值
 * @param {string} type - 验证类型：required, email, phone, number, url, date
 * @param {object} options - 验证选项
 * @returns {object} 验证结果 {isValid: boolean, message: string}
 */
function validateField(value, type, options = {}) {
    const result = {
        isValid: true,
        message: ''
    };

    switch (type) {
        case 'required':
            if (!value || value.trim() === '') {
                result.isValid = false;
                result.message = options.message || '此字段不能为空';
            }
            break;
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                result.isValid = false;
                result.message = options.message || '请输入有效的邮箱地址';
            }
            break;
        case 'phone':
            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(value)) {
                result.isValid = false;
                result.message = options.message || '请输入有效的手机号码';
            }
            break;
        case 'number':
            if (isNaN(value) || value === '') {
                result.isValid = false;
                result.message = options.message || '请输入有效的数字';
            } else if (options.min !== undefined && parseFloat(value) < options.min) {
                result.isValid = false;
                result.message = options.message || `不能小于${options.min}`;
            } else if (options.max !== undefined && parseFloat(value) > options.max) {
                result.isValid = false;
                result.message = options.message || `不能大于${options.max}`;
            }
            break;
        case 'url':
            const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
            if (!urlRegex.test(value)) {
                result.isValid = false;
                result.message = options.message || '请输入有效的URL地址';
            }
            break;
        case 'date':
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(value)) {
                result.isValid = false;
                result.message = options.message || '请输入有效的日期格式（YYYY-MM-DD）';
            } else {
                const date = new Date(value);
                if (isNaN(date.getTime())) {
                    result.isValid = false;
                    result.message = options.message || '请输入有效的日期';
                }
            }
            break;
        case 'length':
            if (value.length < options.min) {
                result.isValid = false;
                result.message = options.message || `长度不能小于${options.min}个字符`;
            } else if (options.max !== undefined && value.length > options.max) {
                result.isValid = false;
                result.message = options.message || `长度不能大于${options.max}个字符`;
            }
            break;
        default:
            break;
    }

    return result;
}

/**
 * 获取URL参数
 * @param {string} name - 参数名称
 * @returns {string|null} 参数值
 */
function getUrlParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

/**
 * 格式化日期时间
 * @param {Date|string} date - 日期对象或日期字符串
 * @param {string} format - 格式化模板，默认'YYYY-MM-DD HH:mm:ss'
 * @returns {string} 格式化后的日期时间字符串
 */
function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return '';
    
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

/**
 * 防抖函数
 * @param {function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {function} 防抖后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 * @param {function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {function} 节流后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * 深拷贝对象
 * @param {any} obj - 要拷贝的对象
 * @returns {any} 拷贝后的对象
 */
function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') {
        return obj;
    }

    if (obj instanceof Date) {
        return new Date(obj.getTime());
    }

    if (obj instanceof Array) {
        return obj.map(item => deepClone(item));
    }

    if (typeof obj === 'object') {
        const clonedObj = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                clonedObj[key] = deepClone(obj[key]);
            }
        }
        return clonedObj;
    }
}

/**
 * 数组排序
 * @param {Array} arr - 要排序的数组
 * @param {string} key - 排序的键名
 * @param {string} order - 排序方式：asc（升序）或 desc（降序）
 * @returns {Array} 排序后的数组
 */
function sortArray(arr, key, order = 'asc') {
    return arr.sort((a, b) => {
        let valueA = a[key];
        let valueB = b[key];

        // 如果值是字符串，转换为小写进行比较
        if (typeof valueA === 'string' && typeof valueB === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }

        if (order === 'asc') {
            return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
        } else {
            return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        }
    });
}

/**
 * 数组去重
 * @param {Array} arr - 要去重的数组
 * @param {string} key - 去重的键名（可选，对象数组时使用）
 * @returns {Array} 去重后的数组
 */
function uniqueArray(arr, key = null) {
    if (key) {
        // 对象数组去重
        const seen = new Set();
        return arr.filter(item => {
            const k = item[key];
            return !seen.has(k) && seen.add(k);
        });
    } else {
        // 基本类型数组去重
        return [...new Set(arr)];
    }
}

/**
 * 检测元素是否在视口中
 * @param {HTMLElement} element - 要检测的元素
 * @returns {boolean} 是否在视口中
 */
function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * 平滑滚动到指定元素
 * @param {HTMLElement|string} element - 目标元素或元素ID
 * @param {number} offset - 偏移量
 */
function scrollToElement(element, offset = 0) {
    const targetElement = typeof element === 'string' ? document.getElementById(element) : element;
    if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetPosition = rect.top + scrollTop - offset;

        window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
        });
    }
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
async function copyToClipboard(text) {
    try {
        if (navigator.clipboard && window.isSecureContext) {
            await navigator.clipboard.writeText(text);
        } else {
            // 回退方案
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        }
        return true;
    } catch (err) {
        console.error('复制失败:', err);
        return false;
    }
}