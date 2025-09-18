// 表单设计器交互逻辑

// DOM元素引用
let controlsPanel, designCanvas, propertiesPanel;
let dragPreview, currentDraggedControl, selectedControl;
let formControls = []; // 存储表单控件数据

// 初始化函数
function initFormDesigner() {
    // 获取DOM元素
    controlsPanel = document.querySelector('.controls-panel');
    designCanvas = document.querySelector('#formDesignCanvas');
    propertiesPanel = document.querySelector('.properties-panel');
    
    // 创建拖拽预览元素
    createDragPreview();
    
    // 初始化拖拽功能
    initDragAndDrop();
    
    // 初始化按钮事件
    initButtons();
    
    // 初始化控件属性事件
    initControlPropertyEvents();
    
    // 初始化拖拽排序
    initDragSorting();
    
    // 初始化父页面消息监听
    initParentMessageListener();
}

// 创建拖拽预览元素
function createDragPreview() {
    dragPreview = document.createElement('div');
    dragPreview.className = 'drag-preview';
    dragPreview.style.display = 'none';
    document.body.appendChild(dragPreview);
}

// 初始化拖拽功能
function initDragAndDrop() {
    // 获取所有可拖拽的控件项
    const controlItems = document.querySelectorAll('.control-item');
    
    controlItems.forEach(item => {
        // 设置拖拽开始事件
        item.addEventListener('dragstart', (e) => {
            currentDraggedControl = e.target;
            e.dataTransfer.effectAllowed = 'copy';
            
            // 设置拖拽预览
            setTimeout(() => {
                dragPreview.textContent = e.target.querySelector('.control-text').textContent;
                dragPreview.style.display = 'flex';
            }, 0);
        });
        
        // 设置拖拽结束事件
        item.addEventListener('dragend', () => {
            dragPreview.style.display = 'none';
            currentDraggedControl = null;
        });
    });
    
    // 设置设计画布的拖拽事件
    designCanvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        designCanvas.classList.add('drag-over');
        
        // 更新拖拽预览位置
        updateDragPreviewPosition(e.clientX, e.clientY);
    });
    
    designCanvas.addEventListener('dragleave', () => {
        designCanvas.classList.remove('drag-over');
    });
    
    designCanvas.addEventListener('drop', (e) => {
        e.preventDefault();
        designCanvas.classList.remove('drag-over');
        
        if (currentDraggedControl) {
            const controlType = currentDraggedControl.dataset.type;
            addControlToCanvas(controlType);
        }
    });
    
    // 监听鼠标移动以更新拖拽预览位置
    document.addEventListener('mousemove', (e) => {
        if (dragPreview.style.display !== 'none') {
            updateDragPreviewPosition(e.clientX, e.clientY);
        }
    });
}

// 更新拖拽预览位置
function updateDragPreviewPosition(x, y) {
    dragPreview.style.left = (x + 10) + 'px';
    dragPreview.style.top = (y - 20) + 'px';
}

// 添加控件到设计画布
function addControlToCanvas(type) {
    // 生成唯一ID
    const id = generateUniqueId();
    
    // 创建控件数据对象
    const controlData = {
        id: id,
        type: type,
        label: getDefaultLabelForType(type),
        fieldName: `field_${id}`,
        placeholder: getDefaultPlaceholderForType(type),
        required: false,
        description: '',
        options: getDefaultOptionsForType(type),
        defaultValue: '',
        validation: getDefaultValidationForType(type),
        style: getDefaultStyleForType(type)
    };
    
    // 添加到控件数组
    formControls.push(controlData);
    
    // 渲染控件
    renderControl(controlData);
    
    // 更新父页面数据
    updateParentData();
    
    // 验证步骤完成状态
    validateStep();
}

// 带动画效果添加控件
function addControlWithAnimation(type) {
    addControlToCanvas(type);
    
    // 找到最后添加的控件并添加动画
    const newControl = document.querySelector(`[data-id="${formControls[formControls.length - 1].id}"]`);
    if (newControl) {
        newControl.classList.add('slide-in');
        setTimeout(() => {
            newControl.classList.remove('slide-in');
        }, 300);
    }
}

// 带动画效果删除控件
function removeControlWithAnimation(controlId) {
    const controlElement = document.querySelector(`[data-id="${controlId}"]`);
    if (controlElement) {
        controlElement.classList.add('scale-down');
        
        setTimeout(() => {
            // 从DOM中移除
            controlElement.remove();
            
            // 从数据中移除
            formControls = formControls.filter(control => control.id !== controlId);
            
            // 如果删除的是选中的控件，清除选中状态
            if (selectedControl && selectedControl.id === controlId) {
                selectedControl = null;
                clearPropertyPanel();
            }
            
            // 更新父页面数据
            updateParentData();
            
            // 验证步骤完成状态
            validateStep();
        }, 200);
    }
}

// 获取类型的默认标签
function getDefaultLabelForType(type) {
    const labels = {
        text: '单行文本',
        textarea: '多行文本',
        number: '数字输入',
        date: '日期选择',
        time: '时间选择',
        radio: '单选框组',
        checkbox: '复选框组',
        select: '下拉选择',
        switch: '开关',
        divider: '分割线'
    };
    return labels[type] || '表单控件';
}

// 获取类型的默认占位符
function getDefaultPlaceholderForType(type) {
    const placeholders = {
        text: '请输入',
        textarea: '请输入详细内容',
        number: '请输入数字',
        date: '',
        time: '',
        radio: '',
        checkbox: '',
        select: '请选择',
        switch: '',
        divider: ''
    };
    return placeholders[type] || '';
}

// 获取类型的默认选项
function getDefaultOptionsForType(type) {
    if (type === 'radio' || type === 'checkbox' || type === 'select') {
        return [
            { label: '选项1', value: 'option1', checked: false },
            { label: '选项2', value: 'option2', checked: false },
            { label: '选项3', value: 'option3', checked: false }
        ];
    }
    return [];
}

// 获取类型的默认验证规则
function getDefaultValidationForType(type) {
    const validation = {
        required: false,
        minLength: 0,
        maxLength: 1000,
        pattern: '',
        message: ''
    };
    
    if (type === 'number') {
        validation.min = null;
        validation.max = null;
        validation.step = 1;
    }
    
    return validation;
}

// 获取类型的默认样式
function getDefaultStyleForType(type) {
    return {
        width: '100%',
        height: 'auto',
        fontSize: '14px',
        color: '#333'
    };
}

// 渲染控件
function renderControl(controlData) {
    // 检查是否已存在该控件
    let controlElement = document.querySelector(`[data-id="${controlData.id}"]`);
    
    // 如果不存在，创建新元素
    if (!controlElement) {
        controlElement = document.createElement('div');
        controlElement.className = 'form-control-item fade-in';
        controlElement.dataset.id = controlData.id;
        controlElement.dataset.type = controlData.type;
        
        // 添加点击事件以选中控件
        controlElement.addEventListener('click', (e) => {
            e.stopPropagation();
            selectControl(controlData.id);
        });
        
        // 添加拖拽句柄
        if (controlData.type !== 'divider') {
            const handle = document.createElement('div');
            handle.className = 'control-handle';
            handle.innerHTML = '⋮⋮';
            handle.setAttribute('draggable', 'true');
            handle.dataset.controlId = controlData.id;
            controlElement.appendChild(handle);
        }
    }
    
    // 根据控件类型生成HTML内容
    let controlHTML = '';
    
    switch (controlData.type) {
        case 'text':
            controlHTML = generateTextControlHTML(controlData);
            break;
        case 'textarea':
            controlHTML = generateTextareaControlHTML(controlData);
            break;
        case 'number':
            controlHTML = generateNumberControlHTML(controlData);
            break;
        case 'date':
            controlHTML = generateDateControlHTML(controlData);
            break;
        case 'time':
            controlHTML = generateTimeControlHTML(controlData);
            break;
        case 'radio':
            controlHTML = generateRadioControlHTML(controlData);
            break;
        case 'checkbox':
            controlHTML = generateCheckboxControlHTML(controlData);
            break;
        case 'select':
            controlHTML = generateSelectControlHTML(controlData);
            break;
        case 'switch':
            controlHTML = generateSwitchControlHTML(controlData);
            break;
        case 'divider':
            controlHTML = generateDividerControlHTML(controlData);
            break;
    }
    
    // 设置控件内容
    // 保留拖拽句柄
    const existingHandle = controlElement.querySelector('.control-handle');
    controlElement.innerHTML = controlHTML;
    
    if (existingHandle && controlData.type !== 'divider') {
        controlElement.insertBefore(existingHandle, controlElement.firstChild);
    }
    
    // 将控件添加到设计画布
    designCanvas.appendChild(controlElement);
    
    // 检查是否有拖拽提示，如果有则移除
    const dragHint = designCanvas.querySelector('.drag-hint');
    if (dragHint && formControls.length > 0) {
        dragHint.remove();
    }
}

// 生成文本控件HTML
function generateTextControlHTML(controlData) {
    return `
        <label class="control-label">
            ${controlData.label}${controlData.required ? '<span class="control-required">*</span>' : ''}
        </label>
        <input 
            type="text" 
            class="property-input"
            placeholder="${controlData.placeholder || ''}"
            value="${controlData.defaultValue || ''}"
            disabled
        >
        ${controlData.description ? `<p class="control-description">${controlData.description}</p>` : ''}
    `;
}

// 生成多行文本控件HTML
function generateTextareaControlHTML(controlData) {
    return `
        <label class="control-label">
            ${controlData.label}${controlData.required ? '<span class="control-required">*</span>' : ''}
        </label>
        <textarea 
            class="property-input"
            placeholder="${controlData.placeholder || ''}"
            rows="4"
            disabled
        >${controlData.defaultValue || ''}</textarea>
        ${controlData.description ? `<p class="control-description">${controlData.description}</p>` : ''}
    `;
}

// 生成数字控件HTML
function generateNumberControlHTML(controlData) {
    const validation = controlData.validation || {};
    return `
        <label class="control-label">
            ${controlData.label}${controlData.required ? '<span class="control-required">*</span>' : ''}
        </label>
        <input 
            type="number" 
            class="property-input"
            placeholder="${controlData.placeholder || ''}"
            value="${controlData.defaultValue || ''}"
            ${validation.min !== null ? `min="${validation.min}"` : ''}
            ${validation.max !== null ? `max="${validation.max}"` : ''}
            ${validation.step ? `step="${validation.step}"` : ''}
            disabled
        >
        ${controlData.description ? `<p class="control-description">${controlData.description}</p>` : ''}
    `;
}

// 生成日期控件HTML
function generateDateControlHTML(controlData) {
    return `
        <label class="control-label">
            ${controlData.label}${controlData.required ? '<span class="control-required">*</span>' : ''}
        </label>
        <input 
            type="date" 
            class="property-input"
            value="${controlData.defaultValue || ''}"
            disabled
        >
        ${controlData.description ? `<p class="control-description">${controlData.description}</p>` : ''}
    `;
}

// 生成时间控件HTML
function generateTimeControlHTML(controlData) {
    return `
        <label class="control-label">
            ${controlData.label}${controlData.required ? '<span class="control-required">*</span>' : ''}
        </label>
        <input 
            type="time" 
            class="property-input"
            value="${controlData.defaultValue || ''}"
            disabled
        >
        ${controlData.description ? `<p class="control-description">${controlData.description}</p>` : ''}
    `;
}

// 生成单选框控件HTML
function generateRadioControlHTML(controlData) {
    let optionsHTML = '';
    (controlData.options || []).forEach(option => {
        optionsHTML += `
            <div class="property-radio">
                <input 
                    type="radio" 
                    id="${controlData.id}_${option.value}" 
                    name="${controlData.fieldName}"
                    value="${option.value}"
                    ${option.checked ? 'checked' : ''}
                    disabled
                >
                <label for="${controlData.id}_${option.value}">${option.label}</label>
            </div>
        `;
    });
    
    return `
        <label class="control-label">
            ${controlData.label}${controlData.required ? '<span class="control-required">*</span>' : ''}
        </label>
        ${optionsHTML}
        ${controlData.description ? `<p class="control-description">${controlData.description}</p>` : ''}
    `;
}

// 生成复选框控件HTML
function generateCheckboxControlHTML(controlData) {
    let optionsHTML = '';
    (controlData.options || []).forEach(option => {
        optionsHTML += `
            <div class="property-checkbox">
                <input 
                    type="checkbox" 
                    id="${controlData.id}_${option.value}" 
                    name="${controlData.fieldName}"
                    value="${option.value}"
                    ${option.checked ? 'checked' : ''}
                    disabled
                >
                <label for="${controlData.id}_${option.value}">${option.label}</label>
            </div>
        `;
    });
    
    return `
        <label class="control-label">
            ${controlData.label}${controlData.required ? '<span class="control-required">*</span>' : ''}
        </label>
        ${optionsHTML}
        ${controlData.description ? `<p class="control-description">${controlData.description}</p>` : ''}
    `;
}

// 生成下拉选择控件HTML
function generateSelectControlHTML(controlData) {
    let optionsHTML = '';
    (controlData.options || []).forEach(option => {
        optionsHTML += `
            <option value="${option.value}" ${option.checked ? 'selected' : ''}>
                ${option.label}
            </option>
        `;
    });
    
    return `
        <label class="control-label">
            ${controlData.label}${controlData.required ? '<span class="control-required">*</span>' : ''}
        </label>
        <select class="property-input" disabled>
            ${optionsHTML}
        </select>
        ${controlData.description ? `<p class="control-description">${controlData.description}</p>` : ''}
    `;
}

// 生成开关控件HTML
function generateSwitchControlHTML(controlData) {
    return `
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <label class="control-label" style="margin-bottom: 0;">
                ${controlData.label}${controlData.required ? '<span class="control-required">*</span>' : ''}
            </label>
            <label class="switch">
                <input type="checkbox" ${controlData.defaultValue === 'true' ? 'checked' : ''} disabled>
                <span class="slider"></span>
            </label>
        </div>
        ${controlData.description ? `<p class="control-description">${controlData.description}</p>` : ''}
    `;
}

// 生成分割线控件HTML
function generateDividerControlHTML(controlData) {
    return `
        <div class="divider">
            ${controlData.label ? `<span class="divider-text">${controlData.label}</span>` : ''}
        </div>
    `;
}

// 选中控件
function selectControl(controlId) {
    // 清除之前的选中状态
    clearSelection();
    
    // 找到控件数据
    selectedControl = formControls.find(control => control.id === controlId);
    if (!selectedControl) return;
    
    // 高亮选中的控件
    const controlElement = document.querySelector(`[data-id="${controlId}"]`);
    if (controlElement) {
        controlElement.classList.add('selected');
        
        // 添加动画效果
        controlElement.classList.add('fade-in');
        setTimeout(() => {
            controlElement.classList.remove('fade-in');
        }, 300);
    }
    
    // 填充属性面板
    populatePropertyPanel(selectedControl);
}

// 清除选中状态
function clearSelection() {
    // 移除所有控件的选中样式
    const selectedElements = document.querySelectorAll('.form-control-item.selected');
    selectedElements.forEach(element => {
        element.classList.remove('selected');
    });
    
    // 清除选中的控件
    selectedControl = null;
    
    // 清除属性面板
    clearPropertyPanel();
}

// 填充属性面板
function populatePropertyPanel(controlData) {
    // 确保属性面板元素存在
    if (!propertiesPanel) return;
    
    // 填充基础属性
    document.getElementById('control-label').value = controlData.label || '';
    document.getElementById('control-field-name').value = controlData.fieldName || '';
    document.getElementById('control-placeholder').value = controlData.placeholder || '';
    document.getElementById('control-required').checked = controlData.required || false;
    document.getElementById('control-description').value = controlData.description || '';
    
    // 根据控件类型显示/隐藏特定属性
    const typeSpecificProps = document.querySelectorAll('.type-specific-prop');
    typeSpecificProps.forEach(prop => prop.style.display = 'none');
    
    // 显示当前控件类型的特定属性
    switch (controlData.type) {
        case 'text':
        case 'textarea':
            document.getElementById('text-props').style.display = 'block';
            document.getElementById('control-default-value-text').value = controlData.defaultValue || '';
            break;
        case 'number':
            document.getElementById('number-props').style.display = 'block';
            document.getElementById('control-default-value-number').value = controlData.defaultValue || '';
            break;
        case 'date':
            document.getElementById('date-props').style.display = 'block';
            document.getElementById('control-default-value-date').value = controlData.defaultValue || '';
            break;
        case 'time':
            document.getElementById('time-props').style.display = 'block';
            document.getElementById('control-default-value-time').value = controlData.defaultValue || '';
            break;
        case 'radio':
        case 'checkbox':
        case 'select':
            document.getElementById('options-props').style.display = 'block';
            break;
        case 'switch':
            document.getElementById('switch-props').style.display = 'block';
            break;
    }
}

// 清除属性面板
function clearPropertyPanel() {
    // 清空所有输入框
    document.querySelectorAll('.property-input').forEach(input => {
        if (input.type === 'checkbox' || input.type === 'radio') {
            input.checked = false;
        } else {
            input.value = '';
        }
    });
    
    // 隐藏所有类型特定属性
    const typeSpecificProps = document.querySelectorAll('.type-specific-prop');
    typeSpecificProps.forEach(prop => prop.style.display = 'none');
}

// 初始化按钮事件
function initButtons() {
    // 清空表单按钮
    document.getElementById('clear-form').addEventListener('click', () => {
        if (confirm('确定要清空当前表单设计吗？此操作不可撤销。')) {
            // 清空设计画布
            designCanvas.innerHTML = '<div class="drag-hint">从左侧拖拽控件到此处开始设计表单</div>';
            
            // 清空控件数据
            formControls = [];
            
            // 清除选中状态
            clearSelection();
            
            // 更新父页面数据
            updateParentData();
            
            // 验证步骤完成状态
            validateStep();
        }
    });
    
    // 保存设计按钮
    document.getElementById('save-design').addEventListener('click', () => {
        // 模拟保存操作
        alert('表单设计已保存！');
        
        // 更新父页面数据
        updateParentData();
        
        // 验证步骤完成状态
        validateStep();
    });
}

// 初始化控件属性事件
function initControlPropertyEvents() {
    // 基础属性变更事件
    document.getElementById('control-label').addEventListener('input', debounce(() => {
        if (selectedControl) {
            selectedControl.label = document.getElementById('control-label').value;
            updateParentData();
        }
    }, 300));
    
    document.getElementById('control-field-name').addEventListener('input', debounce(() => {
        if (selectedControl) {
            selectedControl.fieldName = document.getElementById('control-field-name').value;
            updateParentData();
        }
    }, 300));
    
    document.getElementById('control-placeholder').addEventListener('input', debounce(() => {
        if (selectedControl) {
            selectedControl.placeholder = document.getElementById('control-placeholder').value;
            updateControlProperties(selectedControl.id);
            updateParentData();
        }
    }, 300));
    
    document.getElementById('control-required').addEventListener('change', () => {
        if (selectedControl) {
            selectedControl.required = document.getElementById('control-required').checked;
            updateControlProperties(selectedControl.id);
            updateParentData();
        }
    });
    
    document.getElementById('control-description').addEventListener('input', debounce(() => {
        if (selectedControl) {
            selectedControl.description = document.getElementById('control-description').value;
            updateControlProperties(selectedControl.id);
            updateParentData();
        }
    }, 300));
    
    // 文本默认值变更事件
    document.getElementById('control-default-value-text').addEventListener('input', debounce(() => {
        if (selectedControl && (selectedControl.type === 'text' || selectedControl.type === 'textarea')) {
            selectedControl.defaultValue = document.getElementById('control-default-value-text').value;
            updateControlProperties(selectedControl.id);
            updateParentData();
        }
    }, 300));
    
    // 数字默认值变更事件
    document.getElementById('control-default-value-number').addEventListener('input', debounce(() => {
        if (selectedControl && selectedControl.type === 'number') {
            selectedControl.defaultValue = document.getElementById('control-default-value-number').value;
            updateControlProperties(selectedControl.id);
            updateParentData();
        }
    }, 300));
    
    // 日期默认值变更事件
    document.getElementById('control-default-value-date').addEventListener('change', () => {
        if (selectedControl && selectedControl.type === 'date') {
            selectedControl.defaultValue = document.getElementById('control-default-value-date').value;
            updateControlProperties(selectedControl.id);
            updateParentData();
        }
    });
    
    // 时间默认值变更事件
    document.getElementById('control-default-value-time').addEventListener('change', () => {
        if (selectedControl && selectedControl.type === 'time') {
            selectedControl.defaultValue = document.getElementById('control-default-value-time').value;
            updateControlProperties(selectedControl.id);
            updateParentData();
        }
    });
    
    // 开关默认值变更事件
    document.getElementById('control-default-value-switch').addEventListener('change', () => {
        if (selectedControl && selectedControl.type === 'switch') {
            selectedControl.defaultValue = document.getElementById('control-default-value-switch').checked ? 'true' : 'false';
            updateControlProperties(selectedControl.id);
            updateParentData();
        }
    });
    
    // 监听选项变更事件
    document.addEventListener('input', (e) => {
        if (e.target.classList.contains('option-label') || e.target.classList.contains('option-value')) {
            const optionItem = e.target.closest('.option-item');
            const index = parseInt(optionItem.dataset.index);
            
            if (selectedControl && selectedControl.options && index < selectedControl.options.length) {
                if (e.target.classList.contains('option-label')) {
                    selectedControl.options[index].label = e.target.value;
                } else if (e.target.classList.contains('option-value')) {
                    selectedControl.options[index].value = e.target.value;
                }
                
                updateControlProperties(selectedControl.id);
                updateParentData();
            }
        }
    });
    
    // 监听选项默认值变更事件
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('option-default')) {
            const optionItem = e.target.closest('.option-item');
            const index = parseInt(optionItem.dataset.index);
            
            if (selectedControl && selectedControl.options && index < selectedControl.options.length) {
                // 如果是单选框或下拉选择，取消其他选项的默认状态
                if (selectedControl.type === 'radio' || selectedControl.type === 'select') {
                    selectedControl.options.forEach(option => {
                        option.checked = false;
                    });
                }
                
                // 设置当前选项的默认状态
                selectedControl.options[index].checked = e.target.checked;
                
                updateControlProperties(selectedControl.id);
                updateParentData();
            }
        }
    });
}

// 更新控件属性
function updateControlProperties(controlId) {
    const controlData = formControls.find(control => control.id === controlId);
    if (controlData) {
        renderControl(controlData);
    }
}

// 初始化拖拽排序
function initDragSorting() {
    // 监听拖拽开始事件
    designCanvas.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('control-handle')) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', e.target.dataset.controlId);
            e.target.style.opacity = '0.5';
        }
    });
    
    // 监听拖拽结束事件
    designCanvas.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('control-handle')) {
            e.target.style.opacity = '1';
            
            // 重新渲染所有控件以更新顺序
            renderAllControls();
            
            // 更新父页面数据
            updateParentData();
        }
    });
    
    // 监听拖拽经过事件
    designCanvas.addEventListener('dragover', (e) => {
        if (e.dataTransfer.types.includes('text/plain')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
        }
    });
    
    // 监听放置事件
    designCanvas.addEventListener('drop', (e) => {
        e.preventDefault();
        
        if (e.dataTransfer.types.includes('text/plain')) {
            const draggedControlId = e.dataTransfer.getData('text/plain');
            const draggedControlData = formControls.find(control => control.id === draggedControlId);
            
            if (draggedControlData) {
                // 找到目标位置的控件
                const targetElement = getElementAtPosition(e.clientX, e.clientY);
                
                if (targetElement && targetElement.classList.contains('form-control-item')) {
                    const targetControlId = targetElement.dataset.id;
                    const targetIndex = formControls.findIndex(control => control.id === targetControlId);
                    const draggedIndex = formControls.findIndex(control => control.id === draggedControlId);
                    
                    // 调整控件顺序
                    if (targetIndex !== -1 && draggedIndex !== -1 && targetIndex !== draggedIndex) {
                        // 从原位置移除
                        formControls.splice(draggedIndex, 1);
                        
                        // 插入到新位置
                        if (draggedIndex < targetIndex) {
                            formControls.splice(targetIndex, 0, draggedControlData);
                        } else {
                            formControls.splice(targetIndex + 1, 0, draggedControlData);
                        }
                    }
                }
            }
        }
    });
}

// 获取指定位置的元素
function getElementAtPosition(x, y) {
    // 创建一个临时元素用于测试
    const testElement = document.createElement('div');
    testElement.style.position = 'fixed';
    testElement.style.width = '1px';
    testElement.style.height = '1px';
    testElement.style.left = x + 'px';
    testElement.style.top = y + 'px';
    document.body.appendChild(testElement);
    
    // 获取相交的元素
    const elements = document.elementsFromPoint(x, y);
    
    // 移除临时元素
    document.body.removeChild(testElement);
    
    // 查找表单控件项
    return elements.find(el => el.classList.contains('form-control-item'));
}

// 渲染所有控件
function renderAllControls() {
    // 保存当前选中的控件ID
    const selectedId = selectedControl ? selectedControl.id : null;
    
    // 清除设计画布内容
    const dragHint = designCanvas.querySelector('.drag-hint');
    designCanvas.innerHTML = dragHint ? dragHint.outerHTML : '';
    
    // 重新渲染所有控件
    formControls.forEach(controlData => {
        renderControl(controlData);
    });
    
    // 如果之前有选中的控件，重新选中
    if (selectedId) {
        selectControl(selectedId);
    }
}

// 增强控件选中交互
function enhanceControlSelection() {
    // 点击设计画布空白处清除选中状态
    designCanvas.addEventListener('click', () => {
        clearSelection();
    });
    
    // 阻止控件内部点击事件冒泡
    designCanvas.addEventListener('click', (e) => {
        if (e.target.closest('.form-control-item')) {
            e.stopPropagation();
        }
    });
}

// 增强按钮交互效果
function enhanceButtonInteractions() {
    // 为所有按钮添加悬停效果
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('mouseenter', () => {
            button.style.transform = 'translateY(-1px)';
            button.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
        });
        
        button.addEventListener('mouseleave', () => {
            button.style.transform = 'translateY(0)';
            button.style.boxShadow = 'none';
        });
        
        button.addEventListener('mousedown', () => {
            button.style.transform = 'translateY(0)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = 'translateY(-1px)';
        });
    });
}

// 初始化父页面消息监听
function initParentMessageListener() {
    // 监听来自父页面的消息
    window.addEventListener('message', (event) => {
        try {
            const data = event.data;
            
            // 处理不同类型的消息
            switch (data.type) {
                case 'initFormData':
                    // 初始化表单数据
                    if (data.formData && Array.isArray(data.formData)) {
                        formControls = data.formData;
                        renderAllControls();
                        validateStep();
                    }
                    break;
                case 'validateStep':
                    // 验证步骤完成状态
                    validateStep();
                    break;
            }
        } catch (error) {
            console.error('处理父页面消息时出错:', error);
        }
    });
}

// 更新父页面数据
function updateParentData() {
    // 向父页面发送消息
    if (window.parent) {
        window.parent.postMessage({
            type: 'updateFormData',
            formData: formControls
        }, '*');
    }
}

// 验证步骤完成状态
function validateStep() {
    // 检查是否有至少一个控件
    const isCompleted = formControls.length > 0;
    
    // 向父页面发送验证结果
    if (window.parent) {
        window.parent.postMessage({
            type: 'stepValidationResult',
            step: 3,
            completed: isCompleted,
            data: formControls
        }, '*');
    }
}

// 生成唯一ID
function generateUniqueId() {
    return 'control_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
}

// 防抖函数
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

// 节流函数
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

// 当DOM加载完成后初始化表单设计器
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormDesigner);
} else {
    initFormDesigner();
}