// 表单创建页面的JavaScript代码

// 全局变量声明
let currentStep = 1;
const totalSteps = 5;
let currentIframe = null;
let isLoading = false; // 标记当前是否正在加载iframe内容
let loadingTimeout = null; // 存储加载超时的定时器

// 调试日志函数
function logDebug(message, details = null) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[FORM_ADD_DEBUG ${timestamp}] ${message}`);
    if (details) {
        console.log('  Details:', details);
    }
}

// 初始化页面
function init() {
    logDebug('初始化表单添加页面');
    
    // 为所有步骤项添加点击事件
    document.querySelectorAll('.step-item').forEach(item => {
        item.addEventListener('click', function() {
            const stepNumber = parseInt(this.getAttribute('data-step'));
            
            // 检查是否点击当前步骤或是否在加载中
            if (stepNumber === currentStep) {
                logDebug('点击了当前步骤，无需切换');
                return;
            }
            
            // 如果正在加载中，等待加载完成再处理新的点击
            if (isLoading) {
                logDebug('当前正在加载中，等待加载完成后切换到步骤', stepNumber);
                // 如果已经有超时定时器，清除它
                if (loadingTimeout) {
                    clearTimeout(loadingTimeout);
                }
                
                // 设置新的超时定时器，等待当前加载完成或超时
                loadingTimeout = setTimeout(() => {
                    logDebug('等待当前加载完成超时，强制切换到步骤', stepNumber);
                    goToStep(stepNumber);
                }, 2000); // 最多等待2秒
                return;
            }
            
            // 正常切换步骤
            goToStep(stepNumber);
        });
    });
    
    // 监听子iframe消息
    window.addEventListener('message', handleIframeMessage);
    
    // 添加导航按钮事件监听器
    const prevStepBtn = document.getElementById('prevStepBtn');
    const nextStepBtn = document.getElementById('nextStepBtn');
    const completeBtn = document.getElementById('completeBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    if (prevStepBtn) prevStepBtn.addEventListener('click', prevStep);
    if (nextStepBtn) nextStepBtn.addEventListener('click', function() {
        if (currentStep === totalSteps) {
            saveForm();
        } else {
            nextStep();
        }
    });
    
    // 添加完成按钮和取消按钮事件监听器
    if (completeBtn) completeBtn.addEventListener('click', saveForm);
    if (cancelBtn) cancelBtn.addEventListener('click', function() {
        if (confirm('确定要放弃当前编辑吗？未保存的内容将丢失。')) {
            window.location.href = '../form_list/form_list.html';
        }
    });
    
    // 为步骤跳转按钮添加点击事件
    document.querySelectorAll('.step-jump-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // 阻止事件冒泡，避免触发步骤项的点击事件
            const targetUrl = this.getAttribute('data-target');
            logDebug(`点击跳转按钮，目标URL: ${targetUrl}`);
            // 在当前整个页面跳转到对应的子页面
            window.location.href = targetUrl;
        });
    });
    
    logDebug('初始化完成，等待所有资源加载完毕后再加载步骤内容');
    // 这里不再立即加载iframe内容，而是在window.onload事件中统一处理
}

// 步骤导航函数
function goToStep(stepNumber) {
    logDebug(`切换步骤: 从 ${currentStep} 到 ${stepNumber}`);
    
    // 记录上一个步骤，用于资源清理
    const previousStep = currentStep;
    
    // 切换步骤
    currentStep = stepNumber;
    updateStepNavigation();
    
    // 清理上一步骤的资源（如果不是首次加载）
    if (previousStep > 0 && previousStep !== currentStep) {
        logDebug(`清理步骤 ${previousStep} 的资源`);
        cleanupStepResources(previousStep);
    }
    
    // 加载新步骤的内容，使用带重试机制的加载函数
    loadStepContentWithRetry(currentStep, 3);
}

// 清理指定步骤的资源
function cleanupStepResources(stepNumber) {
    // 移除当前iframe
    if (currentIframe) {
        // 发送清理消息给iframe
        try {
            currentIframe.contentWindow.postMessage({ type: 'cleanup' }, '*');
        } catch (error) {
            console.warn('无法向iframe发送清理消息:', error);
        }
        
        // 移除iframe元素
        currentIframe.remove();
        currentIframe = null;
    }
    
    // 清除定时器以避免内存泄漏
    const activeTimers = window.activeTimers || [];
    activeTimers.forEach(timer => clearTimeout(timer));
    window.activeTimers = [];
}

function updateStepNavigation() {
    // 更新步骤指示器
    document.querySelectorAll('.step-item').forEach(item => {
        const stepNumber = parseInt(item.getAttribute('data-step'));
        const stepLineEl = item.querySelector('.step-line');
        
        if (stepNumber < currentStep) {
            item.classList.add('completed');
            item.classList.remove('current', 'active');
            if (stepLineEl) stepLineEl.classList.add('completed');
        } else if (stepNumber === currentStep) {
            item.classList.add('active', 'current');
            item.classList.remove('completed');
        } else {
            item.classList.remove('completed', 'current', 'active');
            if (stepLineEl) stepLineEl.classList.remove('completed');
        }
    });
}

// 使用iframe加载步骤内容
// 高效简洁的iframe加载实现
function loadStepContent(stepNumber) {
    logDebug(`加载步骤 ${stepNumber} 内容`);
    
    // 获取内容容器
    const contentDiv = document.getElementById('stepContent');
    
    try {
        // 清理之前的iframe
        if (currentIframe) {
            currentIframe.remove();
            currentIframe = null;
        }
        
        // 直接创建iframe元素
        const iframe = document.createElement('iframe');
        
        // 设置基本属性和样式
        iframe.src = `form_step${stepNumber}.html`;
        iframe.style.width = '100%';
        // 动态计算iframe高度，使其尽可能大
        const viewportHeight = window.innerHeight;
        // 减去页面标题、步骤指示器和其他元素的高度
        const dynamicHeight = Math.max(600, viewportHeight - 380);
        iframe.style.height = `${dynamicHeight}px`;
        iframe.style.border = '1px solid #e8e8e8';
        iframe.style.borderRadius = '4px';
        
        logDebug(`设置iframe高度: ${dynamicHeight}px`, { viewportHeight: viewportHeight });
        
        // 设置事件处理器
        iframe.onload = function() {
            logDebug(`步骤${stepNumber}内容加载完成`);
            // 标记为加载完成
            isLoading = false;
            // 清除加载超时定时器
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                loadingTimeout = null;
            }
        };
        
        iframe.onerror = function() {
            logDebug(`步骤${stepNumber}内容加载失败`, { src: iframe.src });
            showError(`加载步骤${stepNumber}内容失败，请重试`);
        };
        
        // 添加到DOM并保存引用
        contentDiv.innerHTML = '';
        contentDiv.appendChild(iframe);
        currentIframe = iframe;
        
    } catch (error) {
        logDebug('iframe加载异常', { error: error.message });
        console.error('iframe加载异常:', error);
        showError('加载步骤内容时发生错误，请重试');
    }
}

// 清理iframe资源的辅助函数
function cleanupStepResources() {
    if (currentIframe) {
        // 尝试发送清理消息给iframe
        try {
            currentIframe.contentWindow.postMessage({ type: 'cleanup' }, '*');
        } catch (e) { /* 忽略跨域或其他错误 */ }
        
        // 移除iframe元素
        currentIframe.remove();
        currentIframe = null;
    }
}

// 带重试机制的iframe内容加载函数
function loadStepContentWithRetry(stepNumber, maxRetries, retryCount = 0) {
    logDebug(`加载步骤${stepNumber}内容(尝试${retryCount+1}/${maxRetries})`);
    
    // 标记为加载中
    isLoading = true;
    
    // 获取内容容器
    const contentDiv = document.getElementById('stepContent');
    
    if (!contentDiv) {
        logDebug('内容容器不存在，等待DOM就绪...');
        if (retryCount < maxRetries) {
            setTimeout(() => {
                loadStepContentWithRetry(stepNumber, maxRetries, retryCount + 1);
            }, 200);
        } else {
            logDebug('无法找到内容容器，加载失败');
            showError('无法加载步骤内容，页面结构可能已损坏');
        }
        return;
    }
    
    try {
        // 清理之前的iframe
        if (currentIframe) {
            currentIframe.remove();
            currentIframe = null;
        }
        
        // 直接创建iframe元素
        const iframe = document.createElement('iframe');
        
        // 设置基本属性和样式
        iframe.src = `form_step${stepNumber}.html`;
        iframe.style.width = '100%';
        // 动态计算iframe高度，使其尽可能大
        const viewportHeight = window.innerHeight;
        // 减去页面标题、步骤指示器和其他元素的高度
        const dynamicHeight = Math.max(600, viewportHeight - 380);
        iframe.style.height = `${dynamicHeight}px`;
        iframe.style.border = '1px solid #e8e8e8';
        iframe.style.borderRadius = '4px';
        
        logDebug(`设置iframe高度: ${dynamicHeight}px`, { viewportHeight: viewportHeight });
        
        // 设置事件处理器
        iframe.onload = function() {
            logDebug(`步骤${stepNumber}内容加载完成`);
        };
        
        iframe.onerror = function() {
            logDebug(`步骤${stepNumber}内容加载失败`, { src: iframe.src });
            
            if (retryCount < maxRetries) {
                logDebug(`重试加载步骤${stepNumber}内容...`);
                // 移除当前失败的iframe
                if (iframe.parentNode === contentDiv) {
                    contentDiv.removeChild(iframe);
                }
                // 重试加载
                setTimeout(() => {
                    loadStepContentWithRetry(stepNumber, maxRetries, retryCount + 1);
                }, 500);
            } else {
                showError(`加载步骤${stepNumber}内容失败，请刷新页面重试`);
                // 标记为加载完成
                isLoading = false;
                // 清除加载超时定时器
                if (loadingTimeout) {
                    clearTimeout(loadingTimeout);
                    loadingTimeout = null;
                }
            }
        };
        
        // 添加到DOM并保存引用
        contentDiv.innerHTML = '';
        contentDiv.appendChild(iframe);
        currentIframe = iframe;
        
    } catch (error) {
        logDebug('iframe加载异常', { error: error.message });
        console.error('iframe加载异常:', error);
        
        if (retryCount < maxRetries) {
            setTimeout(() => {
                loadStepContentWithRetry(stepNumber, maxRetries, retryCount + 1);
            }, 500);
        } else {
            showError('加载步骤内容时发生错误，请刷新页面重试');
            // 标记为加载完成
            isLoading = false;
            // 清除加载超时定时器
            if (loadingTimeout) {
                clearTimeout(loadingTimeout);
                loadingTimeout = null;
            }
        }
    }
}

// iframe加载完成回调函数
function iframeOnLoad(iframe) {
    console.log(`成功加载iframe: ${iframe.src}`);
    const stepNumber = parseInt(iframe.getAttribute('data-step'));
    
    try {
        // 发送初始化数据给iframe
        iframe.contentWindow.postMessage({
            type: 'init',
            stepNumber: stepNumber
        }, '*');
    } catch (error) {
        console.error('无法向iframe发送初始化数据:', error);
    }
}

// iframe加载错误回调函数
function iframeOnError(iframe, stepNumber) {
    const contentDiv = document.getElementById('stepContent');
    contentDiv.innerHTML = `<div class="error">无法加载步骤${stepNumber}的内容，请重试</div>`;
    console.error(`Failed to load iframe for step ${stepNumber}: ${iframe.src}`);
}

// 处理来自iframe的消息
function handleIframeMessage(event) {
    const data = event.data;
    
    logDebug('收到iframe消息', { type: data.type, data: data });
    
    switch(data.type) {
        case 'get_data':
            // 当iframe请求数据时，发送当前表单数据
            const formData = window.formData || getDefaultFormData();
            try {
                // 确保formData包含style属性，并且style属性包含template子属性
                if (!formData.style) {
                    formData.style = {};
                }
                if (typeof formData.style.template === 'undefined') {
                    formData.style.template = 'default';
                }
                
                event.source.postMessage({
                    type: 'form_data',
                    data: formData
                }, '*');
                logDebug('向iframe发送表单数据');
            } catch (error) {
                logDebug('无法向iframe发送数据', { error: error.message });
                console.error('无法向iframe发送数据:', error);
            }
            break;
            
        case 'update_data':
            // 当iframe更新数据时，保存到全局变量
            window.formData = window.formData || getDefaultFormData();
            window.formData[data.section] = data.data;
            logDebug(`更新表单数据 - 区域: ${data.section}`);
            break;
            
        case 'validation_result':
            // 处理来自iframe的验证结果
            // 这里可以根据需要处理验证结果
            logDebug('验证结果', { isValid: data.isValid, message: data.message });
            console.log('验证结果:', data);
            break;
            
        case 'next_step':
            // 跳转到下一步
            logDebug('请求跳转到下一步');
            if (currentStep < totalSteps) {
                goToStep(currentStep + 1);
            }
            break;
            
        case 'prev_step':
            // 返回到上一步
            logDebug('请求返回到上一步');
            if (currentStep > 1) {
                goToStep(currentStep - 1);
            }
            break;
            
        case 'validate':
            // 请求验证当前步骤
            logDebug('请求验证当前步骤');
            if (currentIframe) {
                try {
                    currentIframe.contentWindow.postMessage({
                        type: 'validate'
                    }, '*');
                    logDebug('向iframe发送验证请求');
                } catch (error) {
                    logDebug('无法向iframe发送验证请求', { error: error.message });
                    console.error('无法向iframe发送验证请求:', error);
                }
            }
            break;
            
        default:
            logDebug('收到未知类型的iframe消息', { type: data.type });
    }
}

// 获取默认表单数据
function getDefaultFormData() {
    return {
        title: '',
        description: '',
        basicInfo: {
            formName: '',
            formType: '',
            formCategory: '',
            formDescription: '',
            enableVersionControl: true
        },
        styleInfo: {
            primaryColor: '#1890ff',
            secondaryColor: '#52c41a',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            fontFamily: 'Arial, sans-serif',
            customCSS: ''
        },
        controls: [],
        logicRules: [],
        publishSettings: {
            isActive: true,
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            allowAnonymous: false,
            maxResponses: 0,
            notificationEnabled: true,
            submitButtonText: '提交',
            successMessage: '提交成功，感谢您的参与！'
        }
    };
}

// 全局变量，用于存储表单数据
let formData = getDefaultFormData();

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', init);

function validateCurrentStep() {
    let validationResult = { isValid: true, errorMessage: '' };
    
    switch (currentStep) {
        case 1:
            validationResult = validateStep1();
            break;
        case 2:
            validationResult = validateStep2();
            break;
        case 3:
            validationResult = validateStep3();
            break;
        case 4:
            validationResult = validateStep4();
            break;
        case 5:
            validationResult = validateStep5();
            break;
    }
    
    if (!validationResult.isValid) {
        showError(validationResult.errorMessage);
        return false;
    }
    
    return true;
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        errorDiv.classList.add('hidden');
    }, 3000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.classList.remove('hidden');
    
    // 3秒后自动隐藏
    setTimeout(() => {
        successDiv.classList.add('hidden');
    }, 3000);
}

// 步骤1：表单基本信息
function loadStep1Content() {
    const contentDiv = document.getElementById('stepContent');
    
    // 清空内容
    contentDiv.innerHTML = '';
    
    // 创建步骤1 HTML结构
    const step1HTML = `
        <div class="form-basic-info">
            <div class="form-group">
                <label for="formTitle">表单标题 *</label>
                <input type="text" id="formTitle" placeholder="请输入表单标题" value="${formData.title || ''}">
            </div>
            
            <div class="form-group">
                <label for="formDescription">表单描述</label>
                <textarea id="formDescription" rows="4" placeholder="请输入表单描述">${formData.description || ''}</textarea>
            </div>
        </div>
    `;
    
    // 添加HTML到内容区域
    contentDiv.innerHTML = step1HTML;
    
    // 添加事件监听器
    document.getElementById('formTitle').addEventListener('input', function() {
        formData.title = this.value;
    });
    
    document.getElementById('formDescription').addEventListener('input', function() {
        formData.description = this.value;
    });
}

function validateStep1() {
    let isValid = true;
    let errorMessage = '';
    
    if (!formData.title || formData.title.trim() === '') {
        isValid = false;
        errorMessage = '请输入表单标题';
    } else if (formData.title.length > 100) {
        isValid = false;
        errorMessage = '表单标题不能超过100个字符';
    }
    
    return { isValid: isValid, errorMessage: errorMessage };
}

// 步骤2：表单字段设计
let currentFieldId = 1;

function loadStep2Content() {
    const contentDiv = document.getElementById('stepContent');
    
    // 清空内容
    contentDiv.innerHTML = '';
    
    // 创建步骤2 HTML结构
    const step2HTML = `
        <div class="form-design-section">
            <div class="field-types">
                <h4>字段类型</h4>
                <div class="field-type-grid">
                    <div class="field-type-item" data-type="text">单行文本</div>
                    <div class="field-type-item" data-type="textarea">多行文本</div>
                    <div class="field-type-item" data-type="number">数字</div>
                    <div class="field-type-item" data-type="date">日期</div>
                    <div class="field-type-item" data-type="time">时间</div>
                    <div class="field-type-item" data-type="datetime">日期时间</div>
                    <div class="field-type-item" data-type="radio">单选框</div>
                    <div class="field-type-item" data-type="checkbox">复选框</div>
                    <div class="field-type-item" data-type="select">下拉选择</div>
                    <div class="field-type-item" data-type="file">文件上传</div>
                    <div class="field-type-item" data-type="image">图片上传</div>
                    <div class="field-type-item" data-type="divider">分隔线</div>
                </div>
            </div>
            
            <div class="form-preview">
                <h4>表单预览</h4>
                <div id="formFieldsContainer" class="form-fields-container">
                    <!-- 表单字段将在这里动态生成 -->
                </div>
            </div>
        </div>
    `;
    
    // 添加HTML到内容区域
    contentDiv.innerHTML = step2HTML;
    
    // 加载已保存的表单字段
    renderFormFields();
    
    // 添加字段类型选择事件监听器
    document.querySelectorAll('.field-type-item').forEach(item => {
        item.addEventListener('click', function() {
            const fieldType = this.getAttribute('data-type');
            addNewField(fieldType);
        });
    });
}

function addNewField(fieldType) {
    const newField = {
        id: `field_${currentFieldId++}`,
        type: fieldType,
        label: getDefaultFieldLabel(fieldType),
        placeholder: getDefaultFieldPlaceholder(fieldType),
        required: false,
        options: fieldType === 'radio' || fieldType === 'checkbox' || fieldType === 'select' ? ['选项1', '选项2', '选项3'] : [],
        defaultValue: '',
        validation: {},
        order: formData.fields.length
    };
    
    formData.fields.push(newField);
    renderFormFields();
}

function getDefaultFieldLabel(fieldType) {
    const labels = {
        'text': '单行文本',
        'textarea': '多行文本',
        'number': '数字',
        'date': '日期',
        'time': '时间',
        'datetime': '日期时间',
        'radio': '单选框组',
        'checkbox': '复选框组',
        'select': '下拉选择',
        'file': '文件上传',
        'image': '图片上传',
        'divider': '分隔线'
    };
    
    return labels[fieldType] || fieldType;
}

function getDefaultFieldPlaceholder(fieldType) {
    const placeholders = {
        'text': '请输入文本',
        'textarea': '请输入详细内容',
        'number': '请输入数字',
        'date': '',
        'time': '',
        'datetime': '',
        'radio': '',
        'checkbox': '',
        'select': '请选择',
        'file': '点击上传文件',
        'image': '点击上传图片',
        'divider': ''
    };
    
    return placeholders[fieldType] || '';
}

function renderFormFields() {
    const container = document.getElementById('formFieldsContainer');
    container.innerHTML = '';
    
    if (formData.fields.length === 0) {
        container.innerHTML = '<div class="no-fields-message">暂无表单字段，请从左侧添加</div>';
        return;
    }
    
    // 按顺序排序字段
    const sortedFields = [...formData.fields].sort((a, b) => a.order - b.order);
    
    sortedFields.forEach(field => {
        const fieldElement = createFieldElement(field);
        container.appendChild(fieldElement);
    });
}

function createFieldElement(field) {
    const fieldDiv = document.createElement('div');
    fieldDiv.className = 'form-field-item';
    fieldDiv.setAttribute('data-field-id', field.id);
    
    // 创建字段预览HTML
    let fieldPreviewHTML = '';
    
    switch (field.type) {
        case 'text':
            fieldPreviewHTML = `
                <div class="field-header">
                    <span class="field-label">${field.label}</span>
                    ${field.required ? '<span class="required-mark">*</span>' : ''}
                </div>
                <div class="field-content">
                    <input type="text" placeholder="${field.placeholder}" disabled>
                </div>
            `;
            break;
        case 'textarea':
            fieldPreviewHTML = `
                <div class="field-header">
                    <span class="field-label">${field.label}</span>
                    ${field.required ? '<span class="required-mark">*</span>' : ''}
                </div>
                <div class="field-content">
                    <textarea rows="3" placeholder="${field.placeholder}" disabled></textarea>
                </div>
            `;
            break;
        case 'number':
            fieldPreviewHTML = `
                <div class="field-header">
                    <span class="field-label">${field.label}</span>
                    ${field.required ? '<span class="required-mark">*</span>' : ''}
                </div>
                <div class="field-content">
                    <input type="number" placeholder="${field.placeholder}" disabled>
                </div>
            `;
            break;
        case 'date':
            fieldPreviewHTML = `
                <div class="field-header">
                    <span class="field-label">${field.label}</span>
                    ${field.required ? '<span class="required-mark">*</span>' : ''}
                </div>
                <div class="field-content">
                    <input type="date" disabled>
                </div>
            `;
            break;
        case 'time':
            fieldPreviewHTML = `
                <div class="field-header">
                    <span class="field-label">${field.label}</span>
                    ${field.required ? '<span class="required-mark">*</span>' : ''}
                </div>
                <div class="field-content">
                    <input type="time" disabled>
                </div>
            `;
            break;
        case 'datetime':
            fieldPreviewHTML = `
                <div class="field-header">
                    <span class="field-label">${field.label}</span>
                    ${field.required ? '<span class="required-mark">*</span>' : ''}
                </div>
                <div class="field-content">
                    <input type="datetime-local" disabled>
                </div>
            `;
            break;
        case 'radio':
            let radioOptionsHTML = '';
            field.options.forEach((option, index) => {
                radioOptionsHTML += `<label><input type="radio" name="${field.id}" disabled> ${option}</label><br>`;
            });
            fieldPreviewHTML = `
                <div class="field-header">
                    <span class="field-label">${field.label}</span>
                    ${field.required ? '<span class="required-mark">*</span>' : ''}
                </div>
                <div class="field-content">
                    ${radioOptionsHTML}
                </div>
            `;
            break;
        case 'checkbox':
            let checkboxOptionsHTML = '';
            field.options.forEach((option, index) => {
                checkboxOptionsHTML += `<label><input type="checkbox" disabled> ${option}</label><br>`;
            });
            fieldPreviewHTML = `
                <div class="field-header">
                    <span class="field-label">${field.label}</span>
                    ${field.required ? '<span class="required-mark">*</span>' : ''}
                </div>
                <div class="field-content">
                    ${checkboxOptionsHTML}
                </div>
            `;
            break;
        case 'select':
            let selectOptionsHTML = `<option value="" disabled selected>${field.placeholder}</option>`;
            field.options.forEach((option, index) => {
                selectOptionsHTML += `<option value="${index}" disabled>${option}</option>`;
            });
            fieldPreviewHTML = `
                <div class="field-header">
                    <span class="field-label">${field.label}</span>
                    ${field.required ? '<span class="required-mark">*</span>' : ''}
                </div>
                <div class="field-content">
                    <select disabled>
                        ${selectOptionsHTML}
                    </select>
                </div>
            `;
            break;
        case 'file':
            fieldPreviewHTML = `
                <div class="field-header">
                    <span class="field-label">${field.label}</span>
                    ${field.required ? '<span class="required-mark">*</span>' : ''}
                </div>
                <div class="field-content">
                    <input type="file" disabled>
                </div>
            `;
            break;
        case 'image':
            fieldPreviewHTML = `
                <div class="field-header">
                    <span class="field-label">${field.label}</span>
                    ${field.required ? '<span class="required-mark">*</span>' : ''}
                </div>
                <div class="field-content">
                    <input type="file" accept="image/*" disabled>
                </div>
            `;
            break;
        case 'divider':
            fieldPreviewHTML = `
                <div class="divider-field">
                    <hr>
                    ${field.label ? `<div class="divider-label">${field.label}</div>` : ''}
                </div>
            `;
            break;
    }
    
    // 添加操作按钮
    const actionsHTML = `
        <div class="field-actions">
            <button class="btn-edit-field" title="编辑字段"><i class="icon-edit"></i></button>
            <button class="btn-delete-field" title="删除字段"><i class="icon-delete"></i></button>
            <button class="btn-move-up" title="上移"><i class="icon-up"></i></button>
            <button class="btn-move-down" title="下移"><i class="icon-down"></i></button>
        </div>
    `;
    
    fieldDiv.innerHTML = fieldPreviewHTML + actionsHTML;
    
    // 添加事件监听器
    fieldDiv.querySelector('.btn-edit-field').addEventListener('click', function() {
        editField(field.id);
    });
    
    fieldDiv.querySelector('.btn-delete-field').addEventListener('click', function() {
        deleteField(field.id);
    });
    
    fieldDiv.querySelector('.btn-move-up').addEventListener('click', function() {
        moveFieldUp(field.id);
    });
    
    fieldDiv.querySelector('.btn-move-down').addEventListener('click', function() {
        moveFieldDown(field.id);
    });
    
    return fieldDiv;
}

function editField(fieldId) {
    // 这里应该打开一个编辑字段的模态框
    // 由于简化版，这里只显示一个提示
    showSuccess('编辑字段功能将在完整版本中实现');
}

function deleteField(fieldId) {
    confirmDialog('确定要删除这个字段吗？', function(confirm) {
        if (confirm) {
            formData.fields = formData.fields.filter(field => field.id !== fieldId);
            // 更新剩余字段的顺序
            formData.fields.forEach((field, index) => {
                field.order = index;
            });
            renderFormFields();
        }
    });
}

function moveFieldUp(fieldId) {
    const fieldIndex = formData.fields.findIndex(field => field.id === fieldId);
    if (fieldIndex > 0) {
        // 交换顺序
        const tempOrder = formData.fields[fieldIndex].order;
        formData.fields[fieldIndex].order = formData.fields[fieldIndex - 1].order;
        formData.fields[fieldIndex - 1].order = tempOrder;
        renderFormFields();
    }
}

function moveFieldDown(fieldId) {
    const fieldIndex = formData.fields.findIndex(field => field.id === fieldId);
    if (fieldIndex < formData.fields.length - 1) {
        // 交换顺序
        const tempOrder = formData.fields[fieldIndex].order;
        formData.fields[fieldIndex].order = formData.fields[fieldIndex + 1].order;
        formData.fields[fieldIndex + 1].order = tempOrder;
        renderFormFields();
    }
}

function confirmDialog(message, callback) {
    // 简化版确认对话框
    if (confirm(message)) {
        callback(true);
    } else {
        callback(false);
    }
}

function validateStep2() {
    let isValid = true;
    let errorMessage = '';
    
    if (formData.fields.length === 0) {
        isValid = false;
        errorMessage = '请至少添加一个表单字段';
    }
    
    return { isValid: isValid, errorMessage: errorMessage };
}

function loadStep3Content() {
    const contentDiv = document.getElementById('stepContent');
    
    // 清空内容
    contentDiv.innerHTML = '';
    
    // 创建iframe来加载form_step3.html
    const iframe = document.createElement('iframe');
    iframe.src = 'form_step3.html';
    iframe.style.width = '100%';
    iframe.style.height = '700px';
    iframe.style.border = 'none';
    
    // 添加iframe到内容区域
    contentDiv.appendChild(iframe);
    
    // 添加消息监听，接收来自iframe的表单数据
    window.addEventListener('message', function(event) {
        if (event.data.type === 'update_data' && event.data.section === 'controls') {
            formData.controls = event.data.data;
        }
        if (event.data.type === 'validation_result') {
            step3Valid = event.data.isValid;
            updateStepIndicator();
        }
    });
    
    // 发送验证请求
    function validateStep3() {
        iframe.contentWindow.postMessage({ type: 'validate' }, '*');
    }
    
    // 保存表单数据
    function saveStep3Data() {
        formData.style = {
            theme: 'default',
            backgroundColor: '#ffffff',
            textColor: '#333333',
            primaryColor: '#1890ff',
            fontSize: '14px'
        };
    }
    
    document.getElementById('backgroundColorPicker').addEventListener('input', function() {
        formStyle.backgroundColor = this.value;
        updateStylePreview();
    });
    
    document.getElementById('textColorPicker').addEventListener('input', function() {
        formStyle.textColor = this.value;
        updateStylePreview();
    });
    
    document.getElementById('primaryColorPicker').addEventListener('input', function() {
        formStyle.primaryColor = this.value;
        updateStylePreview();
    });
    
    document.getElementById('fontSizeInput').addEventListener('input', function() {
        formStyle.fontSize = `${this.value}px`;
        updateStylePreview();
    });
    
    document.querySelectorAll('input[name="borderStyle"]').forEach(radio => {
        radio.addEventListener('change', function() {
            formStyle.borderStyle = this.value;
            updateStylePreview();
        });
    });
    
    document.querySelectorAll('input[name="shadow"]').forEach(radio => {
        radio.addEventListener('change', function() {
            formStyle.shadow = this.value;
            updateStylePreview();
        });
    });
    
    // 保存样式设置到formData
    formData.style = formStyle;
}

function applyTheme(theme) {
    const themeColors = {
        'default': {
            backgroundColor: '#ffffff',
            textColor: '#333333',
            primaryColor: '#1890ff'
        },
        'blue': {
            backgroundColor: '#f0f5ff',
            textColor: '#1a237e',
            primaryColor: '#2196f3'
        },
        'green': {
            backgroundColor: '#e8f5e9',
            textColor: '#2e7d32',
            primaryColor: '#4caf50'
        },
        'purple': {
            backgroundColor: '#f3e5f5',
            textColor: '#4a148c',
            primaryColor: '#9c27b0'
        },
        'orange': {
            backgroundColor: '#fff3e0',
            textColor: '#e65100',
            primaryColor: '#ff9800'
        }
    };
    
    if (themeColors[theme]) {
        formStyle.backgroundColor = themeColors[theme].backgroundColor;
        formStyle.textColor = themeColors[theme].textColor;
        formStyle.primaryColor = themeColors[theme].primaryColor;
        
        // 更新颜色选择器
        document.getElementById('backgroundColorPicker').value = formStyle.backgroundColor;
        document.getElementById('textColorPicker').value = formStyle.textColor;
        document.getElementById('primaryColorPicker').value = formStyle.primaryColor;
    }
}

function updateStylePreview() {
    const previewForm = document.querySelector('.preview-form');
    
    // 更新基本样式
    previewForm.style.backgroundColor = formStyle.backgroundColor;
    previewForm.style.color = formStyle.textColor;
    previewForm.style.fontSize = formStyle.fontSize;
    previewForm.style.fontFamily = formStyle.fontFamily;
    
    // 更新边框样式
    if (formStyle.borderStyle === 'rounded') {
        previewForm.style.borderRadius = '8px';
    } else {
        previewForm.style.borderRadius = '0px';
    }
    
    // 更新阴影效果
    let shadowStyle = 'none';
    if (formStyle.shadow === 'light') {
        shadowStyle = '0 2px 4px rgba(0,0,0,0.1)';
    } else if (formStyle.shadow === 'medium') {
        shadowStyle = '0 4px 8px rgba(0,0,0,0.15)';
    } else if (formStyle.shadow === 'strong') {
        shadowStyle = '0 8px 16px rgba(0,0,0,0.2)';
    }
    
    previewForm.style.boxShadow = shadowStyle;
    
    // 更新按钮颜色
    const buttons = previewForm.querySelectorAll('button');
    buttons.forEach(button => {
        button.style.backgroundColor = formStyle.primaryColor;
        button.style.color = getContrastColor(formStyle.primaryColor);
    });
    
    // 保存样式设置到formData
    formData.style = formStyle;
}

function getContrastColor(color) {
    // 简单的对比度计算，返回黑色或白色
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    return brightness > 128 ? '#000000' : '#ffffff';
}

function validateStep3() {
    // 样式设置不是必填项，直接通过
    return { isValid: true, errorMessage: '' };
}

// 步骤4：表单逻辑规则
let logicRules = [];
let editingRuleId = null;
let formControls = [];

function loadStep4Content() {
    const contentDiv = document.getElementById('stepContent');
    
    // 清空内容
    contentDiv.innerHTML = '';
    
    // 创建步骤4 HTML结构
    const step4HTML = `
        <div class="form-logic-section">
            <div class="logic-rules-header">
                <h4>逻辑规则</h4>
                <button id="addLogicRuleBtn" class="btn-primary">添加规则</button>
            </div>
            
            <div id="logicRulesContainer" class="logic-rules-container">
                <!-- 逻辑规则将在这里动态生成 -->
            </div>
        </div>
    `;
    
    // 添加逻辑规则编辑模态框
    const modalHTML = `
        <div id="logicRuleModal" class="modal hidden">
            <div class="modal-content">
                <div class="modal-header">
                    <h3>编辑逻辑规则</h3>
                    <button id="closeModalBtn" class="btn-close">×</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label>条件字段</label>
                        <select id="conditionField" disabled>
                            <option value="">请选择字段</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>操作符</label>
                        <select id="conditionOperator">
                            <option value="eq">等于</option>
                            <option value="neq">不等于</option>
                            <option value="gt">大于</option>
                            <option value="lt">小于</option>
                            <option value="contains">包含</option>
                            <option value="empty">为空</option>
                            <option value="notempty">不为空</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>条件值</label>
                        <input type="text" id="conditionValue" placeholder="请输入条件值">
                    </div>
                    
                    <div class="form-group">
                        <label>执行动作</label>
                        <select id="actionType">
                            <option value="show">显示字段</option>
                            <option value="hide">隐藏字段</option>
                            <option value="required">设为必填</option>
                            <option value="readonly">设为只读</option>
                            <option value="setvalue">设置值</option>
                            <option value="disable">禁用</option>
                            <option value="enable">启用</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>目标字段</label>
                        <select id="targetField" disabled>
                            <option value="">请选择字段</option>
                        </select>
                    </div>
                    
                    <div id="setValueGroup" class="form-group hidden">
                        <label>设置值</label>
                        <input type="text" id="setValue" placeholder="请输入要设置的值">
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="cancelRuleBtn" class="btn-secondary">取消</button>
                    <button id="saveRuleBtn" class="btn-primary">保存</button>
                </div>
            </div>
        </div>
    `;
    
    // 添加HTML到内容区域
    contentDiv.innerHTML = step4HTML + modalHTML;
    
    // 加载表单控件数据
    loadFormControls();
    
    // 加载已保存的逻辑规则
    if (formData.logicRules && formData.logicRules.length > 0) {
        logicRules = [...formData.logicRules];
    }
    
    // 渲染逻辑规则列表
    renderLogicRules();
    
    // 添加事件监听器
    document.getElementById('addLogicRuleBtn').addEventListener('click', function() {
        editingRuleId = null;
        openLogicRuleModal();
    });
    
    document.getElementById('closeModalBtn').addEventListener('click', function() {
        closeLogicRuleModal();
    });
    
    document.getElementById('cancelRuleBtn').addEventListener('click', function() {
        closeLogicRuleModal();
    });
    
    document.getElementById('saveRuleBtn').addEventListener('click', function() {
        saveLogicRule();
    });
    
    // 动作类型变化事件
    document.getElementById('actionType').addEventListener('change', function() {
        toggleSetValueGroup();
    });
    
    // 操作符变化事件
    document.getElementById('conditionOperator').addEventListener('change', function() {
        toggleConditionValue();
    });
}

function loadFormControls() {
    // 从formData.fields中提取可用的控件
    formControls = formData.fields.filter(field => 
        field.type !== 'divider' && 
        field.type !== 'file' && 
        field.type !== 'image'
    );
    
    // 填充条件字段下拉框
    const conditionFieldSelect = document.getElementById('conditionField');
    conditionFieldSelect.innerHTML = '<option value="">请选择字段</option>';
    
    formControls.forEach(control => {
        const option = document.createElement('option');
        option.value = control.id;
        option.textContent = control.label;
        conditionFieldSelect.appendChild(option);
    });
    
    // 填充目标字段下拉框
    const targetFieldSelect = document.getElementById('targetField');
    targetFieldSelect.innerHTML = '<option value="">请选择字段</option>';
    
    formControls.forEach(control => {
        const option = document.createElement('option');
        option.value = control.id;
        option.textContent = control.label;
        targetFieldSelect.appendChild(option);
    });
}

function renderLogicRules() {
    const container = document.getElementById('logicRulesContainer');
    container.innerHTML = '';
    
    if (logicRules.length === 0) {
        container.innerHTML = '<div class="no-rules-message">暂无逻辑规则，点击"添加规则"创建</div>';
        return;
    }
    
    logicRules.forEach(rule => {
        const ruleElement = createLogicRuleElement(rule);
        container.appendChild(ruleElement);
    });
}

function createLogicRuleElement(rule) {
    const ruleDiv = document.createElement('div');
    ruleDiv.className = 'logic-rule-item';
    
    const conditionField = formControls.find(control => control.id === rule.condition.fieldId);
    const targetField = formControls.find(control => control.id === rule.action.fieldId);
    
    const ruleHTML = `
        <div class="rule-content">
            <div class="rule-condition">
                <strong>条件：</strong>当 ${conditionField ? conditionField.label : '未知字段'} 
                ${getOperatorText(rule.condition.operator)} 
                ${rule.condition.value ? rule.condition.value : ''}
            </div>
            <div class="rule-action">
                <strong>动作：</strong>${getActionText(rule.action.type)} 
                ${targetField ? targetField.label : '未知字段'} 
                ${rule.action.value ? `值为 ${rule.action.value}` : ''}
            </div>
        </div>
        <div class="rule-actions">
            <button class="btn-edit-rule" data-rule-id="${rule.id}"><i class="icon-edit"></i> 编辑</button>
            <button class="btn-delete-rule" data-rule-id="${rule.id}"><i class="icon-delete"></i> 删除</button>
        </div>
    `;
    
    ruleDiv.innerHTML = ruleHTML;
    
    // 添加事件监听器
    ruleDiv.querySelector('.btn-edit-rule').addEventListener('click', function() {
        editingRuleId = rule.id;
        openLogicRuleModal();
    });
    
    ruleDiv.querySelector('.btn-delete-rule').addEventListener('click', function() {
        deleteLogicRule(rule.id);
    });
    
    return ruleDiv;
}

function getOperatorText(operator) {
    const operators = {
        'eq': '等于',
        'neq': '不等于',
        'gt': '大于',
        'lt': '小于',
        'contains': '包含',
        'empty': '为空',
        'notempty': '不为空'
    };
    
    return operators[operator] || operator;
}

function getActionText(actionType) {
    const actions = {
        'show': '显示',
        'hide': '隐藏',
        'required': '设为必填',
        'readonly': '设为只读',
        'setvalue': '设置值',
        'disable': '禁用',
        'enable': '启用'
    };
    
    return actions[actionType] || actionType;
}

function openLogicRuleModal() {
    const modal = document.getElementById('logicRuleModal');
    modal.classList.remove('hidden');
    
    // 重置表单
    document.getElementById('conditionField').value = '';
    document.getElementById('conditionOperator').value = 'eq';
    document.getElementById('conditionValue').value = '';
    document.getElementById('actionType').value = 'show';
    document.getElementById('targetField').value = '';
    document.getElementById('setValue').value = '';
    
    // 切换相关字段显示
    toggleSetValueGroup();
    toggleConditionValue();
    
    // 如果是编辑现有规则
    if (editingRuleId) {
        const rule = logicRules.find(r => r.id === editingRuleId);
        if (rule) {
            document.getElementById('conditionField').value = rule.condition.fieldId;
            document.getElementById('conditionOperator').value = rule.condition.operator;
            document.getElementById('conditionValue').value = rule.condition.value || '';
            document.getElementById('actionType').value = rule.action.type;
            document.getElementById('targetField').value = rule.action.fieldId;
            document.getElementById('setValue').value = rule.action.value || '';
            
            // 切换相关字段显示
            toggleSetValueGroup();
            toggleConditionValue();
        }
    }
}

function closeLogicRuleModal() {
    const modal = document.getElementById('logicRuleModal');
    modal.classList.add('hidden');
    editingRuleId = null;
}

function toggleSetValueGroup() {
    const setValueGroup = document.getElementById('setValueGroup');
    const actionType = document.getElementById('actionType').value;
    
    if (actionType === 'setvalue') {
        setValueGroup.classList.remove('hidden');
    } else {
        setValueGroup.classList.add('hidden');
    }
}

function toggleConditionValue() {
    const conditionValue = document.getElementById('conditionValue');
    const conditionOperator = document.getElementById('conditionOperator').value;
    
    if (conditionOperator === 'empty' || conditionOperator === 'notempty') {
        conditionValue.disabled = true;
        conditionValue.value = '';
    } else {
        conditionValue.disabled = false;
    }
}

function saveLogicRule() {
    // 获取表单数据
    const conditionField = document.getElementById('conditionField').value;
    const conditionOperator = document.getElementById('conditionOperator').value;
    const conditionValue = document.getElementById('conditionValue').value;
    const actionType = document.getElementById('actionType').value;
    const targetField = document.getElementById('targetField').value;
    const setValue = document.getElementById('setValue').value;
    
    // 验证表单
    if (!conditionField) {
        showError('请选择条件字段');
        return;
    }
    
    if (!targetField) {
        showError('请选择目标字段');
        return;
    }
    
    if (conditionOperator !== 'empty' && conditionOperator !== 'notempty' && !conditionValue) {
        showError('请输入条件值');
        return;
    }
    
    if (actionType === 'setvalue' && !setValue) {
        showError('请输入要设置的值');
        return;
    }
    
    // 创建规则对象
    const rule = {
        id: editingRuleId || `rule_${Date.now()}`,
        condition: {
            fieldId: conditionField,
            operator: conditionOperator,
            value: conditionValue
        },
        action: {
            type: actionType,
            fieldId: targetField,
            value: actionType === 'setvalue' ? setValue : null
        }
    };
    
    // 如果是编辑现有规则
    if (editingRuleId) {
        const ruleIndex = logicRules.findIndex(r => r.id === editingRuleId);
        if (ruleIndex !== -1) {
            logicRules[ruleIndex] = rule;
        }
    } else {
        // 添加新规则
        logicRules.push(rule);
    }
    
    // 重新渲染规则列表
    renderLogicRules();
    
    // 关闭模态框
    closeLogicRuleModal();
    
    // 更新数据
    updateLogicRulesData();
    
    showSuccess('逻辑规则保存成功');
}

function deleteLogicRule(ruleId) {
    confirmDialog('确定要删除此逻辑规则吗？', function(confirm) {
        if (confirm) {
            // 过滤掉要删除的规则
            logicRules = logicRules.filter(rule => rule.id !== ruleId);
            
            // 重新渲染规则列表
            renderLogicRules();
            
            // 更新数据
            updateLogicRulesData();
        }
    });
}

function updateLogicRulesData() {
    formData.logicRules = logicRules;
}

function validateStep4() {
    // 逻辑规则不是必填项，直接通过
    return { isValid: true, errorMessage: '' };
}

// 步骤5：发布设置相关函数
let publishSettings = {
    formStatus: 'draft',
    formScope: 'all',
    departments: [],
    users: [],
    validityType: 'forever',
    startTime: '',
    endTime: '',
    afterSubmitAction: 'message',
    submitMessage: '提交成功，感谢您的参与！',
    redirectUrl: '',
    enableNotification: false,
    notificationRecipients: []
};

function loadStep5Content() {
    const contentDiv = document.getElementById('stepContent');
    
    // 清空内容
    contentDiv.innerHTML = '';
    
    // 创建步骤5 HTML结构
    const step5HTML = `
        <div class="publish-settings-section">
            <div class="section-header">
                <h3>发布设置</h3>
                <p>配置表单的发布状态、可见范围和其他高级选项</p>
            </div>
            
            <div class="form-section">
                <h4>表单状态</h4>
                <div class="radio-group">
                    <label><input type="radio" name="formStatus" value="draft"> 草稿</label>
                    <label><input type="radio" name="formStatus" value="published"> 发布</label>
                </div>
            </div>
            
            <div class="form-section">
                <h4>可见范围</h4>
                <div class="radio-group">
                    <label><input type="radio" name="formScope" value="all"> 所有人可见</label>
                    <label><input type="radio" name="formScope" value="department"> 指定部门可见</label>
                    <label><input type="radio" name="formScope" value="user"> 指定用户可见</label>
                </div>
                
                <div id="departmentSelectorGroup" class="hidden">
                    <label>选择部门</label>
                    <select id="departmentSelector" multiple>
                        <option value="dept1">技术部</option>
                        <option value="dept2">市场部</option>
                        <option value="dept3">人力资源部</option>
                        <option value="dept4">财务部</option>
                        <option value="dept5">行政部</option>
                    </select>
                </div>
                
                <div id="userSelectorGroup" class="hidden">
                    <label>选择用户</label>
                    <select id="userSelector" multiple>
                        <option value="user1">张三</option>
                        <option value="user2">李四</option>
                        <option value="user3">王五</option>
                        <option value="user4">赵六</option>
                        <option value="user5">钱七</option>
                    </select>
                </div>
            </div>
            
            <div class="form-section">
                <h4>有效时间</h4>
                <div class="radio-group">
                    <label><input type="radio" name="validityType" value="forever"> 永久有效</label>
                    <label><input type="radio" name="validityType" value="range"> 指定时间范围</label>
                </div>
                
                <div id="validityRangeGroup" class="hidden">
                    <div class="date-range">
                        <div>
                            <label>开始时间</label>
                            <input type="datetime-local" id="startTime">
                        </div>
                        <div>
                            <label>结束时间</label>
                            <input type="datetime-local" id="endTime">
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="form-section">
                <h4>填写后操作</h4>
                <select id="afterSubmitAction">
                    <option value="message">显示提示消息</option>
                    <option value="redirect">跳转至URL</option>
                </select>
                
                <div id="submitMessageGroup">
                    <label>提示消息</label>
                    <textarea id="submitMessage" rows="3" placeholder="请输入提交后的提示消息"></textarea>
                </div>
                
                <div id="redirectUrlGroup" class="hidden">
                    <label>跳转URL</label>
                    <input type="url" id="redirectUrl" placeholder="请输入跳转的URL地址">
                </div>
            </div>
            
            <div class="form-section">
                <h4>通知设置</h4>
                <div class="switch-group">
                    <label><input type="checkbox" id="enableNotification"> 启用提交通知</label>
                </div>
                
                <div id="notificationSettingsGroup" class="hidden">
                    <label>通知接收人</label>
                    <select id="notificationRecipients" multiple>
                        <option value="user1">张三</option>
                        <option value="user2">李四</option>
                        <option value="user3">王五</option>
                        <option value="user4">赵六</option>
                        <option value="user5">钱七</option>
                    </select>
                </div>
            </div>
        </div>
    `;
    
    // 添加HTML到内容区域
    contentDiv.innerHTML = step5HTML;
    
    // 加载已保存的发布设置
    if (formData.publishSettings) {
        publishSettings = { ...publishSettings, ...formData.publishSettings };
    }
    
    // 填充表单数据
    fillFormData();
    
    // 添加事件监听器
    
    // 表单状态变更
    document.querySelectorAll('input[name="formStatus"]').forEach(radio => {
        radio.addEventListener('change', function() {
            publishSettings.formStatus = this.value;
            updatePublishSettingsData();
        });
    });
    
    // 可见范围变更
    document.querySelectorAll('input[name="formScope"]').forEach(radio => {
        radio.addEventListener('change', function() {
            publishSettings.formScope = this.value;
            toggleScopeSelectors();
            updatePublishSettingsData();
        });
    });
    
    // 部门选择变更
    document.getElementById('departmentSelector').addEventListener('change', function() {
        publishSettings.departments = Array.from(this.selectedOptions).map(option => option.value);
        updatePublishSettingsData();
    });
    
    // 用户选择变更
    document.getElementById('userSelector').addEventListener('change', function() {
        publishSettings.users = Array.from(this.selectedOptions).map(option => option.value);
        updatePublishSettingsData();
    });
    
    // 有效时间类型变更
    document.querySelectorAll('input[name="validityType"]').forEach(radio => {
        radio.addEventListener('change', function() {
            publishSettings.validityType = this.value;
            toggleValidityRange();
            updatePublishSettingsData();
        });
    });
    
    // 开始时间变更
    document.getElementById('startTime').addEventListener('change', function() {
        publishSettings.startTime = this.value;
        updatePublishSettingsData();
    });
    
    // 结束时间变更
    document.getElementById('endTime').addEventListener('change', function() {
        publishSettings.endTime = this.value;
        updatePublishSettingsData();
    });
    
    // 填写后操作变更
    document.getElementById('afterSubmitAction').addEventListener('change', function() {
        publishSettings.afterSubmitAction = this.value;
        toggleAfterSubmitOptions();
        updatePublishSettingsData();
    });
    
    // 提交消息变更
    document.getElementById('submitMessage').addEventListener('input', function() {
        publishSettings.submitMessage = this.value;
        updatePublishSettingsData();
    });
    
    // 跳转URL变更
    document.getElementById('redirectUrl').addEventListener('input', function() {
        publishSettings.redirectUrl = this.value;
        updatePublishSettingsData();
    });
    
    // 通知开关变更
    document.getElementById('enableNotification').addEventListener('change', function() {
        publishSettings.enableNotification = this.checked;
        toggleNotificationSettings();
        updatePublishSettingsData();
    });
    
    // 通知接收人变更
    document.getElementById('notificationRecipients').addEventListener('change', function() {
        publishSettings.notificationRecipients = Array.from(this.selectedOptions).map(option => option.value);
        updatePublishSettingsData();
    });
}

// 填充表单数据
function fillFormData() {
    // 设置表单状态
    document.querySelector(`input[name="formStatus"][value="${publishSettings.formStatus}"]`).checked = true;
    
    // 设置有效范围
    document.querySelector(`input[name="formScope"][value="${publishSettings.formScope}"]`).checked = true;
    toggleScopeSelectors();
    
    // 设置部门选择
    if (publishSettings.departments && publishSettings.departments.length > 0) {
        Array.from(document.getElementById('departmentSelector').options).forEach(option => {
            option.selected = publishSettings.departments.includes(option.value);
        });
    }
    
    // 设置用户选择
    if (publishSettings.users && publishSettings.users.length > 0) {
        Array.from(document.getElementById('userSelector').options).forEach(option => {
            option.selected = publishSettings.users.includes(option.value);
        });
    }
    
    // 设置有效时间类型
    document.querySelector(`input[name="validityType"][value="${publishSettings.validityType}"]`).checked = true;
    toggleValidityRange();
    
    // 设置时间范围
    document.getElementById('startTime').value = publishSettings.startTime || '';
    document.getElementById('endTime').value = publishSettings.endTime || '';
    
    // 设置填写后操作
    document.getElementById('afterSubmitAction').value = publishSettings.afterSubmitAction || 'message';
    toggleAfterSubmitOptions();
    
    // 设置提交消息
    document.getElementById('submitMessage').value = publishSettings.submitMessage || '提交成功，感谢您的参与！';
    
    // 设置跳转URL
    document.getElementById('redirectUrl').value = publishSettings.redirectUrl || '';
    
    // 设置通知开关
    document.getElementById('enableNotification').checked = publishSettings.enableNotification || false;
    toggleNotificationSettings();
    
    // 设置通知接收人
    if (publishSettings.notificationRecipients && publishSettings.notificationRecipients.length > 0) {
        Array.from(document.getElementById('notificationRecipients').options).forEach(option => {
            option.selected = publishSettings.notificationRecipients.includes(option.value);
        });
    }
}

// 切换部门/用户选择器显示
function toggleScopeSelectors() {
    const departmentGroup = document.getElementById('departmentSelectorGroup');
    const userGroup = document.getElementById('userSelectorGroup');
    
    departmentGroup.classList.add('hidden');
    userGroup.classList.add('hidden');
    
    if (publishSettings.formScope === 'department') {
        departmentGroup.classList.remove('hidden');
    } else if (publishSettings.formScope === 'user') {
        userGroup.classList.remove('hidden');
    }
}

// 切换有效时间范围显示
function toggleValidityRange() {
    const validityGroup = document.getElementById('validityRangeGroup');
    
    if (publishSettings.validityType === 'range') {
        validityGroup.classList.remove('hidden');
    } else {
        validityGroup.classList.add('hidden');
    }
}

// 切换填写后操作选项显示
function toggleAfterSubmitOptions() {
    const messageGroup = document.getElementById('submitMessageGroup');
    const urlGroup = document.getElementById('redirectUrlGroup');
    
    messageGroup.classList.add('hidden');
    urlGroup.classList.add('hidden');
    
    if (publishSettings.afterSubmitAction === 'message') {
        messageGroup.classList.remove('hidden');
    } else if (publishSettings.afterSubmitAction === 'redirect') {
        urlGroup.classList.remove('hidden');
    }
}

// 切换通知设置显示
function toggleNotificationSettings() {
    const notificationGroup = document.getElementById('notificationSettingsGroup');
    
    if (publishSettings.enableNotification) {
        notificationGroup.classList.remove('hidden');
    } else {
        notificationGroup.classList.add('hidden');
    }
}

// 更新发布设置数据
function updatePublishSettingsData() {
    formData.publishSettings = publishSettings;
}

// 验证步骤5
function validateStep5() {
    let isValid = true;
    let errorMessage = '';
    
    // 验证表单状态为发布时的必要条件
    if (publishSettings.formStatus === 'published') {
        // 验证时间段设置
        if (publishSettings.validityType === 'range') {
            if (!publishSettings.startTime) {
                isValid = false;
                errorMessage = '请设置开始时间';
            } else if (!publishSettings.endTime) {
                isValid = false;
                errorMessage = '请设置结束时间';
            } else if (new Date(publishSettings.startTime) >= new Date(publishSettings.endTime)) {
                isValid = false;
                errorMessage = '开始时间必须早于结束时间';
            }
        }
        
        // 验证跳转URL
        if (isValid && publishSettings.afterSubmitAction === 'redirect' && !publishSettings.redirectUrl) {
            isValid = false;
            errorMessage = '请设置跳转URL';
        }
    }
    
    return { isValid: isValid, errorMessage: errorMessage };
}

// 保存表单
function saveForm() {
    // 验证所有步骤
    if (!validateAllSteps()) {
        return;
    }
    
    // 更新时间戳
    formData.updateTime = new Date().toISOString();
    
    // 模拟保存到服务器
    console.log('保存表单数据:', formData);
    
    // 显示成功消息
    showSuccess('表单保存成功');
    
    // 如果是完成按钮点击，返回表单列表页
    if (currentStep === totalSteps) {
        setTimeout(() => {
            // 这里应该跳转到表单列表页
            window.location.href = '../form_list/form_list.html';
        }, 1500);
    }
}

function validateAllSteps() {
    let isValid = true;
    
    for (let i = 1; i <= totalSteps; i++) {
        let validationResult = { isValid: true, errorMessage: '' };
        
        switch (i) {
            case 1:
                validationResult = validateStep1();
                break;
            case 2:
                validationResult = validateStep2();
                break;
            case 3:
                validationResult = validateStep3();
                break;
            case 4:
                validationResult = validateStep4();
                break;
            case 5:
                validationResult = validateStep5();
                break;
        }
        
        if (!validationResult.isValid) {
            showError(validationResult.errorMessage);
            isValid = false;
            // 跳转到验证失败的步骤
            goToStep(i);
            break;
        }
    }
    
    return isValid;
}

// DOM内容加载完成后进行基础初始化
window.addEventListener('DOMContentLoaded', function() {
    logDebug('DOM内容已加载，开始基础页面初始化');
    
    try {
        // 调用统一的初始化函数，但此时不加载iframe
        init();
    } catch (error) {
        logDebug('基础初始化过程中发生错误', { error: error.message });
        console.error('基础初始化错误:', error);
    }
});

// 所有页面资源加载完成后再加载iframe内容
window.addEventListener('load', function() {
    logDebug('所有页面资源已加载完成，开始加载iframe内容');
    
    try {
        // 延迟加载初始步骤内容，确保所有资源都已完全就绪
        // 增加延迟时间到500ms，给浏览器更多时间完成资源加载和渲染
        setTimeout(() => {
            loadStepContentWithRetry(currentStep, 3); // 最多重试3次
        }, 500);
    } catch (error) {
        logDebug('iframe加载过程中发生错误', { error: error.message });
        console.error('iframe加载错误:', error);
        // 如果初始加载失败，尝试直接加载第一步内容作为后备方案
        setTimeout(() => {
            try {
                loadStepContentWithRetry(currentStep, 3);
            } catch (innerError) {
                logDebug('后备加载方案也失败了', { error: innerError.message });
                showError('页面初始化失败，请刷新页面重试');
            }
        }, 1000);
    }
});