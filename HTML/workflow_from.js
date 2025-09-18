// 全局变量
let currentNodeId = null;
let selectedNode = null;
let selectedNodeType = null;
let currentConnectionId = 1;
let workflowId = null;
let nodeIdCounter = 1;
let branchNodes = {};

// DOM加载完成后初始化
function initApp() {
    initWorkflowDesigner();
    initTabSwitching();
    initBusinessTree();
}

// 初始化函数
function initWorkflowDesigner() {
    // 初始化节点选择
    const nodeToolbarItems = document.querySelectorAll('.node-toolbar-item');
    nodeToolbarItems.forEach(item => {
        item.addEventListener('click', function() {
            const nodeType = this.dataset.nodeType;
            selectedNodeType = nodeType;
            nodeToolbarItems.forEach(toolbarItem => {
                toolbarItem.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // 初始化添加节点按钮
    const mainAddNode = document.querySelector('.main-add-node');
    if (mainAddNode) {
        mainAddNode.addEventListener('click', function(e) {
            e.stopPropagation();
            const panel = document.querySelector('.node-type-panel');
            panel.style.top = e.clientY + 'px';
            panel.style.left = e.clientX + 'px';
            panel.style.display = 'block';
        });
    }

    // 节点类型选择面板已移除点击交互效果
    // const nodeTypeItems = document.querySelectorAll('.node-type-item');
    // nodeTypeItems.forEach(item => {
    //     item.addEventListener('click', function() {
    //         const nodeType = this.dataset.nodeType;
    //         const nodeTypeName = this.textContent.trim();
    //         addNode(nodeType, nodeTypeName);
    //         document.querySelector('.node-type-panel').style.display = 'none';
    //     });
    // });

    // 点击页面其他区域隐藏节点类型选择面板
    document.addEventListener('click', function(e) {
        const mainAddNode = document.querySelector('.main-add-node');
        const nodeTypePanel = document.querySelector('.node-type-panel');
        if (!e.target.closest('.main-add-node') && !e.target.closest('.node-type-panel')) {
            nodeTypePanel.style.display = 'none';
        }
    });

    // 初始化关闭属性面板按钮
    const closePropertiesBtn = document.querySelector('.close-properties-btn');
    if (closePropertiesBtn) {
        closePropertiesBtn.addEventListener('click', function() {
            hideNodeProperties();
        });
    }

    // 初始化表单验证
    initFormValidation();
}

// 初始化表单验证
function initFormValidation() {
    // 表单验证逻辑
}

// 显示节点属性面板
function showNodeProperties(nodeOrId) {
    // 使用ID选择器获取面板
    const panel = document.querySelector('#node-properties-panel');
    panel.style.display = 'block';
    
    // 处理传入的是节点ID字符串的情况
    let node;
    if (typeof nodeOrId === 'string') {
        node = document.querySelector(`[data-node-id="${nodeOrId}"]`);
    } else {
        node = nodeOrId;
    }
    
    // 存储当前选中的节点
    selectedNode = node;
    currentNodeId = node.dataset.nodeId;
    
    // 清空属性面板内容，确保每个节点弹出独立表单
    const propertiesContent = document.querySelector('#node-properties-content');
    propertiesContent.innerHTML = '';
    
    // 根据节点类型加载对应属性
    const nodeType = node.dataset.nodeType;
    
    // 设置面板标题（显示节点类型名称）
    // 使用ID选择器设置标题
    document.querySelector('#node-properties-title').textContent = `${getNodeTypeName(nodeType)} 属性`;
    
    // 根据节点类型生成属性HTML
    const propertiesHTML = generateNodePropertiesHTML(nodeType);
    propertiesContent.innerHTML = propertiesHTML;
    
    // 添加保存按钮
    propertiesContent.innerHTML += `
        <div class="node-properties-actions" style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 10px;">
            <button id="save-node-properties" class="btn btn-primary">保存</button>
        </div>
    `;
    
    // 绑定保存按钮事件
    document.querySelector('#save-node-properties').addEventListener('click', function() {
        saveNodeProperties();
    });
    
    // 加载节点现有属性
    loadNodeProperties(nodeType);
}

// 初始化自动处理功能
function initAutoProcessFunctionality() {
    // 获取自动处理选择框和自动转办配置区域
    const autoProcessSelect = document.querySelector('#auto-process');
    const autoForwardConfig = document.querySelector('#auto-forward-config');
    
    // 如果元素存在，则添加事件监听器
    if (autoProcessSelect && autoForwardConfig) {
        // 定义处理自动处理选项变化的函数
        function handleAutoProcessChange() {
            // 如果选择了自动转办，则显示转办人员配置区域
            if (autoProcessSelect.value === 'auto-forward') {
                autoForwardConfig.style.display = 'block';
            } else {
                autoForwardConfig.style.display = 'none';
            }
        }
        
        // 添加change事件监听器
        autoProcessSelect.addEventListener('change', handleAutoProcessChange);
        
        // 初始化时执行一次，确保显示正确
        handleAutoProcessChange();
    }
}

// 隐藏节点属性面板
function hideNodeProperties() {
    document.querySelector('#node-properties-panel').style.display = 'none';
    selectedNode = null;
    currentNodeId = null;
}

// 生成节点属性HTML
function generateNodePropertiesHTML(nodeType) {
    let html = '';
    
    // 通用属性
    html += `
        <div class="form-group">
            <label class="form-label">节点名称</label>
            <input type="text" id="node-name" class="form-control" placeholder="请输入节点名称">
        </div>
        <div class="form-group">
            <label class="form-label">节点描述</label>
            <textarea id="node-description" class="textarea-control" placeholder="请输入节点描述"></textarea>
        </div>
    `;
    
    // 根据节点类型添加特定属性
    switch(nodeType) {
        case 'approval':
            html += `
                <div class="form-group">
                    <label class="form-label">审批人</label>
                    <div class="permission-tabs">
                        <div class="permission-tab active" data-tab="specified">指定人员</div>
                        <div class="permission-tab" data-tab="org">组织结构</div>
                        <div class="permission-tab" data-tab="role">角色</div>
                        <div class="permission-tab" data-tab="business">业务结构</div>
                    </div>
                    <div class="permission-content active" data-content="specified">
                        <input type="text" id="approval-persons" class="form-control" placeholder="请输入审批人姓名" readonly>
                        <button id="select-persons" class="btn btn-default" style="margin-top: 8px;">选择人员</button>
                    </div>
                    <div class="permission-content" data-content="org">
                        <input type="text" id="approval-org" class="form-control" placeholder="请选择组织结构" readonly>
                        <button id="select-org" class="btn btn-default" style="margin-top: 8px;">选择组织结构</button>
                    </div>
                    <div class="permission-content" data-content="role">
                        <input type="text" id="approval-role" class="form-control" placeholder="请选择角色" readonly>
                        <button id="select-role" class="btn btn-default" style="margin-top: 8px;">选择角色</button>
                    </div>
                    <div class="permission-content" data-content="business">
                        <input type="text" id="approval-business" class="form-control" placeholder="请选择业务结构" readonly>
                        <button id="select-business" class="btn btn-default" style="margin-top: 8px;">选择业务结构</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">审批操作</label>
                    <div class="approval-actions-container">
                        <label class="approval-action-item">
                            <input type="checkbox" name="approval-action" value="agree" checked>
                            <span>同意</span>
                        </label>
                        <label class="approval-action-item">
                            <input type="checkbox" name="approval-action" value="reject" checked>
                            <span>拒绝</span>
                        </label>
                        <label class="approval-action-item">
                            <input type="checkbox" name="approval-action" value="return">
                            <span>退回</span>
                        </label>
                        <label class="approval-action-item">
                            <input type="checkbox" name="approval-action" value="forward">
                            <span>转交</span>
                        </label>
                        <label class="approval-action-item">
                            <input type="checkbox" name="approval-action" value="joint-approval">
                            <span>同审</span>
                        </label>
                        <label class="approval-action-item">
                            <input type="checkbox" name="approval-action" value="delegate">
                            <span>代办</span>
                        </label>
                    </div>
                    <div style="font-size: 12px; color: #666; margin-top: 5px;">注：勾选审批节点允许的操作类型</div>
                </div>
                    <div class="permission-content" data-content="org">
                        <input type="text" id="approval-org" class="form-control" placeholder="请选择组织结构" readonly>
                        <button id="select-org" class="btn btn-default" style="margin-top: 8px;">选择组织结构</button>
                    </div>
                    <div class="permission-content" data-content="role">
                        <input type="text" id="approval-role" class="form-control" placeholder="请选择角色" readonly>
                        <button id="select-role" class="btn btn-default" style="margin-top: 8px;">选择角色</button>
                    </div>
                    <div class="permission-content" data-content="business">
                        <input type="text" id="approval-business" class="form-control" placeholder="请选择业务结构" readonly>
                        <button id="select-business" class="btn btn-default" style="margin-top: 8px;">选择业务结构</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">审批方式</label>
                    <select id="approval-method" class="form-control">
                        <option value="and">会签（全部同意）</option>
                        <option value="or">或签（任一同意）</option>
                        <option value="serial">串行</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">审批期限（天）</label>
                    <input type="number" id="approval-deadline" class="form-control" min="0" placeholder="请输入审批期限">
                </div>
                <div class="form-group">
                    <label class="form-label">自动处理</label>
                    <select id="auto-process" class="form-control">
                        <option value="">不启用自动处理</option>
                        <option value="auto-approve">自动同意（超过期限自动同意）</option>
                        <option value="auto-reject">自动拒绝（超过期限自动拒绝）</option>
                        <option value="auto-forward">自动转办（超过期限自动转办）</option>
                    </select>
                </div>
                <div class="form-group" id="auto-forward-config" style="display: none;">
                    <label class="form-label">转办人员</label>
                    <input type="text" id="forward-persons" class="form-control" placeholder="请输入转办人员姓名" readonly>
                    <button id="select-forward-persons" class="btn btn-default" style="margin-top: 8px;">选择人员</button>
                </div>
            `;
            break;
        case 'task':
            html += `
                <div class="form-group">
                    <label class="form-label">办理人</label>
                    <div class="permission-tabs">
                        <div class="permission-tab active" data-tab="specified">指定人员</div>
                        <div class="permission-tab" data-tab="org">组织结构</div>
                        <div class="permission-tab" data-tab="role">角色</div>
                        <div class="permission-tab" data-tab="business">业务结构</div>
                    </div>
                    <div class="permission-content active" data-content="specified">
                        <input type="text" id="task-persons" class="form-control" placeholder="请输入办理人姓名" readonly>
                        <button id="select-task-persons" class="btn btn-default" style="margin-top: 8px;">选择人员</button>
                    </div>
                    <div class="permission-content" data-content="org">
                        <input type="text" id="task-org" class="form-control" placeholder="请选择组织结构" readonly>
                        <button id="select-task-org" class="btn btn-default" style="margin-top: 8px;">选择组织结构</button>
                    </div>
                    <div class="permission-content" data-content="role">
                        <input type="text" id="task-role" class="form-control" placeholder="请选择角色" readonly>
                        <button id="select-task-role" class="btn btn-default" style="margin-top: 8px;">选择角色</button>
                    </div>
                    <div class="permission-content" data-content="business">
                        <input type="text" id="task-business" class="form-control" placeholder="请选择业务结构" readonly>
                        <button id="select-task-business" class="btn btn-default" style="margin-top: 8px;">选择业务结构</button>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">办理期限（天）</label>
                    <input type="number" id="task-deadline" class="form-control" min="0" placeholder="请输入办理期限">
                </div>
                <!-- 附加表单功能 -->
                <div class="form-group">
                    <label class="form-label">附加表单</label>
                    <div>
                        <input type="checkbox" id="attach-form" class="form-checkbox">
                        <label for="attach-form" style="margin-left: 8px;">添加附加表单</label>
                    </div>
                    <div id="attach-form-content" style="display: none; margin-top: 10px; padding: 15px; background-color: #f5f5f5; border-radius: 4px;">
                        <div class="form-group">
                            <label class="form-label">选择表单</label>
                            <select id="form-select" class="form-control">
                                <option value="">-- 请选择表单 --</option>
                                <option value="leave_form">请假申请表</option>
                                <option value="expense_form">报销申请表</option>
                                <option value="overtime_form">加班申请表</option>
                                <option value="custom">自定义表单</option>
                            </select>
                        </div>
                        <div id="field-settings" style="display: none; margin-top: 10px;">
                            <div class="form-group">
                                <label class="form-label">字段设置</label>
                                <table class="form-fields-table" style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background-color: #e8e8e8;">
                                            <th style="padding: 8px; text-align: left; border: 1px solid #ddd; width: 30%;">字段名</th>
                                            <th style="padding: 8px; text-align: center; border: 1px solid #ddd; width: 23.3%;">只读</th>
                                            <th style="padding: 8px; text-align: center; border: 1px solid #ddd; width: 23.3%;">隐藏</th>
                                            <th style="padding: 8px; text-align: center; border: 1px solid #ddd; width: 23.3%;">可编辑</th>
                                        </tr>
                                    </thead>
                                    <tbody id="form-fields-container">
                                        <!-- 字段设置内容将通过JavaScript动态生成 -->
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
        case 'cc':
            html += `
                <div class="form-group">
                    <label class="form-label">抄送人</label>
                    <div class="permission-tabs">
                        <div class="permission-tab active" data-tab="specified">指定人员</div>
                        <div class="permission-tab" data-tab="org">组织结构</div>
                        <div class="permission-tab" data-tab="role">角色</div>
                        <div class="permission-tab" data-tab="business">业务结构</div>
                    </div>
                    <div class="permission-content active" data-content="specified">
                        <input type="text" id="cc-persons" class="form-control" placeholder="请输入抄送人姓名" readonly>
                        <button id="select-cc-persons" class="btn btn-default" style="margin-top: 8px;">选择人员</button>
                    </div>
                    <div class="permission-content" data-content="org">
                        <input type="text" id="cc-org" class="form-control" placeholder="请选择组织结构" readonly>
                        <button id="select-cc-org" class="btn btn-default" style="margin-top: 8px;">选择组织结构</button>
                    </div>
                    <div class="permission-content" data-content="role">
                        <input type="text" id="cc-role" class="form-control" placeholder="请选择角色" readonly>
                        <button id="select-cc-role" class="btn btn-default" style="margin-top: 8px;">选择角色</button>
                    </div>
                    <div class="permission-content" data-content="business">
                        <input type="text" id="cc-business" class="form-control" placeholder="请选择业务结构" readonly>
                        <button id="select-cc-business" class="btn btn-default" style="margin-top: 8px;">选择业务结构</button>
                    </div>
                </div>
            `;
            break;
        case 'branch':
            html += `
                <div class="form-group">
                    <label class="form-label">分支数量</label>
                    <input type="number" id="branch-count" class="form-control" min="2" max="10" value="2" placeholder="请输入分支数量">
                </div>
                <div class="form-group">
                    <label class="form-label">分支条件</label>
                    <div id="branch-conditions"></div>
                </div>
            `;
            // 初始化分支条件
            setTimeout(() => {
                generateBranchConditions(2);
            }, 0);
            break;
        case 'merge':
            html += `
                <div class="form-group">
                    <label class="form-label">合并方式</label>
                    <select id="merge-method" class="form-control">
                        <option value="all">全部完成</option>
                        <option value="any">任一完成</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">可合并分支</label>
                    <select id="merge-branches" class="form-control" multiple>
                        <option value="1">总监审批</option>
                        <option value="2">其他情况</option>
                        <option value="3">特殊情况</option>
                    </select>
                </div>
            `;
            // 加载可合并分支
            setTimeout(() => {
                loadMergeableBranches();
            }, 0);
            break;
        case 'start':
            html += `
                <div class="form-group">
                    <label class="form-label">发起人范围</label>
                    <div class="permission-tabs">
                        <div class="permission-tab active" data-tab="specified">指定人员</div>
                        <div class="permission-tab" data-tab="org">组织结构</div>
                        <div class="permission-tab" data-tab="role">角色</div>
                        <div class="permission-tab" data-tab="business">业务结构</div>
                        <div class="permission-tab" data-tab="internal-external">组织内外</div>
                        <div class="permission-tab" data-tab="all">全部人员</div>
                    </div>
                    <div class="permission-content active" data-content="specified">
                        <div class="form-group">
                            <label class="form-label">选择人员</label>
                            <input type="text" id="start-persons" class="form-control" placeholder="请输入发起人姓名" readonly>
                            <button id="select-start-persons" class="btn btn-default" style="margin-top: 8px;">选择人员</button>
                        </div>
                        <div class="form-group">
                            <label class="form-label">人员类型</label>
                            <select id="start-persons-type" class="form-control">
                                <option value="all">全部人员</option>
                                <option value="internal">内部人员</option>
                                <option value="external">外部人员</option>
                            </select>
                        </div>
                    </div>
                    <div class="permission-content" data-content="org">
                        <input type="text" id="start-org" class="form-control" placeholder="请选择组织结构" readonly>
                        <button id="select-start-org" class="btn btn-default" style="margin-top: 8px;">选择组织结构</button>
                        <p style="margin: 8px 0; color: #666; font-size: 12px;">支持多选组织结构，选中的组织结构下所有人员都可以发起流程</p>
                    </div>
                    <div class="permission-content" data-content="role">
                        <input type="text" id="start-role" class="form-control" placeholder="请选择角色" readonly>
                        <button id="select-start-role" class="btn btn-default" style="margin-top: 8px;">选择角色</button>
                        <p style="margin: 8px 0; color: #666; font-size: 12px;">支持多选角色，拥有选中角色的所有人员都可以发起流程</p>
                    </div>
                    <div class="permission-content" data-content="business">
                        <input type="text" id="start-business" class="form-control" placeholder="请选择业务结构" readonly>
                        <button id="select-start-business" class="btn btn-default" style="margin-top: 8px;">选择业务结构</button>
                        <p style="margin: 8px 0; color: #666; font-size: 12px;">支持多选业务结构，属于选中业务结构的所有人员都可以发起流程</p>
                    </div>
                    <div class="permission-content" data-content="internal-external">
                        <div class="form-group">
                            <label class="form-label">组织内外类型</label>
                            <div class="radio-group" style="display: flex; gap: 16px;">
                                <label style="display: flex; align-items: center; gap: 6px;">
                                    <input type="radio" name="start-org-type" value="internal" checked>
                                    <span>内部人员</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px;">
                                    <input type="radio" name="start-org-type" value="external">
                                    <span>外部人员</span>
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px;">
                                    <input type="radio" name="start-org-type" value="both">
                                    <span>两者都包括</span>
                                </label>
                            </div>
                        </div>
                        <div class="form-group" id="start-external-config" style="display: none;">
                            <label class="form-label">外部人员配置</label>
                            <div class="form-row" style="display: flex; gap: 12px;">
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">允许发起次数</label>
                                    <input type="number" id="start-external-limit" class="form-control" min="1" value="3" placeholder="请输入允许发起次数">
                                </div>
                                <div class="form-group" style="flex: 1;">
                                    <label class="form-label">有效期(天)</label>
                                    <input type="number" id="start-external-expire" class="form-control" min="1" value="30" placeholder="请输入有效期">
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="permission-content" data-content="all">
                        <p style="margin: 0;">所有用户都可以发起此流程</p>
                        <p style="margin: 8px 0; color: #ff4d4f; font-size: 12px;">警告：选择此项将允许系统中所有用户发起该流程，请谨慎操作</p>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">发起设置</label>
                    <div class="form-row" style="display: flex; gap: 12px;">
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">允许发起次数</label>
                            <input type="number" id="start-limit" class="form-control" min="-1" value="-1" placeholder="-1表示无限制">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label">发起后状态</label>
                            <select id="start-status" class="form-control">
                                <option value="pending">待处理</option>
                                <option value="running">运行中</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="form-label">发起通知</label>
                    <div class="checkbox-group">
                        <label style="display: flex; align-items: center; gap: 6px;">
                            <input type="checkbox" id="start-notify-creator" checked>
                            <span>通知发起人</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; margin-left: 16px;">
                            <input type="checkbox" id="start-notify-admin">
                            <span>通知管理员</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; margin-left: 16px;">
                            <input type="checkbox" id="start-notify-specified">
                            <span>通知指定人员</span>
                        </label>
                    </div>
                    <div id="start-notify-specified-config" style="margin-top: 12px; display: none;">
                        <input type="text" id="start-notify-persons" class="form-control" placeholder="请输入要通知的人员" readonly>
                        <button id="select-start-notify-persons" class="btn btn-default" style="margin-top: 8px;">选择人员</button>
                    </div>
                </div>
            `;
            break;
        case 'ai':
            html += `
                <div class="form-group">
                    <label class="form-label">AI服务类型</label>
                    <select id="ai-service-type" class="form-control">
                        <option value="">请选择AI服务</option>
                        <option value="model">普通大模型</option>
                        <option value="agent">已加工智能体</option>
                        <option value="process-agent">流程智能体</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">AI服务列表</label>
                    <select id="ai-service-list" class="form-control">
                        <option value="">请先选择AI服务类型</option>
                    </select>
                    <p style="margin: 8px 0; color: #666; font-size: 12px;">提示：选择AI服务类型后，将显示对应的AI服务列表供选择</p>
                </div>
                <div class="form-group">
                    <label class="form-label">AI提示词</label>
                    <textarea id="ai-prompt" class="form-control" rows="5" placeholder="请输入AI提示词，用于指导AI模型的输出内容"></textarea>
                    <p style="margin: 8px 0; color: #666; font-size: 12px;">提示词将作为AI模型的输入指令，越详细的提示词将获得越准确的输出结果</p>
                </div>
            `;
            break;
        case 'business':
            html += `
                <div class="form-group">
                    <label class="form-label">业务处理方式</label>
                    <div class="business-tabs">
                        <div class="business-tab active" data-tab="function">函数</div>
                        <div class="business-tab" data-tab="interface">接口</div>
                        <div class="business-tab" data-tab="data">数据</div>
                        <div class="business-tab" data-tab="all">全部</div>
                    </div>
                    
                    <!-- 函数配置页签 -->
                    <div class="business-content active" data-content="function">
                        <div class="form-section">
                            
                            <div id="function-config" class="form-subsection">
                                <div class="form-group">
                                    <label class="form-label">函数表达式</label>
                                    <div class="function-expression-container">
                                        <textarea id="function-expression" class="form-control" rows="4" placeholder="请输入函数表达式，例如：total_amount = amount + days * 10"></textarea>
                                        
                                        <!-- 可插入的函数和字段选择器 -->
                                        <div class="function-insert-tools" style="margin-top: 10px; display: flex; gap: 15px;">
                                            <div class="tool-group">
                                                <label style="font-size: 12px; color: #666;">函数:</label>
                                                <select id="insert-function" class="form-control" style="width: auto; display: inline;">
                                                    <option value="">-- 选择函数 --</option>
                                                    <option value="add">加法 (+)</option>
                                                    <option value="subtract">减法 (-)</option>
                                                    <option value="multiply">乘法 (*)</option>
                                                    <option value="divide">除法 (/)</option>
                                                    <option value="sum">求和 sum()</option>
                                                    <option value="average">平均值 average()</option>
                                                    <option value="max">最大值 max()</option>
                                                    <option value="min">最小值 min()</option>
                                                </select>
                                            
                                            </div>
                                            <div class="tool-group">
                                                <label style="font-size: 12px; color: #666;">字段:</label>
                                                <select id="insert-field" class="form-control" style="width: auto; display: inline;">
                                                    <option value="">-- 选择字段 --</option>
                                                    <option value="amount">amount (金额)</option>
                                                    <option value="days">days (天数)</option>
                                                    <option value="hours">hours (小时数)</option>
                                                    <option value="total_amount">total_amount (总金额)</option>
                                                    <option value="total_days">total_days (总天数)</option>
                                                    <option value="total_hours">total_hours (总小时数)</option>
                                                    <option value="calculated_result">calculated_result (计算结果)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">结果存储到</label>
                                    <select id="function-result" class="form-control">
                                        <option value="">-- 选择目标字段 --</option>
                                        <option value="total_amount">总金额</option>
                                        <option value="total_days">总天数</option>
                                        <option value="total_hours">总小时数</option>
                                        <option value="calculated_result">计算结果</option>
                                    </select>
                                </div>
                                
                                <!-- 函数预览区域 -->
                                <div class="function-preview-container">
                                    <div class="function-preview-title">函数预览</div>
                                    <div id="function-preview" class="function-preview"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 接口配置页签 -->
                    <div class="business-content" data-content="interface">
                        <div class="form-section">
                            <div class="form-group">
                                <label class="form-label">选择接口</label>
                                <select id="interface-select" class="form-control">
                                    <option value="">-- 请选择接口 --</option>
                                    <option value="financial_api">财务系统API</option>
                                    <option value="hr_api">人力资源API</option>
                                    <option value="project_api">项目管理API</option>
                                    <option value="document_api">文档管理API</option>
                                    <option value="custom_api">自定义API</option>
                                </select>
                            </div>
                            
                            <div id="interface-config" class="form-subsection">
                                <div class="form-group">
                                    <label class="form-label">接口配置</label>
                                    <div class="interface-params">
                                        <div class="form-row" style="display: flex; gap: 15px; margin-bottom: 15px;">
                                            <div class="form-group" style="flex: 0 0 120px;">
                                                <label class="form-label">请求方式</label>
                                                <select class="form-control interface-method">
                                                    <option value="GET" selected>GET</option>
                                                    <option value="POST">POST</option>
                                                    <option value="PUT">PUT</option>
                                                    <option value="DELETE">DELETE</option>
                                                </select>
                                            </div>
                                            <div class="form-group" style="flex: 1;">
                                                <label class="form-label">接口URL</label>
                                                <input type="text" class="form-control interface-url" placeholder="请输入接口URL">
                                            </div>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="form-label">参数映射</label>
                                            <div class="interface-params-table-container" style="border: 1px solid #e9ecef; border-radius: 4px; overflow: hidden;">
                                                <table class="form-fields-table" style="width: 100%; border-collapse: collapse;">
                                                    <thead>
                                                        <tr style="background-color: #f8f9fa;">
                                                            <th style="padding: 10px; text-align: left; border: 1px solid #e9ecef; width: 30%; font-weight: 500;">接口参数</th>
                                                            <th style="padding: 10px; text-align: left; border: 1px solid #e9ecef; width: 60%; font-weight: 500;">表单字段/值</th>
                                                            <th style="padding: 10px; text-align: center; border: 1px solid #e9ecef; width: 10%; font-weight: 500;">操作</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody id="interface-params-container">
                                                        <!-- 默认添加多行常用参数映射 -->
                                                        <tr class="param-row">
                                                            <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                                <input type="text" class="form-control interface-param-name" placeholder="参数名" value="amount">
                                                            </td>
                                                            <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                                <select class="form-control interface-param-value-type">
                                                                    <option value="field" selected>表单字段</option>
                                                                    <option value="constant">常量值</option>
                                                                    <option value="variable">流程变量</option>
                                                                </select>
                                                                <div class="interface-param-value-container">
                                                                    <select class="form-control interface-param-value field-option">
                                                                        <option value="">-- 选择字段 --</option>
                                                                        <option value="amount" selected>金额</option>
                                                                        <option value="days">天数</option>
                                                                        <option value="project_id">项目ID</option>
                                                                        <option value="user_id">用户ID</option>
                                                                    </select>
                                                                    <input type="text" class="form-control interface-param-value constant-option" placeholder="输入常量值" style="display: none;">
                                                                    <select class="form-control interface-param-value variable-option" style="display: none;">
                                                                        <option value="">-- 选择变量 --</option>
                                                                        <option value="current_user">当前用户</option>
                                                                        <option value="current_time">当前时间</option>
                                                                        <option value="workflow_id">流程ID</option>
                                                                    </select>
                                                                </div>
                                                            </td>
                                                            <td style="padding: 10px; border: 1px solid #e9ecef; text-align: center;">
                                                                <button type="button" class="btn btn-danger remove-param-btn" style="padding: 4px 8px;">删除</button>
                                                            </td>
                                                        </tr>
                                                        <tr class="param-row">
                                                            <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                                <input type="text" class="form-control interface-param-name" placeholder="参数名" value="user_id">
                                                            </td>
                                                            <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                                <select class="form-control interface-param-value-type">
                                                                    <option value="field">表单字段</option>
                                                                    <option value="constant">常量值</option>
                                                                    <option value="variable" selected>流程变量</option>
                                                                </select>
                                                                <div class="interface-param-value-container">
                                                                    <select class="form-control interface-param-value field-option" style="display: none;">
                                                                        <option value="">-- 选择字段 --</option>
                                                                        <option value="amount">金额</option>
                                                                        <option value="days">天数</option>
                                                                        <option value="project_id">项目ID</option>
                                                                        <option value="user_id">用户ID</option>
                                                                    </select>
                                                                    <input type="text" class="form-control interface-param-value constant-option" placeholder="输入常量值" style="display: none;">
                                                                    <select class="form-control interface-param-value variable-option">
                                                                        <option value="">-- 选择变量 --</option>
                                                                        <option value="current_user" selected>当前用户</option>
                                                                        <option value="current_time">当前时间</option>
                                                                        <option value="workflow_id">流程ID</option>
                                                                    </select>
                                                                </div>
                                                            </td>
                                                            <td style="padding: 10px; border: 1px solid #e9ecef; text-align: center;">
                                                                <button type="button" class="btn btn-danger remove-param-btn" style="padding: 4px 8px;">删除</button>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <button type="button" id="add-interface-param-btn" class="btn btn-primary" style="margin-top: 10px;">添加参数</button>
                                        </div>
                                        
                                        <div class="form-group">
                                            <label class="form-label">认证方式</label>
                                            <select class="form-control interface-auth-type">
                                                <option value="none" selected>无认证</option>
                                                <option value="basic">Basic Auth</option>
                                                <option value="token">Token</option>
                                                <option value="oauth2">OAuth2</option>
                                            </select>
                                        </div>
                                        
                                        <div class="auth-config-container" style="margin-top: 10px; padding: 15px; background-color: #f8f9fa; border-radius: 4px; display: none;">
                                            <!-- 认证配置内容 -->
                                        </div>
                                        
                                        <div class="form-group" style="margin-top: 15px;">
                                            <label class="form-label">请求头</label>
                                            <div id="request-headers-container" style="border: 1px solid #e9ecef; border-radius: 4px; overflow: hidden;">
                                                <table class="form-fields-table" style="width: 100%; border-collapse: collapse;">
                                                    <thead>
                                                        <tr style="background-color: #f8f9fa;">
                                                            <th style="padding: 10px; text-align: left; border: 1px solid #e9ecef; width: 35%; font-weight: 500;">Header名称</th>
                                                            <th style="padding: 10px; text-align: left; border: 1px solid #e9ecef; width: 55%; font-weight: 500;">Header值</th>
                                                            <th style="padding: 10px; text-align: center; border: 1px solid #e9ecef; width: 10%; font-weight: 500;">操作</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <tr>
                                                            <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                                <input type="text" class="form-control header-name" placeholder="Header名称" value="Content-Type">
                                                            </td>
                                                            <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                                <input type="text" class="form-control header-value" placeholder="Header值" value="application/json">
                                                            </td>
                                                            <td style="padding: 10px; border: 1px solid #e9ecef; text-align: center;">
                                                                <button type="button" class="btn btn-danger remove-header-btn" style="padding: 4px 8px;">删除</button>
                                                            </td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            <button type="button" id="add-header-btn" class="btn btn-primary" style="margin-top: 10px;">添加Header</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 数据配置页签 -->
                    <div class="business-content" data-content="data">
                        <div class="form-section">
                            <div class="form-group">
                                <label class="form-label">数据操作</label>
                                <select id="data-operation" class="form-control">
                                    <option value="">-- 请选择数据操作 --</option>
                                    <option value="insert">新增数据</option>
                                    <option value="update">更新数据</option>
                                    <option value="delete">删除数据</option>
                                    <option value="query">查询数据</option>
                                    <option value="batch">批量操作</option>
                                </select>
                            </div>
                            
                            <div id="data-config" class="form-subsection">
                                <div class="form-row" style="display: flex; gap: 15px; margin-bottom: 15px;">
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">数据源</label>
                                        <select class="form-control data-source">
                                            <option value="">-- 选择数据源 --</option>
                                            <option value="database" selected>数据库</option>
                                            <option value="file">文件</option>
                                            <option value="cache">缓存</option>
                                            <option value="other">其他</option>
                                        </select>
                                    </div>
                                    <div class="form-group" style="flex: 1;">
                                        <label class="form-label">表/集合</label>
                                        <select class="form-control data-table">
                                            <option value="">-- 选择表/集合 --</option>
                                            <option value="user">用户表</option>
                                            <option value="department">部门表</option>
                                            <option value="project">项目表</option>
                                            <option value="order" selected>订单表</option>
                                            <option value="custom">自定义</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label class="form-label">字段映射</label>
                                    <div class="data-fields-table-container" style="border: 1px solid #e9ecef; border-radius: 4px; overflow: hidden;">
                                        <table class="form-fields-table" style="width: 100%; border-collapse: collapse;">
                                            <thead>
                                                <tr style="background-color: #f8f9fa;">
                                                    <th style="padding: 10px; text-align: left; border: 1px solid #e9ecef; width: 30%; font-weight: 500;">目标字段</th>
                                                    <th style="padding: 10px; text-align: left; border: 1px solid #e9ecef; width: 60%; font-weight: 500;">表单字段/值</th>
                                                    <th style="padding: 10px; text-align: center; border: 1px solid #e9ecef; width: 10%; font-weight: 500;">操作</th>
                                                </tr>
                                            </thead>
                                            <tbody id="data-fields-container">
                                                <!-- 默认添加多行常用字段映射 -->
                                                <tr class="field-row">
                                                    <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                        <input type="text" class="form-control data-field-name" placeholder="字段名" value="amount">
                                                    </td>
                                                    <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                        <select class="form-control data-field-value-type">
                                                            <option value="field" selected>表单字段</option>
                                                            <option value="constant">常量值</option>
                                                            <option value="variable">流程变量</option>
                                                            <option value="function">函数计算</option>
                                                        </select>
                                                        <div class="data-field-value-container">
                                                            <select class="form-control data-field-value field-option">
                                                                <option value="">-- 选择字段 --</option>
                                                                <option value="amount" selected>金额</option>
                                                                <option value="days">天数</option>
                                                                <option value="project_id">项目ID</option>
                                                                <option value="user_id">用户ID</option>
                                                            </select>
                                                            <input type="text" class="form-control data-field-value constant-option" placeholder="输入常量值" style="display: none;">
                                                            <select class="form-control data-field-value variable-option" style="display: none;">
                                                                <option value="">-- 选择变量 --</option>
                                                                <option value="current_user">当前用户</option>
                                                                <option value="current_time">当前时间</option>
                                                                <option value="workflow_id">流程ID</option>
                                                            </select>
                                                            <select class="form-control data-field-value function-option" style="display: none;">
                                                                <option value="">-- 选择函数 --</option>
                                                                <option value="sum">求和</option>
                                                                <option value="average">平均值</option>
                                                                <option value="max">最大值</option>
                                                                <option value="min">最小值</option>
                                                                <option value="now">当前时间</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td style="padding: 10px; border: 1px solid #e9ecef; text-align: center;">
                                                        <button type="button" class="btn btn-danger remove-field-btn" style="padding: 4px 8px;">删除</button>
                                                    </td>
                                                </tr>
                                                <tr class="field-row">
                                                    <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                        <input type="text" class="form-control data-field-name" placeholder="字段名" value="create_time">
                                                    </td>
                                                    <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                        <select class="form-control data-field-value-type">
                                                            <option value="field">表单字段</option>
                                                            <option value="constant">常量值</option>
                                                            <option value="variable">流程变量</option>
                                                            <option value="function" selected>函数计算</option>
                                                        </select>
                                                        <div class="data-field-value-container">
                                                            <select class="form-control data-field-value field-option" style="display: none;">
                                                                <option value="">-- 选择字段 --</option>
                                                                <option value="amount">金额</option>
                                                                <option value="days">天数</option>
                                                                <option value="project_id">项目ID</option>
                                                                <option value="user_id">用户ID</option>
                                                            </select>
                                                            <input type="text" class="form-control data-field-value constant-option" placeholder="输入常量值" style="display: none;">
                                                            <select class="form-control data-field-value variable-option" style="display: none;">
                                                                <option value="">-- 选择变量 --</option>
                                                                <option value="current_user">当前用户</option>
                                                                <option value="current_time">当前时间</option>
                                                                <option value="workflow_id">流程ID</option>
                                                            </select>
                                                            <select class="form-control data-field-value function-option">
                                                                <option value="">-- 选择函数 --</option>
                                                                <option value="sum">求和</option>
                                                                <option value="average">平均值</option>
                                                                <option value="max">最大值</option>
                                                                <option value="min">最小值</option>
                                                                <option value="now" selected>当前时间</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td style="padding: 10px; border: 1px solid #e9ecef; text-align: center;">
                                                        <button type="button" class="btn btn-danger remove-field-btn" style="padding: 4px 8px;">删除</button>
                                                    </td>
                                                </tr>
                                                <tr class="field-row">
                                                    <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                        <input type="text" class="form-control data-field-name" placeholder="字段名" value="created_by">
                                                    </td>
                                                    <td style="padding: 10px; border: 1px solid #e9ecef;">
                                                        <select class="form-control data-field-value-type">
                                                            <option value="field">表单字段</option>
                                                            <option value="constant">常量值</option>
                                                            <option value="variable" selected>流程变量</option>
                                                            <option value="function">函数计算</option>
                                                        </select>
                                                        <div class="data-field-value-container">
                                                            <select class="form-control data-field-value field-option" style="display: none;">
                                                                <option value="">-- 选择字段 --</option>
                                                                <option value="amount">金额</option>
                                                                <option value="days">天数</option>
                                                                <option value="project_id">项目ID</option>
                                                                <option value="user_id">用户ID</option>
                                                            </select>
                                                            <input type="text" class="form-control data-field-value constant-option" placeholder="输入常量值" style="display: none;">
                                                            <select class="form-control data-field-value variable-option">
                                                                <option value="">-- 选择变量 --</option>
                                                                <option value="current_user" selected>当前用户</option>
                                                                <option value="current_time">当前时间</option>
                                                                <option value="workflow_id">流程ID</option>
                                                            </select>
                                                            <select class="form-control data-field-value function-option" style="display: none;">
                                                                <option value="">-- 选择函数 --</option>
                                                                <option value="sum">求和</option>
                                                                <option value="average">平均值</option>
                                                                <option value="max">最大值</option>
                                                                <option value="min">最小值</option>
                                                                <option value="now">当前时间</option>
                                                            </select>
                                                        </div>
                                                    </td>
                                                    <td style="padding: 10px; border: 1px solid #e9ecef; text-align: center;">
                                                        <button type="button" class="btn btn-danger remove-field-btn" style="padding: 4px 8px;">删除</button>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                    <button type="button" id="add-data-field-btn" class="btn btn-primary" style="margin-top: 10px;">添加字段</button>
                                </div>
                                
                                <div class="form-group" id="query-conditions-container" style="display: none;">
                                    <label class="form-label">查询条件</label>
                                    <div class="query-conditions">
                                        <!-- 默认添加查询条件 -->
                                        <div class="query-condition" style="display: flex; gap: 10px; margin-bottom: 10px; align-items: end;">
                                            <div class="form-group" style="flex: 1;">
                                                <label class="form-label">字段</label>
                                                <select class="form-control condition-field">
                                                    <option value="">-- 选择字段 --</option>
                                                    <option value="amount">金额</option>
                                                    <option value="days">天数</option>
                                                    <option value="project_id" selected>项目ID</option>
                                                    <option value="user_id">用户ID</option>
                                                </select>
                                            </div>
                                            <div class="form-group" style="flex: 1;">
                                                <label class="form-label">运算符</label>
                                                <select class="form-control condition-operator">
                                                    <option value="eq" selected>=</option>
                                                    <option value="neq">≠</option>
                                                    <option value="gt">></option>
                                                    <option value="gte">≥</option>
                                                    <option value="lt"><</option>
                                                    <option value="lte">≤</option>
                                                    <option value="like">包含</option>
                                                    <option value="in">在列表中</option>
                                                </select>
                                            </div>
                                            <div class="form-group" style="flex: 1;">
                                                <label class="form-label">值</label>
                                                <input type="text" class="form-control condition-value" placeholder="请输入值" value="">
                                            </div>
                                            <div class="form-group" style="width: 80px; display: flex; align-items: end;">
                                                <button type="button" class="btn btn-danger remove-condition-btn" style="width: 100%;">删除</button>
                                            </div>
                                        </div>
                                    </div>
                                    <button type="button" id="add-condition-btn" class="btn btn-primary" style="margin-top: 10px;">添加条件</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 组合配置页签 -->
                    <div class="business-content" data-content="all">
                        <div class="form-section">
                            <div class="form-group">
                                <label class="form-label">组合处理配置</label>
                                <div class="all-config" style="padding: 20px; background-color: #f8f9fa; border-radius: 6px; border: 1px solid #e9ecef;">
                                    <div class="config-info" style="margin-bottom: 15px; padding: 12px; background-color: #e3f2fd; border-radius: 4px;">
                                        <p style="margin: 0; color: #1565c0;">此模式允许您组合函数运算、接口调用和数据操作来完成复杂的业务处理。步骤将按顺序执行。</p>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label class="form-label">处理步骤</label>
                                        <div id="composite-steps" style="display: flex; flex-direction: column; gap: 15px; margin-bottom: 15px;">
                                            <!-- 默认添加多个预设步骤 -->
                                            <div class="composite-step" style="padding: 15px; background-color: #fff; border-radius: 4px; border: 1px solid #e9ecef;">
                                                <div class="composite-step-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                                    <div style="font-weight: 500; color: #333;">步骤 1: 数据计算</div>
                                                    <div style="display: flex; gap: 10px;">
                                                        <button type="button" class="btn btn-sm btn-primary move-up-btn">上移</button>
                                                        <button type="button" class="btn btn-sm btn-primary move-down-btn">下移</button>
                                                    </div>
                                                </div>
                                                <div class="form-row" style="display: flex; gap: 15px; align-items: end;">
                                                    <div class="form-group" style="flex: 1;">
                                                        <label class="form-label">步骤类型</label>
                                                        <select class="form-control step-type">
                                                            <option value="">-- 选择类型 --</option>
                                                            <option value="function" selected>函数运算</option>
                                                            <option value="interface">接口调用</option>
                                                            <option value="data">数据操作</option>
                                                        </select>
                                                    </div>
                                                    <div class="form-group" style="flex: 1;">
                                                        <label class="form-label">配置名称</label>
                                                        <input type="text" class="form-control step-name" placeholder="请输入配置名称" value="计算总金额">
                                                    </div>
                                                    <div class="form-group" style="width: 120px; display: flex; align-items: end;">
                                                        <button type="button" class="btn btn-danger remove-step-btn" style="width: 100%;">删除</button>
                                                    </div>
                                                </div>
                                                <div class="step-config" style="margin-top: 15px; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
                                                    <div class="form-group">
                                                        <label class="form-label" style="font-size: 14px; font-weight: 500;">函数配置</label>
                                                        <input type="text" class="form-control" placeholder="函数表达式" value="total_amount = amount * days" style="font-size: 14px;">
                                                    </div>
                                                </div>
                                            </div>
                                             
                                            <div class="composite-step" style="padding: 15px; background-color: #fff; border-radius: 4px; border: 1px solid #e9ecef;">
                                                <div class="composite-step-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                                    <div style="font-weight: 500; color: #333;">步骤 2: 外部接口调用</div>
                                                    <div style="display: flex; gap: 10px;">
                                                        <button type="button" class="btn btn-sm btn-primary move-up-btn">上移</button>
                                                        <button type="button" class="btn btn-sm btn-primary move-down-btn">下移</button>
                                                    </div>
                                                </div>
                                                <div class="form-row" style="display: flex; gap: 15px; align-items: end;">
                                                    <div class="form-group" style="flex: 1;">
                                                        <label class="form-label">步骤类型</label>
                                                        <select class="form-control step-type">
                                                            <option value="">-- 选择类型 --</option>
                                                            <option value="function">函数运算</option>
                                                            <option value="interface" selected>接口调用</option>
                                                            <option value="data">数据操作</option>
                                                        </select>
                                                    </div>
                                                    <div class="form-group" style="flex: 1;">
                                                        <label class="form-label">配置名称</label>
                                                        <input type="text" class="form-control step-name" placeholder="请输入配置名称" value="调用财务系统API">
                                                    </div>
                                                    <div class="form-group" style="width: 120px; display: flex; align-items: end;">
                                                        <button type="button" class="btn btn-danger remove-step-btn" style="width: 100%;">删除</button>
                                                    </div>
                                                </div>
                                                <div class="step-config" style="margin-top: 15px; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
                                                    <div class="form-group">
                                                        <label class="form-label" style="font-size: 14px; font-weight: 500;">接口配置</label>
                                                        <input type="text" class="form-control" placeholder="接口URL" value="/api/financial/process" style="font-size: 14px; margin-bottom: 8px;">
                                                        <select class="form-control" style="font-size: 14px; width: 120px;">
                                                            <option value="POST" selected>POST</option>
                                                            <option value="GET">GET</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                             
                                            <div class="composite-step" style="padding: 15px; background-color: #fff; border-radius: 4px; border: 1px solid #e9ecef;">
                                                <div class="composite-step-header" style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                                    <div style="font-weight: 500; color: #333;">步骤 3: 数据存储</div>
                                                    <div style="display: flex; gap: 10px;">
                                                        <button type="button" class="btn btn-sm btn-primary move-up-btn">上移</button>
                                                        <button type="button" class="btn btn-sm btn-primary move-down-btn">下移</button>
                                                    </div>
                                                </div>
                                                <div class="form-row" style="display: flex; gap: 15px; align-items: end;">
                                                    <div class="form-group" style="flex: 1;">
                                                        <label class="form-label">步骤类型</label>
                                                        <select class="form-control step-type">
                                                            <option value="">-- 选择类型 --</option>
                                                            <option value="function">函数运算</option>
                                                            <option value="interface">接口调用</option>
                                                            <option value="data" selected>数据操作</option>
                                                        </select>
                                                    </div>
                                                    <div class="form-group" style="flex: 1;">
                                                        <label class="form-label">配置名称</label>
                                                        <input type="text" class="form-control step-name" placeholder="请输入配置名称" value="保存到订单表">
                                                    </div>
                                                    <div class="form-group" style="width: 120px; display: flex; align-items: end;">
                                                        <button type="button" class="btn btn-danger remove-step-btn" style="width: 100%;">删除</button>
                                                    </div>
                                                </div>
                                                <div class="step-config" style="margin-top: 15px; padding: 10px; background-color: #f5f5f5; border-radius: 4px;">
                                                    <div class="form-group">
                                                        <label class="form-label" style="font-size: 14px; font-weight: 500;">数据配置</label>
                                                        <select class="form-control" style="font-size: 14px; margin-bottom: 8px;">
                                                            <option value="">-- 选择操作 --</option>
                                                            <option value="insert" selected>新增数据</option>
                                                            <option value="update">更新数据</option>
                                                            <option value="delete">删除数据</option>
                                                            <option value="query">查询数据</option>
                                                        </select>
                                                        <select class="form-control" style="font-size: 14px;">
                                                            <option value="">-- 选择表 --</option>
                                                            <option value="order" selected>订单表</option>
                                                            <option value="user">用户表</option>
                                                            <option value="project">项目表</option>
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <button type="button" id="add-step-btn" class="btn btn-primary" style="width: 100%; padding: 10px;">添加步骤</button>
                                    </div>
                                    
                                    <div class="form-group" style="margin-top: 20px;">
                                        <label class="form-label">执行设置</label>
                                        <div class="execution-settings">
                                            <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                                <input type="checkbox" id="stop-on-error" checked>
                                                <span>出错时停止执行</span>
                                            </label>
                                            <label style="display: flex; align-items: center; gap: 8px;">
                                                <input type="checkbox" id="log-execution">
                                                <span>记录执行日志</span>
                                            </label>
                                            <label style="display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                                                <input type="checkbox" id="rollback-on-error">
                                                <span>出错时回滚所有操作</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            break;
        // 其他节点类型的属性...
    }
    
    return html;
}

// 生成分支条件
function generateBranchConditions(count) {
    const container = document.querySelector('#branch-conditions');
    container.innerHTML = '';
    
    for (let i = 1; i <= count; i++) {
        const conditionDiv = document.createElement('div');
        conditionDiv.className = 'branch-condition';
        conditionDiv.style.marginBottom = '16px';
        conditionDiv.style.padding = '12px';
        conditionDiv.style.backgroundColor = '#f5f5f5';
        conditionDiv.style.borderRadius = '4px';
        
        conditionDiv.innerHTML = `
            <div class="form-group">
                <label class="form-label">分支 ${i}</label>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label class="form-label">字段</label>
                    <select class="form-control branch-field">
                        <option value="amount">金额</option>
                        <option value="department">部门</option>
                        <option value="project">项目</option>
                        <option value="status">状态</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">运算符</label>
                    <select class="form-control branch-operator">
                        <option value="eq">等于</option>
                        <option value="neq">不等于</option>
                        <option value="gt">大于</option>
                        <option value="gte">大于等于</option>
                        <option value="lt">小于</option>
                        <option value="lte">小于等于</option>
                        <option value="contains">包含</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">值</label>
                    <div class="value-input-group">
                        <input type="text" class="form-control branch-value" placeholder="请输入值">
                        <button class="btn btn-default function-select-btn" title="选择函数">f(x)</button>
                    </div>
                </div>
            </div>
        `;
        
        container.appendChild(conditionDiv);
    }
    
    // 监听分支数量变化
    document.querySelector('#branch-count').addEventListener('change', function() {
        const newCount = parseInt(this.value);
        generateBranchConditions(newCount);
    });
    
    // 绑定函数选择按钮事件
    const functionButtons = document.querySelectorAll('.function-select-btn');
    functionButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const input = this.previousElementSibling;
            showFunctionPanel(input);
        });
    });
}

// 加载可合并分支
function loadMergeableBranches() {
    const select = document.querySelector('#merge-branches');
    
    // 确保select存在
    if (!select) return;
    
    // 移除原有的所有选项
    select.innerHTML = '';
    
    // 添加默认选项，不依赖branchNodes的数据
    const defaultOptions = [
        { value: '1', text: '总监审批' },
        { value: '2', text: '其他情况' },
        { value: '3', text: '特殊情况' }
    ];
    
    defaultOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        select.appendChild(opt);
    });
}

// 加载节点现有属性
function loadNodeProperties(nodeType) {
    // 模拟加载节点属性数据
    if (selectedNode) {
        const nodeName = selectedNode.querySelector('.node-title').textContent;
        const nodeId = selectedNode.id;
        document.querySelector('#node-name').value = nodeName;
        
        // 根据节点类型加载特定属性
        // 这里应该从服务器或本地存储加载节点属性
        const nodeProperties = JSON.parse(localStorage.getItem('workflow_node_' + nodeId)) || {};
        
        // 如果有保存的业务节点数据，加载它们
        if (nodeType === 'business') {
            if (nodeProperties.interfaceConfig) {
                // 加载接口配置
                loadSavedInterfaceConfig(nodeProperties.interfaceConfig);
            }
            
            if (nodeProperties.dataConfig) {
                // 加载数据配置
                loadSavedDataConfig(nodeProperties.dataConfig);
            }
            
            if (nodeProperties.compositeConfig) {
                // 加载组合配置
                loadSavedCompositeConfig(nodeProperties.compositeConfig);
            }
        }
        
        // 如果是审批节点，加载审批操作配置
        if (nodeType === 'approval' && nodeProperties.approvalActions) {
            // 重置所有审批操作复选框
            document.querySelectorAll('input[name="approval-action"]').forEach(checkbox => {
                checkbox.checked = false;
            });
            
            // 设置保存的审批操作
            nodeProperties.approvalActions.forEach(action => {
                const checkbox = document.querySelector(`input[name="approval-action"][value="${action}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                }
            });
        }
    }
    
    // 绑定权限选择按钮事件
    bindPermissionSelectionEvents();
    
    // 绑定AI服务选择事件
    bindAIServiceSelectionEvents();
    
    // 初始化函数选择面板
    initFunctionPanel();
    
    // 初始化附加表单功能
    initAttachFormFunctionality();
    
    // 初始化自动处理功能
    initAutoProcessFunctionality();
    
    // 初始化业务节点功能
    if (nodeType === 'business') {
        // 初始化页签切换功能
        initBusinessNodeTabs();
        
        // 初始化接口配置功能
        initInterfaceConfig();
        
        // 初始化数据配置功能
        initDataConfig();
        
        // 初始化组合配置功能
        initCompositeConfig();
    }
}

// 初始化附加表单功能
function initAttachFormFunctionality() {
    // 监听附加表单复选框变化
    const attachFormCheckbox = document.querySelector('#attach-form');
    const attachFormContent = document.querySelector('#attach-form-content');
    
    if (attachFormCheckbox && attachFormContent) {
        attachFormCheckbox.addEventListener('change', function() {
            attachFormContent.style.display = this.checked ? 'block' : 'none';
        });
    }
    
    // 监听表单选择变化
    const formSelect = document.querySelector('#form-select');
    const fieldSettings = document.querySelector('#field-settings');
    
    if (formSelect && fieldSettings) {
        formSelect.addEventListener('change', function() {
            fieldSettings.style.display = this.value ? 'block' : 'none';
            
            // 根据选择的表单更新字段列表
            if (this.value) {
                updateFormFieldsBySelection(this.value);
            }
        });
    }
    
    // 移除添加字段设置按钮相关代码
}

// 根据选择的表单更新字段列表
function updateFormFieldsBySelection(formValue) {
    const formFieldsContainer = document.querySelector('#form-fields-container');
    if (!formFieldsContainer) return;
    
    // 清空现有字段设置
    formFieldsContainer.innerHTML = '';
    
    // 根据表单类型生成不同的字段列表
    let fields = [];
    
    switch(formValue) {
        case 'leave_form':
            fields = [
                { value: 'leave_type', text: '请假类型' },
                { value: 'start_date', text: '开始日期' },
                { value: 'end_date', text: '结束日期' },
                { value: 'leave_days', text: '请假天数' },
                { value: 'reason', text: '请假原因' }
            ];
            break;
        case 'expense_form':
            fields = [
                { value: 'expense_type', text: '费用类型' },
                { value: 'amount', text: '金额' },
                { value: 'expense_date', text: '发生日期' },
                { value: 'description', text: '费用说明' },
                { value: 'attachment', text: '附件' }
            ];
            break;
        case 'overtime_form':
            fields = [
                { value: 'overtime_date', text: '加班日期' },
                { value: 'start_time', text: '开始时间' },
                { value: 'end_time', text: '结束时间' },
                { value: 'hours', text: '加班时长' },
                { value: 'reason', text: '加班原因' }
            ];
            break;
        case 'custom':
            fields = [
                { value: 'custom_field1', text: '自定义字段1' },
                { value: 'custom_field2', text: '自定义字段2' },
                { value: 'custom_field3', text: '自定义字段3' }
            ];
            break;
        default:
            fields = [
                { value: 'field1', text: '字段1' },
                { value: 'field2', text: '字段2' },
                { value: 'field3', text: '字段3' }
            ];
    }
    
    // 添加字段设置
    fields.forEach(field => {
        addNewFieldSetting(field.value, field.text);
    });
}

// 添加新的字段设置行
function addNewFieldSetting(fieldValue = 'new_field', fieldText = '新字段') {
    const formFieldsContainer = document.querySelector('#form-fields-container');
    if (!formFieldsContainer) return;
    
    const rowId = `field-row-${Date.now()}`;
    const settingTr = document.createElement('tr');
    settingTr.className = 'form-field-setting';
    settingTr.innerHTML = `
        <td style="padding: 8px; border: 1px solid #ddd;">
            <span style="padding: 6px 0;">${fieldText}</span>
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            <input type="radio" name="permission-${rowId}" class="field-permission" value="read" checked>
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            <input type="radio" name="permission-${rowId}" class="field-permission" value="hide">
        </td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
            <input type="radio" name="permission-${rowId}" class="field-permission" value="edit">
        </td>
    `;
    
    formFieldsContainer.appendChild(settingTr);
}

// 初始化函数选择面板
function initFunctionPanel() {
    // 检查函数面板是否已存在，如果不存在则创建
    let functionPanel = document.querySelector('.function-panel');
    if (!functionPanel) {
        functionPanel = document.createElement('div');
        functionPanel.className = 'function-panel';
        functionPanel.style.display = 'none';
        functionPanel.style.position = 'absolute';
        functionPanel.style.backgroundColor = 'white';
        functionPanel.style.border = '1px solid #ddd';
        functionPanel.style.borderRadius = '4px';
        functionPanel.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
        functionPanel.style.zIndex = '1000';
        functionPanel.style.width = '300px';
        functionPanel.style.maxHeight = '300px';
        functionPanel.style.overflowY = 'auto';
        
        // 添加标题
        const panelHeader = document.createElement('div');
        panelHeader.style.padding = '10px 15px';
        panelHeader.style.borderBottom = '1px solid #eee';
        panelHeader.style.fontWeight = 'bold';
        panelHeader.textContent = '选择函数';
        functionPanel.appendChild(panelHeader);
        
        // 添加函数列表
        const functions = [
            { name: 'SUM()', desc: '求和' },
            { name: 'AVG()', desc: '平均值' },
            { name: 'MAX()', desc: '最大值' },
            { name: 'MIN()', desc: '最小值' },
            { name: 'COUNT()', desc: '计数' },
            { name: 'DATE()', desc: '日期' },
            { name: 'CONCAT()', desc: '连接文本' },
            { name: 'IF()', desc: '条件判断' },
            { name: 'NOW()', desc: '当前时间' },
            { name: 'USER()', desc: '当前用户' },
            { name: 'DEPT()', desc: '当前部门' },
            { name: 'GET()', desc: '获取字段值' }
        ];
        
        const functionList = document.createElement('div');
        functions.forEach(func => {
            const funcItem = document.createElement('div');
            funcItem.className = 'function-item';
            funcItem.style.padding = '8px 15px';
            funcItem.style.cursor = 'pointer';
            funcItem.style.borderBottom = '1px solid #f0f0f0';
            funcItem.innerHTML = `
                <div style="font-weight: bold;">${func.name}</div>
                <div style="font-size: 12px; color: #666;">${func.desc}</div>
            `;
            
            funcItem.addEventListener('mouseover', function() {
                this.style.backgroundColor = '#f5f5f5';
            });
            
            funcItem.addEventListener('mouseout', function() {
                this.style.backgroundColor = 'transparent';
            });
            
            funcItem.addEventListener('click', function() {
                insertFunctionIntoInput(func.name);
            });
            
            functionList.appendChild(funcItem);
        });
        
        functionPanel.appendChild(functionList);
        document.body.appendChild(functionPanel);
        
        // 点击页面其他地方关闭面板
        document.addEventListener('click', function(e) {
            if (!functionPanel.contains(e.target) && !e.target.classList.contains('function-select-btn')) {
                functionPanel.style.display = 'none';
            }
        });
    }
}

// 显示函数选择面板
function showFunctionPanel(inputElement) {
    // 存储当前选中的输入框
    window.currentFunctionInput = inputElement;
    
    // 获取函数面板
    const functionPanel = document.querySelector('.function-panel');
    
    // 计算面板显示位置
    const inputRect = inputElement.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    
    // 显示面板
    functionPanel.style.top = (inputRect.bottom + scrollY) + 'px';
    functionPanel.style.left = (inputRect.left + scrollX) + 'px';
    functionPanel.style.display = 'block';
}

// 插入函数到输入框
function insertFunctionIntoInput(functionName) {
    if (window.currentFunctionInput) {
        const input = window.currentFunctionInput;
        const start = input.selectionStart;
        const end = input.selectionEnd;
        const value = input.value;
        
        // 在光标位置插入函数
        input.value = value.substring(0, start) + functionName + value.substring(end);
        
        // 移动光标到函数括号内
        input.selectionStart = input.selectionEnd = start + functionName.indexOf('(') + 1;
        
        // 聚焦输入框
        input.focus();
        
        // 关闭面板
        document.querySelector('.function-panel').style.display = 'none';
    }
}

// 绑定权限选择按钮事件
function bindPermissionSelectionEvents() {
    // 指定人员选择按钮
    const selectPersonsButtons = document.querySelectorAll('button[id$="-persons"]');
    selectPersonsButtons.forEach(button => {
        button.addEventListener('click', function() {
            showSpecifiedPersonsPanel();
        });
    });
    
    // 组织结构选择按钮
    const selectOrgButtons = document.querySelectorAll('button[id$="-org"]');
    selectOrgButtons.forEach(button => {
        button.addEventListener('click', function() {
            showOrgStructurePanel();
        });
    });
    
    // 角色选择按钮
    const selectRoleButtons = document.querySelectorAll('button[id$="-role"]');
    selectRoleButtons.forEach(button => {
        button.addEventListener('click', function() {
            showRolePanel();
        });
    });
    
    // 业务结构选择按钮
    const selectBusinessButtons = document.querySelectorAll('button[id$="-business"]');
    selectBusinessButtons.forEach(button => {
        button.addEventListener('click', function() {
            showBusinessStructurePanel();
        });
    });
    
    // 处理组织内外类型选择与外部人员配置的显示/隐藏逻辑
    function handleOrgTypeSelection() {
        const externalConfig = document.getElementById('start-external-config');
        if (externalConfig) {
            const selectedType = document.querySelector('input[name="start-org-type"]:checked');
            if (selectedType && (selectedType.value === 'external' || selectedType.value === 'both')) {
                externalConfig.style.display = 'block';
            } else {
                externalConfig.style.display = 'none';
            }
        }
    }
    
    // 绑定组织内外类型选择事件
    const orgTypeRadios = document.querySelectorAll('input[name="start-org-type"]');
    orgTypeRadios.forEach(radio => {
        radio.addEventListener('change', handleOrgTypeSelection);
    });
    
    // 初始化时执行一次，确保显示正确
    handleOrgTypeSelection();
    
    // 处理通知指定人员复选框与人员选择表单的显示/隐藏逻辑
    function handleNotifySpecifiedSelection() {
        const notifyCheckbox = document.getElementById('start-notify-specified');
        const notifyConfig = document.getElementById('start-notify-specified-config');
        if (notifyCheckbox && notifyConfig) {
            notifyConfig.style.display = notifyCheckbox.checked ? 'block' : 'none';
        }
    }
    
    // 绑定通知指定人员复选框事件
    const notifyCheckbox = document.getElementById('start-notify-specified');
    if (notifyCheckbox) {
        notifyCheckbox.addEventListener('change', handleNotifySpecifiedSelection);
    }
    
    // 初始化时执行一次，确保显示正确
    handleNotifySpecifiedSelection();
}

// 绑定AI服务选择事件
function bindAIServiceSelectionEvents() {
    // 检查AI服务类型元素是否存在
    const aiServiceTypeElement = document.getElementById('ai-service-type');
    if (!aiServiceTypeElement) {
        return; // 如果元素不存在，直接返回
    }
    
    // 监听AI服务类型变化
    aiServiceTypeElement.addEventListener('change', function() {
        const serviceType = this.value;
        const serviceListSelect = document.getElementById('ai-service-list');
        
        if (!serviceListSelect) {
            return;
        }
        
        // 清空现有选项
        serviceListSelect.innerHTML = '';
        
        if (serviceType === '') {
            serviceListSelect.innerHTML = '<option value="">请先选择AI服务类型</option>';
            return;
        }
        
        // 根据服务类型加载对应的AI服务列表
        // 这里模拟从外部接口获取数据
        let serviceOptions = [];
        
        if (serviceType === 'model') {
            // 普通大模型
            serviceOptions = [
                { value: 'gpt-3', text: 'GPT-3.5' },
                { value: 'gpt-4', text: 'GPT-4' },
                { value: 'claude', text: 'Claude' },
                { value: 'llama', text: 'Llama 3' },
                { value: 'gemini', text: 'Gemini' }
            ];
        } else if (serviceType === 'agent') {
            // 已加工智能体
            serviceOptions = [
                { value: 'doc-analyzer', text: '文档分析智能体' },
                { value: 'report-generator', text: '报告生成智能体' },
                { value: 'data-analyst', text: '数据分析智能体' },
                { value: 'customer-service', text: '客户服务智能体' }
            ];
        } else if (serviceType === 'process-agent') {
            // 流程智能体
            serviceOptions = [
                { value: 'contract-review', text: '合同审核流程' },
                { value: 'leave-approval', text: '请假审批流程' },
                { value: 'expense-reimbursement', text: '费用报销流程' },
                { value: 'project-reporting', text: '项目汇报流程' }
            ];
        }
        
        // 添加默认选项
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = '请选择AI服务';
        serviceListSelect.appendChild(defaultOption);
        
        // 添加服务选项
        serviceOptions.forEach(option => {
            const opt = document.createElement('option');
            opt.value = option.value;
            opt.textContent = option.text;
            serviceListSelect.appendChild(opt);
        });
    });
}

// 显示指定人员面板
function showSpecifiedPersonsPanel() {
    document.querySelector('#specified-persons-panel').style.display = 'block';
}

// 显示组织结构面板
function showOrgStructurePanel() {
    document.querySelector('#org-structure-panel').style.display = 'block';
}

// 显示角色面板
function showRolePanel() {
    document.querySelector('#role-panel').style.display = 'block';
}

// 显示业务结构面板
function showBusinessStructurePanel() {
    document.querySelector('#business-structure-panel').style.display = 'block';
}

// 保存节点属性
function saveNodeProperties() {
    if (!selectedNode || !currentNodeId) {
        showMessage('请选择要编辑的节点', 'error');
        return;
    }
    
    // 获取节点类型
    const nodeType = selectedNode.dataset.nodeType;
    
    // 获取通用属性
    const nodeName = document.querySelector('#node-name').value;
    const nodeDescription = document.querySelector('#node-description').value;
    
    // 验证必填项
    if (!nodeName) {
        showMessage('节点名称不能为空', 'error');
        return;
    }
    
    // 更新节点显示
    selectedNode.querySelector('.node-title').textContent = nodeName;
    
    // 根据节点类型处理特定属性
    let nodeProperties = {
        id: currentNodeId,
        type: nodeType,
        name: nodeName,
        description: nodeDescription
    };
    
    // 处理不同节点类型的特定属性
    switch(nodeType) {
        case 'approval':
            nodeProperties.approvalMethod = document.querySelector('#approval-method').value;
            nodeProperties.approvalDeadline = document.querySelector('#approval-deadline').value;
            nodeProperties.autoProcess = document.querySelector('#auto-process').value;
            // 处理自动转办人员
            if (nodeProperties.autoProcess === 'auto-forward') {
                nodeProperties.forwardPersons = document.querySelector('#forward-persons').value;
            }
            // 处理审批操作选择
            const approvalActions = [];
            document.querySelectorAll('input[name="approval-action"]:checked').forEach(checkbox => {
                approvalActions.push(checkbox.value);
            });
            nodeProperties.approvalActions = approvalActions;
            // 处理审批人信息
            break;
        case 'task':
            nodeProperties.taskDeadline = document.querySelector('#task-deadline').value;
            // 处理办理人信息
            break;
        case 'branch':
            nodeProperties.branchCount = document.querySelector('#branch-count').value;
            // 处理分支条件
            const conditions = [];
            const branchConditions = document.querySelectorAll('.branch-condition');
            branchConditions.forEach(condition => {
                conditions.push({
                    field: condition.querySelector('.branch-field').value,
                    operator: condition.querySelector('.branch-operator').value,
                    value: condition.querySelector('.branch-value').value
                });
            });
            nodeProperties.conditions = conditions;
            // 应用分支数量变更
            applyBranchCount(parseInt(nodeProperties.branchCount));
            break;
        case 'merge':
            nodeProperties.mergeMethod = document.querySelector('#merge-method').value;
            // 获取选中的分支
            const selectedBranches = [];
            const selectedOptions = document.querySelectorAll('#merge-branches option:checked');
            selectedOptions.forEach(option => {
                selectedBranches.push(option.value);
            });
            nodeProperties.selectedBranches = selectedBranches;
            break;
        case 'start':
            // 处理发起人范围信息
            break;
        case 'business':
            // 获取当前选中的业务处理方式页签
            const activeTab = document.querySelector('.business-tabs .business-tab.active').dataset.tab;
            
            // 根据选中的页签处理对应配置
            if (activeTab === 'function') {
                nodeProperties.businessType = 'function';
                nodeProperties.functionConfig = {
                    functionId: document.querySelector('#function-select')?.value || '',
                    expression: document.querySelector('#function-expression')?.value || '',
                    variables: [] // 可以根据实际需要收集变量信息
                };
            } else if (activeTab === 'interface') {
                nodeProperties.businessType = 'interface';
                nodeProperties.interfaceConfig = {
                    interfaceId: document.querySelector('#interface-select')?.value || '',
                    method: document.querySelector('.interface-method')?.value || 'POST',
                    url: document.querySelector('.interface-url')?.value || '',
                    authType: document.querySelector('.interface-auth-type')?.value || 'none',
                    params: collectInterfaceParams(),
                    headers: collectRequestHeaders()
                };
            } else if (activeTab === 'data') {
                nodeProperties.businessType = 'data';
                nodeProperties.dataConfig = {
                    operation: document.getElementById('data-operation')?.value || 'insert',
                    dataSource: document.querySelector('.data-source')?.value || 'database',
                    table: document.querySelector('.data-table')?.value || '',
                    fields: collectDataFields(),
                    conditions: collectQueryConditions()
                };
            } else if (activeTab === 'composite') {
                nodeProperties.businessType = 'composite';
                nodeProperties.compositeConfig = {
                    steps: collectCompositeSteps(),
                    stopOnError: document.getElementById('stop-on-error')?.checked || true,
                    logExecution: document.getElementById('log-execution')?.checked || false,
                    rollbackOnError: document.getElementById('rollback-on-error')?.checked || false
                };
            }
            break;
        // 其他节点类型处理...
    }
    
    // 保存节点属性到本地存储（模拟保存到服务器）
    localStorage.setItem('workflow_node_' + currentNodeId, JSON.stringify(nodeProperties));
    
    showMessage('节点属性保存成功', 'success');
}

// 应用分支数量变更
function applyBranchCount(count) {
    if (!selectedNode) return;
    
    // 获取当前分支节点的行容器
    let branchRow = selectedNode.closest('.workflow-branch-row');
    if (!branchRow) return;
    
    // 获取当前分支数量
    const currentCount = branchRow.querySelectorAll('.branch-node-wrapper').length;
    
    // 如果数量相同，不需要变更
    if (currentCount === count) return;
    
    // 如果需要增加分支
    if (currentCount < count) {
        for (let i = currentCount; i < count; i++) {
            addBranchSubNode(branchRow, i + 1);
        }
    }
    // 如果需要减少分支
    else {
        const wrappers = branchRow.querySelectorAll('.branch-node-wrapper');
        for (let i = wrappers.length - 1; i >= count; i--) {
            wrappers[i].remove();
        }
    }
    
    // 更新连接线
    updateConnections();
}

// 添加分支子节点
function addBranchSubNode(branchRow, index) {
    const subNodeId = 'branch-sub-node-' + nodeIdCounter++;
    
    // 创建条件节点
    const conditionNode = document.createElement('div');
    conditionNode.className = 'workflow-node condition-node';
    conditionNode.dataset.nodeId = subNodeId;
    conditionNode.dataset.nodeType = 'condition';
    
    conditionNode.innerHTML = `
        <div class="node-header">
            <span class="node-type">条件节点</span>
            <div class="node-actions">
                <button class="node-action-btn edit-node" title="编辑">编辑</button>
                <button class="node-action-btn delete-node" title="删除">删除</button>
            </div>
        </div>
        <div class="node-title">条件 ${index}</div>
    `;
    
    // 创建添加节点按钮
    const addButton = document.createElement('div');
    addButton.className = 'branch-add-node';
    addButton.dataset.branchIndex = index;
    addButton.innerHTML = `
        <span class="add-node-icon">+</span>
        <span class="add-node-text">添加节点</span>
    `;
    
    // 创建分支节点包装器
    const wrapper = document.createElement('div');
    wrapper.className = 'branch-node-wrapper';
    wrapper.appendChild(conditionNode);
    wrapper.appendChild(addButton);
    
    // 添加到分支行
    branchRow.appendChild(wrapper);
    
    // 绑定事件
    bindNodeEvents(conditionNode);
    bindBranchAddNodeEvent(addButton);
}

// 绑定分支添加节点事件
function bindBranchAddNodeEvent(button) {
    button.addEventListener('click', function(e) {
        e.stopPropagation();
        const panel = document.querySelector('.node-type-panel');
        panel.dataset.branchIndex = this.dataset.branchIndex;
        
        // 获取按钮元素的位置信息
        const buttonRect = this.getBoundingClientRect();
        const canvasRect = document.querySelector('.workflow-canvas').getBoundingClientRect();
        
        // 计算面板应该显示的位置（在按钮上方）
        // 考虑页面滚动和容器偏移
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        // 面板显示在按钮上方
        panel.style.top = (buttonRect.top + scrollY - 10) + 'px';
        panel.style.left = (buttonRect.left + scrollX - 50) + 'px';
        panel.style.display = 'block';
    });
}

// 选择节点
function selectNode(node) {
    // 移除其他节点的选中状态
    const workflowNodes = document.querySelectorAll('.workflow-node');
    workflowNodes.forEach(workflowNode => {
        workflowNode.classList.remove('selected');
    });
    
    // 添加当前节点的选中状态
    node.classList.add('selected');
    
    // 显示节点属性面板
    showNodeProperties(node);
}

// 添加节点
function addNode(nodeType, nodeTypeName) {
    // 生成唯一节点ID
    const nodeId = 'node-' + nodeIdCounter++;
    
    // 检查是否有选中的节点作为参考位置
    let referenceNode = null;
    let insertPosition = 'bottom'; // 默认在最底部添加
    
    // 如果是在分支中添加节点
    const nodeTypePanel = document.querySelector('.node-type-panel');
    const branchIndex = nodeTypePanel.dataset.branchIndex;
    if (branchIndex !== undefined) {
        // 找到对应的分支添加按钮
        const addButtons = document.querySelectorAll(`.branch-add-node[data-branch-index="${branchIndex}"]`);
        if (addButtons.length > 0) {
            const addButton = addButtons[0];
            const wrapper = addButton.closest('.branch-node-wrapper');
            
            // 检查包装器中是否已有节点
            const existingNodes = wrapper.querySelectorAll('.workflow-node:not(.condition-node)');
            if (existingNodes.length > 0) {
                // 如果已有节点，在最后一个节点后添加
                referenceNode = existingNodes[existingNodes.length - 1];
                insertPosition = 'after';
            } else {
                // 如果没有节点，在条件节点后添加
                const conditionNode = wrapper.querySelector('.condition-node');
                if (conditionNode) {
                    referenceNode = conditionNode;
                    insertPosition = 'after';
                }
            }
        }
        // 清除分支索引
        delete nodeTypePanel.dataset.branchIndex;
    }
    
    // 根据节点类型处理特殊情况
    if (nodeType === 'branch') {
        // 分支节点需要特殊处理，创建分支行
        const branchRowId = 'branch-row-' + (Object.keys(branchNodes).length + 1);
        branchNodes[branchRowId] = true;
        
        // 创建分支行
        const branchRow = document.createElement('div');
        branchRow.className = 'workflow-branch-row';
        branchRow.id = branchRowId;
        
        // 添加到画布
        if (referenceNode && insertPosition === 'after') {
            referenceNode.parentNode.insertBefore(branchRow, referenceNode.nextSibling);
        } else {
            document.querySelector('.workflow-canvas').appendChild(branchRow);
        }
        
        // 添加两个默认分支
        addBranchSubNode(branchRow, 1);
        addBranchSubNode(branchRow, 2);
        
        // 创建合并节点
        const mergeNodeContainer = document.createElement('div');
        mergeNodeContainer.className = 'workflow-node-container';
        mergeNodeContainer.innerHTML = `
            <div class="workflow-node merge-node" data-node-id="merge-${nodeIdCounter++}" data-node-type="merge">
                <div class="node-header">
                    <span class="node-type">合并节点</span>
                    <div class="node-actions">
                        <button class="node-action-btn edit-node" title="编辑">编辑</button>
                        <button class="node-action-btn delete-node" title="删除">删除</button>
                    </div>
                </div>
                <div class="node-title">合并节点</div>
            </div>
        `;
        
        branchRow.parentNode.insertBefore(mergeNodeContainer, branchRow.nextSibling);
        
        // 绑定合并节点事件
        bindNodeEvents(mergeNodeContainer.querySelector('.workflow-node'));
    } else {
        // 普通节点处理
        const node = document.createElement('div');
        node.className = `workflow-node ${nodeType}-node`;
        node.dataset.nodeId = nodeId;
        node.dataset.nodeType = nodeType;
        
        node.innerHTML = `
            <div class="node-header">
                <span class="node-type">${nodeTypeName}</span>
                <div class="node-actions">
                    <button class="node-action-btn edit-node" title="编辑">编辑</button>
                    <button class="node-action-btn delete-node" title="删除">删除</button>
                </div>
            </div>
            <div class="node-title">${nodeTypeName}</div>
        `;
        
        // 绑定节点事件
        bindNodeEvents(node);
        
        // 添加到画布
        if (referenceNode && insertPosition === 'after') {
            // 检查参考节点是否在分支中
            const branchWrapper = referenceNode.closest('.branch-node-wrapper');
            if (branchWrapper) {
                // 在分支中添加节点
                referenceNode.parentNode.insertBefore(node, referenceNode.nextSibling);
            } else {
                // 不在分支中，创建新的节点容器
                const nodeContainer = document.createElement('div');
                nodeContainer.className = 'workflow-node-container';
                nodeContainer.appendChild(node);
                
                const referenceContainer = referenceNode.closest('.workflow-node-container');
                referenceContainer.parentNode.insertBefore(nodeContainer, referenceContainer.nextSibling);
            }
        } else {
            // 在最底部添加节点
            const nodeContainer = document.createElement('div');
            nodeContainer.className = 'workflow-node-container';
            nodeContainer.appendChild(node);
            document.querySelector('.workflow-canvas').appendChild(nodeContainer);
        }
    }
    
    // 更新连接线
    updateConnections();
}

// 绑定节点事件
function bindNodeEvents(node) {
    // 点击节点选择
    node.addEventListener('click', function(e) {
        if (!e.target.closest('.node-action-btn')) {
            selectNode(this);
        }
    });
    
    // 编辑节点按钮
    const editBtn = node.querySelector('.edit-node');
    if (editBtn) {
        editBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            showNodeProperties(node);
        });
    }
    
    // 删除节点按钮
    const deleteBtn = node.querySelector('.delete-node');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            deleteNode(node);
        });
    }
    
    // 拖动节点（简化版）
    node.addEventListener('mousedown', function(e) {
        if (!e.target.closest('.node-action-btn')) {
            // 开始拖动逻辑
        }
    });
}

// 删除节点
function deleteNode(node) {
    // 如果是分支节点，需要删除整个分支结构
    const nodeType = node.dataset.nodeType;
    
    if (nodeType === 'branch') {
        // 获取分支行和对应的合并节点
        const branchRow = node.closest('.workflow-branch-row');
        const nextElement = branchRow.nextElementSibling;
        let mergeNodeContainer = null;
        
        if (nextElement && nextElement.classList.contains('workflow-node-container')) {
            const mergeNode = nextElement.querySelector('.merge-node');
            if (mergeNode) {
                mergeNodeContainer = nextElement;
            }
        }
        
        // 删除分支行和合并节点
        branchRow.remove();
        if (mergeNodeContainer) {
            mergeNodeContainer.remove();
        }
        
        // 从分支节点列表中移除
        delete branchNodes[branchRow.id];
    } else if (nodeType === 'condition') {
        // 条件节点不能单独删除，需要删除整个分支
        showMessage('条件节点不能单独删除，请删除整个分支', 'error');
        return;
    } else if (nodeType === 'merge') {
        // 合并节点不能单独删除，需要删除整个分支
        showMessage('合并节点不能单独删除，请删除整个分支', 'error');
        return;
    } else {
        // 普通节点处理
        const nodeContainer = node.closest('.workflow-node-container');
        const branchWrapper = node.closest('.branch-node-wrapper');
        
        if (branchWrapper) {
            // 在分支中删除节点
            node.remove();
        } else if (nodeContainer) {
            // 删除整个节点容器
            nodeContainer.remove();
        }
    }
    
    // 隐藏属性面板
    hideNodeProperties();
    
    // 更新连接线
    updateConnections();
    
    showMessage('节点删除成功', 'success');
}

// 更新连接线（简化版，实际项目中可能需要更复杂的逻辑）
function updateConnections() {
    // 移除所有现有连接线
    const connectionLines = document.querySelectorAll('.connection-line');
    connectionLines.forEach(line => line.remove());
    
    // 在实际项目中，这里应该根据节点的位置和关系重新绘制连接线
}

// 创建普通连接线（预留接口，实际项目中可能需要根据具体需求实现）
function createRegularConnection(sourceNode, targetNode) {
    // 实际项目中应该根据节点位置计算连接线的路径
}

// 获取节点类型名称
function getNodeTypeName(nodeType) {
    const nodeTypeMap = {
        'start': '发起节点',
        'approval': '审批节点',
        'task': '办理节点',
        'cc': '抄送节点',
        'branch': '分支节点',
        'merge': '合并节点',
        'condition': '条件节点',
        'business': '业务节点',
        'ai': 'AI节点',
        'data': '数据节点',
        'macro': '宏节点',
        'end': '结束节点'
    };
    
    return nodeTypeMap[nodeType] || nodeType;
}

// 获取节点全名
function getNodeFullName(nodeType, nodeName) {
    return `${getNodeTypeName(nodeType)}: ${nodeName}`;
}

// 获取节点图标
function getNodeIcon(nodeType) {
    const nodeIconMap = {
        'start': '▶',
        'approval': '✓',
        'task': '✎',
        'cc': '📧',
        'branch': '↗',
        'merge': '↙',
        'condition': '?',
        'business': '📊',
        'ai': '🤖',
        'data': '💾',
        'macro': '⚙',
        'end': '■'
    };
    
    return nodeIconMap[nodeType] || '●';
}

// 保存工作流
function saveWorkflowAsDraft() {
    // 验证基本信息
    const workflowName = document.querySelector('#workflow-name').value;
    
    if (!workflowName) {
        showMessage('请输入工作流名称', 'error');
        return;
    }
    
    // 收集工作流数据
    const workflowData = {
        id: workflowId,
        name: workflowName,
        description: document.querySelector('#workflow-description').value,
        type: document.querySelector('#workflow-type').value,
        status: document.querySelector('#workflow-status').value,
        // 收集节点数据
        nodes: []
    };
    
    // 收集所有节点数据
    const workflowNodes = document.querySelectorAll('.workflow-node');
    workflowNodes.forEach(node => {
        const nodeId = node.dataset.nodeId;
        const nodeType = node.dataset.nodeType;
        const nodeName = node.querySelector('.node-title').textContent;
        
        workflowData.nodes.push({
            id: nodeId,
            type: nodeType,
            name: nodeName,
            // 其他节点属性
        });
    });
    
    // 在实际项目中，这里应该将数据发送到服务器保存
    console.log('保存工作流数据:', workflowData);
    
    showMessage('工作流保存成功', 'success');
}

// 保存并发布工作流
function saveAndPublishWorkflow() {
    // 验证工作流是否可以发布
    const nodeCount = document.querySelectorAll('.workflow-node').length;
    if (nodeCount < 2) {
        showMessage('工作流至少需要包含发起节点和一个其他节点', 'error');
        return;
    }
    
    // 检查是否有发起节点
    const hasStartNode = document.querySelectorAll('.start-node').length > 0;
    
    if (!hasStartNode) {
        showMessage('工作流必须包含发起节点', 'error');
        return;
    }
    
    // 保存工作流
    saveWorkflowAsDraft();
    
    // 在实际项目中，这里应该将工作流状态设置为已发布
    
    showMessage('工作流发布成功', 'success');
}

// 返回上一页
function goBack() {
    // 在实际项目中，这里应该返回到工作流列表页面
    window.history.back();
}

// 显示消息提示
function showMessage(message, type = 'info') {
    // 获取已有的消息元素
    const messageElement = document.querySelector('#message');
    
    // 设置消息内容和类型
    messageElement.textContent = message;
    
    // 移除所有类型类
    messageElement.className = 'message';
    
    // 添加当前类型类
    messageElement.classList.add(type);
    
    // 显示消息
    messageElement.style.display = 'block';
    messageElement.style.opacity = '1';
    messageElement.style.transition = 'opacity 0.5s ease';
    
    // 3秒后自动隐藏
    setTimeout(function() {
        messageElement.style.opacity = '0';
        
        setTimeout(function() {
            messageElement.style.display = 'none';
        }, 500);
    }, 3000);
}

// 初始化页签切换功能
function initTabSwitching() {
    // 权限范围页签切换
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('permission-tab')) {
            const tab = e.target;
            const tabGroup = tab.closest('.permission-tabs');
            const contentGroup = tabGroup.nextElementSibling.closest('.form-group');
            
            // 移除所有激活状态
            const tabs = tabGroup.querySelectorAll('.permission-tab');
            tabs.forEach(t => t.classList.remove('active'));
            
            const contents = contentGroup.querySelectorAll('.permission-content');
            contents.forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            
            // 添加当前激活状态
            tab.classList.add('active');
            const tabId = tab.dataset.tab;
            const activeContent = contentGroup.querySelector(`.permission-content[data-content="${tabId}"]`);
            if (activeContent) {
                activeContent.classList.add('active');
                activeContent.style.display = 'block';
            }
        }
    });
}

// 初始化业务结构树
function initBusinessTree() {
    // 业务结构树复选框处理
    document.addEventListener('change', function(e) {
        if (e.target.type === 'checkbox' && e.target.closest('.business-tree-node')) {
            const checkbox = e.target;
            const node = checkbox.closest('.business-tree-node');
            const children = node.querySelectorAll('.business-children input[type="checkbox"]');
            
            // 选中/取消选中所有子节点
            children.forEach(child => {
                child.checked = checkbox.checked;
            });
            
            // 更新父节点状态
            updateParentCheckbox(node.parentElement.closest('.business-tree-node'));
        }
    });
}

// 更新父节点复选框状态
function updateParentCheckbox(parentNode) {
    if (!parentNode) return;
    
    const parentCheckbox = parentNode.querySelector('input[type="checkbox"]');
    const children = parentNode.querySelectorAll('.business-children input[type="checkbox"]');
    
    let checkedCount = 0;
    children.forEach(child => {
        if (child.checked) checkedCount++;
    });
    
    if (checkedCount === 0) {
        parentCheckbox.checked = false;
        parentCheckbox.indeterminate = false;
    } else if (checkedCount === children.length) {
        parentCheckbox.checked = true;
        parentCheckbox.indeterminate = false;
    } else {
        parentCheckbox.checked = false;
        parentCheckbox.indeterminate = true;
    }
    
    // 递归更新父节点
    updateParentCheckbox(parentNode.parentElement.closest('.business-tree-node'));
}

// 处理合并节点选择
function handleMergeNodeSelection() {
    // 这里应该有处理合并节点选择的逻辑
}

// 处理分支节点条件配置
function handleBranchNodeConditions() {
    // 这里应该有处理分支节点条件配置的逻辑
}

// 隐藏指定人员面板
function hideSpecifiedPersonsPanel() {
    document.querySelector('#specified-persons-panel').style.display = 'none';
}

// 确认指定人员选择
function confirmSpecifiedPersons() {
    // 获取选中的人员
    const selectedPersons = [];
    const checkboxes = document.querySelectorAll('#specified-persons-panel input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedPersons.push(checkbox.nextElementSibling.textContent.trim());
    });
    
    // 填充到当前激活的权限选择框
    fillSelectedPermission(selectedPersons.join('; '));
    
    hideSpecifiedPersonsPanel();
}

// 隐藏组织结构面板
function hideOrgStructurePanel() {
    document.querySelector('#org-structure-panel').style.display = 'none';
}

// 确认组织结构选择
function confirmOrgStructure() {
    // 获取选中的部门
    const selectedOrgs = [];
    const checkboxes = document.querySelectorAll('#org-structure-panel input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedOrgs.push(checkbox.nextElementSibling.textContent.trim());
    });
    
    // 填充到当前激活的权限选择框
    fillSelectedPermission(selectedOrgs.join('; '));
    
    hideOrgStructurePanel();
}

// 隐藏角色面板
function hideRolePanel() {
    document.querySelector('#role-panel').style.display = 'none';
}

// 确认角色选择
function confirmRoles() {
    // 获取选中的角色
    const selectedRoles = [];
    const checkboxes = document.querySelectorAll('#role-panel input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedRoles.push(checkbox.nextElementSibling.textContent.trim());
    });
    
    // 填充到当前激活的权限选择框
    fillSelectedPermission(selectedRoles.join('; '));
    
    hideRolePanel();
}

// 隐藏业务结构面板
function hideBusinessStructurePanel() {
    document.querySelector('#business-structure-panel').style.display = 'none';
}

// 确认业务结构选择
function confirmBusinessStructure() {
    // 获取选中的业务结构
    const selectedBusiness = [];
    const checkboxes = document.querySelectorAll('#business-structure-panel input[type="checkbox"]:checked');
    checkboxes.forEach(checkbox => {
        selectedBusiness.push(checkbox.nextElementSibling.textContent.trim());
    });
    
    // 填充到当前激活的权限选择框
    fillSelectedPermission(selectedBusiness.join('; '));
    
    hideBusinessStructurePanel();
}

// 填充选中的权限到当前激活的输入框
function fillSelectedPermission(value) {
    // 找到当前激活的权限选择内容区域
    const activeContent = document.querySelector('.permission-content.active');
    if (activeContent) {
        const inputField = activeContent.querySelector('input[type="text"]');
        if (inputField) {
            inputField.value = value;
        }
    }
}

// 页面加载完成后初始化
window.addEventListener('DOMContentLoaded', function() {
    initApp();
    
    // 为特定的branch-add-node元素添加点击事件，使其可以选择节点类型
    const specificBranchAddNode = document.querySelector('.branch-add-node[data-branch-id="branch-2"][data-branch-index="1"][data-parent-node-id="condition-5"]');
    if (specificBranchAddNode) {
        bindBranchAddNodeEvent(specificBranchAddNode);
    }
    
    // 初始化业务节点页签切换功能
    initBusinessTabFunctionality();
});

// 初始化业务节点页签切换功能
function initBusinessTabFunctionality() {
    // 监听页签点击事件
    document.addEventListener('click', function(e) {
        // 检查是否点击了业务节点页签
        if (e.target.classList.contains('business-tab')) {
            const tab = e.target;
            const tabId = tab.dataset.tab;
            const tabsContainer = tab.parentElement;
            const contentContainer = tabsContainer.nextElementSibling;
            
            // 移除所有页签的active状态
            const tabs = tabsContainer.querySelectorAll('.business-tab');
            tabs.forEach(t => t.classList.remove('active'));
            
            // 添加当前页签的active状态
            tab.classList.add('active');
            
            // 隐藏所有内容区域
            const contents = contentContainer.querySelectorAll('.business-content');
            contents.forEach(c => c.classList.remove('active'));
            
            // 显示当前页签对应的内容区域
            const currentContent = contentContainer.querySelector(`.business-content[data-content="${tabId}"]`);
            if (currentContent) {
                currentContent.classList.add('active');
            }
        }
        
        // 检查是否点击了添加步骤按钮
        if (e.target.id === 'add-step-btn' || e.target.closest('#add-step-btn')) {
            const stepsContainer = document.getElementById('composite-steps');
            const newStep = createNewCompositeStep();
            stepsContainer.appendChild(newStep);
        }
    });
    
    // 函数配置 - 自定义值输入框显示/隐藏逻辑
    initFunctionParamCustomValueToggle();
    
    // 函数配置 - 函数预览功能
    initFunctionPreview();
    
    // 接口配置 - 参数添加/删除功能
    initInterfaceParams();
    
    // 接口配置 - 参数值类型切换逻辑
    initInterfaceParamValueToggle();
    
    // 接口配置 - 认证方式切换逻辑
    initInterfaceAuthToggle();
    
    // 数据配置 - 字段添加/删除功能
    initDataFields();
    
    // 数据配置 - 字段值类型切换逻辑
    initDataFieldValueToggle();
    
    // 数据配置 - 查询条件区域显示/隐藏逻辑
    initDataOperationToggle();
}

// 函数参数自定义值输入框显示/隐藏逻辑
function initFunctionParamCustomValueToggle() {
    // 这个函数在新的界面设计中已经不需要了
    console.log('Function parameter custom value toggle is deprecated');
}

// 函数预览功能初始化
function initFunctionPreview() {
    const functionExpression = document.getElementById('function-expression');
    const functionResult = document.querySelector('.function-result');
    
    if (functionExpression) {
        functionExpression.addEventListener('input', updateFunctionPreview);
    }
    
    if (functionResult) {
        functionResult.addEventListener('change', updateFunctionPreview);
    }
    
    // 初始化函数插入功能
    initFunctionInsertTool();
    
    // 初始化字段插入功能
    initFieldInsertTool();
}

// 初始化函数插入工具
function initFunctionInsertTool() {
    const insertFunctionBtn = document.getElementById('insert-function-btn');
    const insertFunctionSelect = document.getElementById('insert-function');
    const functionExpression = document.getElementById('function-expression');
    
    if (insertFunctionBtn && insertFunctionSelect && functionExpression) {
        insertFunctionBtn.addEventListener('click', function() {
            const selectedFunction = insertFunctionSelect.value;
            if (selectedFunction) {
                let functionText = '';
                
                switch(selectedFunction) {
                    case 'add':
                        functionText = '+';
                        break;
                    case 'subtract':
                        functionText = '-';
                        break;
                    case 'multiply':
                        functionText = '*';
                        break;
                    case 'divide':
                        functionText = '/';
                        break;
                    case 'sum':
                        functionText = 'sum()';
                        break;
                    case 'average':
                        functionText = 'average()';
                        break;
                    case 'max':
                        functionText = 'max()';
                        break;
                    case 'min':
                        functionText = 'min()';
                        break;
                }
                
                // 在光标位置插入函数
                insertAtCursor(functionExpression, functionText);
                
                // 触发预览更新
                updateFunctionPreview();
            }
        });
    }
}

// 初始化字段插入工具
function initFieldInsertTool() {
    const insertFieldBtn = document.getElementById('insert-field-btn');
    const insertFieldSelect = document.getElementById('insert-field');
    const functionExpression = document.getElementById('function-expression');
    
    if (insertFieldBtn && insertFieldSelect && functionExpression) {
        insertFieldBtn.addEventListener('click', function() {
            const selectedField = insertFieldSelect.value;
            if (selectedField) {
                // 在光标位置插入字段
                insertAtCursor(functionExpression, selectedField);
                
                // 触发预览更新
                updateFunctionPreview();
            }
        });
    }
}

// 在光标位置插入文本
function insertAtCursor(element, text) {
    const startPos = element.selectionStart;
    const endPos = element.selectionEnd;
    const scrollTop = element.scrollTop;
    
    element.value = element.value.substring(0, startPos) + text + element.value.substring(endPos, element.value.length);
    element.focus();
    element.selectionStart = element.selectionEnd = startPos + text.length;
    element.scrollTop = scrollTop;
}

// 更新函数预览
function updateFunctionPreview() {
    const functionExpression = document.getElementById('function-expression');
    const functionResult = document.querySelector('.function-result');
    const previewElement = document.getElementById('function-preview');
    
    if (!functionExpression || !previewElement) return;
    
    let previewText = '';
    
    // 获取表达式内容和结果字段
    const expression = functionExpression.value.trim();
    
    if (expression) {
        // 如果已经有表达式，直接使用
        previewText = expression;
        
        // 如果同时选择了结果存储字段，并且表达式中不包含赋值操作，则添加赋值
        if (functionResult && functionResult.value && !expression.includes('=')) {
            const resultField = functionResult.options[functionResult.selectedIndex].text;
            previewText = `${resultField} = ${expression}`;
        }
    } else if (functionResult && functionResult.value) {
        // 如果只有结果字段，显示提示
        const resultField = functionResult.options[functionResult.selectedIndex].text;
        previewText = `${resultField} = [请输入表达式]`;
    } else {
        // 两者都没有，显示空提示
        previewText = '[请输入函数表达式并选择结果存储字段]';
    }
    
    previewElement.textContent = previewText;
}

// 接口参数添加/删除功能
function initInterfaceParams() {
    const addParamBtn = document.getElementById('add-interface-param-btn');
    if (addParamBtn) {
        addParamBtn.addEventListener('click', function() {
            const paramsContainer = document.getElementById('interface-params-container');
            const newParamRow = createInterfaceParamRow();
            paramsContainer.appendChild(newParamRow);
        });
    }
    
    // 删除参数事件委托
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-param-btn')) {
            const paramRow = event.target.closest('.param-row');
            if (paramRow) {
                paramRow.remove();
            }
        }
    });
}

// 创建接口参数行
function createInterfaceParamRow() {
    const tr = document.createElement('tr');
    tr.className = 'param-row';
    
    tr.innerHTML = `
        <td style="padding: 10px; border: 1px solid #e9ecef;">
            <input type="text" class="form-control interface-param-name" placeholder="参数名">
        </td>
        <td style="padding: 10px; border: 1px solid #e9ecef;">
            <select class="form-control interface-param-value-type">
                <option value="field">表单字段</option>
                <option value="constant">常量值</option>
                <option value="variable">流程变量</option>
            </select>
            <div class="interface-param-value-container">
                <select class="form-control interface-param-value field-option">
                    <option value="">-- 选择字段 --</option>
                    <option value="amount">金额</option>
                    <option value="days">天数</option>
                    <option value="project_id">项目ID</option>
                    <option value="user_id">用户ID</option>
                </select>
                <input type="text" class="form-control interface-param-value constant-option" placeholder="输入常量值" style="display: none;">
                <select class="form-control interface-param-value variable-option" style="display: none;">
                    <option value="">-- 选择变量 --</option>
                    <option value="current_user">当前用户</option>
                    <option value="current_time">当前时间</option>
                    <option value="workflow_id">流程ID</option>
                </select>
            </div>
        </td>
        <td style="padding: 10px; border: 1px solid #e9ecef; text-align: center;">
            <button type="button" class="btn btn-danger remove-param-btn" style="padding: 4px 8px;">删除</button>
        </td>
    `;
    
    return tr;
}

// 接口参数值类型切换逻辑
function initInterfaceParamValueToggle() {
    document.addEventListener('change', function(event) {
        if (event.target.classList.contains('interface-param-value-type')) {
            const typeSelect = event.target;
            const container = typeSelect.nextElementSibling;
            const fieldOption = container.querySelector('.field-option');
            const constantOption = container.querySelector('.constant-option');
            const variableOption = container.querySelector('.variable-option');
            
            // 隐藏所有选项
            fieldOption.style.display = 'none';
            constantOption.style.display = 'none';
            variableOption.style.display = 'none';
            
            // 显示选中的选项
            if (typeSelect.value === 'field') {
                fieldOption.style.display = 'block';
            } else if (typeSelect.value === 'constant') {
                constantOption.style.display = 'block';
            } else if (typeSelect.value === 'variable') {
                variableOption.style.display = 'block';
            }
        }
    });
}

// 接口认证方式切换逻辑
function initInterfaceAuthToggle() {
    const authTypeSelect = document.querySelector('.interface-auth-type');
    const authConfigContainer = document.querySelector('.auth-config-container');
    
    if (authTypeSelect && authConfigContainer) {
        authTypeSelect.addEventListener('change', function() {
            if (authTypeSelect.value === 'none') {
                authConfigContainer.style.display = 'none';
            } else {
                authConfigContainer.style.display = 'block';
                
                // 根据认证类型生成不同的配置表单
                let authConfigHTML = '';
                
                if (authTypeSelect.value === 'basic') {
                    authConfigHTML = `
                        <div class="form-row" style="display: flex; gap: 15px;">
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">用户名</label>
                                <input type="text" class="form-control basic-auth-username" placeholder="请输入用户名">
                            </div>
                            <div class="form-group" style="flex: 1;">
                                <label class="form-label">密码</label>
                                <input type="password" class="form-control basic-auth-password" placeholder="请输入密码">
                            </div>
                        </div>
                    `;
                } else if (authTypeSelect.value === 'token') {
                    authConfigHTML = `
                        <div class="form-group">
                            <label class="form-label">Token</label>
                            <input type="text" class="form-control token-auth-token" placeholder="请输入Token">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Token类型</label>
                            <select class="form-control token-auth-type">
                                <option value="Bearer" selected>Bearer</option>
                                <option value="Basic">Basic</option>
                                <option value="Custom">自定义</option>
                            </select>
                        </div>
                    `;
                } else if (authTypeSelect.value === 'oauth2') {
                    authConfigHTML = `
                        <div class="form-group">
                            <label class="form-label">Access Token</label>
                            <input type="text" class="form-control oauth2-access-token" placeholder="请输入Access Token">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Token类型</label>
                            <select class="form-control oauth2-token-type">
                                <option value="Bearer" selected>Bearer</option>
                            </select>
                        </div>
                    `;
                }
                
                authConfigContainer.innerHTML = authConfigHTML;
            }
        });
    }
}

// 数据字段添加/删除功能
function initDataFields() {
    const addFieldBtn = document.getElementById('add-data-field-btn');
    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', function() {
            const fieldsContainer = document.getElementById('data-fields-container');
            const newFieldRow = createDataFieldRow();
            fieldsContainer.appendChild(newFieldRow);
        });
    }
    
    // 删除字段事件委托
    document.addEventListener('click', function(event) {
        if (event.target.classList.contains('remove-field-btn')) {
            const fieldRow = event.target.closest('.field-row');
            if (fieldRow) {
                fieldRow.remove();
            }
        }
    });
}

// 创建数据字段行
function createDataFieldRow() {
    const tr = document.createElement('tr');
    tr.className = 'field-row';
    
    tr.innerHTML = `
        <td style="padding: 10px; border: 1px solid #e9ecef;">
            <input type="text" class="form-control data-field-name" placeholder="字段名">
        </td>
        <td style="padding: 10px; border: 1px solid #e9ecef;">
            <select class="form-control data-field-value-type">
                <option value="field">表单字段</option>
                <option value="constant">常量值</option>
                <option value="variable">流程变量</option>
                <option value="function">函数计算</option>
            </select>
            <div class="data-field-value-container">
                <select class="form-control data-field-value field-option">
                    <option value="">-- 选择字段 --</option>
                    <option value="amount">金额</option>
                    <option value="days">天数</option>
                    <option value="project_id">项目ID</option>
                    <option value="user_id">用户ID</option>
                </select>
                <input type="text" class="form-control data-field-value constant-option" placeholder="输入常量值" style="display: none;">
                <select class="form-control data-field-value variable-option" style="display: none;">
                    <option value="">-- 选择变量 --</option>
                    <option value="current_user">当前用户</option>
                    <option value="current_time">当前时间</option>
                    <option value="workflow_id">流程ID</option>
                </select>
                <select class="form-control data-field-value function-option" style="display: none;">
                    <option value="">-- 选择函数 --</option>
                    <option value="sum">求和</option>
                    <option value="average">平均值</option>
                    <option value="max">最大值</option>
                    <option value="min">最小值</option>
                    <option value="now">当前时间</option>
                </select>
            </div>
        </td>
        <td style="padding: 10px; border: 1px solid #e9ecef; text-align: center;">
            <button type="button" class="btn btn-danger remove-field-btn" style="padding: 4px 8px;">删除</button>
        </td>
    `;
    
    return tr;
}

// 数据字段值类型切换逻辑
function initDataFieldValueToggle() {
    document.addEventListener('change', function(event) {
        if (event.target.classList.contains('data-field-value-type')) {
            const typeSelect = event.target;
            const container = typeSelect.nextElementSibling;
            const fieldOption = container.querySelector('.field-option');
            const constantOption = container.querySelector('.constant-option');
            const variableOption = container.querySelector('.variable-option');
            const functionOption = container.querySelector('.function-option');
            
            // 隐藏所有选项
            fieldOption.style.display = 'none';
            constantOption.style.display = 'none';
            variableOption.style.display = 'none';
            functionOption.style.display = 'none';
            
            // 显示选中的选项
            if (typeSelect.value === 'field') {
                fieldOption.style.display = 'block';
            } else if (typeSelect.value === 'constant') {
                constantOption.style.display = 'block';
            } else if (typeSelect.value === 'variable') {
                variableOption.style.display = 'block';
            } else if (typeSelect.value === 'function') {
                functionOption.style.display = 'block';
            }
        }
    });
}

// 数据操作类型切换逻辑（查询条件显示/隐藏）
function initDataOperationToggle() {
    const dataOperationSelect = document.getElementById('data-operation');
    const queryConditionsContainer = document.getElementById('query-conditions-container');
    
    if (dataOperationSelect && queryConditionsContainer) {
        dataOperationSelect.addEventListener('change', function() {
            if (dataOperationSelect.value === 'query' || dataOperationSelect.value === 'update' || dataOperationSelect.value === 'delete') {
                queryConditionsContainer.style.display = 'block';
            } else {
                queryConditionsContainer.style.display = 'none';
            }
        });
    }

    // 查询条件添加按钮事件监听
    const addConditionBtn = document.getElementById('add-condition-btn');
    if (addConditionBtn) {
        addConditionBtn.addEventListener('click', function() {
            const conditionsContainer = document.querySelector('.query-conditions');
            const newCondition = createQueryCondition();
            conditionsContainer.appendChild(newCondition);
        });
    }
}

// 创建查询条件
function createQueryCondition() {
    const conditionDiv = document.createElement('div');
    conditionDiv.className = 'query-condition';
    conditionDiv.style = 'display: flex; gap: 10px; margin-bottom: 10px; align-items: end;';
    
    conditionDiv.innerHTML = `
        <div class="form-group" style="flex: 1;">
            <label class="form-label">字段</label>
            <select class="form-control condition-field">
                <option value="">-- 选择字段 --</option>
                <option value="amount">金额</option>
                <option value="days">天数</option>
                <option value="project_id">项目ID</option>
                <option value="user_id">用户ID</option>
            </select>
        </div>
        <div class="form-group" style="flex: 1;">
            <label class="form-label">运算符</label>
            <select class="form-control condition-operator">
                <option value="eq" selected>=</option>
                <option value="neq">≠</option>
                <option value="gt">></option>
                <option value="gte">≥</option>
                <option value="lt"><</option>
                <option value="lte">≤</option>
                <option value="like">包含</option>
                <option value="in">在列表中</option>
            </select>
        </div>
        <div class="form-group" style="flex: 1;">
            <label class="form-label">值</label>
            <input type="text" class="form-control condition-value" placeholder="请输入值">
        </div>
        <div class="form-group" style="width: 80px; display: flex; align-items: end;">
            <button type="button" class="btn btn-danger remove-condition-btn" style="width: 100%;">删除</button>
        </div>
    `;
    
    // 添加删除按钮事件
    const removeBtn = conditionDiv.querySelector('.remove-condition-btn');
    removeBtn.addEventListener('click', function() {
        conditionDiv.remove();
    });
    
    return conditionDiv;
}

// 创建新的组合步骤
function createNewCompositeStep() {
    const stepDiv = document.createElement('div');
    stepDiv.className = 'composite-step';
    stepDiv.innerHTML = `
        <div class="form-row" style="display: flex; gap: 10px;">
            <div class="form-group" style="flex: 1;">
                <label class="form-label">步骤类型</label>
                <select class="form-control step-type">
                    <option value="">-- 选择类型 --</option>
                    <option value="function">函数运算</option>
                    <option value="interface">接口调用</option>
                    <option value="data">数据操作</option>
                </select>
            </div>
            <div class="form-group" style="flex: 1;">
                <label class="form-label">配置名称</label>
                <input type="text" class="form-control step-name" placeholder="请输入配置名称">
            </div>
            <div class="form-group" style="width: 60px; display: flex; align-items: end;">
                <button type="button" class="btn btn-danger remove-step-btn" style="padding: 4px 8px; height: 32px;">删除</button>
            </div>
        </div>
    `;
    
    // 添加删除按钮事件
    const removeBtn = stepDiv.querySelector('.remove-step-btn');
    removeBtn.addEventListener('click', function() {
        stepDiv.remove();
    });
    
    return stepDiv;
}

// 初始化业务节点的页签切换功能
function initBusinessNodeTabs() {
    const businessTabs = document.querySelectorAll('.business-tab');
    const businessContents = document.querySelectorAll('.business-content');
    
    if (businessTabs.length && businessContents.length) {
        businessTabs.forEach(tab => {
            tab.addEventListener('click', function() {
                // 移除所有标签的选中状态
                businessTabs.forEach(t => t.classList.remove('active'));
                // 添加当前标签的选中状态
                this.classList.add('active');
                
                // 隐藏所有内容
                businessContents.forEach(content => content.style.display = 'none');
                // 显示对应内容
                const contentId = this.getAttribute('data-tab');
                const activeContent = document.querySelector(`.business-content[data-content="${contentId}"]`);
                if (activeContent) {
                    activeContent.style.display = 'block';
                }
            });
        });
        
        // 默认显示第一个标签
        if (businessTabs.length > 0) {
            businessTabs[0].click();
        }
    }
}

// 初始化接口配置功能
function initInterfaceConfig() {
    // 接口选择事件
    const interfaceSelect = document.getElementById('interface-select');
    const interfaceConfig = document.getElementById('interface-config');
    
    if (interfaceSelect && interfaceConfig) {
        interfaceSelect.addEventListener('change', function() {
            if (this.value) {
                interfaceConfig.style.display = 'block';
                // 这里可以根据选择的接口加载预设配置
                loadInterfacePresetConfig(this.value);
            } else {
                interfaceConfig.style.display = 'none';
            }
        });
    }
    
    // 请求方式切换事件
    const methodSelects = document.querySelectorAll('.interface-method');
    methodSelects.forEach(select => {
        select.addEventListener('change', function() {
            // 根据请求方式调整UI或逻辑
            adjustUIByMethod(this.value);
        });
    });
    
    // 认证方式切换事件
    const authTypeSelects = document.querySelectorAll('.interface-auth-type');
    authTypeSelects.forEach(select => {
        select.addEventListener('change', function() {
            const authConfigContainer = this.parentElement.querySelector('.auth-config-container');
            if (authConfigContainer) {
                if (this.value !== 'none') {
                    authConfigContainer.style.display = 'block';
                    // 加载对应认证方式的配置
                    loadAuthConfig(this.value, authConfigContainer);
                } else {
                    authConfigContainer.style.display = 'none';
                }
            }
        });
    });
    
    // 添加接口参数按钮事件
    const addParamBtn = document.getElementById('add-interface-param-btn');
    if (addParamBtn) {
        addParamBtn.addEventListener('click', function() {
            const paramsContainer = document.getElementById('interface-params-container');
            if (paramsContainer) {
                const newParamRow = createNewInterfaceParamRow();
                paramsContainer.appendChild(newParamRow);
                // 绑定新行的值类型切换事件
                bindInterfaceParamTypeChange(newParamRow);
            }
        });
    }
    
    // 绑定已有的参数行值类型切换事件
    const existingParamRows = document.querySelectorAll('.param-row');
    existingParamRows.forEach(row => {
        bindInterfaceParamTypeChange(row);
    });
    
    // 删除参数按钮事件
    document.querySelectorAll('.remove-param-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('.param-row');
            if (row && row.parentNode.children.length > 1) {
                row.remove();
            }
        });
    });
    
    // 添加Header按钮事件
    const addHeaderBtn = document.getElementById('add-header-btn');
    if (addHeaderBtn) {
        addHeaderBtn.addEventListener('click', function() {
            const headersTable = document.querySelector('#request-headers-container table tbody');
            if (headersTable) {
                const newHeaderRow = createNewHeaderRow();
                headersTable.appendChild(newHeaderRow);
                // 绑定删除按钮事件
                newHeaderRow.querySelector('.remove-header-btn').addEventListener('click', function() {
                    if (headersTable.children.length > 1) {
                        newHeaderRow.remove();
                    }
                });
            }
        });
    }
    
    // 绑定已有的删除Header按钮事件
    document.querySelectorAll('.remove-header-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('tr');
            const tbody = row.parentNode;
            if (tbody.children.length > 1) {
                row.remove();
            }
        });
    });
}

// 创建新的接口参数行
function createNewInterfaceParamRow() {
    const tr = document.createElement('tr');
    tr.className = 'param-row';
    tr.innerHTML = `
        <td style="padding: 10px; border: 1px solid #e9ecef;">
            <input type="text" class="form-control interface-param-name" placeholder="参数名">
        </td>
        <td style="padding: 10px; border: 1px solid #e9ecef;">
            <select class="form-control interface-param-value-type">
                <option value="field" selected>表单字段</option>
                <option value="constant">常量值</option>
                <option value="variable">流程变量</option>
            </select>
            <div class="interface-param-value-container">
                <select class="form-control interface-param-value field-option">
                    <option value="">-- 选择字段 --</option>
                    <option value="amount">金额</option>
                    <option value="days">天数</option>
                    <option value="project_id">项目ID</option>
                    <option value="user_id">用户ID</option>
                </select>
                <input type="text" class="form-control interface-param-value constant-option" placeholder="输入常量值" style="display: none;">
                <select class="form-control interface-param-value variable-option" style="display: none;">
                    <option value="">-- 选择变量 --</option>
                    <option value="current_user">当前用户</option>
                    <option value="current_time">当前时间</option>
                    <option value="workflow_id">流程ID</option>
                </select>
            </div>
        </td>
        <td style="padding: 10px; border: 1px solid #e9ecef; text-align: center;">
            <button type="button" class="btn btn-danger remove-param-btn" style="padding: 4px 8px;">删除</button>
        </td>
    `;
    
    // 绑定删除按钮事件
    tr.querySelector('.remove-param-btn').addEventListener('click', function() {
        const parentNode = tr.parentNode;
        if (parentNode.children.length > 1) {
            tr.remove();
        }
    });
    
    return tr;
}

// 绑定接口参数值类型切换事件
function bindInterfaceParamTypeChange(row) {
    const typeSelect = row.querySelector('.interface-param-value-type');
    const fieldOption = row.querySelector('.field-option');
    const constantOption = row.querySelector('.constant-option');
    const variableOption = row.querySelector('.variable-option');
    
    if (typeSelect && fieldOption && constantOption && variableOption) {
        typeSelect.addEventListener('change', function() {
            fieldOption.style.display = 'none';
            constantOption.style.display = 'none';
            variableOption.style.display = 'none';
            
            if (this.value === 'field') {
                fieldOption.style.display = 'block';
            } else if (this.value === 'constant') {
                constantOption.style.display = 'block';
            } else if (this.value === 'variable') {
                variableOption.style.display = 'block';
            }
        });
    }
}

// 创建新的请求头行
function createNewHeaderRow() {
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td style="padding: 10px; border: 1px solid #e9ecef;">
            <input type="text" class="form-control header-name" placeholder="Header名称">
        </td>
        <td style="padding: 10px; border: 1px solid #e9ecef;">
            <input type="text" class="form-control header-value" placeholder="Header值">
        </td>
        <td style="padding: 10px; border: 1px solid #e9ecef; text-align: center;">
            <button type="button" class="btn btn-danger remove-header-btn" style="padding: 4px 8px;">删除</button>
        </td>
    `;
    
    return tr;
}

// 根据接口选择加载预设配置
function loadInterfacePresetConfig(interfaceId) {
    // 这里可以根据接口ID加载预设的接口配置
    // 例如：URL、请求方式、参数等
    
    const interfaceConfigs = {
        'financial_api': {
            url: '/api/financial',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer {token}'
            }
        },
        'hr_api': {
            url: '/api/hr',
            method: 'GET',
            headers: {
                'Accept': 'application/json'
            }
        },
        'project_api': {
            url: '/api/project',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        },
        'document_api': {
            url: '/api/document',
            method: 'GET',
            headers: {
                'Accept': 'application/pdf'
            }
        }
    };
    
    const config = interfaceConfigs[interfaceId];
    if (config) {
        const methodSelect = document.querySelector('.interface-method');
        const urlInput = document.querySelector('.interface-url');
        
        if (methodSelect) {
            methodSelect.value = config.method;
        }
        
        if (urlInput) {
            urlInput.value = config.url;
        }
        
        // 如果有预设的请求头，可以更新请求头表格
        if (config.headers) {
            const headersTable = document.querySelector('#request-headers-container table tbody');
            if (headersTable) {
                // 清空现有的请求头（除了第一个行）
                while (headersTable.children.length > 1) {
                    headersTable.removeChild(headersTable.lastChild);
                }
                
                // 添加预设的请求头
                let isFirst = true;
                for (const [name, value] of Object.entries(config.headers)) {
                    let row;
                    if (isFirst && headersTable.children.length > 0) {
                        // 使用第一个行
                        row = headersTable.children[0];
                        isFirst = false;
                    } else {
                        // 创建新行
                        row = createNewHeaderRow();
                        headersTable.appendChild(row);
                        // 绑定删除按钮事件
                        row.querySelector('.remove-header-btn').addEventListener('click', function() {
                            if (headersTable.children.length > 1) {
                                row.remove();
                            }
                        });
                    }
                    
                    // 设置请求头名称和值
                    const nameInput = row.querySelector('.header-name');
                    const valueInput = row.querySelector('.header-value');
                    
                    if (nameInput) {
                        nameInput.value = name;
                    }
                    
                    if (valueInput) {
                        valueInput.value = value;
                    }
                }
            }
        }
    }
}

// 根据请求方式调整UI
function adjustUIByMethod(method) {
    // 这里可以根据请求方式调整UI，例如GET请求隐藏请求体配置等
    // 简单示例：GET请求可能需要显示查询参数配置，POST请求可能需要显示请求体配置
}

// 加载认证配置
function loadAuthConfig(authType, container) {
    // 根据认证类型生成不同的认证配置界面
    const authTemplates = {
        'basic': `
            <div class="form-group">
                <label class="form-label">用户名</label>
                <input type="text" class="form-control auth-username" placeholder="请输入用户名">
            </div>
            <div class="form-group">
                <label class="form-label">密码</label>
                <input type="password" class="form-control auth-password" placeholder="请输入密码">
            </div>
        `,
        'token': `
            <div class="form-group">
                <label class="form-label">Token</label>
                <input type="text" class="form-control auth-token" placeholder="请输入Token">
            </div>
            <div class="form-group">
                <label class="form-label">Token类型</label>
                <select class="form-control auth-token-type">
                    <option value="Bearer" selected>Bearer</option>
                    <option value="Token">Token</option>
                    <option value="ApiKey">ApiKey</option>
                </select>
            </div>
        `,
        'oauth2': `
            <div class="form-group">
                <label class="form-label">Client ID</label>
                <input type="text" class="form-control auth-client-id" placeholder="请输入Client ID">
            </div>
            <div class="form-group">
                <label class="form-label">Client Secret</label>
                <input type="password" class="form-control auth-client-secret" placeholder="请输入Client Secret">
            </div>
            <div class="form-group">
                <label class="form-label">授权服务器URL</label>
                <input type="text" class="form-control auth-token-url" placeholder="请输入授权服务器URL">
            </div>
            <div class="form-group">
                <label class="form-label">Scope</label>
                <input type="text" class="form-control auth-scope" placeholder="请输入Scope">
            </div>
        `
    };
    
    if (authTemplates[authType]) {
        container.innerHTML = authTemplates[authType];
    } else {
        container.innerHTML = '<p>不支持的认证类型</p>';
    }
}

// 初始化数据配置功能
function initDataConfig() {
    // 数据操作选择事件
    const dataOperationSelect = document.getElementById('data-operation');
    const dataConfig = document.getElementById('data-config');
    
    if (dataOperationSelect && dataConfig) {
        dataOperationSelect.addEventListener('change', function() {
            if (this.value) {
                dataConfig.style.display = 'block';
                
                // 根据数据操作类型显示或隐藏查询条件
                const queryConditionsContainer = document.getElementById('query-conditions-container');
                if (queryConditionsContainer) {
                    if (this.value === 'query' || this.value === 'update' || this.value === 'delete') {
                        queryConditionsContainer.style.display = 'block';
                    } else {
                        queryConditionsContainer.style.display = 'none';
                    }
                }
            } else {
                dataConfig.style.display = 'none';
            }
        });
    }
    
    // 数据源选择事件
    const dataSourceSelects = document.querySelectorAll('.data-source');
    dataSourceSelects.forEach(select => {
        select.addEventListener('change', function() {
            // 根据数据源调整表/集合选项
            const tableSelect = this.parentElement.parentElement.querySelector('.data-table');
            if (tableSelect) {
                updateTableOptionsByDataSource(this.value, tableSelect);
            }
        });
    });
    
    // 添加数据字段按钮事件
    const addFieldBtn = document.getElementById('add-data-field-btn');
    if (addFieldBtn) {
        addFieldBtn.addEventListener('click', function() {
            const fieldsContainer = document.getElementById('data-fields-container');
            if (fieldsContainer) {
                const newFieldRow = createNewDataFieldRow();
                fieldsContainer.appendChild(newFieldRow);
                // 绑定新行的值类型切换事件
                bindDataFieldTypeChange(newFieldRow);
            }
        });
    }
    
    // 绑定已有的字段行值类型切换事件
    const existingFieldRows = document.querySelectorAll('.field-row');
    existingFieldRows.forEach(row => {
        bindDataFieldTypeChange(row);
    });
    
    // 删除字段按钮事件
    document.querySelectorAll('.remove-field-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const row = this.closest('.field-row');
            if (row && row.parentNode.children.length > 1) {
                row.remove();
            }
        });
    });
    
    // 添加查询条件按钮事件
    const addConditionBtn = document.getElementById('add-condition-btn');
    if (addConditionBtn) {
        addConditionBtn.addEventListener('click', function() {
            const conditionsContainer = document.querySelector('.query-conditions');
            if (conditionsContainer) {
                const newCondition = createQueryCondition();
                conditionsContainer.appendChild(newCondition);
            }
        });
    }
    
    // 绑定已有的删除条件按钮事件
    document.querySelectorAll('.remove-condition-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const conditionDiv = this.closest('.query-condition');
            conditionDiv.remove();
        });
    });
}

// 创建新的数据字段行
function createNewDataFieldRow() {
    const tr = document.createElement('tr');
    tr.className = 'field-row';
    tr.innerHTML = `
        <td style="padding: 10px; border: 1px solid #e9ecef;">
            <input type="text" class="form-control data-field-name" placeholder="字段名">
        </td>
        <td style="padding: 10px; border: 1px solid #e9ecef;">
            <select class="form-control data-field-value-type">
                <option value="field" selected>表单字段</option>
                <option value="constant">常量值</option>
                <option value="variable">流程变量</option>
                <option value="function">函数计算</option>
            </select>
            <div class="data-field-value-container">
                <select class="form-control data-field-value field-option">
                    <option value="">-- 选择字段 --</option>
                    <option value="amount">金额</option>
                    <option value="days">天数</option>
                    <option value="project_id">项目ID</option>
                    <option value="user_id">用户ID</option>
                </select>
                <input type="text" class="form-control data-field-value constant-option" placeholder="输入常量值" style="display: none;">
                <select class="form-control data-field-value variable-option" style="display: none;">
                    <option value="">-- 选择变量 --</option>
                    <option value="current_user">当前用户</option>
                    <option value="current_time">当前时间</option>
                    <option value="workflow_id">流程ID</option>
                </select>
                <select class="form-control data-field-value function-option" style="display: none;">
                    <option value="">-- 选择函数 --</option>
                    <option value="sum">求和</option>
                    <option value="average">平均值</option>
                    <option value="max">最大值</option>
                    <option value="min">最小值</option>
                    <option value="now">当前时间</option>
                </select>
            </div>
        </td>
        <td style="padding: 10px; border: 1px solid #e9ecef; text-align: center;">
            <button type="button" class="btn btn-danger remove-field-btn" style="padding: 4px 8px;">删除</button>
        </td>
    `;
    
    // 绑定删除按钮事件
    tr.querySelector('.remove-field-btn').addEventListener('click', function() {
        const parentNode = tr.parentNode;
        if (parentNode.children.length > 1) {
            tr.remove();
        }
    });
    
    return tr;
}

// 绑定数据字段值类型切换事件
function bindDataFieldTypeChange(row) {
    const typeSelect = row.querySelector('.data-field-value-type');
    const fieldOption = row.querySelector('.field-option');
    const constantOption = row.querySelector('.constant-option');
    const variableOption = row.querySelector('.variable-option');
    const functionOption = row.querySelector('.function-option');
    
    if (typeSelect && fieldOption && constantOption && variableOption && functionOption) {
        typeSelect.addEventListener('change', function() {
            fieldOption.style.display = 'none';
            constantOption.style.display = 'none';
            variableOption.style.display = 'none';
            functionOption.style.display = 'none';
            
            if (this.value === 'field') {
                fieldOption.style.display = 'block';
            } else if (this.value === 'constant') {
                constantOption.style.display = 'block';
            } else if (this.value === 'variable') {
                variableOption.style.display = 'block';
            } else if (this.value === 'function') {
                functionOption.style.display = 'block';
            }
        });
    }
}

// 根据数据源更新表/集合选项
function updateTableOptionsByDataSource(dataSource, tableSelect) {
    // 根据数据源类型生成不同的表/集合选项
    let tableOptions = [];
    
    switch(dataSource) {
        case 'database':
            tableOptions = [
                { value: 'user', text: '用户表' },
                { value: 'department', text: '部门表' },
                { value: 'project', text: '项目表' },
                { value: 'order', text: '订单表' },
                { value: 'custom', text: '自定义' }
            ];
            break;
        case 'file':
            tableOptions = [
                { value: 'excel', text: 'Excel文件' },
                { value: 'csv', text: 'CSV文件' },
                { value: 'json', text: 'JSON文件' }
            ];
            break;
        case 'cache':
            tableOptions = [
                { value: 'redis', text: 'Redis缓存' },
                { value: 'memcached', text: 'Memcached缓存' },
                { value: 'local', text: '本地缓存' }
            ];
            break;
        case 'other':
            tableOptions = [
                { value: 'custom', text: '自定义' }
            ];
            break;
        default:
            tableOptions = [
                { value: '', text: '-- 选择表/集合 --' }
            ];
    }
    
    // 清空现有选项
    tableSelect.innerHTML = '';
    
    // 添加新选项
    tableOptions.forEach(option => {
        const opt = document.createElement('option');
        opt.value = option.value;
        opt.textContent = option.text;
        tableSelect.appendChild(opt);
    });
}

// 初始化组合配置功能
function initCompositeConfig() {
    // 添加步骤按钮事件
    const addStepBtn = document.getElementById('add-step-btn');
    if (addStepBtn) {
        addStepBtn.addEventListener('click', function() {
            const stepsContainer = document.getElementById('composite-steps');
            if (stepsContainer) {
                const newStep = createNewCompositeStep();
                stepsContainer.appendChild(newStep);
                
                // 更新步骤标题
                updateStepTitles();
                
                // 绑定步骤类型切换事件
                const stepTypeSelect = newStep.querySelector('.step-type');
                if (stepTypeSelect) {
                    stepTypeSelect.addEventListener('change', function() {
                        updateStepConfig(newStep, this.value);
                    });
                }
                
                // 添加上下移动按钮
                addMoveButtons(newStep);
            }
        });
    }
    
    // 绑定已有的步骤类型切换事件
    const existingStepTypeSelects = document.querySelectorAll('.composite-step .step-type');
    existingStepTypeSelects.forEach(select => {
        select.addEventListener('change', function() {
            const stepDiv = this.closest('.composite-step');
            updateStepConfig(stepDiv, this.value);
        });
    });
    
    // 绑定已有的删除步骤按钮事件
    document.querySelectorAll('.remove-step-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const stepDiv = this.closest('.composite-step');
            if (stepDiv) {
                stepDiv.remove();
                // 更新步骤标题
                updateStepTitles();
            }
        });
    });
    
    // 绑定已有的上下移动按钮事件
    document.querySelectorAll('.composite-step .move-up-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const stepDiv = this.closest('.composite-step');
            moveStepUp(stepDiv);
        });
    });
    
    document.querySelectorAll('.composite-step .move-down-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const stepDiv = this.closest('.composite-step');
            moveStepDown(stepDiv);
        });
    });
    
    // 执行设置复选框事件
    const stopOnErrorCheckbox = document.getElementById('stop-on-error');
    const rollbackOnErrorCheckbox = document.getElementById('rollback-on-error');
    
    if (stopOnErrorCheckbox && rollbackOnErrorCheckbox) {
        stopOnErrorCheckbox.addEventListener('change', function() {
            if (!this.checked) {
                // 如果取消选中"出错时停止执行"，则同时取消选中"出错时回滚所有操作"
                rollbackOnErrorCheckbox.checked = false;
            }
        });
        
        rollbackOnErrorCheckbox.addEventListener('change', function() {
            if (this.checked) {
                // 如果选中"出错时回滚所有操作"，则必须同时选中"出错时停止执行"
                stopOnErrorCheckbox.checked = true;
            }
        });
    }
}

// 更新步骤配置
function updateStepConfig(stepDiv, stepType) {
    const stepConfig = stepDiv.querySelector('.step-config');
    if (stepConfig) {
        // 根据步骤类型生成不同的配置界面
        const configTemplates = {
            'function': `
                <div class="form-group">
                    <label class="form-label" style="font-size: 14px; font-weight: 500;">函数配置</label>
                    <input type="text" class="form-control" placeholder="函数表达式" style="font-size: 14px;">
                </div>
            `,
            'interface': `
                <div class="form-group">
                    <label class="form-label" style="font-size: 14px; font-weight: 500;">接口配置</label>
                    <input type="text" class="form-control" placeholder="接口URL" style="font-size: 14px; margin-bottom: 8px;">
                    <select class="form-control" style="font-size: 14px; width: 120px;">
                        <option value="POST" selected>POST</option>
                        <option value="GET">GET</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                    </select>
                </div>
            `,
            'data': `
                <div class="form-group">
                    <label class="form-label" style="font-size: 14px; font-weight: 500;">数据配置</label>
                    <select class="form-control" style="font-size: 14px; margin-bottom: 8px;">
                        <option value="">-- 选择操作 --</option>
                        <option value="insert" selected>新增数据</option>
                        <option value="update">更新数据</option>
                        <option value="delete">删除数据</option>
                        <option value="query">查询数据</option>
                    </select>
                    <select class="form-control" style="font-size: 14px;">
                        <option value="">-- 选择表 --</option>
                        <option value="order" selected>订单表</option>
                        <option value="user">用户表</option>
                        <option value="project">项目表</option>
                    </select>
                </div>
            `
        };
        
        if (configTemplates[stepType]) {
            stepConfig.innerHTML = configTemplates[stepType];
        } else {
            stepConfig.innerHTML = '';
        }
    }
    
    // 更新步骤标题
    updateStepTitles();
}

// 添加移动按钮
function addMoveButtons(stepDiv) {
    const headerDiv = document.createElement('div');
    headerDiv.className = 'composite-step-header';
    headerDiv.style = 'display: flex; justify-content: space-between; margin-bottom: 10px;';
    
    const titleDiv = document.createElement('div');
    titleDiv.style = 'font-weight: 500; color: #333;';
    titleDiv.textContent = '步骤 ' + (document.querySelectorAll('.composite-step').length) + ': 未设置';
    
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style = 'display: flex; gap: 10px;';
    
    const moveUpBtn = document.createElement('button');
    moveUpBtn.type = 'button';
    moveUpBtn.className = 'btn btn-sm btn-primary move-up-btn';
    moveUpBtn.textContent = '上移';
    moveUpBtn.addEventListener('click', function() {
        moveStepUp(stepDiv);
    });
    
    const moveDownBtn = document.createElement('button');
    moveDownBtn.type = 'button';
    moveDownBtn.className = 'btn btn-sm btn-primary move-down-btn';
    moveDownBtn.textContent = '下移';
    moveDownBtn.addEventListener('click', function() {
        moveStepDown(stepDiv);
    });
    
    buttonsDiv.appendChild(moveUpBtn);
    buttonsDiv.appendChild(moveDownBtn);
    headerDiv.appendChild(titleDiv);
    headerDiv.appendChild(buttonsDiv);
    
    // 将header添加到步骤的最前面
    const firstChild = stepDiv.firstChild;
    if (firstChild) {
        stepDiv.insertBefore(headerDiv, firstChild);
    } else {
        stepDiv.appendChild(headerDiv);
    }
}

// 上移步骤
function moveStepUp(stepDiv) {
    const stepsContainer = document.getElementById('composite-steps');
    const steps = stepsContainer.querySelectorAll('.composite-step');
    let currentIndex = -1;
    
    // 找到当前步骤的索引
    for (let i = 0; i < steps.length; i++) {
        if (steps[i] === stepDiv) {
            currentIndex = i;
            break;
        }
    }
    
    // 如果不是第一个步骤，则上移
    if (currentIndex > 0) {
        const previousStep = steps[currentIndex - 1];
        stepsContainer.insertBefore(stepDiv, previousStep);
        // 更新步骤标题
        updateStepTitles();
    }
}

// 下移步骤
function moveStepDown(stepDiv) {
    const stepsContainer = document.getElementById('composite-steps');
    const steps = stepsContainer.querySelectorAll('.composite-step');
    let currentIndex = -1;
    
    // 找到当前步骤的索引
    for (let i = 0; i < steps.length; i++) {
        if (steps[i] === stepDiv) {
            currentIndex = i;
            break;
        }
    }
    
    // 如果不是最后一个步骤，则下移
    if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        stepsContainer.insertBefore(nextStep, stepDiv);
        // 更新步骤标题
        updateStepTitles();
    }
}

// 更新步骤标题
function updateStepTitles() {
    const steps = document.querySelectorAll('.composite-step');
    steps.forEach((step, index) => {
        const titleDiv = step.querySelector('.composite-step-header div:first-child');
        const stepTypeSelect = step.querySelector('.step-type');
        const stepNameInput = step.querySelector('.step-name');
        
        if (titleDiv) {
            let stepTypeText = '未设置';
            let stepNameText = '';
            
            if (stepTypeSelect && stepTypeSelect.value) {
                const typeOptions = stepTypeSelect.options;
                for (let i = 0; i < typeOptions.length; i++) {
                    if (typeOptions[i].value === stepTypeSelect.value) {
                        stepTypeText = typeOptions[i].text;
                        break;
                    }
                }
            }
            
            if (stepNameInput && stepNameInput.value) {
                stepNameText = ': ' + stepNameInput.value;
            }
            
            titleDiv.textContent = '步骤 ' + (index + 1) + ': ' + stepTypeText + stepNameText;
        }
    });
}

// 收集接口参数配置
function collectInterfaceParams() {
    const params = [];
    const paramRows = document.querySelectorAll('#interfaceParamsList .param-row');
    
    paramRows.forEach(row => {
        const paramName = row.querySelector('.param-name').value.trim();
        const paramType = row.querySelector('.param-type').value;
        const paramValue = row.querySelector('.param-value').value.trim();
        const isRequired = row.querySelector('.param-required').checked;
        
        if (paramName) {
            params.push({
                name: paramName,
                type: paramType,
                value: paramValue,
                required: isRequired
            });
        }
    });
    
    return params;
}

// 收集请求头配置
function collectRequestHeaders() {
    const headers = [];
    const headerRows = document.querySelectorAll('#requestHeadersList .header-row');
    
    headerRows.forEach(row => {
        const headerName = row.querySelector('.header-name').value.trim();
        const headerValue = row.querySelector('.header-value').value.trim();
        
        if (headerName) {
            headers.push({
                name: headerName,
                value: headerValue
            });
        }
    });
    
    return headers;
}

// 收集数据字段映射配置
function collectDataFields() {
    const fields = [];
    const fieldRows = document.querySelectorAll('#dataFieldsList .field-row');
    
    fieldRows.forEach(row => {
        const sourceField = row.querySelector('.source-field').value.trim();
        const targetField = row.querySelector('.target-field').value.trim();
        const fieldType = row.querySelector('.field-type').value;
        const defaultValue = row.querySelector('.default-value').value.trim();
        
        if (sourceField || targetField) {
            fields.push({
                sourceField: sourceField,
                targetField: targetField,
                type: fieldType,
                defaultValue: defaultValue
            });
        }
    });
    
    return fields;
}

// 收集查询条件配置
function collectQueryConditions() {
    const conditions = [];
    const conditionGroups = document.querySelectorAll('#queryConditionsList .condition-group');
    
    conditionGroups.forEach(group => {
        const groupLogic = group.querySelector('.group-logic').value;
        const groupConditions = [];
        
        const conditionRows = group.querySelectorAll('.condition-row');
        conditionRows.forEach(row => {
            const field = row.querySelector('.condition-field').value.trim();
            const operator = row.querySelector('.condition-operator').value;
            const value = row.querySelector('.condition-value').value.trim();
            
            if (field) {
                groupConditions.push({
                    field: field,
                    operator: operator,
                    value: value
                });
            }
        });
        
        if (groupConditions.length > 0) {
            conditions.push({
                logic: groupLogic,
                conditions: groupConditions
            });
        }
    });
    
    return conditions;
}

// 收集组合步骤配置
function collectCompositeSteps() {
    const steps = [];
    const stepElements = document.querySelectorAll('#compositeStepsList .composite-step');
    
    stepElements.forEach(step => {
        const stepType = step.querySelector('.step-type').value;
        const stepName = step.querySelector('.step-name').value.trim();
        
        // 收集不同类型步骤的配置
        let stepConfig = {};
        if (stepType === 'api_call') {
            const apiUrl = step.querySelector('.api-url').value.trim();
            const method = step.querySelector('.api-method').value;
            stepConfig = { apiUrl, method };
        } else if (stepType === 'data_transfer') {
            const sourceData = step.querySelector('.source-data').value.trim();
            const targetData = step.querySelector('.target-data').value.trim();
            stepConfig = { sourceData, targetData };
        } else if (stepType === 'conditional') {
            const condition = step.querySelector('.condition-expression').value.trim();
            const trueBranch = step.querySelector('.true-branch').value.trim();
            const falseBranch = step.querySelector('.false-branch').value.trim();
            stepConfig = { condition, trueBranch, falseBranch };
        }
        
        if (stepName) {
            steps.push({
                type: stepType,
                name: stepName,
                config: stepConfig
            });
        }
    });
    
    return steps;
}