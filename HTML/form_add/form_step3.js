// 表单设计数据
let formControls = [];
let selectedControlId = null;
let draggedControlId = null;

// 画布引用，用于后续操作
let canvas = null;
let controlProperties = null;
let noControlSelected = null;

// 步骤3的页面初始化函数 - 可以在DOM加载完成后手动调用
function initFormDesign() {
    // 初始化DOM元素引用
    canvas = document.getElementById('formDesignCanvas');
    controlProperties = document.getElementById('controlProperties');
    noControlSelected = document.getElementById('noControlSelected');
    
    // 请求父页面发送数据
    if (window.parent && window.parent.postMessage) {
        window.parent.postMessage({ type: 'get_data' }, '*');
    }
    
    // 监听父页面消息
    window.addEventListener('message', handleParentMessage);
    
    // 初始化拖拽功能
    initDragAndDrop();
    
    // 初始化按钮事件
    initButtons();
    
    // 初始化控件属性事件
    initControlPropertyEvents();
    
    // 初始化页面自适应高度
    initResponsiveLayout();
    
    // 初始化增强功能
    initEnhancedFeatures();
    
    // 加载表单数据
    loadFormData();
    
    // 初始化父页面消息监听
    initParentMessageListener();
}

// 默认在DOMContentLoaded时初始化，也可以在动态加载时手动调用
document.addEventListener('DOMContentLoaded', function() {
    // 如果是直接访问该页面，则初始化
    if (window === window.parent) {
        initFormDesign();
    }
});

// 将初始化函数暴露到全局，以便在动态加载时调用
window.initFormDesign = initFormDesign;

// 处理父页面消息
function handleParentMessage(event) {
    const data = event.data;
    
    if (data.type === 'form_data') {
        // 填充表单数据
        const formData = data.data;
        
        // 如果有控件数据，加载它们
        if (formData.controls && formData.controls.length > 0) {
            formControls = formData.controls;
            renderFormControls();
        }
    }
}

// 初始化页面自适应高度
function initResponsiveLayout() {
    // 处理窗口大小变化
    window.addEventListener('resize', function() {
        // 重新计算布局高度
        adjustLayoutHeight();
    });
    
    // 初始调整
    adjustLayoutHeight();
}

// 调整布局高度
function adjustLayoutHeight() {
    // 这里主要依赖CSS来实现自适应高度
    // JavaScript作为辅助，处理特殊情况
    const designLayout = document.querySelector('.design-layout');
    if (designLayout) {
        // 确保设计区域使用视口高度
        designLayout.style.height = '100vh';
    }
}

// 初始化拖拽功能
function initDragAndDrop() {
    // 获取所有控件项
    const controlItems = document.querySelectorAll('.control-item');
    const canvas = document.getElementById('formDesignCanvas');
    
    // 为每个控件项添加拖拽事件
    controlItems.forEach(item => {
        item.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('controlType', this.dataset.control);
            e.dataTransfer.setData('controlName', this.textContent);
            // 设置拖拽图像
            e.dataTransfer.effectAllowed = 'copy';
            // 添加拖拽中样式（虽然这里是从左侧拖动，看不到自身变化）
            setTimeout(() => {
                this.classList.add('dragging');
            }, 0);
        });
        
        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
        });
    });
    
    // 为画布添加拖拽事件
    canvas.addEventListener('dragover', function(e) {
        e.preventDefault(); // 允许放置
        // 添加拖拽预览样式
        this.classList.add('drag-over');
    });
    
    canvas.addEventListener('dragleave', function() {
        // 移除拖拽预览样式
        this.classList.remove('drag-over');
    });
    
    canvas.addEventListener('drop', function(e) {
        e.preventDefault();
        
        // 移除拖拽预览样式
        this.classList.remove('drag-over');
        
        // 获取拖拽的控件类型和名称
        const controlType = e.dataTransfer.getData('controlType');
        const controlName = e.dataTransfer.getData('controlName');
        const draggedControlId = e.dataTransfer.getData('draggedControlId');
        
        if (draggedControlId) {
            // 如果是画布内控件拖拽排序
            handleControlReorder(draggedControlId, e.clientY);
        } else if (controlType) {
            // 创建新控件
            addControlToCanvas(controlType, controlName);
        }
        
        // 更新数据到父页面
        updateParentData();
    });
}

// 添加控件到画布
function addControlToCanvas(controlType, controlName) {
    // 生成唯一ID
    const controlId = 'control_' + Date.now();
    
    // 创建控件对象
    const newControl = {
        id: controlId,
        type: controlType,
        name: controlName,
        label: controlName,
        field: controlType + '_' + (formControls.length + 1),
        required: false,
        defaultValue: '',
        placeholder: '',
        validation: '',
        helpText: '',
        width: 100,
        options: [], // 用于选择类型控件
        properties: {} // 其他属性
    };
    
    // 根据控件类型设置默认选项
    if (controlType === 'select' || controlType === 'radio' || controlType === 'checkbox') {
        newControl.options = ['选项1', '选项2', '选项3'];
    }
    
    // 添加到控件列表
    formControls.push(newControl);
    
    // 渲染控件
    renderFormControls();
    
    // 选中新添加的控件
    selectControl(controlId);
    
    // 等待DOM更新后添加动画效果
    setTimeout(() => {
        const canvas = document.getElementById('formDesignCanvas');
        const newControlElement = canvas.querySelector(`.form-control-item[data-id="${controlId}"]`);
        if (newControlElement && typeof addControlWithAnimation === 'function') {
            // 添加动画效果
            addControlWithAnimation(newControlElement);
        }
    }, 0);
}

// 处理控件重排序
function handleControlReorder(draggedId, dropY) {
    // 找到拖拽的控件
    const draggedIndex = formControls.findIndex(control => control.id === draggedId);
    if (draggedIndex === -1) return;
    
    // 创建临时数组，移除被拖拽的控件
    const tempControls = [...formControls];
    const [draggedControl] = tempControls.splice(draggedIndex, 1);
    
    // 找到放置位置
    const canvas = document.getElementById('formDesignCanvas');
    const controlElements = canvas.querySelectorAll('.form-control-item');
    
    let dropIndex = tempControls.length;
    
    // 找到第一个位置低于dropY的控件
    controlElements.forEach((element, index) => {
        const rect = element.getBoundingClientRect();
        if (rect.top + rect.height / 2 > dropY && index !== draggedIndex) {
            dropIndex = index > draggedIndex ? index - 1 : index;
            return false;
        }
    });
    
    // 插入控件到新位置
    tempControls.splice(dropIndex, 0, draggedControl);
    formControls = tempControls;
    
    // 重新渲染
    renderFormControls();
    
    // 重新选中被拖拽的控件
    selectControl(draggedId);
}

// 渲染表单控件
function renderFormControls() {
    const canvas = document.getElementById('formDesignCanvas');
    
    // 清空画布
    canvas.innerHTML = '';
    
    // 如果没有控件，显示占位文本
    if (formControls.length === 0) {
        canvas.innerHTML = '<div class="placeholder-text">请从左侧拖拽控件到此处开始设计表单</div>';
        return;
    }
    
    // 创建一个容器用于多列布局
    const layoutContainer = document.createElement('div');
    layoutContainer.className = 'form-layout-container';
    canvas.appendChild(layoutContainer);
    
    // 渲染每个控件
    formControls.forEach(control => {
        const controlElement = document.createElement('div');
        controlElement.className = 'form-control-item';
        controlElement.dataset.id = control.id;
        // 设置为可拖拽以支持排序
        controlElement.draggable = true;
        
        // 应用宽度设置
        controlElement.style.width = `${control.width}%`;
        controlElement.style.minWidth = '200px'; // 最小宽度以确保控件可用性
        
        // 添加拖拽事件
        controlElement.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('draggedControlId', this.dataset.id);
            e.dataTransfer.effectAllowed = 'move';
            // 设置拖拽图像
            draggedControlId = this.dataset.id;
            // 添加拖拽中样式
            setTimeout(() => {
                this.classList.add('dragging');
            }, 0);
        });
        
        controlElement.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedControlId = null;
        });
        
        // 明确添加点击事件，调用selectControl函数
        controlElement.addEventListener('click', function(e) {
            e.stopPropagation();
            selectControl(this.dataset.id);
        });
        
        // 根据控件类型生成不同的HTML
        let controlHtml = '';
        switch (control.type) {
            case 'text':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <input type="text" placeholder="${control.placeholder || '请输入' + control.label}">
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'textarea':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <textarea placeholder="${control.placeholder || '请输入' + control.label}" rows="3"></textarea>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'number':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <input type="number" placeholder="${control.placeholder || '请输入数字'}">
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'date':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <input type="date">
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'time':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <input type="time">
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'select':
                let optionsHtml = control.options.map(option => 
                    `<option value="${option}">${option}</option>`
                ).join('');
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <select>${optionsHtml}</select>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'radio':
                let radioHtml = control.options.map((option, index) => 
                    `<label class="radio-label"><input type="radio" name="${control.field}" value="${option}"> ${option}</label>`
                ).join('');
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="radio-group">${radioHtml}</div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'checkbox':
                let checkboxHtml = control.options.map((option, index) => 
                    `<label class="checkbox-label"><input type="checkbox" name="${control.field}" value="${option}"> ${option}</label>`
                ).join('');
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="checkbox-group">${checkboxHtml}</div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'switch':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}</label>
                    </div>
                    <div class="control-body">
                        <label class="switch-label">
                            <input type="checkbox">
                            <span class="switch-slider"></span>
                        </label>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'file':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <input type="file">
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'image':
                // 调用专门的函数生成图片上传控件HTML，这样可以根据展示样式动态生成不同的HTML结构
                controlHtml = generateImageControlHTML(control);
                break;
            case 'divider':
                controlHtml = `
                    <div class="divider">
                        <div class="divider-line"></div>
                        <div class="divider-text">${control.label || '分割线'}</div>
                        <div class="divider-line"></div>
                    </div>
                `;
                break;
            case 'qrcode':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="text-align:center;padding:20px;">
                            <div style="display:inline-block;width:120px;height:120px;background-color:#f5f5f5;border:1px solid #d9d9d9;">
                                <div style="line-height:120px;text-align:center;">二维码</div>
                            </div>
                        </div>
                        <input type="text" placeholder="请输入二维码内容" style="margin-top:10px;">
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'sms':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="display:flex;gap:10px;">
                            <input type="text" placeholder="请输入手机号" style="flex:1;">
                        </div>
                        <div style="display:flex;gap:10px;margin-top:10px;">
                            <input type="text" placeholder="请输入验证码" style="flex:1;">
                            <button class="btn btn-primary" style="white-space:nowrap;">获取验证码</button>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'ai':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <textarea placeholder="请输入您的问题" rows="4" style="margin-bottom:10px;"></textarea>
                        <button class="btn btn-primary" style="width:100%;">发送给AI助手</button>
                        <div style="margin-top:10px;padding:10px;background-color:#f5f5f5;border-radius:4px;">
                            <div style="font-weight:500;margin-bottom:5px;">AI回答：</div>
                            <div>这里将显示AI的回答内容...</div>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'camera':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="text-align:center;padding:20px;">
                            <div style="display:inline-block;width:240px;height:180px;background-color:#f5f5f5;border:1px solid #d9d9d9;">
                                <div style="line-height:180px;text-align:center;">摄像头预览区域</div>
                            </div>
                        </div>
                        <button class="btn btn-primary" style="width:100%;margin-bottom:10px;">开启摄像头</button>
                        <button class="btn btn-default" style="width:100%;">拍照</button>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'ocr':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="text-align:center;padding:20px;">
                            <div style="display:inline-block;width:240px;height:180px;background-color:#f5f5f5;border:1px dashed #d9d9d9;border-radius:4px;">
                                <div style="line-height:180px;text-align:center;">拖放图片到此处</div>
                            </div>
                        </div>
                        <input type="file" accept="image/*" style="margin-bottom:10px;">
                        <button class="btn btn-primary" style="width:100%;">识别文字</button>
                        <textarea placeholder="识别结果将显示在这里" rows="3" style="margin-top:10px;"></textarea>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'signature':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="text-align:center;padding:20px;">
                            <div style="display:inline-block;width:300px;height:150px;background-color:#f5f5f5;border:1px solid #d9d9d9;">
                                <div style="line-height:150px;text-align:center;">签名区域</div>
                            </div>
                        </div>
                        <div style="display:flex;gap:10px;">
                            <button class="btn btn-primary" style="flex:1;">清空</button>
                            <button class="btn btn-default" style="flex:1;">确认签名</button>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'map':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="text-align:center;padding:10px;">
                            <div style="display:inline-block;width:300px;height:200px;background-color:#f5f5f5;border:1px solid #d9d9d9;">
                                <div style="line-height:200px;text-align:center;">地图区域</div>
                            </div>
                        </div>
                        <input type="text" placeholder="搜索地址" style="margin-bottom:10px;">
                        <input type="text" placeholder="经度" style="margin-bottom:10px;">
                        <input type="text" placeholder="纬度" style="margin-bottom:10px;">
                        <button class="btn btn-primary" style="width:100%;">选择位置</button>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'barcode':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="text-align:center;padding:20px;">
                            <div style="display:inline-block;width:200px;height:80px;background-color:#f5f5f5;border:1px solid #d9d9d9;">
                                <div style="line-height:80px;text-align:center;">条形码</div>
                            </div>
                        </div>
                        <input type="text" placeholder="请输入条形码内容" style="margin-top:10px;">
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'video':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="text-align:center;padding:20px;">
                            <video width="320" height="240" controls>
                                <source src="" type="video/mp4">
                                您的浏览器不支持视频播放
                            </video>
                        </div>
                        <input type="file" accept="video/*" style="margin-bottom:10px;">
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'audio':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <audio controls style="width:100%;margin-bottom:10px;">
                            <source src="" type="audio/mpeg">
                            您的浏览器不支持音频播放
                        </audio>
                        <input type="file" accept="audio/*">
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'digital_sign':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="text-align:center;padding:20px;">
                            <div style="display:inline-block;padding:20px;background-color:#f5f5f5;border:1px solid #d9d9d9;">
                                <div style="text-align:center;">数字签名区域</div>
                            </div>
                        </div>
                        <input type="file" accept=".pfx,.p12" style="margin-bottom:10px;">
                        <input type="password" placeholder="请输入证书密码" style="margin-bottom:10px;">
                        <button class="btn btn-primary" style="width:100%;">应用数字签名</button>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'biometric':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="text-align:center;padding:20px;">
                            <div style="display:inline-block;width:200px;height:200px;background-color:#f5f5f5;border:1px solid #d9d9d9;border-radius:50%;">
                                <div style="line-height:200px;text-align:center;">生物识别区域</div>
                            </div>
                        </div>
                        <button class="btn btn-primary" style="width:100%;margin-bottom:10px;">开始指纹识别</button>
                        <button class="btn btn-default" style="width:100%;">开始人脸识别</button>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'subform':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="padding:10px;background-color:#f5f5f5;border:1px dashed #d9d9d9;">
                            <div style="text-align:center;">子表单区域</div>
                            <div style="text-align:center;margin-top:10px;">
                                <button class="btn btn-primary" style="white-space:nowrap;">配置子表单</button>
                            </div>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'table':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div style="overflow-x:auto;">
                            <table style="width:100%;border-collapse:collapse;">
                                <thead>
                                    <tr style="background-color:#f5f5f5;">
                                        <th style="border:1px solid #d9d9d9;padding:8px;">列1</th>
                                        <th style="border:1px solid #d9d9d9;padding:8px;">列2</th>
                                        <th style="border:1px solid #d9d9d9;padding:8px;">操作</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style="border:1px solid #d9d9d9;padding:8px;">数据1</td>
                                        <td style="border:1px solid #d9d9d9;padding:8px;">数据2</td>
                                        <td style="border:1px solid #d9d9d9;padding:8px;">
                                            <button class="btn btn-default" style="padding:4px 8px;">编辑</button>
                                            <button class="btn btn-danger" style="padding:4px 8px;">删除</button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div style="text-align:center;margin-top:10px;">
                            <button class="btn btn-primary" style="white-space:nowrap;">配置表格</button>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'recruitment':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '招聘申请表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>基本信息</h4>
                            <input type="text" placeholder="申请部门" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="招聘岗位" class="form-control" style="margin-bottom:10px;">
                            <input type="number" placeholder="招聘人数" class="form-control" style="margin-bottom:10px;">
                            <select class="form-control" style="margin-bottom:10px;">
                                <option value="">请选择招聘类型</option>
                                <option value="1">社会招聘</option>
                                <option value="2">校园招聘</option>
                                <option value="3">内部招聘</option>
                            </select>
                        </div>
                        <div class="form-kit-section">
                            <h4>岗位要求</h4>
                            <textarea placeholder="岗位职责描述" rows="3" class="form-control" style="margin-bottom:10px;"></textarea>
                            <textarea placeholder="任职资格要求" rows="3" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                        <div class="form-kit-section">
                            <h4>其他信息</h4>
                            <input type="date" placeholder="期望到岗时间" class="form-control" style="margin-bottom:10px;">
                            <textarea placeholder="备注说明" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'attendance':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '考勤记录表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>员工信息</h4>
                            <input type="text" placeholder="员工姓名" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="部门" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="工号" class="form-control" style="margin-bottom:10px;">
                        </div>
                        <div class="form-kit-section">
                            <h4>考勤周期</h4>
                            <input type="date" placeholder="开始日期" class="form-control" style="margin-bottom:10px;">
                            <input type="date" placeholder="结束日期" class="form-control" style="margin-bottom:10px;">
                        </div>
                        <div class="form-kit-section">
                            <h4>考勤统计</h4>
                            <div style="display:flex;gap:10px;margin-bottom:10px;">
                                <div style="flex:1;"><label>正常出勤天数：</label><input type="text" class="form-control" readonly value="22"></div>
                                <div style="flex:1;"><label>请假天数：</label><input type="text" class="form-control" readonly value="0"></div>
                            </div>
                            <div style="display:flex;gap:10px;margin-bottom:10px;">
                                <div style="flex:1;"><label>迟到次数：</label><input type="text" class="form-control" readonly value="0"></div>
                                <div style="flex:1;"><label>早退次数：</label><input type="text" class="form-control" readonly value="0"></div>
                            </div>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'leave':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '请假申请表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>请假信息</h4>
                            <select class="form-control" style="margin-bottom:10px;">
                                <option value="">请选择请假类型</option>
                                <option value="annual">年假</option>
                                <option value="sick">病假</option>
                                <option value="personal">事假</option>
                                <option value="marriage">婚假</option>
                                <option value="maternity">产假</option>
                                <option value="other">其他</option>
                            </select>
                            <div style="display:flex;gap:10px;margin-bottom:10px;">
                                <div style="flex:1;"><label>开始日期：</label><input type="date" class="form-control"></div>
                                <div style="flex:1;"><label>结束日期：</label><input type="date" class="form-control"></div>
                            </div>
                            <input type="text" placeholder="请假天数" class="form-control" style="margin-bottom:10px;">
                            <textarea placeholder="请假原因" rows="3" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                        <div class="form-kit-section">
                            <h4>工作安排</h4>
                            <textarea placeholder="请假期间工作交接安排" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                            <input type="text" placeholder="工作交接人" class="form-control" style="margin-bottom:10px;">
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'expense':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '费用报销表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>报销信息</h4>
                            <select class="form-control" style="margin-bottom:10px;">
                                <option value="">请选择费用类型</option>
                                <option value="travel">差旅费</option>
                                <option value="meal">餐饮费</option>
                                <option value="transport">交通费</option>
                                <option value="office">办公费</option>
                                <option value="other">其他费用</option>
                            </select>
                            <input type="text" placeholder="报销金额(元)" class="form-control" style="margin-bottom:10px;">
                            <input type="date" placeholder="费用发生日期" class="form-control" style="margin-bottom:10px;">
                            <textarea placeholder="费用说明" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                        <div class="form-kit-section">
                            <h4>报销附件</h4>
                            <div class="upload-area" style="border:1px dashed #d9d9d9;padding:20px;text-align:center;background-color:#fafafa;">
                                <p>点击上传或拖拽文件到此处</p>
                                <input type="file" multiple style="display:none;">
                                <button class="btn btn-default" style="margin-top:10px;">选择文件</button>
                            </div>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'purchase':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '物品采购表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>采购信息</h4>
                            <input type="text" placeholder="采购物品名称" class="form-control" style="margin-bottom:10px;">
                            <input type="number" placeholder="采购数量" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="预算金额(元)" class="form-control" style="margin-bottom:10px;">
                            <input type="date" placeholder="期望到货日期" class="form-control" style="margin-bottom:10px;">
                        </div>
                        <div class="form-kit-section">
                            <h4>采购明细</h4>
                            <textarea placeholder="物品规格、型号等详细描述" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                            <textarea placeholder="采购原因及用途" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'meeting':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '会议申请表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>会议信息</h4>
                            <input type="text" placeholder="会议主题" class="form-control" style="margin-bottom:10px;">
                            <select class="form-control" style="margin-bottom:10px;">
                                <option value="">请选择会议室</option>
                                <option value="1">一号会议室</option>
                                <option value="2">二号会议室</option>
                                <option value="3">三号会议室</option>
                                <option value="4">视频会议室</option>
                            </select>
                            <div style="display:flex;gap:10px;margin-bottom:10px;">
                                <div style="flex:1;"><label>开始时间：</label><input type="datetime-local" class="form-control"></div>
                                <div style="flex:1;"><label>结束时间：</label><input type="datetime-local" class="form-control"></div>
                            </div>
                        </div>
                        <div class="form-kit-section">
                            <h4>会议详情</h4>
                            <textarea placeholder="会议内容" rows="3" class="form-control" style="margin-bottom:10px;"></textarea>
                            <input type="text" placeholder="参会人员" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="会议需求（设备、材料等）" class="form-control" style="margin-bottom:10px;">
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'travel':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '出差申请表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>出差信息</h4>
                            <input type="text" placeholder="出差地点" class="form-control" style="margin-bottom:10px;">
                            <div style="display:flex;gap:10px;margin-bottom:10px;">
                                <div style="flex:1;"><label>开始日期：</label><input type="date" class="form-control"></div>
                                <div style="flex:1;"><label>结束日期：</label><input type="date" class="form-control"></div>
                            </div>
                            <select class="form-control" style="margin-bottom:10px;">
                                <option value="">请选择出差方式</option>
                                <option value="train">火车</option>
                                <option value="plane">飞机</option>
                                <option value="car">汽车</option>
                                <option value="other">其他</option>
                            </select>
                        </div>
                        <div class="form-kit-section">
                            <h4>出差详情</h4>
                            <textarea placeholder="出差事由" rows="3" class="form-control" style="margin-bottom:10px;"></textarea>
                            <input type="text" placeholder="预计费用(元)" class="form-control" style="margin-bottom:10px;">
                            <textarea placeholder="备注" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'performance':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '绩效考核表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>考核信息</h4>
                            <input type="text" placeholder="被考核人" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="考核周期" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="考核人" class="form-control" style="margin-bottom:10px;">
                        </div>
                        <div class="form-kit-section">
                            <h4>考核指标</h4>
                            <div style="margin-bottom:10px;">
                                <label>工作完成度：</label>
                                <div class="rating" style="display:flex;">
                                    <input type="radio" name="completion" value="1">1
                                    <input type="radio" name="completion" value="2">2
                                    <input type="radio" name="completion" value="3">3
                                    <input type="radio" name="completion" value="4">4
                                    <input type="radio" name="completion" value="5" checked>5
                                </div>
                            </div>
                            <div style="margin-bottom:10px;">
                                <label>工作质量：</label>
                                <div class="rating" style="display:flex;">
                                    <input type="radio" name="quality" value="1">1
                                    <input type="radio" name="quality" value="2">2
                                    <input type="radio" name="quality" value="3">3
                                    <input type="radio" name="quality" value="4">4
                                    <input type="radio" name="quality" value="5" checked>5
                                </div>
                            </div>
                            <div style="margin-bottom:10px;">
                                <label>工作态度：</label>
                                <div class="rating" style="display:flex;">
                                    <input type="radio" name="attitude" value="1">1
                                    <input type="radio" name="attitude" value="2">2
                                    <input type="radio" name="attitude" value="3">3
                                    <input type="radio" name="attitude" value="4">4
                                    <input type="radio" name="attitude" value="5" checked>5
                                </div>
                            </div>
                        </div>
                        <div class="form-kit-section">
                            <h4>考核评价</h4>
                            <textarea placeholder="考核评语" rows="3" class="form-control" style="margin-bottom:10px;"></textarea>
                            <textarea placeholder="改进建议" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'training':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '培训申请表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>培训信息</h4>
                            <input type="text" placeholder="培训名称" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="培训机构" class="form-control" style="margin-bottom:10px;">
                            <div style="display:flex;gap:10px;margin-bottom:10px;">
                                <div style="flex:1;"><label>开始日期：</label><input type="date" class="form-control"></div>
                                <div style="flex:1;"><label>结束日期：</label><input type="date" class="form-control"></div>
                            </div>
                            <input type="text" placeholder="培训地点" class="form-control" style="margin-bottom:10px;">
                        </div>
                        <div class="form-kit-section">
                            <h4>培训详情</h4>
                            <textarea placeholder="培训内容简介" rows="3" class="form-control" style="margin-bottom:10px;"></textarea>
                            <input type="text" placeholder="培训费用(元)" class="form-control" style="margin-bottom:10px;">
                            <textarea placeholder="培训目的及预期效果" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'equipment':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '设备领用表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>设备信息</h4>
                            <input type="text" placeholder="设备名称" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="设备型号" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="设备编号" class="form-control" style="margin-bottom:10px;">
                            <input type="number" placeholder="领用数量" class="form-control" style="margin-bottom:10px;">
                        </div>
                        <div class="form-kit-section">
                            <h4>领用信息</h4>
                            <input type="date" placeholder="领用日期" class="form-control" style="margin-bottom:10px;">
                            <input type="date" placeholder="预计归还日期" class="form-control" style="margin-bottom:10px;">
                            <textarea placeholder="领用用途" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'visitor':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '访客登记表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>访客信息</h4>
                            <input type="text" placeholder="访客姓名" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="身份证号" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="联系电话" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="来访单位" class="form-control" style="margin-bottom:10px;">
                        </div>
                        <div class="form-kit-section">
                            <h4>来访信息</h4>
                            <input type="text" placeholder="被访人" class="form-control" style="margin-bottom:10px;">
                            <input type="date" placeholder="来访日期" class="form-control" style="margin-bottom:10px;">
                            <div style="display:flex;gap:10px;margin-bottom:10px;">
                                <div style="flex:1;"><label>进入时间：</label><input type="time" class="form-control"></div>
                                <div style="flex:1;"><label>离开时间：</label><input type="time" class="form-control"></div>
                            </div>
                            <textarea placeholder="来访事由" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'contract':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '合同审批表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>合同信息</h4>
                            <input type="text" placeholder="合同名称" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="合同编号" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="合作方" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="合同金额(元)" class="form-control" style="margin-bottom:10px;">
                            <div style="display:flex;gap:10px;margin-bottom:10px;">
                                <div style="flex:1;"><label>签订日期：</label><input type="date" class="form-control"></div>
                                <div style="flex:1;"><label>生效日期：</label><input type="date" class="form-control"></div>
                            </div>
                            <input type="date" placeholder="到期日期" class="form-control" style="margin-bottom:10px;">
                        </div>
                        <div class="form-kit-section">
                            <h4>合同详情</h4>
                            <textarea placeholder="合同主要内容" rows="3" class="form-control" style="margin-bottom:10px;"></textarea>
                            <textarea placeholder="审批说明" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                        <div class="form-kit-section">
                            <h4>合同附件</h4>
                            <div class="upload-area" style="border:1px dashed #d9d9d9;padding:20px;text-align:center;background-color:#fafafa;">
                                <p>点击上传或拖拽文件到此处</p>
                                <input type="file" multiple style="display:none;">
                                <button class="btn btn-default" style="margin-top:10px;">选择文件</button>
                            </div>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'project':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '项目立项表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>项目信息</h4>
                            <input type="text" placeholder="项目名称" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="项目编号" class="form-control" style="margin-bottom:10px;">
                            <select class="form-control" style="margin-bottom:10px;">
                                <option value="">请选择项目类型</option>
                                <option value="rd">研发项目</option>
                                <option value="marketing">市场项目</option>
                                <option value="operation">运营项目</option>
                                <option value="other">其他项目</option>
                            </select>
                            <input type="text" placeholder="项目负责人" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="项目预算(元)" class="form-control" style="margin-bottom:10px;">
                            <div style="display:flex;gap:10px;margin-bottom:10px;">
                                <div style="flex:1;"><label>开始日期：</label><input type="date" class="form-control"></div>
                                <div style="flex:1;"><label>结束日期：</label><input type="date" class="form-control"></div>
                            </div>
                        </div>
                        <div class="form-kit-section">
                            <h4>项目详情</h4>
                            <textarea placeholder="项目背景及目标" rows="3" class="form-control" style="margin-bottom:10px;"></textarea>
                            <textarea placeholder="项目主要内容及范围" rows="3" class="form-control" style="margin-bottom:10px;"></textarea>
                            <textarea placeholder="项目风险及应对措施" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            case 'assessment':
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label || '员工评估表单'}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="form-kit-section">
                            <h4>员工信息</h4>
                            <input type="text" placeholder="员工姓名" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="部门" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="岗位" class="form-control" style="margin-bottom:10px;">
                            <input type="text" placeholder="入职日期" class="form-control" style="margin-bottom:10px;">
                        </div>
                        <div class="form-kit-section">
                            <h4>评估维度</h4>
                            <div style="margin-bottom:10px;">
                                <label>专业能力：</label>
                                <div class="rating" style="display:flex;">
                                    <input type="radio" name="professional" value="1">1
                                    <input type="radio" name="professional" value="2">2
                                    <input type="radio" name="professional" value="3">3
                                    <input type="radio" name="professional" value="4">4
                                    <input type="radio" name="professional" value="5" checked>5
                                </div>
                            </div>
                            <div style="margin-bottom:10px;">
                                <label>沟通能力：</label>
                                <div class="rating" style="display:flex;">
                                    <input type="radio" name="communication" value="1">1
                                    <input type="radio" name="communication" value="2">2
                                    <input type="radio" name="communication" value="3">3
                                    <input type="radio" name="communication" value="4">4
                                    <input type="radio" name="communication" value="5" checked>5
                                </div>
                            </div>
                            <div style="margin-bottom:10px;">
                                <label>团队协作：</label>
                                <div class="rating" style="display:flex;">
                                    <input type="radio" name="teamwork" value="1">1
                                    <input type="radio" name="teamwork" value="2">2
                                    <input type="radio" name="teamwork" value="3">3
                                    <input type="radio" name="teamwork" value="4">4
                                    <input type="radio" name="teamwork" value="5" checked>5
                                </div>
                            </div>
                            <div style="margin-bottom:10px;">
                                <label>工作态度：</label>
                                <div class="rating" style="display:flex;">
                                    <input type="radio" name="attitude" value="1">1
                                    <input type="radio" name="attitude" value="2">2
                                    <input type="radio" name="attitude" value="3">3
                                    <input type="radio" name="attitude" value="4">4
                                    <input type="radio" name="attitude" value="5" checked>5
                                </div>
                            </div>
                        </div>
                        <div class="form-kit-section">
                            <h4>评估总结</h4>
                            <textarea placeholder="主要优点" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                            <textarea placeholder="待改进之处" rows="2" class="form-control" style="margin-bottom:10px;"></textarea>
                            <textarea placeholder="总体评价及建议" rows="3" class="form-control" style="margin-bottom:10px;"></textarea>
                        </div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
                break;
            default:
                controlHtml = `
                    <div class="control-header">
                        <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
                    </div>
                    <div class="control-body">
                        <div class="placeholder-control">${control.name}控件</div>
                    </div>
                    ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
                `;
        }
        
        controlElement.innerHTML = controlHtml;
        
        // 添加选中事件
        controlElement.addEventListener('click', function(e) {
            // 阻止事件冒泡，避免影响子元素的操作
            e.stopPropagation();
            selectControl(control.id);
        });
        
        // 添加到布局容器
        layoutContainer.appendChild(controlElement);
        
        // 为新添加的控件添加淡入动画
        controlElement.style.opacity = '0';
        controlElement.style.transform = 'translateY(10px)';
        controlElement.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            controlElement.style.opacity = '1';
            controlElement.style.transform = 'translateY(0)';
        }, 50);
    });
    
    // 如果有选中的控件，重新选中它
    if (selectedControlId) {
        selectControl(selectedControlId);
    }
}

// 选中控件
function selectControl(controlId) {
    // 移除所有选中状态
    document.querySelectorAll('.form-control-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 设置当前选中控件ID
    selectedControlId = controlId;
    
    // 找到并选中控件
    const selectedElement = document.querySelector(`.form-control-item[data-id="${controlId}"]`);
    if (selectedElement) {
        // 添加选中样式
        selectedElement.classList.add('selected');
        
        // 平滑滚动到选中的控件
        selectedElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    
    // 显示属性面板
    const noControlSelected = document.getElementById('noControlSelected');
    const basicProperties = document.getElementById('basicProperties');
    
    // 添加安全检查，确保元素存在再操作classList
    if (noControlSelected) {
        noControlSelected.classList.add('hidden');
    }
    if (basicProperties) {
        basicProperties.classList.remove('hidden');
    }
    
    // 查找控件数据
    const control = formControls.find(c => c.id === controlId);
    if (control) {
        // 填充基本属性面板
        setElementValue('controlName', control.name);
        setElementValue('controlLabel', control.label);
        setElementValue('controlField', control.field);
        setElementValue('controlRequired', control.required, 'boolean');
        setElementValue('controlDefaultValue', control.defaultValue);
        setElementValue('controlPlaceholder', control.placeholder);
        setElementValue('controlValidation', control.validation);
        setElementValue('controlHelpText', control.helpText);
        setElementValue('controlWidth', control.width, 'integer');
        
        const widthValue = document.getElementById('widthValue');
        if (widthValue) {
            widthValue.textContent = control.width + '%';
        }
        
        // 隐藏所有控件特有属性面板
        hideAllSpecificProperties();
        
        // 显示当前控件类型的特有属性面板
        showSpecificProperties(control.type);
        
        // 填充控件特有属性
        populateSpecificProperties(control);
    }
}

// 隐藏所有控件特有属性面板
function hideAllSpecificProperties() {
    const specificProps = document.querySelectorAll('.control-specific-properties');
    specificProps.forEach(prop => {
        prop.classList.add('hidden');
    });
}

// 显示指定控件类型的特有属性面板
function showSpecificProperties(controlType) {
    const specificProps = document.getElementById(`${controlType}Properties`);
    if (specificProps) {
        specificProps.classList.remove('hidden');
    }
}

// 填充控件特有属性
function populateSpecificProperties(control) {
    // 根据控件类型填充特有属性
    switch (control.type) {
        case 'text':
            setElementValue('textMaxLength', control.maxLength);
            setElementValue('textMinLength', control.minLength);
            setElementValue('textPattern', control.pattern);
            setElementValue('textReadOnly', control.readOnly, 'boolean');
            
            // 设置验证规则
            setElementValue('textValidation', control.validation || '');
            
            // 设置正则表达式
            if (control.regexPattern) {
                setElementValue('textRegex', control.regexPattern);
            }
            
            // 显示或隐藏正则相关元素
            const regexInputGroup = document.getElementById('regexInputGroup');
            const regexTestGroup = document.getElementById('regexTestGroup');
            const textValidation = document.getElementById('textValidation');
            
            if (regexInputGroup && regexTestGroup && textValidation) {
                if (textValidation.value === 'regex') {
                    regexInputGroup.classList.remove('hidden');
                    regexTestGroup.classList.remove('hidden');
                } else {
                    regexInputGroup.classList.add('hidden');
                    regexTestGroup.classList.add('hidden');
                }
            }
            break;
        case 'textarea':
            setElementValue('textareaRows', control.rows || 3, 'integer');
            setElementValue('textareaCols', control.cols || 50, 'integer');
            setElementValue('textareaMaxLength', control.maxLength);
            setElementValue('textareaMinLength', control.minLength);
            setElementValue('textareaReadOnly', control.readOnly, 'boolean');
            break;
        case 'number':
            setElementValue('numberMin', control.min !== undefined ? control.min : '');
            setElementValue('numberMax', control.max !== undefined ? control.max : '');
            setElementValue('numberStep', control.step || 1, 'number');
            setElementValue('numberUnit', control.unit);
            break;
        case 'date':
            setElementValue('dateMin', control.min);
            setElementValue('dateMax', control.max);
            setElementValue('dateFormat', control.format || 'YYYY-MM-DD');
            break;
        case 'time':
            setElementValue('timeMin', control.min);
            setElementValue('timeMax', control.max);
            setElementValue('timeFormat', control.format || 'HH:mm');
            break;
        case 'select':
            setElementValue('selectOptions', control.options, 'array');
            setElementValue('selectMultiple', control.multiple, 'boolean');
            setElementValue('selectSize', control.size || 1, 'integer');
            break;
        case 'radio':
            setElementValue('radioOptions', control.options, 'array');
            break;
        case 'checkbox':
            setElementValue('checkboxOptions', control.options, 'array');
            break;
        case 'switch':
            setElementValue('switchOnText', control.onText || '开启');
            setElementValue('switchOffText', control.offText || '关闭');
            break;
        case 'file':
            setElementValue('fileAccept', control.accept);
            setElementValue('fileMultiple', control.multiple, 'boolean');
            setElementValue('fileMaxSize', control.maxSize);
            break;
        case 'image':
            setElementValue('imageAccept', control.accept || 'image/*');
            setElementValue('imageTypes', control.imageTypes || 'jpg,jpeg,png,gif');
            setElementValue('imageMaxSize', control.imageMaxSize || 5, 'integer');
            setElementValue('imageMaxCount', control.imageMaxCount || 1, 'integer');
            setElementValue('imageCrop', control.imageCrop || false, 'boolean');
            setElementValue('imageAspectRatio', control.imageAspectRatio || '');
            setElementValue('imageDisplayStyle', control.imageDisplayStyle || 'default');
            setElementValue('imageButtonText', control.imageButtonText || '选择图片');
            break;
        case 'divider':
            setElementValue('dividerText', control.dividerText);
            setElementValue('dividerAlign', control.dividerAlign || 'center');
            setElementValue('dividerStyle', control.dividerStyle || 'solid');
            setElementValue('dividerColor', control.dividerColor || '#d9d9d9');
            // 同步颜色值到文本输入框
            if (document.getElementById('dividerColorText')) {
                document.getElementById('dividerColorText').value = control.dividerColor || '#d9d9d9';
            }
            setElementValue('dividerThickness', control.dividerThickness || 1, 'integer');
            // 同步厚度值到滑块和显示文本
            if (document.getElementById('dividerThicknessRange')) {
                document.getElementById('dividerThicknessRange').value = control.dividerThickness || 1;
            }
            if (document.getElementById('dividerThicknessValue')) {
                document.getElementById('dividerThicknessValue').textContent = control.dividerThickness || 1;
            }
            break;
        case 'qrcode':
            setElementValue('qrcodeContent', control.content);
            setElementValue('qrcodeSize', control.size || 120, 'integer');
            setElementValue('qrcodeColorDark', control.colorDark || '#000000');
            setElementValue('qrcodeColorLight', control.colorLight || '#ffffff');
            break;
        case 'sms':
            setElementValue('smsButtonText', control.buttonText || '获取验证码');
            setElementValue('smsCountdown', control.countdown || 60, 'integer');
            break;
        case 'ai':
            setElementValue('aiPlaceholder', control.placeholder || '请输入您的问题');
            setElementValue('aiButtonText', control.buttonText || '发送给AI助手');
            break;
        case 'camera':
            setElementValue('cameraWidth', control.width || 240, 'integer');
            setElementValue('cameraHeight', control.height || 180, 'integer');
            setElementValue('cameraQuality', control.quality || 0.8, 'number');
            break;
        case 'ocr':
            setElementValue('ocrButtonText', control.buttonText || '识别文字');
            setElementValue('ocrLanguage', control.language || 'zh-CN');
            break;
        case 'signature':
            setElementValue('signatureWidth', control.width || 300, 'integer');
            setElementValue('signatureHeight', control.height || 150, 'integer');
            setElementValue('signatureLineWidth', control.lineWidth || 2, 'integer');
            setElementValue('signatureColor', control.color || '#000000');
            break;
        case 'map':
            setElementValue('mapWidth', control.width || 300, 'integer');
            setElementValue('mapHeight', control.height || 200, 'integer');
            setElementValue('mapDefaultLat', control.defaultLat);
            setElementValue('mapDefaultLng', control.defaultLng);
            break;
        case 'barcode':
            setElementValue('barcodeContent', control.content);
            setElementValue('barcodeWidth', control.width || 200, 'integer');
            setElementValue('barcodeHeight', control.height || 80, 'integer');
            setElementValue('barcodeType', control.type || 'CODE128');
            break;
        case 'video':
            setElementValue('videoWidth', control.width || 320, 'integer');
            setElementValue('videoHeight', control.height || 240, 'integer');
            setElementValue('videoControls', control.controls !== false, 'boolean');
            setElementValue('videoAutoPlay', control.autoPlay || false, 'boolean');
            break;
        case 'audio':
            setElementValue('audioControls', control.controls !== false, 'boolean');
            setElementValue('audioAutoPlay', control.autoPlay || false, 'boolean');
            setElementValue('audioLoop', control.loop || false, 'boolean');
            break;
        case 'digital_sign':
            setElementValue('digitalSignButtonText', control.buttonText || '应用数字签名');
            break;
        case 'biometric':
            setElementValue('biometricFingerprintText', control.fingerprintText || '开始指纹识别');
            setElementValue('biometricFaceText', control.faceText || '开始人脸识别');
            break;
        case 'subform':
            setElementValue('subformConfigText', control.configText || '配置子表单');
            break;
        case 'table':
            setElementValue('tableConfigText', control.configText || '配置表格');
            break;
        case 'recruitment':
        case 'attendance':
        case 'leave':
        case 'expense':
        case 'purchase':
        case 'meeting':
        case 'travel':
        case 'performance':
        case 'training':
        case 'equipment':
        case 'visitor':
        case 'contract':
        case 'project':
        case 'assessment':
            // 这些套件类型的特有属性可能需要更复杂的处理
            // 这里可以根据需要添加相应的属性填充逻辑
            break;
        default:
            // 其他控件类型的处理
            break;
    }
}

// 切换分类展开收起
function toggleCategory(element) {
    const content = element.nextElementSibling;
    const icon = element.querySelector('.category-toggle-icon');
    
    if (content.style.display === 'none') {
        // 展开
        content.style.display = 'block';
        icon.textContent = '▼';
        // 添加展开动画效果
        content.classList.add('category-content-animating');
        setTimeout(() => {
            content.classList.remove('category-content-animating');
        }, 300);
    } else {
        // 收起
        content.style.display = 'none';
        icon.textContent = '►';
    }
}

// 初始化按钮事件
function initButtons() {
    // 清空表单按钮
    addEventIfElementExists('clearFormBtn', 'click', function() {
        if (confirm('确定要清空表单设计吗？此操作不可撤销。')) {
            formControls = [];
            selectedControlId = null;
            renderFormControls();
            
            // 隐藏属性面板 - 使用安全的DOM访问
            const noControlSelected = document.getElementById('noControlSelected');
            const controlProperties = document.getElementById('controlProperties');
            if (noControlSelected) noControlSelected.classList.remove('hidden');
            if (controlProperties) controlProperties.classList.add('hidden');
            
            // 更新数据到父页面
            updateParentData();
        }
    });
    
    // 保存设计按钮
    addEventIfElementExists('saveDesignBtn', 'click', function() {
        updateParentData();
        
        // 显示保存成功提示（使用更友好的提示方式）
        showSuccessMessage('表单设计已保存');
    });
    
    // 删除控件按钮 - 使用统一的删除函数
    addEventIfElementExists('deleteControlBtn', 'click', function() {
        if (selectedControlId) {
            if (confirm('确定要删除此控件吗？')) {
                window.deleteControl(selectedControlId);
            }
        }
    });
    
    // 复制控件按钮
    addEventIfElementExists('copyControlBtn', 'click', function() {
        if (selectedControlId) {
            // 查找控件数据
            const controlToCopy = formControls.find(c => c.id === selectedControlId);
            if (controlToCopy) {
                // 创建副本（深拷贝）
                const copiedControl = JSON.parse(JSON.stringify(controlToCopy));
                // 生成新ID
                copiedControl.id = 'control_' + Date.now();
                // 更新字段名避免冲突
                copiedControl.field = copiedControl.field + '_copy';
                // 更新标签添加副本标识
                copiedControl.label = copiedControl.label + ' (副本)';
                
                // 添加到控件列表
                formControls.push(copiedControl);
                
                // 重新渲染
                renderFormControls();
                
                // 选中新添加的控件
                selectControl(copiedControl.id);
                
                // 更新数据到父页面
                updateParentData();
            }
        }
    });
}

// 初始化控件属性事件
function initControlPropertyEvents() {
    // 控件名称变更
    addEventIfElementExists('controlName', 'change', updateControlProperties);
    
    // 控件标签变更
    addEventIfElementExists('controlLabel', 'change', updateControlProperties);
    
    // 字段名变更
    addEventIfElementExists('controlField', 'change', updateControlProperties);
    
    // 是否必填变更
    addEventIfElementExists('controlRequired', 'change', updateControlProperties);
    
    // 初始值变更
    addEventIfElementExists('controlDefaultValue', 'change', updateControlProperties);
    
    // 占位文本变更
    addEventIfElementExists('controlPlaceholder', 'change', updateControlProperties);
    
    // 验证规则变更
    addEventIfElementExists('controlValidation', 'change', updateControlProperties);
    
    // 帮助文本变更
    addEventIfElementExists('controlHelpText', 'change', updateControlProperties);
    
    // 宽度变更 - 使用安全的DOM访问，并实现实时更新
    addEventIfElementExists('controlWidth', 'input', function() {
        const widthValue = document.getElementById('widthValue');
        if (widthValue) {
            widthValue.textContent = this.value + '%';
        }
        
        // 立即应用宽度变化到选中的控件
        if (selectedControlId) {
            const controlElement = document.querySelector(`.form-control-item[data-id="${selectedControlId}"]`);
            if (controlElement) {
                controlElement.style.width = `${this.value}%`;
            }
        }
        
        updateControlProperties();
    });
    
    // 初始化控件特有属性事件
    initSpecificPropertyEvents();
}

// 初始化控件特有属性事件
function initSpecificPropertyEvents() {
    // 单行文本特有属性
    addEventIfElementExists('textMaxLength', 'change', updateControlSpecificProperties);
    addEventIfElementExists('textMinLength', 'change', updateControlSpecificProperties);
    addEventIfElementExists('textPattern', 'change', updateControlSpecificProperties);
    addEventIfElementExists('textReadOnly', 'change', updateControlSpecificProperties);
    
    // 单行文本验证规则变更
    addEventIfElementExists('textValidation', 'change', function() {
        const regexInputGroup = document.getElementById('regexInputGroup');
        const regexTestGroup = document.getElementById('regexTestGroup');
        const textValidation = document.getElementById('textValidation');
        
        if (regexInputGroup && regexTestGroup && textValidation) {
            if (textValidation.value === 'regex') {
                regexInputGroup.classList.remove('hidden');
                regexTestGroup.classList.remove('hidden');
            } else {
                regexInputGroup.classList.add('hidden');
                regexTestGroup.classList.add('hidden');
            }
        }
        updateControlSpecificProperties();
    });
    
    // 正则表达式测试按钮点击事件
    addEventIfElementExists('testRegexBtn', 'click', testRegexExpression);
    
    // 多行文本特有属性
    addEventIfElementExists('textareaRows', 'change', updateControlSpecificProperties);
    addEventIfElementExists('textareaCols', 'change', updateControlSpecificProperties);
    addEventIfElementExists('textareaMaxLength', 'change', updateControlSpecificProperties);
    addEventIfElementExists('textareaMinLength', 'change', updateControlSpecificProperties);
    addEventIfElementExists('textareaReadOnly', 'change', updateControlSpecificProperties);
    
    // 数字输入特有属性
    addEventIfElementExists('numberMin', 'change', updateControlSpecificProperties);
    addEventIfElementExists('numberMax', 'change', updateControlSpecificProperties);
    addEventIfElementExists('numberStep', 'change', updateControlSpecificProperties);
    addEventIfElementExists('numberUnit', 'change', updateControlSpecificProperties);
    
    // 日期选择特有属性
    addEventIfElementExists('dateMin', 'change', updateControlSpecificProperties);
    addEventIfElementExists('dateMax', 'change', updateControlSpecificProperties);
    addEventIfElementExists('dateFormat', 'change', updateControlSpecificProperties);
    
    // 时间选择特有属性
    addEventIfElementExists('timeMin', 'change', updateControlSpecificProperties);
    addEventIfElementExists('timeMax', 'change', updateControlSpecificProperties);
    addEventIfElementExists('timeFormat', 'change', updateControlSpecificProperties);
    
    // 下拉选择特有属性
    addEventIfElementExists('selectOptions', 'change', updateControlSpecificProperties);
    addEventIfElementExists('selectMultiple', 'change', updateControlSpecificProperties);
    addEventIfElementExists('selectSize', 'change', updateControlSpecificProperties);
    
    // 单选框特有属性
    addEventIfElementExists('radioOptions', 'change', updateControlSpecificProperties);
    
    // 复选框特有属性
    addEventIfElementExists('checkboxOptions', 'change', updateControlSpecificProperties);
    
    // 开关特有属性
    addEventIfElementExists('switchOnText', 'change', updateControlSpecificProperties);
    addEventIfElementExists('switchOffText', 'change', updateControlSpecificProperties);
    
    // 文件上传特有属性
    addEventIfElementExists('fileAccept', 'change', updateControlSpecificProperties);
    addEventIfElementExists('fileMultiple', 'change', updateControlSpecificProperties);
    addEventIfElementExists('fileMaxSize', 'change', updateControlSpecificProperties);
    
    // 图片上传特有属性
    addEventIfElementExists('imageAccept', 'change', updateControlSpecificProperties);
    addEventIfElementExists('imageTypes', 'change', updateControlSpecificProperties);
    addEventIfElementExists('imageMaxSize', 'change', updateControlSpecificProperties);
    addEventIfElementExists('imageMaxCount', 'change', updateControlSpecificProperties);
    addEventIfElementExists('imageCrop', 'change', updateControlSpecificProperties);
    addEventIfElementExists('imageAspectRatio', 'change', updateControlSpecificProperties);
    addEventIfElementExists('imageDisplayStyle', 'change', updateControlSpecificProperties);
    addEventIfElementExists('imageButtonText', 'change', updateControlSpecificProperties);
    
    // 分割线特有属性
    addEventIfElementExists('dividerText', 'change', updateControlSpecificProperties);
    addEventIfElementExists('dividerAlign', 'change', updateControlSpecificProperties);
    addEventIfElementExists('dividerStyle', 'change', updateControlSpecificProperties);
    addEventIfElementExists('dividerColor', 'change', updateControlSpecificProperties);
    addEventIfElementExists('dividerColorText', 'change', function() {
        // 同步文本输入的颜色值到颜色选择器
        if (document.getElementById('dividerColor')) {
            document.getElementById('dividerColor').value = this.value;
        }
        updateControlSpecificProperties();
    });
    addEventIfElementExists('dividerThickness', 'change', updateControlSpecificProperties);
    addEventIfElementExists('dividerThicknessRange', 'input', function() {
        // 更新显示的厚度值
        if (document.getElementById('dividerThicknessValue')) {
            document.getElementById('dividerThicknessValue').textContent = this.value;
        }
        // 同步滑块值到隐藏输入框
        if (document.getElementById('dividerThickness')) {
            document.getElementById('dividerThickness').value = this.value;
        }
        updateControlSpecificProperties();
    });
    
    // 二维码特有属性
    addEventIfElementExists('qrcodeContent', 'change', updateControlSpecificProperties);
    addEventIfElementExists('qrcodeSize', 'change', updateControlSpecificProperties);
    addEventIfElementExists('qrcodeColorDark', 'change', updateControlSpecificProperties);
    addEventIfElementExists('qrcodeColorLight', 'change', updateControlSpecificProperties);
    
    // 短信验证码特有属性
    addEventIfElementExists('smsButtonText', 'change', updateControlSpecificProperties);
    addEventIfElementExists('smsCountdown', 'change', updateControlSpecificProperties);
    
    // AI助手特有属性
    addEventIfElementExists('aiPlaceholder', 'change', updateControlSpecificProperties);
    addEventIfElementExists('aiButtonText', 'change', updateControlSpecificProperties);
    
    // 摄像头特有属性
    addEventIfElementExists('cameraWidth', 'change', updateControlSpecificProperties);
    addEventIfElementExists('cameraHeight', 'change', updateControlSpecificProperties);
    addEventIfElementExists('cameraQuality', 'change', updateControlSpecificProperties);
    
    // OCR识别特有属性
    addEventIfElementExists('ocrButtonText', 'change', updateControlSpecificProperties);
    addEventIfElementExists('ocrLanguage', 'change', updateControlSpecificProperties);
    
    // 签名特有属性
    addEventIfElementExists('signatureWidth', 'change', updateControlSpecificProperties);
    addEventIfElementExists('signatureHeight', 'change', updateControlSpecificProperties);
    addEventIfElementExists('signatureLineWidth', 'change', updateControlSpecificProperties);
    addEventIfElementExists('signatureColor', 'change', updateControlSpecificProperties);
    
    // 地图特有属性
    addEventIfElementExists('mapWidth', 'change', updateControlSpecificProperties);
    addEventIfElementExists('mapHeight', 'change', updateControlSpecificProperties);
    addEventIfElementExists('mapDefaultLat', 'change', updateControlSpecificProperties);
    addEventIfElementExists('mapDefaultLng', 'change', updateControlSpecificProperties);
    
    // 条形码特有属性
    addEventIfElementExists('barcodeContent', 'change', updateControlSpecificProperties);
    addEventIfElementExists('barcodeWidth', 'change', updateControlSpecificProperties);
    addEventIfElementExists('barcodeHeight', 'change', updateControlSpecificProperties);
    addEventIfElementExists('barcodeType', 'change', updateControlSpecificProperties);
    
    // 视频特有属性
    addEventIfElementExists('videoWidth', 'change', updateControlSpecificProperties);
    addEventIfElementExists('videoHeight', 'change', updateControlSpecificProperties);
    addEventIfElementExists('videoControls', 'change', updateControlSpecificProperties);
    addEventIfElementExists('videoAutoPlay', 'change', updateControlSpecificProperties);
    
    // 音频特有属性
    addEventIfElementExists('audioControls', 'change', updateControlSpecificProperties);
    addEventIfElementExists('audioAutoPlay', 'change', updateControlSpecificProperties);
    addEventIfElementExists('audioLoop', 'change', updateControlSpecificProperties);
    
    // 数字签名特有属性
    addEventIfElementExists('digitalSignButtonText', 'change', updateControlSpecificProperties);
    
    // 生物识别特有属性
    addEventIfElementExists('biometricFingerprintText', 'change', updateControlSpecificProperties);
    addEventIfElementExists('biometricFaceText', 'change', updateControlSpecificProperties);
    
    // 子表单特有属性
    addEventIfElementExists('subformConfigText', 'change', updateControlSpecificProperties);
    
    // 表格特有属性
    addEventIfElementExists('tableConfigText', 'change', updateControlSpecificProperties);
}

// 更新控件属性
function updateControlProperties() {
    if (selectedControlId) {
        // 查找控件数据
        const control = formControls.find(c => c.id === selectedControlId);
        if (control) {
            // 更新基本属性 - 使用安全的DOM访问方法
            control.name = getElementValue('controlName');
            control.label = getElementValue('controlLabel');
            control.field = getElementValue('controlField');
            control.required = getElementValue('controlRequired', false, 'boolean');
            control.defaultValue = getElementValue('controlDefaultValue');
            control.placeholder = getElementValue('controlPlaceholder');
            control.validation = getElementValue('controlValidation');
            control.helpText = getElementValue('controlHelpText');
            control.width = getElementValue('controlWidth', 100, 'integer');
            
            // 确保properties对象存在
            if (!control.properties) {
                control.properties = {};
            }
            
            // 重新渲染
            renderFormControls();
            
            // 更新数据到父页面
            updateParentData();
        }
    }
}

// 测试正则表达式
function testRegexExpression() {
    const regexInput = document.getElementById('textRegex');
    const testInput = document.getElementById('textRegexTest');
    const testResult = document.getElementById('regexTestResult');
    
    if (!regexInput || !testInput || !testResult) {
        return;
    }
    
    const regexPattern = regexInput.value;
    const testValue = testInput.value;
    
    if (!regexPattern) {
        showTestResult(testResult, '请输入正则表达式', 'error');
        return;
    }
    
    try {
        // 创建正则表达式对象
        const regex = new RegExp(regexPattern);
        
        // 测试输入值
        if (regex.test(testValue)) {
            showTestResult(testResult, '验证通过', 'success');
        } else {
            showTestResult(testResult, '验证失败', 'error');
        }
    } catch (error) {
        showTestResult(testResult, '正则表达式格式错误: ' + error.message, 'error');
    }
}

// 显示测试结果
function showTestResult(element, message, type) {
    if (!element) {
        return;
    }
    
    // 移除之前的样式
    element.classList.remove('success', 'error');
    
    // 添加新样式
    element.classList.add(type);
    
    // 设置消息
    element.textContent = message;
    
    // 显示结果
    element.classList.remove('hidden');
    
    // 3秒后自动隐藏结果
    setTimeout(() => {
        if (element) {
            element.classList.add('hidden');
        }
    }, 3000);
}

// 更新控件特有属性
function updateControlSpecificProperties() {
    if (selectedControlId) {
        // 查找控件数据
        const control = formControls.find(c => c.id === selectedControlId);
        if (control) {
            // 确保properties对象存在
            if (!control.properties) {
                control.properties = {};
            }
            
            // 根据控件类型更新特有属性
            switch (control.type) {
                case 'text':
                    control.maxLength = getElementValue('textMaxLength', undefined, 'integer');
                    control.minLength = getElementValue('textMinLength', undefined, 'integer');
                    control.pattern = getElementValue('textPattern');
                    control.readOnly = getElementValue('textReadOnly', false, 'boolean');
                    control.validation = getElementValue('textValidation');
                    
                    // 如果选择了正则表达式验证，保存正则表达式
                    if (control.validation === 'regex') {
                        control.regexPattern = getElementValue('textRegex');
                    } else {
                        delete control.regexPattern;
                    }
                    break;
                case 'textarea':
                    control.rows = getElementValue('textareaRows', 3, 'integer');
                    control.cols = getElementValue('textareaCols', 30, 'integer');
                    control.maxLength = getElementValue('textareaMaxLength', undefined, 'integer');
                    control.minLength = getElementValue('textareaMinLength', undefined, 'integer');
                    control.readOnly = getElementValue('textareaReadOnly', false, 'boolean');
                    break;
                case 'number':
                    control.min = getElementValue('numberMin', undefined, 'number');
                    control.max = getElementValue('numberMax', undefined, 'number');
                    control.step = getElementValue('numberStep', 1, 'number');
                    control.unit = getElementValue('numberUnit');
                    break;
                case 'date':
                    control.min = getElementValue('dateMin');
                    control.max = getElementValue('dateMax');
                    control.format = getElementValue('dateFormat', 'YYYY-MM-DD');
                    break;
                case 'time':
                    control.min = getElementValue('timeMin');
                    control.max = getElementValue('timeMax');
                    control.format = getElementValue('timeFormat', 'HH:mm');
                    break;
                case 'select':
                    control.options = getElementValue('selectOptions', [], 'array');
                    control.multiple = getElementValue('selectMultiple', false, 'boolean');
                    control.size = getElementValue('selectSize', 1, 'integer');
                    break;
                case 'radio':
                    control.options = getElementValue('radioOptions', [], 'array');
                    break;
                case 'checkbox':
                    control.options = getElementValue('checkboxOptions', [], 'array');
                    break;
                case 'switch':
                    control.onText = getElementValue('switchOnText', '是');
                    control.offText = getElementValue('switchOffText', '否');
                    break;
                case 'file':
                    control.accept = getElementValue('fileAccept');
                    control.multiple = getElementValue('fileMultiple', false, 'boolean');
                    control.maxSize = getElementValue('fileMaxSize', undefined, 'integer');
                    break;
                case 'image':
                    control.accept = getElementValue('imageAccept', 'image/*');
                    control.imageTypes = getElementValue('imageTypes', 'jpg,jpeg,png,gif');
                    control.imageMaxSize = getElementValue('imageMaxSize', 5, 'integer');
                    control.imageMaxCount = getElementValue('imageMaxCount', 1, 'integer');
                    control.imageCrop = getElementValue('imageCrop', false, 'boolean');
                    control.imageAspectRatio = getElementValue('imageAspectRatio', 'free');
                    control.imageDisplayStyle = getElementValue('imageDisplayStyle', 'default');
                    control.imageButtonText = getElementValue('imageButtonText', '选择图片');
                    break;
                case 'divider':
                    control.dividerText = getElementValue('dividerText');
                    control.dividerAlign = getElementValue('dividerAlign', 'center');
                    control.dividerStyle = getElementValue('dividerStyle', 'solid');
                    control.dividerColor = getElementValue('dividerColor', '#d9d9d9');
                    control.dividerThickness = getElementValue('dividerThickness', 1, 'integer');
                    break;
                case 'qrcode':
                    control.content = getElementValue('qrcodeContent', '');
                    control.size = getElementValue('qrcodeSize', 128, 'integer');
                    control.colorDark = getElementValue('qrcodeColorDark', '#000000');
                    control.colorLight = getElementValue('qrcodeColorLight', '#ffffff');
                    break;
                case 'sms':
                    control.buttonText = getElementValue('smsButtonText', '获取验证码');
                    control.countdown = getElementValue('smsCountdown', 60, 'integer');
                    break;
                case 'ai':
                    control.placeholder = getElementValue('aiPlaceholder', '请输入问题...');
                    control.buttonText = getElementValue('aiButtonText', 'AI 助手');
                    break;
                case 'camera':
                    control.width = getElementValue('cameraWidth', 320, 'integer');
                    control.height = getElementValue('cameraHeight', 240, 'integer');
                    control.quality = getElementValue('cameraQuality', 0.9, 'number');
                    break;
                case 'ocr':
                    control.buttonText = getElementValue('ocrButtonText', 'OCR识别');
                    control.language = getElementValue('ocrLanguage', 'zh-CN');
                    break;
                case 'signature':
                    control.width = getElementValue('signatureWidth', 400, 'integer');
                    control.height = getElementValue('signatureHeight', 200, 'integer');
                    control.lineWidth = getElementValue('signatureLineWidth', 2, 'integer');
                    control.color = getElementValue('signatureColor', '#000000');
                    break;
                case 'map':
                    control.width = getElementValue('mapWidth', 500, 'integer');
                    control.height = getElementValue('mapHeight', 300, 'integer');
                    control.defaultLat = getElementValue('mapDefaultLat');
                    control.defaultLng = getElementValue('mapDefaultLng');
                    break;
                case 'barcode':
                    control.content = getElementValue('barcodeContent', '');
                    control.width = getElementValue('barcodeWidth', 200, 'integer');
                    control.height = getElementValue('barcodeHeight', 80, 'integer');
                    control.type = getElementValue('barcodeType', 'code128');
                    break;
                case 'video':
                    control.width = getElementValue('videoWidth', 640, 'integer');
                    control.height = getElementValue('videoHeight', 480, 'integer');
                    control.controls = getElementValue('videoControls', true, 'boolean');
                    control.autoPlay = getElementValue('videoAutoPlay', false, 'boolean');
                    break;
                case 'audio':
                    control.controls = getElementValue('audioControls', true, 'boolean');
                    control.autoPlay = getElementValue('audioAutoPlay', false, 'boolean');
                    control.loop = getElementValue('audioLoop', false, 'boolean');
                    break;
                case 'digital_sign':
                    control.buttonText = getElementValue('digitalSignButtonText', '数字签名');
                    break;
                case 'biometric':
                    control.fingerprintText = getElementValue('biometricFingerprintText', '指纹识别');
                    control.faceText = getElementValue('biometricFaceText', '人脸识别');
                    break;
                case 'subform':
                    control.configText = getElementValue('subformConfigText', '');
                    break;
                case 'table':
                    control.configText = getElementValue('tableConfigText', '');
                    break;
                case 'recruitment':
                case 'attendance':
                case 'leave':
                case 'expense':
                case 'purchase':
                case 'meeting':
                case 'travel':
                case 'performance':
                case 'training':
                case 'equipment':
                case 'visitor':
                case 'contract':
                case 'project':
                case 'assessment':
                    // 这些套件类型的特有属性可能需要更复杂的处理
                    break;
                default:
                    // 其他控件类型的处理
                    break;
            }
            
            // 重新渲染
            renderFormControls();
            
            // 更新数据到父页面
            updateParentData();
        }
    }
}

// 获取元素值的安全辅助函数
function getElementValue(elementId, defaultValue = undefined, type = 'string') {
    const element = document.getElementById(elementId);
    if (!element) return defaultValue;
    
    const value = element.value;
    
    switch (type) {
        case 'number':
            return value ? parseFloat(value) : defaultValue;
        case 'integer':
            return value ? parseInt(value) : defaultValue;
        case 'boolean':
            return element.checked;
        case 'array':
            return value ? value.split('\n').filter(option => option.trim() !== '') : defaultValue;
        default:
            return value || defaultValue;
    }
}

// 设置元素值的安全辅助函数
function setElementValue(elementId, value, type = 'string') {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    switch (type) {
        case 'boolean':
            element.checked = value || false;
            break;
        case 'array':
            element.value = value && Array.isArray(value) ? value.join('\n') : '';
            break;
        default:
            element.value = value !== undefined && value !== null ? value : '';
            break;
    }
}

// 安全地添加事件监听器的辅助函数
function addEventIfElementExists(elementId, event, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(event, handler);
    }
}

// 安全地获取查询选择器结果的辅助函数
function getElementIfExists(selector) {
    const element = document.querySelector(selector);
    return element || null;
}

// 更新数据到父页面
function updateParentData() {
    window.parent.postMessage({
        type: 'update_data',
        section: 'controls',
        data: formControls
    }, '*');
}

// 验证当前步骤
function validateStep() {
    // 检查是否有至少一个控件
    const isValid = formControls.length > 0;
    
    window.parent.postMessage({
        type: 'validation_result',
        isValid: isValid,
        message: isValid ? '' : '请至少添加一个表单控件'
    }, '*');
    
    // 更新数据到父页面
    updateParentData();
}

// 监听父页面的验证请求
window.addEventListener('message', function(event) {
    if (event.data.type === 'validate') {
        validateStep();
    }
});

// 拖拽排序功能
function initDragSorting() {
    const canvas = document.getElementById('formDesignCanvas');
    let draggedItem = null;
    let dragOverItem = null;
    let startX, startY;
    let initialIndex, currentIndex;
    
    // 监听所有控件的拖拽事件
    canvas.addEventListener('dragstart', function(e) {
        if (e.target.classList.contains('form-control-item')) {
            draggedItem = e.target;
            startX = e.clientX;
            startY = e.clientY;
            
            // 获取初始位置索引
            const items = Array.from(canvas.querySelectorAll('.form-control-item'));
            initialIndex = items.indexOf(draggedItem);
            
            // 设置拖拽数据
            e.dataTransfer.effectAllowed = 'move';
            
            // 添加拖拽中样式
            setTimeout(() => {
                draggedItem.classList.add('dragging');
                draggedItem.style.opacity = '0.6';
            }, 0);
        }
    });
    
    canvas.addEventListener('dragend', function(e) {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
            draggedItem.style.opacity = '1';
            
            // 如果发生了位置变化，更新控件顺序
            const items = Array.from(canvas.querySelectorAll('.form-control-item'));
            currentIndex = items.indexOf(draggedItem);
            
            if (initialIndex !== currentIndex) {
                updateControlOrder();
            }
            
            draggedItem = null;
            dragOverItem = null;
        }
        
        // 移除拖拽悬停效果
        canvas.classList.remove('drag-over');
    });
    
    canvas.addEventListener('dragover', function(e) {
        e.preventDefault();
        
        if (draggedItem) {
            canvas.classList.add('drag-over');
            
            // 计算拖拽位置，确定要插入的位置
            const items = Array.from(canvas.querySelectorAll('.form-control-item'));
            let closestItem = null;
            let closestDistance = Infinity;
            
            items.forEach(item => {
                if (item !== draggedItem) {
                    const rect = item.getBoundingClientRect();
                    const centerY = rect.top + rect.height / 2;
                    const distance = Math.abs(e.clientY - centerY);
                    
                    if (distance < closestDistance) {
                        closestDistance = distance;
                        closestItem = item;
                    }
                }
            });
            
            if (closestItem && closestItem !== dragOverItem) {
                // 移除之前的拖拽悬停样式
                if (dragOverItem) {
                    dragOverItem.classList.remove('drag-over');
                }
                
                dragOverItem = closestItem;
                dragOverItem.classList.add('drag-over');
                
                // 计算是在上方还是下方插入
                const rect = closestItem.getBoundingClientRect();
                const centerY = rect.top + rect.height / 2;
                
                if (e.clientY < centerY) {
                    canvas.insertBefore(draggedItem, closestItem);
                } else {
                    canvas.insertBefore(draggedItem, closestItem.nextSibling);
                }
            }
        }
    });
    
    canvas.addEventListener('dragleave', function(e) {
        if (dragOverItem) {
            dragOverItem.classList.remove('drag-over');
            dragOverItem = null;
        }
        
        // 检查是否完全离开画布
        const rect = canvas.getBoundingClientRect();
        if (e.clientX < rect.left || e.clientX > rect.right || 
            e.clientY < rect.top || e.clientY > rect.bottom) {
            canvas.classList.remove('drag-over');
        }
    });
    
    // 更新控件顺序并通知父页面
function updateControlOrder() {
    // 更新控件ID和顺序
    const items = canvas.querySelectorAll('.form-control-item');
    let formData = JSON.parse(sessionStorage.getItem('formData') || '[]');
    
    // 确保formControls变量存在
    if (typeof formControls === 'undefined') {
        formControls = [];
    }
    
    // 清空formControls并按新顺序填充
    formControls = [];
    items.forEach((item) => {
        // 统一使用data-id属性
        const controlId = item.dataset.id;
        const control = formData.find(c => c.id === controlId);
        if (control) {
            formControls.push(control);
        }
    });
    
    // 保存更新后的数据
    sessionStorage.setItem('formData', JSON.stringify(formControls));
    updateParentData();
}
}

// 添加控件时的动画效果
function addControlWithAnimation(controlElement) {
    // 保存原始样式
    const originalOpacity = controlElement.style.opacity;
    const originalTransform = controlElement.style.transform;
    const originalHeight = controlElement.style.height;
    const originalMarginBottom = controlElement.style.marginBottom;
    const originalPadding = controlElement.style.padding;
    
    // 设置初始样式
    controlElement.style.opacity = '0';
    controlElement.style.transform = 'translateY(20px)';
    controlElement.style.height = '0';
    controlElement.style.marginBottom = '0';
    controlElement.style.padding = '0';
    
    // 触发重排
    controlElement.offsetHeight;
    
    // 恢复原始样式（动画前的状态）
    controlElement.style.opacity = originalOpacity;
    controlElement.style.transform = originalTransform;
    controlElement.style.height = originalHeight;
    controlElement.style.marginBottom = originalMarginBottom;
    controlElement.style.padding = originalPadding;
    
    // 应用动画
    controlElement.style.transition = 'all 0.3s ease';
    controlElement.style.opacity = '1';
    controlElement.style.transform = 'translateY(0)';
    controlElement.style.height = 'auto';
    controlElement.style.marginBottom = '16px';
    controlElement.style.padding = '16px';
    
    // 动画完成后移除过渡样式，避免影响拖拽
    setTimeout(() => {
        controlElement.style.transition = '';
    }, 300);
}

// 删除控件时的动画效果
function removeControlWithAnimation(controlElement, callback) {
    // 应用动画
    controlElement.style.transition = 'all 0.3s ease';
    controlElement.style.opacity = '0';
    controlElement.style.transform = 'translateY(20px)';
    controlElement.style.height = '0';
    controlElement.style.marginBottom = '0';
    controlElement.style.padding = '0';
    
    // 动画完成后移除元素
    setTimeout(() => {
        if (controlElement.parentNode) {
            controlElement.parentNode.removeChild(controlElement);
        }
        if (callback) {
            callback();
        }
    }, 300);
}

// 增强选中控件的交互
function enhanceControlSelection() {
    // 获取canvas元素
    const canvas = document.getElementById('formDesignCanvas');
    if (!canvas) return;
    
    canvas.addEventListener('click', function(e) {
        const controlItem = e.target.closest('.form-control-item');
        
        // 取消所有选中状态 - 使用安全的DOM访问
        const controlItems = document.querySelectorAll('.form-control-item');
        if (controlItems) {
            controlItems.forEach(item => {
                item.classList.remove('selected');
            });
        }
        
        if (controlItem) {
            // 添加选中状态
            controlItem.classList.add('selected');
            
            // 滚动到视图中心（如果控件不在视图中）
            const rect = controlItem.getBoundingClientRect();
            const viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
            
            if (rect.top < 100 || rect.bottom > viewHeight - 100) {
                controlItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            // 显示属性面板
            selectControl(controlItem.dataset.id);
        } else {
            // 如果点击画布空白处，隐藏属性面板 - 使用安全的DOM访问
            const basicProperties = document.getElementById('basicProperties');
            const noControlSelected = document.getElementById('noControlSelected');
            
            // 隐藏所有控件特有属性面板
            hideAllSpecificProperties();
            
            if (basicProperties) basicProperties.classList.add('hidden');
            if (noControlSelected) noControlSelected.classList.remove('hidden');
        }
    });
}

// 为按钮添加悬停效果
function enhanceButtonInteractions() {
    // 使用安全的DOM访问
    const buttons = document.querySelectorAll('.btn');
    if (buttons && buttons.length > 0) {
        buttons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-1px)';
                this.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = '';
                this.style.boxShadow = '';
            });
            
            button.addEventListener('mousedown', function() {
                this.style.transform = 'translateY(0)';
            });
            
            button.addEventListener('mouseup', function() {
                this.style.transform = '';
            });
        });
    }
}

// 优化控件拖拽功能
function optimizeDragControls() {
    try {
        const controlItems = document.querySelectorAll('.control-item');
        if (controlItems && controlItems.length > 0) {
            controlItems.forEach(item => {
                item.addEventListener('dragstart', function(e) {
                    e.dataTransfer.effectAllowed = 'copy';
                    e.dataTransfer.setData('text/plain', this.dataset.type);
                    
                    // 设置拖拽中样式
                    this.classList.add('dragging');
                });
                
                item.addEventListener('dragend', function() {
                    this.classList.remove('dragging');
                });
            });
        }
    } catch (error) {
        console.error('优化控件拖拽功能时出错:', error);
    }
}

// 优化空画布状态
function optimizeEmptyCanvasState() {
    try {
        const placeholder = getElementIfExists('.placeholder-text');
        
        if (placeholder && canvas) {
            function updateCanvasState() {
                try {
                    if (canvas.children && canvas.children.length > 1) { // 排除placeholder
                        placeholder.classList.add('hidden');
                    } else {
                        placeholder.classList.remove('hidden');
                    }
                } catch (error) {
                    console.error('更新画布状态时出错:', error);
                }
            }
            
            // 初始检查
            updateCanvasState();
            
            // 监听子元素变化
            const observer = new MutationObserver(updateCanvasState);
            observer.observe(canvas, { childList: true });
        }
    } catch (error) {
        console.error('优化空画布状态时出错:', error);
    }
}

// 初始化所有增强功能
function initEnhancedFeatures() {
    try {
        if (typeof initDragSorting === 'function') initDragSorting();
        if (typeof enhanceControlSelection === 'function') enhanceControlSelection();
        if (typeof enhanceButtonInteractions === 'function') enhanceButtonInteractions();
        if (typeof optimizeDragControls === 'function') optimizeDragControls();
        if (typeof optimizeEmptyCanvasState === 'function') optimizeEmptyCanvasState();
        
        // 提供删除控件功能（统一实现）
        window.deleteControl = function(controlId = null) {
            try {
                let selectedControl;
                
                // 如果没有提供controlId，则查找当前选中的控件
                if (!controlId) {
                    selectedControl = document.querySelector('.form-control-item.selected');
                    if (selectedControl) {
                        controlId = selectedControl.dataset.id;
                    }
                } else {
                    selectedControl = document.querySelector(`.form-control-item[data-id="${controlId}"]`);
                }
                
                if (selectedControl && controlId) {
                    removeControlWithAnimation(selectedControl, function() {
                        try {
                            // 动画完成后更新数据
                            if (typeof formControls !== 'undefined') {
                                formControls = formControls.filter(control => control.id !== controlId);
                            }
                            
                            // 保存更新后的数据
                            let formData = JSON.parse(sessionStorage.getItem('formData') || '[]');
                            formData = formData.filter(control => control.id !== controlId);
                            sessionStorage.setItem('formData', JSON.stringify(formData));
                            
                            updateParentData();
                            showSuccessMessage('控件已删除');
                            
                            // 隐藏属性面板
                            const controlProperties = getElementIfExists('#controlProperties');
                            const noControlSelected = getElementIfExists('#noControlSelected');
                            if (controlProperties) controlProperties.classList.add('hidden');
                            if (noControlSelected) noControlSelected.classList.remove('hidden');
                        } catch (error) {
                            console.error('删除控件回调时出错:', error);
                        }
                    });
                }
            } catch (error) {
                console.error('删除控件时出错:', error);
            }
        };
    } catch (error) {
        console.error('初始化增强功能时出错:', error);
    }
}

// 加载表单数据
function loadFormData() {
    try {
        const savedData = sessionStorage.getItem('formData');
        if (savedData) {
            try {
                const parsedControls = JSON.parse(savedData);
                if (parsedControls && Array.isArray(parsedControls)) {
                    // 避免直接覆盖可能已存在的formControls变量
                    if (typeof formControls !== 'undefined') {
                        formControls = parsedControls;
                    }
                    // 调用渲染函数
                    if (typeof renderFormControls === 'function') {
                        renderFormControls();
                    }
                }
            } catch (jsonError) {
                console.error('解析表单数据时出错:', jsonError);
            }
        }
    } catch (error) {
        console.error('加载表单数据时出错:', error);
    }
}

// 显示成功消息
function showSuccessMessage(message) {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = 'success-message';
    messageElement.textContent = message;
    
    // 添加样式
    messageElement.style.position = 'fixed';
    messageElement.style.top = '20px';
    messageElement.style.right = '20px';
    messageElement.style.padding = '12px 20px';
    messageElement.style.backgroundColor = '#52c41a';
    messageElement.style.color = '#fff';
    messageElement.style.borderRadius = '4px';
    messageElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    messageElement.style.zIndex = '1000';
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateX(100%)';
    messageElement.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    
    // 添加到页面
    document.body.appendChild(messageElement);
    
    // 显示动画
    setTimeout(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateX(0)';
    }, 10);
    
    // 3秒后隐藏
    setTimeout(() => {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateX(100%)';
        
        // 动画完成后移除元素
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 300);
    }, 3000);
}

// 初始化父页面消息监听
function initParentMessageListener() {
    window.addEventListener('message', function(event) {
        if (event.data.type === 'validate') {
            validateStep();
        } else if (event.data.action === 'validateStep') {
            const isValid = validateStep();
            window.parent.postMessage({ action: 'stepValidated', step: 3, isValid: isValid }, '*');
        } else if (event.data.action === 'getStepData') {
            const formData = JSON.parse(sessionStorage.getItem('formData') || '[]');
            window.parent.postMessage({ action: 'stepData', step: 3, data: formData }, '*');
        }
    });
}

// 辅助函数：平滑滚动到顶部
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 辅助函数：生成唯一ID
function generateUniqueId(prefix = 'control') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 辅助函数：防抖函数
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// 辅助函数：节流函数
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 控件HTML生成函数
function generateTextControlHTML(control) {
    return `
        <div class="control-header">
            <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
        </div>
        <div class="control-body">
            <input type="text" placeholder="${control.placeholder || '请输入' + control.label}">
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}

function generateTextareaControlHTML(control) {
    return `
        <div class="control-header">
            <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
        </div>
        <div class="control-body">
            <textarea placeholder="${control.placeholder || '请输入' + control.label}" rows="3"></textarea>
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}

function generateNumberControlHTML(control) {
    return `
        <div class="control-header">
            <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
        </div>
        <div class="control-body">
            <input type="number" placeholder="${control.placeholder || '请输入数字'}">
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}

function generateDateControlHTML(control) {
    return `
        <div class="control-header">
            <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
        </div>
        <div class="control-body">
            <input type="date">
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}

function generateTimeControlHTML(control) {
    return `
        <div class="control-header">
            <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
        </div>
        <div class="control-body">
            <input type="time">
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}

function generateSelectControlHTML(control) {
    let optionsHtml = control.options.map(option => 
        `<option value="${option}">${option}</option>`
    ).join('');
    return `
        <div class="control-header">
            <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
        </div>
        <div class="control-body">
            <select>${optionsHtml}</select>
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}

function generateRadioControlHTML(control) {
    let radioHtml = control.options.map((option, index) => 
        `<label class="radio-label"><input type="radio" name="${control.field}" value="${option}"> ${option}</label>`
    ).join('');
    return `
        <div class="control-header">
            <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
        </div>
        <div class="control-body">
            <div class="radio-group">${radioHtml}</div>
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}

function generateCheckboxControlHTML(control) {
    let checkboxHtml = control.options.map((option, index) => 
        `<label class="checkbox-label"><input type="checkbox" name="${control.field}" value="${option}"> ${option}</label>`
    ).join('');
    return `
        <div class="control-header">
            <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
        </div>
        <div class="control-body">
            <div class="checkbox-group">${checkboxHtml}</div>
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}

function generateSwitchControlHTML(control) {
    return `
        <div class="control-header">
            <label>${control.label}</label>
        </div>
        <div class="control-body">
            <label class="switch-label">
                <input type="checkbox">
                <span class="switch-slider"></span>
            </label>
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}

function generateFileControlHTML(control) {
    return `
        <div class="control-header">
            <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
        </div>
        <div class="control-body">
            <input type="file">
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}

function generateImageControlHTML(control) {
    // 获取样式属性，使用默认值以防属性未定义
    const displayStyle = control.imageDisplayStyle || 'default';
    const buttonText = control.imageButtonText || '选择图片';
    const acceptTypes = control.imageTypes || 'jpg,jpeg,png,gif';
    const acceptAttr = acceptTypes ? `accept=".${acceptTypes.replace(/,/g, ', .')}"` : 'accept="image/*"';
    const isMultiple = control.imageMaxCount && control.imageMaxCount > 1;
    const multipleAttr = isMultiple ? 'multiple' : '';
    
    // 根据不同的展示样式生成不同的HTML
    let controlBodyHTML = '';
    
    switch(displayStyle) {
        case 'drag-drop':
            controlBodyHTML = `
                <div class="image-upload-dragdrop">
                    <div class="dragdrop-area">
                        <div class="dragdrop-icon">📁</div>
                        <div class="dragdrop-text">
                            <div>${buttonText}</div>
                            <div class="dragdrop-hint">或将图片拖拽到此处</div>
                        </div>
                        <input type="file" ${acceptAttr} ${multipleAttr} class="dragdrop-input">
                    </div>
                </div>`;
            break;
            
        case 'image-preview':
            controlBodyHTML = `
                <div class="image-upload-preview">
                    <div class="preview-placeholder">
                        <div class="placeholder-icon">+</div>
                        <div class="placeholder-text">${buttonText}</div>
                    </div>
                    <input type="file" ${acceptAttr} ${multipleAttr} class="preview-input">
                </div>`;
            break;
            
        case 'avatar':
            controlBodyHTML = `
                <div class="image-upload-avatar">
                    <div class="avatar-container">
                        <div class="avatar-placeholder">
                            <div class="avatar-icon">👤</div>
                        </div>
                        <input type="file" ${acceptAttr} class="avatar-input">
                    </div>
                    <div class="avatar-hint">点击上传头像</div>
                </div>`;
            break;
            
        default: // default 样式
            controlBodyHTML = `
                <div class="image-upload-default">
                    <label class="image-upload-btn">
                        ${buttonText}
                        <input type="file" ${acceptAttr} ${multipleAttr}>
                    </label>
                </div>`;
            break;
    }
    
    return `
        <div class="control-header">
            <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
        </div>
        <div class="control-body">
            ${controlBodyHTML}
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}

function generateDividerControlHTML(control) {
    // 获取样式属性，使用默认值以防属性未定义
    const style = control.dividerStyle || 'solid';
    const color = control.dividerColor || '#d9d9d9';
    const thickness = control.dividerThickness || 1;
    const align = control.dividerAlign || 'center';
    
    // 创建内联样式字符串
    const lineStyle = `border-top: ${thickness}px ${style} ${color};`;
    
    // 根据对齐方式添加对应的CSS类
    const alignClass = align !== 'center' ? ` align-${align}` : '';
    
    return `
        <div class="divider${alignClass}">
            <div class="divider-line" style="${lineStyle}"></div>
            <div class="divider-text">${control.label || '分割线'}</div>
            <div class="divider-line" style="${lineStyle}"></div>
        </div>
    `;
}

function generateDefaultControlHTML(control) {
    return `
        <div class="control-header">
            <label>${control.label}${control.required ? '<span class="required">*</span>' : ''}</label>
        </div>
        <div class="control-body">
            <div class="placeholder-control">${control.name}控件</div>
        </div>
        ${control.helpText ? `<div class="control-help">${control.helpText}</div>` : ''}
    `;
}