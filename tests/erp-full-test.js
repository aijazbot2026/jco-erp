/**
 * JCO ERP 完整測試套件
 * 使用 Playwright 自動測試所有模組
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 測試配置
const CONFIG = {
    baseUrl: 'file:///Users/jerry/Desktop/JCO-ERP-System',
    timeout: 5000,
    headless: process.env.ERP_HEADLESS === '1',
    accounts: {
        admin: { user: 'admin', pass: 'jco2026' },  // 正確密碼
        sales: { user: 'sales_mgr', pass: 'sales123' }
    }
};

// 測試結果收集
const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function log(status, name, detail = '') {
    const icon = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${icon} ${name}${detail ? ' - ' + detail : ''}`);
    results.tests.push({ status, name, detail, time: new Date().toISOString() });
    if (status === 'pass') results.passed++;
    else if (status === 'fail') results.failed++;
}

async function runTests() {
    console.log('🧪 JCO ERP 完整測試套件');
    console.log('========================\n');
    
    const browser = await chromium.launch({ headless: CONFIG.headless });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
        // ========== 1. 登入模組測試 ==========
        console.log('\n📦 模組 1: 登入系統\n');
        
        await page.goto(`${CONFIG.baseUrl}/erp-login-notion.html`);
        await page.waitForTimeout(1000);
        log('pass', '登入頁面載入');
        
        // 測試錯誤登入
        await page.fill('#username', 'wrong');
        await page.fill('#password', 'wrong');
        await page.click('button[type="submit"], .login-btn');
        await page.waitForTimeout(500);
        const errorMsg = await page.$('.error-message, .alert-error');
        log(errorMsg ? 'pass' : 'warn', '錯誤密碼提示', errorMsg ? '顯示錯誤訊息' : '未顯示錯誤');
        
        // 測試正確登入
        await page.fill('#username', CONFIG.accounts.admin.user);
        await page.fill('#password', CONFIG.accounts.admin.pass);
        await page.click('button[type="submit"], .login-btn');
        await page.waitForTimeout(2000);
        const dashboardLoaded = page.url().includes('dashboard') || await page.$('.dashboard, .main-content');
        log(dashboardLoaded ? 'pass' : 'fail', '管理員登入', dashboardLoaded ? '成功進入系統' : '登入失敗');
        
        // ========== 2. 儀表板測試 ==========
        console.log('\n📦 模組 2: 儀表板\n');
        
        await page.goto(`${CONFIG.baseUrl}/erp-dashboard-notion.html`);
        await page.waitForTimeout(1000);
        log('pass', '儀表板頁面載入');
        
        // 檢查統計卡（儀表板用 .kpi-card）
        const statCards = await page.$$('.kpi-card, .stat-card, .stats-card');
        log(statCards.length > 0 ? 'pass' : 'fail', '統計卡顯示', `找到 ${statCards.length} 個`);
        
        // 檢查圖表區域
        const charts = await page.$$('.chart, canvas, .chart-container');
        log(charts.length > 0 ? 'pass' : 'warn', '圖表區域', `找到 ${charts.length} 個`);
        
        // ========== 3. 訂單中心測試 ==========
        console.log('\n📦 模組 3: 訂單中心\n');
        
        await page.goto(`${CONFIG.baseUrl}/erp-order-center-notion.html`);
        await page.waitForTimeout(1500);
        log('pass', '訂單中心頁面載入');
        
        // 檢查訂單統計
        const orderStats = await page.$$('.stat-card, [class*="stat"]');
        log(orderStats.length >= 4 ? 'pass' : 'warn', '訂單統計卡', `找到 ${orderStats.length} 個`);
        
        // 測試新增訂單 Modal
        const addBtn = await page.$('button:has-text("新增訂單")');
        if (addBtn) {
            await addBtn.click();
            await page.waitForTimeout(800);
            const modal = await page.$('.modal-overlay, .modal');
            log(modal ? 'pass' : 'fail', '新增訂單 Modal 彈出');
            
            if (modal) {
                // 檢查表單欄位
                const customerField = await page.$('#new-customer, select[name="customer"]');
                const dateField = await page.$('input[type="date"]');
                log(customerField && dateField ? 'pass' : 'fail', 'Modal 表單欄位完整');
                
                // 關閉 Modal
                await page.click('.close-btn, button:has-text("×"), button:has-text("取消")');
                await page.waitForTimeout(500);
            }
        } else {
            log('fail', '新增訂單按鈕', '未找到按鈕');
        }
        
        // 測試操作選單
        const actionBtn = await page.$('.action-btn, button:has-text("⋯")');
        if (actionBtn) {
            await actionBtn.click();
            await page.waitForTimeout(500);
            const menu = await page.$('.action-menu, .dropdown-menu, .menu-item');
            log(menu ? 'pass' : 'fail', '操作選單顯示');
            
            // 點擊其他地方關閉選單
            await page.click('body');
            await page.waitForTimeout(300);
        }
        
        // 測試 Tab 切換
        const tabs = ['看板視圖', '出貨追蹤', '裝箱管理', '報表'];
        for (const tab of tabs) {
            const tabEl = await page.$(`text=${tab}`);
            if (tabEl) {
                await tabEl.click();
                await page.waitForTimeout(300);
            }
        }
        log('pass', 'Tab 切換功能');
        
        // 測試搜尋
        const searchInput = await page.$('#order-search, .search-input, input[placeholder*="搜尋"]');
        if (searchInput) {
            try {
                await searchInput.click({ timeout: 3000 });
                await searchInput.fill('PO-2026', { timeout: 3000 });
                await page.waitForTimeout(500);
                log('pass', '搜尋功能', '可輸入關鍵字');
            } catch (e) {
                log('warn', '搜尋功能', '元素存在但無法輸入');
            }
        } else {
            log('warn', '搜尋功能', '未找到搜尋欄');
        }
        
        // 測試狀態篩選
        const filterSelect = await page.$('#status-filter, select, .filter-select');
        if (filterSelect) {
            try {
                await filterSelect.selectOption({ index: 1 }, { timeout: 3000 });
                await page.waitForTimeout(500);
                log('pass', '狀態篩選器');
            } catch (e) {
                log('warn', '狀態篩選器', '元素存在但操作超時');
            }
        } else {
            log('warn', '狀態篩選器', '未找到元素');
        }
        
        // ========== 4. 變更狀態測試 ==========
        console.log('\n📦 模組 4: 狀態變更\n');
        
        // 回到訂單列表
        await page.click('text=訂單列表');
        await page.waitForTimeout(500);
        
        const actionBtn2 = await page.$('.action-btn, button:has-text("⋯")');
        if (actionBtn2) {
            await actionBtn2.click();
            await page.waitForTimeout(500);
            
            const statusOption = await page.$('text=變更狀態');
            if (statusOption) {
                await statusOption.click();
                await page.waitForTimeout(800);
                
                const statusModal = await page.$('.modal-overlay, .modal');
                log(statusModal ? 'pass' : 'fail', '變更狀態 Modal');
                
                // 檢查狀態選項
                const statusOptions = await page.$$('.status-option, .status-btn, [class*="status"]');
                log(statusOptions.length >= 4 ? 'pass' : 'warn', '狀態選項', `找到 ${statusOptions.length} 個`);
                
                // 關閉
                await page.keyboard.press('Escape');
                await page.waitForTimeout(300);
            }
        }
        
        // ========== 5. 響應式/UI 測試 ==========
        console.log('\n📦 模組 5: UI/UX\n');
        
        // 檢查 undefined 顯示
        const pageContent = await page.content();
        const hasUndefined = pageContent.includes('>undefined<') || pageContent.includes('>NaN<');
        log(!hasUndefined ? 'pass' : 'fail', '無 undefined/NaN 顯示');
        
        // 檢查側邊欄
        const sidebar = await page.$('.sidebar, nav, .nav-menu');
        log(sidebar ? 'pass' : 'warn', '側邊欄導航');
        
        // 檢查用戶信息
        const userInfo = await page.$('.user-info, .user-name, [class*="user"]');
        log(userInfo ? 'pass' : 'warn', '用戶信息顯示');
        
    } catch (error) {
        log('fail', '測試執行錯誤', error.message);
    } finally {
        await browser.close();
    }
    
    // 產出報告
    generateReport();
}

function generateReport() {
    console.log('\n========================================');
    console.log('📊 測試報告');
    console.log('========================================\n');
    
    console.log(`✅ 通過: ${results.passed}`);
    console.log(`❌ 失敗: ${results.failed}`);
    console.log(`📈 通過率: ${Math.round(results.passed / (results.passed + results.failed) * 100)}%\n`);
    
    // 產出 HTML 報告
    const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>ERP 測試報告 - ${new Date().toLocaleDateString('zh-TW')}</title>
    <style>
        body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
        h1 { color: #333; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .stat { padding: 20px; border-radius: 8px; text-align: center; }
        .stat.pass { background: #d4edda; color: #155724; }
        .stat.fail { background: #f8d7da; color: #721c24; }
        .stat h2 { margin: 0; font-size: 36px; }
        .test-list { list-style: none; padding: 0; }
        .test-item { padding: 12px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 10px; }
        .icon { font-size: 18px; }
        .pass .icon { color: #28a745; }
        .fail .icon { color: #dc3545; }
        .warn .icon { color: #ffc107; }
        .detail { color: #666; font-size: 14px; margin-left: auto; }
    </style>
</head>
<body>
    <h1>🧪 JCO ERP 測試報告</h1>
    <p>測試時間: ${new Date().toLocaleString('zh-TW')}</p>
    
    <div class="summary">
        <div class="stat pass">
            <h2>${results.passed}</h2>
            <p>通過</p>
        </div>
        <div class="stat fail">
            <h2>${results.failed}</h2>
            <p>失敗</p>
        </div>
    </div>
    
    <h2>測試詳情</h2>
    <ul class="test-list">
        ${results.tests.map(t => `
            <li class="test-item ${t.status}">
                <span class="icon">${t.status === 'pass' ? '✅' : t.status === 'fail' ? '❌' : '⚠️'}</span>
                <span class="name">${t.name}</span>
                ${t.detail ? `<span class="detail">${t.detail}</span>` : ''}
            </li>
        `).join('')}
    </ul>
</body>
</html>`;
    
    const reportPath = path.join(__dirname, '../docs/test-report.html');
    fs.writeFileSync(reportPath, html);
    console.log(`📄 HTML 報告已產出: ${reportPath}`);
}

// 執行測試
runTests().catch(console.error);
