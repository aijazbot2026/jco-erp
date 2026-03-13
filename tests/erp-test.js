/**
 * ERP 功能測試腳本
 * 使用 Playwright 自動測試按鈕、Modal 等功能
 */

const { chromium } = require('playwright');

async function testERP() {
    console.log('🧪 開始 ERP 功能測試...\n');
    
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // 測試結果
    const results = [];
    
    try {
        // 1. 打開 ERP
        console.log('1️⃣ 打開訂單中心...');
        await page.goto('file:///Users/jerry/Desktop/JCO-ERP-System/erp-order-center-notion.html');
        await page.waitForTimeout(2000);
        results.push({ test: '頁面載入', status: '✅' });
        
        // 2. 檢查訂單列表
        console.log('2️⃣ 檢查訂單列表...');
        const orders = await page.$$('.order-row, tr[onclick]');
        console.log(`   找到 ${orders.length} 筆訂單`);
        results.push({ test: '訂單列表顯示', status: orders.length > 0 ? '✅' : '❌' });
        
        // 3. 點擊「+ 新增訂單」按鈕
        console.log('3️⃣ 測試新增訂單按鈕...');
        await page.click('button:has-text("新增訂單")');
        await page.waitForTimeout(1000);
        const modal = await page.$('.modal-overlay, .modal');
        results.push({ test: '新增訂單 Modal', status: modal ? '✅' : '❌' });
        
        if (modal) {
            // 關閉 Modal
            await page.click('.close-btn, button:has-text("×")');
            await page.waitForTimeout(500);
        }
        
        // 4. 測試操作選單
        console.log('4️⃣ 測試操作選單...');
        const actionBtn = await page.$('button:has-text("⋯"), .action-btn');
        if (actionBtn) {
            await actionBtn.click();
            await page.waitForTimeout(500);
            const menu = await page.$('.action-menu, .dropdown-menu');
            results.push({ test: '操作選單', status: menu ? '✅' : '❌' });
        } else {
            results.push({ test: '操作選單', status: '⚠️ 按鈕未找到' });
        }
        
        // 5. 測試 Tab 切換
        console.log('5️⃣ 測試 Tab 切換...');
        await page.click('text=看板視圖');
        await page.waitForTimeout(500);
        results.push({ test: 'Tab 切換', status: '✅' });
        
    } catch (error) {
        console.log('❌ 測試錯誤:', error.message);
        results.push({ test: '測試執行', status: '❌ ' + error.message });
    }
    
    // 輸出結果
    console.log('\n📊 測試結果：');
    console.log('================');
    results.forEach(r => console.log(`${r.status} ${r.test}`));
    
    await browser.close();
    return results;
}

testERP().catch(console.error);
