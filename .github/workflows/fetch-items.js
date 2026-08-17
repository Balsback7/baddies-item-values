const fs = require('fs');
const path = require('path');

async function fetchAllItems() {
    const allItems = [];
    const limit = 40;
    const delayMs = 2000;
    let totalPages = 1;

    try {
        // Get first page to know total
        const firstResponse = await fetch(`https://bloxtsar.com/api/baddies/catalog?page=1&limit=${limit}&sort=value_desc`);
        const firstData = await firstResponse.json();
        
        if (!firstData.success) {
            console.error('API request failed');
            return;
        }

        allItems.push(...firstData.data);
        totalPages = firstData.pagination.totalPages;
        console.log(`📊 Total pages: ${totalPages}`);

        // Fetch remaining pages
        for (let page = 2; page <= totalPages; page++) {
            console.log(`📥 Page ${page}/${totalPages}...`);
            
            const response = await fetch(`https://bloxtsar.com/api/baddies/catalog?page=${page}&limit=${limit}&sort=value_desc`);
            const data = await response.json();
            
            if (data.success) {
                allItems.push(...data.data);
                console.log(`✅ ${allItems.length} items so far`);
            }
            
            await new Promise(resolve => setTimeout(resolve, delayMs));
        }

        console.log(`🎉 Total items: ${allItems.length}`);
        
        // Save the data
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        // Save full JSON
        fs.writeFileSync(
            path.join(dataDir, 'all-items.json'),
            JSON.stringify(allItems, null, 2)
        );

        // Save simplified version with just key values
        const simplified = allItems.map(item => ({
            name: item.name,
            value: item.value,
            tokenValue: item.tokenValue,
            rap: item.rap,
            rarity: item.rarity,
            category: item.category,
            demand: item.demand,
            trend: item.trend,
            updatedAt: item.updatedAt
        }));

        fs.writeFileSync(
            path.join(dataDir, 'simplified-items.json'),
            JSON.stringify(simplified, null, 2)
        );

        // Save CSV format
        const csvHeader = 'Name,Value,TokenValue,RAP,Rarity,Category,Demand,Trend\n';
        const csvRows = allItems.map(item => 
            `${item.name},${item.value},${item.tokenValue || ''},${item.rap},${item.rarity},${item.category},${item.demand},${item.trend}`
        );
        fs.writeFileSync(
            path.join(dataDir, 'items.csv'),
            csvHeader + csvRows.join('\n')
        );

        // Save timestamp
        fs.writeFileSync(
            path.join(dataDir, 'last-update.json'),
            JSON.stringify({
                timestamp: new Date().toISOString(),
                totalItems: allItems.length
            }, null, 2)
        );

        console.log('✅ Data saved to data/ directory');
        return allItems;

    } catch (error) {
        console.error('Error:', error);
    }
}

fetchAllItems();
