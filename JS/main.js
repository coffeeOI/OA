/**
 * 主页面专用JavaScript - 包含菜单交互、模态框操作等功能
 */

// 添加调试信息，检查sidebar变量是否已经存在
console.log('=== 开始加载main.js ===');
console.log('加载前window.sidebar:', typeof window.sidebar);
console.log('加载前window.menuToggle:', typeof window.menuToggle);
console.log('加载前window.modal:', typeof window.modal);
console.log('加载前window.contentFrame:', typeof window.contentFrame);


// DOM元素缓存
let sidebar, menuToggle, modal, contentFrame;

/**
 * 获取iframe元素
 * @returns {HTMLIFrameElement} iframe元素
 */
function getContentFrame() {
    if (!contentFrame) {
        contentFrame = document.getElementById('contentFrame');
    }
    return contentFrame;
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    // 初始化DOM元素
    initDomElements();
    
    // 初始化事件监听
    initEventListeners();
    
    // 初始化菜单状态 (只在主页面执行)
    if (sidebar) {
        initMenuState();
    }
    
    // 初始化页面数据
    initPageData();
});

/**
 * 初始化DOM元素
 */
function initDomElements() {
    // 不需要重新声明变量，直接赋值
    sidebar = document.getElementById('sidebar');
    menuToggle = document.getElementById('menuToggle');
    modal = document.getElementById('myModal');
    contentFrame = document.getElementById('contentFrame');
}

/**
 * 初始化事件监听
 */
function initEventListeners() {
    // 菜单切换按钮事件 - 只在主页面执行
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    // 模态框事件 - 只在有模态框的页面执行
    const modalCloseBtn = document.querySelector('.modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', closeModal);
    }
    
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeModal();
            }
        });
    }
    
    // 菜单项点击事件 - 只在主页面执行
    if (sidebar) {
        // 只给子菜单项添加事件监听，主菜单项使用内联onclick事件
        const subMenuItems = document.querySelectorAll('.sub-menu-item');
        console.log('\n=== 初始化子菜单点击事件 ===');
        console.log('找到的子菜单项数量:', subMenuItems.length);
        
        subMenuItems.forEach((item, index) => {
            console.log(`子菜单项 ${index + 1}:`, item.textContent.trim(), '类名:', item.className);
            item.addEventListener('click', handleMenuItemClick);
        });
        
        console.log('=== 子菜单点击事件初始化完成 ===\n');
    }
    
    // 窗口大小改变事件 - 所有页面通用
    window.addEventListener('resize', debounce(handleWindowResize, 300));
    
    // 页面滚动事件 - 所有页面通用
    window.addEventListener('scroll', throttle(handlePageScroll, 100));
    
    // 初始化表单提交事件 - 所有页面通用
    initFormSubmits();
    
    // 初始化表格操作按钮事件 - 所有页面通用
    initTableActions();
}

/**
 * 初始化菜单状态
 */
function initMenuState() {
    // 从本地存储获取菜单状态（如果有）
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    if (sidebarCollapsed) {
        sidebar.classList.add('collapsed');
    }
    
    // 检查窗口宽度，小于768px时自动隐藏菜单
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('show');
    } else {
        sidebar.classList.add('show');
    }
}

/**
 * 初始化页面数据
 */
function initPageData() {
    // 这里可以添加初始化页面数据的逻辑
    // 例如：加载待办任务、统计数据等
    console.log('主页面数据初始化完成');
}

/**
 * 切换侧边栏显示/隐藏
 */
function toggleSidebar() {
    sidebar.classList.toggle('show');
}

/**
 * 切换侧边栏展开/折叠
 */
function toggleSidebarCollapse() {
    sidebar.classList.toggle('collapsed');
    // 保存菜单状态到本地存储
    localStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
}

/**
 * 切换子菜单显示
 * @param {HTMLElement} element - 点击的菜单项
 */
function toggleSubMenu(element) {
    console.log('=== toggleSubMenu 函数开始执行 ===');
    
    // 确保element是DOM元素
    if (!element || !(element instanceof HTMLElement)) {
        console.error('toggleSubMenu: element is not a valid DOM element');
        console.log('接收到的element值:', element);
        return;
    }
    
    console.log('接收到的element是有效的DOM元素:', element);
    console.log('元素内容:', element.textContent.trim());
    console.log('元素类名:', element.className);
    
    const subMenu = element.nextElementSibling;
    console.log('子菜单元素:', subMenu);
    
    if (subMenu && subMenu.classList.contains('sub-menu')) {
        console.log('找到子菜单，开始处理显示逻辑');
        
        // 先隐藏所有其他子菜单
        document.querySelectorAll('.sub-menu').forEach(menu => {
            if (menu !== subMenu) {
                menu.classList.remove('show');
            }
        });
        
        // 切换当前子菜单显示状态
        const wasVisible = subMenu.classList.contains('show');
        subMenu.classList.toggle('show');
        const isVisible = subMenu.classList.contains('show');
        
        console.log('子菜单显示状态已切换:', wasVisible ? '从显示变为隐藏' : '从隐藏变为显示');
        console.log('当前子菜单类名:', subMenu.className);
        
        // 如果是在移动设备上，点击主菜单项后自动滚动到子菜单
        if (window.innerWidth <= 768) {
            console.log('移动设备检测，将在100ms后滚动到子菜单');
            setTimeout(() => {
                subMenu.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    } else {
        console.error('toggleSubMenu: 没有找到匹配的子菜单或子菜单元素不是sub-menu类');
        if (subMenu) {
            console.log('下一个元素存在但不是sub-menu类:', subMenu.className);
        }
    }
    
    console.log('=== toggleSubMenu 函数执行结束 ===\n');
}

/**
 * 打开模态框
 */
function openModal() {
    if (modal) {
        modal.style.display = 'flex';
        // 防止背景滚动
        document.body.style.overflow = 'hidden';
    }
}

/**
 * 关闭模态框
 */
function closeModal() {
    if (modal) {
        modal.style.display = 'none';
        // 恢复背景滚动
        document.body.style.overflow = '';
    }
}

/**
 * 处理菜单项点击
 * @param {Event} event - 点击事件
 */
function handleMenuItemClick(event) {
    console.log('\n=== handleMenuItemClick 函数开始执行 ===');
    console.log('事件对象:', event);
    console.log('事件类型:', event.type);
    
    // 防止事件冒泡和默认行为
    event.preventDefault();
    event.stopPropagation();
    console.log('已阻止默认行为和事件冒泡');
    
    const target = event.currentTarget;
    console.log('当前点击目标:', target);
    console.log('目标元素内容:', target.textContent.trim());
    console.log('目标元素类名:', target.className);
    
    // 如果点击的是带有子菜单的主菜单项，切换子菜单显示
    if (target.classList.contains('menu-item') && target.nextElementSibling && target.nextElementSibling.classList.contains('sub-menu')) {
        console.log('点击的是带有子菜单的主菜单项');
        console.log('下一个元素是否为子菜单:', target.nextElementSibling.classList.contains('sub-menu'));
        
        toggleSubMenu(target);
        
        // 设置当前主菜单项为active
        document.querySelectorAll('.menu-item').forEach(mainItem => {
            mainItem.classList.remove('active');
        });
        target.classList.add('active');
        console.log('已设置当前主菜单项为active');
        
        // 不执行页面跳转，只切换子菜单显示
        console.log('不执行页面跳转，只切换子菜单显示');
        console.log('=== handleMenuItemClick 函数执行结束 ===\n');
        return;
    }
    
    // 如果点击的是子菜单项，先移除所有子菜单项的active类
    if (target.classList.contains('sub-menu-item')) {
        console.log('点击的是子菜单项');
        
        document.querySelectorAll('.sub-menu-item').forEach(subItem => {
            subItem.classList.remove('active');
        });
        target.classList.add('active');
        console.log('已设置当前子菜单项为active');
        
        // 如果有父菜单项，也设置为active
        const parentMenuItem = target.closest('.sub-menu').previousElementSibling;
        if (parentMenuItem && parentMenuItem.classList.contains('menu-item')) {
            document.querySelectorAll('.menu-item').forEach(mainItem => {
                mainItem.classList.remove('active');
            });
            parentMenuItem.classList.add('active');
            console.log('已设置父菜单项为active');
        }
    }
    // 如果点击的是没有子菜单的主菜单项，先移除所有主菜单项的active类
    else if (target.classList.contains('menu-item') && !target.nextElementSibling) {
        console.log('点击的是没有子菜单的主菜单项');
        
        document.querySelectorAll('.menu-item').forEach(mainItem => {
            mainItem.classList.remove('active');
        });
        document.querySelectorAll('.sub-menu-item').forEach(subItem => {
            subItem.classList.remove('active');
        });
        target.classList.add('active');
        console.log('已设置当前主菜单项为active');
    }
    
    // 移动设备上点击菜单项后关闭菜单 - 只在主页面执行
    if (window.innerWidth <= 768 && sidebar) {
        console.log('移动设备检测，将在300ms后关闭菜单');
        setTimeout(() => {
            sidebar.classList.remove('show');
        }, 300);
    }
    
    // 处理菜单项的具体功能
    console.log('准备处理菜单项的具体功能');
    handleMenuFunction(target);
    
    console.log('=== handleMenuItemClick 函数执行结束 ===\n');
}

/**
 * 处理菜单项的具体功能
 * @param {HTMLElement} menuItem - 菜单项元素
 */
function handleMenuFunction(menuItem) {
    const menuText = menuItem.textContent.trim();
    const contentArea = document.querySelector('.content');
    
    // 根据菜单项文本执行不同的操作
    switch (menuText) {
        case '工作台':
            loadDashboardPage();
            break;
        case '自定义表单':
        case '表单设计':
        case '表单字段':
        case '表单校验':
        case '表单控件管理':
        case '表单管理':
        case '表单数据':
            loadFormManagementPage(menuText);
            break;
        case '审批管理':
        case '审批流程配置':
        case '发起审批':
        case '待我审批':
        case '我发起的':
        case '审批统计':
            loadApprovalManagementPage(menuText);
            break;
        case '文档管理':
        case '文档库':
        case '我的文档':
        case '共享文档':
        case '文档分类':
        case '回收站':
            loadDocumentManagementPage(menuText);
            break;
        case '会议管理':
        case '会议室预订':
        case '我的会议':
        case '会议纪要':
        case '会议统计':
        case '发起会议':
            loadMeetingManagementPage(menuText);
            break;
        case '公告管理':
        case '公告列表':
        case '发布公告':
        case '公告统计':
        case '公告设置':
            loadAnnouncementManagementPage(menuText);
            break;
        case '资产管理':
        case '资产台账':
        case '资产变动':
        case '资产分类':
        case '资产统计':
            loadAssetManagementPage(menuText);
            break;
        case '系统管理':
        case '用户管理':
        case '角色管理':
        case '部门管理':
        case '权限管理':
        case '系统配置':
        case '操作日志':
            loadSystemManagementPage(menuText);
            break;
        default:
            console.log('点击了菜单项:', menuText);
            break;
    }
}

/**
 * 加载工作台页面
 */
function loadDashboardPage() {
    console.log('加载工作台页面');
    const frame = getContentFrame();
    if (frame) {
        frame.src = 'workbench.html';
    }
    showMessage('欢迎回到工作台', 'success');
}

/**
 * 加载表单管理页面
 * @param {string} subPage - 子页面名称
 */
function loadFormManagementPage(subPage) {
    console.log('加载表单管理页面 -', subPage);
    const frame = getContentFrame();
    if (frame) {
        // 根据子页面名称更新iframe的src
        switch(subPage) {
            case '表单设计':
                frame.src = 'HTML/form_design.html';
                break;
            case '表单字段':
                frame.src = 'HTML/form_fields.html';
                break;
            case '表单校验':
                frame.src = 'HTML/form_validation.html';
                break;
            case '表单控件管理':
                frame.src = 'HTML/form_controls.html';
                break;
            case '表单管理':
                frame.src = 'HTML/form_manage.html';
                break;
            case '表单数据':
                frame.src = 'HTML/form_data.html';
                break;
            default:
                frame.src = 'HTML/form_manage.html';
                break;
        }
    }
    showMessage('正在加载表单管理页面', 'info');
}

/**
 * 加载审批管理页面
 * @param {string} subPage - 子页面名称
 */
function loadApprovalManagementPage(subPage) {
    console.log('加载审批管理页面 -', subPage);
    const frame = getContentFrame();
    if (frame) {
        // 根据子页面名称更新iframe的src
        switch(subPage) {
            case '审批流程配置':
                frame.src = 'HTML/approval_config.html';
                break;
            case '发起审批':
                frame.src = 'HTML/approval_initiate.html';
                break;
            case '待我审批':
                frame.src = 'HTML/approval_pending.html';
                break;
            case '我发起的':
                frame.src = 'HTML/approval_myinitiated.html';
                break;
            case '审批统计':
                frame.src = 'HTML/approval_statistics.html';
                break;
            default:
                frame.src = 'HTML/approval_pending.html';
                break;
        }
    }
    showMessage('正在加载审批管理页面', 'info');
}

/**
 * 加载文档管理页面
 * @param {string} subPage - 子页面名称
 */
function loadDocumentManagementPage(subPage) {
    console.log('加载文档管理页面 -', subPage);
    const frame = getContentFrame();
    if (frame) {
        // 根据子页面名称更新iframe的src
        switch(subPage) {
            case '文档库':
                frame.src = 'HTML/document_library.html';
                break;
            case '我的文档':
                frame.src = 'HTML/document_my.html';
                break;
            case '共享文档':
                frame.src = 'HTML/document_share.html';
                break;
            case '文档分类':
                frame.src = 'HTML/document_category.html';
                break;
            case '回收站':
                frame.src = 'HTML/document_recycle.html';
                break;
            default:
                frame.src = 'HTML/document_library.html';
                break;
        }
    }
    showMessage('正在加载文档管理页面', 'info');
}

/**
 * 加载会议管理页面
 * @param {string} subPage - 子页面名称
 */
function loadMeetingManagementPage(subPage) {
    console.log('加载会议管理页面 -', subPage);
    const frame = getContentFrame();
    if (frame) {
        // 根据子页面名称更新iframe的src
        switch(subPage) {
            case '会议室预订':
                frame.src = 'HTML/meeting_room.html';
                break;
            case '我的会议':
                frame.src = 'HTML/meeting_my.html';
                break;
            case '会议纪要':
                frame.src = 'HTML/meeting_minutes.html';
                break;
            case '会议统计':
                frame.src = 'HTML/meeting_statistics.html';
                break;
            case '发起会议':
                frame.src = 'HTML/meeting_initiate.html';
                break;
            default:
                frame.src = 'HTML/meeting_room.html';
                break;
        }
    }
    showMessage('正在加载会议管理页面', 'info');
}

/**
 * 加载公告管理页面
 * @param {string} subPage - 子页面名称
 */
function loadAnnouncementManagementPage(subPage) {
    console.log('加载公告管理页面 -', subPage);
    const frame = getContentFrame();
    if (frame) {
        // 根据子页面名称更新iframe的src
        switch(subPage) {
            case '公告列表':
                frame.src = 'HTML/announcement_list.html';
                break;
            case '发布公告':
                frame.src = 'HTML/announcement_publish.html';
                break;
            case '公告统计':
                frame.src = 'HTML/announcement_statistics.html';
                break;
            case '公告设置':
                frame.src = 'HTML/announcement_settings.html';
                break;
            default:
                frame.src = 'HTML/announcement_list.html';
                break;
        }
    }
    showMessage('正在加载公告管理页面', 'info');
}

/**
 * 加载资产管理页面
 * @param {string} subPage - 子页面名称
 */
function loadAssetManagementPage(subPage) {
    console.log('加载资产管理页面 -', subPage);
    const frame = getContentFrame();
    if (frame) {
        // 资产管理页面暂时没有对应的HTML文件，这里使用一个通用的提示页面
        frame.src = 'workbench.html';
    }
    showMessage('资产管理功能正在开发中', 'info');
}

/**
 * 加载系统管理页面
 * @param {string} subPage - 子页面名称
 */
function loadSystemManagementPage(subPage) {
    console.log('加载系统管理页面 -', subPage);
    const frame = getContentFrame();
    if (frame) {
        // 系统管理页面暂时没有对应的HTML文件，这里使用一个通用的提示页面
        frame.src = 'workbench.html';
    }
    showMessage('系统管理功能正在开发中', 'info');
}

/**
 * 处理窗口大小改变
 */
function handleWindowResize() {
    // 窗口宽度大于768px时自动显示菜单 - 只在主页面执行
    if (sidebar) {
        if (window.innerWidth > 768) {
            sidebar.classList.add('show');
        } else {
            sidebar.classList.remove('show');
        }
    }
}

/**
 * 处理页面滚动
 */
function handlePageScroll() {
    // 这里可以添加页面滚动时的逻辑
    // 例如：固定导航栏、显示/隐藏回到顶部按钮等
}

/**
 * 初始化表单提交事件
 */
function initFormSubmits() {
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function(event) {
            event.preventDefault();
            
            // 表单验证
            if (validateForm(form)) {
                // 表单提交逻辑
                submitForm(form);
            }
        });
    });
}

/**
 * 验证表单
 * @param {HTMLFormElement} form - 表单元素
 * @returns {boolean} 是否验证通过
 */
function validateForm(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
    
    inputs.forEach(input => {
        const value = input.value.trim();
        const fieldName = input.getAttribute('data-field-name') || input.name || input.id;
        
        if (!value) {
            isValid = false;
            showMessage(`${fieldName}不能为空`, 'error');
            input.classList.add('error');
            
            // 添加焦点事件，移除错误样式
            input.addEventListener('focus', function handleFocus() {
                input.classList.remove('error');
                input.removeEventListener('focus', handleFocus);
            }, { once: true });
        }
        
        // 根据输入类型进行额外验证
        if (input.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                showMessage('请输入有效的邮箱地址', 'error');
                input.classList.add('error');
            }
        }
        
        if (input.type === 'tel' && value) {
            const phoneRegex = /^1[3-9]\d{9}$/;
            if (!phoneRegex.test(value)) {
                isValid = false;
                showMessage('请输入有效的手机号码', 'error');
                input.classList.add('error');
            }
        }
    });
    
    return isValid;
}

/**
 * 提交表单
 * @param {HTMLFormElement} form - 表单元素
 */
function submitForm(form) {
    // 模拟表单提交
    showMessage('表单提交成功', 'success');
    
    // 重置表单
    form.reset();
    
    // 关闭模态框（如果表单在模态框中）
    if (form.closest('.modal')) {
        closeModal();
    }
}

/**
 * 初始化表格操作按钮事件
 */
function initTableActions() {
    const tableButtons = document.querySelectorAll('table button');
    tableButtons.forEach(button => {
        button.addEventListener('click', function() {
            const action = this.textContent.trim();
            const row = this.closest('tr');
            const id = row.getAttribute('data-id') || row.cells[0].textContent;
            
            switch (action) {
                case '处理':
                    handleApproval(id);
                    break;
                case '详情':
                    viewDetails(id);
                    break;
                case '编辑':
                    editItem(id);
                    break;
                case '删除':
                    deleteItem(id);
                    break;
                default:
                    console.log('点击了表格按钮:', action);
                    break;
            }
        });
    });
}

/**
 * 处理审批
 * @param {string} id - 审批ID
 */
function handleApproval(id) {
    console.log('处理审批:', id);
    // 这里可以添加处理审批的逻辑
    // 检查模态框是否存在，不存在则跳转到详情页面
    if (modal) {
        openModal();
    } else {
        showMessage('加载审批详情页面', 'info');
        // 可以添加跳转到审批详情页面的逻辑
    }
}

/**
 * 查看详情
 * @param {string} id - 详情ID
 */
function viewDetails(id) {
    console.log('查看详情:', id);
    // 这里可以添加查看详情的逻辑
    // 检查模态框是否存在，不存在则跳转到详情页面
    if (modal) {
        openModal();
    } else {
        showMessage('加载详情页面', 'info');
        // 可以添加跳转到详情页面的逻辑
    }
}

/**
 * 编辑项目
 * @param {string} id - 项目ID
 */
function editItem(id) {
    console.log('编辑项目:', id);
    // 这里可以添加编辑项目的逻辑
    // 检查模态框是否存在，不存在则跳转到编辑页面
    if (modal) {
        openModal();
    } else {
        showMessage('加载编辑页面', 'info');
        // 可以添加跳转到编辑页面的逻辑
    }
}

/**
 * 删除项目
 * @param {string} id - 项目ID
 */
function deleteItem(id) {
    confirmDialog(
        '确定要删除这条记录吗？此操作不可撤销。',
        function() {
            console.log('删除项目:', id);
            // 这里可以添加删除项目的逻辑
            showMessage('删除成功', 'success');
        },
        null,
        '确认删除'
    );
}

/**
 * 切换暗黑模式
 */
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const isDarkMode = document.body.classList.contains('dark-mode');
    localStorage.setItem('darkMode', isDarkMode);
    
    // 这里可以添加切换暗黑模式的其他逻辑
    showMessage(isDarkMode ? '已切换到暗黑模式' : '已切换到亮色模式', 'success');
}

/**
 * 回到顶部
 */
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

/**
 * 刷新页面数据
 */
function refreshPageData() {
    // 显示加载状态
    const contentArea = document.querySelector('.content');
    if (contentArea) {
        contentArea.classList.add('loading');
        
        // 模拟数据刷新
        setTimeout(() => {
            // 这里可以添加刷新页面数据的逻辑
            showMessage('数据刷新成功', 'success');
            contentArea.classList.remove('loading');
        }, 1000);
    }
}